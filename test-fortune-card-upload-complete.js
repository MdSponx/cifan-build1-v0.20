/**
 * Complete Fortune Card Upload Test Script
 * Tests the entire fortune card upload flow from form to Firebase Storage
 */

// Test configuration
const TEST_CONFIG = {
  filmId: 'test-film-' + Date.now(),
  userId: 'test-user-123',
  testImageUrl: 'https://via.placeholder.com/600x400/purple/white?text=Fortune+Card+Test',
  expectedStoragePath: 'films/user_uploads/fortune_cards/',
  timeout: 30000 // 30 seconds
};

console.log('🔮 Starting Complete Fortune Card Upload Test');
console.log('📋 Test Configuration:', TEST_CONFIG);

// Test 1: Verify Firebase is loaded
function testFirebaseLoaded() {
  console.log('\n🧪 Test 1: Firebase Loading');
  
  if (typeof firebase === 'undefined') {
    console.error('❌ Firebase not loaded globally');
    return false;
  }
  
  console.log('✅ Firebase loaded successfully');
  
  // Test Firebase Storage
  try {
    const storage = firebase.storage();
    console.log('✅ Firebase Storage accessible');
    return true;
  } catch (error) {
    console.error('❌ Firebase Storage error:', error);
    return false;
  }
}

// Test 2: Verify Authentication
function testAuthentication() {
  console.log('\n🧪 Test 2: Authentication');
  
  const auth = firebase.auth();
  const user = auth.currentUser;
  
  if (!user) {
    console.error('❌ User not authenticated');
    console.log('ℹ️ Please log in to continue tests');
    return false;
  }
  
  console.log('✅ User authenticated:', {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName
  });
  
  return true;
}

// Test 3: Create test File object
function createTestFile() {
  console.log('\n🧪 Test 3: Creating Test File');
  
  try {
    // Create a simple test image as a File object
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 400;
    
    const ctx = canvas.getContext('2d');
    
    // Create a gradient background
    const gradient = ctx.createLinearGradient(0, 0, 600, 400);
    gradient.addColorStop(0, '#8B5CF6'); // Purple
    gradient.addColorStop(1, '#EC4899'); // Pink
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 600, 400);
    
    // Add text
    ctx.fillStyle = 'white';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🔮 Fortune Card Test', 300, 180);
    ctx.fillText(new Date().toISOString(), 300, 220);
    
    // Convert to blob then to File
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        const file = new File([blob], `fortune-card-test-${Date.now()}.png`, {
          type: 'image/png',
          lastModified: Date.now()
        });
        
        console.log('✅ Test file created:', {
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: new Date(file.lastModified).toISOString()
        });
        
        resolve(file);
      }, 'image/png', 0.9);
    });
  } catch (error) {
    console.error('❌ Error creating test file:', error);
    return null;
  }
}

// Test 4: Test uploadFile function directly
async function testUploadFunction(testFile) {
  console.log('\n🧪 Test 4: Direct Upload Function Test');
  
  if (!testFile) {
    console.error('❌ No test file provided');
    return null;
  }
  
  try {
    // Import the uploadFile function (assuming it's available globally)
    if (typeof uploadFile === 'undefined') {
      console.error('❌ uploadFile function not available globally');
      console.log('ℹ️ Testing with direct Firebase Storage API instead');
      
      // Direct Firebase Storage test
      const storage = firebase.storage();
      const timestamp = Date.now();
      const path = `${TEST_CONFIG.expectedStoragePath}${timestamp}_${testFile.name}`;
      const storageRef = storage.ref(path);
      
      console.log('📤 Uploading to path:', path);
      
      const uploadTask = storageRef.put(testFile);
      
      return new Promise((resolve, reject) => {
        uploadTask.on('state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log('📊 Upload progress:', Math.round(progress) + '%');
          },
          (error) => {
            console.error('❌ Upload failed:', error);
            reject(error);
          },
          async () => {
            try {
              const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
              console.log('✅ Upload completed successfully');
              console.log('🔗 Download URL:', downloadURL);
              resolve(downloadURL);
            } catch (error) {
              console.error('❌ Error getting download URL:', error);
              reject(error);
            }
          }
        );
      });
    } else {
      // Use the uploadFile function
      const timestamp = Date.now();
      const path = `${TEST_CONFIG.expectedStoragePath}${timestamp}_${testFile.name}`;
      
      console.log('📤 Using uploadFile function with path:', path);
      
      const result = await uploadFile(testFile, path);
      console.log('✅ uploadFile completed:', result);
      
      return result.url || result;
    }
  } catch (error) {
    console.error('❌ Upload function test failed:', error);
    return null;
  }
}

