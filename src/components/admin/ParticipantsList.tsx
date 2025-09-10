import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTypography } from '../../utils/typography';
import { registrationService } from '../../services/registrationService';
import {
  ParticipantsListProps,
  ActivityRegistration,
  RegistrationFilters,
  AttendanceStatus,
  ATTENDANCE_STATUS_OPTIONS,
  DEFAULT_REGISTRATION_FILTERS
} from '../../types/registration.types';
import { 
  Search, 
  Download, 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock,
  ChevronLeft,
  ChevronRight,
  Filter,
  Trash2
} from 'lucide-react';
import AnimatedButton from '../ui/AnimatedButton';

const ParticipantsList: React.FC<ParticipantsListProps> = ({
  activityId,
  activityName,
  onRegistrationUpdate,
  className = ''
}) => {
  const { i18n } = useTranslation();
  const { getClass } = useTypography();
  const currentLanguage = i18n.language as 'en' | 'th';
  
  const [registrations, setRegistrations] = useState<ActivityRegistration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<RegistrationFilters>(DEFAULT_REGISTRATION_FILTERS);
  const [selectedRegistrations, setSelectedRegistrations] = useState<Set<string>>(new Set());
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const pageSize = 20;

  // Content translations
  const content = {
    th: {
      title: 'ผู้เข้าร่วม',
      totalCount: 'ทั้งหมด {{count}} คน',
      searchPlaceholder: 'ค้นหาชื่อ, อีเมล, หรือเบอร์โทร...',
      allStatuses: 'สถานะทั้งหมด',
      exportCsv: 'ส่งออก CSV',
      exportExcel: 'ส่งออก Excel',
      selectedCount: 'เลือกแล้ว {{count}} รายการ',
      markAs: 'เปลี่ยนเป็น',
      delete: 'ลบ',
      deleteSelected: 'ลบที่เลือก',
      confirmDelete: 'คุณแน่ใจหรือไม่ที่จะลบการลงทะเบียนนี้?',
      confirmBulkDelete: 'คุณแน่ใจหรือไม่ที่จะลบการลงทะเบียน {{count}} รายการที่เลือก?',
      loading: 'กำลังโหลด...',
      noRegistrations: 'ยังไม่มีผู้ลงทะเบียน',
      columns: {
        name: 'ชื่อ',
        email: 'อีเมล',
        phone: 'เบอร์โทร',
        organization: 'องค์กร',
        status: 'สถานะ',
        registeredAt: 'วันที่ลงทะเบียน',
        actions: 'การจัดการ'
      },
      pagination: {
        showing: 'แสดง {{start}}-{{end}} จาก {{total}} รายการ',
        previous: 'ก่อนหน้า',
        next: 'ถัดไป',
        pageOf: 'หน้า {{current}} จาก {{total}}'
      },
      errors: {
        loadFailed: 'ไม่สามารถโหลดข้อมูลผู้เข้าร่วมได้',
        updateFailed: 'ไม่สามารถอัปเดตสถานะได้',
        bulkUpdateFailed: 'ไม่สามารถอัปเดตสถานะหลายรายการได้',
        exportFailed: 'ไม่สามารถส่งออกข้อมูลได้'
      }
    },
    en: {
      title: 'Participants',
      totalCount: 'Total {{count}} participants',
      searchPlaceholder: 'Search name, email, or phone...',
      allStatuses: 'All Statuses',
      exportCsv: 'Export CSV',
      exportExcel: 'Export Excel',
      selectedCount: '{{count}} selected',
      markAs: 'Mark as',
      delete: 'Delete',
      deleteSelected: 'Delete Selected',
      confirmDelete: 'Are you sure you want to delete this registration?',
      confirmBulkDelete: 'Are you sure you want to delete {{count}} selected registrations?',
      loading: 'Loading...',
      noRegistrations: 'No registrations yet',
      columns: {
        name: 'Name',
        email: 'Email',
        phone: 'Phone',
        organization: 'Organization',
        status: 'Status',
        registeredAt: 'Registered At',
        actions: 'Actions'
      },
      pagination: {
        showing: 'Showing {{start}}-{{end}} of {{total}} entries',
        previous: 'Previous',
        next: 'Next',
        pageOf: 'Page {{current}} of {{total}}'
      },
      errors: {
        loadFailed: 'Failed to load participants',
        updateFailed: 'Failed to update status',
        bulkUpdateFailed: 'Failed to bulk update status',
        exportFailed: 'Failed to export data'
      }
    }
  };

  const currentContent = content[currentLanguage];

  // Load registrations
  const loadRegistrations = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await registrationService.getActivityRegistrations(
        activityId,
        filters,
        currentPage,
        pageSize
      );

      setRegistrations(result.registrations);
      setTotalPages(result.totalPages);
      setTotalCount(result.total);
      setSelectedRegistrations(new Set());

    } catch (error) {
      console.error('❌ Error loading registrations:', error);
      setError(currentContent.errors.loadFailed);
    } finally {
      setIsLoading(false);
    }
  };

  // Load registrations on mount and when filters change
  useEffect(() => {
    loadRegistrations();
  }, [activityId, filters, currentPage]);

  // Handle filter changes
  const handleFilterChange = (newFilters: Partial<RegistrationFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  };

  // Handle search
  const handleSearch = (searchTerm: string) => {
    handleFilterChange({ search: searchTerm });
  };

  // Handle status filter
  const handleStatusFilter = (status: AttendanceStatus | undefined) => {
    handleFilterChange({ status });
  };

  // Handle sort change
  const handleSortChange = (sortBy: RegistrationFilters['sortBy'], sortOrder: RegistrationFilters['sortOrder']) => {
    handleFilterChange({ sortBy, sortOrder });
  };

  // Handle individual registration selection
  const handleRegistrationSelect = (registrationId: string, selected: boolean) => {
    const newSelected = new Set(selectedRegistrations);
    if (selected) {
      newSelected.add(registrationId);
    } else {
      newSelected.delete(registrationId);
    }
    setSelectedRegistrations(newSelected);
  };

  // Handle select all
  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedRegistrations(new Set(registrations.map(reg => reg.id)));
    } else {
      setSelectedRegistrations(new Set());
    }
  };

  // Handle individual status update
  const handleStatusUpdate = async (registrationId: string, newStatus: AttendanceStatus) => {
    try {
      setIsUpdating(true);
      await registrationService.updateRegistrationStatus(activityId, registrationId, newStatus);
      
      // Update local state
      setRegistrations(prev => 
        prev.map(reg => 
          reg.id === registrationId 
            ? { ...reg, status: newStatus }
            : reg
        )
      );

      // Call callback
      if (onRegistrationUpdate) {
        onRegistrationUpdate();
      }

    } catch (error) {
      console.error('❌ Error updating registration status:', error);
      setError(currentContent.errors.updateFailed);
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle individual delete
  const handleDelete = async (registrationId: string) => {
    if (!confirm(currentContent.confirmDelete)) {
      return;
    }

    try {
      setIsUpdating(true);
      await registrationService.deleteRegistration(activityId, registrationId);
      
      // Update local state
      setRegistrations(prev => prev.filter(reg => reg.id !== registrationId));
      setTotalCount(prev => prev - 1);

      // Call callback
      if (onRegistrationUpdate) {
        onRegistrationUpdate();
      }

    } catch (error) {
      console.error('❌ Error deleting registration:', error);
      setError('Failed to delete registration');
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedRegistrations.size === 0) {
      return;
    }

    const confirmMessage = currentContent.confirmBulkDelete.replace('{{count}}', selectedRegistrations.size.toString());
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      setIsUpdating(true);
      const registrationIds = Array.from(selectedRegistrations);
      
      await registrationService.bulkDeleteRegistrations(activityId, registrationIds);
      
      // Update local state
      setRegistrations(prev => prev.filter(reg => !selectedRegistrations.has(reg.id)));
      setTotalCount(prev => prev - selectedRegistrations.size);
      setSelectedRegistrations(new Set());

      // Call callback
      if (onRegistrationUpdate) {
        onRegistrationUpdate();
      }

    } catch (error) {
      console.error('❌ Error bulk deleting registrations:', error);
      setError('Failed to delete registrations');
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle bulk status update
  const handleBulkStatusUpdate = async (newStatus: AttendanceStatus) => {
    if (selectedRegistrations.size === 0) {
      return;
    }

    try {
      setIsUpdating(true);
      const registrationIds = Array.from(selectedRegistrations);
      
      await registrationService.bulkUpdateStatus(activityId, registrationIds, newStatus);
      
      // Update local state
      setRegistrations(prev => 
        prev.map(reg => 
          selectedRegistrations.has(reg.id)
            ? { ...reg, status: newStatus }
            : reg
        )
      );

      setSelectedRegistrations(new Set());

      // Call callback
      if (onRegistrationUpdate) {
        onRegistrationUpdate();
      }

    } catch (error) {
      console.error('❌ Error bulk updating registration status:', error);
      setError(currentContent.errors.bulkUpdateFailed);
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle export
  const handleExport = async (format: 'csv' | 'xlsx') => {
    try {
      setIsUpdating(true);
      const blob = await registrationService.exportRegistrations(activityId, format, filters);
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${activityName}_participants.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('❌ Error exporting registrations:', error);
      setError(currentContent.errors.exportFailed);
    } finally {
      setIsUpdating(false);
    }
  };

  // Format date for display
  const formatDate = (timestamp: any) => {
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    const locale = i18n.language === 'th' ? 'th-TH' : 'en-US';
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status display info
  const getStatusInfo = (status: AttendanceStatus) => {
    return ATTENDANCE_STATUS_OPTIONS.find(option => option.value === status) || ATTENDANCE_STATUS_OPTIONS[0];
  };

  return (
    <div className={`bg-transparent ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-white/20">
        <div className="flex items-center justify-between mb-4">
          <h3 className={`${getClass('heading')} text-white`}>
            {currentContent.title}
          </h3>
          <div className={`${getClass('body')} text-white/80`}>
            {currentContent.totalCount.replace('{{count}}', totalCount.toString())}
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder={currentContent.searchPlaceholder}
              value={filters.search || ''}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={filters.status || ''}
              onChange={(e) => handleStatusFilter(e.target.value as AttendanceStatus || undefined)}
              className="px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20"
            >
              <option value="" className="bg-gray-800 text-white">{currentContent.allStatuses}</option>
              {ATTENDANCE_STATUS_OPTIONS.map(option => (
                <option key={option.value} value={option.value} className="bg-gray-800 text-white">
                  {i18n.language === 'th' ? option.labelTh : option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Export */}
          <div className="flex gap-2">
            <AnimatedButton
              onClick={() => handleExport('csv')}
              disabled={isUpdating}
              variant="secondary"
              size="small"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <Download className="w-4 h-4 mr-2" />
              {currentContent.exportCsv}
            </AnimatedButton>
            <AnimatedButton
              onClick={() => handleExport('xlsx')}
              disabled={isUpdating}
              variant="secondary"
              size="small"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <Download className="w-4 h-4 mr-2" />
              {currentContent.exportExcel}
            </AnimatedButton>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedRegistrations.size > 0 && (
          <div className="mt-4 p-4 bg-white/10 border border-white/20 rounded-lg backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className={`${getClass('body')} text-white`}>
                {currentContent.selectedCount.replace('{{count}}', selectedRegistrations.size.toString())}
              </span>
              <div className="flex gap-2">
                {ATTENDANCE_STATUS_OPTIONS.map(option => (
                  <AnimatedButton
                    key={option.value}
                    onClick={() => handleBulkStatusUpdate(option.value)}
                    disabled={isUpdating}
                    variant="primary"
                    size="small"
                    className={`${
                      option.color === 'green'
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : option.color === 'blue'
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : option.color === 'yellow'
                        ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                        : 'bg-red-600 hover:bg-red-700 text-white'
                    }`}
                  >
                    {currentContent.markAs} {i18n.language === 'th' ? option.labelTh : option.label}
                  </AnimatedButton>
                ))}
                <AnimatedButton
                  onClick={handleBulkDelete}
                  disabled={isUpdating}
                  variant="primary"
                  size="small"
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  {currentContent.deleteSelected}
                </AnimatedButton>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-500/20 border-b border-red-400/30 backdrop-blur-sm">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <XCircle className="h-5 w-5 text-red-300" />
            </div>
            <div className="ml-3">
              <p className={`${getClass('body')} text-red-200`}>{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="p-8 text-center">
          <div className="inline-flex items-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className={`${getClass('body')} text-white`}>{currentContent.loading}</span>
          </div>
        </div>
      ) : registrations.length === 0 ? (
        <div className="p-8 text-center">
          <Users className="mx-auto h-12 w-12 text-white/60 mb-4" />
          <p className={`${getClass('body')} text-white/80`}>{currentContent.noRegistrations}</p>
        </div>
      ) : (
        <>
          {/* Participants Table */}
          <div className="overflow-x-auto rounded-lg bg-white/10 backdrop-blur-sm border border-white/20">
            <table className="min-w-full divide-y divide-white/20">
              <thead className="bg-white/10 backdrop-blur-sm">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedRegistrations.size === registrations.length && registrations.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="h-4 w-4 text-blue-400 focus:ring-blue-400 border-white/30 rounded bg-white/10"
                    />
                  </th>
                  <th className={`px-6 py-3 text-left ${getClass('caption')} text-white/80 uppercase tracking-wider`}>
                    {currentContent.columns.name}
                  </th>
                  <th className={`px-6 py-3 text-left ${getClass('caption')} text-white/80 uppercase tracking-wider`}>
                    {currentContent.columns.email}
                  </th>
                  <th className={`px-6 py-3 text-left ${getClass('caption')} text-white/80 uppercase tracking-wider`}>
                    {currentContent.columns.phone}
                  </th>
                  <th className={`px-6 py-3 text-left ${getClass('caption')} text-white/80 uppercase tracking-wider`}>
                    {currentContent.columns.organization}
                  </th>
                  <th className={`px-6 py-3 text-left ${getClass('caption')} text-white/80 uppercase tracking-wider`}>
                    {currentContent.columns.status}
                  </th>
                  <th className={`px-6 py-3 text-left ${getClass('caption')} text-white/80 uppercase tracking-wider`}>
                    {currentContent.columns.registeredAt}
                  </th>
                  <th className={`px-6 py-3 text-left ${getClass('caption')} text-white/80 uppercase tracking-wider`}>
                    {currentContent.columns.actions}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white/5 divide-y divide-white/10 backdrop-blur-sm">
                {registrations.map((registration) => {
                  const statusInfo = getStatusInfo(registration.status);
                  return (
                    <tr key={registration.id} className="hover:bg-white/10 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedRegistrations.has(registration.id)}
                          onChange={(e) => handleRegistrationSelect(registration.id, e.target.checked)}
                          className="h-4 w-4 text-blue-400 focus:ring-blue-400 border-white/30 rounded bg-white/10"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className={`${getClass('body')} font-medium text-white`}>
                            {registration.participantName}
                          </div>
                          {registration.participantNameEn && (
                            <div className={`${getClass('caption')} text-white/60`}>
                              {registration.participantNameEn}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap ${getClass('body')} text-white/80`}>
                        {registration.email}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap ${getClass('body')} text-white/80`}>
                        {registration.phone}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap ${getClass('body')} text-white/80`}>
                        {registration.organization || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full ${getClass('caption')} font-medium ${
                          statusInfo.color === 'green'
                            ? 'bg-green-500/20 text-green-300 border border-green-400/30'
                            : statusInfo.color === 'blue'
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30'
                            : statusInfo.color === 'yellow'
                            ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-400/30'
                            : 'bg-red-500/20 text-red-300 border border-red-400/30'
                        }`}>
                          {i18n.language === 'th' ? statusInfo.labelTh : statusInfo.label}
                        </span>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap ${getClass('caption')} text-white/60`}>
                        {formatDate(registration.registeredAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <select
                            value={registration.status}
                            onChange={(e) => handleStatusUpdate(registration.id, e.target.value as AttendanceStatus)}
                            disabled={isUpdating}
                            className={`${getClass('caption')} bg-white/10 border border-white/20 rounded px-2 py-1 text-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            {ATTENDANCE_STATUS_OPTIONS.map(option => (
                              <option key={option.value} value={option.value} className="bg-gray-800 text-white">
                                {i18n.language === 'th' ? option.labelTh : option.label}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleDelete(registration.id)}
                            disabled={isUpdating}
                            className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title={currentContent.delete}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-white/20">
              <div className="flex items-center justify-between">
                <div className={`${getClass('body')} text-white/80`}>
                  {currentContent.pagination.showing
                    .replace('{{start}}', ((currentPage - 1) * pageSize + 1).toString())
                    .replace('{{end}}', Math.min(currentPage * pageSize, totalCount).toString())
                    .replace('{{total}}', totalCount.toString())}
                </div>
                <div className="flex gap-2">
                  <AnimatedButton
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    variant="secondary"
                    size="small"
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    {currentContent.pagination.previous}
                  </AnimatedButton>
                  <span className={`px-3 py-2 ${getClass('body')} text-white/80 flex items-center`}>
                    {currentContent.pagination.pageOf
                      .replace('{{current}}', currentPage.toString())
                      .replace('{{total}}', totalPages.toString())}
                  </span>
                  <AnimatedButton
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    variant="secondary"
                    size="small"
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {currentContent.pagination.next}
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </AnimatedButton>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ParticipantsList;
