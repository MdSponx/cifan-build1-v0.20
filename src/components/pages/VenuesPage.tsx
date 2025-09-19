import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTypography } from '../../utils/typography';
import { Venue } from '../../types/venue.types';
import { venueService } from '../../services/venueService';
import VenueCard from '../ui/VenueCard';
import AnimatedButton from '../ui/AnimatedButton';
import { 
  MapPin, 
  Search,
  Filter,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Building2,
  Theater,
  Landmark
} from 'lucide-react';

const VenuesPage: React.FC = () => {
  const { i18n } = useTranslation();
  const { getClass } = useTypography();
  const currentLanguage = i18n.language as 'en' | 'th';

  // State management
  const [venues, setVenues] = useState<Venue[]>([]);
  const [filteredVenues, setFilteredVenues] = useState<Venue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'cinema' | 'outdoor' | 'cultural'>('all');

  // Content translations
  const content = {
    th: {
      title: 'สถานที่จัดงาน',
      subtitle: 'สำรวจสถานที่ต่างๆ ของเทศกาลภาพยนตร์นานาชาติเชียงใหม่',
      backToHome: 'กลับหน้าหลัก',
      searchPlaceholder: 'ค้นหาสถานที่...',
      filterByType: 'กรองตามประเภท',
      allVenues: 'ทั้งหมด',
      cinemaVenues: 'โรงภาพยนตร์',
      outdoorVenues: 'พื้นที่กลางแจ้ง',
      culturalVenues: 'สถานที่วัฒนธรรม',
      loading: 'กำลังโหลดสถานที่...',
      error: 'ไม่สามารถโหลดสถานที่ได้',
      noVenues: 'ไม่พบสถานที่ที่ตรงกับเงื่อนไข',
      noVenuesDesc: 'ลองปรับเปลี่ยนคำค้นหาหรือตัวกรอง',
      tryAgain: 'ลองใหม่อีกครั้ง',
      clearFilters: 'ล้างตัวกรอง',
      showingResults: 'แสดง',
      of: 'จาก',
      venues: 'สถานที่',
      totalVenues: 'สถานที่ทั้งหมด'
    },
    en: {
      title: 'Festival Venues',
      subtitle: 'Explore the various locations of Chiang Mai International Film Festival',
      backToHome: 'Back to Home',
      searchPlaceholder: 'Search venues...',
      filterByType: 'Filter by type',
      allVenues: 'All Venues',
      cinemaVenues: 'Cinema',
      outdoorVenues: 'Outdoor',
      culturalVenues: 'Cultural',
      loading: 'Loading venues...',
      error: 'Unable to load venues',
      noVenues: 'No venues found',
      noVenuesDesc: 'Try adjusting your search or filters',
      tryAgain: 'Try Again',
      clearFilters: 'Clear Filters',
      showingResults: 'Showing',
      of: 'of',
      venues: 'venues',
      totalVenues: 'Total Venues'
    }
  };

  const currentContent = content[currentLanguage];

  // Available venue types with icons
  const venueTypes = [
    { 
      id: 'all' as const, 
      label: currentContent.allVenues, 
      icon: Building2,
      count: venues.length 
    },
    { 
      id: 'cinema' as const, 
      label: currentContent.cinemaVenues, 
      icon: Theater,
      count: venues.filter(v => v.code === 'majorTheatre7' || v.code === 'majorImax').length
    },
    { 
      id: 'outdoor' as const, 
      label: currentContent.outdoorVenues, 
      icon: MapPin,
      count: venues.filter(v => ['stageZone', 'expoZone', 'market'].includes(v.code)).length
    },
    { 
      id: 'cultural' as const, 
      label: currentContent.culturalVenues, 
      icon: Landmark,
      count: venues.filter(v => v.code === 'anusarn').length
    }
  ];

  // Load venues on component mount
  useEffect(() => {
    loadVenues();
  }, []);

  // Filter venues when dependencies change
  useEffect(() => {
    filterVenues();
  }, [venues, searchTerm, selectedType]);

  const loadVenues = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🏢 VenuesPage: Loading venues...');
      
      // Get all venues from the service
      const allVenues = venueService.getAllVenuesArray();
      
      console.log('✅ VenuesPage: Loaded venues:', {
        count: allVenues.length,
        venues: allVenues.map(v => ({ code: v.code, name: v.nameEn }))
      });
      
      setVenues(allVenues);
      
    } catch (err) {
      console.error('❌ VenuesPage: Error loading venues:', err);
      setError(currentContent.error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterVenues = () => {
    console.log('🔄 VenuesPage: Filtering venues...', {
      totalVenues: venues.length,
      searchTerm,
      selectedType
    });

    let filtered = [...venues];

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const originalLength = filtered.length;
      
      filtered = filtered.filter(venue => {
        const nameEn = venue.nameEn.toLowerCase();
        const nameTh = venue.nameTh.toLowerCase();
        const locationEn = venue.fullLocationEn.toLowerCase();
        const locationTh = venue.fullLocationTh.toLowerCase();
        const notes = venue.notes.toLowerCase();
        
        return nameEn.includes(searchLower) ||
               nameTh.includes(searchLower) ||
               locationEn.includes(searchLower) ||
               locationTh.includes(searchLower) ||
               notes.includes(searchLower);
      });
      
      console.log(`📊 VenuesPage: Search filtering: ${originalLength} → ${filtered.length} venues`);
    }

    // Apply type filter
    if (selectedType !== 'all') {
      const originalLength = filtered.length;
      filtered = venueService.getVenuesByType(selectedType).filter(venue => 
        filtered.some(f => f.id === venue.id)
      );
      
      console.log(`📊 VenuesPage: Type filtering: ${originalLength} → ${filtered.length} venues`);
    }

    // Sort venues by name
    filtered.sort((a, b) => {
      const nameA = currentLanguage === 'th' ? a.nameTh : a.nameEn;
      const nameB = currentLanguage === 'th' ? b.nameTh : b.nameEn;
      return nameA.localeCompare(nameB);
    });

    console.log('✅ VenuesPage: Filtering complete:', {
      totalFiltered: filtered.length,
      venues: filtered.map(v => currentLanguage === 'th' ? v.nameTh : v.nameEn)
    });

    setFilteredVenues(filtered);
  };

  // Handle clear filters
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedType('all');
  };

  // Handle back to home
  const handleBackToHome = () => {
    window.location.hash = '#home';
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#110D16] text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-[#FCB283] mx-auto mb-4" />
            <p className={`${getClass('body')} text-white/60`}>
              {currentContent.loading}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-[#110D16] text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center max-w-md mx-auto">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h1 className={`text-2xl ${getClass('header')} text-white mb-4`}>
              {error}
            </h1>
            <div className="space-y-3">
              <AnimatedButton
                variant="outline"
                size="medium"
                onClick={loadVenues}
              >
                {currentContent.tryAgain}
              </AnimatedButton>
              <AnimatedButton
                variant="primary"
                size="medium"
                onClick={handleBackToHome}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {currentContent.backToHome}
              </AnimatedButton>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#110D16] text-white">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#110D16] to-[#1A1625] py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <AnimatedButton
              variant="outline"
              size="medium"
              onClick={handleBackToHome}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {currentContent.backToHome}
            </AnimatedButton>
          </div>
          
          <div className="text-center max-w-3xl mx-auto">
            <h1 className={`text-4xl sm:text-5xl lg:text-6xl ${getClass('header')} text-white mb-6`}>
              {currentContent.title}
            </h1>
            <p className={`text-lg sm:text-xl ${getClass('body')} text-white/80 mb-8`}>
              {currentContent.subtitle}
            </p>
            
            {/* Stats */}
            <div className="flex items-center justify-center space-x-8">
              <div className="text-center">
                <div className={`text-3xl ${getClass('header')} text-[#FCB283] font-bold`}>
                  {venues.length}
                </div>
                <div className={`text-sm ${getClass('body')} text-white/60`}>
                  {currentContent.totalVenues}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="glass-container rounded-xl p-6 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            
            {/* Search */}
            <div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-5 h-5" />
                <input
                  type="text"
                  placeholder={currentContent.searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:border-[#FCB283] focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Type Filter */}
            <div>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as typeof selectedType)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:border-[#FCB283] focus:outline-none transition-colors appearance-none"
              >
                {venueTypes.map(type => (
                  <option key={type.id} value={type.id} className="bg-[#110D16]">
                    {type.label} ({type.count})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Type Filter Buttons */}
          <div className="flex flex-wrap gap-2 mb-6">
            {venueTypes.map(type => {
              const IconComponent = type.icon;
              return (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  className={`flex items-center px-4 py-2 rounded-full text-sm transition-colors ${
                    selectedType === type.id
                      ? 'bg-[#FCB283] text-white'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  <IconComponent className="w-4 h-4 mr-2" />
                  {type.label}
                  <span className="ml-2 px-2 py-0.5 bg-black/20 rounded-full text-xs">
                    {type.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Results Info */}
          <div className="flex items-center justify-between">
            <div className={`text-sm ${getClass('body')} text-white/60`}>
              {currentContent.showingResults} {filteredVenues.length} {currentContent.of} {venues.length} {currentContent.venues}
            </div>
            {(searchTerm || selectedType !== 'all') && (
              <AnimatedButton
                variant="outline"
                size="small"
                onClick={clearFilters}
              >
                {currentContent.clearFilters}
              </AnimatedButton>
            )}
          </div>
        </div>

        {/* Venues Grid */}
        {filteredVenues.length === 0 ? (
          <div className="text-center py-16">
            <MapPin className="w-16 h-16 text-white/40 mx-auto mb-4" />
            <h3 className={`text-xl ${getClass('header')} text-white mb-2`}>
              {currentContent.noVenues}
            </h3>
            <p className={`${getClass('body')} text-white/60 mb-6`}>
              {currentContent.noVenuesDesc}
            </p>
            {(searchTerm || selectedType !== 'all') && (
              <AnimatedButton
                variant="primary"
                size="medium"
                onClick={clearFilters}
              >
                {currentContent.clearFilters}
              </AnimatedButton>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {filteredVenues.map((venue, index) => (
              <VenueCard
                key={venue.id}
                venue={venue}
                className="animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VenuesPage;
