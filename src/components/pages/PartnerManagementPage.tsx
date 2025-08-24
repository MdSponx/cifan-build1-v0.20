import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTypography } from '../../utils/typography';
import { useAdmin } from '../admin/AdminContext';
import { partnerService } from '../../services/partnerService';
import { Partner } from '../../types/partner.types';
import { useNotificationHelpers } from '../ui/NotificationSystem';
import PartnerFormModal from '../admin/PartnerFormModal';
import PartnerDeleteModal from '../admin/PartnerDeleteModal';
import AdminZoneHeader from '../layout/AdminZoneHeader';
import {
  Plus,
  Search,
  Filter,
  Building2,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Globe,
  Upload,
  Star,
  Award,
  Medal,
  Loader,
  Heart,
  Users
} from 'lucide-react';

interface PartnerManagementPageProps {
  onSidebarToggle?: () => void;
}

const PartnerManagementPage: React.FC<PartnerManagementPageProps> = ({ onSidebarToggle }) => {
  const { i18n } = useTranslation();
  const { getClass } = useTypography();
  const { checkPermission, adminProfile } = useAdmin();
  const { showSuccess, showError } = useNotificationHelpers();
  const currentLanguage = i18n.language as 'en' | 'th';

  // State
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState<'all' | 1 | 2 | 3>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [deletingPartner, setDeletingPartner] = useState<Partner | null>(null);

  const content = {
    th: {
      title: 'จัดการพาร์ทเนอร์',
      subtitle: 'จัดการพาร์ทเนอร์และผู้สนับสนุนของเทศกาล',
      addPartner: 'เพิ่มพาร์ทเนอร์',
      searchPlaceholder: 'ค้นหาชื่อพาร์ทเนอร์...',
      filterLevel: 'กรองตามระดับ',
      filterStatus: 'กรองตามสถานะ',
      allLevels: 'ทุกระดับ',
      allStatuses: 'ทุกสถานะ',
      level1: 'ระดับ 1 - หลัก',
      level2: 'ระดับ 2 - สนับสนุน',
      level3: 'ระดับ 3 - เพื่อน',
      active: 'ใช้งาน',
      inactive: 'ไม่ใช้งาน',
      edit: 'แก้ไข',
      delete: 'ลบ',
      toggleStatus: 'เปลี่ยนสถานะ',
      noPartners: 'ไม่พบพาร์ทเนอร์',
      loading: 'กำลังโหลด...',
      uploadedLogo: 'โลโก้ที่อัพโหลด',
      externalUrl: 'ลิงก์ภายนอก',
      totalPartners: 'พาร์ทเนอร์ทั้งหมด',
      activePartners: 'พาร์ทเนอร์ที่ใช้งาน',
      logo: 'โลโก้',
      name: 'ชื่อ',
      level: 'ระดับ',
      order: 'ลำดับ',
      status: 'สถานะ',
      actions: 'การดำเนินการ',
      confirmDelete: 'คุณต้องการลบพาร์ทเนอร์นี้หรือไม่?',
      partnersTable: 'ตารางจัดการพาร์ทเนอร์'
    },
    en: {
      title: 'Partner Management',
      subtitle: 'Manage festival partners and supporters',
      addPartner: 'Add Partner',
      searchPlaceholder: 'Search partner name...',
      filterLevel: 'Filter by Level',
      filterStatus: 'Filter by Status',
      allLevels: 'All Levels',
      allStatuses: 'All Statuses',
      level1: 'Level 1 - Main',
      level2: 'Level 2 - Supporting',
      level3: 'Level 3 - Friend',
      active: 'Active',
      inactive: 'Inactive',
      edit: 'Edit',
      delete: 'Delete',
      toggleStatus: 'Toggle Status',
      noPartners: 'No partners found',
      loading: 'Loading...',
      uploadedLogo: 'Uploaded Logo',
      externalUrl: 'External URL',
      totalPartners: 'Total Partners',
      activePartners: 'Active Partners',
      logo: 'Logo',
      name: 'Name',
      level: 'Level',
      order: 'Order',
      status: 'Status',
      actions: 'Actions',
      confirmDelete: 'Are you sure you want to delete this partner?',
      partnersTable: 'Partners Management Table'
    }
  };

  const currentContent = content[currentLanguage];

  // Load partners
  useEffect(() => {
    loadPartners();
  }, []);

  const loadPartners = async () => {
    try {
      setLoading(true);
      const data = await partnerService.getAllPartners();
      setPartners(data);
    } catch (error) {
      showError(
        currentLanguage === 'th' ? 'ไม่สามารถโหลดข้อมูลได้' : 'Failed to load partners',
        error instanceof Error ? error.message : 'Unknown error'
      );
    } finally {
      setLoading(false);
    }
  };

  // Filter partners
  const filteredPartners = partners.filter(partner => {
    const matchesSearch = searchTerm === '' || 
      partner.name.th.toLowerCase().includes(searchTerm.toLowerCase()) ||
      partner.name.en.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLevel = filterLevel === 'all' || partner.level === filterLevel;
    const matchesStatus = filterStatus === 'all' || partner.status === filterStatus;

    return matchesSearch && matchesLevel && matchesStatus;
  });

  // Handle form submission
  const handleFormSubmit = async () => {
    await loadPartners();
    setShowFormModal(false);
    setEditingPartner(null);
    showSuccess(
      editingPartner 
        ? (currentLanguage === 'th' ? 'อัปเดตพาร์ทเนอร์สำเร็จ' : 'Partner updated successfully')
        : (currentLanguage === 'th' ? 'เพิ่มพาร์ทเนอร์สำเร็จ' : 'Partner created successfully')
    );
  };

  // Handle delete
  const handleDelete = async () => {
    if (!deletingPartner) return;
    
    try {
      await partnerService.deletePartner(deletingPartner.id);
      await loadPartners();
      setShowDeleteModal(false);
      setDeletingPartner(null);
      showSuccess(
        currentLanguage === 'th' ? 'ลบพาร์ทเนอร์สำเร็จ' : 'Partner deleted successfully'
      );
    } catch (error) {
      showError(
        currentLanguage === 'th' ? 'ไม่สามารถลบได้' : 'Failed to delete partner',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  };

  // Handle toggle status
  const handleToggleStatus = async (partner: Partner) => {
    try {
      const newStatus = partner.status === 'active' ? 'inactive' : 'active';
      await partnerService.updatePartner(partner.id, {
        nameTh: partner.name.th,
        nameEn: partner.name.en,
        logoType: partner.logo.type,
        logoValue: partner.logo.value,
        level: partner.level,
        order: partner.order,
        note: partner.note,
        status: newStatus
      });
      await loadPartners();
      showSuccess(
        newStatus === 'active' 
          ? (currentLanguage === 'th' ? 'เปิดใช้งานพาร์ทเนอร์แล้ว' : 'Partner activated successfully')
          : (currentLanguage === 'th' ? 'ปิดใช้งานพาร์ทเนอร์แล้ว' : 'Partner deactivated successfully')
      );
    } catch (error) {
      showError(
        currentLanguage === 'th' ? 'ไม่สามารถเปลี่ยนสถานะได้' : 'Failed to update partner status',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  };

  // Get level icon and color
  const getLevelInfo = (level: number) => {
    switch (level) {
      case 1:
        return { icon: Star, color: '#FFD700', bgColor: 'bg-yellow-500/20' };
      case 2:
        return { icon: Heart, color: '#3B82F6', bgColor: 'bg-blue-400/20' };
      case 3:
        return { icon: Users, color: '#10B981', bgColor: 'bg-green-500/20' };
      default:
        return { icon: Building2, color: '#9CA3AF', bgColor: 'bg-gray-500/20' };
    }
  };

  // Group partners by level and sort by order
  const groupPartnersByLevel = () => {
    const grouped = {
      1: filteredPartners.filter(p => p.level === 1).sort((a, b) => a.order - b.order),
      2: filteredPartners.filter(p => p.level === 2).sort((a, b) => a.order - b.order),
      3: filteredPartners.filter(p => p.level === 3).sort((a, b) => a.order - b.order)
    };
    return grouped;
  };

  // Handle level-specific partner addition
  const onAddPartnerWithLevel = (level: 1 | 2 | 3) => {
    setEditingPartner(null);
    setShowFormModal(true);
    // Note: The level pre-selection would need to be handled in the PartnerFormModal
  };

  // Render grouped partners in table format
  const renderGroupedPartners = () => {
    const grouped = groupPartnersByLevel();
    const levelNames = {
      1: currentContent.level1,
      2: currentContent.level2,
      3: currentContent.level3
    };

    const levelIcons = {
      1: <Star className="w-4 h-4 text-yellow-400" />,
      2: <Heart className="w-4 h-4 text-blue-400" />,
      3: <Users className="w-4 h-4 text-green-400" />
    };

    return Object.entries(grouped).map(([level, partners]) => {
      if (partners.length === 0) return null;
      
      const levelNum = parseInt(level) as 1 | 2 | 3;
      
      return (
        <React.Fragment key={level}>
          {/* Level Header Row */}
          <tr className="bg-white/10 border-b border-white/10">
            <td colSpan={6} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {levelIcons[levelNum]}
                  <span className="font-semibold text-white text-lg">
                    {levelNames[levelNum]} ({partners.length})
                  </span>
                </div>
                <button
                  onClick={() => onAddPartnerWithLevel(levelNum)}
                  className="flex items-center space-x-2 px-3 py-1.5 bg-[#FCB283]/20 hover:bg-[#FCB283]/30 text-[#FCB283] rounded-lg transition-colors text-sm"
                  title={`${currentContent.addPartner} - ${levelNames[levelNum]}`}
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">{currentContent.addPartner}</span>
                </button>
              </div>
            </td>
          </tr>
          
          {/* Partner Rows */}
          {partners.map((partner, index) => (
            <tr 
              key={partner.id} 
              className={`border-b border-white/5 hover:bg-white/5 transition-colors ${
                index === partners.length - 1 ? 'border-b-2 border-white/20' : ''
              }`}
            >
              {/* Logo Column */}
              <td className="p-4 logo-cell">
                <div className="w-16 h-16 bg-white/5 rounded-lg flex items-center justify-center overflow-hidden">
                  <img
                    src={partner.logo.value}
                    alt={partner.name[currentLanguage]}
                    className="max-w-full max-h-full object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://via.placeholder.com/64x64/374151/9CA3AF?text=Logo';
                    }}
                  />
                </div>
              </td>
              
              {/* Name Column */}
              <td className="p-4 name-cell">
                <div>
                  <div className="text-white font-medium">
                    {partner.name[currentLanguage]}
                  </div>
                  <div className="text-white/60 text-sm">
                    {partner.name[currentLanguage === 'th' ? 'en' : 'th']}
                  </div>
                </div>
              </td>
              
              {/* Level Column */}
              <td className="p-4 level-cell">
                <div className="flex items-center space-x-2">
                  {levelIcons[partner.level]}
                  <span className="text-white/80">
                    {levelNames[partner.level]}
                  </span>
                </div>
              </td>
              
              {/* Order Column */}
              <td className="p-4 order-cell">
                <span className="text-white/80 font-mono text-lg">
                  {partner.order}
                </span>
              </td>
              
              {/* Status Column */}
              <td className="p-4 status-cell">
                <div className="flex items-center space-x-2">
                  {partner.status === 'active' ? (
                    <>
                      <Eye className="w-4 h-4 text-green-400" />
                      <span className="text-green-400">{currentContent.active}</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-4 h-4 text-red-400" />
                      <span className="text-red-400">{currentContent.inactive}</span>
                    </>
                  )}
                </div>
              </td>
              
              {/* Actions Column */}
              <td className="p-4 actions-cell">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setEditingPartner(partner);
                      setShowFormModal(true);
                    }}
                    className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors"
                    title={currentContent.edit}
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(currentContent.confirmDelete)) {
                        setDeletingPartner(partner);
                        setShowDeleteModal(true);
                      }
                    }}
                    className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                    title={currentContent.delete}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </React.Fragment>
      );
    }).filter(Boolean);
  };

  // Permission check
  if (!checkPermission('canManagePartners')) {
    return (
      <div className="space-y-6 sm:space-y-8">
        <AdminZoneHeader
          title={currentContent.title}
          subtitle={currentContent.subtitle}
          onSidebarToggle={onSidebarToggle || (() => {})}
        />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <Building2 className="w-16 h-16 mx-auto text-red-400" />
            <h2 className={`text-xl ${getClass('header')} text-white`}>
              {currentLanguage === 'th' ? 'ไม่มีสิทธิ์เข้าถึง' : 'Access Denied'}
            </h2>
            <p className={`${getClass('body')} text-white/60`}>
              {currentLanguage === 'th' 
                ? 'คุณไม่มีสิทธิ์ในการจัดการพาร์ทเนอร์'
                : "You don't have permission to manage partners."
              }
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Calculate stats
  const activePartners = partners.filter(p => p.status === 'active').length;

  return (
    <div className="space-y-6 sm:space-y-8" style={{ paddingBottom: '8rem', minHeight: '100vh', overflow: 'visible' }}>
      {/* Admin Zone Header */}
      <AdminZoneHeader
        title={currentContent.title}
        subtitle={currentContent.subtitle}
        onSidebarToggle={onSidebarToggle || (() => {})}
      >
        <button
          onClick={() => setShowFormModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-[#FCB283] hover:bg-[#AA4626] rounded-lg text-white transition-colors"
        >
          <Plus size={16} />
          <span className={`${getClass('menu')} text-sm`}>
            {currentContent.addPartner}
          </span>
        </button>
      </AdminZoneHeader>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="glass-container rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className={`${getClass('body')} text-white/60 text-sm`}>
                {currentContent.totalPartners}
              </p>
              <p className={`text-2xl ${getClass('header')} text-white font-bold`}>
                {partners.length}
              </p>
            </div>
            <Building2 className="w-8 h-8 text-[#FCB283]" />
          </div>
        </div>

        <div className="glass-container rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className={`${getClass('body')} text-white/60 text-sm`}>
                {currentContent.activePartners}
              </p>
              <p className={`text-2xl ${getClass('header')} text-white font-bold`}>
                {activePartners}
              </p>
            </div>
            <Eye className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="glass-container rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className={`${getClass('body')} text-white/60 text-sm`}>
                {currentContent.level1}
              </p>
              <p className={`text-2xl ${getClass('header')} text-white font-bold`}>
                {partners.filter(p => p.level === 1).length}
              </p>
            </div>
            <Star className="w-8 h-8 text-yellow-400" />
          </div>
        </div>

        <div className="glass-container rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className={`${getClass('body')} text-white/60 text-sm`}>
                {currentContent.level2} + {currentContent.level3}
              </p>
              <p className={`text-2xl ${getClass('header')} text-white font-bold`}>
                {partners.filter(p => p.level === 2 || p.level === 3).length}
              </p>
            </div>
            <Award className="w-8 h-8 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-container rounded-xl p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40" size={20} />
              <input
                type="text"
                placeholder={currentContent.searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#FCB283] focus:bg-white/20 transition-all duration-200"
              />
            </div>
          </div>

          {/* Level Filter */}
          <div className="lg:w-48">
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value as any)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-[#FCB283] focus:bg-white/20 transition-all duration-200"
            >
              <option value="all" className="bg-[#110D16]">{currentContent.allLevels}</option>
              <option value={1} className="bg-[#110D16]">{currentContent.level1}</option>
              <option value={2} className="bg-[#110D16]">{currentContent.level2}</option>
              <option value={3} className="bg-[#110D16]">{currentContent.level3}</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="lg:w-48">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-[#FCB283] focus:bg-white/20 transition-all duration-200"
            >
              <option value="all" className="bg-[#110D16]">{currentContent.allStatuses}</option>
              <option value="active" className="bg-[#110D16]">{currentContent.active}</option>
              <option value="inactive" className="bg-[#110D16]">{currentContent.inactive}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Partners Table */}
      <div className="partner-table-container glass-container rounded-xl overflow-hidden" style={{ minHeight: 'fit-content', height: 'auto', overflow: 'visible' }}>
        {/* Table Header with Main Add Button */}
        <div className="p-6 border-b border-white/10 bg-white/5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">
              {currentContent.partnersTable}
            </h2>
            <button
              onClick={() => setShowFormModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-[#FCB283] hover:bg-[#FCB283]/90 text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>{currentContent.addPartner}</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-8 h-8 text-[#FCB283] animate-spin mr-3" />
            <span className={`${getClass('body')} text-white/70`}>{currentContent.loading}</span>
          </div>
        ) : filteredPartners.length === 0 ? (
          <div className="p-12 text-center">
            <Building2 className="w-16 h-16 mx-auto text-white/40 mb-4" />
            <p className="text-white/60 mb-4">{currentContent.noPartners}</p>
            <button
              onClick={() => setShowFormModal(true)}
              className="flex items-center justify-center space-x-2 mx-auto px-4 py-2 bg-[#FCB283] hover:bg-[#FCB283]/90 text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>{currentContent.addPartner}</span>
            </button>
          </div>
        ) : (
          /* Table Container with Horizontal Scroll */
          <div className="partner-table-scroll overflow-x-auto" style={{ overflow: 'visible', minHeight: 'fit-content' }}>
            <div className="min-w-full" style={{ paddingBottom: '2rem' }}>
              <table className="partner-table w-full border-collapse">
                <thead className="bg-white/5 border-b border-white/20 sticky top-0 z-10">
                  <tr>
                    <th className="text-left p-4 text-white/80 font-semibold min-w-[80px]">
                      {currentContent.logo}
                    </th>
                    <th className="text-left p-4 text-white/80 font-semibold min-w-[200px]">
                      {currentContent.name}
                    </th>
                    <th className="text-left p-4 text-white/80 font-semibold min-w-[150px]">
                      {currentContent.level}
                    </th>
                    <th className="text-left p-4 text-white/80 font-semibold min-w-[80px]">
                      {currentContent.order}
                    </th>
                    <th className="text-left p-4 text-white/80 font-semibold min-w-[100px]">
                      {currentContent.status}
                    </th>
                    <th className="text-left p-4 text-white/80 font-semibold min-w-[120px]">
                      {currentContent.actions}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {renderGroupedPartners()}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showFormModal && (
        <PartnerFormModal
          isOpen={showFormModal}
          onClose={() => {
            setShowFormModal(false);
            setEditingPartner(null);
          }}
          onSubmit={handleFormSubmit}
          partner={editingPartner}
        />
      )}

      {showDeleteModal && deletingPartner && (
        <PartnerDeleteModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setDeletingPartner(null);
          }}
          onConfirm={handleDelete}
          partner={deletingPartner}
        />
      )}
    </div>
  );
};

export default PartnerManagementPage;
