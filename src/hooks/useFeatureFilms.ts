import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  FeatureFilm, 
  FilmFilters, 
  CreateFeatureFilmData, 
  UpdateFeatureFilmData 
} from '../types/featureFilm.types';
import { 
  getEnhancedFeatureFilms, 
  createEnhancedFeatureFilm, 
  updateEnhancedFeatureFilm, 
  deleteEnhancedFeatureFilm,
  searchEnhancedFeatureFilms,
  getEnhancedFeatureFilmsByStatus,
  subscribeToFeatureFilms,
  getEnhancedFeatureFilm
} from '../services/featureFilmService';

interface UseFeatureFilmsReturn {
  films: FeatureFilm[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createFilm: (filmData: CreateFeatureFilmData, userId: string) => Promise<{ success: boolean; data?: FeatureFilm; error?: string }>;
  updateFilm: (filmId: string, filmData: UpdateFeatureFilmData, userId: string) => Promise<{ success: boolean; data?: FeatureFilm; error?: string }>;
  deleteFilm: (filmId: string) => Promise<{ success: boolean; error?: string }>;
  searchFilms: (searchTerm: string) => Promise<void>;
  filterByStatus: (status: 'draft' | 'published' | 'archived') => Promise<void>;
  totalCount: number;
  hasMore: boolean;
  loadMore: () => Promise<void>;
}

/**
 * Custom hook for managing feature films with CRUD operations
 */
export const useFeatureFilms = (
  filters?: FilmFilters,
  enableRealtime: boolean = false
): UseFeatureFilmsReturn => {
  const [films, setFilms] = useState<FeatureFilm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  // ✅ FIX: Memoize filters to prevent unnecessary re-renders
  const memoizedFilters = useMemo(() => {
    if (!filters) return undefined;
    
    // Create a stable reference for filters
    return {
      ...filters
    };
  }, [
    filters?.publicationStatus,
    filters?.status,
    filters?.genre,
    filters?.country,
    filters?.search,
    filters?.featured,
    filters?.yearFrom,
    filters?.yearTo,
    filters?.limit,
    filters?.offset
  ]);

  /**
   * Fetch films with current filters (for non-realtime mode)
   */
  const fetchFilms = useCallback(async (appendToExisting = false) => {
    try {
      if (!appendToExisting) {
        setLoading(true);
      }
      setError(null);

      console.log('🎬 fetchFilms called with filters:', memoizedFilters);

      const result = await getEnhancedFeatureFilms(memoizedFilters);
      
      if (result.success && result.data) {
        const newFilms = result.data as FeatureFilm[];
        
        if (appendToExisting) {
          setFilms(prev => [...prev, ...newFilms]);
        } else {
          setFilms(newFilms);
        }
        
        setTotalCount(newFilms.length);
        
        // Check if there are more items to load
        const limit = memoizedFilters?.limit || 20;
        setHasMore(newFilms.length === limit);
      } else {
        setError(result.error || 'Failed to fetch films');
        setFilms([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Filter failed');
      setFilms([]);
    } finally {
      setLoading(false);
    }
  }, [memoizedFilters]);

  // ✅ FIX: Single useEffect with proper dependency management
  useEffect(() => {
    console.log('🎬 useFeatureFilms useEffect triggered:', {
      enableRealtime,
      memoizedFilters,
      filtersString: JSON.stringify(memoizedFilters)
    });

    if (enableRealtime) {
      console.log('🔔 Setting up real-time subscription...');
      
      // Set loading state
      setLoading(true);
      setError(null);
      
      // Set up realtime subscription with filters
      const unsubscribe = subscribeToFeatureFilms(
        (updatedFilms) => {
          console.log('📡 Real-time update received:', updatedFilms.length, 'films');
          setFilms(updatedFilms);
          setTotalCount(updatedFilms.length);
          setLoading(false);
        },
        (errorMessage) => {
          console.error('❌ Real-time subscription error:', errorMessage);
          setError(errorMessage);
          setLoading(false);
        },
        memoizedFilters
      );

      // Return cleanup function
      return () => {
        console.log('🧹 Cleaning up real-time subscription');
        unsubscribe();
      };
    } else {
      console.log('📥 Using one-time fetch');
      // One-time fetch
      fetchFilms();
    }
  }, [enableRealtime, memoizedFilters, fetchFilms]); // ✅ FIX: Use memoizedFilters instead of filters

  /**
   * Load more films (pagination)
   */
  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;

    const offset = films.length;
    const newFilters = { ...memoizedFilters, offset };
    
    try {
      const result = await getEnhancedFeatureFilms(newFilters);
      
      if (result.success && result.data) {
        const newFilms = result.data as FeatureFilm[];
        setFilms(prev => [...prev, ...newFilms]);
        
        const limit = memoizedFilters?.limit || 20;
        setHasMore(newFilms.length === limit);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more films');
    }
  }, [films.length, hasMore, loading, memoizedFilters]);

  /**
   * Refetch films
   */
  const refetch = useCallback(async () => {
    await fetchFilms(false);
  }, [fetchFilms]);

  /**
   * Create a new film
   */
  const createFilm = useCallback(async (filmData: CreateFeatureFilmData, userId: string) => {
    try {
      const result = await createEnhancedFeatureFilm(filmData, userId);
      
      if (result.success && result.data) {
        // Add the new film to the beginning of the list
        setFilms(prev => [result.data as FeatureFilm, ...prev]);
        setTotalCount(prev => prev + 1);
        
        return { success: true, data: result.data as FeatureFilm };
      } else {
        return { success: false, error: result.error || 'Failed to create film' };
      }
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'An unexpected error occurred' 
      };
    }
  }, []);

  /**
   * Update an existing film
   */
  const updateFilm = useCallback(async (filmId: string, filmData: UpdateFeatureFilmData, userId: string) => {
    try {
      const result = await updateEnhancedFeatureFilm(filmId, filmData, userId);
      
      if (result.success && result.data) {
        // Update the film in the list
        setFilms(prev => prev.map(film => 
          film.id === filmId ? { ...film, ...result.data } : film
        ));
        
        return { success: true, data: result.data as FeatureFilm };
      } else {
        return { success: false, error: result.error || 'Failed to update film' };
      }
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'An unexpected error occurred' 
      };
    }
  }, []);

  /**
   * Delete an existing film
   */
  const deleteFilm = useCallback(async (filmId: string) => {
    try {
      const result = await deleteEnhancedFeatureFilm(filmId);
      
      if (result.success) {
        // Remove the film from the list
        setFilms(prev => prev.filter(film => film.id !== filmId));
        setTotalCount(prev => prev - 1);
        
        return { success: true };
      } else {
        return { success: false, error: result.error || 'Failed to delete film' };
      }
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'An unexpected error occurred' 
      };
    }
  }, []);

