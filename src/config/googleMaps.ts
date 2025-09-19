// Google Maps Configuration
// Note: In production, this should be stored in environment variables
export const GOOGLE_MAPS_CONFIG = {
  apiKey: 'AIzaSyDUsELGAuxr5XDTuZA79xbj9dK9t4aNA3c',
  
  // Default map settings
  defaultZoom: 15,
  defaultCenter: {
    lat: 18.7883, // Chiang Mai coordinates
    lng: 98.9853
  },
  
  // Map styling options
  mapOptions: {
    disableDefaultUI: false,
    zoomControl: true,
    streetViewControl: false,
    fullscreenControl: false,
    mapTypeControl: false,
    styles: [
      {
        featureType: 'all',
        elementType: 'geometry.fill',
        stylers: [{ color: '#1a1625' }]
      },
      {
        featureType: 'all',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#ffffff' }]
      },
      {
        featureType: 'road',
        elementType: 'geometry',
        stylers: [{ color: '#2a2438' }]
      },
      {
        featureType: 'water',
        elementType: 'geometry',
        stylers: [{ color: '#110d16' }]
      }
    ]
  }
};

// Venue-specific coordinates mapping
// These coordinates are resolved from the actual Google Maps URLs
export const VENUE_COORDINATES: Record<string, { lat: number; lng: number; placeName: string }> = {
  // Railway Park CIFAN Pavilion venues (Stage Zone & Market)
  'https://maps.app.goo.gl/cxMLzFkjeu9fqX4t7': {
    lat: 18.7876998,
    lng: 99.0167409,
    placeName: 'Railway Park CIFAN Pavilion'
  },
  // Railway Park CIFAN Pavilion (EXPO Zone) - same location as Stage Zone
  'https://maps.app.goo.gl/cxMLzFkjeu9fqX4t8': {
    lat: 18.7876998,
    lng: 99.0167409,
    placeName: 'Railway Park CIFAN Pavilion'
  },
  // Major Cineplex Central Chiangmai (Theatre 7 & IMAX)
  'https://maps.app.goo.gl/fzULD32UgoeKK6B16': {
    lat: 18.8060386,
    lng: 99.0155392,
    placeName: 'Major Cineplex Central Chiangmai'
  },
  // Anusarn Building Sanpakoi
  'https://maps.app.goo.gl/mb3EyMUu7TTDEwJc6': {
    lat: 18.7869277,
    lng: 99.0046951,
    placeName: 'Anusarn Building Sanpakoi'
  }
};

// Helper function to extract coordinates from Google Maps URL
export const extractCoordinatesFromUrl = (url: string): { lat: number; lng: number; placeName?: string } | null => {
  try {
    // First check if we have predefined coordinates for this URL
    if (VENUE_COORDINATES[url]) {
      return VENUE_COORDINATES[url];
    }
    
    // Try to extract from various Google Maps URL formats
    const patterns = [
      /@(-?\d+\.?\d*),(-?\d+\.?\d*)/, // @lat,lng format
      /q=(-?\d+\.?\d*),(-?\d+\.?\d*)/, // q=lat,lng format
      /ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/, // ll=lat,lng format
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return {
          lat: parseFloat(match[1]),
          lng: parseFloat(match[2])
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting coordinates from URL:', error);
    return null;
  }
};

// Generate Google Maps embed URL
export const generateEmbedUrl = (locationUrl: string, zoom: number = 16): string => {
  const coords = extractCoordinatesFromUrl(locationUrl);
  
  if (coords) {
    // Use place name if available, otherwise use coordinates
    const query = coords.placeName 
      ? encodeURIComponent(coords.placeName)
      : `${coords.lat},${coords.lng}`;
    
    return `https://www.google.com/maps/embed/v1/place?key=${GOOGLE_MAPS_CONFIG.apiKey}&q=${query}&zoom=${zoom}&center=${coords.lat},${coords.lng}`;
  }
  
  // Fallback: try to use the original URL as a place search
  const encodedUrl = encodeURIComponent(locationUrl);
  return `https://www.google.com/maps/embed/v1/search?key=${GOOGLE_MAPS_CONFIG.apiKey}&q=${encodedUrl}&zoom=${zoom}`;
};

// Helper function to get venue coordinates by URL
export const getVenueCoordinates = (locationUrl: string): { lat: number; lng: number; placeName?: string } | null => {
  return extractCoordinatesFromUrl(locationUrl);
};
