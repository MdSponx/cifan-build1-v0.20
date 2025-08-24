import React from 'react';
import { useTranslation } from 'react-i18next';
import { Edit3, FileText, Scale, LucideIcon, BarChart3 } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useAdmin } from '../admin/AdminContext';

interface MenuItemProps {
  icon: LucideIcon;
  href: string;
  tooltip: string;
  children: React.ReactNode;
  color: string;
  onClick?: () => void;
}

const MenuItem: React.FC<MenuItemProps> = ({ 
  icon: Icon, 
  href, 
  tooltip, 
  children, 
  color,
  onClick 
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onClick) {
      onClick();
    } else {
      window.location.hash = href;
    }
  };

  return (
    <div className="relative group">
      <button
        onClick={handleClick}
        className="w-full text-left px-4 py-3 text-white hover:bg-white/10 rounded-lg transition-all duration-300 flex items-center gap-3 group-hover:scale-105"
        title={tooltip}
        aria-label={tooltip}
      >
        <Icon size={18} className="flex-shrink-0" style={{ color }} />
        <span className="text-sm font-medium">{children}</span>
      </button>
      
      {/* Tooltip */}
      <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-black/90 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
        {tooltip}
      </div>
    </div>
  );
};

interface RoleBasedMenuItemsProps {
  onMenuItemClick?: () => void;
}

const RoleBasedMenuItems: React.FC<RoleBasedMenuItemsProps> = ({ onMenuItemClick }) => {
  const { i18n } = useTranslation();
  const { user, userProfile } = useAuth();
  const { checkPermission } = useAdmin();
  
  const currentLanguage = i18n.language as 'en' | 'th';

  // Don't render anything if no user profile
  if (!userProfile || !user?.emailVerified) return null;

  const handleMenuClick = () => {
    if (onMenuItemClick) {
      onMenuItemClick();
    }
  };

  const menuItems = [];

  // Editor Zone Access
  if (userProfile.role === 'editor') {
    menuItems.push(
      <button 
        key="editor-zone"
        onClick={() => {
          handleMenuClick();
          window.location.hash = '#admin/dashboard';
        }}
        className="w-full text-left px-4 py-2 text-white hover:bg-white/10 rounded-lg transition-colors flex items-center gap-2 border-l-2 border-[#4ECDC4]"
      >
        <Edit3 size={16} style={{ color: '#4ECDC4' }} />
        {currentLanguage === 'th' ? 'พื้นที่บรรณาธิการ' : 'Editor Zone'}
      </button>
    );
  }

  // Jury Zone Access
  if (userProfile.role === 'jury') {
    menuItems.push(
      <button 
        key="jury-zone"
        onClick={() => {
          handleMenuClick();
          window.location.hash = '#admin/dashboard';
        }}
        className="w-full text-left px-4 py-2 text-white hover:bg-white/10 rounded-lg transition-colors flex items-center gap-2 border-l-2 border-[#9B59B6]"
      >
        <Scale size={16} style={{ color: '#9B59B6' }} />
        {currentLanguage === 'th' ? 'พื้นที่คณะกรรมการ' : 'Jury Zone'}
      </button>
    );
  }

  return menuItems.length > 0 ? <>{menuItems}</> : null;
};

export default RoleBasedMenuItems;
