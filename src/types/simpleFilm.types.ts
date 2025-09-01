// Simple Film interface - just what we need
export interface SimpleFilm {
  id: string;
  title: string;
  titleTh?: string;
  
  // Keep original data structure - no conversion needed
  galleryUrls: string[];           // Array of image URLs
  galleryCoverIndex?: number;      // Index of cover image
  galleryLogoIndex?: number;       // Index of logo image
  posterUrl?: string;              // Main poster
  
  // Other fields...
  genres: string[];
  runtimeMinutes?: number;
  logline?: string;
  category?: string;
  publicationStatus?: string;
  year?: number;
  targetAudiences?: string[];
  afterScreenActivities?: string[];
}
