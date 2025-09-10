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

async function testWebRegistration() {
  console.log('🌐 Testing web registration with current rules...');
  console.log('');

  const activityId = '8LL7NmTndOZdJiurX0CL';
  
  // Use unique email with timestamp to avoid duplicates
  const timestamp = Date.now();
  const formData = {
    participantName: 'Web Test User',
    participantNameEn: 'Web Test User EN',
    email: `webtest${timestamp}@example.com`,
    phone: '1234567890',
    category: 'general_public',
    occupation: 'Developer',
    organization: 'Test Company',
    additionalNotes: 'Web registration test'
  };

  try {
    console.log('📋 Testing with form data:');
    console.log(JSON.stringify(formData, null, 2));
    console.log('');

    // First, let's test if we can read the activity
    console.log('🔍 Testing activity read access...');
    const activityRef = doc(db, 'activities', activityId);
    const activityDoc = await getDoc(activityRef);
    
    if (!activityDoc.exists()) {
      console.log('❌ Cannot read activity document');
      return;
    }
    
    const activity = activityDoc.data();
    console.log('✅ Activity read successful:', {
      name: activity.name,
      status: activity.status,
      isPublic: activity.isPublic,
      maxParticipants: activity.maxParticipants,
      registeredParticipants: activity.registeredParticipants
    });
    console.log('');

    // Test registration creation directly (without transaction first)
    console.log('🧪 Testing direct registration creation...');
    const registrationsRef = collection(activityRef, 'registrations');
    
    const registrationData = {
      participantName: formData.participantName.trim(),
      participantNameEn: formData.participantNameEn?.trim(),
      email: formData.email.toLowerCase().trim(),
      phone: formData.phone.trim(),
      category: formData.category,
      occupation: formData.occupation?.trim(),
      organization: formData.organization?.trim(),
      trackingCode: 'TEST1234',
      registeredAt: serverTimestamp(),
      status: 'registered',
      additionalNotes: formData.additionalNotes?.trim(),
      registrationSource: 'web',
      ipAddress: '127.0.0.1',
      userAgent: 'Test Script'
    };

    try {
      const directRegRef = await addDoc(registrationsRef, registrationData);
      console.log('✅ Direct registration creation successful:', directRegRef.id);
    } catch (directError) {
      console.log('❌ Direct registration creation failed:', directError.message);
      console.log('Error code:', directError.code);
    }
    console.log('');

    // Now test the full transaction (like the real service does)
    console.log('🔄 Testing full transaction...');
    
    const result = await runTransaction(db, async (transaction) => {
      // Get activity document
      const activityDoc = await transaction.get(activityRef);
      const activity = activityDoc.data();

      // Get current registrations
      const existingRegistrations = await getDocs(registrationsRef);
      const currentCount = existingRegistrations.size;

      // Generate new registration
      const trackingCode = 'TX' + Math.random().toString(36).substr(2, 6).toUpperCase();
      const newRegistrationRef = doc(registrationsRef);
      
      const transactionRegistrationData = {
        ...registrationData,
        trackingCode
      };

      transaction.set(newRegistrationRef, transactionRegistrationData);

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

      return {
        registrationId: newRegistrationRef.id,
        trackingCode
      };
    });

    console.log('✅ Full transaction successful!');
    console.log(`   Registration ID: ${result.registrationId}`);
    console.log(`   Tracking Code: ${result.trackingCode}`);
    console.log('');
    console.log('🎉 SUCCESS! Web registration is working correctly!');

  } catch (error) {
    console.error('❌ Web registration test failed:', {
      error: error.message,
      code: error.code,
      stack: error.stack
    });

    // Additional debugging
    if (error.code === 'permission-denied') {
      console.log('');
      console.log('🔍 Permission denied - checking rule deployment status...');
      console.log('Rules may still be propagating. Please wait 1-2 minutes and try again.');
    }
  }
}

// Run the test
testWebRegistration()
  .then(() => {
    console.log('');
    console.log('✅ Test completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Test script failed:', error);
    process.exit(1);
  });
