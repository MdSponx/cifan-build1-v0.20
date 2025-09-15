import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Eye, 
  Edit, 
  Trash2, 
  Plus, 
  Search,
  Filter,
  Clock,
  Globe,
  EyeOff,
  MoreHorizontal,
  Copy,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  AlertCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { Activity, ActivityFilters, ActivitySortOptions } from '../../types/activities';
import { useTypography } from '../../utils/typography';
import { getTagColor } from '../../utils/tagColors';
import { activitiesService } from '../../services/activitiesService';
import { useAuth } from '../auth/AuthContext';
import { useNotificationHelpers } from '../ui/NotificationContext';
import DeleteConfirmationModal from '../ui/DeleteConfirmationModal';

const statusColors = {
  draft: 'bg-gray-100 text-gray-800',
  published: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  completed: 'bg-blue-100 text-blue-800'
};

const statusLabels = {
  draft: 'Draft',
  published: 'Published',
  cancelled: 'Cancelled',
  completed: 'Completed'
};

interface PaginationState {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

interface FiltersState {
  search: string;
  status: string;
  isPublic: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface ActivitiesListViewProps {
  activities?: Activity[];
  filter?: string | null;
  onNavigate?: (route: string) => void;
  onRefresh?: () => void;
  onActivityDuplicated?: (activity: Activity) => void;
  isLoading?: boolean;
}

export default function ActivitiesListView({
  activities: propActivities,
  filter,
  onNavigate,
  onRefresh,
  onActivityDuplicated,
  isLoading: propIsLoading = false
}: ActivitiesListViewProps = {}) {
  const { getClass } = useTypography();
  const { user } = useAuth();
  const { showLoading, updateToSuccess, updateToError } = useNotificationHelpers();

  // State management
  const [allActivities, setAllActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedActivities, setSelectedActivities] = useState<Set<string>>(new Set());

  // Delete confirmation modal state
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    type: 'single' | 'bulk';
    activityId?: string;
    activityName?: string;
    count?: number;
    isProcessing: boolean;
  }>({
    isOpen: false,
    type: 'single',
    isProcessing: false
  });

