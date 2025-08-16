/**
 * Utility functions for country flags, language flags, and target audience emojis
 */

// Country code to flag emoji mapping
export const getCountryFlag = (country: string): string => {
  const countryFlags: Record<string, string> = {
    // Major countries
    'Thailand': '🇹🇭',
    'United States': '🇺🇸',
    'United Kingdom': '🇬🇧',
    'Canada': '🇨🇦',
    'Australia': '🇦🇺',
    'Japan': '🇯🇵',
    'South Korea': '🇰🇷',
    'China': '🇨🇳',
    'Hong Kong': '🇭🇰',
    'Taiwan': '🇹🇼',
    'Singapore': '🇸🇬',
    'Malaysia': '🇲🇾',
    'Indonesia': '🇮🇩',
    'Philippines': '🇵🇭',
    'Vietnam': '🇻🇳',
    'India': '🇮🇳',
    'France': '🇫🇷',
    'Germany': '🇩🇪',
    'Italy': '🇮🇹',
    'Spain': '🇪🇸',
    'Netherlands': '🇳🇱',
    'Sweden': '🇸🇪',
    'Norway': '🇳🇴',
    'Denmark': '🇩🇰',
    'Finland': '🇫🇮',
    'Russia': '🇷🇺',
    'Brazil': '🇧🇷',
    'Argentina': '🇦🇷',
    'Mexico': '🇲🇽',
    'Chile': '🇨🇱',
    'Colombia': '🇨🇴',
    'Peru': '🇵🇪',
    'South Africa': '🇿🇦',
    'Egypt': '🇪🇬',
    'Israel': '🇮🇱',
    'Turkey': '🇹🇷',
    'Iran': '🇮🇷',
    'UAE': '🇦🇪',
    'Saudi Arabia': '🇸🇦',
    'New Zealand': '🇳🇿',
    'Ireland': '🇮🇪',
    'Belgium': '🇧🇪',
    'Switzerland': '🇨🇭',
    'Austria': '🇦🇹',
    'Poland': '🇵🇱',
    'Czech Republic': '🇨🇿',
    'Hungary': '🇭🇺',
    'Greece': '🇬🇷',
    'Portugal': '🇵🇹',
    'Romania': '🇷🇴',
    'Bulgaria': '🇧🇬',
    'Croatia': '🇭🇷',
    'Serbia': '🇷🇸',
    'Ukraine': '🇺🇦',
    'Lithuania': '🇱🇹',
    'Latvia': '🇱🇻',
    'Estonia': '🇪🇪',
    'Slovenia': '🇸🇮',
    'Slovakia': '🇸🇰',
    'Iceland': '🇮🇸',
    'Luxembourg': '🇱🇺',
    'Malta': '🇲🇹',
    'Cyprus': '🇨🇾',
    'Morocco': '🇲🇦',
    'Tunisia': '🇹🇳',
    'Algeria': '🇩🇿',
    'Libya': '🇱🇾',
    'Sudan': '🇸🇩',
    'Ethiopia': '🇪🇹',
    'Kenya': '🇰🇪',
    'Nigeria': '🇳🇬',
    'Ghana': '🇬🇭',
    'Senegal': '🇸🇳',
    'Ivory Coast': '🇨🇮',
    'Cameroon': '🇨🇲',
    'Democratic Republic of Congo': '🇨🇩',
    'Angola': '🇦🇴',
    'Mozambique': '🇲🇿',
    'Madagascar': '🇲🇬',
    'Mauritius': '🇲🇺',
    'Seychelles': '🇸🇨',
    'Reunion': '🇷🇪',
    'Mayotte': '🇾🇹',
    'Comoros': '🇰🇲',
    'Djibouti': '🇩🇯',
    'Eritrea': '🇪🇷',
    'Somalia': '🇸🇴',
    'Uganda': '🇺🇬',
    'Tanzania': '🇹🇿',
    'Rwanda': '🇷🇼',
    'Burundi': '🇧🇮',
    'Malawi': '🇲🇼',
    'Zambia': '🇿🇲',
    'Zimbabwe': '🇿🇼',
    'Botswana': '🇧🇼',
    'Namibia': '🇳🇦',
    'Lesotho': '🇱🇸',
    'Swaziland': '🇸🇿',
    'Gabon': '🇬🇦',
    'Equatorial Guinea': '🇬🇶',
    'Central African Republic': '🇨🇫',
    'Chad': '🇹🇩',
    'Niger': '🇳🇪',
    'Mali': '🇲🇱',
    'Burkina Faso': '🇧🇫',
    'Guinea': '🇬🇳',
    'Guinea-Bissau': '🇬🇼',
    'Sierra Leone': '🇸🇱',
    'Liberia': '🇱🇷',
    'Togo': '🇹🇬',
    'Benin': '🇧🇯',
    'Cape Verde': '🇨🇻',
    'Gambia': '🇬🇲',
    'Mauritania': '🇲🇷',
    'Western Sahara': '🇪🇭',
    'Laos': '🇱🇦',
    'Cambodia': '🇰🇭',
    'Myanmar': '🇲🇲',
    'Bangladesh': '🇧🇩',
    'Sri Lanka': '🇱🇰',
    'Maldives': '🇲🇻',
    'Nepal': '🇳🇵',
    'Bhutan': '🇧🇹',
    'Pakistan': '🇵🇰',
    'Afghanistan': '🇦🇫',
    'Kazakhstan': '🇰🇿',
    'Uzbekistan': '🇺🇿',
    'Turkmenistan': '🇹🇲',
    'Tajikistan': '🇹🇯',
    'Kyrgyzstan': '🇰🇬',
    'Mongolia': '🇲🇳',
    'North Korea': '🇰🇵',
    'Macau': '🇲🇴',
    'Brunei': '🇧🇳',
    'East Timor': '🇹🇱',
    'Papua New Guinea': '🇵🇬',
    'Fiji': '🇫🇯',
    'Solomon Islands': '🇸🇧',
    'Vanuatu': '🇻🇺',
    'New Caledonia': '🇳🇨',
    'French Polynesia': '🇵🇫',
    'Samoa': '🇼🇸',
    'American Samoa': '🇦🇸',
    'Tonga': '🇹🇴',
    'Kiribati': '🇰🇮',
    'Tuvalu': '🇹🇻',
    'Nauru': '🇳🇷',
    'Palau': '🇵🇼',
    'Marshall Islands': '🇲🇭',
    'Micronesia': '🇫🇲',
    'Guam': '🇬🇺',
    'Northern Mariana Islands': '🇲🇵',
    'Cook Islands': '🇨🇰',
    'Niue': '🇳🇺',
    'Tokelau': '🇹🇰',
    'Pitcairn Islands': '🇵🇳',
    'Norfolk Island': '🇳🇫',
    'Christmas Island': '🇨🇽',
    'Cocos Islands': '🇨🇨',
    'Heard Island': '🇭🇲',
    'McDonald Islands': '🇭🇲',
    'Bouvet Island': '🇧🇻',
    'South Georgia': '🇬🇸',
    'South Sandwich Islands': '🇬🇸',
    'British Indian Ocean Territory': '🇮🇴',
    'French Southern Territories': '🇹🇫',
    'Antarctica': '🇦🇶'
  };

  return countryFlags[country] || '🌍';
};

