import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Search,
  Filter,
  Grid3X3,
  List,
  Film,
  Clock,
  Users,
  AlertCircle,
  Loader2,
  ChevronDown,
  Eye,
  Calendar,
  Globe
} from 'lucide-react';
import { useTypography } from '../../utils/typography';
import { ShortFilmSubmission, ViewMode, CategoryGroup } from '../../types/shortFilm.types';
import { useAcceptedSubmissionsByCategory } from '../../services/shortFilmService';
import { getCountryFlag } from '../../utils/flagsAndEmojis';

/**
 * Selected Short Films Page
 * 
 * Displays accepted short film submissions grouped by category with gallery and table view options.
 * Features:
 * - Category-based grouping (Youth, Future, World)
 * - Gallery and Table view modes
 * - Search and filtering capabilities
 * - Responsive design with FX colors and fonts
 */
const SelectedShortFilmsPage: React.FC = () => {
  const { t } = useTranslation();
  const { getClass } = useTypography();

  // State management
  const [viewMode, setViewMode] = useState<ViewMode>('gallery');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedFormat, setSelectedFormat] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  // Fetch data using the hook
  const { categoryGroups, loading, error } = useAcceptedSubmissionsByCategory();

  /**
   * Filter category groups based on search and filters
   */
  const filteredCategoryGroups = useMemo(() => {
    if (!categoryGroups) return [];

    return categoryGroups.map(group => {
      let filteredFilms = group.films;

      // Apply search filter
      if (searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase();
        filteredFilms = filteredFilms.filter(film => 
          film.filmTitle.toLowerCase().includes(searchLower) ||
          (film.filmTitleTh && film.filmTitleTh.toLowerCase().includes(searchLower)) ||
          film.submitterName.toLowerCase().includes(searchLower) ||
          film.synopsis.toLowerCase().includes(searchLower) ||
          film.genres.some(genre => genre.toLowerCase().includes(searchLower))
        );
      }

      // Apply category filter
      if (selectedCategory && selectedCategory !== 'all') {
        if (group.category !== selectedCategory) {
          filteredFilms = [];
        }
      }

      // Apply format filter
      if (selectedFormat && selectedFormat !== 'all') {
        filteredFilms = filteredFilms.filter(film => film.format === selectedFormat);
      }

      return {
        ...group,
        films: filteredFilms,
        count: filteredFilms.length
      };
    }).filter(group => group.count > 0); // Only show groups with films
  }, [categoryGroups, searchTerm, selectedCategory, selectedFormat]);

  /**
   * Get total count of filtered films
   */
  const totalFilteredFilms = useMemo(() => {
    return filteredCategoryGroups.reduce((total, group) => total + group.count, 0);
  }, [filteredCategoryGroups]);

  /**
   * Get poster URL for a film
   */
  const getPosterUrl = (film: ShortFilmSubmission): string | null => {
    return film.files?.posterFile?.url || null;
  };

  /**
   * Format duration in minutes to readable format
   */
  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  /**
   * Get category display name
   */
  const getCategoryDisplayName = (category: string): string => {
    switch (category) {
      case 'youth': return 'Youth Competition';
      case 'future': return 'Future Competition';
      case 'world': return 'World Competition';
      default: return category;
    }
  };

  /**
   * Get category color
   */
  const getCategoryColor = (category: string): string => {
    switch (category) {
      case 'youth': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'future': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'world': return 'bg-green-500/20 text-green-300 border-green-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  /**
   * Get competition logo for category
   */
  const getCategoryLogo = (category: string): string => {
    switch (category) {
      case 'youth': return 'https://firebasestorage.googleapis.com/v0/b/cifan-c41c6.firebasestorage.app/o/site_files%2Ffest_logos%2FGroup%202.png?alt=media&token=e8be419f-f0b2-4f64-8d7f-c3e8532e2689';
      case 'future': return 'https://firebasestorage.googleapis.com/v0/b/cifan-c41c6.firebasestorage.app/o/site_files%2Ffest_logos%2FGroup%203.png?alt=media&token=b66cd708-0dc3-4c05-bc56-b2f99a384287';
      case 'world': return 'https://firebasestorage.googleapis.com/v0/b/cifan-c41c6.firebasestorage.app/o/site_files%2Ffest_logos%2FGroup%204.png?alt=media&token=84ad0256-2322-4999-8e9f-d2f30c7afa67';
      default: return '';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#FCB283] animate-spin mx-auto mb-4" />
          <p className="text-white/70">Loading selected short films...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] pt-16 sm:pt-20">
        {/* Header Section */}
        <div className="border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 py-12">
            <div className="text-center">
              {/* Official Selection Logo */}
              <img 
                src="https://firebasestorage.googleapis.com/v0/b/cifan-c41c6.firebasestorage.app/o/site_files%2Ffest_logos%2FT4%404x.png?alt=media&token=4b606f45-6165-4486-951b-4e4ccb0bdb23"
                alt="Official Selection"
                className="h-16 sm:h-20 md:h-24 lg:h-28 w-auto mx-auto mb-6 filter brightness-0 invert opacity-90"
              />
              
              {/* Heading */}
              <h1 className={`text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-2 ${getClass('header')}`}>
                Selected Short Films
              </h1>
              <h2 className={`text-2xl md:text-3xl text-[#FCB283] font-semibold ${getClass('subtitle')}`}>
                2025
              </h2>
            </div>
          </div>
        </div>

        {/* Error Content */}
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="text-center">
            <div className="bg-amber-500/20 border border-amber-500/30 rounded-2xl p-8 max-w-2xl mx-auto">
              <AlertCircle className="w-16 h-16 text-amber-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-amber-400 mb-4">Selection Process Underway</h3>
              <p className="text-amber-300 mb-6">
                The film selection process is currently in progress. Selected short films will be announced soon.
              </p>
              <p className="text-white/70 text-sm">
                Please check back later to see the official selection of short films for the 2025 festival.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="selected-short-films" className="min-h-screen bg-[#110D16] pt-16 sm:pt-20">
      {/* Header Section */}
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="text-center">
            {/* Official Selection Logo */}
            <img 
              src="https://firebasestorage.googleapis.com/v0/b/cifan-c41c6.firebasestorage.app/o/site_files%2Ffest_logos%2FT4%404x.png?alt=media&token=4b606f45-6165-4486-951b-4e4ccb0bdb23"
              alt="Official Selection"
              className="h-16 sm:h-20 md:h-24 lg:h-28 w-auto mx-auto mb-6 filter brightness-0 invert opacity-90"
            />
            
            {/* Heading */}
            <h1 className={`text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-2 ${getClass('header')}`}>
              Selected Short Films
            </h1>
            <h2 className={`text-2xl md:text-3xl text-[#FCB283] font-semibold ${getClass('subtitle')}`}>
              2025
            </h2>
            <p className="text-white/70 mt-4 max-w-2xl mx-auto">
              Discover the exceptional short films selected for this year's festival, 
              showcasing emerging talent across Youth, Future, and World competitions.
            </p>
          </div>
        </div>
      </div>

      {/* Controls Section */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="border border-white/20 rounded-2xl p-6 mb-8">
          {/* Search and View Toggle */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60" />
              <input
                type="text"
                placeholder="Search films, directors, or genres..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-[#FCB283] focus:border-transparent"
              />
            </div>

            {/* View Mode Toggle */}
            <div className="flex bg-white/10 rounded-xl p-1">
              <button
                onClick={() => setViewMode('gallery')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  viewMode === 'gallery' 
                    ? 'bg-[#FCB283] text-[#1a1a2e]' 
                    : 'text-white/70 hover:text-white'
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
                <span>Gallery</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  viewMode === 'table' 
                    ? 'bg-[#FCB283] text-[#1a1a2e]' 
                    : 'text-white/70 hover:text-white'
                }`}
              >
                <List className="w-4 h-4" />
                <span>Table</span>
              </button>
            </div>

            {/* Filters Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white hover:bg-white/20 transition-colors"
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="border-t border-white/10 pt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Category Filter */}
              <div>
                <label className="block text-white/70 text-sm font-medium mb-2">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#FCB283]"
                >
                  <option value="">All Categories</option>
                  <option value="youth">Youth Competition</option>
                  <option value="future">Future Competition</option>
                  <option value="world">World Competition</option>
                </select>
              </div>

              {/* Format Filter */}
              <div>
                <label className="block text-white/70 text-sm font-medium mb-2">Format</label>
                <select
                  value={selectedFormat}
                  onChange={(e) => setSelectedFormat(e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#FCB283]"
                >
                  <option value="">All Formats</option>
                  <option value="live-action">Live Action</option>
                  <option value="animation">Animation</option>
                </select>
              </div>
            </div>
          )}

          {/* Results Count */}
          <div className="mt-4 text-white/60 text-sm">
            {totalFilteredFilms === 1 
              ? `1 selected film`
              : `${totalFilteredFilms} selected films`
            }
            {searchTerm && ` matching "${searchTerm}"`}
          </div>
        </div>

        {/* Content */}
        {filteredCategoryGroups.length > 0 ? (
          <div className="selected-short-films-gallery space-y-12">
            {filteredCategoryGroups.map((group) => (
              <div key={group.category} className="selected-short-films-category-container glass-container rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-12">
                {/* Category Header with Logo */}
                <div className="text-center mb-8 sm:mb-12">
                  {/* Competition Logo */}
                  <div className="flex justify-center mb-6">
                    <img 
                      src={getCategoryLogo(group.category)}
                      alt={`${group.displayName} Logo`}
                      className="h-16 sm:h-20 md:h-24 w-auto object-contain filter drop-shadow-lg"
                    />
                  </div>
                  
                  {/* Category Title and Count */}
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <h2 className={`text-2xl sm:text-3xl md:text-4xl font-bold text-white ${getClass('header')}`}>
                      {group.displayName}
                    </h2>
                    <span className={`px-4 py-2 rounded-full text-sm font-medium border ${getCategoryColor(group.category)}`}>
                      {group.count} {group.count === 1 ? 'film' : 'films'}
                    </span>
                  </div>
                </div>

                {/* Films Display */}
                {viewMode === 'gallery' ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                    {group.films.map((film) => {
                      const posterUrl = getPosterUrl(film);
                      
                      return (
                        <div
                          key={film.id}
                          className="group bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-lg overflow-hidden hover:scale-105 transition-transform duration-300 shadow-lg hover:shadow-2xl border border-white/10"
                        >
                          {/* Poster */}
                          <div className="aspect-[2/3] relative">
                            {posterUrl ? (
                              <img
                                src={posterUrl}
                                alt={film.filmTitle}
                                className="w-full h-full object-cover group-hover:brightness-110 transition-all duration-300"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#2a2a3e] to-[#1a1a2e]">
                                <Film className="w-12 h-12 text-white/30" />
                              </div>
                            )}
                            
                            {/* Overlay with film info */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <div className="absolute bottom-0 left-0 right-0 p-4">
                                <h3 className="text-white font-semibold text-sm mb-1 line-clamp-2">
                                  {film.filmTitle}
                                </h3>
                                <p className="text-white/70 text-xs mb-2">
                                  {film.submitterName}
                                </p>
                                <div className="flex items-center justify-between text-xs text-white/60 mb-1">
                                  <span className="flex items-center">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {formatDuration(film.duration)}
                                  </span>
                                  <span className="capitalize">
                                    {film.format}
                                  </span>
                                </div>
                                {film.nationality && (
                                  <div className="flex items-center text-xs text-white/60">
                                    <span className="text-sm mr-1">{getCountryFlag(film.nationality)}</span>
                                    <span>{film.nationality}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* Table View */
                  <div className="bg-white/5 rounded-xl overflow-hidden border border-white/10">
                    {/* Responsive table container - fixed to show all content */}
                    <div className="relative h-auto min-h-fit overflow-visible">
                      <div className="overflow-x-auto overflow-y-visible">
                        <table className="w-full">
                        <thead className="bg-white/10">
                          <tr>
                            <th className="px-6 py-4 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                              Film
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                              Director
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                              Duration
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                              Format
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                              Genres
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                              Nationality
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                          {group.films.map((film) => (
                            <tr key={film.id} className="hover:bg-white/5 transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex items-center space-x-3">
                                  <div className="w-12 h-16 bg-gradient-to-br from-[#2a2a3e] to-[#1a1a2e] rounded flex items-center justify-center flex-shrink-0">
                                    {getPosterUrl(film) ? (
                                      <img
                                        src={getPosterUrl(film)!}
                                        alt={film.filmTitle}
                                        className="w-full h-full object-cover rounded"
                                      />
                                    ) : (
                                      <Film className="w-4 h-4 text-white/30" />
                                    )}
                                  </div>
                                  <div>
                                    <div className="text-white font-medium">
                                      {film.filmTitle}
                                    </div>
                                    {film.filmTitleTh && (
                                      <div className="text-white/60 text-sm">
                                        {film.filmTitleTh}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-white/70">
                                {film.submitterName}
                              </td>
                              <td className="px-6 py-4 text-white/70">
                                {formatDuration(film.duration)}
                              </td>
                              <td className="px-6 py-4">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#FCB283]/20 text-[#FCB283] capitalize">
                                  {film.format}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-white/70">
                                <div className="flex flex-wrap gap-1">
                                  {film.genres.slice(0, 2).map((genre, index) => (
                                    <span
                                      key={index}
                                      className="inline-flex items-center px-2 py-1 rounded text-xs bg-white/10 text-white/70"
                                    >
                                      {genre}
                                    </span>
                                  ))}
                                  {film.genres.length > 2 && (
                                    <span className="text-white/50 text-xs">
                                      +{film.genres.length - 2}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-white/70 text-sm">
                                {film.nationality ? (
                                  <div className="flex items-center">
                                    <span className="text-lg mr-2">{getCountryFlag(film.nationality)}</span>
                                    <span>{film.nationality}</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center text-white/50">
                                    <Globe className="w-4 h-4 mr-1" />
                                    <span>Not specified</span>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Film className="w-16 h-16 text-white/30 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white/70 mb-2">
              No films found
            </h3>
            <p className="text-white/50">
              {searchTerm || selectedCategory || selectedFormat 
                ? 'Try adjusting your search or filters'
                : 'No films have been selected yet'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SelectedShortFilmsPage;
