import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Film, 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Building, 
  Image, 
  Video, 
  FileText, 
  Plus, 
  Trash2, 
  Save, 
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useNotificationHelpers } from '../ui/NotificationContext';
import { useTypography } from '../../utils/typography';
import { useAuth } from '../auth/AuthContext';
import { createFeatureFilm, updateFeatureFilm, getFeatureFilm } from '../../services/featureFilmService';
import { 
  FeatureFilmData, 
  FeatureFilmFormErrors,
  FILM_CATEGORIES,
  FILM_GENRES,
  TARGET_AUDIENCES,
  TIME_ESTIMATES,
  THEATRES,
  FILM_STATUSES,
  FilmCategory,
  FilmGenre,
  TargetAudience,
  TimeEstimate,
  Theatre,
  FilmStatus,
  Guest
} from '../../types/featureFilm.types';
import CountrySelector from '../forms/CountrySelector';
import LanguageSelector from '../forms/LanguageSelector';
import GenreSelector from '../forms/GenreSelector';
import PosterUpload from '../forms/PosterUpload';
import TrailerUpload from '../forms/TrailerUpload';
import GalleryUpload from '../forms/GalleryUpload';
import GuestManagement from '../forms/GuestManagement';
import RichTextEditor from '../ui/RichTextEditor';

interface FeatureFilmFormProps {
  mode: 'create' | 'edit';
  filmId?: string; // Required for edit mode
  initialData?: Partial<FeatureFilmData>;
  onSuccess?: (filmData: FeatureFilmData) => void;
  onSave?: (filmData: FeatureFilmData) => void;
  onCancel?: () => void;
  onNavigateBack?: () => void;
}

/**
 * Feature Film Management Form Component
 * 
 * A comprehensive form for managing feature film data in the CIFAN 2025 Film Festival.
 * Features Glass Morphism design, Firebase integration, and responsive layout.
 */
