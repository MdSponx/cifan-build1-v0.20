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
    const timer = setTimeout(adjustHeight, 100);
    
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
    <div className={`description-editor w-full max-w-full min-w-0 break-words whitespace-normal [overflow-wrap:anywhere] [word-break:break-word] ${className}`}>
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
  );
};

export default RichTextEditor;
