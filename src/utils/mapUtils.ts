// Utility functions for Google Maps integration

/**
 * Extract coordinates from various Google Maps URL formats
 */
export function extractCoordinatesFromUrl(url: string): { lat: number; lng: number } | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  try {
    // Handle different Google Maps URL formats
    
    // Format 1: maps.app.goo.gl (shortened URLs) - use address-based coordinates
    if (url.includes('maps.app.goo.gl') || url.includes('share.google')) {
      // For shortened URLs, we can't extract coordinates directly
      // Return null to indicate we need to use address-based geocoding
      console.warn('Shortened Google Maps URL detected, requires address-based geocoding:', url);
      return null;
    }
    
    // Format 2: google.com/maps with @lat,lng
    const atMatch = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (atMatch) {
      return {
        lat: parseFloat(atMatch[1]),
        lng: parseFloat(atMatch[2])
      };
    }
    
    // Format 3: google.com/maps with ll= parameter
    const llMatch = url.match(/ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (llMatch) {
      return {
        lat: parseFloat(llMatch[1]),
        lng: parseFloat(llMatch[2])
      };
    }
    
    // Format 4: google.com/maps with q= parameter (coordinates)
    const qMatch = url.match(/q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (qMatch) {
      return {
        lat: parseFloat(qMatch[1]),
        lng: parseFloat(qMatch[2])
      };
    }
    
    // Format 5: google.com/maps with center= parameter
    const centerMatch = url.match(/center=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (centerMatch) {
      return {
        lat: parseFloat(centerMatch[1]),
        lng: parseFloat(centerMatch[2])
      };
    }
    
    console.warn('Could not extract coordinates from URL:', url);
    return null;
    
  } catch (error) {
    console.error('Error extracting coordinates from URL:', error);
    return null;
  }
}

/**
 * Resolve shortened Google Maps URLs to get coordinates
 * This would typically require a server-side proxy or the Google Maps API
 */
export async function resolveShortUrl(shortUrl: string): Promise<{ lat: number; lng: number } | null> {
  try {
    // In a real implementation, you would:
    // 1. Make a request to the shortened URL with redirect=false
    // 2. Extract the full URL from the Location header
    // 3. Parse coordinates from the full URL
    
    // For now, we'll use a fallback approach
    console.warn('Short URL resolution not implemented:', shortUrl);
    return null;
  } catch (error) {
    console.error('Error resolving short URL:', error);
    return null;
  }
}

/**
 * Map Thai category names to English categories
 */
export function mapThaiCategoryToEnglish(thaiCategory: string): string {
  const categoryMap: Record<string, string> = {
    'ร้านอาหาร': 'restaurant',
    'คาเฟ่': 'cafe',
    'โรงแรม': 'hotel',
    'ที่พัก': 'accommodation',
    'หัตถกรรม': 'handicraft',
    'ของฝาก': 'souvenir',
    'นวด': 'massage',
    'สปา': 'spa',
    'โรงภาพยนตร์': 'cinema',
    'ช้อปปิ้ง': 'shopping',
    'สถานที่ท่องเที่ยว': 'attraction',
    'ร้านค้า': 'shopping',
    'บริการ': 'other'
  };
  
  return categoryMap[thaiCategory] || 'other';
}

/**
 * Get category icon for map markers
 */
export function getCategoryIcon(category: string): string {
  const iconMap: Record<string, string> = {
    'restaurant': '🍽️',
    'cafe': '☕',
    'hotel': '🏨',
    'accommodation': '🏠',
    'handicraft': '🎨',
    'souvenir': '🎁',
    'massage': '💆',
    'spa': '🧘',
    'cinema': '🎬',
    'shopping': '🛍️',
    'attraction': '🏛️',
    'other': '📍'
  };
  
  return iconMap[category] || '📍';
}

/**
 * Get category color for map markers
 */
export function getCategoryColor(category: string): string {
  const colorMap: Record<string, string> = {
    'restaurant': '#FF6B6B',
    'cafe': '#8B4513',
    'hotel': '#4ECDC4',
    'accommodation': '#45B7D1',
    'handicraft': '#96CEB4',
    'souvenir': '#FFEAA7',
    'massage': '#DDA0DD',
    'spa': '#98D8C8',
    'cinema': '#F7DC6F',
    'shopping': '#BB8FCE',
    'attraction': '#85C1E9',
    'other': '#BDC3C7'
  };
  
  return colorMap[category] || '#BDC3C7';
}

/**
 * Default center for Chiang Mai
 */
export const CHIANG_MAI_CENTER = {
  lat: 18.7883,
  lng: 98.9853
};

/**
 * Default zoom level for the city rally map
 */
export const DEFAULT_ZOOM = 13;
