// ============================================================================
// DEBUGGING HELPER - Add this to browser console for testing
// ============================================================================

// Run this in browser console to debug sorting:
function debugActivitySorting() {
  const activities = window.store?.getState?.()?.activities || [];
  
  console.log('🔍 Current activities in store:', activities.length);
  
  if (activities.length > 0) {
    const sorted = [...activities].sort((a, b) => {
      const dateComparison = a.eventDate.localeCompare(b.eventDate);
      if (dateComparison !== 0) return dateComparison;
      return a.startTime.localeCompare(b.startTime);
    });
    
    console.log('📊 Correct sort order:');
    sorted.forEach((activity, index) => {
      console.log(`${index + 1}. ${activity.eventDate} ${activity.startTime} - ${activity.name}`);
    });
  }
}

// Add to window for easy access
if (typeof window !== 'undefined') {
  window.debugActivitySorting = debugActivitySorting;
}

// Additional debugging functions
function debugActivitiesService() {
  console.log('🔍 Testing ActivitiesService sorting...');
  
  // Mock activities data for testing
  const mockActivities = [
    {
      id: '1',
      name: 'Morning Workshop',
      eventDate: '2024-03-15',
      startTime: '09:00',
      endTime: '12:00'
    },
    {
      id: '2', 
      name: 'Afternoon Panel',
      eventDate: '2024-03-15',
      startTime: '14:00',
      endTime: '16:00'
    },
    {
      id: '3',
      name: 'Evening Screening',
      eventDate: '2024-03-14',
      startTime: '19:00',
      endTime: '21:00'
    }
  ];
  
  console.log('📊 Original order:', mockActivities.map(a => `${a.eventDate} ${a.startTime} - ${a.name}`));
  
  // Test sorting
  const sorted = [...mockActivities].sort((a, b) => {
    // Primary sort: eventDate
    const dateComparison = a.eventDate.localeCompare(b.eventDate);
    if (dateComparison !== 0) return dateComparison;
    
    // Secondary sort: startTime for same dates
    const timeComparison = a.startTime.localeCompare(b.startTime);
    if (timeComparison !== 0) return timeComparison;
    
    // Tertiary sort: name for completely identical dates/times
    return a.name.localeCompare(b.name);
  });
  
  console.log('✅ Sorted order:', sorted.map(a => `${a.eventDate} ${a.startTime} - ${a.name}`));
}

// Test the PublicActivitiesPage filtering
function debugPublicActivitiesFiltering() {
  console.log('🔍 Testing PublicActivitiesPage filtering...');
  
  // Check if we're on the activities page
  const currentPath = window.location.hash;
  if (!currentPath.includes('activities')) {
    console.log('⚠️ Not on activities page. Navigate to #activities first.');
    return;
  }
  
  // Try to access React component state (this is a hack for debugging)
  const reactFiberKey = Object.keys(document.querySelector('[data-reactroot]') || {}).find(key => key.startsWith('__reactInternalInstance'));
  
  if (reactFiberKey) {
    console.log('✅ Found React fiber, attempting to access component state...');
    // This is for debugging only - not recommended for production
  } else {
    console.log('⚠️ Could not access React component state directly');
  }
  
  // Alternative: Check console logs for activity data
  console.log('💡 Check browser console for activity loading logs with 🔍 and ✅ emojis');
}

// Export functions for console use
if (typeof window !== 'undefined') {
  window.debugActivitySorting = debugActivitySorting;
  window.debugActivitiesService = debugActivitiesService;
  window.debugPublicActivitiesFiltering = debugPublicActivitiesFiltering;
  
  console.log('🎯 Activity debugging functions loaded:');
  console.log('- debugActivitySorting()');
  console.log('- debugActivitiesService()');
  console.log('- debugPublicActivitiesFiltering()');
}

// Auto-run basic test
debugActivitiesService();
