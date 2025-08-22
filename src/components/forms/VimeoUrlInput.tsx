import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTypography } from '../../utils/typography';
import { VideoUrlService, VideoMetadata } from '../../services/videoUrlService';
import { ExternalLink, CheckCircle, AlertTriangle, Loader } from 'lucide-react';

interface VimeoUrlInputProps {
  url: string;
  onUrlChange: (url: string) => void;
  onMetadataExtracted: (metadata: VideoMetadata | null) => void;
  error?: string;
  className?: string;
}

const VimeoUrlInput: React.FC<VimeoUrlInputProps> = ({
  url,
  onUrlChange,
  onMetadataExtracted,
  error,
  className = ''
}) => {
  const { i18n } = useTranslation();
  const { getClass } = useTypography();
  const currentLanguage = i18n.language as 'en' | 'th';

  const [isValidating, setIsValidating] = useState(false);
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [validationError, setValidationError] = useState<string>('');

  const content = {
    th: {
      placeholder: 'วาง Vimeo URL ที่นี่...',
      examples: 'ตัวอย่าง: https://vimeo.com/123456789',
      validating: 'กำลังตรวจสอบ...',
      validUrl: 'URL ถูกต้อง',
      invalidUrl: 'URL ไม่ถูกต้อง',
      requirements: 'ข้อกำหนด:',
      requirementsList: [
        'วิดีโอต้องสามารถเข้าถึงได้สาธารณะ',
        'ไม่รองรับวิดีโอที่มีรหัสผ่าน',
        'URL ต้องเป็น Vimeo เท่านั้น'
      ],
      openInVimeo: 'เปิดใน Vimeo',
      videoPreview: 'ตัวอย่างวิดีโอ'
    },
    en: {
      placeholder: 'Paste Vimeo URL here...',
      examples: 'Example: https://vimeo.com/123456789',
      validating: 'Validating...',
      validUrl: 'Valid URL',
      invalidUrl: 'Invalid URL',
      requirements: 'Requirements:',
      requirementsList: [
        'Video must be publicly accessible',
        'Password-protected videos are not supported',
        'Only Vimeo URLs are accepted'
      ],
      openInVimeo: 'Open in Vimeo',
      videoPreview: 'Video Preview'
    }
  };

  const currentContent = content[currentLanguage];

  // Debounced validation
  useEffect(() => {
    if (!url.trim()) {
      setMetadata(null);
      setValidationError('');
      onMetadataExtracted(null);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsValidating(true);
      setValidationError('');

      try {
        const result = await VideoUrlService.validateAndExtractMetadata(url);
        
        if (result.platform !== 'vimeo') {
          const errorMsg = currentLanguage === 'th' 
            ? 'กรุณาใช้ Vimeo URL เท่านั้น' 
            : 'Please use Vimeo URLs only';
          setValidationError(errorMsg);
          setMetadata(null);
          onMetadataExtracted(null);
        } else {
          setMetadata(result);
          onMetadataExtracted(result);
          if (!result.isValid) {
            setValidationError(result.error || 'Invalid URL');
          }
        }
      } catch (error) {
        const errorMsg = currentLanguage === 'th' 
          ? 'เกิดข้อผิดพลาดในการตรวจสอบ URL' 
          : 'Error validating URL';
        setValidationError(errorMsg);
        setMetadata(null);
        onMetadataExtracted(null);
      } finally {
        setIsValidating(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [url, currentLanguage, onMetadataExtracted]);

  const getValidationIcon = () => {
    if (isValidating) {
      return <Loader className="w-4 h-4 text-blue-400 animate-spin" />;
    }
    if (validationError || error) {
      return <AlertTriangle className="w-4 h-4 text-red-400" />;
    }
    if (metadata?.isValid) {
      return <CheckCircle className="w-4 h-4 text-green-400" />;
    }
    return null;
  };

  const getValidationMessage = () => {
    if (isValidating) {
      return currentContent.validating;
    }
    if (error) {
      return error;
    }
    if (validationError) {
      return validationError;
    }
    if (metadata?.isValid) {
      return currentContent.validUrl;
    }
    return '';
  };

  const getValidationColor = () => {
    if (isValidating) return 'text-blue-400';
    if (validationError || error) return 'text-red-400';
    if (metadata?.isValid) return 'text-green-400';
    return 'text-white/60';
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* URL Input */}
      <div className="relative">
        <div className="flex items-center space-x-2 mb-2">
          <span className="text-2xl">🎬</span>
          <label className={`block text-white/90 ${getClass('body')}`}>
            Vimeo URL <span className="text-red-400">*</span>
          </label>
        </div>
        
        <div className="relative">
          <input
            type="url"
            value={url}
            onChange={(e) => onUrlChange(e.target.value)}
            placeholder={currentContent.placeholder}
            className={`w-full p-3 pr-10 rounded-lg bg-white/10 border ${
              error || validationError 
                ? 'border-red-400' 
                : metadata?.isValid 
                  ? 'border-green-400' 
                  : 'border-white/20'
            } text-white placeholder-white/50 focus:border-[#FCB283] focus:outline-none transition-colors`}
          />
          
          {/* Validation Icon */}
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {getValidationIcon()}
          </div>
        </div>

        {/* Validation Message */}
        {getValidationMessage() && (
          <p className={`text-sm mt-2 ${getValidationColor()}`}>
            {getValidationMessage()}
          </p>
        )}

        {/* Examples */}
        <p className={`text-xs ${getClass('body')} text-white/60 mt-2`}>
          {currentContent.examples}
        </p>
      </div>

      {/* Video Preview - Debug: Show if we have videoId regardless of isValid flag */}
      {metadata?.videoId && (
        <div className="glass-card p-4 rounded-xl border border-green-400/30">
          <div className="flex items-center justify-between mb-3">
            <h4 className={`${getClass('subtitle')} text-white flex items-center space-x-2`}>
              <span>🎬</span>
              <span>{currentContent.videoPreview}</span>
            </h4>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1 px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors text-sm"
            >
              <ExternalLink className="w-3 h-3" />
              <span>{currentContent.openInVimeo}</span>
            </a>
          </div>

          {/* Embedded Preview */}
          <div className="relative bg-black rounded-lg overflow-hidden">
            <iframe
              src={VideoUrlService.getEmbedUrl('vimeo', metadata.videoId)}
              frameBorder="0"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              className="w-full aspect-video"
              title="Vimeo Video Preview"
            />
          </div>

          {/* Video Info */}
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/60">Video ID:</span>
              <span className="text-white font-mono">{metadata.videoId}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/60">Platform:</span>
              <span className="text-white">Vimeo</span>
            </div>
          </div>
        </div>
      )}

      {/* Requirements */}
      <div className="glass-card p-4 rounded-xl border border-blue-400/30">
        <h4 className={`${getClass('subtitle')} text-blue-400 mb-3`}>
          {currentContent.requirements}
        </h4>
        <ul className="space-y-2">
          {currentContent.requirementsList.map((requirement, index) => (
            <li key={index} className={`text-sm ${getClass('body')} text-white/80 flex items-start space-x-2`}>
              <span className="text-blue-400 mt-0.5">•</span>
              <span>{requirement}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default VimeoUrlInput;
