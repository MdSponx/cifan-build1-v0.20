import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  writeBatch,
  serverTimestamp,
  runTransaction
} from 'firebase/firestore';
import { db } from '../firebase';
import {
  ActivityRegistration,
  RegistrationFormData,
  RegistrationResult,
  RegistrationFilters,
  RegistrationListResult,
  BulkUpdateResult,
  RegistrationAnalytics,
  AttendanceStatus,
  RegistrationFirestoreDoc,
  RegistrationErrorCode,
  RegistrationExportFormat,
  RegistrationExportData
} from '../types/registration.types';
import { Activity } from '../types/activities';

const ACTIVITIES_COLLECTION = 'activities';
const REGISTRATIONS_SUBCOLLECTION = 'registrations';

export class RegistrationService {
  private static instance: RegistrationService;

  static getInstance(): RegistrationService {
    if (!RegistrationService.instance) {
      RegistrationService.instance = new RegistrationService();
    }
    return RegistrationService.instance;
  }

  /**
   * Register a participant for an activity
   */
  async registerForActivity(
    activityId: string,
    data: RegistrationFormData
  ): Promise<RegistrationResult> {
    try {
      console.log('🔄 Starting registration for activity:', activityId);

      // Validate input data
      const validationError = this.validateRegistrationData(data);
      if (validationError) {
        return {
          success: false,
          error: validationError,
          errorCode: 'INVALID_DATA'
        };
      }

      // Use transaction to ensure data consistency
      const result = await runTransaction(db, async (transaction) => {
        // Get activity document
        const activityRef = doc(db, ACTIVITIES_COLLECTION, activityId);
        const activityDoc = await transaction.get(activityRef);

        if (!activityDoc.exists()) {
          throw new Error('ACTIVITY_NOT_FOUND');
        }

        const activity = activityDoc.data() as Activity;

        // Check if activity is published and registration is open
        if (activity.status !== 'published') {
          throw new Error('REGISTRATION_CLOSED');
        }

        // Check registration deadline
        const now = new Date();
        const deadline = new Date(activity.registrationDeadline);
        if (now > deadline) {
          throw new Error('REGISTRATION_CLOSED');
        }

        // Get current registrations to check capacity and duplicates
        const registrationsRef = collection(activityRef, REGISTRATIONS_SUBCOLLECTION);
        const existingRegistrations = await getDocs(registrationsRef);

        // Check for duplicate email
        const duplicateEmail = existingRegistrations.docs.find(
          doc => doc.data().email.toLowerCase() === data.email.toLowerCase()
        );
        if (duplicateEmail) {
          throw new Error('DUPLICATE_EMAIL');
        }

        // Check capacity - Allow over-capacity registrations for staff review
        const currentCount = existingRegistrations.size;
        const isOverCapacity = activity.maxParticipants > 0 && currentCount >= activity.maxParticipants;
        
        // Note: We no longer block registrations when over capacity
        // Staff can review and select final participants from the backend

        // Generate tracking code
        const trackingCode = this.generateTrackingCode();

        // Get client info for metadata
        const clientInfo = this.getClientInfo();

        // Prepare registration data
        const registrationData: Omit<RegistrationFirestoreDoc, 'id'> = {
          participantName: data.participantName.trim(),
          participantNameEn: data.participantNameEn?.trim(),
          email: data.email.toLowerCase().trim(),
          phone: data.phone.trim(),
          category: data.category,
          occupation: data.occupation?.trim(),
          organization: data.organization?.trim(),
          trackingCode,
          registeredAt: serverTimestamp(),
          status: 'registered',
          additionalNotes: data.additionalNotes?.trim(),
          registrationSource: 'web',
          ipAddress: clientInfo.ipAddress,
          userAgent: clientInfo.userAgent
        };

        // Remove any undefined values from the object before saving
        const cleanRegistrationData = Object.fromEntries(
          Object.entries(registrationData).filter(([_, value]) => value !== undefined)
        );

        // Add registration document
        const newRegistrationRef = doc(registrationsRef);
        transaction.set(newRegistrationRef, cleanRegistrationData);

        // Update activity analytics
        const newCount = currentCount + 1;
        const analytics = {
          totalRegistrations: newCount,
          registrationsByStatus: {
            registered: newCount,
            attended: 0,
            absent: 0
          },
          lastRegistration: serverTimestamp(),
          popularityScore: (newCount / activity.maxParticipants) * 100
        };

        transaction.update(activityRef, {
          registeredParticipants: newCount,
          analytics,
          updatedAt: serverTimestamp()
        });

        return {
          registrationId: newRegistrationRef.id,
          trackingCode
        };
      });

      console.log('✅ Registration completed successfully:', result);

      // Send confirmation email (async, don't wait)
      this.sendConfirmationEmail(activityId, result.registrationId, data)
        .catch(error => console.warn('Failed to send confirmation email:', error));

      return {
        success: true,
        registrationId: result.registrationId,
        trackingCode: result.trackingCode
      };

    } catch (error) {
      console.error('❌ Registration failed:', {
        activityId,
        email: data.email,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined
      });

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      let errorCode: RegistrationErrorCode = 'UNKNOWN_ERROR';

      switch (errorMessage) {
        case 'ACTIVITY_NOT_FOUND':
          errorCode = 'ACTIVITY_NOT_FOUND';
          break;
        case 'DUPLICATE_EMAIL':
          errorCode = 'DUPLICATE_EMAIL';
          break;
        case 'ACTIVITY_FULL':
          errorCode = 'ACTIVITY_FULL';
          break;
        case 'REGISTRATION_CLOSED':
          errorCode = 'REGISTRATION_CLOSED';
          break;
        case 'INVALID_DATA':
          errorCode = 'INVALID_DATA';
          break;
        default:
          errorCode = 'UNKNOWN_ERROR';
          // Log additional details for unknown errors
          console.error('❌ Unknown registration error details:', {
            originalError: error,
            errorType: typeof error,
            errorConstructor: error?.constructor?.name,
            activityId,
            formData: {
              participantName: data.participantName,
              email: data.email,
              phone: data.phone,
              category: data.category
            }
          });
      }

      return {
        success: false,
        error: this.getErrorMessage(errorCode),
        errorCode
      };
    }
  }

