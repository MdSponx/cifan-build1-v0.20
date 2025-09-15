import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTypography } from '../../utils/typography';
import { AdminApplicationCard as AdminApplicationCardType } from '../../types/admin.types';
import { Eye, Edit, Star, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface AdminApplicationListItemProps {
  application: AdminApplicationCardType;
  onView: (id: string) => void;
  onEdit?: (id: string) => void;
  isSelected?: boolean;
  onSelect?: (id: string, selected: boolean) => void;
  showBulkSelect?: boolean;
}

const AdminApplicationListItem: React.FC<AdminApplicationListItemProps> = ({
  application,
  onView,
  onEdit,
  isSelected = false,
  onSelect,
  showBulkSelect = false
}) => {
  const { i18n } = useTranslation();
  const { getClass } = useTypography();
  const currentLanguage = i18n.language as 'en' | 'th';
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const getCategoryLogo = (category: string) => {
    const logos = {
      youth: "https://firebasestorage.googleapis.com/v0/b/cifan-c41c6.firebasestorage.app/o/site_files%2Ffest_logos%2FGroup%202.png?alt=media&token=e8be419f-f0b2-4f64-8d7f-c3e8532e2689",
      future: "https://firebasestorage.googleapis.com/v0/b/cifan-c41c6.firebasestorage.app/o/site_files%2Ffest_logos%2FGroup%203.png?alt=media&token=b66cd708-0dc3-4c05-bc56-b2f99a384287",
      world: "https://firebasestorage.googleapis.com/v0/b/cifan-c41c6.firebasestorage.app/o/site_files%2Ffest_logos%2FGroup%204.png?alt=media&token=84ad0256-2322-4999-8e9f-d2f30c7afa67"
    };
    return logos[category as keyof typeof logos];
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      draft: { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: <Edit className="w-3 h-3" /> },
      submitted: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: <Clock className="w-3 h-3" /> },
      'under-review': { color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: <AlertCircle className="w-3 h-3" /> },
      accepted: { color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: <CheckCircle className="w-3 h-3" /> },
      rejected: { color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: <XCircle className="w-3 h-3" /> }
    };
    return badges[status as keyof typeof badges] || badges.submitted;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(currentLanguage === 'th' ? 'th-TH' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getCountryFlag = (country: string) => {
    const flags: { [key: string]: string } = {
      'Thailand': '🇹🇭',
      'Japan': '🇯🇵',
      'South Korea': '🇰🇷',
      'Singapore': '🇸🇬',
      'Malaysia': '🇲🇾',
      'Philippines': '🇵🇭',
      'Vietnam': '🇻🇳',
      'Indonesia': '🇮🇩',
      'Taiwan': '🇹🇼',
      'India': '🇮🇳',
      'Australia': '🇦🇺',
      'United States': '🇺🇸'
    };
    return flags[country] || '🌍';
  };

  const statusBadge = getStatusBadge(application.status);
  const displayTitle = currentLanguage === 'th' && application.filmTitleTh 
    ? application.filmTitleTh 
    : application.filmTitle;
  const displayDirector = currentLanguage === 'th' && application.directorNameTh 
    ? application.directorNameTh 
    : application.directorName;

  const handleCardClick = () => {
    onView(application.id);
  };

  return (
    <div 
      className={`group cursor-pointer relative ${isSelected ? 'ring-2 ring-[#FCB283]' : ''}`}
      onClick={handleCardClick}
    >
      {/* List Item Container */}
      <div className="relative overflow-hidden rounded-xl bg-white/5 border border-white/10 hover:border-[#FCB283]/50 transition-all duration-300 group-hover:shadow-lg">
        
        <div className="flex items-center p-4 gap-4">
          {/* Bulk Selection Checkbox */}
          {showBulkSelect && (
            <div className="flex-shrink-0">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={(e) => onSelect?.(application.id, e.target.checked)}
                onClick={(e) => e.stopPropagation()}
                className="w-4 h-4 text-[#FCB283] bg-white/10 border-white/20 rounded focus:ring-[#FCB283] focus:ring-2"
              />
            </div>
          )}

          {/* Poster Image */}
          <div className="flex-shrink-0 w-16 h-20 relative overflow-hidden rounded-lg bg-white/5">
            {!imageError ? (
              <img
                src={application.posterUrl}
                alt={`${application.filmTitle} Poster`}
                className={`w-full h-full object-cover transition-all duration-300 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-white/10">
                <div className="text-center">
                  <div className="text-lg">🎬</div>
                </div>
              </div>
            )}
            
            {/* Loading Skeleton */}
            {!imageLoaded && !imageError && (
              <div className="absolute inset-0 bg-white/10 animate-pulse"></div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              
              {/* Main Info */}
              <div className="flex-1 min-w-0">
                {/* Film Title */}
                <h3 className={`text-lg ${getClass('header')} text-white mb-1 truncate`}>
                  {displayTitle}
                </h3>
                
                {/* Director Name */}
                <p className={`text-sm ${getClass('subtitle')} text-white/90 mb-2 truncate`}>
                  {currentLanguage === 'th' ? 'ผู้กำกับ: ' : 'Director: '}{displayDirector}
                </p>
                
                {/* Category, Country, and Date */}
                <div className="flex items-center gap-4 text-xs text-white/70">
                  <div className="flex items-center gap-1">
                    <img
                      src={getCategoryLogo(application.competitionCategory)}
                      alt={`${application.competitionCategory} logo`}
                      className="h-4 w-auto object-contain opacity-90"
                    />
                    <span className={`${getClass('subtitle')} text-[#FCB283] capitalize`}>
                      {application.competitionCategory}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <span>{getCountryFlag(application.country)}</span>
                    <span>{application.country}</span>
                  </div>
                  
                  <span>
                    {application.status === 'submitted' && application.submittedAt
                      ? `${currentLanguage === 'th' ? 'ส่งเมื่อ' : 'Submitted'}: ${formatDate(application.submittedAt)}`
                      : `${currentLanguage === 'th' ? 'สร้างเมื่อ' : 'Created'}: ${formatDate(application.createdAt)}`
                    }
                  </span>
                </div>
              </div>

              {/* Status and Score */}
              <div className="flex-shrink-0 flex items-center gap-2">
                {/* Score Badge */}
                {application.hasScores && application.averageScore && (
                  <span className="inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium bg-[#FCB283]/20 text-[#FCB283] border border-[#FCB283]/30">
                    <Star className="w-3 h-3 fill-current" />
                    <span>{application.averageScore.toFixed(1)}</span>
                  </span>
                )}

                {/* Status Badge */}
                <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${statusBadge.color}`}>
                  {statusBadge.icon}
                  <span className="capitalize">
                    {application.status.replace('-', ' ')}
                  </span>
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onView(application.id);
                  }}
                  className="flex items-center justify-center px-3 py-2 bg-blue-500/80 hover:bg-blue-600 rounded-lg text-white transition-colors text-xs"
                  title={currentLanguage === 'th' ? 'ดูรายละเอียด' : 'View Details'}
                >
                  <Eye className="w-4 h-4" />
                </button>
                
                {onEdit && application.status === 'draft' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(application.id);
                    }}
                    className="flex items-center justify-center px-3 py-2 bg-orange-500/80 hover:bg-orange-600 rounded-lg text-white transition-colors"
                    title={currentLanguage === 'th' ? 'แก้ไข' : 'Edit'}
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminApplicationListItem;
