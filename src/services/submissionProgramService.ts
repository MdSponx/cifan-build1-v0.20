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
   * Retry configuration for database queries
   */
  private static readonly RETRY_CONFIG = {
    maxRetries: 3,
    baseDelay: 1000, // 1 second
    maxDelay: 5000,  // 5 seconds
    backoffMultiplier: 2
  };

  /**
   * Utility function to detect if running on mobile device
   */
  private static isMobileDevice(): boolean {
    if (typeof window === 'undefined') return false;
    
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    const isSmallScreen = window.innerWidth <= 768;
    
    return isMobile || isSmallScreen;
  }

  /**
   * Retry wrapper for database operations with exponential backoff
   */
  private static async withRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    retryCount = 0
  ): Promise<T> {
    try {
      const isMobile = this.isMobileDevice();
      const timeout = isMobile ? 10000 : 5000; // 10s for mobile, 5s for desktop
      
      console.log(`🔄 Attempting ${operationName} (attempt ${retryCount + 1}/${this.RETRY_CONFIG.maxRetries + 1}) - ${isMobile ? 'Mobile' : 'Desktop'} device`);
      
      // Create a timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`${operationName} timeout after ${timeout}ms`)), timeout);
      });
      
      // Race between operation and timeout
      const result = await Promise.race([operation(), timeoutPromise]);
      
      console.log(`✅ ${operationName} succeeded on attempt ${retryCount + 1}`);
      return result;
      
    } catch (error) {
      const isMobile = this.isMobileDevice();
      console.warn(`⚠️ ${operationName} failed on attempt ${retryCount + 1}:`, error);
      
      if (retryCount < this.RETRY_CONFIG.maxRetries) {
        const delay = Math.min(
          this.RETRY_CONFIG.baseDelay * Math.pow(this.RETRY_CONFIG.backoffMultiplier, retryCount),
          this.RETRY_CONFIG.maxDelay
        );
        
        // Add extra delay for mobile devices
        const actualDelay = isMobile ? delay * 1.5 : delay;
        
        console.log(`⏳ Retrying ${operationName} in ${actualDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, actualDelay));
        
        return this.withRetry(operation, operationName, retryCount + 1);
      }
      
      throw error;
    }
  }

  /**
   * Fetches all submissions with screeningProgram assigned
   */
  static async getSubmissionsWithPrograms(): Promise<SubmissionProgramEntry[]> {
    const isMobile = this.isMobileDevice();
    console.log(`🔍 Fetching submissions with screeningProgram on ${isMobile ? 'mobile' : 'desktop'} device...`);
    
    try {
      let submissions: SubmissionProgramEntry[] = [];
      
      // Approach 1: Try to get from a public collection first with retry logic
      try {
        const publicFilmsData = await this.withRetry(async () => {
          const publicFilmsRef = collection(db, 'publicFilms');
          const publicQuery = query(publicFilmsRef);
          const publicSnapshot = await getDocs(publicQuery);
          
          console.log(`📊 Found ${publicSnapshot.size} public films`);
          
          const films: SubmissionProgramEntry[] = [];
          publicSnapshot.forEach((doc) => {
            const data = doc.data();
            
            // Check if this has screening program data
            if (data.screeningProgram && ['A', 'B', 'C', 'D'].includes(data.screeningProgram)) {
              films.push({
                id: doc.id,
                filmTitle: data.filmTitle || data.title || 'Unknown Title',
                filmTitleTh: data.filmTitleTh,
                country: data.country || data.nationality || 'International',
                filmmaker: data.filmmaker || data.director || data.submitterName || 'Unknown',
                category: data.category || data.competitionCategory || 'unknown',
                duration: data.duration || 0,
                screeningProgram: data.screeningProgram,
                posterUrl: data.posterUrl || data.poster || data.files?.posterFile?.url,
                status: 'accepted',
                submittedAt: data.submittedAt instanceof Date ? data.submittedAt : (data.submittedAt as any)?.toDate?.() || undefined
              });
            }
          });
          
          return films;
        }, 'publicFilms query');
        
        submissions = publicFilmsData;
        
        if (submissions.length > 0) {
          console.log(`🎬 Successfully loaded ${submissions.length} films with screeningProgram from publicFilms`);
          return this.sortSubmissions(submissions);
        }
        
      } catch (publicError) {
        console.log('📝 PublicFilms query failed, trying submissions collection...', publicError);
      }
      
      // Approach 2: Try submissions collection with retry logic
      try {
        const submissionsData = await this.withRetry(async () => {
          const submissionsRef = collection(db, 'submissions');
          const q = query(submissionsRef);
          const querySnapshot = await getDocs(q);
          
          console.log(`📊 Found ${querySnapshot.size} total submissions`);
          
          const films: SubmissionProgramEntry[] = [];
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            
            // More flexible field checking
            const screeningProgram = data.screeningProgram || data.program || data.shortFilmProgram;
            const status = data.status || 'unknown';
            
            // Only include if has screening program and is accepted (or no status field)
            if (screeningProgram && ['A', 'B', 'C', 'D'].includes(screeningProgram) && 
                (status === 'accepted' || status === 'published' || status === 'unknown')) {
              
              films.push({
                id: doc.id,
                filmTitle: data.filmTitle || data.title || 'Unknown Title',
                filmTitleTh: data.filmTitleTh,
                country: data.country || data.nationality || 'International',
                filmmaker: data.filmmaker || data.director || data.submitterName || 'Unknown',
                category: data.category || data.competitionCategory || 'unknown',
                duration: data.duration || 0,
                screeningProgram: screeningProgram,
                posterUrl: data.posterUrl || data.poster || data.files?.posterFile?.url,
                status: status,
                submittedAt: data.submittedAt instanceof Date ? data.submittedAt : (data.submittedAt as any)?.toDate?.() || undefined
              });
            }
          });
          
          return films;
        }, 'submissions query');
        
        submissions = submissionsData;
        
        if (submissions.length > 0) {
          console.log(`🎬 Successfully loaded ${submissions.length} films with screeningProgram from submissions`);
          return this.sortSubmissions(submissions);
        }
        
      } catch (submissionsError) {
        console.log('📝 Submissions query failed, trying alternative collections...', submissionsError);
      }
      
      // Approach 3: Try alternative collections with retry logic
      const alternativeCollections = ['applications', 'filmSubmissions', 'shortFilms'];
      
      for (const collectionName of alternativeCollections) {
        try {
          const altData = await this.withRetry(async () => {
            const altRef = collection(db, collectionName);
            const altQuery = query(altRef);
            const altSnapshot = await getDocs(altQuery);
            
            if (altSnapshot.size === 0) {
              throw new Error(`No documents in ${collectionName}`);
            }
            
            console.log(`📊 Found ${altSnapshot.size} submissions in ${collectionName}`);
            
            const films: SubmissionProgramEntry[] = [];
            altSnapshot.forEach((doc) => {
              const data = doc.data();
              
              const screeningProgram = data.screeningProgram || data.program || data.shortFilmProgram;
              const status = data.status || 'unknown';
              
              if (screeningProgram && ['A', 'B', 'C', 'D'].includes(screeningProgram) && 
                  (status === 'accepted' || status === 'published' || status === 'unknown')) {
                
                films.push({
                  id: doc.id,
                  filmTitle: data.filmTitle || data.title || 'Unknown Title',
                  filmTitleTh: data.filmTitleTh,
                  country: data.country || data.nationality || 'International',
                  filmmaker: data.filmmaker || data.director || data.submitterName || 'Unknown',
                  category: data.category || data.competitionCategory || 'unknown',
                  duration: data.duration || 0,
                  screeningProgram: screeningProgram,
                  posterUrl: data.posterUrl || data.poster || data.files?.posterFile?.url,
                  status: status,
                  submittedAt: data.submittedAt instanceof Date ? data.submittedAt : (data.submittedAt as any)?.toDate?.() || undefined
                });
              }
            });
            
            return films;
          }, `${collectionName} query`);
          
          submissions = altData;
          
          if (submissions.length > 0) {
            console.log(`🎬 Successfully loaded ${submissions.length} films with screeningProgram from ${collectionName}`);
            return this.sortSubmissions(submissions);
          }
          
        } catch (altError) {
          console.log(`❌ Could not access ${collectionName}:`, altError);
        }
      }
      
      // Only use mock data as absolute last resort and warn about it
      console.warn('⚠️ All database queries failed - this should not happen in production!');
      console.warn('🎭 Using mock data as absolute last resort...');
      
      // Add a small delay to prevent immediate fallback on mobile
      if (isMobile) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      return this.createMockData();
      
    } catch (error) {
      console.error('❌ Critical error in getSubmissionsWithPrograms:', error);
      console.warn('🎭 Falling back to mock data due to critical error...');
      return this.createMockData();
    }
  }
  
  /**
   * Sort submissions by program and title
   */
  private static sortSubmissions(submissions: SubmissionProgramEntry[]): SubmissionProgramEntry[] {
    return submissions.sort((a, b) => {
      if (a.screeningProgram !== b.screeningProgram) {
        return a.screeningProgram.localeCompare(b.screeningProgram);
      }
      return a.filmTitle.localeCompare(b.filmTitle);
    });
  }
  
  /**
   * Create mock data for testing when no real data is available
   */
  private static createMockData(): SubmissionProgramEntry[] {
    return [
      {
        id: 'mock-1',
        filmTitle: 'The Journey Home',
        country: 'Thailand',
        filmmaker: 'Somchai Jaidee',
        category: 'world',
        duration: 15,
        screeningProgram: 'A',
        status: 'accepted'
      },
      {
        id: 'mock-2',
        filmTitle: 'Digital Dreams',
        country: 'Singapore',
        filmmaker: 'Li Wei',
        category: 'future',
        duration: 12,
        screeningProgram: 'A',
        status: 'accepted'
      },
      {
        id: 'mock-3',
        filmTitle: 'Young Voices',
        country: 'Malaysia',
        filmmaker: 'Ahmad Rahman',
        category: 'youth',
        duration: 8,
        screeningProgram: 'B',
        status: 'accepted'
      },
      {
        id: 'mock-4',
        filmTitle: 'City Lights',
        country: 'Philippines',
        filmmaker: 'Maria Santos',
        category: 'world',
        duration: 18,
        screeningProgram: 'B',
        status: 'accepted'
      },
      {
        id: 'mock-5',
        filmTitle: 'Tomorrow\'s Hope',
        country: 'Vietnam',
        filmmaker: 'Nguyen Van A',
        category: 'future',
        duration: 14,
        screeningProgram: 'C',
        status: 'accepted'
      }
    ];
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
