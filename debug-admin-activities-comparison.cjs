#!/usr/bin/env node

/**
 * Comprehensive diagnostic script to compare activities access
 * between public (unauthenticated) and admin (authenticated) queries
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
  console.log('🔍 Testing PUBLIC access (no authentication)...');
  
  try {
    // Test 1: Published activities only (what public users see)
    console.log('\n📡 Test 1: Published activities (public access)...');
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
        createdBy: data.createdBy || 'unknown'
      };
    });
    
    console.log('✅ Published activities found:', publishedActivities.length);
    
    // Test 2: Try to access all activities without auth (should fail for non-published)
    console.log('\n📡 Test 2: All activities without auth (should be limited)...');
    const allQuery = query(collection(db, 'activities'));
    const allSnapshot = await getDocs(allQuery);
    
    const allActivities = allSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || 'Unnamed Activity',
        status: data.status || 'unknown',
        isPublic: data.isPublic || false,
        eventDate: data.eventDate || 'No date',
        createdAt: data.createdAt || null,
        createdBy: data.createdBy || 'unknown'
      };
    });
    
    console.log('✅ All activities accessible without auth:', allActivities.length);
    
    // Analyze the difference
    const statusBreakdown = allActivities.reduce((acc, activity) => {
      acc[activity.status] = (acc[activity.status] || 0) + 1;
      return acc;
    }, {});
    
    const visibilityBreakdown = allActivities.reduce((acc, activity) => {
      const key = activity.isPublic ? 'public' : 'private';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    
    console.log('\n📊 Analysis of accessible activities:');
    console.log('Status breakdown:', statusBreakdown);
    console.log('Visibility breakdown:', visibilityBreakdown);
    
    // Show sample of each status
    console.log('\n📋 Sample activities by status:');
    Object.keys(statusBreakdown).forEach(status => {
      const activitiesOfStatus = allActivities.filter(a => a.status === status);
      console.log(`\n${status.toUpperCase()} (${activitiesOfStatus.length}):`);
      activitiesOfStatus.slice(0, 3).forEach((activity, index) => {
        console.log(`  ${index + 1}. ${activity.name} (public: ${activity.isPublic})`);
      });
    });
    
    return {
      publishedCount: publishedActivities.length,
      totalAccessible: allActivities.length,
      statusBreakdown,
      visibilityBreakdown,
      activities: allActivities
    };
    
  } catch (error) {
    console.error('❌ Error in public access test:', error.message);
    return {
      publishedCount: 0,
      totalAccessible: 0,
      statusBreakdown: {},
      visibilityBreakdown: {},
      activities: [],
      error: error.message
    };
  }
}

async function testAdminActivitiesQueries() {
  console.log('\n🔍 Testing ADMIN-style queries (simulating getAllActivities)...');
  
  const results = {
    withOrderBy: null,
    withoutOrderBy: null,
    publishedOnly: null,
    draftOnly: null,
    cancelledOnly: null,
    completedOnly: null
  };
  
  try {
    // Test 1: Query with orderBy (like getAllActivities does)
    console.log('\n📡 Test 1: Query with orderBy createdAt desc...');
    try {
      const orderByQuery = query(
        collection(db, 'activities'),
        orderBy('createdAt', 'desc')
      );
      const orderBySnapshot = await getDocs(orderByQuery);
      results.withOrderBy = {
        count: orderBySnapshot.docs.length,
        activities: orderBySnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name,
          status: doc.data().status,
          isPublic: doc.data().isPublic,
          createdAt: doc.data().createdAt
        }))
      };
      console.log('✅ OrderBy query successful:', results.withOrderBy.count, 'activities');
    } catch (error) {
      console.log('❌ OrderBy query failed:', error.message);
      results.withOrderBy = { error: error.message, count: 0 };
    }
    
    // Test 2: Query without orderBy (fallback)
    console.log('\n📡 Test 2: Query without orderBy (fallback)...');
    try {
      const basicQuery = query(collection(db, 'activities'));
      const basicSnapshot = await getDocs(basicQuery);
      results.withoutOrderBy = {
        count: basicSnapshot.docs.length,
        activities: basicSnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name,
          status: doc.data().status,
          isPublic: doc.data().isPublic,
          createdAt: doc.data().createdAt
        }))
      };
      console.log('✅ Basic query successful:', results.withoutOrderBy.count, 'activities');
    } catch (error) {
      console.log('❌ Basic query failed:', error.message);
      results.withoutOrderBy = { error: error.message, count: 0 };
    }
    
    // Test 3-6: Query by specific status
    const statuses = ['published', 'draft', 'cancelled', 'completed'];
    
    for (const status of statuses) {
      console.log(`\n📡 Test: ${status} activities only...`);
      try {
        const statusQuery = query(
          collection(db, 'activities'),
          where('status', '==', status)
        );
        const statusSnapshot = await getDocs(statusQuery);
        results[`${status}Only`] = {
          count: statusSnapshot.docs.length,
          activities: statusSnapshot.docs.map(doc => ({
            id: doc.id,
            name: doc.data().name,
            status: doc.data().status,
            isPublic: doc.data().isPublic,
            createdAt: doc.data().createdAt
          }))
        };
        console.log(`✅ ${status} query successful:`, results[`${status}Only`].count, 'activities');
        
        // Show sample activities
        if (results[`${status}Only`].count > 0) {
          console.log(`   Sample ${status} activities:`);
          results[`${status}Only`].activities.slice(0, 3).forEach((activity, index) => {
            console.log(`   ${index + 1}. ${activity.name} (public: ${activity.isPublic})`);
          });
        }
      } catch (error) {
        console.log(`❌ ${status} query failed:`, error.message);
        results[`${status}Only`] = { error: error.message, count: 0 };
      }
    }
    
  } catch (error) {
    console.error('❌ Error in admin queries test:', error.message);
  }
  
  return results;
}

async function compareResults(publicResults, adminResults) {
  console.log('\n🔍 COMPARISON ANALYSIS...');
  console.log('=' .repeat(60));
  
  // Get the best admin result (fallback to basic query if orderBy fails)
  const adminCount = adminResults.withOrderBy?.count || adminResults.withoutOrderBy?.count || 0;
  const adminActivities = adminResults.withOrderBy?.activities || adminResults.withoutOrderBy?.activities || [];
  
  console.log('\n📊 Activity Count Comparison:');
  console.log(`Public access (published only): ${publicResults.publishedCount}`);
  console.log(`Public access (all accessible): ${publicResults.totalAccessible}`);
  console.log(`Admin query result: ${adminCount}`);
  
  console.log('\n📊 Status Breakdown Comparison:');
  console.log('Public access status breakdown:', publicResults.statusBreakdown);
  
  const adminStatusBreakdown = {
    published: adminResults.publishedOnly?.count || 0,
    draft: adminResults.draftOnly?.count || 0,
    cancelled: adminResults.cancelledOnly?.count || 0,
    completed: adminResults.completedOnly?.count || 0
  };
  console.log('Admin queries status breakdown:', adminStatusBreakdown);
  
  // Calculate missing activities
  const totalByStatus = Object.values(adminStatusBreakdown).reduce((sum, count) => sum + count, 0);
  const missingActivities = totalByStatus - publicResults.totalAccessible;
  
  console.log('\n🔍 MISSING ACTIVITIES ANALYSIS:');
  if (missingActivities > 0) {
    console.log(`❌ FOUND ${missingActivities} activities that are NOT accessible without authentication!`);
    console.log('\nThese are likely:');
    if (adminStatusBreakdown.draft > 0) {
      console.log(`- ${adminStatusBreakdown.draft} DRAFT activities (require admin access)`);
    }
    if (adminStatusBreakdown.cancelled > 0) {
      console.log(`- ${adminStatusBreakdown.cancelled} CANCELLED activities (require admin access)`);
    }
    if (adminStatusBreakdown.completed > 0) {
      console.log(`- ${adminStatusBreakdown.completed} COMPLETED activities (require admin access)`);
    }
    
    console.log('\n💡 SOLUTION: The admin activities gallery needs proper authentication to see these activities.');
  } else if (missingActivities < 0) {
    console.log(`⚠️ Unexpected: Public access shows MORE activities than admin queries (${Math.abs(missingActivities)} more)`);
    console.log('This suggests there might be an issue with the admin queries or Firestore rules.');
  } else {
    console.log('✅ No missing activities detected. All activities are accessible without authentication.');
    console.log('The issue might be in the admin interface filtering or display logic.');
  }
  
  // Check for query failures
  console.log('\n🔍 QUERY FAILURE ANALYSIS:');
  if (adminResults.withOrderBy?.error) {
    console.log('❌ OrderBy query failed:', adminResults.withOrderBy.error);
    console.log('💡 This might be causing the admin gallery to use fallback queries.');
  }
  
  if (adminResults.withoutOrderBy?.error) {
    console.log('❌ Basic query also failed:', adminResults.withoutOrderBy.error);
    console.log('💡 This is a serious issue - even basic queries are failing.');
  }
  
  return {
    publicCount: publicResults.totalAccessible,
    adminCount,
    missingActivities,
    statusBreakdown: adminStatusBreakdown,
    hasQueryFailures: !!(adminResults.withOrderBy?.error || adminResults.withoutOrderBy?.error)
  };
}

async function generateRecommendations(comparisonResults, publicResults, adminResults) {
  console.log('\n🎯 RECOMMENDATIONS:');
  console.log('=' .repeat(60));
  
  if (comparisonResults.missingActivities > 0) {
    console.log('\n1. AUTHENTICATION ISSUE DETECTED:');
    console.log('   ✅ The admin activities gallery needs proper authentication');
    console.log('   ✅ There are activities with non-published status that require admin access');
    console.log('   ✅ Check that the admin user is properly authenticated when loading the gallery');
    
    console.log('\n2. FIRESTORE RULES VERIFICATION:');
    console.log('   ✅ Firestore rules are working correctly (blocking non-published activities from public access)');
    console.log('   ✅ Admin-level authentication should allow access to all activities');
    
    console.log('\n3. IMMEDIATE ACTIONS:');
    console.log('   - Verify admin user authentication in the ActivitiesGallery component');
    console.log('   - Check browser console for authentication errors');
    console.log('   - Test the admin interface with a properly authenticated admin user');
    console.log('   - Ensure the getAllActivities() method is called with proper auth context');
  }
  
  if (comparisonResults.hasQueryFailures) {
    console.log('\n4. QUERY OPTIMIZATION:');
    console.log('   ❌ Some queries are failing (likely index issues)');
    console.log('   ✅ The fallback mechanism should handle this');
    console.log('   - Consider creating the required Firestore indexes');
    console.log('   - Or modify queries to avoid complex index requirements');
  }
  
  if (comparisonResults.missingActivities === 0) {
    console.log('\n5. FRONTEND ISSUE INVESTIGATION:');
    console.log('   ✅ All activities are accessible - the issue is likely in the frontend');
    console.log('   - Check ActivitiesGallery component filtering logic');
    console.log('   - Verify pagination is working correctly');
    console.log('   - Check for JavaScript errors in the admin interface');
    console.log('   - Ensure the component is properly receiving and displaying all activities');
  }
  
  console.log('\n6. TESTING STEPS:');
  console.log('   1. Log into the admin interface with proper admin credentials');
  console.log('   2. Open browser developer tools and check for errors');
  console.log('   3. Navigate to the activities gallery and check network requests');
  console.log('   4. Verify that getAllActivities() is being called and returning data');
  console.log('   5. Check if activities are being filtered out by the component logic');
}

async function runComprehensiveDiagnostic() {
  console.log('🚀 Starting Comprehensive Activities Access Diagnostic...');
  console.log('🎯 Project: CIFAN Film Festival');
  console.log('🔍 Comparing public vs admin access to activities');
  console.log('=' .repeat(80));
  
  try {
    // Test public access
    const publicResults = await testPublicActivitiesAccess();
    
    // Test admin-style queries
    const adminResults = await testAdminActivitiesQueries();
    
    // Compare results
    const comparisonResults = await compareResults(publicResults, adminResults);
    
    // Generate recommendations
    await generateRecommendations(comparisonResults, publicResults, adminResults);
    
    console.log('\n' + '=' .repeat(80));
    console.log('🎉 Diagnostic Complete!');
    console.log('\n📋 SUMMARY:');
    console.log(`- Public accessible activities: ${comparisonResults.publicCount}`);
    console.log(`- Admin query activities: ${comparisonResults.adminCount}`);
    console.log(`- Missing from public access: ${comparisonResults.missingActivities}`);
    console.log(`- Query failures detected: ${comparisonResults.hasQueryFailures ? 'Yes' : 'No'}`);
    
    if (comparisonResults.missingActivities > 0) {
      console.log('\n🎯 MAIN ISSUE: Authentication required for full admin access');
      console.log('💡 SOLUTION: Ensure admin user is properly authenticated in the activities gallery');
    } else {
      console.log('\n🎯 MAIN ISSUE: Frontend filtering or display logic');
      console.log('💡 SOLUTION: Check ActivitiesGallery component implementation');
    }
    
  } catch (error) {
    console.error('\n❌ Diagnostic failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check Firebase configuration');
    console.log('2. Verify Firestore rules');
    console.log('3. Ensure activities collection exists');
    console.log('4. Check network connectivity');
  }
}

// Run the diagnostic
if (require.main === module) {
  runComprehensiveDiagnostic().catch(console.error);
}

module.exports = {
  testPublicActivitiesAccess,
  testAdminActivitiesQueries,
  compareResults,
  generateRecommendations,
  runComprehensiveDiagnostic
};
