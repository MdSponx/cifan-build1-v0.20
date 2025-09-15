import React, { useState, useEffect } from 'react';
import { Sparkles, Eye, Loader2, AlertCircle } from 'lucide-react';
import { getEnhancedFeatureFilms } from '../../services/featureFilmService';
import { FeatureFilm } from '../../types/featureFilm.types';

interface FortuneCardsGalleryPageProps {
  onNavigateToDetail: (filmId: string) => void;
}

interface FilmWithFortuneCard {
  id: string;
  title: string;
  titleTh?: string;
  director: string;
  fortuneCard: string;
}

const FortuneCardsGalleryPage: React.FC<FortuneCardsGalleryPageProps> = ({
  onNavigateToDetail
}) => {
  const [films, setFilms] = useState<FilmWithFortuneCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFilmsWithFortuneCards = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all published films
        const result = await getEnhancedFeatureFilms({ 
          publicationStatus: 'public',
          status: 'published'
        });

        if (result.success && result.data) {
          // Filter films that have fortune cards
          const filmsWithFortuneCards = result.data
            .filter((film: FeatureFilm) => {
              // Check both new fortuneCard field and legacy fortuneCard field
              const hasFortuneCard = film.fortuneCard || 
                                   (film as any).fortuneCardUrl || 
                                   (film as any).fortuneCard;
              return hasFortuneCard;
            })
            .map((film: FeatureFilm) => ({
              id: film.id,
              title: film.title,
              titleTh: film.titleTh,
              director: film.director,
              fortuneCard: film.fortuneCard || 
                          (film as any).fortuneCardUrl || 
                          (film as any).fortuneCard || ''
            }));

          console.log('Films with fortune cards:', filmsWithFortuneCards);
          setFilms(filmsWithFortuneCards);
        } else {
          setError(result.error || 'Failed to fetch films');
        }
      } catch (err) {
        console.error('Error fetching films with fortune cards:', err);
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchFilmsWithFortuneCards();
  }, []);

  const handleCardClick = (filmId: string) => {
    onNavigateToDetail(filmId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#110D16] via-[#1A1625] to-[#2D1B3D] py-20">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mb-6">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Loading Fortune Cards</h2>
            <p className="text-white/70">Discovering mystical cards from our film collection...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#110D16] via-[#1A1625] to-[#2D1B3D] py-20">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 rounded-full mb-6">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Error Loading Fortune Cards</h2>
            <p className="text-white/70 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all duration-300"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#110D16] via-[#1A1625] to-[#2D1B3D] py-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-full mb-6">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Fortune Cards Gallery
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Discover the mystical fortune cards representing the spiritual essence of our featured films
          </p>
          <div className="mt-6 text-white/60">
            <span className="inline-flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              {films.length} Mystical Cards Available
            </span>
          </div>
        </div>

        {films.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-full mb-6">
              <Sparkles className="w-8 h-8 text-white/50" />
            </div>
            <h3 className="text-xl font-medium text-white mb-2">No Fortune Cards Available</h3>
            <p className="text-white/70">
              Fortune cards will appear here once films with mystical imagery are added to the collection.
            </p>
          </div>
        ) : (
          /* Fortune Cards Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {films.map((film) => (
              <div
                key={film.id}
                className="group cursor-pointer transform transition-all duration-300 hover:scale-105"
                onClick={() => handleCardClick(film.id)}
              >
                {/* Fortune Card Frame */}
                <div className="relative bg-gradient-to-br from-purple-800 to-indigo-900 rounded-2xl p-4 shadow-2xl group-hover:shadow-purple-500/25 transition-all duration-300">
                  {/* Mystical Border */}
                  <div className="relative bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 rounded-xl overflow-hidden shadow-lg p-1">
                    <div className="bg-black rounded-lg overflow-hidden aspect-[3/2] relative">
                      <img
                        src={film.fortuneCard}
                        alt={`Fortune Card for ${film.title}`}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjI2NyIgdmlld0JveD0iMCAwIDQwMCAyNjciIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMjY3IiBmaWxsPSIjMUYyOTM3Ii8+CjxwYXRoIGQ9Ik0yMDAgMTMzLjVMMTg1IDE0OEwyMDAgMTYyLjVMMjE1IDE0OEwyMDAgMTMzLjVaIiBmaWxsPSIjRkNCMjgzIi8+CjwvZz4KPC9zdmc+';
                        }}
                      />
                      
                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <div className="text-center">
                          <Eye className="w-8 h-8 text-white mb-2 mx-auto" />
                          <p className="text-white text-sm font-medium">View Fortune Card</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Mystical Decoration */}
                  <div className="absolute -top-2 -left-2 w-6 h-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full animate-pulse"></div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                  <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
                  <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full animate-pulse" style={{ animationDelay: '1.5s' }}></div>
                </div>

                {/* Film Info */}
                <div className="mt-4 text-center">
                  <h3 className="text-lg font-bold text-white mb-1 group-hover:text-yellow-400 transition-colors">
                    {film.title}
                  </h3>
                  {film.titleTh && (
                    <p className="text-sm text-white/60 mb-2">{film.titleTh}</p>
                  )}
                  <p className="text-sm text-white/70">
                    Directed by {film.director}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Mystical Footer */}
        <div className="mt-20 text-center">
          <div className="inline-flex items-center gap-2 text-white/50 text-sm">
            <Sparkles className="w-4 h-4 text-yellow-400" />
            <span>Each fortune card represents the mystical essence of its film</span>
            <Sparkles className="w-4 h-4 text-yellow-400" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FortuneCardsGalleryPage;
