import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { registrationService } from '../../services/registrationService';
import {
  ParticipantsListProps,
  ActivityRegistration,
  RegistrationFilters,
  AttendanceStatus,
  ATTENDANCE_STATUS_OPTIONS,
  DEFAULT_REGISTRATION_FILTERS
} from '../../types/registration.types';

const ParticipantsList: React.FC<ParticipantsListProps> = ({
  activityId,
  activityName,
  onRegistrationUpdate,
  className = ''
}) => {
  const { t, i18n } = useTranslation();
  const [registrations, setRegistrations] = useState<ActivityRegistration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<RegistrationFilters>(DEFAULT_REGISTRATION_FILTERS);
  const [selectedRegistrations, setSelectedRegistrations] = useState<Set<string>>(new Set());
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const pageSize = 20;

  // Load registrations
  const loadRegistrations = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await registrationService.getActivityRegistrations(
        activityId,
        filters,
        currentPage,
        pageSize
      );

      setRegistrations(result.registrations);
      setTotalPages(result.totalPages);
      setTotalCount(result.total);
      setSelectedRegistrations(new Set());

    } catch (error) {
      console.error('❌ Error loading registrations:', error);
      setError(t('admin.participants.errors.loadFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  // Load registrations on mount and when filters change
  useEffect(() => {
    loadRegistrations();
  }, [activityId, filters, currentPage]);

  // Handle filter changes
  const handleFilterChange = (newFilters: Partial<RegistrationFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  };

  // Handle search
  const handleSearch = (searchTerm: string) => {
    handleFilterChange({ search: searchTerm });
  };

  // Handle status filter
  const handleStatusFilter = (status: AttendanceStatus | undefined) => {
    handleFilterChange({ status });
  };

  // Handle sort change
  const handleSortChange = (sortBy: RegistrationFilters['sortBy'], sortOrder: RegistrationFilters['sortOrder']) => {
    handleFilterChange({ sortBy, sortOrder });
  };

  // Handle individual registration selection
  const handleRegistrationSelect = (registrationId: string, selected: boolean) => {
    const newSelected = new Set(selectedRegistrations);
    if (selected) {
      newSelected.add(registrationId);
    } else {
      newSelected.delete(registrationId);
    }
    setSelectedRegistrations(newSelected);
  };

  // Handle select all
  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedRegistrations(new Set(registrations.map(reg => reg.id)));
    } else {
      setSelectedRegistrations(new Set());
    }
  };

  // Handle individual status update
  const handleStatusUpdate = async (registrationId: string, newStatus: AttendanceStatus) => {
    try {
      setIsUpdating(true);
      await registrationService.updateRegistrationStatus(activityId, registrationId, newStatus);
      
      // Update local state
      setRegistrations(prev => 
        prev.map(reg => 
          reg.id === registrationId 
            ? { ...reg, status: newStatus }
            : reg
        )
      );

      // Call callback
      if (onRegistrationUpdate) {
        onRegistrationUpdate();
      }

    } catch (error) {
      console.error('❌ Error updating registration status:', error);
      setError(t('admin.participants.errors.updateFailed'));
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle bulk status update
  const handleBulkStatusUpdate = async (newStatus: AttendanceStatus) => {
    if (selectedRegistrations.size === 0) {
      return;
    }

    try {
      setIsUpdating(true);
      const registrationIds = Array.from(selectedRegistrations);
      
      await registrationService.bulkUpdateStatus(activityId, registrationIds, newStatus);
      
      // Update local state
      setRegistrations(prev => 
        prev.map(reg => 
          selectedRegistrations.has(reg.id)
            ? { ...reg, status: newStatus }
            : reg
        )
      );

      setSelectedRegistrations(new Set());

      // Call callback
      if (onRegistrationUpdate) {
        onRegistrationUpdate();
      }

    } catch (error) {
      console.error('❌ Error bulk updating registration status:', error);
      setError(t('admin.participants.errors.bulkUpdateFailed'));
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle export
  const handleExport = async (format: 'csv' | 'xlsx') => {
    try {
      setIsUpdating(true);
      const blob = await registrationService.exportRegistrations(activityId, format, filters);
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${activityName}_participants.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('❌ Error exporting registrations:', error);
      setError(t('admin.participants.errors.exportFailed'));
    } finally {
      setIsUpdating(false);
    }
  };

  // Format date for display
  const formatDate = (timestamp: any) => {
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    const locale = i18n.language === 'th' ? 'th-TH' : 'en-US';
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status display info
  const getStatusInfo = (status: AttendanceStatus) => {
    return ATTENDANCE_STATUS_OPTIONS.find(option => option.value === status) || ATTENDANCE_STATUS_OPTIONS[0];
  };

  return (
    <div className={`bg-white rounded-lg shadow-md ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {t('admin.participants.title')}
          </h3>
          <div className="text-sm text-gray-600">
            {t('admin.participants.totalCount', { count: totalCount })}
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder={t('admin.participants.searchPlaceholder')}
              value={filters.search || ''}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={filters.status || ''}
              onChange={(e) => handleStatusFilter(e.target.value as AttendanceStatus || undefined)}
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">{t('admin.participants.allStatuses')}</option>
              {ATTENDANCE_STATUS_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {i18n.language === 'th' ? option.labelTh : option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Export */}
          <div className="flex gap-2">
            <button
              onClick={() => handleExport('csv')}
              disabled={isUpdating}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('admin.participants.exportCsv')}
            </button>
            <button
              onClick={() => handleExport('xlsx')}
              disabled={isUpdating}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('admin.participants.exportExcel')}
            </button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedRegistrations.size > 0 && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-700">
                {t('admin.participants.selectedCount', { count: selectedRegistrations.size })}
              </span>
              <div className="flex gap-2">
                {ATTENDANCE_STATUS_OPTIONS.map(option => (
                  <button
                    key={option.value}
                    onClick={() => handleBulkStatusUpdate(option.value)}
                    disabled={isUpdating}
                    className={`px-3 py-1 rounded text-xs font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                      option.color === 'green'
                        ? 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'
                        : option.color === 'blue'
                        ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
                        : 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
                    }`}
                  >
                    {t('admin.participants.markAs')} {i18n.language === 'th' ? option.labelTh : option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border-b border-red-200">
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

      {/* Loading State */}
      {isLoading ? (
        <div className="p-8 text-center">
          <div className="inline-flex items-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {t('admin.participants.loading')}
          </div>
        </div>
      ) : registrations.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p>{t('admin.participants.noRegistrations')}</p>
        </div>
      ) : (
        <>
          {/* Participants Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedRegistrations.size === registrations.length && registrations.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin.participants.columns.name')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin.participants.columns.email')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin.participants.columns.phone')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin.participants.columns.organization')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin.participants.columns.status')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin.participants.columns.registeredAt')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin.participants.columns.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {registrations.map((registration) => {
                  const statusInfo = getStatusInfo(registration.status);
                  return (
                    <tr key={registration.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedRegistrations.has(registration.id)}
                          onChange={(e) => handleRegistrationSelect(registration.id, e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {registration.participantName}
                          </div>
                          {registration.participantNameEn && (
                            <div className="text-sm text-gray-500">
                              {registration.participantNameEn}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {registration.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {registration.phone}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {registration.organization || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          statusInfo.color === 'green'
                            ? 'bg-green-100 text-green-800'
                            : statusInfo.color === 'blue'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {i18n.language === 'th' ? statusInfo.labelTh : statusInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(registration.registeredAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <select
                          value={registration.status}
                          onChange={(e) => handleStatusUpdate(registration.id, e.target.value as AttendanceStatus)}
                          disabled={isUpdating}
                          className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {ATTENDANCE_STATUS_OPTIONS.map(option => (
                            <option key={option.value} value={option.value}>
                              {i18n.language === 'th' ? option.labelTh : option.label}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  {t('admin.participants.pagination.showing', {
                    start: (currentPage - 1) * pageSize + 1,
                    end: Math.min(currentPage * pageSize, totalCount),
                    total: totalCount
                  })}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t('admin.participants.pagination.previous')}
                  </button>
                  <span className="px-3 py-2 text-sm text-gray-700">
                    {t('admin.participants.pagination.pageOf', { current: currentPage, total: totalPages })}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t('admin.participants.pagination.next')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ParticipantsList;
