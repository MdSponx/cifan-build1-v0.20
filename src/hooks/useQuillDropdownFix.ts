import { useEffect, useRef, useCallback } from 'react';
import { 
  initializeQuillDropdownFix, 
  destroyQuillDropdownFix, 
  forceFixAllDropdowns,
  runDropdownDiagnostics,
  type DropdownFixOptions,
  type DropdownDiagnostics
} from '../utils/quillDropdownFix';

export interface UseQuillDropdownFixOptions extends DropdownFixOptions {
  /**
   * Whether to automatically initialize the fix when the hook mounts
   * @default true
   */
  autoInitialize?: boolean;
  
  /**
   * Whether to force fix dropdowns when the component mounts
   * @default true
   */
  forceFixOnMount?: boolean;
  
  /**
   * Delay before applying fixes (in milliseconds)
   * @default 100
   */
  initDelay?: number;
}

export interface UseQuillDropdownFixReturn {
  /**
   * Manually initialize the dropdown fix
   */
  initialize: () => void;
  
  /**
   * Manually destroy the dropdown fix
   */
  destroy: () => void;
  
  /**
   * Force fix all dropdowns immediately
   */
  forceFixAll: () => void;
  
  /**
   * Run diagnostics on current dropdowns
   */
  runDiagnostics: () => DropdownDiagnostics;
  
  /**
   * Whether the fix has been initialized
   */
  isInitialized: boolean;
}

/**
 * React hook for managing Quill dropdown fixes
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { forceFixAll, runDiagnostics } = useQuillDropdownFix({
 *     enableDebugMode: true,
 *     autoApplyFix: true
 *   });
 *   
 *   const handleButtonClick = () => {
 *     forceFixAll();
 *     const diagnostics = runDiagnostics();
 *     console.log('Dropdown diagnostics:', diagnostics);
 *   };
 *   
 *   return (
 *     <div>
 *       <RichTextEditor />
 *       <button onClick={handleButtonClick}>Fix Dropdowns</button>
 *     </div>
 *   );
 * }
 * ```
 */
export const useQuillDropdownFix = (
  options: UseQuillDropdownFixOptions = {}
): UseQuillDropdownFixReturn => {
  const {
    autoInitialize = true,
    forceFixOnMount = true,
    initDelay = 100,
    ...fixOptions
  } = options;
  
  const isInitializedRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const initialize = () => {
    if (isInitializedRef.current) return;
    
    initializeQuillDropdownFix(fixOptions);
    isInitializedRef.current = true;
    
    if (forceFixOnMount) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        forceFixAllDropdowns();
      }, 50);
    }
  };

  const destroy = () => {
    if (!isInitializedRef.current) return;
    
    destroyQuillDropdownFix();
    isInitializedRef.current = false;
  };

  const forceFixAll = () => {
    forceFixAllDropdowns();
  };

  const runDiagnostics = (): DropdownDiagnostics => {
    return runDropdownDiagnostics();
  };

  useEffect(() => {
    if (autoInitialize) {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Initialize with delay
      timeoutRef.current = setTimeout(() => {
        initialize();
      }, initDelay);
    }

    // Cleanup on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      // Note: We don't destroy on unmount as the fix should persist globally
      // destroy();
    };
  }, [autoInitialize, initDelay]);

  return {
    initialize,
    destroy,
    forceFixAll,
    runDiagnostics,
    isInitialized: isInitializedRef.current
  };
};

/**
 * Hook specifically for RichTextEditor components
 * Provides additional functionality for editor-specific fixes
 */
export const useRichTextEditorDropdownFix = (
  editorRef?: React.RefObject<any>,
  options: UseQuillDropdownFixOptions = {}
) => {
  const dropdownFix = useQuillDropdownFix(options);

  const fixEditorDropdowns = useCallback(() => {
    if (editorRef?.current) {
      const editor = editorRef.current.getEditor?.();
      if (editor) {
        const container = editor.container;
        const expandedPickers = container.querySelectorAll('.ql-picker.ql-expanded');
        
        if (expandedPickers.length > 0) {
          console.log(`Fixing ${expandedPickers.length} expanded dropdowns in editor`);
          
          // Apply fixes to expanded dropdowns
          expandedPickers.forEach((picker: Element) => {
            const dropdown = picker.querySelector('.ql-picker-options') as HTMLElement;
            if (dropdown) {
              // Ensure dropdown is visible and properly positioned
              dropdown.style.position = 'fixed';
              dropdown.style.zIndex = '2147483647';
              dropdown.style.visibility = 'visible';
              dropdown.style.opacity = '1';
              dropdown.style.display = 'block';
              dropdown.style.pointerEvents = 'auto';
              
              // Fix positioning relative to the picker label
              const label = picker.querySelector('.ql-picker-label') as HTMLElement;
              if (label) {
                const labelRect = label.getBoundingClientRect();
                const viewportHeight = window.innerHeight;
                const viewportWidth = window.innerWidth;
                
                let top = labelRect.bottom + 4;
                let left = labelRect.left;
                
                // Adjust for viewport overflow
                const dropdownHeight = dropdown.offsetHeight || 200;
                const dropdownWidth = dropdown.offsetWidth || 160;
                
                if (top + dropdownHeight > viewportHeight - 20) {
                  top = labelRect.top - dropdownHeight - 4;
                  if (top < 20) {
                    top = Math.max(20, viewportHeight - dropdownHeight - 20);
                  }
                }
                
                if (left + dropdownWidth > viewportWidth - 20) {
                  left = Math.max(20, viewportWidth - dropdownWidth - 20);
                }
                
                dropdown.style.top = `${top}px`;
                dropdown.style.left = `${left}px`;
              }
            }
          });
          
          return { fixed: expandedPickers.length };
        }
      }
    }
    
    // Fallback to global fix if no editor or no expanded dropdowns
    dropdownFix.forceFixAll();
    return dropdownFix.runDiagnostics();
  }, [editorRef, dropdownFix]);

  return {
    ...dropdownFix,
    fixEditorDropdowns
  };
};

export default useQuillDropdownFix;
