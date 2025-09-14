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

async function debugAllActivities() {
  console.log('🔍 Debug: Checking all published activities...\n');

  try {
    // Check all published activities
    const allActivitiesQuery = query(
      collection(db, 'activities'),
      where('status', '==', 'published'),
      where('isPublic', '==', true)
    );
    
    const allSnapshot = await getDocs(allActivitiesQuery);
    console.log(`📊 Total published activities: ${allSnapshot.size}\n`);
    
    if (allSnapshot.size === 0) {
      console.log('❌ No published activities found!');
      return;
    }

    // Group by date and venue
    const activitiesByDate = {};
    const venueStats = {};
    
    console.log('📋 All published activities:');
    allSnapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      const date = data.eventDate;
      const venue = data.venueName;
      
      if (!activitiesByDate[date]) {
        activitiesByDate[date] = [];
      }
      activitiesByDate[date].push(data);
      
      venueStats[venue] = (venueStats[venue] || 0) + 1;
      
      console.log(`${index + 1}. "${data.name}"`);
      console.log(`   Date: ${date}`);
      console.log(`   Venue: "${venue}"`);
      console.log(`   Time: ${data.startTime} - ${data.endTime}`);
      console.log('');
    });

    console.log('📅 Activities by Date:');
    Object.keys(activitiesByDate).sort().forEach(date => {
      const activities = activitiesByDate[date];
      console.log(`\n${date} (${activities.length} activities):`);
      activities.forEach(activity => {
        console.log(`  - "${activity.name}" at ${activity.venueName} (${activity.startTime}-${activity.endTime})`);
      });
    });

    console.log('\n🏢 Venue Distribution:');
    Object.entries(venueStats).forEach(([venue, count]) => {
      console.log(`  "${venue}": ${count} activities`);
    });

    console.log('\n🎯 Festival Dates (Sep 20-27, 2025):');
    const festivalDates = [
      '2025-09-20', '2025-09-21', '2025-09-22', '2025-09-23',
      '2025-09-24', '2025-09-25', '2025-09-26', '2025-09-27'
    ];
    
    festivalDates.forEach(date => {
      const count = activitiesByDate[date] ? activitiesByDate[date].length : 0;
      console.log(`  ${date}: ${count} activities ${count > 0 ? '✅' : '❌'}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugAllActivities();
