import React, { useState, useEffect } from 'react';
import RichTextEditor from '../ui/RichTextEditor';
import { debugQuillDropdowns, fixContainerOverflow, testDropdownPositioning, forceDropdownFix, analyzeDropdownIssues } from '../../utils/quillDropdownDebug';

const QuillDropdownTestPage: React.FC = () => {
  const [content1, setContent1] = useState('<p>Test content for editor 1</p>');
  const [content2, setContent2] = useState('<p>Test content for editor 2</p>');
  const [content3, setContent3] = useState('<p>Test content for editor 3</p>');
  const [debugOutput, setDebugOutput] = useState<string[]>([]);

  const addDebugMessage = (message: string) => {
    setDebugOutput(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const runDebugFunction = (fn: () => void, name: string) => {
    try {
      addDebugMessage(`Running ${name}...`);
      fn();
      addDebugMessage(`${name} completed successfully`);
    } catch (error) {
      addDebugMessage(`${name} failed: ${error}`);
    }
  };

  useEffect(() => {
    addDebugMessage('QuillDropdownTestPage loaded');
    
    // Auto-run initial diagnostics after a delay
    setTimeout(() => {
      runDebugFunction(analyzeDropdownIssues, 'Initial Analysis');
    }, 2000);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#110D16] via-[#1A1625] to-[#0F0B14] p-4">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="glass-container rounded-xl p-6">
          <h1 className="text-3xl font-bold text-white mb-2">
            Quill Dropdown Test Page
          </h1>
          <p className="text-white/80">
            Test and debug Quill rich text editor dropdown positioning issues
          </p>
        </div>

        {/* Debug Controls */}
        <div className="glass-container rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Debug Controls</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
            <button
              onClick={() => runDebugFunction(debugQuillDropdowns, 'Debug Dropdowns')}
              className="px-4 py-2 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
            >
              Debug Dropdowns
            </button>
            <button
              onClick={() => runDebugFunction(fixContainerOverflow, 'Fix Container Overflow')}
              className="px-4 py-2 bg-green-500/20 border border-green-500/30 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
            >
              Fix Containers
            </button>
            <button
              onClick={() => runDebugFunction(testDropdownPositioning, 'Test Positioning')}
              className="px-4 py-2 bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 rounded-lg hover:bg-yellow-500/30 transition-colors"
            >
              Test Positioning
            </button>
            <button
              onClick={() => runDebugFunction(forceDropdownFix, 'Force Fix')}
              className="px-4 py-2 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
            >
              Emergency Fix
            </button>
            <button
              onClick={() => runDebugFunction(analyzeDropdownIssues, 'Analyze Issues')}
              className="px-4 py-2 bg-purple-500/20 border border-purple-500/30 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors"
            >
              Analyze Issues
            </button>
          </div>

          {/* Debug Output */}
          <div className="bg-black/30 rounded-lg p-4 max-h-40 overflow-y-auto">
            <h3 className="text-white font-medium mb-2">Debug Output:</h3>
            {debugOutput.length === 0 ? (
              <p className="text-white/60 text-sm">No debug output yet...</p>
            ) : (
              <div className="space-y-1">
                {debugOutput.map((message, index) => (
                  <p key={index} className="text-green-400 text-sm font-mono">
                    {message}
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* Click Results Display */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mt-4">
            <h3 className="text-blue-400 font-medium mb-2">Live Click Results:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-white/80 mb-1">Last Dropdown Opened:</p>
                <p className="text-blue-300 font-mono" id="last-dropdown-opened">None</p>
              </div>
              <div>
                <p className="text-white/80 mb-1">Last Option Selected:</p>
                <p className="text-green-300 font-mono" id="last-option-selected">None</p>
              </div>
              <div>
                <p className="text-white/80 mb-1">Current Dropdown State:</p>
                <p className="text-yellow-300 font-mono" id="current-dropdown-state">Closed</p>
              </div>
              <div>
                <p className="text-white/80 mb-1">Click Count:</p>
                <p className="text-purple-300 font-mono" id="click-count">0</p>
              </div>
            </div>
          </div>
        </div>

        {/* Test Scenario 1: Standard Glass Container */}
        <div className="glass-container rounded-xl p-6" style={{ overflow: 'visible', contain: 'none' }}>
          <h2 className="text-xl font-semibold text-white mb-4">
            Test 1: Standard Glass Container
          </h2>
          <p className="text-white/80 mb-4">
            This editor is in a standard glass container. Try clicking the header dropdown (H1, H2, H3) or other toolbar dropdowns.
          </p>
          <div style={{ overflow: 'visible', contain: 'none' }}>
            <RichTextEditor
              value={content1}
              onChange={setContent1}
              placeholder="Try using the header dropdown (H1, H2, H3)..."
            />
          </div>
        </div>

        {/* Test Scenario 2: Form-like Container */}
        <form className="glass-container rounded-xl p-6" style={{ overflow: 'visible', contain: 'none' }}>
          <h2 className="text-xl font-semibold text-white mb-4">
            Test 2: Form Container
          </h2>
          <p className="text-white/80 mb-4">
            This editor is inside a form element, similar to the ActivitiesForm.
          </p>
          <div className="space-y-6" style={{ overflow: 'visible', contain: 'none' }}>
            <div className="w-full max-w-full min-w-0" style={{ overflow: 'visible', contain: 'none' }}>
              <RichTextEditor
                value={content2}
                onChange={setContent2}
                placeholder="Test dropdowns in form context..."
              />
            </div>
          </div>
        </form>

        {/* Test Scenario 3: Nested Containers */}
        <div className="glass-container rounded-xl p-6" style={{ overflow: 'visible', contain: 'none' }}>
          <h2 className="text-xl font-semibold text-white mb-4">
            Test 3: Deeply Nested Container
          </h2>
          <p className="text-white/80 mb-4">
            This editor is deeply nested to test container clipping issues.
          </p>
          <div className="space-y-6" style={{ overflow: 'visible', contain: 'none' }}>
            <div className="bg-white/5 rounded-lg p-4" style={{ overflow: 'visible', contain: 'none' }}>
              <div className="bg-white/5 rounded-lg p-4" style={{ overflow: 'visible', contain: 'none' }}>
                <div className="w-full max-w-full min-w-0" style={{ overflow: 'visible', contain: 'none' }}>
                  <RichTextEditor
                    value={content3}
                    onChange={setContent3}
                    placeholder="Test dropdowns in nested containers..."
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="glass-container rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            Testing Instructions
          </h2>
          <div className="space-y-3 text-white/80">
            <p>
              <strong>1. Header Dropdown:</strong> Click the "H" button in the toolbar to test header formatting dropdown (H1, H2, H3, Normal).
            </p>
            <p>
              <strong>2. Color Dropdowns:</strong> Click the text color (A) or background color buttons to test color picker dropdowns.
            </p>
            <p>
              <strong>3. Alignment Dropdown:</strong> Click the alignment button to test text alignment options.
            </p>
            <p>
              <strong>4. Debug Tools:</strong> Use the debug buttons above to analyze and fix dropdown issues in real-time.
            </p>
            <p>
              <strong>5. Browser Console:</strong> Open browser dev tools console to see detailed debug information.
            </p>
          </div>
        </div>

        {/* Current Issues Display */}
        <div className="glass-container rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            Known Issues & Solutions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-red-400 mb-2">Common Issues:</h3>
              <ul className="space-y-2 text-white/80 text-sm">
                <li>• Dropdowns not appearing when clicked</li>
                <li>• Dropdowns appearing behind containers</li>
                <li>• Dropdowns getting clipped by parent elements</li>
                <li>• Dropdowns positioned incorrectly</li>
                <li>• Z-index conflicts with other UI elements</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium text-green-400 mb-2">Applied Solutions:</h3>
              <ul className="space-y-2 text-white/80 text-sm">
                <li>• Ultra-high z-index (999999) for dropdowns</li>
                <li>• Fixed positioning relative to viewport</li>
                <li>• Container overflow fixes</li>
                <li>• CSS containment removal</li>
                <li>• JavaScript positioning logic</li>
                <li>• Mutation observer for dynamic content</li>
              </ul>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default QuillDropdownTestPage;
