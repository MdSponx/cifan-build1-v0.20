/**
 * Comprehensive Quill Dropdown Fix Utility
 * Addresses all known issues with Quill Rich Text Editor dropdowns
 */

export interface DropdownFixOptions {
  enableDebugMode?: boolean;
  autoApplyFix?: boolean;
  observeNewEditors?: boolean;
  fixInterval?: number;
}

export interface DropdownDiagnostics {
  dropdownsFound: number;
  visibleDropdowns: number;
  hiddenDropdowns: number;
  positioningIssues: number;
  zIndexIssues: number;
  containerIssues: number;
  contentIssues: number;
}

class QuillDropdownFixer {
  private options: Required<DropdownFixOptions>;
  private observer: MutationObserver | null = null;
  private fixInterval: NodeJS.Timeout | null = null;
  private isInitialized = false;

  constructor(options: DropdownFixOptions = {}) {
    this.options = {
      enableDebugMode: options.enableDebugMode ?? process.env.NODE_ENV === 'development',
      autoApplyFix: options.autoApplyFix ?? true,
      observeNewEditors: options.observeNewEditors ?? true,
      fixInterval: options.fixInterval ?? 1000
    };
  }

  /**
   * Initialize the dropdown fixer
   */
  public initialize(): void {
    if (this.isInitialized) {
      this.log('Already initialized');
      return;
    }

    this.log('Initializing Quill Dropdown Fixer...');
    
    // Apply immediate fixes
    this.applyGlobalCSS();
    this.fixExistingDropdowns();
    
    // Set up observers and intervals
    if (this.options.observeNewEditors) {
      this.setupMutationObserver();
    }
    
    if (this.options.autoApplyFix) {
      this.startFixInterval();
    }
    
    // Set up event listeners
    this.setupEventListeners();
    
    this.isInitialized = true;
    this.log('Initialization complete');
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    
    if (this.fixInterval) {
      clearInterval(this.fixInterval);
      this.fixInterval = null;
    }
    
    this.isInitialized = false;
    this.log('Dropdown fixer destroyed');
  }

