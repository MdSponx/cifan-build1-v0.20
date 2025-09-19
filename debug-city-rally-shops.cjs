// Debug script to test City Rally shops loading
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, orderBy } = require('firebase/firestore');

// Firebase configuration (matching src/firebase.ts)
const firebaseConfig = {
  apiKey: "AIzaSyDzDuGiiL5RfqE1y1kLQp16RQPnYJbWw_I",
  authDomain: "cifan-c41c6.firebaseapp.com",
  projectId: "cifan-c41c6",
  storageBucket: "cifan-c41c6.firebasestorage.app",
  messagingSenderId: "789354543255",
  appId: "1:789354543255:web:4506a0d3f2b5ff97e491d2",
  measurementId: "G-EFSKHEYFWC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Chiang Mai center coordinates
const CHIANG_MAI_CENTER = {
  lat: 18.7883,
  lng: 98.9853
};

// Function to extract coordinates from Google Maps URL (updated version)
function extractCoordinatesFromUrl(url) {
  if (!url || typeof url !== 'string') return null;
  
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
    console.error('Error extracting coordinates:', error);
    return null;
  }
}

// Function to get coordinates from shop address using address-based geocoding fallback
function getCoordinatesFromAddress(address, shopName) {
  if (!address) return null;
  
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

// Function to map Thai category to English
function mapThaiCategoryToEnglish(thaiCategory) {
  const categoryMap = {
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
    'ร้านกาแฟ / เครื่องดื่ม': 'cafe',
    'ร้านค้า': 'shopping',
    'บริการ': 'other'
  };
  
  return categoryMap[thaiCategory] || 'other';
}

async function debugCityRallyShops() {
  try {
    console.log('🔍 Starting City Rally shops debug...');
    
    // Get all shops from Firestore
    const shopsRef = collection(db, 'shops');
    const q = query(shopsRef, orderBy('Shop', 'asc'));
    const querySnapshot = await getDocs(q);
    
    console.log(`📊 Total shops in database: ${querySnapshot.size}`);
    
    const shops = [];
    const shopsWithCoords = [];
    const shopsWithoutCoords = [];
    const categoryStats = {};
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      // Extract coordinates from Location URL or use address-based fallback
      let coordinates = extractCoordinatesFromUrl(data.Location || '');
      
      // If URL extraction failed, use address-based geocoding fallback
      if (!coordinates && data.Address) {
        coordinates = getCoordinatesFromAddress(data.Address, data.Shop);
      }
      
      // Map Thai category to English
      const categoryEn = mapThaiCategoryToEnglish(data.Category || '');
      
      const shop = {
        id: doc.id,
        Shop: data.Shop || '',
        Address: data.Address || '',
        Category: data.Category || '',
        Location: data.Location || '',
        Phone: data.Phone || '',
        categoryEn: categoryEn,
        coordinates: coordinates
      };
      
      shops.push(shop);
      
      // Track statistics
      if (coordinates) {
        shopsWithCoords.push(shop);
      } else {
        shopsWithoutCoords.push(shop);
      }
      
      // Category statistics
      if (!categoryStats[categoryEn]) {
        categoryStats[categoryEn] = 0;
      }
      categoryStats[categoryEn]++;
    });
    
    console.log('\n📈 STATISTICS:');
    console.log(`✅ Shops with coordinates: ${shopsWithCoords.length}`);
    console.log(`❌ Shops without coordinates: ${shopsWithoutCoords.length}`);
    console.log(`📍 Coordinate extraction rate: ${((shopsWithCoords.length / shops.length) * 100).toFixed(1)}%`);
    
    console.log('\n🏷️ CATEGORY BREAKDOWN:');
    Object.entries(categoryStats).forEach(([category, count]) => {
      console.log(`   ${category}: ${count} shops`);
    });
    
    console.log('\n🗺️ SAMPLE SHOPS WITH COORDINATES:');
    shopsWithCoords.slice(0, 5).forEach((shop, index) => {
      console.log(`${index + 1}. ${shop.Shop}`);
      console.log(`   Category: ${shop.Category} (${shop.categoryEn})`);
      console.log(`   Coordinates: ${shop.coordinates.lat}, ${shop.coordinates.lng}`);
      console.log(`   Location URL: ${shop.Location.substring(0, 80)}...`);
      console.log('');
    });
    
    if (shopsWithoutCoords.length > 0) {
      console.log('\n❌ SAMPLE SHOPS WITHOUT COORDINATES:');
      shopsWithoutCoords.slice(0, 3).forEach((shop, index) => {
        console.log(`${index + 1}. ${shop.Shop}`);
        console.log(`   Category: ${shop.Category}`);
        console.log(`   Location URL: ${shop.Location || 'No URL'}`);
        console.log('');
      });
    }
    
    // Check coordinate ranges (should be around Chiang Mai)
    if (shopsWithCoords.length > 0) {
      const lats = shopsWithCoords.map(s => s.coordinates.lat);
      const lngs = shopsWithCoords.map(s => s.coordinates.lng);
      
      console.log('\n🌍 COORDINATE RANGES:');
      console.log(`   Latitude: ${Math.min(...lats).toFixed(4)} to ${Math.max(...lats).toFixed(4)}`);
      console.log(`   Longitude: ${Math.min(...lngs).toFixed(4)} to ${Math.max(...lngs).toFixed(4)}`);
      console.log(`   Chiang Mai center: 18.7883, 98.9853`);
      
      // Check if coordinates are reasonable for Chiang Mai
      const chiangMaiLat = 18.7883;
      const chiangMaiLng = 98.9853;
      const validCoords = shopsWithCoords.filter(shop => {
        const latDiff = Math.abs(shop.coordinates.lat - chiangMaiLat);
        const lngDiff = Math.abs(shop.coordinates.lng - chiangMaiLng);
        return latDiff < 1 && lngDiff < 1; // Within ~100km of Chiang Mai
      });
      
      console.log(`   Shops near Chiang Mai: ${validCoords.length}/${shopsWithCoords.length}`);
    }
    
    console.log('\n✅ Debug complete!');
    
  } catch (error) {
    console.error('❌ Error debugging shops:', error);
  }
}

// Run the debug
debugCityRallyShops();
