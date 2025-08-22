import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTypography } from '../../utils/typography';
import { VideoMetadata } from '../../services/videoUrlService';
import UnifiedFileUpload from './UnifiedFileUpload';
import YouTubeUrlInput from './YouTubeUrlInput';
import VimeoUrlInput from './VimeoUrlInput';
import { FaYoutube, FaVimeoV } from 'react-icons/fa';
import { FiFolder } from 'react-icons/fi';

export type FilmSubmissionType = 'file' | 'youtube' | 'vimeo';

interface FilmSubmissionSelectorProps {
  submissionType: FilmSubmissionType;
  onSubmissionTypeChange: (type: FilmSubmissionType) => void;
  
  // File upload props
  filmFile: File | null;
  onFileChange: (file: File | null) => void;
  
  // URL props
  filmUrl: string;
  onUrlChange: (url: string) => void;
  onMetadataExtracted: (metadata: VideoMetadata | null) => void;
  
  // Error handling
  error?: string;
  className?: string;
}

const FilmSubmissionSelector: React.FC<FilmSubmissionSelectorProps> = ({
  submissionType,
  onSubmissionTypeChange,
  filmFile,
  onFileChange,
  filmUrl,
  onUrlChange,
  onMetadataExtracted,
  error,
  className = ''
}) => {
  const { i18n } = useTranslation();
  const { getClass } = useTypography();
  const currentLanguage = i18n.language as 'en' | 'th';

  const content = {
    th: {
      title: 'วิธีการส่งภาพยนตร์',
      subtitle: 'เลือกวิธีการส่งภาพยนตร์ของคุณ',
      fileOption: {
        title: 'อัปโหลดไฟล์ภาพยนตร์',
        description: 'อัปโหลดไฟล์ MP4 หรือ MOV โดยตรงไปยังเซิร์ฟเวอร์ของเรา (สูงสุด 500MB)'
      },
      youtubeOption: {
        title: 'ลิงก์ YouTube',
        description: 'แชร์ลิงก์วิดีโอ YouTube ของคุณ (ต้องเป็น Public หรือ Unlisted)'
      },
      vimeoOption: {
        title: 'ลิงก์ Vimeo',
        description: 'แชร์ลิงก์วิดีโอ Vimeo ของคุณ (ต้องสามารถเข้าถึงได้สาธารณะ)'
      }
    },
    en: {
      title: 'Film Submission Method',
      subtitle: 'Choose how you want to submit your film',
      fileOption: {
        title: 'Upload Film File',
        description: 'Upload MP4 or MOV file directly to our server (max 500MB)'
      },
      youtubeOption: {
        title: 'YouTube Link',
        description: 'Share your YouTube video URL (must be public or unlisted)'
      },
      vimeoOption: {
        title: 'Vimeo Link',
        description: 'Share your Vimeo video URL (must be publicly accessible)'
      }
    }
  };

  const currentContent = content[currentLanguage];

  const getOptionCardClass = (optionType: FilmSubmissionType) => {
    const baseClass = "option-card cursor-pointer p-4 rounded-lg border-2 transition-all duration-200 hover:border-[#FCB283]/50";
    const selectedClass = submissionType === optionType 
      ? "border-[#FCB283] bg-[#FCB283]/10" 
      : "border-white/20 bg-white/5 hover:bg-white/10";
    
    return `${baseClass} ${selectedClass}`;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center">
        <h3 className={`text-xl ${getClass('header')} text-white mb-2`}>
          {currentContent.title}
        </h3>
        <p className={`${getClass('body')} text-white/80`}>
          {currentContent.subtitle}
        </p>
      </div>

      {/* Radio Button Options */}
      <div className="submission-options space-y-4">
        
        {/* File Upload Option */}
        <div className={getOptionCardClass('file')}>
          <label className="flex items-start space-x-3 cursor-pointer">
            <input
              type="radio"
              value="file"
              checked={submissionType === 'file'}
              onChange={(e) => onSubmissionTypeChange(e.target.value as FilmSubmissionType)}
              className="mt-1 w-4 h-4 text-[#FCB283] bg-transparent border-white/40 focus:ring-[#FCB283] focus:ring-2"
            />
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <FiFolder className="text-xl text-[#FCB283]" />
                <span className={`font-semibold ${getClass('subtitle')} text-white`}>
                  {currentContent.fileOption.title}
                </span>
              </div>
              <p className={`text-sm ${getClass('body')} text-white/70`}>
                {currentContent.fileOption.description}
              </p>
            </div>
          </label>
        </div>

        {/* YouTube Option */}
        <div className={getOptionCardClass('youtube')}>
          <label className="flex items-start space-x-3 cursor-pointer">
            <input
              type="radio"
              value="youtube"
              checked={submissionType === 'youtube'}
              onChange={(e) => onSubmissionTypeChange(e.target.value as FilmSubmissionType)}
              className="mt-1 w-4 h-4 text-[#FCB283] bg-transparent border-white/40 focus:ring-[#FCB283] focus:ring-2"
            />
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <FaYoutube className="text-xl text-red-500" />
                <span className={`font-semibold ${getClass('subtitle')} text-white`}>
                  {currentContent.youtubeOption.title}
                </span>
              </div>
              <p className={`text-sm ${getClass('body')} text-white/70`}>
                {currentContent.youtubeOption.description}
              </p>
            </div>
          </label>
        </div>

        {/* Vimeo Option */}
        <div className={getOptionCardClass('vimeo')}>
          <label className="flex items-start space-x-3 cursor-pointer">
            <input
              type="radio"
              value="vimeo"
              checked={submissionType === 'vimeo'}
              onChange={(e) => onSubmissionTypeChange(e.target.value as FilmSubmissionType)}
              className="mt-1 w-4 h-4 text-[#FCB283] bg-transparent border-white/40 focus:ring-[#FCB283] focus:ring-2"
            />
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <FaVimeoV className="text-xl text-blue-500" />
                <span className={`font-semibold ${getClass('subtitle')} text-white`}>
                  {currentContent.vimeoOption.title}
                </span>
              </div>
              <p className={`text-sm ${getClass('body')} text-white/70`}>
                {currentContent.vimeoOption.description}
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* Conditional Input Based on Selection */}
      <div className="submission-input">
        {submissionType === 'file' && (
          <UnifiedFileUpload
            mode="upload"
            name="filmFile"
            label={currentLanguage === 'th' ? 'ไฟล์ภาพยนตร์' : 'Film File'}
            accept=".mp4,.mov"
            fileType="VIDEO"
            onFileChange={onFileChange}
            currentFile={filmFile}
            error={error}
          />
        )}

        {submissionType === 'youtube' && (
          <YouTubeUrlInput
            url={filmUrl}
            onUrlChange={onUrlChange}
            onMetadataExtracted={onMetadataExtracted}
            error={error}
          />
        )}

        {submissionType === 'vimeo' && (
          <VimeoUrlInput
            url={filmUrl}
            onUrlChange={onUrlChange}
            onMetadataExtracted={onMetadataExtracted}
            error={error}
          />
        )}
      </div>
    </div>
  );
};

export default FilmSubmissionSelector;
