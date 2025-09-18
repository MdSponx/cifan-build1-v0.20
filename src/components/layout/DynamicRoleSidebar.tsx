import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTypography } from '../../utils/typography';
import { useAuth } from '../auth/AuthContext';
import { useAdmin } from '../admin/AdminContext';
import { 
  User, 
  BarChart3, 
  Grid, 
  Building2, 
  Calendar, 
  FileText, 
  LogOut, 
  X,
  Shield,
  Edit3,
  Users,
  Eye,
  Plus,
  Film,
  Award,
  ChevronDown,
  ChevronRight,
  Palette,
  BookOpen,
  Scale,
  Newspaper,
  Sparkles
} from 'lucide-react';
import { AdminPermissions } from '../../types/admin.types';

interface ZoneMenuItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  href: string;
  badge?: {
    text: string;
    color: 'orange' | 'blue' | 'green' | 'red' | 'teal' | 'cyan';
  };
  submenu?: ZoneMenuItem[];
}

interface DynamicRoleSidebarProps {
  currentPage: string;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  userRole?: 'admin' | 'super-admin' | 'editor' | 'jury';
}

interface RoleConfig {
  zoneName: string;
  zoneIcon: React.ReactNode;
  roleLabel: string;
  badgeColor: string;
  gradientFrom: string;
  gradientTo: string;
  backgroundColor: string;
  borderColor: string;
}

/**
 * Dynamic Role-Based Sidebar Component
 * Adapts header, styling, and menu items based on user role
 */
