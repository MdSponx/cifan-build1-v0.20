import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import RegistrationForm from './RegistrationForm';
import { registrationService } from '../../services/registrationService';
import {
  RegistrationModalProps,
  RegistrationFormData,
  RegistrationResult,
  RegistrationValidationErrors
} from '../../types/registration.types';

const RegistrationModal: React.FC<RegistrationModalProps> = ({
  isOpen,
  onClose,
  activityId,
  activityName,
  maxParticipants,
  currentRegistrations,
  registrationDeadline,
  onSuccess
}) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<RegistrationValidationErrors>({});
  const [registrationResult, setRegistrationResult] = useState<RegistrationResult | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setErrors({});
      setRegistrationResult(null);
      setShowSuccess(false);
    }
  }, [isOpen]);

  // Handle form submission
  const handleSubmit = async (formData: RegistrationFormData) => {
    setIsLoading(true);
    setErrors({});

    try {
      console.log('🔄 Submitting registration:', { activityId, email: formData.email });

      const result = await registrationService.registerForActivity(activityId, formData);

      if (result.success) {
        console.log('✅ Registration successful:', result);
        setRegistrationResult(result);
        setShowSuccess(true);
        
        // Call success callback if provided
        if (onSuccess) {
          onSuccess(result);
        }
      } else {
        console.error('❌ Registration failed:', result.error);
        
        // Handle specific error types
        if (result.errorCode === 'DUPLICATE_EMAIL') {
          setErrors({ email: result.error || t('registration.errors.duplicateEmail') });
        } else if (result.errorCode === 'ACTIVITY_FULL') {
          setErrors({ general: result.error || t('registration.errors.activityFull') });
        } else if (result.errorCode === 'REGISTRATION_CLOSED') {
          setErrors({ general: result.error || t('registration.errors.registrationClosed') });
        } else {
          setErrors({ general: result.error || t('registration.errors.unknownError') });
        }
      }
    } catch (error) {
      console.error('❌ Registration submission error:', error);
      setErrors({ 
        general: error instanceof Error ? error.message : t('registration.errors.networkError')
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle modal close
  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  // Handle success modal close
  const handleSuccessClose = () => {
    setShowSuccess(false);
    onClose();
  };

  // Don't render if not open
  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* Modal Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="glass-container rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
          {/* Modal Header - Fixed */}
          <div className="flex items-center justify-between p-6 border-b border-white/20 flex-shrink-0">
            <h2 className="text-2xl font-semibold text-white header-en">
              {t('registration.modal.title')}
            </h2>
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="text-white/60 hover:text-white focus:outline-none focus:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 hover:bg-white/10 rounded-full p-2"
              aria-label={t('common.close')}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Modal Content - Scrollable */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              <RegistrationForm
                activityId={activityId}
                activityName={activityName}
                maxParticipants={maxParticipants}
                currentRegistrations={currentRegistrations}
                registrationDeadline={registrationDeadline}
                onSubmit={handleSubmit}
                onCancel={handleClose}
                isLoading={isLoading}
                errors={errors}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccess && registrationResult && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-60 flex items-center justify-center p-4">
          <div className="glass-container rounded-xl shadow-2xl max-w-md w-full">
            {/* Success Header */}
            <div className="p-6 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gradient-to-br from-green-400 to-green-600 mb-4 animate-success-bounce">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              <h3 className="text-lg font-semibold text-white mb-2 header-en">
                {t('registration.success.title')}
              </h3>
              
              <p className="text-sm text-white/80 mb-6 body-en">
                {t('registration.success.message')}
              </p>

              {/* Registration Details */}
              <div className="glass-card rounded-lg p-4 mb-6 text-left border border-white/20">
                <h4 className="font-medium text-white mb-3 header-en">
                  {t('registration.success.details')}
                </h4>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/70 body-en">{t('registration.success.activity')}:</span>
                    <span className="font-medium text-white body-en">{activityName}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-white/70 body-en">{t('registration.success.trackingCode')}:</span>
                    <span className="font-mono font-bold text-[#FCB283] text-lg">
                      {registrationResult.trackingCode}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-white/70 body-en">{t('registration.success.registrationId')}:</span>
                    <span className="font-mono text-white/90">
                      {registrationResult.registrationId}
                    </span>
                  </div>
                </div>
              </div>

              {/* Important Notice */}
              <div className="glass-card rounded-lg p-4 mb-6 border border-[#FCB283]/30 bg-gradient-to-br from-[#FCB283]/10 to-[#AA4626]/10">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-[#FCB283]" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3 text-left">
                    <h4 className="text-sm font-medium text-[#FCB283] header-en">
                      {t('registration.success.importantTitle')}
                    </h4>
                    <div className="mt-1 text-sm text-white/80 body-en">
                      <p>{t('registration.success.saveTrackingCode')}</p>
                      <p className="mt-1">{t('registration.success.confirmationEmail')}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    // Copy tracking code to clipboard
                    if (registrationResult.trackingCode) {
                      navigator.clipboard.writeText(registrationResult.trackingCode);
                      // You could show a toast notification here
                    }
                  }}
                  className="flex-1 glass-button-secondary rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 body-en"
                >
                  {t('registration.success.copyTrackingCode')}
                </button>
                
                <button
                  onClick={handleSuccessClose}
                  className="flex-1 glass-button-primary rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 body-en"
                >
                  {t('registration.success.close')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RegistrationModal;
