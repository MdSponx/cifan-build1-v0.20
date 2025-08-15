import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import ErrorMessage from './ErrorMessage';

// Comprehensive list of countries
const COUNTRIES = [
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Argentina', 'Armenia', 'Australia',
  'Austria', 'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium',
  'Belize', 'Benin', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil',
  'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi', 'Cambodia', 'Cameroon', 'Canada',
  'Cape Verde', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros',
  'Congo', 'Costa Rica', 'Croatia', 'Cuba', 'Cyprus', 'Czech Republic', 'Denmark', 'Djibouti',
  'Dominica', 'Dominican Republic', 'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea',
  'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia', 'Fiji', 'Finland', 'France', 'Gabon',
  'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea',
  'Guinea-Bissau', 'Guyana', 'Haiti', 'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia',
  'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan',
  'Kenya', 'Kiribati', 'Kuwait', 'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Lesotho',
  'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Madagascar', 'Malawi',
  'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius',
  'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco',
  'Mozambique', 'Myanmar', 'Namibia', 'Nauru', 'Nepal', 'Netherlands', 'New Zealand',
  'Nicaragua', 'Niger', 'Nigeria', 'North Korea', 'North Macedonia', 'Norway', 'Oman',
  'Pakistan', 'Palau', 'Palestine', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru',
  'Philippines', 'Poland', 'Portugal', 'Qatar', 'Romania', 'Russia', 'Rwanda',
  'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa',
  'San Marino', 'Sao Tome and Principe', 'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles',
  'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia',
  'South Africa', 'South Korea', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname',
  'Sweden', 'Switzerland', 'Syria', 'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand',
  'Timor-Leste', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan',
  'Tuvalu', 'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States',
  'Uruguay', 'Uzbekistan', 'Vanuatu', 'Vatican City', 'Venezuela', 'Vietnam', 'Yemen',
  'Zambia', 'Zimbabwe'
];

