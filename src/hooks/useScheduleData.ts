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
      if (legacyFilm.screeningDate1) {
        try {
          const screeningDate = new Date(legacyFilm.screeningDate1).toISOString().split('T')[0];
          const startTime = legacyFilm.timeEstimate ? mapTimeEstimate(legacyFilm.timeEstimate) : '19:00';
          const endTime = calculateEndTime(startTime, film.duration);
          const venue = mapVenueName(legacyFilm.theatre || 'Major Theatre 4');

          scheduleItems.push({
            id: `${film.id}-screening-0`,
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
        } catch (error) {
          console.warn('Error parsing legacy screening date for film:', film.id, error);
        }
      }
    }

    return scheduleItems;
  }, []);

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
    const venueMap: Record<string, string> = {
      'Stage Zone': 'stage-zone',
      'EXPO Zone': 'expo-zone',
      'Major Theatre 4': 'major-theatre-4',
      'Major Chiang Mai': 'major-theatre-4',
      'Major IMAX': 'major-imax',
      'IMAX Major Chiang Mai': 'major-imax',
      'IMAX': 'major-imax',
      'Market': 'market',
      'Asiatrip': 'asiatrip',
      'Railway Park': 'stage-zone', // Map to closest venue
      'SF Maya': 'expo-zone' // Map to closest venue
    };

    return venueMap[venueName] || 'stage-zone'; // Default to stage-zone
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

  // Fetch schedule data for the selected date
  const fetchScheduleData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const targetDate = selectedDate.toISOString().split('T')[0];
      console.log('🗓️ Fetching schedule data for date:', targetDate);

      // Use mock data if enabled
      if (useMockData || process.env.REACT_APP_USE_MOCK_SCHEDULE === 'true') {
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
      if (useMockData || process.env.REACT_APP_USE_MOCK_SCHEDULE === 'true') {
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
