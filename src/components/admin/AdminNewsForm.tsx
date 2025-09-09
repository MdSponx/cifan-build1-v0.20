import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTypography } from '../../utils/typography';
import { useAuth } from '../auth/AuthContext';
import { 
  NewsArticle, 
  NewsFormData, 
  NewsValidationErrors,
  NewsCategory,
  NewsStatus,
  NewsImage,
  NEWS_CATEGORY_OPTIONS,
  NEWS_STATUS_OPTIONS,
  NEWS_VALIDATION_RULES,
  DEFAULT_NEWS_TAGS
} from '../../types/news.types';
import { 
  Calendar, 
  User, 
  Image as ImageIcon, 
  Clock, 
  Save,
  Plus,
  X,
  Globe,
  Eye,
  EyeOff,
  FileText,
  Tag,
  Upload,
  Trash2,
  Link,
  Film
} from 'lucide-react';
import AnimatedButton from '../ui/AnimatedButton';
import ErrorMessage from '../forms/ErrorMessage';
import RichTextEditor from '../ui/RichTextEditor';
import GalleryUpload from '../forms/GalleryUpload';

interface AdminNewsFormProps {
  article?: NewsArticle | null;
  onSubmit: (formData: NewsFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  mode: 'create' | 'edit';
  errors?: NewsValidationErrors;
}

const AdminNewsForm: React.FC<AdminNewsFormProps> = ({
  article,
  onSubmit,
  onCancel,
  isLoading = false,
  mode,
  errors: externalErrors = {}
}) => {
  const { i18n } = useTranslation();
  const { getClass } = useTypography();
  const { user } = useAuth();
  const currentLanguage = i18n.language as 'en' | 'th';
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState<NewsFormData>({
    title: '',
    shortDescription: '',
    content: '',
    authorId: user?.uid || '',
    status: 'draft',
    publishedAt: '',
    categories: [],
    tags: [],
    coverImage: null,
    galleryImages: [],
    galleryUrls: [],
    existingImages: [],
    deletedImageIds: [],
    referencedActivities: [],
    referencedFilms: [],
    metaTitle: '',
    metaDescription: ''
  });

  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  const [customTag, setCustomTag] = useState('');
  const [internalErrors, setInternalErrors] = useState<NewsValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Enhanced gallery state management
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  const [galleryCoverIndex, setGalleryCoverIndex] = useState<number | undefined>(undefined);
  const [newGalleryFiles, setNewGalleryFiles] = useState<File[]>([]);
  const [deletedImageIds, setDeletedImageIds] = useState<string[]>([]);

  // Combine external and internal errors
  const errors = { ...internalErrors, ...externalErrors };

  // Content translations
  const content = {
    th: {
      // Form titles
      createTitle: 'สร้างบทความใหม่',
      editTitle: 'แก้ไขบทความ',
      createSubtitle: 'เพิ่มข่าวสาร บทความ และเนื้อหาใหม่',
      editSubtitle: 'แก้ไขข้อมูลบทความและเนื้อหา',

      // Section titles
      basicInfoSection: 'ข้อมูลพื้นฐาน',
      contentSection: 'เนื้อหา',
      mediaSection: 'สื่อและรูปภาพ',
      categoriesSection: 'หมวดหมู่และแท็ก',
      seoSection: 'SEO',

      // Basic info fields
      articleTitle: 'หัวข้อบทความ',
      shortDescription: 'คำบรรยายสั้น',
      status: 'สถานะ',
      publishedAt: 'วันที่เผยแพร่',

      // Content fields
      articleContent: 'เนื้อหาบทความ',

      // Media fields
      coverImage: 'รูปปก',

      // Categories and tags
      categories: 'หมวดหมู่',
      tags: 'แท็ก',
      customTags: 'แท็กกำหนดเอง',
      addCustomTag: 'เพิ่มแท็กใหม่',

      // SEO
      metaTitle: 'Meta Title',
      metaDescription: 'Meta Description',

      // Actions
      save: 'บันทึก',
      saving: 'กำลังบันทึก...',
      cancel: 'ยกเลิก',
      dragDropImage: 'ลากและวางรูปภาพที่นี่',
      supportedFormats: 'รองรับ JPG, PNG, WebP (สูงสุด 5MB)',

      // Placeholders
      titlePlaceholder: 'กรอกหัวข้อบทความ',
      shortDescPlaceholder: 'คำบรรยายสั้นๆ เกี่ยวกับบทความ',
      contentPlaceholder: 'เขียนเนื้อหาบทความที่นี่...',
      customTagPlaceholder: 'แท็กใหม่',
      metaTitlePlaceholder: 'หัวข้อสำหรับ SEO (60 ตัวอักษร)',
      metaDescPlaceholder: 'คำอธิบายสำหรับ SEO (160 ตัวอักษร)',

      // Status options
      statusDraft: 'ร่าง',
      statusPublished: 'เผยแพร่แล้ว',
      statusScheduled: 'กำหนดเวลา',
      statusArchived: 'เก็บถาวร',

      // Validation messages
      characterCount: 'ตัวอักษร',
      required: 'จำเป็นต้องกรอก',
      fileTooLarge: 'ไฟล์ใหญ่เกินไป (สูงสุด 5MB)',
      invalidFileType: 'ประเภทไฟล์ไม่ถูกต้อง'
    },
    en: {
      // Form titles
      createTitle: 'Create New Article',
      editTitle: 'Edit Article',
      createSubtitle: 'Add news, articles, and editorial content',
      editSubtitle: 'Update article information and content',

      // Section titles
      basicInfoSection: 'Basic Information',
      contentSection: 'Content',
      mediaSection: 'Media & Images',
      categoriesSection: 'Categories & Tags',
      seoSection: 'SEO',

      // Basic info fields
      articleTitle: 'Article Title',
      shortDescription: 'Short Description',
      status: 'Status',
      publishedAt: 'Published Date',

      // Content fields
      articleContent: 'Article Content',

      // Media fields
      coverImage: 'Cover Image',

      // Categories and tags
      categories: 'Categories',
      tags: 'Tags',
      customTags: 'Custom Tags',
      addCustomTag: 'Add Custom Tag',

      // SEO
      metaTitle: 'Meta Title',
      metaDescription: 'Meta Description',

      // Actions
      save: 'Save',
      saving: 'Saving...',
      cancel: 'Cancel',
      dragDropImage: 'Drag & drop image here',
      supportedFormats: 'Supports JPG, PNG, WebP (max 5MB)',

      // Placeholders
      titlePlaceholder: 'Enter article title',
      shortDescPlaceholder: 'Brief description of the article',
      contentPlaceholder: 'Write your article content here...',
      customTagPlaceholder: 'New tag',
      metaTitlePlaceholder: 'SEO title (60 characters)',
      metaDescPlaceholder: 'SEO description (160 characters)',

      // Status options
      statusDraft: 'Draft',
      statusPublished: 'Published',
      statusScheduled: 'Scheduled',
      statusArchived: 'Archived',

      // Validation messages
      characterCount: 'characters',
      required: 'This field is required',
      fileTooLarge: 'File too large (max 5MB)',
      invalidFileType: 'Invalid file type'
    }
  };

  const currentContent = content[currentLanguage];

  // Initialize form data when article prop changes
  useEffect(() => {
    if (article && mode === 'edit') {
      setFormData({
        title: article.title,
        shortDescription: article.shortDescription,
        content: article.content,
        authorId: article.authorId,
        status: article.status,
        publishedAt: article.publishedAt || '',
        categories: [...article.categories],
        tags: [...article.tags],
        coverImage: null, // File object not available from existing article
        galleryImages: [],
        galleryUrls: [],
        existingImages: [...article.images],
        deletedImageIds: [],
        referencedActivities: article.referencedActivities.map(ref => ref.id),
        referencedFilms: article.referencedFilms.map(ref => ref.id),
        metaTitle: article.metaTitle || '',
        metaDescription: article.metaDescription || ''
      });
      
      // Set cover image preview if article has one
      if (article.coverImageUrl) {
        setCoverImagePreview(article.coverImageUrl);
      }

      // Initialize gallery URLs from existing images
      if (article.images && article.images.length > 0) {
        const imageUrls = article.images
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map(img => img.url);
        setGalleryUrls(imageUrls);
        
        // Find cover image index
        const coverImageIndex = article.images.findIndex(img => img.isCover);
        if (coverImageIndex !== -1) {
          setGalleryCoverIndex(coverImageIndex);
        }
      } else {
        setGalleryUrls([]);
        setGalleryCoverIndex(undefined);
      }

      // Reset new files and deleted IDs
      setNewGalleryFiles([]);
      setDeletedImageIds([]);
    } else if (mode === 'create') {
      // Reset all gallery state for create mode
      setGalleryUrls([]);
      setGalleryCoverIndex(undefined);
      setNewGalleryFiles([]);
      setDeletedImageIds([]);
    }
  }, [article, mode]);

  // Enhanced gallery change handler
  const handleGalleryChange = (files: File[], urls: string[], coverIndex?: number) => {
    console.log('Gallery change detected:', {
      files: files.length,
      urls: urls.length,
      coverIndex,
      mode,
      existingImages: article?.images?.length || 0
    });

    // Update gallery URLs
    setGalleryUrls(urls);
    setGalleryCoverIndex(coverIndex);
    
    // Store new files that need to be uploaded
    setNewGalleryFiles(files);
    
    // Update cover image preview if cover is selected from gallery
    if (coverIndex !== undefined && urls[coverIndex]) {
      setCoverImagePreview(urls[coverIndex]);
      // Clear any separate cover image file since we're using gallery image
      setFormData(prev => ({ ...prev, coverImage: null }));
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } else if (coverIndex === undefined) {
      // If no cover is selected from gallery, clear the preview if it was from gallery
      const currentCoverUrl = galleryUrls[galleryCoverIndex || 0];
      if (coverImagePreview === currentCoverUrl) {
        setCoverImagePreview(null);
      }
    }
    
    // Calculate deleted images in edit mode
    if (article?.images && mode === 'edit') {
      const currentUrls = new Set(urls);
      const deletedIds = article.images
        .filter(img => !currentUrls.has(img.url))
        .map(img => img.id);
      
      console.log('Calculating deleted images:', {
        originalImages: article.images.length,
        currentUrls: urls.length,
        deletedIds: deletedIds.length,
        deletedImageIds: deletedIds
      });
      
      setDeletedImageIds(deletedIds);
      
      // Update form data with deleted image IDs
      setFormData(prev => ({
        ...prev,
        deletedImageIds: deletedIds
      }));
    }
  };

  // Form validation
  const validateForm = (): NewsValidationErrors => {
    const newErrors: NewsValidationErrors = {};

    // Title validation
    if (!formData.title.trim()) {
      newErrors.title = currentContent.required;
    } else if (formData.title.length < NEWS_VALIDATION_RULES.title.minLength) {
      newErrors.title = `Minimum ${NEWS_VALIDATION_RULES.title.minLength} characters required`;
    }

    // Short description validation
    if (!formData.shortDescription.trim()) {
      newErrors.shortDescription = currentContent.required;
    } else if (formData.shortDescription.length < NEWS_VALIDATION_RULES.shortDescription.minLength) {
      newErrors.shortDescription = `Minimum ${NEWS_VALIDATION_RULES.shortDescription.minLength} characters required`;
    }

    // Content validation
    if (!formData.content.trim()) {
      newErrors.content = currentContent.required;
    } else if (formData.content.length < NEWS_VALIDATION_RULES.content.minLength) {
      newErrors.content = `Minimum ${NEWS_VALIDATION_RULES.content.minLength} characters required`;
    }

    // Author validation
    if (!formData.authorId) {
      newErrors.authorId = currentContent.required;
    }

    // Categories validation
    if (formData.categories.length === 0) {
      newErrors.categories = currentContent.required;
    }

    // Published date validation for scheduled posts
    if (formData.status === 'scheduled' && !formData.publishedAt) {
      newErrors.publishedAt = currentContent.required;
    }

    return newErrors;
  };

  // Handle input changes
  const handleInputChange = (field: keyof NewsFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field as keyof NewsValidationErrors]) {
      setInternalErrors(prev => ({ ...prev, [field as keyof NewsValidationErrors]: undefined }));
    }
  };

  // Handle cover image upload
  const handleCoverImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    const maxSize = NEWS_VALIDATION_RULES.coverImage.maxSize;
    const allowedTypes = NEWS_VALIDATION_RULES.coverImage.allowedTypes;

    if (file.size > maxSize) {
      setInternalErrors(prev => ({ ...prev, coverImage: currentContent.fileTooLarge }));
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      setInternalErrors(prev => ({ ...prev, coverImage: currentContent.invalidFileType }));
      return;
    }

    setFormData(prev => ({ ...prev, coverImage: file }));
    setInternalErrors(prev => ({ ...prev, coverImage: undefined }));
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setCoverImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Remove cover image
  const removeCoverImage = () => {
    setFormData(prev => ({ ...prev, coverImage: null }));
    setCoverImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    // If the cover image was from gallery, reset the gallery cover index
    if (galleryCoverIndex !== undefined && galleryUrls[galleryCoverIndex]) {
      const coverUrl = galleryUrls[galleryCoverIndex];
      if (article?.coverImageUrl === coverUrl) {
        setGalleryCoverIndex(undefined);
      }
    }
  };

  // Toggle category
  const toggleCategory = (category: NewsCategory) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(category) 
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };

  // Add custom tag
  const addCustomTag = () => {
    if (customTag.trim() && !formData.tags.includes(customTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, customTag.trim()]
      }));
      setCustomTag('');
    }
  };

  // Remove tag
  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  // Toggle predefined tag
  const togglePredefinedTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag) 
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  // Enhanced form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setInternalErrors(validationErrors);
      const firstErrorElement = document.querySelector('.error-field');
      if (firstErrorElement) {
        firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setIsSubmitting(true);
    try {
      // Prepare existing images that are still present
      const existingImages = galleryUrls
        .map((url, index) => {
          const existingImage = article?.images?.find(img => img.url === url);
          return existingImage ? {
            ...existingImage,
            isCover: index === galleryCoverIndex,
            sortOrder: index
          } : null;
        })
        .filter(Boolean) as NewsImage[];

      // Prepare form data with proper gallery handling
      const updatedFormData = {
        ...formData,
        // Send existing images that remain
        existingImages: existingImages,
        // Send new files for upload
        galleryImages: newGalleryFiles,
        // Send new URLs (if any) that are not existing images
        galleryUrls: galleryUrls.filter(url => 
          !article?.images?.some(img => img.url === url)
        ),
        // Send IDs of images to delete
        deletedImageIds: deletedImageIds,
        // Include the gallery cover index
        galleryCoverIndex: galleryCoverIndex
      };
      
      console.log('Submitting form with enhanced gallery data:', {
        existingImages: existingImages.length,
        newGalleryFiles: newGalleryFiles.length,
        newGalleryUrls: updatedFormData.galleryUrls.length,
        deletedImageIds: deletedImageIds.length,
        coverIndex: galleryCoverIndex
      });
      
      await onSubmit(updatedFormData);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="glass-container rounded-xl p-6 sm:p-8">
        <div className="text-center">
          <h1 className={`text-2xl sm:text-3xl ${getClass('header')} text-white mb-2`}>
            {mode === 'create' ? currentContent.createTitle : currentContent.editTitle}
          </h1>
          <p className={`${getClass('body')} text-white/80`}>
            {mode === 'create' ? currentContent.createSubtitle : currentContent.editSubtitle}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
        
        {/* Section 1: Basic Information */}
        <div className="glass-container rounded-xl p-6 sm:p-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <h2 className={`text-xl ${getClass('header')} text-white`}>
              {currentContent.basicInfoSection}
            </h2>
          </div>

          <div className="space-y-6">
            {/* Title and Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={`block text-white/90 ${getClass('body')} mb-2`}>
                  {currentContent.articleTitle} <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className={`w-full p-3 rounded-lg bg-white/10 border ${errors.title ? 'border-red-400 error-field' : 'border-white/20'} text-white placeholder-white/50 focus:border-[#FCB283] focus:outline-none transition-colors`}
                  placeholder={currentContent.titlePlaceholder}
                />
                <ErrorMessage error={errors.title} />
              </div>

              <div>
                <label className={`block text-white/90 ${getClass('body')} mb-2`}>
                  {currentContent.status} <span className="text-red-400">*</span>
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white focus:border-[#FCB283] focus:outline-none transition-colors"
                >
                  {NEWS_STATUS_OPTIONS.map(option => {
                    const statusKey = `status${option.value.charAt(0).toUpperCase() + option.value.slice(1)}` as keyof typeof currentContent;
                    return (
                      <option key={option.value} value={option.value} className="bg-[#110D16]">
                        {currentContent[statusKey] as string}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* Short Description */}
            <div>
              <label className={`block text-white/90 ${getClass('body')} mb-2`}>
                {currentContent.shortDescription} <span className="text-red-400">*</span>
              </label>
              <textarea
                value={formData.shortDescription}
                onChange={(e) => handleInputChange('shortDescription', e.target.value)}
                maxLength={NEWS_VALIDATION_RULES.shortDescription.maxLength}
                rows={3}
                className={`w-full p-3 rounded-lg bg-white/10 border ${errors.shortDescription ? 'border-red-400 error-field' : 'border-white/20'} text-white placeholder-white/50 focus:border-[#FCB283] focus:outline-none transition-colors resize-none`}
                placeholder={currentContent.shortDescPlaceholder}
              />
              <div className="flex justify-between items-center mt-1">
                <ErrorMessage error={errors.shortDescription} />
                <span className={`text-xs ${getClass('menu')} text-white/60`}>
                  {formData.shortDescription.length}/{NEWS_VALIDATION_RULES.shortDescription.maxLength} {currentContent.characterCount}
                </span>
              </div>
            </div>

            {/* Published Date (for scheduled posts) */}
            {formData.status === 'scheduled' && (
              <div>
                <label className={`flex items-center text-white/90 ${getClass('body')} mb-2`}>
                  <Calendar className="w-4 h-4 mr-2" />
                  {currentContent.publishedAt} <span className="text-red-400">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={formData.publishedAt}
                  onChange={(e) => handleInputChange('publishedAt', e.target.value)}
                  className={`w-full p-3 rounded-lg bg-white/10 border ${errors.publishedAt ? 'border-red-400 error-field' : 'border-white/20'} text-white focus:border-[#FCB283] focus:outline-none transition-colors`}
                />
                <ErrorMessage error={errors.publishedAt} />
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Content */}
        <div className="glass-container rounded-xl p-6 sm:p-8" style={{ overflow: 'visible', contain: 'none' }}>
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <h2 className={`text-xl ${getClass('header')} text-white`}>
              {currentContent.contentSection}
            </h2>
          </div>

          <div className="space-y-6 overflow-visible min-w-0">
            {/* Article Content */}
            <div className="w-full max-w-full min-w-0 overflow-visible">
              <label className={`block text-white/90 ${getClass('body')} mb-2`}>
                {currentContent.articleContent} <span className="text-red-400">*</span>
              </label>
              <div className="w-full max-w-full min-w-0">
                <RichTextEditor
                  value={formData.content}
                  onChange={(value) => handleInputChange('content', value)}
                  placeholder={currentContent.contentPlaceholder}
                  error={!!errors.content}
                  className={errors.content ? 'error' : ''}
                />
              </div>
              <div className="flex justify-between items-center mt-1">
                <ErrorMessage error={errors.content} />
                <span className={`text-xs ${getClass('menu')} text-white/60`}>
                  {formData.content.replace(/<[^>]*>/g, '').length} {currentContent.characterCount}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Media & Images */}
        <div className="glass-container rounded-xl p-6 sm:p-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
              <ImageIcon className="w-4 h-4 text-white" />
            </div>
            <h2 className={`text-xl ${getClass('header')} text-white`}>
              {currentContent.mediaSection}
            </h2>
          </div>

          <div className="space-y-6">
            {/* Gallery Images Section */}
            <GalleryUpload
              value={newGalleryFiles}
              onChange={(files: File[], coverIndex?: number) => {
                handleGalleryChange(files, galleryUrls, coverIndex);
              }}
              urls={galleryUrls}
              onUrlsChange={(urls: string[]) => {
                handleGalleryChange(newGalleryFiles, urls, galleryCoverIndex);
              }}
              coverIndex={galleryCoverIndex}
              className="mb-6"
              error={errors.galleryImages}
              mode={mode}
              newsId={article?.id} // For auto-upload in edit mode
              hideUrlInputs={true} // Hide URL inputs for news
              hideLogoSelection={true} // Hide logo selection for news
            />
          </div>
        </div>

        {/* Section 4: Categories & Tags */}
        <div className="glass-container rounded-xl p-6 sm:p-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
              <Tag className="w-4 h-4 text-white" />
            </div>
            <h2 className={`text-xl ${getClass('header')} text-white`}>
              {currentContent.categoriesSection}
            </h2>
          </div>

          <div className="space-y-6">
            {/* Categories */}
            <div>
              <h3 className={`text-lg ${getClass('subtitle')} text-white mb-4`}>
                {currentContent.categories} <span className="text-red-400">*</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {NEWS_CATEGORY_OPTIONS.map(category => (
                  <button
                    key={category.value}
                    type="button"
                    onClick={() => toggleCategory(category.value)}
                    className={`p-3 rounded-lg border-2 text-left transition-all duration-200 ${
                      formData.categories.includes(category.value)
                        ? 'border-[#FCB283] bg-[#FCB283]/20 text-[#FCB283]'
                        : 'border-white/20 bg-white/5 text-white/80 hover:border-[#FCB283]/50 hover:bg-white/10'
                    }`}
                  >
                    <div className={`font-medium text-sm ${getClass('body')}`}>
                      {category.label}
                    </div>
                    <div className={`text-xs ${getClass('menu')} opacity-70`}>
                      {category.description}
                    </div>
                  </button>
                ))}
              </div>
              <ErrorMessage error={errors.categories} />
            </div>

            {/* Predefined Tags */}
            <div>
              <h3 className={`text-lg ${getClass('subtitle')} text-white mb-4`}>
                {currentContent.tags}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mb-4">
                {DEFAULT_NEWS_TAGS.slice(0, 12).map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => togglePredefinedTag(tag)}
                    className={`p-2 rounded-lg border text-sm transition-all duration-200 ${
                      formData.tags.includes(tag)
                        ? 'border-[#FCB283] bg-[#FCB283]/20 text-[#FCB283]'
                        : 'border-white/20 bg-white/5 text-white/80 hover:border-[#FCB283]/50 hover:bg-white/10'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>

              {/* Custom Tags */}
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={customTag}
                  onChange={(e) => setCustomTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomTag())}
                  className="flex-1 p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:border-[#FCB283] focus:outline-none transition-colors"
                  placeholder={currentContent.customTagPlaceholder}
                />
                <AnimatedButton
                  type="button"
                  variant="secondary"
                  size="medium"
                  onClick={addCustomTag}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {currentContent.addCustomTag}
                </AnimatedButton>
              </div>

              {/* Selected Tags Display */}
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center space-x-2 px-3 py-1 bg-[#FCB283]/20 text-[#FCB283] rounded-full text-sm border border-[#FCB283]/30"
                    >
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="text-[#FCB283] hover:text-white transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section 5: SEO */}
        <div className="glass-container rounded-xl p-6 sm:p-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <Globe className="w-4 h-4 text-white" />
            </div>
            <h2 className={`text-xl ${getClass('header')} text-white`}>
              {currentContent.seoSection}
            </h2>
          </div>

          <div className="space-y-6">
            {/* Meta Title */}
            <div>
              <label className={`block text-white/90 ${getClass('body')} mb-2`}>
                {currentContent.metaTitle}
              </label>
              <input
                type="text"
                value={formData.metaTitle}
                onChange={(e) => handleInputChange('metaTitle', e.target.value)}
                maxLength={NEWS_VALIDATION_RULES.metaTitle?.maxLength || 60}
                className={`w-full p-3 rounded-lg bg-white/10 border ${errors.metaTitle ? 'border-red-400 error-field' : 'border-white/20'} text-white placeholder-white/50 focus:border-[#FCB283] focus:outline-none transition-colors`}
                placeholder={currentContent.metaTitlePlaceholder}
              />
              <div className="flex justify-between items-center mt-1">
                <ErrorMessage error={errors.metaTitle} />
                <span className={`text-xs ${getClass('menu')} text-white/60`}>
                  {(formData.metaTitle || '').length}/60 {currentContent.characterCount}
                </span>
              </div>
            </div>

            {/* Meta Description */}
            <div>
              <label className={`block text-white/90 ${getClass('body')} mb-2`}>
                {currentContent.metaDescription}
              </label>
              <textarea
                value={formData.metaDescription}
                onChange={(e) => handleInputChange('metaDescription', e.target.value)}
                maxLength={NEWS_VALIDATION_RULES.metaDescription?.maxLength || 160}
                rows={3}
                className={`w-full p-3 rounded-lg bg-white/10 border ${errors.metaDescription ? 'border-red-400 error-field' : 'border-white/20'} text-white placeholder-white/50 focus:border-[#FCB283] focus:outline-none transition-colors resize-none`}
                placeholder={currentContent.metaDescPlaceholder}
              />
              <div className="flex justify-between items-center mt-1">
                <ErrorMessage error={errors.metaDescription} />
                <span className={`text-xs ${getClass('menu')} text-white/60`}>
                  {(formData.metaDescription || '').length}/160 {currentContent.characterCount}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-end">
          <AnimatedButton
            type="button"
            variant="outline"
            size="large"
            onClick={onCancel}
            className={isSubmitting || isLoading ? 'opacity-50 cursor-not-allowed' : ''}
          >
            {currentContent.cancel}
          </AnimatedButton>
          
          <AnimatedButton
            type="submit"
            variant="primary"
            size="large"
            className={`${getClass('menu')} ${(isSubmitting || isLoading) ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Save className="w-4 h-4 mr-2" />
            {(isSubmitting || isLoading) ? currentContent.saving : currentContent.save}
          </AnimatedButton>
        </div>
      </form>
    </div>
  );
};

export default AdminNewsForm;
