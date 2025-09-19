import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { AdminApplicationData } from '../types/admin.types';

export interface SubmissionProgramEntry {
  id: string;
  filmTitle: string;
  filmTitleTh?: string;
  country: string;
  filmmaker: string;
  category: string;
  duration: number; // in minutes
  screeningProgram: 'A' | 'B' | 'C' | 'D';
  posterUrl?: string;
  status: string;
  submittedAt?: Date;
}

export interface SubmissionProgramGroup {
  program: 'A' | 'B' | 'C' | 'D';
  programTitle: string;
  films: SubmissionProgramEntry[];
  count: number;
  totalRuntime: number; // in minutes
  screeningDate1: string;
  screeningTime1: string;
  screeningDate2: string;
  screeningTime2: string;
  venue: string;
}

export interface SubmissionProgramFilters {
  searchTerm?: string;
  category?: string;
  country?: string;
  program?: string;
}

/**
 * Service for managing submission program data from Firestore
 */
export class SubmissionProgramService {
  
  /**
   * Fetches all submissions with screeningProgram assigned
   */
  static async getSubmissionsWithPrograms(): Promise<SubmissionProgramEntry[]> {
    try {
      const submissionsRef = collection(db, 'submissions');
      
      // First, let's try a simpler query to see what data exists
      console.log('🔍 Fetching submissions with screeningProgram...');
      
      // Query for accepted submissions first, then filter by screeningProgram
      const q = query(
        submissionsRef,
        where('status', '==', 'accepted')
      );
      
      const querySnapshot = await getDocs(q);
      const submissions: SubmissionProgramEntry[] = [];
      
      console.log(`📊 Found ${querySnapshot.size} accepted submissions`);
      
      querySnapshot.forEach((doc) => {
        const data = doc.data() as AdminApplicationData;
        
        // Only include submissions that have a screeningProgram field
        if (data.screeningProgram && ['A', 'B', 'C', 'D'].includes(data.screeningProgram)) {
          // Extract filmmaker name based on category
          let filmmaker = '';
          if (data.competitionCategory === 'world') {
            filmmaker = data.submitterName || 'Unknown';
          } else {
            filmmaker = data.submitterName || 'Unknown';
          }
          
          // Get country from nationality or default
          const country = data.nationality || 'International';
          
          // Get poster URL from files
          const posterUrl = data.files?.posterFile?.url;
          
          submissions.push({
            id: doc.id,
            filmTitle: data.filmTitle,
            filmTitleTh: data.filmTitleTh,
            country,
            filmmaker,
            category: data.competitionCategory,
            duration: data.duration,
            screeningProgram: data.screeningProgram!,
            posterUrl,
            status: data.status,
            submittedAt: data.submittedAt instanceof Date ? data.submittedAt : (data.submittedAt as any)?.toDate?.() || undefined
          });
        }
      });
      
      console.log(`🎬 Found ${submissions.length} submissions with screeningProgram`);
      
      // Sort by screeningProgram and filmTitle
      submissions.sort((a, b) => {
        if (a.screeningProgram !== b.screeningProgram) {
          return a.screeningProgram.localeCompare(b.screeningProgram);
        }
        return a.filmTitle.localeCompare(b.filmTitle);
      });
      
      return submissions;
    } catch (error) {
      console.error('❌ Error fetching submissions with programs:', error);
      return [];
    }
  }
  
  /**
   * Gets submissions grouped by screening program
   */
  static async getSubmissionProgramGroups(): Promise<SubmissionProgramGroup[]> {
    const submissions = await this.getSubmissionsWithPrograms();
    const groups: { [key: string]: SubmissionProgramEntry[] } = {};
    
    // Group submissions by program
    submissions.forEach(submission => {
      if (!groups[submission.screeningProgram]) {
        groups[submission.screeningProgram] = [];
      }
      groups[submission.screeningProgram].push(submission);
    });
    
    // Convert to SubmissionProgramGroup array with updated screening dates
    const programOrder: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];
    const screeningData = {
      'A': { 
        date1: '20 September 2025', time1: '17:00 - 18:30',
        date2: '23 September 2025', time2: '17:00 - 18:30',
        venue: 'Railway Park : CIFAN Pavilion Stage Zone'
      },
      'B': { 
        date1: '21 September 2025', time1: '14:00 - 15:30',
        date2: '23 September 2025', time2: '20:00 - 21:30',
        venue: 'Railway Park : CIFAN Pavilion Stage Zone'
      },
      'C': {
        date1: '22 September 2025', time1: '14:00 - 15:30',
        date2: '25 September 2025', time2: '17:00 - 18:30',
        venue: 'Railway Park : CIFAN Pavilion Stage Zone'
      },
      'D': { 
        date1: '23 September 2025', time1: '13:00 - 14:30',
        date2: '25 September 2025', time2: '20:00 - 21:30',
        venue: 'Railway Park : CIFAN Pavilion Stage Zone'
      }
    };
    
