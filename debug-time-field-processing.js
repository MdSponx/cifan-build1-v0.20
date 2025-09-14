// Debug script to test time field processing logic
// This will help us understand why the dedicated time fields aren't being used

const testFilmData = {
  id: "5FQ71pGEvBra7v2swpks",
  title: "Marching Boys",
  screeningDate1: "2025-09-26T20:00:00.000Z",
  screeningDate2: "2025-09-27T15:00:00.000Z",
  startTime1: "20:00",
  endTime1: "22:00",
  startTime2: "15:00", 
  endTime2: "17:00",
  timeEstimate: "บ่าย",
  theatre: "Major Theatre 7"
};

console.log("🎬 Testing time field processing for:", testFilmData.title);
console.log("📊 Raw film data:", testFilmData);

// Test the time field validation logic
function testTimeFieldValidation(timeField, fieldName) {
  console.log(`\n🔍 Testing ${fieldName}:`);
  console.log('Raw value:', timeField);
  console.log('Type:', typeof timeField);
  console.log('Exists:', !!timeField);
  console.log('Is string:', typeof timeField === 'string');
  console.log('Length:', timeField?.length);
  console.log('Trimmed length:', timeField?.trim()?.length);
  
  if (timeField && typeof timeField === 'string' && timeField.trim().length > 0) {
    const cleanTime = timeField.trim();
    console.log('Clean time:', cleanTime);
    
    // Test both regex patterns
    const strictRegex = /^\d{2}:\d{2}$/;
    const flexibleRegex = /^\d{1,2}:\d{2}$/;
    
    console.log('Strict regex (\\d{2}:\\d{2}) test:', strictRegex.test(cleanTime));
    console.log('Flexible regex (\\d{1,2}:\\d{2}) test:', flexibleRegex.test(cleanTime));
    
    if (flexibleRegex.test(cleanTime)) {
      const [hours, minutes] = cleanTime.split(':');
      const paddedTime = `${hours.padStart(2, '0')}:${minutes}`;
      console.log('✅ VALID - Padded time:', paddedTime);
      return paddedTime;
    } else {
      console.log('❌ INVALID - Does not match time format');
      return null;
    }
  } else {
    console.log('❌ INVALID - Field is empty, null, or not a string');
    return null;
  }
}

// Test all time fields
const startTime1Result = testTimeFieldValidation(testFilmData.startTime1, 'startTime1');
const endTime1Result = testTimeFieldValidation(testFilmData.endTime1, 'endTime1');
const startTime2Result = testTimeFieldValidation(testFilmData.startTime2, 'startTime2');
const endTime2Result = testTimeFieldValidation(testFilmData.endTime2, 'endTime2');

console.log('\n📋 SUMMARY:');
console.log('startTime1 result:', startTime1Result);
console.log('endTime1 result:', endTime1Result);
console.log('startTime2 result:', startTime2Result);
console.log('endTime2 result:', endTime2Result);

// Test the screening processing logic
console.log('\n🎯 Testing screening processing logic:');

const screeningDates = [];

if (testFilmData.screeningDate1) {
  screeningDates.push({ 
    dateField: testFilmData.screeningDate1, 
    index: 0,
    screeningNumber: 1,
    startTimeField: testFilmData.startTime1,
    endTimeField: testFilmData.endTime1
  });
}

if (testFilmData.screeningDate2) {
  screeningDates.push({ 
    dateField: testFilmData.screeningDate2, 
    index: 1,
    screeningNumber: 2,
    startTimeField: testFilmData.startTime2,
    endTimeField: testFilmData.endTime2
  });
}

console.log('Screening dates to process:', screeningDates.length);

screeningDates.forEach(({ dateField, index, screeningNumber, startTimeField, endTimeField }) => {
  console.log(`\n🔍 Processing screening ${screeningNumber}:`);
  console.log('Date field:', dateField);
  console.log('Start time field:', startTimeField);
  console.log('End time field:', endTimeField);
  
  // Test the priority logic
  let startTime, endTime;
  
  if (startTimeField && typeof startTimeField === 'string' && startTimeField.trim().length > 0) {
    const cleanStartTime = startTimeField.trim();
    
    if (cleanStartTime.match(/^\d{1,2}:\d{2}$/)) {
      const [hours, minutes] = cleanStartTime.split(':');
      startTime = `${hours.padStart(2, '0')}:${minutes}`;
      console.log(`✅ SUCCESS: Using dedicated startTime${screeningNumber} field:`, startTime);
      
      if (endTimeField && typeof endTimeField === 'string' && endTimeField.trim().length > 0) {
        const cleanEndTime = endTimeField.trim();
        if (cleanEndTime.match(/^\d{1,2}:\d{2}$/)) {
          const [endHours, endMinutes] = cleanEndTime.split(':');
          endTime = `${endHours.padStart(2, '0')}:${endMinutes}`;
          console.log(`✅ SUCCESS: Using dedicated endTime${screeningNumber} field:`, endTime);
        } else {
          console.log(`⚠️ FALLBACK: Invalid endTime format, calculating from duration`);
          endTime = "22:00"; // Mock calculation
        }
      } else {
        console.log(`⚠️ FALLBACK: No valid endTime field, calculating from duration`);
        endTime = "22:00"; // Mock calculation
      }
    } else {
      console.log(`❌ FALLBACK: Invalid startTime format, extracting from screening date`);
      startTime = "บ่าย"; // This would be the fallback that's causing the issue
      endTime = "22:00";
    }
  } else {
    console.log(`❌ FALLBACK: No valid startTime field, extracting from screening date`);
    startTime = "บ่าย"; // This would be the fallback that's causing the issue
    endTime = "22:00";
  }
  
  console.log(`🎬 Final result for screening ${screeningNumber}:`, {
    startTime,
    endTime,
    usedDedicatedFields: !!(startTimeField && startTimeField.match(/^\d{1,2}:\d{2}$/))
  });
});

console.log('\n🚨 EXPECTED BEHAVIOR:');
console.log('Screening 1 should use: startTime1="20:00", endTime1="22:00"');
console.log('Screening 2 should use: startTime2="15:00", endTime2="17:00"');
console.log('Neither should fall back to timeEstimate="บ่าย"');
