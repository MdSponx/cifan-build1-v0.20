import { initializeApp } from 'firebase/app';
import { getFirestore, serverTimestamp } from 'firebase/firestore';
import { registrationService } from './src/services/registrationService.ts';

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

async function testRealRegistrationFlow() {
  console.log('🔍 Testing real registration flow...');
  console.log('📝 This test mimics exactly what the registration modal does');
  console.log('');

  const activityId = '8LL7NmTndOZdJiurX0CL';
  
  // Test data that matches exactly what the form would send
  const formData = {
    participantName: 'Test User Real Flow',
    participantNameEn: 'Test User Real Flow EN',
    email: 'testreal@example.com',
    phone: '1234567890',
    category: 'general_public',
    occupation: 'Developer',
    organization: 'Test Company',
    additionalNotes: 'Testing real flow'
  };

  try {
    console.log('📋 Form data being submitted:');
    console.log(JSON.stringify(formData, null, 2));
    console.log('');

    console.log('🔄 Calling registrationService.registerForActivity...');
    
    const result = await registrationService.registerForActivity(activityId, formData);
    
    console.log('📊 Registration result:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('✅ Registration successful!');
      console.log(`   Registration ID: ${result.registrationId}`);
      console.log(`   Tracking Code: ${result.trackingCode}`);
    } else {
      console.log('❌ Registration failed!');
      console.log(`   Error: ${result.error}`);
      console.log(`   Error Code: ${result.errorCode}`);
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
  }
}

// Run the test
testRealRegistrationFlow();
