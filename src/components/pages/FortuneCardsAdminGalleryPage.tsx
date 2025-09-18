import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Sparkles, 
  Search, 
  Filter, 
  Plus, 
  Grid, 
  List, 
  Eye, 
  Edit, 
  Trash2, 
  Calendar,
  Clock,
  User,
  ChevronDown,
  Star,
  AlertCircle,
  CheckCircle,
  Archive
} from 'lucide-react';
import { useTypography } from '../../utils/typography';
import { useAuth } from '../auth/AuthContext';
import { useNotificationHelpers } from '../ui/NotificationContext';
import { useFeatureFilms } from '../../hooks/useFeatureFilms';
import { FeatureFilm, FilmFilters } from '../../types/featureFilm.types';
import { getTagColor } from '../../utils/tagColors';

interface FortuneCardsAdminGalleryPageProps {
  onNavigateToForm?: (mode: 'create' | 'edit', filmId?: string) => void;
  onNavigateToDetail?: (filmId: string) => void;
}

/**
 * Fortune Cards Admin Gallery Page Component
 * 
 * Specialized gallery interface for managing films with fortune cards:
 * - Shows only films that have fortune cards
 * - Displays fortune card images instead of posters
 * - Grid/List view toggle
 * - Search and filtering
 * - CRUD operations
 */
const FortuneCardsAdminGalleryPage: React.FC<FortuneCardsAdminGalleryPageProps> = ({
  onNavigateToForm,
  onNavigateToDetail
}) => {
  const { t } = useTranslation();
  const { getClass } = useTypography();
  const { user } = useAuth();
  const { showSuccess, showError, showLoading, updateToSuccess, updateToError } = useNotificationHelpers();

  // View and filter state
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FilmFilters>({
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFilms, setSelectedFilms] = useState<string[]>([]);

  // Use the custom hook
  const {
    films: allFilms,
    loading,
    error,
    refetch,
    deleteFilm,
    searchFilms,
    filterByStatus,
    totalCount,
    hasMore,
    loadMore
  } = useFeatureFilms(filters);

  // Filter to show only films with fortune cards
  const films = React.useMemo(() => {
    return allFilms.filter(film => {
      const hasFortuneCard = film.fortuneCard || 
                            (film as any).fortuneCardUrl || 
                            (film.files as any)?.fortuneCard?.url;
      return hasFortuneCard;
    });
  }, [allFilms]);

  /**
   * Get fortune card URL from film
   */
  const getFortuneCardUrl = (film: FeatureFilm): string | null => {
    return film.fortuneCard || 
           (film as any).fortuneCardUrl || 
           (film.files as any)?.fortuneCard?.url || 
           null;
  };

  /**
   * Handle search
   */
  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    if (term.trim()) {
      await searchFilms(term);
    } else {
      await refetch();
    }
  };

  /**
   * Handle filter changes
   */
  const handleFilterChange = (newFilters: Partial<FilmFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  /**
   * Handle status filter
   */
  const handleStatusFilter = async (status: 'draft' | 'published' | 'archived' | 'all') => {
    if (status === 'all') {
      await refetch();
    } else {
      await filterByStatus(status);
    }
  };

  /**
   * Handle film selection
   */
  const handleFilmSelection = (filmId: string, selected: boolean) => {
    if (selected) {
      setSelectedFilms(prev => [...prev, filmId]);
    } else {
      setSelectedFilms(prev => prev.filter(id => id !== filmId));
    }
  };

  /**
   * Handle select all
   */
  const handleSelectAll = () => {
    if (selectedFilms.length === films.length) {
      setSelectedFilms([]);
    } else {
      setSelectedFilms(films.map(film => film.id));
    }
  };

  /**
   * Handle delete film
   */
  const handleDeleteFilm = async (filmId: string) => {
    if (!confirm('Are you sure you want to delete this film? This action cannot be undone.')) {
      return;
    }

    const loadingId = showLoading('Deleting Film', 'Please wait...');
    
    try {
      const result = await deleteFilm(filmId);
      
      if (result.success) {
        updateToSuccess(loadingId, 'Success!', 'Film deleted successfully');
        setSelectedFilms(prev => prev.filter(id => id !== filmId));
      } else {
        updateToError(loadingId, 'Error', result.error || 'Failed to delete film');
      }
    } catch (error) {
      updateToError(loadingId, 'Error', 'An unexpected error occurred');
    }
  };

  /**
   * Handle bulk delete
   */
  const handleBulkDelete = async () => {
    if (selectedFilms.length === 0) return;
    
    if (!confirm(`Are you sure you want to delete ${selectedFilms.length} films? This action cannot be undone.`)) {
      return;
    }

    const loadingId = showLoading('Deleting Films', `Deleting ${selectedFilms.length} films...`);
    
    try {
      const promises = selectedFilms.map(filmId => deleteFilm(filmId));
      const results = await Promise.all(promises);
      
      const successCount = results.filter(r => r.success).length;
