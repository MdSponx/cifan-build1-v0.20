// Shop Types for City Rally Maps - Updated to match Firestore structure
export interface Shop {
  id: string;
  
  // Core Firestore fields (matching your database structure)
  Shop: string; // Shop name
  Address: string; // Full address
  Category: string; // Shop category in Thai
  Contact_Person: string; // Contact person name
  Location: string; // Google Maps URL
  Phone: string; // Phone number
  NO: number; // Shop number/ID
  
  // Social Media fields
  Facebook: string;
  Instagram: string;
  TikTok: string;
  'id line': string; // Line ID
  
  // Additional info fields
  'ข้อเสนอแนะ/ คำถามเพิ่มเติม': string; // Suggestions/Additional questions
  'ท่านพร้อมที่จะ': string; // What they're ready to do
  'ส่วนลดหรือโปรโมชั่นพิเศษที่จะมอบให้ผู้ถือ Passport': string; // Special discounts/promotions
  
  // Extra columns (seem to be empty in your example)
  'คอลัมน์ 1': string;
  'คอลัมน์ 2': string;
  'คอลัมน์ 3': string;
  'คอลัมน์ 4': string;
  
  // Processed fields (computed from the above)
  categoryEn?: ShopCategory; // English category mapping
  coordinates?: {
    lat: number;
    lng: number;
  };
  featured?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type ShopCategory = 
  | 'restaurant'
  | 'cafe'
  | 'hotel'
  | 'accommodation'
  | 'handicraft'
  | 'souvenir'
  | 'massage'
  | 'spa'
  | 'cinema'
  | 'shopping'
  | 'attraction'
  | 'other';

export interface ShopFilter {
  category: ShopCategory | 'all';
  searchTerm: string;
  featured?: boolean;
}

export interface ShopMarker {
  id: string;
  position: {
    lat: number;
    lng: number;
  };
  shop: Shop;
  category: ShopCategory;
}

// Map-related types
export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface MapCenter {
  lat: number;
  lng: number;
}

// Shop statistics
export interface ShopStats {
  total: number;
  byCategory: Record<ShopCategory, number>;
  featured: number;
}