// Country flag emojis mapping
const countryFlags: { [key: string]: string } = {
  'Afghanistan': '🇦🇫', 'Albania': '🇦🇱', 'Algeria': '🇩🇿', 'Andorra': '🇦🇩', 'Angola': '🇦🇴',
  'Argentina': '🇦🇷', 'Armenia': '🇦🇲', 'Australia': '🇦🇺', 'Austria': '🇦🇹', 'Azerbaijan': '🇦🇿',
  'Bahamas': '🇧🇸', 'Bahrain': '🇧🇭', 'Bangladesh': '🇧🇩', 'Barbados': '🇧🇧', 'Belarus': '🇧🇾',
  'Belgium': '🇧🇪', 'Belize': '🇧🇿', 'Benin': '🇧🇯', 'Bhutan': '🇧🇹', 'Bolivia': '🇧🇴',
  'Bosnia and Herzegovina': '🇧🇦', 'Botswana': '🇧🇼', 'Brazil': '🇧🇷', 'Brunei': '🇧🇳',
  'Bulgaria': '🇧🇬', 'Burkina Faso': '🇧🇫', 'Burundi': '🇧🇮', 'Cambodia': '🇰🇭',
  'Cameroon': '🇨🇲', 'Canada': '🇨🇦', 'Cape Verde': '🇨🇻', 'Central African Republic': '🇨🇫',
  'Chad': '🇹🇩', 'Chile': '🇨🇱', 'China': '🇨🇳', 'Colombia': '🇨🇴', 'Comoros': '🇰🇲',
  'Congo': '🇨🇬', 'Costa Rica': '🇨🇷', 'Croatia': '🇭🇷', 'Cuba': '🇨🇺', 'Cyprus': '🇨🇾',
  'Czech Republic': '🇨🇿', 'Denmark': '🇩🇰', 'Djibouti': '🇩🇯', 'Dominica': '🇩🇲',
  'Dominican Republic': '🇩🇴', 'Ecuador': '🇪🇨', 'Egypt': '🇪🇬', 'El Salvador': '🇸🇻',
  'Equatorial Guinea': '🇬🇶', 'Eritrea': '🇪🇷', 'Estonia': '🇪🇪', 'Eswatini': '🇸🇿',
  'Ethiopia': '🇪🇹', 'Fiji': '🇫🇯', 'Finland': '🇫🇮', 'France': '🇫🇷', 'Gabon': '🇬🇦',
  'Gambia': '🇬🇲', 'Georgia': '🇬🇪', 'Germany': '🇩🇪', 'Ghana': '🇬🇭', 'Greece': '🇬🇷',
  'Grenada': '🇬🇩', 'Guatemala': '🇬🇹', 'Guinea': '🇬🇳', 'Guinea-Bissau': '🇬🇼',
  'Guyana': '🇬🇾', 'Haiti': '🇭🇹', 'Honduras': '🇭🇳', 'Hungary': '🇭🇺', 'Iceland': '🇮🇸',
  'India': '🇮🇳', 'Indonesia': '🇮🇩', 'Iran': '🇮🇷', 'Iraq': '🇮🇶', 'Ireland': '🇮🇪',
  'Israel': '🇮🇱', 'Italy': '🇮🇹', 'Jamaica': '🇯🇲', 'Japan': '🇯🇵', 'Jordan': '🇯🇴',
  'Kazakhstan': '🇰🇿', 'Kenya': '🇰🇪', 'Kiribati': '🇰🇮', 'Kuwait': '🇰🇼',
  'Kyrgyzstan': '🇰🇬', 'Laos': '🇱🇦', 'Latvia': '🇱🇻', 'Lebanon': '🇱🇧', 'Lesotho': '🇱🇸',
  'Liberia': '🇱🇷', 'Libya': '🇱🇾', 'Liechtenstein': '🇱🇮', 'Lithuania': '🇱🇹',
  'Luxembourg': '🇱🇺', 'Madagascar': '🇲🇬', 'Malawi': '🇲🇼', 'Malaysia': '🇲🇾',
  'Maldives': '🇲🇻', 'Mali': '🇲🇱', 'Malta': '🇲🇹', 'Marshall Islands': '🇲🇭',
  'Mauritania': '🇲🇷', 'Mauritius': '🇲🇺', 'Mexico': '🇲🇽', 'Micronesia': '🇫🇲',
  'Moldova': '🇲🇩', 'Monaco': '🇲🇨', 'Mongolia': '🇲🇳', 'Montenegro': '🇲🇪',
  'Morocco': '🇲🇦', 'Mozambique': '🇲🇿', 'Myanmar': '🇲🇲', 'Namibia': '🇳🇦',
  'Nauru': '🇳🇷', 'Nepal': '🇳🇵', 'Netherlands': '🇳🇱', 'New Zealand': '🇳🇿',
  'Nicaragua': '🇳🇮', 'Niger': '🇳🇪', 'Nigeria': '🇳🇬', 'North Korea': '🇰🇵',
  'North Macedonia': '🇲🇰', 'Norway': '🇳🇴', 'Oman': '🇴🇲', 'Pakistan': '🇵🇰',
  'Palau': '🇵🇼', 'Palestine': '🇵🇸', 'Panama': '🇵🇦', 'Papua New Guinea': '🇵🇬',
  'Paraguay': '🇵🇾', 'Peru': '🇵🇪', 'Philippines': '🇵🇭', 'Poland': '🇵🇱',
  'Portugal': '🇵🇹', 'Qatar': '🇶🇦', 'Romania': '🇷🇴', 'Russia': '🇷🇺', 'Rwanda': '🇷🇼',
  'Saint Kitts and Nevis': '🇰🇳', 'Saint Lucia': '🇱🇨', 'Saint Vincent and the Grenadines': '🇻🇨',
  'Samoa': '🇼🇸', 'San Marino': '🇸🇲', 'Sao Tome and Principe': '🇸🇹',
  'Saudi Arabia': '🇸🇦', 'Senegal': '🇸🇳', 'Serbia': '🇷🇸', 'Seychelles': '🇸🇨',
  'Sierra Leone': '🇸🇱', 'Singapore': '🇸🇬', 'Slovakia': '🇸🇰', 'Slovenia': '🇸🇮',
  'Solomon Islands': '🇸🇧', 'Somalia': '🇸🇴', 'South Africa': '🇿🇦', 'South Korea': '🇰🇷',
  'South Sudan': '🇸🇸', 'Spain': '🇪🇸', 'Sri Lanka': '🇱🇰', 'Sudan': '🇸🇩',
  'Suriname': '🇸🇷', 'Sweden': '🇸🇪', 'Switzerland': '🇨🇭', 'Syria': '🇸🇾',
  'Taiwan': '🇹🇼', 'Tajikistan': '🇹🇯', 'Tanzania': '🇹🇿', 'Thailand': '🇹🇭',
  'Timor-Leste': '🇹🇱', 'Togo': '🇹🇬', 'Tonga': '🇹🇴', 'Trinidad and Tobago': '🇹🇹',
  'Tunisia': '🇹🇳', 'Turkey': '🇹🇷', 'Turkmenistan': '🇹🇲', 'Tuvalu': '🇹🇻',
  'Uganda': '🇺🇬', 'Ukraine': '🇺🇦', 'United Arab Emirates': '🇦🇪', 'United Kingdom': '🇬🇧',
  'United States': '🇺🇸', 'Uruguay': '🇺🇾', 'Uzbekistan': '🇺🇿', 'Vanuatu': '🇻🇺',
  'Vatican City': '🇻🇦', 'Venezuela': '🇻🇪', 'Vietnam': '🇻🇳', 'Yemen': '🇾🇪',
  'Zambia': '🇿🇲', 'Zimbabwe': '🇿🇼'
};

