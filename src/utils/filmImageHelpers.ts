/**
 * Film Image Helper Utilities
 * 
 * Shared utilities for handling film cover images and logos consistently
 * across admin detail pages and public display components.
 */

export interface FilmImageData {
  galleryUrls?: string[];
  galleryCoverIndex?: number;
  galleryLogoIndex?: number;
  posterUrl?: string;
}

/**
 * Get cover image URL using the exact same logic as FeatureFilmDetailPage
 * Priority: galleryUrls[galleryCoverIndex || 0] -> posterUrl -> null
 */
export function getFilmCoverImage(film: FilmImageData): string | null {
  // Priority 1: Gallery image at cover index (or first image if no index)
  if (film.galleryUrls && film.galleryUrls.length > 0) {
    const coverIndex = film.galleryCoverIndex || 0;
    const coverUrl = film.galleryUrls[coverIndex];
    if (coverUrl && coverUrl.trim() !== '') {
      return coverUrl;
    }
  }
  
  // Priority 2: Poster URL as fallback
  if (film.posterUrl && film.posterUrl.trim() !== '') {
    return film.posterUrl;
  }
  
  return null;
}

/**
 * Get logo image URL from gallery using logo index
 */
export function getFilmLogoImage(film: FilmImageData): string | null {
  if (film.galleryUrls && film.galleryUrls.length > 0 && film.galleryLogoIndex !== undefined) {
    const logoUrl = film.galleryUrls[film.galleryLogoIndex];
    if (logoUrl && logoUrl.trim() !== '') {
      return logoUrl;
    }
  }
  
  return null;
}

/**
 * Debug function to log image selection process
 */
export function debugFilmImages(film: FilmImageData, filmTitle: string): void {
  console.log(`🔍 Debug film images for "${filmTitle}":`, {
    galleryCount: film.galleryUrls?.length || 0,
    galleryCoverIndex: film.galleryCoverIndex,
    galleryLogoIndex: film.galleryLogoIndex,
    hasPosterUrl: !!film.posterUrl,
    coverImage: getFilmCoverImage(film),
    logoImage: getFilmLogoImage(film),
    galleryUrls: film.galleryUrls
  });
}
