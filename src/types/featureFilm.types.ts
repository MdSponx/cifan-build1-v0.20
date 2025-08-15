export interface Guest {
  id?: string;
  name: string;
  contact: string;
  role: GuestRole;
  otherRole?: string; // Used when role is 'Other'
  remarks?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type GuestRole = 
  | 'Director'
  | 'Producer'
  | 'Script Writer'
  | 'Actor'
  | 'Other';

export interface FeatureFilmData {
  // Basic Film Information
  titleEn: string;
  titleTh?: string;
  category: FilmCategory;
  genres: string[]; // Changed from single genre to multiple genres
  countries: string[]; // Changed from single country to multiple countries
  languages: string[]; // Changed from single language to multiple languages
  synopsis: string;
  targetAudience: TargetAudience[];

  // Screening Information
  screeningDate1: string; // datetime-local format
  screeningDate2?: string;
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

  // Status & Additional Info
  status: FilmStatus;
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
  | 'Major Chiang Mai'
  | 'SF Maya'
  | 'IMAX Major Chiang Mai'
  | 'Railway Park'
  | 'IMAX';

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
  'Major Chiang Mai',
  'SF Maya',
  'IMAX Major Chiang Mai',
  'Railway Park',
  'IMAX'
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
