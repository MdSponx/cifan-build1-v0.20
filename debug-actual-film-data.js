// Debug script to check actual film data from Firestore
// This will help us see what the real data structure looks like

const admin = require('firebase-admin');

// Initialize Firebase Admin (if not already initialized)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: 'cifan-c41c6'
  });
}

const db = admin.firestore();

async function debugFilmData() {
  try {
    console.log('🔍 Fetching film data from Firestore...');
    
    // Get the specific film that was showing the issue
    const filmDoc = await db.collection('films').doc('5FQ71pGEvBra7v2swpks').get();
    
    if (!filmDoc.exists) {
      console.log('❌ Film document not found');
      return;
    }
    
    const filmData = filmDoc.data();
    console.log('🎬 Raw film data from Firestore:');
    console.log(JSON.stringify(filmData, null, 2));
    
    console.log('\n🔍 Checking specific time-related fields:');
    console.log('screeningDate1:', filmData.screeningDate1);
    console.log('screeningDate2:', filmData.screeningDate2);
    console.log('startTime1:', filmData.startTime1);
    console.log('endTime1:', filmData.endTime1);
    console.log('startTime2:', filmData.startTime2);
    console.log('endTime2:', filmData.endTime2);
    console.log('timeEstimate:', filmData.timeEstimate);
    console.log('theatre:', filmData.theatre);
    
    console.log('\n🔍 Field types and validation:');
    console.log('startTime1 type:', typeof filmData.startTime1);
    console.log('startTime1 exists:', !!filmData.startTime1);
    console.log('startTime1 is string:', typeof filmData.startTime1 === 'string');
    console.log('startTime1 length:', filmData.startTime1?.length);
    
    console.log('startTime2 type:', typeof filmData.startTime2);
    console.log('startTime2 exists:', !!filmData.startTime2);
    console.log('startTime2 is string:', typeof filmData.startTime2 === 'string');
    console.log('startTime2 length:', filmData.startTime2?.length);
    
    // Test the regex validation on actual data
    if (filmData.startTime1) {
      const regex = /^\d{1,2}:\d{2}$/;
      console.log('startTime1 regex test:', regex.test(filmData.startTime1));
    }
    
    if (filmData.startTime2) {
      const regex = /^\d{1,2}:\d{2}$/;
      console.log('startTime2 regex test:', regex.test(filmData.startTime2));
    }
    
    console.log('\n🎯 All available fields in the document:');
    console.log('Field names:', Object.keys(filmData).sort());
    
    // Check if there are any fields with similar names
    const timeRelatedFields = Object.keys(filmData).filter(key => 
      key.toLowerCase().includes('time') || 
      key.toLowerCase().includes('screening') ||
      key.toLowerCase().includes('start') ||
      key.toLowerCase().includes('end')
    );
    
    console.log('\n⏰ Time-related fields found:');
    timeRelatedFields.forEach(field => {
      console.log(`${field}:`, filmData[field]);
    });
    
  } catch (error) {
    console.error('❌ Error fetching film data:', error);
  }
}

debugFilmData().then(() => {
  console.log('\n✅ Debug complete');
  process.exit(0);
}).catch(error => {
  console.error('❌ Script error:', error);
  process.exit(1);
});
