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
      screening: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      workshop: 'bg-green-500/20 text-green-300 border-green-500/30',
      networking: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      ceremony: 'bg-red-500/20 text-red-300 border-red-500/30',
      panel: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      special: 'bg-pink-500/20 text-pink-300 border-pink-500/30'
    };
    return colors[category as keyof typeof colors] || 'bg-white/10 text-white/80 border-white/20';
  };

  const getVenueDisplayName = (venueName: string): string => {
    const venueMap: Record<string, string> = {
      'stageZone': 'Stage Zone',
      'stage-zone': 'Stage Zone',
      'expoZone': 'EXPO Zone',
      'expo-zone': 'EXPO Zone',
      'majorTheatre7': 'Major Theatre 7',
      'major-theatre-7': 'Major Theatre 7',
      'major-theatre-4': 'Major Theatre 7',
      'majorImax': 'Major IMAX',
      'major-imax': 'Major IMAX',
      'market': 'Market',
      'anusarn': 'Anusarn',
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

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      {/* Modal Container with Background Image */}
      <div 
        className="glass-container rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col relative overflow-hidden"
        style={{
          backgroundImage: event.image ? `url(${event.image})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Background Overlay for better text readability */}
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>
        
        {/* Modal Content */}
        <div className="relative z-10 flex flex-col h-full">
          {/* Header - Fixed */}
          <div className="flex items-start justify-between p-6 border-b border-white/20 flex-shrink-0">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-3">
                {event.type === 'film' ? (
                  <Film className="w-5 h-5 text-blue-400" />
                ) : (
                  <Activity className="w-5 h-5 text-green-400" />
                )}
                <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getCategoryColor(event.category)}`}>
                  {event.category}
                </span>
                {event.featured && (
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                )}
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-2">
                {event.title}
              </h2>
              
              {event.type === 'film' && event.director && (
                <p className="text-lg text-white/80">
                  Directed by {event.director}
                </p>
              )}
            </div>
            
            <button
              onClick={onClose}
              className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              {/* Event Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Left Column */}
                <div className="space-y-4">
                  {/* Date & Time */}
                  <div className="flex items-start space-x-3">
                    <Calendar className="w-5 h-5 text-white/60 mt-0.5" />
                    <div>
                      <p className="font-medium text-white">
                        {formatDate(event.date)}
                      </p>
                      <p className="text-sm text-white/80">
                        {formatTime(event.startTime)} - {formatTime(event.endTime)}
                      </p>
                      <p className="text-xs text-white/60">
                        Duration: {formatDuration(event.duration)}
                      </p>
                    </div>
                  </div>

                  {/* Venue */}
                  <div className="flex items-start space-x-3">
                    <MapPin className="w-5 h-5 text-white/60 mt-0.5" />
                    <div>
                      <p className="font-medium text-white">
                        {getVenueDisplayName(event.venue)}
                      </p>
                    </div>
                  </div>

                  {/* Capacity & Registration */}
                  {event.maxParticipants && (
                    <div className="flex items-start space-x-3">
                      <Users className="w-5 h-5 text-white/60 mt-0.5" />
                      <div>
                        <p className="font-medium text-white">
                          {event.registeredParticipants || 0} / {event.maxParticipants} participants
                        </p>
                        <p className={`text-sm ${isAvailable() ? 'text-green-400' : 'text-red-400'}`}>
                          {getAvailabilityText()}
                        </p>
                        {event.registrationRequired && (
                          <p className="text-xs text-white/60 mt-1">
                            Registration required
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Views */}
                  {event.views && (
                    <div className="flex items-start space-x-3">
                      <Eye className="w-5 h-5 text-white/60 mt-0.5" />
                      <div>
                        <p className="text-sm text-white/80">
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
                          <User className="w-5 h-5 text-white/60 mt-0.5" />
                          <div>
                            <p className="font-medium text-white mb-1">Cast</p>
                            <p className="text-sm text-white/80">
                              {event.cast.slice(0, 3).join(', ')}
                              {event.cast.length > 3 && ` +${event.cast.length - 3} more`}
                            </p>
                          </div>
                        </div>
                      )}

                      {event.genres && event.genres.length > 0 && (
                        <div className="flex items-start space-x-3">
                          <Tag className="w-5 h-5 text-white/60 mt-0.5" />
                          <div>
                            <p className="font-medium text-white mb-1">Genres</p>
                            <div className="flex flex-wrap gap-1">
                              {event.genres.map((genre, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 text-xs bg-white/10 text-white/80 rounded-full border border-white/20"
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
                          <Info className="w-5 h-5 text-white/60 mt-0.5" />
                          <div>
                            <p className="font-medium text-white">Rating</p>
                            <p className="text-sm text-white/80">{event.rating}</p>
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
                          <User className="w-5 h-5 text-white/60 mt-0.5" />
                          <div>
                            <p className="font-medium text-white mb-2">Speakers</p>
                            <div className="space-y-2">
                              {event.speakers.slice(0, 3).map((speaker, index) => (
                                <div key={index} className="text-sm">
                                  <p className="font-medium text-white">{speaker.name}</p>
                                  <p className="text-white/80">{speaker.role}</p>
                                </div>
                              ))}
                              {event.speakers.length > 3 && (
                                <p className="text-xs text-white/60">
                                  +{event.speakers.length - 3} more speakers
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {event.organizers && event.organizers.length > 0 && (
                        <div className="flex items-start space-x-3">
                          <User className="w-5 h-5 text-white/60 mt-0.5" />
                          <div>
                            <p className="font-medium text-white mb-1">Organizers</p>
                            <p className="text-sm text-white/80">
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
                      <Tag className="w-5 h-5 text-white/60 mt-0.5" />
                      <div>
                        <p className="font-medium text-white mb-2">Tags</p>
                        <div className="flex flex-wrap gap-1">
                          {event.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 text-xs bg-blue-500/20 text-blue-300 rounded-full border border-blue-500/30"
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
                  <h3 className="text-lg font-semibold text-white mb-3">Description</h3>
                  <div className="prose prose-sm max-w-none text-white/80">
                    <p>{event.description}</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-6 border-t border-white/20">
                <div className="flex items-center space-x-2 text-sm text-white/60">
                  <span>Event ID: {event.id}</span>
                </div>
                
                <div className="flex items-center space-x-3">
                  {event.registrationRequired && isAvailable() && (
                    <button className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-[#FCB283] to-[#AA4626] rounded-lg hover:shadow-lg transition-all">
                      Register Now
                    </button>
                  )}
                  
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-white/80 bg-white/10 rounded-lg hover:bg-white/20 transition-colors border border-white/20"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailModal;