// Language to flag/emoji mapping
export const getLanguageFlag = (language: string): string => {
  const languageFlags: Record<string, string> = {
    // Major languages
    'Thai': '🇹🇭',
    'English': '🇺🇸',
    'Mandarin': '🇨🇳',
    'Cantonese': '🇭🇰',
    'Japanese': '🇯🇵',
    'Korean': '🇰🇷',
    'French': '🇫🇷',
    'German': '🇩🇪',
    'Spanish': '🇪🇸',
    'Italian': '🇮🇹',
    'Portuguese': '🇵🇹',
    'Russian': '🇷🇺',
    'Arabic': '🇸🇦',
    'Hindi': '🇮🇳',
    'Bengali': '🇧🇩',
    'Urdu': '🇵🇰',
    'Persian': '🇮🇷',
    'Turkish': '🇹🇷',
    'Hebrew': '🇮🇱',
    'Dutch': '🇳🇱',
    'Swedish': '🇸🇪',
    'Norwegian': '🇳🇴',
    'Danish': '🇩🇰',
    'Finnish': '🇫🇮',
    'Polish': '🇵🇱',
    'Czech': '🇨🇿',
    'Hungarian': '🇭🇺',
    'Romanian': '🇷🇴',
    'Bulgarian': '🇧🇬',
    'Greek': '🇬🇷',
    'Croatian': '🇭🇷',
    'Serbian': '🇷🇸',
    'Ukrainian': '🇺🇦',
    'Lithuanian': '🇱🇹',
    'Latvian': '🇱🇻',
    'Estonian': '🇪🇪',
    'Slovenian': '🇸🇮',
    'Slovak': '🇸🇰',
    'Icelandic': '🇮🇸',
    'Irish': '🇮🇪',
    'Welsh': '🏴󠁧󠁢󠁷󠁬󠁳󠁿',
    'Scottish': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
    'Catalan': '🏴󠁥󠁳󠁣󠁴󠁿',
    'Basque': '🏴󠁥󠁳󠁰󠁶󠁿',
    'Galician': '🏴󠁥󠁳󠁧󠁡󠁿',
    'Vietnamese': '🇻🇳',
    'Indonesian': '🇮🇩',
    'Malay': '🇲🇾',
    'Filipino': '🇵🇭',
    'Tagalog': '🇵🇭',
    'Burmese': '🇲🇲',
    'Khmer': '🇰🇭',
    'Lao': '🇱🇦',
    'Mongolian': '🇲🇳',
    'Tibetan': '🏔️',
    'Nepali': '🇳🇵',
    'Sinhala': '🇱🇰',
    'Tamil': '🇱🇰',
    'Telugu': '🇮🇳',
    'Marathi': '🇮🇳',
    'Gujarati': '🇮🇳',
    'Punjabi': '🇮🇳',
    'Kannada': '🇮🇳',
    'Malayalam': '🇮🇳',
    'Oriya': '🇮🇳',
    'Assamese': '🇮🇳',
    'Swahili': '🇰🇪',
    'Amharic': '🇪🇹',
    'Yoruba': '🇳🇬',
    'Igbo': '🇳🇬',
    'Hausa': '🇳🇬',
    'Zulu': '🇿🇦',
    'Xhosa': '🇿🇦',
    'Afrikaans': '🇿🇦'
  };

  return languageFlags[language] || '🗣️';
};

