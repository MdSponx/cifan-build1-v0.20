import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  doc, 
  getDoc,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import { ShortFilmSubmission, ShortFilmFilters, CategoryGroup } from '../types/shortFilm.types';

/**
 * Service for managing short film submissions
 */
export class ShortFilmService {
  private static readonly COLLECTION_NAME = 'submissions';

  /**
   * Fetches all accepted short film submissions
   */
  static async getAcceptedSubmissions(): Promise<ShortFilmSubmission[]> {
    try {
      const submissionsRef = collection(db, this.COLLECTION_NAME);
      
      // First try to get all submissions and filter client-side to avoid index issues
      const q = query(submissionsRef);
      const querySnapshot = await getDocs(q);
      const submissions: ShortFilmSubmission[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Filter for accepted status
        if (data.status === 'accepted') {
          submissions.push(this.transformFirestoreData(doc.id, data));
        }
      });

      // Sort by submitted date (newest first)
      submissions.sort((a, b) => {
        if (!a.submittedAt && !b.submittedAt) return 0;
        if (!a.submittedAt) return 1;
        if (!b.submittedAt) return -1;
        return b.submittedAt.getTime() - a.submittedAt.getTime();
      });

      console.log(`✅ Fetched ${submissions.length} accepted submissions`);
      return submissions;
    } catch (error) {
      console.error('❌ Error fetching accepted submissions:', error);
      throw new Error('Failed to fetch accepted submissions');
    }
  }

  /**
   * Fetches accepted submissions with filters
   */
  static async getAcceptedSubmissionsWithFilters(
    filters: ShortFilmFilters
  ): Promise<ShortFilmSubmission[]> {
    try {
      const submissionsRef = collection(db, this.COLLECTION_NAME);
      let q = query(
        submissionsRef,
        where('status', '==', 'accepted')
      );

      // Add category filter if specified
      if (filters.category) {
        q = query(q, where('category', '==', filters.category));
      }

      // Add format filter if specified
      if (filters.format) {
        q = query(q, where('format', '==', filters.format));
      }

      // Order by submission date
      q = query(q, orderBy('submittedAt', 'desc'));

      const querySnapshot = await getDocs(q);
      let submissions: ShortFilmSubmission[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        submissions.push(this.transformFirestoreData(doc.id, data));
      });

      // Apply client-side filters
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        submissions = submissions.filter(film => 
          film.filmTitle.toLowerCase().includes(searchLower) ||
          (film.filmTitleTh && film.filmTitleTh.toLowerCase().includes(searchLower)) ||
          film.submitterName.toLowerCase().includes(searchLower) ||
          film.synopsis.toLowerCase().includes(searchLower)
        );
      }

      if (filters.genre) {
        submissions = submissions.filter(film => 
          film.genres.includes(filters.genre!)
        );
      }

      console.log(`✅ Fetched ${submissions.length} filtered accepted submissions`);
      return submissions;
    } catch (error) {
      console.error('❌ Error fetching filtered submissions:', error);
      throw new Error('Failed to fetch filtered submissions');
    }
  }

  /**
   * Groups accepted submissions by category
   */
  static async getAcceptedSubmissionsByCategory(): Promise<CategoryGroup[]> {
    try {
      const submissions = await this.getAcceptedSubmissions();
      
      const categoryGroups: CategoryGroup[] = [
        {
          category: 'youth',
          displayName: 'Youth Competition',
          films: [],
          count: 0
        },
        {
          category: 'future',
          displayName: 'Future Competition',
          films: [],
          count: 0
        },
        {
          category: 'world',
          displayName: 'World Competition',
          films: [],
          count: 0
        }
      ];

      // Group submissions by category
      submissions.forEach(submission => {
        const group = categoryGroups.find(g => g.category === submission.category);
        if (group) {
          group.films.push(submission);
          group.count++;
        }
      });

      // Sort films within each category by title
      categoryGroups.forEach(group => {
        group.films.sort((a, b) => a.filmTitle.localeCompare(b.filmTitle));
      });

      console.log('✅ Grouped submissions by category:', categoryGroups.map(g => `${g.category}: ${g.count}`));
      return categoryGroups;
    } catch (error) {
      console.error('❌ Error grouping submissions by category:', error);
      throw new Error('Failed to group submissions by category');
    }
  }

  /**
   * Fetches a single submission by ID
   */
  static async getSubmissionById(id: string): Promise<ShortFilmSubmission | null> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        return this.transformFirestoreData(docSnap.id, data);
      } else {
        console.log('No submission found with ID:', id);
        return null;
      }
    } catch (error) {
      console.error('❌ Error fetching submission by ID:', error);
      throw new Error('Failed to fetch submission');
    }
  }

  /**
   * Gets statistics for accepted submissions
   */
  static async getAcceptedSubmissionsStats(): Promise<{
    total: number;
    byCategory: { [key: string]: number };
    byFormat: { [key: string]: number };
    byGenre: { [key: string]: number };
  }> {
    try {
      const submissions = await this.getAcceptedSubmissions();
      
      const stats = {
        total: submissions.length,
        byCategory: {} as { [key: string]: number },
        byFormat: {} as { [key: string]: number },
        byGenre: {} as { [key: string]: number }
      };

      submissions.forEach(submission => {
        // Count by category
        stats.byCategory[submission.category] = (stats.byCategory[submission.category] || 0) + 1;
        
        // Count by format
        if (submission.format) {
          stats.byFormat[submission.format] = (stats.byFormat[submission.format] || 0) + 1;
        }
        
        // Count by genres
        submission.genres.forEach(genre => {
          stats.byGenre[genre] = (stats.byGenre[genre] || 0) + 1;
        });
      });

      console.log('✅ Generated submission statistics:', stats);
      return stats;
    } catch (error) {
      console.error('❌ Error generating submission statistics:', error);
      throw new Error('Failed to generate statistics');
    }
  }

  /**
   * Transforms Firestore data to ShortFilmSubmission interface
   */
  private static transformFirestoreData(id: string, data: any): ShortFilmSubmission {
    return {
      id,
      userId: data.userId || '',
      applicationId: data.applicationId || '',
      competitionCategory: data.competitionCategory || data.category || 'youth',
      category: data.category || 'youth',
      status: data.status || 'submitted',
      submittedAt: data.submittedAt ? this.timestampToDate(data.submittedAt) : null,
      createdAt: data.createdAt ? this.timestampToDate(data.createdAt) : new Date(),
      lastModified: data.lastModified ? this.timestampToDate(data.lastModified) : new Date(),
      
      // Film Information
      filmTitle: data.filmTitle || '',
      filmTitleTh: data.filmTitleTh || undefined,
      filmTitleEn: data.filmTitleEn || undefined,
      filmLanguages: data.filmLanguages || ['Thai'],
      genres: data.genres || [],
      format: data.format || '',
      duration: typeof data.duration === 'number' ? data.duration : parseInt(data.duration) || 0,
      synopsis: data.synopsis || '',
      chiangmaiConnection: data.chiangmaiConnection || '',
      
      // Submitter Information
      submitterName: data.submitterName || '',
      submitterNameTh: data.submitterNameTh || undefined,
      submitterAge: typeof data.submitterAge === 'number' ? data.submitterAge : parseInt(data.submitterAge) || 0,
      submitterPhone: data.submitterPhone || '',
      submitterEmail: data.submitterEmail || '',
      submitterRole: data.submitterRole || '',
      submitterCustomRole: data.submitterCustomRole || undefined,
      
      // Category-specific fields
      nationality: data.nationality || undefined,
      schoolName: data.schoolName || undefined,
      studentId: data.studentId || undefined,
      universityName: data.universityName || undefined,
      faculty: data.faculty || undefined,
      universityId: data.universityId || undefined,
      
      // Crew Information
      crewMembers: data.crewMembers || [],
      
      // Files
      files: {
        filmFile: data.files?.filmFile ? {
          url: data.files.filmFile.url || '',
          name: data.files.filmFile.name || '',
          size: data.files.filmFile.size || 0,
          type: data.files.filmFile.type || '',
          storagePath: data.files.filmFile.storagePath || '',
          uploadedAt: data.files.filmFile.uploadedAt ? this.timestampToDate(data.files.filmFile.uploadedAt) : new Date()
        } : null,
        posterFile: data.files?.posterFile ? {
          url: data.files.posterFile.url || '',
          name: data.files.posterFile.name || '',
          size: data.files.posterFile.size || 0,
          type: data.files.posterFile.type || '',
          storagePath: data.files.posterFile.storagePath || '',
          uploadedAt: data.files.posterFile.uploadedAt ? this.timestampToDate(data.files.posterFile.uploadedAt) : new Date()
        } : null,
        proofFile: data.files?.proofFile ? {
          url: data.files.proofFile.url || '',
          name: data.files.proofFile.name || '',
          size: data.files.proofFile.size || 0,
          type: data.files.proofFile.type || '',
          storagePath: data.files.proofFile.storagePath || '',
          uploadedAt: data.files.proofFile.uploadedAt ? this.timestampToDate(data.files.proofFile.uploadedAt) : new Date()
        } : null
      },
      
      // Agreements
      agreements: {
        copyright: data.agreements?.copyright || false,
        terms: data.agreements?.terms || false,
        promotional: data.agreements?.promotional || false,
        finalDecision: data.agreements?.finalDecision || false
      }
    };
  }

  /**
   * Converts Firestore Timestamp to Date
   */
  private static timestampToDate(timestamp: any): Date {
    if (timestamp && typeof timestamp.toDate === 'function') {
      return timestamp.toDate();
    }
    if (timestamp && timestamp.seconds) {
      return new Date(timestamp.seconds * 1000);
    }
    if (timestamp instanceof Date) {
      return timestamp;
    }
    return new Date();
  }
}

/**
 * Hook for fetching accepted submissions
 */
export const useAcceptedSubmissions = () => {
  const [submissions, setSubmissions] = React.useState<ShortFilmSubmission[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await ShortFilmService.getAcceptedSubmissions();
        setSubmissions(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch submissions');
        console.error('Error in useAcceptedSubmissions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, []);

  return { submissions, loading, error };
};

/**
 * Hook for fetching submissions grouped by category
 */
export const useAcceptedSubmissionsByCategory = () => {
  const [categoryGroups, setCategoryGroups] = React.useState<CategoryGroup[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchCategoryGroups = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await ShortFilmService.getAcceptedSubmissionsByCategory();
        setCategoryGroups(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch category groups');
        console.error('Error in useAcceptedSubmissionsByCategory:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryGroups();
  }, []);

  return { categoryGroups, loading, error };
};

// Import React for hooks
import React from 'react';
