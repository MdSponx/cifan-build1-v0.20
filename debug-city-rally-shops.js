// Debug script to test City Rally shops loading
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, orderBy } = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDjjWQSRbXbNkZt5P2Hn4W8Z9X7Y6V5U4T",
  authDomain: "cifan-build1.firebaseapp.com",
  projectId: "cifan-build1",
  storageBucket: "cifan-build1.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456789012345678"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Function to extract coordinates from Google Maps URL
function extractCoordinatesFromUrl(url) {
  if (!url || typeof url !== 'string') return null;
  
  try {
    // Pattern 1: @lat,lng,zoom format
    const atPattern = /@(-?\d+\.?\d*),(-?\d+\.?\d*),/;
    const atMatch = url.match(atPattern);
    if (atMatch) {
      return {
        lat: parseFloat(atMatch[1]),
        lng: parseFloat(atMatch[2])
      };
    }
    
    // Pattern 2: ll=lat,lng format
    const llPattern = /ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/;
    const llMatch = url.match(llPattern);
    if (llMatch) {
      return {
        lat: parseFloat(llMatch[1]),
        lng: parseFloat(llMatch[2])
      };
    }
    
    // Pattern 3: q=lat,lng format
    const qPattern = /q=(-?\d+\.?\d*),(-?\d+\.?\d*)/;
    const qMatch = url.match(qPattern);
    if (qMatch) {
      return {
        lat: parseFloat(qMatch[1]),
        lng: parseFloat(qMatch[2])
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting coordinates:', error);
    return null;
  }
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
    'สถานที่ท่องเที่ยว': 'attraction'
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
      
      // Extract coordinates from Location URL
      const coordinates = extractCoordinatesFromUrl(data.Location || '');
      
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
