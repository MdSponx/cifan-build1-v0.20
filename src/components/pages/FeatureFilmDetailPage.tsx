import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Film, 
  Calendar,
  Clock,
  User,
  MapPin,
  Star,
  Play,
  Download,
  Share2,
  ArrowLeft,
  Eye,
  Users,
  Award,
  Globe,
  Languages,
  AlertCircle,
  CheckCircle,
  Archive,
  ExternalLink,
  Phone,
  Mail,
  Building,
  GraduationCap,
  FileText,
  Image as ImageIcon,
  Video,
  Headphones
} from 'lucide-react';
import { useTypography } from '../../utils/typography';
import { useNotificationHelpers } from '../ui/NotificationContext';
import { FeatureFilmData, Guest } from '../../types/featureFilm.types';
import { getFeatureFilm } from '../../services/featureFilmService';
import { formatFileSize } from '../../utils/fileUpload';
import FormSection from '../forms/FormSection';
import { getCountryFlag, getLanguageFlag, getTargetAudienceEmoji, getGenreEmoji } from '../../utils/flagsAndEmojis';
import AnimatedBackground from '../ui/AnimatedBackground';

interface FeatureFilmDetailPageProps {
  filmId: string;
  onNavigateBack?: () => void;
  mode?: 'public' | 'admin';
  filmLogo?: string | null;
}

/**
 * Feature Film Detail Page Component
 * 
 * Comprehensive read-only display for feature films that mirrors the layout structure 
 * of the existing FeatureFilmForm but displays all film data in a beautiful, read-only format.
 * 
 * Features:
 * - Cover photo hero banner
 * - Film info with poster layout
 * - Trailer video player
 * - Technical details
 * - Director/submitter information
 * - Educational details (if applicable)
 * - Additional files & documents
 * - Submission details
 */
