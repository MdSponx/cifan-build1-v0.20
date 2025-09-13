import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  FestivalScheduleGridProps, 
  ScheduleItem, 
  TimeSlot, 
  VenueColumn, 
  ScheduleFilters,
  ScheduleViewOptions,
  FESTIVAL_VENUES, 
  CATEGORY_COLORS, 
  TIME_SLOT_CONFIG,
  FESTIVAL_CONFIG
} from '../../types/schedule.types';
import { useScheduleData } from '../../hooks/useScheduleData';
import { useFontUtils } from '../../utils/fontUtils';
import { FestivalScheduleManager, createFestivalScheduleManager } from '../../utils/FestivalScheduleManager';
import { RefreshCcwIcon } from 'lucide-react';

/**
 * Festival Schedule Grid Component - Redesigned with Thai translations and improved UI
 * Displays an 8-day film festival schedule with films and activities in a unified timeline view
 */
const FestivalScheduleGrid: React.FC<FestivalScheduleGridProps> = ({
  selectedDate,
  onDateChange,
  venues = FESTIVAL_VENUES.map(v => v.name),
  onEventClick,
  className = '',
  festivalStartDate = FESTIVAL_CONFIG.DEFAULT_START_DATE,
  festivalEndDate,
  timeSlotDuration = TIME_SLOT_CONFIG.SLOT_DURATION,
  startHour = TIME_SLOT_CONFIG.START_HOUR,
  endHour = TIME_SLOT_CONFIG.END_HOUR
}) => {
  const { t } = useTranslation();
  const { getFontClass, getFontStyle, isThaiLanguage, currentLanguage } = useFontUtils();
  
  // Hooks - Enable mock data for testing
  const { scheduleItems, isLoading, error, lastUpdated, refreshData } = useScheduleData(selectedDate, true);
  
  // State
  const [filters, setFilters] = useState<ScheduleFilters>({
    venues: venues,
    categories: [],
    types: [],
    search: '',
    showOnlyAvailable: false,
    showOnlyFeatured: false
  });
  
  const [viewOptions, setViewOptions] = useState<ScheduleViewOptions>({
    showConflicts: true,
    showCurrentTime: true,
    compactView: false,
    showVenueColors: true,
    autoRefresh: false
  });

  // Refs for schedule manager
  const scheduleManagerRef = useRef<FestivalScheduleManager | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate festival dates (8 days)
  const festivalDates = useMemo(() => {
    const dates: Date[] = [];
    const endDate = festivalEndDate || new Date(festivalStartDate.getTime() + (FESTIVAL_CONFIG.DURATION_DAYS - 1) * 24 * 60 * 60 * 1000);
    
    for (let i = 0; i < FESTIVAL_CONFIG.DURATION_DAYS; i++) {
      const date = new Date(festivalStartDate.getTime() + i * 24 * 60 * 60 * 1000);
      dates.push(date);
    }
    
    return dates;
  }, [festivalStartDate, festivalEndDate]);

  // Generate simplified time slots (hour intervals only) - Always show 10:00 to 24:00 (24-hour format)
  const timeSlots = useMemo((): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const fixedStartHour = 10; // Always start at 10:00
    const fixedEndHour = 24;   // Always end at 24:00 (midnight)
    
    for (let hour = fixedStartHour; hour < fixedEndHour; hour++) {
      const time = `${hour.toString().padStart(2, '0')}:00`;
      const displayTime = `${hour.toString().padStart(2, '0')}:00`; // 24-hour format
      
      slots.push({
        time,
        displayTime,
        gridRow: hour - fixedStartHour + 2 // +2 to account for header row
      });
    }
    
    return slots;
  }, []); // No dependencies - always show full 10:00-24:00 range regardless of data

  // Get venue columns with colors - Always show all 6 venues
  const venueColumns = useMemo((): VenueColumn[] => {
    const colors = [
      '#10B981', // emerald-500
      '#F59E0B', // amber-500  
      '#EF4444', // red-500
      '#8B5CF6', // violet-500
      '#06B6D4', // cyan-500
      '#84CC16'  // lime-500
    ];
    
    return FESTIVAL_VENUES.map((venue, index) => ({
      ...venue,
      color: colors[index % colors.length],
      gridColumn: index + 1 // +1 since we removed the time column header
    }));
  }, []); // Remove dependency on filters.venues to always show all venues

  // Filter schedule items
  const filteredItems = useMemo(() => {
    let items = scheduleItems;

    if (filters.venues?.length) {
      items = items.filter(item => filters.venues!.includes(item.venue));
    }

    if (filters.categories?.length) {
      items = items.filter(item => filters.categories!.includes(item.category));
    }

    if (filters.types?.length) {
      items = items.filter(item => filters.types!.includes(item.type));
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      items = items.filter(item => 
        item.title.toLowerCase().includes(searchLower) ||
        item.description?.toLowerCase().includes(searchLower) ||
        item.director?.toLowerCase().includes(searchLower)
      );
    }

    return items;
  }, [scheduleItems, filters]);

  const formatDate = useCallback((date: Date) => {
    const days = [t('schedule.sunday'), t('schedule.monday'), t('schedule.tuesday'), t('schedule.wednesday'), t('schedule.thursday'), t('schedule.friday'), t('schedule.saturday')];
    const dayName = days[date.getDay()];
    const day = date.getDate().toString().padStart(2, '0');
    const month = t('schedule.september');
    const year = date.getFullYear();
    
    return { dayName, day, month, year };
  }, [t]);

  const formatDateForHeader = useCallback((date: Date) => {
    const days = [t('schedule.sunday'), t('schedule.monday'), t('schedule.tuesday'), t('schedule.wednesday'), t('schedule.thursday'), t('schedule.friday'), t('schedule.saturday')];
    const dayName = days[date.getDay()];
    const day = date.getDate();
    const month = t('schedule.september');
    const year = date.getFullYear();
    
    return { dayName, day, month, year };
  }, [t]);

  const formatDateForBanner = useCallback((date: Date) => {
    const days = [t('schedule.sunday'), t('schedule.monday'), t('schedule.tuesday'), t('schedule.wednesday'), t('schedule.thursday'), t('schedule.friday'), t('schedule.saturday')];
    const dayName = days[date.getDay()];
    const day = date.getDate().toString().padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    return { dayName, day, month, year };
  }, [t]);

  const isToday = useCallback((date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }, []);

  const getCurrentTimePosition = useCallback((): number | null => {
    if (!isToday(selectedDate)) return null;
    
    const now = new Date();
    const currentHour = now.getHours();
    const fixedStartHour = 10; // Always use 10 AM as start
    const fixedEndHour = 24;   // Always use 12 AM as end
    
    if (currentHour < fixedStartHour || currentHour >= fixedEndHour) return null;
    
    const position = (currentHour - fixedStartHour) * 60 + 120; // 60px per hour + 120px header
    return position;
  }, [selectedDate, isToday]);

  const getTimeSlotPosition = useCallback((time: string): number => {
    try {
      const [hour] = time.split(':').map(Number);
      const fixedStartHour = 10; // Always use 10 AM as start
      const slotPosition = hour - fixedStartHour;
      return Math.max(0, slotPosition + 2); // +2 for header row
    } catch (error) {
      console.warn('Error calculating time slot position:', { time }, error);
      return 2;
    }
  }, []);

  const getVenueColumn = useCallback((venueName: string): number => {
    const venue = venueColumns.find(v => v.name === venueName);
    return venue ? venue.gridColumn : 2;
  }, [venueColumns]);

  // Calculate precise grid position and span for items
  const getItemGridPosition = useCallback((startTime: string, endTime: string) => {
    const [eventStartHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    const fixedStartHour = 10; // Always use 10 AM as start
    
    const startMinutes = eventStartHour * 60 + startMin;
    let endMinutes = endHour * 60 + endMin;
    
    // Handle overnight events
    if (endMinutes < startMinutes) {
      endMinutes += 24 * 60;
    }
    
    // Calculate which grid row to start from (each hour = 1 row, starting from row 2)
    // Grid row is based on the event's start hour relative to the grid's start hour
    const startGridRow = eventStartHour - fixedStartHour + 2;
    
    // Calculate how many rows to span
    const durationMinutes = endMinutes - startMinutes;
    const durationHours = durationMinutes / 60;
    const rowSpan = Math.max(1, Math.ceil(durationHours));
    
    // Calculate offset within the first hour for precise positioning
    const minuteOffset = startMin;
    const topOffset = (minuteOffset / 60) * 80; // 80px per hour
    
    // Calculate height based on actual duration
    const height = (durationMinutes / 60) * 80; // 80px per hour
    
    return {
      gridRowStart: startGridRow,
      gridRowEnd: startGridRow + rowSpan,
      topOffset,
      height: Math.max(40, height) // Minimum 40px height
    };
  }, []);

  const currentTimePosition = getCurrentTimePosition();
  const selectedDateInfo = formatDate(selectedDate);

  // Initialize and cleanup schedule manager
  useEffect(() => {
    if (!containerRef.current) return;

    // Create schedule manager instance
    scheduleManagerRef.current = createFestivalScheduleManager({
      containerSelector: '.festival-schedule-grid',
      timelineSelector: '.festival-timeline-grid',
      headerSelector: '.venue-header-grid',
      eventCardSelector: '.schedule-event-card',
      currentTimeIndicatorSelector: '.current-time-indicator',
      enableAutoRefresh: viewOptions.autoRefresh,
      refreshInterval: 60000,
      enablePerformanceOptimizations: true
    });

    // Initialize the manager
    scheduleManagerRef.current.initialize();

    // Cleanup on unmount
    return () => {
      if (scheduleManagerRef.current) {
        scheduleManagerRef.current.destroy();
        scheduleManagerRef.current = null;
      }
    };
  }, [viewOptions.autoRefresh]);

  // Update manager when view options change
  useEffect(() => {
    if (scheduleManagerRef.current) {
      scheduleManagerRef.current.updateOptions({
        enableAutoRefresh: viewOptions.autoRefresh
      });
    }
  }, [viewOptions.autoRefresh]);

  // Force refresh when data changes
  useEffect(() => {
    if (scheduleManagerRef.current && !isLoading) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        scheduleManagerRef.current?.forceRefresh();
      }, 100);
    }
  }, [filteredItems, isLoading]);

  return (
    <div className={`festival-schedule-grid bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 min-h-screen ${className}`}>
      {/* Header Container with Glassmorphism - Compact Layout */}
      <div className="p-6">
        <div className="backdrop-blur-xl bg-white/30 border border-white/20 rounded-3xl shadow-2xl">
          {/* Main Header - Compact 2-row layout */}
          <div className="px-8 py-4">
            <div className="flex items-start justify-between">
              {/* Left Side - Date Information */}
              <div className="flex flex-col">
                <div 
                  className={`text-5xl font-bold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent mb-2 ${getFontClass('header')}`}
                  style={{
                    background: 'linear-gradient(135deg, #FCB283, #AA4626)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    ...getFontStyle('header')
                  }}
                >
                  {formatDateForHeader(selectedDate).dayName.toUpperCase()}
                </div>
                <div 
                  className={`text-3xl font-semibold text-gray-700 mb-2 ${getFontClass('subtitle')}`}
                  style={getFontStyle('subtitle')}
                >
                  {formatDateForHeader(selectedDate).day} {formatDateForHeader(selectedDate).month} {formatDateForHeader(selectedDate).year}
                </div>
                <div 
                  className={`text-sm text-gray-600 bg-white/40 px-3 py-1 rounded-full backdrop-blur-sm ${getFontClass('body')}`}
                  style={getFontStyle('body')}
                >
                  {t('schedule.lastUpdated')} {lastUpdated ? lastUpdated.toLocaleTimeString('th-TH') : '--:--'}
                </div>
              </div>

              {/* Right Side - Refresh Button and Day Banners */}
              <div className="flex flex-col items-end space-y-3">
                {/* Refresh Button */}
                <button
                  onClick={refreshData}
                  disabled={isLoading}
                  className={`flex items-center space-x-3 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-2xl hover:from-orange-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 transition-all duration-200 shadow-lg backdrop-blur-sm ${getFontClass('body')}`}
                  style={{
                    background: 'linear-gradient(135deg, #FCB283, #AA4626)',
                    ...getFontStyle('body')
                  }}
                >
                  <RefreshCcwIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                  <span className="font-medium text-lg">{t('schedule.refresh')}</span>
                </button>

                {/* Festival Days Banner - Single row layout */}
                <div className="grid grid-cols-8 gap-1.5 max-w-2xl">
                  {festivalDates.map((date, index) => {
                    const dateInfo = formatDateForBanner(date);
                    const isSelected = date.toDateString() === selectedDate.toDateString();
                    const isCurrentDay = isToday(date);
                    
                    return (
                      <button
                        key={date.toISOString()}
                        onClick={() => onDateChange(date)}
                        className={`px-1.5 py-1.5 rounded-md transition-all duration-300 transform hover:scale-105 ${getFontClass('body')} ${
                          isSelected
                            ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-lg scale-105'
                            : isCurrentDay
                            ? 'bg-gradient-to-br from-green-400 to-emerald-500 text-white shadow-md'
                            : 'bg-white/50 text-gray-700 hover:bg-white/70 backdrop-blur-sm border border-white/30'
                        }`}
                        style={getFontStyle('body')}
                      >
                        <div className="text-center">
                          <div className="font-bold text-xs mb-0.5">
                            {t('schedule.day')} {index + 1}
                          </div>
                          <div className="text-xs opacity-90 font-medium">
                            {dateInfo.dayName}
                          </div>
                          <div className="text-xs opacity-90 font-medium">
                            {dateInfo.day}.{dateInfo.month}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 m-6">
          <div className="flex">
              <div className="ml-3">
                <h3 className={`text-sm font-medium text-red-800 ${getFontClass('body')}`} style={getFontStyle('body')}>{t('schedule.error')}</h3>
                <div className={`mt-2 text-sm text-red-700 ${getFontClass('body')}`} style={getFontStyle('body')}>{error}</div>
                <div className="mt-3">
                  <button
                    onClick={refreshData}
                    className={`bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200 ${getFontClass('body')}`}
                    style={getFontStyle('body')}
                  >
                    {t('schedule.tryAgain')}
                  </button>
                </div>
              </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center p-8">
          <div className="flex items-center space-x-2">
            <RefreshCcwIcon className="w-5 h-5 animate-spin text-blue-600" />
            <span className={`text-gray-600 ${getFontClass('body')}`} style={getFontStyle('body')}>{t('schedule.loading')}</span>
          </div>
        </div>
      )}

      {/* Timeline Schedule */}
      {!isLoading && !error && (
        <div className="p-6">
          {/* Glass Container for Timeline Schedule - Full height without scroll */}
          <div className="glass-container rounded-3xl p-6 shadow-2xl overflow-visible" style={{ 
            height: 'auto',
            minHeight: 'fit-content',
            maxHeight: 'none'
          }}>
            {/* Venue Column Headers - Custom Layout with Proper Alignment */}
            <div className="mb-8">
              <div className="flex w-full">
                {/* Time Column Header - Compact size to match time labels */}
                <div 
                  className={`glass-card rounded-lg px-3 py-1 flex items-center justify-center font-bold text-white shadow-md ${getFontClass('body')}`} 
                  style={{
                    width: '80px', // Smaller width to match time text size
                    marginRight: '16px', // Gap before venue headers
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1))',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    ...getFontStyle('body')
                  }}>
                  <div className="text-center">
                    <div className="text-xs font-semibold">{t('schedule.time')}</div>
                  </div>
                </div>
                
                {/* Venue Column Headers - Equal width to match columns */}
                <div className="flex-1 grid grid-cols-6 gap-4">
                  {venueColumns.slice(0, 6).map((venue, index) => (
                    <div
                      key={venue.name}
                      className={`glass-card rounded-2xl p-4 flex items-center justify-center font-bold text-white text-sm shadow-lg transition-all duration-300 hover:scale-105 ${getFontClass('body')}`}
                      style={{ 
                        background: `linear-gradient(135deg, ${venue.color}CC, ${venue.color}99)`,
                        backdropFilter: 'blur(20px)',
                        border: `1px solid ${venue.color}40`,
                        ...getFontStyle('body')
                      }}
                    >
                      <div className="text-center">
                        <div className="font-semibold text-base leading-tight">
                          {t(`schedule.venues.${venue.name}`, venue.displayName)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Timeline Container - Fixed height to show full schedule without scroll */}
            <div className="timeline-wrapper relative overflow-visible" style={{ 
              height: `${timeSlots.length * 120 + 60}px`,
              minHeight: `${timeSlots.length * 120 + 60}px`,
              maxHeight: 'none'
            }}>
              {/* Time Lines Background */}
              {timeSlots.map((slot, slotIndex) => {
                const topPosition = slotIndex * 120; // 120px spacing between hours
                
                return (
                  <div
                    key={slot.time}
                    className="absolute left-0 right-0 time-slot-line"
                    style={{ 
                      top: `${topPosition}px`,
                      height: '120px'
                    }}
                  >
                    {/* Hour Line */}
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
                    
                    {/* Time Label */}
                    <div 
                      className={`absolute left-0 top-0 glass-card rounded-xl px-4 py-2 text-white font-semibold shadow-md ${getFontClass('body')}`}
                      style={{ 
                        background: 'rgba(255, 255, 255, 0.15)',
                        backdropFilter: 'blur(15px)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        transform: 'translateY(-50%)',
                        zIndex: 10,
                        ...getFontStyle('body') 
                      }}
                    >
                      {slot.displayTime}
                    </div>
                  </div>
                );
              })}

              {/* Grid Container for Events */}
              <div className="grid grid-cols-6 gap-4 absolute inset-0" style={{ paddingLeft: '96px' }}>
                {/* Venue Columns with Events */}
                {venueColumns.slice(0, 6).map((venue, venueIndex) => (
                  <div key={venue.name} className="schedule-venue-column relative h-full">
                    {/* Events for this venue */}
                    {filteredItems
                      .filter(item => item.venue === venue.name)
                      .map((item) => {
                        const [itemStartHour, startMinute] = item.startTime.split(':').map(Number);
                        const [itemEndHour, endMinute] = item.endTime.split(':').map(Number);
                        
                        // Calculate position relative to the timeline start hour
                        const fixedStartHour = 10; // Always use 10 AM as start
                        const hoursSinceStart = itemStartHour - fixedStartHour;
                        const startMinuteOffset = (startMinute / 60) * 120;
                        const topPosition = hoursSinceStart * 120 + startMinuteOffset;
                        
                        // Calculate duration and height
                        const startTotalMinutes = itemStartHour * 60 + startMinute;
                        let endTotalMinutes = itemEndHour * 60 + endMinute;
                        if (endTotalMinutes < startTotalMinutes) {
                          endTotalMinutes += 24 * 60; // Handle overnight events
                        }
                        const durationMinutes = endTotalMinutes - startTotalMinutes;
                        const height = Math.max(60, (durationMinutes / 60) * 120); // Minimum 60px height
                        
                        return (
                          <div
                            key={item.id}
                            className="schedule-event-card absolute rounded-xl cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1 overflow-hidden group"
                            style={{
                              top: `${topPosition}px`,
                              left: '4px',
                              right: '4px',
                              height: `${height}px`,
                              backgroundImage: item.image ? `url(${item.image})` : 'none',
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                              backgroundRepeat: 'no-repeat',
                              boxShadow: `0 8px 32px ${venue?.color || '#6B7280'}40`,
                              border: `2px solid ${venue?.color || '#6B7280'}60`,
                              zIndex: 20
                            }}
                            onClick={() => onEventClick(item)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                onEventClick(item);
                              }
                            }}
                            tabIndex={0}
                            role="button"
                          >
                            {/* Dark Overlay for Text Readability */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/30 group-hover:from-black/80 group-hover:via-black/50 group-hover:to-black/20 transition-all duration-300 rounded-xl"></div>
                            
                            {/* Venue Color Indicator */}
                            <div 
                              className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
                              style={{ backgroundColor: venue?.color || '#6B7280' }}
                            ></div>
                            
                            {/* Shine Effect */}
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl">
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                            </div>
                            
                            {/* Content - Simplified to show only Title and Emoji */}
                            <div className={`relative z-10 h-full flex flex-col p-3 text-white ${getFontClass('body')}`} style={getFontStyle('body')}>
                              {/* Emoji - Top Right */}
                              <div className="absolute top-2 right-2">
                                <span className="text-lg">
                                  {item.type === 'film' ? '🎬' : '🎭'}
                                </span>
                              </div>
                              
                              {/* Title - Center Focus */}
                              <div className="flex-1 flex items-center justify-center px-2 py-2">
                                <div className="text-center">
                                  <h3 className="font-bold text-sm leading-tight text-white drop-shadow-lg line-clamp-4 group-hover:text-orange-200 transition-colors duration-300">
                                    {item.title}
                                  </h3>
                                </div>
                              </div>
                            </div>
                            
                            {/* Hover Glow Effect */}
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-xl">
                              <div 
                                className="absolute inset-0 rounded-xl"
                                style={{
                                  boxShadow: `inset 0 0 20px ${venue?.color || '#6B7280'}40, 0 0 20px ${venue?.color || '#6B7280'}30`
                                }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                ))}
              </div>

              {/* Current Time Indicator */}
              {viewOptions.showCurrentTime && isToday(selectedDate) && (
                (() => {
                  const now = new Date();
                  const currentHour = now.getHours();
                  const currentMinute = now.getMinutes();
                  
                  const fixedStartHour = 10; // Always use 10 AM as start
                  const fixedEndHour = 24;   // Always use 12 AM as end
                  
                  if (currentHour >= fixedStartHour && currentHour < fixedEndHour) {
                    const hoursSinceStart = currentHour - fixedStartHour;
                    const minuteOffset = (currentMinute / 60) * 120;
                    const topPosition = hoursSinceStart * 120 + minuteOffset;
                    
                    return (
                      <div
                        className="absolute left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-orange-500 z-30 pointer-events-none rounded-full shadow-lg"
                        style={{ top: `${topPosition}px` }}
                      >
                        <div className={`absolute left-20 -top-4 glass-card bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs px-3 py-1 rounded-full shadow-lg ${getFontClass('body')}`} style={getFontStyle('body')}>
                          <div className="font-semibold">{t('schedule.now')}</div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()
              )}
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredItems.length === 0 && (
        <div className={`flex flex-col items-center justify-center p-12 text-gray-500 ${getFontClass('body')}`} style={getFontStyle('body')}>
          <div className="text-6xl mb-4">📅</div>
          <h3 className="text-xl font-medium mb-2">{t('schedule.noEvents')}</h3>
          <p className="text-center max-w-md">
            {t('schedule.noEventsMessage')}
          </p>
        </div>
      )}
    </div>
  );
};

export default FestivalScheduleGrid;
