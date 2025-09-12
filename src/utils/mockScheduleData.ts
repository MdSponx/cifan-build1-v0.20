import { ScheduleItem } from '../types/schedule.types';

/**
 * Mock schedule data for testing activities and film cards
 * Features various durations like 11:25 - 13:35, 16:00 - 17:15
 * Cards will span across hours with image backgrounds and title-only display
 */

// Sample background images for testing
const SAMPLE_IMAGES = [
  'https://images.unsplash.com/photo-1489599735734-79b4169c4388?w=800&h=600&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=800&h=600&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800&h=600&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=800&h=600&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=800&h=600&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1574267432553-4b4628081c31?w=800&h=600&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&h=600&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=800&h=600&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop&crop=center'
];

// Helper function to calculate duration in minutes
const calculateDuration = (startTime: string, endTime: string): number => {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMin;
  let endMinutes = endHour * 60 + endMin;
  
  // Handle overnight events (end time next day)
  if (endMinutes < startMinutes) {
    endMinutes += 24 * 60;
  }
  
  return endMinutes - startMinutes;
};

// Generate mock data for a specific date
export const generateMockScheduleData = (date: Date): ScheduleItem[] => {
  const dateString = date.toISOString().split('T')[0];
  
  const mockItems: ScheduleItem[] = [
    // Film screening with specified duration 11:25 - 13:35 (2h 10min)
    {
      id: 'film-1',
      title: 'The Art of Cinema',
      type: 'film',
      category: 'screening',
      startTime: '11:25',
      endTime: '13:35',
      date: dateString,
      venue: 'stageZone',
      duration: calculateDuration('11:25', '13:35'),
      description: 'A masterpiece exploring the boundaries of visual storytelling',
      image: SAMPLE_IMAGES[0],
      director: 'Sofia Martinez',
      cast: ['Emma Stone', 'Ryan Gosling', 'John Cho'],
      genres: ['Drama', 'Art'],
      rating: 'PG-13',
      status: 'published',
      isPublic: true,
      featured: true
    },
    
    // Activity with specified duration 16:00 - 17:15 (1h 15min)
    {
      id: 'activity-1',
      title: 'Filmmaking Workshop: From Script to Screen',
      type: 'activity',
      category: 'workshop',
      startTime: '16:00',
      endTime: '17:15',
      date: dateString,
      venue: 'expoZone',
      duration: calculateDuration('16:00', '17:15'),
      description: 'Learn the fundamentals of independent filmmaking',
      image: SAMPLE_IMAGES[1],
      maxParticipants: 30,
      registrationRequired: true,
      speakers: [
        { name: 'David Chen', role: 'Director', bio: 'Award-winning independent filmmaker' },
        { name: 'Lisa Park', role: 'Producer', bio: 'Documentary specialist' }
      ],
      tags: ['workshop', 'education'],
      status: 'published',
      isPublic: true
    },

    // Long film screening spanning multiple hours 10:30 - 13:45 (3h 15min)
    {
      id: 'film-2',
      title: 'Epic Journey: The Director\'s Cut',
      type: 'film',
      category: 'screening',
      startTime: '10:30',
      endTime: '13:45',
      date: dateString,
      venue: 'majorTheatre4',
      duration: calculateDuration('10:30', '13:45'),
      description: 'An extended version of the acclaimed epic adventure',
      image: SAMPLE_IMAGES[2],
      director: 'Christopher Nolan',
      cast: ['Leonardo DiCaprio', 'Marion Cotillard', 'Tom Hardy'],
      genres: ['Action', 'Adventure', 'Sci-Fi'],
      rating: 'PG-13',
      status: 'published',
      isPublic: true,
      featured: true
    },

    // Panel discussion 14:20 - 16:10 (1h 50min)
    {
      id: 'activity-2',
      title: 'The Future of Asian Cinema',
      type: 'activity',
      category: 'panel',
      startTime: '14:20',
      endTime: '16:10',
      date: dateString,
      venue: 'majorImax',
      duration: calculateDuration('14:20', '16:10'),
      description: 'Industry leaders discuss emerging trends and opportunities',
      image: SAMPLE_IMAGES[3],
      maxParticipants: 200,
      registrationRequired: false,
      speakers: [
        { name: 'Akira Kurosawa Jr.', role: 'Director', bio: 'Third-generation filmmaker' },
        { name: 'Wong Kar-wai', role: 'Director', bio: 'Hong Kong cinema legend' },
        { name: 'Bong Joon-ho', role: 'Director', bio: 'Oscar-winning filmmaker' }
      ],
      tags: ['panel', 'industry'],
      status: 'published',
      isPublic: true
    },

    // Short film screening 17:45 - 18:30 (45min)
    {
      id: 'film-3',
      title: 'Midnight in Bangkok',
      type: 'film',
      category: 'screening',
      startTime: '17:45',
      endTime: '18:30',
      date: dateString,
      venue: 'market',
      duration: calculateDuration('17:45', '18:30'),
      description: 'A collection of short films exploring urban life',
      image: SAMPLE_IMAGES[4],
      director: 'Various Directors',
      genres: ['Short Film', 'Drama'],
      rating: 'R',
      status: 'published',
      isPublic: true
    },

    // Networking event 19:00 - 21:30 (2h 30min)
    {
      id: 'activity-3',
      title: 'Industry Mixer & Awards Ceremony',
      type: 'activity',
      category: 'networking',
      startTime: '19:00',
      endTime: '21:30',
      date: dateString,
      venue: 'anusarn',
      duration: calculateDuration('19:00', '21:30'),
      description: 'Connect with industry professionals and celebrate excellence',
      image: SAMPLE_IMAGES[5],
      maxParticipants: 150,
      registrationRequired: true,
      organizers: ['CIFAN Festival', 'Thai Film Association'],
      tags: ['networking', 'awards'],
      status: 'published',
      isPublic: true,
      featured: true
    },

    // Late night screening 22:00 - 23:45 (1h 45min)
    {
      id: 'film-4',
      title: 'Neon Dreams',
      type: 'film',
      category: 'screening',
      startTime: '22:00',
      endTime: '23:45',
      date: dateString,
      venue: 'stageZone',
      duration: calculateDuration('22:00', '23:45'),
      description: 'A cyberpunk thriller set in near-future Tokyo',
      image: SAMPLE_IMAGES[6],
      director: 'Ridley Scott',
      cast: ['Ryan Reynolds', 'Scarlett Johansson'],
      genres: ['Thriller', 'Sci-Fi'],
      rating: 'R',
      status: 'published',
      isPublic: true
    },

    // Morning masterclass 09:15 - 11:00 (1h 45min)
    {
      id: 'activity-4',
      title: 'Cinematography Masterclass',
      type: 'activity',
      category: 'workshop',
      startTime: '09:15',
      endTime: '11:00',
      date: dateString,
      venue: 'expoZone',
      duration: calculateDuration('09:15', '11:00'),
      description: 'Advanced techniques in visual storytelling',
      image: SAMPLE_IMAGES[7],
      maxParticipants: 25,
      registrationRequired: true,
      speakers: [
        { name: 'Roger Deakins', role: 'Cinematographer', bio: 'Academy Award winner' }
      ],
      tags: ['masterclass', 'technical'],
      status: 'published',
      isPublic: true,
      featured: true
    },

    // Documentary screening 12:10 - 14:25 (2h 15min)
    {
      id: 'film-5',
      title: 'Voices of the Mountain',
      type: 'film',
      category: 'screening',
      startTime: '12:10',
      endTime: '14:25',
      date: dateString,
      venue: 'majorImax',
      duration: calculateDuration('12:10', '14:25'),
      description: 'A documentary exploring traditional cultures in Northern Thailand',
      image: SAMPLE_IMAGES[8],
      director: 'Apichatpong Weerasethakul',
      genres: ['Documentary'],
      rating: 'PG',
      status: 'published',
      isPublic: true
    },

    // Special ceremony 18:45 - 20:15 (1h 30min)
    {
      id: 'activity-5',
      title: 'Opening Ceremony Gala',
      type: 'activity',
      category: 'ceremony',
      startTime: '18:45',
      endTime: '20:15',
      date: dateString,
      venue: 'anusarn',
      duration: calculateDuration('18:45', '20:15'),
      description: 'Grand opening celebration with special performances',
      image: SAMPLE_IMAGES[9],
      maxParticipants: 500,
      registrationRequired: false,
      organizers: ['CIFAN Festival'],
      tags: ['ceremony', 'special'],
      status: 'published',
      isPublic: true,
      featured: true
    }
  ];

  return mockItems;
};

// Export function to get mock data for testing
export const getMockScheduleData = (selectedDate: Date): ScheduleItem[] => {
  return generateMockScheduleData(selectedDate);
};

export default {
  generateMockScheduleData,
  getMockScheduleData
};
