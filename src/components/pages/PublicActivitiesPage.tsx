import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTypography } from '../../utils/typography';
import { Activity, ActivityFilters } from '../../types/activities';
import { activitiesService } from '../../services/activitiesService';
import { getTagColor } from '../../utils/tagColors';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  Search,
  Filter,
  Loader2,
  AlertCircle,
  ArrowLeft
} from 'lucide-react';
import AnimatedButton from '../ui/AnimatedButton';

const PublicActivitiesPage: React.FC = () => {
  const { i18n } = useTranslation();
  const { getClass } = useTypography();
  const currentLanguage = i18n.language as 'en' | 'th';

  // State management
  const [activities, setActivities] = useState<Activity[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'popularity'>('date');

  // Content translations
  const content = {
    th: {
      title: 'กิจกรรมและอีเวนต์',
      subtitle: 'เข้าร่วมกิจกรรมและเวิร์กช็อปที่น่าสนใจจากเทศกาลภาพยนตร์',
      backToHome: 'กลับหน้าหลัก',
      searchPlaceholder: 'ค้นหากิจกรรม...',
      filterByTags: 'กรองตามแท็ก',
      sortBy: 'เรียงตาม',
      sortByDate: 'วันที่',
      sortByName: 'ชื่อ',
      sortByPopularity: 'ความนิยม',
      allTags: 'ทั้งหมด',
      workshop: 'เวิร์กช็อป',
      screening: 'การฉาย',
      ceremony: 'พิธีการ',
      panel: 'แผงอภิปราย',
      masterclass: 'คลาสพิเศษ',
      networking: 'เครือข่าย',
      participants: 'ผู้เข้าร่วม',
      unlimited: 'ไม่จำกัด',
      available: 'ที่ว่าง',
      full: 'เต็มแล้ว',
      upcoming: 'กำลังจะมาถึง',
      free: 'ฟรี',
      paid: 'เสียค่าใช้จ่าย',
      learnMore: 'เรียนรู้เพิ่มเติม',
      register: 'ลงทะเบียน',
      loading: 'กำลังโหลดกิจกรรม...',
      error: 'ไม่สามารถโหลดกิจกรรมได้',
      noActivities: 'ไม่พบกิจกรรมที่ตรงกับเงื่อนไข',
      noActivitiesDesc: 'ลองปรับเปลี่ยนคำค้นหาหรือตัวกรอง',
      tryAgain: 'ลองใหม่อีกครั้ง',
      clearFilters: 'ล้างตัวกรอง',
      showingResults: 'แสดง',
      of: 'จาก',
      results: 'ผลลัพธ์'
    },
    en: {
      title: 'Activities & Events',
      subtitle: 'Join exciting activities and workshops from the film festival',
      backToHome: 'Back to Home',
      searchPlaceholder: 'Search activities...',
      filterByTags: 'Filter by tags',
      sortBy: 'Sort by',
      sortByDate: 'Date',
      sortByName: 'Name',
      sortByPopularity: 'Popularity',
      allTags: 'All',
      workshop: 'Workshop',
      screening: 'Screening',
      ceremony: 'Ceremony',
      panel: 'Panel',
      masterclass: 'Masterclass',
      networking: 'Networking',
      participants: 'participants',
      unlimited: 'Unlimited',
      available: 'available',
      full: 'Full',
      upcoming: 'Upcoming',
      free: 'Free',
      paid: 'Paid',
      learnMore: 'Learn More',
      register: 'Register',
      loading: 'Loading activities...',
      error: 'Unable to load activities',
      noActivities: 'No activities found',
      noActivitiesDesc: 'Try adjusting your search or filters',
      tryAgain: 'Try Again',
      clearFilters: 'Clear Filters',
      showingResults: 'Showing',
      of: 'of',
      results: 'results'
    }
  };

  const currentContent = content[currentLanguage];

  // Available filter tags
  const availableTags = [
    { id: 'workshop', label: currentContent.workshop },
    { id: 'screening', label: currentContent.screening },
    { id: 'ceremony', label: currentContent.ceremony },
    { id: 'panel', label: currentContent.panel },
    { id: 'masterclass', label: currentContent.masterclass },
    { id: 'networking', label: currentContent.networking }
  ];

  // Load activities on component mount
  useEffect(() => {
    loadActivities();
  }, []);

  // Filter and sort activities when dependencies change
  useEffect(() => {
    filterAndSortActivities();
  }, [activities, searchTerm, selectedTags, sortBy]);

  const loadActivities = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔍 PublicActivitiesPage: Starting to load activities...');
      
      // Get published activities (no need for isPublic = true)
      const filters: ActivityFilters = {
        status: 'published'
      };
      
      console.log('🔍 PublicActivitiesPage: Using filters:', filters);
      console.log('🔍 PublicActivitiesPage: Calling activitiesService.getActivities...');
      
      const response = await activitiesService.getActivities(filters, undefined, 1, 100);
      
      console.log('✅ PublicActivitiesPage: Service response:', {
        activitiesCount: response.activities.length,
        total: response.total,
        page: response.page,
        totalPages: response.totalPages
      });
      
      setActivities(response.activities);
      
      console.log('✅ Loaded activities:', response.activities.length, 'published activities');
      if (response.activities.length === 0) {
        console.log('⚠️ No published activities found in database');
      }
    } catch (err) {
      console.error('❌ PublicActivitiesPage: Error loading activities:', err);
      console.error('❌ Error details:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        code: (err as any)?.code,
        stack: err instanceof Error ? err.stack : undefined
      });
      setError(currentContent.error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterAndSortActivities = () => {
    let filtered = [...activities];

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(activity =>
        activity.name.toLowerCase().includes(searchLower) ||
        activity.shortDescription.toLowerCase().includes(searchLower) ||
        activity.description.toLowerCase().includes(searchLower) ||
        activity.venueName.toLowerCase().includes(searchLower) ||
        activity.organizers.some(org => org.toLowerCase().includes(searchLower))
      );
    }

    // Apply tag filters
    if (selectedTags.length > 0) {
      filtered = filtered.filter(activity =>
        selectedTags.some(tag => activity.tags.includes(tag))
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'popularity':
          return (b.views || 0) - (a.views || 0);
        case 'date':
        default:
          // Sort by eventDate first, then by startTime for same dates
          const dateComparison = a.eventDate.localeCompare(b.eventDate);
          if (dateComparison !== 0) {
            return dateComparison; // Different dates, sort by date
          }
          
          // Same date, sort by start time
          return a.startTime.localeCompare(b.startTime);
      }
    });

    setFilteredActivities(filtered);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(currentLanguage === 'th' ? 'th-TH' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Format time for display
  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5);
  };

  // Check if activity has available spots
  const getAvailabilityInfo = (activity: Activity) => {
    if (activity.maxParticipants === 0) {
      return { status: 'unlimited', text: currentContent.unlimited, color: 'text-green-400' };
    }
    
    const registered = activity.registeredParticipants || 0;
    const available = activity.maxParticipants - registered;
    
    if (available <= 0) {
      return { status: 'full', text: currentContent.full, color: 'text-red-400' };
    }
    
    return { 
      status: 'available', 
      text: `${available} ${currentContent.available}`, 
      color: 'text-green-400' 
    };
  };

  // Handle tag toggle
  const toggleTag = (tagId: string) => {
    setSelectedTags(prev =>
      prev.includes(tagId)
        ? prev.filter(t => t !== tagId)
        : [...prev, tagId]
    );
  };

  // Handle clear filters
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedTags([]);
  };

  // Group activities by date for schedule view
  const groupActivitiesByDate = (activities: Activity[]) => {
    const grouped: { [key: string]: Activity[] } = {};
    
    activities.forEach(activity => {
      // Use the original ISO date string as the key for proper sorting
      const dateKey = activity.eventDate;
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(activity);
    });
    
    // Sort activities within each date by start time
    Object.keys(grouped).forEach(dateKey => {
      grouped[dateKey].sort((a, b) => a.startTime.localeCompare(b.startTime));
    });
    
    return grouped;
  };

  // Format date for schedule view
  const formatScheduleDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      day: date.getDate(),
      month: date.toLocaleDateString(currentLanguage === 'th' ? 'th-TH' : 'en-US', { month: 'short' }),
      weekday: date.toLocaleDateString(currentLanguage === 'th' ? 'th-TH' : 'en-US', { weekday: 'long' }),
      year: date.getFullYear()
    };
  };

  // Handle activity click
  const handleActivityClick = (activityId: string) => {
    window.location.hash = `#activity/${activityId}`;
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
                onClick={loadActivities}
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
            <p className={`text-lg sm:text-xl ${getClass('body')} text-white/80`}>
              {currentContent.subtitle}
            </p>
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="glass-container rounded-xl p-6 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Search */}
            <div className="lg:col-span-2">
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

            {/* Sort */}
            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'date' | 'name' | 'popularity')}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:border-[#FCB283] focus:outline-none transition-colors appearance-none"
              >
                <option value="date" className="bg-[#110D16]">{currentContent.sortByDate}</option>
                <option value="name" className="bg-[#110D16]">{currentContent.sortByName}</option>
                <option value="popularity" className="bg-[#110D16]">{currentContent.sortByPopularity}</option>
              </select>
            </div>
          </div>

          {/* Tag Filters */}
          <div className="mt-6">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedTags([])}
                className={`px-4 py-2 rounded-full text-sm transition-colors ${
                  selectedTags.length === 0
                    ? 'bg-[#FCB283] text-white'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                {currentContent.allTags}
              </button>
              {availableTags.map(tag => (
                <button
                  key={tag.id}
                  onClick={() => toggleTag(tag.id)}
                  className={`px-4 py-2 rounded-full text-sm transition-colors ${
                    selectedTags.includes(tag.id)
                      ? 'bg-[#FCB283] text-white'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  {tag.label}
                </button>
              ))}
            </div>
          </div>

          {/* Results Info */}
          <div className="mt-6 flex items-center justify-between">
            <div className={`text-sm ${getClass('body')} text-white/60`}>
              {currentContent.showingResults} {filteredActivities.length} {currentContent.of} {activities.length} {currentContent.results}
            </div>
            {(searchTerm || selectedTags.length > 0) && (
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

        {/* Activities Display */}
        {filteredActivities.length === 0 ? (
          <div className="text-center py-16">
            <Calendar className="w-16 h-16 text-white/40 mx-auto mb-4" />
            <h3 className={`text-xl ${getClass('header')} text-white mb-2`}>
              {currentContent.noActivities}
            </h3>
            <p className={`${getClass('body')} text-white/60 mb-6`}>
              {currentContent.noActivitiesDesc}
            </p>
            {(searchTerm || selectedTags.length > 0) && (
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
          /* Schedule View - Now the only view */
          <div className="space-y-6">
            {Object.entries(groupActivitiesByDate(filteredActivities))
              .sort(([a], [b]) => {
                // Sort by ISO date strings directly (already in YYYY-MM-DD format)
                return a.localeCompare(b);
              })
              .map(([dateString, dayActivities], dateIndex) => {
                const scheduleDate = formatScheduleDate(dateString);
                
                return (
                  <div key={dateString} className="space-y-4">
                    {dayActivities.map((activity, activityIndex) => {
                      const availability = getAvailabilityInfo(activity);
                      const isFree = activity.tags.includes('free');
                      
                      return (
                        <div
                          key={activity.id}
                          className="group cursor-pointer"
                          onClick={() => handleActivityClick(activity.id)}
                          style={{ animationDelay: `${(dateIndex * dayActivities.length + activityIndex) * 50}ms` }}
                        >
                          <div className="glass-container rounded-xl p-6 hover:bg-white/10 transition-all duration-300 border border-white/10 hover:border-[#FCB283]/30 relative">
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
                              
                              {/* Date and Time Column */}
                              <div className="lg:col-span-2 flex flex-col items-center justify-center text-center">
                                {/* Large Date Number */}
                                <div className={`text-5xl sm:text-6xl lg:text-7xl ${getClass('header')} text-[#FCB283] font-bold leading-none mb-2`}>
                                  {scheduleDate.day}
                                </div>
                                
                                {/* Date Details */}
                                <div className="flex flex-col items-center space-y-1 mb-4">
                                  <div className={`text-sm sm:text-base ${getClass('body')} text-white/80 leading-tight`}>
                                    {scheduleDate.weekday}
                                  </div>
                                  <div className={`text-xs sm:text-sm ${getClass('body')} text-white/60 leading-tight`}>
                                    {scheduleDate.month} {scheduleDate.year}
                                  </div>
                                </div>
                                
                                {/* Time Range */}
                                <div className={`text-lg sm:text-xl ${getClass('header')} text-white font-medium`}>
                                  {formatTime(activity.startTime)} - {formatTime(activity.endTime)}
                                </div>
                              </div>

                              {/* Content Column */}
                              <div className="lg:col-span-6 space-y-4">
                                {/* Title */}
                                <h3 className={`text-xl sm:text-2xl lg:text-3xl ${getClass('header')} text-white group-hover:text-[#FCB283] transition-colors line-clamp-2`}>
                                  {activity.name}
                                </h3>

                                {/* Description */}
                                <p className={`${getClass('body')} text-white/70 line-clamp-3 text-sm sm:text-base`}>
                                  {activity.shortDescription}
                                </p>

                                {/* Venue and Details */}
                                <div className="space-y-2">
                                  <div className="flex items-center text-sm text-white/60">
                                    <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                                    <span className="line-clamp-1">{activity.venueName}</span>
                                  </div>
                                  
                                  <div className="flex items-center text-sm text-white/60">
                                    <Users className="w-4 h-4 mr-2 flex-shrink-0" />
                                    <span>
                                      {activity.maxParticipants === 0 
                                        ? currentContent.unlimited 
                                        : `${activity.registeredParticipants || 0}/${activity.maxParticipants} ${currentContent.participants}`
                                      }
                                    </span>
                                  </div>
                                </div>

                                {/* Speakers */}
                                {activity.speakers && activity.speakers.length > 0 && (
                                  <div className="space-y-1">
                                    {activity.speakers.slice(0, 2).map((speaker, speakerIndex) => (
                                      <div key={speakerIndex} className={`text-sm ${getClass('body')} text-[#FCB283]`}>
                                        <span className="font-medium">{speaker.role}</span>
                                        <br />
                                        <span className="text-white/80">{speaker.name}</span>
                                      </div>
                                    ))}
                                    {activity.speakers.length > 2 && (
                                      <div className={`text-xs ${getClass('body')} text-white/60`}>
                                        +{activity.speakers.length - 2} more speakers
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Tags */}
                                {activity.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-2">
                                    {activity.tags.slice(0, 3).map((tag, tagIndex) => (
                                      <span
                                        key={tagIndex}
                                        className="px-2 py-1 text-xs rounded-full bg-white/10 text-white/70 border border-white/20"
                                      >
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Image Column */}
                              <div className="lg:col-span-4">
                                <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black/20">
                                  <img
                                    src={activity.image || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjI0MCIgdmlld0JveD0iMCAwIDQwMCAyNDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMjQwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNzUgOTBMMTg1IDEwNUwyMDUgODVMMjI1IDExMEgyNTVWMTMwSDEyNVYxMTBMMTQwIDk1TDE3NSA5MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+'}
                                    alt={activity.name}
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                    loading="lazy"
                                  />
                                  
                                  {/* Image overlay gradient */}
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                  
                                  {/* Status badges on image */}
                                  <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                                    {isFree && (
                                      <span className="px-2 py-1 bg-green-500/90 text-white text-xs font-medium rounded-full">
                                        {currentContent.free}
                                      </span>
                                    )}
                                  </div>

                                  {/* Availability indicator */}
                                  <div className="absolute top-3 right-3">
                                    <span className={`px-2 py-1 bg-black/60 backdrop-blur-sm text-xs font-medium rounded-full ${availability.color}`}>
                                      {availability.text}
                                    </span>
                                  </div>

                                  {/* Register button overlay */}
                                  <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <AnimatedButton
                                      variant="primary"
                                      size="small"
                                      onClick={(e) => {
                                        e?.stopPropagation();
                                        handleActivityClick(activity.id);
                                      }}
                                    >
                                      {currentContent.register}
                                    </AnimatedButton>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicActivitiesPage;
