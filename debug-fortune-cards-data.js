const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, where } = require('firebase/firestore');

// Firebase configuration
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

async function debugFortuneCardsData() {
  try {
    console.log('🔍 Checking films collection for fortune card data...');
    
    // Get all films
    const filmsRef = collection(db, 'films');
    const snapshot = await getDocs(filmsRef);
    
    console.log(`📊 Total films in database: ${snapshot.size}`);
    
    let filmsWithFortuneCardUrl = 0;
    let filmsWithFortuneCard = 0;
    let filmsWithBoth = 0;
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      const hasFortuneCardUrl = data.fortuneCardUrl && data.fortuneCardUrl.trim() !== '';
      const hasFortuneCard = data.fortuneCard && data.fortuneCard.trim() !== '';
      
      if (hasFortuneCardUrl) {
        filmsWithFortuneCardUrl++;
        console.log(`✅ Film with fortuneCardUrl: ${data.titleEn || data.title || doc.id}`);
        console.log(`   fortuneCardUrl: ${data.fortuneCardUrl}`);
        if (data.fortuneCard) {
          console.log(`   fortuneCard: ${data.fortuneCard}`);
        }
      }
      
      if (hasFortuneCard) {
        filmsWithFortuneCard++;
      }
      
      if (hasFortuneCardUrl && hasFortuneCard) {
        filmsWithBoth++;
      }
      
      // Log first few films for debugging
      if (filmsWithFortuneCardUrl <= 3) {
        console.log(`🎬 Film: ${data.titleEn || data.title || doc.id}`, {
          id: doc.id,
          hasFortuneCardUrl,
          hasFortuneCard,
          fortuneCardUrl: data.fortuneCardUrl,
          fortuneCard: data.fortuneCard,
          publicationStatus: data.publicationStatus,
          status: data.status
        });
      }
    });
    
    console.log('\n📈 Summary:');
    console.log(`Films with fortuneCardUrl: ${filmsWithFortuneCardUrl}`);
    console.log(`Films with fortuneCard: ${filmsWithFortuneCard}`);
    console.log(`Films with both: ${filmsWithBoth}`);
    
    if (filmsWithFortuneCardUrl === 0) {
      console.log('\n❌ No films found with fortuneCardUrl field!');
      console.log('This explains why the Fortune Cards Gallery is empty.');
    } else {
      console.log('\n✅ Found films with fortune cards!');
      console.log('The issue might be in the filtering logic or data conversion.');
    }
    
  } catch (error) {
    console.error('❌ Error checking fortune cards data:', error);
  }
}

debugFortuneCardsData();
