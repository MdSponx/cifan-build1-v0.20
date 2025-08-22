import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTypography } from '../../utils/typography';
import { VideoUrlService } from '../../services/videoUrlService';
import UnifiedVideoPlayer from '../ui/UnifiedVideoPlayer';
import AnimatedButton from '../ui/AnimatedButton';

interface ApplicationData {
  filmTitle: string;
  files: {
    filmFile: {
      url: string;
      name: string;
      size: number;
    };
    posterFile?: {
      url: string;
      name: string;
      size: number;
    };
  };
  // URL submission fields
  filmUrl?: string;
  filmSubmissionType?: 'file' | 'youtube' | 'vimeo';
  filmUrlMetadata?: {
    platform: 'youtube' | 'vimeo';
    videoId: string;
    isValid: boolean;
  };
  duration: number;
  status: 'draft' | 'submitted';
}

interface VideoSectionProps {
  application: ApplicationData;
  isEditMode: boolean;
  canEdit: boolean;
}

const VideoSection: React.FC<VideoSectionProps> = ({ 
  application, 
  isEditMode, 
  canEdit 
}) => {
  const { i18n } = useTranslation();
  const { getClass } = useTypography();
  const currentLanguage = i18n.language as 'en' | 'th';

  const handleVideoReplace = () => {
    // TODO: Implement video replacement functionality
    console.log('Replace video clicked');
  };

  // Determine video source and type
  const getVideoProps = () => {
    // Check if it's a URL submission (YouTube/Vimeo)
    if (application.filmSubmissionType && 
        (application.filmSubmissionType === 'youtube' || application.filmSubmissionType === 'vimeo') &&
        application.filmUrl && 
        application.filmUrlMetadata?.isValid) {
      
      return {
        externalUrl: application.filmUrl,
        platform: application.filmUrlMetadata.platform,
        videoId: application.filmUrlMetadata.videoId
      };
    }
    
    // Default to file-based video
    if (application.files.filmFile.url) {
      return {
        videoUrl: application.files.filmFile.url,
        videoName: application.files.filmFile.name,
        videoSize: application.files.filmFile.size,
        posterUrl: application.files.posterFile?.url
      };
    }
    
    // No video available
    return {};
  };

  const videoProps = getVideoProps();

  return (
    <div className="glass-container rounded-2xl p-6 sm:p-8">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className={`text-xl ${getClass('header')} text-white flex items-center space-x-2`}>
          <span>🎬</span>
          <span>{currentLanguage === 'th' ? 'ภาพยนตร์' : 'Film'}</span>
        </h3>
        
        {/* Edit Mode Indicator */}
        {canEdit && isEditMode && (
          <div className="flex items-center space-x-2 px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-sm">
            <span>✏️</span>
            <span>{currentLanguage === 'th' ? 'โหมดแก้ไข' : 'Edit Mode'}</span>
          </div>
        )}
      </div>

      {/* Video Player Container */}
      <div className="relative">
        <UnifiedVideoPlayer
          {...videoProps}
          showControls={true}
          showDownload={true}
          showExternalLink={true}
          className="w-full"
        />

        {/* Edit Mode Overlay */}
        {canEdit && isEditMode && (videoProps.videoUrl || videoProps.externalUrl) && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300 rounded-xl">
            <AnimatedButton
              variant="primary"
              size="medium"
              icon="🎬"
              onClick={handleVideoReplace}
            >
              {currentLanguage === 'th' ? 'เปลี่ยนวิดีโอ' : 'Replace Video'}
            </AnimatedButton>
          </div>
        )}
      </div>

      {/* Video Information */}
      {(videoProps.videoUrl || videoProps.externalUrl) && (
        <div className="mt-4 p-4 bg-white/5 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            
            {/* Submission Type */}
            <div>
              <span className={`${getClass('body')} text-white/60`}>
                {currentLanguage === 'th' ? 'ประเภท:' : 'Type:'}
              </span>
              <p className={`${getClass('body')} text-white`}>
                {application.filmSubmissionType === 'youtube' && '📺 YouTube'}
                {application.filmSubmissionType === 'vimeo' && '🎬 Vimeo'}
                {(!application.filmSubmissionType || application.filmSubmissionType === 'file') && '📁 File Upload'}
              </p>
            </div>

            {/* Duration */}
            <div>
              <span className={`${getClass('body')} text-white/60`}>
                {currentLanguage === 'th' ? 'ความยาว:' : 'Duration:'}
              </span>
              <p className={`${getClass('body')} text-white`}>
                {application.duration} {currentLanguage === 'th' ? 'นาที' : 'minutes'}
              </p>
            </div>

            {/* File Size (for file uploads only) */}
            {videoProps.videoSize && (
              <div>
                <span className={`${getClass('body')} text-white/60`}>
                  {currentLanguage === 'th' ? 'ขนาดไฟล์:' : 'File Size:'}
                </span>
                <p className={`${getClass('body')} text-white`}>
                  {(videoProps.videoSize / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            )}

            {/* Video ID (for URL submissions only) */}
            {videoProps.videoId && (
              <div>
                <span className={`${getClass('body')} text-white/60`}>
                  {currentLanguage === 'th' ? 'รหัสวิดีโอ:' : 'Video ID:'}
                </span>
                <p className={`${getClass('body')} text-white font-mono text-xs`}>
                  {videoProps.videoId}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoSection;