const FeatureFilmDetailPage: React.FC<FeatureFilmDetailPageProps> = ({
  filmId,
  onNavigateBack,
  mode = 'public',
  filmLogo = null
}) => {
  const { t } = useTranslation();
  const { getClass } = useTypography();
  const { showError, showLoading, updateToSuccess, updateToError } = useNotificationHelpers();

  const [film, setFilm] = useState<FeatureFilmData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showTrailer, setShowTrailer] = useState(false);

  /**
   * Fetch film data with performance optimization
   */
  useEffect(() => {
    let isMounted = true;
    
    const fetchFilm = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const result = await getFeatureFilm(filmId);
        
        if (!isMounted) return; // Prevent state update if component unmounted
        
        if (result.success && result.data) {
          setFilm(result.data);
        } else {
          setError(result.error || 'Film not found');
        }
      } catch (err) {
        if (!isMounted) return;
        setError('Failed to load film details');
        console.error('Error fetching film:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (filmId) {
      fetchFilm();
    }
    
    return () => {
      isMounted = false;
    };
  }, [filmId]);

  /**
   * Get status badge color
   */
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'draft':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'archived':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default:
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
  };

  /**
   * Get status icon
   */
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published':
        return <CheckCircle className="w-4 h-4" />;
      case 'draft':
        return <AlertCircle className="w-4 h-4" />;
      case 'archived':
        return <Archive className="w-4 h-4" />;
      default:
        return <Film className="w-4 h-4" />;
    }
  };

  /**
   * Format duration
   */
  const formatDuration = (minutes: number) => {
    if (!minutes || isNaN(minutes)) return 'Not specified';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins} minutes`;
  };

  /**
   * Handle share
   */
  const handleShare = async () => {
    if (navigator.share && film) {
      try {
        await navigator.share({
          title: film.titleEn,
          text: film.synopsis,
          url: window.location.href,
        });
      } catch (err) {
        // Fallback to clipboard
        navigator.clipboard.writeText(window.location.href);
        showError(t('featureFilmDetail.linkCopied'));
      }
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(window.location.href);
      showError(t('featureFilmDetail.linkCopied'));
    }
  };

  /**
   * Info Field Component - Display field with label and value
   */
  const InfoField: React.FC<{
    label: string;
    value: any;
    type?: 'text' | 'email' | 'phone' | 'date' | 'badges' | 'image' | 'video';
  }> = ({ label, value, type = 'text' }) => {
    if (!value || (Array.isArray(value) && value.length === 0)) {
      return null;
    }

    const renderValue = () => {
      switch (type) {
        case 'email':
          return (
            <a href={`mailto:${value}`} className="text-[#FCB283] hover:text-[#FCB283]/80 transition-colors">
              {value}
            </a>
          );
        case 'phone':
          return (
            <a href={`tel:${value}`} className="text-[#FCB283] hover:text-[#FCB283]/80 transition-colors">
              {value}
            </a>
          );
        case 'date':
          return new Date(value).toLocaleDateString();
        case 'badges':
          return (
            <div className="flex flex-wrap gap-2">
              {value.map((item: string, index: number) => {
                let displayText = item;
                
                // Add flags/emojis based on label type
                if (label === t('featureFilmDetail.countries') || label === 'Countries') {
                  displayText = `${getCountryFlag(item)} ${item}`;
                } else if (label === t('featureFilmDetail.languages') || label === 'Languages') {
                  displayText = `${getLanguageFlag(item)} ${item}`;
                } else if (label === t('featureFilmDetail.targetAudience') || label === 'Target Audience') {
                  displayText = `${getTargetAudienceEmoji(item)} ${item}`;
                } else if (label === t('featureFilmDetail.genres') || label === 'Genres') {
                  displayText = `${getGenreEmoji(item)} ${item}`;
                }
                
                return (
                  <span
                    key={index}
                    className="px-3 py-1 bg-[#FCB283]/10 text-[#FCB283] rounded-full text-sm border border-[#FCB283]/15"
                  >
                    {displayText}
                  </span>
                );
              })}
            </div>
          );
        default:
          return <span className="text-white">{value}</span>;
      }
    };

    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-white/60 mb-2">
          {label}
        </label>
        {renderValue()}
      </div>
    );
  };

  /**
   * Badge List Component - Display array items as styled badges
   */
  const BadgeList: React.FC<{ items: string[]; color?: string }> = ({ items, color = '[#FCB283]' }) => {
    if (!items || items.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-2">
        {items.map((item, index) => (
          <span
            key={index}
            className={`px-3 py-1 bg-${color}/20 text-${color} rounded-full text-sm border border-${color}/30`}
          >
            {item}
          </span>
        ))}
      </div>
    );
  };

  /**
   * File Display Component - Display files appropriately based on type
   */
  const FileDisplay: React.FC<{
    file: any;
    type: 'image' | 'video' | 'document';
  }> = ({ file, type }) => {
    if (!file) return null;

    const getIcon = () => {
      switch (type) {
        case 'image':
          return <ImageIcon className="w-5 h-5" />;
        case 'video':
          return <Video className="w-5 h-5" />;
        case 'document':
          return <FileText className="w-5 h-5" />;
        default:
          return <FileText className="w-5 h-5" />;
      }
    };

    return (
      <a
        href={file.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors border border-white/10"
      >
        <div className="flex items-center space-x-3">
          {getIcon()}
          <div>
            <span className="text-white/90 font-medium">{file.name || 'File'}</span>
            {file.size && (
              <p className="text-white/60 text-sm">{formatFileSize(file.size)}</p>
            )}
          </div>
        </div>
        <ExternalLink className="w-4 h-4 text-white/60" />
      </a>
    );
  };

  /**
   * Get audience emoji helper
   */
  const getAudienceEmoji = (audience: string): string => {
    const emojiMap: { [key: string]: string } = {
      'Popcorn': '🍿',
      'Cinephile': '🎭',
      'College Student': '🎓',
      'Student': '📚',
      'Art People': '🎨',
      'Folk': '🌾',
      'Novel Fan': '📖',
      'J-Horror Fan': '👻',
      'Youth': '🌟',
      'Family': '👨‍👩‍👧‍👦'
    };
    return emojiMap[audience] || '🎬';
  };

  /**
   * Enhanced Cover Photo Hero Component with Logo Support and Fixed Navbar Offset
   */
  const CoverPhotoHero: React.FC<{
    coverImage?: string;
    title: string;
    titleTh?: string;
    genres: string[];
    targetAudience: string[];
    category: string;
    logo?: string | null;
  }> = ({ coverImage, title, titleTh, genres, targetAudience, category, logo }) => {
    return (
      <div className="relative h-[40vh] md:h-[50vh] overflow-hidden" style={{ marginTop: mode === 'public' ? '0' : '0' }}>
        {/* Cover Photo */}
        {coverImage ? (
          <img 
            src={coverImage} 
            alt={title}
            className="w-full h-full object-cover"
            loading="eager"
            decoding="async"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460]" />
        )}
        
        {/* Overlay Content */}
        <div className="cover-photo-overlay">
          {/* Main Content - Center-Left with proper top offset for navbar */}
          <div className="absolute bottom-8 left-8 right-8" style={{ paddingTop: mode === 'public' ? '4rem' : '0' }}>
            {/* Logo Section - Above Title */}
            {logo && (
              <div className="mb-6">
                <img 
                  src={logo} 
                  alt={`${title} Logo`}
                  className="h-16 md:h-20 lg:h-24 w-auto object-contain filter drop-shadow-lg"
                  loading="eager"
                  decoding="async"
                />
              </div>
            )}
            
            {/* Title Section */}
            <div className="mb-6">
              {/* English Title - Large & Bold */}
              <h1 className={`cover-title-en text-white mb-2 ${getClass('header')}`}>
                {title}
              </h1>
              
              {/* Thai Title - Smaller & Light */}
              {titleTh && (
                <h2 className={`cover-title-th text-white/90 mb-4 ${getClass('subtitle')}`}>
                  {titleTh}
                </h2>
              )}
              
              {/* Genres + Target Audience Stacked */}
              <div className="space-y-3">
                {/* Genres Row */}
                <div className="flex flex-wrap gap-2">
                  <span className="text-white/80 text-sm font-medium mr-2">Genres:</span>
                  {genres.map(genre => (
                    <span key={genre} className="cover-badge px-3 py-1 bg-blue-600/35 backdrop-blur-sm text-white rounded-full">
                      {getGenreEmoji(genre)} {genre}
                    </span>
                  ))}
                </div>
                
                {/* Target Audience Row */}
                <div className="flex flex-wrap gap-2">
                  <span className="text-white/80 text-sm font-medium mr-2">Target:</span>
                  {targetAudience.map(audience => (
                    <span key={audience} className="cover-badge px-3 py-1 bg-purple-600/35 backdrop-blur-sm text-white rounded-full">
                      {getTargetAudienceEmoji(audience)} {audience}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Category - Bottom Right (Unchanged Position) */}
          <div className="absolute bottom-8 right-8">
            <div className="px-4 py-2 bg-[#FCB283]/90 backdrop-blur-sm text-white rounded-lg font-semibold text-lg">
              {category.toUpperCase()}
            </div>
          </div>
        </div>
      </div>
    );
  };

  /**
   * Restructured Film Info with Poster Component - New Layout
   */
  const FilmInfoWithPoster: React.FC<{
    posterImage?: string;
    filmData: FeatureFilmData;
  }> = ({ posterImage, filmData }) => {
    return (
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6 mb-8">
        {/* Section Header */}
        <div className="flex items-center gap-3 mb-6">
          <span className="text-2xl">🎬</span>
          <h3 className={`text-xl font-semibold text-white ${getClass('header')}`}>Film Information</h3>
        </div>

        {/* Main Content Grid: Poster + Information */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-8">
          
          {/* Poster Section - Left Side */}
          <div className="lg:col-span-1">
            <div className="aspect-[2/3] rounded-lg overflow-hidden shadow-2xl film-poster">
              {posterImage ? (
                <img 
                  src={posterImage} 
                  alt={filmData.titleEn}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#1a1a2e] to-[#16213e] flex items-center justify-center">
                  <Film className="w-16 h-16 text-white/30" />
                </div>
              )}
            </div>
          </div>
          
          {/* Film Details Grid - Right Side */}
          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 h-fit">
              
              {/* Countries */}
              <div>
                <h4 className="text-white/70 text-sm font-medium mb-2">Countries</h4>
                <div className="flex flex-wrap gap-2">
                  {filmData.countries?.map(country => (
                    <span key={country} className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm">
                      🇹🇭 {country}
                    </span>
                  ))}
                </div>
              </div>

              {/* Languages */}
              <div>
                <h4 className="text-white/70 text-sm font-medium mb-2">Languages</h4>
                <div className="flex flex-wrap gap-2">
                  {filmData.languages?.map(language => (
                    <span key={language} className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm">
                      {getLanguageFlag(language)} {language}
                    </span>
                  ))}
                </div>
              </div>

              {/* Length/Duration */}
              <div>
                <h4 className="text-white/70 text-sm font-medium mb-2">Length</h4>
                <p className="text-white text-lg font-medium">⏱️ {filmData.length} minutes</p>
              </div>

              {/* Director */}
              <div>
                <h4 className="text-white/70 text-sm font-medium mb-2">Director</h4>
                <p className="text-white text-lg font-medium">🎬 {filmData.director}</p>
              </div>

              {/* Cast */}
              <div className="md:col-span-2">
                <h4 className="text-white/70 text-sm font-medium mb-2">Cast</h4>
                <div className="flex flex-wrap gap-2">
                  {filmData.mainActors?.split(',').map((actor, index) => (
                    <span key={index} className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm">
                      🎭 {actor.trim()}
                    </span>
                  ))}
                </div>
              </div>

              {/* Theatre */}
              <div>
                <h4 className="text-white/70 text-sm font-medium mb-2">Theatre</h4>
                <p className="text-white text-lg font-medium">🏛️ {filmData.theatre}</p>
              </div>

              {/* Screening Date */}
              <div className="md:col-span-2">
                <h4 className="text-white/70 text-sm font-medium mb-2">Screening Date</h4>
                {filmData.screeningDate1 && (
                  <p className="text-white text-lg font-medium">
                    📅 {new Date(filmData.screeningDate1).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </p>
                )}
              </div>

              {/* After Screen Activities */}
              <div className="md:col-span-3">
                <h4 className="text-white/70 text-sm font-medium mb-2">After Screen Activities</h4>
                {filmData.afterScreenActivities && filmData.afterScreenActivities.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {filmData.afterScreenActivities.map((activityId) => {
                      const activityMap = {
                        'qna': { emoji: '🎤', label: 'Q&A Session' },
                        'talk': { emoji: '💬', label: 'Director Talk' },
                        'redcarpet': { emoji: '🔴', label: 'Red Carpet' },
                        'fanmeeting': { emoji: '👥', label: 'Fan Meeting' },
                        'education': { emoji: '📚', label: 'Education Event' }
                      };
                      const activity = activityMap[activityId as keyof typeof activityMap];
                      return activity ? (
                        <span key={activityId} className="px-3 py-1 bg-orange-500/20 text-orange-300 rounded-full text-sm">
                          {activity.emoji} {activity.label}
                        </span>
                      ) : null;
                    })}
                  </div>
                ) : (
                  <p className="text-white/50 text-sm">No after screen activities scheduled</p>
                )}
              </div>
              
              {/* NOTE: Time Estimate field REMOVED as requested */}
              
            </div>
          </div>
        </div>

        {/* Synopsis - Full Width Bottom Section */}
        {filmData.synopsis && (
          <div className="border-t border-white/10 pt-6">
            <h4 className="text-white/70 text-sm font-medium mb-3">Synopsis</h4>
            <div className="bg-white/5 rounded-lg p-6 border border-white/10">
              <p className="synopsis-container text-white/90 leading-relaxed text-base">
                {filmData.synopsis}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  /**
   * Video URL utilities
   */
  const getVideoType = (url: string): 'youtube' | 'vimeo' | 'direct' => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      return 'youtube';
    }
    if (url.includes('vimeo.com')) {
      return 'vimeo';
    }
    return 'direct';
  };

  const getYouTubeVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/v\/([^&\n?#]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const getVimeoVideoId = (url: string): string | null => {
    const pattern = /vimeo\.com\/(?:video\/)?(\d+)/;
    const match = url.match(pattern);
    return match ? match[1] : null;
  };

  /**
   * Fixed Trailer Player Component with ultra-strict containment
   */
  const TrailerPlayer: React.FC<{
    trailerUrl?: string;
    posterImage?: string;
  }> = ({ trailerUrl, posterImage }) => {
    if (!trailerUrl) return null;

    const videoType = getVideoType(trailerUrl);
    
    const renderPlayer = () => {
      switch (videoType) {
        case 'youtube': {
          const videoId = getYouTubeVideoId(trailerUrl);
          if (!videoId) {
            return (
              <div className="absolute inset-0 flex items-center justify-center bg-red-500/20 text-red-400">
                <div className="text-center">
                  <AlertCircle className="w-12 h-12 mx-auto mb-2" />
                  <p>Invalid YouTube URL</p>
                </div>
              </div>
            );
          }
          
          return (
            <iframe
              src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&showinfo=0&autohide=1&controls=1`}
              title="YouTube Trailer"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                border: 'none',
                outline: 'none',
                borderRadius: '0.75rem',
                // CRITICAL: Strict size constraints
                maxWidth: '100%',
                maxHeight: '100%',
                minWidth: '100%',
                minHeight: '100%'
              }}
            />
          );
        }
        
        case 'vimeo': {
          const videoId = getVimeoVideoId(trailerUrl);
          if (!videoId) {
            return (
              <div className="absolute inset-0 flex items-center justify-center bg-red-500/20 text-red-400">
                <div className="text-center">
                  <AlertCircle className="w-12 h-12 mx-auto mb-2" />
                  <p>Invalid Vimeo URL</p>
                </div>
              </div>
            );
          }
          
          return (
            <iframe
              src={`https://player.vimeo.com/video/${videoId}?title=0&byline=0&portrait=0`}
              title="Vimeo Trailer"
              frameBorder="0"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                border: 'none',
                outline: 'none',
                borderRadius: '0.75rem',
                // CRITICAL: Strict size constraints
                maxWidth: '100%',
                maxHeight: '100%',
                minWidth: '100%',
                minHeight: '100%'
              }}
            />
          );
        }
        
        case 'direct':
        default:
          return (
            <video 
              controls 
              poster={posterImage}
              preload="metadata"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: '0.75rem'
              }}
            >
              <source src={trailerUrl} type="video/mp4" />
              <p className="text-white/60">Your browser does not support the video tag.</p>
            </video>
          );
      }
    };

    return (
      <div className="trailer-container-wrapper">
        <h3 className={`text-2xl font-bold text-white mb-6 flex items-center space-x-2 ${getClass('header')}`}>
          <Video className="w-6 h-6 text-[#FCB283]" />
          <span>{t('featureFilmDetail.trailer')}</span>
          {videoType !== 'direct' && (
            <span className="text-sm font-normal text-white/60 ml-2">
              ({videoType === 'youtube' ? 'YouTube' : 'Vimeo'})
            </span>
          )}
        </h3>
        
        {/* FIXED: Ultra-strict container with multiple containment layers */}
        <div className="video-outer-container">
          <div className="video-aspect-wrapper">
            <div className="video-iframe-container">
              {renderPlayer()}
            </div>
          </div>
        </div>
        
        {/* External link for YouTube/Vimeo */}
        {videoType !== 'direct' && (
          <div className="mt-4 flex items-center justify-between text-sm text-white/60">
            <span>Watch on {videoType === 'youtube' ? 'YouTube' : 'Vimeo'}</span>
            <a 
              href={trailerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#FCB283] hover:text-white transition-colors flex items-center space-x-1"
            >
              <span>Open in {videoType === 'youtube' ? 'YouTube' : 'Vimeo'}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#110D16] text-white relative">
        <AnimatedBackground />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FCB283] mx-auto mb-4"></div>
            <p className="text-white/70">Loading film details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !film) {
    return (
      <div className="min-h-screen bg-[#110D16] text-white relative">
        <AnimatedBackground />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="bg-red-500/20 border border-red-500/30 rounded-2xl p-8 text-center max-w-md">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-red-400 mb-2">Film Not Found</h2>
            <p className="text-red-300 mb-6">{error || 'The requested film could not be found.'}</p>
            <button
              onClick={onNavigateBack}
              className="flex items-center space-x-2 px-6 py-3 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition-colors mx-auto"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Gallery</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#110D16] text-white relative">
      <AnimatedBackground />
      <div className="relative z-10">
      {/* Header - Only show in admin mode */}
      {mode === 'admin' && (
        <div className="bg-white/5 backdrop-blur-sm border-b border-white/10 sticky top-0 z-40 h-16 sm:h-20">
          <div className="max-w-7xl mx-auto px-4 h-full">
            <div className="flex items-center justify-between h-full">
              <button
                onClick={onNavigateBack}
                className="flex items-center space-x-2 px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>{t('featureFilmDetail.backToGallery')}</span>
              </button>
              
              <div className="flex items-center space-x-3">
                {/* Status Badge */}
                <span className={`inline-flex items-center space-x-2 px-3 py-2 rounded-full text-sm font-medium border ${getStatusBadgeColor(film.status)}`}>
                  {getStatusIcon(film.status)}
                  <span className="capitalize">{film.status}</span>
                </span>
                
                <button
                  onClick={handleShare}
                  className="p-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors"
                  title="Share Film"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hero Cover Photo Section with Logo Support and Proper Offset */}
      <div className={mode === 'public' ? 'pt-16 sm:pt-20' : ''}>
        <CoverPhotoHero
          coverImage={film.galleryUrls && film.galleryUrls.length > 0 ? film.galleryUrls[film.galleryCoverIndex || 0] : undefined}
          title={film.titleEn}
          titleTh={film.titleTh}
          genres={film.genres || []}
          targetAudience={film.targetAudience || []}
          category={film.category}
          logo={filmLogo}
        />
      </div>

      <div className="container mx-auto px-4 py-8">
        
        {/* Film Information with Poster Section */}
        <FilmInfoWithPoster
          posterImage={film.posterUrl}
          filmData={film}
        />

        {/* Trailer Video Player Section */}
        <TrailerPlayer
          trailerUrl={film.trailerUrl}
          posterImage={film.posterUrl}
        />

        {/* Production Information Section */}
        <FormSection title={t('featureFilmDetail.productionInformation')} icon="🎬">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoField label={t('featureFilmDetail.director')} value={film.director} />
            <InfoField label={t('featureFilmDetail.producer')} value={film.producer} />
            <InfoField label={t('featureFilmDetail.studio')} value={film.studio} />
            <InfoField label={t('featureFilmDetail.distributor')} value={film.distributor} />
            <InfoField label={t('featureFilmDetail.mainActors')} value={film.mainActors} />
          </div>
        </FormSection>


        {/* Additional Files & Documents Section */}
        {(film.galleryUrls && film.galleryUrls.length > 0) && (
          <FormSection title={t('featureFilmDetail.gallery')} icon="📁">
            <div className="space-y-6">
              {/* Gallery Images */}
              <div>
                <h4 className="text-lg font-semibold text-white mb-4">{t('featureFilmDetail.galleryImages')}</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {film.galleryUrls.filter(url => url.trim() !== '').map((imageUrl, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(imageUrl)}
                      className="aspect-square bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-lg overflow-hidden hover:scale-105 transition-transform"
                    >
                      <img
                        src={imageUrl}
                        alt={`${film.titleEn} gallery ${index + 1}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Download Links */}
              {mode === 'admin' && (
                <div>
                  <h4 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                    <Download className="w-5 h-5" />
                    <span>{t('featureFilmDetail.downloads')}</span>
                  </h4>
                  <div className="space-y-2">
                    {film.posterUrl && (
                      <a
                        href={film.posterUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors border border-white/10"
                      >
                        <div className="flex items-center space-x-3">
                          <ImageIcon className="w-5 h-5" />
                          <span className="text-white/90 font-medium">{t('featureFilmDetail.poster')}</span>
                        </div>
                        <ExternalLink className="w-4 h-4 text-white/60" />
                      </a>
                    )}
                    {film.trailerUrl && (
                      <a
                        href={film.trailerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors border border-white/10"
                      >
                        <div className="flex items-center space-x-3">
                          <Video className="w-5 h-5" />
                          <span className="text-white/90 font-medium">{t('featureFilmDetail.trailer')}</span>
                        </div>
                        <ExternalLink className="w-4 h-4 text-white/60" />
                      </a>
                    )}
                    {film.screenerUrl && (
                      <a
                        href={film.screenerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors border border-white/10"
                      >
                        <div className="flex items-center space-x-3">
                          <Video className="w-5 h-5" />
                          <span className="text-white/90 font-medium">{t('featureFilmDetail.screener')}</span>
                        </div>
                        <ExternalLink className="w-4 h-4 text-white/60" />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </FormSection>
        )}


      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={selectedImage}
            alt="Gallery image"
            className="max-w-full max-h-full object-contain"
          />
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 p-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors"
          >
            ×
          </button>
        </div>
      )}

      {/* Trailer Modal - Using trailerUrl instead of files.trailer */}
      {showTrailer && film.trailerUrl && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setShowTrailer(false)}
        >
          <div className="w-full max-w-4xl aspect-video" onClick={(e) => e.stopPropagation()}>
            {(() => {
              const videoType = getVideoType(film.trailerUrl!);
              
              switch (videoType) {
                case 'youtube': {
                  const videoId = getYouTubeVideoId(film.trailerUrl!);
                  if (!videoId) {
                    return (
                      <div className="w-full h-full flex items-center justify-center bg-red-500/20 text-red-400 rounded-lg">
                        <div className="text-center">
                          <AlertCircle className="w-12 h-12 mx-auto mb-2" />
                          <p>Invalid YouTube URL</p>
                        </div>
                      </div>
                    );
                  }
                  
                  return (
                    <iframe
                      src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&showinfo=0&autoplay=1`}
                      title="YouTube Trailer"
                      className="w-full h-full rounded-lg"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  );
                }
                
                case 'vimeo': {
                  const videoId = getVimeoVideoId(film.trailerUrl!);
                  if (!videoId) {
                    return (
                      <div className="w-full h-full flex items-center justify-center bg-red-500/20 text-red-400 rounded-lg">
                        <div className="text-center">
                          <AlertCircle className="w-12 h-12 mx-auto mb-2" />
                          <p>Invalid Vimeo URL</p>
                        </div>
                      </div>
                    );
                  }
                  
                  return (
                    <iframe
                      src={`https://player.vimeo.com/video/${videoId}?title=0&byline=0&portrait=0&autoplay=1`}
                      title="Vimeo Trailer"
                      className="w-full h-full rounded-lg"
                      frameBorder="0"
                      allow="autoplay; fullscreen; picture-in-picture"
                      allowFullScreen
                    />
                  );
                }
                
                case 'direct':
                default:
                  return (
                    <video
                      src={film.trailerUrl}
                      controls
                      autoPlay
                      className="w-full h-full rounded-lg"
                    />
                  );
              }
            })()}
          </div>
          <button
            onClick={() => setShowTrailer(false)}
            className="absolute top-4 right-4 p-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors"
          >
            ×
          </button>
        </div>
      )}
      </div>
    </div>
  );
};

export default FeatureFilmDetailPage;