  /**
   * Get registrations for an activity with filtering and pagination
   */
  async getActivityRegistrations(
    activityId: string,
    filters?: RegistrationFilters,
    page = 1,
    pageSize = 20
  ): Promise<RegistrationListResult> {
    try {
      console.log('🔍 Fetching registrations for activity:', activityId, 'with filters:', filters);

      const activityRef = doc(db, ACTIVITIES_COLLECTION, activityId);
      const registrationsRef = collection(activityRef, REGISTRATIONS_SUBCOLLECTION);

      // First, get all registrations without status filter to avoid Firestore query limitations
      let queryConstraints: any[] = [];

      // Apply date range filters (these work well with Firestore)
      if (filters?.dateRange) {
        if (filters.dateRange.start) {
          const startDate = Timestamp.fromDate(new Date(filters.dateRange.start));
          queryConstraints.push(where('registeredAt', '>=', startDate));
        }
        if (filters.dateRange.end) {
          const endDate = Timestamp.fromDate(new Date(filters.dateRange.end));
          queryConstraints.push(where('registeredAt', '<=', endDate));
        }
      }

      // Apply sorting
      const sortBy = filters?.sortBy || 'registeredAt';
      const sortOrder = filters?.sortOrder || 'desc';
      queryConstraints.push(orderBy(sortBy, sortOrder));

      // Get all registrations first
      const allQuery = query(registrationsRef, ...queryConstraints);
      const allSnapshot = await getDocs(allQuery);
      
      let allRegistrations = allSnapshot.docs.map(doc =>
        this.convertFirestoreDocToRegistration({
          id: doc.id,
          ...doc.data()
        } as RegistrationFirestoreDoc)
      );

      console.log('📊 Total registrations before filtering:', allRegistrations.length);

      // Apply client-side filters
      let filteredRegistrations = allRegistrations;

      // Apply status filter client-side
      if (filters?.status) {
        filteredRegistrations = filteredRegistrations.filter(reg => reg.status === filters.status);
        console.log('📊 After status filter:', filteredRegistrations.length, 'status:', filters.status);
      }

      // Apply search filter client-side
      if (filters?.search) {
        const searchTerm = filters.search.toLowerCase();
        filteredRegistrations = filteredRegistrations.filter(registration =>
          registration.participantName.toLowerCase().includes(searchTerm) ||
          registration.email.toLowerCase().includes(searchTerm) ||
          registration.phone.includes(searchTerm) ||
          registration.organization?.toLowerCase().includes(searchTerm) ||
          registration.trackingCode.toLowerCase().includes(searchTerm)
        );
        console.log('📊 After search filter:', filteredRegistrations.length, 'search term:', searchTerm);
      }

      // Apply pagination to filtered results
      const total = filteredRegistrations.length;
      const totalPages = Math.ceil(total / pageSize);
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedRegistrations = filteredRegistrations.slice(startIndex, endIndex);

      console.log('📊 Final results:', {
        total,
        totalPages,
        currentPage: page,
        pageSize,
        resultCount: paginatedRegistrations.length
      });

      return {
        registrations: paginatedRegistrations,
        total,
        page,
        limit: pageSize,
        totalPages,
        hasMore: page * pageSize < total
      };

    } catch (error) {
      console.error('❌ Error fetching registrations:', error);
      throw new Error('Failed to fetch registrations');
    }
  }

