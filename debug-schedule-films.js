const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, where } = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDNzKRhYKnOLKjVhWNhqpOJhqKJhqKJhqK",
  authDomain: "cifan-festival.firebaseapp.com",
  projectId: "cifan-festival",
  storageBucket: "cifan-festival.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdefghijklmnop"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function debugScheduleFilms() {
  console.log('🔍 DEBUG: Checking feature films for schedule...\n');

  try {
    // Get all films from the films collection
    console.log('📡 Fetching all films from films collection...');
    const filmsQuery = query(collection(db, 'films'));
    const filmsSnapshot = await getDocs(filmsQuery);
    
    console.log(`📊 Total films found: ${filmsSnapshot.size}\n`);
    
    if (filmsSnapshot.empty) {
      console.log('❌ No films found in the films collection!');
      return;
    }

    const filmsWithScreenings = [];
    const filmsWithoutScreenings = [];
    const publishedFilms = [];
    const draftFilms = [];

    filmsSnapshot.forEach((doc) => {
      const data = doc.data();
      const film = { id: doc.id, ...data };
      
      // Check publication status
      if (data.publicationStatus === 'public' || data.status === 'published') {
        publishedFilms.push(film);
      } else {
        draftFilms.push(film);
      }
      
      // Check for screening information
      const hasModernScreenings = data.screenings && data.screenings.length > 0;
      const hasLegacyScreenings = data.screeningDate1 || data.screeningDate2;
      
      if (hasModernScreenings || hasLegacyScreenings) {
        filmsWithScreenings.push({
          id: doc.id,
          title: data.titleEn || data.title || 'Untitled',
          publicationStatus: data.publicationStatus,
          status: data.status,
          hasModernScreenings,
          hasLegacyScreenings,
          screenings: data.screenings,
          screeningDate1: data.screeningDate1,
          screeningDate2: data.screeningDate2,
          startTime1: data.startTime1,
          endTime1: data.endTime1,
          startTime2: data.startTime2,
          endTime2: data.endTime2,
          timeEstimate: data.timeEstimate,
          theatre: data.theatre
        });
      } else {
        filmsWithoutScreenings.push({
          id: doc.id,
          title: data.titleEn || data.title || 'Untitled',
          publicationStatus: data.publicationStatus,
          status: data.status
        });
      }
    });

    console.log('📈 PUBLICATION STATUS BREAKDOWN:');
    console.log(`✅ Published films: ${publishedFilms.length}`);
    console.log(`📝 Draft films: ${draftFilms.length}\n`);

    console.log('🎬 SCREENING DATA BREAKDOWN:');
    console.log(`✅ Films with screening data: ${filmsWithScreenings.length}`);
    console.log(`❌ Films without screening data: ${filmsWithoutScreenings.length}\n`);

    if (filmsWithScreenings.length > 0) {
      console.log('🎭 FILMS WITH SCREENING DATA:');
      filmsWithScreenings.forEach((film, index) => {
        console.log(`\n${index + 1}. "${film.title}" (${film.id})`);
        console.log(`   📊 Status: ${film.status} | Publication: ${film.publicationStatus}`);
        console.log(`   🎬 Modern screenings: ${film.hasModernScreenings ? 'YES' : 'NO'}`);
        console.log(`   📅 Legacy screenings: ${film.hasLegacyScreenings ? 'YES' : 'NO'}`);
        
        if (film.hasModernScreenings) {
          console.log(`   📋 Modern screening data:`, film.screenings);
        }
        
        if (film.hasLegacyScreenings) {
          console.log(`   📋 Legacy screening data:`);
          if (film.screeningDate1) {
            console.log(`      📅 Date 1: ${film.screeningDate1}`);
            console.log(`      🕐 Start Time 1: ${film.startTime1}`);
            console.log(`      🕐 End Time 1: ${film.endTime1}`);
          }
          if (film.screeningDate2) {
            console.log(`      📅 Date 2: ${film.screeningDate2}`);
            console.log(`      🕐 Start Time 2: ${film.startTime2}`);
            console.log(`      🕐 End Time 2: ${film.endTime2}`);
          }
          if (film.timeEstimate) {
            console.log(`      ⏰ Time Estimate: ${film.timeEstimate}`);
          }
          if (film.theatre) {
            console.log(`      🏛️ Theatre: ${film.theatre}`);
          }
        }
      });
    }

    if (filmsWithoutScreenings.length > 0) {
      console.log('\n\n❌ FILMS WITHOUT SCREENING DATA:');
      filmsWithoutScreenings.forEach((film, index) => {
        console.log(`${index + 1}. "${film.title}" (${film.id}) - Status: ${film.status} | Publication: ${film.publicationStatus}`);
      });
    }

    // Check for specific date screenings
    console.log('\n\n📅 CHECKING SCREENINGS FOR SPECIFIC DATES:');
    const testDates = [
      '2025-09-20',
      '2025-09-21',
      '2025-09-22',
      '2025-09-23',
      '2025-09-24',
      '2025-09-25',
      '2025-09-26',
      '2025-09-27'
    ];

    for (const testDate of testDates) {
      console.log(`\n🗓️ Films scheduled for ${testDate}:`);
      let foundForDate = false;
      
      filmsWithScreenings.forEach((film) => {
        let hasScreeningOnDate = false;
        
        // Check modern screenings
        if (film.screenings) {
          film.screenings.forEach((screening) => {
            const screeningDate = screening.date?.toDate ? 
              screening.date.toDate().toISOString().split('T')[0] :
              (typeof screening.date === 'string' ? screening.date.split('T')[0] : null);
            
            if (screeningDate === testDate) {
              hasScreeningOnDate = true;
              console.log(`   ✅ "${film.title}" - Modern screening at ${screening.time} in ${screening.venue}`);
            }
          });
        }
        
        // Check legacy screenings
        if (film.screeningDate1) {
          const date1 = new Date(film.screeningDate1).toISOString().split('T')[0];
          if (date1 === testDate) {
            hasScreeningOnDate = true;
            console.log(`   ✅ "${film.title}" - Legacy screening 1 at ${film.startTime1 || film.timeEstimate || 'TBD'} in ${film.theatre || 'TBD'}`);
          }
        }
        
        if (film.screeningDate2) {
          const date2 = new Date(film.screeningDate2).toISOString().split('T')[0];
          if (date2 === testDate) {
            hasScreeningOnDate = true;
            console.log(`   ✅ "${film.title}" - Legacy screening 2 at ${film.startTime2 || film.timeEstimate || 'TBD'} in ${film.theatre || 'TBD'}`);
          }
        }
        
        if (hasScreeningOnDate) {
          foundForDate = true;
        }
      });
      
      if (!foundForDate) {
        console.log(`   ❌ No films scheduled for this date`);
      }
    }

    // Check for films that should appear in schedule but might be filtered out
    console.log('\n\n🔍 POTENTIAL SCHEDULE ISSUES:');
    
    const publishedFilmsWithScreenings = filmsWithScreenings.filter(film => 
      film.publicationStatus === 'public' || film.status === 'published'
    );
    
    console.log(`📊 Published films with screenings: ${publishedFilmsWithScreenings.length}`);
    
    if (publishedFilmsWithScreenings.length === 0) {
      console.log('🚨 CRITICAL: No published films have screening data!');
      console.log('   This explains why feature film cards are not appearing in the schedule.');
      console.log('   Solutions:');
      console.log('   1. Check if films have proper screening dates (screeningDate1/screeningDate2)');
      console.log('   2. Check if films have proper time data (startTime1/endTime1, etc.)');
      console.log('   3. Verify publication status (publicationStatus should be "public")');
    } else {
      console.log('✅ Found published films with screening data. Schedule should show them.');
      publishedFilmsWithScreenings.forEach((film) => {
        console.log(`   - "${film.title}" (${film.publicationStatus}/${film.status})`);
      });
    }

  } catch (error) {
    console.error('💥 Error debugging schedule films:', error);
  }
}

// Run the debug
debugScheduleFilms().then(() => {
  console.log('\n🏁 Debug complete!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
