// Debug utilities for Quill Rich Text Editor dropdown positioning issues
// Use these functions in development to diagnose and fix dropdown problems

export const debugQuillDropdowns = () => {
  console.log('=== QUILL DROPDOWN DEBUG ===');
  
  const dropdowns = document.querySelectorAll('.ql-picker-options');
  console.log(`Found ${dropdowns.length} dropdown(s)`);
  
  dropdowns.forEach((dropdown, index) => {
    const dropdownEl = dropdown as HTMLElement;
    const computed = window.getComputedStyle(dropdownEl);
    const picker = dropdownEl.closest('.ql-picker') as HTMLElement;
    
    console.log(`Dropdown ${index + 1}:`, {
      display: computed.display,
      position: computed.position,
      zIndex: computed.zIndex,
      overflow: computed.overflow,
      contain: computed.contain,
      isolation: computed.isolation,
      visibility: computed.visibility,
      opacity: computed.opacity,
      pointerEvents: computed.pointerEvents,
      transform: computed.transform,
      boundingRect: dropdownEl.getBoundingClientRect(),
      pickerRect: picker ? picker.getBoundingClientRect() : null,
      parentElement: dropdownEl.parentElement?.tagName,
      classList: Array.from(dropdownEl.classList),
      inlineStyles: dropdownEl.style.cssText
    });
  });
  
  // Check for problematic parent containers
  const editors = document.querySelectorAll('.rich-text-editor, .description-editor');
  console.log(`\nFound ${editors.length} editor(s):`);
  
  editors.forEach((editor, index) => {
    const editorEl = editor as HTMLElement;
    const computed = window.getComputedStyle(editorEl);
    
    console.log(`Editor ${index + 1}:`, {
      overflow: computed.overflow,
      contain: computed.contain,
      isolation: computed.isolation,
      position: computed.position,
      zIndex: computed.zIndex,
      boundingRect: editorEl.getBoundingClientRect()
    });
    
    // Check parent containers
    let parent = editorEl.parentElement;
    let level = 0;
    
    while (parent && parent !== document.body && level < 10) {
      const parentComputed = window.getComputedStyle(parent);
      
      if (parentComputed.overflow !== 'visible' || 
          parentComputed.contain !== 'none' || 
          parentComputed.isolation !== 'auto') {
        console.log(`  Parent ${level + 1} (${parent.tagName}):`, {
          overflow: parentComputed.overflow,
          contain: parentComputed.contain,
          isolation: parentComputed.isolation,
          position: parentComputed.position,
          zIndex: parentComputed.zIndex,
          classList: Array.from(parent.classList)
        });
      }
      
      parent = parent.parentElement;
      level++;
    }
  });
};

export const fixContainerOverflow = () => {
  console.log('=== FIXING CONTAINER OVERFLOW ===');
  
  const editors = document.querySelectorAll('.rich-text-editor, .description-editor');
  
  editors.forEach((editor, index) => {
    const editorEl = editor as HTMLElement;
    
    console.log(`Fixing editor ${index + 1}...`);
    
    // Fix editor container
    editorEl.style.overflow = 'visible';
    editorEl.style.contain = 'none';
    editorEl.style.position = 'relative';
    editorEl.style.zIndex = '10';
    editorEl.style.isolation = 'isolate';
    
    // Fix parent containers
    let parent = editorEl.parentElement;
    let level = 0;
    
    while (parent && parent !== document.body && level < 15) {
      const originalOverflow = parent.style.overflow;
      const originalContain = parent.style.contain;
      
      parent.style.overflow = 'visible';
      parent.style.contain = 'none';
      
      if (originalOverflow !== 'visible' || originalContain !== 'none') {
        console.log(`  Fixed parent ${level + 1} (${parent.tagName}):`, {
          from: { overflow: originalOverflow, contain: originalContain },
          to: { overflow: 'visible', contain: 'none' }
        });
      }
      
      parent = parent.parentElement;
      level++;
    }
  });
  
  console.log('Container overflow fixes applied!');
};

export const testDropdownPositioning = () => {
  console.log('=== TESTING DROPDOWN POSITIONING ===');
  
  const pickers = document.querySelectorAll('.ql-picker');
  
  if (pickers.length === 0) {
    console.log('No pickers found. Make sure a Quill editor is loaded.');
    return;
  }
  
  pickers.forEach((picker, index) => {
    const pickerEl = picker as HTMLElement;
    const label = pickerEl.querySelector('.ql-picker-label') as HTMLElement;
    const options = pickerEl.querySelector('.ql-picker-options') as HTMLElement;
    
    if (label && options) {
      console.log(`Testing picker ${index + 1}...`);
      
      // Simulate click to open dropdown
      label.click();
      
      setTimeout(() => {
        const rect = options.getBoundingClientRect();
        const computed = window.getComputedStyle(options);
        
        console.log(`Picker ${index + 1} dropdown:`, {
          isVisible: computed.display !== 'none',
          position: computed.position,
          zIndex: computed.zIndex,
          rect: rect,
          isInViewport: {
            top: rect.top >= 0,
            left: rect.left >= 0,
            bottom: rect.bottom <= window.innerHeight,
            right: rect.right <= window.innerWidth
          }
        });
        
        // Close dropdown
        label.click();
      }, 100);
    }
  });
};

