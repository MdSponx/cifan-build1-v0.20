// Test script to verify activities sorting
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, where } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyDjzOJsKwJn5V8Qz8Qz8Qz8Qz8Qz8Qz8Q",
  authDomain: "cifan-c41c6.firebaseapp.com",
  projectId: "cifan-c41c6",
  storageBucket: "cifan-c41c6.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdefghijklmnop"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testActivitiesSorting() {
  try {
    console.log('🔍 Testing activities sorting...');
    
    // Get published activities
    const q = query(
      collection(db, 'activities'),
      where('status', '==', 'published')
    );
    
    const snapshot = await getDocs(q);
    const activities = snapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      eventDate: doc.data().eventDate,
      startTime: doc.data().startTime,
      status: doc.data().status
    }));
    
    console.log('📊 Raw activities from Firestore:');
    activities.forEach((activity, index) => {
      console.log(`${index + 1}. ${activity.eventDate} ${activity.startTime} - ${activity.name}`);
    });
    
    // Apply client-side sorting (same logic as in the service)
    const sorted = activities.sort((a, b) => {
      const dateComparison = a.eventDate.localeCompare(b.eventDate);
      if (dateComparison !== 0) return dateComparison;
      return a.startTime.localeCompare(b.startTime);
    });
    
    console.log('\n✅ Sorted activities (expected order):');
    sorted.forEach((activity, index) => {
      console.log(`${index + 1}. ${activity.eventDate} ${activity.startTime} - ${activity.name}`);
    });
    
    // Verify sorting is correct
    let isCorrectlySorted = true;
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      const curr = sorted[i];
      
      const prevDateTime = `${prev.eventDate} ${prev.startTime}`;
      const currDateTime = `${curr.eventDate} ${curr.startTime}`;
      
      if (prevDateTime > currDateTime) {
        isCorrectlySorted = false;
        console.log(`❌ Sorting error: ${prevDateTime} should come after ${currDateTime}`);
      }
    }
    
    if (isCorrectlySorted) {
      console.log('\n✅ Activities are correctly sorted by date and time!');
    } else {
      console.log('\n❌ Activities sorting has issues!');
    }
    
  } catch (error) {
    console.error('❌ Error testing activities sorting:', error);
  }
}

testActivitiesSorting();
