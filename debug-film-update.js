/**
 * Debug Script for Film Update Button Issues
 * Run this in the browser console on the film edit page
 */

// Global debug object to store results
window.filmUpdateDebug = {
  results: {},
  logs: []
};

const debug = window.filmUpdateDebug;

function log(message, data = null) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    message,
    data
  };
  debug.logs.push(logEntry);
  console.log(`🔍 [FILM DEBUG] ${message}`, data || '');
}

// 1. Check Authentication State
async function checkAuthState() {
  log('=== CHECKING AUTHENTICATION STATE ===');
  
  try {
    // Check Firebase Auth
    const auth = firebase?.auth?.();
    const currentUser = auth?.currentUser;
    
    debug.results.auth = {
      hasFirebase: !!window.firebase,
      hasAuth: !!auth,
      hasCurrentUser: !!currentUser,
      uid: currentUser?.uid,
      email: currentUser?.email,
      emailVerified: currentUser?.emailVerified
    };
    
    log('Firebase Auth State', debug.results.auth);
    
    // Check React Auth Context
    const authElements = document.querySelectorAll('[data-testid*="auth"], [class*="auth"]');
    log('Auth-related DOM elements found', authElements.length);
    
    // Check for user profile
    if (currentUser) {
      try {
        const profileDoc = await firebase.firestore().doc(`profiles/${currentUser.uid}`).get();
        debug.results.profile = {
          exists: profileDoc.exists(),
          data: profileDoc.exists() ? profileDoc.data() : null
        };
        log('User Profile', debug.results.profile);
      } catch (error) {
        log('Profile fetch error', error.message);
        debug.results.profile = { error: error.message };
      }
    }
    
    return debug.results.auth;
  } catch (error) {
    log('Auth check error', error.message);
    debug.results.auth = { error: error.message };
    return debug.results.auth;
  }
}

// 2. Check Form State
function checkFormState() {
  log('=== CHECKING FORM STATE ===');
  
  try {
    const forms = document.querySelectorAll('form');
    const submitButtons = document.querySelectorAll('button[type="submit"]');
    const updateButtons = document.querySelectorAll('button:contains("Update"), button:contains("Save")');
    
    debug.results.form = {
      formCount: forms.length,
      submitButtonCount: submitButtons.length,
      updateButtonCount: updateButtons.length,
      forms: Array.from(forms).map(form => ({
        id: form.id,
        action: form.action,
        method: form.method,
        elements: form.elements.length
      })),
      submitButtons: Array.from(submitButtons).map(btn => ({
        text: btn.textContent?.trim(),
        disabled: btn.disabled,
        type: btn.type,
        className: btn.className
      }))
    };
    
    log('Form State', debug.results.form);
    
    // Check for React state indicators
    const reactElements = document.querySelectorAll('[data-reactroot], [data-react-*]');
    log('React elements found', reactElements.length);
    
    return debug.results.form;
  } catch (error) {
    log('Form check error', error.message);
    debug.results.form = { error: error.message };
    return debug.results.form;
  }
}

// 3. Check Film Data
async function checkFilmData() {
  log('=== CHECKING FILM DATA ===');
  
  try {
    // Extract film ID from URL
    const urlMatch = window.location.hash.match(/edit\/([^\/]+)/);
    const filmId = urlMatch ? urlMatch[1] : null;
    
    if (!filmId) {
      log('No film ID found in URL');
      debug.results.filmData = { error: 'No film ID in URL' };
      return debug.results.filmData;
    }
    
    log('Film ID extracted from URL', filmId);
    
    // Try to fetch film data
    try {
      const filmDoc = await firebase.firestore().doc(`films/${filmId}`).get();
      debug.results.filmData = {
        filmId,
        exists: filmDoc.exists(),
        data: filmDoc.exists() ? filmDoc.data() : null,
        hasUserId: filmDoc.exists() && !!filmDoc.data()?.userId,
        hasCreatedBy: filmDoc.exists() && !!filmDoc.data()?.createdBy,
        publicationStatus: filmDoc.exists() ? filmDoc.data()?.publicationStatus : null
      };
      
      log('Film Data', debug.results.filmData);
      
      // Check permissions
      const currentUser = firebase.auth().currentUser;
      if (currentUser && filmDoc.exists()) {
        const filmData = filmDoc.data();
        debug.results.permissions = {
          isOwner: currentUser.uid === filmData.userId || currentUser.uid === filmData.createdBy,
          userUid: currentUser.uid,
          filmUserId: filmData.userId,
          filmCreatedBy: filmData.createdBy
        };
        log('Permission Check', debug.results.permissions);
      }
      
    } catch (error) {
      log('Film data fetch error', error.message);
      debug.results.filmData = { filmId, error: error.message };
    }
    
    return debug.results.filmData;
  } catch (error) {
    log('Film data check error', error.message);
    debug.results.filmData = { error: error.message };
    return debug.results.filmData;
  }
}