  /**
   * Apply comprehensive CSS fixes
   */
  private applyGlobalCSS(): void {
    const existingStyle = document.getElementById('quill-dropdown-comprehensive-fix');
    if (existingStyle) {
      existingStyle.remove();
    }

    const style = document.createElement('style');
    style.id = 'quill-dropdown-comprehensive-fix';
    style.textContent = `
      /* COMPREHENSIVE QUILL DROPDOWN FIX */
      
      /* Ultra-high z-index for all dropdown containers */
      body .ql-picker-options {
        position: fixed !important;
        z-index: 2147483647 !important; /* Maximum z-index value */
        background: rgba(17, 13, 22, 0.98) !important;
        border: 1px solid rgba(255, 255, 255, 0.3) !important;
        border-radius: 0.5rem !important;
        backdrop-filter: blur(25px) !important;
        box-shadow: 
          0 25px 50px rgba(0, 0, 0, 0.8),
          0 0 0 1px rgba(255, 255, 255, 0.1) !important;
        max-height: 300px !important;
        overflow-y: auto !important;
        min-width: 160px !important;
        isolation: isolate !important;
        pointer-events: auto !important;
        transform: translateZ(0) !important;
        will-change: transform !important;
        contain: none !important;
        clip: auto !important;
        clip-path: none !important;
        margin: 0 !important;
        padding: 0.5rem 0 !important;
        /* Force visibility when Quill shows the dropdown */
        opacity: 1 !important;
        visibility: visible !important;
        display: block !important;
      }
      
      /* Ensure dropdown items are visible and styled */
      body .ql-picker-options .ql-picker-item {
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
        color: rgba(255, 255, 255, 0.95) !important;
        background: transparent !important;
        padding: 0.75rem 1rem !important;
        margin: 0 !important;
        border: none !important;
        cursor: pointer !important;
        transition: all 0.2s ease !important;
        font-family: 'Raleway', sans-serif !important;
        font-size: 14px !important;
        line-height: 1.4 !important;
        text-align: left !important;
        width: 100% !important;
        box-sizing: border-box !important;
        white-space: nowrap !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        min-height: 40px !important;
        display: flex !important;
        align-items: center !important;
      }
      
      /* Hover states for dropdown items */
      body .ql-picker-options .ql-picker-item:hover {
        background: rgba(252, 178, 131, 0.2) !important;
        color: #FCB283 !important;
      }
      
      /* Selected state for dropdown items */
      body .ql-picker-options .ql-picker-item.ql-selected {
        background: rgba(252, 178, 131, 0.25) !important;
        color: #FCB283 !important;
        font-weight: 500 !important;
      }
      
      /* Header dropdown specific styling */
      body .ql-picker-options .ql-picker-item[data-value="1"] {
        font-size: 20px !important;
        font-weight: 600 !important;
        color: #FCB283 !important;
      }
      
      body .ql-picker-options .ql-picker-item[data-value="2"] {
        font-size: 18px !important;
        font-weight: 600 !important;
        color: rgba(252, 178, 131, 0.9) !important;
      }
      
      body .ql-picker-options .ql-picker-item[data-value="3"] {
        font-size: 16px !important;
        font-weight: 600 !important;
        color: rgba(252, 178, 131, 0.8) !important;
      }
      
      body .ql-picker-options .ql-picker-item[data-value="false"] {
        font-size: 14px !important;
        font-weight: 400 !important;
        color: rgba(255, 255, 255, 0.9) !important;
      }
      
      /* Color picker specific styling */
      body .ql-color .ql-picker-options {
        min-width: 180px !important;
        max-width: 200px !important;
        padding: 8px !important;
      }
      
      body .ql-color .ql-picker-options .ql-picker-item {
        width: 20px !important;
        height: 20px !important;
        min-height: 20px !important;
        margin: 0 !important;
        border-radius: 2px !important;
        padding: 0 !important;
        display: inline-block !important;
        cursor: pointer !important;
        border: 1px solid rgba(255, 255, 255, 0.2) !important;
        transition: all 0.2s ease !important;
      }
      
      body .ql-color .ql-picker-options .ql-picker-item:hover {
        transform: scale(1.1) !important;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3) !important;
        z-index: 10 !important;
        position: relative !important;
      }
      
      body .ql-color .ql-picker-options .ql-picker-item[data-value="false"] {
        width: auto !important;
        height: auto !important;
        min-height: 32px !important;
        display: block !important;
        padding: 8px 12px !important;
        margin-bottom: 4px !important;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
        background: transparent !important;
        color: rgba(255, 255, 255, 0.9) !important;
        font-size: 13px !important;
        text-align: left !important;
      }
      
      /* Background color picker styling */
      body .ql-background .ql-picker-options {
        min-width: 180px !important;
        max-width: 200px !important;
        padding: 8px !important;
      }
      
      body .ql-background .ql-picker-options .ql-picker-item {
        width: 20px !important;
        height: 20px !important;
        min-height: 20px !important;
        margin: 0 !important;
        border-radius: 2px !important;
        padding: 0 !important;
        display: inline-block !important;
        cursor: pointer !important;
        border: 1px solid rgba(255, 255, 255, 0.2) !important;
        transition: all 0.2s ease !important;
      }
      
      body .ql-background .ql-picker-options .ql-picker-item:hover {
        transform: scale(1.1) !important;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3) !important;
        z-index: 10 !important;
        position: relative !important;
      }
      
      body .ql-background .ql-picker-options .ql-picker-item[data-value="false"] {
        width: auto !important;
        height: auto !important;
        min-height: 32px !important;
        display: block !important;
        padding: 8px 12px !important;
        margin-bottom: 4px !important;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
        background: transparent !important;
        color: rgba(255, 255, 255, 0.9) !important;
        font-size: 13px !important;
        text-align: left !important;
      }
      
      /* Alignment picker styling */
      body .ql-align .ql-picker-options .ql-picker-item {
        padding: 0.5rem !important;
        min-height: 32px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
      }
      
      /* Picker container z-index management */
      body .ql-picker {
        position: relative !important;
        z-index: 2147483646 !important;
        isolation: isolate !important;
      }
      
      body .ql-picker.ql-expanded {
        z-index: 2147483647 !important;
        isolation: isolate !important;
      }
      
      /* Picker label styling */
      body .ql-picker-label {
        cursor: pointer !important;
        user-select: none !important;
        position: relative !important;
        z-index: 2147483646 !important;
      }
      
      /* Scrollbar styling for dropdowns */
      body .ql-picker-options::-webkit-scrollbar {
        width: 6px !important;
      }
      
      body .ql-picker-options::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.1) !important;
        border-radius: 3px !important;
      }
      
      body .ql-picker-options::-webkit-scrollbar-thumb {
        background: rgba(252, 178, 131, 0.5) !important;
        border-radius: 3px !important;
      }
      
      body .ql-picker-options::-webkit-scrollbar-thumb:hover {
        background: rgba(252, 178, 131, 0.7) !important;
      }
      
      /* Container overflow fixes */
      .rich-text-editor,
      .description-editor,
      .glass-container:has(.rich-text-editor),
      .glass-container:has(.description-editor),
      form:has(.rich-text-editor),
      form:has(.description-editor),
      div:has(.rich-text-editor),
      div:has(.description-editor) {
        overflow: visible !important;
        contain: none !important;
        isolation: auto !important;
      }
      
      /* Toolbar z-index */
      body .ql-toolbar {
        position: relative !important;
        z-index: 100 !important;
        isolation: isolate !important;
      }
      
      /* Editor container fixes */
      body .ql-container {
        isolation: isolate !important;
        overflow: visible !important;
      }
      
      /* Force dropdown visibility when expanded but allow proper state management */
      body .ql-picker.ql-expanded .ql-picker-options {
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
        pointer-events: auto !important;
      }
      
      /* Ensure dropdown closes when picker is not expanded */
      body .ql-picker:not(.ql-expanded) .ql-picker-options {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        pointer-events: none !important;
      }
      
      /* Mobile responsive adjustments */
      @media (max-width: 768px) {
        body .ql-picker-options {
          min-width: 140px !important;
          max-height: 250px !important;
          font-size: 13px !important;
        }
        
        body .ql-picker-options .ql-picker-item {
          padding: 0.625rem 0.875rem !important;
          font-size: 13px !important;
          min-height: 36px !important;
        }
      }
    `;

    document.head.appendChild(style);
    this.log('Global CSS fixes applied');
  }