  /**
   * Get registration by tracking code
   */
  async getRegistrationByTrackingCode(trackingCode: string): Promise<ActivityRegistration | null> {
    try {
      console.log('🔍 Searching for registration with tracking code:', trackingCode);

      // Search across all activities
      const activitiesSnapshot = await getDocs(collection(db, ACTIVITIES_COLLECTION));

      for (const activityDoc of activitiesSnapshot.docs) {
        const registrationsRef = collection(activityDoc.ref, REGISTRATIONS_SUBCOLLECTION);
        const q = query(registrationsRef, where('trackingCode', '==', trackingCode));
        const registrationSnapshot = await getDocs(q);

        if (!registrationSnapshot.empty) {
          const registrationDoc = registrationSnapshot.docs[0];
          return this.convertFirestoreDocToRegistration({
            id: registrationDoc.id,
            ...registrationDoc.data()
          } as RegistrationFirestoreDoc);
        }
      }

      return null;
    } catch (error) {
      console.error('❌ Error finding registration by tracking code:', error);
      throw new Error('Failed to find registration');
    }
  }

  /**
   * Get registrations by email across all activities
   */
  async getRegistrationsByEmail(email: string): Promise<ActivityRegistration[]> {
    try {
      console.log('🔍 Searching for registrations with email:', email);

      const registrations: ActivityRegistration[] = [];
      const normalizedEmail = email.toLowerCase().trim();

      // Search across all activities
      const activitiesSnapshot = await getDocs(collection(db, ACTIVITIES_COLLECTION));

      for (const activityDoc of activitiesSnapshot.docs) {
        const registrationsRef = collection(activityDoc.ref, REGISTRATIONS_SUBCOLLECTION);
        const q = query(registrationsRef, where('email', '==', normalizedEmail));
        const registrationSnapshot = await getDocs(q);

        registrationSnapshot.docs.forEach(doc => {
          registrations.push(this.convertFirestoreDocToRegistration({
            id: doc.id,
            ...doc.data()
          } as RegistrationFirestoreDoc));
        });
      }

      return registrations.sort((a, b) => 
        b.registeredAt.toDate().getTime() - a.registeredAt.toDate().getTime()
      );
    } catch (error) {
      console.error('❌ Error finding registrations by email:', error);
      throw new Error('Failed to find registrations');
    }
  }

  /**
   * Update registration status (admin only)
   */
  async updateRegistrationStatus(
    activityId: string,
    registrationId: string,
    status: AttendanceStatus
  ): Promise<void> {
    try {
      console.log('🔄 Updating registration status:', { activityId, registrationId, status });

      // First, update the registration status
      const activityRef = doc(db, ACTIVITIES_COLLECTION, activityId);
      const registrationRef = doc(activityRef, REGISTRATIONS_SUBCOLLECTION, registrationId);

      await updateDoc(registrationRef, {
        status,
        updatedAt: serverTimestamp()
      });

      // Then update activity analytics separately to avoid transaction conflicts
      await this.updateActivityAnalytics(activityId);

      console.log('✅ Registration status updated successfully');
    } catch (error) {
      console.error('❌ Error updating registration status:', error);
      throw new Error('Failed to update registration status');
    }
  }

