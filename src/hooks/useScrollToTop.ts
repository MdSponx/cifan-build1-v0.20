import { useEffect } from 'react';

/**
 * Custom hook that scrolls to the top of the page when the route changes
 * This is particularly useful for single-page applications where scroll position
 * is maintained between route changes
 */
export const useScrollToTop = () => {
  useEffect(() => {
    const handleHashChange = () => {
      // Scroll to top with smooth behavior
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'smooth'
      });
    };

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);

    // Also scroll to top on initial load if not at home
    const currentHash = window.location.hash;
    if (currentHash && currentHash !== '#home' && currentHash !== '#') {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'auto' // Use auto for initial load to avoid animation delay
      });
    }

    // Cleanup event listener
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);
};

/**
 * Alternative hook that provides a manual scroll to top function
 * Useful for programmatic scrolling or when you need more control
 */
export const useScrollToTopFunction = () => {
  const scrollToTop = (behavior: 'smooth' | 'auto' = 'smooth') => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior
    });
  };

  return scrollToTop;
};
