import React from 'react';
import { useTranslation } from 'react-i18next';
import { Edit3, FileText, Scale, LucideIcon } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useAdmin } from '../admin/AdminContext';
import { isEditorUser, isJuryUser } from '../../utils/userUtils';

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
  const { t } = useTranslation();
  const { userProfile } = useAuth();
  const { checkPermission } = useAdmin();

  // Don't render anything if no user profile
  if (!userProfile) return null;

  const handleMenuClick = () => {
    if (onMenuItemClick) {
      onMenuItemClick();
    }
  };

  return (
    <>
      {/* Editor-specific access */}
      {isEditorUser(userProfile) && checkPermission('canManageContent') && (
        <div className="role-section border-t border-white/20 pt-3 mt-3">
          <div className="role-header px-4 py-2 mb-2">
            <div className="flex items-center gap-2 text-[#4ECDC4]">
              <Edit3 size={16} />
              <span className="text-xs font-semibold uppercase tracking-wide">
                {t('menu.editorAccess')}
              </span>
            </div>
          </div>
          
          <MenuItem
            icon={Edit3}
            href="#admin/feature-films"
            tooltip={t('tooltips.contentManagement')}
            color="#4ECDC4"
            onClick={handleMenuClick}
          >
            {t('menu.contentManagement')}
          </MenuItem>
          
          <MenuItem
            icon={FileText}
            href="#admin/applications"
            tooltip={t('tooltips.filmLibrary')}
            color="#4ECDC4"
            onClick={handleMenuClick}
          >
            {t('menu.filmLibrary')}
          </MenuItem>
        </div>
      )}

      {/* Jury-specific access */}
      {isJuryUser(userProfile) && checkPermission('canRateSubmissions') && (
        <div className="role-section border-t border-white/20 pt-3 mt-3">
          <div className="role-header px-4 py-2 mb-2">
            <div className="flex items-center gap-2 text-[#45B7D1]">
              <Scale size={16} />
              <span className="text-xs font-semibold uppercase tracking-wide">
                {t('menu.juryAccess')}
              </span>
            </div>
          </div>
          
          <MenuItem
            icon={FileText}
            href="#admin/applications"
            tooltip={t('tooltips.filmLibrary')}
            color="#45B7D1"
            onClick={handleMenuClick}
          >
            {t('menu.filmLibrary')}
          </MenuItem>
          
          <MenuItem
            icon={Scale}
            href="#admin/scoring"
            tooltip={t('tooltips.ratingDashboard')}
            color="#45B7D1"
            onClick={handleMenuClick}
          >
            {t('menu.ratingDashboard')}
          </MenuItem>
        </div>
      )}
    </>
  );
};

export default RoleBasedMenuItems;
