const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, where } = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDGpAHHZnBt_en2NKv0bFVu2SAyJbLTyZs",
  authDomain: "cifan-c41c6.firebaseapp.com",
  projectId: "cifan-c41c6",
  storageBucket: "cifan-c41c6.firebasestorage.app",
  messagingSenderId: "1092527848130",
  appId: "1:1092527848130:web:bb6ce60b7bd6b5c4c41c6e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function debugScheduleVenues() {
  console.log('🔍 Debug: Checking activities and venue names...\n');

  try {
    // Check activities for September 20, 2025
    const targetDate = '2025-09-20';
    console.log(`📅 Fetching activities for date: ${targetDate}`);
    
    const activitiesQuery = query(
      collection(db, 'activities'),
      where('eventDate', '==', targetDate),
      where('status', '==', 'published'),
      where('isPublic', '==', true)
    );

    const snapshot = await getDocs(activitiesQuery);
    console.log(`📊 Found ${snapshot.size} published activities for ${targetDate}\n`);

    if (snapshot.size === 0) {
      console.log('❌ No activities found for this date. Checking all published activities...\n');
      
      // Check all published activities
      const allActivitiesQuery = query(
        collection(db, 'activities'),
        where('status', '==', 'published'),
        where('isPublic', '==', true)
      );
      
      const allSnapshot = await getDocs(allActivitiesQuery);
      console.log(`📊 Total published activities: ${allSnapshot.size}\n`);
      
      if (allSnapshot.size > 0) {
        console.log('📋 Sample activities with their dates and venues:');
        allSnapshot.docs.slice(0, 10).forEach((doc, index) => {
          const data = doc.data();
          console.log(`${index + 1}. "${data.name}"`);
          console.log(`   Date: ${data.eventDate}`);
          console.log(`   Venue: "${data.venueName}" (${typeof data.venueName})`);
          console.log(`   Status: ${data.status}, Public: ${data.isPublic}`);
          console.log('');
        });
      }
      
      return;
    }

    // Analyze venue names
    const venueNames = new Set();
    const venueStats = {};
    
    console.log('📋 Activities found:');
    snapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      const venueName = data.venueName;
      
      venueNames.add(venueName);
      venueStats[venueName] = (venueStats[venueName] || 0) + 1;
      
      console.log(`${index + 1}. "${data.name}"`);
      console.log(`   Venue: "${venueName}" (${typeof venueName})`);
      console.log(`   Time: ${data.startTime} - ${data.endTime}`);
      console.log(`   Status: ${data.status}, Public: ${data.isPublic}`);
      console.log('');
    });

    console.log('🏢 Venue Name Analysis:');
    console.log('Unique venue names found:', Array.from(venueNames));
    console.log('\nVenue distribution:');
    Object.entries(venueStats).forEach(([venue, count]) => {
      console.log(`  "${venue}": ${count} activities`);
    });

    console.log('\n🔧 Expected venue names (camelCase):');
    const expectedVenues = ['stageZone', 'expoZone', 'majorTheatre7', 'majorImax', 'market', 'anusarn'];
    expectedVenues.forEach(venue => {
      const found = venueNames.has(venue);
      console.log(`  ${venue}: ${found ? '✅ Found' : '❌ Not found'}`);
    });

    console.log('\n🎯 Venue Mapping Test:');
    venueNames.forEach(venueName => {
      const venueMap = {
        'stageZone': 'stageZone',
        'expoZone': 'expoZone',
        'majorTheatre7': 'majorTheatre7',
        'majorImax': 'majorImax',
        'market': 'market',
        'anusarn': 'anusarn',
        'Stage Zone': 'stageZone',
        'EXPO Zone': 'expoZone',
        'Major Theatre 7': 'majorTheatre7',
        'Major IMAX': 'majorImax',
        'Market': 'market',
        'Asiatrip': 'anusarn'
      };
      
      const mapped = venueMap[venueName] || 'stageZone';
      console.log(`  "${venueName}" → "${mapped}"`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugScheduleVenues();