export const forceDropdownFix = () => {
  console.log('=== FORCING DROPDOWN FIX ===');
  
  // Apply global CSS fixes via JavaScript
  const style = document.createElement('style');
  style.id = 'quill-dropdown-emergency-fix';
  style.textContent = `
    /* Immediate positioning for all Quill dropdowns - but let Quill control visibility */
    body .ql-picker-options {
      position: fixed !important;
      z-index: 999999 !important;
      background: rgba(17, 13, 22, 0.98) !important;
      border: 1px solid rgba(255, 255, 255, 0.3) !important;
      border-radius: 0.5rem !important;
      backdrop-filter: blur(25px) !important;
      box-shadow: 0 15px 50px rgba(0, 0, 0, 0.8) !important;
      max-height: 250px !important;
      overflow-y: auto !important;
      min-width: 140px !important;
      isolation: isolate !important;
      pointer-events: auto !important;
      /* DON'T force visibility - let Quill control it */
      /* visibility: visible !important; */
      /* opacity: 1 !important; */
      clip: auto !important;
      clip-path: none !important;
      transform: translateZ(0) !important;
      will-change: transform !important;
      /* Prevent initial positioning issues */
      top: auto !important;
      left: auto !important;
      right: auto !important;
      bottom: auto !important;
    }
    
    /* Ensure picker containers have proper stacking */
    body .ql-picker {
      position: relative !important;
      z-index: 999998 !important;
      isolation: isolate !important;
    }
    
    body .ql-picker.ql-expanded {
      z-index: 999999 !important;
      isolation: isolate !important;
    }
    
    /* Fix parent container issues that cause clipping */
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
    
    /* Let Quill control visibility, but ensure proper positioning when visible */
    body .ql-picker.ql-expanded .ql-picker-options {
      /* Don't force display/visibility - let Quill handle it */
      pointer-events: auto !important;
    }
    
    /* Only ensure positioning and z-index, not visibility */
    body .ql-picker-options[style*="display: block"] {
      /* Only apply when Quill has set display: block */
      position: fixed !important;
      z-index: 999999 !important;
    }
  `;
  
  // Remove existing emergency fix if present
  const existing = document.getElementById('quill-dropdown-emergency-fix');
  if (existing) {
    existing.remove();
  }
  
  document.head.appendChild(style);
  console.log('Emergency dropdown fix applied!');
};

// Auto-apply emergency fix on page load in development
export const autoApplyEmergencyFix = () => {
  if (process.env.NODE_ENV === 'development') {
    // Apply fix immediately
    forceDropdownFix();
    
    // Also apply after a short delay to catch any late-loading editors
    setTimeout(forceDropdownFix, 1000);
    
    console.log('Auto-applied emergency dropdown fix for development');
  }
};