  /**
   * Delete a registration (admin only)
   */
  async deleteRegistration(
    activityId: string,
    registrationId: string
  ): Promise<void> {
    try {
      console.log('🗑️ Deleting registration:', { activityId, registrationId });

      await runTransaction(db, async (transaction) => {
        const activityRef = doc(db, ACTIVITIES_COLLECTION, activityId);
        const registrationRef = doc(activityRef, REGISTRATIONS_SUBCOLLECTION, registrationId);

        // Delete registration document
        transaction.delete(registrationRef);

        // Update activity analytics
        const registrationsSnapshot = await getDocs(
          collection(activityRef, REGISTRATIONS_SUBCOLLECTION)
        );

        const newCount = registrationsSnapshot.size - 1; // Subtract 1 for the deleted registration
        const statusBreakdown = this.calculateStatusBreakdown(
          registrationsSnapshot.docs
            .filter(doc => doc.id !== registrationId)
            .map(doc => this.convertFirestoreDocToRegistration({
              id: doc.id,
              ...doc.data()
            } as RegistrationFirestoreDoc))
        );

        const analytics = {
          totalRegistrations: newCount,
          attendanceCount: statusBreakdown.attended,
          registrationsByStatus: statusBreakdown,
          lastRegistration: serverTimestamp()
        };

        transaction.update(activityRef, {
          registeredParticipants: newCount,
          analytics,
          updatedAt: serverTimestamp()
        });
      });

      console.log('✅ Registration deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting registration:', error);
      throw new Error('Failed to delete registration');
    }
  }

  /**
   * Bulk delete registrations
   */
  async bulkDeleteRegistrations(
    activityId: string,
    registrationIds: string[]
  ): Promise<BulkUpdateResult> {
    try {
      console.log('🗑️ Bulk deleting registrations:', { activityId, count: registrationIds.length });

      const batch = writeBatch(db);
      const activityRef = doc(db, ACTIVITIES_COLLECTION, activityId);
      let deletedCount = 0;
      const errors: string[] = [];

      // Delete each registration
      for (const registrationId of registrationIds) {
        try {
          const registrationRef = doc(activityRef, REGISTRATIONS_SUBCOLLECTION, registrationId);
          batch.delete(registrationRef);
          deletedCount++;
        } catch (error) {
          errors.push(`Failed to delete registration ${registrationId}: ${error}`);
        }
      }

      // Commit batch delete
      await batch.commit();

      // Update activity analytics
      await this.updateActivityAnalytics(activityId);

      console.log('✅ Bulk delete completed:', { deletedCount, failedCount: errors.length });

      return {
        success: true,
        updatedCount: deletedCount,
        failedCount: errors.length,
        errors: errors.length > 0 ? errors : undefined
      };
    } catch (error) {
      console.error('❌ Error in bulk delete:', error);
      throw new Error('Failed to bulk delete registrations');
    }
  }

  /**
   * Bulk update registration statuses
   */
  async bulkUpdateStatus(
    activityId: string,
    registrationIds: string[],
    status: AttendanceStatus
  ): Promise<BulkUpdateResult> {
    try {
      console.log('🔄 Bulk updating registration statuses:', { activityId, count: registrationIds.length, status });

      const batch = writeBatch(db);
      const activityRef = doc(db, ACTIVITIES_COLLECTION, activityId);
      let updatedCount = 0;
      const errors: string[] = [];

      // Update each registration
      for (const registrationId of registrationIds) {
        try {
          const registrationRef = doc(activityRef, REGISTRATIONS_SUBCOLLECTION, registrationId);
          batch.update(registrationRef, {
            status,
            updatedAt: serverTimestamp()
          });
          updatedCount++;
        } catch (error) {
          errors.push(`Failed to update registration ${registrationId}: ${error}`);
        }
      }

      // Commit batch update
      await batch.commit();

      // Update activity analytics
      await this.updateActivityAnalytics(activityId);

      console.log('✅ Bulk update completed:', { updatedCount, failedCount: errors.length });

      return {
        success: true,
        updatedCount,
        failedCount: errors.length,
        errors: errors.length > 0 ? errors : undefined
      };
    } catch (error) {
      console.error('❌ Error in bulk update:', error);
      throw new Error('Failed to bulk update registrations');
    }
  }

