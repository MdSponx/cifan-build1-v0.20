// Festival Schedule Grid Types
export interface ScheduleItem {
  id: string;
  title: string;
  type: 'film' | 'activity';
  category: 'screening' | 'workshop' | 'networking' | 'ceremony' | 'panel' | 'special';
  startTime: string; // HH:MM format
  endTime: string;   // HH:MM format
  date: string;      // YYYY-MM-DD format
  venue: string;     // Venue name/location
  duration: number;  // Minutes
  description?: string;
  maxParticipants?: number;
  registrationRequired?: boolean;
  publicationStatus?: string;
  
  // Additional fields from existing data
  image?: string;
  director?: string;
  country?: string;  // Film nationality for flag emoji
  cast?: string[];
  genres?: string[];
  rating?: string;
  speakers?: Array<{
    name: string;
    role: string;
    bio?: string;
  }>;
  organizers?: string[];
  tags?: string[];
  
  // Status and metadata
  status?: string;
  isPublic?: boolean;
  featured?: boolean;
  registeredParticipants?: number;
  views?: number;
}

export interface FestivalScheduleGridProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  venues: string[];
  onEventClick: (event: ScheduleItem) => void;
  className?: string;
  festivalStartDate?: Date;
  festivalEndDate?: Date;
  timeSlotDuration?: number; // Minutes per slot (default: 15)
  startHour?: number; // Start hour (default: 10)
  endHour?: number; // End hour (default: 24)
}

export interface TimeSlot {
  time: string; // HH:MM format
  displayTime: string; // Formatted display time
  gridRow: number; // CSS grid row position
}

export interface VenueColumn {
  name: string;
  displayName: string;
  gridColumn: number;
  color?: string;
}

export interface ScheduleFilters {
  venues?: string[];
  categories?: string[];
  types?: ('film' | 'activity')[];
  search?: string;
  showOnlyAvailable?: boolean;
  showOnlyFeatured?: boolean;
}

export interface ScheduleViewOptions {
  showConflicts: boolean;
  showCurrentTime: boolean;
  compactView: boolean;
  showVenueColors: boolean;
  autoRefresh: boolean;
}

// Hook return type
export interface UseScheduleDataReturn {
  scheduleItems: ScheduleItem[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refreshData: () => Promise<void>;
}

// Venue configuration - ✅ FIX: Use camelCase names that match database storage
export const FESTIVAL_VENUES: VenueColumn[] = [
  { name: 'stageZone', displayName: 'Stage Zone', gridColumn: 1, color: '#FF6B6B' },
  { name: 'expoZone', displayName: 'EXPO Zone', gridColumn: 2, color: '#4ECDC4' },
  { name: 'market', displayName: 'Market', gridColumn: 3, color: '#FFEAA7' },
  { name: 'majorTheatre7', displayName: 'Major Theatre 7', gridColumn: 4, color: '#45B7D1' },
  { name: 'majorImax', displayName: 'Major IMAX', gridColumn: 5, color: '#96CEB4' },
  { name: 'anusarn', displayName: 'Anusarn', gridColumn: 6, color: '#DDA0DD' }
];

// Category colors for visual distinction
export const CATEGORY_COLORS = {
  screening: 'from-blue-500 to-blue-600',
  workshop: 'from-green-500 to-green-600',
  networking: 'from-purple-500 to-purple-600',
  ceremony: 'from-red-500 to-red-600',
  panel: 'from-yellow-500 to-yellow-600',
  special: 'from-pink-500 to-pink-600'
} as const;

// Time slot configuration
export const TIME_SLOT_CONFIG = {
  SLOT_DURATION: 15, // minutes
  START_HOUR: 10,    // 10:00 AM
  END_HOUR: 24,      // 12:00 AM (midnight)
  SLOT_HEIGHT: 20    // pixels per 15-minute slot
} as const;

// Festival dates configuration (8 days)
export const FESTIVAL_CONFIG = {
  DURATION_DAYS: 8,
  DEFAULT_START_DATE: new Date('2025-09-20'), // September 20, 2025
  TIMEZONE: 'Asia/Bangkok'
} as const;
