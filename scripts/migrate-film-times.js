/**
 * Migration Script: Add Calculated Time Fields to Existing Films
 * 
 * This script adds startTime1, endTime1, startTime2, and endTime2 fields
 * to existing films in the database by calculating them from screeningDate
 * and timeEstimate fields.
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    // Add your project ID here if needed
    // projectId: 'your-project-id'
  });
}

const db = admin.firestore();

/**
 * Calculate end time from start time and duration in minutes
 */
const calculateEndTime = (startTime, durationMinutes) => {
  try {
    const [hour, min] = startTime.split(':').map(Number);
    const startMinutes = hour * 60 + min;
    const endMinutes = startMinutes + durationMinutes;
    
    const endHour = Math.floor(endMinutes / 60) % 24;
    const endMin = endMinutes % 60;
    
    return `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;
  } catch (error) {
    console.warn('Error calculating end time:', { startTime, durationMinutes }, error);
    return startTime;
  }
};

/**
 * Extract time from screening date field (handles various date formats)
 */
const extractTimeFromScreeningDate = (dateField) => {
  try {
    // Handle ISO string format (datetime-local input)
    if (typeof dateField === 'string' && dateField.includes('T')) {
      const timePart = dateField.split('T')[1];
      if (timePart) {
        const [hours, minutes] = timePart.split(':').map(Number);
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      }
    }
    
    // Handle Firestore Timestamp
    let dateObj;
    if (dateField && typeof dateField.toDate === 'function') {
      dateObj = dateField.toDate();
    } else {
      dateObj = new Date(dateField);
    }
    
    if (!isNaN(dateObj.getTime())) {
      const hours = dateObj.getHours();
      const minutes = dateObj.getMinutes();
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
  } catch (error) {
    console.warn('Error extracting time from screening date:', dateField, error);
  }
  
  return '19:00'; // Default fallback
};

/**
 * Map Thai time estimate to 24-hour format
 */
const mapTimeEstimate = (timeEstimate) => {
  const timeMap = {
    'เช้า': '10:00',      // Morning
    'บ่าย': '14:00',      // Afternoon
    'ค่ำ': '19:00',       // Evening
    'กลางคืน': '22:00'    // Night
  };
  
  return timeMap[timeEstimate] || '19:00';
};

/**
 * Calculate screening times for both screening dates
 */
const calculateScreeningTimes = (screeningDate1, screeningDate2, timeEstimate, duration) => {
  const result = {};

  // Calculate times for screening 1
  if (screeningDate1 || timeEstimate) {
    const startTime1 = screeningDate1 
      ? extractTimeFromScreeningDate(screeningDate1)
      : mapTimeEstimate(timeEstimate || '');
    
    result.startTime1 = startTime1;
    
    if (duration && duration > 0) {
      result.endTime1 = calculateEndTime(startTime1, duration);
    }
  }

  // Calculate times for screening 2
  if (screeningDate2 || timeEstimate) {
    const startTime2 = screeningDate2 
      ? extractTimeFromScreeningDate(screeningDate2)
      : mapTimeEstimate(timeEstimate || '');
    
    result.startTime2 = startTime2;
    
    if (duration && duration > 0) {
      result.endTime2 = calculateEndTime(startTime2, duration);
    }
  }

  return result;
};

/**
 * Main migration function
 */
const migrateFilmTimes = async () => {
  console.log('🚀 Starting film times migration...');
  
  try {
    // Get all films from the collection
    const filmsSnapshot = await db.collection('films').get();
    console.log(`📊 Found ${filmsSnapshot.size} films to process`);
    
    if (filmsSnapshot.empty) {
      console.log('⚠️ No films found in the collection');
      return;
    }
    
    const batch = db.batch();
    let updateCount = 0;
    let skipCount = 0;
    
    for (const doc of filmsSnapshot.docs) {
      const filmData = doc.data();
      const filmId = doc.id;
      
      console.log(`\n🎬 Processing film: ${filmId}`);
      console.log(`   Title: ${filmData.titleEn || filmData.title || 'Unknown'}`);
      console.log(`   Has screeningDate1: ${!!filmData.screeningDate1}`);
      console.log(`   Has screeningDate2: ${!!filmData.screeningDate2}`);
      console.log(`   Time estimate: ${filmData.timeEstimate || 'None'}`);
      console.log(`   Duration: ${filmData.length || filmData.duration || 'Unknown'} minutes`);
      
      // Check if film already has calculated time fields
      if (filmData.startTime1 || filmData.endTime1 || filmData.startTime2 || filmData.endTime2) {
        console.log(`   ⏭️ Skipping - already has calculated time fields`);
        skipCount++;
        continue;
      }
      
      // Calculate the time fields
      const calculatedTimes = calculateScreeningTimes(
        filmData.screeningDate1,
        filmData.screeningDate2,
        filmData.timeEstimate,
        filmData.length || filmData.duration || 120 // Default to 120 minutes if no duration
      );
      
      // Only update if we have calculated times
      if (Object.keys(calculatedTimes).length > 0) {
        console.log(`   ✅ Calculated times:`, calculatedTimes);
        
        const updates = {
          ...calculatedTimes,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        
        batch.update(doc.ref, updates);
        updateCount++;
      } else {
        console.log(`   ⚠️ No times could be calculated for this film`);
        skipCount++;
      }
    }
    
    // Commit the batch update
    if (updateCount > 0) {
      console.log(`\n💾 Committing batch update for ${updateCount} films...`);
      await batch.commit();
      console.log('✅ Batch update completed successfully!');
    } else {
      console.log('\n⚠️ No films needed updating');
    }
    
    // Summary
    console.log('\n📈 Migration Summary:');
    console.log(`   Total films processed: ${filmsSnapshot.size}`);
    console.log(`   Films updated: ${updateCount}`);
    console.log(`   Films skipped: ${skipCount}`);
    console.log(`   Success rate: ${((updateCount / filmsSnapshot.size) * 100).toFixed(1)}%`);
    
  } catch (error) {
    console.error('💥 Error during migration:', error);
    throw error;
  }
};

/**
 * Dry run function to preview what would be updated
 */
const dryRunMigration = async () => {
  console.log('🔍 Running dry run migration preview...');
  
  try {
    const filmsSnapshot = await db.collection('films').get();
    console.log(`📊 Found ${filmsSnapshot.size} films to analyze`);
    
    let wouldUpdate = 0;
    let wouldSkip = 0;
    
    for (const doc of filmsSnapshot.docs) {
      const filmData = doc.data();
      const filmId = doc.id;
      
      console.log(`\n🎬 Film: ${filmId} - ${filmData.titleEn || filmData.title || 'Unknown'}`);
      
      // Check if film already has calculated time fields
      if (filmData.startTime1 || filmData.endTime1 || filmData.startTime2 || filmData.endTime2) {
        console.log(`   ⏭️ Would skip - already has calculated time fields`);
        wouldSkip++;
        continue;
      }
      
      // Calculate what would be added
      const calculatedTimes = calculateScreeningTimes(
        filmData.screeningDate1,
        filmData.screeningDate2,
        filmData.timeEstimate,
        filmData.length || filmData.duration || 120
      );
      
      if (Object.keys(calculatedTimes).length > 0) {
        console.log(`   ✅ Would add:`, calculatedTimes);
        wouldUpdate++;
      } else {
        console.log(`   ⚠️ No times could be calculated`);
        wouldSkip++;
      }
    }
    
    console.log('\n📈 Dry Run Summary:');
    console.log(`   Total films: ${filmsSnapshot.size}`);
    console.log(`   Would update: ${wouldUpdate}`);
    console.log(`   Would skip: ${wouldSkip}`);
    
  } catch (error) {
    console.error('💥 Error during dry run:', error);
    throw error;
  }
};

// Main execution
const main = async () => {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');
  
  console.log('🎬 Film Times Migration Script');
  console.log('================================');
  
  if (isDryRun) {
    console.log('🔍 Running in DRY RUN mode - no changes will be made');
    await dryRunMigration();
  } else {
    console.log('⚠️  Running in LIVE mode - changes will be made to the database');
    console.log('💡 Use --dry-run flag to preview changes first');
    
    // Ask for confirmation
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const answer = await new Promise((resolve) => {
      rl.question('Are you sure you want to proceed? (yes/no): ', resolve);
    });
    
    rl.close();
    
    if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
      await migrateFilmTimes();
    } else {
      console.log('❌ Migration cancelled');
    }
  }
  
  console.log('\n🏁 Script completed');
  process.exit(0);
};

// Run the script
if (require.main === module) {
  main().catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
}

module.exports = {
  migrateFilmTimes,
  dryRunMigration,
  calculateEndTime,
  extractTimeFromScreeningDate,
  mapTimeEstimate,
  calculateScreeningTimes
};
