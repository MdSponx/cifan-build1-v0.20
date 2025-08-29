import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  ArrowLeft,
  Share2,
  AlertCircle,
  Loader2,
  Film
} from 'lucide-react';
import { useTypography } from '../../utils/typography';
import { FeatureFilmData } from '../../types/featureFilm.types';
import { getFeatureFilm } from '../../services/featureFilmService';
import FeatureFilmDetailPage from './FeatureFilmDetailPage';
import AnimatedBackground from '../ui/AnimatedBackground';

interface PublicFeatureFilmDetailPageProps {
  filmId: string;
  onNavigateBack: () => void;
}

/**
 * Public Feature Film Detail Page
 * 
 * A wrapper component that uses the existing FeatureFilmDetailPage but:
 * - Removes the film status badge from top-right corner
 * - Limits gallery display to maximum 10 images
 * - Sets mode to 'public' to hide admin-only features
 * - Provides public-specific navigation
 */
const PublicFeatureFilmDetailPage: React.FC<PublicFeatureFilmDetailPageProps> = ({
  filmId,
  onNavigateBack
}) => {
  const { t } = useTranslation();
  const { getClass } = useTypography();

  const [film, setFilm] = useState<FeatureFilmData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch film data and validate it's published - optimized with cleanup
   */
  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();
    
    const fetchFilm = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const result = await getFeatureFilm(filmId);
        
        if (!isMounted) return; // Prevent state update if component unmounted
        
        if (result.success && result.data) {
          // Check if film is published for public viewing
          const filmData = result.data;
          
          // Only show published films or films with public publication status
          if (filmData.status === 'published' || 
              filmData.publicationStatus === 'public' ||
              filmData.status === 'ตอบรับ / Accepted') {
            
            // Limit gallery images to maximum 10 for public view (performance optimization)
            if (filmData.galleryUrls && filmData.galleryUrls.length > 10) {
              filmData.galleryUrls = filmData.galleryUrls.slice(0, 10);
            }
            
            setFilm(filmData);
          } else {
            setError('This film is not available for public viewing');
          }
        } else {
          setError(result.error || 'Film not found');
        }
      } catch (err) {
        if (!isMounted) return;
        console.error('Error fetching film:', err);
        setError('Failed to load film details');
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
      abortController.abort();
    };
  }, [filmId]);

  /**
   * Handle share functionality
   */
  const handleShare = async () => {
    if (navigator.share && film) {
      try {
        await navigator.share({
          title: `${film.titleEn} - CIFAN 2025`,
          text: film.synopsis,
          url: window.location.href,
        });
      } catch (err) {
        // Fallback to clipboard
        navigator.clipboard.writeText(window.location.href);
        // Could show a toast notification here
      }
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(window.location.href);
      // Could show a toast notification here
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#110D16] text-white relative flex items-center justify-center">
        <AnimatedBackground />
        <div className="relative z-10 text-center">
          <Loader2 className="w-12 h-12 text-[#FCB283] animate-spin mx-auto mb-4" />
          <p className="text-white/70">Loading film details...</p>
        </div>
      </div>
    );
  }

  if (error || !film) {
    return (
      <div className="min-h-screen bg-[#110D16] text-white relative flex items-center justify-center">
        <AnimatedBackground />
        <div className="relative z-10 border border-red-500/30 rounded-2xl p-8 text-center max-w-md">
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
    );
  }

  // Custom header component for public view (without status badge) - Fixed navbar height
  const PublicHeader: React.FC = () => (
    <div className="sticky top-0 z-40 h-16 sm:h-20">
      <div className="max-w-7xl mx-auto px-4 h-full">
        <div className="flex items-center justify-between h-full">
          <button
            onClick={onNavigateBack}
            className="flex items-center space-x-2 px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Gallery</span>
          </button>
          
          <div className="flex items-center space-x-3">
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
  );

  // Memoize film logo for performance
  const filmLogo = useMemo(() => {
    if (!film?.galleryUrls || !film.galleryLogoIndex) return null;
    return film.galleryUrls[film.galleryLogoIndex] || null;
  }, [film?.galleryUrls, film?.galleryLogoIndex]);

  // Use the existing FeatureFilmDetailPage component but with public mode
  return (
    <div className="min-h-screen bg-[#110D16] text-white relative">
      <AnimatedBackground />
      <div className="relative z-10">
        {/* Custom Public Header (replaces the admin header) */}
        <PublicHeader />
        
        {/* Use existing detail page component with public mode - Fixed top padding */}
        <div className="relative">
          {/* Hide the original header by wrapping in a container that clips it */}
          <div className="[&>div:first-child>div:first-child]:hidden">
            <FeatureFilmDetailPage
              filmId={filmId}
              onNavigateBack={onNavigateBack}
              mode="public"
              filmLogo={filmLogo}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicFeatureFilmDetailPage;
