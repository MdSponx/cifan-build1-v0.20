import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTypography } from '../../utils/typography';
import AnimatedButton from './AnimatedButton';
import ProcessingOverlay, { ProcessingStep } from './ProcessingOverlay';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  isProcessing?: boolean;
  itemName?: string;
  processingSteps?: ProcessingStep[];
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  isProcessing = false,
  itemName = ''
}) => {
  const { i18n } = useTranslation();
  const { getClass } = useTypography();
  const currentLanguage = i18n.language as 'en' | 'th';

  if (!isOpen) return null;

  const defaultContent = {
    th: {
      title: 'ยืนยันการลบ',
      message: `คุณแน่ใจหรือไม่ที่จะลบ${itemName ? ` "${itemName}"` : 'รายการนี้'}? การกระทำนี้ไม่สามารถยกเลิกได้`,
      confirmButton: 'ลบ',
      cancelButton: 'ยกเลิก',
      processing: 'กำลังลบ...'
    },
    en: {
      title: 'Confirm Deletion',
      message: `Are you sure you want to delete${itemName ? ` "${itemName}"` : ' this item'}? This action cannot be undone.`,
      confirmButton: 'Delete',
      cancelButton: 'Cancel',
      processing: 'Deleting...'
    }
  };

  const content = defaultContent[currentLanguage];

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isProcessing) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && !isProcessing) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div className="glass-container rounded-2xl p-6 sm:p-8 max-w-md w-full mx-4 transform transition-all duration-300 scale-100">
        {/* Warning Icon */}
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className={`text-xl sm:text-2xl ${getClass('header')} text-white mb-2`}>
            {title || content.title}
          </h3>
        </div>

        {/* Message */}
        <div className="mb-8">
          <p className={`${getClass('body')} text-white/90 text-center leading-relaxed`}>
            {message || content.message}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          {/* Cancel Button */}
          <AnimatedButton
            variant="secondary"
            size="medium"
            onClick={isProcessing ? undefined : onClose}
            className={`flex-1 ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {content.cancelButton}
          </AnimatedButton>

          {/* Delete Button */}
          <AnimatedButton
            variant="outline"
            size="medium"
            icon={isProcessing ? undefined : "🗑️"}
            onClick={isProcessing ? undefined : onConfirm}
            className={`flex-1 bg-red-600/20 border-red-500/50 text-red-400 hover:bg-red-600/30 hover:border-red-500/70 hover:text-red-300 ${
              isProcessing ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isProcessing ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-400"></div>
                <span>{content.processing}</span>
              </div>
            ) : (
              content.confirmButton
            )}
          </AnimatedButton>
        </div>

        {/* Processing Overlay */}
        {isProcessing && (
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FCB283] mx-auto mb-2"></div>
              <p className={`${getClass('body')} text-white/80 text-sm`}>
                {content.processing}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;