  /**
   * Fix existing dropdowns on the page
   */
  private fixExistingDropdowns(): void {
    const dropdowns = document.querySelectorAll('.ql-picker-options');
    let fixedCount = 0;

    dropdowns.forEach((dropdown) => {
      if (this.fixDropdown(dropdown as HTMLElement)) {
        fixedCount++;
      }
    });

    this.log(`Fixed ${fixedCount} existing dropdowns`);
  }

  /**
   * Fix a specific dropdown element
   */
  private fixDropdown(dropdown: HTMLElement): boolean {
    try {
      const picker = dropdown.closest('.ql-picker') as HTMLElement;
      if (!picker) return false;

      // Ensure dropdown has content
      this.ensureDropdownContent(dropdown, picker);
      
      // Apply positioning fixes
      this.fixDropdownPositioning(dropdown, picker);
      
      // Apply styling fixes
      this.fixDropdownStyling(dropdown);
      
      return true;
    } catch (error) {
      this.log('Error fixing dropdown:', error);
      return false;
    }
  }

  /**
   * Ensure dropdown has proper content
   */
  private ensureDropdownContent(dropdown: HTMLElement, picker: HTMLElement): void {
    const items = dropdown.querySelectorAll('.ql-picker-item');
    
    if (items.length === 0) {
      // Generate content based on picker type
      this.generateDropdownContent(dropdown, picker);
    } else {
      // Ensure existing items are properly styled and functional
      items.forEach((item) => {
        const itemEl = item as HTMLElement;
        itemEl.style.display = 'block';
        itemEl.style.visibility = 'visible';
        itemEl.style.opacity = '1';
        itemEl.style.pointerEvents = 'auto';
        
        // For color items, ensure they have proper background
        if (picker.classList.contains('ql-color') || picker.classList.contains('ql-background')) {
          const dataValue = itemEl.getAttribute('data-value');
          if (dataValue && dataValue !== 'false') {
            itemEl.style.backgroundColor = dataValue;
            itemEl.style.width = '20px';
            itemEl.style.height = '20px';
            itemEl.style.margin = '2px';
            itemEl.style.borderRadius = '2px';
            itemEl.style.cursor = 'pointer';
            itemEl.style.display = 'inline-block';
          }
        }
      });
    }
  }

