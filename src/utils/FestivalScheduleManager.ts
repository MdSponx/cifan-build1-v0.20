/**
 * Festival Schedule Manager
 * Handles responsive layout, overflow fixes, scroll synchronization, and performance optimizations
 * for the festival schedule grid component.
 */

interface ScheduleManagerOptions {
  containerSelector: string;
  timelineSelector: string;
  headerSelector: string;
  eventCardSelector: string;
  currentTimeIndicatorSelector: string;
  enableAutoRefresh?: boolean;
  refreshInterval?: number;
  enablePerformanceOptimizations?: boolean;
}

interface ViewportBreakpoints {
  desktop: number;
  tablet: number;
  mobile: number;
  extraSmall: number;
}

interface ResponsiveConfig {
  timeColumnWidth: number;
  venueMinWidth: number;
  eventCardMinWidth: number;
  fontSize: string;
  padding: string;
}

export class FestivalScheduleManager {
  private container: HTMLElement | null = null;
  private timeline: HTMLElement | null = null;
  private header: HTMLElement | null = null;
  private options: ScheduleManagerOptions;
  private resizeObserver: ResizeObserver | null = null;
  private intersectionObserver: IntersectionObserver | null = null;
  private refreshTimer: NodeJS.Timeout | null = null;
  private isInitialized = false;

  // Viewport breakpoints
  private readonly breakpoints: ViewportBreakpoints = {
    desktop: 1200,
    tablet: 768,
    mobile: 480,
    extraSmall: 320
  };

  // Responsive configurations
  private readonly responsiveConfigs: Record<string, ResponsiveConfig> = {
    desktop: {
      timeColumnWidth: 120,
      venueMinWidth: 150,
      eventCardMinWidth: 150,
      fontSize: '0.875rem',
      padding: '0.75rem'
    },
    tablet: {
      timeColumnWidth: 100,
      venueMinWidth: 130,
      eventCardMinWidth: 130,
      fontSize: '0.8rem',
      padding: '0.625rem'
    },
    mobile: {
      timeColumnWidth: 70,
      venueMinWidth: 90,
      eventCardMinWidth: 90,
      fontSize: '0.7rem',
      padding: '0.5rem'
    },
    extraSmall: {
      timeColumnWidth: 80,
      venueMinWidth: 90,
      eventCardMinWidth: 85,
      fontSize: '0.65rem',
      padding: '0.375rem'
    }
  };

  constructor(options: ScheduleManagerOptions) {
    this.options = {
      enableAutoRefresh: true,
      refreshInterval: 60000, // 1 minute
      enablePerformanceOptimizations: true,
      ...options
    };
  }

  /**
   * Initialize the schedule manager
   */
  public initialize(): void {
    if (this.isInitialized) {
      console.warn('FestivalScheduleManager is already initialized');
      return;
    }

    try {
      this.setupDOMReferences();
      this.fixOverflowIssues();
      this.handleResponsiveLayout();
      this.setupScrollSync();
      this.updateCurrentTimeIndicator();

      if (this.options.enablePerformanceOptimizations) {
        this.setupPerformanceOptimizations();
      }

      if (this.options.enableAutoRefresh) {
        this.startAutoRefresh();
      }

      this.setupEventListeners();
      this.isInitialized = true;

      console.log('FestivalScheduleManager initialized successfully');
    } catch (error) {
      console.error('Failed to initialize FestivalScheduleManager:', error);
    }
  }

  /**
   * Setup DOM references
   */
  private setupDOMReferences(): void {
    this.container = document.querySelector(this.options.containerSelector);
    this.timeline = document.querySelector(this.options.timelineSelector);
    this.header = document.querySelector(this.options.headerSelector);

    if (!this.container) {
      throw new Error(`Container element not found: ${this.options.containerSelector}`);
    }
  }

  /**
   * Fix overflow issues and apply proper CSS properties
   */
  public fixOverflowIssues(): void {
    if (!this.container) return;

    // Apply container fixes
    this.container.style.overflowX = 'hidden';
    this.container.style.maxWidth = '100vw';
    this.container.style.boxSizing = 'border-box';

    // Fix glass container properties
    const glassContainers = this.container.querySelectorAll('.glass-container');
    glassContainers.forEach((container) => {
      const element = container as HTMLElement;
      element.style.overflow = 'visible';
      element.style.contain = 'none';
      element.style.maxWidth = '100%';
      element.style.boxSizing = 'border-box';
    });

    // Apply z-index hierarchy
    this.applyZIndexHierarchy();
  }