const DynamicRoleSidebar: React.FC<DynamicRoleSidebarProps> = ({
  currentPage,
  isOpen,
  onToggle,
  onClose,
  userRole
}) => {
  const { i18n } = useTranslation();
  const { getClass } = useTypography();
  const { user, userProfile, signOut } = useAuth();
  const { adminProfile, permissions, checkPermission } = useAdmin();
  const currentLanguage = i18n.language as 'en' | 'th';
  
  // Determine the actual user role
  const actualUserRole = userRole || userProfile?.role || 'admin';
  
  // State for expandable menus
  const [isApplicationsExpanded, setIsApplicationsExpanded] = useState(true);
  const [isContentExpanded, setIsContentExpanded] = useState(true);
  const [isLibraryExpanded, setIsLibraryExpanded] = useState(true);
  const [isActivitiesExpanded, setIsActivitiesExpanded] = useState(true);
  const [isArticlesExpanded, setIsArticlesExpanded] = useState(true);

  // Role-specific configurations
  const getRoleConfig = (role: string): RoleConfig => {
    switch (role) {
      case 'editor':
        return {
          zoneName: currentLanguage === 'th' ? 'พื้นที่บรรณาธิการ' : 'Editor Zone',
          zoneIcon: <Edit3 className="w-5 h-5 text-[#4ECDC4]" />,
          roleLabel: currentLanguage === 'th' ? 'บรรณาธิการ' : 'Editor',
          badgeColor: '#4ECDC4',
          gradientFrom: '#44A08D',
          gradientTo: '#4ECDC4',
          backgroundColor: 'rgba(78, 205, 196, 0.08)',
          borderColor: 'rgba(78, 205, 196, 0.15)'
        };
      case 'jury':
        return {
          zoneName: currentLanguage === 'th' ? 'พื้นที่คณะกรรมการ' : 'Jury Zone',
          zoneIcon: <Scale className="w-5 h-5 text-[#9B59B6]" />,
          roleLabel: currentLanguage === 'th' ? 'คณะกรรมการ' : 'Jury',
          badgeColor: '#9B59B6',
          gradientFrom: '#8E44AD',
          gradientTo: '#9B59B6',
          backgroundColor: 'rgba(155, 89, 182, 0.08)',
          borderColor: 'rgba(155, 89, 182, 0.15)'
        };
      case 'admin':
      case 'super-admin':
      default:
        return {
          zoneName: currentLanguage === 'th' ? 'พื้นที่ผู้ดูแลระบบ' : 'Admin Zone',
          zoneIcon: <Shield className="w-5 h-5 text-[#FCB283]" />,
          roleLabel: currentLanguage === 'th' ? 'ผู้ดูแลระบบ' : 'Administrator',
          badgeColor: '#FCB283',
          gradientFrom: '#AA4626',
          gradientTo: '#FCB283',
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          borderColor: 'rgba(255, 255, 255, 0.15)'
        };
    }
  };

  const roleConfig = getRoleConfig(actualUserRole);

  const content = {
    th: {
      adminProfile: "โปรไฟล์ผู้ดูแล",
      editorProfile: "โปรไฟล์บรรณาธิการ",
      juryProfile: "โปรไฟล์คณะกรรมการ",
      roleManagement: "จัดการบทบาทผู้ใช้",
      applications: "ใบสมัคร",
      applicationsDashboard: "แดชบอร์ด",
      applicationsGallery: "แกลเลอรี่",
      partnersManagement: "จัดการพาร์ทเนอร์",
      news: "ข่าวสาร",
      allNews: "ข่าวสารทั้งหมด",
      createNews: "สร้างข่าวใหม่",
      contentManagement: "จัดการเนื้อหา",
      featureFilms: "ภาพยนตร์เรื่องยาว",
      articles: "บทความ",
      activitiesEvents: "กิจกรรมและอีเวนต์",
      allActivities: "กิจกรรมทั้งหมด",
      createNew: "สร้างใหม่",
      workshops: "เวิร์กช็อป",
      screenings: "การฉายภาพยนตร์",
      ceremonies: "พิธีการ",
      articlesNews: "บทความและข่าวสาร",
      filmLibrary: "คลังภาพยนตร์",
      allFilms: "ภาพยนตร์ทั้งหมด",
      categories: "หมวดหมู่",
      analytics: "การวิเคราะห์",
      scoring: "การให้คะแนน",
      evaluations: "การประเมิน",
      signOut: "ออกจากระบบ",
      welcome: "ยินดีต้อนรับ",
      comingSoon: "เร็วๆ นี้"
    },
    en: {
      adminProfile: "Admin Profile",
      editorProfile: "Editor Profile",
      juryProfile: "Jury Profile",
      roleManagement: "Role Management",
      applications: "Applications",
      applicationsDashboard: "Dashboard",
      applicationsGallery: "Gallery",
      partnersManagement: "Partners Management",
      news: "News",
      allNews: "All News",
      createNews: "Create News",
      contentManagement: "Content Management",
      featureFilms: "Feature Films",
      articles: "Articles",
      activitiesEvents: "Activities & Events",
      allActivities: "All Activities",
      createNew: "Create New",
      workshops: "Workshops",
      screenings: "Screenings",
      ceremonies: "Ceremonies",
      articlesNews: "Articles & News",
      filmLibrary: "Film Library",
      allFilms: "All Films",
      categories: "Categories",
      analytics: "Analytics",
      scoring: "Scoring",
      evaluations: "Evaluations",
      signOut: "Sign Out",
      welcome: "Welcome",
      comingSoon: "Coming Soon"
    }
  };

  const currentContent = content[currentLanguage];

  // Permission-based menu filtering using AdminContext with fallback
  const getFilteredMenuItems = (): ZoneMenuItem[] => {
    const baseMenuItems: ZoneMenuItem[] = [];

    // Profile menu item (all roles)
    const profileLabel = actualUserRole === 'editor' ? currentContent.editorProfile :
                        actualUserRole === 'jury' ? currentContent.juryProfile :
                        currentContent.adminProfile;
    
    baseMenuItems.push({
      id: 'admin/profile',
      icon: <User size={20} />,
      label: profileLabel,
      href: '#admin/profile'
    });

    // Debug: Log permissions to understand what's happening
    console.log('DynamicRoleSidebar Debug:', {
      actualUserRole,
      permissions,
      adminProfile,
      userProfile,
      checkPermissionResult: checkPermission('canViewApplications')
    });

    // Special handling for jury role - restrict to only profile and submissions
    if (actualUserRole === 'jury') {
      // Jury can only access submissions for scoring - no creation, editing, or deletion
      baseMenuItems.push({
        id: 'admin/applications',
        icon: <FileText size={20} />,
        label: currentContent.applications,
        href: '#admin/applications'
      });
      
      console.log('Jury role detected - restricted menu items:', baseMenuItems);
      return baseMenuItems;
    }

    // Fallback: If no permissions are available, show basic menu based on role
    const hasAnyPermissions = permissions && Object.values(permissions).some(p => p === true);
    
    if (!hasAnyPermissions) {
      console.log('No permissions found, using role-based fallback');
      
      // Role-based fallback menu items
      switch (actualUserRole) {
        case 'editor':
          baseMenuItems.push(
            {
              id: 'admin/applications',
              icon: <FileText size={20} />,
              label: currentContent.applications,
              href: '#admin/applications'
            },
            {
              id: 'admin/activities',
              icon: <Calendar size={20} />,
              label: currentContent.activitiesEvents,
              href: '#admin/activities'
            },
            {
              id: 'admin/articles',
              icon: <FileText size={20} />,
              label: currentContent.articlesNews,
              href: '#admin/articles'
            }
          );
          break;
        
        case 'admin':
        case 'super-admin':
        default:
          baseMenuItems.push(
            {
              id: 'admin/role-management',
              icon: <Users size={20} />,
              label: currentContent.roleManagement,
              href: '#admin/role-management'
            },
            {
              id: 'admin/applications',
              icon: <FileText size={20} />,
              label: currentContent.applications,
              href: '#admin/applications'
            },
            {
              id: 'admin/partners',
              icon: <Building2 size={20} />,
              label: currentContent.partnersManagement,
              href: '#admin/partners'
            },
            {
              id: 'admin/activities',
              icon: <Calendar size={20} />,
              label: currentContent.activitiesEvents,
              href: '#admin/activities'
            },
            {
              id: 'admin/articles',
              icon: <FileText size={20} />,
              label: currentContent.articlesNews,
              href: '#admin/articles'
            }
          );
          break;
      }
    } else {
      // Permission-based menu items using AdminContext
      
      // Role Management - only for users who can manage users or assign roles
      if (checkPermission('canManageUsers') || checkPermission('canAssignRoles')) {
        baseMenuItems.push({
          id: 'admin/role-management',
          icon: <Users size={20} />,
          label: currentContent.roleManagement,
          href: '#admin/role-management'
        });
      }

      // Applications - all admin roles can view applications
      if (checkPermission('canViewApplications')) {
        baseMenuItems.push({
          id: 'admin/applications',
          icon: <FileText size={20} />,
          label: currentContent.applications,
          href: '#admin/applications'
        });
      }

      // Partners Management - for users who can manage partners
      if (checkPermission('canManagePartners')) {
        baseMenuItems.push({
          id: 'admin/partners',
          icon: <Building2 size={20} />,
          label: currentContent.partnersManagement,
          href: '#admin/partners'
        });
      }

      // Activities & Events - for users who can manage content
      if (checkPermission('canManageContent')) {
        baseMenuItems.push({
          id: 'admin/activities',
          icon: <Calendar size={20} />,
          label: currentContent.activitiesEvents,
          href: '#admin/activities'
        });
      }

      // Articles & News - for users who can manage content
      if (checkPermission('canManageContent')) {
        baseMenuItems.push({
          id: 'admin/articles',
          icon: <FileText size={20} />,
          label: currentContent.articlesNews,
          href: '#admin/articles'
        });
      }

      // Analytics - for users who can generate reports
      if (checkPermission('canGenerateReports') || checkPermission('canViewDashboard')) {
        baseMenuItems.push({
          id: 'admin/analytics',
          icon: <BarChart3 size={20} />,
          label: currentContent.analytics,
          href: '#admin/analytics',
          badge: {
            text: currentContent.comingSoon,
            color: 'teal'
          }
        });
      }
    }

    console.log('Final menu items:', baseMenuItems);
    return baseMenuItems;
  };

  const menuItems = getFilteredMenuItems();

  const handleSignOut = async () => {
    try {
      await signOut();
      onClose();
      window.location.hash = '#home';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleMenuItemClick = (href: string, hasComingSoon: boolean = false) => {
    if (hasComingSoon) {
      // Navigate to coming soon page for items with badges
      window.location.hash = '#coming-soon';
    } else {
      window.location.hash = href;
    }
    onClose();
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  const handleApplicationsToggle = () => {
    setIsApplicationsExpanded(!isApplicationsExpanded);
  };

  const handleContentToggle = () => {
    setIsContentExpanded(!isContentExpanded);
  };

  const handleLibraryToggle = () => {
    setIsLibraryExpanded(!isLibraryExpanded);
  };

  const handleActivitiesToggle = () => {
    setIsActivitiesExpanded(!isActivitiesExpanded);
  };

  const handleArticlesToggle = () => {
    setIsArticlesExpanded(!isArticlesExpanded);
  };

  const isApplicationsPageActive = (page: string) => {
    return page.startsWith('admin/dashboard') || 
           page.startsWith('admin/gallery') || 
           page.startsWith('admin/youth-competition') ||
           page.startsWith('admin/future-competition') ||
           page.startsWith('admin/world-competition');
  };

  const isContentPageActive = (page: string) => {
    return page.startsWith('admin/content') || page.startsWith('admin/feature-films');
  };

  const isLibraryPageActive = (page: string) => {
    return page.startsWith('admin/library');
  };

  const isActivitiesPageActive = (page: string) => {
    return page.startsWith('admin/activities');
  };

  const isArticlesPageActive = (page: string) => {
    return page.startsWith('admin/articles') || page.startsWith('admin/feature-films') || page.startsWith('admin/news') || page.startsWith('admin/fortune-cards');
  };

  // Permission-based submenu items generation with fallback
  const getApplicationsSubmenuItems = () => {
    const items = [];
    
    // Check if we have permissions, otherwise use fallback
    const hasAnyPermissions = permissions && Object.values(permissions).some(p => p === true);
    
    if (hasAnyPermissions) {
      // Use permission-based logic
      if (checkPermission('canViewDashboard')) {
        items.push({
          id: 'admin/dashboard',
          icon: <BarChart3 size={18} />,
          label: currentContent.applicationsDashboard,
          href: '#admin/dashboard'
        });
      }
      
      if (checkPermission('canViewApplications')) {
        items.push({
          id: 'admin/gallery',
          icon: <Grid size={18} />,
          label: currentContent.applicationsGallery,
          href: '#admin/gallery'
        });
        items.push({
          id: 'admin/youth-competition',
          icon: <Users size={18} />,
          label: currentLanguage === 'th' ? 'การประกวดเยาวชน' : 'Youth Competition',
          href: '#admin/youth-competition'
        });
        items.push({
          id: 'admin/future-competition',
          icon: <Sparkles size={18} />,
          label: currentLanguage === 'th' ? 'การประกวดอนาคต' : 'Future Competition',
          href: '#admin/future-competition'
        });
        items.push({
          id: 'admin/world-competition',
          icon: <Award size={18} />,
          label: currentLanguage === 'th' ? 'การประกวดโลก' : 'World Competition',
          href: '#admin/world-competition'
        });
      }
    } else {
      // Fallback: Show submenu items based on role
      items.push(
        {
          id: 'admin/dashboard',
          icon: <BarChart3 size={18} />,
          label: currentContent.applicationsDashboard,
          href: '#admin/dashboard'
        },
        {
          id: 'admin/gallery',
          icon: <Grid size={18} />,
          label: currentContent.applicationsGallery,
          href: '#admin/gallery'
        },
        {
          id: 'admin/youth-competition',
          icon: <Users size={18} />,
          label: currentLanguage === 'th' ? 'การประกวดเยาวชน' : 'Youth Competition',
          href: '#admin/youth-competition'
        },
        {
          id: 'admin/future-competition',
          icon: <Sparkles size={18} />,
          label: currentLanguage === 'th' ? 'การประกวดอนาคต' : 'Future Competition',
          href: '#admin/future-competition'
        },
        {
          id: 'admin/world-competition',
          icon: <Award size={18} />,
          label: currentLanguage === 'th' ? 'การประกวดโลก' : 'World Competition',
          href: '#admin/world-competition'
        }
      );
    }
    
    return items;
  };

  const getActivitiesSubmenuItems = () => {
    const items = [];
    
    // Check if we have permissions, otherwise use fallback
    const hasAnyPermissions = permissions && Object.values(permissions).some(p => p === true);
    
    if (hasAnyPermissions) {
      // Use permission-based logic
      if (checkPermission('canManageContent')) {
        items.push(
          {
            id: 'admin/activities',
            icon: <Eye size={18} />,
            label: currentContent.allActivities,
            href: '#admin/activities'
          },
          {
            id: 'admin/activities/create',
            icon: <Plus size={18} />,
            label: currentContent.createNew,
            href: '#admin/activities/create'
          },
          {
            id: 'admin/activities/workshops',
            icon: <Users size={18} />,
            label: currentContent.workshops,
            href: '#admin/activities/workshops'
          },
          {
            id: 'admin/activities/screenings',
            icon: <Film size={18} />,
            label: currentContent.screenings,
            href: '#admin/activities/screenings'
          },
          {
            id: 'admin/activities/ceremonies',
            icon: <Award size={18} />,
            label: currentContent.ceremonies,
            href: '#admin/activities/ceremonies'
          }
        );
      }
    } else {
      // Fallback: Show submenu items based on role
      if (actualUserRole === 'admin' || actualUserRole === 'super-admin' || actualUserRole === 'editor') {
        items.push(
          {
            id: 'admin/activities',
            icon: <Eye size={18} />,
            label: currentContent.allActivities,
            href: '#admin/activities'
          },
          {
            id: 'admin/activities/create',
            icon: <Plus size={18} />,
            label: currentContent.createNew,
            href: '#admin/activities/create'
          },
          {
            id: 'admin/activities/workshops',
            icon: <Users size={18} />,
            label: currentContent.workshops,
            href: '#admin/activities/workshops'
          },
          {
            id: 'admin/activities/screenings',
            icon: <Film size={18} />,
            label: currentContent.screenings,
            href: '#admin/activities/screenings'
          },
          {
            id: 'admin/activities/ceremonies',
            icon: <Award size={18} />,
            label: currentContent.ceremonies,
            href: '#admin/activities/ceremonies'
          }
        );
      }
    }
    
    return items;
  };

  const getArticlesSubmenuItems = () => {
    const items = [];
    
    // Check if we have permissions, otherwise use fallback
    const hasAnyPermissions = permissions && Object.values(permissions).some(p => p === true);
    
    if (hasAnyPermissions) {
      // Use permission-based logic
      if (checkPermission('canManageContent')) {
        items.push(
          {
            id: 'admin/feature-films',
            icon: <Eye size={18} />,
            label: 'Film Gallery',
            href: '#admin/feature-films'
          },
          {
            id: 'admin/feature-films/new',
            icon: <Plus size={18} />,
            label: 'Add New Film',
            href: '#admin/feature-films/new'
          },
          {
            id: 'admin/fortune-cards',
            icon: <Sparkles size={18} />,
            label: 'Fortune Cards',
            href: '#admin/fortune-cards'
          },
          {
            id: 'admin/fortune-cards/new',
            icon: <Plus size={18} />,
            label: 'Add New Fortune Card',
            href: '#admin/fortune-cards/new'
          },
          {
            id: 'admin/news',
            icon: <Eye size={18} />,
            label: currentContent.allNews,
            href: '#admin/news'
          },
          {
            id: 'admin/news/create',
            icon: <Plus size={18} />,
            label: currentContent.createNews,
            href: '#admin/news/create'
          }
        );
      }
    } else {
      // Fallback: Show submenu items based on role
      if (actualUserRole === 'admin' || actualUserRole === 'super-admin' || actualUserRole === 'editor') {
        items.push(
          {
            id: 'admin/feature-films',
            icon: <Eye size={18} />,
            label: 'Film Gallery',
            href: '#admin/feature-films'
          },
          {
            id: 'admin/feature-films/new',
            icon: <Plus size={18} />,
            label: 'Add New Film',
            href: '#admin/feature-films/new'
          },
          {
            id: 'admin/fortune-cards',
            icon: <Sparkles size={18} />,
            label: 'Fortune Cards',
            href: '#admin/fortune-cards'
          },
          {
            id: 'admin/fortune-cards/new',
            icon: <Plus size={18} />,
            label: 'Add New Fortune Card',
            href: '#admin/fortune-cards/new'
          },
          {
            id: 'admin/news',
            icon: <Eye size={18} />,
            label: currentContent.allNews,
            href: '#admin/news'
          },
          {
            id: 'admin/news/create',
            icon: <Plus size={18} />,
            label: currentContent.createNews,
            href: '#admin/news/create'
          }
        );
      }
    }
    
    return items;
  };

  // Get submenu items based on permissions
  const applicationsSubmenuItems = getApplicationsSubmenuItems();
  const activitiesSubmenuItems = getActivitiesSubmenuItems();
  const articlesSubmenuItems = getArticlesSubmenuItems();

  const getBadgeStyles = (color: string) => {
    const styles = {
      orange: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      green: 'bg-green-500/20 text-green-400 border-green-500/30',
      red: 'bg-red-500/20 text-red-400 border-red-500/30',
      teal: 'bg-[#4ECDC4]/20 text-[#4ECDC4] border-[#4ECDC4]/30',
      cyan: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
    };
    return styles[color as keyof typeof styles] || styles.teal;
  };

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.getElementById('dynamic-role-sidebar');
      const toggle = document.getElementById('sidebar-toggle');
      
      if (isOpen && sidebar && !sidebar.contains(event.target as Node) && 
          toggle && !toggle.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  return (
    <div
      id="dynamic-role-sidebar"
      className="w-full h-full glass-container rounded-2xl border border-white/20 shadow-2xl transition-all duration-300 ease-in-out"
      style={{
        background: roleConfig.backgroundColor,
        backdropFilter: 'blur(20px)',
        borderColor: roleConfig.borderColor
      }}
    >
      <div className="flex flex-col h-full">
        
        {/* Sidebar Header */}
        <div className="p-6 border-b border-white/20 rounded-t-2xl" style={{ borderColor: roleConfig.borderColor }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-xl ${getClass('header')} text-white flex items-center space-x-2`}>
              {roleConfig.zoneIcon}
              <span>{roleConfig.zoneName}</span>
            </h2>
            <button
              onClick={onClose}
              className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X size={20} className="text-white/80" />
            </button>
          </div>
          
          {/* User Info */}
          <div className="flex items-center space-x-3">
            <div 
              className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center relative"
              style={{
                background: `linear-gradient(135deg, ${roleConfig.gradientFrom}, ${roleConfig.gradientTo})`
              }}
            >
              {(adminProfile?.photoURL || userProfile?.photoURL) ? (
                <img
                  src={adminProfile?.photoURL || userProfile?.photoURL}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-white font-bold text-lg">
                  {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </span>
              )}
              {/* Role Badge */}
              <div 
                className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
                style={{ backgroundColor: roleConfig.badgeColor }}
              >
                {actualUserRole === 'editor' ? <Edit3 className="w-2.5 h-2.5 text-white" /> :
                 actualUserRole === 'jury' ? <Scale className="w-2.5 h-2.5 text-white" /> :
                 <Shield className="w-2.5 h-2.5 text-white" />}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className={`${getClass('body')} text-white font-medium truncate`}>
                {currentContent.welcome}
              </p>
              <div className="flex items-center space-x-2">
                <p className={`${getClass('body')} text-white/60 text-sm truncate`}>
                  {adminProfile?.fullNameEN || userProfile?.fullNameEN || user?.displayName || user?.email}
                </p>
                <span 
                  className="px-2 py-0.5 rounded-full text-xs border"
                  style={{ 
                    backgroundColor: `${roleConfig.badgeColor}20`,
                    color: roleConfig.badgeColor,
                    borderColor: `${roleConfig.badgeColor}30`
                  }}
                >
                  {roleConfig.roleLabel}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-6 overflow-y-auto">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              // Handle Applications menu item specially
              if (item.id === 'admin/applications') {
                return (
                  <li key={item.id}>
                    {/* Main Applications Button */}
                    <button
                      onClick={handleApplicationsToggle}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${
                        isApplicationsPageActive(currentPage)
                          ? `text-white shadow-lg`
                          : 'text-white/80 hover:bg-white/10 hover:text-white'
                      }`}
                      style={isApplicationsPageActive(currentPage) ? {
                        background: `linear-gradient(135deg, ${roleConfig.gradientFrom}, ${roleConfig.gradientTo})`
                      } : {}}
                    >
                      <div className="flex items-center space-x-3 text-left">
                        <span className={isApplicationsPageActive(currentPage) ? 'text-white' : 'text-white/60 group-hover:text-white'}>
                          {item.icon}
                        </span>
                        <span className={`${getClass('body')} font-medium text-left`}>
                          {item.label}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {/* Expand/Collapse Icon */}
                        <span className={`transition-transform duration-200 ${
                          isApplicationsPageActive(currentPage) ? 'text-white' : 'text-white/60 group-hover:text-white'
                        } ${isApplicationsExpanded ? 'rotate-0' : '-rotate-90'}`}>
                          {isApplicationsExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </span>
                      </div>
                    </button>

                    {/* Applications Submenu Items */}
                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      isApplicationsExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    }`}>
                      <ul className="mt-2 space-y-1 ml-4">
                        {applicationsSubmenuItems.map((subItem) => (
                          <li key={subItem.id}>
                            <button
                              onClick={() => handleMenuItemClick(subItem.href)}
                              className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-all duration-200 group text-left ${
                                currentPage === subItem.id
                                  ? `border`
                                  : 'text-white/70 hover:bg-white/5 hover:text-white/90'
                              }`}
                              style={currentPage === subItem.id ? {
                                background: `${roleConfig.badgeColor}20`,
                                color: roleConfig.badgeColor,
                                borderColor: `${roleConfig.badgeColor}30`
                              } : {}}
                            >
                              <span className={currentPage === subItem.id ? '' : 'text-white/50 group-hover:text-white/70'}>
                                {subItem.icon}
                              </span>
                              <span className={`${getClass('body')} text-sm font-medium`}>
                                {subItem.label}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </li>
                );
              }


              // Handle Activities menu item specially
              if (item.id === 'admin/activities') {
                return (
                  <li key={item.id}>
                    {/* Main Activities Button */}
                    <button
                      onClick={handleActivitiesToggle}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${
                        isActivitiesPageActive(currentPage)
                          ? `text-white shadow-lg`
                          : 'text-white/80 hover:bg-white/10 hover:text-white'
                      }`}
                      style={isActivitiesPageActive(currentPage) ? {
                        background: `linear-gradient(135deg, ${roleConfig.gradientFrom}, ${roleConfig.gradientTo})`
                      } : {}}
                    >
                      <div className="flex items-center space-x-3 text-left">
                        <span className={isActivitiesPageActive(currentPage) ? 'text-white' : 'text-white/60 group-hover:text-white'}>
                          {item.icon}
                        </span>
                        <span className={`${getClass('body')} font-medium text-left`}>
                          {item.label}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {/* Expand/Collapse Icon */}
                        <span className={`transition-transform duration-200 ${
                          isActivitiesPageActive(currentPage) ? 'text-white' : 'text-white/60 group-hover:text-white'
                        } ${isActivitiesExpanded ? 'rotate-0' : '-rotate-90'}`}>
                          {isActivitiesExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </span>
                      </div>
                    </button>

                    {/* Activities Submenu Items */}
                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      isActivitiesExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    }`}>
                      <ul className="mt-2 space-y-1 ml-4">
                        {activitiesSubmenuItems.map((subItem) => (
                          <li key={subItem.id}>
                            <button
                              onClick={() => handleMenuItemClick(subItem.href)}
                              className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-all duration-200 group text-left ${
                                currentPage === subItem.id
                                  ? `border`
                                  : 'text-white/70 hover:bg-white/5 hover:text-white/90'
                              }`}
                              style={currentPage === subItem.id ? {
                                background: `${roleConfig.badgeColor}20`,
                                color: roleConfig.badgeColor,
                                borderColor: `${roleConfig.badgeColor}30`
                              } : {}}
                            >
                              <span className={currentPage === subItem.id ? '' : 'text-white/50 group-hover:text-white/70'}>
                                {subItem.icon}
                              </span>
                              <span className={`${getClass('body')} text-sm font-medium`}>
                                {subItem.label}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </li>
                );
              }

              // Handle Articles menu item specially
              if (item.id === 'admin/articles') {
                return (
                  <li key={item.id}>
                    {/* Main Articles Button */}
                    <button
                      onClick={handleArticlesToggle}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${
                        isArticlesPageActive(currentPage)
                          ? `text-white shadow-lg`
                          : 'text-white/80 hover:bg-white/10 hover:text-white'
                      }`}
                      style={isArticlesPageActive(currentPage) ? {
                        background: `linear-gradient(135deg, ${roleConfig.gradientFrom}, ${roleConfig.gradientTo})`
                      } : {}}
                    >
                      <div className="flex items-center space-x-3 text-left">
                        <span className={isArticlesPageActive(currentPage) ? 'text-white' : 'text-white/60 group-hover:text-white'}>
                          {item.icon}
                        </span>
                        <span className={`${getClass('body')} font-medium text-left`}>
                          {item.label}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {/* Expand/Collapse Icon */}
                        <span className={`transition-transform duration-200 ${
                          isArticlesPageActive(currentPage) ? 'text-white' : 'text-white/60 group-hover:text-white'
                        } ${isArticlesExpanded ? 'rotate-0' : '-rotate-90'}`}>
                          {isArticlesExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </span>
                      </div>
                    </button>

                    {/* Articles Submenu Items */}
                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      isArticlesExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    }`}>
                      <ul className="mt-2 space-y-1 ml-4">
                        {articlesSubmenuItems.map((subItem) => (
                          <li key={subItem.id}>
                            <button
                              onClick={() => handleMenuItemClick(subItem.href)}
                              className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-all duration-200 group text-left ${
                                currentPage === subItem.id
                                  ? `border`
                                  : 'text-white/70 hover:bg-white/5 hover:text-white/90'
                              }`}
                              style={currentPage === subItem.id ? {
                                background: `${roleConfig.badgeColor}20`,
                                color: roleConfig.badgeColor,
                                borderColor: `${roleConfig.badgeColor}30`
                              } : {}}
                            >
                              <span className={currentPage === subItem.id ? '' : 'text-white/50 group-hover:text-white/70'}>
                                {subItem.icon}
                              </span>
                              <span className={`${getClass('body')} text-sm font-medium`}>
                                {subItem.label}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </li>
                );
              }

              // Regular menu items
              return (
                <li key={item.id}>
                  <button
                    onClick={() => handleMenuItemClick(item.href, !!item.badge)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${
                      currentPage === item.id
                        ? `text-white shadow-lg`
                        : 'text-white/80 hover:bg-white/10 hover:text-white'
                    }`}
                    style={currentPage === item.id ? {
                      background: `linear-gradient(135deg, ${roleConfig.gradientFrom}, ${roleConfig.gradientTo})`
                    } : {}}
                  >
                    <div className="flex items-center space-x-3 text-left">
                      <span className={currentPage === item.id ? 'text-white' : 'text-white/60 group-hover:text-white'}>
                        {item.icon}
                      </span>
                      <span className={`${getClass('body')} font-medium text-left`}>
                        {item.label}
                      </span>
                    </div>
                    
                    {/* Badge */}
                    {item.badge && (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getBadgeStyles(item.badge.color)}`}>
                        {item.badge.text}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-6 border-t border-white/20 rounded-b-2xl" style={{ borderColor: roleConfig.borderColor }}>
          <button
            onClick={handleSignOut}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/20 transition-all duration-200 ${getClass('body')}`}
          >
            <LogOut size={20} />
            <span className="font-medium">{currentContent.signOut}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DynamicRoleSidebar;
