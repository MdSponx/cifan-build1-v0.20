import React, { useState, useRef } from 'react';
import { 
  Image, 
  Plus, 
  Trash2, 
  Star, 
  StarOff, 
  GripVertical,
  Upload,
  X,
  Shield,
  ShieldOff
} from 'lucide-react';
import { validateFileForUpload, formatFileSize, isImageFile, createFilePreview, cleanupFilePreview } from '../../utils/fileUpload';

interface GalleryItem {
  id: string;
  file?: File;
  url?: string;
  preview?: string;
  isCover: boolean;
  isLogo: boolean;
}

interface GalleryUploadProps {
  value: File[];
  urls: string[];
  coverIndex?: number;
  logoIndex?: number;
  onChange: (files: File[], coverIndex?: number, logoIndex?: number) => void;
  onUrlsChange: (urls: string[]) => void;
  error?: string;
  className?: string;
}

const GalleryUpload: React.FC<GalleryUploadProps> = ({
  value = [],
  urls = [],
  coverIndex = 0,
  logoIndex,
  onChange,
  onUrlsChange,
  error,
  className = ''
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Combine files and URLs into gallery items
  const galleryItems: GalleryItem[] = [
    ...value.map((file, index) => ({
      id: `file-${index}`,
      file,
      preview: createFilePreview(file),
      isCover: index === coverIndex,
      isLogo: index === logoIndex
    })),
    ...urls.map((url, index) => ({
      id: `url-${index}`,
      url,
      isCover: (value.length + index) === coverIndex,
      isLogo: (value.length + index) === logoIndex
    }))
  ];

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles: File[] = [];
    const errors: string[] = [];

    console.log('🔄 Processing selected files:', files.length);

    files.forEach(file => {
      console.log(`📋 Validating file: ${file.name} (${file.size} bytes, ${file.type})`);
      const validation = validateFileForUpload(file, 'IMAGE');
      if (validation.isValid) {
        validFiles.push(file);
        console.log(`✅ File validated: ${file.name}`);
      } else {
        const errorMsg = `${file.name}: ${validation.error}`;
        errors.push(errorMsg);
        console.error(`❌ File validation failed: ${errorMsg}`);
      }
    });

    // Show errors if any
    if (errors.length > 0) {
      const errorMessage = `File validation errors:\n${errors.join('\n')}`;
      alert(errorMessage);
    }

    if (validFiles.length > 0) {
      const newFiles = [...value, ...validFiles];
      console.log(`📤 Adding ${validFiles.length} valid files to gallery. Total files: ${newFiles.length}`);
      onChange(newFiles, coverIndex);
    } else if (files.length > 0) {
      console.warn('⚠️ No valid files were selected');
    }

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
    console.log('🔄 Processing dropped files:', files.length);
    
    if (files.length === 0) {
      console.warn('⚠️ No files were dropped');
      return;
    }

    const imageFiles = files.filter(file => isImageFile(file));
    const nonImageFiles = files.filter(file => !isImageFile(file));
    
    // Show warning for non-image files
    if (nonImageFiles.length > 0) {
      const nonImageNames = nonImageFiles.map(f => f.name).join(', ');
      console.warn(`⚠️ Non-image files ignored: ${nonImageNames}`);
      alert(`The following files are not images and were ignored:\n${nonImageNames}`);
    }
    
    if (imageFiles.length > 0) {
      const validFiles: File[] = [];
      const errors: string[] = [];
      
      imageFiles.forEach(file => {
        console.log(`📋 Validating dropped file: ${file.name} (${file.size} bytes, ${file.type})`);
        const validation = validateFileForUpload(file, 'IMAGE');
        if (validation.isValid) {
          validFiles.push(file);
          console.log(`✅ Dropped file validated: ${file.name}`);
        } else {
          const errorMsg = `${file.name}: ${validation.error}`;
          errors.push(errorMsg);
          console.error(`❌ Dropped file validation failed: ${errorMsg}`);
        }
      });

      // Show errors if any
      if (errors.length > 0) {
        const errorMessage = `File validation errors:\n${errors.join('\n')}`;
        alert(errorMessage);
      }

      if (validFiles.length > 0) {
        const newFiles = [...value, ...validFiles];
        console.log(`📤 Adding ${validFiles.length} valid dropped files to gallery. Total files: ${newFiles.length}`);
        onChange(newFiles, coverIndex);
      } else if (imageFiles.length > 0) {
        console.warn('⚠️ No valid image files were dropped');
      }
    } else {
      console.warn('⚠️ No image files were found in the dropped files');
      alert('Please drop image files only (JPG, PNG, GIF)');
    }
  };

  const handleRemoveFile = (index: number) => {
    const newFiles = value.filter((_, i) => i !== index);
    const newCoverIndex = coverIndex !== undefined && coverIndex >= index ? Math.max(0, coverIndex - 1) : coverIndex;
    onChange(newFiles, newFiles.length > 0 ? newCoverIndex : undefined);
  };

  const handleRemoveUrl = (index: number) => {
    const newUrls = urls.filter((_, i) => i !== index);
    const urlIndexInGallery = value.length + index;
    const newCoverIndex = coverIndex !== undefined && coverIndex >= urlIndexInGallery 
      ? Math.max(0, coverIndex - 1) 
      : coverIndex;
    onUrlsChange(newUrls);
    
    // Update cover index if needed
    const totalItems = value.length + newUrls.length;
    if (totalItems > 0 && (newCoverIndex === undefined || newCoverIndex >= totalItems)) {
      onChange(value, 0);
    } else {
      onChange(value, newCoverIndex);
    }
  };

  const handleSetCover = (globalIndex: number) => {
    onChange(value, globalIndex, logoIndex);
  };

  const handleSetLogo = (globalIndex: number) => {
    onChange(value, coverIndex, globalIndex);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleItemDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleItemDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    // Handle reordering within files
    if (draggedIndex < value.length && dropIndex < value.length) {
      const newFiles = [...value];
      const [draggedFile] = newFiles.splice(draggedIndex, 1);
      newFiles.splice(dropIndex, 0, draggedFile);
      
      // Update cover index
      let newCoverIndex = coverIndex;
      if (coverIndex === draggedIndex) {
        newCoverIndex = dropIndex;
      } else if (coverIndex !== undefined) {
        if (draggedIndex < coverIndex && dropIndex >= coverIndex) {
          newCoverIndex = coverIndex - 1;
        } else if (draggedIndex > coverIndex && dropIndex <= coverIndex) {
          newCoverIndex = coverIndex + 1;
        }
      }
      
      onChange(newFiles, newCoverIndex);
    }
    // Handle reordering within URLs
    else if (draggedIndex >= value.length && dropIndex >= value.length) {
      const urlDragIndex = draggedIndex - value.length;
      const urlDropIndex = dropIndex - value.length;
      
      const newUrls = [...urls];
      const [draggedUrl] = newUrls.splice(urlDragIndex, 1);
      newUrls.splice(urlDropIndex, 0, draggedUrl);
      
      // Update cover index
      let newCoverIndex = coverIndex;
      if (coverIndex === draggedIndex) {
        newCoverIndex = dropIndex;
      } else if (coverIndex !== undefined) {
        if (draggedIndex < coverIndex && dropIndex >= coverIndex) {
          newCoverIndex = coverIndex - 1;
        } else if (draggedIndex > coverIndex && dropIndex <= coverIndex) {
          newCoverIndex = coverIndex + 1;
        }
      }
      
      onUrlsChange(newUrls);
      onChange(value, newCoverIndex);
    }
  };

  const addUrlInput = () => {
    onUrlsChange([...urls, '']);
  };

  const updateUrl = (index: number, url: string) => {
    const newUrls = [...urls];
    newUrls[index] = url;
    onUrlsChange(newUrls);
  };

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-white/90 mb-3">
        Gallery Images
      </label>

      {/* File Upload Area */}
      <div
        className={`border-2 border-dashed rounded-xl p-6 mb-4 transition-colors ${
          dragOver
            ? 'border-[#FCB283] bg-[#FCB283]/10'
            : error
            ? 'border-red-400'
            : 'border-white/20 hover:border-white/40'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="text-center">
          <div className="text-4xl mb-3">🖼️</div>
          <div className="text-white/80 mb-2">
            Click to select images or drag and drop here
          </div>
          <div className="text-white/60 text-sm mb-4">
            Supported: JPG, PNG, GIF (max 10MB each)
          </div>
          <button
            type="button"
            onClick={handleFileSelect}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-[#FCB283] to-[#AA4626] text-white rounded-lg hover:shadow-lg transition-all mx-auto"
          >
            <Upload className="w-4 h-4" />
            <span>Select Images</span>
          </button>
        </div>
      </div>

      {/* Gallery Grid */}
      {galleryItems.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
          {galleryItems.map((item, index) => (
            <div
              key={item.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => handleItemDragOver(e, index)}
              onDrop={(e) => handleItemDrop(e, index)}
              className={`relative group bg-white/5 rounded-xl overflow-hidden border-2 transition-all cursor-move ${
                item.isCover 
                  ? 'border-yellow-400 shadow-lg shadow-yellow-400/20' 
                  : 'border-white/10 hover:border-white/30'
              } ${draggedIndex === index ? 'opacity-50' : ''}`}
            >
              {/* Image */}
              <div className="aspect-square">
                {item.preview || item.url ? (
                  <img
                    src={item.preview || item.url}
                    alt={`Gallery item ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-white/10">
                    <Image className="w-8 h-8 text-white/50" />
                  </div>
                )}
              </div>

              {/* Overlay Controls */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="flex space-x-2">
                  {/* Set as Cover */}
                  <button
                    type="button"
                    onClick={() => handleSetCover(index)}
                    className={`p-2 rounded-lg transition-colors ${
                      item.isCover
                        ? 'bg-yellow-500 text-white'
                        : 'bg-white/20 text-white hover:bg-yellow-500'
                    }`}
                    title={item.isCover ? 'Cover Image' : 'Set as Cover'}
                  >
                    {item.isCover ? <Star className="w-4 h-4" /> : <StarOff className="w-4 h-4" />}
                  </button>

                  {/* Set as Logo */}
                  <button
                    type="button"
                    onClick={() => handleSetLogo(index)}
                    className={`p-2 rounded-lg transition-colors ${
                      item.isLogo
                        ? 'bg-blue-500 text-white'
                        : 'bg-white/20 text-white hover:bg-blue-500'
                    }`}
                    title={item.isLogo ? 'Logo Image' : 'Set as Logo'}
                  >
                    {item.isLogo ? <Shield className="w-4 h-4" /> : <ShieldOff className="w-4 h-4" />}
                  </button>

                  {/* Remove */}
                  <button
                    type="button"
                    onClick={() => {
                      if (item.file) {
                        const fileIndex = value.findIndex(f => f === item.file);
                        if (fileIndex !== -1) handleRemoveFile(fileIndex);
                      } else {
                        const urlIndex = urls.findIndex(u => u === item.url);
                        if (urlIndex !== -1) handleRemoveUrl(urlIndex);
                      }
                    }}
                    className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    title="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Drag Handle */}
              <div className="absolute top-2 left-2 p-1 bg-black/50 rounded text-white/70">
                <GripVertical className="w-3 h-3" />
              </div>

              {/* Cover Badge */}
              {item.isCover && (
                <div className="absolute top-2 right-2 px-2 py-1 bg-yellow-500 text-white text-xs rounded-full font-medium">
                  Cover
                </div>
              )}

              {/* Logo Badge */}
              {item.isLogo && (
                <div className={`absolute px-2 py-1 bg-blue-500 text-white text-xs rounded-full font-medium ${
                  item.isCover ? 'top-8 right-2' : 'top-2 right-2'
                }`}>
                  Logo
                </div>
              )}

              {/* File Info */}
              {item.file && (
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/70 text-white text-xs">
                  <div className="truncate">{item.file.name}</div>
                  <div className="text-white/70">{formatFileSize(item.file.size)}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* URL Inputs */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-white/90">
            Or add image URLs
          </label>
          <button
            type="button"
            onClick={addUrlInput}
            className="flex items-center space-x-2 px-3 py-1 bg-gradient-to-r from-[#FCB283] to-[#AA4626] text-white rounded-lg text-sm hover:shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add URL</span>
          </button>
        </div>

        {urls.map((url, index) => (
          <div key={index} className="flex items-center space-x-3">
            <input
              type="url"
              value={url}
              onChange={(e) => updateUrl(index, e.target.value)}
              className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:border-[#FCB283] focus:outline-none transition-colors"
              placeholder="https://example.com/image.jpg"
            />
            <button
              type="button"
              onClick={() => handleRemoveUrl(index)}
              className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-400">{error}</p>
      )}

      {/* Instructions */}
      <div className="mt-4 p-3 bg-white/5 rounded-lg">
        <p className="text-xs text-white/70">
          💡 <strong>Tips:</strong> Drag images to reorder them. Click the star icon to set an image as the cover. 
          Click the shield icon to set an image as the logo. The cover image will be displayed as the main gallery image.
        </p>
      </div>
    </div>
  );
};

export default GalleryUpload;