  /**
   * Generate dropdown content for empty dropdowns
   */
  private generateDropdownContent(dropdown: HTMLElement, picker: HTMLElement): void {
    const pickerType = this.getPickerType(picker);
    
    switch (pickerType) {
      case 'header':
        this.generateHeaderContent(dropdown);
        break;
      case 'color':
        this.generateColorContent(dropdown);
        break;
      case 'background':
        this.generateBackgroundContent(dropdown);
        break;
      case 'align':
        this.generateAlignContent(dropdown);
        break;
      default:
        this.log(`Unknown picker type: ${pickerType}`);
    }
  }

  /**
   * Generate header dropdown content
   */
  private generateHeaderContent(dropdown: HTMLElement): void {
    const headers = [
      { value: 'false', text: 'Normal', style: 'font-size: 14px; font-weight: 400;' },
      { value: '1', text: 'Heading 1', style: 'font-size: 20px; font-weight: 600; color: #FCB283;' },
      { value: '2', text: 'Heading 2', style: 'font-size: 18px; font-weight: 600; color: rgba(252, 178, 131, 0.9);' },
      { value: '3', text: 'Heading 3', style: 'font-size: 16px; font-weight: 600; color: rgba(252, 178, 131, 0.8);' }
    ];

    dropdown.innerHTML = '';
    headers.forEach((header) => {
      const item = document.createElement('span');
      item.className = 'ql-picker-item';
      item.setAttribute('data-value', header.value);
      item.textContent = header.text;
      item.style.cssText = header.style;
      dropdown.appendChild(item);
    });
  }

  /**
   * Generate color picker content with aggressive color visibility enforcement
   */
  private generateColorContent(dropdown: HTMLElement): void {
    // Use Quill's default color palette
    const colors = [
      '#000000', '#e60000', '#ff9900', '#ffff00', '#008a00', '#0066cc', '#9933ff',
      '#ffffff', '#facccc', '#ffebcc', '#ffffcc', '#cce8cc', '#cce0f5', '#ebd6ff',
      '#bbbbbb', '#f06666', '#ffc266', '#ffff66', '#66b966', '#66a3e0', '#c285ff',
      '#888888', '#a10000', '#b26b00', '#b2b200', '#006100', '#0047b2', '#6b24b2',
      '#444444', '#5c0000', '#663d00', '#666600', '#003700', '#002966', '#3d1466'
    ];

    dropdown.innerHTML = '';
    
    // Add "Remove Color" option first
    const removeItem = document.createElement('span');
    removeItem.className = 'ql-picker-item';
    removeItem.setAttribute('data-value', 'false');
    removeItem.textContent = 'Remove Color';
    removeItem.style.cssText = `
      display: block !important;
      padding: 8px 12px !important;
      color: rgba(255, 255, 255, 0.9) !important;
      background: transparent !important;
      cursor: pointer !important;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
      margin-bottom: 4px !important;
      font-size: 13px !important;
      width: 100% !important;
      box-sizing: border-box !important;
    `;
    dropdown.appendChild(removeItem);
    
    // Create color grid container
    const colorGrid = document.createElement('div');
    colorGrid.style.cssText = `
      display: flex !important;
      flex-wrap: wrap !important;
      gap: 3px !important;
      padding: 8px !important;
      max-width: 180px !important;
      justify-content: flex-start !important;
    `;
    
    colors.forEach((color, index) => {
      const item = document.createElement('span');
      item.className = 'ql-picker-item';
      item.setAttribute('data-value', color);
      
      // Create a more aggressive approach to ensure color visibility
      this.forceColorVisibility(item, color);
      
      colorGrid.appendChild(item);
    });
    
    dropdown.appendChild(colorGrid);
    
    // Set up protection against style overrides
    this.protectColorStyles(colorGrid);
  }

