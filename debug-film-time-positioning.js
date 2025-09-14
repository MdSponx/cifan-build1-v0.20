// Debug script to test film time positioning issue
// Run this in browser console on the festival schedule page

console.log('🔍 DEBUGGING FILM TIME POSITIONING ISSUE');

// Check if we're on the right page
if (!window.location.pathname.includes('schedule')) {
  console.error('❌ Please run this on the festival schedule page');
} else {
  console.log('✅ Running on schedule page');
  
  // Wait for React to load and schedule data to be available
  setTimeout(() => {
    console.log('🔍 Checking for schedule items in the DOM...');
    
    // Find all film cards
    const filmCards = document.querySelectorAll('.schedule-event-card');
    console.log(`📊 Found ${filmCards.length} event cards`);
    
    filmCards.forEach((card, index) => {
      const titleElement = card.querySelector('h3');
      const timeElement = card.querySelector('.text-orange-200');
      const title = titleElement ? titleElement.textContent : 'Unknown';
      const displayedTime = timeElement ? timeElement.textContent : 'No time';
      
      // Get the card's position
      const rect = card.getBoundingClientRect();
      const style = window.getComputedStyle(card);
      const topPosition = style.top;
      
      console.log(`🎬 Card ${index + 1}: "${title}"`, {
        displayedTime,
        topPosition,
        actualTop: rect.top,
        cardElement: card
      });
      
      // Check if this is a film card (has film emoji)
      const isFilm = card.textContent.includes('🎬');
      if (isFilm) {
        console.log(`🎬 FILM CARD ANALYSIS: "${title}"`, {
          displayedTime,
          topPosition,
          calculatedHour: displayedTime.split(':')[0],
          expectedPosition: `Should be at ${(parseInt(displayedTime.split(':')[0]) - 10) * 120}px if startTime is ${displayedTime}`,
          actualPosition: topPosition
        });
      }
    });
    
    // Also check React DevTools if available
    if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      console.log('🔧 React DevTools detected - you can inspect component state');
    }
    
  }, 2000);
}
