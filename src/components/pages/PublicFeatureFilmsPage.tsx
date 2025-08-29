import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Search,
  Filter,
  Calendar,
  Film,
  AlertCircle,
  Loader2,
  ChevronDown
} from 'lucide-react';
import { useTypography } from '../../utils/typography';
import { FeatureFilm, FeatureFilmData } from '../../types/featureFilm.types';
import { useFeatureFilms } from '../../hooks/useFeatureFilms';

// Union type to handle both legacy and new data structures
type FilmDataUnion = FeatureFilm | (FeatureFilmData & { publicationStatus?: string });

interface PublicFeatureFilmsPageProps {
  onNavigateToDetail: (filmId: string) => void;
}

/**
 * Public Feature Films Gallery Page
 * 
 * Displays published feature films in a poster gallery format with search and filtering capabilities.
 * Features:
 * - Official Selection header with logo
 * - Search by title and director
 * - Year filter dropdown
 * - Responsive poster grid
 * - Click to navigate to detail page
 */
const PublicFeatureFilmsPage: React.FC<PublicFeatureFilmsPageProps> = ({
  onNavigateToDetail
}) => {
  const { t } = useTranslation();
  const { getClass } = useTypography();

  // State management for UI
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [showYearDropdown, setShowYearDropdown] = useState(false);

  // Use the useFeatureFilms hook with published status filter
  const { films: allFilms, loading, error } = useFeatureFilms(
    { status: 'published' }, // Only get published films
    true // Enable real-time updates
  );

  // Filter films for public publication status with enhanced debugging and data structure handling
  const films = useMemo(() => {
    if (!allFilms) {
      console.log('PublicFeatureFilmsPage: No films data available');
      return [];
    }

    console.log('PublicFeatureFilmsPage: Raw films data:', allFilms);
    console.log('PublicFeatureFilmsPage: Total films received:', allFilms.length);

    const publicFilms = (allFilms as FilmDataUnion[]).filter(film => {
      // Handle both legacy FeatureFilmData and new FeatureFilm structures
      const filmTitle = film.title || (film as any).titleEn || 'Unknown Title';
      const filmStatus = film.status;
      const publicationStatus = (film as any).publicationStatus;
      
      console.log(`Film "${filmTitle}":`, {
        id: film.id,
        status: filmStatus,
        publicationStatus: publicationStatus,
        hasTitle: !!(film.title || (film as any).titleEn),
        hasDirector: !!film.director,
        dataStructure: film.title ? 'new' : 'legacy'
      });

      // Primary filter: publicationStatus must be 'public'
      const isPublic = publicationStatus === 'public';
      
      if (!isPublic) {
        console.log(`Film "${filmTitle}" filtered out: publicationStatus = ${publicationStatus}`);
        return false;
      }

      // Additional validation: ensure film has required fields
      const hasRequiredFields = (film.title || (film as any).titleEn) && film.director;
      if (!hasRequiredFields) {
        console.log(`Film "${filmTitle}" filtered out: missing required fields`);
        return false;
      }

      return true;
    });

    console.log('PublicFeatureFilmsPage: Public films after filtering:', publicFilms.length);
    console.log('PublicFeatureFilmsPage: Public films:', publicFilms.map(f => ({
      id: f.id,
      title: f.title || (f as any).titleEn,
      director: f.director,
      publicationStatus: (f as any).publicationStatus
    })));

    return publicFilms;
  }, [allFilms]);

  /**
   * Get available years from films for filter dropdown - Handle both data structures
   */
  const availableYears = useMemo(() => {
    const years = films
      .map(film => {
        // Handle both new FeatureFilm (releaseYear) and legacy FeatureFilmData (createdAt year)
        if ((film as any).releaseYear) {
          return (film as any).releaseYear;
        }
        
        // Fallback to creation year for legacy data
        if (film.createdAt) {
          const createdDate = film.createdAt instanceof Date ? film.createdAt : new Date(film.createdAt);
          return createdDate.getFullYear();
        }
        
        return new Date().getFullYear();
      })
      .filter((year, index, array) => array.indexOf(year) === index)
      .sort((a, b) => b - a); // Newest first
    
    return years;
  }, [films]);

  /**
   * Filter films based on search term and selected year - Handle both data structures
   */
  const filteredFilms = useMemo(() => {
    let filtered = films;

    // Search filter - handle both data structures
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(film => {
        const title = film.title || (film as any).titleEn || '';
        const titleTh = film.titleTh || '';
        const director = film.director || '';
        
        return title.toLowerCase().includes(searchLower) ||
               titleTh.toLowerCase().includes(searchLower) ||
               director.toLowerCase().includes(searchLower);
      });
    }

    // Year filter - handle both data structures
    if (selectedYear) {
      filtered = filtered.filter(film => {
        let filmYear;
        
        if ((film as any).releaseYear) {
          filmYear = (film as any).releaseYear;
        } else if (film.createdAt) {
          const createdDate = film.createdAt instanceof Date ? film.createdAt : new Date(film.createdAt);
          filmYear = createdDate.getFullYear();
        } else {
          filmYear = new Date().getFullYear();
        }
        
        return filmYear === parseInt(selectedYear);
      });
    }

    return filtered;
  }, [films, searchTerm, selectedYear]);

  /**
   * Get poster image URL with fallback priority - Handle both data structures
   */
  const getPosterUrl = (film: any): string | null => {
    // Priority 1: poster file from new FeatureFilm structure
    if (film.files?.poster?.url) return film.files.poster.url;
    
    // Priority 2: legacy posterUrl field (for backward compatibility with FeatureFilmData)
    if (film.posterUrl) return film.posterUrl;
    
    // Priority 3: first still image as fallback from new structure
    if (film.files?.stills && film.files.stills.length > 0) {
      return film.files.stills[0].url;
    }
    
    // Priority 4: legacy galleryUrls first image from FeatureFilmData
    if (film.galleryUrls && Array.isArray(film.galleryUrls) && film.galleryUrls.length > 0) {
      const firstGallery = film.galleryUrls[0];
      return typeof firstGallery === 'string' ? firstGallery : firstGallery?.url || null;
    }
    
    return null;
  };

  /**
   * Handle poster click to navigate to detail page
   */
  const handlePosterClick = (filmId: string) => {
    onNavigateToDetail(filmId);
  };

  /**
   * Handle year filter selection
   */
  const handleYearSelect = (year: string) => {
    setSelectedYear(year);
    setShowYearDropdown(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#FCB283] animate-spin mx-auto mb-4" />
          <p className="text-white/70">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] flex items-center justify-center">
        <div className="bg-red-500/20 border border-red-500/30 rounded-2xl p-8 text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-red-400 mb-2">{t('common.error')}</h2>
          <p className="text-red-300">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] pt-16 sm:pt-20">
      {/* Header Section */}
      <div className="bg-white/2 backdrop-blur-sm border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="text-center">
            {/* Official Selection Logo */}
            <img 
              src="https://firebasestorage.googleapis.com/v0/b/cifan-c41c6.firebasestorage.app/o/site_files%2Ffest_logos%2FT4%404x.png?alt=media&token=4b606f45-6165-4486-951b-4e4ccb0bdb23"
              alt="Official Selection"
              className="h-16 sm:h-20 md:h-24 lg:h-28 w-auto mx-auto mb-6 filter brightness-0 invert opacity-90"
            />
            
            {/* Heading */}
            <h1 className={`text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-2 ${getClass('header')}`}>
              Official Selection
            </h1>
            <h2 className={`text-2xl md:text-3xl text-[#FCB283] font-semibold ${getClass('subtitle')}`}>
              2025
            </h2>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60" />
              <input
                type="text"
                placeholder={t('publicFeatureFilms.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-[#FCB283] focus:border-transparent"
              />
            </div>

            {/* Year Filter Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowYearDropdown(!showYearDropdown)}
                className="flex items-center justify-between w-full md:w-48 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/15 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-white/60" />
                  <span>
                    {selectedYear || t('publicFeatureFilms.allYears')}
                  </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-white/60 transition-transform ${showYearDropdown ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {showYearDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl overflow-hidden z-10">
                  <button
                    onClick={() => handleYearSelect('')}
                    className="w-full px-4 py-3 text-left text-white hover:bg-white/10 transition-colors"
                  >
                    {t('publicFeatureFilms.allYears')}
                  </button>
                  {availableYears.map(year => (
                    <button
                      key={year}
                      onClick={() => handleYearSelect(year.toString())}
                      className="w-full px-4 py-3 text-left text-white hover:bg-white/10 transition-colors"
                    >
                      {year}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-4 text-white/60 text-sm">
            {filteredFilms.length === 1 
              ? `1 ${t('publicFeatureFilms.film')}`
              : `${filteredFilms.length} ${t('publicFeatureFilms.films')}`
            }
            {searchTerm && ` matching "${searchTerm}"`}
            {selectedYear && ` from ${selectedYear}`}
          </div>
        </div>

        {/* Poster Gallery */}
        {filteredFilms.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {filteredFilms.map((film) => {
              const posterUrl = getPosterUrl(film);
              const filmTitle = film.title || (film as any).titleEn || 'Unknown Title';
              const filmId = film.id;
              
              return (
                <button
                  key={filmId}
                  onClick={() => handlePosterClick(filmId!)}
                  className="group aspect-[2/3] bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-lg overflow-hidden hover:scale-105 transition-transform duration-300 shadow-lg hover:shadow-2xl"
                >
                  {posterUrl ? (
                    <img
                      src={posterUrl}
                      alt={filmTitle}
                      className="w-full h-full object-cover group-hover:brightness-110 transition-all duration-300"
                      loading="lazy"
                      onError={(e) => {
                        console.log(`Failed to load poster for ${filmTitle}:`, posterUrl);
                        // Hide the image and show fallback
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : null}
                  
                  {/* Always show fallback content, but hide it when image loads successfully */}
                  <div className={`w-full h-full flex items-center justify-center ${posterUrl ? 'absolute inset-0 opacity-0 group-hover:opacity-100 bg-black/50 transition-opacity' : ''}`}>
                    <div className="text-center">
                      <Film className="w-12 h-12 text-white/30 mx-auto mb-2" />
                      <p className="text-white/60 text-sm px-2 leading-tight">
                        {filmTitle}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <Film className="w-16 h-16 text-white/30 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white/70 mb-2">
              {t('publicFeatureFilms.noFilmsFound')}
            </h3>
            <p className="text-white/50">
              {searchTerm || selectedYear 
                ? t('publicFeatureFilms.tryAdjustingFilters')
                : t('publicFeatureFilms.noPublishedFilms')
              }
            </p>
          </div>
        )}
      </div>

      {/* Click outside to close dropdown */}
      {showYearDropdown && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setShowYearDropdown(false)}
        />
      )}
    </div>
  );
};

export default PublicFeatureFilmsPage;
