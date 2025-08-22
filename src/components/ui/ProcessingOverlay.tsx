import React from 'react';
import { useTypography } from '../../utils/typography';

export interface ProcessingStep {
  id: string;
  label: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress?: number;
  skip?: boolean;
}

interface ProcessingOverlayProps {
  isVisible: boolean;
  steps: ProcessingStep[];
}

const ProcessingOverlay: React.FC<ProcessingOverlayProps> = ({ isVisible, steps }) => {
  const { getClass } = useTypography();

  if (!isVisible) return null;

  const getStepStatusIcon = (status: ProcessingStep['status']) => {
    switch (status) {
      case 'pending':
        return <div className="w-5 h-5 rounded-full border-2 border-white/30"></div>;
      case 'processing':
        return (
          <div className="w-5 h-5 rounded-full border-2 border-[#FCB283] border-t-transparent animate-spin"></div>
        );
      case 'completed':
        return (
          <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'error':
        return (
          <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-white/30"></div>;
    }
  };

  const getStepTextColor = (status: ProcessingStep['status']) => {
    switch (status) {
      case 'pending':
        return 'text-white/60';
      case 'processing':
        return 'text-[#FCB283]';
      case 'completed':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
      default:
        return 'text-white/60';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="glass-container rounded-2xl p-8 max-w-md w-full mx-4">
        <div className="text-center mb-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FCB283] mx-auto mb-4"></div>
          <h3 className={`text-xl ${getClass('header')} text-white`}>
            Processing Your Application
          </h3>
          <p className={`text-sm ${getClass('body')} text-white/70 mt-2`}>
            Please wait while we process your submission...
          </p>
        </div>
        
        <div className="space-y-4">
          {steps.filter(step => !step.skip).map((step) => (
            <div key={step.id} className="flex items-center space-x-3">
              {getStepStatusIcon(step.status)}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className={`${getClass('body')} ${getStepTextColor(step.status)}`}>
                    {step.label}
                  </span>
                  {step.status === 'processing' && step.progress !== undefined && (
                    <span className="text-sm font-semibold text-[#FCB283]">
                      {Math.round(step.progress)}%
                    </span>
                  )}
                </div>
                {step.status === 'processing' && step.progress !== undefined && (
                  <div className="mt-2">
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-[#FCB283] to-[#FF8A50] h-2 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${step.progress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 text-center">
          <p className={`text-xs ${getClass('body')} text-white/50`}>
            Do not close this window during processing
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProcessingOverlay;