  /**
   * Search films by term
   */
  const searchFilms = useCallback(async (searchTerm: string) => {
    try {
      setLoading(true);
      setError(null);

      const result = await searchEnhancedFeatureFilms(searchTerm);
      
      if (result.success && result.data) {
        const searchResults = result.data as FeatureFilm[];
        setFilms(searchResults);
        setTotalCount(searchResults.length);
        setHasMore(false); // Search results don't support pagination
      } else {
        setError(result.error || 'Search failed');
        setFilms([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setFilms([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Filter films by status
   */
  const filterByStatus = useCallback(async (status: 'draft' | 'published' | 'archived') => {
    try {
      setLoading(true);
      setError(null);

      const result = await getEnhancedFeatureFilmsByStatus(status);
      
      if (result.success && result.data) {
        const filteredFilms = result.data as FeatureFilm[];
        setFilms(filteredFilms);
        setTotalCount(filteredFilms.length);
        setHasMore(false); // Status filter doesn't support pagination
      } else {
        setError(result.error || 'Filter failed');
        setFilms([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setFilms([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    films,
    loading,
    error,
    refetch,
    createFilm,
    updateFilm,
    deleteFilm,
    searchFilms,
    filterByStatus,
    totalCount,
    hasMore,
    loadMore
  };
};

/**
 * Custom hook for managing a single feature film
 */
export const useFeatureFilm = (filmId: string) => {
  const [film, setFilm] = useState<FeatureFilm | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFilm = useCallback(async () => {
    if (!filmId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await getEnhancedFeatureFilm(filmId);
      
      if (result.success && result.data) {
        setFilm(result.data as FeatureFilm);
      } else {
        setError(result.error || 'Film not found');
        setFilm(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch film');
      setFilm(null);
    } finally {
      setLoading(false);
    }
  }, [filmId]);

  const refetch = useCallback(async () => {
    await fetchFilm();
  }, [fetchFilm]);

  useEffect(() => {
    fetchFilm();
  }, [fetchFilm]);

  return {
    film,
    loading,
    error,
    refetch
  };
};

export default useFeatureFilms;