// Target audience to emoji mapping
export const getTargetAudienceEmoji = (audience: string): string => {
  const audienceEmojis: Record<string, string> = {
    'Popcorn': '🍿',
    'Cinephile': '🎬',
    'College Student': '🎓',
    'Student': '📚',
    'Art People': '🎨',
    'Folk': '👥',
    'Novel Fan': '📖',
    'J-Horror Fan': '👻',
    'Youth': '🎓', // Updated to match requirements
    'Family': '👨‍👩‍👧‍👦',
    // Additional mappings for the requirements
    'Future': '🚀',
    'World': '🌍',
    'General': '👥',
    // Thai translations
    'นักศึกษา': '🎓',
    'นักเรียน': '📚',
    'คนศิลปะ': '🎨',
    'ชาวบ้าน': '👥',
    'แฟนนิยาย': '📖',
    'แฟน J-Horror': '👻',
    'เยาวชน': '🎓', // Updated to match requirements
    'ครอบครัว': '👨‍👩‍👧‍👦'
  };

  return audienceEmojis[audience] || '👤';
};

// Genre to emoji mapping
export const getGenreEmoji = (genre: string): string => {
  const genreEmojis: Record<string, string> = {
    'Horror': '👻',
    'Comedy': '😂',
    'Action': '💥',
    'Sci Fi': '🚀',
    'Crime/Thriller': '🔍',
    'Adventure': '🗺️',
    'Animation': '🎨',
    'Drama': '🎭',
    'Documentary': '📹',
    'Fantasy': '🧙‍♂️',
    // Thai translations
    'สยองขวัญ': '👻',
    'ตลก': '😂',
    'แอ็คชั่น': '💥',
    'ไซไฟ': '🚀',
    'อาชญากรรม/ระทึกขวัญ': '🔍',
    'ผจญภัย': '🗺️',
    'แอนิเมชั่น': '🎨',
    'ดราม่า': '🎭',
    'สารคดี': '📹',
    'แฟนตาซี': '🧙‍♂️'
  };

  return genreEmojis[genre] || '🎬';
};

// Helper function to add flag/emoji to text
export const addFlagToText = (text: string, type: 'country' | 'language' | 'audience' | 'genre'): string => {
  let emoji = '';
  
  switch (type) {
    case 'country':
      emoji = getCountryFlag(text);
      break;
    case 'language':
      emoji = getLanguageFlag(text);
      break;
    case 'audience':
      emoji = getTargetAudienceEmoji(text);
      break;
    case 'genre':
      emoji = getGenreEmoji(text);
      break;
  }
  
  return `${emoji} ${text}`;
};
