import { FeatureFilmData } from '../types/featureFilm.types';
import { SimpleFilm } from '../types/simpleFilm.types';

// UNIFIED IMAGE HELPERS - INDEX-BASED SYSTEM ONLY
// No more dual format support - crystal clear and simple

/**
 * Get cover image from film data using index-based system
 * @param film - Film data with galleryUrls and galleryCoverIndex
 * @returns Cover image URL or null
 */
export function getCover(film: FeatureFilmData | SimpleFilm): string | null {
  if (!film.galleryUrls || film.galleryUrls.length === 0) {
    return null;
  }
  
  // Use galleryCoverIndex if available, otherwise fallback to first image
  const coverIndex = film.galleryCoverIndex !== undefined ? film.galleryCoverIndex : 0;
  return film.galleryUrls[coverIndex] || null;
}

/**
 * Get logo image from film data using index-based system
 * @param film - Film data with galleryUrls and galleryLogoIndex
 * @returns Logo image URL or null (no fallback for logo)
 */
export function getLogo(film: FeatureFilmData | SimpleFilm): string | null {
  if (!film.galleryUrls || film.galleryUrls.length === 0) {
    return null;
  }
  
  // Direct index access - no fallback for logo
  if (film.galleryLogoIndex !== undefined && film.galleryUrls[film.galleryLogoIndex]) {
    return film.galleryUrls[film.galleryLogoIndex];
  }
  
  return null;
}

/**
 * Get poster image from film data
 * @param film - Film data with posterUrl
 * @returns Poster image URL or null
 */
export function getPoster(film: FeatureFilmData | SimpleFilm): string | null {
  return film.posterUrl || null;
}

/**
 * Get all gallery images with their roles
 * @param film - Film data
 * @returns Array of gallery images with metadata
 */
export function getGalleryImages(film: FeatureFilmData | SimpleFilm): Array<{
  url: string;
  index: number;
  isCover: boolean;
  isLogo: boolean;
}> {
  if (!film.galleryUrls || film.galleryUrls.length === 0) {
    return [];
  }
  
  return film.galleryUrls.map((url, index) => ({
    url,
    index,
    isCover: film.galleryCoverIndex === index,
    isLogo: film.galleryLogoIndex === index
  }));
}

/**
 * Set cover image by index
 * @param film - Film data to modify
 * @param index - Index of the image to set as cover
 * @returns Updated film data
 */
export function setCoverIndex<T extends FeatureFilmData | SimpleFilm>(film: T, index: number): T {
  if (!film.galleryUrls || index < 0 || index >= film.galleryUrls.length) {
    console.warn('Invalid cover index:', index, 'for gallery with', film.galleryUrls?.length || 0, 'images');
    return film;
  }
  
  return {
    ...film,
    galleryCoverIndex: index
  };
}

/**
 * Set logo image by index
 * @param film - Film data to modify
 * @param index - Index of the image to set as logo
 * @returns Updated film data
 */
export function setLogoIndex<T extends FeatureFilmData | SimpleFilm>(film: T, index: number): T {
  if (!film.galleryUrls || index < 0 || index >= film.galleryUrls.length) {
    console.warn('Invalid logo index:', index, 'for gallery with', film.galleryUrls?.length || 0, 'images');
    return film;
  }
  
  return {
    ...film,
    galleryLogoIndex: index
  };
}

/**
 * Clear cover designation
 * @param film - Film data to modify
 * @returns Updated film data
 */
export function clearCover<T extends FeatureFilmData | SimpleFilm>(film: T): T {
  return {
    ...film,
    galleryCoverIndex: undefined
  };
}

/**
 * Clear logo designation
 * @param film - Film data to modify
 * @returns Updated film data
 */
export function clearLogo<T extends FeatureFilmData | SimpleFilm>(film: T): T {
  return {
    ...film,
    galleryLogoIndex: undefined
  };
}

/**
 * Debug film images - simple logging
 * @param film - Film data to debug
 */
export function debugFilmImages(film: FeatureFilmData | SimpleFilm): void {
  const filmTitle = 'title' in film ? film.title : film.titleEn;
  console.group(`🎬 Film Images Debug: ${filmTitle || 'Untitled'}`);
  
  console.log('📊 Gallery:', {
    totalImages: film.galleryUrls?.length || 0,
    coverIndex: film.galleryCoverIndex,
    logoIndex: film.galleryLogoIndex
  });
  
  console.log('🖼️ Cover:', getCover(film) || 'None');
  console.log('🏷️ Logo:', getLogo(film) || 'None');
  console.log('📸 Poster:', getPoster(film) || 'None');
  
  if (film.galleryUrls && film.galleryUrls.length > 0) {
    console.log('📋 Gallery Images:');
    film.galleryUrls.forEach((url, index) => {
      const tags = [];
      if (film.galleryCoverIndex === index) tags.push('COVER');
      if (film.galleryLogoIndex === index) tags.push('LOGO');
      
      console.log(`  [${index}] ${tags.length > 0 ? `[${tags.join(', ')}] ` : ''}${url}`);
    });
  }
  
  console.groupEnd();
}

/**
 * Validate film image indices
 * @param film - Film data to validate
 * @returns Validation result with any issues found
 */
export function validateImageIndices(film: FeatureFilmData | SimpleFilm): {
  isValid: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  const galleryLength = film.galleryUrls?.length || 0;
  
  // Check cover index
  if (film.galleryCoverIndex !== undefined) {
    if (film.galleryCoverIndex < 0 || film.galleryCoverIndex >= galleryLength) {
      issues.push(`Cover index ${film.galleryCoverIndex} is out of bounds (gallery has ${galleryLength} images)`);
    }
  }
  
  // Check logo index
  if (film.galleryLogoIndex !== undefined) {
    if (film.galleryLogoIndex < 0 || film.galleryLogoIndex >= galleryLength) {
      issues.push(`Logo index ${film.galleryLogoIndex} is out of bounds (gallery has ${galleryLength} images)`);
    }
  }
  
  // Check for same index used for both cover and logo
  if (film.galleryCoverIndex !== undefined && 
      film.galleryLogoIndex !== undefined && 
      film.galleryCoverIndex === film.galleryLogoIndex) {
    issues.push(`Same index ${film.galleryCoverIndex} is used for both cover and logo`);
  }
  
  return {
    isValid: issues.length === 0,
    issues
  };
}

/**
 * Clean up invalid indices (auto-fix common issues)
 * @param film - Film data to clean
 * @returns Cleaned film data
 */
export function cleanupImageIndices<T extends FeatureFilmData | SimpleFilm>(film: T): T {
  const galleryLength = film.galleryUrls?.length || 0;
  let cleanedFilm = { ...film };
  
  // Fix out-of-bounds cover index
  if (cleanedFilm.galleryCoverIndex !== undefined) {
    if (cleanedFilm.galleryCoverIndex < 0 || cleanedFilm.galleryCoverIndex >= galleryLength) {
      console.warn(`Fixing out-of-bounds cover index: ${cleanedFilm.galleryCoverIndex} -> undefined`);
      cleanedFilm.galleryCoverIndex = undefined;
    }
  }
  
  // Fix out-of-bounds logo index
  if (cleanedFilm.galleryLogoIndex !== undefined) {
    if (cleanedFilm.galleryLogoIndex < 0 || cleanedFilm.galleryLogoIndex >= galleryLength) {
      console.warn(`Fixing out-of-bounds logo index: ${cleanedFilm.galleryLogoIndex} -> undefined`);
      cleanedFilm.galleryLogoIndex = undefined;
    }
  }
  
  return cleanedFilm;
}