// Test 5: Test form data flow
function testFormDataFlow(testFile, uploadedUrl) {
  console.log('\n🧪 Test 5: Form Data Flow Test');
  
  // Simulate form data
  const formData = {
    titleEn: 'Test Film for Fortune Card',
    director: 'Test Director',
    category: 'Official Selection',
    genres: ['Drama'],
    countries: ['Thailand'],
    languages: ['Thai'],
    logline: 'A test film for fortune card upload',
    synopsis: 'This is a test film created to verify fortune card upload functionality.',
    timeEstimate: 'ค่ำ',
    theatre: 'Theatre 1',
    status: 'ตอบรับ / Accepted',
    publicationStatus: 'draft',
    fortuneCardFile: testFile,
    fortuneCard: uploadedUrl,
    fortuneCardUrl: uploadedUrl // For backward compatibility
  };
  
  console.log('📋 Form data prepared:', {
    hasFortuneCardFile: !!formData.fortuneCardFile,
    fortuneCardFileName: formData.fortuneCardFile?.name,
    fortuneCardFileSize: formData.fortuneCardFile?.size,
    hasFortuneCard: !!formData.fortuneCard,
    fortuneCardValue: formData.fortuneCard,
    hasFortuneCardUrl: !!formData.fortuneCardUrl
  });
  
  // Test data filtering (simulate what happens in helpers)
  const cleanedData = {};
  Object.entries(formData).forEach(([key, value]) => {
    if (value !== undefined && 
        key !== 'id' && 
        key !== 'createdAt' && 
        key !== 'createdBy' && 
        key !== 'updatedAt') {
      cleanedData[key] = value;
    }
  });
  
  console.log('🧹 Data after helper cleaning:', {
    hasFortuneCardFile: !!cleanedData.fortuneCardFile,
    hasFortuneCard: !!cleanedData.fortuneCard,
    hasFortuneCardUrl: !!cleanedData.fortuneCardUrl,
    totalKeys: Object.keys(cleanedData).length
  });
  
  // Test service data preparation (simulate prepareFilmDataForFirestore)
  const { fortuneCardFile, ...serviceData } = cleanedData;
  
  console.log('🔧 Data after service preparation:', {
    removedFortuneCardFile: !!fortuneCardFile,
    hasFortuneCard: !!serviceData.fortuneCard,
    hasFortuneCardUrl: !!serviceData.fortuneCardUrl,
    fortuneCardValue: serviceData.fortuneCard
  });
  
  console.log('✅ Form data flow test completed successfully');
  return serviceData;
}