  /**
   * Export registrations to various formats
   */
  async exportRegistrations(
    activityId: string,
    format: RegistrationExportFormat,
    filters?: RegistrationFilters
  ): Promise<Blob> {
    try {
      console.log('📤 Exporting registrations:', { activityId, format });

      // Get activity details
      const activityDoc = await getDoc(doc(db, ACTIVITIES_COLLECTION, activityId));
      if (!activityDoc.exists()) {
        throw new Error('Activity not found');
      }

      const activity = activityDoc.data() as Activity;

      // Get registrations
      const result = await this.getActivityRegistrations(activityId, filters, 1, 1000);
      
      const exportData: RegistrationExportData = {
        registrations: result.registrations,
        activity: {
          id: activityId,
          name: activity.name,
          eventDate: activity.eventDate,
          venueName: activity.venueName
        },
        exportDate: new Date().toISOString(),
        totalCount: result.total,
        statusBreakdown: this.calculateStatusBreakdown(result.registrations)
      };

      switch (format) {
        case 'csv':
          return this.exportToCSV(exportData);
        case 'xlsx':
          return this.exportToExcel(exportData);
        case 'pdf':
          return this.exportToPDF(exportData);
        default:
          throw new Error('Unsupported export format');
      }
    } catch (error) {
      console.error('❌ Error exporting registrations:', error);
      throw new Error('Failed to export registrations');
    }
  }

  /**
   * Get registration analytics for an activity
   */
  async getRegistrationAnalytics(activityId: string): Promise<RegistrationAnalytics> {
    try {
      console.log('📊 Calculating registration analytics for activity:', activityId);

      const result = await this.getActivityRegistrations(activityId, undefined, 1, 1000);
      const registrations = result.registrations;

      const statusBreakdown = this.calculateStatusBreakdown(registrations);
      const attendanceRate = statusBreakdown.registered > 0 
        ? (statusBreakdown.attended / statusBreakdown.registered) * 100 
        : 0;

      // Calculate trends by month
      const trendsByMonth: { [key: string]: { registrations: number; attended: number } } = {};
      registrations.forEach(reg => {
        const month = reg.registeredAt.toDate().toISOString().slice(0, 7);
        if (!trendsByMonth[month]) {
          trendsByMonth[month] = { registrations: 0, attended: 0 };
        }
        trendsByMonth[month].registrations++;
        if (reg.status === 'attended') {
          trendsByMonth[month].attended++;
        }
      });

      const registrationTrends = Object.entries(trendsByMonth).map(([month, data]) => ({
        month,
        registrations: data.registrations,
        attended: data.attended,
        attendanceRate: data.registrations > 0 ? (data.attended / data.registrations) * 100 : 0
      }));

      // Calculate popular time slots (based on registration time)
      const timeSlots: { [key: string]: number } = {};
      registrations.forEach(reg => {
        const hour = reg.registeredAt.toDate().getHours();
        const timeSlot = `${hour}:00-${hour + 1}:00`;
        timeSlots[timeSlot] = (timeSlots[timeSlot] || 0) + 1;
      });

      const popularTimeSlots = Object.entries(timeSlots)
        .map(([timeSlot, count]) => ({
          timeSlot,
          registrations: count,
          percentage: (count / registrations.length) * 100
        }))
        .sort((a, b) => b.registrations - a.registrations)
        .slice(0, 5);

      // Calculate average registrations per day
      const registrationDates = registrations.map(reg => 
        reg.registeredAt.toDate().toISOString().split('T')[0]
      );
      const uniqueDates = [...new Set(registrationDates)];
      const averageRegistrationsPerDay = uniqueDates.length > 0 
        ? registrations.length / uniqueDates.length 
        : 0;

      // Find peak registration day
      const dateCount: { [key: string]: number } = {};
      registrationDates.forEach(date => {
        dateCount[date] = (dateCount[date] || 0) + 1;
      });
      const peakRegistrationDay = Object.entries(dateCount)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || '';

      return {
        totalRegistrations: registrations.length,
        statusBreakdown,
        registrationTrends,
        attendanceRate,
        popularTimeSlots,
        averageRegistrationsPerDay,
        peakRegistrationDay
      };
    } catch (error) {
      console.error('❌ Error calculating analytics:', error);
      throw new Error('Failed to calculate registration analytics');
    }
  }