  /**
   * Aggressively force color visibility using multiple techniques
   */
  private forceColorVisibility(item: HTMLElement, color: string): void {
    // Clear any existing content first
    item.innerHTML = '';
    
    // Set basic dimensions and positioning
    item.style.cssText = `
      width: 20px !important;
      height: 20px !important;
      display: inline-block !important;
      margin: 2px !important;
      cursor: pointer !important;
      border-radius: 2px !important;
      box-sizing: border-box !important;
      flex-shrink: 0 !important;
      position: relative !important;
      overflow: visible !important;
      border: 1px solid ${color === '#ffffff' ? '#ccc' : 'rgba(255, 255, 255, 0.3)'} !important;
      background: ${color} !important;
      background-color: ${color} !important;
    `;
    
    // Method 1: Direct DOM manipulation with ::before pseudo-element simulation
    const colorBlock = document.createElement('div');
    colorBlock.style.cssText = `
      position: absolute !important;
      top: -1px !important;
      left: -1px !important;
      right: -1px !important;
      bottom: -1px !important;
      background: ${color} !important;
      background-color: ${color} !important;
      border-radius: 2px !important;
      z-index: 1 !important;
      pointer-events: none !important;
    `;
    item.appendChild(colorBlock);
    
    // Method 2: SVG-based color display (most reliable)
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '20');
    svg.setAttribute('height', '20');
    svg.setAttribute('viewBox', '0 0 20 20');
    svg.style.cssText = `
      position: absolute !important;
      top: 0 !important;
      left: 0 !important;
      width: 20px !important;
      height: 20px !important;
      border-radius: 2px !important;
      z-index: 2 !important;
      pointer-events: none !important;
    `;
    
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('width', '20');
    rect.setAttribute('height', '20');
    rect.setAttribute('fill', color);
    rect.setAttribute('rx', '2');
    svg.appendChild(rect);
    item.appendChild(svg);
    
