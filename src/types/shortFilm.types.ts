export interface ShortFilmSubmission {
  id: string;
  
  // Metadata
  userId: string;
  applicationId: string;
  competitionCategory: 'youth' | 'future' | 'world';
  category: 'youth' | 'future' | 'world';
  status: 'draft' | 'submitted' | 'accepted' | 'rejected' | 'pending';
  submittedAt: Date | null;
  createdAt: Date;
  lastModified: Date;
  
  // Film Information
  filmTitle: string;
  filmTitleTh?: string;
  filmTitleEn?: string;
  filmLanguages: string[];
  genres: string[];
  format: 'live-action' | 'animation' | '';
  duration: number;
  synopsis: string;
  chiangmaiConnection: string;
  
  // Submitter Information
  submitterName: string;
  submitterNameTh?: string;
  submitterAge: number;
  submitterPhone: string;
  submitterEmail: string;
  submitterRole: string;
  submitterCustomRole?: string;
  
  // Category-specific fields
  nationality?: string; // Youth and Future
  schoolName?: string; // Youth
  studentId?: string; // Youth
  universityName?: string; // Future
  faculty?: string; // Future
  universityId?: string; // Future
  
  // Crew Information
  crewMembers: CrewMember[];
  
  // Files
  files: {
    filmFile: FileMetadata | null;
    posterFile: FileMetadata | null;
    proofFile: FileMetadata | null;
  };
  
  // Agreements
  agreements: {
    copyright: boolean;
    terms: boolean;
    promotional: boolean;
    finalDecision: boolean;
  };
}

export interface CrewMember {
  fullName: string;
  fullNameTh?: string;
  role: string;
  customRole?: string;
  age: number;
  phone?: string;
  email?: string;
  schoolName?: string;
  studentId?: string;
}

export interface FileMetadata {
  url: string;
  name: string;
  size: number;
  type: string;
  storagePath: string;
  uploadedAt: Date;
}

export interface ShortFilmFilters {
  category?: 'youth' | 'future' | 'world' | '';
  genre?: string;
  format?: 'live-action' | 'animation' | '';
  searchTerm?: string;
}

export interface ShortFilmDisplayOptions {
  view: 'gallery' | 'table';
  sortBy: 'title' | 'category' | 'duration' | 'submittedAt';
  sortOrder: 'asc' | 'desc';
  groupBy?: 'category' | 'genre' | 'format' | '';
}

export interface CategoryGroup {
  category: 'youth' | 'future' | 'world';
  displayName: string;
  films: ShortFilmSubmission[];
  count: number;
}

export interface ShortFilmCardProps {
  film: ShortFilmSubmission;
  onClick?: (film: ShortFilmSubmission) => void;
  showCategory?: boolean;
  className?: string;
}

export interface ShortFilmTableRowProps {
  film: ShortFilmSubmission;
  onClick?: (film: ShortFilmSubmission) => void;
  showActions?: boolean;
}

export type ShortFilmCategory = 'youth' | 'future' | 'world';
export type ShortFilmStatus = 'draft' | 'submitted' | 'accepted' | 'rejected' | 'pending';
export type ViewMode = 'gallery' | 'table';
