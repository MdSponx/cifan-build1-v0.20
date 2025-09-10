import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';

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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testValidation() {
  console.log('🔍 Testing validation rules...');
  
  const activityId = '8LL7NmTndOZdJiurX0CL';
  
  // Test data that matches exactly what our registration service sends
  const registrationData = {
    participantName: 'Test User Debug',
    participantNameEn: 'Test User Debug EN',
    email: 'testdebug@example.com',
    phone: '1234567890',
    category: 'general_public',
    occupation: 'Developer',
    organization: 'Test Company',
    trackingCode: 'TEST1234',
    registeredAt: serverTimestamp(),
    status: 'registered',
    additionalNotes: 'Testing debug flow',
    registrationSource: 'web',
    ipAddress: '127.0.0.1',
    userAgent: 'Test Script'
  };

  console.log('📋 Registration data to validate:');
  console.log(JSON.stringify(registrationData, null, 2));
  console.log('');

  // Check each validation rule manually
  console.log('🧪 Manual validation checks:');
  
  // Required fields check
  const requiredFields = ['participantName', 'email', 'phone', 'trackingCode', 'registeredAt', 'status', 'registrationSource'];
  const hasAllRequired = requiredFields.every(field => registrationData.hasOwnProperty(field));
  console.log('- Has all required fields:', hasAllRequired, requiredFields);
  
  // Field type and length validations
  console.log('- participantName:', typeof registrationData.participantName, 'length:', registrationData.participantName.length, 'valid:', 
    typeof registrationData.participantName === 'string' && 
    registrationData.participantName.length >= 2 && 
    registrationData.participantName.length <= 100);
  
  console.log('- email:', typeof registrationData.email, 'format valid:', /.*@.*\..*/.test(registrationData.email));
  
  console.log('- phone:', typeof registrationData.phone, 'length:', registrationData.phone.length, 'valid:', 
    typeof registrationData.phone === 'string' && registrationData.phone.length >= 10);
  
  console.log('- trackingCode:', typeof registrationData.trackingCode, 'length:', registrationData.trackingCode.length, 'valid:', 
    typeof registrationData.trackingCode === 'string' && registrationData.trackingCode.length === 8);
  
  console.log('- status:', registrationData.status, 'valid:', ['registered', 'attended', 'absent'].includes(registrationData.status));
  
  console.log('- registrationSource:', registrationData.registrationSource, 'valid:', ['web', 'admin'].includes(registrationData.registrationSource));
  
  console.log('');
  
  // Try to write directly to test the rules
  try {
    const registrationRef = doc(db, 'activities', activityId, 'registrations', 'test-validation');
    await setDoc(registrationRef, registrationData);
    console.log('✅ Direct write successful - rules validation passed');
  } catch (error) {
    console.error('❌ Direct write failed:', error.message);
    console.error('Error code:', error.code);
  }
}

testValidation()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
