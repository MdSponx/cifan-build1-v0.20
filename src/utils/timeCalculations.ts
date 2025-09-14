/**
 * Time Calculations Utility Functions
 * 
 * Provides functions to calculate start and end times for film screenings
 * based on screening dates and time estimates.
 */

/**
 * Calculate end time from start time and duration in minutes
 */
export const calculateEndTime = (startTime: string, durationMinutes: number): string => {
  try {
    const [hour, min] = startTime.split(':').map(Number);
    const startMinutes = hour * 60 + min;
    const endMinutes = startMinutes + durationMinutes;
    
    const endHour = Math.floor(endMinutes / 60) % 24;
    const endMin = endMinutes % 60;
    
    return `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;
  } catch (error) {
    console.warn('Error calculating end time:', { startTime, durationMinutes }, error);
    return startTime;
  }
};

/**
 * Extract time from screening date field (handles various date formats)
 */
export const extractTimeFromScreeningDate = (dateField: any): string => {
  try {
    // Handle ISO string format (datetime-local input)
    if (typeof dateField === 'string' && dateField.includes('T')) {
      const timePart = dateField.split('T')[1];
      if (timePart) {
        const [hours, minutes] = timePart.split(':').map(Number);
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      }
    }
    
    // Handle Date object or timestamp
    const screeningDateTime = new Date(dateField);
    if (!isNaN(screeningDateTime.getTime())) {
      const hours = screeningDateTime.getHours();
      const minutes = screeningDateTime.getMinutes();
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
  } catch (error) {
    console.warn('Error extracting time from screening date:', dateField, error);
  }
  
  return '19:00'; // Default fallback
};

/**
 * Map Thai time estimate to 24-hour format
 */
export const mapTimeEstimate = (timeEstimate: string): string => {
  const timeMap: Record<string, string> = {
    'เช้า': '10:00',      // Morning
    'บ่าย': '14:00',      // Afternoon
    'ค่ำ': '19:00',       // Evening
    'กลางคืน': '22:00'    // Night
  };
  
  return timeMap[timeEstimate] || '19:00';
};

/**
 * Get time estimate display name with mapped time
 */
export const getTimeEstimateDisplay = (timeEstimate: string): string => {
  const displayMap: Record<string, string> = {
    'เช้า': 'เช้า (Morning - 10:00)',
    'บ่าย': 'บ่าย (Afternoon - 14:00)',
    'ค่ำ': 'ค่ำ (Evening - 19:00)',
    'กลางคืน': 'กลางคืน (Night - 22:00)'
  };
  
  return displayMap[timeEstimate] || timeEstimate;
};

/**
 * Validate time format (HH:MM)
 */
export const isValidTimeFormat = (time: string): boolean => {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
};

/**
 * Format duration in minutes to human readable format
 */
export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) {
    return `${mins} minutes`;
  } else if (mins === 0) {
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  } else {
    return `${hours} hour${hours > 1 ? 's' : ''} ${mins} minutes`;
  }
};

/**
 * Calculate screening times for both screening dates
 */
export const calculateScreeningTimes = (
  screeningDate1?: string,
  screeningDate2?: string,
  timeEstimate?: string,
  duration?: number
): {
  startTime1?: string;
  endTime1?: string;
  startTime2?: string;
  endTime2?: string;
} => {
  const result: {
    startTime1?: string;
    endTime1?: string;
    startTime2?: string;
    endTime2?: string;
  } = {};

  // Calculate times for screening 1 - 🚨 CRITICAL FIX: Only use screeningDate1, ignore timeEstimate
  if (screeningDate1) {
    const startTime1 = extractTimeFromScreeningDate(screeningDate1);
    
    result.startTime1 = startTime1;
    
    if (duration && duration > 0) {
      result.endTime1 = calculateEndTime(startTime1, duration);
    }
  }
  // 🚨 CRITICAL FIX: Completely ignore timeEstimate parameter - it should never be used

  // Calculate times for screening 2 - ONLY if screeningDate2 exists
  // Don't use timeEstimate fallback for screening 2 to avoid duplication
  if (screeningDate2) {
    const startTime2 = extractTimeFromScreeningDate(screeningDate2);
    
    result.startTime2 = startTime2;
    
    if (duration && duration > 0) {
      result.endTime2 = calculateEndTime(startTime2, duration);
    }
  }

  return result;
};
