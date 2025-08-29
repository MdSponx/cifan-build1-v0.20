import { useState, useEffect, useCallback } from 'react';
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
  const [currentFilters, setCurrentFilters] = useState<FilmFilters | undefined>(filters);

  /**
   * Fetch films with current filters
   */
  const fetchFilms = useCallback(async (appendToExisting = false) => {
    try {
      if (!appendToExisting) {
        setLoading(true);
      }
      setError(null);

      const result = await getEnhancedFeatureFilms(currentFilters);
      
      if (result.success && result.data) {
        const newFilms = result.data as FeatureFilm[];
        
        if (appendToExisting) {
          setFilms(prev => [...prev, ...newFilms]);
        } else {
          setFilms(newFilms);
        }
        
        setTotalCount(newFilms.length);
        
        // Check if there are more items to load
        const limit = currentFilters?.limit || 20;
        setHasMore(newFilms.length === limit);
      } else {
        setError(result.error || 'Failed to fetch films');
        setFilms([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setFilms([]);
    } finally {
      setLoading(false);
    }
  }, [currentFilters]);

  /**
   * Load more films (pagination)
   */
  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;

    const offset = films.length;
    const newFilters = { ...currentFilters, offset };
    
    try {
      const result = await getEnhancedFeatureFilms(newFilters);
      
      if (result.success && result.data) {
        const newFilms = result.data as FeatureFilm[];
        setFilms(prev => [...prev, ...newFilms]);
        
        const limit = currentFilters?.limit || 20;
        setHasMore(newFilms.length === limit);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more films');
    }
  }, [films.length, hasMore, loading, currentFilters]);

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
   * Delete a film
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
   * Search films by title
   */
  const searchFilms = useCallback(async (searchTerm: string) => {
    try {
      setLoading(true);
      setError(null);

      const result = await searchEnhancedFeatureFilms(searchTerm);
      
      if (result.success && result.data) {
        setFilms(result.data as FeatureFilm[]);
        setTotalCount(result.data.length);
        setHasMore(false); // Search results don't support pagination
      } else {
        setError(result.error || 'Failed to search films');
        setFilms([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
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
        setFilms(result.data as FeatureFilm[]);
        setTotalCount(result.data.length);
        setHasMore(false);
      } else {
        setError(result.error || 'Failed to filter films');
        setFilms([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Filter failed');
      setFilms([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch and realtime subscription setup
  useEffect(() => {
    if (enableRealtime) {
      // Set up realtime subscription with filters
      const unsubscribe = subscribeToFeatureFilms((updatedFilms) => {
        setFilms(updatedFilms);
        setTotalCount(updatedFilms.length);
        setLoading(false);
      }, currentFilters); // Pass filters to subscription

      return unsubscribe;
    } else {
      // One-time fetch
      fetchFilms();
    }
  }, [fetchFilms, enableRealtime, currentFilters]);

  // Update filters
  useEffect(() => {
    setCurrentFilters(filters);
  }, [filters]);

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
