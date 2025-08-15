import React, { useState, useRef } from 'react';
import { Video, Upload, X, Play, Link, FileVideo } from 'lucide-react';
import { validateFileForUpload, formatFileSize, isVideoFile } from '../../utils/fileUpload';

interface TrailerUploadProps {
  file?: File;
  url?: string;
  onChange: (file?: File, url?: string) => void;
  error?: string;
  className?: string;
}

const TrailerUpload: React.FC<TrailerUploadProps> = ({
  file,
  url,
  onChange,
  error,
  className = ''
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'url'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    handleFileUpdate(selectedFile);
  };

  const handleFileUpdate = (selectedFile?: File) => {
    if (!selectedFile) {
      onChange(undefined, url);
      return;
    }

    // Validate file
    const validation = validateFileForUpload(selectedFile, 'VIDEO');
    if (!validation.isValid) {
      alert(validation.error);
      return;
    }

    onChange(selectedFile, undefined);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    const videoFile = files.find(file => isVideoFile(file));
    
    if (videoFile) {
      handleFileUpdate(videoFile);
    }
  };

  const handleRemoveFile = () => {
    onChange(undefined, url);
  };

  const handleUrlChange = (newUrl: string) => {
    // If there's a file, remove it when URL is set
    onChange(undefined, newUrl);
  };

  const handleRemoveUrl = () => {
    onChange(file, undefined);
  };

  const getVideoThumbnail = (videoUrl: string) => {
    // Extract YouTube thumbnail
    const youtubeMatch = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    if (youtubeMatch) {
      return `https://img.youtube.com/vi/${youtubeMatch[1]}/maxresdefault.jpg`;
    }

    // Extract Vimeo thumbnail (would need API call for real implementation)
    const vimeoMatch = videoUrl.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
      return `https://vumbnail.com/${vimeoMatch[1]}.jpg`;
    }

    return null;
  };

  const isYouTubeUrl = (url: string) => {
    return /(?:youtube\.com\/watch\?v=|youtu\.be\/)/.test(url);
  };

  const isVimeoUrl = (url: string) => {
    return /vimeo\.com\/\d+/.test(url);
  };

  const getVideoType = (url: string) => {
    if (isYouTubeUrl(url)) return 'YouTube';
    if (isVimeoUrl(url)) return 'Vimeo';
    return 'Video URL';
  };

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-white/90 mb-3">
        Movie Trailer
      </label>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-4 bg-white/5 rounded-lg p-1">
        <button
          type="button"
          onClick={() => setActiveTab('upload')}
          className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'upload'
              ? 'bg-gradient-to-r from-[#FCB283] to-[#AA4626] text-white'
              : 'text-white/70 hover:text-white hover:bg-white/10'
          }`}
        >
          <FileVideo className="w-4 h-4" />
          <span>Upload Video</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('url')}
          className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'url'
              ? 'bg-gradient-to-r from-[#FCB283] to-[#AA4626] text-white'
              : 'text-white/70 hover:text-white hover:bg-white/10'
          }`}
        >
          <Link className="w-4 h-4" />
          <span>Video URL</span>
        </button>
      </div>

      {/* Upload Tab */}
      {activeTab === 'upload' && (
        <div className="space-y-4">
          {file ? (
            /* File Selected */
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-r from-[#FCB283] to-[#AA4626] rounded-lg">
                    <Video className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-white font-medium">{file.name}</div>
                    <div className="text-white/60 text-sm">{formatFileSize(file.size)}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            /* Upload Area */
            <div
              className={`border-2 border-dashed rounded-xl p-8 transition-colors cursor-pointer ${
                dragOver
                  ? 'border-[#FCB283] bg-[#FCB283]/10'
                  : error
                  ? 'border-red-400'
                  : 'border-white/20 hover:border-white/40'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={handleFileSelect}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="text-center">
                <div className="text-4xl mb-4">🎬</div>
                <div className="text-white/80 text-lg mb-2">
                  Upload Trailer Video
                </div>
                <div className="text-white/60 text-sm mb-4">
                  Click to select video or drag and drop here
                </div>
                <div className="text-white/50 text-xs mb-4">
                  Supported: MP4, MOV, AVI, MKV (max 500MB)
                </div>
                <button
                  type="button"
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-[#FCB283] to-[#AA4626] text-white rounded-lg hover:shadow-lg transition-all mx-auto"
                >
                  <Upload className="w-5 h-5" />
                  <span>Select Video File</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* URL Tab */}
      {activeTab === 'url' && (
        <div className="space-y-4">
          {url ? (
            /* URL Set */
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-r from-[#FCB283] to-[#AA4626] rounded-lg">
                    <Play className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-white font-medium">{getVideoType(url)}</div>
                    <div className="text-white/60 text-sm break-all">{url}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveUrl}
                  className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Video Preview */}
              {getVideoThumbnail(url) && (
                <div className="relative rounded-lg overflow-hidden bg-black" style={{ aspectRatio: '16/9' }}>
                  <img
                    src={getVideoThumbnail(url)}
                    alt="Video thumbnail"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="p-3 bg-black/50 rounded-full">
                      <Play className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* URL Input */
            <div className="space-y-4">
              <div>
                <input
                  type="url"
                  value={url || ''}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:border-[#FCB283] focus:outline-none transition-colors"
                  placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
                />
              </div>

              {/* Supported Platforms */}
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-sm font-medium text-white/90 mb-3">Supported Platforms:</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg">
                    <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center">
                      <Play className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="text-white text-sm font-medium">YouTube</div>
                      <div className="text-white/60 text-xs">youtube.com, youtu.be</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg">
                    <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                      <Play className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="text-white text-sm font-medium">Vimeo</div>
                      <div className="text-white/60 text-xs">vimeo.com</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="mt-3 text-sm text-red-400">{error}</p>
      )}

      {/* Current Selection Summary */}
      {(file || url) && (
        <div className="mt-4 p-3 bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-lg">
          <div className="flex items-center space-x-2 text-green-400">
            <Video className="w-4 h-4" />
            <span className="text-sm font-medium">
              {file ? `Video file: ${file.name}` : `Video URL: ${getVideoType(url || '')}`}
            </span>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-4 p-3 bg-white/5 rounded-lg">
        <p className="text-xs text-white/70">
          💡 <strong>Tips:</strong> You can either upload a video file directly or provide a URL from YouTube, Vimeo, or other video platforms. 
          Video files should be in common formats (MP4, MOV, AVI, MKV) and under 500MB for best performance.
        </p>
      </div>
    </div>
  );
};

export default TrailerUpload;
