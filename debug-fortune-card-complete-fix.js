/**
 * Fortune Card Upload Complete Debug Script
 * Tests the entire fortune card upload flow from form to Firebase Storage
 */

// Test the fortune card upload functionality
async function debugFortuneCardUpload() {
  console.log('🔮 Starting Fortune Card Upload Debug Test');
  console.log('=====================================');
  
  // Check if we're in the browser
  if (typeof window === 'undefined') {
    console.log('❌ This script must be run in the browser console');
    return;
  }
  
  // Check Firebase availability
  if (!window.firebase) {
    console.log('❌ Firebase not available');
    return;
  }
  
  console.log('✅ Firebase available');
  
  // Check authentication
  const auth = window.firebase.auth();
  const user = auth.currentUser;
  
  if (!user) {
    console.log('❌ User not authenticated');
    return;
  }
  
  console.log('✅ User authenticated:', user.uid);
  
  // Check Firebase Storage
  try {
    const storage = window.firebase.storage();
    console.log('✅ Firebase Storage accessible');
  } catch (error) {
    console.log('❌ Firebase Storage error:', error);
    return;
  }
  
  // Test file creation
  console.log('\n📁 Testing File Creation...');
  
  // Create a test image file
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 400;
  const ctx = canvas.getContext('2d');
  
  // Draw a test fortune card
  ctx.fillStyle = '#4A0E4E';
  ctx.fillRect(0, 0, 600, 400);
  
  ctx.fillStyle = '#FFD700';
  ctx.font = '24px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('🔮 TEST FORTUNE CARD 🔮', 300, 200);
  ctx.fillText('Debug Upload Test', 300, 240);
  ctx.fillText(new Date().toISOString(), 300, 280);
  
  // Convert to blob
  const testFile = await new Promise(resolve => {
    canvas.toBlob(resolve, 'image/png');
  });
  
  // Add file properties to make it look like a real File
  Object.defineProperty(testFile, 'name', {
    value: `test-fortune-card-${Date.now()}.png`,
    writable: false
  });
  
  Object.defineProperty(testFile, 'lastModified', {
    value: Date.now(),
    writable: false
  });
  
  console.log('✅ Test file created:', {
    name: testFile.name,
    size: testFile.size,
    type: testFile.type,
    isFile: testFile instanceof File
  });
  
  // Test the upload path generation
  console.log('\n📁 Testing Upload Path Generation...');
  
  const testFilmId = 'test-film-' + Date.now();
  const timestamp = Date.now();
  const sanitizedFileName = testFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const fortuneCardPath = `films/user_uploads/fortune_cards/${timestamp}_${sanitizedFileName}`;
  
  console.log('✅ Upload path generated:', fortuneCardPath);
  
  // Test Firebase Storage upload directly
  console.log('\n🚀 Testing Direct Firebase Storage Upload...');
  
  try {
    const storage = window.firebase.storage();
    const storageRef = storage.ref(fortuneCardPath);
    
    console.log('📁 Storage ref created:', fortuneCardPath);
    
    const uploadTask = storageRef.put(testFile);
    
    console.log('⏳ Upload initiated...');
    
    const snapshot = await uploadTask;
    console.log('✅ Upload completed:', snapshot.metadata.fullPath);
    
    const downloadURL = await snapshot.ref.getDownloadURL();
    console.log('🔗 Download URL generated:', downloadURL);
    
    // Test if the URL is accessible
    try {
      const response = await fetch(downloadURL, { method: 'HEAD' });
      if (response.ok) {
        console.log('✅ File is accessible via URL');
      } else {
        console.log('⚠️ File URL returned status:', response.status);
      }
    } catch (fetchError) {
      console.log('⚠️ Error testing file URL:', fetchError);
    }
    
    // Clean up test file
    try {
      await storageRef.delete();
      console.log('🗑️ Test file cleaned up');
    } catch (deleteError) {
      console.log('⚠️ Could not delete test file:', deleteError);
    }
    
  } catch (error) {
    console.log('❌ Direct upload failed:', error);
    return;
  }
  
  // Test form data structure
  console.log('\n📋 Testing Form Data Structure...');
  
  const testFormData = {
    titleEn: 'Test Fortune Card Film',
    category: 'Official Selection',
    genres: ['Drama'],
    countries: ['Thailand'],
    languages: ['Thai'],
    logline: 'A test film for fortune card upload',
    synopsis: 'This is a test film to verify fortune card upload functionality',
    timeEstimate: 'ค่ำ',
    theatre: 'Theatre 1',
    director: 'Test Director',
    status: 'ตอบรับ / Accepted',
    publicationStatus: 'draft',
    fortuneCardFile: testFile,
    fortuneCard: '', // This should be set by the upload
    fortuneCardUrl: '' // Legacy field
  };
  
  console.log('✅ Test form data created:', {
    hasFortuneCardFile: !!testFormData.fortuneCardFile,
    fortuneCardFileName: testFormData.fortuneCardFile?.name,
    fortuneCardFileSize: testFormData.fortuneCardFile?.size,
    fortuneCardFileType: testFormData.fortuneCardFile?.type,
    isFileInstance: testFormData.fortuneCardFile instanceof File
  });
  
  // Test the service functions (if available)
  console.log('\n🔧 Testing Service Functions...');
  
  // Check if featureFilmService is available
  if (window.featureFilmService) {
    console.log('✅ featureFilmService available');
    
    try {
      // Test create function
      const result = await window.featureFilmService.createFeatureFilm(testFormData, user.uid);
      
      if (result.success) {
        console.log('✅ Film created successfully:', result.data.id);
        console.log('🔗 Fortune card URL:', result.data.fortuneCard);
        
        // Clean up test film
        try {
          await window.featureFilmService.deleteFeatureFilm(result.data.id);
          console.log('🗑️ Test film cleaned up');
        } catch (deleteError) {
          console.log('⚠️ Could not delete test film:', deleteError);
        }
        
      } else {
        console.log('❌ Film creation failed:', result.error);
      }
      
    } catch (serviceError) {
      console.log('❌ Service function error:', serviceError);
    }
    
  } else {
    console.log('⚠️ featureFilmService not available in window object');
    console.log('ℹ️ This is normal - services are typically not exposed globally');
  }
  
  // Test storage rules
  console.log('\n🔒 Testing Storage Rules...');
  
  try {
    const storage = window.firebase.storage();
    const testRef = storage.ref('films/user_uploads/fortune_cards/test-permissions.txt');
    
    // Try to upload a small test file
    const testBlob = new Blob(['test'], { type: 'text/plain' });
    await testRef.put(testBlob);
    
    console.log('✅ Storage rules allow upload');
    
    // Clean up
    await testRef.delete();
    
  } catch (rulesError) {
    console.log('❌ Storage rules error:', rulesError);
    console.log('ℹ️ This might indicate a permissions issue');
  }
  
  console.log('\n🎉 Fortune Card Upload Debug Complete!');
  console.log('=====================================');
  
  return {
    success: true,
    message: 'Debug test completed successfully'
  };
}