  /**
   * Update activity analytics (called after registration changes)
   */
  async updateActivityAnalytics(activityId: string): Promise<void> {
    try {
      const result = await this.getActivityRegistrations(activityId, undefined, 1, 1000);
      const statusBreakdown = this.calculateStatusBreakdown(result.registrations);

      const analytics = {
        totalRegistrations: result.total,
        attendanceCount: statusBreakdown.attended,
        registrationsByStatus: statusBreakdown,
        lastRegistration: serverTimestamp(),
        popularityScore: 0 // Will be calculated based on capacity
      };

      // Get activity to calculate popularity score
      const activityDoc = await getDoc(doc(db, ACTIVITIES_COLLECTION, activityId));
      if (activityDoc.exists()) {
        const activity = activityDoc.data() as Activity;
        analytics.popularityScore = (result.total / activity.maxParticipants) * 100;
      }

      await updateDoc(doc(db, ACTIVITIES_COLLECTION, activityId), {
        registeredParticipants: result.total,
        analytics,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('❌ Error updating activity analytics:', error);
      // Don't throw error for analytics update
    }
  }

  /**
   * Private helper methods
   */
  private validateRegistrationData(data: RegistrationFormData): string | null {
    if (!data.participantName?.trim()) {
      return 'Participant name is required';
    }
    if (!data.email?.trim()) {
      return 'Email is required';
    }
    if (!data.phone?.trim()) {
      return 'Phone number is required';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return 'Invalid email format';
    }

    // Phone validation
    const phoneRegex = /^[\d\-\+\(\)\s]+$/;
    if (!phoneRegex.test(data.phone)) {
      return 'Invalid phone number format';
    }

    return null;
  }

  private generateTrackingCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private getClientInfo(): { ipAddress?: string; userAgent?: string } {
    const result: { ipAddress?: string; userAgent?: string } = {};
    
    // Only add userAgent if it exists
    if (typeof navigator !== 'undefined' && navigator.userAgent) {
      result.userAgent = navigator.userAgent;
    }
    
    // Don't add ipAddress field at all - avoid undefined values
    // IP address detection can be added later using external APIs
    
    return result;
  }

  private getErrorMessage(errorCode: RegistrationErrorCode): string {
    const messages = {
      DUPLICATE_EMAIL: 'This email is already registered for this activity',
      ACTIVITY_FULL: 'This activity is full. No more registrations accepted',
      REGISTRATION_CLOSED: 'Registration for this activity is closed',
      ACTIVITY_NOT_FOUND: 'Activity not found',
      INVALID_DATA: 'Invalid registration data provided',
      NETWORK_ERROR: 'Network error. Please try again',
      UNKNOWN_ERROR: 'An unexpected error occurred. Please try again'
    };
    return messages[errorCode];
  }

  private convertFirestoreDocToRegistration(doc: RegistrationFirestoreDoc): ActivityRegistration {
    return {
      id: doc.id,
      participantName: doc.participantName,
      participantNameEn: doc.participantNameEn,
      email: doc.email,
      phone: doc.phone,
      category: doc.category,
      occupation: doc.occupation,
      organization: doc.organization,
      trackingCode: doc.trackingCode,
      registeredAt: doc.registeredAt?.toDate ? doc.registeredAt : Timestamp.now(),
      status: doc.status,
      additionalNotes: doc.additionalNotes,
      registrationSource: doc.registrationSource,
      ipAddress: doc.ipAddress,
      userAgent: doc.userAgent
    };
  }

  private calculateStatusBreakdown(registrations: ActivityRegistration[]): Record<AttendanceStatus, number> {
    const breakdown = { registered: 0, approved: 0, attended: 0, absent: 0 };
    registrations.forEach(reg => {
      breakdown[reg.status]++;
    });
    return breakdown;
  }

  private async sendConfirmationEmail(
    activityId: string,
    registrationId: string,
    data: RegistrationFormData
  ): Promise<void> {
    // This would integrate with your email service
    // For now, just log the action
    console.log('📧 Sending confirmation email:', { activityId, registrationId, email: data.email });
  }

  private exportToCSV(data: RegistrationExportData): Blob {
    const headers = [
      'Name',
      'Name (EN)',
      'Email',
      'Phone',
      'Occupation',
      'Organization',
      'Status',
      'Registered At',
      'Tracking Code',
      'Notes'
    ];

    const rows = data.registrations.map(reg => [
      reg.participantName,
      reg.participantNameEn || '',
      reg.email,
      reg.phone,
      reg.occupation || '',
      reg.organization || '',
      reg.status,
      reg.registeredAt.toDate().toISOString(),
      reg.trackingCode,
      reg.additionalNotes || ''
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  }

  private exportToExcel(data: RegistrationExportData): Blob {
    // This would use a library like xlsx to create Excel files
    // For now, return CSV format
    return this.exportToCSV(data);
  }

  private exportToPDF(data: RegistrationExportData): Blob {
    // This would use a library like jsPDF to create PDF files
    // For now, return CSV format
    return this.exportToCSV(data);
  }
}

// Export singleton instance
export const registrationService = RegistrationService.getInstance();
export default registrationService;
