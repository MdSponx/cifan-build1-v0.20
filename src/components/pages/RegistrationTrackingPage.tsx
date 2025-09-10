import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTypography } from '../../utils/typography';
import RegistrationTracker from '../tracking/RegistrationTracker';
import { 
  Search, 
  ArrowLeft,
  Info,
  HelpCircle
} from 'lucide-react';
import AnimatedButton from '../ui/AnimatedButton';

const RegistrationTrackingPage: React.FC = () => {
  const { i18n } = useTranslation();
  const { getClass } = useTypography();
  const currentLanguage = i18n.language as 'en' | 'th';

  // Content translations
  const content = {
    th: {
      title: 'ติดตามสถานะการลงทะเบียน',
      subtitle: 'ตรวจสอบสถานะการลงทะเบียนกิจกรรมของคุณ',
      backToActivities: 'กลับไปยังกิจกรรม',
      howToTrack: 'วิธีการติดตาม',
      trackingCodeMethod: 'ใช้รหัสติดตาม',
      trackingCodeDesc: 'ใส่รหัสติดตาม 8 หลักที่ได้รับหลังจากลงทะเบียนสำเร็จ',
      emailMethod: 'ใช้อีเมล',
      emailDesc: 'ใส่อีเมลที่ใช้ในการลงทะเบียนเพื่อดูกิจกรรมทั้งหมดที่ลงทะเบียนไว้',
      helpTitle: 'ต้องการความช่วยเหลือ?',
      helpText: 'หากคุณไม่พบรหัสติดตามหรือมีปัญหาในการเข้าถึง กรุณาติดต่อทีมงาน',
      contactSupport: 'ติดต่อทีมงาน',
      trackingCodeFormat: 'รหัสติดตาม (เช่น ABC12345)',
      emailFormat: 'อีเมล (เช่น example@email.com)',
      searchPlaceholder: 'ค้นหาด้วยรหัสติดตามหรืออีเมล...'
    },
    en: {
      title: 'Track Your Registration',
      subtitle: 'Check the status of your activity registrations',
      backToActivities: 'Back to Activities',
      howToTrack: 'How to Track',
      trackingCodeMethod: 'Using Tracking Code',
      trackingCodeDesc: 'Enter the 8-digit tracking code you received after successful registration',
      emailMethod: 'Using Email',
      emailDesc: 'Enter the email address used for registration to view all your registered activities',
      helpTitle: 'Need Help?',
      helpText: 'If you cannot find your tracking code or have trouble accessing your registration, please contact our support team',
      contactSupport: 'Contact Support',
      trackingCodeFormat: 'Tracking Code (e.g., ABC12345)',
      emailFormat: 'Email (e.g., example@email.com)',
      searchPlaceholder: 'Search by tracking code or email...'
    }
  };

  const currentContent = content[currentLanguage];

  // Handle back navigation
  const handleBack = () => {
    window.location.hash = '#activities';
  };

  // Handle contact support
  const handleContactSupport = () => {
    window.location.href = 'mailto:support@cifan.org?subject=Registration Tracking Support';
  };

  return (
    <div className="min-h-screen bg-[#110D16] text-white pt-24">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#110D16] to-[#1A1625] py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <AnimatedButton
              variant="outline"
              size="medium"
              onClick={handleBack}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {currentContent.backToActivities}
            </AnimatedButton>
          </div>
          
          <div className="text-center max-w-3xl mx-auto">
            <h1 className={`text-3xl sm:text-4xl lg:text-5xl ${getClass('header')} text-white mb-4`}>
              {currentContent.title}
            </h1>
            <p className={`text-lg ${getClass('body')} text-white/80`}>
              {currentContent.subtitle}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Tracking Interface */}
          <div className="lg:col-span-2">
            <RegistrationTracker />
          </div>

          {/* Sidebar - Help and Instructions */}
          <div className="space-y-6">
            
            {/* How to Track */}
            <div className="glass-container rounded-xl p-6">
              <h2 className={`text-xl ${getClass('header')} text-white mb-6 flex items-center`}>
                <Info className="w-5 h-5 text-[#FCB283] mr-3" />
                {currentContent.howToTrack}
              </h2>
              
              <div className="space-y-6">
                {/* Tracking Code Method */}
                <div>
                  <h3 className={`text-lg ${getClass('header')} text-white mb-2`}>
                    {currentContent.trackingCodeMethod}
                  </h3>
                  <p className={`text-sm ${getClass('body')} text-white/70 mb-3`}>
                    {currentContent.trackingCodeDesc}
                  </p>
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <code className={`text-sm ${getClass('menu')} text-[#FCB283]`}>
                      {currentContent.trackingCodeFormat}
                    </code>
                  </div>
                </div>

                {/* Email Method */}
                <div>
                  <h3 className={`text-lg ${getClass('header')} text-white mb-2`}>
                    {currentContent.emailMethod}
                  </h3>
                  <p className={`text-sm ${getClass('body')} text-white/70 mb-3`}>
                    {currentContent.emailDesc}
                  </p>
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <code className={`text-sm ${getClass('menu')} text-[#FCB283]`}>
                      {currentContent.emailFormat}
                    </code>
                  </div>
                </div>
              </div>
            </div>

            {/* Help Section */}
            <div className="glass-container rounded-xl p-6">
              <h2 className={`text-xl ${getClass('header')} text-white mb-4 flex items-center`}>
                <HelpCircle className="w-5 h-5 text-[#FCB283] mr-3" />
                {currentContent.helpTitle}
              </h2>
              
              <p className={`text-sm ${getClass('body')} text-white/70 mb-6`}>
                {currentContent.helpText}
              </p>
              
              <AnimatedButton
                variant="outline"
                size="medium"
                onClick={handleContactSupport}
                className="w-full"
              >
                {currentContent.contactSupport}
              </AnimatedButton>
            </div>

            {/* Quick Tips */}
            <div className="glass-container rounded-xl p-6">
              <h3 className={`text-lg ${getClass('header')} text-white mb-4`}>
                Quick Tips
              </h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-[#FCB283] rounded-full mt-2 flex-shrink-0"></div>
                  <p className={`${getClass('body')} text-white/70`}>
                    {currentLanguage === 'th' 
                      ? 'รหัสติดตามจะถูกส่งไปยังอีเมลของคุณหลังจากลงทะเบียนสำเร็จ'
                      : 'Your tracking code is sent to your email after successful registration'
                    }
                  </p>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-[#FCB283] rounded-full mt-2 flex-shrink-0"></div>
                  <p className={`${getClass('body')} text-white/70`}>
                    {currentLanguage === 'th' 
                      ? 'คุณสามารถใช้อีเมลเดียวกันเพื่อดูการลงทะเบียนทั้งหมดได้'
                      : 'You can use the same email to view all your registrations'
                    }
                  </p>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-[#FCB283] rounded-full mt-2 flex-shrink-0"></div>
                  <p className={`${getClass('body')} text-white/70`}>
                    {currentLanguage === 'th' 
                      ? 'บันทึกรหัสติดตามไว้เพื่อความสะดวกในการตรวจสอบ'
                      : 'Save your tracking code for easy future reference'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistrationTrackingPage;
