import React, { useState, useRef } from 'react';
import { Image, Upload, X, Eye } from 'lucide-react';
import { validateFileForUpload, formatFileSize, isImageFile, createFilePreview, cleanupFilePreview } from '../../utils/fileUpload';

interface PosterUploadProps {
  file?: File;
  url?: string;
  onChange: (file?: File, url?: string) => void;
  error?: string;
  className?: string;
}

const PosterUpload: React.FC<PosterUploadProps> = ({
  file,
  url,
  onChange,
  error,
  className = ''
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get the display image (file preview or URL)
  const displayImage = preview || url;

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    handleFileUpdate(selectedFile);
  };

  const handleFileUpdate = (selectedFile?: File) => {
    // Cleanup previous preview
    if (preview) {
      cleanupFilePreview(preview);
      setPreview(null);
    }

    if (!selectedFile) {
      onChange(undefined, url);
      return;
    }

    // Validate file
    const validation = validateFileForUpload(selectedFile, 'IMAGE');
    if (!validation.isValid) {
      alert(validation.error);
      return;
    }

    // Create preview
    const newPreview = createFilePreview(selectedFile);
    setPreview(newPreview);
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
    const imageFile = files.find(file => isImageFile(file));
    
    if (imageFile) {
      handleFileUpdate(imageFile);
    }
  };

  const handleRemove = () => {
    if (preview) {
      cleanupFilePreview(preview);
      setPreview(null);
    }
    onChange(undefined, undefined);
  };

  const handleUrlChange = (newUrl: string) => {
    // If there's a file, remove it when URL is set
    if (file && preview) {
      cleanupFilePreview(preview);
      setPreview(null);
    }
    onChange(undefined, newUrl);
  };

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-white/90 mb-3">
        Movie Poster
      </label>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Poster Frame */}
        <div className="lg:col-span-2 space-y-4">
          <div className="text-sm text-white/70 mb-2">Poster Preview</div>
          
          {/* Poster Display Frame */}
          <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-4 shadow-2xl">
            {/* Movie Poster Frame */}
            <div className="relative bg-black rounded-xl overflow-hidden shadow-lg" style={{ aspectRatio: '2/3' }}>
              {displayImage ? (
                <>
                  <img
                    src={displayImage}
                    alt="Movie Poster"
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Overlay Controls */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => setShowPreview(true)}
                        className="p-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors"
                        title="Preview"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={handleRemove}
                        className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                        title="Remove"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                /* Placeholder */
                <div className="w-full h-full flex flex-col items-center justify-center text-white/50 bg-gradient-to-br from-gray-700 to-gray-800">
                  <Image className="w-16 h-16 mb-4" />
                  <div className="text-center px-4">
                    <div className="text-lg font-medium mb-1">Movie Poster</div>
                    <div className="text-sm">Upload or provide URL</div>
                  </div>
                </div>
              )}
            </div>

            {/* Film Strip Decoration */}
            <div className="absolute -top-2 -left-2 w-6 h-6 bg-gradient-to-br from-[#FCB283] to-[#AA4626] rounded-full"></div>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-[#FCB283] to-[#AA4626] rounded-full"></div>
            <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-gradient-to-br from-[#FCB283] to-[#AA4626] rounded-full"></div>
            <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-gradient-to-br from-[#FCB283] to-[#AA4626] rounded-full"></div>
          </div>

          {/* File Info */}
          {file && (
            <div className="text-xs text-white/60 bg-white/5 rounded-lg p-3">
              <div className="font-medium">{file.name}</div>
              <div>{formatFileSize(file.size)}</div>
            </div>
          )}
        </div>

        {/* Upload Controls */}
        <div className="lg:col-span-3 space-y-4">
          {/* File Upload */}
          <div>
            <div className="text-sm text-white/70 mb-2">Upload Image File</div>
            <div
              className={`border-2 border-dashed rounded-xl p-6 transition-colors cursor-pointer ${
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
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="text-center">
                <div className="text-3xl mb-3">🎬</div>
                <div className="text-white/80 mb-2">
                  Click to select poster or drag and drop
                </div>
                <div className="text-white/60 text-sm mb-3">
                  Supported: JPG, PNG, GIF (max 10MB)
                </div>
                <button
                  type="button"
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-[#FCB283] to-[#AA4626] text-white rounded-lg hover:shadow-lg transition-all mx-auto"
                >
                  <Upload className="w-4 h-4" />
                  <span>Select Image</span>
                </button>
              </div>
            </div>
          </div>

          {/* URL Input */}
          <div>
            <div className="text-sm text-white/70 mb-2">Or provide image URL</div>
            <input
              type="url"
              value={url || ''}
              onChange={(e) => handleUrlChange(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:border-[#FCB283] focus:outline-none transition-colors"
              placeholder="https://example.com/poster.jpg"
            />
          </div>

          {/* Requirements */}
          <div className="bg-white/5 rounded-lg p-3">
            <div className="text-xs text-white/70">
              <div className="font-medium mb-1">📋 Requirements:</div>
              <ul className="space-y-1 text-white/60">
                <li>• Aspect ratio: 2:3 (portrait)</li>
                <li>• Minimum size: 400x600px</li>
                <li>• Maximum file size: 10MB</li>
                <li>• Formats: JPG, PNG, GIF</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <p className="mt-3 text-sm text-red-400">{error}</p>
      )}

      {/* Full Screen Preview Modal */}
      {showPreview && displayImage && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-2xl max-h-full">
            <img
              src={displayImage}
              alt="Poster Preview"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            <button
              onClick={() => setShowPreview(false)}
              className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PosterUpload;
