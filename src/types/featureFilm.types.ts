// File metadata interface for uploaded files
export interface FileMetadata {
  url: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: Date;
  uploadedBy: string;
}

// Cast member interface
export interface CastMember {
  name: string;
  nameTh?: string;
  role: string;
  character?: string;
}

// Crew member interface
export interface CrewMember {
  name: string;
  nameTh?: string;
  role: string;
  department: string;
}

// Screening information interface
export interface ScreeningInfo {
  date: Date;
  time: string;
  venue: string;
  ticketUrl?: string;
}

// Guest interface (for festival guests)
export interface Guest {
  id?: string;
  name: string;
  email?: string;
  phone?: string;
  role: GuestRole;
  otherRole?: string; // Used when role is 'Other'
  bio?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type GuestRole = 
  | 'Director'
  | 'Producer'
  | 'Script Writer'
  | 'Actor'
  | 'Other';

// After Screen Activity types
export type AfterScreenActivity = 
  | 'qna'
  | 'talk'
  | 'redcarpet'
  | 'fanmeeting'
  | 'education';

// Publication Status types
export type PublicationStatus = 'public' | 'draft';

// Main Feature Film interface - comprehensive data model
export interface FeatureFilm {
  id: string;
  
  // Basic Information
  title: string;
  titleTh?: string;
  logline: string; // Ultra-short synopsis (required)
  synopsis: string;
  synopsisTh?: string;
  
  // Technical Details
  director: string;
  directorTh?: string;
  duration: number; // in minutes
  releaseYear: number;
  language: string[];
  subtitles: string[];
  format: string; // Digital, 35mm, etc.
  aspectRatio: string;
  soundFormat: string;
  
  // Classification
  genres: string[];
  country: string;
  rating?: string; // Age rating
  
  // Media Files
  files: {
    poster?: FileMetadata;
    trailer?: FileMetadata;
    stills?: FileMetadata[];
    pressKit?: FileMetadata;
  };
  
  // Cast & Crew
  cast: CastMember[];
  crew: CrewMember[];
  
  // Screening Information
  screenings?: ScreeningInfo[];
  
  // Metadata
  status: 'draft' | 'published' | 'archived';
  publicationStatus?: PublicationStatus; // Public/Draft status for display
  featured: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
  
  // SEO & Social
  tags: string[];
  slug: string; // URL-friendly identifier
  metaDescription?: string;
  
  // 🚨 LEGACY COMPATIBILITY FIELDS for OfficialSelectionShelf
  // These fields are preserved for backward compatibility with existing components
  galleryUrls?: string[]; // Array of gallery image URLs
  galleryCoverIndex?: number; // Index of cover image in galleryUrls array
  galleryLogoIndex?: number; // Index of logo image in galleryUrls array
  posterUrl?: string; // Direct poster URL for fallback
  
  // 🚨 CRITICAL FIX: Add missing fields that were found in database but not in type definition
  targetAudiences?: string[]; // Target audience information
  afterScreenActivities?: string[]; // After screen activities
  category?: string; // Film category
}

// Legacy interface for backward compatibility with existing form
export interface FeatureFilmData {
  // Basic Film Information
  titleEn: string;
  titleTh?: string;
  category: FilmCategory;
  genres: string[]; // Changed from single genre to multiple genres
  countries: string[]; // Changed from single country to multiple countries
  languages: string[]; // Changed from single language to multiple languages
  logline: string; // Ultra-short synopsis (required)
  synopsis: string;
  targetAudience: TargetAudience[];
  length?: number; // Duration in minutes

  // Screening Information
  screeningDate1?: string; // datetime-local format (optional)
  screeningDate2?: string;
  startTime1?: string; // Calculated from screeningDate1 or timeEstimate
  endTime1?: string;   // Calculated from startTime1 + length
  startTime2?: string; // Calculated from screeningDate2 or timeEstimate
  endTime2?: string;   // Calculated from startTime2 + length
  timeEstimate: TimeEstimate;
  theatre: Theatre;

  // Production Information
  director: string;
  producer: string;
  studio: string;
  distributor: string;
  mainActors: string;

  // Media & Materials
  posterFile?: File;
  posterUrl?: string;
  trailerFile?: File;
  trailerUrl?: string;
  screenerUrl: string;
  materials: string; // Rich text format
  galleryFiles?: File[];
  galleryUrls: string[];
  galleryCoverIndex?: number; // Index of the cover image in gallery
  galleryLogoIndex?: number; // Index of the logo image in gallery
  fortuneCardFile?: File;
  fortuneCardUrl?: string;
  fortuneCard?: string;

  // After Screen Activities
  afterScreenActivities: AfterScreenActivity[];

  // Status & Additional Info
  status: FilmStatus;
  publicationStatus: PublicationStatus; // New field for Public/Draft status
  remarks: string;

  // Guest Information
  guestComing: boolean;
  guests?: Guest[]; // Array of guests for display/editing

