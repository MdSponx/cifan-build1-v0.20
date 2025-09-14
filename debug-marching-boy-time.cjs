const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: 'cifan-festival'
  });
}

const db = admin.firestore();

async function debugMarchingBoyTime() {
  console.log('🔍 DEBUGGING MARCHING BOY TIME ISSUE');
  console.log('=====================================');

  try {
    // Search for films with "marching" or "boy" in the title
    const filmsRef = db.collection('films');
    const snapshot = await filmsRef.get();
    
    let marchingBoyFilm = null;
    
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.title && (
        data.title.toLowerCase().includes('marching') || 
        data.title.toLowerCase().includes('boy')
      )) {
        marchingBoyFilm = { id: doc.id, ...data };
      }
    });

    if (!marchingBoyFilm) {
      console.log('❌ No film found with "marching" or "boy" in title');
      
      // Let's check all films to see what we have
      console.log('\n📋 ALL FILMS IN DATABASE:');
      snapshot.forEach(doc => {
        const data = doc.data();
        console.log(`- ${data.title || 'Untitled'} (ID: ${doc.id})`);
      });
      return;
    }

    console.log('🎬 FOUND MARCHING BOY FILM:');
    console.log('Title:', marchingBoyFilm.title);
    console.log('ID:', marchingBoyFilm.id);
    console.log('\n📊 RAW FILM DATA:');
    console.log(JSON.stringify(marchingBoyFilm, null, 2));

    console.log('\n🕐 TIME-RELATED FIELDS ANALYSIS:');
    console.log('================================');
    
    // Check all time-related fields
    const timeFields = [
      'startTime1', 'endTime1', 'startTime2', 'endTime2',
      'screeningDate1', 'screeningDate2', 'timeEstimate',
      'theatre', 'screenings'
    ];

    timeFields.forEach(field => {
      if (marchingBoyFilm[field] !== undefined) {
        console.log(`${field}:`, marchingBoyFilm[field], `(type: ${typeof marchingBoyFilm[field]})`);
        
        // Special handling for date fields
        if (field.includes('Date') && marchingBoyFilm[field]) {
          try {
            const date = new Date(marchingBoyFilm[field]);
            console.log(`  → Parsed as Date: ${date.toISOString()}`);
            console.log(`  → Local time: ${date.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' })}`);
            console.log(`  → Hours: ${date.getHours()}, Minutes: ${date.getMinutes()}`);
          } catch (error) {
            console.log(`  → Error parsing date: ${error.message}`);
          }
        }
      }
    });

    console.log('\n🔍 SCREENING ANALYSIS:');
    console.log('======================');
    
    if (marchingBoyFilm.screenings && Array.isArray(marchingBoyFilm.screenings)) {
      console.log(`Found ${marchingBoyFilm.screenings.length} modern screenings:`);
      marchingBoyFilm.screenings.forEach((screening, index) => {
        console.log(`\nScreening ${index + 1}:`);
        console.log('  Date:', screening.date);
        console.log('  Time:', screening.time);
        console.log('  Venue:', screening.venue);
        
        if (screening.date) {
          try {
            const date = new Date(screening.date);
            console.log(`  → Date parsed: ${date.toISOString()}`);
            console.log(`  → Date local: ${date.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' })}`);
          } catch (error) {
            console.log(`  → Date parse error: ${error.message}`);
          }
        }
      });
    } else {
      console.log('No modern screenings array found');
    }

    console.log('\n🚨 LEGACY SCREENING ANALYSIS:');
    console.log('=============================');
    
    // Check legacy screening fields
    if (marchingBoyFilm.screeningDate1) {
      console.log('Legacy Screening 1:');
      console.log('  screeningDate1:', marchingBoyFilm.screeningDate1);
      console.log('  startTime1:', marchingBoyFilm.startTime1);
      console.log('  endTime1:', marchingBoyFilm.endTime1);
      
      try {
        const date = new Date(marchingBoyFilm.screeningDate1);
        console.log(`  → screeningDate1 parsed: ${date.toISOString()}`);
        console.log(`  → screeningDate1 local: ${date.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' })}`);
        console.log(`  → Extracted hours from date: ${date.getHours()}`);
        console.log(`  → Extracted minutes from date: ${date.getMinutes()}`);
        
        // Check if startTime1 is different from extracted time
        if (marchingBoyFilm.startTime1) {
          console.log(`  → startTime1 field: ${marchingBoyFilm.startTime1}`);
          console.log(`  → Time mismatch? Date shows ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}, startTime1 shows ${marchingBoyFilm.startTime1}`);
        }
      } catch (error) {
        console.log(`  → screeningDate1 parse error: ${error.message}`);
      }
    }

    if (marchingBoyFilm.screeningDate2) {
      console.log('\nLegacy Screening 2:');
      console.log('  screeningDate2:', marchingBoyFilm.screeningDate2);
      console.log('  startTime2:', marchingBoyFilm.startTime2);
      console.log('  endTime2:', marchingBoyFilm.endTime2);
      
      try {
        const date = new Date(marchingBoyFilm.screeningDate2);
        console.log(`  → screeningDate2 parsed: ${date.toISOString()}`);
        console.log(`  → screeningDate2 local: ${date.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' })}`);
        console.log(`  → Extracted hours from date: ${date.getHours()}`);
        console.log(`  → Extracted minutes from date: ${date.getMinutes()}`);
        
        // Check if startTime2 is different from extracted time
        if (marchingBoyFilm.startTime2) {
          console.log(`  → startTime2 field: ${marchingBoyFilm.startTime2}`);
          console.log(`  → Time mismatch? Date shows ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}, startTime2 shows ${marchingBoyFilm.startTime2}`);
        }
      } catch (error) {
        console.log(`  → screeningDate2 parse error: ${error.message}`);
      }
    }

    console.log('\n💡 DIAGNOSIS:');
    console.log('=============');
    
    // Analyze the issue
    if (marchingBoyFilm.startTime1 === '20:00' && marchingBoyFilm.screeningDate1) {
      const date = new Date(marchingBoyFilm.screeningDate1);
      const extractedHour = date.getHours();
      
      if (extractedHour === 14) {
        console.log('🚨 FOUND THE ISSUE!');
        console.log('- startTime1 field correctly shows: 20:00');
        console.log('- But screeningDate1 field shows: 14:00 when parsed');
        console.log('- The schedule is likely extracting time from screeningDate1 instead of using startTime1');
        console.log('- This is a timezone or data entry issue in the screeningDate1 field');
      }
    }

    console.log('\n🔧 RECOMMENDED FIX:');
    console.log('===================');
    console.log('1. The useScheduleData.ts should prioritize startTime1/startTime2 fields over extracting time from screeningDate1/screeningDate2');
    console.log('2. Only fall back to extracting time from screening dates if the dedicated time fields are missing or invalid');
    console.log('3. The current logic seems to be doing the opposite - extracting from dates instead of using dedicated time fields');

  } catch (error) {
    console.error('❌ Error debugging Marching Boy time:', error);
  }
}

// Run the debug
debugMarchingBoyTime().then(() => {
  console.log('\n✅ Debug complete');
  process.exit(0);
}).catch(error => {
  console.error('❌ Debug failed:', error);
  process.exit(1);
});
