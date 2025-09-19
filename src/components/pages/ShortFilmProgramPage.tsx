import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Search,
  Filter,
  List,
  Film,
  Clock,
  Globe,
  ChevronDown,
  Calendar,
  Users,
  Hash
} from 'lucide-react';
import { useTypography } from '../../utils/typography';
import { SubmissionProgramEntry, SubmissionProgramGroup, SubmissionProgramFilters, SubmissionProgramService } from '../../services/submissionProgramService';
import { getCountryFlag } from '../../utils/flagsAndEmojis';

/**
 * Short Film Program Page
 * 
 * Displays short film programs in table format grouped by program with posters.
 * Features:
 * - Program-based grouping (Program I, II, III, IV)
 * - Table view with poster column
 * - Search and filtering capabilities
 * - Responsive design with FX colors and fonts
 */
const ShortFilmProgramPage: React.FC = () => {
  const { t } = useTranslation();
  const { getClass } = useTypography();

  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedProgram, setSelectedProgram] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [programGroups, setProgramGroups] = useState<SubmissionProgramGroup[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [programs, setPrograms] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [dataLoadError, setDataLoadError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Load data from service with improved error handling and retry logic
  useEffect(() => {
    const loadData = async () => {
      // Don't show loading state immediately on initial load to prevent flash
      if (!initialLoad) {
        setLoading(true);
      }
      
      setDataLoadError(null);
      
      try {
        const filters: SubmissionProgramFilters = {
          searchTerm: searchTerm.trim() || undefined,
          category: selectedCategory || undefined,
          country: selectedCountry || undefined,
          program: selectedProgram || undefined
        };
        
        console.log(`🎬 Loading program data with filters (attempt ${retryCount + 1}):`, filters);
        
        // Add minimum loading time for initial load to prevent flash
        const minLoadTime = initialLoad ? 800 : 0;
        const startTime = Date.now();
        
        const [groupsData, categoriesData, countriesData, programsData] = await Promise.all([
          SubmissionProgramService.getFilteredProgramGroups(filters),
          SubmissionProgramService.getUniqueCategories(),
          SubmissionProgramService.getUniqueCountries(),
          SubmissionProgramService.getUniquePrograms()
        ]);
        
        // Ensure minimum loading time has passed for initial load
        if (initialLoad) {
          const elapsedTime = Date.now() - startTime;
          if (elapsedTime < minLoadTime) {
            await new Promise(resolve => setTimeout(resolve, minLoadTime - elapsedTime));
          }
        }
        
        console.log('📊 Successfully loaded program data:');
        console.log(`  - Program groups: ${groupsData.length}`);
        console.log(`  - Categories: ${categoriesData.length}`);
        console.log(`  - Countries: ${countriesData.length}`);
        console.log(`  - Programs: ${programsData.length}`);
        
        setProgramGroups(groupsData);
        setCategories(categoriesData);
        setCountries(countriesData);
        setPrograms(programsData);
        
        // Reset retry count on successful load
        setRetryCount(0);
        setDataLoadError(null);
        
        // Check if we got real data or mock data
        const hasRealData = groupsData.some(group => 
          group.films.some(film => !film.id.startsWith('mock-'))
        );
        
        if (!hasRealData && groupsData.length > 0) {
          console.warn('⚠️ Loaded data appears to be mock data - this may indicate database connectivity issues');
          setDataLoadError('Using sample data - some features may be limited');
        }
        
      } catch (error) {
        console.error(`❌ Error loading program data (attempt ${retryCount + 1}):`, error);
        setDataLoadError(error instanceof Error ? error.message : 'Failed to load program data');
        
        // Implement retry logic for failed loads
        if (retryCount < 2) { // Max 3 attempts total
          console.log(`🔄 Retrying data load in ${(retryCount + 1) * 2} seconds...`);
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, (retryCount + 1) * 2000); // 2s, 4s delays
          return; // Don't set loading to false yet
        }
        
        // Final fallback: Try to load basic program groups without filters
        try {
          console.log('🔄 Attempting final fallback data load...');
          const fallbackGroups = await SubmissionProgramService.getSubmissionProgramGroups();
          console.log('🎭 Loaded fallback program groups:', fallbackGroups.length);
          setProgramGroups(fallbackGroups);
          
          // Also try to load basic filter options
          const [fallbackCategories, fallbackCountries, fallbackPrograms] = await Promise.allSettled([
            SubmissionProgramService.getUniqueCategories(),
            SubmissionProgramService.getUniqueCountries(),
            SubmissionProgramService.getUniquePrograms()
          ]);
          
          if (fallbackCategories.status === 'fulfilled') setCategories(fallbackCategories.value);
          if (fallbackCountries.status === 'fulfilled') setCountries(fallbackCountries.value);
          if (fallbackPrograms.status === 'fulfilled') setPrograms(fallbackPrograms.value);
          
          setDataLoadError('Using fallback data - some features may be limited');
          
        } catch (fallbackError) {
          console.error('❌ Final fallback data load also failed:', fallbackError);
          setDataLoadError('Unable to load program data. Please check your connection and try again.');
        }
      } finally {
        setLoading(false);
        if (initialLoad) {
          setInitialLoad(false);
        }
      }
    };

    loadData();
  }, [searchTerm, selectedCategory, selectedCountry, selectedProgram, retryCount]);

  // Handle anchor scrolling after data loads
  useEffect(() => {
    if (!loading && programGroups.length > 0) {
      // Check if there's a hash in the URL for anchor scrolling
      const hash = window.location.hash;
      if (hash && hash.includes('program-')) {
        // Extract the program anchor from the hash
        const anchorMatch = hash.match(/#program-[a-d]/);
        if (anchorMatch) {
          const anchorId = anchorMatch[0].substring(1); // Remove the #
          setTimeout(() => {
            const element = document.getElementById(anchorId);
            if (element) {
              element.scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
              });
            }
          }, 100); // Small delay to ensure DOM is ready
        }
      }
    }
  }, [loading, programGroups]);

  /**
   * Get total count of filtered films
   */
  const totalFilteredFilms = useMemo(() => {
    return programGroups.reduce((total: number, group: SubmissionProgramGroup) => total + group.count, 0);
  }, [programGroups]);

  /**
   * Get category color
   */
  const getCategoryColor = (category: string): string => {
    switch (category) {
      case 'Youth Competition': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'Future Competition': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'World Competition': return 'bg-green-500/20 text-green-300 border-green-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  /**
   * Get program color
   */
  const getProgramColor = (program: string): string => {
    switch (program) {
      case 'Program I': return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'Program II': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'Program III': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'Program IV': return 'bg-pink-500/20 text-pink-300 border-pink-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  return (
    <div className="min-h-screen bg-[#110D16] pt-16 sm:pt-20">
      {/* Header Section */}
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="text-center">
            {/* Official Selection Logo */}
            <img 
              src="https://firebasestorage.googleapis.com/v0/b/cifan-c41c6.firebasestorage.app/o/site_files%2Ffest_logos%2FT4%404x.png?alt=media&token=4b606f45-6165-4486-951b-4e4ccb0bdb23"
              alt="Official Selection"
              className="h-12 sm:h-16 md:h-20 lg:h-24 xl:h-28 w-auto mx-auto mb-4 sm:mb-6 filter brightness-0 invert opacity-90"
            />
            
            {/* Heading */}
            <h1 className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-2 leading-tight ${getClass('header')}`}>
              Short Film Programs
            </h1>
            <h2 className={`text-xl sm:text-2xl md:text-3xl text-[#FCB283] font-semibold ${getClass('subtitle')}`}>
              2025
            </h2>
            <p className="text-white/70 mt-3 sm:mt-4 max-w-2xl mx-auto text-sm sm:text-base px-4">
              Explore our curated short film programs featuring exceptional works from Youth, Future, and World competitions.
            </p>
          </div>
        </div>
      </div>

      {/* Controls Section */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="border border-white/20 rounded-2xl p-6 mb-8">
          {/* Search and Filters Toggle */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60" />
              <input
                type="text"
                placeholder="Search films, directors, or countries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-[#FCB283] focus:border-transparent"
              />
            </div>

            {/* View Mode Indicator */}
            <div className="flex bg-white/10 rounded-xl p-1">
              <div className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-[#FCB283] text-[#1a1a2e]">
                <List className="w-4 h-4" />
                <span>Table View</span>
              </div>
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
            <div className="border-t border-white/10 pt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Category Filter */}
              <div>
                <label className="block text-white/70 text-sm font-medium mb-2">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#FCB283]"
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              {/* Country Filter */}
              <div>
                <label className="block text-white/70 text-sm font-medium mb-2">Country</label>
                <select
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#FCB283]"
                >
                  <option value="">All Countries</option>
                  {countries.map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              </div>

              {/* Program Filter */}
              <div>
                <label className="block text-white/70 text-sm font-medium mb-2">Program</label>
                <select
                  value={selectedProgram}
                  onChange={(e) => setSelectedProgram(e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#FCB283]"
                >
                  <option value="">All Programs</option>
                  {programs.map(program => (
                    <option key={program} value={program}>{program}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Results Count */}
          <div className="mt-4 text-white/60 text-sm">
            {totalFilteredFilms === 1 
              ? `1 film`
              : `${totalFilteredFilms} films`
            }
            {searchTerm && ` matching "${searchTerm}"`}
          </div>
        </div>

        {/* Error Message */}
        {dataLoadError && (
          <div className="mb-8 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
              <p className="text-yellow-200 text-sm">
                {dataLoadError}
              </p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && initialLoad ? (
          <div className="text-center py-16">
            <div className="loading-spinner mx-auto mb-4"></div>
            <h3 className="text-xl font-semibold text-white/70 mb-2">
              Loading Short Film Programs
            </h3>
            <p className="text-white/50">
              Please wait while we fetch the latest program data...
            </p>
          </div>
        ) : loading && !initialLoad ? (
          <div className="text-center py-8">
            <div className="loading-spinner small mx-auto mb-2"></div>
            <p className="text-white/60 text-sm">
              Updating results...
            </p>
          </div>
        ) : programGroups.length > 0 ? (
          <div className="space-y-12">
            {programGroups.map((group) => (
              <div key={group.program} id={`program-${group.program.toLowerCase()}`} className="glass-container rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-12">
                {/* Program Header */}
                <div className="text-center mb-8 sm:mb-12">
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
                    <h2 className={`text-2xl sm:text-3xl md:text-4xl font-bold text-white ${getClass('header')}`}>
                      Program {group.program}
                    </h2>
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getProgramColor(group.programTitle)}`}>
                        <Hash className="w-4 h-4 mr-1" />
                        {group.count} {group.count === 1 ? 'film' : 'films'}
                      </span>
                      <span className="text-white/70 text-sm">
                        Total: {SubmissionProgramService.formatTotalRuntime(group.totalRuntime)}
                      </span>
                    </div>
                  </div>
                  
                  {/* Two Screening Dates */}
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8">
                    {/* First Screening */}
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 text-[#FCB283] text-lg font-medium">
                        <Calendar className="w-5 h-5" />
                        <span>{group.screeningDate1}</span>
                      </div>
                      <div className="text-white/60 text-sm mt-1">
                        {group.screeningTime1}
                      </div>
                    </div>
                    
                    {/* Separator */}
                    <div className="hidden sm:block w-px h-12 bg-white/20"></div>
                    <div className="sm:hidden w-12 h-px bg-white/20"></div>
                    
                    {/* Second Screening */}
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 text-[#FCB283] text-lg font-medium">
                        <Calendar className="w-5 h-5" />
                        <span>{group.screeningDate2}</span>
                      </div>
                      <div className="text-white/60 text-sm mt-1">
                        {group.screeningTime2}
                      </div>
                    </div>
                  </div>
                  
                  {/* Venue Information */}
                  <div className="text-center mt-4">
                    <div className="text-white/70 text-sm">
                      <span className="font-medium">Venue:</span> {group.venue}
                    </div>
                  </div>
                </div>

                {/* Films Table */}
                <div className="bg-white/5 rounded-xl border border-white/10 short-film-program-container">
                  {/* Mobile-responsive table container */}
                  <div className="short-film-program-table-wrapper">
                    <div className="short-film-program-table-inner">
                      <table className="w-full min-w-full">
                      <thead className="bg-white/10">
                        <tr>
                          <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                            <span className="hidden sm:inline">Poster</span>
                            <span className="sm:hidden">Image</span>
                          </th>
                          <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                            Title
                          </th>
                          <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-medium text-white/70 uppercase tracking-wider hidden sm:table-cell">
                            Country
                          </th>
                          <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-medium text-white/70 uppercase tracking-wider hidden md:table-cell">
                            Filmmaker
                          </th>
                          <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-medium text-white/70 uppercase tracking-wider hidden lg:table-cell">
                            Category
                          </th>
                          <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                            Runtime
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10">
                        {group.films.map((film, index) => (
                          <tr key={`${film.screeningProgram}-${index}`} className="hover:bg-white/5 transition-colors">
                            {/* Poster Column */}
                            <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                              <div className="w-8 h-10 sm:w-10 sm:h-12 md:w-12 md:h-16 bg-gradient-to-br from-[#2a2a3e] to-[#1a1a2e] rounded flex items-center justify-center flex-shrink-0">
                                <img
                                  src={SubmissionProgramService.getPosterUrl(film)}
                                  alt={`${film.filmTitle} poster`}
                                  className="w-full h-full object-cover rounded"
                                />
                              </div>
                            </td>
                            
                            {/* Title Column */}
                            <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                              <div className="text-white font-medium text-sm sm:text-base">
                                <div className="line-clamp-2 sm:line-clamp-1">
                                  {film.filmTitle}
                                </div>
                                {/* Mobile: Show country and filmmaker below title */}
                                <div className="sm:hidden mt-1 space-y-1">
                                  <div className="flex items-center text-xs text-white/60">
                                    <span className="text-sm mr-1">{getCountryFlag(film.country)}</span>
                                    <span>{film.country}</span>
                                  </div>
                                  <div className="text-xs text-white/60 line-clamp-1">
                                    {film.filmmaker}
                                  </div>
                                </div>
                              </div>
                            </td>
                            
                            {/* Country Column - Hidden on mobile */}
                            <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-white/70 text-sm hidden sm:table-cell">
                              <div className="flex items-center">
                                <span className="text-lg mr-2">{getCountryFlag(film.country)}</span>
                                <span className="line-clamp-1">{film.country}</span>
                              </div>
                            </td>
                            
                            {/* Filmmaker Column - Hidden on mobile and tablet */}
                            <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-white/70 text-sm hidden md:table-cell">
                              <div className="line-clamp-2">
                                {film.filmmaker}
                              </div>
                            </td>
                            
                            {/* Category Column - Hidden on mobile and small tablet */}
                            <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 hidden lg:table-cell">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getCategoryColor(film.category)}`}>
                                <span className="line-clamp-1">{film.category}</span>
                              </span>
                            </td>
                            
                            {/* Runtime Column */}
                            <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-white/70">
                              <div className="flex items-center text-sm">
                                <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                                <span className="whitespace-nowrap">{SubmissionProgramService.formatDuration(film.duration)}</span>
                              </div>
                              {/* Mobile: Show category below runtime */}
                              <div className="lg:hidden mt-1">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getCategoryColor(film.category)}`}>
                                  <span className="line-clamp-1">{film.category}</span>
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      </table>
                    </div>
                  </div>
                </div>
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
              {searchTerm || selectedCategory || selectedCountry || selectedProgram 
                ? 'Try adjusting your search or filters'
                : 'No films are currently available'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShortFilmProgramPage;
