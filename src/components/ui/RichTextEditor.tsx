import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import ReactQuill from 'react-quill';

// Import debug utilities in development
let updateClickResults: ((type: 'dropdown' | 'option', data: any) => void) | null = null;
let autoApplyEmergencyFix: (() => void) | null = null;
if (process.env.NODE_ENV === 'development') {
  import('../../utils/quillDropdownDebug').then(module => {
    updateClickResults = module.updateClickResults;
    autoApplyEmergencyFix = module.autoApplyEmergencyFix;
    // Auto-apply emergency fix immediately
    module.autoApplyEmergencyFix();
  });
}

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  error?: boolean;
}

interface DropdownState {
  isOpen: boolean;
  type: string | null;
  position: { top: number; left: number } | null;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Enter description...',
  className = '',
  error = false
}) => {
  const quillRef = useRef<ReactQuill>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dropdownState, setDropdownState] = useState<DropdownState>({
    isOpen: false,
    type: null,
    position: null
  });
  const [isEditorReady, setIsEditorReady] = useState(false);

  // Handle dropdown state changes
  const handleDropdownToggle = useCallback((type: string, isOpen: boolean, position?: { top: number; left: number }) => {
    setDropdownState({
      isOpen,
      type: isOpen ? type : null,
      position: position || null
    });
  }, []);

  // Close dropdown when clicking outside
  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
      if (dropdownState.isOpen) {
        setDropdownState({ isOpen: false, type: null, position: null });
        
        // Close any open Quill dropdowns
        const expandedPickers = document.querySelectorAll('.ql-picker.ql-expanded');
        expandedPickers.forEach((picker) => {
          picker.classList.remove('ql-expanded');
        });
      }
    }
  }, [dropdownState.isOpen]);

  // Custom toolbar configuration
  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'indent': '-1'}, { 'indent': '+1' }],
        ['blockquote', 'code-block'],
        ['link', 'image'],
        [{ 'align': [] }],
        [{ 'color': [] }, { 'background': [] }],
        ['clean']
      ]
    },
    clipboard: {
      matchVisual: false,
    }
  }), []);

  const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', 'indent',
    'link', 'image', 'video',
    'align', 'color', 'background',
    'code-block'
  ];

  // Enhanced dropdown state management and event handling
  useEffect(() => {
    if (!quillRef.current) return;

    const quill = quillRef.current.getEditor();
    const container = quill.container;
    setIsEditorReady(true);

    // Enhanced click event handler for dropdown buttons with immediate positioning
    const handlePickerClick = (event: Event) => {
      const target = event.target as HTMLElement;
      const picker = target.closest('.ql-picker') as HTMLElement;
      
      if (picker && container.contains(picker)) {
        const label = picker.querySelector('.ql-picker-label') as HTMLElement;
        const options = picker.querySelector('.ql-picker-options') as HTMLElement;
        
        if (label && options) {
          const isExpanding = !picker.classList.contains('ql-expanded');
          const pickerType = picker.classList.contains('ql-header') ? 'header' :
                           picker.classList.contains('ql-color') ? 'color' :
                           picker.classList.contains('ql-background') ? 'background' :
                           picker.classList.contains('ql-align') ? 'align' : 'unknown';
          
          if (isExpanding) {
            // IMMEDIATE POSITIONING - Apply styles before the dropdown becomes visible
            const labelRect = label.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const viewportWidth = window.innerWidth;
            
            // Calculate position immediately
            let top = labelRect.bottom + 4;
            let left = labelRect.left;
            
            // Pre-calculate dropdown dimensions (use estimated values for speed)
            const estimatedDropdownHeight = 200;
            const estimatedDropdownWidth = 140;
            
            // Adjust if would overflow viewport bottom
            if (top + estimatedDropdownHeight > viewportHeight - 20) {
              top = labelRect.top - estimatedDropdownHeight - 4;
              if (top < 20) {
                top = Math.max(20, labelRect.top - Math.min(estimatedDropdownHeight, 200));
              }
            }
            
            // Adjust if would overflow viewport right
            if (left + estimatedDropdownWidth > viewportWidth - 20) {
              left = Math.max(20, viewportWidth - estimatedDropdownWidth - 20);
            }
            
            // Ensure minimum left position
            left = Math.max(20, left);
            
            // Apply positioning styles IMMEDIATELY - before Quill's native handler
            // But DON'T override visibility - let Quill control that
            options.style.position = 'fixed';
            options.style.top = `${top}px`;
            options.style.left = `${left}px`;
            options.style.right = 'auto';
            options.style.bottom = 'auto';
            options.style.zIndex = '999999';
            options.style.transform = 'none';
            options.style.willChange = 'auto';
            // Remove these lines that force visibility
            // options.style.visibility = 'visible';
            // options.style.opacity = '1';
            options.style.pointerEvents = 'auto';
            
            // Also ensure the picker itself has proper z-index
            picker.style.zIndex = '999998';
            picker.style.isolation = 'isolate';
            
            handleDropdownToggle(pickerType, true, { top, left });
            
            // Update UI in development mode
            if (updateClickResults) {
              updateClickResults('dropdown', { pickerType, action: 'opened' });
            }
            
            console.log(`Pre-positioned ${pickerType} dropdown at:`, { top, left });
          } else {
            handleDropdownToggle(pickerType, false);
            
            // Update UI in development mode
            if (updateClickResults) {
              updateClickResults('dropdown', { pickerType, action: 'closed' });
            }
            
            console.log(`Closing ${pickerType} dropdown`);
          }
        }
      }
    };

    // Enhanced option selection handler
    const handleOptionClick = (event: Event) => {
      const target = event.target as HTMLElement;
      const option = target.closest('.ql-picker-item') as HTMLElement;
      const picker = target.closest('.ql-picker') as HTMLElement;
      
      if (option && picker && container.contains(picker)) {
        const pickerType = picker.classList.contains('ql-header') ? 'header' :
                         picker.classList.contains('ql-color') ? 'color' :
                         picker.classList.contains('ql-background') ? 'background' :
                         picker.classList.contains('ql-align') ? 'align' : 'unknown';
        
        const optionValue = option.getAttribute('data-value') || option.textContent || 'unknown';
        
        console.log(`Selected ${pickerType} option:`, optionValue);
        
        // Update UI in development mode
        if (updateClickResults) {
          updateClickResults('option', { pickerType, value: optionValue });
        }
        
        // Close dropdown after selection
        setTimeout(() => {
          handleDropdownToggle(pickerType, false);
        }, 100);
      }
    };

    // Function to fix dropdown positioning when they become visible
    const fixDropdownPositioning = () => {
      // Target all visible dropdowns in this editor
      const allDropdowns = document.querySelectorAll('.ql-picker-options');
      
      allDropdowns.forEach((dropdown: Element) => {
        const dropdownEl = dropdown as HTMLElement;
        const picker = dropdownEl.closest('.ql-picker') as HTMLElement;
        
        // Only process dropdowns that belong to this editor and are expanded
        if (picker && 
            container.contains(picker) && 
            picker.classList.contains('ql-expanded') &&
            dropdownEl.style.display !== 'none') {
          
          // Get the picker button (label) position
          const label = picker.querySelector('.ql-picker-label') as HTMLElement;
          if (!label) return;
          
          const labelRect = label.getBoundingClientRect();
          const viewportHeight = window.innerHeight;
          const viewportWidth = window.innerWidth;
          
          // Calculate position directly below the button
          let top = labelRect.bottom + 4;
          let left = labelRect.left;
          
          // Temporarily show dropdown to measure dimensions
          const originalStyles = {
            position: dropdownEl.style.position,
            visibility: dropdownEl.style.visibility,
            display: dropdownEl.style.display
          };
          
          dropdownEl.style.position = 'fixed';
          dropdownEl.style.visibility = 'hidden';
          dropdownEl.style.display = 'block';
          
          const dropdownHeight = dropdownEl.offsetHeight || 200;
          const dropdownWidth = dropdownEl.offsetWidth || 140;
          
          // Reset visibility
          dropdownEl.style.visibility = 'visible';
          
          // Adjust if would overflow viewport bottom
          if (top + dropdownHeight > viewportHeight - 20) {
            top = labelRect.top - dropdownHeight - 4;
            // If still doesn't fit, position above viewport center
            if (top < 20) {
              top = Math.max(20, labelRect.top - Math.min(dropdownHeight, 200));
            }
          }
          
          // Adjust if would overflow viewport right
          if (left + dropdownWidth > viewportWidth - 20) {
            left = Math.max(20, viewportWidth - dropdownWidth - 20);
          }
          
          // Ensure minimum left position
          left = Math.max(20, left);
          
          // Apply the calculated position with proper styling
          dropdownEl.style.position = 'fixed';
          dropdownEl.style.top = `${top}px`;
          dropdownEl.style.left = `${left}px`;
          dropdownEl.style.right = 'auto';
          dropdownEl.style.bottom = 'auto';
          dropdownEl.style.zIndex = '999999';
          dropdownEl.style.transform = 'none';
          dropdownEl.style.willChange = 'auto';
          // Don't force display - let Quill control visibility
          
          console.log(`Positioned dropdown at: top=${top}, left=${left}, button was at:`, labelRect);
        }
      });
    };

    // Use MutationObserver to detect when dropdowns become visible
    const observer = new MutationObserver((mutations) => {
      let shouldFix = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          const target = mutation.target as HTMLElement;
          if (target.classList.contains('ql-picker') && 
              target.classList.contains('ql-expanded') &&
              container.contains(target)) {
            shouldFix = true;
          }
        }
      });
      
      if (shouldFix) {
        // Small delay to ensure dropdown is fully rendered
        setTimeout(fixDropdownPositioning, 10);
      }
    });

    // Observe class changes on picker elements in this editor
    const pickers = container.querySelectorAll('.ql-picker');
    pickers.forEach((picker) => {
      observer.observe(picker, {
        attributes: true,
        attributeFilter: ['class']
      });
      
      // Add click event listeners to picker labels
      const label = picker.querySelector('.ql-picker-label') as HTMLElement;
      if (label) {
        label.addEventListener('click', handlePickerClick);
      }
    });

    // Add click event listeners to dropdown options
    const options = container.querySelectorAll('.ql-picker-item');
    options.forEach((option) => {
      option.addEventListener('click', handleOptionClick);
    });

    // Handle window resize (but NOT scroll)
    const handleResize = () => {
      // Only fix positioning if there are expanded dropdowns in this editor
      const expandedPickers = container.querySelectorAll('.ql-picker.ql-expanded');
      if (expandedPickers.length > 0) {
        setTimeout(fixDropdownPositioning, 50);
      }
    };

    window.addEventListener('resize', handleResize);

    // Initial setup - fix any existing expanded dropdowns
    setTimeout(fixDropdownPositioning, 200);

    // Cleanup
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', handleResize);
      
      // Remove event listeners
      pickers.forEach((picker) => {
        const label = picker.querySelector('.ql-picker-label') as HTMLElement;
        if (label) {
          label.removeEventListener('click', handlePickerClick);
        }
      });
      
      options.forEach((option) => {
        option.removeEventListener('click', handleOptionClick);
      });
    };
  }, [handleDropdownToggle]);

  // Handle click outside to close dropdowns
  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleClickOutside]);

  // Auto-resize functionality
  useEffect(() => {
    const adjustHeight = () => {
      if (quillRef.current) {
        const quill = quillRef.current.getEditor();
        const container = quill.container;
        const editor = container.querySelector('.ql-editor') as HTMLElement;
        
        if (editor) {
          // Reset height to auto to get the natural content height
          editor.style.height = 'auto';
          
          // Get the scroll height (natural content height)
          const scrollHeight = editor.scrollHeight;
          
          // Set minimum and maximum heights
          const minHeight = 160; // 10rem = 160px
          const maxHeight = Math.min(window.innerHeight * 0.7, 560); // 70vh or 35rem max
          
          // Calculate the desired height
          const desiredHeight = Math.max(minHeight, Math.min(scrollHeight + 20, maxHeight));
          
          // Apply the height
          editor.style.height = `${desiredHeight}px`;
          
          // If content exceeds max height, enable scrolling
          if (scrollHeight > maxHeight - 20) {
            editor.style.overflowY = 'auto';
          } else {
            editor.style.overflowY = 'hidden';
          }
        }
      }
    };

    // Adjust height on content change
    const timer = setTimeout(() => {
      adjustHeight();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [value]);

  // Handle content change with auto-resize
  const handleChange = (content: string) => {
    onChange(content);
    
    // Trigger resize after content change
    setTimeout(() => {
      if (quillRef.current) {
        const quill = quillRef.current.getEditor();
        const editor = quill.container.querySelector('.ql-editor') as HTMLElement;
        
        if (editor) {
          const scrollHeight = editor.scrollHeight;
          const minHeight = 160;
          const maxHeight = Math.min(window.innerHeight * 0.7, 560);
          const desiredHeight = Math.max(minHeight, Math.min(scrollHeight + 20, maxHeight));
          
          editor.style.height = `${desiredHeight}px`;
          
          if (scrollHeight > maxHeight - 20) {
            editor.style.overflowY = 'auto';
          } else {
            editor.style.overflowY = 'hidden';
          }
        }
      }
    }, 50);
  };

  return (
    <div 
      ref={containerRef}
      className={`rich-text-editor-container w-full max-w-full min-w-0 break-words whitespace-normal [overflow-wrap:anywhere] [word-break:break-word] ${className}`}
      style={{ 
        position: 'relative',
        zIndex: 1,
        overflow: 'visible',
        contain: 'none'
      }}
    >
      <div className="description-editor">
        <ReactQuill
          ref={quillRef}
          theme="snow"
          value={value}
          onChange={handleChange}
          modules={modules}
          formats={formats}
          placeholder={placeholder}
          className={`${error ? 'error' : ''}`}
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '0.5rem',
            border: error ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.2)',
          }}
        />
      </div>
    </div>
  );
};

export default RichTextEditor;
