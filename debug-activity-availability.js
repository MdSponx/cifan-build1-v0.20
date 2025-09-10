import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

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

async function debugActivityAvailability() {
  console.log('🔍 Debugging activity availability for registration...');
  console.log('');

  const activityId = '8LL7NmTndOZdJiurX0CL';
  
  try {
    // Get the activity document
    const activityRef = doc(db, 'activities', activityId);
    const activityDoc = await getDoc(activityRef);
    
    if (!activityDoc.exists()) {
      console.log('❌ Activity document does not exist!');
      return;
    }
    
    const activity = activityDoc.data();
    console.log('📋 Activity Data:');
    console.log('   ID:', activityId);
    console.log('   Name:', activity.name);
    console.log('   Status:', activity.status);
    console.log('   isPublic:', activity.isPublic);
    console.log('   needSubmission:', activity.needSubmission);
    console.log('   maxParticipants:', activity.maxParticipants);
    console.log('   registeredParticipants:', activity.registeredParticipants);
    console.log('   registrationDeadline:', activity.registrationDeadline);
    console.log('   registrationDeadline type:', typeof activity.registrationDeadline);
    
    if (activity.registrationDeadline && activity.registrationDeadline.toDate) {
      console.log('   registrationDeadline as Date:', activity.registrationDeadline.toDate());
    }
    
    console.log('');
    console.log('🔍 Checking availability conditions:');
    
    // Check each condition
    const now = new Date();
    console.log('   Current time:', now);
    
    console.log('   ✓ Status check (published):', activity.status === 'published');
    console.log('   ✓ Public check (true):', activity.isPublic === true);
    
    // Check deadline
    let deadlineCheck = false;
    if (activity.registrationDeadline) {
      if (activity.registrationDeadline.toDate) {
        const deadline = activity.registrationDeadline.toDate();
        deadlineCheck = now < deadline;
        console.log('   ✓ Deadline check (not expired):', deadlineCheck);
        console.log('     Deadline:', deadline);
        console.log('     Time remaining:', deadline.getTime() - now.getTime(), 'ms');
      } else {
        console.log('   ❌ Deadline is not a Firestore Timestamp');
      }
    } else {
      console.log('   ❌ No registration deadline found');
    }
    
    // Check capacity
    const currentCount = activity.registeredParticipants || 0;
    const capacityCheck = activity.maxParticipants === 0 || currentCount < activity.maxParticipants;
    console.log('   ✓ Capacity check (not full):', capacityCheck);
    console.log('     Current registrations:', currentCount);
    console.log('     Max participants:', activity.maxParticipants);
    
    console.log('');
    console.log('📊 Overall availability:', 
      activity.status === 'published' && 
      activity.isPublic === true && 
      deadlineCheck && 
      capacityCheck
    );
    
    // Test the exact validation that would happen in Firestore rules
    console.log('');
    console.log('🔍 Testing Firestore rule conditions:');
    console.log('   activity.status == "published":', activity.status == 'published');
    console.log('   activity.isPublic == true:', activity.isPublic == true);
    
    if (activity.registrationDeadline && activity.registrationDeadline.toMillis) {
      const deadlineMillis = activity.registrationDeadline.toMillis();
      const nowMillis = Date.now();
      console.log('   deadline.toMillis() > now:', deadlineMillis > nowMillis);
      console.log('     Deadline millis:', deadlineMillis);
      console.log('     Now millis:', nowMillis);
    }
    
    const registeredCount = activity.registeredParticipants == null ? 0 : activity.registeredParticipants;
    console.log('   maxParticipants == 0 || registeredParticipants < maxParticipants:', 
      activity.maxParticipants == 0 || registeredCount < activity.maxParticipants);
    console.log('     Max participants:', activity.maxParticipants);
    console.log('     Registered participants:', registeredCount);

  } catch (error) {
    console.error('❌ Error debugging activity availability:', error);
    console.error('Error details:', error.message);
  }
}

// Run the debug
debugActivityAvailability();
