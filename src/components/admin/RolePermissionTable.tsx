import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTypography } from '../../utils/typography';
import { 
  Shield, 
  Users, 
  FileText, 
  Building2, 
  Star, 
  Settings, 
  BarChart3, 
  Flag, 
  Trash2, 
  Edit, 
  UserPlus,
  Check,
  X,
  Eye,
  Database,
  UserCheck
} from 'lucide-react';

const RolePermissionTable: React.FC = () => {
  const { i18n } = useTranslation();
  const { getClass } = useTypography();
  const currentLanguage = i18n.language as 'en' | 'th';

  const content = {
    th: {
      permission: 'สิทธิ์',
      superAdmin: 'ผู้ดูแลระบบสูงสุด',
      admin: 'ผู้ดูแลระบบ',
      editor: 'บรรณาธิการ',
      jury: 'คณะกรรมการ',
      user: 'ผู้ใช้ทั่วไป',
      categories: {
        dashboard: 'แดชบอร์ดและการดู',
        applications: 'การจัดการใบสมัคร',
        content: 'การจัดการเนื้อหา',
        users: 'การจัดการผู้ใช้',
        system: 'การตั้งค่าระบบ'
      },
      permissions: {
        canViewDashboard: 'เข้าถึงแดชบอร์ด',
        canViewApplications: 'ดูใบสมัคร',
        canExportData: 'ส่งออกข้อมูล',
        canGenerateReports: 'สร้างรายงาน',
        canScoreApplications: 'ให้คะแนนใบสมัคร',
        canApproveApplications: 'อนุมัติใบสมัคร',
        canFlagApplications: 'ทำเครื่องหมายใบสมัคร',
        canDeleteApplications: 'ลบใบสมัคร',
        canEditApplications: 'แก้ไขใบสมัคร',
        canRateSubmissions: 'ให้คะแนนผลงาน',
        canManageContent: 'จัดการเนื้อหา (ภาพยนตร์)',
        canManagePartners: 'จัดการพาร์ทเนอร์',
        canManageUsers: 'จัดการผู้ใช้',
        canAssignRoles: 'กำหนดบทบาท',
        canAccessSystemSettings: 'เข้าถึงการตั้งค่าระบบ'
      }
    },
    en: {
      permission: 'Permission',
      superAdmin: 'Super Admin',
      admin: 'Admin',
      editor: 'Editor',
      jury: 'Jury',
      user: 'User',
      categories: {
        dashboard: 'Dashboard & Viewing',
        applications: 'Application Management',
        content: 'Content Management',
        users: 'User Management',
        system: 'System Settings'
      },
      permissions: {
        canViewDashboard: 'View Dashboard',
        canViewApplications: 'View Applications',
        canExportData: 'Export Data',
        canGenerateReports: 'Generate Reports',
        canScoreApplications: 'Score Applications',
        canApproveApplications: 'Approve Applications',
        canFlagApplications: 'Flag Applications',
        canDeleteApplications: 'Delete Applications',
        canEditApplications: 'Edit Applications',
        canRateSubmissions: 'Rate Submissions',
        canManageContent: 'Manage Content (Films)',
        canManagePartners: 'Manage Partners',
        canManageUsers: 'Manage Users',
        canAssignRoles: 'Assign Roles',
        canAccessSystemSettings: 'Access System Settings'
      }
    }
  };

  const currentContent = content[currentLanguage];

  // Permission matrix - defines which roles have which permissions
  const permissionMatrix = {
    canViewDashboard: {
      'super-admin': true,
      admin: true,
      editor: true,
      jury: true,
      user: false
    },
    canViewApplications: {
      'super-admin': true,
      admin: true,
      editor: true,
      jury: true,
      user: false
    },
    canExportData: {
      'super-admin': true,
      admin: true,
      editor: false,
      jury: false,
      user: false
    },
    canGenerateReports: {
      'super-admin': true,
      admin: true,
      editor: false,
      jury: false,
      user: false
    },
    canScoreApplications: {
      'super-admin': true,
      admin: true,
      editor: true,
      jury: true,
      user: false
    },
    canApproveApplications: {
      'super-admin': true,
      admin: 'conditional', // depends on admin level
      editor: false,
      jury: false,
      user: false
    },
    canFlagApplications: {
      'super-admin': true,
      admin: true,
      editor: false,
      jury: false,
      user: false
    },
    canDeleteApplications: {
      'super-admin': true,
      admin: 'conditional', // depends on admin level
      editor: false,
      jury: false,
      user: false
    },
    canEditApplications: {
      'super-admin': true,
      admin: 'conditional', // depends on admin level
      editor: false,
      jury: false,
      user: false
    },
    canRateSubmissions: {
      'super-admin': true,
      admin: true,
      editor: true,
      jury: true,
      user: false
    },
    canManageContent: {
      'super-admin': true,
      admin: 'conditional', // depends on admin level
      editor: true,
      jury: false,
      user: false
    },
    canManagePartners: {
      'super-admin': true,
      admin: 'conditional', // depends on admin level
      editor: true,
      jury: false,
      user: false
    },
    canManageUsers: {
      'super-admin': true,
      admin: 'conditional', // depends on admin level
      editor: false,
      jury: false,
      user: false
    },
    canAssignRoles: {
      'super-admin': true,
      admin: false,
      editor: false,
      jury: false,
      user: false
    },
    canAccessSystemSettings: {
      'super-admin': true,
      admin: false,
      editor: false,
      jury: false,
      user: false
    }
  };

  // Grouped permissions by category
  const permissionCategories = {
    dashboard: ['canViewDashboard', 'canViewApplications', 'canExportData', 'canGenerateReports'],
    applications: ['canScoreApplications', 'canApproveApplications', 'canFlagApplications', 'canDeleteApplications', 'canEditApplications', 'canRateSubmissions'],
    content: ['canManageContent', 'canManagePartners'],
    users: ['canManageUsers', 'canAssignRoles'],
    system: ['canAccessSystemSettings']
  };

  const roles = ['super-admin', 'admin', 'editor', 'jury', 'user'] as const;

  const getPermissionIcon = (permission: keyof typeof permissionMatrix) => {
    const iconMap = {
      canViewDashboard: BarChart3,
      canViewApplications: FileText,
      canScoreApplications: Star,
      canApproveApplications: Check,
      canExportData: FileText,
      canManageUsers: Users,
      canManageContent: FileText,
      canManagePartners: Building2,
      canRateSubmissions: Star,
      canAccessSystemSettings: Settings,
      canGenerateReports: BarChart3,
      canFlagApplications: Flag,
      canDeleteApplications: Trash2,
      canEditApplications: Edit,
      canAssignRoles: UserPlus
    };
    
    const IconComponent = iconMap[permission] || Shield;
    return <IconComponent size={16} className="text-white/60" />;
  };

  const renderPermissionCell = (permission: keyof typeof permissionMatrix, role: typeof roles[number]) => {
    const hasPermission = permissionMatrix[permission][role];
    
    if (hasPermission === true) {
      return (
        <div className="flex items-center justify-center">
          <Check size={16} className="text-green-400" />
        </div>
      );
    } else if (hasPermission === 'conditional') {
      return (
        <div className="flex items-center justify-center">
          <div className="w-2 h-2 bg-yellow-400 rounded-full" title={currentLanguage === 'th' ? 'ขึ้นอยู่กับระดับ' : 'Depends on level'} />
        </div>
      );
    } else {
      return (
        <div className="flex items-center justify-center">
          <X size={16} className="text-red-400" />
        </div>
      );
    }
  };

  const getRoleColor = (role: typeof roles[number]) => {
    const colorMap = {
      'super-admin': 'text-purple-400',
      admin: 'text-blue-400',
      editor: 'text-green-400',
      jury: 'text-orange-400',
      user: 'text-gray-400'
    };
    return colorMap[role];
  };

  const getCategoryIcon = (category: keyof typeof permissionCategories) => {
    const iconMap = {
      dashboard: BarChart3,
      applications: FileText,
      content: Building2,
      users: Users,
      system: Settings
    };
    
    const IconComponent = iconMap[category] || Shield;
    return <IconComponent size={16} className="text-white/60" />;
  };

  return (
    <div className="w-full max-h-[600px] flex flex-col">
      {/* Permission Matrix Table - Grouped by Categories */}
      <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden flex-1 flex flex-col">
        {/* Fixed Header */}
        <div className="flex-shrink-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-white/20 bg-black/20">
                  <th className={`text-left p-2 sm:p-3 ${getClass('body')} font-semibold text-white/80`} style={{ width: '40%' }}>
                    {currentContent.permission}
                  </th>
                  {roles.map((role) => (
                    <th key={role} className={`text-center p-1 sm:p-2 ${getClass('body')} font-semibold text-white/80`} style={{ width: '12%' }}>
                      <div className="flex flex-col items-center space-y-1">
                        <Shield size={12} className={getRoleColor(role)} />
                        <span className="text-xs leading-tight break-words">
                          {role === 'super-admin' ? (currentLanguage === 'th' ? 'ผู้ดูแลสูงสุด' : 'Super Admin') : 
                           role === 'admin' ? (currentLanguage === 'th' ? 'ผู้ดูแล' : 'Admin') :
                           role === 'editor' ? (currentLanguage === 'th' ? 'บรรณาธิการ' : 'Editor') :
                           role === 'jury' ? (currentLanguage === 'th' ? 'คณะกรรมการ' : 'Jury') :
                           (currentLanguage === 'th' ? 'ผู้ใช้' : 'User')}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
            </table>
          </div>
        </div>
        
        {/* Scrollable Body */}
        <div className="flex-1 overflow-auto">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <tbody>
                {Object.entries(permissionCategories).map(([category, categoryPermissions]) => (
                  <React.Fragment key={category}>
                    {/* Category Header */}
                    <tr className="bg-white/10 sticky top-0 z-10">
                      <td colSpan={roles.length + 1} className={`p-2 sm:p-3 ${getClass('body')} font-semibold text-white border-t border-white/10`} style={{ width: '100%' }}>
                        <div className="flex items-center space-x-2">
                          {getCategoryIcon(category as keyof typeof permissionCategories)}
                          <span className="text-sm sm:text-base">{currentContent.categories[category as keyof typeof currentContent.categories]}</span>
                        </div>
                      </td>
                    </tr>
                    {/* Category Permissions */}
                    {categoryPermissions.map((permission, index) => (
                      <tr key={permission} className={`${index % 2 === 0 ? 'bg-white/2' : 'bg-white/5'} hover:bg-white/10 transition-colors`}>
                        <td className={`p-2 sm:p-3 ${getClass('body')} text-white/90 pl-4 sm:pl-8`} style={{ width: '40%' }}>
                          <div className="flex items-center space-x-2">
                            {getPermissionIcon(permission as keyof typeof permissionMatrix)}
                            <span className="text-xs sm:text-sm break-words">{currentContent.permissions[permission as keyof typeof currentContent.permissions]}</span>
                          </div>
                        </td>
                        {roles.map((role) => (
                          <td key={role} className="p-1 sm:p-2 text-center" style={{ width: '12%' }}>
                            {renderPermissionCell(permission as keyof typeof permissionMatrix, role)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 bg-white/5 p-4 rounded-xl border border-white/10">
        <h3 className={`${getClass('body')} font-semibold text-white mb-3`}>
          {currentLanguage === 'th' ? 'คำอธิบาย' : 'Legend'}
        </h3>
        <div className="flex flex-wrap gap-6">
          <div className="flex items-center space-x-2">
            <Check size={16} className="text-green-400" />
            <span className={`${getClass('body')} text-white/70 text-sm`}>
              {currentLanguage === 'th' ? 'มีสิทธิ์' : 'Has Permission'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <X size={16} className="text-red-400" />
            <span className={`${getClass('body')} text-white/70 text-sm`}>
              {currentLanguage === 'th' ? 'ไม่มีสิทธิ์' : 'No Permission'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-yellow-400 rounded-full" />
            <span className={`${getClass('body')} text-white/70 text-sm`}>
              {currentLanguage === 'th' ? 'ขึ้นอยู่กับระดับผู้ดูแล' : 'Depends on Admin Level'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RolePermissionTable;
