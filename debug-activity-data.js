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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function debugActivityData() {
  console.log('🔍 Debugging activity data...');
  
  const activityId = '8LL7NmTndOZdJiurX0CL';
  
  try {
    const activityRef = doc(db, 'activities', activityId);
    const activityDoc = await getDoc(activityRef);
    
    if (!activityDoc.exists()) {
      console.log('❌ Activity not found');
      return;
    }
    
    const activity = activityDoc.data();
    console.log('📋 Complete activity data:');
    console.log(JSON.stringify(activity, null, 2));
    
    console.log('');
    console.log('🔍 Key fields for registration rules:');
    console.log('- status:', activity.status);
    console.log('- isPublic:', activity.isPublic);
    console.log('- maxParticipants:', activity.maxParticipants);
    console.log('- registeredParticipants:', activity.registeredParticipants);
    console.log('- registrationDeadline:', activity.registrationDeadline);
    
    console.log('');
    console.log('🧪 Rule evaluation:');
    console.log('- activity.status == "published":', activity.status === 'published');
    console.log('- activity.isPublic == true:', activity.isPublic === true);
    console.log('- activity.isPublic (actual value):', activity.isPublic);
    console.log('- activity.isPublic (type):', typeof activity.isPublic);
    
    const currentCount = activity.registeredParticipants || 0;
    const hasCapacity = activity.maxParticipants === 0 || currentCount < activity.maxParticipants;
    console.log('- has capacity:', hasCapacity, `(${currentCount}/${activity.maxParticipants})`);
    
    const overallCheck = activity.status === 'published' && 
                        activity.isPublic === true && 
                        hasCapacity;
    console.log('- overall checkActivityAvailability:', overallCheck);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugActivityData()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
