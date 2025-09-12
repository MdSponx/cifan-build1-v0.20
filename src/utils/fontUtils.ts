import { useTranslation } from 'react-i18next';

/**
 * Font utility functions for language-specific typography
 * Uses Anuphan for Thai and Raleway for English
 */

export const getFontClass = (language: string, type: 'header' | 'subtitle' | 'body' | 'nav' | 'menu' = 'body'): string => {
  const isThai = language === 'th';
  
  switch (type) {
    case 'header':
      return isThai ? 'header-th' : 'header-en';
    case 'subtitle':
      return isThai ? 'subtitle-th' : 'subtitle-en';
    case 'body':
      return isThai ? 'body-th' : 'body-en';
    case 'nav':
      return isThai ? 'nav-th' : 'nav-en';
    case 'menu':
      return isThai ? 'menu-th' : 'menu-en';
    default:
      return isThai ? 'body-th' : 'body-en';
  }
};

export const getFontStyle = (language: string, type: 'header' | 'subtitle' | 'body' | 'nav' | 'menu' = 'body'): React.CSSProperties => {
  const isThai = language === 'th';
  
  const baseFontFamily = isThai ? "'Anuphan', sans-serif" : "'Raleway', sans-serif";
  
  switch (type) {
    case 'header':
      return {
        fontFamily: baseFontFamily,
        fontWeight: isThai ? 600 : 600,
      };
    case 'subtitle':
      return {
        fontFamily: baseFontFamily,
        fontWeight: isThai ? 200 : 400,
      };
    case 'body':
      return {
        fontFamily: baseFontFamily,
        fontWeight: isThai ? 400 : 400,
      };
    case 'nav':
      return {
        fontFamily: baseFontFamily,
        fontWeight: isThai ? 300 : 400,
      };
    case 'menu':
      return {
        fontFamily: baseFontFamily,
        fontWeight: isThai ? 200 : 300,
      };
    default:
      return {
        fontFamily: baseFontFamily,
        fontWeight: isThai ? 400 : 400,
      };
  }
};

/**
 * Hook to get font utilities based on current language
 */
export const useFontUtils = () => {
  const { i18n } = useTranslation();
  const currentLanguage = i18n.language;

  return {
    getFontClass: (type?: 'header' | 'subtitle' | 'body' | 'nav' | 'menu') => 
      getFontClass(currentLanguage, type),
    getFontStyle: (type?: 'header' | 'subtitle' | 'body' | 'nav' | 'menu') => 
      getFontStyle(currentLanguage, type),
    isThaiLanguage: currentLanguage === 'th',
    currentLanguage,
  };
};

/**
 * Get font weight based on language and text type
 */
export const getFontWeight = (language: string, type: 'header' | 'subtitle' | 'body' | 'nav' | 'menu' = 'body'): number => {
  const isThai = language === 'th';
  
  switch (type) {
    case 'header':
      return isThai ? 600 : 600;
    case 'subtitle':
      return isThai ? 200 : 400;
    case 'body':
      return isThai ? 400 : 400;
    case 'nav':
      return isThai ? 300 : 400;
    case 'menu':
      return isThai ? 200 : 300;
    default:
      return isThai ? 400 : 400;
  }
};

/**
 * Get font family string based on language
 */
export const getFontFamily = (language: string): string => {
  return language === 'th' ? "'Anuphan', sans-serif" : "'Raleway', sans-serif";
};
