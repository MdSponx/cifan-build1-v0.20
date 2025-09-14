const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: "cifan-build1",
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
  });
}

const db = admin.firestore();

async function debugMarchingBoysScreenings() {
  try {
    console.log('🔍 DEBUGGING MARCHING BOYS SCREENINGS...\n');

    // Get all feature films
    const filmsSnapshot = await db.collection('featureFilms').get();
    
    let marchingBoysFilm = null;
    
    filmsSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.title && data.title.toLowerCase().includes('marching')) {
        marchingBoysFilm = { id: doc.id, ...data };
      }
    });

    if (!marchingBoysFilm) {
      console.log('❌ No film with "marching" in title found');
      return;
    }

    console.log('🎬 FOUND MARCHING BOYS FILM:');
    console.log('ID:', marchingBoysFilm.id);
    console.log('Title:', marchingBoysFilm.title);
    console.log('\n📅 SCREENING DATE ANALYSIS:');
    
    // Check screeningDate1
    if (marchingBoysFilm.screeningDate1) {
      const date1 = marchingBoysFilm.screeningDate1.toDate();
      console.log('screeningDate1:', {
        raw: marchingBoysFilm.screeningDate1,
        converted: date1,
        dateString: date1.toDateString(),
        isoString: date1.toISOString(),
        year: date1.getFullYear(),
        month: date1.getMonth() + 1,
        day: date1.getDate()
      });
    } else {
      console.log('screeningDate1: NULL/UNDEFINED');
    }

    // Check screeningDate2
    if (marchingBoysFilm.screeningDate2) {
      const date2 = marchingBoysFilm.screeningDate2.toDate();
      console.log('screeningDate2:', {
        raw: marchingBoysFilm.screeningDate2,
        converted: date2,
        dateString: date2.toDateString(),
        isoString: date2.toISOString(),
        year: date2.getFullYear(),
        month: date2.getMonth() + 1,
        day: date2.getDate()
      });
    } else {
      console.log('screeningDate2: NULL/UNDEFINED');
    }

    console.log('\n🕐 TIME FIELDS ANALYSIS:');
    console.log('startTime1:', marchingBoysFilm.startTime1);
    console.log('endTime1:', marchingBoysFilm.endTime1);
    console.log('startTime2:', marchingBoysFilm.startTime2);
    console.log('endTime2:', marchingBoysFilm.endTime2);

    console.log('\n🎭 OTHER FIELDS:');
    console.log('theatre:', marchingBoysFilm.theatre);
    console.log('timeEstimate:', marchingBoysFilm.timeEstimate);
    console.log('status:', marchingBoysFilm.status);
    console.log('publicationStatus:', marchingBoysFilm.publicationStatus);

    // Test date matching for September 23, 2025
    const testDate = new Date('2025-09-23');
    console.log('\n🧪 TESTING DATE MATCHING FOR Sep 23, 2025:');
    console.log('Test date:', testDate.toDateString());

    if (marchingBoysFilm.screeningDate1) {
      const date1 = marchingBoysFilm.screeningDate1.toDate();
      const matches1 = date1.toDateString() === testDate.toDateString();
      console.log('screeningDate1 matches:', matches1, '(', date1.toDateString(), 'vs', testDate.toDateString(), ')');
    }

    if (marchingBoysFilm.screeningDate2) {
      const date2 = marchingBoysFilm.screeningDate2.toDate();
      const matches2 = date2.toDateString() === testDate.toDateString();
      console.log('screeningDate2 matches:', matches2, '(', date2.toDateString(), 'vs', testDate.toDateString(), ')');
    }

    console.log('\n📋 ALL FIELDS IN DOCUMENT:');
    console.log(Object.keys(marchingBoysFilm).sort());

    console.log('\n✅ DEBUG COMPLETE');

  } catch (error) {
    console.error('❌ Error debugging Marching Boys screenings:', error);
  }
}

debugMarchingBoysScreenings();
