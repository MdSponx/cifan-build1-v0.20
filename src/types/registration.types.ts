import { Timestamp } from 'firebase/firestore';

// Participant category options
export type ParticipantCategory = 
  | 'high_school_vocational' // นักเรียนมัธยม / ปวช
  | 'university_higher_vocational' // นิสิต / นักศึกษา / ปวส
  | 'general_public'; // ประชาชนทั่วไป

// Registration form data interface
export interface RegistrationFormData {
  participantName: string;
  participantNameEn?: string;
  email: string;
  phone: string;
  category: ParticipantCategory;
  occupation?: string;
  organization?: string;
  additionalNotes?: string;
}

// Complete registration document interface
export interface ActivityRegistration {
  id: string;
  participantName: string;
  participantNameEn?: string;
  email: string;
  phone: string;
  category: ParticipantCategory;
  occupation?: string;
  organization?: string;
  trackingCode: string;
  registeredAt: Timestamp;
  status: AttendanceStatus;
  additionalNotes?: string;
  
  // Metadata
  registrationSource: 'web' | 'admin';
  ipAddress?: string;
  userAgent?: string;
}

// Firestore document structure
export interface RegistrationFirestoreDoc {
  id: string;
  participantName: string;
  participantNameEn?: string;
  email: string;
  phone: string;
  category: ParticipantCategory;
  occupation?: string;
  organization?: string;
  trackingCode: string;
  registeredAt: any; // Firestore Timestamp
  status: AttendanceStatus;
  additionalNotes?: string;
  registrationSource: 'web' | 'admin';
  ipAddress?: string;
  userAgent?: string;
}

// Attendance status types
export type AttendanceStatus = 'registered' | 'attended' | 'absent';

// Registration result interface
export interface RegistrationResult {
  success: boolean;
  registrationId?: string;
  trackingCode?: string;
  error?: string;
  errorCode?: RegistrationErrorCode;
}

// Error codes for registration
export type RegistrationErrorCode = 
  | 'DUPLICATE_EMAIL'
  | 'ACTIVITY_FULL'
  | 'REGISTRATION_CLOSED'
  | 'ACTIVITY_NOT_FOUND'
  | 'INVALID_DATA'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR';

// Registration filters for admin
export interface RegistrationFilters {
  status?: AttendanceStatus;
  search?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  sortBy?: 'registeredAt' | 'participantName' | 'email';
  sortOrder?: 'asc' | 'desc';
}

