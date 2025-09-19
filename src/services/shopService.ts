import { collection, getDocs, query, orderBy, where, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { Shop, ShopCategory, ShopFilter, ShopStats } from '../types/shop.types';
import { extractCoordinatesFromUrl, mapThaiCategoryToEnglish } from '../utils/mapUtils';

class ShopService {
  private readonly collectionName = 'shops';

  /**
   * Get all shops from Firestore
   */
  async getAllShops(): Promise<Shop[]> {
    try {
      console.log('🏪 ShopService: Fetching all shops...');
      
      const shopsRef = collection(db, this.collectionName);
      const q = query(shopsRef, orderBy('Shop', 'asc'));
      const querySnapshot = await getDocs(q);
      
      const shops: Shop[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        // Extract coordinates from Location URL or use address-based fallback
        let coordinates = extractCoordinatesFromUrl(data.Location || '');
        
        // If URL extraction failed, use address-based geocoding fallback
        if (!coordinates && data.Address) {
          coordinates = this.getCoordinatesFromAddress(data.Address, data.Shop);
        }
        
        // Map Thai category to English
        const categoryEn = mapThaiCategoryToEnglish(data.Category || '') as ShopCategory;
        
        const shop: Shop = {
          id: doc.id,
          
          // Core Firestore fields
          Shop: data.Shop || '',
          Address: data.Address || '',
          Category: data.Category || '',
          Contact_Person: data.Contact_Person || '',
          Location: data.Location || '',
          Phone: data.Phone || '',
          NO: data.NO || 0,
          
          // Social Media fields
          Facebook: data.Facebook || '',
          Instagram: data.Instagram || '',
          TikTok: data.TikTok || '',
          'id line': data['id line'] || '',
          
          // Additional info fields
          'ข้อเสนอแนะ/ คำถามเพิ่มเติม': data['ข้อเสนอแนะ/ คำถามเพิ่มเติม'] || '',
          'ท่านพร้อมที่จะ': data['ท่านพร้อมที่จะ'] || '',
          'ส่วนลดหรือโปรโมชั่นพิเศษที่จะมอบให้ผู้ถือ Passport': data['ส่วนลดหรือโปรโมชั่นพิเศษที่จะมอบให้ผู้ถือ Passport'] || '',
          
          // Extra columns
          'คอลัมน์ 1': data['คอลัมน์ 1'] || '',
          'คอลัมน์ 2': data['คอลัมน์ 2'] || '',
          'คอลัมน์ 3': data['คอลัมน์ 3'] || '',
          'คอลัมน์ 4': data['คอลัมน์ 4'] || '',
          
          // Processed fields
          categoryEn: categoryEn,
          coordinates: coordinates ? {
            lat: coordinates.lat,
            lng: coordinates.lng
          } : undefined,
          featured: data.featured || false,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate()
        };
        
        shops.push(shop);
      });
      
      console.log(`✅ ShopService: Loaded ${shops.length} shops`);
      return shops;
      
    } catch (error) {
      console.error('❌ ShopService: Error fetching shops:', error);
      throw new Error('Failed to fetch shops');
    }
  }

  /**
   * Get shops by category (using English category)
   */
  async getShopsByCategory(category: ShopCategory): Promise<Shop[]> {
    try {
      // Get all shops first, then filter by English category
      // This is because Firestore stores Thai categories
      const allShops = await this.getAllShops();
      return allShops.filter(shop => shop.categoryEn === category);
      
    } catch (error) {
      console.error('❌ ShopService: Error fetching shops by category:', error);
      throw new Error(`Failed to fetch shops for category: ${category}`);
    }
  }

  /**
   * Get featured shops
   */
  async getFeaturedShops(limitCount: number = 10): Promise<Shop[]> {
    try {
      const allShops = await this.getAllShops();
      return allShops
        .filter(shop => shop.featured)
        .slice(0, limitCount);
        
    } catch (error) {
      console.error('❌ ShopService: Error fetching featured shops:', error);
      throw new Error('Failed to fetch featured shops');
    }
  }

  /**
   * Filter shops based on criteria
   */
  filterShops(shops: Shop[], filter: ShopFilter): Shop[] {
    let filtered = [...shops];

    // Filter by category
    if (filter.category !== 'all') {
      filtered = filtered.filter(shop => shop.categoryEn === filter.category);
    }

    // Filter by search term
    if (filter.searchTerm) {
      const searchLower = filter.searchTerm.toLowerCase();
      filtered = filtered.filter(shop => 
        shop.Shop.toLowerCase().includes(searchLower) ||
        shop.Address.toLowerCase().includes(searchLower) ||
        shop.Category.toLowerCase().includes(searchLower) ||
        shop.Contact_Person.toLowerCase().includes(searchLower) ||
        (shop.categoryEn && shop.categoryEn.toLowerCase().includes(searchLower))
      );
    }

    // Filter by featured status
    if (filter.featured !== undefined) {
      filtered = filtered.filter(shop => shop.featured === filter.featured);
    }

    return filtered;
  }

  /**
   * Get shop statistics
   */
  getShopStats(shops: Shop[]): ShopStats {
    const stats: ShopStats = {
      total: shops.length,
      byCategory: {
        restaurant: 0,
        cafe: 0,
        hotel: 0,
        accommodation: 0,
        handicraft: 0,
        souvenir: 0,
        massage: 0,
        spa: 0,
        cinema: 0,
        shopping: 0,
        attraction: 0,
        other: 0
      },
      featured: 0
    };

    shops.forEach(shop => {
      // Count by category
      const category = shop.categoryEn || 'other';
      if (stats.byCategory[category] !== undefined) {
        stats.byCategory[category]++;
      } else {
        stats.byCategory.other++;
      }

      // Count featured shops
      if (shop.featured) {
        stats.featured++;
      }
    });

    return stats;
  }

  /**
   * Get shops with valid coordinates only
   */
  getShopsWithCoordinates(shops: Shop[]): Shop[] {
    return shops.filter(shop => 
      shop.coordinates && 
      shop.coordinates.lat !== 0 && 
      shop.coordinates.lng !== 0
    );
  }

  /**
   * Get category display info
   */
  getCategoryInfo(category: ShopCategory | 'all') {
    const categoryMap = {
      all: { 
        labelEn: 'All Shops', 
        labelTh: 'ร้านค้าทั้งหมด', 
        icon: '🏪',
        color: '#FCB283'
      },
      restaurant: { 
        labelEn: 'Restaurants', 
        labelTh: 'ร้านอาหาร', 
        icon: '🍽️',
        color: '#FF6B6B'
      },
      cafe: { 
        labelEn: 'Cafés', 
        labelTh: 'คาเฟ่', 
        icon: '☕',
        color: '#8B4513'
      },
      hotel: { 
        labelEn: 'Hotels', 
        labelTh: 'โรงแรม', 
        icon: '🏨',
        color: '#4ECDC4'
      },
      accommodation: { 
        labelEn: 'Accommodations', 
        labelTh: 'ที่พัก', 
        icon: '🏠',
        color: '#45B7D1'
      },
      handicraft: { 
        labelEn: 'Handicrafts', 
        labelTh: 'หัตถกรรม', 
        icon: '🎨',
        color: '#96CEB4'
      },
      souvenir: { 
        labelEn: 'Souvenirs', 
        labelTh: 'ของฝาก', 
        icon: '🎁',
        color: '#FFEAA7'
      },
      massage: { 
        labelEn: 'Massage', 
        labelTh: 'นวด', 
        icon: '💆',
        color: '#DDA0DD'
      },
      spa: { 
        labelEn: 'Spas', 
        labelTh: 'สปา', 
        icon: '🧘',
        color: '#E17055'
      },
      cinema: { 
        labelEn: 'Cinemas', 
        labelTh: 'โรงภาพยนตร์', 
        icon: '🎬',
        color: '#6C5CE7'
      },
      shopping: { 
        labelEn: 'Shopping', 
        labelTh: 'ช้อปปิ้ง', 
        icon: '🛍️',
        color: '#FD79A8'
      },
      attraction: { 
        labelEn: 'Attractions', 
        labelTh: 'สถานที่ท่องเที่ยว', 
        icon: '🏛️',
        color: '#FDCB6E'
      },
      other: { 
        labelEn: 'Others', 
        labelTh: 'อื่นๆ', 
        icon: '📍',
        color: '#74B9FF'
      }
    };

    return categoryMap[category] || categoryMap.other;
  }

  /**
   * Get coordinates from shop address using address-based geocoding fallback
   */
  private getCoordinatesFromAddress(address: string, shopName: string): { lat: number; lng: number } | null {
    if (!address) return null;
    
    // Chiang Mai center coordinates
    const CHIANG_MAI_CENTER = { lat: 18.7883, lng: 98.9853 };
    
    // Define different areas of Chiang Mai with their approximate coordinates
    const chiangMaiAreas = [
      // Old City area
      { name: 'old city', center: { lat: 18.7883, lng: 98.9853 }, keywords: ['old city', 'ประตู', 'gate', 'moat', 'เมืองเก่า'] },
      
      // Nimman area
      { name: 'nimman', center: { lat: 18.8000, lng: 98.9700 }, keywords: ['nimman', 'นิมมาน', 'maya', 'one nimman'] },
      
      // Chang Khlan / Night Bazaar area
      { name: 'chang khlan', center: { lat: 18.7850, lng: 99.0000 }, keywords: ['chang khlan', 'night bazaar', 'ช้างคลาน', 'bazaar'] },
      
      // Santitham area
      { name: 'santitham', center: { lat: 18.8100, lng: 98.9600 }, keywords: ['santitham', 'สันติธรรม', 'university'] },
      
      // Huay Kaew area
      { name: 'huay kaew', center: { lat: 18.8200, lng: 98.9500 }, keywords: ['huay kaew', 'ห้วยแก้ว', 'zoo', 'doi suthep'] },
      
      // Hang Dong area
      { name: 'hang dong', center: { lat: 18.7000, lng: 98.9000 }, keywords: ['hang dong', 'หางดง'] },
      
      // San Kamphaeng area
      { name: 'san kamphaeng', center: { lat: 18.7500, lng: 99.1200 }, keywords: ['san kamphaeng', 'สันกำแพง'] },
      
      // Mae Rim area
      { name: 'mae rim', center: { lat: 18.9000, lng: 98.9000 }, keywords: ['mae rim', 'แม่ริม'] },
      
      // Saraphi area
      { name: 'saraphi', center: { lat: 18.7200, lng: 99.0200 }, keywords: ['saraphi', 'สารภี'] },
      
      // Airport area
      { name: 'airport', center: { lat: 18.7700, lng: 99.0100 }, keywords: ['airport', 'สนามบิน'] }
    ];
    
    // Convert address to lowercase for matching
    const addressLower = address.toLowerCase();
    const shopNameLower = shopName.toLowerCase();
    
    // Find matching area based on keywords
    let selectedArea = null;
    for (const area of chiangMaiAreas) {
      for (const keyword of area.keywords) {
        if (addressLower.includes(keyword) || shopNameLower.includes(keyword)) {
          selectedArea = area;
          break;
        }
      }
      if (selectedArea) break;
    }
    
    // If no specific area found, use city center
    if (!selectedArea) {
      selectedArea = { name: 'center', center: CHIANG_MAI_CENTER, keywords: [] };
    }
    
    // Generate coordinates within the selected area with some randomness
    const baseCoords = selectedArea.center;
    
    // Create a hash from shop name for consistent positioning
    let hash = 0;
    for (let i = 0; i < shopName.length; i++) {
      const char = shopName.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Use hash to generate consistent but pseudo-random offsets
    const random1 = (Math.sin(hash) + 1) / 2; // 0-1
    const random2 = (Math.sin(hash * 2) + 1) / 2; // 0-1
    
    // Generate offset within ~2km radius of area center
    const maxOffset = 0.02; // ~2km
    const latOffset = (random1 - 0.5) * maxOffset;
    const lngOffset = (random2 - 0.5) * maxOffset;
    
    const coordinates = {
      lat: baseCoords.lat + latOffset,
      lng: baseCoords.lng + lngOffset
    };
    
    console.log(`📍 Generated coordinates for ${shopName} in ${selectedArea.name} area:`, coordinates);
    
    return coordinates;
  }

  /**
   * Get shops by Thai category (for direct Firestore queries)
   */
  async getShopsByThaiCategory(thaiCategory: string): Promise<Shop[]> {
    try {
      const shopsRef = collection(db, this.collectionName);
      const q = query(
        shopsRef, 
        where('Category', '==', thaiCategory),
        orderBy('Shop', 'asc')
      );
      const querySnapshot = await getDocs(q);
      
      const shops: Shop[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const coordinates = extractCoordinatesFromUrl(data.Location || '');
        const categoryEn = mapThaiCategoryToEnglish(data.Category || '') as ShopCategory;
        
        const shop: Shop = {
          id: doc.id,
          Shop: data.Shop || '',
          Address: data.Address || '',
          Category: data.Category || '',
          Contact_Person: data.Contact_Person || '',
          Location: data.Location || '',
          Phone: data.Phone || '',
          NO: data.NO || 0,
          Facebook: data.Facebook || '',
          Instagram: data.Instagram || '',
          TikTok: data.TikTok || '',
          'id line': data['id line'] || '',
          'ข้อเสนอแนะ/ คำถามเพิ่มเติม': data['ข้อเสนอแนะ/ คำถามเพิ่มเติม'] || '',
          'ท่านพร้อมที่จะ': data['ท่านพร้อมที่จะ'] || '',
          'ส่วนลดหรือโปรโมชั่นพิเศษที่จะมอบให้ผู้ถือ Passport': data['ส่วนลดหรือโปรโมชั่นพิเศษที่จะมอบให้ผู้ถือ Passport'] || '',
          'คอลัมน์ 1': data['คอลัมน์ 1'] || '',
          'คอลัมน์ 2': data['คอลัมน์ 2'] || '',
          'คอลัมน์ 3': data['คอลัมน์ 3'] || '',
          'คอลัมน์ 4': data['คอลัมน์ 4'] || '',
          categoryEn: categoryEn,
          coordinates: coordinates ? {
            lat: coordinates.lat,
            lng: coordinates.lng
          } : undefined,
          featured: data.featured || false,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate()
        };
        
        shops.push(shop);
      });
      
      return shops;
    } catch (error) {
      console.error('❌ ShopService: Error fetching shops by Thai category:', error);
      throw new Error(`Failed to fetch shops for Thai category: ${thaiCategory}`);
    }
  }
}

// Export singleton instance
export const shopService = new ShopService();
