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

// Helper function to extract coordinates from Google Maps URL
export const extractCoordinatesFromUrl = (url: string): { lat: number; lng: number } | null => {
  try {
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
export const generateEmbedUrl = (locationUrl: string, zoom: number = 15): string => {
  const coords = extractCoordinatesFromUrl(locationUrl);
  
  if (coords) {
    return `https://www.google.com/maps/embed/v1/place?key=${GOOGLE_MAPS_CONFIG.apiKey}&q=${coords.lat},${coords.lng}&zoom=${zoom}`;
  }
  
  // Fallback: try to use the original URL as a place search
  const encodedUrl = encodeURIComponent(locationUrl);
  return `https://www.google.com/maps/embed/v1/search?key=${GOOGLE_MAPS_CONFIG.apiKey}&q=${encodedUrl}&zoom=${zoom}`;
};
