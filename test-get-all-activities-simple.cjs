#!/usr/bin/env node

/**
 * Simple test script to get all activities from the activities collection
 * Tests both public access (no auth) and what activities exist
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, orderBy, where } = require('firebase/firestore');

// Firebase configuration - CIFAN Project
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

async function testPublicActivitiesAccess() {
  console.log('🧪 Testing public access to activities (no authentication)...');
  
  try {
    // Test 1: Try to get published activities (should work without auth)
    console.log('\n📡 Test 1: Getting published activities (public access)...');
    
    const publishedQuery = query(
      collection(db, 'activities'),
      where('status', '==', 'published')
    );
    
    const publishedSnapshot = await getDocs(publishedQuery);
    const publishedActivities = publishedSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || 'Unnamed Activity',
        status: data.status || 'unknown',
        isPublic: data.isPublic || false,
        eventDate: data.eventDate || 'No date',
        createdAt: data.createdAt || null,
        maxParticipants: data.maxParticipants || 0,
        registeredParticipants: data.registeredParticipants || 0
      };
    });
    
    console.log('✅ Published activities found:', publishedActivities.length);
    
    if (publishedActivities.length > 0) {
      console.log('\n📊 Published activities details:');
      publishedActivities.forEach((activity, index) => {
        console.log(`${index + 1}. ${activity.name}`);
        console.log(`   - Status: ${activity.status}`);
        console.log(`   - Public: ${activity.isPublic}`);
        console.log(`   - Event Date: ${activity.eventDate}`);
        console.log(`   - Participants: ${activity.registeredParticipants}/${activity.maxParticipants}`);
        console.log('');
      });
    }
    
    return publishedActivities;
    
  } catch (error) {
    console.error('❌ Error accessing published activities:', error.message);
    return [];
  }
}

async function testBasicActivitiesQuery() {
  console.log('\n🧪 Testing basic activities query (no filters)...');
  
  try {
    // Test 2: Basic query without filters (might work for public activities)
    const basicQuery = query(collection(db, 'activities'));
    const basicSnapshot = await getDocs(basicQuery);
    
    console.log('✅ Basic query results:', basicSnapshot.docs.length, 'activities found');
    
    if (basicSnapshot.docs.length > 0) {
      const activities = basicSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || 'Unnamed Activity',
          status: data.status || 'unknown',
          isPublic: data.isPublic || false
        };
      });
      
      // Group by status
      const statusGroups = activities.reduce((groups, activity) => {
        const status = activity.status;
        if (!groups[status]) groups[status] = [];
        groups[status].push(activity);
        return groups;
      }, {});
      
      console.log('\n📊 Activities by status:');
      Object.entries(statusGroups).forEach(([status, activities]) => {
        console.log(`- ${status}: ${activities.length} activities`);
        activities.slice(0, 3).forEach(activity => {
          console.log(`  • ${activity.name} (public: ${activity.isPublic})`);
        });
      });
      
      return activities;
    }
    
    return [];
    
  } catch (error) {
    console.error('❌ Error with basic query:', error.message);
    return [];
  }
}

async function testActivitiesService() {
  console.log('\n🧪 Testing activities service approach...');
  
  try {
    // Test what the actual service would do
    console.log('📡 Simulating activitiesService.getAllActivities()...');
    
    // This simulates what the service should do - get all activities for admin
    // But since we're not authenticated, we'll only get public ones
    const q = query(collection(db, 'activities'));
    const snapshot = await getDocs(q);
    
    const allActivities = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || 'Unnamed Activity',
        status: data.status || 'unknown',
        isPublic: data.isPublic !== false, // Default to true if not specified
        eventDate: data.eventDate || 'No date',
        createdAt: data.createdAt,
        maxParticipants: data.maxParticipants || 0,
        registeredParticipants: data.registeredParticipants || 0,
        venueName: data.venueName || 'No venue',
        shortDescription: data.shortDescription || 'No description'
      };
    });
    
    console.log('✅ Service simulation results:');
    console.log(`- Total activities accessible: ${allActivities.length}`);
    
    // Analyze what we got
    const publicActivities = allActivities.filter(a => a.isPublic);
    const privateActivities = allActivities.filter(a => !a.isPublic);
    const publishedActivities = allActivities.filter(a => a.status === 'published');
    const draftActivities = allActivities.filter(a => a.status === 'draft');
    
    console.log(`- Public activities: ${publicActivities.length}`);
    console.log(`- Private activities: ${privateActivities.length}`);
    console.log(`- Published activities: ${publishedActivities.length}`);
    console.log(`- Draft activities: ${draftActivities.length}`);
    
    if (allActivities.length > 0) {
      console.log('\n📋 Sample activities:');
      allActivities.slice(0, 5).forEach((activity, index) => {
        console.log(`${index + 1}. ${activity.name}`);
        console.log(`   Status: ${activity.status} | Public: ${activity.isPublic} | Venue: ${activity.venueName}`);
      });
    }
    
    return allActivities;
    
  } catch (error) {
    console.error('❌ Service simulation failed:', error.message);
    return [];
  }
}

async function runAllTests() {
  console.log('🚀 Starting Activities Collection Access Tests...');
  console.log('🎯 Project: CIFAN Film Festival');
  console.log('🔍 Testing without authentication (public access only)');
  console.log('=' .repeat(60));
  
  try {
    // Test public access
    const publishedActivities = await testPublicActivitiesAccess();
    
    // Test basic query
    const basicActivities = await testBasicActivitiesQuery();
    
    // Test service simulation
    const serviceActivities = await testActivitiesService();
    
    console.log('\n' + '=' .repeat(60));
    console.log('📋 Test Results Summary:');
    console.log(`✅ Published activities (public): ${publishedActivities.length}`);
    console.log(`✅ Basic query results: ${basicActivities.length}`);
    console.log(`✅ Service simulation results: ${serviceActivities.length}`);
    
    if (serviceActivities.length === 0) {
      console.log('\n⚠️  No activities found in the database.');
      console.log('💡 This could mean:');
      console.log('   1. No activities have been created yet');
      console.log('   2. All activities are private/draft and require authentication');
      console.log('   3. Firestore rules are blocking access');
    } else {
      console.log('\n✅ Activities collection is accessible!');
      console.log('🎯 The getAllActivities() method should work for:');
      console.log(`   - Public users: ${publishedActivities.length} published activities`);
      console.log(`   - Admin users: ${serviceActivities.length} total activities (when authenticated)`);
    }
    
    console.log('\n🔧 Next steps:');
    console.log('1. Test with admin authentication to see all activities');
    console.log('2. Create some test activities if none exist');
    console.log('3. Verify the admin interface can access all activities');
    
  } catch (error) {
    console.error('\n❌ Tests failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check if activities exist in the database');
    console.log('2. Verify Firestore rules allow public access to published activities');
    console.log('3. Test with authentication for full admin access');
  }
}

// Run the tests
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testPublicActivitiesAccess,
  testBasicActivitiesQuery,
  testActivitiesService,
  runAllTests
};
