import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTypography } from '../../utils/typography';
import { VideoUrlService } from '../../services/videoUrlService';
import { 
  Download, 
  ExternalLink, 
  Copy, 
  Play, 
  FileVideo, 
  CheckCircle,
  AlertTriangle,
  XCircle
} from 'lucide-react';
import { FaYoutube, FaVimeoV } from 'react-icons/fa';

interface FileMetadata {
  downloadURL?: string;
  url?: string;
  fileName?: string;
  name?: string;
  fileSize?: number;
  size?: number;
  uploadedAt?: any;
}

interface VideoUrlData {
  url: string;
  platform: 'youtube' | 'vimeo';
  videoId: string;
  title?: string;
  duration?: number;
  thumbnailUrl?: string;
  submittedAt: any;
}

interface FilmSubmissionDisplayProps {
  // File submission data
  filmFile?: FileMetadata | null;
  
  // URL submission data
  filmUrl?: VideoUrlData | null;
  
  // Submission type
  filmSubmissionType: 'file' | 'youtube' | 'vimeo';
  
  // Display options
  showPlayer?: boolean;
  allowDownload?: boolean;
  className?: string;
}

const FilmSubmissionDisplay: React.FC<FilmSubmissionDisplayProps> = ({
  filmFile,
  filmUrl,
  filmSubmissionType,
  showPlayer = true,
  allowDownload = true,
  className = ''
}) => {
  const { i18n } = useTranslation();
  const { getClass } = useTypography();
  const currentLanguage = i18n.language as 'en' | 'th';

  const [copySuccess, setCopySuccess] = useState(false);

  const content = {
    th: {
      filmSubmission: 'การส่งภาพยนตร์',
      fileUpload: 'อัปโหลดไฟล์',
      youtubeLink: 'ลิงก์ YouTube',
      vimeoLink: 'ลิงก์ Vimeo',
      fileName: 'ชื่อไฟล์',
      fileSize: 'ขนาดไฟล์',
      uploadDate: 'วันที่อัปโหลด',
      videoUrl: 'URL วิดีโอ',
      videoId: 'รหัสวิดีโอ',
      platform: 'แพลตฟอร์ม',
      submitDate: 'วันที่ส่ง',
      downloadFile: 'ดาวน์โหลดไฟล์',
      copyUrl: 'คัดลอก URL',
      openExternal: 'เปิดในแพลตฟอร์ม',
      urlCopied: 'คัดลอก URL แล้ว',
      noSubmission: 'ไม่มีการส่งภาพยนตร์',
      fileAvailable: 'ไฟล์พร้อมใช้งาน',
      fileUnavailable: 'ไฟล์ไม่พร้อมใช้งาน',
      urlValid: 'URL ใช้งานได้',
      urlInvalid: 'URL ไม่ถูกต้อง'
    },
    en: {
      filmSubmission: 'Film Submission',
      fileUpload: 'File Upload',
      youtubeLink: 'YouTube Link',
      vimeoLink: 'Vimeo Link',
      fileName: 'File Name',
      fileSize: 'File Size',
      uploadDate: 'Upload Date',
      videoUrl: 'Video URL',
      videoId: 'Video ID',
      platform: 'Platform',
      submitDate: 'Submit Date',
      downloadFile: 'Download File',
      copyUrl: 'Copy URL',
      openExternal: 'Open in Platform',
      urlCopied: 'URL Copied',
      noSubmission: 'No film submitted',
      fileAvailable: 'File Available',
      fileUnavailable: 'File Unavailable',
      urlValid: 'URL Valid',
      urlInvalid: 'URL Invalid'
    }
  };

  const currentContent = content[currentLanguage];

  const formatFileSize = (bytes: number) => {
    if (!bytes || isNaN(bytes)) return '0 MB';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const formatDate = (date: any) => {
    if (!date) return '-';
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    return dateObj.toLocaleDateString(currentLanguage === 'th' ? 'th-TH' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleCopyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  };

  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getSubmissionTypeIcon = () => {
    switch (filmSubmissionType) {
      case 'file': return <FileVideo className="w-6 h-6 text-[#FCB283]" />;
      case 'youtube': return <FaYoutube className="w-6 h-6 text-red-500" />;
      case 'vimeo': return <FaVimeoV className="w-6 h-6 text-blue-500" />;
      default: return <FileVideo className="w-6 h-6 text-gray-400" />;
    }
  };

  const getSubmissionTypeLabel = () => {
    switch (filmSubmissionType) {
      case 'file': return currentContent.fileUpload;
      case 'youtube': return currentContent.youtubeLink;
      case 'vimeo': return currentContent.vimeoLink;
      default: return 'Unknown';
    }
  };

  const getStatusIcon = () => {
    if (filmSubmissionType === 'file') {
      const fileUrl = filmFile?.downloadURL || filmFile?.url;
      return fileUrl 
        ? <CheckCircle className="w-4 h-4 text-green-400" />
        : <XCircle className="w-4 h-4 text-red-400" />;
    } else {
      return filmUrl?.url 
        ? <CheckCircle className="w-4 h-4 text-green-400" />
        : <XCircle className="w-4 h-4 text-red-400" />;
    }
  };

  const getStatusText = () => {
    if (filmSubmissionType === 'file') {
      const fileUrl = filmFile?.downloadURL || filmFile?.url;
      return fileUrl ? currentContent.fileAvailable : currentContent.fileUnavailable;
    } else {
      return filmUrl?.url ? currentContent.urlValid : currentContent.urlInvalid;
    }
  };

  // No submission case
  if ((!filmFile || (!filmFile.downloadURL && !filmFile.url)) && !filmUrl) {
    return (
      <div className={`glass-card p-6 rounded-xl border border-gray-500/30 ${className}`}>
        <div className="text-center py-8">
          <XCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className={`${getClass('body')} text-gray-400`}>
            {currentContent.noSubmission}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`glass-card p-6 rounded-xl border border-white/10 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          {getSubmissionTypeIcon()}
          <div>
            <h4 className={`${getClass('subtitle')} text-white`}>
              {currentContent.filmSubmission}
            </h4>
            <p className={`text-sm ${getClass('body')} text-white/60`}>
              {getSubmissionTypeLabel()}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <span className={`text-sm ${getClass('body')} text-white/80`}>
            {getStatusText()}
          </span>
        </div>
      </div>

      {/* File Upload Display */}
      {filmSubmissionType === 'file' && filmFile && (filmFile.downloadURL || filmFile.url) && (
        <div className="space-y-4">
          {/* File Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-white/5 rounded-lg">
            <div>
              <label className={`text-sm ${getClass('body')} text-white/60`}>
                {currentContent.fileName}
              </label>
              <p className={`${getClass('body')} text-white`}>
                {filmFile.fileName || filmFile.name || 'Film file'}
              </p>
            </div>
            <div>
              <label className={`text-sm ${getClass('body')} text-white/60`}>
                {currentContent.fileSize}
              </label>
              <p className={`${getClass('body')} text-white`}>
                {formatFileSize(filmFile.fileSize || filmFile.size || 0)}
              </p>
            </div>
            {filmFile.uploadedAt && (
              <div className="md:col-span-2">
                <label className={`text-sm ${getClass('body')} text-white/60`}>
                  {currentContent.uploadDate}
                </label>
                <p className={`${getClass('body')} text-white`}>
                  {formatDate(filmFile.uploadedAt)}
                </p>
              </div>
            )}
          </div>

          {/* File Actions */}
          {allowDownload && (
            <div className="flex gap-3">
              <button
                onClick={() => handleDownload(
                  filmFile.downloadURL || filmFile.url || '', 
                  filmFile.fileName || filmFile.name || 'film'
                )}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>{currentContent.downloadFile}</span>
              </button>
              <button
                onClick={() => handleCopyUrl(filmFile.downloadURL || filmFile.url || '')}
                className="flex items-center space-x-2 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
              >
                <Copy className="w-4 h-4" />
                <span>{copySuccess ? currentContent.urlCopied : currentContent.copyUrl}</span>
              </button>
            </div>
          )}

          {/* Video Player */}
          {showPlayer && (
            <div className="mt-4">
              <video
                src={filmFile.downloadURL || filmFile.url}
                className="w-full aspect-video object-contain bg-black rounded-lg"
                controls
                preload="metadata"
              />
            </div>
          )}
        </div>
      )}

      {/* URL Submission Display */}
      {(filmSubmissionType === 'youtube' || filmSubmissionType === 'vimeo') && filmUrl && (
        <div className="space-y-4">
          {/* URL Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-white/5 rounded-lg">
            <div>
              <label className={`text-sm ${getClass('body')} text-white/60`}>
                {currentContent.platform}
              </label>
              <p className={`${getClass('body')} text-white capitalize`}>
                {filmUrl.platform}
              </p>
            </div>
            <div>
              <label className={`text-sm ${getClass('body')} text-white/60`}>
                {currentContent.videoId}
              </label>
              <p className={`${getClass('body')} text-white font-mono`}>
                {filmUrl.videoId}
              </p>
            </div>
            <div className="md:col-span-2">
              <label className={`text-sm ${getClass('body')} text-white/60`}>
                {currentContent.videoUrl}
              </label>
              <p className={`${getClass('body')} text-white break-all`}>
                {filmUrl.url}
              </p>
            </div>
            {filmUrl.submittedAt && (
              <div className="md:col-span-2">
                <label className={`text-sm ${getClass('body')} text-white/60`}>
                  {currentContent.submitDate}
                </label>
                <p className={`${getClass('body')} text-white`}>
                  {formatDate(filmUrl.submittedAt)}
                </p>
              </div>
            )}
          </div>

          {/* URL Actions */}
          <div className="flex gap-3">
            <a
              href={filmUrl.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-400 rounded-lg hover:from-blue-500/30 hover:to-purple-500/30 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span>{currentContent.openExternal}</span>
            </a>
            <button
              onClick={() => handleCopyUrl(filmUrl.url)}
              className="flex items-center space-x-2 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
            >
              <Copy className="w-4 h-4" />
              <span>{copySuccess ? currentContent.urlCopied : currentContent.copyUrl}</span>
            </button>
          </div>

          {/* Embedded Player */}
          {showPlayer && (
            <div className="mt-4">
              <iframe
                src={VideoUrlService.getEmbedUrl(filmUrl.platform, filmUrl.videoId)}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full aspect-video rounded-lg"
                title={`${filmUrl.platform} Video Player`}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FilmSubmissionDisplay;
