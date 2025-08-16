import React from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle, ArrowLeft, Eye, Edit3, X } from 'lucide-react';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinueEditing: () => void;
  onBackToGallery: () => void;
  onViewPublic: () => void;
}

/**
 * Success Modal Component
 * 
 * Shows confirmation modal after successful film update with three action options:
 * 1. Continue Editing - Stay on current edit page
 * 2. Back to Gallery - Navigate to film gallery/list page
 * 3. View Public Page - Navigate to public film detail page
 */
const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  onClose,
  onContinueEditing,
  onBackToGallery,
  onViewPublic
}) => {
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 max-w-md w-full mx-4 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Success Icon */}
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-green-500/20 rounded-full">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </div>

        {/* Title */}
        <h3 className="text-xl font-semibold text-white mb-2 text-center">
          {currentLanguage === 'th' ? 'อัปเดตภาพยนตร์สำเร็จ!' : 'Film Updated Successfully!'}
        </h3>

        {/* Message */}
        <p className="text-white/70 mb-6 text-center">
          {currentLanguage === 'th' ? 'คุณต้องการทำอะไรต่อไป?' : 'What would you like to do next?'}
        </p>

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Continue Editing */}
          <button
            onClick={onContinueEditing}
            className="w-full py-3 px-4 bg-gradient-to-r from-[#FCB283] to-[#AA4626] text-white rounded-xl font-medium hover:shadow-lg transition-all flex items-center justify-center space-x-2"
          >
            <Edit3 className="w-4 h-4" />
            <span>{currentLanguage === 'th' ? 'แก้ไขต่อ' : 'Continue Editing'}</span>
          </button>

          {/* Back to Gallery */}
          <button
            onClick={onBackToGallery}
            className="w-full py-3 px-4 bg-white/10 text-white rounded-xl font-medium hover:bg-white/20 transition-colors flex items-center justify-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{currentLanguage === 'th' ? 'กลับไปที่แกลเลอรี่' : 'Back to Gallery'}</span>
          </button>

          {/* View Public Page */}
          <button
            onClick={onViewPublic}
            className="w-full py-3 px-4 bg-blue-500/20 text-blue-300 rounded-xl font-medium hover:bg-blue-500/30 transition-colors flex items-center justify-center space-x-2"
          >
            <Eye className="w-4 h-4" />
            <span>{currentLanguage === 'th' ? 'ดูหน้าสาธารณะ' : 'View Public Page'}</span>
          </button>
        </div>

        {/* Keyboard shortcuts hint */}
        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-xs text-white/50 text-center">
            Press <kbd className="px-1 py-0.5 bg-white/10 rounded text-white/70">Esc</kbd> to close
          </p>
        </div>
      </div>
    </div>
  );
};

export default SuccessModal;