  /**
   * Apply proper z-index hierarchy
   */
  private applyZIndexHierarchy(): void {
    if (!this.container) return;

    // Timeline base
    const timelineElements = this.container.querySelectorAll('.schedule-timeline-base');
    timelineElements.forEach((el) => {
      (el as HTMLElement).style.zIndex = '10';
    });

    // Event cards
    const eventCards = this.container.querySelectorAll('.schedule-event-card');
    eventCards.forEach((el, index) => {
      const element = el as HTMLElement;
      if (element.classList.contains('schedule-event-card-active')) {
        element.style.zIndex = '25';
      } else if (element.classList.contains('schedule-event-card-featured')) {
        element.style.zIndex = '20';
      } else {
        element.style.zIndex = '15';
      }
    });

    // Current time indicator
    const timeIndicators = this.container.querySelectorAll('.current-time-indicator');
    timeIndicators.forEach((el) => {
      (el as HTMLElement).style.zIndex = '30';
    });

    // Venue headers
    const venueHeaders = this.container.querySelectorAll('.venue-header-sticky');
    venueHeaders.forEach((el) => {
      (el as HTMLElement).style.zIndex = '40';
    });
  }

  /**
   * Handle responsive layout adjustments
   */
  public handleResponsiveLayout(): void {
    const viewport = this.getCurrentViewport();
    const config = this.responsiveConfigs[viewport];

    if (!config || !this.container) return;

    // Update grid template columns
    const grids = this.container.querySelectorAll('.festival-timeline-grid, .venue-header-grid');
    grids.forEach((grid) => {
      const element = grid as HTMLElement;
      if (viewport === 'extraSmall') {
        element.style.gridTemplateColumns = `${config.timeColumnWidth}px repeat(6, ${config.venueMinWidth}px)`;
        element.style.minWidth = '610px';
      } else {
        element.style.gridTemplateColumns = `${config.timeColumnWidth}px repeat(auto-fit, minmax(${config.venueMinWidth}px, 1fr))`;
      }
    });

    // Update event card styles
    const eventCards = this.container.querySelectorAll('.schedule-event-card');
    eventCards.forEach((card) => {
      const element = card as HTMLElement;
      element.style.minWidth = `${config.eventCardMinWidth}px`;
      element.style.fontSize = config.fontSize;
      element.style.padding = config.padding;
    });

    // Enable hardware acceleration
    this.enableHardwareAcceleration();
  }

  /**
   * Get current viewport category
   */
  private getCurrentViewport(): string {
    const width = window.innerWidth;

    if (width >= this.breakpoints.desktop) return 'desktop';
    if (width >= this.breakpoints.tablet) return 'tablet';
    if (width >= this.breakpoints.mobile) return 'mobile';
    return 'extraSmall';
  }

  /**
   * Setup scroll synchronization between headers and timeline
   */
  public setupScrollSync(): void {
    if (!this.timeline || !this.header) return;

    let isScrolling = false;

    const syncScroll = (source: HTMLElement, target: HTMLElement) => {
      if (isScrolling) return;
      isScrolling = true;
      target.scrollLeft = source.scrollLeft;
      requestAnimationFrame(() => {
        isScrolling = false;
      });
    };

    // Sync timeline to header
    this.timeline.addEventListener('scroll', () => {
      if (this.header && this.timeline) {
        syncScroll(this.timeline, this.header);
      }
    }, { passive: true });

    // Sync header to timeline
    this.header.addEventListener('scroll', () => {
      if (this.timeline && this.header) {
        syncScroll(this.header, this.timeline);
      }
    }, { passive: true });
  }

  /**
   * Update current time indicator position
   */
  public updateCurrentTimeIndicator(): void {
    const indicators = document.querySelectorAll(this.options.currentTimeIndicatorSelector);
    if (indicators.length === 0) return;

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // Check if current time is within schedule hours (assuming 8 AM to 11 PM)
    const startHour = 8;
    const endHour = 23;

    if (currentHour < startHour || currentHour >= endHour) {
      // Hide indicators if outside schedule hours
      indicators.forEach((indicator) => {
        (indicator as HTMLElement).style.display = 'none';
      });
      return;
    }

    // Calculate position
    const hoursSinceStart = currentHour - startHour;
    const minuteOffset = (currentMinute / 60) * 120; // 120px per hour
    const topPosition = hoursSinceStart * 120 + minuteOffset;

    indicators.forEach((indicator) => {
      const element = indicator as HTMLElement;
      element.style.display = 'block';
      element.style.top = `${topPosition}px`;
    });
  }

  /**
   * Setup performance optimizations
   */
  private setupPerformanceOptimizations(): void {
    this.setupResizeObserver();
    this.setupIntersectionObserver();
    this.enableHardwareAcceleration();
  }

