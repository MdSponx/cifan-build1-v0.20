import React, { useState, useEffect } from 'react';
import { ArrowLeft, Sparkles, Loader2, AlertCircle, X } from 'lucide-react';
import { getEnhancedFeatureFilm } from '../../services/featureFilmService';
import { FeatureFilm } from '../../types/featureFilm.types';

interface FortuneCardDetailPageProps {
  filmId: string;
  onNavigateBack: () => void;
}

const FortuneCardDetailPage: React.FC<FortuneCardDetailPageProps> = ({
  filmId,
  onNavigateBack
}) => {
  const [film, setFilm] = useState<FeatureFilm | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);

  useEffect(() => {
    const fetchFilm = async () => {
      try {
        setLoading(true);
        setError(null);

        const result = await getEnhancedFeatureFilm(filmId);

        if (result.success && result.data) {
          const filmData = result.data as FeatureFilm;
          
          // Check if film has fortune card
          const hasFortuneCard = filmData.fortuneCard || 
                                (filmData as any).fortuneCardUrl || 
                                (filmData as any).fortuneCard;
          
          if (!hasFortuneCard) {
            setError('This film does not have a fortune card');
            return;
          }

          setFilm(filmData);
        } else {
          setError(result.error || 'Film not found');
        }
      } catch (err) {
        console.error('Error fetching film:', err);
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (filmId) {
      fetchFilm();
    }
  }, [filmId]);

  const getFortuneCardUrl = (film: FeatureFilm): string => {
    return film.fortuneCard || 
           (film as any).fortuneCardUrl || 
           (film as any).fortuneCard || '';
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjI2NyIgdmlld0JveD0iMCAwIDQwMCAyNjciIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMjY3IiBmaWxsPSIjMUYyOTM3Ii8+CjxwYXRoIGQ9Ik0yMDAgMTMzLjVMMTg1IDE0OEwyMDAgMTYyLjVMMjE1IDE0OEwyMDAgMTMzLjVaIiBmaWxsPSIjRkNCMjgzIi8+PC9zdmc+';
    setError('Failed to load fortune card image');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#110D16] via-[#1A1625] to-[#2D1B3D] py-20">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mb-6">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Loading Fortune Card</h2>
            <p className="text-white/70">Revealing the mystical card...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !film) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#110D16] via-[#1A1625] to-[#2D1B3D] py-20">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 rounded-full mb-6">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Fortune Card Not Available</h2>
            <p className="text-white/70 mb-6">{error}</p>
            <button
              onClick={onNavigateBack}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all duration-300"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Gallery
            </button>
          </div>
        </div>
      </div>
    );
  }

  const fortuneCardUrl = getFortuneCardUrl(film);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#110D16] via-[#1A1625] to-[#2D1B3D] py-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={onNavigateBack}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Gallery
          </button>
          
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-full mb-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              {film.title}
            </h1>
            {film.titleTh && (
              <p className="text-xl text-white/70 mb-2">{film.titleTh}</p>
            )}
            <p className="text-white/60">
              Directed by {film.director}
            </p>
          </div>
        </div>

        {/* Fortune Card Display */}
        <div className="max-w-4xl mx-auto">
          <div className="relative bg-gradient-to-br from-purple-800 to-indigo-900 rounded-3xl p-8 shadow-2xl">
            {/* Mystical Border */}
            <div className="relative bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 rounded-2xl overflow-hidden shadow-lg p-2">
              <div className="bg-black rounded-xl overflow-hidden relative">
                {!imageLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  </div>
                )}
                
                <img
                  src={fortuneCardUrl}
                  alt={`Fortune Card for ${film.title}`}
                  className={`w-full h-auto object-contain cursor-pointer transition-opacity duration-300 ${
                    imageLoaded ? 'opacity-100' : 'opacity-0'
                  }`}
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                  onClick={() => setShowFullscreen(true)}
                  style={{ maxHeight: '70vh' }}
                />
                
                {/* Click to expand hint */}
                {imageLoaded && (
                  <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                    <div className="text-center text-white">
                      <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Sparkles className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-medium">Click to view fullscreen</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Mystical Decoration */}
            <div className="absolute -top-4 -left-4 w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full animate-pulse"></div>
            <div className="absolute -top-4 -right-4 w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
            <div className="absolute -bottom-4 -left-4 w-8 h-8 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
            <div className="absolute -bottom-4 -right-4 w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full animate-pulse" style={{ animationDelay: '1.5s' }}></div>
          </div>

          {/* Film Information */}
          <div className="mt-8 text-center">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">About This Fortune Card</h3>
              <p className="text-white/80 leading-relaxed">
                This mystical fortune card represents the spiritual essence and destiny associated with "{film.title}". 
                Each card is carefully chosen to reflect the deeper themes and energy of the film, 
                serving as a symbolic gateway to understanding the movie's soul.
              </p>
              
              {film.synopsis && (
                <div className="mt-6 pt-6 border-t border-white/10">
                  <h4 className="text-lg font-semibold text-white mb-3">Film Synopsis</h4>
                  <p className="text-white/70 leading-relaxed">
                    {film.synopsis}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mystical Footer */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 text-white/50 text-sm">
            <Sparkles className="w-4 h-4 text-yellow-400" />
            <span>Fortune cards reveal the hidden mysteries within each film</span>
            <Sparkles className="w-4 h-4 text-yellow-400" />
          </div>
        </div>
      </div>

      {/* Fullscreen Modal */}
      {showFullscreen && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-full max-h-full">
            <img
              src={fortuneCardUrl}
              alt={`Fortune Card for ${film.title}`}
              className="max-w-full max-h-full object-contain"
            />
            <button
              onClick={() => setShowFullscreen(false)}
              className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FortuneCardDetailPage;
