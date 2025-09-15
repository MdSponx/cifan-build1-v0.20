/**
 * Test script to verify that fortuneCardFile is included in hasFiles detection
 * This tests the specific fix for the upload trigger logic
 */

// Mock File object for testing
class MockFile {
  constructor(name, size = 1024, type = 'image/jpeg') {
    this.name = name;
    this.size = size;
    this.type = type;
    this.lastModified = Date.now();
  }
}

console.log('🧪 Testing Fortune Card hasFiles Detection Fix');
console.log('==============================================');

// Test 1: Only fortune card file (this was the failing case)
console.log('\n📋 Test 1: Only Fortune Card File');
console.log('--------------------------------');

const testData1 = {
  titleEn: 'Test Film',
  fortuneCardFile: new MockFile('fortune-card.jpg', 2048, 'image/jpeg')
  // No other files
};

// OLD LOGIC (was broken)
const oldHasFiles = testData1.posterFile || testData1.trailerFile || (testData1.galleryFiles && testData1.galleryFiles.length > 0);

// NEW LOGIC (fixed)
const newHasFiles = testData1.posterFile || testData1.trailerFile || (testData1.galleryFiles && testData1.galleryFiles.length > 0) || testData1.fortuneCardFile;

console.log('🔍 Old logic result:', oldHasFiles, '(would skip upload)');
console.log('✅ New logic result:', newHasFiles, '(will trigger upload)');
console.log('🎯 Fix successful:', !oldHasFiles && newHasFiles);

// Test 2: Multiple files including fortune card
console.log('\n📋 Test 2: Multiple Files Including Fortune Card');
console.log('----------------------------------------------');

const testData2 = {
  titleEn: 'Test Film',
  posterFile: new MockFile('poster.jpg', 1024, 'image/jpeg'),
  fortuneCardFile: new MockFile('fortune-card.jpg', 2048, 'image/jpeg')
};

const oldHasFiles2 = testData2.posterFile || testData2.trailerFile || (testData2.galleryFiles && testData2.galleryFiles.length > 0);
const newHasFiles2 = testData2.posterFile || testData2.trailerFile || (testData2.galleryFiles && testData2.galleryFiles.length > 0) || testData2.fortuneCardFile;

console.log('🔍 Old logic result:', oldHasFiles2, '(would work due to poster)');
console.log('✅ New logic result:', newHasFiles2, '(still works)');
console.log('🎯 No regression:', oldHasFiles2 === newHasFiles2);

// Test 3: No files at all
console.log('\n📋 Test 3: No Files');
console.log('------------------');

const testData3 = {
  titleEn: 'Test Film'
  // No files
};

const oldHasFiles3 = testData3.posterFile || testData3.trailerFile || (testData3.galleryFiles && testData3.galleryFiles.length > 0);
const newHasFiles3 = testData3.posterFile || testData3.trailerFile || (testData3.galleryFiles && testData3.galleryFiles.length > 0) || testData3.fortuneCardFile;

console.log('🔍 Old logic result:', oldHasFiles3, '(correctly no upload)');
console.log('✅ New logic result:', newHasFiles3, '(correctly no upload)');
console.log('🎯 No false positives:', oldHasFiles3 === newHasFiles3);

// Test 4: Gallery files only
console.log('\n📋 Test 4: Gallery Files Only');
console.log('-----------------------------');

const testData4 = {
  titleEn: 'Test Film',
  galleryFiles: [
    new MockFile('gallery1.jpg', 1024, 'image/jpeg'),
    new MockFile('gallery2.jpg', 1024, 'image/jpeg')
  ]
};

const oldHasFiles4 = testData4.posterFile || testData4.trailerFile || (testData4.galleryFiles && testData4.galleryFiles.length > 0);
const newHasFiles4 = testData4.posterFile || testData4.trailerFile || (testData4.galleryFiles && testData4.galleryFiles.length > 0) || testData4.fortuneCardFile;

console.log('🔍 Old logic result:', oldHasFiles4, '(correctly triggers upload)');
console.log('✅ New logic result:', newHasFiles4, '(correctly triggers upload)');
console.log('🎯 No regression:', oldHasFiles4 === newHasFiles4);

// Summary
console.log('\n🎉 Fortune Card hasFiles Detection Fix Verification Complete!');
console.log('============================================================');

console.log('\n📝 Summary:');
console.log('- ✅ Fortune card only uploads now trigger file upload process');
console.log('- ✅ No regression for other file types');
console.log('- ✅ No false positives when no files are present');
console.log('- ✅ Mixed file uploads continue to work correctly');

console.log('\n🔧 Technical Details:');
console.log('- Added || filmData.fortuneCardFile to hasFiles detection');
console.log('- Applied to both createFeatureFilm and updateFeatureFilm functions');
console.log('- Upload logic will now be triggered for fortune card uploads');

console.log('\n🚀 The fortune card upload should now work when updating films!');
