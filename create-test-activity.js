import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';

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

async function createTestActivity() {
  try {
    console.log('🎯 Creating test activity...');
    
    const testActivity = {
      name: "Test Film Workshop",
      shortDescription: "A hands-on workshop for aspiring filmmakers to learn the basics of cinematography and storytelling.",
      status: "published",
      isPublic: true,
      needSubmission: false,
      maxParticipants: 25,
      isOneDayActivity: true,
      eventDate: "2024-12-15",
      startTime: "10:00",
      endTime: "16:00",
      registrationDeadline: "2024-12-10",
      venueName: "CIFAN Main Hall",
      venueLocation: "Chiang Mai University, Thailand",
      description: "Join us for an exciting workshop where you'll learn the fundamentals of filmmaking. This workshop covers camera techniques, lighting, sound recording, and basic editing. Perfect for beginners and those looking to improve their skills. All equipment will be provided.",
      organizers: ["CIFAN Team", "Film Department"],
      speakers: [
        {
          id: "speaker1",
          name: "John Director",
          role: "Film Director",
          bio: "Award-winning director with 15 years of experience in the film industry."
        },
        {
          id: "speaker2", 
          name: "Sarah Cinematographer",
          role: "Cinematographer",
          bio: "Professional cinematographer specializing in documentary and narrative films."
        }
      ],
      tags: ["workshop", "filmmaking", "beginner-friendly"],
      contactEmail: "workshops@cifan.com",
      contactName: "CIFAN Workshop Team",
      contactPhone: "+66-123-456-789",
      imageUrl: "",
      imagePath: "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: "test-user",
      updatedBy: "test-user",
      registeredParticipants: 8,
      waitlistCount: 0,
      views: 0
    };

    const docRef = await addDoc(collection(db, 'activities'), testActivity);
    console.log('✅ Test activity created successfully with ID:', docRef.id);
    console.log('📝 Activity details:');
    console.log(`   Name: ${testActivity.name}`);
    console.log(`   Status: ${testActivity.status}`);
    console.log(`   Date: ${testActivity.eventDate}`);
    console.log(`   Participants: ${testActivity.registeredParticipants}/${testActivity.maxParticipants}`);
    
  } catch (error) {
    console.error('❌ Error creating test activity:', error);
    console.error('Error details:', error.message);
    console.error('Error code:', error.code);
  }
}

createTestActivity();
