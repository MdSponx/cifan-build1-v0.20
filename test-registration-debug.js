import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  serverTimestamp,
  runTransaction 
} from 'firebase/firestore';

// Firebase config - same as the real app
const firebaseConfig = {
  apiKey: "AIzaSyDzDuGiiL5RfqE1y1kLQp16RQPnYJbWw_I",
  authDomain: "cifan-c41c6.firebaseapp.com",
  projectId: "cifan-c41c6",
  storageBucket: "cifan-c41c6.firebasestorage.app",
  messagingSenderId: "789354543255",
  appId: "1:789354543255:web:4506a0d3f2b5ff97e491d2",
  measurementId: "G-EFSKHEYFWC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const ACTIVITIES_COLLECTION = 'activities';
const REGISTRATIONS_SUBCOLLECTION = 'registrations';

// Generate tracking code
function generateTrackingCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Get client info
function getClientInfo() {
  return {
    userAgent: 'Test Script',
    ipAddress: '127.0.0.1'
  };
}

async function testRegistrationFlow() {
  console.log('🔍 Testing registration flow with detailed debugging...');
  console.log('');

  const activityId = '8LL7NmTndOZdJiurX0CL';
  
  // Test data that matches exactly what the form would send
  const formData = {
    participantName: 'Test User Debug',
    participantNameEn: 'Test User Debug EN',
    email: 'testdebug@example.com',
    phone: '1234567890',
    category: 'general_public',
    occupation: 'Developer',
    organization: 'Test Company',
    additionalNotes: 'Testing debug flow'
  };

  try {
    console.log('📋 Form data being submitted:');
    console.log(JSON.stringify(formData, null, 2));
    console.log('');

    console.log('🔄 Starting registration transaction...');
    
    // Use transaction to ensure data consistency (mimicking the service)
    const result = await runTransaction(db, async (transaction) => {
      console.log('📖 Getting activity document...');
      
      // Get activity document
      const activityRef = doc(db, ACTIVITIES_COLLECTION, activityId);
      const activityDoc = await transaction.get(activityRef);

      if (!activityDoc.exists()) {
        throw new Error('ACTIVITY_NOT_FOUND');
      }

      const activity = activityDoc.data();
      console.log('✅ Activity found:', {
        name: activity.name,
        status: activity.status,
        maxParticipants: activity.maxParticipants,
        registrationDeadline: activity.registrationDeadline
      });

      // Check if activity is published and registration is open
      if (activity.status !== 'published') {
        throw new Error('REGISTRATION_CLOSED');
      }

      // Check registration deadline
      const now = new Date();
      const deadline = new Date(activity.registrationDeadline);
      console.log('⏰ Deadline check:', {
        now: now.toISOString(),
        deadline: deadline.toISOString(),
        isExpired: now > deadline
      });
      
      if (now > deadline) {
        throw new Error('REGISTRATION_CLOSED');
      }

      // Get current registrations to check capacity and duplicates
      console.log('📊 Checking existing registrations...');
      const registrationsRef = collection(activityRef, REGISTRATIONS_SUBCOLLECTION);
      const existingRegistrations = await getDocs(registrationsRef);

      console.log(`📈 Current registrations: ${existingRegistrations.size}/${activity.maxParticipants}`);

      // Check for duplicate email
      const duplicateEmail = existingRegistrations.docs.find(
        doc => doc.data().email.toLowerCase() === formData.email.toLowerCase()
      );
      if (duplicateEmail) {
        console.log('❌ Duplicate email found:', duplicateEmail.id);
        throw new Error('DUPLICATE_EMAIL');
      }

      // Check capacity
      const currentCount = existingRegistrations.size;
      if (currentCount >= activity.maxParticipants) {
        console.log('❌ Activity is full');
        throw new Error('ACTIVITY_FULL');
      }

      // Generate tracking code
      const trackingCode = generateTrackingCode();
      console.log('🎫 Generated tracking code:', trackingCode);

      // Get client info for metadata
      const clientInfo = getClientInfo();

      // Prepare registration data
      const registrationData = {
        participantName: formData.participantName.trim(),
        participantNameEn: formData.participantNameEn?.trim(),
        email: formData.email.toLowerCase().trim(),
        phone: formData.phone.trim(),
        category: formData.category,
        occupation: formData.occupation?.trim(),
        organization: formData.organization?.trim(),
        trackingCode,
        registeredAt: serverTimestamp(),
        status: 'registered',
        additionalNotes: formData.additionalNotes?.trim(),
        registrationSource: 'web',
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent
      };

      console.log('💾 Registration data to save:');
      console.log(JSON.stringify(registrationData, null, 2));

      // Add registration document
      const newRegistrationRef = doc(registrationsRef);
      transaction.set(newRegistrationRef, registrationData);

      // Update activity analytics
      const newCount = currentCount + 1;
      const analytics = {
        totalRegistrations: newCount,
        registrationsByStatus: {
          registered: newCount,
          attended: 0,
          absent: 0
        },
        lastRegistration: serverTimestamp(),
        popularityScore: (newCount / activity.maxParticipants) * 100
      };

      transaction.update(activityRef, {
        registeredParticipants: newCount,
        analytics,
        updatedAt: serverTimestamp()
      });

      console.log('📊 Updated analytics:', analytics);

      return {
        registrationId: newRegistrationRef.id,
        trackingCode
      };
    });

    console.log('✅ Registration completed successfully!');
    console.log(`   Registration ID: ${result.registrationId}`);
    console.log(`   Tracking Code: ${result.trackingCode}`);

    return {
      success: true,
      registrationId: result.registrationId,
      trackingCode: result.trackingCode
    };

  } catch (error) {
    console.error('❌ Registration failed:', {
      activityId,
      email: formData.email,
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined
    });

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    let errorCode = 'UNKNOWN_ERROR';

    switch (errorMessage) {
      case 'ACTIVITY_NOT_FOUND':
        errorCode = 'ACTIVITY_NOT_FOUND';
        break;
      case 'DUPLICATE_EMAIL':
        errorCode = 'DUPLICATE_EMAIL';
        break;
      case 'ACTIVITY_FULL':
        errorCode = 'ACTIVITY_FULL';
        break;
      case 'REGISTRATION_CLOSED':
        errorCode = 'REGISTRATION_CLOSED';
        break;
      case 'INVALID_DATA':
        errorCode = 'INVALID_DATA';
        break;
      default:
        errorCode = 'UNKNOWN_ERROR';
        console.error('❌ Unknown registration error details:', {
          originalError: error,
          errorType: typeof error,
          errorConstructor: error?.constructor?.name,
          activityId,
          formData: {
            participantName: formData.participantName,
            email: formData.email,
            phone: formData.phone,
            category: formData.category
          }
        });
    }

    return {
      success: false,
      error: errorMessage,
      errorCode
    };
  }
}

// Run the test
testRegistrationFlow()
  .then(result => {
    console.log('');
    console.log('🏁 Final result:');
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Test script failed:', error);
    process.exit(1);
  });
