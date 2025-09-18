import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useTypography } from '../../utils/typography';
import { useAuth } from '../auth/AuthContext';
import {
  collection,
  query,
  orderBy,
  getDocs,
  where,
  limit,
  Timestamp,
  QueryDocumentSnapshot,
  DocumentData
} from 'firebase/firestore';
import { db } from '../../firebase';
import { AdminApplicationCard as AdminApplicationCardType, GalleryFilters, PaginationState } from '../../types/admin.types';
import ExportService from '../../services/exportService';
import { useNotificationHelpers } from '../ui/NotificationSystem';
import ExportDialog from '../ui/ExportDialog';
import DeleteConfirmationModal from '../ui/DeleteConfirmationModal';
import AdminZoneHeader from '../layout/AdminZoneHeader';
import AdminApplicationTableView from '../ui/AdminApplicationTableView';
import AdminApplicationCard from '../ui/AdminApplicationCard';
import { AdminApplicationService, AdminDeleteProgress } from '../../services/adminApplicationService';
import { isAdminUser, isEditorUser } from '../../utils/userUtils';
import { Search, Download, Filter, Calendar, ChevronLeft, ChevronRight, Grid, LayoutGrid, RefreshCw, Wifi, WifiOff, Trash2 } from 'lucide-react';

interface WorldCompetitionPageProps {
  onSidebarToggle?: () => void;
}

