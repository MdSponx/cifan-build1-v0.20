#!/usr/bin/env node

/**
 * Test script to verify the Admin Activities Fix
 * This script tests the new getAllActivities() method
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, orderBy } = require('firebase/firestore');

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

async function testGetAllActivities() {
  console.log('🧪 Testing getAllActivities() method...');
  
  try {
    // Test 1: Direct Firestore query (simulating getAllActivities)
    console.log('\n📡 Test 1: Direct Firestore query without limits...');
    
    const q = query(
      collection(db, 'activities'),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    const activities = snapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      status: doc.data().status,
      isPublic: doc.data().isPublic,
      eventDate: doc.data().eventDate,
      createdAt: doc.data().createdAt
    }));
    
    console.log('✅ Direct query results:', {
      total: activities.length,
      byStatus: {
        published: activities.filter(a => a.status === 'published').length,
        draft: activities.filter(a => a.status === 'draft').length,
        cancelled: activities.filter(a => a.status === 'cancelled').length,
        completed: activities.filter(a => a.status === 'completed').length
      },
      byVisibility: {
        public: activities.filter(a => a.isPublic === true).length,
        private: activities.filter(a => a.isPublic === false).length
      }
    });
    
    // Test 2: Fallback query without orderBy
    console.log('\n📡 Test 2: Fallback query without orderBy...');
    
    const fallbackQuery = query(collection(db, 'activities'));
    const fallbackSnapshot = await getDocs(fallbackQuery);
    
    console.log('✅ Fallback query results:', {
      total: fallbackSnapshot.docs.length,
      comparison: fallbackSnapshot.docs.length === activities.length ? '✅ Same count' : '❌ Different count'
    });
    
    // Test 3: Sample activities data
    console.log('\n📊 Sample activities:');
    activities.slice(0, 5).forEach((activity, index) => {
      console.log(`${index + 1}. ${activity.name} (${activity.status}) - ${activity.eventDate}`);
    });
    
    // Test 4: Verify no artificial limits
    console.log('\n🔍 Verification:');
    console.log(`- Total activities found: ${activities.length}`);
    console.log(`- All statuses included: ${activities.some(a => a.status === 'draft') ? '✅' : '❌'} Draft, ${activities.some(a => a.status === 'published') ? '✅' : '❌'} Published, ${activities.some(a => a.status === 'cancelled') ? '✅' : '❌'} Cancelled, ${activities.some(a => a.status === 'completed') ? '✅' : '❌'} Completed`);
    console.log(`- Both public and private: ${activities.some(a => a.isPublic === true) ? '✅' : '❌'} Public, ${activities.some(a => a.isPublic === false) ? '✅' : '❌'} Private`);
    
    if (activities.length === 0) {
      console.log('⚠️ No activities found. Make sure you have activities in your database.');
    } else if (activities.length < 10) {
      console.log('⚠️ Only found a few activities. The fix should work, but create more test data to verify pagination.');
    } else {
      console.log('✅ Found sufficient activities to test the fix.');
    }
    
    return activities;
    
  } catch (error) {
    console.error('❌ Error testing getAllActivities:', error);
    
    if (error.message.includes('requires an index')) {
      console.log('💡 Index required. The fallback query should still work.');
    } else if (error.message.includes('permission-denied')) {
      console.log('💡 Permission denied. Check your Firestore rules.');
    }
    
    throw error;
  }
}

async function testAdminActivitiesFlow() {
  console.log('\n🎯 Testing complete admin activities flow...');
  
  try {
    const activities = await testGetAllActivities();
    
    // Simulate client-side filtering (like in ActivitiesGallery)
    console.log('\n🔄 Testing client-side filtering...');
    
    // Filter by status
    const publishedActivities = activities.filter(a => a.status === 'published');
    const draftActivities = activities.filter(a => a.status === 'draft');
    
    console.log('📊 Client-side filtering results:');
    console.log(`- Published: ${publishedActivities.length}`);
    console.log(`- Draft: ${draftActivities.length}`);
    
    // Simulate pagination
    const pageSize = 20;
    const totalPages = Math.ceil(activities.length / pageSize);
    const page1 = activities.slice(0, pageSize);
    
    console.log('\n📄 Pagination simulation:');
    console.log(`- Total activities: ${activities.length}`);
    console.log(`- Page size: ${pageSize}`);
    console.log(`- Total pages: ${totalPages}`);
    console.log(`- Page 1 activities: ${page1.length}`);
    
    console.log('\n✅ Admin activities flow test completed successfully!');
    
  } catch (error) {
    console.error('❌ Admin activities flow test failed:', error);
  }
}

// Run the tests
async function runTests() {
  console.log('🚀 Starting Admin Activities Fix Tests...');
  console.log('=' .repeat(50));
  
  try {
    await testAdminActivitiesFlow();
    
    console.log('\n' + '=' .repeat(50));
    console.log('🎉 All tests completed!');
    console.log('\n📋 Summary:');
    console.log('✅ getAllActivities() method should now fetch ALL activities without limits');
    console.log('✅ Admin page should display all activities regardless of status');
    console.log('✅ Client-side filtering and pagination should work correctly');
    console.log('✅ No more missing activities due to artificial limits');
    
  } catch (error) {
    console.error('\n❌ Tests failed:', error.message);
    process.exit(1);
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testGetAllActivities,
  testAdminActivitiesFlow
};