  /**
   * Setup ResizeObserver for real-time layout adjustments
   */
  private setupResizeObserver(): void {
    if (!window.ResizeObserver || !this.container) return;

    this.resizeObserver = new ResizeObserver((entries) => {
      // Debounce resize handling
      clearTimeout(this.refreshTimer as NodeJS.Timeout);
      this.refreshTimer = setTimeout(() => {
        this.handleResponsiveLayout();
        this.updateCurrentTimeIndicator();
      }, 150);
    });

    this.resizeObserver.observe(this.container);
  }

  /**
   * Setup IntersectionObserver for performance optimization
   */
  private setupIntersectionObserver(): void {
    if (!window.IntersectionObserver || !this.container) return;

    const options = {
      root: this.container,
      rootMargin: '50px',
      threshold: 0.1
    };

    this.intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const element = entry.target as HTMLElement;
        
        if (entry.isIntersecting) {
          element.classList.add('schedule-intersection-observer');
          element.style.contentVisibility = 'auto';
        } else {
          element.classList.remove('schedule-intersection-observer');
          element.style.contentVisibility = 'hidden';
        }
      });
    }, options);

    // Observe event cards
    const eventCards = this.container.querySelectorAll('.schedule-event-card');
    eventCards.forEach((card) => {
      this.intersectionObserver?.observe(card);
    });
  }

  /**
   * Enable hardware acceleration for smooth animations
   */
  private enableHardwareAcceleration(): void {
    if (!this.container) return;

    const elements = this.container.querySelectorAll(
      '.schedule-event-card, .current-time-indicator, .venue-header-sticky'
    );

    elements.forEach((element) => {
      const el = element as HTMLElement;
      el.style.transform = 'translateZ(0)';
      el.style.willChange = 'transform';
      el.classList.add('schedule-performance-optimized');
    });
  }

  /**
   * Start auto-refresh timer
   */
  private startAutoRefresh(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }

    this.refreshTimer = setInterval(() => {
      this.updateCurrentTimeIndicator();
    }, this.options.refreshInterval);
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Window resize handler
    window.addEventListener('resize', this.debounce(() => {
      this.handleResponsiveLayout();
    }, 250), { passive: true });

    // Orientation change handler
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        this.handleResponsiveLayout();
        this.updateCurrentTimeIndicator();
      }, 100);
    });

    // Visibility change handler for auto-refresh
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (this.refreshTimer) {
          clearInterval(this.refreshTimer);
        }
      } else if (this.options.enableAutoRefresh) {
        this.startAutoRefresh();
        this.updateCurrentTimeIndicator();
      }
    });
  }

  /**
   * Debounce utility function
   */
  private debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  /**
   * Cleanup and destroy the manager
   */
  public destroy(): void {
    if (!this.isInitialized) return;

    // Clear timers
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }

    // Disconnect observers
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
      this.intersectionObserver = null;
    }

    // Remove event listeners
    window.removeEventListener('resize', this.handleResponsiveLayout);
    window.removeEventListener('orientationchange', this.handleResponsiveLayout);

    // Reset references
    this.container = null;
    this.timeline = null;
    this.header = null;
    this.isInitialized = false;

    console.log('FestivalScheduleManager destroyed');
  }

  /**
   * Get current manager status
   */
  public getStatus(): {
    initialized: boolean;
    viewport: string;
    hasContainer: boolean;
    hasTimeline: boolean;
    hasHeader: boolean;
    autoRefreshEnabled: boolean;
    performanceOptimizationsEnabled: boolean;
  } {
    return {
      initialized: this.isInitialized,
      viewport: this.getCurrentViewport(),
      hasContainer: !!this.container,
      hasTimeline: !!this.timeline,
      hasHeader: !!this.header,
      autoRefreshEnabled: !!this.options.enableAutoRefresh,
      performanceOptimizationsEnabled: !!this.options.enablePerformanceOptimizations
    };
  }

  /**
   * Force refresh all layout calculations
   */
  public forceRefresh(): void {
    this.fixOverflowIssues();
    this.handleResponsiveLayout();
    this.updateCurrentTimeIndicator();
  }

  /**
   * Update configuration options
   */
  public updateOptions(newOptions: Partial<ScheduleManagerOptions>): void {
    this.options = { ...this.options, ...newOptions };
    
    if (this.isInitialized) {
      this.forceRefresh();
    }
  }
}

// Export default instance creator
export const createFestivalScheduleManager = (options: ScheduleManagerOptions): FestivalScheduleManager => {
  return new FestivalScheduleManager(options);
};

// Export types
export type { ScheduleManagerOptions, ViewportBreakpoints, ResponsiveConfig };
