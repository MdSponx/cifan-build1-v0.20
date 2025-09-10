import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, doc, serverTimestamp } from 'firebase/firestore';

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDzDuGiiL5RfqE1y1kLQp16RQPnYJbWw_I",
  authDomain: "cifan-c41c6.firebaseapp.com",
  projectId: "cifan-c41c6",
  storageBucket: "cifan-c41c6.firebasestorage.app",
  messagingSenderId: "789354543255",
  appId: "1:789354543255:web:4506a0d3f2b5ff97e491d2",
  measurementId: "G-EFSKHEYFWC"
};

// Initialize Firebase WITHOUT authentication
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testRegistrationCreation() {
  console.log('🔍 Testing public registration creation...');
  console.log('📝 Note: This test runs WITHOUT authentication to simulate public user access');
  console.log('');

  // Use the activity ID from the previous test
  const activityId = '8LL7NmTndOZdJiurX0CL';
  
  try {
    console.log('✅ Test 1: Attempting to create registration WITHOUT category field...');
    
    const registrationDataWithoutCategory = {
      participantName: 'Test User',
      email: 'test@example.com',
      phone: '1234567890',
      trackingCode: 'TEST1234',
      registeredAt: serverTimestamp(),
      status: 'registered',
      registrationSource: 'web'
    };

    try {
      const registrationsRef = collection(db, 'activities', activityId, 'registrations');
      const docRef = await addDoc(registrationsRef, registrationDataWithoutCategory);
      console.log('   ✅ Registration created successfully without category:', docRef.id);
    } catch (error) {
      console.log('   ❌ Registration failed without category:', error.message);
      console.log('   Error code:', error.code);
    }
    
    console.log('');
    console.log('✅ Test 2: Attempting to create registration WITH category field...');
    
    const registrationDataWithCategory = {
      participantName: 'Test User 2',
      email: 'test2@example.com',
      phone: '1234567890',
      category: 'student', // Adding the category field
      trackingCode: 'TEST5678',
      registeredAt: serverTimestamp(),
      status: 'registered',
      registrationSource: 'web'
    };

    try {
      const registrationsRef = collection(db, 'activities', activityId, 'registrations');
      const docRef = await addDoc(registrationsRef, registrationDataWithCategory);
      console.log('   ✅ Registration created successfully with category:', docRef.id);
    } catch (error) {
      console.log('   ❌ Registration failed with category:', error.message);
      console.log('   Error code:', error.code);
    }

    console.log('');
    console.log('✅ Test 3: Testing with all optional fields...');
    
    const fullRegistrationData = {
      participantName: 'Test User 3',
      participantNameEn: 'Test User 3 EN',
      email: 'test3@example.com',
      phone: '1234567890',
      category: 'professional',
      occupation: 'Developer',
      organization: 'Test Company',
      trackingCode: 'TEST9999',
      registeredAt: serverTimestamp(),
      status: 'registered',
      registrationSource: 'web',
      additionalNotes: 'Test notes',
      ipAddress: '127.0.0.1',
      userAgent: 'Test User Agent'
    };

    try {
      const registrationsRef = collection(db, 'activities', activityId, 'registrations');
      const docRef = await addDoc(registrationsRef, fullRegistrationData);
      console.log('   ✅ Full registration created successfully:', docRef.id);
    } catch (error) {
      console.log('   ❌ Full registration failed:', error.message);
      console.log('   Error code:', error.code);
    }

    console.log('');
    console.log('🎉 Registration creation test completed!');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    console.error('Error details:', error.message);
    console.error('Error code:', error.code);
  }
}

// Run the test
testRegistrationCreation();
