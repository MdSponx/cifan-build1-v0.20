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

  // Helper function to map time estimates to actual times
  const mapTimeEstimate = useCallback((timeEstimate: string): string => {
    const timeMap: Record<string, string> = {
      'เช้า': '10:00',
      'บ่าย': '14:00',
      'ค่ำ': '19:00',
      'กลางคืน': '22:00'
    };

    return timeMap[timeEstimate] || '19:00'; // Default to evening
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

  // Convert FeatureFilm to ScheduleItem
  const convertFilmToScheduleItem = useCallback((film: FeatureFilm): ScheduleItem[] => {
    const scheduleItems: ScheduleItem[] = [];

    // Debug: Log every film being processed
    console.log(`🎬 PROCESSING FILM: "${film.title}"`, {
      id: film.id,
      hasScreenings: !!(film.screenings && film.screenings.length > 0),
      screeningsCount: film.screenings?.length || 0,
      legacyScreeningDate1: (film as any).screeningDate1,
      legacyScreeningDate2: (film as any).screeningDate2,
      legacyTimeEstimate: (film as any).timeEstimate,
      legacyTheatre: (film as any).theatre,
      allFilmKeys: Object.keys(film)
    });

    // If film has screening information, create schedule items
    if (film.screenings && film.screenings.length > 0) {
      film.screenings.forEach((screening, index) => {
        const screeningDate = screening.date.toISOString().split('T')[0];
        
        // Extract time from screening time or use default
        const startTime = screening.time || '19:00';
        const endTime = calculateEndTime(startTime, film.duration);
        
        // Map venue name to standardized venue
        const venue = mapVenueName(screening.venue);

        scheduleItems.push({
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
        });
      });
    } else {
      // For films without specific screening data, check if they have legacy screening dates
      const legacyFilm = film as any;
      
      // Handle screeningDate1 and screeningDate2 fields
      const screeningDates = [];
      if (legacyFilm.screeningDate1) {
        screeningDates.push({ dateField: legacyFilm.screeningDate1, index: 0 });
      }
      if (legacyFilm.screeningDate2) {
        screeningDates.push({ dateField: legacyFilm.screeningDate2, index: 1 });
      }

      screeningDates.forEach(({ dateField, index }) => {
        try {
          console.log(`🔍 RAW DATA for film "${film.title}" screening ${index + 1}:`, {
            dateField,
            dateFieldType: typeof dateField,
            dateFieldValue: dateField
          });

          // Extract time from screeningDate field using the helper function
          const startTime = extractTimeFromScreeningDate(dateField);

          // Extract date from screeningDate field
          const screeningDateTime = new Date(dateField);

          // Check if the date is valid
          if (isNaN(screeningDateTime.getTime())) {
            console.error(`❌ Invalid date for film "${film.title}":`, dateField);
            return; // Skip this screening if date is invalid
          }

          const screeningDate = screeningDateTime.toISOString().split('T')[0];
          
          // Calculate duration from Length field or film.duration
          const durationMinutes = legacyFilm.length || legacyFilm.Length || film.duration || 120;
          const endTime = calculateEndTime(startTime, durationMinutes);
          
          // Debug logging for film data processing
          const [debugHours, debugMinutes] = startTime.split(':').map(Number);
          console.log(`🎬 Processing film "${film.title}" screening ${index + 1}:`, {
            originalDateField: dateField,
            screeningDateTime: screeningDateTime.toISOString(),
            extractedDate: screeningDate,
            extractedHours: debugHours,
            extractedMinutes: debugMinutes,
            extractedTime: startTime,
            durationMinutes,
            endTime,
            venue: legacyFilm.theatre,
            isValidDate: !isNaN(screeningDateTime.getTime())
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
            duration: durationMinutes,
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
        } catch (error) {
          console.warn('Error parsing legacy screening date for film:', film.id, 'dateField:', dateField, error);
        }
      });

      // Only use fallback if absolutely no screening date information exists
      // This should be rare - most films should have screeningDate1 or screeningDate2
      if (screeningDates.length === 0) {
        console.log(`⚠️ No screening dates found for film "${film.title}":`, {
          hasScreeningDate1: !!legacyFilm.screeningDate1,
          hasScreeningDate2: !!legacyFilm.screeningDate2,
          screeningDate1Value: legacyFilm.screeningDate1,
          screeningDate2Value: legacyFilm.screeningDate2,
          hasTimeEstimate: !!legacyFilm.timeEstimate,
          timeEstimate: legacyFilm.timeEstimate,
          allFilmProperties: Object.keys(legacyFilm)
        });
        
        // If we have a timeEstimate, use it instead of skipping
        if (legacyFilm.timeEstimate) {
          console.log(`🕐 Using timeEstimate for film "${film.title}":`, legacyFilm.timeEstimate);
          
          // Map the Thai time estimate to actual time
          const startTime = mapTimeEstimate(legacyFilm.timeEstimate);
          console.log(`🕐 Mapped timeEstimate "${legacyFilm.timeEstimate}" to "${startTime}"`);
          
          // Use today's date as fallback since we don't have screening date
          const today = new Date();
          const screeningDate = today.toISOString().split('T')[0];
          
          // Calculate duration and end time
          const durationMinutes = legacyFilm.length || legacyFilm.Length || film.duration || 120;
          const endTime = calculateEndTime(startTime, durationMinutes);
          
          // Map venue from theatre field
          const venue = mapVenueName(legacyFilm.theatre || 'Major Theatre 7');

          scheduleItems.push({
            id: `${film.id}-screening-estimate`,
            title: film.title,
            type: 'film',
            category: 'screening',
            startTime,
            endTime,
            date: screeningDate,
            venue,
            duration: durationMinutes,
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
          
          console.log(`✅ Created schedule item for film "${film.title}" with estimated time:`, {
            startTime,
            endTime,
            venue,
            timeEstimate: legacyFilm.timeEstimate
          });
        } else {
          // Skip films without proper screening date information or time estimates
          console.log(`❌ Skipping film "${film.title}" - no valid screening date information or time estimate`);
        }
      }
    }

    return scheduleItems;
  }, [selectedDate, extractTimeFromScreeningDate, mapTimeEstimate, calculateEndTime, mapVenueName]);

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
          const filmScheduleItems = convertFilmToScheduleItem(film);
          filmScheduleItems
            .filter(item => item.date === targetDate)
            .forEach(item => filmItems.push(item));
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
  }, [selectedDate, useMockData, convertActivityToScheduleItem, convertFilmToScheduleItem]);

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
