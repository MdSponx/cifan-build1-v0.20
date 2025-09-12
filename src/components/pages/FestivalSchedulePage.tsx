import React, { useState } from 'react';
import FestivalScheduleGrid from '../schedule/FestivalScheduleGrid';
import EventDetailModal from '../schedule/EventDetailModal';
import { ScheduleItem, FESTIVAL_CONFIG } from '../../types/schedule.types';

/**
 * Festival Schedule Page Component
 * Main page that integrates the Festival Schedule Grid with event detail modal
 */
const FestivalSchedulePage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedEvent, setSelectedEvent] = useState<ScheduleItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
  };

  const handleEventClick = (event: ScheduleItem) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
  };

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-start overflow-hidden pt-16 sm:pt-20 pb-6 sm:pb-10 px-4">
      
      {/* Page Header - centered like home page */}
      <div className="relative z-10 w-full max-w-7xl mx-auto text-center pt-8 pb-8">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
          CIFAN Festival Schedule
        </h1>
        <p className="text-xl text-gray-300 max-w-3xl mx-auto">
          Explore our comprehensive 8-day festival schedule featuring film screenings, 
          workshops, panels, networking events, and special ceremonies. Click on any event 
          to view detailed information and register if required.
        </p>
      </div>

      {/* Festival Schedule Grid - centered with glass container */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <FestivalScheduleGrid
          selectedDate={selectedDate}
          onDateChange={handleDateChange}
          venues={[
            'stage-zone',
            'expo-zone', 
            'major-theatre-4',
            'major-imax',
            'market',
            'asiatrip'
          ]}
          onEventClick={handleEventClick}
          festivalStartDate={FESTIVAL_CONFIG.DEFAULT_START_DATE}
          className="glass-container rounded-xl"
        />
      </div>

      {/* Event Detail Modal */}
      <EventDetailModal
        event={selectedEvent}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />

      {/* Footer Information - glass container like home page */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 mb-8">
        <div className="glass-container rounded-xl p-6 sm:p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Legend */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Event Categories</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded"></div>
                  <span className="text-sm text-gray-300">Film Screenings</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-gradient-to-r from-green-500 to-green-600 rounded"></div>
                  <span className="text-sm text-gray-300">Workshops</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-gradient-to-r from-purple-500 to-purple-600 rounded"></div>
                  <span className="text-sm text-gray-300">Networking Events</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-gradient-to-r from-red-500 to-red-600 rounded"></div>
                  <span className="text-sm text-gray-300">Ceremonies</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded"></div>
                  <span className="text-sm text-gray-300">Panel Discussions</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-gradient-to-r from-pink-500 to-pink-600 rounded"></div>
                  <span className="text-sm text-gray-300">Special Events</span>
                </div>
              </div>
            </div>

            {/* Venues */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Festival Venues</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-red-400 rounded"></div>
                  <span className="text-sm text-gray-300">Stage Zone</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-teal-400 rounded"></div>
                  <span className="text-sm text-gray-300">EXPO Zone</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-blue-400 rounded"></div>
                  <span className="text-sm text-gray-300">Major Theatre 4</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-green-400 rounded"></div>
                  <span className="text-sm text-gray-300">Major IMAX</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-yellow-400 rounded"></div>
                  <span className="text-sm text-gray-300">Market</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-purple-400 rounded"></div>
                  <span className="text-sm text-gray-300">Asiatrip</span>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">How to Use</h3>
              <div className="space-y-2 text-sm text-gray-300">
                <p>• Navigate between festival days using the day tabs or arrow buttons</p>
                <p>• Use filters to find specific types of events or venues</p>
                <p>• Click on any event card to view detailed information</p>
                <p>• Register for activities that require advance registration</p>
                <p>• The red line indicates the current time (when viewing today)</p>
                <p>• Events are color-coded by category for easy identification</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FestivalSchedulePage;
