import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  query, 
  where, 
  getDocs,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { db } from '../firebase';
import { ScheduleItem, UseScheduleDataReturn } from '../types/schedule.types';
import { Activity } from '../types/activities';
import { FeatureFilm } from '../types/featureFilm.types';
import { activitiesService } from '../services/activitiesService';
import { getEnhancedFeatureFilms } from '../services/featureFilmService';
import { getMockScheduleData } from '../utils/mockScheduleData';

/**
 * Custom hook to fetch and manage schedule data from both films and activities collections
 * Combines data from Firestore and provides real-time updates
 * Can use mock data for testing by setting REACT_APP_USE_MOCK_SCHEDULE=true
 */
export const useScheduleData = (selectedDate: Date, useMockData: boolean = false): UseScheduleDataReturn => {
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Helper function to calculate duration in minutes
  const calculateDuration = useCallback((startTime: string, endTime: string): number => {
    try {
      const [startHour, startMin] = startTime.split(':').map(Number);
      const [endHour, endMin] = endTime.split(':').map(Number);
      
      const startMinutes = startHour * 60 + startMin;
      let endMinutes = endHour * 60 + endMin;
      
      // Handle overnight events (end time next day)
      if (endMinutes < startMinutes) {
        endMinutes += 24 * 60;
      }
      
      return endMinutes - startMinutes;
    } catch (error) {
      console.warn('Error calculating duration:', { startTime, endTime }, error);
      return 120; // Default 2 hours
    }
  }, []);

  // Helper function to calculate end time from start time and duration
  const calculateEndTime = useCallback((startTime: string, durationMinutes: number): string => {
    try {
      const [hour, min] = startTime.split(':').map(Number);
      const startMinutes = hour * 60 + min;
      const endMinutes = startMinutes + durationMinutes;
      
      const endHour = Math.floor(endMinutes / 60) % 24;
      const endMin = endMinutes % 60;
      
      return `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;
    } catch (error) {
      console.warn('Error calculating end time:', { startTime, durationMinutes }, error);
      return startTime; // Fallback to start time
    }
  }, []);

  // Helper function to map venue names to standardized venues
  const mapVenueName = useCallback((venueName: string): string => {
    // ✅ FIX: Keep venue names in their original camelCase format as stored in database
    // The schedule grid expects the same format as stored in the database
    const venueMap: Record<string, string> = {
      // Database camelCase format (keep as-is)
      'stageZone': 'stageZone',
      'expoZone': 'expoZone',
      'majorTheatre7': 'majorTheatre7',
      'majorImax': 'majorImax',
      'market': 'market',
      'anusarn': 'anusarn',
      
      // Legacy display name format (convert to camelCase)
      'Stage Zone': 'stageZone',
      'EXPO Zone': 'expoZone',
      'Major Theatre 7': 'majorTheatre7',
      'Major Chiang Mai': 'majorTheatre7',
      'Major IMAX': 'majorImax',
      'IMAX Major Chiang Mai': 'majorImax',
      'IMAX': 'majorImax',
      'Market': 'market',
      'Asiatrip': 'anusarn',
      'Railway Park': 'stageZone', // Map to closest venue
      'SF Maya': 'expoZone' // Map to closest venue
    };

    console.log('🏢 Mapping venue name:', venueName, '→', venueMap[venueName] || 'stageZone');
    return venueMap[venueName] || 'stageZone'; // Default to stageZone
  }, []);


  // Helper function to extract time from screening date field
  const extractTimeFromScreeningDate = useCallback((dateField: any): string => {
    console.log('🕐 EXTRACTING TIME FROM SCREENING DATE:', {
      dateField,
      dateFieldType: typeof dateField,
      dateFieldValue: dateField,
      isString: typeof dateField === 'string',
      hasT: typeof dateField === 'string' && dateField.includes('T')
    });

    try {
      let screeningDateTime: Date;
      let startTime: string;

      // Handle different possible formats
      if (typeof dateField === 'string') {
        console.log('🔤 Processing string dateField:', dateField);
        
        // If it's a string like "2025-09-26T14:00", parse it directly
        if (dateField.includes('T')) {
          console.log('📅 String contains T, extracting time part...');
          
          // Parse as ISO string but handle timezone issues
          screeningDateTime = new Date(dateField);
          console.log('📅 Parsed screeningDateTime:', screeningDateTime.toISOString());

          // Extract time directly from the string to avoid timezone issues
          const timePart = dateField.split('T')[1];
          console.log('🕐 Time part from string:', timePart);
          
          if (timePart) {
            const [hours, minutes] = timePart.split(':').map(Number);
            startTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
            console.log('✅ Extracted time from string:', { hours, minutes, startTime });
          } else {
            // Fallback to Date object extraction
            const hours = screeningDateTime.getHours();
            const minutes = screeningDateTime.getMinutes();
            startTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
            console.log('⚠️ Fallback to Date object extraction:', { hours, minutes, startTime });
          }
        } else {
          console.log('📅 String does not contain T, parsing as Date...');
          // Handle other string formats
          screeningDateTime = new Date(dateField);
          const hours = screeningDateTime.getHours();
          const minutes = screeningDateTime.getMinutes();
          startTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
          console.log('🕐 Extracted from Date object:', { hours, minutes, startTime });
        }
      } else {
        console.log('🔢 Processing non-string dateField (Timestamp/Date):', dateField);
        // Handle Firestore Timestamp or Date object
        screeningDateTime = new Date(dateField);
        const hours = screeningDateTime.getHours();
        const minutes = screeningDateTime.getMinutes();
        startTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        console.log('🕐 Extracted from Timestamp/Date:', { hours, minutes, startTime });
      }

      // Check if the date is valid
      if (isNaN(screeningDateTime.getTime())) {
        console.error(`❌ Invalid date for time extraction:`, dateField);
        return '19:00'; // Default fallback
      }

      console.log('✅ FINAL EXTRACTED TIME:', startTime);
      return startTime;
    } catch (error) {
      console.warn('❌ Error extracting time from screening date:', dateField, error);
      return '19:00'; // Default fallback
    }
  }, []);

  // Convert Activity to ScheduleItem
  const convertActivityToScheduleItem = useCallback((activity: Activity): ScheduleItem => {
    // Determine category based on activity tags and type
    let category: ScheduleItem['category'] = 'special';
    
    if (activity.tags.includes('workshop') || activity.tags.includes('masterclass')) {
      category = 'workshop';
    } else if (activity.tags.includes('networking')) {
      category = 'networking';
    } else if (activity.tags.includes('ceremony') || activity.tags.includes('awards')) {
      category = 'ceremony';
    } else if (activity.tags.includes('panel') || activity.tags.includes('talk')) {
      category = 'panel';
    }

    // Calculate duration from start and end times
    const startTime = activity.startTime;
    const endTime = activity.endTime;
    const duration = calculateDuration(startTime, endTime);

    // Map venue name to standardized venue
    const venue = mapVenueName(activity.venueName);

    return {
      id: activity.id,
      title: activity.name,
      type: 'activity',
      category,
      startTime,
      endTime,
      date: activity.eventDate,
      venue,
      duration,
      description: activity.shortDescription,
      maxParticipants: activity.maxParticipants,
      registrationRequired: activity.needSubmission,
      publicationStatus: activity.status,
      image: activity.image,
      speakers: activity.speakers?.map(speaker => ({
        name: speaker.name,
        role: speaker.role,
        bio: speaker.bio
      })),
      organizers: activity.organizers,
      tags: activity.tags,
      status: activity.status,
      isPublic: activity.isPublic,
      registeredParticipants: activity.registeredParticipants,
      views: activity.views
    };
  }, []);

  // Convert FeatureFilm to ScheduleItem - FIXED VERSION
  const convertFeatureFilmsToScheduleItems = useCallback((film: FeatureFilm): ScheduleItem[] => {
    const scheduleItems: ScheduleItem[] = [];

    // Debug: Log every film being processed
    console.log(`🎬 PROCESSING FILM: "${film.title}"`, {
      id: film.id,
      hasScreenings: !!(film.screenings && film.screenings.length > 0),
      screeningsCount: film.screenings?.length || 0,
      legacyScreeningDate1: (film as any).screeningDate1,
      legacyScreeningDate2: (film as any).screeningDate2,
      legacyStartTime1: (film as any).startTime1,
      legacyEndTime1: (film as any).endTime1,
      legacyStartTime2: (film as any).startTime2,
      legacyEndTime2: (film as any).endTime2,
      legacyTimeEstimate: (film as any).timeEstimate,
      legacyTheatre: (film as any).theatre,
      allFilmKeys: Object.keys(film)
    });

    // 🚨 SPECIAL DEBUG FOR MARCHING BOYS
    if (film.title.toLowerCase().includes('marching') || film.title.toLowerCase().includes('boys')) {
      console.log(`🚨 SPECIAL DEBUG FOR MARCHING BOYS:`, {
        title: film.title,
        id: film.id,
        rawFilmData: film,
        legacyFilmData: film as any,
        startTime1Type: typeof (film as any).startTime1,
        startTime1Value: (film as any).startTime1,
        startTime1Length: (film as any).startTime1?.length,
        endTime1Type: typeof (film as any).endTime1,
        endTime1Value: (film as any).endTime1,
        timeEstimateType: typeof (film as any).timeEstimate,
        timeEstimateValue: (film as any).timeEstimate,
        screeningDate1Type: typeof (film as any).screeningDate1,
        screeningDate1Value: (film as any).screeningDate1,
        theatreValue: (film as any).theatre,
        allKeys: Object.keys(film as any).sort()
      });
    }

    // If film has screening information, create schedule items
    if (film.screenings && film.screenings.length > 0) {
      console.log(`🎬 MODERN SCREENING PROCESSING for "${film.title}":`, {
        screeningsCount: film.screenings.length,
        screenings: film.screenings.map((s, i) => ({
          index: i,
          date: s.date,
          time: s.time,
          venue: s.venue,
          dateType: typeof s.date,
          dateValue: s.date,
          dateISO: s.date?.toISOString ? s.date.toISOString() : 'N/A'
        }))
      });

      film.screenings.forEach((screening, index) => {
        try {
          console.log(`🔍 PROCESSING MODERN SCREENING ${index + 1} for "${film.title}":`, {
            screening,
            dateType: typeof screening.date,
            dateValue: screening.date,
            hasToISOString: !!screening.date?.toISOString,
            time: screening.time,
            venue: screening.venue
          });

          let screeningDate: string;
          
          if (screening.date?.toISOString) {
            // Firestore Timestamp
            screeningDate = screening.date.toISOString().split('T')[0];
            console.log(`📅 Extracted date from Timestamp: ${screeningDate}`);
          } else if (typeof screening.date === 'string') {
            // String date
            screeningDate = screening.date.split('T')[0];
            console.log(`📅 Extracted date from string: ${screeningDate}`);
          } else {
            console.error(`❌ Invalid date format for screening:`, screening.date);
            return; // Skip this screening
          }
          
          // 🚨 CRITICAL FIX: Handle Thai time words in modern screening time field
          let startTime: string;
          
          console.log(`🔍 MODERN SCREENING TIME PROCESSING for "${film.title}" screening ${index + 1}:`, {
            rawTime: screening.time,
            timeType: typeof screening.time,
            timeValue: screening.time
          });
          
          // Helper function to validate if a string is a valid time format (H:MM or HH:MM)
          const isValidTimeFormat = (timeStr: string): boolean => {
            if (!timeStr || typeof timeStr !== 'string') return false;
            // Updated regex to accept both H:MM and HH:MM formats
            const timeRegex = /^(\d{1,2}):(\d{2})$/;
            const thaiTimeWords = ['เช้า', 'บ่าย', 'ค่ำ', 'กลางคืน'];
            return timeRegex.test(timeStr.trim()) && !thaiTimeWords.some(word => timeStr.includes(word));
          };
          
          // Convert Thai time words to proper time format
          const convertThaiTimeToProperTime = (thaiTime: string): string => {
            console.log(`🔄 Converting Thai time word: "${thaiTime}"`);
            
            const timeMap: Record<string, string> = {
              'เช้า': '10:00',      // Morning -> 10:00 AM
              'บ่าย': '14:00',     // Afternoon -> 2:00 PM  
              'ค่ำ': '19:00',      // Evening -> 7:00 PM
              'กลางคืน': '22:00'   // Night -> 10:00 PM
            };
            
            for (const [thaiWord, properTime] of Object.entries(timeMap)) {
              if (thaiTime.includes(thaiWord)) {
                console.log(`✅ Converted "${thaiTime}" → "${properTime}"`);
                return properTime;
              }
            }
            
            console.log(`⚠️ No conversion found for "${thaiTime}", using default 19:00`);
            return '19:00'; // Default fallback
          };
          
          if (screening.time && isValidTimeFormat(screening.time)) {
            // Use valid time format directly
            startTime = screening.time;
            console.log(`✅ USING VALID TIME FORMAT: ${startTime}`);
          } else if (screening.time && typeof screening.time === 'string') {
            // Convert Thai time words to proper time format
            startTime = convertThaiTimeToProperTime(screening.time);
            console.log(`🔄 CONVERTED THAI TIME: "${screening.time}" → "${startTime}"`);
          } else {
            // Use default time
            startTime = '19:00';
            console.log(`⚠️ USING DEFAULT TIME: ${startTime}`);
          }
          
          const endTime = calculateEndTime(startTime, film.duration);
          
          console.log(`✅ FINAL MODERN SCREENING TIMES for "${film.title}" screening ${index + 1}:`, {
            startTime,
            endTime,
            originalScreeningTime: screening.time,
            duration: film.duration
          });
          
          // Map venue name to standardized venue
          const venue = mapVenueName(screening.venue);

          console.log(`✅ CREATING MODERN SCHEDULE ITEM for "${film.title}" screening ${index + 1}:`, {
            startTime,
            endTime,
            venue,
            date: screeningDate,
            duration: film.duration
          });

          const scheduleItem: ScheduleItem = {
            id: `${film.id}-screening-${index}`,
            title: film.title,
            type: 'film',
            category: 'screening',
            startTime,
            endTime,
            date: screeningDate,
            venue,
            duration: film.duration,
            description: film.synopsis,
            publicationStatus: film.publicationStatus || (film.status === 'published' ? 'public' : 'draft'),
            image: film.files?.poster?.url || film.posterUrl,
            director: film.director,
            cast: film.cast?.map(member => member.name),
            genres: film.genres,
            rating: film.rating,
            tags: film.tags,
            status: film.status,
            featured: film.featured
          };

          scheduleItems.push(scheduleItem);
          console.log(`✅ SUCCESSFULLY ADDED MODERN SCHEDULE ITEM:`, scheduleItem);

        } catch (error) {
          console.error(`❌ Error processing modern screening ${index + 1} for "${film.title}":`, error);
        }
      });
    }

    // 🚨 CRITICAL FIX: Always check for legacy screeningDate2 fields regardless of modern screenings
    // This ensures that films with both modern screenings AND legacy second screening data show both
    const legacyFilm = film as any;
    
    console.log(`🔍 CHECKING LEGACY SECOND SCREENING for "${film.title}":`, {
      hasScreeningDate2: !!legacyFilm.screeningDate2,
      screeningDate2Value: legacyFilm.screeningDate2,
      hasStartTime2: !!legacyFilm.startTime2,
      startTime2Value: legacyFilm.startTime2,
      hasEndTime2: !!legacyFilm.endTime2,
      endTime2Value: legacyFilm.endTime2,
      currentScheduleItemsCount: scheduleItems.length
    });

    // Check for legacy screeningDate2 with startTime2 and endTime2
    if (legacyFilm.screeningDate2) {
      try {
        console.log(`🎬 PROCESSING LEGACY SECOND SCREENING for "${film.title}":`, {
          screeningDate2: legacyFilm.screeningDate2,
          startTime2: legacyFilm.startTime2,
          endTime2: legacyFilm.endTime2
        });

        // Extract date from screeningDate2 field
        const screeningDateTime = new Date(legacyFilm.screeningDate2);

        // Check if the date is valid
        if (isNaN(screeningDateTime.getTime())) {
          console.error(`❌ Invalid screeningDate2 for film "${film.title}":`, legacyFilm.screeningDate2);
        } else {
          const screeningDate = screeningDateTime.toISOString().split('T')[0];
          
          // Helper function to validate if a string is a valid time format (H:MM or HH:MM)
          const isValidTimeFormat = (timeStr: string): boolean => {
            if (!timeStr || typeof timeStr !== 'string') return false;
            // Updated regex to accept both H:MM and HH:MM formats
            const timeRegex = /^(\d{1,2}):(\d{2})$/;
            const thaiTimeWords = ['เช้า', 'บ่าย', 'ค่ำ', 'กลางคืน'];
            return timeRegex.test(timeStr.trim()) && !thaiTimeWords.some(word => timeStr.includes(word));
          };
          
          // Process startTime2 and endTime2
          let startTime: string;
          let endTime: string;
          
          console.log(`🔍 LEGACY SECOND SCREENING TIME PROCESSING for "${film.title}":`, {
            startTime2Field: legacyFilm.startTime2,
            endTime2Field: legacyFilm.endTime2,
            startTime2Type: typeof legacyFilm.startTime2,
            endTime2Type: typeof legacyFilm.endTime2
          });
          
          // Use startTime2 field if valid, otherwise extract from screeningDate2
          if (legacyFilm.startTime2 && isValidTimeFormat(legacyFilm.startTime2)) {
            const cleanStartTime = legacyFilm.startTime2.trim();
            const timeRegex = /^(\d{1,2}):(\d{2})$/;
            const timeMatch = cleanStartTime.match(timeRegex);
            
            if (timeMatch) {
              const [, hours, minutes] = timeMatch;
              startTime = `${hours.padStart(2, '0')}:${minutes}`;
              console.log(`✅ USING DEDICATED startTime2 FIELD: ${startTime}`);
              
              // Use endTime2 field if valid, otherwise calculate from duration
              if (legacyFilm.endTime2 && isValidTimeFormat(legacyFilm.endTime2)) {
                const cleanEndTime = legacyFilm.endTime2.trim();
                const endTimeMatch = cleanEndTime.match(timeRegex);
                if (endTimeMatch) {
                  const [, endHours, endMinutes] = endTimeMatch;
                  endTime = `${endHours.padStart(2, '0')}:${endMinutes}`;
                  console.log(`✅ USING DEDICATED endTime2 FIELD: ${endTime}`);
                } else {
                  // Calculate from duration
                  const durationMinutes = legacyFilm.length || legacyFilm.Length || film.duration || 120;
                  endTime = calculateEndTime(startTime, durationMinutes);
                  console.log(`🔄 Calculated endTime from duration (invalid endTime2 field): ${endTime}`);
                }
              } else {
                // Calculate from duration
                const durationMinutes = legacyFilm.length || legacyFilm.Length || film.duration || 120;
                endTime = calculateEndTime(startTime, durationMinutes);
                console.log(`🔄 Calculated endTime from duration (no endTime2 field): ${endTime}`);
              }
            } else {
              console.log(`❌ ERROR: Time regex failed for startTime2: ${cleanStartTime}`);
              // Fallback to extracting time from screeningDate2
              startTime = extractTimeFromScreeningDate(legacyFilm.screeningDate2);
              const durationMinutes = legacyFilm.length || legacyFilm.Length || film.duration || 120;
              endTime = calculateEndTime(startTime, durationMinutes);
              console.log(`⚠️ FALLBACK TIME EXTRACTION for second screening:`, { startTime, endTime });
            }
          } else {
            console.log(`⚠️ No valid startTime2 field (value: "${legacyFilm.startTime2}"), falling back to screeningDate2 extraction`);
            // Fallback to extracting time from screeningDate2
            startTime = extractTimeFromScreeningDate(legacyFilm.screeningDate2);
            const durationMinutes = legacyFilm.length || legacyFilm.Length || film.duration || 120;
            endTime = calculateEndTime(startTime, durationMinutes);
            console.log(`⚠️ FALLBACK TIME EXTRACTION for second screening:`, { startTime, endTime, source: 'screeningDate2' });
          }
          
          // Map venue from theatre field
          const venue = mapVenueName(legacyFilm.theatre || 'Major Theatre 7');

          const secondScreeningItem: ScheduleItem = {
            id: `${film.id}-screening-2`,
            title: film.title,
            type: 'film',
            category: 'screening',
            startTime,
            endTime,
            date: screeningDate,
            venue,
            duration: legacyFilm.length || legacyFilm.Length || film.duration || 120,
            description: film.synopsis,
            publicationStatus: film.publicationStatus || (film.status === 'published' ? 'public' : 'draft'),
            image: film.files?.poster?.url || film.posterUrl || legacyFilm.posterUrl,
            director: film.director,
            cast: film.cast?.map(member => member.name),
            genres: film.genres,
            rating: film.rating,
            tags: film.tags,
            status: film.status,
            featured: film.featured
          };

          scheduleItems.push(secondScreeningItem);
          console.log(`✅ SUCCESSFULLY ADDED LEGACY SECOND SCREENING ITEM for "${film.title}":`, {
            startTime,
            endTime,
            venue,
            date: screeningDate,
            usedDedicatedStartTime2: isValidTimeFormat(legacyFilm.startTime2),
            usedDedicatedEndTime2: isValidTimeFormat(legacyFilm.endTime2),
            originalStartTime2Field: legacyFilm.startTime2,
            originalEndTime2Field: legacyFilm.endTime2
          });
        }
      } catch (error) {
        console.error(`❌ Error processing legacy second screening for "${film.title}":`, error);
      }
    }

    // Handle films without modern screenings (legacy films with only screeningDate1)
    if (!film.screenings || film.screenings.length === 0) {
      // For films without specific screening data, check legacy fields
      const legacyFilm = film as any;
      
      // 🚨 CRITICAL FIX: Use dedicated time fields instead of extracting from screening dates
      // Handle screeningDate1 and screeningDate2 fields with their corresponding time fields
      const screeningDates = [];
      
      if (legacyFilm.screeningDate1) {
        screeningDates.push({ 
          dateField: legacyFilm.screeningDate1, 
          index: 0,
          screeningNumber: 1,
          startTimeField: legacyFilm.startTime1,
          endTimeField: legacyFilm.endTime1
        });
      }
      
      if (legacyFilm.screeningDate2) {
        screeningDates.push({ 
          dateField: legacyFilm.screeningDate2, 
          index: 1,
          screeningNumber: 2,
          startTimeField: legacyFilm.startTime2,
          endTimeField: legacyFilm.endTime2
        });
      }

      screeningDates.forEach(({ dateField, index, screeningNumber, startTimeField, endTimeField }) => {
        try {
          console.log(`🔍 RAW DATA for film "${film.title}" screening ${screeningNumber}:`, {
            dateField,
            dateFieldType: typeof dateField,
            dateFieldValue: dateField,
            startTimeField,
            endTimeField,
            hasStartTime: !!startTimeField,
            hasEndTime: !!endTimeField
          });

          // Extract date from screeningDate field
          const screeningDateTime = new Date(dateField);

          // Check if the date is valid
          if (isNaN(screeningDateTime.getTime())) {
            console.error(`❌ Invalid date for film "${film.title}" screening ${screeningNumber}:`, dateField);
            return; // Skip this screening if date is invalid
          }

          const screeningDate = screeningDateTime.toISOString().split('T')[0];
          
          // 🚨 CRITICAL FIX: Proper time field priority logic
          let startTime: string;
          let endTime: string;
          
          console.log(`🔍 TIME FIELD PRIORITY PROCESSING for "${film.title}" screening ${screeningNumber}:`);
          console.log('📋 Available time fields:', {
            startTimeField,
            endTimeField,
            startTimeFieldType: typeof startTimeField,
            endTimeFieldType: typeof endTimeField,
            timeEstimate: legacyFilm.timeEstimate
          });
          
          // Helper function to validate if a string is a valid time format (H:MM or HH:MM)
          const isValidTimeFormat = (timeStr: string): boolean => {
            if (!timeStr || typeof timeStr !== 'string') return false;
            // Updated regex to accept both H:MM and HH:MM formats
            const timeRegex = /^(\d{1,2}):(\d{2})$/;
            const thaiTimeWords = ['เช้า', 'บ่าย', 'ค่ำ', 'กลางคืน'];
            return timeRegex.test(timeStr.trim()) && !thaiTimeWords.some(word => timeStr.includes(word));
          };
          
          // 🚨 CRITICAL FIX: Always prioritize dedicated time fields over date extraction
          // PRIORITY 1: Use dedicated startTime1/endTime1 fields from database
          if (startTimeField && isValidTimeFormat(startTimeField)) {
            const cleanStartTime = startTimeField.trim();
            const timeRegex = /^(\d{1,2}):(\d{2})$/;
            const timeMatch = cleanStartTime.match(timeRegex);
            
            if (timeMatch) {
              const [, hours, minutes] = timeMatch;
              startTime = `${hours.padStart(2, '0')}:${minutes}`;
              console.log(`✅ USING DEDICATED startTime${screeningNumber} FIELD:`, startTime);
              
              // Use endTime field if valid, otherwise calculate from duration
              if (endTimeField && isValidTimeFormat(endTimeField)) {
                const cleanEndTime = endTimeField.trim();
                const endTimeMatch = cleanEndTime.match(timeRegex);
                if (endTimeMatch) {
                  const [, endHours, endMinutes] = endTimeMatch;
                  endTime = `${endHours.padStart(2, '0')}:${endMinutes}`;
                  console.log(`✅ USING DEDICATED endTime${screeningNumber} FIELD:`, endTime);
                } else {
                  // Calculate from duration
                  const durationMinutes = legacyFilm.length || legacyFilm.Length || film.duration || 120;
                  endTime = calculateEndTime(startTime, durationMinutes);
                  console.log(`🔄 Calculated endTime from duration (invalid endTime field):`, endTime);
                }
              } else {
                // Calculate from duration
                const durationMinutes = legacyFilm.length || legacyFilm.Length || film.duration || 120;
                endTime = calculateEndTime(startTime, durationMinutes);
                console.log(`🔄 Calculated endTime from duration (no endTime field):`, endTime);
              }
            } else {
              console.log(`❌ ERROR: Time regex failed for startTime${screeningNumber}:`, cleanStartTime);
              // PRIORITY 2: Fallback to extracting time from screeningDate
              console.log(`🔄 FALLBACK: Extracting time from screeningDate for screening ${screeningNumber}`);
              startTime = extractTimeFromScreeningDate(dateField);
              const durationMinutes = legacyFilm.length || legacyFilm.Length || film.duration || 120;
              endTime = calculateEndTime(startTime, durationMinutes);
              console.log(`⚠️ FALLBACK TIME EXTRACTION:`, { startTime, endTime });
            }
          } else {
            console.log(`⚠️ No valid startTime${screeningNumber} field (value: "${startTimeField}"), falling back to screeningDate extraction`);
            // PRIORITY 2: Fallback to extracting time from screeningDate if dedicated fields are invalid
            startTime = extractTimeFromScreeningDate(dateField);
            const durationMinutes = legacyFilm.length || legacyFilm.Length || film.duration || 120;
            endTime = calculateEndTime(startTime, durationMinutes);
            console.log(`⚠️ FALLBACK TIME EXTRACTION:`, { startTime, endTime, source: 'screeningDate' });
          }
          
          // 🚨 CRITICAL FIX: Completely ignore timeEstimate field - it should never be used
          if (legacyFilm.timeEstimate) {
            console.log(`🚫 COMPLETELY IGNORING timeEstimate field (value: "${legacyFilm.timeEstimate}") - this field should never affect time calculation`);
          }
          
          // Debug logging for film data processing
          const [debugHours, debugMinutes] = startTime.split(':').map(Number);
          console.log(`🎬 Processing film "${film.title}" screening ${screeningNumber}:`, {
            originalDateField: dateField,
            screeningDateTime: screeningDateTime.toISOString(),
            extractedDate: screeningDate,
            extractedHours: debugHours,
            extractedMinutes: debugMinutes,
            finalStartTime: startTime,
            finalEndTime: endTime,
            venue: legacyFilm.theatre,
            isValidDate: !isNaN(screeningDateTime.getTime()),
            usedDedicatedTimeFields: !!(startTimeField && startTimeField.match(/^\d{2}:\d{2}$/))
          });
          
          // Map venue from theatre field
          const venue = mapVenueName(legacyFilm.theatre || 'Major Theatre 7');

          scheduleItems.push({
            id: `${film.id}-screening-${index}`,
            title: film.title,
            type: 'film',
            category: 'screening',
            startTime,
            endTime,
            date: screeningDate,
            venue,
            duration: legacyFilm.length || legacyFilm.Length || film.duration || 120,
            description: film.synopsis,
            publicationStatus: film.publicationStatus || (film.status === 'published' ? 'public' : 'draft'),
            image: film.files?.poster?.url || film.posterUrl || legacyFilm.posterUrl,
            director: film.director,
            cast: film.cast?.map(member => member.name),
            genres: film.genres,
            rating: film.rating,
            tags: film.tags,
            status: film.status,
            featured: film.featured
          });

          console.log(`🎬 Created schedule item for film "${film.title}" screening ${screeningNumber}`);
          console.log(`✅ FINAL RESULT:`, {
            title: film.title,
            startTime,
            endTime,
            venue,
            date: screeningDate,
            duration: legacyFilm.length || legacyFilm.Length || film.duration || 120,
            usedDedicatedStartTime: isValidTimeFormat(startTimeField),
            usedDedicatedEndTime: isValidTimeFormat(endTimeField),
            timeFieldSource: isValidTimeFormat(startTimeField) ? 'dedicated' : 'screeningDate',
            originalStartTimeField: startTimeField,
            originalEndTimeField: endTimeField,
            ignoredTimeEstimate: legacyFilm.timeEstimate
          });

          // 🚨 CRITICAL DEBUG: Check if startTime is being overwritten somewhere
          console.log(`🔍 CRITICAL CHECK - Final startTime before schedule item creation:`, {
            startTime,
            startTimeType: typeof startTime,
            startTimeLength: startTime?.length,
            isValidFormat: /^(\d{1,2}):(\d{2})$/.test(startTime),
            parsedHour: startTime.split(':')[0],
            parsedMinute: startTime.split(':')[1]
          });

        } catch (error) {
          console.warn(`Error parsing screening ${screeningNumber} for film:`, film.id, 'dateField:', dateField, error);
        }
      });

      // Skip films without screening date information (ignore timeEstimate as requested)
      if (screeningDates.length === 0) {
        console.log(`❌ Skipping film "${film.title}" - no valid screening date information (ignoring timeEstimate as requested)`, {
          hasScreeningDate1: !!legacyFilm.screeningDate1,
          hasScreeningDate2: !!legacyFilm.screeningDate2,
          screeningDate1Value: legacyFilm.screeningDate1,
          screeningDate2Value: legacyFilm.screeningDate2,
          allFilmProperties: Object.keys(legacyFilm)
        });
      }
    }

    return scheduleItems;
  }, [selectedDate, extractTimeFromScreeningDate, calculateEndTime, mapVenueName]);

  // Fetch schedule data for the selected date
  const fetchScheduleData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const targetDate = selectedDate.toISOString().split('T')[0];
      console.log('🗓️ Fetching schedule data for date:', targetDate);

      // Use mock data if enabled
      if (useMockData) {
        console.log('🎭 Using mock schedule data');
        const mockItems = getMockScheduleData(selectedDate);
        setScheduleItems(mockItems);
        setLastUpdated(new Date());
        setIsLoading(false);
        return;
      }

      // Fetch activities for the selected date
      const activitiesResponse = await activitiesService.getActivities(
        {
          dateRange: {
            start: targetDate,
            end: targetDate
          },
          status: 'published',
          isPublic: true
        },
        { field: 'eventDate', direction: 'asc' },
        1,
        100 // Get up to 100 activities per day
      );

      console.log('📅 Activities fetched:', activitiesResponse.activities.length);

      // Fetch films with screenings for the selected date
      const filmsResponse = await getEnhancedFeatureFilms({
        status: 'published',
        publicationStatus: 'public'
      });

      console.log('🎬 Films fetched:', filmsResponse.data?.length || 0);

      // Convert activities to schedule items
      const activityItems = activitiesResponse.activities
        .filter(activity => activity.eventDate === targetDate)
        .map(convertActivityToScheduleItem);

      // Convert films to schedule items (filter by date)
      const filmItems: ScheduleItem[] = [];
      if (filmsResponse.success && filmsResponse.data) {
        filmsResponse.data.forEach((film: FeatureFilm) => {
          const filmScheduleItems = convertFeatureFilmsToScheduleItems(film);
          console.log(`🎬 Film "${film.title}" generated ${filmScheduleItems.length} schedule items:`, 
            filmScheduleItems.map(item => ({ date: item.date, startTime: item.startTime, venue: item.venue }))
          );
          
          const matchingItems = filmScheduleItems.filter((item: ScheduleItem) => item.date === targetDate);
          console.log(`📅 Film "${film.title}" items matching date ${targetDate}: ${matchingItems.length}`);
          
          matchingItems.forEach((item: ScheduleItem) => {
            filmItems.push(item);
            console.log(`✅ Added film item: "${item.title}" at ${item.startTime} on ${item.date}`);
          });
        });
      }

      // Debug film items before combining
      console.log('🎬 Final film items before combining:', filmItems.map(item => ({
        title: item.title,
        startTime: item.startTime,
        endTime: item.endTime,
        date: item.date,
        venue: item.venue,
        type: item.type
      })));

      // Combine and sort by start time
      const allItems = [...activityItems, ...filmItems].sort((a, b) => {
        // First sort by start time
        const timeComparison = a.startTime.localeCompare(b.startTime);
        if (timeComparison !== 0) return timeComparison;
        
        // Then by venue
        const venueComparison = a.venue.localeCompare(b.venue);
        if (venueComparison !== 0) return venueComparison;
        
        // Finally by title
        return a.title.localeCompare(b.title);
      });

      console.log('📊 Total schedule items:', allItems.length, {
        activities: activityItems.length,
        films: filmItems.length
      });

      // Debug final combined items
      console.log('📋 Final combined schedule items:', allItems.map(item => ({
        title: item.title,
        type: item.type,
        startTime: item.startTime,
        endTime: item.endTime,
        date: item.date,
        venue: item.venue
      })));

      // CRITICAL DEBUG: Check for any items with Thai time estimates
      const thaiTimeItems = allItems.filter(item => 
        item.startTime.includes('บ่าย') || 
        item.startTime.includes('เช้า') || 
        item.startTime.includes('ค่ำ') || 
        item.startTime.includes('กลางคืน')
      );
      
      if (thaiTimeItems.length > 0) {
        console.error('🚨 FOUND ITEMS WITH THAI TIME ESTIMATES:', thaiTimeItems.map(item => ({
          id: item.id,
          title: item.title,
          startTime: item.startTime,
          type: item.type,
          venue: item.venue
        })));
        console.error('🚨 This should not happen! These items bypassed our conversion logic.');
      }

      setScheduleItems(allItems);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('❌ Error fetching schedule data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch schedule data');
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate, useMockData, convertActivityToScheduleItem, convertFeatureFilmsToScheduleItems]);

  // Refresh data function
  const refreshData = useCallback(async () => {
    await fetchScheduleData();
  }, [fetchScheduleData]);

  // Set up real-time listeners for activities
  useEffect(() => {
    let unsubscribeActivities: Unsubscribe | null = null;

    const setupRealtimeListeners = () => {
      // Skip real-time listeners when using mock data
      if (useMockData) {
        return;
      }

      const targetDate = selectedDate.toISOString().split('T')[0];
      
      // Listen to activities changes
      const activitiesQuery = query(
        collection(db, 'activities'),
        where('eventDate', '==', targetDate),
        where('status', '==', 'published'),
        where('isPublic', '==', true)
      );

      unsubscribeActivities = onSnapshot(
        activitiesQuery,
        (snapshot) => {
          console.log('🔄 Real-time activities update received');
          // Trigger a full refresh when activities change
          fetchScheduleData();
        },
        (error) => {
          console.error('❌ Activities real-time listener error:', error);
        }
      );
    };

    // Initial fetch
    fetchScheduleData();

    // Set up real-time listeners
    setupRealtimeListeners();

    // Cleanup function
    return () => {
      if (unsubscribeActivities) {
        unsubscribeActivities();
      }
    };
  }, [selectedDate, useMockData, fetchScheduleData]);

  return {
    scheduleItems,
    isLoading,
    error,
    lastUpdated,
    refreshData
  };
};

export default useScheduleData;
