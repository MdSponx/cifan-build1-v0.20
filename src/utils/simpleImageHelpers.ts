import { SimpleFilm } from '../types/simpleFilm.types';

// Get cover image - MATCHES ADMIN DETAIL PAGE LOGIC
export function getCover(film: SimpleFilm): string | null {
  // Match the exact logic from FeatureFilmDetailPage.tsx line 421:
  // film.galleryUrls && film.galleryUrls.length > 0 ? film.galleryUrls[film.galleryCoverIndex || 0] : undefined
  
  if (film.galleryUrls && film.galleryUrls.length > 0) {
    // Use galleryCoverIndex if available, otherwise use index 0
    const coverIndex = film.galleryCoverIndex !== undefined ? film.galleryCoverIndex : 0;
    return film.galleryUrls[coverIndex] || null;
  }
  
  return null;
}

// Get logo image - SIMPLE VERSION
export function getLogo(film: SimpleFilm): string | null {
  // Direct index access - no boolean checking needed
  if (film.galleryLogoIndex !== undefined && film.galleryUrls[film.galleryLogoIndex]) {
    return film.galleryUrls[film.galleryLogoIndex];
  }
  
  return null;
}

// Get poster image - MATCHES ADMIN DETAIL PAGE LOGIC
export function getPoster(film: SimpleFilm): string | null {
  // Match the exact logic from FeatureFilmDetailPage.tsx line 456:
  // posterImage={film.posterUrl}
  return film.posterUrl || null;
}

// Simple debug function
export function debugImages(film: SimpleFilm): void {
  console.log(`🎬 Film: ${film.title}`);
  console.log(`📊 Gallery: ${film.galleryUrls.length} images`);
  console.log(`🖼️ Cover Index: ${film.galleryCoverIndex} → ${getCover(film) ? 'Found' : 'Not Found'}`);
  console.log(`🏷️ Logo Index: ${film.galleryLogoIndex} → ${getLogo(film) ? 'Found' : 'Not Found'}`);
  
  // Show cover selection priority (matches admin detail page logic)
  const coverResult = getCover(film);
  console.log(`🎯 Cover Selection (Admin Detail Page Logic):`);
  if (film.galleryUrls && film.galleryUrls.length > 0) {
    const coverIndex = film.galleryCoverIndex !== undefined ? film.galleryCoverIndex : 0;
    console.log(`   ✅ Gallery image at index ${coverIndex} - SELECTED`);
    if (film.galleryCoverIndex !== undefined) {
      console.log(`   📌 Using marked cover index: ${film.galleryCoverIndex}`);
    } else {
      console.log(`   📌 Using default index 0 (no cover index specified)`);
    }
  } else {
    console.log(`   ❌ No gallery images available`);
  }
  
  console.log(`📸 Final Cover URL: ${coverResult || 'None'}`);
  
  // Show actual URLs for debugging
  if (film.galleryCoverIndex !== undefined) {
    console.log(`   Marked Cover URL: ${film.galleryUrls[film.galleryCoverIndex] || 'INVALID INDEX'}`);
  }
  if (film.galleryLogoIndex !== undefined) {
    console.log(`   Logo URL: ${film.galleryUrls[film.galleryLogoIndex] || 'INVALID INDEX'}`);
  }
  if (film.posterUrl) {
    console.log(`   Poster URL: ${film.posterUrl}`);
  }
}

// Debug all images in a film
export function debugAllImages(film: SimpleFilm): void {
  console.group(`🎬 All Images for: ${film.title}`);
  
  film.galleryUrls.forEach((url, index) => {
    const isCover = film.galleryCoverIndex === index;
    const isLogo = film.galleryLogoIndex === index;
    const tags = [];
    
    if (isCover) tags.push('COVER');
    if (isLogo) tags.push('LOGO');
    
    console.log(`[${index}] ${tags.length > 0 ? `[${tags.join(', ')}] ` : ''}${url}`);
  });
  
  if (film.posterUrl) {
    console.log(`[POSTER] ${film.posterUrl}`);
  }
  
  console.groupEnd();
}
