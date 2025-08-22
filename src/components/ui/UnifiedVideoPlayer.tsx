import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTypography } from '../../utils/typography';
import { VideoUrlService } from '../../services/videoUrlService';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  ExternalLink,
  Download,
  Copy,
  AlertTriangle
} from 'lucide-react';
import { FaYoutube, FaVimeoV } from 'react-icons/fa';

interface VideoPlayerProps {
  // File-based video
  videoUrl?: string;
  videoName?: string;
  videoSize?: number;
  posterUrl?: string;
  
  // URL-based video (YouTube/Vimeo)
  externalUrl?: string;
  platform?: 'youtube' | 'vimeo';
  videoId?: string;
  
  // Display options
  showControls?: boolean;
  showDownload?: boolean;
  showExternalLink?: boolean;
  autoPlay?: boolean;
  className?: string;
}

const UnifiedVideoPlayer: React.FC<VideoPlayerProps> = ({
  videoUrl,
  videoName,
  videoSize,
  posterUrl,
  externalUrl,
  platform,
  videoId,
  showControls = true,
  showDownload = true,
  showExternalLink = true,
  autoPlay = false,
  className = ''
}) => {
  const { i18n } = useTranslation();
  const { getClass } = useTypography();
  const currentLanguage = i18n.language as 'en' | 'th';

  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControlsOverlay, setShowControlsOverlay] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const content = {
    th: {
      play: 'เล่น',
      pause: 'หยุด',
      mute: 'ปิดเสียง',
      unmute: 'เปิดเสียง',
      fullscreen: 'เต็มจอ',
      download: 'ดาวน์โหลด',
      openExternal: 'เปิดในแพลตฟอร์ม',
      copyUrl: 'คัดลอก URL',
      urlCopied: 'คัดลอกแล้ว',
      videoError: 'ไม่สามารถโหลดวิดีโอได้',
      videoUnavailable: 'วิดีโอไม่พร้อมใช้งาน',
      fileSize: 'ขนาดไฟล์'
    },
    en: {
      play: 'Play',
      pause: 'Pause',
      mute: 'Mute',
      unmute: 'Unmute',
      fullscreen: 'Fullscreen',
      download: 'Download',
      openExternal: 'Open in Platform',
      copyUrl: 'Copy URL',
      urlCopied: 'Copied',
      videoError: 'Unable to load video',
      videoUnavailable: 'Video unavailable',
      fileSize: 'File Size'
    }
  };

  const currentContent = content[currentLanguage];

  // Auto-hide controls for file-based videos
  useEffect(() => {
    if (!videoUrl) return; // Only for file-based videos
    
    let timeout: NodeJS.Timeout;
    if (isPlaying && !isHovered) {
      timeout = setTimeout(() => {
        setShowControlsOverlay(false);
      }, 3000);
    } else {
      setShowControlsOverlay(true);
    }
    return () => clearTimeout(timeout);
  }, [isPlaying, isHovered, videoUrl]);

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes || isNaN(bytes)) return '0 MB';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
    setIsMuted(vol === 0);
    if (videoRef.current) {
      videoRef.current.volume = vol;
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const newMuted = !isMuted;
      setIsMuted(newMuted);
      videoRef.current.volume = newMuted ? 0 : volume;
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (!isFullscreen) {
        if (videoRef.current.requestFullscreen) {
          videoRef.current.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
      }
      setIsFullscreen(!isFullscreen);
    }
  };

  const handleDownload = () => {
    if (videoUrl && videoName) {
      const link = document.createElement('a');
      link.href = videoUrl;
      link.download = videoName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
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

  const handleVideoError = () => {
    setVideoError(true);
  };

  const getPlatformIcon = () => {
    if (platform === 'youtube') return <FaYoutube className="w-5 h-5 text-red-500" />;
    if (platform === 'vimeo') return <FaVimeoV className="w-5 h-5 text-blue-500" />;
    return null;
  };

  const getPlatformColor = () => {
    if (platform === 'youtube') return 'from-red-500/20 to-red-600/20 border-red-500/30';
    if (platform === 'vimeo') return 'from-blue-500/20 to-blue-600/20 border-blue-500/30';
    return 'from-gray-500/20 to-gray-600/20 border-gray-500/30';
  };

  // No video available
  if (!videoUrl && !externalUrl) {
    return (
      <div className={`glass-card rounded-xl p-8 text-center ${className}`}>
        <div className="text-6xl mb-4">🎬</div>
        <h3 className={`text-lg ${getClass('subtitle')} text-white/80 mb-2`}>
          {currentContent.videoUnavailable}
        </h3>
        <p className={`text-sm ${getClass('body')} text-white/60`}>
          {currentLanguage === 'th' ? 'ยังไม่ได้อัปโหลดวิดีโอ' : 'No video has been uploaded yet'}
        </p>
      </div>
    );
  }

  // External URL (YouTube/Vimeo) Player
  if (externalUrl && platform && videoId) {
    return (
      <div className={`glass-card rounded-xl overflow-hidden ${className}`}>
        {/* Platform Header */}
        <div className={`p-4 bg-gradient-to-r ${getPlatformColor()} border-b border-white/10`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getPlatformIcon()}
              <div>
                <h4 className={`${getClass('subtitle')} text-white`}>
                  {platform === 'youtube' ? 'YouTube' : 'Vimeo'} Video
                </h4>
                <p className={`text-xs ${getClass('body')} text-white/60`}>
                  ID: {videoId}
                </p>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              {showExternalLink && (
                <a
                  href={externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-sm text-white"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>{currentContent.openExternal}</span>
                </a>
              )}
              <button
                onClick={() => handleCopyUrl(externalUrl)}
                className="flex items-center space-x-1 px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-sm text-white"
              >
                <Copy className="w-3 h-3" />
                <span>{copySuccess ? currentContent.urlCopied : currentContent.copyUrl}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Embedded Player */}
        <div className="relative bg-black">
          <iframe
            src={VideoUrlService.getEmbedUrl(platform, videoId)}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full aspect-video"
            title={`${platform} Video Player`}
          />
        </div>
      </div>
    );
  }

  // File-based Video Player
  if (videoUrl) {
    return (
      <div className={`glass-card rounded-xl overflow-hidden ${className}`}>
        {/* Video Info Header */}
        {(videoName || videoSize) && (
          <div className="p-4 bg-gradient-to-r from-gray-500/20 to-gray-600/20 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div>
                {videoName && (
                  <h4 className={`${getClass('subtitle')} text-white`}>
                    {videoName}
                  </h4>
                )}
                {videoSize && (
                  <p className={`text-xs ${getClass('body')} text-white/60`}>
                    {currentContent.fileSize}: {formatFileSize(videoSize)}
                  </p>
                )}
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center space-x-2">
                {showDownload && (
                  <button
                    onClick={handleDownload}
                    className="flex items-center space-x-1 px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg transition-colors text-sm text-blue-400"
                  >
                    <Download className="w-3 h-3" />
                    <span>{currentContent.download}</span>
                  </button>
                )}
                <button
                  onClick={() => handleCopyUrl(videoUrl)}
                  className="flex items-center space-x-1 px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-sm text-white"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copySuccess ? currentContent.urlCopied : currentContent.copyUrl}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Video Player Container */}
        <div 
          className="relative bg-black group"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {videoError ? (
            <div className="w-full aspect-video flex flex-col items-center justify-center text-white/60">
              <AlertTriangle className="w-12 h-12 mb-4" />
              <div className="text-lg mb-2">{currentContent.videoError}</div>
              <div className="text-sm text-center px-4 max-w-md">
                {currentLanguage === 'th' 
                  ? 'ไฟล์วิดีโออาจเสียหายหรือไม่สามารถเข้าถึงได้' 
                  : 'The video file may be corrupted or inaccessible'}
              </div>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                src={videoUrl}
                poster={posterUrl}
                className="w-full aspect-video object-contain"
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onError={handleVideoError}
                autoPlay={autoPlay}
              />

              {/* Play Button Overlay */}
              {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <button
                    onClick={togglePlay}
                    className="w-16 h-16 rounded-full bg-[#FCB283]/80 hover:bg-[#FCB283] flex items-center justify-center text-white transition-all duration-300 hover:scale-110"
                  >
                    <Play className="w-6 h-6 ml-1" />
                  </button>
                </div>
              )}

              {/* Custom Controls */}
              {showControls && (
                <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300 ${showControlsOverlay ? 'opacity-100' : 'opacity-0'}`}>
                  
                  {/* Progress Bar */}
                  <div className="mb-4">
                    <input
                      type="range"
                      min="0"
                      max={duration || 0}
                      value={currentTime}
                      onChange={handleSeek}
                      className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #FCB283 0%, #FCB283 ${(currentTime / duration) * 100}%, rgba(255,255,255,0.2) ${(currentTime / duration) * 100}%, rgba(255,255,255,0.2) 100%)`
                      }}
                    />
                  </div>

                  {/* Control Buttons */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {/* Play/Pause Button */}
                      <button
                        onClick={togglePlay}
                        className="w-10 h-10 rounded-full bg-[#FCB283] hover:bg-[#AA4626] flex items-center justify-center text-white transition-colors"
                      >
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                      </button>

                      {/* Time Display */}
                      <div className={`text-white text-sm ${getClass('body')}`}>
                        {formatTime(currentTime)} / {formatTime(duration)}
                      </div>

                      {/* Volume Control */}
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={toggleMute}
                          className="text-white hover:text-[#FCB283] transition-colors"
                        >
                          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                        </button>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={isMuted ? 0 : volume}
                          onChange={handleVolumeChange}
                          className="w-16 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {/* Fullscreen Button */}
                      <button
                        onClick={toggleFullscreen}
                        className="text-white hover:text-[#FCB283] transition-colors p-2"
                      >
                        <Maximize className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  return null;
};

export default UnifiedVideoPlayer;
