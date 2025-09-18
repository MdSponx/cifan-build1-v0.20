import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTypography } from '../../utils/typography';
import { AdminApplicationCard as AdminApplicationCardType } from '../../types/admin.types';
import { Eye, Edit, Star, CheckCircle, XCircle, AlertCircle, Clock, MoreHorizontal } from 'lucide-react';

interface AdminApplicationTableViewProps {
  applications: AdminApplicationCardType[];
  onView: (id: string) => void;
  onEdit?: (id: string) => void;
  isSelected?: (id: string) => boolean;
  onSelect?: (id: string, selected: boolean) => void;
  showBulkSelect?: boolean;
  startIndex?: number; // For pagination numbering
}

const AdminApplicationTableView: React.FC<AdminApplicationTableViewProps> = ({
  applications,
  onView,
  onEdit,
  isSelected = () => false,
  onSelect,
  showBulkSelect = false,
  startIndex = 0
}) => {
  const { i18n } = useTranslation();
  const { getClass } = useTypography();
  const currentLanguage = i18n.language as 'en' | 'th';
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

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
      draft: { 
        color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', 
        icon: <Edit className="w-3 h-3" />,
        label: currentLanguage === 'th' ? 'ร่าง' : 'Draft'
      },
      submitted: { 
        color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', 
        icon: <Clock className="w-3 h-3" />,
        label: currentLanguage === 'th' ? 'ส่งแล้ว' : 'Submitted'
      },
      'under-review': { 
        color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', 
        icon: <AlertCircle className="w-3 h-3" />,
        label: currentLanguage === 'th' ? 'กำลังพิจารณา' : 'Under Review'
      },
      accepted: { 
        color: 'bg-green-500/20 text-green-400 border-green-500/30', 
        icon: <CheckCircle className="w-3 h-3" />,
        label: currentLanguage === 'th' ? 'ผ่าน' : 'Accepted'
      },
      rejected: { 
        color: 'bg-red-500/20 text-red-400 border-red-500/30', 
        icon: <XCircle className="w-3 h-3" />,
        label: currentLanguage === 'th' ? 'ไม่ผ่าน' : 'Rejected'
      }
    };
    return badges[status as keyof typeof badges] || badges.submitted;
  };

  const handleImageError = (applicationId: string) => {
    setImageErrors(prev => new Set([...prev, applicationId]));
  };

  const content = {
    th: {
      number: "ลำดับ",
      poster: "โปสเตอร์",
      title: "ชื่อภาพยนตร์",
      director: "ผู้กำกับ",
      category: "หมวดหมู่",
      averageScore: "คะแนนเฉลี่ย",
      status: "สถานะ",
      actions: "การดำเนินการ",
      view: "ดู",
      edit: "แก้ไข",
      noScore: "ไม่มีคะแนน",
      youth: "เยาวชน",
      future: "อนาคต",
      world: "โลก"
    },
    en: {
      number: "No.",
      poster: "Poster",
      title: "Title",
      director: "Director",
      category: "Category",
      averageScore: "Average Score",
      status: "Status",
      actions: "Actions",
      view: "View",
      edit: "Edit",
      noScore: "No Score",
      youth: "Youth",
      future: "Future",
      world: "World"
    }
  };

  const currentContent = content[currentLanguage];

  const getCategoryName = (category: string) => {
    const names = {
      youth: currentContent.youth,
      future: currentContent.future,
      world: currentContent.world
    };
    return names[category as keyof typeof names] || category;
  };

  return (
    <div className="glass-container rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          {/* Table Header */}
          <thead className="bg-white/5 border-b border-white/10">
            <tr>
              {showBulkSelect && (
                <th className="px-4 py-4 text-left">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-[#FCB283] bg-white/10 border-white/20 rounded focus:ring-[#FCB283] focus:ring-2"
                    onChange={(e) => {
                      applications.forEach(app => {
                        onSelect?.(app.id, e.target.checked);
                      });
                    }}
                  />
                </th>
              )}
              <th className={`px-3 py-4 text-center ${getClass('subtitle')} text-white/90 font-medium w-16`}>
                {currentContent.number}
              </th>
              <th className={`px-4 py-4 text-left ${getClass('subtitle')} text-white/90 font-medium`}>
                {currentContent.poster}
              </th>
              <th className={`px-4 py-4 text-left ${getClass('subtitle')} text-white/90 font-medium`}>
                {currentContent.title}
              </th>
              <th className={`px-4 py-4 text-left ${getClass('subtitle')} text-white/90 font-medium`}>
                {currentContent.director}
              </th>
              <th className={`px-4 py-4 text-left ${getClass('subtitle')} text-white/90 font-medium`}>
                {currentContent.category}
              </th>
              <th className={`px-4 py-4 text-center ${getClass('subtitle')} text-white/90 font-medium`}>
                {currentContent.averageScore}
              </th>
              <th className={`px-4 py-4 text-center ${getClass('subtitle')} text-white/90 font-medium`}>
                {currentContent.status}
              </th>
              <th className={`px-4 py-4 text-center ${getClass('subtitle')} text-white/90 font-medium`}>
                {currentContent.actions}
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-white/10">
            {applications.map((application, index) => {
              const statusBadge = getStatusBadge(application.status);
              const displayTitle = currentLanguage === 'th' && application.filmTitleTh 
                ? application.filmTitleTh 
                : application.filmTitle;
              const displayDirector = currentLanguage === 'th' && application.directorNameTh 
                ? application.directorNameTh 
                : application.directorName;

              return (
                <tr 
                  key={application.id}
                  className={`hover:bg-white/5 transition-colors cursor-pointer ${
                    isSelected(application.id) ? 'bg-[#FCB283]/10 ring-1 ring-[#FCB283]/30' : ''
                  }`}
                  onClick={() => onView(application.id)}
                >
                  {/* Bulk Select Checkbox */}
                  {showBulkSelect && (
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={isSelected(application.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          onSelect?.(application.id, e.target.checked);
                        }}
                        className="w-4 h-4 text-[#FCB283] bg-white/10 border-white/20 rounded focus:ring-[#FCB283] focus:ring-2"
                      />
                    </td>
                  )}

                  {/* Number */}
                  <td className="px-3 py-4 text-center">
                    <span className={`${getClass('body')} text-white/70 font-medium`}>
                      {(startIndex || 0) + index + 1}
                    </span>
                  </td>

                  {/* Poster */}
                  <td className="px-4 py-4">
                    <div className="w-12 h-16 relative overflow-hidden rounded-lg bg-white/5 flex-shrink-0">
                      {!imageErrors.has(application.id) && application.posterUrl ? (
                        <img
                          src={application.posterUrl}
                          alt={`${application.filmTitle} Poster`}
                          className="w-full h-full object-cover"
                          onError={() => handleImageError(application.id)}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-white/10">
                          <div className="text-center">
                            <div className="text-lg">🎬</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Title */}
                  <td className="px-4 py-4">
                    <div className="max-w-xs">
                      <h3 className={`${getClass('body')} text-white font-medium truncate`}>
                        {displayTitle}
                      </h3>
                      {application.filmTitleTh && currentLanguage === 'en' && (
                        <p className={`${getClass('caption')} text-white/60 text-sm truncate mt-1`}>
                          {application.filmTitleTh}
                        </p>
                      )}
                    </div>
                  </td>

                  {/* Director */}
                  <td className="px-4 py-4">
                    <div className="max-w-xs">
                      <p className={`${getClass('body')} text-white/90 truncate`}>
                        {displayDirector}
                      </p>
                      {application.directorNameTh && currentLanguage === 'en' && (
                        <p className={`${getClass('caption')} text-white/60 text-sm truncate mt-1`}>
                          {application.directorNameTh}
                        </p>
                      )}
                    </div>
                  </td>

                  {/* Category */}
                  <td className="px-4 py-4">
                    <div className="flex items-center space-x-2">
                      <img
                        src={getCategoryLogo(application.competitionCategory)}
                        alt={`${application.competitionCategory} logo`}
                        className="h-6 w-auto object-contain opacity-90"
                      />
                      <span className={`${getClass('body')} text-[#FCB283] font-medium capitalize`}>
                        {getCategoryName(application.competitionCategory)}
                      </span>
                    </div>
                  </td>

                  {/* Average Score */}
                  <td className="px-4 py-4 text-center">
                    {application.hasScores && application.averageScore ? (
                      <div className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-[#FCB283]/20 text-[#FCB283] border border-[#FCB283]/30">
                        <Star className="w-4 h-4 fill-current" />
                        <span className={`${getClass('body')} font-bold`}>
                          {application.averageScore.toFixed(1)}
                        </span>
                      </div>
                    ) : (
                      <span className={`${getClass('caption')} text-white/50 text-sm`}>
                        {currentContent.noScore}
                      </span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-4 text-center">
                    <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium border ${statusBadge.color}`}>
                      {statusBadge.icon}
                      <span>{statusBadge.label}</span>
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onView(application.id);
                        }}
                        className="flex items-center justify-center w-8 h-8 bg-blue-500/80 hover:bg-blue-600 rounded-lg text-white transition-colors"
                        title={currentContent.view}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      {onEdit && application.status === 'draft' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(application.id);
                          }}
                          className="flex items-center justify-center w-8 h-8 bg-orange-500/80 hover:bg-orange-600 rounded-lg text-white transition-colors"
                          title={currentContent.edit}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                      
                      {/* More actions button for future expansion */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Future: Show dropdown menu with more actions
                        }}
                        className="flex items-center justify-center w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg text-white/60 hover:text-white transition-colors"
                        title="More actions"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Empty State */}
        {applications.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-6">📄</div>
            <h2 className={`text-2xl ${getClass('header')} mb-4 text-white`}>
              {currentLanguage === 'th' ? 'ไม่พบใบสมัคร' : 'No Applications Found'}
            </h2>
            <p className={`${getClass('body')} text-white/80 max-w-md mx-auto`}>
              {currentLanguage === 'th' ? 'ไม่มีใบสมัครที่ตรงกับเงื่อนไขการค้นหา' : 'No applications match your search criteria'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminApplicationTableView;
