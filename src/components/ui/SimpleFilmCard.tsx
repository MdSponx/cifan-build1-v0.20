import React from 'react';
import { SimpleFilm } from '../../types/simpleFilm.types';
import { getCover, getLogo } from '../../utils/unifiedImageHelpers';

interface SimpleFilmCardProps {
  film: SimpleFilm;
  className?: string;
}

export function SimpleFilmCard({ film, className = '' }: SimpleFilmCardProps): JSX.Element {
  // Get images using simple functions - ONE LINE EACH!
  const coverImage = getCover(film);
  const logoImage = getLogo(film);
  
  return (
    <div className={`film-card relative rounded-xl overflow-hidden ${className}`}>
      {/* Background cover image */}
      {coverImage && (
        <div 
          className="absolute inset-0 bg-cover bg-center bg-gray-900"
          style={{ backgroundImage: `url(${coverImage})` }}
        />
      )}
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      
      {/* Content */}
      <div className="relative z-10 p-6 h-full flex flex-col justify-end">
        {/* Logo image */}
        {logoImage && (
          <div className="mb-4">
            <img 
              src={logoImage} 
              alt={`${film.title} logo`}
              className="h-12 w-auto object-contain drop-shadow-lg"
            />
          </div>
        )}
        
        {/* Title */}
        <h3 className="text-xl font-bold text-white mb-2">{film.title}</h3>
        {film.titleTh && (
          <p className="text-sm text-white/80 mb-2">{film.titleTh}</p>
        )}
        
        {/* Category and Runtime */}
        <div className="flex items-center gap-2 mb-3">
          {film.category && (
            <span className="px-2 py-1 bg-red-500/30 text-red-200 text-xs rounded">
              {film.category}
            </span>
          )}
          {film.runtimeMinutes && (
            <span className="px-2 py-1 bg-blue-500/30 text-blue-200 text-xs rounded">
              {film.runtimeMinutes} min
            </span>
          )}
        </div>
        
        {/* Genres */}
        {film.genres.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {film.genres.map((genre, index) => (
              <span 
                key={index}
                className="px-2 py-1 bg-purple-500/30 text-purple-200 text-xs rounded"
              >
                {genre}
              </span>
            ))}
          </div>
        )}
        
        {/* Logline */}
        {film.logline && (
          <p className="text-sm text-white/90 line-clamp-3">
            {film.logline}
          </p>
        )}
      </div>
    </div>
  );
}

// Example usage component
export function SimpleFilmCardExample(): JSX.Element {
  // Example with real data structure
  const exampleFilm: SimpleFilm = {
    id: "wzA1wecgMr2k33FFL7wd",
    title: "The Ugly Stepsister",
    galleryCoverIndex: 0,    // Points to galleryUrls[0]
    galleryLogoIndex: 4,     // Points to galleryUrls[4]
    galleryUrls: [
      "https://firebasestorage.googleapis.com/v0/b/cifan-c41c6.firebasestorage.app/o/films%2FwzA1wecgMr2k33FFL7wd%2Fgallery%2FUgly_3.jpg?alt=media&token=abc123",     // Index 0 = Cover
      "https://firebasestorage.googleapis.com/v0/b/cifan-c41c6.firebasestorage.app/o/films%2FwzA1wecgMr2k33FFL7wd%2Fgallery%2FUgly_2.jpg?alt=media&token=def456",     // Index 1
      "https://firebasestorage.googleapis.com/v0/b/cifan-c41c6.firebasestorage.app/o/films%2FwzA1wecgMr2k33FFL7wd%2Fgallery%2FUgly_1.jpg?alt=media&token=ghi789",     // Index 2  
      "https://firebasestorage.googleapis.com/v0/b/cifan-c41c6.firebasestorage.app/o/films%2FwzA1wecgMr2k33FFL7wd%2Fgallery%2FUgly_4.jpg?alt=media&token=jkl012",     // Index 3
      "https://firebasestorage.googleapis.com/v0/b/cifan-c41c6.firebasestorage.app/o/films%2FwzA1wecgMr2k33FFL7wd%2Fgallery%2FAsset_4.png?alt=media&token=mno345"     // Index 4 = Logo
    ],
    genres: ["Drama", "Comedy"],
    runtimeMinutes: 95,
    logline: "A heartwarming story about finding beauty in unexpected places.",
    category: "Official Selection"
  };

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">Simple Film Card Example</h2>
      <div className="w-80 h-96">
        <SimpleFilmCard film={exampleFilm} />
      </div>
      
      <div className="mt-8 p-4 bg-gray-100 rounded">
        <h3 className="font-bold mb-2">How it works:</h3>
        <pre className="text-sm">
{`// Get images - ONE LINE EACH!
const cover = getCover(film);  // Returns galleryUrls[0] = Ugly_3.jpg
const logo = getLogo(film);    // Returns galleryUrls[4] = Asset_4.png

// Direct array access using indices
film.galleryUrls[film.galleryCoverIndex]  // Direct access!
film.galleryUrls[film.galleryLogoIndex]   // No boolean logic!`}
        </pre>
      </div>
    </div>
  );
}
