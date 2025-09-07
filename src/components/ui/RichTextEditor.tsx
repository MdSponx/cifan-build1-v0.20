import React, { useMemo, useRef, useEffect } from 'react';
import ReactQuill from 'react-quill';

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

  // Enhanced dropdown positioning with direct DOM manipulation
  useEffect(() => {
    if (quillRef.current) {
      const quill = quillRef.current.getEditor();
      const container = quill.container;

      // Function to fix dropdown positioning
      const fixDropdownPositioning = () => {
        // Find all picker dropdowns
        const dropdowns = container.querySelectorAll('.ql-picker-options');
        
        dropdowns.forEach((dropdown: Element) => {
          const dropdownEl = dropdown as HTMLElement;
          const picker = dropdownEl.closest('.ql-picker') as HTMLElement;
          
          if (picker && dropdownEl) {
            // Force fixed positioning with viewport-relative coordinates
            dropdownEl.style.position = 'fixed';
            dropdownEl.style.zIndex = '999999';
            dropdownEl.style.isolation = 'isolate';
            dropdownEl.style.transform = 'translateZ(0)';
            dropdownEl.style.willChange = 'transform';
            
            // Calculate optimal position
            const pickerRect = picker.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const viewportWidth = window.innerWidth;
            
            let top = pickerRect.bottom + 4;
            let left = pickerRect.left;
            
            // Ensure dropdown doesn't go off-screen
            const dropdownWidth = dropdownEl.offsetWidth || 200;
            const dropdownHeight = dropdownEl.offsetHeight || 150;
            
            // Adjust horizontal position
            if (left + dropdownWidth > viewportWidth) {
              left = viewportWidth - dropdownWidth - 10;
            }
            if (left < 10) {
              left = 10;
            }
            
            // Adjust vertical position
            if (top + dropdownHeight > viewportHeight && pickerRect.top > dropdownHeight + 20) {
              top = pickerRect.top - dropdownHeight - 4;
            }
            if (top < 10) {
              top = 10;
            }
            
            dropdownEl.style.top = `${top}px`;
            dropdownEl.style.left = `${left}px`;
          }
        });
      };

      // Set up mutation observer to watch for dropdown creation
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList' || mutation.type === 'attributes') {
            // Small delay to ensure dropdown is fully rendered
            setTimeout(fixDropdownPositioning, 10);
          }
        });
      });

      // Start observing
      observer.observe(container, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class']
      });

      // Set up click handlers for pickers
      const setupPickerHandlers = () => {
        const pickers = container.querySelectorAll('.ql-picker');
        
        pickers.forEach((picker: Element) => {
          const pickerEl = picker as HTMLElement;
          
          pickerEl.addEventListener('click', () => {
            // Fix positioning after a short delay
            setTimeout(fixDropdownPositioning, 20);
          });
        });
      };

      // Initial setup
      setTimeout(() => {
        setupPickerHandlers();
        fixDropdownPositioning();
      }, 100);

      // Cleanup
      return () => {
        observer.disconnect();
      };
    }
  }, []);

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
