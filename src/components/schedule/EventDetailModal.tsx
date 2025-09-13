import React from 'react';
import { ScheduleItem } from '../../types/schedule.types';
import { 
  X, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Star, 
  Eye, 
  Film, 
  Activity,
  User,
  Phone,
  Mail,
  Tag,
  Info
} from 'lucide-react';

interface EventDetailModalProps {
  event: ScheduleItem | null;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Event Detail Modal Component
 * Shows detailed information about a selected schedule item (film or activity)
 */
const EventDetailModal: React.FC<EventDetailModalProps> = ({
  event,
  isOpen,
  onClose
}) => {
  if (!isOpen || !event) return null;

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (time: string): string => {
    const [hour, minute] = time.split(':').map(Number);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins} min`;
    if (mins === 0) return `${hours} hr`;
    return `${hours} hr ${mins} min`;
  };

  const getCategoryColor = (category: string): string => {
    const colors = {
      screening: 'bg-blue-100 text-blue-800',
      workshop: 'bg-green-100 text-green-800',
      networking: 'bg-purple-100 text-purple-800',
      ceremony: 'bg-red-100 text-red-800',
      panel: 'bg-yellow-100 text-yellow-800',
      special: 'bg-pink-100 text-pink-800'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getVenueDisplayName = (venueName: string): string => {
    const venueMap: Record<string, string> = {
      'stage-zone': 'Stage Zone',
      'expo-zone': 'EXPO Zone',
      'major-theatre-4': 'Major Theatre 7',
      'major-imax': 'Major IMAX',
      'market': 'Market',
      'asiatrip': 'Asiatrip'
    };
    return venueMap[venueName] || venueName;
  };

  const isAvailable = (): boolean => {
    if (!event.maxParticipants) return true;
    return (event.registeredParticipants || 0) < event.maxParticipants;
  };

  const getAvailabilityText = (): string => {
    if (!event.maxParticipants) return 'Open registration';
    const registered = event.registeredParticipants || 0;
    const available = event.maxParticipants - registered;
    if (available <= 0) return 'Fully booked';
    return `${available} spots available`;
  };

  return (
    <div className="fixed inset-0 schedule-modal overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 schedule-modal-backdrop transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal panel */}
        <div className="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                {event.type === 'film' ? (
                  <Film className="w-5 h-5 text-blue-600" />
                ) : (
                  <Activity className="w-5 h-5 text-green-600" />
                )}
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(event.category)}`}>
                  {event.category}
                </span>
                {event.featured && (
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                )}
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {event.title}
              </h2>
              
              {event.type === 'film' && event.director && (
                <p className="text-lg text-gray-600">
                  Directed by {event.director}
                </p>
              )}
            </div>
            
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Event Image */}
          {event.image && (
            <div className="mb-6">
              <img
                src={event.image}
                alt={event.title}
                className="w-full h-64 object-cover rounded-lg"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}

          {/* Event Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Date & Time */}
              <div className="flex items-start space-x-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">
                    {formatDate(event.date)}
                  </p>
                  <p className="text-sm text-gray-600">
                    {formatTime(event.startTime)} - {formatTime(event.endTime)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Duration: {formatDuration(event.duration)}
                  </p>
                </div>
              </div>

              {/* Venue */}
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">
                    {getVenueDisplayName(event.venue)}
                  </p>
                </div>
              </div>

              {/* Capacity & Registration */}
              {event.maxParticipants && (
                <div className="flex items-start space-x-3">
                  <Users className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {event.registeredParticipants || 0} / {event.maxParticipants} participants
                    </p>
                    <p className={`text-sm ${isAvailable() ? 'text-green-600' : 'text-red-600'}`}>
                      {getAvailabilityText()}
                    </p>
                    {event.registrationRequired && (
                      <p className="text-xs text-gray-500 mt-1">
                        Registration required
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Views */}
              {event.views && (
                <div className="flex items-start space-x-3">
                  <Eye className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">
                      {event.views} views
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {/* Film-specific details */}
              {event.type === 'film' && (
                <>
                  {event.cast && event.cast.length > 0 && (
                    <div className="flex items-start space-x-3">
                      <User className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900 mb-1">Cast</p>
                        <p className="text-sm text-gray-600">
                          {event.cast.slice(0, 3).join(', ')}
                          {event.cast.length > 3 && ` +${event.cast.length - 3} more`}
                        </p>
                      </div>
                    </div>
                  )}

                  {event.genres && event.genres.length > 0 && (
                    <div className="flex items-start space-x-3">
                      <Tag className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900 mb-1">Genres</p>
                        <div className="flex flex-wrap gap-1">
                          {event.genres.map((genre, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full"
                            >
                              {genre}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {event.rating && (
                    <div className="flex items-start space-x-3">
                      <Info className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">Rating</p>
                        <p className="text-sm text-gray-600">{event.rating}</p>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Activity-specific details */}
              {event.type === 'activity' && (
                <>
                  {event.speakers && event.speakers.length > 0 && (
                    <div className="flex items-start space-x-3">
                      <User className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900 mb-2">Speakers</p>
                        <div className="space-y-2">
                          {event.speakers.slice(0, 3).map((speaker, index) => (
                            <div key={index} className="text-sm">
                              <p className="font-medium text-gray-900">{speaker.name}</p>
                              <p className="text-gray-600">{speaker.role}</p>
                            </div>
                          ))}
                          {event.speakers.length > 3 && (
                            <p className="text-xs text-gray-500">
                              +{event.speakers.length - 3} more speakers
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {event.organizers && event.organizers.length > 0 && (
                    <div className="flex items-start space-x-3">
                      <User className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900 mb-1">Organizers</p>
                        <p className="text-sm text-gray-600">
                          {event.organizers.join(', ')}
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Tags */}
              {event.tags && event.tags.length > 0 && (
                <div className="flex items-start space-x-3">
                  <Tag className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900 mb-2">Tags</p>
                    <div className="flex flex-wrap gap-1">
                      {event.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {event.description && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
              <div className="prose prose-sm max-w-none text-gray-600">
                <p>{event.description}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span>Event ID: {event.id}</span>
            </div>
            
            <div className="flex items-center space-x-3">
              {event.registrationRequired && isAvailable() && (
                <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors">
                  Register Now
                </button>
              )}
              
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailModal;
