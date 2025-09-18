const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDhsbtWQJtDX-MMzlHBW7OjkWJVItFOhSE",
  authDomain: "cifan-c41c6.firebaseapp.com",
  projectId: "cifan-c41c6",
  storageBucket: "cifan-c41c6.firebasestorage.app",
  messagingSenderId: "90736980589",
  appId: "1:90736980589:web:8b8a6c5c5c5c5c5c5c5c5c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function debugShortFilms() {
  try {
    console.log('🔍 Fetching all submissions from Firestore...');
    
    const submissionsRef = collection(db, 'submissions');
    const querySnapshot = await getDocs(submissionsRef);
    
    console.log(`📊 Total submissions found: ${querySnapshot.size}`);
    
    if (querySnapshot.size === 0) {
      console.log('❌ No submissions found in the database');
      return;
    }
    
    const statusCounts = {};
    const categoryCounts = {};
    const sampleSubmissions = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      // Count by status
      const status = data.status || 'unknown';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
      
      // Count by category
      const category = data.category || 'unknown';
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      
      // Collect first 3 submissions as samples
      if (sampleSubmissions.length < 3) {
        sampleSubmissions.push({
          id: doc.id,
          status: data.status,
          category: data.category,
          filmTitle: data.filmTitle,
          submitterName: data.submitterName,
          submittedAt: data.submittedAt,
          hasFiles: !!data.files
        });
      }
    });
    
    console.log('\n📈 Status breakdown:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });
    
    console.log('\n🎬 Category breakdown:');
    Object.entries(categoryCounts).forEach(([category, count]) => {
      console.log(`  ${category}: ${count}`);
    });
    
    console.log('\n📝 Sample submissions:');
    sampleSubmissions.forEach((submission, index) => {
      console.log(`  ${index + 1}. ${submission.filmTitle || 'No title'}`);
      console.log(`     ID: ${submission.id}`);
      console.log(`     Status: ${submission.status || 'No status'}`);
      console.log(`     Category: ${submission.category || 'No category'}`);
      console.log(`     Submitter: ${submission.submitterName || 'No name'}`);
      console.log(`     Has Files: ${submission.hasFiles}`);
      console.log(`     Submitted: ${submission.submittedAt ? new Date(submission.submittedAt.seconds * 1000).toISOString() : 'No date'}`);
      console.log('');
    });
    
    // Check for accepted submissions specifically
    const acceptedSubmissions = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.status === 'accepted') {
        acceptedSubmissions.push({
          id: doc.id,
          filmTitle: data.filmTitle,
          category: data.category
        });
      }
    });
    
    console.log(`✅ Accepted submissions: ${acceptedSubmissions.length}`);
    if (acceptedSubmissions.length > 0) {
      console.log('Accepted films:');
      acceptedSubmissions.forEach((film, index) => {
        console.log(`  ${index + 1}. ${film.filmTitle} (${film.category})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error debugging short films:', error);
  }
}

debugShortFilms();
