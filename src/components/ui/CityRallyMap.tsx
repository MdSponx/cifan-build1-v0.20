import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Shop, ShopCategory, ShopFilter } from '../../types/shop.types';
import { shopService } from '../../services/shopService';
import { CHIANG_MAI_CENTER, DEFAULT_ZOOM, getCategoryIcon, getCategoryColor } from '../../utils/mapUtils';
import { GOOGLE_MAPS_CONFIG } from '../../config/googleMaps';
import { 
  MapPin, 
  Search, 
  Filter, 
  Loader2, 
  AlertCircle, 
  Navigation,
  ExternalLink,
  X,
  Phone,
  Clock,
  Globe,
  MessageCircle,
  Instagram,
  Facebook
} from 'lucide-react';
import AnimatedButton from './AnimatedButton';

interface CityRallyMapProps {
  className?: string;
}

interface ShopPopup {
  shop: Shop;
  position: { x: number; y: number };
}

const CityRallyMap: React.FC<CityRallyMapProps> = ({ className = '' }) => {
  const { i18n } = useTranslation();
  const currentLanguage = i18n.language as 'en' | 'th';
  const mapRef = useRef<HTMLDivElement>(null);
  
  // State management
  const [shops, setShops] = useState<Shop[]>([]);
  const [filteredShops, setFilteredShops] = useState<Shop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedShop, setSelectedShop] = useState<ShopPopup | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter state
  const [filter, setFilter] = useState<ShopFilter>({
    category: 'all',
    searchTerm: '',
    featured: undefined
  });

  // Content translations
  const content = {
    th: {
      title: 'แผนที่ City Rally',
      subtitle: 'สำรวจร้านค้าที่เข้าร่วม 100+ แห่งทั่วเชียงใหม่',
      searchPlaceholder: 'ค้นหาร้านค้า...',
      filterByCategory: 'กรองตามประเภท',
      loading: 'กำลังโหลดแผนที่...',
      error: 'ไม่สามารถโหลดแผนที่ได้',
      noShops: 'ไม่พบร้านค้า',
      getDirections: 'รับเส้นทาง',
      viewOnMap: 'ดูบนแผนที่',
      callShop: 'โทรหาร้าน',
      visitWebsite: 'เยี่ยมชมเว็บไซต์',
      contactPerson: 'ผู้ติดต่อ',
      address: 'ที่อยู่',
      showFilters: 'แสดงตัวกรอง',
      hideFilters: 'ซ่อนตัวกรอง',
      shopsFound: 'พบร้านค้า',
      shops: 'ร้าน',
      close: 'ปิด',
      specialOffers: 'โปรโมชั่นพิเศษ',
      socialMedia: 'โซเชียลมีเดีย'
    },
    en: {
      title: 'City Rally Map',
      subtitle: 'Explore 100+ participating shops across Chiang Mai',
      searchPlaceholder: 'Search shops...',
      filterByCategory: 'Filter by category',
      loading: 'Loading map...',
      error: 'Unable to load map',
      noShops: 'No shops found',
      getDirections: 'Get Directions',
      viewOnMap: 'View on Map',
      callShop: 'Call Shop',
      visitWebsite: 'Visit Website',
      contactPerson: 'Contact Person',
      address: 'Address',
      showFilters: 'Show Filters',
      hideFilters: 'Hide Filters',
      shopsFound: 'shops found',
      shops: 'shops',
      close: 'Close',
      specialOffers: 'Special Offers',
      socialMedia: 'Social Media'
    }
  };

  const currentContent = content[currentLanguage];

  // Load shops on component mount
  useEffect(() => {
    loadShops();
  }, []);

  // Auto-hide loading overlay after a delay to ensure map has time to load
  useEffect(() => {
    if (!isLoading && shops.length > 0) {
      const timer = setTimeout(() => {
        setIsMapLoaded(true);
      }, 2000); // Give map 2 seconds to load
      
      return () => clearTimeout(timer);
    }
  }, [isLoading, shops.length]);

  // Filter shops when dependencies change
  useEffect(() => {
    const filtered = shopService.filterShops(shops, filter);
    setFilteredShops(filtered);
  }, [shops, filter]);

  const loadShops = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🗺️ CityRallyMap: Loading shops...');
      const allShops = await shopService.getAllShops();
      
      // Only include shops with valid coordinates
      const shopsWithCoords = shopService.getShopsWithCoordinates(allShops);
      
      console.log(`✅ CityRallyMap: Loaded ${shopsWithCoords.length} shops with coordinates`);
      setShops(shopsWithCoords);
      
    } catch (err) {
      console.error('❌ CityRallyMap: Error loading shops:', err);
      setError(currentContent.error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle shop marker click
  const handleShopClick = (shop: Shop, event: React.MouseEvent) => {
    const rect = mapRef.current?.getBoundingClientRect();
    if (rect) {
      setSelectedShop({
        shop,
        position: {
          x: event.clientX - rect.left,
          y: event.clientY - rect.top
        }
      });
    }
  };

  // Handle get directions
  const handleGetDirections = (shop: Shop) => {
    if (shop.Location) {
      window.open(shop.Location, '_blank', 'noopener,noreferrer');
    }
  };

  // Handle call shop
  const handleCallShop = (phone: string) => {
    window.open(`tel:${phone}`, '_self');
  };

  // Handle social media links
  const handleSocialMedia = (platform: string, handle: string) => {
    let url = '';
    switch (platform) {
      case 'facebook':
        url = handle.startsWith('http') ? handle : `https://facebook.com/${handle}`;
        break;
      case 'instagram':
        url = handle.startsWith('http') ? handle : `https://instagram.com/${handle}`;
        break;
      case 'line':
        url = `https://line.me/ti/p/${handle}`;
        break;
      default:
        return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Get category info
  const getCategoryInfo = (category: ShopCategory | 'all') => {
    return shopService.getCategoryInfo(category);
  };

  // Generate Google Maps embed URL for the area with all shop locations
  const generateMapUrl = () => {
    const center = CHIANG_MAI_CENTER;
    const apiKey = GOOGLE_MAPS_CONFIG.apiKey;
    
    // Always show the base map centered on Chiang Mai
    // The overlay markers will show all shop locations
    return `https://www.google.com/maps/embed/v1/view?key=${apiKey}&center=${center.lat},${center.lng}&zoom=${DEFAULT_ZOOM}&maptype=roadmap`;
  };

  // Convert coordinates to map position with proper Chiang Mai area scaling
  const coordinatesToMapPosition = (coordinates: { lat: number; lng: number }) => {
    const centerLat = CHIANG_MAI_CENTER.lat;
    const centerLng = CHIANG_MAI_CENTER.lng;
    
    // Chiang Mai metropolitan area spans roughly:
    // Latitude: 18.70 to 18.85 (0.15 degrees = ~16.7km)
    // Longitude: 98.90 to 99.05 (0.15 degrees = ~16.7km)
    const latRange = 0.15; // Actual Chiang Mai area range
    const lngRange = 0.15;
    
    // Calculate normalized offsets from center (-1 to +1)
    const latOffset = (coordinates.lat - centerLat) / latRange;
    const lngOffset = (coordinates.lng - centerLng) / lngRange;
    
    // Convert to map percentage with full utilization of map area
    // Use 80% of map area to avoid edge clipping, centered at 50%
    const x = Math.max(5, Math.min(95, 50 + lngOffset * 40)); // 80% width utilization
    const y = Math.max(5, Math.min(95, 50 - latOffset * 40)); // 80% height utilization, inverted Y
    
    return { x, y };
  };

  // Render shop markers overlay - displays ALL shop locations
  const renderShopMarkers = () => {
    if (!filteredShops.length) return null;

    console.log(`🗺️ Rendering ${filteredShops.length} shop markers on map`);

    return filteredShops.map((shop, index) => {
      if (!shop.coordinates) {
        console.log(`⚠️ Shop ${shop.Shop} has no coordinates, skipping marker`);
        return null;
      }

      const categoryEn = shop.categoryEn || 'other';
      const icon = getCategoryIcon(categoryEn);
      const color = getCategoryColor(categoryEn);
      const position = coordinatesToMapPosition(shop.coordinates);
      
      // Add slight random offset for shops with identical coordinates to prevent overlap
      const offsetX = position.x + (Math.random() - 0.5) * 0.5;
      const offsetY = position.y + (Math.random() - 0.5) * 0.5;
      
      return (
        <div
          key={`${shop.id}-${index}`}
          className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10 hover:z-20"
          style={{
            left: `${Math.max(1, Math.min(99, offsetX))}%`,
            top: `${Math.max(1, Math.min(99, offsetY))}%`,
          }}
          onClick={(e) => handleShopClick(shop, e)}
        >
          <div className="relative group">
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg border-2 border-white hover:scale-110 transition-transform duration-200 animate-pulse"
              style={{ backgroundColor: color }}
            >
              {icon}
            </div>
            
            {/* Hover tooltip */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black/80 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-30">
              <div className="font-semibold">{shop.Shop}</div>
              <div className="text-xs text-white/70">{shop.Address}</div>
            </div>
            
            {/* Pulsing ring animation for better visibility */}
            <div className="absolute inset-0 rounded-full border-2 border-white/30 animate-ping"></div>
          </div>
        </div>
      );
    });
  };

  // Render shop popup
  const renderShopPopup = () => {
    if (!selectedShop) return null;

    const { shop } = selectedShop;
    const categoryEn = shop.categoryEn || 'other';
    const categoryInfo = getCategoryInfo(categoryEn);

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <div className="bg-[#110D16] rounded-xl border border-white/20 max-w-md w-full max-h-[80vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-start justify-between p-4 border-b border-white/10">
            <div className="flex items-start space-x-3">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: categoryInfo.color }}
              >
                {categoryInfo.icon}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{shop.Shop}</h3>
                <p className="text-sm text-white/60">
                  {currentLanguage === 'th' ? categoryInfo.labelTh : categoryInfo.labelEn}
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedShop(null)}
              className="text-white/60 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Address */}
            {shop.Address && (
              <div className="space-y-1">
                <p className="text-white/60 text-sm font-medium">{currentContent.address}</p>
                <p className="text-white/80 text-sm">{shop.Address}</p>
              </div>
            )}

            {/* Contact Person */}
            {shop.Contact_Person && (
              <div className="space-y-1">
                <p className="text-white/60 text-sm font-medium">{currentContent.contactPerson}</p>
                <p className="text-white/80 text-sm">{shop.Contact_Person}</p>
              </div>
            )}

            {/* Phone */}
            {shop.Phone && (
              <button
                onClick={() => handleCallShop(shop.Phone)}
                className="flex items-center space-x-2 text-[#FCB283] hover:text-white transition-colors"
              >
                <Phone className="w-4 h-4" />
                <span className="text-sm">{shop.Phone}</span>
              </button>
            )}

            {/* Special Offers */}
            {shop['ส่วนลดหรือโปรโมชั่นพิเศษที่จะมอบให้ผู้ถือ Passport'] && (
              <div className="space-y-1">
                <p className="text-white/60 text-sm font-medium">{currentContent.specialOffers}</p>
                <p className="text-white/80 text-sm">{shop['ส่วนลดหรือโปรโมชั่นพิเศษที่จะมอบให้ผู้ถือ Passport']}</p>
              </div>
            )}

            {/* Social Media */}
            <div className="space-y-2">
              <p className="text-white/60 text-sm font-medium">{currentContent.socialMedia}</p>
              <div className="flex flex-wrap gap-2">
                {shop.Facebook && (
                  <button
                    onClick={() => handleSocialMedia('facebook', shop.Facebook)}
                    className="flex items-center space-x-1 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
                  >
                    <Facebook className="w-3 h-3" />
                    <span>Facebook</span>
                  </button>
                )}
                {shop.Instagram && (
                  <button
                    onClick={() => handleSocialMedia('instagram', shop.Instagram)}
                    className="flex items-center space-x-1 px-2 py-1 bg-pink-600 text-white rounded text-xs hover:bg-pink-700 transition-colors"
                  >
                    <Instagram className="w-3 h-3" />
                    <span>Instagram</span>
                  </button>
                )}
                {shop['id line'] && (
                  <button
                    onClick={() => handleSocialMedia('line', shop['id line'])}
                    className="flex items-center space-x-1 px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 transition-colors"
                  >
                    <MessageCircle className="w-3 h-3" />
                    <span>Line</span>
                  </button>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2">
              <AnimatedButton
                variant="primary"
                size="medium"
                onClick={() => handleGetDirections(shop)}
                className="w-full"
              >
                <Navigation className="w-4 h-4 mr-2" />
                {currentContent.getDirections}
              </AnimatedButton>
              
              <AnimatedButton
                variant="outline"
                size="medium"
                onClick={() => {
                  setSelectedShop(null);
                  if (shop.Location) {
                    window.open(shop.Location, '_blank', 'noopener,noreferrer');
                  }
                }}
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

  // Loading state
  if (isLoading) {
    return (
      <div className={`relative bg-black/20 rounded-xl overflow-hidden ${className}`}>
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-[#FCB283] mx-auto mb-4" />
            <p className="text-white/70 text-lg">{currentContent.loading}</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`relative bg-gradient-to-br from-gray-800/60 to-gray-900/60 rounded-xl overflow-hidden ${className}`}>
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 mx-auto mb-6 bg-white/10 rounded-full flex items-center justify-center">
              <MapPin className="w-10 h-10 text-[#FCB283]" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">
              {currentContent.title}
            </h3>
            <p className="text-white/70 mb-6">
              {currentContent.subtitle}
            </p>
            <AnimatedButton
              variant="primary"
              size="medium"
              onClick={() => window.open('https://maps.google.com/search/chiang+mai+shops', '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              {currentContent.viewOnMap}
            </AnimatedButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative bg-black/20 rounded-xl overflow-hidden ${className}`} ref={mapRef}>
        {/* Map Container */}
        <div className="relative w-full h-full min-h-[60vh] md:min-h-[70vh]">
          {/* Google Maps Embed */}
          <div className="absolute inset-0">
            <iframe
              src={generateMapUrl()}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="rounded-xl"
              title="City Rally Map - Chiang Mai Shops"
              onLoad={() => {
                // Map iframe has loaded, hide overlay after a short delay
                setTimeout(() => setIsMapLoaded(true), 1000);
              }}
            />
          </div>
          
          {/* Shop Markers Overlay - Shows ALL shop locations */}
          {isMapLoaded && (
            <div className="absolute inset-0 pointer-events-none z-10">
              <div className="relative w-full h-full pointer-events-auto">
                {renderShopMarkers()}
              </div>
            </div>
          )}
        
        {/* Map Loading Overlay - will fade out as map loads */}
        {!isMapLoaded && (
          <div className="absolute inset-0 bg-gradient-to-br from-[#FCB283]/20 to-[#AA4626]/20 flex items-center justify-center pointer-events-none z-10 transition-opacity duration-1000">
            <div className="text-center">
              <MapPin className="w-16 h-16 text-[#FCB283] mx-auto mb-2 animate-pulse" />
              <p className="text-white/60 text-lg font-medium">Loading Interactive Map...</p>
              <p className="text-white/40 text-sm">City Rally Chiang Mai</p>
            </div>
          </div>
        )}

        {/* Floating Controls */}
        <div className="absolute top-4 left-4 right-4 z-20">
          <div className="flex flex-col space-y-3">
            {/* Title Overlay */}
            <div className="bg-black/60 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <h2 className="text-xl md:text-2xl font-bold text-white mb-1">
                {currentContent.title}
              </h2>
              <p className="text-white/80 text-sm">
                {filteredShops.length} {currentContent.shopsFound}
              </p>
            </div>

            {/* Search Bar */}
            <div className="bg-black/60 backdrop-blur-sm rounded-lg p-3 border border-white/20">
              <div className="flex space-x-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-4 h-4" />
                  <input
                    type="text"
                    placeholder={currentContent.searchPlaceholder}
                    value={filter.searchTerm}
                    onChange={(e) => setFilter(prev => ({ ...prev, searchTerm: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:border-[#FCB283] focus:outline-none transition-colors text-sm"
                  />
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-3 py-2 rounded-lg border transition-colors ${
                    showFilters 
                      ? 'bg-[#FCB283] border-[#FCB283] text-white' 
                      : 'bg-white/10 border-white/20 text-white/70 hover:bg-white/20'
                  }`}
                >
                  <Filter className="w-4 h-4" />
                </button>
              </div>

              {/* Category Filters */}
              {showFilters && (
                <div className="mt-3 pt-3 border-t border-white/10">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {(['all', 'restaurant', 'cafe', 'hotel', 'handicraft', 'massage', 'shopping'] as const).map((category) => {
                      const categoryInfo = getCategoryInfo(category);
                      const isSelected = filter.category === category;
                      
                      return (
                        <button
                          key={category}
                          onClick={() => setFilter(prev => ({ ...prev, category }))}
                          className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs transition-colors ${
                            isSelected
                              ? 'bg-[#FCB283] text-white'
                              : 'bg-white/10 text-white/70 hover:bg-white/20'
                          }`}
                        >
                          <span>{categoryInfo.icon}</span>
                          <span className="truncate">
                            {currentLanguage === 'th' ? categoryInfo.labelTh : categoryInfo.labelEn}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Shop Popup */}
      {renderShopPopup()}
    </div>
  );
};

export default CityRallyMap;
