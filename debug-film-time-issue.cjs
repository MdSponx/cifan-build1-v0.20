const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, where } = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC4lTWUZhKEKl8Ks7Ej8ZQJhJhJhJhJhJh",
  authDomain: "cifan-web.firebaseapp.com",
  projectId: "cifan-web",
  storageBucket: "cifan-web.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdefghijklmnop"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function debugFilmTimeIssue() {
  try {
    console.log('🔍 DEBUGGING FILM TIME ISSUE');
    console.log('=====================================');
    
    // Get all published films
    const filmsQuery = query(
      collection(db, 'films'),
      where('status', '==', 'published')
    );
    
    const filmsSnapshot = await getDocs(filmsQuery);
    
    console.log(`📊 Found ${filmsSnapshot.size} published films`);
    
    filmsSnapshot.forEach((doc) => {
      const filmData = doc.data();
      const filmTitle = filmData.titleEn || filmData.title || 'Unknown Title';
      
      // Look for "Marching Boys" or films with time issues
      if (filmTitle.toLowerCase().includes('marching') || filmTitle.toLowerCase().includes('boys')) {
        console.log('\n🎬 FOUND TARGET FILM:', filmTitle);
        console.log('=====================================');
        console.log('Film ID:', doc.id);
        console.log('Title:', filmTitle);
        
        // Check all time-related fields
        console.log('\n⏰ TIME FIELDS:');
        console.log('screeningDate1:', filmData.screeningDate1);
        console.log('screeningDate2:', filmData.screeningDate2);
        console.log('startTime1:', filmData.startTime1);
        console.log('endTime1:', filmData.endTime1);
        console.log('startTime2:', filmData.startTime2);
        console.log('endTime2:', filmData.endTime2);
        console.log('timeEstimate:', filmData.timeEstimate);
        console.log('theatre:', filmData.theatre);
        
        // Check if screeningDate1 contains time information
        if (filmData.screeningDate1) {
          console.log('\n📅 SCREENING DATE 1 ANALYSIS:');
          console.log('Type:', typeof filmData.screeningDate1);
          console.log('Value:', filmData.screeningDate1);
          
          if (filmData.screeningDate1.toDate) {
            // Firestore Timestamp
            const date = filmData.screeningDate1.toDate();
            console.log('As Date:', date.toISOString());
            console.log('Hours:', date.getHours());
            console.log('Minutes:', date.getMinutes());
          } else if (typeof filmData.screeningDate1 === 'string') {
            // String format
            console.log('String format detected');
            if (filmData.screeningDate1.includes('T')) {
              const timePart = filmData.screeningDate1.split('T')[1];
              console.log('Time part:', timePart);
            }
          }
        }
        
        // Check dedicated time fields
        console.log('\n🕐 DEDICATED TIME FIELDS ANALYSIS:');
        console.log('startTime1 exists:', !!filmData.startTime1);
        console.log('startTime1 type:', typeof filmData.startTime1);
        console.log('startTime1 value:', filmData.startTime1);
        console.log('startTime1 matches HH:MM pattern:', filmData.startTime1 && filmData.startTime1.match(/^\d{2}:\d{2}$/));
        
        console.log('\n📋 ALL FILM PROPERTIES:');
        console.log(Object.keys(filmData).sort());
        
        console.log('\n=====================================');
      }
    });
    
    // Also check for any films scheduled for September 20, 2025
    console.log('\n🗓️ CHECKING FILMS FOR SEPTEMBER 20, 2025');
    console.log('=====================================');
    
    filmsSnapshot.forEach((doc) => {
      const filmData = doc.data();
      const filmTitle = filmData.titleEn || filmData.title || 'Unknown Title';
      
      // Check if film has screening date for September 20, 2025
      let hasTargetDate = false;
      
      if (filmData.screeningDate1) {
        let dateStr = '';
        if (filmData.screeningDate1.toDate) {
          dateStr = filmData.screeningDate1.toDate().toISOString().split('T')[0];
        } else if (typeof filmData.screeningDate1 === 'string') {
          dateStr = filmData.screeningDate1.split('T')[0];
        }
        
        if (dateStr === '2025-09-20') {
          hasTargetDate = true;
        }
      }
      
      if (filmData.screeningDate2) {
        let dateStr = '';
        if (filmData.screeningDate2.toDate) {
          dateStr = filmData.screeningDate2.toDate().toISOString().split('T')[0];
        } else if (typeof filmData.screeningDate2 === 'string') {
          dateStr = filmData.screeningDate2.split('T')[0];
        }
        
        if (dateStr === '2025-09-20') {
          hasTargetDate = true;
        }
      }
      
      if (hasTargetDate) {
        console.log(`\n🎬 Film for Sept 20: ${filmTitle}`);
        console.log('startTime1:', filmData.startTime1);
        console.log('startTime2:', filmData.startTime2);
        console.log('screeningDate1:', filmData.screeningDate1);
        console.log('screeningDate2:', filmData.screeningDate2);
      }
    });
    
  } catch (error) {
    console.error('❌ Error debugging film time issue:', error);
  }
}

debugFilmTimeIssue();