// Test the FortuneCardUpload component (if available)
function testFortuneCardComponent() {
  console.log('\n🧩 Testing FortuneCardUpload Component...');
  
  // Look for the component in the DOM
  const fortuneCardElements = document.querySelectorAll('[data-testid="fortune-card-upload"], .fortune-card-upload, input[type="file"][accept*="image"]');
  
  if (fortuneCardElements.length > 0) {
    console.log('✅ Found fortune card upload elements:', fortuneCardElements.length);
    
    fortuneCardElements.forEach((element, index) => {
      console.log(`Element ${index + 1}:`, {
        tagName: element.tagName,
        type: element.type,
        accept: element.accept,
        className: element.className,
        id: element.id
      });
    });
    
  } else {
    console.log('⚠️ No fortune card upload elements found');
    console.log('ℹ️ This is normal if not on the film form page');
  }
}

// Test the form submission flow
function testFormSubmission() {
  console.log('\n📝 Testing Form Submission Flow...');
  
  // Look for the film form
  const forms = document.querySelectorAll('form');
  
  if (forms.length > 0) {
    console.log('✅ Found forms:', forms.length);
    
    forms.forEach((form, index) => {
      const fortuneCardInputs = form.querySelectorAll('input[type="file"][accept*="image"]');
      if (fortuneCardInputs.length > 0) {
        console.log(`Form ${index + 1} has file inputs:`, fortuneCardInputs.length);
      }
    });
    
  } else {
    console.log('⚠️ No forms found');
  }
}

// Main debug function
async function runFortuneCardDebug() {
  console.clear();
  console.log('🔮 FORTUNE CARD UPLOAD DEBUG SUITE');
  console.log('==================================');
  
  try {
    await debugFortuneCardUpload();
    testFortuneCardComponent();
    testFormSubmission();
    
    console.log('\n✅ All debug tests completed!');
    
  } catch (error) {
    console.log('❌ Debug suite error:', error);
  }
}

// Auto-run if in browser
if (typeof window !== 'undefined') {
  // Add to window for manual execution
  window.debugFortuneCard = runFortuneCardDebug;
  window.testFortuneCardUpload = debugFortuneCardUpload;
  
  console.log('🔮 Fortune Card Debug Suite Loaded!');
  console.log('Run: debugFortuneCard() or testFortuneCardUpload()');
}

// Export for Node.js if needed
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    debugFortuneCardUpload,
    runFortuneCardDebug
  };
}
