const admin = require('firebase-admin');

// Initialize Firebase Admin (if not already initialized)
if (!admin.apps.length) {
  const serviceAccount = require('./serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function createTestActivityForSep20() {
  try {
    console.log('🎭 Creating test activity for September 20, 2025...');

    const testActivity = {
      name: "Test Workshop: Digital Filmmaking",
      shortDescription: "Learn the basics of digital filmmaking with industry professionals",
      description: "<p>Join us for an exciting workshop on digital filmmaking techniques. Perfect for beginners and intermediate filmmakers.</p>",
      eventDate: "2025-09-20",
      startTime: "14:00",
      endTime: "16:00",
      venueName: "stageZone", // Using camelCase format that matches database
      venueLocation: "https://maps.app.goo.gl/pWBQ2L2vNWNzwFkm7",
      maxParticipants: 50,
      registeredParticipants: 0,
      waitlistCount: 0,
      isPublic: true,
      status: "published",
      needSubmission: false,
      isOneDayActivity: true,
      tags: ["workshop", "filmmaking", "digital", "beginners", "free"],
      organizers: ["CIFAN"],
      speakers: [],
      contactName: "Test Organizer",
      contactEmail: "test@cifanfest.com",
      contactPhone: "0123456789",
      registrationDeadline: "2025-09-19",
      views: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: "system",
      updatedBy: "system"
    };

    const docRef = await db.collection('activities').add(testActivity);
    console.log('✅ Test activity created with ID:', docRef.id);
    console.log('📅 Event Date:', testActivity.eventDate);
    console.log('🏢 Venue Name:', testActivity.venueName);
    console.log('⏰ Time:', `${testActivity.startTime} - ${testActivity.endTime}`);

    // Create another test activity for a different venue
    const testActivity2 = {
      name: "Film Screening: Horror Classics",
      shortDescription: "A special screening of classic horror films",
      description: "<p>Experience the best of classic horror cinema in our special screening event.</p>",
      eventDate: "2025-09-20",
      startTime: "19:00",
      endTime: "21:30",
      venueName: "majorTheatre7", // Different venue
      venueLocation: "https://maps.app.goo.gl/example",
      maxParticipants: 200,
      registeredParticipants: 0,
      waitlistCount: 0,
      isPublic: true,
      status: "published",
      needSubmission: false,
      isOneDayActivity: true,
      tags: ["screening", "horror", "classics", "evening", "free"],
      organizers: ["CIFAN"],
      speakers: [],
      contactName: "Test Organizer",
      contactEmail: "test@cifanfest.com",
      contactPhone: "0123456789",
      registrationDeadline: "2025-09-19",
      views: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: "system",
      updatedBy: "system"
    };

    const docRef2 = await db.collection('activities').add(testActivity2);
    console.log('✅ Second test activity created with ID:', docRef2.id);
    console.log('📅 Event Date:', testActivity2.eventDate);
    console.log('🏢 Venue Name:', testActivity2.venueName);
    console.log('⏰ Time:', `${testActivity2.startTime} - ${testActivity2.endTime}`);

    console.log('🎉 Test activities created successfully!');
    console.log('🔍 Now check the schedule page for September 20, 2025');

  } catch (error) {
    console.error('❌ Error creating test activities:', error);
  }
}

// Run the function
createTestActivityForSep20()
  .then(() => {
    console.log('✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
