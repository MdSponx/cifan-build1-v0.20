import React, { useState, useEffect } from 'react';
import { 
  forceFixAllDropdowns, 
  runDropdownDiagnostics, 
  type DropdownDiagnostics 
} from '../../utils/quillDropdownFix';
import { useQuillDropdownFix } from '../../hooks/useQuillDropdownFix';

interface DebugLog {
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'success';
  message: string;
  data?: any;
}

interface QuillDropdownDebugPanelProps {
  /**
   * Whether to show the debug panel
   * @default false
   */
  isVisible?: boolean;
  
  /**
   * Position of the debug panel
   * @default 'bottom-right'
   */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  
  /**
   * Whether to auto-run diagnostics on mount
   * @default true
   */
  autoRunDiagnostics?: boolean;
  
  /**
   * Interval for auto-refresh diagnostics (in milliseconds)
   * Set to 0 to disable auto-refresh
   * @default 5000
   */
  autoRefreshInterval?: number;
}

const QuillDropdownDebugPanel: React.FC<QuillDropdownDebugPanelProps> = ({
  isVisible = false,
  position = 'bottom-right',
  autoRunDiagnostics = true,
  autoRefreshInterval = 5000
}) => {
  const [diagnostics, setDiagnostics] = useState<DropdownDiagnostics | null>(null);
  const [logs, setLogs] = useState<DebugLog[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAutoRefresh, setIsAutoRefresh] = useState(autoRefreshInterval > 0);
  
  const { forceFixAll, runDiagnostics, isInitialized } = useQuillDropdownFix({
    enableDebugMode: true,
    autoApplyFix: true
  });

  const addLog = (level: DebugLog['level'], message: string, data?: any) => {
    const log: DebugLog = {
      timestamp: new Date().toLocaleTimeString(),
      level,
      message,
      data
    };
    
    setLogs(prev => [...prev.slice(-49), log]); // Keep last 50 logs
  };

  const runDiagnosticsAndLog = () => {
    try {
      const result = runDiagnostics();
      setDiagnostics(result);
      
      const issues = result.hiddenDropdowns + result.positioningIssues + 
                    result.zIndexIssues + result.containerIssues + result.contentIssues;
      
      if (issues === 0) {
        addLog('success', `Diagnostics completed - No issues found`, result);
      } else {
        addLog('warning', `Diagnostics completed - ${issues} issues found`, result);
      }
      
      return result;
    } catch (error) {
      addLog('error', 'Failed to run diagnostics', error);
      return null;
    }
  };

  const forceFixAndLog = () => {
    try {
      forceFixAll();
      addLog('info', 'Force fix applied to all dropdowns');
      
      // Run diagnostics after fix
      setTimeout(() => {
        runDiagnosticsAndLog();
      }, 100);
    } catch (error) {
      addLog('error', 'Failed to apply force fix', error);
    }
  };

  const clearLogs = () => {
    setLogs([]);
    addLog('info', 'Debug logs cleared');
  };

  const exportLogs = () => {
    const logData = {
      timestamp: new Date().toISOString(),
      diagnostics,
      logs,
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    };
    
    const blob = new Blob([JSON.stringify(logData, null, 2)], { 
      type: 'application/json' 
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quill-dropdown-debug-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    addLog('success', 'Debug data exported');
  };

  const testDropdownInteraction = () => {
    addLog('info', 'Testing dropdown interactions...');
    
    const pickers = document.querySelectorAll('.ql-picker-label');
    let testCount = 0;
    
    pickers.forEach((picker, index) => {
      setTimeout(() => {
        const pickerEl = picker as HTMLElement;
        pickerEl.click();
        testCount++;
        
        setTimeout(() => {
          pickerEl.click(); // Close
          
          if (testCount === pickers.length) {
            addLog('success', `Tested ${testCount} dropdown interactions`);
            setTimeout(runDiagnosticsAndLog, 200);
          }
        }, 500);
      }, index * 1000);
    });
    
    if (pickers.length === 0) {
      addLog('warning', 'No dropdown pickers found to test');
    }
  };

  // Auto-refresh diagnostics
  useEffect(() => {
    if (!isAutoRefresh || autoRefreshInterval <= 0) return;
    
    const interval = setInterval(() => {
      if (isVisible) {
        runDiagnosticsAndLog();
      }
    }, autoRefreshInterval);
    
    return () => clearInterval(interval);
  }, [isAutoRefresh, autoRefreshInterval, isVisible]);

  // Initial diagnostics
  useEffect(() => {
    if (isVisible && autoRunDiagnostics) {
      setTimeout(() => {
        runDiagnosticsAndLog();
      }, 500);
    }
  }, [isVisible, autoRunDiagnostics]);

  if (!isVisible) return null;

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4'
  };

  const getStatusColor = (level: DebugLog['level']) => {
    switch (level) {
      case 'success': return 'text-green-400';
      case 'warning': return 'text-yellow-400';
      case 'error': return 'text-red-400';
      default: return 'text-blue-400';
    }
  };

  const getStatusIcon = (level: DebugLog['level']) => {
    switch (level) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return 'ℹ️';
    }
  };

  return (
    <div 
      className={`fixed ${positionClasses[position]} z-[2147483647] max-w-md`}
      style={{ zIndex: 2147483647 }}
    >
      <div className="bg-gray-900/95 backdrop-blur-lg border border-gray-700 rounded-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></div>
            <h3 className="text-white font-medium text-sm">Quill Dropdown Debug</h3>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            {isExpanded ? '−' : '+'}
          </button>
        </div>

        {/* Status Bar */}
        <div className="px-3 py-2 bg-gray-800/50 border-b border-gray-700">
          <div className="flex items-center justify-between text-xs">
            <span className={`${isInitialized ? 'text-green-400' : 'text-red-400'}`}>
              {isInitialized ? '🟢 Initialized' : '🔴 Not Initialized'}
            </span>
            <span className="text-gray-400">
              {diagnostics ? `${diagnostics.dropdownsFound} dropdowns` : 'No data'}
            </span>
          </div>
        </div>

        {isExpanded && (
          <>
            {/* Controls */}
            <div className="p-3 border-b border-gray-700">
              <div className="grid grid-cols-2 gap-2 mb-3">
                <button
                  onClick={runDiagnosticsAndLog}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                >
                  Run Diagnostics
                </button>
                <button
                  onClick={forceFixAndLog}
                  className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors"
                >
                  Force Fix
                </button>
                <button
                  onClick={testDropdownInteraction}
                  className="px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white text-xs rounded transition-colors"
                >
                  Test Interactions
                </button>
                <button
                  onClick={exportLogs}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded transition-colors"
                >
                  Export Data
                </button>
              </div>
              
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs text-gray-300">
                  <input
                    type="checkbox"
                    checked={isAutoRefresh}
                    onChange={(e) => setIsAutoRefresh(e.target.checked)}
                    className="w-3 h-3"
                  />
                  Auto-refresh
                </label>
                <button
                  onClick={clearLogs}
                  className="text-xs text-gray-400 hover:text-white transition-colors"
                >
                  Clear Logs
                </button>
              </div>
            </div>

            {/* Diagnostics */}
            {diagnostics && (
              <div className="p-3 border-b border-gray-700">
                <h4 className="text-white text-xs font-medium mb-2">Diagnostics</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="text-gray-300">
                    Found: <span className="text-blue-400">{diagnostics.dropdownsFound}</span>
                  </div>
                  <div className="text-gray-300">
                    Visible: <span className="text-green-400">{diagnostics.visibleDropdowns}</span>
                  </div>
                  <div className="text-gray-300">
                    Hidden: <span className="text-red-400">{diagnostics.hiddenDropdowns}</span>
                  </div>
                  <div className="text-gray-300">
                    Z-Index: <span className="text-yellow-400">{diagnostics.zIndexIssues}</span>
                  </div>
                  <div className="text-gray-300">
                    Position: <span className="text-orange-400">{diagnostics.positioningIssues}</span>
                  </div>
                  <div className="text-gray-300">
                    Content: <span className="text-purple-400">{diagnostics.contentIssues}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Logs */}
            <div className="p-3">
              <h4 className="text-white text-xs font-medium mb-2">Debug Logs</h4>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {logs.length === 0 ? (
                  <p className="text-gray-500 text-xs">No logs yet...</p>
                ) : (
                  logs.slice(-10).map((log, index) => (
                    <div key={index} className="text-xs">
                      <div className="flex items-start gap-2">
                        <span className="text-gray-500 shrink-0">{log.timestamp}</span>
                        <span className="shrink-0">{getStatusIcon(log.level)}</span>
                        <span className={`${getStatusColor(log.level)} break-words`}>
                          {log.message}
                        </span>
                      </div>
                      {log.data && (
                        <div className="ml-16 mt-1 text-gray-400 text-xs font-mono">
                          {typeof log.data === 'object' 
                            ? JSON.stringify(log.data, null, 2).slice(0, 100) + '...'
                            : String(log.data)
                          }
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default QuillDropdownDebugPanel;
