import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTypography } from '../../utils/typography';
import { Venue } from '../../types/venue.types';
import { generateEmbedUrl, GOOGLE_MAPS_CONFIG } from '../../config/googleMaps';
import { MapPin, ExternalLink, Navigation, Loader2, AlertCircle } from 'lucide-react';
import AnimatedButton from './AnimatedButton';

interface VenueCardProps {
  venue: Venue;
  className?: string;
  style?: React.CSSProperties;
}

const VenueCard: React.FC<VenueCardProps> = ({ venue, className = '', style }) => {
  const { i18n } = useTranslation();
  const { getClass } = useTypography();
  const currentLanguage = i18n.language as 'en' | 'th';
  
  const [mapLoading, setMapLoading] = useState(true);
  const [mapError, setMapError] = useState(false);

  // Get venue display information based on language
  const venueName = currentLanguage === 'th' ? venue.nameTh : venue.nameEn;
  const venueLocation = currentLanguage === 'th' ? venue.fullLocationTh : venue.fullLocationEn;

  // Generate Google Maps embed URL - with fallback for development
  const embedUrl = generateEmbedUrl(venue.locationUrl);
  
  // Check if we have a valid API key
  const hasValidApiKey = GOOGLE_MAPS_CONFIG.apiKey && 
                        GOOGLE_MAPS_CONFIG.apiKey !== 'your_google_maps_api_key_here';

  // Handle map load
  const handleMapLoad = () => {
    setMapLoading(false);
    setMapError(false);
  };

  // Handle map error
  const handleMapError = () => {
    setMapLoading(false);
    setMapError(true);
  };

  // Handle get directions click
  const handleGetDirections = () => {
    window.open(venue.locationUrl, '_blank', 'noopener,noreferrer');
  };

  // Handle view on map click
  const handleViewOnMap = () => {
    window.open(venue.locationUrl, '_blank', 'noopener,noreferrer');
  };

  // Content translations
  const content = {
    th: {
      getDirections: 'รับเส้นทาง',
      viewOnMap: 'ดูบนแผนที่',
      mapLoadError: 'ไม่สามารถโหลดแผนที่ได้',
      loading: 'กำลังโหลดแผนที่...',
      openInMaps: 'เปิดใน Google Maps'
    },
    en: {
      getDirections: 'Get Directions',
      viewOnMap: 'View on Map',
      mapLoadError: 'Unable to load map',
      loading: 'Loading map...',
      openInMaps: 'Open in Google Maps'
    }
  };

  const currentContent = content[currentLanguage];

  return (
    <div className={`glass-container rounded-xl overflow-hidden hover:bg-white/10 transition-all duration-300 border border-white/10 hover:border-[#FCB283]/30 group ${className}`} style={style}>
      <div className="grid grid-cols-1 lg:grid-cols-2 h-full">
        
        {/* Map Section - Left Side */}
        <div className="relative h-64 lg:h-full min-h-[300px] bg-black/20">
          {mapLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#FCB283] mx-auto mb-2" />
                <p className={`text-sm ${getClass('body')} text-white/70`}>
                  {currentContent.loading}
                </p>
              </div>
            </div>
          )}
          
          {mapError || !hasValidApiKey ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-sm">
              <div className="text-center p-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-white/10 rounded-full flex items-center justify-center">
                  <MapPin className="w-8 h-8 text-[#FCB283]" />
                </div>
                <h4 className={`text-lg ${getClass('header')} text-white mb-2`}>
                  {venueName}
                </h4>
                <p className={`text-sm ${getClass('body')} text-white/70 mb-4 max-w-xs`}>
                  {venueLocation}
                </p>
                <AnimatedButton
                  variant="primary"
                  size="small"
                  onClick={handleViewOnMap}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  {currentContent.openInMaps}
                </AnimatedButton>
              </div>
            </div>
          ) : (
            <iframe
              src={embedUrl}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title={`Map of ${venueName}`}
              onLoad={handleMapLoad}
              onError={handleMapError}
              className="absolute inset-0 w-full h-full"
            />
          )}
          
          {/* Map Overlay with Venue Type Badge */}
          <div className="absolute top-4 left-4 z-20">
            <span className="px-3 py-1 bg-black/60 backdrop-blur-sm text-white text-xs font-medium rounded-full border border-white/20">
              {venue.code === 'majorTheatre7' || venue.code === 'majorImax' ? 'Cinema' :
               venue.code === 'anusarn' ? 'Cultural' : 'Festival Venue'}
            </span>
          </div>
          
          {/* Quick Action Button Overlay */}
          <div className="absolute bottom-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <AnimatedButton
              variant="primary"
              size="small"
              onClick={handleGetDirections}
            >
              <Navigation className="w-4 h-4 mr-2" />
              {currentContent.getDirections}
            </AnimatedButton>
          </div>
        </div>

        {/* Content Section - Right Side */}
        <div className="p-6 lg:p-8 flex flex-col justify-between">
          <div className="space-y-4">
            {/* Venue Name */}
            <div>
              <h3 className={`text-2xl lg:text-3xl ${getClass('header')} text-white group-hover:text-[#FCB283] transition-colors duration-300 mb-2`}>
                {venueName}
              </h3>
              <div className="flex items-start text-white/60">
                <MapPin className="w-4 h-4 mr-2 mt-1 flex-shrink-0" />
                <p className={`text-sm ${getClass('body')} leading-relaxed`}>
                  {venueLocation}
                </p>
              </div>
            </div>

            {/* Venue Description/Notes */}
            {venue.notes && (
              <div className="space-y-2">
                <p className={`text-sm ${getClass('body')} text-white/70 leading-relaxed`}>
                  {venue.notes}
                </p>
              </div>
            )}

            {/* Venue Code (for reference) */}
            <div className="flex items-center space-x-2">
              <span className="px-2 py-1 bg-white/10 text-white/60 text-xs rounded border border-white/20">
                ID: {venue.code}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 space-y-3">
            <AnimatedButton
              variant="primary"
              size="medium"
              onClick={handleGetDirections}
              className="w-full"
            >
              <Navigation className="w-4 h-4 mr-2" />
              {currentContent.getDirections}
            </AnimatedButton>
            
            <AnimatedButton
              variant="outline"
              size="medium"
              onClick={handleViewOnMap}
              className="w-full"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              {currentContent.viewOnMap}
            </AnimatedButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VenueCard;
