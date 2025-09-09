import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';

// Firebase config (using the same config from your project)
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

async function debugActivities() {
  try {
    console.log('🔍 Debugging activities collection...');
    
    // Test 1: Get all activities
    console.log('\n📋 Test 1: Getting all activities...');
    const allActivitiesQuery = collection(db, 'activities');
    const allSnapshot = await getDocs(allActivitiesQuery);
    console.log(`Total activities in database: ${allSnapshot.size}`);
    
    if (allSnapshot.size > 0) {
      allSnapshot.forEach(doc => {
        const data = doc.data();
        console.log(`- Activity: ${data.name} (Status: ${data.status})`);
      });
    }
    
    // Test 2: Get published activities
    console.log('\n📋 Test 2: Getting published activities...');
    const publishedQuery = query(
      collection(db, 'activities'),
      where('status', '==', 'published')
    );
    const publishedSnapshot = await getDocs(publishedQuery);
    console.log(`Published activities: ${publishedSnapshot.size}`);
    
    if (publishedSnapshot.size > 0) {
      publishedSnapshot.forEach(doc => {
        const data = doc.data();
        console.log(`- Published Activity: ${data.name}`);
      });
    }
    
    // Test 3: Test the exact query from the service
    console.log('\n📋 Test 3: Testing service query...');
    const serviceQuery = query(
      collection(db, 'activities'),
      where('status', '==', 'published')
    );
    const serviceSnapshot = await getDocs(serviceQuery);
    console.log(`Service query result: ${serviceSnapshot.size} activities`);
    
    console.log('\n✅ Debug complete!');
    
  } catch (error) {
    console.error('❌ Error during debug:', error);
    console.error('Error details:', error.message);
    console.error('Error code:', error.code);
  }
}

debugActivities();