interface CountrySelectorProps {
  value: string[];
  onChange: (countries: string[]) => void;
  error?: string;
  required?: boolean;
  className?: string;
  label?: string;
}

const CountrySelector: React.FC<CountrySelectorProps> = ({
  value = [],
  onChange,
  error,
  required = false,
  className = '',
  label
}) => {
  const { i18n } = useTranslation();
  const [countrySearch, setCountrySearch] = useState('');
  const [showCountrySuggestions, setShowCountrySuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLanguage = i18n.language as 'en' | 'th';

  const content = {
    th: {
      searchCountry: "ค้นหาประเทศ...",
      selectedCountries: "ประเทศที่เลือก:",
      addCountry: "เพิ่มประเทศ",
      removeCountry: "ลบประเทศ"
    },
    en: {
      searchCountry: "Search country...",
      selectedCountries: "Selected Countries:",
      addCountry: "Add Country",
      removeCountry: "Remove Country"
    }
  };

  const currentContent = content[currentLanguage];

  // Filter countries based on search
  const filteredCountries = COUNTRIES.filter(country =>
    country.toLowerCase().includes(countrySearch.toLowerCase()) &&
    !value.includes(country)
  ).slice(0, 10); // Show top 10 matches

  // Enhanced blur handling with delay
  const handleInputBlur = () => {
    setTimeout(() => {
      setShowCountrySuggestions(false);
    }, 200);
  };

  // Prevent blur when clicking dropdown items
  const handleDropdownMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  // Handle country selection
  const handleCountrySelect = (country: string) => {
    if (!value.includes(country)) {
      onChange([...value, country]);
    }
    setCountrySearch('');
    setShowCountrySuggestions(false);
  };

  // Handle country removal
  const handleCountryRemove = (countryToRemove: string) => {
    onChange(value.filter(country => country !== countryToRemove));
  };

  // Handle country search input change
  const handleCountrySearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchValue = e.target.value;
    setCountrySearch(searchValue);
    setShowCountrySuggestions(true);
  };

  // Handle input focus
  const handleInputFocus = () => {
    setShowCountrySuggestions(true);
  };

  // Click outside detection
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowCountrySuggestions(false);
      }
    };

    if (showCountrySuggestions) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCountrySuggestions]);

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

      {/* Country Search Input */}
      <div className="relative mb-4" style={{ zIndex: 1000, overflow: 'visible' }}>
        <input
          type="text"
          ref={inputRef}
          value={countrySearch}
          onChange={handleCountrySearchChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder={currentContent.searchCountry}
          autoComplete="off"
          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:border-[#FCB283] focus:outline-none transition-colors"
        />
        
        {/* Country Suggestions */}
        {showCountrySuggestions && countrySearch && filteredCountries.length > 0 && (
          <div 
            ref={dropdownRef}
            className="absolute left-0 right-0 mt-1 bg-gray-900/95 backdrop-blur-lg border border-white/20 rounded-lg shadow-2xl overflow-hidden"
            style={{ 
              zIndex: 9999,
              maxHeight: '240px',
              overflowY: 'auto',
              top: '100%',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(20px)'
            }}
          >
            {filteredCountries.map((country, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleCountrySelect(country)}
                onMouseDown={handleDropdownMouseDown}
                className="w-full text-left px-4 py-3 hover:bg-white/10 active:bg-white/20 transition-colors text-white flex items-center space-x-3 border-none focus:outline-none focus:bg-white/10"
              >
                <span className="text-lg">{countryFlags[country] || '🏳️'}</span>
                <span>{country}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected Countries Display */}
      {value.length > 0 && (
        <div className="mt-4">
          <p className="text-white/70 text-sm mb-2">
            {currentContent.selectedCountries}
          </p>
          <div className="flex flex-wrap gap-2 mb-3">
            {value.map((country) => (
              <span
                key={country}
                className="inline-flex items-center space-x-2 px-3 py-1 bg-[#FCB283]/20 text-[#FCB283] rounded-full text-sm border border-[#FCB283]/30"
              >
                <span>{countryFlags[country] || '🏳️'}</span>
                <span>{country}</span>
                <button
                  type="button"
                  onClick={() => handleCountryRemove(country)}
                  className="ml-1 text-[#FCB283] hover:text-white transition-colors text-sm font-bold"
                  title={currentContent.removeCountry}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          
          {/* Country count indicator */}
          <p className="text-xs text-white/50">
            {value.length} {currentLanguage === 'th' ? 'ประเทศที่เลือก' : 'countries selected'}
          </p>
        </div>
      )}
    </div>
  );
};

export default CountrySelector;
