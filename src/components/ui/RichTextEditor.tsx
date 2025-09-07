import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import ReactQuill from 'react-quill';
import { useRichTextEditorDropdownFix } from '../../hooks/useQuillDropdownFix';

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

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Enter description...',
  className = '',
  error = false
}) => {
  const quillRef = useRef<ReactQuill>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isEditorReady, setIsEditorReady] = useState(false);

  // Use the comprehensive dropdown fix hook with simplified options
  const { fixEditorDropdowns, forceFixAll } = useRichTextEditorDropdownFix(quillRef, {
    enableDebugMode: process.env.NODE_ENV === 'development',
    autoApplyFix: true,
    observeNewEditors: true,
    autoInitialize: true,
    forceFixOnMount: false, // Changed to false to prevent conflicts
    initDelay: 300
  });

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

  // Simplified dropdown management - let Quill handle state, we just fix positioning
  useEffect(() => {
    if (!quillRef.current) return;

    const quill = quillRef.current.getEditor();
    const container = quill.container;
    setIsEditorReady(true);

    // Simplified click handler that works with Quill's native behavior
    const handlePickerClick = (event: Event) => {
      const target = event.target as HTMLElement;
      const picker = target.closest('.ql-picker') as HTMLElement;
      
      if (picker && container.contains(picker)) {
        const pickerType = picker.classList.contains('ql-header') ? 'header' :
                         picker.classList.contains('ql-color') ? 'color' :
                         picker.classList.contains('ql-background') ? 'background' :
                         picker.classList.contains('ql-align') ? 'align' : 'unknown';
        
        // Let Quill handle the state change, then fix positioning
        setTimeout(() => {
          if (picker.classList.contains('ql-expanded')) {
            fixEditorDropdowns();
            
            // Update debug UI if available
            if (updateClickResults) {
              updateClickResults('dropdown', { pickerType, action: 'opened' });
            }
            
            console.log(`Fixed ${pickerType} dropdown positioning`);
          }
        }, 50); // Increased delay to let Quill fully process the click
      }
    };

    // Handle option selection
    const handleOptionClick = (event: Event) => {
      const target = event.target as HTMLElement;
      const option = target.closest('.ql-picker-item') as HTMLElement;
      const picker = target.closest('.ql-picker') as HTMLElement;
      
      if (option && picker && container.contains(picker)) {
        const pickerType = picker.classList.contains('ql-header') ? 'header' :
                         picker.classList.contains('ql-color') ? 'color' :
                         picker.classList.contains('ql-background') ? 'background' :
                         picker.classList.contains('ql-align') ? 'align' : 'unknown';
        
        const optionValue = option.getAttribute('data-value') || 
                           option.style.backgroundColor || 
                           option.textContent || 'unknown';
        
        console.log(`Selected ${pickerType} option:`, optionValue);
        
        // Update debug UI if available
        if (updateClickResults) {
          updateClickResults('option', { pickerType, value: optionValue });
        }
      }
    };

    // Lightweight mutation observer for dropdown state changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          const target = mutation.target as HTMLElement;
          if (target.classList.contains('ql-picker') && 
              target.classList.contains('ql-expanded') &&
              container.contains(target)) {
            // Apply fix when dropdown opens
            setTimeout(() => {
              fixEditorDropdowns();
            }, 25);
          }
        }
      });
    });

    // Set up event listeners and observers
    const pickers = container.querySelectorAll('.ql-picker');
    pickers.forEach((picker) => {
      observer.observe(picker, {
        attributes: true,
        attributeFilter: ['class']
      });
      
      const label = picker.querySelector('.ql-picker-label') as HTMLElement;
      if (label) {
        label.addEventListener('click', handlePickerClick);
      }
    });

    // Listen for option clicks on the container (event delegation)
    container.addEventListener('click', handleOptionClick);

    // Handle window resize
    const handleResize = () => {
      const expandedPickers = container.querySelectorAll('.ql-picker.ql-expanded');
      if (expandedPickers.length > 0) {
        setTimeout(() => {
          fixEditorDropdowns();
        }, 50);
      }
    };

    window.addEventListener('resize', handleResize);

    // Initial setup with delay
    setTimeout(() => {
      forceFixAll();
    }, 500);

    // Cleanup
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('click', handleOptionClick);
      
      pickers.forEach((picker) => {
        const label = picker.querySelector('.ql-picker-label') as HTMLElement;
        if (label) {
          label.removeEventListener('click', handlePickerClick);
        }
      });
    };
  }, [fixEditorDropdowns, forceFixAll]);

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
