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
import { getFilmCoverImage, FilmImageData } from '../utils/filmImageHelpers';

// Enhanced interface for better type safety
interface EnhancedFeatureFilm extends FeatureFilm {
  // Legacy fields for backward compatibility
  screeningDate1?: any;
  screeningDate2?: any;
  startTime1?: string;
  endTime1?: string;
  startTime2?: string;
  endTime2?: string;
  theatre?: string;
  venue?: string;
  length?: number;
  Length?: number;
  timeEstimate?: string;
}

// Helper interface for screening data
interface ScreeningData {
  filmId: string;
  filmTitle: string;
  screeningNumber: 1 | 2;
  screeningDate: Date;
  startTime: string;
  endTime: string;
  venue: string;
  filmData: any;
  // Image-related fields for cover image mapping
  galleryUrls?: string[];
  galleryCoverIndex?: number;
  galleryLogoIndex?: number;
  posterUrl?: string;
}

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

  // Helper: Get screening time with fallback - FIXED PRIORITY LOGIC
  const getScreeningTime = useCallback((dedicatedTimeField: string | undefined, screeningDate: Date, fieldName: string): string => {
    // Priority 1: Use dedicated time field (startTime1/startTime2) - HIGHEST PRIORITY
    if (dedicatedTimeField && typeof dedicatedTimeField === 'string' && dedicatedTimeField.trim()) {
      const timeStr = dedicatedTimeField.trim();
      if (/^(\d{1,2}):(\d{2})$/.test(timeStr)) {
        const formattedTime = timeStr.padStart(5, '0'); // Ensure HH:MM format
        console.log(`✅ Using dedicated ${fieldName}: ${formattedTime}`);
        return formattedTime;
      } else {
        console.log(`⚠️ Invalid ${fieldName} format: "${timeStr}" - falling back to screening date`);
      }
    } else {
      console.log(`⚠️ No valid dedicated ${fieldName} found - falling back to screening date`);
    }
    
    // Priority 2: Extract from screening date - ONLY IF NO DEDICATED TIME FIELD
    const extractedTime = `${screeningDate.getHours().toString().padStart(2, '0')}:${screeningDate.getMinutes().toString().padStart(2, '0')}`;
    console.log(`🔄 Extracted time from screening date: ${extractedTime}`);
    return extractedTime;
  }, []);

  // Helper: Get end time with fallback - FIXED PRIORITY LOGIC
  const getScreeningEndTime = useCallback((dedicatedEndTimeField: string | undefined, startTime: string, duration: number | undefined, fieldName: string): string => {
    // Priority 1: Use dedicated end time field (endTime1/endTime2) - HIGHEST PRIORITY
    if (dedicatedEndTimeField && typeof dedicatedEndTimeField === 'string' && dedicatedEndTimeField.trim()) {
      const timeStr = dedicatedEndTimeField.trim();
      if (/^(\d{1,2}):(\d{2})$/.test(timeStr)) {
        const formattedTime = timeStr.padStart(5, '0'); // Ensure HH:MM format
        console.log(`✅ Using dedicated ${fieldName}: ${formattedTime}`);
        return formattedTime;
      } else {
        console.log(`⚠️ Invalid ${fieldName} format: "${timeStr}" - calculating from duration`);
      }
    } else {
      console.log(`⚠️ No valid dedicated ${fieldName} found - calculating from duration`);
    }
    
    // Priority 2: Calculate from start time + duration
    const durationMinutes = duration || 120;
    const endTime = calculateEndTime(startTime, durationMinutes);
    console.log(`🔄 Calculated end time from duration: ${endTime}`);
    return endTime;
  }, [calculateEndTime]);

  // Helper: Extract all screenings from a film for selected date
  const extractAllScreeningsFromFilm = useCallback((film: EnhancedFeatureFilm, selectedDate: Date): ScreeningData[] => {
    const screenings: ScreeningData[] = [];
    const legacyFilm = film as any;
    const selectedDateStr = selectedDate.toDateString();
    
    // 🚨 ENHANCED DEBUGGING FOR MARCHING BOYS FILM
    const isMarchingBoys = film.title.toLowerCase().includes('marching');
    
    console.log(`🎬 Extracting screenings for "${film.title}" on ${selectedDateStr}`);
    console.log(`🔍 Film data structure:`, {
      hasScreeningDate1: !!legacyFilm.screeningDate1,
      hasScreeningDate2: !!legacyFilm.screeningDate2,
      hasStartTime1: !!legacyFilm.startTime1,
      hasStartTime2: !!legacyFilm.startTime2,
      hasVenue: !!legacyFilm.venue,
      hasTheatre: !!legacyFilm.theatre
    });

    // 🚨 CRITICAL DEBUG: Enhanced logging for Marching Boys
    if (isMarchingBoys) {
      console.log(`🚨 MARCHING BOYS DETAILED DEBUG:`, {
        filmTitle: film.title,
        filmId: film.id,
        selectedDate: selectedDateStr,
        rawFilmData: {
          screeningDate1: legacyFilm.screeningDate1,
          screeningDate2: legacyFilm.screeningDate2,
          startTime1: legacyFilm.startTime1,
          endTime1: legacyFilm.endTime1,
          startTime2: legacyFilm.startTime2,
          endTime2: legacyFilm.endTime2,
          venue: legacyFilm.venue,
          theatre: legacyFilm.theatre,
          duration: film.duration,
          timeEstimate: legacyFilm.timeEstimate // Should be IGNORED
        }
      });
      
      console.log(`🚨 MARCHING BOYS TIME FIELD ANALYSIS:`);
      console.log(`   - startTime1: "${legacyFilm.startTime1}" (type: ${typeof legacyFilm.startTime1})`);
      console.log(`   - endTime1: "${legacyFilm.endTime1}" (type: ${typeof legacyFilm.endTime1})`);
      console.log(`   - startTime2: "${legacyFilm.startTime2}" (type: ${typeof legacyFilm.startTime2})`);
      console.log(`   - endTime2: "${legacyFilm.endTime2}" (type: ${typeof legacyFilm.endTime2})`);
      console.log(`   - timeEstimate: "${legacyFilm.timeEstimate}" (SHOULD BE IGNORED)`);
      console.log(`   - duration: ${film.duration} minutes`);
    }

    // Check screening 1
    if (legacyFilm.screeningDate1) {
      try {
        const date1 = new Date(legacyFilm.screeningDate1.toDate ? legacyFilm.screeningDate1.toDate() : legacyFilm.screeningDate1);
        
        if (date1.toDateString() === selectedDateStr) {
          console.log(`✅ Screening 1 matches selected date`);
          
          const startTime = getScreeningTime(legacyFilm.startTime1, date1, 'startTime1');
          const endTime = getScreeningEndTime(legacyFilm.endTime1, startTime, film.duration, 'endTime1');
          const venue = mapVenueName(legacyFilm.venue || legacyFilm.theatre || 'stageZone');
          
          screenings.push({
            filmId: film.id,
            filmTitle: film.title,
            screeningNumber: 1,
            screeningDate: date1,
            startTime,
            endTime,
            venue,
            filmData: film,
            // Pass image data for cover image mapping
            galleryUrls: legacyFilm.galleryUrls,
            galleryCoverIndex: legacyFilm.galleryCoverIndex,
            galleryLogoIndex: legacyFilm.galleryLogoIndex,
            posterUrl: legacyFilm.posterUrl
          });
          
          console.log(`✅ Added Screening 1: ${startTime}-${endTime} at ${venue}`);
          
          // 🚨 ENHANCED DEBUG: Additional logging for Marching Boys
          if (isMarchingBoys) {
            console.log(`🚨 MARCHING BOYS SCREENING 1 FINAL RESULT:`, {
              originalStartTime1: legacyFilm.startTime1,
              originalEndTime1: legacyFilm.endTime1,
              finalStartTime: startTime,
              finalEndTime: endTime,
              venue: venue,
              timeSource: legacyFilm.startTime1 ? 'dedicated startTime1 field' : 'extracted from screeningDate1'
            });
          }
        } else {
          console.log(`⏭️ Screening 1 date mismatch: ${date1.toDateString()} !== ${selectedDateStr}`);
        }
      } catch (error) {
        console.error(`❌ Error processing screening 1:`, error);
      }
    }

    // Check screening 2
    if (legacyFilm.screeningDate2) {
      try {
        const date2 = new Date(legacyFilm.screeningDate2.toDate ? legacyFilm.screeningDate2.toDate() : legacyFilm.screeningDate2);
        
        if (date2.toDateString() === selectedDateStr) {
          console.log(`✅ Screening 2 matches selected date`);
          
          const startTime = getScreeningTime(legacyFilm.startTime2, date2, 'startTime2');
          const endTime = getScreeningEndTime(legacyFilm.endTime2, startTime, film.duration, 'endTime2');
          const venue = mapVenueName(legacyFilm.venue || legacyFilm.theatre || 'stageZone');
          
          screenings.push({
            filmId: film.id,
            filmTitle: film.title,
            screeningNumber: 2,
            screeningDate: date2,
            startTime,
            endTime,
            venue,
            filmData: film,
            // Pass image data for cover image mapping
            galleryUrls: legacyFilm.galleryUrls,
            galleryCoverIndex: legacyFilm.galleryCoverIndex,
            galleryLogoIndex: legacyFilm.galleryLogoIndex,
            posterUrl: legacyFilm.posterUrl
          });
          
          console.log(`✅ Added Screening 2: ${startTime}-${endTime} at ${venue}`);
        } else {
          console.log(`⏭️ Screening 2 date mismatch: ${date2.toDateString()} !== ${selectedDateStr}`);
        }
      } catch (error) {
        console.error(`❌ Error processing screening 2:`, error);
      }
    }

    // 🚨 CRITICAL FIX: Add fallback logic for films without screening dates
    if (screenings.length === 0) {
      console.log(`🔄 No specific screenings found, checking if film has any screening dates for fallback`);
      
      let shouldCreateFallback = false;
      let fallbackStartTime = '19:00';
      let fallbackEndTime = '21:00';
      let fallbackDate = selectedDate;
      
      // Check if there are any date fields we can extract time from that match the selected date
      if (legacyFilm.screeningDate1) {
        try {
          const date1 = new Date(legacyFilm.screeningDate1.toDate ? legacyFilm.screeningDate1.toDate() : legacyFilm.screeningDate1);
          if (date1.toDateString() === selectedDateStr) {
            // This screening date matches but wasn't processed above - use it for fallback
            fallbackStartTime = getScreeningTime(legacyFilm.startTime1, date1, 'startTime1');
            fallbackEndTime = getScreeningEndTime(legacyFilm.endTime1, fallbackStartTime, film.duration, 'endTime1');
            fallbackDate = date1;
            shouldCreateFallback = true;
            console.log(`🔄 Using screening 1 data for fallback (date matches): ${fallbackStartTime}-${fallbackEndTime} on ${date1.toDateString()}`);
          }
        } catch (error) {
          console.error(`❌ Error extracting time from screeningDate1:`, error);
        }
      }
      
      if (!shouldCreateFallback && legacyFilm.screeningDate2) {
        try {
          const date2 = new Date(legacyFilm.screeningDate2.toDate ? legacyFilm.screeningDate2.toDate() : legacyFilm.screeningDate2);
          if (date2.toDateString() === selectedDateStr) {
            // This screening date matches but wasn't processed above - use it for fallback
            fallbackStartTime = getScreeningTime(legacyFilm.startTime2, date2, 'startTime2');
            fallbackEndTime = getScreeningEndTime(legacyFilm.endTime2, fallbackStartTime, film.duration, 'endTime2');
            fallbackDate = date2;
            shouldCreateFallback = true;
            console.log(`� Using screening 2 data for fallback (date matches): ${fallbackStartTime}-${fallbackEndTime} on ${date2.toDateString()}`);
          }
        } catch (error) {
          console.error(`❌ Error extracting time from screeningDate2:`, error);
        }
      }
      
      // Only create fallback if we don't have screening dates OR if we have screening dates but no time fields
      if (!shouldCreateFallback && (!legacyFilm.screeningDate1 && !legacyFilm.screeningDate2)) {
        // Film has no screening dates at all - create a basic fallback for the selected date
        fallbackStartTime = legacyFilm.startTime1 || legacyFilm.startTime2 || '19:00';
        fallbackEndTime = legacyFilm.endTime1 || legacyFilm.endTime2 || calculateEndTime(fallbackStartTime, film.duration || 120);
        shouldCreateFallback = true;
        console.log(`� Using basic fallback for film without screening dates: ${fallbackStartTime}-${fallbackEndTime}`);
      }
      
      if (shouldCreateFallback) {
        const fallbackVenue = mapVenueName(legacyFilm.venue || legacyFilm.theatre || 'stageZone');
        
        screenings.push({
          filmId: film.id,
          filmTitle: film.title,
          screeningNumber: 1,
          screeningDate: fallbackDate,
          startTime: fallbackStartTime,
          endTime: fallbackEndTime,
          venue: fallbackVenue,
          filmData: film,
          // Pass image data for cover image mapping
          galleryUrls: legacyFilm.galleryUrls,
          galleryCoverIndex: legacyFilm.galleryCoverIndex,
          galleryLogoIndex: legacyFilm.galleryLogoIndex,
          posterUrl: legacyFilm.posterUrl
        });
        
        console.log(`✅ Added fallback screening: ${fallbackStartTime}-${fallbackEndTime} at ${fallbackVenue} on ${fallbackDate.toDateString()}`);
      } else {
        console.log(`⏭️ Film "${film.title}" has screening dates but none match selected date - skipping`);
      }
    }

    console.log(`📊 Film "${film.title}" total screenings on selected date: ${screenings.length}`);
    return screenings;
  }, [mapVenueName, calculateEndTime, getScreeningTime, getScreeningEndTime]);

  // Helper: Create schedule item from screening data
  const createScheduleItemFromScreening = useCallback((screening: ScreeningData): ScheduleItem => {
    // Create FilmImageData object from screening data
    const filmImageData: FilmImageData = {
      galleryUrls: screening.galleryUrls,
      galleryCoverIndex: screening.galleryCoverIndex,
      galleryLogoIndex: screening.galleryLogoIndex,
      posterUrl: screening.posterUrl
    };
    
    // Use getFilmCoverImage helper for consistency with other components
    const coverImageUrl = getFilmCoverImage(filmImageData);
    
    // Debug logging for image mapping process
    console.log(`🖼️ Image mapping for "${screening.filmTitle}":`, {
      filmId: screening.filmId,
      galleryUrls: screening.galleryUrls?.length || 0,
      galleryCoverIndex: screening.galleryCoverIndex,
      posterUrl: !!screening.posterUrl,
      finalCoverImageUrl: coverImageUrl
    });
    
    return {
      id: `${screening.filmId}_screening_${screening.screeningNumber}`,
      title: screening.filmData.title,
      type: 'film',
      category: 'screening',
      startTime: screening.startTime,
      endTime: screening.endTime,
      venue: screening.venue,
      description: screening.filmData.synopsis,
      duration: screening.filmData.duration,
      date: screening.screeningDate.toISOString().split('T')[0],
      featured: screening.filmData.featured,
      director: screening.filmData.director,
      country: screening.filmData.country, // Add country for flag emoji
      cast: screening.filmData.cast,
      genres: screening.filmData.genre ? [screening.filmData.genre] : undefined,
      rating: screening.filmData.rating,
      image: coverImageUrl || undefined // Map cover image using helper
    };
  }, []);

  // COMPLETELY REPLACED: Clean processFilmData function
  const processFilmData = useCallback((films: EnhancedFeatureFilm[]): ScheduleItem[] => {
    const scheduleItems: ScheduleItem[] = [];
    
    console.log(`🎯 PROCESSING ${films.length} FILMS FOR MULTIPLE SCREENINGS`);
    console.log(`📅 Selected Date: ${selectedDate.toDateString()}`);

    for (const film of films) {
      console.log(`\n🎬 Processing film: "${film.title}"`);
      
      try {
        // Extract ALL screenings for this film on selected date
        const screenings = extractAllScreeningsFromFilm(film, selectedDate);
        
        if (screenings.length === 0) {
          console.log(`⏭️ No screenings found for "${film.title}" on selected date`);
          continue;
        }
        
        // Create schedule item for each screening
        for (const screening of screenings) {
          const scheduleItem = createScheduleItemFromScreening(screening);
          scheduleItems.push(scheduleItem);
          
          console.log(`✅ Created schedule item:`, {
            id: scheduleItem.id,
            title: scheduleItem.title,
            screening: screening.screeningNumber,
            time: `${scheduleItem.startTime}-${scheduleItem.endTime}`,
            venue: scheduleItem.venue
          });
        }
        
        console.log(`📋 Film "${film.title}" contributed ${screenings.length} schedule item(s)`);
        
      } catch (error) {
        console.error(`❌ Error processing film "${film.title}":`, error);
      }
    }

    console.log(`\n📊 FINAL RESULT: Created ${scheduleItems.length} schedule items from ${films.length} films`);
    
    // Debug: Show breakdown
    const screeningBreakdown = scheduleItems.reduce((acc, item) => {
      // Extract screening number from item ID for film items
      const screeningNum = item.type === 'film' && item.id.includes('_screening_') 
        ? parseInt(item.id.split('_screening_')[1]) || 1
        : 1;
      acc[`screening_${screeningNum}`] = (acc[`screening_${screeningNum}`] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log(`📈 Screening breakdown:`, screeningBreakdown);
    
    return scheduleItems;
  }, [selectedDate, extractAllScreeningsFromFilm, createScheduleItemFromScreening]);

  // Alias for backward compatibility
  const convertFeatureFilmsToScheduleItems = processFilmData;

  // Fetch schedule data for the selected date
  const fetchScheduleData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const targetDate = selectedDate.toISOString().split('T')[0];
      console.log('�️ Fetching schedule data for date:', targetDate);

      // Use mock data if enabled
      if (useMockData) {
        console.log('� Using mock schedule data');
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
        console.log(`🚨 PROCESSING ALL FILMS FOR ${targetDate}:`, filmsResponse.data.map((f: FeatureFilm) => f.title));
        
        filmsResponse.data.forEach((film: FeatureFilm) => {
          // 🚨 CRITICAL DEBUG: Log every film being processed
          console.log(` PROCESSING FILM: "${film.title}" (ID: ${film.id})`);
          
          const filmScheduleItems = processFilmData([film as EnhancedFeatureFilm]);
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
      console.log('� Final combined schedule items:', allItems.map(item => ({
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