export const analyzeDropdownIssues = () => {
  console.log('=== ANALYZING DROPDOWN ISSUES ===');
  
  const issues: string[] = [];
  
  // Check for dropdowns
  const dropdowns = document.querySelectorAll('.ql-picker-options');
  if (dropdowns.length === 0) {
    issues.push('No Quill dropdowns found - editor may not be loaded');
  }
  
  dropdowns.forEach((dropdown, index) => {
    const dropdownEl = dropdown as HTMLElement;
    const computed = window.getComputedStyle(dropdownEl);
    const picker = dropdownEl.closest('.ql-picker') as HTMLElement;
    
    // Check z-index
    const zIndex = parseInt(computed.zIndex);
    if (isNaN(zIndex) || zIndex < 999999) {
      issues.push(`Dropdown ${index + 1}: z-index too low (${computed.zIndex})`);
    }
    
    // Check position
    if (computed.position !== 'fixed') {
      issues.push(`Dropdown ${index + 1}: position should be fixed (${computed.position})`);
    }
    
    // Check visibility
    if (computed.visibility === 'hidden' || computed.opacity === '0') {
      issues.push(`Dropdown ${index + 1}: visibility issues (visibility: ${computed.visibility}, opacity: ${computed.opacity})`);
    }
    
    // Check parent containers
    let parent = dropdownEl.parentElement;
    let level = 0;
    
    while (parent && parent !== document.body && level < 10) {
      const parentComputed = window.getComputedStyle(parent);
      
      if (parentComputed.overflow === 'hidden') {
        issues.push(`Dropdown ${index + 1}: Parent ${level + 1} (${parent.tagName}) has overflow: hidden`);
      }
      
      if (parentComputed.contain !== 'none' && parentComputed.contain !== 'auto') {
        issues.push(`Dropdown ${index + 1}: Parent ${level + 1} (${parent.tagName}) has contain: ${parentComputed.contain}`);
      }
      
      parent = parent.parentElement;
      level++;
    }
  });
  
  if (issues.length === 0) {
    console.log('✅ No dropdown issues detected!');
  } else {
    console.log('❌ Issues found:');
    issues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue}`);
    });
  }
  
  return issues;
};

// Live UI update functions
export const updateClickResults = (type: 'dropdown' | 'option', data: any) => {
  const clickCountEl = document.getElementById('click-count');
  const lastDropdownEl = document.getElementById('last-dropdown-opened');
  const lastOptionEl = document.getElementById('last-option-selected');
  const currentStateEl = document.getElementById('current-dropdown-state');
  
  if (clickCountEl) {
    const currentCount = parseInt(clickCountEl.textContent || '0');
    clickCountEl.textContent = (currentCount + 1).toString();
  }
  
  if (type === 'dropdown') {
    if (lastDropdownEl) {
      lastDropdownEl.textContent = `${data.pickerType} (${data.action})`;
    }
    if (currentStateEl) {
      currentStateEl.textContent = data.action === 'opened' ? `${data.pickerType} Open` : 'Closed';
    }
  } else if (type === 'option') {
    if (lastOptionEl) {
      lastOptionEl.textContent = `${data.pickerType}: ${data.value}`;
    }
    if (currentStateEl) {
      currentStateEl.textContent = 'Closed (Selection Made)';
    }
  }
};

// Enhanced test function with UI updates
export const testDropdownPositioningWithUI = () => {
  console.log('=== TESTING DROPDOWN POSITIONING WITH UI UPDATES ===');
  
  const pickers = document.querySelectorAll('.ql-picker');
  
  if (pickers.length === 0) {
    console.log('No pickers found. Make sure a Quill editor is loaded.');
    updateClickResults('dropdown', { pickerType: 'none', action: 'error' });
    return;
  }
  
  pickers.forEach((picker, index) => {
    const pickerEl = picker as HTMLElement;
    const label = pickerEl.querySelector('.ql-picker-label') as HTMLElement;
    const options = pickerEl.querySelector('.ql-picker-options') as HTMLElement;
    
    if (label && options) {
      const pickerType = pickerEl.classList.contains('ql-header') ? 'header' :
                        pickerEl.classList.contains('ql-color') ? 'color' :
                        pickerEl.classList.contains('ql-background') ? 'background' :
                        pickerEl.classList.contains('ql-align') ? 'align' : 'unknown';
      
      console.log(`Testing picker ${index + 1} (${pickerType})...`);
      
      // Update UI
      updateClickResults('dropdown', { pickerType, action: 'testing' });
      
      // Simulate click to open dropdown
      label.click();
      
      setTimeout(() => {
        const rect = options.getBoundingClientRect();
        const computed = window.getComputedStyle(options);
        
        console.log(`Picker ${index + 1} dropdown:`, {
          isVisible: computed.display !== 'none',
          position: computed.position,
          zIndex: computed.zIndex,
          rect: rect,
          isInViewport: {
            top: rect.top >= 0,
            left: rect.left >= 0,
            bottom: rect.bottom <= window.innerHeight,
            right: rect.right <= window.innerWidth
          }
        });
        
        // Update UI with results
        updateClickResults('dropdown', { 
          pickerType, 
          action: computed.display !== 'none' ? 'opened' : 'failed' 
        });
        
        // Close dropdown
        setTimeout(() => {
          label.click();
          updateClickResults('dropdown', { pickerType, action: 'closed' });
        }, 1000);
      }, 100);
    }
  });
};

// Development mode utilities
if (process.env.NODE_ENV === 'development') {
  (window as any).quillDebug = {
    debugQuillDropdowns,
    fixContainerOverflow,
    testDropdownPositioning,
    testDropdownPositioningWithUI,
    forceDropdownFix,
    analyzeDropdownIssues,
    updateClickResults
  };
  
  console.log('🔧 Quill Debug utilities loaded! Use window.quillDebug to access:');
  console.log('- debugQuillDropdowns(): Analyze current dropdown state');
  console.log('- fixContainerOverflow(): Fix parent container overflow issues');
  console.log('- testDropdownPositioning(): Test dropdown positioning');
  console.log('- testDropdownPositioningWithUI(): Test with UI updates');
  console.log('- forceDropdownFix(): Apply emergency CSS fixes');
  console.log('- analyzeDropdownIssues(): Analyze and report issues');
  console.log('- updateClickResults(): Update live UI results');
}
