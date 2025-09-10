import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { trackingService } from '../../services/trackingService';
import {
  RegistrationTrackerProps,
  TrackingResult
} from '../../types/registration.types';

const RegistrationTracker: React.FC<RegistrationTrackerProps> = ({
  onTrackingResult,
  className = ''
}) => {
  const { t, i18n } = useTranslation();
  const [searchType, setSearchType] = useState<'code' | 'email'>('code');
  const [searchValue, setSearchValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<TrackingResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Handle search
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!searchValue.trim()) {
      setError(t('tracking.errors.emptySearch'));
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults([]);

    try {
      let searchResults: TrackingResult[] = [];

      if (searchType === 'code') {
        const result = await trackingService.getRegistrationByTrackingCode(searchValue.trim());
        searchResults = [result];
      } else {
        searchResults = await trackingService.getRegistrationsByEmail(searchValue.trim());
      }

      setResults(searchResults);

      // Call callback if provided
      if (onTrackingResult && searchResults.length > 0 && searchResults[0].found) {
        onTrackingResult(searchResults[0]);
      }

    } catch (error) {
      console.error('❌ Tracking search error:', error);
      setError(t('tracking.errors.searchFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  // Clear results
  const handleClear = () => {
    setSearchValue('');
    setResults([]);
    setError(null);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const locale = i18n.language === 'th' ? 'th-TH' : 'en-US';
    return date.toLocaleDateString(locale, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Format time for display
  const formatTime = (timeString: string) => {
    return timeString;
  };

  // Get status display info
  const getStatusInfo = (status: string) => {
    return trackingService.getStatusDisplayInfo(status, i18n.language as 'en' | 'th');
  };

  return (
    <div className={`max-w-4xl mx-auto ${className}`}>
      {/* Search Form */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {t('tracking.title')}
        </h2>

        <form onSubmit={handleSearch} className="space-y-4">
          {/* Search Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              {t('tracking.searchType')}
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="code"
                  checked={searchType === 'code'}
                  onChange={(e) => setSearchType(e.target.value as 'code' | 'email')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">
                  {t('tracking.byTrackingCode')}
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="email"
                  checked={searchType === 'email'}
                  onChange={(e) => setSearchType(e.target.value as 'code' | 'email')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">
                  {t('tracking.byEmail')}
                </span>
              </label>
            </div>
          </div>

          {/* Search Input */}
          <div>
            <label htmlFor="searchValue" className="block text-sm font-medium text-gray-700 mb-2">
              {searchType === 'code' 
                ? t('tracking.trackingCodeLabel') 
                : t('tracking.emailLabel')
              }
            </label>
            <div className="flex space-x-3">
              <input
                type={searchType === 'email' ? 'email' : 'text'}
                id="searchValue"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={searchType === 'code' 
                  ? t('tracking.trackingCodePlaceholder')
                  : t('tracking.emailPlaceholder')
                }
                disabled={isLoading}
                maxLength={searchType === 'code' ? 8 : 255}
              />
              <button
                type="submit"
                disabled={isLoading || !searchValue.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t('tracking.searching')}
                  </div>
                ) : (
                  t('tracking.search')
                )}
              </button>
              {(results.length > 0 || error) && (
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={isLoading}
                  className="px-4 py-2 border border-gray-300 rounded-md font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('tracking.clear')}
                </button>
              )}
            </div>
          </div>
        </form>

        {/* Search Instructions */}
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-blue-800">
                {t('tracking.instructions.title')}
              </h4>
              <div className="mt-1 text-sm text-blue-700">
                <p>{t('tracking.instructions.trackingCode')}</p>
                <p className="mt-1">{t('tracking.instructions.email')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Results Display */}
      {results.length > 0 && (
        <div className="space-y-4">
          {results.map((result, index) => (
            <div key={index}>
              {result.found && result.registration && result.activity ? (
                <div className="bg-white rounded-lg shadow-md p-6">
                  {/* Registration Header */}
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {t('tracking.result.registrationFound')}
                    </h3>
                    <div className="flex items-center">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        getStatusInfo(result.registration.status).color === 'green' 
                          ? 'bg-green-100 text-green-800'
                          : getStatusInfo(result.registration.status).color === 'blue'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {getStatusInfo(result.registration.status).label}
                      </span>
                    </div>
                  </div>

                  {/* Registration Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Participant Information */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">
                        {t('tracking.result.participantInfo')}
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-gray-600">{t('tracking.result.name')}:</span>
                          <span className="ml-2 font-medium text-gray-900">
                            {result.registration.participantName}
                          </span>
                        </div>
                        {result.registration.participantNameEn && (
                          <div>
                            <span className="text-gray-600">{t('tracking.result.nameEn')}:</span>
                            <span className="ml-2 font-medium text-gray-900">
                              {result.registration.participantNameEn}
                            </span>
                          </div>
                        )}
                        <div>
                          <span className="text-gray-600">{t('tracking.result.email')}:</span>
                          <span className="ml-2 font-medium text-gray-900">
                            {result.registration.email}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">{t('tracking.result.phone')}:</span>
                          <span className="ml-2 font-medium text-gray-900">
                            {result.registration.phone}
                          </span>
                        </div>
                        {result.registration.organization && (
                          <div>
                            <span className="text-gray-600">{t('tracking.result.organization')}:</span>
                            <span className="ml-2 font-medium text-gray-900">
                              {result.registration.organization}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Activity Information */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">
                        {t('tracking.result.activityInfo')}
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-gray-600">{t('tracking.result.activityName')}:</span>
                          <span className="ml-2 font-medium text-gray-900">
                            {result.activity.name}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">{t('tracking.result.eventDate')}:</span>
                          <span className="ml-2 font-medium text-gray-900">
                            {formatDate(result.activity.eventDate)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">{t('tracking.result.eventTime')}:</span>
                          <span className="ml-2 font-medium text-gray-900">
                            {formatTime(result.activity.startTime)} - {formatTime(result.activity.endTime)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">{t('tracking.result.venue')}:</span>
                          <span className="ml-2 font-medium text-gray-900">
                            {result.activity.venueName}
                          </span>
                        </div>
                        {result.activity.venueLocation && (
                          <div>
                            <span className="text-gray-600">{t('tracking.result.location')}:</span>
                            <span className="ml-2 font-medium text-gray-900">
                              {result.activity.venueLocation}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Registration Metadata */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <span>{t('tracking.result.trackingCode')}:</span>
                        <span className="ml-2 font-mono font-bold text-blue-600">
                          {result.registration.trackingCode}
                        </span>
                      </div>
                      <div>
                        <span>{t('tracking.result.registeredAt')}:</span>
                        <span className="ml-2">
                          {result.registration.registeredAt.toDate().toLocaleDateString(
                            i18n.language === 'th' ? 'th-TH' : 'en-US',
                            {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            }
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status Description */}
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">
                      {getStatusInfo(result.registration.status).description}
                    </p>
                  </div>

                  {/* Additional Notes */}
                  {result.registration.additionalNotes && (
                    <div className="mt-4">
                      <h5 className="font-medium text-gray-900 mb-2">
                        {t('tracking.result.additionalNotes')}
                      </h5>
                      <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">
                        {result.registration.additionalNotes}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-600">
                        {result.error || t('tracking.result.notFound')}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RegistrationTracker;