// Registration list response
export interface RegistrationListResult {
  registrations: ActivityRegistration[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

// Bulk update result
export interface BulkUpdateResult {
  success: boolean;
  updatedCount: number;
  failedCount: number;
  errors?: string[];
}

// Registration analytics
export interface RegistrationAnalytics {
  totalRegistrations: number;
  statusBreakdown: Record<AttendanceStatus, number>;
  registrationTrends: MonthlyRegistrationData[];
  attendanceRate: number;
  popularTimeSlots: TimeSlotData[];
  averageRegistrationsPerDay: number;
  peakRegistrationDay: string;
}

// Monthly registration data
export interface MonthlyRegistrationData {
  month: string;
  registrations: number;
  attended: number;
  attendanceRate: number;
}

// Time slot data for analytics
export interface TimeSlotData {
  timeSlot: string;
  registrations: number;
  percentage: number;
}

// Tracking result interface
export interface TrackingResult {
  found: boolean;
  registration?: ActivityRegistration;
  activity?: {
    id: string;
    name: string;
    eventDate: string;
    startTime: string;
    endTime: string;
    venueName: string;
    venueLocation?: string;
  };
  error?: string;
}

// Email template data
export interface RegistrationEmailData {
  participantName: string;
  activityName: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  venueName: string;
  venueLocation?: string;
  trackingCode: string;
  registrationId: string;
}

// QR code data
export interface QRCodeData {
  registrationId: string;
  trackingCode: string;
  activityId: string;
  participantName: string;
  email: string;
}

// Registration validation errors
export interface RegistrationValidationErrors {
  participantName?: string;
  participantNameEn?: string;
  email?: string;
  phone?: string;
  category?: string;
  occupation?: string;
  organization?: string;
  additionalNotes?: string;
  general?: string;
}

// Registration form props
export interface RegistrationFormProps {
  activityId: string;
  activityName: string;
  maxParticipants: number;
  currentRegistrations: number;
  registrationDeadline: string;
  onSubmit: (data: RegistrationFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  errors?: RegistrationValidationErrors;
}

// Registration modal props
export interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  activityId: string;
  activityName: string;
  maxParticipants: number;
  currentRegistrations: number;
  registrationDeadline: string;
  onSuccess?: (result: RegistrationResult) => void;
}

// Tracking component props
export interface RegistrationTrackerProps {
  onTrackingResult?: (result: TrackingResult) => void;
  className?: string;
}

// Admin participants list props
export interface ParticipantsListProps {
  activityId: string;
  activityName: string;
  onRegistrationUpdate?: () => void;
  className?: string;
}

// Participant category options
export const PARTICIPANT_CATEGORY_OPTIONS = [
  {
    value: 'high_school_vocational' as ParticipantCategory,
    label: 'High School / Vocational',
    labelTh: 'นักเรียนมัธยม / ปวช',
    description: 'High school students and vocational certificate students',
    descriptionTh: 'นักเรียนมัธยมศึกษาและนักเรียนประกาศนียบัตรวิชาชีพ'
  },
  {
    value: 'university_higher_vocational' as ParticipantCategory,
    label: 'University / Higher Vocational',
    labelTh: 'นิสิต / นักศึกษา / ปวส',
    description: 'University students and higher vocational diploma students',
    descriptionTh: 'นิสิต นักศึกษา และนักเรียนประกาศนียบัตรวิชาชีพชั้นสูง'
  },
  {
    value: 'general_public' as ParticipantCategory,
    label: 'General Public',
    labelTh: 'ประชาชนทั่วไป',
    description: 'General public and working professionals',
    descriptionTh: 'ประชาชนทั่วไปและผู้ประกอบอาชีพ'
  }
];

// Registration status options
export const ATTENDANCE_STATUS_OPTIONS = [
  {
    value: 'registered' as AttendanceStatus,
    label: 'Registered',
    labelTh: 'ลงทะเบียนแล้ว',
    color: 'blue',
    description: 'Participant has registered',
    descriptionTh: 'ผู้เข้าร่วมได้ลงทะเบียนแล้ว'
  },
  {
    value: 'attended' as AttendanceStatus,
    label: 'Attended',
    labelTh: 'เข้าร่วมแล้ว',
    color: 'green',
    description: 'Participant attended the event',
    descriptionTh: 'ผู้เข้าร่วมเข้าร่วมงานแล้ว'
  },
  {
    value: 'absent' as AttendanceStatus,
    label: 'Absent',
    labelTh: 'ไม่เข้าร่วม',
    color: 'red',
    description: 'Participant did not attend',
    descriptionTh: 'ผู้เข้าร่วมไม่ได้เข้าร่วมงาน'
  }
];

// Registration validation rules
export const REGISTRATION_VALIDATION_RULES = {
  participantName: {
    required: true,
    minLength: 2,
    maxLength: 100,
    pattern: /^[\u0E00-\u0E7Fa-zA-Z\s\-\.]+$/
  },
  participantNameEn: {
    required: false,
    minLength: 2,
    maxLength: 100,
    pattern: /^[a-zA-Z\s\-\.]+$/
  },
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    maxLength: 255
  },
  phone: {
    required: true,
    minLength: 10,
    maxLength: 15,
    pattern: /^[\d\-\+\(\)\s]+$/
  },
  category: {
    required: true
  },
  occupation: {
    required: false,
    maxLength: 100
  },
  organization: {
    required: false,
    maxLength: 200
  },
  additionalNotes: {
    required: false,
    maxLength: 500
  }
};

// Default registration filters
export const DEFAULT_REGISTRATION_FILTERS: RegistrationFilters = {
  sortBy: 'registeredAt',
  sortOrder: 'desc'
};

// Registration export formats
export type RegistrationExportFormat = 'csv' | 'xlsx' | 'pdf';

// Export data interface
export interface RegistrationExportData {
  registrations: ActivityRegistration[];
  activity: {
    id: string;
    name: string;
    eventDate: string;
    venueName: string;
  };
  exportDate: string;
  totalCount: number;
  statusBreakdown: Record<AttendanceStatus, number>;
}

// Hook return types
export interface UseRegistrationReturn {
  registrations: ActivityRegistration[];
  isLoading: boolean;
  error: string | null;
  totalCount: number;
  currentPage: number;
  totalPages: number;
  filters: RegistrationFilters;
  
  // Actions
  fetchRegistrations: () => Promise<void>;
  registerParticipant: (data: RegistrationFormData) => Promise<RegistrationResult>;
  updateRegistrationStatus: (registrationId: string, status: AttendanceStatus) => Promise<void>;
  bulkUpdateStatus: (registrationIds: string[], status: AttendanceStatus) => Promise<BulkUpdateResult>;
  exportRegistrations: (format: RegistrationExportFormat) => Promise<Blob>;
  
  // Filters and pagination
  setFilters: (filters: RegistrationFilters) => void;
  setCurrentPage: (page: number) => void;
  resetFilters: () => void;
  refreshData: () => Promise<void>;
}

export interface UseTrackingReturn {
  isLoading: boolean;
  error: string | null;
  trackingResult: TrackingResult | null;
  
  // Actions
  trackByCode: (trackingCode: string) => Promise<TrackingResult>;
  trackByEmail: (email: string) => Promise<ActivityRegistration[]>;
  generateQRCode: (registration: ActivityRegistration) => Promise<string>;
  clearResult: () => void;
}
