const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: "cifan-build1-v0-20",
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
  });
}

const db = admin.firestore();

async function debugSecondScreeningData() {
  console.log('🔍 DEBUGGING SECOND SCREENING DATA...\n');

  try {
    // Get all feature films
    const filmsSnapshot = await db.collection('featureFilms').get();
    
    console.log(`📊 Total films found: ${filmsSnapshot.docs.length}\n`);

    let filmsWithSecondScreening = 0;
    let filmsWithFirstScreeningOnly = 0;
    let filmsWithNoScreening = 0;

    filmsSnapshot.docs.forEach((doc) => {
      const film = doc.data();
      const hasScreeningDate1 = !!film.screeningDate1;
      const hasScreeningDate2 = !!film.screeningDate2;
      const hasStartTime1 = !!film.startTime1;
      const hasEndTime1 = !!film.endTime1;
      const hasStartTime2 = !!film.startTime2;
      const hasEndTime2 = !!film.endTime2;

      if (hasScreeningDate2) {
        filmsWithSecondScreening++;
        console.log(`🎬 FILM WITH SECOND SCREENING: "${film.title}"`);
        console.log(`   📅 screeningDate1: ${film.screeningDate1} (${typeof film.screeningDate1})`);
        console.log(`   📅 screeningDate2: ${film.screeningDate2} (${typeof film.screeningDate2})`);
        console.log(`   🕐 startTime1: ${film.startTime1} (${typeof film.startTime1})`);
        console.log(`   🕐 endTime1: ${film.endTime1} (${typeof film.endTime1})`);
        console.log(`   🕐 startTime2: ${film.startTime2} (${typeof film.startTime2})`);
        console.log(`   🕐 endTime2: ${film.endTime2} (${typeof film.endTime2})`);
        console.log(`   🏛️ theatre: ${film.theatre}`);
        console.log(`   📊 status: ${film.status}`);
        console.log(`   📊 publicationStatus: ${film.publicationStatus}`);
        console.log('');
      } else if (hasScreeningDate1) {
        filmsWithFirstScreeningOnly++;
      } else {
        filmsWithNoScreening++;
      }
    });

    console.log('\n📊 SUMMARY:');
    console.log(`   Films with second screening: ${filmsWithSecondScreening}`);
    console.log(`   Films with first screening only: ${filmsWithFirstScreeningOnly}`);
    console.log(`   Films with no screening: ${filmsWithNoScreening}`);

    // Check specific dates for second screenings
    console.log('\n🗓️ CHECKING SPECIFIC DATES FOR SECOND SCREENINGS...');
    
    const testDates = ['2025-09-20', '2025-09-21', '2025-09-22', '2025-09-23', '2025-09-24', '2025-09-25', '2025-09-26', '2025-09-27'];
    
    for (const testDate of testDates) {
      console.log(`\n📅 Films with second screenings on ${testDate}:`);
      
      let foundFilms = 0;
      filmsSnapshot.docs.forEach((doc) => {
        const film = doc.data();
        
        if (film.screeningDate2) {
          let screeningDate2String = '';
          
          if (film.screeningDate2.toDate) {
            // Firestore Timestamp
            screeningDate2String = film.screeningDate2.toDate().toISOString().split('T')[0];
          } else if (typeof film.screeningDate2 === 'string') {
            // String date
            screeningDate2String = film.screeningDate2.split('T')[0];
          } else {
            // Date object
            screeningDate2String = new Date(film.screeningDate2).toISOString().split('T')[0];
          }
          
          if (screeningDate2String === testDate) {
            foundFilms++;
            console.log(`   🎬 "${film.title}" - ${film.startTime2 || 'No startTime2'} at ${film.theatre || 'No theatre'}`);
          }
        }
      });
      
      if (foundFilms === 0) {
        console.log(`   ❌ No films found`);
      }
    }

  } catch (error) {
    console.error('❌ Error debugging second screening data:', error);
  }
}

// Run the debug
debugSecondScreeningData().then(() => {
  console.log('\n✅ Debug complete');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Debug failed:', error);
  process.exit(1);
});
