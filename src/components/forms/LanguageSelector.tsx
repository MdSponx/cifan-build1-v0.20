import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTypography } from '../../utils/typography';
import ErrorMessage from './ErrorMessage';

interface LanguageSelectorProps {
  value: string[];
  onChange: (languages: string[]) => void;
  error?: string;
  required?: boolean;
  className?: string;
  label?: string;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  value = [],
  onChange,
  error,
  required = false,
  className = '',
  label
}) => {
  const { i18n } = useTranslation();
  const { getClass } = useTypography();
  const [showOtherLanguageInput, setShowOtherLanguageInput] = useState(false);
  const [customLanguage, setCustomLanguage] = useState('');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(value || []);

  const currentLanguage = i18n.language as 'en' | 'th';

  const content = {
    th: {
      filmLanguageTitle: "ภาษาในภาพยนตร์",
      filmLanguageDesc: "ภาษาที่ใช้ในภาพยนตร์ของคุณ (เลือกได้หลายภาษา)",
      selectedLanguages: "ภาษาที่เลือก:",
      addCustomLanguage: "เพิ่มภาษาอื่น",
      customLanguagePlaceholder: "ระบุภาษาอื่น..."
    },
    en: {
      filmLanguageTitle: "Film Language",
      filmLanguageDesc: "Languages used in your film (multiple selection allowed)",
      selectedLanguages: "Selected Languages:",
      addCustomLanguage: "Add Other Language",
      customLanguagePlaceholder: "Specify other language..."
    }
  };

  const currentContent = content[currentLanguage];

  // Film language options
  const majorLanguages = [
    { value: 'Thai', label: { th: 'ภาษาไทย', en: 'Thai' }, flag: '🇹🇭' },
    { value: 'English', label: { th: 'ภาษาอังกฤษ', en: 'English' }, flag: '🇺🇸' },
    { value: 'Mandarin', label: { th: 'ภาษาจีนกลาง', en: 'Mandarin' }, flag: '🇨🇳' },
    { value: 'Japanese', label: { th: 'ภาษาญี่ปุ่น', en: 'Japanese' }, flag: '🇯🇵' },
    { value: 'Korean', label: { th: 'ภาษาเกาหลี', en: 'Korean' }, flag: '🇰🇷' },
    { value: 'Vietnamese', label: { th: 'ภาษาเวียดนาม', en: 'Vietnamese' }, flag: '🇻🇳' },
    { value: 'Malay', label: { th: 'ภาษามาเลย์', en: 'Malay' }, flag: '🇲🇾' },
    { value: 'Indonesian', label: { th: 'ภาษาอินโดนีเซีย', en: 'Indonesian' }, flag: '🇮🇩' },
    { value: 'Hindi', label: { th: 'ภาษาฮินดี', en: 'Hindi' }, flag: '🇮🇳' },
    { value: 'Spanish', label: { th: 'ภาษาสเปน', en: 'Spanish' }, flag: '🇪🇸' },
    { value: 'French', label: { th: 'ภาษาฝรั่งเศส', en: 'French' }, flag: '🇫🇷' },
    { value: 'German', label: { th: 'ภาษาเยอรมัน', en: 'German' }, flag: '🇩🇪' },
    { value: 'Portuguese', label: { th: 'ภาษาโปรตุเกส', en: 'Portuguese' }, flag: '🇵🇹' },
    { value: 'Russian', label: { th: 'ภาษารัสเซีย', en: 'Russian' }, flag: '🇷🇺' },
    { value: 'Arabic', label: { th: 'ภาษาอาหรับ', en: 'Arabic' }, flag: '🇸🇦' },
    { value: 'Italian', label: { th: 'ภาษาอิตาลี', en: 'Italian' }, flag: '🇮🇹' },
    { value: 'Dutch', label: { th: 'ภาษาดัตช์', en: 'Dutch' }, flag: '🇳🇱' },
    { value: 'Swedish', label: { th: 'ภาษาสวีเดน', en: 'Swedish' }, flag: '🇸🇪' },
    { value: 'Norwegian', label: { th: 'ภาษานอร์เวย์', en: 'Norwegian' }, flag: '🇳🇴' }
  ];

  // Sync with parent prop changes
  useEffect(() => {
    if (value && JSON.stringify(value) !== JSON.stringify(selectedLanguages)) {
      setSelectedLanguages(value);
    }
  }, [value]);

  // Handle language selection
  const handleLanguageToggle = (languageValue: string) => {
    const currentLanguages = [...selectedLanguages];
    const index = currentLanguages.indexOf(languageValue);
    
    if (index > -1) {
      // Remove language
      currentLanguages.splice(index, 1);
    } else {
      // Add language
      currentLanguages.push(languageValue);
    }
    
    setSelectedLanguages(currentLanguages);
    onChange(currentLanguages);
  };

  const handleOtherLanguageToggle = () => {
    if (showOtherLanguageInput) {
      // Remove custom languages and hide input
      const standardLanguages = selectedLanguages.filter(lang => 
        majorLanguages.find(option => option.value === lang)
      );
      setSelectedLanguages(standardLanguages);
      onChange(standardLanguages);
      setShowOtherLanguageInput(false);
      setCustomLanguage('');
    } else {
      // Show input
      setShowOtherLanguageInput(true);
    }
  };

  const handleCustomLanguageAdd = () => {
    if (customLanguage.trim()) {
      const currentLanguages = [...selectedLanguages];
      // Remove any existing custom languages first
      const standardLanguages = currentLanguages.filter(lang => 
        majorLanguages.find(option => option.value === lang)
      );
      // Add the new custom language
      standardLanguages.push(customLanguage.trim());
      setSelectedLanguages(standardLanguages);
      onChange(standardLanguages);
      setCustomLanguage('');
    }
  };

  const isLanguageSelected = (languageValue: string) => {
    return selectedLanguages.includes(languageValue);
  };

  const hasCustomLanguages = () => {
    return selectedLanguages.some(lang => 
      !majorLanguages.find(option => option.value === lang)
    );
  };

  return (
    <div className={`${className} overflow-visible`}>
      {label && (
        <label className="block text-sm font-medium text-white/90 mb-2">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
      )}
      
      {error && (
        <div className="mb-4">
          <ErrorMessage error={error} />
        </div>
      )}

      <p className="text-xs text-white/60 mb-3">
        {currentContent.filmLanguageDesc}
      </p>
      
      {/* Language Selection Grid - Compact Pills */}
      <div className="flex flex-wrap gap-2 mb-4">
        {majorLanguages.map((language) => (
          <button
            key={language.value}
            type="button"
            onClick={() => handleLanguageToggle(language.value)}
            className={`px-3 py-2 rounded-full border-2 transition-all duration-200 flex items-center space-x-2 ${getClass('body')} ${
              isLanguageSelected(language.value)
                ? 'bg-gradient-to-r from-[#AA4626] to-[#FCB283] border-[#FCB283] text-white shadow-lg'
                : 'bg-white/5 border-white/20 text-white/80 hover:border-[#FCB283]/50 hover:bg-white/10'
            }`}
          >
            <span className="text-sm">{language.flag}</span>
            <span className="text-xs whitespace-nowrap">
              {language.label[currentLanguage]}
            </span>
          </button>
        ))}
        
        {/* Others Button - Pill Shape */}
        <button
          type="button"
          onClick={handleOtherLanguageToggle}
          className={`px-3 py-2 rounded-full border-2 transition-all duration-200 flex items-center space-x-2 ${
            showOtherLanguageInput || hasCustomLanguages()
              ? 'bg-gradient-to-r from-[#AA4626] to-[#FCB283] border-[#FCB283] text-white shadow-lg'
              : 'bg-white/5 border-white/20 text-white/80 hover:border-[#FCB283]/50 hover:bg-white/10'
          }`}
        >
          <span className="text-sm">🌍</span>
          <span className="text-xs whitespace-nowrap">
            {currentLanguage === 'th' ? 'อื่นๆ' : 'Others'}
          </span>
        </button>
      </div>

      {/* Custom Language Input */}
      {showOtherLanguageInput && (
        <div className="mb-4">
          <label className="block text-white/90 text-sm mb-2">
            {currentContent.addCustomLanguage}
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={customLanguage}
              onChange={(e) => setCustomLanguage(e.target.value)}
              placeholder={currentContent.customLanguagePlaceholder}
              className={`flex-1 p-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:border-[#FCB283] focus:outline-none text-sm ${getClass('input')}`}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleCustomLanguageAdd();
                }
              }}
            />
            <button
              type="button"
              onClick={handleCustomLanguageAdd}
              disabled={!customLanguage.trim()}
              className="px-4 py-2 bg-[#FCB283] hover:bg-[#AA4626] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white transition-colors text-sm"
            >
              {currentLanguage === 'th' ? 'เพิ่ม' : 'Add'}
            </button>
          </div>
        </div>
      )}

      {/* Selected Languages Display */}
      {selectedLanguages && selectedLanguages.length > 0 && (
        <div className="mt-4">
          <p className="text-white/70 text-sm mb-2">
            {currentContent.selectedLanguages}
          </p>
          <div className="flex flex-wrap gap-2 mb-3">
            {selectedLanguages.map((language) => {
              const standardLanguage = majorLanguages.find(lang => lang.value === language);
              const displayName = standardLanguage 
                ? standardLanguage.label[currentLanguage] 
                : language;
              const flag = standardLanguage ? standardLanguage.flag : '🌍';
              
              return (
                <span
                  key={language}
                  className="inline-flex items-center space-x-2 px-3 py-1 bg-[#FCB283]/20 text-[#FCB283] rounded-full text-sm border border-[#FCB283]/30"
                >
                  <span>{flag}</span>
                  <span>{displayName}</span>
                  <button
                    type="button"
                    onClick={() => {
                      const newLanguages = selectedLanguages.filter(lang => lang !== language);
                      setSelectedLanguages(newLanguages);
                      onChange(newLanguages);
                    }}
                    className="ml-1 text-[#FCB283] hover:text-white transition-colors text-sm font-bold"
                  >
                    ×
                  </button>
                </span>
              );
            })}
          </div>
          
          {/* Language count indicator */}
          <p className="text-xs text-white/50">
            {selectedLanguages.length} {currentLanguage === 'th' ? 'ภาษาที่เลือก' : 'languages selected'}
          </p>
        </div>
      )}
      
      {/* Language Note */}
      <div className="mt-3 p-3 bg-blue-500/10 border border-blue-400/20 rounded-lg">
        <div className="flex items-start space-x-2">
          <div className="text-blue-400 text-sm mt-0.5">💡</div>
          <p className="text-blue-300 text-sm leading-relaxed">
            {currentLanguage === 'th' 
              ? 'หากภาพยนตร์ของคุณใช้ภาษาอื่นที่ไม่ใช่ภาษาไทยหรือภาษาอังกฤษ กรุณาเตรียมซับไตเติลภาษาไทยหรือภาษาอังกฤษ'
              : 'If your film uses a language other than Thai or English, please prepare Thai or English subtitles'
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default LanguageSelector;