const FeatureFilmForm: React.FC<FeatureFilmFormProps> = ({
  mode = 'create',
  filmId,
  initialData,
  onSuccess,
  onSave,
  onCancel,
  onNavigateBack
}) => {
  const { t } = useTranslation();
  const { getClass } = useTypography();
  const { showSuccess, showError, showLoading, updateToSuccess, updateToError } = useNotificationHelpers();
  const { user } = useAuth();

  // Form state
  const [formData, setFormData] = useState<FeatureFilmData>({
    titleEn: '',
    titleTh: '',
    category: '' as FilmCategory,
    genres: [],
    countries: [],
    languages: [],
    synopsis: '',
    targetAudience: [],
    length: undefined,
    screeningDate1: '',
    screeningDate2: '',
    timeEstimate: '' as TimeEstimate,
    theatre: '' as Theatre,
    director: '',
    producer: '',
    studio: '',
    distributor: '',
    mainActors: '',
    posterFile: undefined,
    posterUrl: '',
    trailerFile: undefined,
    trailerUrl: '',
    screenerUrl: '',
    materials: '',
    galleryFiles: [],
    galleryUrls: [''],
    galleryCoverIndex: 0,
    status: '' as FilmStatus,
    remarks: '',
    guestComing: false,
    guests: [],
    ...initialData
  });

  const [errors, setErrors] = useState<FeatureFilmFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form with provided data
  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  // Load existing film data for edit mode
  useEffect(() => {
    const loadFilmData = async () => {
      if (mode === 'edit' && filmId) {
        setLoading(true);
        setError(null);
        
        try {
          // CRITICAL: Fetch specifically from "films" database collection
          const result = await getFeatureFilm(filmId);
          
          if (result.success && result.data) {
            const filmData = result.data;
            
            // Map database data to form data structure
            const mappedData: FeatureFilmData = {
              id: filmData.id,
              titleEn: filmData.titleEn || '',
              titleTh: filmData.titleTh || '',
              category: filmData.category || ('' as FilmCategory),
              genres: filmData.genres || [],
              countries: filmData.countries || [],
              languages: filmData.languages || [],
              synopsis: filmData.synopsis || '',
              targetAudience: filmData.targetAudience || [],
              length: filmData.length || undefined,
              screeningDate1: filmData.screeningDate1 ? 
                (filmData.screeningDate1 instanceof Date ? 
                  filmData.screeningDate1.toISOString().slice(0, 16) : 
                  new Date(filmData.screeningDate1).toISOString().slice(0, 16)) : '',
              screeningDate2: filmData.screeningDate2 ? 
                (filmData.screeningDate2 instanceof Date ? 
                  filmData.screeningDate2.toISOString().slice(0, 16) : 
                  new Date(filmData.screeningDate2).toISOString().slice(0, 16)) : '',
              timeEstimate: filmData.timeEstimate || ('' as TimeEstimate),
              theatre: filmData.theatre || ('' as Theatre),
              director: filmData.director || '',
              producer: filmData.producer || '',
              studio: filmData.studio || '',
              distributor: filmData.distributor || '',
              mainActors: filmData.mainActors || '',
              posterFile: undefined,
              posterUrl: filmData.posterUrl || '',
              trailerFile: undefined,
              trailerUrl: filmData.trailerUrl || '',
              screenerUrl: filmData.screenerUrl || '',
              materials: filmData.materials || '',
              galleryFiles: [],
              galleryUrls: filmData.galleryUrls || [''],
              galleryCoverIndex: filmData.galleryCoverIndex || 0,
              status: filmData.status || ('' as FilmStatus),
              remarks: filmData.remarks || '',
              guestComing: filmData.guestComing || false,
              guests: filmData.guests || [],
              createdAt: filmData.createdAt,
              updatedAt: filmData.updatedAt,
              createdBy: filmData.createdBy
            };
            
            setFormData(mappedData);
            setIsDirty(false); // Don't mark as dirty when loading existing data
          } else {
            setError(result.error || 'Film not found in films database');
          }
        } catch (err) {
          console.error('Error loading film from films collection:', err);
          setError('Error loading film data from films database');
        } finally {
          setLoading(false);
        }
      }
    };

    loadFilmData();
  }, [mode, filmId]);

  // Mark form as dirty when data changes (but not on initial load)
  useEffect(() => {
    if (!loading) {
      setIsDirty(true);
    }
  }, [formData, loading]);

  /**
   * Handle input field changes
   */
  const handleInputChange = (field: keyof FeatureFilmData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  /**
   * Handle target audience selection (multi-select)
   */
  const handleTargetAudienceToggle = (audience: TargetAudience) => {
    setFormData(prev => ({
      ...prev,
      targetAudience: prev.targetAudience.includes(audience)
        ? prev.targetAudience.filter(a => a !== audience)
        : [...prev.targetAudience, audience]
    }));
  };

  /**
   * Handle gallery URL management
   */
  const addGalleryUrl = () => {
    setFormData(prev => ({
      ...prev,
      galleryUrls: [...prev.galleryUrls, '']
    }));
  };

  const removeGalleryUrl = (index: number) => {
    setFormData(prev => ({
      ...prev,
      galleryUrls: prev.galleryUrls.filter((_, i) => i !== index)
    }));
  };

  const updateGalleryUrl = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      galleryUrls: prev.galleryUrls.map((url, i) => i === index ? value : url)
    }));
  };

  /**
   * Validate form data
   */
  const validateForm = (): boolean => {
    const newErrors: FeatureFilmFormErrors = {};

    // Required fields validation
    if (!formData.titleEn.trim()) {
      newErrors.titleEn = 'English title is required';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (!formData.genres || formData.genres.length === 0) {
      newErrors.genres = 'At least one genre is required';
    }

    if (!formData.countries || formData.countries.length === 0) {
      newErrors.countries = 'At least one country is required';
    }

    if (!formData.languages || formData.languages.length === 0) {
      newErrors.languages = 'At least one language is required';
    }

    if (!formData.synopsis.trim()) {
      newErrors.synopsis = 'Synopsis is required';
    }

    if (!formData.screeningDate1) {
      newErrors.screeningDate1 = 'First screening date is required';
    }

    if (!formData.timeEstimate) {
      newErrors.timeEstimate = 'Time estimate is required';
    }

    if (!formData.theatre) {
      newErrors.theatre = 'Theatre is required';
    }

    if (!formData.director.trim()) {
      newErrors.director = 'Director is required';
    }

    if (!formData.status) {
      newErrors.status = 'Status is required';
    }

    // URL validation
    const urlFields = ['posterUrl', 'trailerUrl', 'screenerUrl'];
    urlFields.forEach(field => {
      const value = formData[field as keyof FeatureFilmData] as string;
      if (value && !isValidUrl(value)) {
        newErrors[field] = 'Please enter a valid URL';
      }
    });

    // Gallery URLs validation
    formData.galleryUrls.forEach((url, index) => {
      if (url && !isValidUrl(url)) {
        newErrors[`galleryUrl_${index}`] = 'Please enter a valid URL';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Check if URL is valid
   */
  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showError('Validation Error', 'Please fix the errors in the form');
      return;
    }

    setIsSubmitting(true);
    const loadingId = showLoading('Saving Film', 'Please wait while we save the film data...');

    try {
      // Filter out empty gallery URLs
      const cleanedData = {
        ...formData,
        galleryUrls: formData.galleryUrls.filter(url => url.trim() !== '')
      };

      // Check if user is authenticated
      if (!user) {
        updateToError(loadingId, 'Authentication Error', 'You must be logged in to save a film');
        return;
      }

      let result;
      if (mode === 'edit' && filmId) {
        result = await updateFeatureFilm(filmId, cleanedData, user.uid);
      } else {
        result = await createFeatureFilm(cleanedData, user.uid);
      }

      if (result.success) {
        updateToSuccess(loadingId, 'Success!', `Film ${mode === 'edit' ? 'updated' : 'created'} successfully`);
        setIsDirty(false);
        onSuccess?.(result.data);
        onSave?.(result.data);
      } else {
        updateToError(loadingId, 'Error', result.error || 'Failed to save film');
      }
    } catch (error) {
      console.error('Error saving film:', error);
      updateToError(loadingId, 'Error', 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Reset form to initial state
   */
  const handleReset = () => {
    setFormData({
      titleEn: '',
      titleTh: '',
      category: '' as FilmCategory,
      genres: [],
      countries: [],
      languages: [],
      synopsis: '',
      targetAudience: [],
      screeningDate1: '',
      screeningDate2: '',
      timeEstimate: '' as TimeEstimate,
      theatre: '' as Theatre,
      director: '',
      producer: '',
      studio: '',
      distributor: '',
      mainActors: '',
      posterFile: undefined,
      posterUrl: '',
      trailerFile: undefined,
      trailerUrl: '',
      screenerUrl: '',
      materials: '',
      galleryFiles: [],
      galleryUrls: [''],
      galleryCoverIndex: 0,
      status: '' as FilmStatus,
      remarks: '',
      guestComing: false,
      guests: [],
      ...initialData
    });
    setErrors({});
    setIsDirty(false);
  };

  // Loading state for edit mode
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FCB283] mx-auto mb-4"></div>
          <p className="text-white/70">Loading film data from films database...</p>
        </div>
      </div>
    );
  }

  // Error state for edit mode
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] flex items-center justify-center">
        <div className="bg-red-500/20 border border-red-500/30 rounded-2xl p-8 text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-red-400 mb-2">Error Loading Film</h2>
          <p className="text-red-300 mb-6">{error}</p>
          <p className="text-red-300/80 text-sm mb-6">
            Failed to load film data from films database collection.
          </p>
          <button
            onClick={onNavigateBack || onCancel}
            className="flex items-center space-x-2 px-6 py-3 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition-colors mx-auto"
          >
            <span>Back to Gallery</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-r from-[#FCB283] to-[#AA4626] rounded-xl">
                <Film className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className={`text-2xl font-bold text-white ${getClass('header')}`}>
                  {mode === 'edit' ? t('featureFilm.edit') : t('featureFilm.addNew')}
                </h1>
                <p className={`text-white/70 ${getClass('subtitle')}`}>
                  {t('featureFilm.subtitle')}
                </p>
              </div>
            </div>
            
            {isDirty && (
              <div className="flex items-center space-x-2 text-yellow-400">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{t('featureFilm.unsavedChanges')}</span>
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Basic Film Information */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Film className="w-5 h-5 text-[#FCB283]" />
              <h2 className={`text-xl font-semibold text-white ${getClass('header')}`}>{t('featureFilm.sections.basicInfo')}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Title (English) */}
              <div>
                <label className={`block text-sm font-medium text-white/90 mb-2 ${getClass('body')}`}>
                  {t('featureFilm.fields.titleEn')} *
                </label>
                <input
                  type="text"
                  value={formData.titleEn}
                  onChange={(e) => handleInputChange('titleEn', e.target.value)}
                  className={`w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:border-[#FCB283] focus:outline-none transition-colors ${getClass('input')}`}
                  placeholder={t('featureFilm.placeholders.titleEn')}
                />
                {errors.titleEn && (
                  <p className="mt-1 text-sm text-red-400">{errors.titleEn}</p>
                )}
              </div>

              {/* Title (Thai) */}
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  {t('featureFilm.fields.titleTh')}
                </label>
                <input
                  type="text"
                  value={formData.titleTh}
                  onChange={(e) => handleInputChange('titleTh', e.target.value)}
                  className={`w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:border-[#FCB283] focus:outline-none transition-colors ${getClass('input')}`}
                  placeholder={t('featureFilm.placeholders.titleTh')}
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  {t('featureFilm.fields.category')} *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:border-[#FCB283] focus:outline-none transition-colors"
                >
                  <option value="">{t('featureFilm.placeholders.selectCategory')}</option>
                  {FILM_CATEGORIES.map(category => (
                    <option key={category} value={category} className="bg-[#1a1a2e] text-white">
                      {category}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="mt-1 text-sm text-red-400">{errors.category}</p>
                )}
              </div>

              {/* Length (Duration) */}
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Length (minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  max="999"
                  value={formData.length || ''}
                  onChange={(e) => handleInputChange('length', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:border-[#FCB283] focus:outline-none transition-colors"
                  placeholder="e.g. 120"
                />
                {errors.length && (
                  <p className="mt-1 text-sm text-red-400">{errors.length}</p>
                )}
              </div>

            </div>

            {/* Genre Selector - Full Width */}
            <div className="mt-6">
              <GenreSelector
                value={formData.genres}
                onChange={(genres) => handleInputChange('genres', genres)}
                error={errors.genres}
                required
                label={t('featureFilm.fields.genres')}
              />
            </div>

            {/* Countries and Languages - Side by Side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              {/* Country Selector */}
              <div>
                <CountrySelector
                  value={formData.countries}
                  onChange={(countries) => handleInputChange('countries', countries)}
                  error={errors.countries}
                  required
                  label={t('featureFilm.fields.countries')}
                />
              </div>

              {/* Language Selector */}
              <div>
                <LanguageSelector
                  value={formData.languages}
                  onChange={(languages) => handleInputChange('languages', languages)}
                  error={errors.languages}
                  required
                  label={t('featureFilm.fields.languages')}
                />
              </div>

            </div>

            {/* Synopsis */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-white/90 mb-2">
                {t('featureFilm.fields.synopsis')} *
              </label>
              <textarea
                value={formData.synopsis}
                onChange={(e) => handleInputChange('synopsis', e.target.value)}
                rows={4}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:border-[#FCB283] focus:outline-none transition-colors resize-none"
                placeholder={t('featureFilm.placeholders.synopsis')}
              />
              {errors.synopsis && (
                <p className="mt-1 text-sm text-red-400">{errors.synopsis}</p>
              )}
            </div>

            {/* Target Audience */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-white/90 mb-3">
                {t('featureFilm.fields.targetAudience')}
              </label>
              <div className="flex flex-wrap gap-2">
                {TARGET_AUDIENCES.map(audience => (
                  <button
                    key={audience}
                    type="button"
                    onClick={() => handleTargetAudienceToggle(audience)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      formData.targetAudience.includes(audience)
                        ? 'bg-gradient-to-r from-[#FCB283] to-[#AA4626] text-white shadow-lg'
                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }`}
                  >
                    {audience}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 2: Screening Information */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Calendar className="w-5 h-5 text-[#FCB283]" />
              <h2 className={`text-xl font-semibold text-white ${getClass('header')}`}>{t('featureFilm.sections.screeningInfo')}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Screening Date 1 */}
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  {t('featureFilm.fields.screeningDate1')} *
                </label>
                <input
                  type="datetime-local"
                  value={formData.screeningDate1}
                  onChange={(e) => handleInputChange('screeningDate1', e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:border-[#FCB283] focus:outline-none transition-colors"
                />
                {errors.screeningDate1 && (
                  <p className="mt-1 text-sm text-red-400">{errors.screeningDate1}</p>
                )}
              </div>

              {/* Screening Date 2 */}
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  {t('featureFilm.fields.screeningDate2')}
                </label>
                <input
                  type="datetime-local"
                  value={formData.screeningDate2}
                  onChange={(e) => handleInputChange('screeningDate2', e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:border-[#FCB283] focus:outline-none transition-colors"
                />
              </div>

              {/* Time Estimate */}
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  {t('featureFilm.fields.timeEstimate')} *
                </label>
                <select
                  value={formData.timeEstimate}
                  onChange={(e) => handleInputChange('timeEstimate', e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:border-[#FCB283] focus:outline-none transition-colors"
                >
                  <option value="">{t('featureFilm.placeholders.selectTimeEstimate')}</option>
                  {TIME_ESTIMATES.map(time => (
                    <option key={time} value={time} className="bg-[#1a1a2e] text-white">
                      {time}
                    </option>
                  ))}
                </select>
                {errors.timeEstimate && (
                  <p className="mt-1 text-sm text-red-400">{errors.timeEstimate}</p>
                )}
              </div>

              {/* Theatre */}
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  {t('featureFilm.fields.theatre')} *
                </label>
                <select
                  value={formData.theatre}
                  onChange={(e) => handleInputChange('theatre', e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:border-[#FCB283] focus:outline-none transition-colors"
                >
                  <option value="">{t('featureFilm.placeholders.selectTheatre')}</option>
                  {THEATRES.map(theatre => (
                    <option key={theatre} value={theatre} className="bg-[#1a1a2e] text-white">
                      {theatre}
                    </option>
                  ))}
                </select>
                {errors.theatre && (
                  <p className="mt-1 text-sm text-red-400">{errors.theatre}</p>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Production Information */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <div className="flex items-center space-x-3 mb-6">
              <User className="w-5 h-5 text-[#FCB283]" />
              <h2 className={`text-xl font-semibold text-white ${getClass('header')}`}>{t('featureFilm.sections.productionInfo')}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Director */}
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  {t('featureFilm.fields.director')} *
                </label>
                <input
                  type="text"
                  value={formData.director}
                  onChange={(e) => handleInputChange('director', e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:border-[#FCB283] focus:outline-none transition-colors"
                  placeholder={t('featureFilm.placeholders.director')}
                />
                {errors.director && (
                  <p className="mt-1 text-sm text-red-400">{errors.director}</p>
                )}
              </div>

              {/* Producer */}
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  {t('featureFilm.fields.producer')}
                </label>
                <input
                  type="text"
                  value={formData.producer}
                  onChange={(e) => handleInputChange('producer', e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:border-[#FCB283] focus:outline-none transition-colors"
                  placeholder={t('featureFilm.placeholders.producer')}
                />
              </div>

              {/* Studio/Production Company */}
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  {t('featureFilm.fields.studio')}
                </label>
                <input
                  type="text"
                  value={formData.studio}
                  onChange={(e) => handleInputChange('studio', e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:border-[#FCB283] focus:outline-none transition-colors"
                  placeholder={t('featureFilm.placeholders.studio')}
                />
              </div>

              {/* Distributor */}
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  {t('featureFilm.fields.distributor')}
                </label>
                <input
                  type="text"
                  value={formData.distributor}
                  onChange={(e) => handleInputChange('distributor', e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:border-[#FCB283] focus:outline-none transition-colors"
                  placeholder={t('featureFilm.placeholders.distributor')}
                />
              </div>

              {/* Main Actors */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-white/90 mb-2">
                  {t('featureFilm.fields.mainActors')}
                </label>
                <input
                  type="text"
                  value={formData.mainActors}
                  onChange={(e) => handleInputChange('mainActors', e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:border-[#FCB283] focus:outline-none transition-colors"
                  placeholder={t('featureFilm.placeholders.mainActors')}
                />
              </div>
            </div>
          </div>

          {/* Section 4: Media & Materials */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Image className="w-5 h-5 text-[#FCB283]" />
              <h2 className={`text-xl font-semibold text-white ${getClass('header')}`}>{t('featureFilm.sections.mediaAndMaterials')}</h2>
            </div>

            <div className="space-y-8">
              {/* Poster Upload */}
              <PosterUpload
                file={formData.posterFile}
                url={formData.posterUrl}
                onChange={(file, url) => {
                  handleInputChange('posterFile', file);
                  handleInputChange('posterUrl', url);
                }}
                error={errors.posterUrl}
              />

              {/* Trailer Upload */}
              <TrailerUpload
                file={formData.trailerFile}
                url={formData.trailerUrl}
                onChange={(file, url) => {
                  handleInputChange('trailerFile', file);
                  handleInputChange('trailerUrl', url);
                }}
                error={errors.trailerUrl}
              />

              {/* Gallery Upload */}
              <GalleryUpload
                value={formData.galleryFiles || []}
                urls={formData.galleryUrls}
                coverIndex={formData.galleryCoverIndex}
                onChange={(files, coverIndex) => {
                  handleInputChange('galleryFiles', files);
                  handleInputChange('galleryCoverIndex', coverIndex);
                }}
                onUrlsChange={(urls) => handleInputChange('galleryUrls', urls)}
                error={errors.galleryUrls}
              />

              {/* Screener URL */}
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  {t('featureFilm.fields.screenerUrl')}
                </label>
                <input
                  type="url"
                  value={formData.screenerUrl}
                  onChange={(e) => handleInputChange('screenerUrl', e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:border-[#FCB283] focus:outline-none transition-colors"
                  placeholder={t('featureFilm.placeholders.screenerUrl')}
                />
                {errors.screenerUrl && (
                  <p className="mt-1 text-sm text-red-400">{errors.screenerUrl}</p>
                )}
              </div>

              {/* Materials/Documents - Rich Text */}
              <div>
                <label className="block text-sm font-medium text-white/90 mb-3">
                  {t('featureFilm.fields.materials')}
                </label>
                <div className="bg-white/10 rounded-xl overflow-hidden">
                  <RichTextEditor
                    value={formData.materials}
                    onChange={(value) => handleInputChange('materials', value)}
                    placeholder={t('featureFilm.placeholders.materials')}
                    error={!!errors.materials}
                  />
                </div>
                {errors.materials && (
                  <p className="mt-2 text-sm text-red-400">{errors.materials}</p>
                )}
                <p className="mt-2 text-xs text-white/60">
                  {t('featureFilm.messages.materialsHint')}
                </p>
              </div>
            </div>
          </div>

          {/* Section 5: Status Information */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <div className="flex items-center space-x-3 mb-6">
              <FileText className="w-5 h-5 text-[#FCB283]" />
              <h2 className={`text-xl font-semibold text-white ${getClass('header')}`}>{t('featureFilm.sections.statusInfo')}</h2>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  {t('featureFilm.fields.status')} *
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:border-[#FCB283] focus:outline-none transition-colors"
                >
                  <option value="">{t('featureFilm.placeholders.selectStatus')}</option>
                  {FILM_STATUSES.map(status => (
                    <option key={status} value={status} className="bg-[#1a1a2e] text-white">
                      {status}
                    </option>
                  ))}
                </select>
                {errors.status && (
                  <p className="mt-1 text-sm text-red-400">{errors.status}</p>
                )}
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  {t('featureFilm.fields.remarks')}
                </label>
                <textarea
                  value={formData.remarks}
                  onChange={(e) => handleInputChange('remarks', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:border-[#FCB283] focus:outline-none transition-colors resize-none"
                  placeholder={t('featureFilm.placeholders.remarks')}
                />
              </div>
            </div>
          </div>

          {/* Section 6: Guest Information */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <div className="flex items-center space-x-3 mb-6">
              <User className="w-5 h-5 text-[#FCB283]" />
              <h2 className={`text-xl font-semibold text-white ${getClass('header')}`}>{t('featureFilm.sections.guestInfo')}</h2>
            </div>

            <div className="space-y-6">
              {/* Guest Coming */}
              <div>
                <label className="block text-sm font-medium text-white/90 mb-3">
                  {t('featureFilm.fields.guestComing')}
                </label>
                <div className="flex space-x-6">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="guestComing"
                      checked={formData.guestComing === true}
                      onChange={() => handleInputChange('guestComing', true)}
                      className="w-4 h-4 text-[#FCB283] bg-white/10 border-white/20 focus:ring-[#FCB283] focus:ring-2"
                    />
                    <span className="text-white/90">{t('featureFilm.labels.yes')}</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="guestComing"
                      checked={formData.guestComing === false}
                      onChange={() => handleInputChange('guestComing', false)}
                      className="w-4 h-4 text-[#FCB283] bg-white/10 border-white/20 focus:ring-[#FCB283] focus:ring-2"
                    />
                    <span className="text-white/90">{t('featureFilm.labels.no')}</span>
                  </label>
                </div>
              </div>

              {/* Guest Management - Show only if guest is coming */}
              {formData.guestComing && (
                <GuestManagement
                  guests={formData.guests || []}
                  onChange={(guests) => handleInputChange('guests', guests)}
                  disabled={isSubmitting}
                />
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
              {/* Delete Button - Left Side */}
              <div className="flex">
                {mode === 'edit' && (
                  <button
                    type="button"
                    onClick={() => {
                      // TODO: Implement delete functionality
                      console.log('Delete film');
                    }}
                    disabled={isSubmitting}
                    className="flex items-center justify-center space-x-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-5 h-5" />
                    <span>{t('featureFilm.actions.delete') || 'Delete'}</span>
                  </button>
                )}
              </div>

              {/* CTA Buttons - Right Side */}
              <div className="flex flex-col sm:flex-row gap-4">
                {onCancel && (
                  <button
                    type="button"
                    onClick={onCancel}
                    disabled={isSubmitting}
                    className="px-6 py-3 text-white/70 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t('featureFilm.actions.cancel')}
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleReset}
                  disabled={isSubmitting}
                  className="flex items-center justify-center space-x-2 px-6 py-3 bg-white/10 text-white rounded-xl font-medium hover:bg-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RotateCcw className="w-5 h-5" />
                  <span>{t('featureFilm.actions.reset')}</span>
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-[#FCB283] to-[#AA4626] text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>{t('featureFilm.actions.saving')}</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      <span>{mode === 'edit' ? t('featureFilm.actions.updateFilm') : t('featureFilm.actions.saveFilm')}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Development Preview */}
          {process.env.NODE_ENV === 'development' && (
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Form Data Preview (Development)</h3>
              <pre className="bg-black/20 p-4 rounded-xl text-xs text-white/70 overflow-auto max-h-96">
                {JSON.stringify(formData, null, 2)}
              </pre>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default FeatureFilmForm;