    // Method 3: Canvas fallback
    const canvas = document.createElement('canvas');
    canvas.width = 20;
    canvas.height = 20;
    canvas.style.cssText = `
      position: absolute !important;
      top: 0 !important;
      left: 0 !important;
      width: 20px !important;
      height: 20px !important;
      border-radius: 2px !important;
      z-index: 0 !important;
      pointer-events: none !important;
    `;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 20, 20);
    }
    item.appendChild(canvas);
    
    // Method 4: CSS custom properties with multiple fallbacks
    item.style.setProperty('--picker-color', color);
    item.style.setProperty('background', `var(--picker-color, ${color})`, 'important');
    item.style.setProperty('background-color', `var(--picker-color, ${color})`, 'important');
    
    // Method 5: Force inline styles that can't be overridden
    const styleAttr = `
      background: ${color} !important;
      background-color: ${color} !important;
      background-image: linear-gradient(${color}, ${color}) !important;
    `;
    item.setAttribute('style', item.getAttribute('style') + '; ' + styleAttr);
    
    // Add interaction handlers
    item.addEventListener('mouseenter', () => {
      item.style.transform = 'scale(1.1)';
      item.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3)';
      item.style.zIndex = '10';
      // Ensure color persists on hover
      colorBlock.style.background = color;
      colorBlock.style.backgroundColor = color;
      rect.setAttribute('fill', color);
    });
    
    item.addEventListener('mouseleave', () => {
      item.style.transform = 'scale(1)';
      item.style.boxShadow = 'none';
      item.style.zIndex = '1';
    });
    
    // Store original color for protection
    item.setAttribute('data-original-color', color);
    item.setAttribute('data-value', color);
    
    // Set up protection against style changes
    this.protectColorItem(item, color, colorBlock, rect);
  }
  /**
   * Protect individual color item from style overrides
   */
  private protectColorItem(item: HTMLElement, color: string, colorBlock: HTMLElement, rect: SVGRectElement): void {
    // Create a mutation observer for this specific item
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
          // Re-apply color if styles were changed
          setTimeout(() => {
            colorBlock.style.background = color;
            colorBlock.style.backgroundColor = color;
            rect.setAttribute('fill', color);
            item.style.setProperty('background', color, 'important');
            item.style.setProperty('background-color', color, 'important');
          }, 10);
        }
      });
    });
    
    observer.observe(item, {
      attributes: true,
      attributeFilter: ['style', 'class']
    });
    
    // Periodic re-application
    const intervalId = setInterval(() => {
      if (document.contains(item)) {
        colorBlock.style.background = color;
        colorBlock.style.backgroundColor = color;
        rect.setAttribute('fill', color);
      } else {
        clearInterval(intervalId);
        observer.disconnect();
      }
    }, 500);
  }

  /**
   * Re-apply color using all methods
   */
  private reapplyColor(item: HTMLElement, color: string): void {
    item.style.background = color;
    item.style.backgroundColor = color;
    item.style.setProperty('background', color, 'important');
    item.style.setProperty('background-color', color, 'important');
    
    // Update child elements
    const colorDiv = item.querySelector('div');
    if (colorDiv) {
      colorDiv.style.background = color;
      colorDiv.style.backgroundColor = color;
    }
    
    const canvas = item.querySelector('canvas');
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, 22, 22);
      }
    }
  }

  /**
   * Protect color styles from being overridden
   */
  private protectColorStyles(colorGrid: HTMLElement): void {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
          const target = mutation.target as HTMLElement;
          if (target.classList.contains('ql-picker-item') && target.hasAttribute('data-original-color')) {
            const originalColor = target.getAttribute('data-original-color');
            if (originalColor) {
              // Re-apply color if it was removed
              setTimeout(() => {
                this.reapplyColor(target, originalColor);
              }, 10);
            }
          }
        }
      });
    });

    // Observe all color items
    const colorItems = colorGrid.querySelectorAll('.ql-picker-item[data-original-color]');
    colorItems.forEach((item) => {
      observer.observe(item, {
        attributes: true,
        attributeFilter: ['style', 'class']
      });
    });

    // Also set up periodic re-application
    const intervalId = setInterval(() => {
      const items = colorGrid.querySelectorAll('.ql-picker-item[data-original-color]');
      items.forEach((item) => {
        const originalColor = item.getAttribute('data-original-color');
        if (originalColor) {
          this.reapplyColor(item as HTMLElement, originalColor);
        }
      });
    }, 1000);

    // Clean up interval when dropdown is removed
    const cleanupObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.removedNodes.forEach((node) => {
          if (node === colorGrid || (node as Element)?.contains?.(colorGrid)) {
            clearInterval(intervalId);
            observer.disconnect();
            cleanupObserver.disconnect();
          }
        });
      });
    });

    cleanupObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  /**
   * Generate background color content
   */
  private generateBackgroundContent(dropdown: HTMLElement): void {
    // Same as color content but for background
    this.generateColorContent(dropdown);
  }

  /**
   * Generate alignment dropdown content
   */
  private generateAlignContent(dropdown: HTMLElement): void {
    const alignments = [
      { value: '', text: 'Left', icon: '⬅️' },
      { value: 'center', text: 'Center', icon: '↔️' },
      { value: 'right', text: 'Right', icon: '➡️' },
      { value: 'justify', text: 'Justify', icon: '↕️' }
    ];

    dropdown.innerHTML = '';
    alignments.forEach((align) => {
      const item = document.createElement('span');
      item.className = 'ql-picker-item';
      item.setAttribute('data-value', align.value);
      item.textContent = `${align.icon} ${align.text}`;
      item.style.display = 'flex';
      item.style.alignItems = 'center';
      item.style.padding = '0.5rem';
      item.style.cursor = 'pointer';
      dropdown.appendChild(item);
    });
  }

  /**
   * Fix dropdown positioning
   */
  private fixDropdownPositioning(dropdown: HTMLElement, picker: HTMLElement): void {
    const label = picker.querySelector('.ql-picker-label') as HTMLElement;
    if (!label) return;

    const labelRect = label.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    // Calculate optimal position
    let top = labelRect.bottom + 4;
    let left = labelRect.left;

    // Get dropdown dimensions
    const dropdownHeight = dropdown.offsetHeight || 200;
    const dropdownWidth = dropdown.offsetWidth || 160;

    // Adjust for viewport overflow
    if (top + dropdownHeight > viewportHeight - 20) {
      top = labelRect.top - dropdownHeight - 4;
      if (top < 20) {
        top = Math.max(20, viewportHeight - dropdownHeight - 20);
      }
    }

    if (left + dropdownWidth > viewportWidth - 20) {
      left = Math.max(20, viewportWidth - dropdownWidth - 20);
    }

    // Apply positioning
    dropdown.style.position = 'fixed';
    dropdown.style.top = `${top}px`;
    dropdown.style.left = `${left}px`;
    dropdown.style.right = 'auto';
    dropdown.style.bottom = 'auto';
  }

  /**
   * Fix dropdown styling
   */
  private fixDropdownStyling(dropdown: HTMLElement): void {
    dropdown.style.zIndex = '2147483647';
    dropdown.style.visibility = 'visible';
    dropdown.style.opacity = '1';
    dropdown.style.display = 'block';
    dropdown.style.pointerEvents = 'auto';
  }

  /**
   * Get picker type from class names
   */
  private getPickerType(picker: HTMLElement): string {
    if (picker.classList.contains('ql-header')) return 'header';
    if (picker.classList.contains('ql-color')) return 'color';
    if (picker.classList.contains('ql-background')) return 'background';
    if (picker.classList.contains('ql-align')) return 'align';
    return 'unknown';
  }

  /**
   * Set up mutation observer for new editors
   */
  private setupMutationObserver(): void {
    this.observer = new MutationObserver((mutations) => {
      let shouldFix = false;

      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              if (element.querySelector('.ql-picker') || element.classList.contains('ql-picker')) {
                shouldFix = true;
              }
            }
          });
        } else if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          const target = mutation.target as HTMLElement;
          if (target.classList.contains('ql-picker') && target.classList.contains('ql-expanded')) {
            shouldFix = true;
          }
        }
      });

      if (shouldFix) {
        setTimeout(() => this.fixExistingDropdowns(), 50);
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class']
    });

    this.log('Mutation observer set up');
  }

  /**
   * Start fix interval
   */
  private startFixInterval(): void {
    this.fixInterval = setInterval(() => {
      this.fixExistingDropdowns();
    }, this.options.fixInterval);

    this.log(`Fix interval started (${this.options.fixInterval}ms)`);
  }

  /**
   * Set up event listeners
   */
  private setupEventListeners(): void {
    // Handle window resize
    window.addEventListener('resize', () => {
      setTimeout(() => this.fixExistingDropdowns(), 100);
    });

    // Handle scroll (debounced)
    let scrollTimeout: NodeJS.Timeout;
    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => this.fixExistingDropdowns(), 100);
    });

    this.log('Event listeners set up');
  }

  /**
   * Run comprehensive diagnostics
   */
  public runDiagnostics(): DropdownDiagnostics {
    const dropdowns = document.querySelectorAll('.ql-picker-options');
    const diagnostics: DropdownDiagnostics = {
      dropdownsFound: dropdowns.length,
      visibleDropdowns: 0,
      hiddenDropdowns: 0,
      positioningIssues: 0,
      zIndexIssues: 0,
      containerIssues: 0,
      contentIssues: 0
    };

    dropdowns.forEach((dropdown) => {
      const dropdownEl = dropdown as HTMLElement;
      const computed = window.getComputedStyle(dropdownEl);
      
      // Check visibility
      if (computed.display !== 'none' && computed.visibility !== 'hidden' && computed.opacity !== '0') {
        diagnostics.visibleDropdowns++;
      } else {
        diagnostics.hiddenDropdowns++;
      }

      // Check z-index
      const zIndex = parseInt(computed.zIndex);
      if (isNaN(zIndex) || zIndex < 999999) {
        diagnostics.zIndexIssues++;
      }

      // Check positioning
      if (computed.position !== 'fixed') {
        diagnostics.positioningIssues++;
      }

      // Check content
      const items = dropdownEl.querySelectorAll('.ql-picker-item');
      if (items.length === 0) {
        diagnostics.contentIssues++;
      }

      // Check container issues
      let parent = dropdownEl.parentElement;
      while (parent && parent !== document.body) {
        const parentComputed = window.getComputedStyle(parent);
        if (parentComputed.overflow === 'hidden' || parentComputed.contain !== 'none') {
          diagnostics.containerIssues++;
          break;
        }
        parent = parent.parentElement;
      }
    });

    this.log('Diagnostics completed:', diagnostics);
    return diagnostics;
  }

  /**
   * Force fix all dropdowns immediately
   */
  public forceFixAll(): void {
    this.log('Force fixing all dropdowns...');
    this.applyGlobalCSS();
    this.fixExistingDropdowns();
    
    // Also fix any expanded dropdowns
    const expandedPickers = document.querySelectorAll('.ql-picker.ql-expanded');
    expandedPickers.forEach((picker) => {
      const dropdown = picker.querySelector('.ql-picker-options') as HTMLElement;
      if (dropdown) {
        this.fixDropdown(dropdown);
      }
    });
    
    this.log('Force fix completed');
  }

  /**
   * Log messages (only in debug mode)
   */
  private log(message: string, ...args: any[]): void {
    if (this.options.enableDebugMode) {
      console.log(`[QuillDropdownFixer] ${message}`, ...args);
    }
  }
}

// Create singleton instance
const dropdownFixer = new QuillDropdownFixer();

// Export functions for use
export const initializeQuillDropdownFix = (options?: DropdownFixOptions): void => {
  dropdownFixer.initialize();
};

export const destroyQuillDropdownFix = (): void => {
  dropdownFixer.destroy();
};

export const forceFixAllDropdowns = (): void => {
  dropdownFixer.forceFixAll();
};

export const runDropdownDiagnostics = (): DropdownDiagnostics => {
  return dropdownFixer.runDiagnostics();
};

// Auto-initialize in development
if (process.env.NODE_ENV === 'development') {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => initializeQuillDropdownFix(), 1000);
    });
  } else {
    setTimeout(() => initializeQuillDropdownFix(), 1000);
  }
}

// Expose to window for debugging
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).quillDropdownFixer = {
    initialize: initializeQuillDropdownFix,
    destroy: destroyQuillDropdownFix,
    forceFixAll: forceFixAllDropdowns,
    runDiagnostics: runDropdownDiagnostics
  };
}