// 4. Test Firestore Permissions
async function testFirestorePermissions() {
  log('=== TESTING FIRESTORE PERMISSIONS ===');
  
  try {
    const currentUser = firebase.auth().currentUser;
    if (!currentUser) {
      debug.results.permissions = { error: 'No authenticated user' };
      return debug.results.permissions;
    }
    
    const filmId = debug.results.filmData?.filmId;
    if (!filmId) {
      debug.results.permissions = { error: 'No film ID available' };
      return debug.results.permissions;
    }
    
    const tests = {};
    
    // Test read permission
    try {
      const filmDoc = await firebase.firestore().doc(`films/${filmId}`).get();
      tests.read = { success: true, exists: filmDoc.exists() };
    } catch (error) {
      tests.read = { success: false, error: error.message };
    }
    
    // Test write permission (dry run)
    try {
      const filmRef = firebase.firestore().doc(`films/${filmId}`);
      // Don't actually update, just test the reference
      tests.writeRef = { success: true };
    } catch (error) {
      tests.writeRef = { success: false, error: error.message };
    }
    
    // Test profile access
    try {
      const profileDoc = await firebase.firestore().doc(`profiles/${currentUser.uid}`).get();
      tests.profile = { 
        success: true, 
        exists: profileDoc.exists(),
        role: profileDoc.exists() ? profileDoc.data()?.role : null
      };
    } catch (error) {
      tests.profile = { success: false, error: error.message };
    }
    
    debug.results.permissionTests = tests;
    log('Permission Tests', tests);
    
    return tests;
  } catch (error) {
    log('Permission test error', error.message);
    debug.results.permissionTests = { error: error.message };
    return debug.results.permissionTests;
  }
}

// 5. Monitor Network Requests
function setupNetworkMonitoring() {
  log('=== SETTING UP NETWORK MONITORING ===');
  
  // Monitor fetch requests
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    log('🌐 Fetch Request', { url: args[0], options: args[1] });
    
    return originalFetch.apply(this, args).then(response => {
      log('🌐 Fetch Response', { 
        url: args[0], 
        status: response.status, 
        statusText: response.statusText,
        ok: response.ok
      });
      return response;
    }).catch(error => {
      log('🌐 Fetch Error', { url: args[0], error: error.message });
      throw error;
    });
  };
  
  // Monitor Firestore operations
  if (window.firebase?.firestore) {
    const originalDoc = firebase.firestore().doc;
    firebase.firestore().doc = function(path) {
      log('🔥 Firestore Doc Access', path);
      return originalDoc.call(this, path);
    };
    
    const originalCollection = firebase.firestore().collection;
    firebase.firestore().collection = function(path) {
      log('🔥 Firestore Collection Access', path);
      return originalCollection.call(this, path);
    };
  }
  
  log('Network monitoring enabled');
}

// 6. Test Form Submission
async function testFormSubmission() {
  log('=== TESTING FORM SUBMISSION ===');
  
  try {
    const submitButtons = document.querySelectorAll('button[type="submit"]');
    if (submitButtons.length === 0) {
      log('No submit buttons found');
      return { error: 'No submit buttons found' };
    }
    
    const submitButton = submitButtons[0];
    log('Found submit button', {
      text: submitButton.textContent?.trim(),
      disabled: submitButton.disabled,
      className: submitButton.className
    });
    
    // Check if button is disabled
    if (submitButton.disabled) {
      log('Submit button is disabled');
      return { error: 'Submit button is disabled' };
    }
    
    // Don't actually click, just report readiness
    debug.results.formSubmission = {
      ready: true,
      buttonFound: true,
      buttonEnabled: !submitButton.disabled
    };
    
    log('Form submission test complete', debug.results.formSubmission);
    return debug.results.formSubmission;
    
  } catch (error) {
    log('Form submission test error', error.message);
    debug.results.formSubmission = { error: error.message };
    return debug.results.formSubmission;
  }
}