    return programOrder.map(programLetter => {
      const programFilms = groups[programLetter] || [];
      const totalRuntime = programFilms.reduce((sum, film) => sum + film.duration, 0);
      const screeningInfo = screeningData[programLetter];
      
      return {
        program: programLetter,
        programTitle: `Program ${programLetter}`,
        films: programFilms,
        count: programFilms.length,
        totalRuntime,
        screeningDate1: screeningInfo.date1,
        screeningTime1: screeningInfo.time1,
        screeningDate2: screeningInfo.date2,
        screeningTime2: screeningInfo.time2,
        venue: screeningInfo.venue
      };
    }).filter(group => group.count > 0);
  }
  
  /**
   * Gets filtered submissions
   */
  static async getFilteredSubmissions(filters: SubmissionProgramFilters): Promise<SubmissionProgramEntry[]> {
    let submissions = await this.getSubmissionsWithPrograms();
    
    // Apply search filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      submissions = submissions.filter(submission =>
        submission.filmTitle.toLowerCase().includes(searchLower) ||
        submission.filmmaker.toLowerCase().includes(searchLower) ||
        submission.country.toLowerCase().includes(searchLower) ||
        submission.category.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply category filter
    if (filters.category && filters.category !== 'all') {
      submissions = submissions.filter(submission => submission.category === filters.category);
    }
    
    // Apply country filter
    if (filters.country && filters.country !== 'all') {
      submissions = submissions.filter(submission => submission.country === filters.country);
    }
    
    // Apply program filter
    if (filters.program && filters.program !== 'all') {
      submissions = submissions.filter(submission => submission.screeningProgram === filters.program);
    }
    
    return submissions;
  }
  
  /**
   * Gets filtered program groups
   */
  static async getFilteredProgramGroups(filters: SubmissionProgramFilters): Promise<SubmissionProgramGroup[]> {
    const filteredSubmissions = await this.getFilteredSubmissions(filters);
    const groups: { [key: string]: SubmissionProgramEntry[] } = {};
    
    // Group filtered submissions by program
    filteredSubmissions.forEach(submission => {
      if (!groups[submission.screeningProgram]) {
        groups[submission.screeningProgram] = [];
      }
      groups[submission.screeningProgram].push(submission);
    });
    
    // Convert to SubmissionProgramGroup array with updated screening dates
    const programOrder: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];
    const screeningData = {
      'A': { 
        date1: '20 September 2025', time1: '17:00 - 18:30',
        date2: '23 September 2025', time2: '17:00 - 18:30',
        venue: 'Railway Park : CIFAN Pavilion Stage Zone'
      },
      'B': { 
        date1: '21 September 2025', time1: '14:00 - 15:30',
        date2: '23 September 2025', time2: '20:00 - 21:30',
        venue: 'Railway Park : CIFAN Pavilion Stage Zone'
      },
      'C': {
        date1: '22 September 2025', time1: '14:00 - 15:30',
        date2: '25 September 2025', time2: '17:00 - 18:30',
        venue: 'Railway Park : CIFAN Pavilion Stage Zone'
      },
      'D': { 
        date1: '23 September 2025', time1: '13:00 - 14:30',
        date2: '25 September 2025', time2: '20:00 - 21:30',
        venue: 'Railway Park : CIFAN Pavilion Stage Zone'
      }
    };
    
    return programOrder.map(programLetter => {
      const programFilms = groups[programLetter] || [];
      const totalRuntime = programFilms.reduce((sum, film) => sum + film.duration, 0);
      const screeningInfo = screeningData[programLetter];
      
      return {
        program: programLetter,
        programTitle: `Program ${programLetter}`,
        films: programFilms,
        count: programFilms.length,
        totalRuntime,
        screeningDate1: screeningInfo.date1,
        screeningTime1: screeningInfo.time1,
        screeningDate2: screeningInfo.date2,
        screeningTime2: screeningInfo.time2,
        venue: screeningInfo.venue
      };
    }).filter(group => group.count > 0);
  }
  
  /**
   * Gets unique categories from submissions
   */
  static async getUniqueCategories(): Promise<string[]> {
    const submissions = await this.getSubmissionsWithPrograms();
    const categories = new Set(submissions.map(submission => submission.category));
    return Array.from(categories).sort();
  }
  
  /**
   * Gets unique countries from submissions
   */
  static async getUniqueCountries(): Promise<string[]> {
    const submissions = await this.getSubmissionsWithPrograms();
    const countries = new Set(submissions.map(submission => submission.country));
    return Array.from(countries).sort();
  }
  
  /**
   * Gets unique programs from submissions
   */
  static async getUniquePrograms(): Promise<string[]> {
    const submissions = await this.getSubmissionsWithPrograms();
    const programs = new Set(submissions.map(submission => `Program ${submission.screeningProgram}`));
    return Array.from(programs).sort();
  }
  
  /**
   * Formats duration from minutes to MM:SS format
   */
  static formatDuration(minutes: number): string {
    const mins = Math.floor(minutes);
    const secs = Math.round((minutes - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
  
  /**
   * Formats total runtime for a program
   */
  static formatTotalRuntime(totalMinutes: number): string {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }
  
  /**
   * Gets a poster URL for a submission (with fallback)
   */
  static getPosterUrl(submission: SubmissionProgramEntry): string {
    if (submission.posterUrl) {
      return submission.posterUrl;
    }
    
    // Return category-based placeholder poster
    switch (submission.category) {
      case 'youth':
        return 'https://firebasestorage.googleapis.com/v0/b/cifan-c41c6.firebasestorage.app/o/site_files%2Ffest_logos%2FGroup%202.png?alt=media&token=e8be419f-f0b2-4f64-8d7f-c3e8532e2689';
      case 'future':
        return 'https://firebasestorage.googleapis.com/v0/b/cifan-c41c6.firebasestorage.app/o/site_files%2Ffest_logos%2FGroup%203.png?alt=media&token=b66cd708-0dc3-4c05-bc56-b2f99a384287';
      case 'world':
        return 'https://firebasestorage.googleapis.com/v0/b/cifan-c41c6.firebasestorage.app/o/site_files%2Ffest_logos%2FGroup%204.png?alt=media&token=84ad0256-2322-4999-8e9f-d2f30c7afa67';
      default:
        return 'https://firebasestorage.googleapis.com/v0/b/cifan-c41c6.firebasestorage.app/o/site_files%2Ffest_logos%2FT4%404x.png?alt=media&token=4b606f45-6165-4486-951b-4e4ccb0bdb23';
    }
  }
}
