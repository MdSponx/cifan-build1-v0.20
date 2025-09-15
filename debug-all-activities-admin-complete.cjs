const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: 'cifan-festival'
  });
}

const db = admin.firestore();

async function debugAllActivitiesForAdmin() {
  try {
    console.log('🔍 Debug: Checking ALL activities in collection (all statuses)...\n');

    // Get ALL activities regardless of status
    const activitiesSnapshot = await db.collection('activities').get();
    
    console.log(`📊 Total activities in collection: ${activitiesSnapshot.size}\n`);

    if (activitiesSnapshot.empty) {
      console.log('❌ No activities found in collection');
      return;
    }

    // Group activities by status
    const activitiesByStatus = {
      published: [],
      draft: [],
      cancelled: [],
      completed: [],
      other: []
    };

    console.log('📋 All activities in collection:\n');
    
    activitiesSnapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      const activity = {
        id: doc.id,
        name: data.name || 'Unnamed Activity',
        status: data.status || 'unknown',
        isPublic: data.isPublic || false,
        eventDate: data.eventDate || 'No date',
        venueName: data.venueName || 'No venue',
        startTime: data.startTime || 'No time',
        endTime: data.endTime || 'No time',
        createdAt: data.createdAt?.toDate?.() || 'No date',
        updatedAt: data.updatedAt?.toDate?.() || 'No date'
      };

      console.log(`${index + 1}. "${activity.name}"`);
      console.log(`   ID: ${activity.id}`);
      console.log(`   Status: ${activity.status}`);
      console.log(`   Public: ${activity.isPublic ? 'Yes' : 'No'}`);
      console.log(`   Date: ${activity.eventDate}`);
      console.log(`   Venue: ${activity.venueName}`);
      console.log(`   Time: ${activity.startTime} - ${activity.endTime}`);
      console.log(`   Created: ${activity.createdAt}`);
      console.log(`   Updated: ${activity.updatedAt}`);
      console.log('');

      // Group by status
      if (activitiesByStatus[activity.status]) {
        activitiesByStatus[activity.status].push(activity);
      } else {
        activitiesByStatus.other.push(activity);
      }
    });

    // Summary by status
    console.log('📊 Activities by Status:');
    Object.keys(activitiesByStatus).forEach(status => {
      const count = activitiesByStatus[status].length;
      if (count > 0) {
        console.log(`  ${status.toUpperCase()}: ${count} activities`);
      }
    });

    console.log('\n🔍 Detailed Status Breakdown:\n');
    
    Object.keys(activitiesByStatus).forEach(status => {
      const activities = activitiesByStatus[status];
      if (activities.length > 0) {
        console.log(`${status.toUpperCase()} (${activities.length} activities):`);
        activities.forEach((activity, index) => {
          console.log(`  ${index + 1}. "${activity.name}" (${activity.eventDate})`);
        });
        console.log('');
      }
    });

    // Check for any unusual statuses
    const allStatuses = [...new Set(activitiesSnapshot.docs.map(doc => doc.data().status))];
    console.log('🏷️ All unique statuses found:', allStatuses);

    // Check for activities without required fields
    console.log('\n🔍 Data Quality Check:');
    let missingName = 0;
    let missingStatus = 0;
    let missingDate = 0;
    let missingVenue = 0;

    activitiesSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (!data.name) missingName++;
      if (!data.status) missingStatus++;
      if (!data.eventDate) missingDate++;
      if (!data.venueName) missingVenue++;
    });

    console.log(`  Activities missing name: ${missingName}`);
    console.log(`  Activities missing status: ${missingStatus}`);
    console.log(`  Activities missing event date: ${missingDate}`);
    console.log(`  Activities missing venue: ${missingVenue}`);

  } catch (error) {
    console.error('❌ Error debugging activities:', error);
  }
}

debugAllActivitiesForAdmin();