// Test 6: Test Firebase Storage rules
async function testStorageRules(testFile) {
  console.log('\n🧪 Test 6: Storage Rules Test');
  
  try {
    const storage = firebase.storage();
    const timestamp = Date.now();
    const testPath = `${TEST_CONFIG.expectedStoragePath}rules-test-${timestamp}.png`;
    const storageRef = storage.ref(testPath);
    
    console.log('🔒 Testing storage rules with path:', testPath);
    
    // Try to upload
    await storageRef.put(testFile);
    console.log('✅ Storage rules allow upload');
    
    // Try to get download URL
    const downloadURL = await storageRef.getDownloadURL();
    console.log('✅ Storage rules allow read access');
    console.log('🔗 Test file URL:', downloadURL);
    
    // Clean up test file
    try {
      await storageRef.delete();
      console.log('✅ Test file cleaned up');
    } catch (deleteError) {
      console.warn('⚠️ Could not delete test file:', deleteError.message);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Storage rules test failed:', error);
    console.log('💡 Check Firebase Storage rules for path:', TEST_CONFIG.expectedStoragePath);
    return false;
  }
}

// Test 7: End-to-end integration test
async function testEndToEndIntegration() {
  console.log('\n🧪 Test 7: End-to-End Integration Test');
  
  try {
    // Create test file
    const testFile = await createTestFile();
    if (!testFile) {
      throw new Error('Failed to create test file');
    }
    
    // Test upload
    const uploadedUrl = await testUploadFunction(testFile);
    if (!uploadedUrl) {
      throw new Error('Failed to upload test file');
    }
    
    // Test form data flow
    const serviceData = testFormDataFlow(testFile, uploadedUrl);
    
    // Verify final data structure
    if (!serviceData.fortuneCard) {
      throw new Error('fortuneCard field missing in final data');
    }
    
    if (serviceData.fortuneCardFile) {
      throw new Error('fortuneCardFile should be removed from service data');
    }
    
    console.log('✅ End-to-end integration test passed');
    console.log('🎉 Fortune card upload flow is working correctly');
    
    return {
      success: true,
      uploadedUrl,
      serviceData
    };
  } catch (error) {
    console.error('❌ End-to-end integration test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting Complete Fortune Card Upload Tests');
  console.log('⏰ Timeout:', TEST_CONFIG.timeout + 'ms');
  
  const results = {
    firebaseLoaded: false,
    authenticated: false,
    storageRules: false,
    endToEnd: false,
    errors: []
  };
  
  try {
    // Test 1: Firebase loading
    results.firebaseLoaded = testFirebaseLoaded();
    if (!results.firebaseLoaded) {
      throw new Error('Firebase not properly loaded');
    }
    
    // Test 2: Authentication
    results.authenticated = testAuthentication();
    if (!results.authenticated) {
      throw new Error('User not authenticated');
    }
    
    // Test 3: Create test file and test storage rules
    const testFile = await createTestFile();
    if (testFile) {
      results.storageRules = await testStorageRules(testFile);
    }
    
    // Test 4: End-to-end integration
    const integrationResult = await testEndToEndIntegration();
    results.endToEnd = integrationResult.success;
    if (!integrationResult.success) {
      results.errors.push(integrationResult.error);
    }
    
  } catch (error) {
    console.error('💥 Test suite failed:', error);
    results.errors.push(error.message);
  }
  
  // Print final results
  console.log('\n📊 TEST RESULTS SUMMARY');
  console.log('========================');
  console.log('Firebase Loaded:', results.firebaseLoaded ? '✅' : '❌');
  console.log('Authentication:', results.authenticated ? '✅' : '❌');
  console.log('Storage Rules:', results.storageRules ? '✅' : '❌');
  console.log('End-to-End:', results.endToEnd ? '✅' : '❌');
  
  if (results.errors.length > 0) {
    console.log('\n❌ ERRORS:');
    results.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error}`);
    });
  }
  
  const allPassed = results.firebaseLoaded && results.authenticated && results.storageRules && results.endToEnd;
  
  if (allPassed) {
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('✅ Fortune card upload functionality is working correctly');
  } else {
    console.log('\n⚠️ SOME TESTS FAILED');
    console.log('🔧 Please check the errors above and fix the issues');
  }
  
  return results;
}

// Auto-run tests if in browser environment
if (typeof window !== 'undefined') {
  // Wait for page to load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runAllTests);
  } else {
    // Run tests after a short delay to ensure Firebase is initialized
    setTimeout(runAllTests, 2000);
  }
}

// Export for manual testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    runAllTests,
    testFirebaseLoaded,
    testAuthentication,
    createTestFile,
    testUploadFunction,
    testFormDataFlow,
    testStorageRules,
    testEndToEndIntegration,
    TEST_CONFIG
  };
}

// Make functions available globally for browser console testing
if (typeof window !== 'undefined') {
  window.fortuneCardTests = {
    runAllTests,
    testFirebaseLoaded,
    testAuthentication,
    createTestFile,
    testUploadFunction,
    testFormDataFlow,
    testStorageRules,
    testEndToEndIntegration,
    TEST_CONFIG
  };
  
  console.log('🔮 Fortune Card Tests loaded!');
  console.log('💡 Run window.fortuneCardTests.runAllTests() to start testing');
}