  // Pagination state - Default to 20 items per page
  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20
  });

  // Filters state
  const [filters, setFilters] = useState<FiltersState>({
    search: '',
    status: 'all',
    isPublic: 'all',
    sortBy: 'eventDate',
    sortOrder: 'asc'
  });

  // Load activities on mount or when propActivities changes
  useEffect(() => {
    if (propActivities && propActivities.length > 0) {
      console.log('📊 Using prop activities:', propActivities.length);
      setAllActivities(propActivities);
      setPagination(prev => ({
        ...prev,
        totalItems: propActivities.length,
        totalPages: Math.ceil(propActivities.length / prev.itemsPerPage)
      }));
    } else {
      console.log('📡 Loading activities from service...');
      loadActivities();
    }
  }, [propActivities]);

  // Load activities when authentication changes
  useEffect(() => {
    if (user) {
      console.log('🔍 AdminActivitiesListView: User authenticated, loading activities');
      loadActivities();
    } else {
      console.log('⚠️ AdminActivitiesListView: No user, clearing activities');
      setAllActivities([]);
      setError('Authentication required. Please log in as an admin.');
    }
  }, [user]);

  // Load activities from service
  const loadActivities = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (!user) {
        console.warn('⚠️ AdminActivitiesListView: No authenticated user found');
        setError('Authentication required. Please log in as an admin.');
        return;
      }
      
      console.log('🔍 AdminActivitiesListView: Fetching ALL activities using getAllActivities()...');
      
      const allActivitiesData = await activitiesService.getAllActivities();
      
      console.log('✅ AdminActivitiesListView: Loaded activities using getAllActivities():', {
        totalCount: allActivitiesData.length,
        statusBreakdown: {
          published: allActivitiesData.filter(a => a.status === 'published').length,
          draft: allActivitiesData.filter(a => a.status === 'draft').length,
          cancelled: allActivitiesData.filter(a => a.status === 'cancelled').length,
          completed: allActivitiesData.filter(a => a.status === 'completed').length
        }
      });
      
      setAllActivities(allActivitiesData);
      setPagination(prev => ({
        ...prev,
        totalItems: allActivitiesData.length,
        totalPages: Math.ceil(allActivitiesData.length / prev.itemsPerPage)
      }));
    } catch (err) {
      console.error('❌ AdminActivitiesListView: Error loading activities:', err);
      
      if (err instanceof Error) {
        if (err.message.includes('permission-denied') || err.message.includes('Missing or insufficient permissions')) {
          setError('Admin authentication required. Please log in with admin credentials.');
        } else if (err.message.includes('Authentication required')) {
          setError('Please log in as an admin to view all activities.');
        } else {
          setError(err.message);
        }
      } else {
        setError('Failed to load activities');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Apply filters and sorting
  const filteredAndSortedActivities = useMemo(() => {
    console.log('🔄 Applying filters and sorting...', {
      totalActivities: allActivities.length,
      filters
    });

    let result = [...allActivities];

    // Apply search filter
    if (filters.search.trim()) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(activity =>
        activity.name.toLowerCase().includes(searchLower) ||
        activity.shortDescription.toLowerCase().includes(searchLower) ||
        (activity.description || '').toLowerCase().includes(searchLower) ||
        activity.venueName.toLowerCase().includes(searchLower) ||
        activity.organizers.some(org => org.toLowerCase().includes(searchLower)) ||
        activity.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // Apply status filter
    if (filters.status !== 'all') {
      result = result.filter(activity => activity.status === filters.status);
    }

    // Apply public/private filter
    if (filters.isPublic !== 'all') {
      const isPublic = filters.isPublic === 'public';
      result = result.filter(activity => activity.isPublic === isPublic);
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      
      switch (filters.sortBy) {
        case 'eventDate':
          comparison = a.eventDate.localeCompare(b.eventDate);
          if (comparison === 0) {
            comparison = a.startTime.localeCompare(b.startTime);
          }
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'views':
          comparison = (a.views || 0) - (b.views || 0);
          break;
        default:
          comparison = a.eventDate.localeCompare(b.eventDate);
      }
      
      return filters.sortOrder === 'desc' ? -comparison : comparison;
    });

    console.log('✅ Filtered and sorted:', result.length, 'activities');
    return result;
  }, [allActivities, filters]);

  // Apply pagination
  const paginatedActivities = useMemo(() => {
    const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
    const endIndex = startIndex + pagination.itemsPerPage;
    const result = filteredAndSortedActivities.slice(startIndex, endIndex);
    
    // Update pagination totals
    const totalPages = Math.ceil(filteredAndSortedActivities.length / pagination.itemsPerPage);
    setPagination(prev => ({
      ...prev,
      totalItems: filteredAndSortedActivities.length,
      totalPages
    }));

    return result;
  }, [filteredAndSortedActivities, pagination.currentPage, pagination.itemsPerPage]);

  // Handle filter changes
  const handleFilterChange = (key: keyof FiltersState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 })); // Reset to first page
  };

  // Handle sorting
  const handleSort = (field: string) => {
    setFilters(prev => ({
      ...prev,
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Handle page changes
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, currentPage: newPage }));
    }
  };

  // Handle page size change
  const handlePageSizeChange = (newPageSize: number) => {
    setPagination(prev => ({
      ...prev,
      itemsPerPage: newPageSize,
      currentPage: 1 // Reset to first page
    }));
  };

  // Selection handlers
  const handleSelectActivity = (activityId: string) => {
    const newSelected = new Set(selectedActivities);
    if (newSelected.has(activityId)) {
      newSelected.delete(activityId);
    } else {
      newSelected.add(activityId);
    }
    setSelectedActivities(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedActivities.size === paginatedActivities.length) {
      setSelectedActivities(new Set());
    } else {
      setSelectedActivities(new Set(paginatedActivities.map(a => a.id)));
    }
  };

  // Activity action handlers
  const handleViewActivity = (activityId: string) => {
    window.location.hash = `#activity/${activityId}`;
  };

  const handleEditActivity = (activityId: string) => {
    onNavigate?.(`admin/activities/edit/${activityId}`);
  };

  // Delete confirmation modal handlers
  const openDeleteModal = (activityId: string, activityName: string) => {
    setDeleteModal({
      isOpen: true,
      type: 'single',
      activityId,
      activityName,
      isProcessing: false
    });
  };

  const openBulkDeleteModal = () => {
    if (selectedActivities.size === 0) return;
    
    setDeleteModal({
      isOpen: true,
      type: 'bulk',
      count: selectedActivities.size,
      isProcessing: false
    });
  };

  const closeDeleteModal = () => {
    if (deleteModal.isProcessing) return; // Prevent closing during processing
    
    setDeleteModal({
      isOpen: false,
      type: 'single',
      isProcessing: false
    });
  };

  const handleDeleteActivity = async (activityId: string) => {
    setDeleteModal(prev => ({ ...prev, isProcessing: true }));
    
    try {
      await activitiesService.deleteActivity(activityId);
      setAllActivities(prev => prev.filter(a => a.id !== activityId));
      setSelectedActivities(prev => {
        const newSet = new Set(prev);
        newSet.delete(activityId);
        return newSet;
      });
      
      closeDeleteModal();
      // Note: We don't show success notification here as the modal handles the UX
    } catch (error) {
      console.error('Error deleting activity:', error);
      setDeleteModal(prev => ({ ...prev, isProcessing: false }));
      // The modal will show the error state
    }
  };

  const handleDuplicateActivity = async (activityId: string) => {
    if (!user?.uid) {
      console.error('User not authenticated');
      return;
    }

    const notificationId = showLoading('Duplicating activity...', 'Creating a copy');

    try {
      const duplicatedActivity = await activitiesService.duplicateActivity(activityId, user.uid);
      setAllActivities(prev => [duplicatedActivity, ...prev]);
      
      updateToSuccess(
        notificationId,
        'Activity duplicated successfully',
        `"${duplicatedActivity.name}" has been created as a draft`
      );

      onActivityDuplicated?.(duplicatedActivity);
    } catch (error) {
      console.error('Error duplicating activity:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to duplicate activity';
      updateToError(notificationId, 'Failed to duplicate activity', errorMessage);
    }
  };

  const handleBulkDelete = async () => {
    setDeleteModal(prev => ({ ...prev, isProcessing: true }));
    
    try {
      await activitiesService.bulkDeleteActivities(Array.from(selectedActivities));
      setAllActivities(prev => prev.filter(a => !selectedActivities.has(a.id)));
      setSelectedActivities(new Set());
      
      closeDeleteModal();
      // Note: We don't show success notification here as the modal handles the UX
    } catch (error) {
      console.error('Error bulk deleting activities:', error);
      setDeleteModal(prev => ({ ...prev, isProcessing: false }));
      // The modal will show the error state
    }
  };

  const handleConfirmDelete = () => {
    if (deleteModal.type === 'single' && deleteModal.activityId) {
      handleDeleteActivity(deleteModal.activityId);
    } else if (deleteModal.type === 'bulk') {
      handleBulkDelete();
    }
  };

  // Utility functions
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5);
  };

  const getSortIcon = (field: string) => {
    if (filters.sortBy !== field) {
      return <ArrowUpDown className="w-4 h-4 text-white/40" />;
    }
    return filters.sortOrder === 'asc' 
      ? <ArrowUp className="w-4 h-4 text-[#FCB283]" />
      : <ArrowDown className="w-4 h-4 text-[#FCB283]" />;
  };

  // Loading state
  if (isLoading || propIsLoading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-center min-h-96">
          <div className="glass-container rounded-xl p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#FCB283] mx-auto mb-4" />
            <p className={`${getClass('body')} text-white/80`}>Loading activities...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-center min-h-96">
          <div className="glass-container rounded-xl p-8 text-center max-w-md">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Error Loading Activities</h3>
            <p className="text-white/70 mb-6">{error}</p>
            <button
              onClick={loadActivities}
              className="px-6 py-3 bg-gradient-to-r from-[#AA4626] to-[#FCB283] text-white rounded-lg hover:from-[#AA4626]/90 hover:to-[#FCB283]/90 transition-all duration-300 flex items-center gap-2 mx-auto"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6">

      {/* Filters and Search */}
      <div className="glass-container rounded-xl p-6 mb-8">
        <div className="flex flex-col lg:flex-row gap-4 mb-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search activities..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-white/20 bg-white/10 text-white placeholder-white/60 rounded-lg focus:ring-2 focus:ring-[#FCB283] focus:border-[#FCB283] transition-all backdrop-blur-sm"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-4 h-4" />
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="pl-10 pr-8 py-2.5 border border-white/20 bg-white/10 text-white rounded-lg focus:ring-2 focus:ring-[#FCB283] focus:border-[#FCB283] transition-all appearance-none backdrop-blur-sm"
            >
              <option value="all" className="bg-gray-800 text-white">All Status</option>
              <option value="draft" className="bg-gray-800 text-white">Draft</option>
              <option value="published" className="bg-gray-800 text-white">Published</option>
              <option value="cancelled" className="bg-gray-800 text-white">Cancelled</option>
              <option value="completed" className="bg-gray-800 text-white">Completed</option>
            </select>
          </div>

          {/* Public/Private Filter */}
          <div>
            <select
              value={filters.isPublic}
              onChange={(e) => handleFilterChange('isPublic', e.target.value)}
              className="px-4 py-2.5 border border-white/20 bg-white/10 text-white rounded-lg focus:ring-2 focus:ring-[#FCB283] focus:border-[#FCB283] transition-all appearance-none backdrop-blur-sm"
            >
              <option value="all" className="bg-gray-800 text-white">All Visibility</option>
              <option value="public" className="bg-gray-800 text-white">Public</option>
              <option value="private" className="bg-gray-800 text-white">Private</option>
            </select>
          </div>
        </div>

        {/* Page Size Selector and Results Info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm text-white/70">Items per page:</span>
            <select
              value={pagination.itemsPerPage}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className="px-3 py-1.5 border border-white/20 bg-white/10 text-white rounded-lg focus:ring-2 focus:ring-[#FCB283] focus:border-[#FCB283] transition-all appearance-none backdrop-blur-sm"
            >
              <option value={20} className="bg-gray-800 text-white">20</option>
              <option value={40} className="bg-gray-800 text-white">40</option>
              <option value={60} className="bg-gray-800 text-white">60</option>
              <option value={100} className="bg-gray-800 text-white">100</option>
            </select>
          </div>
          
          <div className="text-sm text-white/70">
            Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1}-{Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of {pagination.totalItems} activities
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedActivities.size > 0 && (
          <div className="mt-4 p-3 bg-[#FCB283]/20 border border-[#FCB283]/30 rounded-lg flex items-center justify-between">
            <span className={`text-sm text-[#FCB283] font-medium ${getClass('body')}`}>
              {selectedActivities.size} activities selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={openBulkDeleteModal}
                className="px-3 py-1.5 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
              >
                Delete Selected
              </button>
              <button
                onClick={() => setSelectedActivities(new Set())}
                className="px-3 py-1.5 bg-white/20 text-white text-sm rounded hover:bg-white/30 transition-colors"
              >
                Clear Selection
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Activities Table */}
      <div className="glass-container rounded-xl overflow-hidden">
        {paginatedActivities.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-white/40 mb-4">
              <Calendar className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No activities found</h3>
            <p className="text-white/70 mb-6">
              {filters.search || filters.status !== 'all' || filters.isPublic !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Create your first activity to get started'
              }
            </p>
            {!filters.search && filters.status === 'all' && filters.isPublic === 'all' && (
              <button 
                onClick={() => onNavigate?.('admin/activities/create')}
                className="px-6 py-3 bg-gradient-to-r from-[#AA4626] to-[#FCB283] text-white rounded-lg hover:from-[#AA4626]/90 hover:to-[#FCB283]/90 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
              >
                Create First Activity
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div className="bg-white/5 border-b border-white/10">
              <div className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedActivities.size === paginatedActivities.length && paginatedActivities.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-[#FCB283] border-white/30 bg-white/10 rounded focus:ring-[#FCB283]"
                  />
                  <span className={`text-sm text-white/80 font-medium ${getClass('body')}`}>
                    Select All ({paginatedActivities.length} on this page)
                  </span>
                </div>
              </div>
            </div>

            {/* Table Headers */}
            <div className="bg-white/5 border-b border-white/10">
              <div className="grid grid-cols-12 gap-4 px-6 py-3 text-sm font-medium text-white/80">
                <div className="col-span-1"></div> {/* Checkbox column */}
                <div className="col-span-3">
                  <button
                    onClick={() => handleSort('name')}
                    className="flex items-center gap-2 hover:text-[#FCB283] transition-colors"
                  >
                    Activity Name
                    {getSortIcon('name')}
                  </button>
                </div>
                <div className="col-span-2">
                  <button
                    onClick={() => handleSort('eventDate')}
                    className="flex items-center gap-2 hover:text-[#FCB283] transition-colors"
                  >
                    Date & Time
                    {getSortIcon('eventDate')}
                  </button>
                </div>
                <div className="col-span-2">Venue</div>
                <div className="col-span-1">Status</div>
                <div className="col-span-1">Visibility</div>
                <div className="col-span-1">Participants</div>
                <div className="col-span-1">Actions</div>
              </div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-white/10">
              {paginatedActivities.map((activity) => (
                <div key={activity.id} className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-white/5 transition-colors">
                  {/* Checkbox */}
                  <div className="col-span-1 flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedActivities.has(activity.id)}
                      onChange={() => handleSelectActivity(activity.id)}
                      className="w-4 h-4 text-[#FCB283] border-white/30 bg-white/10 rounded focus:ring-[#FCB283]"
                    />
                  </div>

                  {/* Activity Name */}
                  <div className="col-span-3">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-white/10 flex-shrink-0">
                        <img
                          src={activity.image || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjI0MCIgdmlld0JveD0iMCAwIDQwMCAyNDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMjQwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNzUgOTBMMTg1IDEwNUwyMDUgODVMMjI1IDExMEgyNTVWMTMwSDEyNVYxMTBMMTQwIDk1TDE3NSA5MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+'}
                          alt={activity.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjI0MCIgdmlld0JveD0iMCAwIDQwMCAyNDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMjQwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNzUgOTBMMTg1IDEwNUwyMDUgODVMMjI1IDExMEgyNTVWMTMwSDEyNVYxMTBMMTQwIDk1TDE3NSA5MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+';
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={`text-sm font-semibold text-white mb-1 truncate ${getClass('header')}`}>
                          {activity.name}
                        </h3>
                        <p className={`text-xs text-white/70 line-clamp-2 ${getClass('body')}`}>
                          {activity.shortDescription}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Date & Time */}
                  <div className="col-span-2">
                    <div className="text-sm text-white">
                      {formatDate(activity.eventDate)}
                    </div>
                    <div className="text-xs text-white/70">
                      {formatTime(activity.startTime)} - {formatTime(activity.endTime)}
                    </div>
                  </div>

                  {/* Venue */}
                  <div className="col-span-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3 h-3 text-[#FCB283] flex-shrink-0" />
                      <span className="text-sm text-white/80 truncate">{activity.venueName}</span>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="col-span-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[activity.status]}`}>
                      {statusLabels[activity.status]}
                    </span>
                  </div>

                  {/* Visibility */}
                  <div className="col-span-1">
                    <div className="flex items-center gap-2">
                      {activity.isPublic ? (
                        <>
                          <Globe className="w-3 h-3 text-[#FCB283]" />
                          <span className="text-xs text-white/80">Public</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-white/80">Private</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Participants */}
                  <div className="col-span-1">
                    <div className="flex items-center gap-2">
                      <Users className="w-3 h-3 text-[#FCB283]" />
                      <span className="text-xs text-white/80">
                        {activity.maxParticipants === 0 
                          ? 'Unlimited' 
                          : `${activity.registeredParticipants || 0}/${activity.maxParticipants}`
                        }
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="col-span-1 pr-4">
                    <div className="flex items-center gap-1 justify-start">
                      <button
                        onClick={() => handleViewActivity(activity.id)}
                        className="p-1.5 text-white/60 hover:text-[#FCB283] hover:bg-[#FCB283]/20 rounded-lg transition-colors"
                        title="View Public"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      
                      <button
                        onClick={() => handleEditActivity(activity.id)}
                        className="p-1.5 text-white/60 hover:text-green-400 hover:bg-green-400/20 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      
                      <button
                        onClick={() => handleDuplicateActivity(activity.id)}
                        className="p-1.5 text-white/60 hover:text-purple-400 hover:bg-purple-400/20 rounded-lg transition-colors"
                        title="Duplicate"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      
                      <button
                        onClick={() => openDeleteModal(activity.id, activity.name)}
                        className="p-1.5 text-white/60 hover:text-red-400 hover:bg-red-400/20 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="bg-white/5 border-t border-white/10 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-white/70">
                Page {pagination.currentPage} of {pagination.totalPages}
              </div>
              
              <div className="flex items-center gap-2">
                {/* Previous Button */}
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                  className="px-3 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>

                {/* Page Numbers */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNum;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.currentPage >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = pagination.currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-2 rounded-lg transition-all duration-300 ${
                          pageNum === pagination.currentPage
                            ? 'bg-[#FCB283] text-white'
                            : 'bg-white/10 text-white hover:bg-white/20'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                {/* Next Button */}
                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.totalPages}
                  className="px-3 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={handleConfirmDelete}
        title={deleteModal.type === 'bulk' ? 'Confirm Bulk Deletion' : 'Confirm Deletion'}
        message={
          deleteModal.type === 'bulk'
            ? `Are you sure you want to delete ${deleteModal.count} selected activities? This action cannot be undone.`
            : `Are you sure you want to delete "${deleteModal.activityName}"? This action cannot be undone.`
        }
        itemName={deleteModal.type === 'single' ? deleteModal.activityName : undefined}
        isProcessing={deleteModal.isProcessing}
      />
    </div>
  );
}