  // Metadata
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string;
}

// Create/Update interfaces for the new system
export interface CreateFeatureFilmData {
  title: string;
  titleTh?: string;
  synopsis: string;
  synopsisTh?: string;
  director: string;
  directorTh?: string;
  duration: number;
  releaseYear: number;
  language: string[];
  subtitles: string[];
  format: string;
  aspectRatio: string;
  soundFormat: string;
  genres: string[];
  country: string;
  rating?: string;
  cast: CastMember[];
  crew: CrewMember[];
  screenings?: ScreeningInfo[];
  status: 'draft' | 'published' | 'archived';
  featured: boolean;
  tags: string[];
  slug: string;
  metaDescription?: string;
  // File uploads
  posterFile?: File;
  trailerFile?: File;
  stillsFiles?: File[];
  pressKitFile?: File;
}

export interface UpdateFeatureFilmData extends Partial<CreateFeatureFilmData> {
  updatedBy: string;
}

// Filter interface for querying films
export interface FilmFilters {
  status?: 'draft' | 'published' | 'archived';
  publicationStatus?: PublicationStatus;
  genre?: string;
  country?: string;
  yearFrom?: number;
  yearTo?: number;
  durationFrom?: number;
  durationTo?: number;
  featured?: boolean;
  search?: string;
  tags?: string[];
  limit?: number;
  offset?: number;
  sortBy?: 'title' | 'createdAt' | 'releaseYear' | 'duration';
  sortOrder?: 'asc' | 'desc';
}

export type FilmCategory = 
  | 'Official Selection'
  | 'CIFAN Premiere'
  | 'Opening Film'
  | 'Closing Film'
  | 'Park Film'
  | 'THAIMAX'
  | 'Nostalgia';

export type FilmGenre = 
  | 'Horror'
  | 'Comedy'
  | 'Action'
  | 'Sci Fi'
  | 'Crime/Thriller'
  | 'Adventure'
  | 'Animation'
  | 'Drama'
  | 'Documentary'
  | 'Fantasy';

export type TargetAudience = 
  | 'Popcorn'
  | 'Cinephile'
  | 'College Student'
  | 'Student'
  | 'Art People'
  | 'Folk'
  | 'Novel Fan'
  | 'J-Horror Fan'
  | 'Youth'
  | 'Family';

export type TimeEstimate = 'เช้า' | 'บ่าย' | 'ค่ำ' | 'กลางคืน';

export type Theatre =
  | 'majorTheatre7'
  | 'majorImax';

export type FilmStatus = 
  | 'ตอบรับ / Accepted'
  | 'รอจัดการเอกสาร / Pending Documentation'
  | 'จ่ายเงินแล้ว / Payment Completed'
  | 'รอการส่งของ / Awaiting Delivery'
  | 'ได้รับของแล้ว / Items Received'
  | 'ส่งไปยังโรงหนังแล้ว / Sent to Cinema'
  | 'เสร็จการฉาย / Screening Completed';

export interface FeatureFilmFormErrors {
  [key: string]: string;
}

export interface FeatureFilmFormState {
  data: FeatureFilmData;
  errors: FeatureFilmFormErrors;
  isSubmitting: boolean;
  isDirty: boolean;
}

// Constants for form options
export const FILM_CATEGORIES: FilmCategory[] = [
  'Official Selection',
  'CIFAN Premiere',
  'Opening Film',
  'Closing Film',
  'Park Film',
  'THAIMAX',
  'Nostalgia'
];

export const FILM_GENRES: FilmGenre[] = [
  'Horror',
  'Comedy',
  'Action',
  'Sci Fi',
  'Crime/Thriller',
  'Adventure',
  'Animation',
  'Drama',
  'Documentary',
  'Fantasy'
];

export const TARGET_AUDIENCES: TargetAudience[] = [
  'Popcorn',
  'Cinephile',
  'College Student',
  'Student',
  'Art People',
  'Folk',
  'Novel Fan',
  'J-Horror Fan',
  'Youth',
  'Family'
];

export const TIME_ESTIMATES: TimeEstimate[] = [
  'เช้า',
  'บ่าย',
  'ค่ำ',
  'กลางคืน'
];

export const THEATRES: Theatre[] = [
  'majorTheatre7',
  'majorImax'
];

export const FILM_STATUSES: FilmStatus[] = [
  'ตอบรับ / Accepted',
  'รอจัดการเอกสาร / Pending Documentation',
  'จ่ายเงินแล้ว / Payment Completed',
  'รอการส่งของ / Awaiting Delivery',
  'ได้รับของแล้ว / Items Received',
  'ส่งไปยังโรงหนังแล้ว / Sent to Cinema',
  'เสร็จการฉาย / Screening Completed'
];

export const GUEST_ROLES: GuestRole[] = [
  'Director',
  'Producer',
  'Script Writer',
  'Actor',
  'Other'
];

export const AFTER_SCREEN_ACTIVITIES: AfterScreenActivity[] = [
  'qna',
  'talk',
  'redcarpet',
  'fanmeeting',
  'education'
];

export const PUBLICATION_STATUSES: PublicationStatus[] = [
  'public',
  'draft'
];