const WorldCompetitionPage: React.FC<WorldCompetitionPageProps> = ({ onSidebarToggle }) => {
  const { i18n } = useTranslation();
  const { getClass } = useTypography();
  const { user, userProfile } = useAuth();
  const currentLanguage = i18n.language as 'en' | 'th';

  // State management
  const [applications, setApplications] = useState<AdminApplicationCardType[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<AdminApplicationCardType[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [error, setError] = useState<{
    type: 'network' | 'permission' | 'data' | 'unknown';
    message: string;
  } | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // UI State
  const [viewMode, setViewMode] = useState<'table' | 'gallery'>('table');
  const [showBulkSelect, setShowBulkSelect] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportProgress, setExportProgress] = useState<any>();

  // Bulk delete state
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [bulkDeleteProgress, setBulkDeleteProgress] = useState<AdminDeleteProgress | null>(null);

  const { showSuccess, showError } = useNotificationHelpers();

  // Filter and pagination state - FIXED TO WORLD CATEGORY
  const [filters, setFilters] = useState<GalleryFilters>({
    category: 'world', // Fixed to world category
    status: 'all',
    dateRange: {},
    search: '',
    sortBy: 'averageScore', // Default sort by average score
    country: 'all'
  });

  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 1,
    itemsPerPage: 20,
    totalItems: 0,
    totalPages: 0
  });

  // Firestore listener cleanup
  const [unsubscribe, setUnsubscribe] = useState<(() => void) | null>(null);

  // Content translations
  const content = {
    th: {
      pageTitle: "การประกวดโลก",
      subtitle: "จัดการและดูใบสมัครการประกวดโลก",
      searchPlaceholder: "ค้นหาชื่อภาพยนตร์, ผู้กำกับ, อีเมล...",
      filterCategory: "หมวดหมู่",
      filterStatus: "สถานะ",
      filterCountry: "ประเทศ",
      sortBy: "เรียงตาม",
      allCategories: "ทุกหมวด",
      allStatuses: "ทุกสถานะ",
      allCountries: "ทุกประเทศ",
      youth: "เยาวชน",
      future: "อนาคต",
      world: "โลก",
      draft: "ร่าง",
      submitted: "ส่งแล้ว",
      underReview: "กำลังพิจารณา",
      accepted: "ผ่าน",
      rejected: "ไม่ผ่าน",
      newest: "ใหม่สุด",
      oldest: "เก่าสุด",
      alphabetical: "ตามตัวอักษร",
      byCategory: "ตามหมวด",
      byStatus: "ตามสถานะ",
      averageScore: "คะแนนเฉลี่ย",
      noApplications: "ไม่พบใบสมัคร",
      noApplicationsDesc: "ไม่มีใบสมัครโลกที่ตรงกับเงื่อนไขการค้นหา",
      loading: "กำลังโหลด...",
      loadingMore: "กำลังโหลดเพิ่มเติม...",
      viewDetails: "ดูรายละเอียด",
      exportData: "ส่งออกข้อมูล",
      totalFound: "พบทั้งหมด",
      bulkSelect: "เลือกหลายรายการ",
      selectAll: "เลือกทั้งหมด",
      clearSelection: "ยกเลิกการเลือก",
      selectedItems: "รายการที่เลือก",
      tableView: "มุมมองตาราง",
      galleryView: "มุมมองแกลเลอรี่",
      page: "หน้า",
      of: "จาก",
      itemsPerPage: "รายการต่อหน้า",
      showingResults: "แสดงผล",
      refreshData: "รีเฟรชข้อมูล",
      offline: "ออฟไลน์",
      reconnecting: "กำลังเชื่อมต่อใหม่...",
      connectionRestored: "เชื่อมต่อกลับมาแล้ว",
      loadMore: "โหลดเพิ่มเติม",
      errorLoading: "เกิดข้อผิดพลาดในการโหลดข้อมูล",
      retry: "ลองใหม่",
      bulkDelete: "ลบหลายรายการ",
      confirmBulkDelete: "ยืนยันการลบหลายรายการ",
      bulkDeleteMessage: "คุณแน่ใจหรือไม่ที่จะลบใบสมัครที่เลือกไว้ทั้งหมด? การกระทำนี้จะลบข้อมูลทั้งหมดรวมถึงไฟล์และคะแนน และไม่สามารถยกเลิกได้",
      cancel: "ยกเลิก",
      delete: "ลบ",
      totalDuration: "รวมระยะเวลา"
    },
    en: {
      pageTitle: "World Competition",
      subtitle: "Manage and view world competition applications",
      searchPlaceholder: "Search film titles, directors, emails...",
      filterCategory: "Category",
      filterStatus: "Status",
      filterCountry: "Country",
      sortBy: "Sort By",
      allCategories: "All Categories",
      allStatuses: "All Statuses",
      allCountries: "All Countries",
      youth: "Youth",
      future: "Future",
      world: "World",
      draft: "Draft",
      submitted: "Submitted",
      underReview: "Under Review",
      accepted: "Accepted",
      rejected: "Rejected",
      newest: "Newest",
      oldest: "Oldest",
      alphabetical: "Alphabetical",
      byCategory: "By Category",
      byStatus: "By Status",
      averageScore: "Average Score",
      noApplications: "No Applications Found",
      noApplicationsDesc: "No world applications match your search criteria",
      loading: "Loading...",
      loadingMore: "Loading more...",
      viewDetails: "View Details",
      exportData: "Export Data",
      totalFound: "Total Found",
      bulkSelect: "Bulk Select",
      selectAll: "Select All",
      clearSelection: "Clear Selection",
      selectedItems: "Selected Items",
      tableView: "Table View",
      galleryView: "Gallery View",
      page: "Page",
      of: "of",
      itemsPerPage: "Items per page",
      showingResults: "Showing",
      refreshData: "Refresh Data",
      offline: "Offline",
      reconnecting: "Reconnecting...",
      connectionRestored: "Connection restored",
      loadMore: "Load More",
      errorLoading: "Error loading data",
      retry: "Retry",
      bulkDelete: "Bulk Delete",
      confirmBulkDelete: "Confirm Bulk Delete",
      bulkDeleteMessage: "Are you sure you want to delete all selected applications? This action will permanently remove all data including files and scores, and cannot be undone.",
      cancel: "Cancel",
      delete: "Delete",
      totalDuration: "Total Duration"
    }
  };

  const currentContent = content[currentLanguage];

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showSuccess(currentContent.connectionRestored);
    };
    const handleOffline = () => {
      setIsOnline(false);
      showError(currentContent.offline);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [currentContent, showSuccess, showError]);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Stable Firestore data loading - FIXED APPROACH (Same as AdminGalleryPage)
  const loadApplications = useCallback(async () => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);


      // Build optimized Firestore query using existing indexes (same as AdminGalleryPage)
      const applicationsRef = collection(db, 'submissions');
      const q = query(applicationsRef, orderBy('createdAt', 'desc'));

      const snapshot = await getDocs(q);
      const applicationsList: AdminApplicationCardType[] = [];

      snapshot.docs.forEach((doc) => {
        const data = doc.data();

        // Only include applications that actually belong to the world category
        const competitionCategory = data.competitionCategory || data.category;
        
        // Skip applications without a proper category or that don't belong to world
        if (!competitionCategory || competitionCategory !== 'world') {
          return;
        }

        // Map Firestore data to AdminApplicationCard type
        const application: AdminApplicationCardType = {
          id: doc.id,
          userId: data.userId || '',
          filmTitle: data.filmTitle || 'Untitled',
          filmTitleTh: data.filmTitleTh,
          directorName: data.submitterName || data.directorName || 'Unknown',
          directorNameTh: data.submitterNameTh || data.directorNameTh,
          competitionCategory: competitionCategory,
          status: data.status || 'draft',
          posterUrl: data.files?.posterFile?.downloadURL || data.files?.posterFile?.url || '',
          submittedAt: data.submittedAt?.toDate(),
          createdAt: data.createdAt?.toDate() || new Date(),
          lastModified: data.lastModified?.toDate() || new Date(),
          country: data.nationality || 'Unknown',
          hasScores: data.scores && data.scores.length > 0,
          averageScore: data.scores && data.scores.length > 0
            ? data.scores.reduce((sum: number, score: any) => sum + (score.totalScore || 0), 0) / data.scores.length
            : undefined,
          reviewStatus: data.reviewStatus,
          genres: data.genres || [],
          duration: data.duration || 0,
          format: data.format || 'live-action'
        };

        applicationsList.push(application);
      });

      setApplications(applicationsList);

    } catch (error: any) {
      console.error('Error loading applications:', error);

      // Enhanced error handling
      let errorType: 'network' | 'permission' | 'data' | 'unknown' = 'unknown';
      let errorMessage = 'Unknown error occurred';

      if (error.code === 'permission-denied') {
        errorType = 'permission';
        errorMessage = 'Access denied. Please check your permissions.';
      } else if (error.code === 'unavailable') {
        errorType = 'network';
        errorMessage = 'Network unavailable. Please check your connection.';
      } else if (error.code === 'failed-precondition') {
        errorType = 'data';
        errorMessage = 'Database configuration error. Please contact support.';
      } else {
        errorMessage = error.message || 'Failed to load applications';
      }

      setError({ type: errorType, message: errorMessage });
      showError(currentContent.errorLoading, errorMessage);

    } finally {
      setLoading(false);
      setInitialLoad(false);
      setRefreshing(false);
    }
  }, [user?.uid, currentContent.errorLoading, showError]);

  // Load data on mount and filter changes
  useEffect(() => {
    loadApplications();

    // Cleanup listener on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [loadApplications]);

  // Client-side filtering and sorting - FIXED SYNCHRONIZATION
  useEffect(() => {
    if (!applications.length) {
      setFilteredApplications([]);
      setPagination(prev => ({ ...prev, totalItems: 0, totalPages: 1, currentPage: 1 }));
      return;
    }

    let filtered = [...applications];

    // FIRST: Filter to world category only (this is the key fix)
    filtered = filtered.filter(app => app.competitionCategory === 'world');

    // Apply other filters
    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(app => app.status === filters.status);
    }

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(app =>
        app.filmTitle.toLowerCase().includes(searchTerm) ||
        (app.filmTitleTh && app.filmTitleTh.toLowerCase().includes(searchTerm)) ||
        app.directorName.toLowerCase().includes(searchTerm) ||
        (app.directorNameTh && app.directorNameTh.toLowerCase().includes(searchTerm)) ||
        app.id.toLowerCase().includes(searchTerm)
      );
    }

    if (filters.country && filters.country !== 'all') {
      filtered = filtered.filter(app => app.country === filters.country);
    }

    if (filters.dateRange?.start || filters.dateRange?.end) {
      filtered = filtered.filter(app => {
        const appDate = app.createdAt;
        let matchesStart = true;
        let matchesEnd = true;

        if (filters.dateRange?.start) {
          matchesStart = appDate >= new Date(filters.dateRange.start);
        }

        if (filters.dateRange?.end) {
          const endDate = new Date(filters.dateRange.end);
          endDate.setHours(23, 59, 59, 999);
          matchesEnd = appDate <= endDate;
        }

        return matchesStart && matchesEnd;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'averageScore':
          // Sort by average score (highest first), then by newest for ties
          const scoreA = a.averageScore || 0;
          const scoreB = b.averageScore || 0;
          if (scoreB !== scoreA) {
            return scoreB - scoreA;
          }
          return (b.submittedAt || b.createdAt).getTime() - (a.submittedAt || a.createdAt).getTime();
        case 'newest':
          return (b.submittedAt || b.createdAt).getTime() - (a.submittedAt || a.createdAt).getTime();
        case 'oldest':
          return (a.submittedAt || a.createdAt).getTime() - (b.submittedAt || b.createdAt).getTime();
        case 'alphabetical':
          return a.filmTitle.localeCompare(b.filmTitle);
        case 'category':
          return a.competitionCategory.localeCompare(b.competitionCategory);
        case 'status':
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });

    setFilteredApplications(filtered);

    // Update pagination - CRITICAL FIX
    const totalItems = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pagination.itemsPerPage));

    setPagination(prev => ({
      ...prev,
      currentPage: Math.min(prev.currentPage, totalPages), // Prevent invalid pages
      totalItems,
      totalPages
    }));

  }, [applications, filters, pagination.itemsPerPage]);

  // Calculate total duration of filtered applications
  const totalMinutes = React.useMemo(() => {
    return filteredApplications.reduce((total, app) => total + (app.duration || 0), 0);
  }, [filteredApplications]);

  // Format duration for display
  const formatDuration = (minutes: number) => {
    if (minutes === 0) return '0 min';

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours === 0) {
      return `${mins} min`;
    } else if (mins === 0) {
      return `${hours}h`;
    } else {
      return `${hours}h ${mins}min`;
    }
  };

  // Get unique countries for filter dropdown
  const uniqueCountries = Array.from(new Set(applications.map(app => app.country))).sort();

  // Paginated applications
  const paginatedApplications = React.useMemo(() => {
    const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
    const endIndex = startIndex + pagination.itemsPerPage;
    return filteredApplications.slice(startIndex, endIndex);
  }, [filteredApplications, pagination.currentPage, pagination.itemsPerPage]);

  // Event handlers
  const handleFilterChange = (key: keyof GalleryFilters, value: any) => {
    // Prevent changing category filter - it's fixed to world
    if (key === 'category') return;
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handlePageChange = useCallback((page: number) => {
    // Validate page bounds
    if (page < 1 || page > pagination.totalPages) {
      return;
    }

    setPagination(prev => ({ ...prev, currentPage: page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pagination.totalPages]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadApplications();
  };

  const handleExportApplications = async (options: any) => {
    try {
      const exportService = new ExportService((progress) => {
        setExportProgress(progress);
      });

      await exportService.exportApplications(filteredApplications, options);

      showSuccess(
        currentLanguage === 'th' ? 'ส่งออกสำเร็จ' : 'Export Successful',
        currentLanguage === 'th' ? 'ข้อมูลใบสมัครถูกส่งออกเรียบร้อยแล้ว' : 'Applications data has been exported successfully'
      );

      setShowExportDialog(false);
      setExportProgress(undefined);
    } catch (error) {
      showError(
        currentLanguage === 'th' ? 'การส่งออกล้มเหลว' : 'Export Failed',
        currentLanguage === 'th' ? 'เกิดข้อผิดพลาดในการส่งออกข้อมูล' : 'An error occurred while exporting data'
      );
    }
  };

  const handleBulkSelect = (id: string, selected: boolean) => {
    const newSelection = new Set(selectedItems);
    if (selected) {
      newSelection.add(id);
    } else {
      newSelection.delete(id);
    }
    setSelectedItems(newSelection);
  };

  const handleSelectAll = () => {
    if (selectedItems.size === paginatedApplications.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(paginatedApplications.map(app => app.id)));
    }
  };

  const handleViewApplication = (id: string) => {
    window.location.hash = `#admin/application-detail/${id}`;
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  const handleEditApplication = (id: string) => {
    window.location.hash = `#admin/application/${id}/edit`;
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  // Bulk delete handlers
  const handleBulkDelete = () => {
    if (selectedItems.size === 0) {
      showError(currentLanguage === 'th' ? 'กรุณาเลือกใบสมัครที่ต้องการลบ' : 'Please select applications to delete');
      return;
    }

    // Check if user has permission to delete applications
    const adminService = new AdminApplicationService();
    if (!adminService.canDeleteApplication(userProfile?.role)) {
      showError(currentLanguage === 'th' ? 'คุณไม่มีสิทธิ์ในการลบใบสมัคร' : 'You do not have permission to delete applications');
      return;
    }

    setShowBulkDeleteModal(true);
  };

  const handleConfirmBulkDelete = async () => {
    setIsBulkDeleting(true);
    setBulkDeleteProgress(null);

    try {
      const adminService = new AdminApplicationService((progress) => {
        setBulkDeleteProgress(progress);
      });

      const selectedIds = Array.from(selectedItems);
      await adminService.bulkDeleteApplications(selectedIds);

      showSuccess(
        currentLanguage === 'th' ? 'ลบใบสมัครเรียบร้อยแล้ว' : 'Applications deleted successfully',
        currentLanguage === 'th' ? `ลบใบสมัครจำนวน ${selectedIds.length} รายการเรียบร้อยแล้ว` : `Successfully deleted ${selectedIds.length} applications`
      );

      // Clear selection and refresh data
      setSelectedItems(new Set());
      setShowBulkSelect(false);

      // Refresh the applications list
      setTimeout(() => {
        handleRefresh();
      }, 1000);

    } catch (error) {
      console.error('Error in bulk delete:', error);
      showError(
        currentLanguage === 'th' ? 'เกิดข้อผิดพลาดในการลบใบสมัคร' : 'Error deleting applications',
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
    } finally {
      setIsBulkDeleting(false);
      setShowBulkDeleteModal(false);
      setBulkDeleteProgress(null);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'f':
            event.preventDefault();
            document.querySelector<HTMLInputElement>('input[type="text"]')?.focus();
            break;
          case 'r':
            event.preventDefault();
            handleRefresh();
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Generate page numbers for pagination - ENHANCED LOGIC
  const getPageNumbers = useCallback(() => {
    const { currentPage, totalPages } = pagination;
    const pages: (number | string)[] = [];

    if (totalPages <= 7) {
      // Show all pages if 7 or fewer
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      // Always show first page
      pages.push(1);

      // Add ellipsis if needed
      if (currentPage > 4) pages.push('...');

      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        if (i !== 1 && i !== totalPages) pages.push(i);
      }

      // Add ellipsis if needed
      if (currentPage < totalPages - 3) pages.push('...');

      // Always show last page
      if (totalPages > 1) pages.push(totalPages);
    }

    return pages;
  }, [pagination]);

  const getGridColumns = () => {
    return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5';
  };

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className={`grid ${getGridColumns()} gap-4 sm:gap-6`}>
      {Array.from({ length: pagination.itemsPerPage }).map((_, index) => (
        <div key={index} className="glass-container rounded-xl overflow-hidden animate-pulse">
          <div className="aspect-[4/5] bg-white/20"></div>
          <div className="p-4 space-y-2">
            <div className="h-4 bg-white/20 rounded w-3/4"></div>
            <div className="h-3 bg-white/10 rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  );

  // Error retry component
  const ErrorState = () => (
    <div className="text-center py-12">
      <div className="text-6xl mb-6">⚠️</div>
      <h2 className={`text-2xl ${getClass('header')} mb-4 text-white`}>
        {currentContent.errorLoading}
      </h2>
      <p className={`${getClass('body')} text-white/80 mb-6`}>
        {error?.message}
      </p>
      <button
        onClick={handleRefresh}
        className="px-6 py-3 bg-[#FCB283] hover:bg-[#AA4626] rounded-lg text-white transition-colors"
      >
        {currentContent.retry}
      </button>
    </div>
  );

  // Empty state component
  const EmptyState = () => (
    <div className="text-center py-12">
      <div className="text-6xl mb-6">🎬</div>
      <h2 className={`text-2xl ${getClass('header')} mb-4 text-white`}>
        {currentContent.noApplications}
      </h2>
      <p className={`${getClass('body')} text-white/80 max-w-md mx-auto`}>
        {currentContent.noApplicationsDesc}
      </p>
    </div>
  );


  // Show loading skeleton only during initial load and no data exists yet
  if (initialLoad && applications.length === 0) {
    return (
      <div className="space-y-6 sm:space-y-8">
        <AdminZoneHeader
          title={currentContent.pageTitle}
          subtitle={currentContent.subtitle}
          onSidebarToggle={onSidebarToggle || (() => {})}
        />
        <LoadingSkeleton />
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#FCB283] mb-4"></div>
          <p className={`${getClass('body')} text-white/80`}>
            {currentContent.loading}
          </p>
        </div>
      </div>
    );
  }

  // Only show error state if there's an actual error AND no data was loaded
  if (error && applications.length === 0 && !initialLoad) {
    return (
      <div className="space-y-6 sm:space-y-8">
        <AdminZoneHeader
          title={currentContent.pageTitle}
          subtitle={currentContent.subtitle}
          onSidebarToggle={onSidebarToggle || (() => {})}
        />
        <ErrorState />
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Admin Zone Header with World Competition Logo */}
      <div className="glass-container rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <img
              src="https://firebasestorage.googleapis.com/v0/b/cifan-c41c6.firebasestorage.app/o/site_files%2Ffest_logos%2FGroup%204.png?alt=media&token=e8be419f-f0b2-4f64-8d7f-c3e8532e2689"
              alt="World Competition Logo"
              className="h-10 w-auto object-contain"
            />
            <div>
              <h1 className={`text-2xl ${getClass('header')} text-white font-bold`}>
                {currentContent.pageTitle}
              </h1>
              <p className={`${getClass('body')} text-white/70 mt-1`}>
                {currentContent.subtitle}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {/* Connection Status */}
            {!isOnline && (
              <div className="flex items-center space-x-1 px-2 py-1 bg-red-500/20 rounded-lg">
                <WifiOff className="w-4 h-4 text-red-400" />
                <span className="text-xs text-red-400">{currentContent.offline}</span>
              </div>
            )}

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50"
              title={currentContent.refreshData}
            >
              <RefreshCw className={`w-4 h-4 text-white ${refreshing ? 'animate-spin' : ''}`} />
            </button>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-white/10 rounded-lg p-1">
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'table'
                    ? 'bg-[#FCB283] text-white'
                    : 'text-white/60 hover:text-white'
                }`}
                title={currentContent.tableView}
                aria-label={currentContent.tableView}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('gallery')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'gallery'
                    ? 'bg-[#FCB283] text-white'
                    : 'text-white/60 hover:text-white'
                }`}
                title={currentContent.galleryView}
                aria-label={currentContent.galleryView}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>

            {/* Export Button */}
            <button
              onClick={() => setShowExportDialog(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-[#FCB283] hover:bg-[#AA4626] rounded-lg text-white transition-colors"
              aria-label={currentContent.exportData}
            >
              <Download className="w-4 h-4" />
              <span className={`${getClass('menu')} text-sm hidden sm:inline`}>
                {currentContent.exportData}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="glass-container rounded-xl p-6">
        <div className="space-y-4">

          {/* Search and Bulk Actions Row */}
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">

            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-4 h-4" />
              <input
                type="text"
                placeholder={currentContent.searchPlaceholder}
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:border-[#FCB283] focus:outline-none"
                aria-label="Search applications"
              />
            </div>

            {/* Bulk Actions */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowBulkSelect(!showBulkSelect)}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  showBulkSelect
                    ? 'bg-[#FCB283] border-[#FCB283] text-white'
                    : 'bg-white/10 border-white/20 text-white hover:border-[#FCB283]'
                }`}
                aria-label={currentContent.bulkSelect}
              >
                {currentContent.bulkSelect}
              </button>

              {showBulkSelect && (
                <>
                  <button
                    onClick={handleSelectAll}
                    className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white hover:border-[#FCB283] transition-colors"
                    aria-label={selectedItems.size === paginatedApplications.length ? currentContent.clearSelection : currentContent.selectAll}
                  >
                    {selectedItems.size === paginatedApplications.length ? currentContent.clearSelection : currentContent.selectAll}
                  </button>

                  {selectedItems.size > 0 && (
                    <>
                      <span className="px-3 py-2 bg-[#FCB283]/20 text-[#FCB283] rounded-lg text-sm" role="status">
                        {selectedItems.size} {currentContent.selectedItems}
                      </span>

                      {/* Bulk Delete Button - Only for Admin/Editor */}
                      {(isAdminUser(userProfile) || isEditorUser(userProfile)) && (
                        <button
                          onClick={handleBulkDelete}
                          disabled={isBulkDeleting}
                          className="flex items-center space-x-2 px-4 py-2 bg-red-600/80 hover:bg-red-600 rounded-lg text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          aria-label={currentContent.bulkDelete}
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="text-sm">
                            {isBulkDeleting ? (currentLanguage === 'th' ? 'กำลังลบ...' : 'Deleting...') : currentContent.bulkDelete}
                          </span>
                        </button>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap gap-4">
            {/* Category Filter - DISABLED (Fixed to World) */}
            <div className="px-4 py-2 bg-[#FCB283]/20 border border-[#FCB283]/30 rounded-lg text-[#FCB283] text-sm font-medium">
              <span className="flex items-center space-x-2">
                <Filter className="w-4 h-4" />
                <span>{currentContent.world} {currentLanguage === 'th' ? 'หมวดหมู่' : 'Category'}</span>
              </span>
            </div>

            {/* Status Filter */}
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:border-[#FCB283] focus:outline-none"
              aria-label={currentContent.filterStatus}
            >
              <option value="all" className="bg-[#110D16]">{currentContent.allStatuses}</option>
              <option value="submitted" className="bg-[#110D16]">{currentContent.submitted}</option>
              <option value="draft" className="bg-[#110D16]">{currentContent.draft}</option>
              <option value="under-review" className="bg-[#110D16]">{currentContent.underReview}</option>
              <option value="accepted" className="bg-[#110D16]">{currentContent.accepted}</option>
              <option value="rejected" className="bg-[#110D16]">{currentContent.rejected}</option>
            </select>

            {/* Country Filter */}
            <select
              value={filters.country}
              onChange={(e) => handleFilterChange('country', e.target.value)}
              className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:border-[#FCB283] focus:outline-none"
              aria-label={currentContent.filterCountry}
            >
              <option value="all" className="bg-[#110D16]">{currentContent.allCountries}</option>
              {uniqueCountries.map(country => (
                <option key={country} value={country} className="bg-[#110D16]">{country}</option>
              ))}
            </select>

            {/* Sort Filter */}
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:border-[#FCB283] focus:outline-none"
              aria-label={currentContent.sortBy}
            >
              <option value="averageScore" className="bg-[#110D16]">{currentContent.averageScore}</option>
              <option value="newest" className="bg-[#110D16]">{currentContent.newest}</option>
              <option value="oldest" className="bg-[#110D16]">{currentContent.oldest}</option>
              <option value="alphabetical" className="bg-[#110D16]">{currentContent.alphabetical}</option>
              <option value="category" className="bg-[#110D16]">{currentContent.byCategory}</option>
              <option value="status" className="bg-[#110D16]">{currentContent.byStatus}</option>
            </select>

            {/* Date Range Filters */}
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-white/60" />
              <input
                type="date"
                value={filters.dateRange.start || ''}
                onChange={(e) => handleFilterChange('dateRange', { ...filters.dateRange, start: e.target.value })}
                className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:border-[#FCB283] focus:outline-none text-sm"
                aria-label="Start date filter"
              />
              <span className="text-white/60">-</span>
              <input
                type="date"
                value={filters.dateRange.end || ''}
                onChange={(e) => handleFilterChange('dateRange', { ...filters.dateRange, end: e.target.value })}
                className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:border-[#FCB283] focus:outline-none text-sm"
                aria-label="End date filter"
              />
            </div>
          </div>

          {/* Results Summary */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-white/20">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <p className={`${getClass('body')} text-white/70 text-sm`} role="status">
                {currentContent.showingResults} {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1}-{Math.min(pagination.currentPage * pagination.itemsPerPage, filteredApplications.length)} {currentContent.of} {filteredApplications.length} {currentLanguage === 'th' ? 'รายการ' : 'items'}
              </p>

              {/* Total Duration Indicator */}
              <div className="flex items-center space-x-2 px-3 py-1 bg-[#FCB283]/20 rounded-lg">
                <span className={`${getClass('body')} text-[#FCB283] text-sm font-medium`}>
                  {currentContent.totalDuration}:
                </span>
                <span className={`${getClass('body')} text-[#FCB283] text-sm font-bold`}>
                  {formatDuration(totalMinutes)}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className={`${getClass('body')} text-white/70 text-sm`}>
                {currentContent.itemsPerPage}:
              </span>
              <select
                value={pagination.itemsPerPage}
                onChange={(e) => setPagination(prev => ({
                  ...prev,
                  itemsPerPage: parseInt(e.target.value),
                  currentPage: 1,
                  totalPages: Math.ceil(filteredApplications.length / parseInt(e.target.value))
                }))}
                className="px-2 py-1 bg-white/10 border border-white/20 rounded text-white focus:border-[#FCB283] focus:outline-none text-sm"
                aria-label="Items per page"
              >
                <option value="20" className="bg-[#110D16]">20</option>
                <option value="40" className="bg-[#110D16]">40</option>
                <option value="60" className="bg-[#110D16]">60</option>
                <option value="100" className="bg-[#110D16]">100</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Applications Display */}
      {paginatedApplications.length > 0 ? (
        viewMode === 'table' ? (
          <AdminApplicationTableView
            applications={paginatedApplications}
            onView={handleViewApplication}
            onEdit={handleEditApplication}
            isSelected={(id: string) => selectedItems.has(id)}
            onSelect={handleBulkSelect}
            showBulkSelect={showBulkSelect}
            startIndex={(pagination.currentPage - 1) * pagination.itemsPerPage}
          />
        ) : (
          <div className={`grid ${getGridColumns()} gap-4 sm:gap-6`} role="grid">
            {paginatedApplications.map((application) => (
              <div key={application.id} role="gridcell">
                <AdminApplicationCard
                  application={application}
                  onView={handleViewApplication}
                  onEdit={handleEditApplication}
                  isSelected={selectedItems.has(application.id)}
                  onSelect={handleBulkSelect}
                  showBulkSelect={showBulkSelect}
                />
              </div>
            ))}
          </div>
        )
      ) : (
        <EmptyState />
      )}

      {/* Loading More Indicator */}
      {refreshing && applications.length > 0 && (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-[#FCB283] mb-2"></div>
          <p className={`${getClass('body')} text-white/80 text-sm`}>
            {currentContent.loadingMore}
          </p>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="glass-container rounded-xl p-6">
          <div className="flex items-center justify-between">

            {/* Page Info */}
            <p className={`${getClass('body')} text-white/70 text-sm`} role="status">
              {currentContent.page} {pagination.currentPage} {currentContent.of} {pagination.totalPages}
            </p>

            {/* Pagination Controls */}
            <nav className="flex items-center space-x-2" aria-label="Pagination navigation">
              {/* Previous Button */}
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                className="p-2 rounded-lg bg-white/10 border border-white/20 text-white hover:border-[#FCB283] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Page Numbers */}
              {getPageNumbers().map((pageNum, index) => (
                pageNum === '...' ? (
                  <span
                    key={`ellipsis-${index}`}
                    className="px-3 py-2 text-white/60"
                    aria-hidden="true"
                  >
                    {pageNum}
                  </span>
                ) : (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum as number)}
                    className={`px-3 py-2 rounded-lg transition-colors ${
                      pageNum === pagination.currentPage
                        ? 'bg-[#FCB283] text-white'
                        : 'bg-white/10 border border-white/20 text-white hover:border-[#FCB283]'
                    }`}
                    aria-label={`Page ${pageNum}`}
                    aria-current={pageNum === pagination.currentPage ? 'page' : undefined}
                  >
                    {pageNum}
                  </button>
                )
              ))}

              {/* Next Button */}
              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
                className="p-2 rounded-lg bg-white/10 border border-white/20 text-white hover:border-[#FCB283] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Export Dialog */}
      <ExportDialog
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        onExport={handleExportApplications}
        exportType="applications"
        availableCategories={['youth', 'future', 'world']}
        availableStatuses={['draft', 'submitted', 'under-review', 'accepted', 'rejected']}
        progress={exportProgress}
      />

      {/* Bulk Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showBulkDeleteModal}
        onClose={() => setShowBulkDeleteModal(false)}
        onConfirm={handleConfirmBulkDelete}
        title={currentContent.confirmBulkDelete}
        message={currentContent.bulkDeleteMessage}
        itemName={`${selectedItems.size} ${currentLanguage === 'th' ? 'ใบสมัคร' : 'applications'}`}
        isProcessing={isBulkDeleting}
      />

    </div>
  );
};

export default WorldCompetitionPage;
