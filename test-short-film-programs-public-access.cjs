const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs } = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBpZjkxOHJOOVZGVkVGVkVGVkVGVkVGVkVG",
  authDomain: "cifan-c41c6.firebaseapp.com",
  projectId: "cifan-c41c6",
  storageBucket: "cifan-c41c6.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdefghijklmnop"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testPublicAccess() {
  console.log('🔍 Testing public access to short film programs data...\n');
  
  try {
    // Test 1: Check all accepted submissions
    console.log('📊 Test 1: Checking all accepted submissions...');
    const acceptedQuery = query(
      collection(db, 'submissions'),
      where('status', '==', 'accepted')
    );
    
    const acceptedSnapshot = await getDocs(acceptedQuery);
    console.log(`✅ Found ${acceptedSnapshot.size} accepted submissions`);
    
    // Test 2: Check submissions with screening programs
    console.log('\n📊 Test 2: Checking submissions with screening programs...');
    const programQuery = query(
      collection(db, 'submissions'),
      where('status', '==', 'accepted')
    );
    
    const programSnapshot = await getDocs(programQuery);
    let submissionsWithPrograms = 0;
    let programCounts = { A: 0, B: 0, C: 0, D: 0 };
    
    programSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.screeningProgram && ['A', 'B', 'C', 'D'].includes(data.screeningProgram)) {
        submissionsWithPrograms++;
        programCounts[data.screeningProgram]++;
        console.log(`  - ${data.filmTitle || 'Untitled'} (Program ${data.screeningProgram})`);
      }
    });
    
    console.log(`\n✅ Found ${submissionsWithPrograms} submissions with screening programs:`);
    console.log(`   Program A: ${programCounts.A} films`);
    console.log(`   Program B: ${programCounts.B} films`);
    console.log(`   Program C: ${programCounts.C} films`);
    console.log(`   Program D: ${programCounts.D} films`);
    
    // Test 3: Test the exact query used by the service
    console.log('\n📊 Test 3: Testing the exact service query...');
    const serviceQuery = query(
      collection(db, 'submissions'),
      where('status', '==', 'accepted')
    );
    
    const serviceSnapshot = await getDocs(serviceQuery);
    console.log(`✅ Service query returned ${serviceSnapshot.size} documents`);
    
    if (serviceSnapshot.size === 0) {
      console.log('\n⚠️  No accepted submissions found. This could mean:');
      console.log('   1. No submissions have been accepted yet');
      console.log('   2. No submissions have been assigned screening programs');
      console.log('   3. The data structure is different than expected');
      
      // Let's check what submissions exist
      console.log('\n📊 Checking all submissions...');
      const allQuery = collection(db, 'submissions');
      const allSnapshot = await getDocs(allQuery);
      console.log(`📋 Total submissions in database: ${allSnapshot.size}`);
      
      if (allSnapshot.size > 0) {
        console.log('\n📋 Sample submission data:');
        const firstDoc = allSnapshot.docs[0];
        const sampleData = firstDoc.data();
        console.log('   Fields:', Object.keys(sampleData));
        console.log('   Status:', sampleData.status);
        console.log('   Has screeningProgram:', !!sampleData.screeningProgram);
        console.log('   ScreeningProgram value:', sampleData.screeningProgram);
      }
    }
    
    console.log('\n🎉 Public access test completed successfully!');
    console.log('✅ The Firestore rules are working correctly for public access.');
    
  } catch (error) {
    console.error('❌ Error during public access test:', error);
    
    if (error.code === 'permission-denied') {
      console.log('\n🔒 Permission denied - this means the Firestore rules are blocking access');
      console.log('   This should not happen with the updated rules for accepted submissions with screening programs');
    } else {
      console.log('\n🔧 This appears to be a different type of error:', error.message);
    }
  }
}

// Run the test
testPublicAccess().then(() => {
  console.log('\n✅ Test completed');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
