import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDzDuGiiL5RfqE1y1kLQp16RQPnYJbWw_I",
  authDomain: "cifan-c41c6.firebaseapp.com",
  projectId: "cifan-c41c6",
  storageBucket: "cifan-c41c6.firebasestorage.app",
  messagingSenderId: "789354543255",
  appId: "1:789354543255:web:4506a0d3f2b5ff97e491d2",
  measurementId: "G-EFSKHEYFWC"
};

// Initialize Firebase WITHOUT authentication
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testPublicActivitiesAccess() {
  console.log('🔍 Testing public access to activities collection...');
  console.log('📝 Note: This test runs WITHOUT authentication to simulate public user access');
  console.log('');

  try {
    // Test 1: Query published activities (should work)
    console.log('✅ Test 1: Querying published activities...');
    const publishedQuery = query(
      collection(db, 'activities'),
      where('status', '==', 'published')
    );
    
    const publishedSnapshot = await getDocs(publishedQuery);
    console.log(`   Found ${publishedSnapshot.size} published activities`);
    
    publishedSnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`   - ${data.name} (Status: ${data.status}, Public: ${data.isPublic})`);
    });
    console.log('');

    // Test 2: Try to query draft activities (should return empty or fail)
    console.log('⚠️  Test 2: Attempting to query draft activities (should be restricted)...');
    try {
      const draftQuery = query(
        collection(db, 'activities'),
        where('status', '==', 'draft')
      );
      
      const draftSnapshot = await getDocs(draftQuery);
      console.log(`   Found ${draftSnapshot.size} draft activities (should be 0 for public users)`);
      
      if (draftSnapshot.size > 0) {
        console.log('   ❌ WARNING: Public users can access draft activities!');
        draftSnapshot.forEach((doc) => {
          const data = doc.data();
          console.log(`   - ${data.name} (Status: ${data.status})`);
        });
      } else {
        console.log('   ✅ Good: No draft activities accessible to public users');
      }
    } catch (error) {
      console.log('   ✅ Good: Draft activities query blocked by security rules');
      console.log(`   Error: ${error.message}`);
    }
    console.log('');

    // Test 3: Try to query all activities without status filter (should only return published)
    console.log('📋 Test 3: Querying all activities without status filter...');
    try {
      const allActivitiesSnapshot = await getDocs(collection(db, 'activities'));
      console.log(`   Total activities accessible: ${allActivitiesSnapshot.size}`);
      
      const statusCounts = {};
      allActivitiesSnapshot.forEach((doc) => {
        const data = doc.data();
        statusCounts[data.status] = (statusCounts[data.status] || 0) + 1;
      });
      
      console.log('   Status breakdown:');
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`   - ${status}: ${count}`);
      });
      
      // Check if any non-published activities are accessible
      const nonPublishedCount = Object.entries(statusCounts)
        .filter(([status]) => status !== 'published')
        .reduce((sum, [, count]) => sum + count, 0);
        
      if (nonPublishedCount > 0) {
        console.log('   ❌ WARNING: Non-published activities are accessible to public users!');
      } else {
        console.log('   ✅ Good: Only published activities are accessible');
      }
    } catch (error) {
      console.log('   ❌ Error querying all activities:', error.message);
    }
    console.log('');

    // Test 4: Test specific document access
    if (publishedSnapshot.size > 0) {
      const firstDoc = publishedSnapshot.docs[0];
      console.log('📄 Test 4: Testing direct document access...');
      console.log(`   Accessing document: ${firstDoc.id}`);
      
      try {
        const docRef = doc(db, 'activities', firstDoc.id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          console.log(`   ✅ Successfully accessed: ${data.name}`);
          console.log(`   Status: ${data.status}, Public: ${data.isPublic}`);
        } else {
          console.log('   ❌ Document not found');
        }
      } catch (error) {
        console.log('   ❌ Error accessing document:', error.message);
      }
    }
    console.log('');

    // Test 5: Test speakers subcollection access
    if (publishedSnapshot.size > 0) {
      const firstDoc = publishedSnapshot.docs[0];
      console.log('👥 Test 5: Testing speakers subcollection access...');
      
      try {
        const speakersSnapshot = await getDocs(collection(db, 'activities', firstDoc.id, 'speakers'));
        console.log(`   Found ${speakersSnapshot.size} speakers in subcollection`);
        
        speakersSnapshot.forEach((speakerDoc) => {
          const speakerData = speakerDoc.data();
          console.log(`   - ${speakerData.name} (${speakerData.role})`);
        });
        
        if (speakersSnapshot.size > 0) {
          console.log('   ✅ Speakers subcollection accessible to public users');
        }
      } catch (error) {
        console.log('   ⚠️  Speakers subcollection access error:', error.message);
        console.log('   Note: This might be expected if speakers are stored directly in the activity document');
      }
    }

    console.log('');
    console.log('🎉 Public activities access test completed!');
    console.log('');
    console.log('📋 Summary:');
    console.log('- Published activities should be accessible ✅');
    console.log('- Draft/private activities should be restricted ❌');
    console.log('- Direct document access should work for published activities ✅');
    console.log('- Speakers data should be accessible for published activities ✅');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    console.error('Error details:', error.message);
    console.error('Error code:', error.code);
  }
}

// Run the test
testPublicActivitiesAccess();
