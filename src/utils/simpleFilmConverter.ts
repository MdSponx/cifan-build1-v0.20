import { SimpleFilm } from '../types/simpleFilm.types';
import { FeatureFilm, FeatureFilmData } from '../types/featureFilm.types';

// UNIFIED CONVERSION - INDEX-BASED SYSTEM ONLY
export function convertToSimpleFilm(rawFilm: any): SimpleFilm {
  console.log('🔄 Converting film to SimpleFilm (unified index-based):', {
    id: rawFilm.id,
    title: rawFilm.titleEn || rawFilm.title,
    hasGalleryUrls: !!rawFilm.galleryUrls,
    galleryCoverIndex: rawFilm.galleryCoverIndex,
    galleryLogoIndex: rawFilm.galleryLogoIndex
  });

  // UNIFIED APPROACH: Direct mapping with index-based system
  return {
    id: rawFilm.id,
    title: rawFilm.titleEn || rawFilm.title || 'Untitled',
    titleTh: rawFilm.titleTh,
    
    // SIMPLE INDEX-BASED GALLERY - NO CONVERSION NEEDED
    galleryUrls: rawFilm.galleryUrls || [],
    galleryCoverIndex: rawFilm.galleryCoverIndex,
    galleryLogoIndex: rawFilm.galleryLogoIndex,
    posterUrl: rawFilm.posterUrl,
    
    // Other fields - direct mapping
    genres: rawFilm.genres || [],
    runtimeMinutes: rawFilm.length || rawFilm.duration,
    logline: rawFilm.logline || rawFilm.synopsis || '',
    category: rawFilm.category || 'Official Selection',
    publicationStatus: rawFilm.publicationStatus || 'public',
    year: rawFilm.releaseYear || new Date().getFullYear(),
    targetAudiences: rawFilm.targetAudience || [],
    afterScreenActivities: rawFilm.afterScreenActivities || []
  };
}

// Convert array of films
export function convertFilmsToSimple(rawFilms: any[]): SimpleFilm[] {
  return rawFilms.map(convertToSimpleFilm);
}

// Debug conversion
export function debugConversion(rawFilm: any): void {
  console.group(`🔄 Converting film: ${rawFilm.titleEn || rawFilm.title || 'Untitled'}`);
  
  const isLegacyFormat = !rawFilm.files && (rawFilm.titleEn || rawFilm.posterUrl || rawFilm.galleryUrls);
  console.log(`Format: ${isLegacyFormat ? 'Legacy' : 'New'}`);
  
  if (isLegacyFormat) {
    console.log('Legacy data:', {
      galleryUrls: rawFilm.galleryUrls?.length || 0,
      galleryCoverIndex: rawFilm.galleryCoverIndex,
      galleryLogoIndex: rawFilm.galleryLogoIndex,
      posterUrl: rawFilm.posterUrl ? 'Present' : 'None'
    });
  } else {
    const stills = rawFilm.files?.stills || [];
    console.log('New format data:', {
      stillsCount: stills.length,
      coverStills: stills.filter((s: any) => s.isCover).length,
      logoStills: stills.filter((s: any) => s.isLogo).length,
      posterUrl: rawFilm.files?.poster?.url ? 'Present' : 'None'
    });
  }
  
  const converted = convertToSimpleFilm(rawFilm);
  console.log('Converted result:', {
    galleryUrls: converted.galleryUrls.length,
    galleryCoverIndex: converted.galleryCoverIndex,
    galleryLogoIndex: converted.galleryLogoIndex,
    posterUrl: converted.posterUrl ? 'Present' : 'None'
  });
  
  console.groupEnd();
}
