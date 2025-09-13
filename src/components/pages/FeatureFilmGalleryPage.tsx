import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Film, 
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
  Tag,
  ChevronDown,
  MoreVertical,
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
import { formatFileSize } from '../../utils/fileUpload';
import { getTagColor } from '../../utils/tagColors';

interface FeatureFilmGalleryPageProps {
  onNavigateToForm?: (mode: 'create' | 'edit', filmId?: string) => void;
  onNavigateToDetail?: (filmId: string) => void;
}

/**
 * Feature Film Gallery Page Component
 * 
 * Comprehensive gallery interface for managing feature films with:
 * - Grid/List view toggle
 * - Advanced search and filtering
 * - Bulk operations
 * - CRUD operations
 * - Status management
 */
const FeatureFilmGalleryPage: React.FC<FeatureFilmGalleryPageProps> = ({
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
    films,
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
      const failCount = results.length - successCount;
      
      if (failCount === 0) {
        updateToSuccess(loadingId, 'Success!', `${successCount} films deleted successfully`);
      } else {
        updateToError(loadingId, 'Partial Success', `${successCount} films deleted, ${failCount} failed`);
      }
      
      setSelectedFilms([]);
    } catch (error) {
      updateToError(loadingId, 'Error', 'An unexpected error occurred');
    }
  };

  /**
   * Get status badge color
   */
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'draft':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'archived':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default:
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
  };

  /**
   * Get status icon
   */
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published':
        return <CheckCircle className="w-3 h-3" />;
      case 'draft':
        return <AlertCircle className="w-3 h-3" />;
      case 'archived':
        return <Archive className="w-3 h-3" />;
      default:
        return <Film className="w-3 h-3" />;
    }
  };

  /**
   * Format duration
   */
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };


  /**
   * Render film card (grid view)
   */
  const renderFilmCard = (film: FeatureFilm) => (
    <div
      key={film.id}
      className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden hover:bg-white/10 transition-all duration-300 group"
    >
      {/* Film Poster */}
      <div className="relative aspect-[2/3] bg-gradient-to-br from-[#1a1a2e] to-[#16213e] overflow-hidden">
        {film.files?.poster ? (
          <img
            src={film.files.poster.url}
            alt={film.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Film className="w-16 h-16 text-white/30" />
          </div>
        )}
        
        {/* Selection Checkbox */}
        <div className="absolute top-3 left-3">
          <input
            type="checkbox"
            checked={selectedFilms.includes(film.id)}
            onChange={(e) => handleFilmSelection(film.id, e.target.checked)}
            className="w-4 h-4 rounded border-white/20 bg-white/10 text-[#FCB283] focus:ring-[#FCB283] focus:ring-2"
          />
        </div>

        {/* Publication Status Badge */}
        <div className="absolute top-3 right-3">
          <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadgeColor(film.publicationStatus || 'draft')}`}>
            {getStatusIcon(film.publicationStatus || 'draft')}
            <span className="capitalize">{film.publicationStatus === 'public' ? 'Published' : 'Draft'}</span>
          </span>
        </div>

        {/* Featured Badge */}
        {film.featured && (
          <div className="absolute bottom-3 left-3">
            <span className="inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium bg-[#FCB283]/20 text-[#FCB283] border border-[#FCB283]/30">
              <Star className="w-3 h-3" />
              <span>Featured</span>
            </span>
          </div>
        )}

        {/* Action Buttons - Bottom Right */}
        <div className="absolute bottom-3 right-3 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={() => onNavigateToDetail?.(film.id)}
            className="p-2 bg-black/60 backdrop-blur-sm rounded-lg hover:bg-black/80 transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4 text-white" />
          </button>
          <button
            onClick={() => onNavigateToForm?.('edit', film.id)}
            className="p-2 bg-black/60 backdrop-blur-sm rounded-lg hover:bg-black/80 transition-colors"
            title="Edit Movie Data"
          >
            <Edit className="w-4 h-4 text-white" />
          </button>
          <button
            onClick={() => handleDeleteFilm(film.id)}
            className="p-2 bg-red-500/80 backdrop-blur-sm rounded-lg hover:bg-red-500 transition-colors"
            title="Delete Movie"
          >
            <Trash2 className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* Film Info */}
      <div className="p-4">
        <h3 className={`font-semibold text-white mb-2 line-clamp-2 ${getClass('body')}`}>
          {film.title}
        </h3>
        
        {film.titleTh && (
          <p className="text-white/60 text-sm mb-2 line-clamp-1">
            {film.titleTh}
          </p>
        )}

        <div className="flex items-center space-x-4 text-sm text-white/60 mb-3">
          <div className="flex items-center space-x-1">
            <User className="w-4 h-4" />
            <span>{film.director}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="w-4 h-4" />
            <span>{formatDuration(film.duration)}</span>
          </div>
        </div>

        <div className="flex items-center space-x-1 text-sm text-white/60 mb-3">
          <Calendar className="w-4 h-4" />
          <span>{film.releaseYear}</span>
          <span>•</span>
          <span>{film.country}</span>
        </div>

        {/* Genres with Colors */}
        <div className="flex flex-wrap gap-1 mb-3">
          {film.genres.slice(0, 3).map((genre, index) => (
            <span
              key={index}
              className={`px-2 py-1 rounded-full text-xs font-medium border ${getTagColor(genre)}`}
            >
              {genre}
            </span>
          ))}
          {film.genres.length > 3 && (
            <span className="px-2 py-1 bg-white/5 text-white/70 rounded-full text-xs">
              +{film.genres.length - 3}
            </span>
          )}
        </div>

        {/* Logline Preview */}
        <p className="text-white/60 text-sm line-clamp-2 mb-3">
          {film.logline || film.synopsis}
        </p>

      </div>
    </div>
  );

  /**
   * Render film row (list view)
   */
  const renderFilmRow = (film: FeatureFilm) => (
    <div
      key={film.id}
      className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all duration-300 group"
    >
      <div className="flex items-center space-x-4">
        {/* Selection Checkbox */}
        <input
          type="checkbox"
          checked={selectedFilms.includes(film.id)}
          onChange={(e) => handleFilmSelection(film.id, e.target.checked)}
          className="w-4 h-4 rounded border-white/20 bg-white/10 text-[#FCB283] focus:ring-[#FCB283] focus:ring-2"
        />

        {/* Poster Thumbnail */}
        <div className="w-16 h-24 bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-lg overflow-hidden flex-shrink-0">
          {film.files?.poster ? (
            <img
              src={film.files.poster.url}
              alt={film.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Film className="w-6 h-6 text-white/30" />
            </div>
          )}
        </div>

        {/* Film Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className={`font-semibold text-white mb-1 ${getClass('body')}`}>
                {film.title}
              </h3>
              {film.titleTh && (
                <p className="text-white/60 text-sm mb-2">
                  {film.titleTh}
                </p>
              )}
              
              <div className="flex items-center space-x-4 text-sm text-white/60 mb-2">
                <div className="flex items-center space-x-1">
                  <User className="w-4 h-4" />
                  <span>{film.director}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{formatDuration(film.duration)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>{film.releaseYear}</span>
                </div>
                <span>{film.country}</span>
              </div>

              <p className="text-white/60 text-sm line-clamp-2 mb-2">
                {film.logline || film.synopsis}
              </p>

              <div className="flex flex-wrap gap-1">
                {film.genres.slice(0, 4).map((genre, index) => (
                  <span
                    key={index}
                    className={`px-2 py-1 rounded-full text-xs font-medium border ${getTagColor(genre)}`}
                  >
                    {genre}
                  </span>
                ))}
                {film.genres.length > 4 && (
                  <span className="px-2 py-1 bg-white/5 text-white/70 rounded-full text-xs">
                    +{film.genres.length - 4}
                  </span>
                )}
              </div>
            </div>

            {/* Status and Actions */}
            <div className="flex items-center space-x-3 ml-4">
              {/* Featured Badge */}
              {film.featured && (
                <span className="inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium bg-[#FCB283]/20 text-[#FCB283] border border-[#FCB283]/30">
                  <Star className="w-3 h-3" />
                </span>
              )}

              {/* Status Badge */}
              <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadgeColor(film.publicationStatus || 'draft')}`}>
                {getStatusIcon(film.publicationStatus || 'draft')}
                <span className="capitalize">{film.publicationStatus === 'public' ? 'Published' : 'Draft'}</span>
              </span>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onNavigateToDetail?.(film.id)}
                  className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  title="View Details"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onNavigateToForm?.('edit', film.id)}
                  className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  title="Edit Film"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteFilm(film.id)}
                  className="p-2 text-red-400/60 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  title="Delete Film"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-r from-[#FCB283] to-[#AA4626] rounded-xl">
                <Film className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className={`text-2xl font-bold text-white ${getClass('header')}`}>
                  Feature Films Gallery
                </h1>
                <p className={`text-white/70 ${getClass('subtitle')}`}>
                  Manage your feature film collection
                </p>
              </div>
            </div>
            
            <button
              onClick={() => onNavigateToForm?.('create')}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-[#FCB283] to-[#AA4626] text-white rounded-xl font-medium hover:shadow-lg transition-all"
            >
              <Plus className="w-5 h-5" />
              <span>Add New Film</span>
            </button>
          </div>

          {/* Search and Controls */}
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search films by title, director, or genre..."
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:border-[#FCB283] focus:outline-none transition-colors"
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center space-x-2 px-4 py-3 rounded-xl font-medium transition-all ${
                showFilters 
                  ? 'bg-[#FCB283] text-white' 
                  : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
              }`}
            >
              <Filter className="w-5 h-5" />
              <span>Filters</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>

            {/* View Toggle */}
            <div className="flex bg-white/10 rounded-xl p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all ${
                  viewMode === 'grid' 
                    ? 'bg-[#FCB283] text-white' 
                    : 'text-white/70 hover:text-white'
                }`}
              >
                <Grid className="w-4 h-4" />
                <span>Grid</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all ${
                  viewMode === 'list' 
                    ? 'bg-[#FCB283] text-white' 
                    : 'text-white/70 hover:text-white'
                }`}
              >
                <List className="w-4 h-4" />
                <span>List</span>
              </button>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">Status</label>
                  <select
                    value={filters.status || 'all'}
                    onChange={(e) => handleStatusFilter(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:border-[#FCB283] focus:outline-none"
                  >
                    <option value="all" className="bg-[#1a1a2e] text-white">All Status</option>
                    <option value="draft" className="bg-[#1a1a2e] text-white">Draft</option>
                    <option value="published" className="bg-[#1a1a2e] text-white">Published</option>
                    <option value="archived" className="bg-[#1a1a2e] text-white">Archived</option>
                  </select>
                </div>

                {/* Sort By */}
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">Sort By</label>
                  <select
                    value={filters.sortBy || 'createdAt'}
                    onChange={(e) => handleFilterChange({ sortBy: e.target.value as any })}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:border-[#FCB283] focus:outline-none"
                  >
                    <option value="createdAt" className="bg-[#1a1a2e] text-white">Date Created</option>
                    <option value="title" className="bg-[#1a1a2e] text-white">Title</option>
                    <option value="releaseYear" className="bg-[#1a1a2e] text-white">Release Year</option>
                    <option value="duration" className="bg-[#1a1a2e] text-white">Duration</option>
                  </select>
                </div>

                {/* Sort Order */}
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">Order</label>
                  <select
                    value={filters.sortOrder || 'desc'}
                    onChange={(e) => handleFilterChange({ sortOrder: e.target.value as any })}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:border-[#FCB283] focus:outline-none"
                  >
                    <option value="desc" className="bg-[#1a1a2e] text-white">Descending</option>
                    <option value="asc" className="bg-[#1a1a2e] text-white">Ascending</option>
                  </select>
                </div>

                {/* Featured Filter */}
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">Featured</label>
                  <select
                    value={filters.featured === undefined ? 'all' : filters.featured.toString()}
                    onChange={(e) => {
                      const value = e.target.value;
                      handleFilterChange({ 
                        featured: value === 'all' ? undefined : value === 'true' 
                      });
                    }}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:border-[#FCB283] focus:outline-none"
                  >
                    <option value="all" className="bg-[#1a1a2e] text-white">All Films</option>
                    <option value="true" className="bg-[#1a1a2e] text-white">Featured Only</option>
                    <option value="false" className="bg-[#1a1a2e] text-white">Not Featured</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bulk Actions */}
        {selectedFilms.length > 0 && (
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-white/90">
                  {selectedFilms.length} film{selectedFilms.length !== 1 ? 's' : ''} selected
                </span>
                <button
                  onClick={handleSelectAll}
                  className="text-[#FCB283] hover:text-[#FCB283]/80 transition-colors"
                >
                  {selectedFilms.length === films.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleBulkDelete}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Selected</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Films Grid/List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FCB283] mx-auto mb-4"></div>
              <p className="text-white/70">Loading films...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-500/20 border border-red-500/30 rounded-2xl p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-400 mb-2">Error Loading Films</h3>
            <p className="text-red-300 mb-4">{error}</p>
            <button
              onClick={refetch}
              className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : films.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-12 text-center">
            <Film className="w-16 h-16 text-white/30 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Films Found</h3>
            <p className="text-white/60 mb-6">
              {searchTerm ? 'No films match your search criteria.' : 'Get started by adding your first feature film.'}
            </p>
            <button
              onClick={() => onNavigateToForm?.('create')}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-[#FCB283] to-[#AA4626] text-white rounded-xl font-medium hover:shadow-lg transition-all mx-auto"
            >
              <Plus className="w-5 h-5" />
              <span>Add First Film</span>
            </button>
          </div>
        ) : (
          <>
            {/* Films Display */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                {films.map(renderFilmCard)}
              </div>
            ) : (
              <div className="space-y-4 mb-8">
                {films.map(renderFilmRow)}
              </div>
            )}

            {/* Load More Button */}
            {hasMore && (
              <div className="text-center">
                <button
                  onClick={loadMore}
                  className="px-6 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors"
                >
                  Load More Films
                </button>
              </div>
            )}

            {/* Results Summary */}
            <div className="mt-8 text-center text-white/60">
              <p>
                Showing {films.length} of {totalCount} films
                {searchTerm && ` for "${searchTerm}"`}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FeatureFilmGalleryPage;