// 7. Emergency Update Function
async function emergencyUpdate(filmId, updateData) {
  log('=== EMERGENCY UPDATE ===');
  
  try {
    if (!filmId) {
      throw new Error('Film ID is required');
    }
    
    if (!updateData || Object.keys(updateData).length === 0) {
      throw new Error('Update data is required');
    }
    
    const filmRef = firebase.firestore().doc(`films/${filmId}`);
    
    // Add timestamp
    const finalUpdateData = {
      ...updateData,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    log('Attempting emergency update', { filmId, updateData: finalUpdateData });
    
    await filmRef.update(finalUpdateData);
    
    log('✅ Emergency update successful');
    return { success: true, filmId, updateData: finalUpdateData };
    
  } catch (error) {
    log('❌ Emergency update failed', error.message);
    return { success: false, error: error.message };
  }
}

// Main diagnostic function
async function runFullDiagnostic() {
  log('🚀 STARTING FULL FILM UPDATE DIAGNOSTIC');
  
  // Clear previous results
  debug.results = {};
  debug.logs = [];
  
  try {
    // Run all checks
    await checkAuthState();
    checkFormState();
    await checkFilmData();
    await testFirestorePermissions();
    setupNetworkMonitoring();
    await testFormSubmission();
    
    // Generate summary
    const summary = {
      timestamp: new Date().toISOString(),
      authOk: !!debug.results.auth?.hasCurrentUser,
      profileOk: !!debug.results.profile?.exists,
      filmDataOk: !!debug.results.filmData?.exists,
      permissionsOk: !!debug.results.permissionTests?.read?.success,
      formOk: !!debug.results.form?.submitButtonCount,
      overallStatus: 'unknown'
    };
    
    // Determine overall status
    if (summary.authOk && summary.profileOk && summary.filmDataOk && summary.permissionsOk && summary.formOk) {
      summary.overallStatus = 'healthy';
    } else if (!summary.authOk) {
      summary.overallStatus = 'auth_issue';
    } else if (!summary.permissionsOk) {
      summary.overallStatus = 'permission_issue';
    } else if (!summary.filmDataOk) {
      summary.overallStatus = 'data_issue';
    } else {
      summary.overallStatus = 'form_issue';
    }
    
    debug.results.summary = summary;
    
    log('🎯 DIAGNOSTIC COMPLETE', summary);
    
    // Print recommendations
    console.log('\n🔧 RECOMMENDATIONS:');
    if (summary.overallStatus === 'auth_issue') {
      console.log('- Sign out and sign back in');
      console.log('- Clear browser cache and cookies');
      console.log('- Check network connectivity');
    } else if (summary.overallStatus === 'permission_issue') {
      console.log('- Check user role in Firebase Console');
      console.log('- Verify Firestore security rules');
      console.log('- Ensure film ownership is correct');
    } else if (summary.overallStatus === 'data_issue') {
      console.log('- Verify film exists in Firestore');
      console.log('- Check film data structure');
      console.log('- Validate required fields');
    } else if (summary.overallStatus === 'form_issue') {
      console.log('- Check for JavaScript errors');
      console.log('- Verify form validation');
      console.log('- Check submit button state');
    } else if (summary.overallStatus === 'healthy') {
      console.log('- System appears healthy, try submitting the form');
      console.log('- Monitor network tab for errors');
      console.log('- Check browser console for additional errors');
    }
    
    console.log('\n📊 Full results available in: window.filmUpdateDebug');
    
    return summary;
    
  } catch (error) {
    log('💥 Diagnostic failed', error.message);
    console.error('Diagnostic error:', error);
    return { error: error.message };
  }
}

// Expose functions globally
window.filmUpdateDebug.runFullDiagnostic = runFullDiagnostic;
window.filmUpdateDebug.checkAuthState = checkAuthState;
window.filmUpdateDebug.checkFormState = checkFormState;
window.filmUpdateDebug.checkFilmData = checkFilmData;
window.filmUpdateDebug.testFirestorePermissions = testFirestorePermissions;
window.filmUpdateDebug.emergencyUpdate = emergencyUpdate;

// Auto-run diagnostic
console.log('🔍 Film Update Debug Script Loaded');
console.log('Run: filmUpdateDebug.runFullDiagnostic()');
console.log('Or run individual checks like: filmUpdateDebug.checkAuthState()');

// Auto-run if we're on an edit page
if (window.location.hash.includes('edit')) {
  console.log('🚀 Auto-running diagnostic (edit page detected)...');
  setTimeout(() => {
    runFullDiagnostic();
  }, 1000);
}
