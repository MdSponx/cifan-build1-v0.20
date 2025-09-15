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
  QueryDocumentSnapshot,
  serverTimestamp,
  deleteField
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { db, storage } from '../firebase';
import { 
  Activity, 
  ActivityFormData, 
  ActivityFilters, 
  ActivitySortOptions, 
  ActivityListResponse,
  ActivityFirestoreDoc,
  ActivityAnalytics,
  ActivitySearchResult,
  ActivityStatus
} from '../types/activities';
// Removed speaker service imports - we'll store speakers directly in the activity document

const ACTIVITIES_COLLECTION = 'activities';
const IMAGES_STORAGE_PATH = 'activities/images';

export class ActivitiesService {
  private static instance: ActivitiesService;

  static getInstance(): ActivitiesService {
    if (!ActivitiesService.instance) {
      ActivitiesService.instance = new ActivitiesService();
    }
    return ActivitiesService.instance;
  }

  /**
   * Create a new activity
   */
  async createActivity(formData: ActivityFormData, userId: string): Promise<Activity> {
    console.log('Creating activity with data:', { 
      name: formData.name, 
      userId, 
      collection: ACTIVITIES_COLLECTION 
    });
    
    try {
      let imageUrl = '';
      let imagePath = '';

      // Upload image if provided
      if (formData.image) {
        console.log('Uploading activity image...');
        const result = await this.uploadActivityImage(formData.image);
        imageUrl = result.downloadURL;
        imagePath = result.path;
        console.log('Image uploaded successfully:', imageUrl);
      }

      // Prepare activity data for Firestore (including speakers directly in the document)
      const activityData: any = {
        name: formData.name.trim(),
        shortDescription: formData.shortDescription.trim(),
        status: formData.status,
        isPublic: formData.isPublic,
        needSubmission: formData.needSubmission,
        maxParticipants: formData.maxParticipants,
        isOneDayActivity: formData.isOneDayActivity,
        eventDate: formData.eventDate,
        startTime: formData.startTime,
        endTime: formData.endTime,
        registrationDeadline: formData.registrationDeadline,
        venueName: formData.venueName.trim(),
        venueLocation: formData.venueLocation?.trim() || '',
        description: formData.description.trim(),
        organizers: formData.organizers.map(org => org.trim()).filter(org => org.length > 0),
        speakers: (formData.speakers || []).map(speaker => {
          const cleanSpeaker: any = {
            id: speaker.id,
            name: speaker.name,
            role: speaker.role
          };
          
          // Only add fields that have actual values (exclude imagePath - it's for cleanup only)
          if (speaker.email) cleanSpeaker.email = speaker.email;
          if (speaker.phone) cleanSpeaker.phone = speaker.phone;
          if (speaker.otherRole) cleanSpeaker.otherRole = speaker.otherRole;
          if (speaker.bio) cleanSpeaker.bio = speaker.bio;
          if (speaker.image) cleanSpeaker.image = speaker.image;
          // Note: imagePath is excluded as it's only used for cleanup, not storage
          
          return cleanSpeaker;
        }), // Store speakers directly in the activity document, cleaned of undefined values
        tags: formData.tags,
        contactEmail: formData.contactEmail.trim(),
        contactName: formData.contactName.trim(),
        contactPhone: formData.contactPhone.trim(),
        imageUrl,
        imagePath,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: userId,
        updatedBy: userId,
        registeredParticipants: 0,
        waitlistCount: 0,
        views: 0
      };

      // Only add eventEndDate if it's a multi-day activity and has a value
      if (!formData.isOneDayActivity && formData.eventEndDate) {
        activityData.eventEndDate = formData.eventEndDate;
      }

      console.log('Prepared activity data for Firestore:', activityData);

      // Add to Firestore
      console.log('Adding document to Firestore collection:', ACTIVITIES_COLLECTION);
      const docRef = await addDoc(collection(db, ACTIVITIES_COLLECTION), activityData);
      console.log('Document added successfully with ID:', docRef.id);

      // Return the created activity
      const createdActivity = this.convertFirestoreDocToActivity({
        id: docRef.id,
        ...activityData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      
      console.log('Activity created successfully:', createdActivity);
      return createdActivity;
    } catch (error) {
      console.error('Error creating activity:', error);
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('permission-denied')) {
          throw new Error('Permission denied. Please check your admin privileges.');
        } else if (error.message.includes('network')) {
          throw new Error('Network error. Please check your internet connection.');
        } else {
          throw new Error(`Failed to create activity: ${error.message}`);
        }
      }
      
      throw new Error('Failed to create activity due to an unknown error');
    }
  }

  /**
   * Get all activities with filtering, sorting, and pagination
   */
  async getActivities(
    filters?: ActivityFilters,
    sortOptions?: ActivitySortOptions,
    page = 1,
    pageSize = 12
  ): Promise<ActivityListResponse> {
    try {
      console.log('🔍 ActivitiesService.getActivities: Starting with params:', {
        filters,
        sortOptions,
        page,
        pageSize
      });

      let baseQuery = collection(db, ACTIVITIES_COLLECTION);
      let queryConstraints: any[] = [];

      // Apply filters first
      if (filters) {
        console.log('🔍 ActivitiesService: Applying filters:', filters);
        
        if (filters.status && filters.status !== 'all') {
          console.log('🔍 ActivitiesService: Adding status filter:', filters.status);
          queryConstraints.push(where('status', '==', filters.status));
        }
        
        if (filters.isPublic !== undefined) {
          console.log('🔍 ActivitiesService: Adding isPublic filter:', filters.isPublic);
          queryConstraints.push(where('isPublic', '==', filters.isPublic));
        }

        if (filters.tags && filters.tags.length > 0) {
          console.log('🔍 ActivitiesService: Adding tags filter:', filters.tags);
          queryConstraints.push(where('tags', 'array-contains-any', filters.tags));
        }

        if (filters.organizer) {
          console.log('🔍 ActivitiesService: Adding organizer filter:', filters.organizer);
          queryConstraints.push(where('organizers', 'array-contains', filters.organizer));
        }

        // ⚠️ Date range filtering moved to client-side to avoid composite index issues
        if (filters.dateRange) {
          console.log('🔍 ActivitiesService: Date range filtering will be applied client-side:', filters.dateRange);
        }
      }

      // ✅ FIX: Apply sorting with better composite index handling
      if (sortOptions) {
        console.log('🔍 ActivitiesService: Attempting to add server-side sort:', sortOptions);
        
        try {
          // Try to add sorting to Firestore query
          const direction = sortOptions.direction === 'desc' ? 'desc' : 'asc';
          
          // ✅ FIX: Only add orderBy if we have a simple query (no complex filters)
          // This avoids most composite index requirements
          if (queryConstraints.length <= 1) {
            console.log('✅ ActivitiesService: Adding server-side sort (simple query)');
            queryConstraints.push(orderBy(sortOptions.field, direction));
          } else {
            console.log('⚠️ ActivitiesService: Skipping server-side sort (complex query), will sort client-side');
          }
        } catch (error) {
          console.warn('⚠️ ActivitiesService: Server-side sorting failed, will use client-side sorting:', error);
        }
      }

      // Create and execute query
      console.log('🔍 ActivitiesService: Creating query with', queryConstraints.length, 'constraints');
      const q = query(baseQuery, ...queryConstraints);

      console.log('📡 ActivitiesService: Executing Firestore query...');
      const snapshot = await getDocs(q);
      
      console.log('✅ ActivitiesService: Query returned', snapshot.size, 'documents');

      // Convert all documents first
      let activities: Activity[] = snapshot.docs.map(doc => {
        return this.convertFirestoreDocToActivity({
          id: doc.id,
          ...doc.data()
        } as ActivityFirestoreDoc);
      });

      console.log('✅ ActivitiesService: Converted', activities.length, 'activities');

      // ✅ FIX: Apply client-side date range filtering if needed
      if (filters?.dateRange) {
        const originalLength = activities.length;
        activities = activities.filter(activity => {
          const activityDate = activity.eventDate;
          const isAfterStart = !filters.dateRange?.start || activityDate >= filters.dateRange.start;
          const isBeforeEnd = !filters.dateRange?.end || activityDate <= filters.dateRange.end;
          return isAfterStart && isBeforeEnd;
        });
        console.log(`📊 ActivitiesService: Date filtering: ${originalLength} → ${activities.length} activities`);
      }

      // ✅ FIX: Apply client-side sorting if not already sorted by server
      const needsClientSideSorting = !sortOptions || queryConstraints.length > 1 || 
                                     queryConstraints.some(constraint => constraint.type !== 'where');
      
      if (sortOptions && needsClientSideSorting) {
        console.log('🔄 ActivitiesService: Applying client-side sorting:', sortOptions);
        
        activities.sort((a, b) => {
          let comparison = 0;
          
          switch (sortOptions.field) {
            case 'eventDate':
              // Primary sort: eventDate
              comparison = a.eventDate.localeCompare(b.eventDate);
              // Secondary sort: startTime for same dates
              if (comparison === 0) {
                comparison = a.startTime.localeCompare(b.startTime);
              }
              // Tertiary sort: name for completely identical dates/times
              if (comparison === 0) {
                comparison = a.name.localeCompare(b.name);
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
              // Default to eventDate sorting
              comparison = a.eventDate.localeCompare(b.eventDate);
              if (comparison === 0) {
                comparison = a.startTime.localeCompare(b.startTime);
              }
          }
          
          return sortOptions.direction === 'desc' ? -comparison : comparison;
        });

        console.log('✅ ActivitiesService: Client-side sorting complete:', {
          sortBy: sortOptions.field,
          direction: sortOptions.direction,
          firstActivity: activities[0]?.name,
          firstDate: activities[0]?.eventDate,
          firstTime: activities[0]?.startTime
        });
      }

      // Apply client-side search filter for full-text search
      if (filters?.search) {
        console.log('🔍 ActivitiesService: Applying search filter:', filters.search);
        const searchLower = filters.search.toLowerCase();
        const originalLength = activities.length;
        
        activities = activities.filter(activity =>
          activity.name.toLowerCase().includes(searchLower) ||
          activity.shortDescription.toLowerCase().includes(searchLower) ||
          (activity.description || '').toLowerCase().includes(searchLower) ||
          activity.venueName.toLowerCase().includes(searchLower) ||
          activity.organizers.some(org => org.toLowerCase().includes(searchLower)) ||
          activity.tags.some(tag => tag.toLowerCase().includes(searchLower))
        );
        
        console.log(`📊 ActivitiesService: Search filtering: ${originalLength} → ${activities.length} activities`);
      }

      // Apply pagination on sorted and filtered results
      const totalCount = activities.length;
      const totalPages = Math.ceil(totalCount / pageSize);
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedActivities = activities.slice(startIndex, endIndex);

      console.log('📄 ActivitiesService: Pagination applied:', {
        totalCount,
        totalPages,
        currentPage: page,
        pageSize,
        startIndex,
        endIndex,
        returnedCount: paginatedActivities.length
      });

      return {
        activities: paginatedActivities,
        total: totalCount,
        page: page,
        limit: pageSize,
        totalPages,
        hasMore: page < totalPages
      };

    } catch (error) {
      console.error('❌ ActivitiesService: Error in getActivities:', error);
      
      // ✅ FIX: Provide more specific error handling for Firestore issues
      if (error instanceof Error) {
        if (error.message.includes('requires an index')) {
          console.error('❌ Firestore Index Error - Creating composite index required');
          console.error('💡 Suggestion: Either create the required index or modify query to avoid composite index');
          throw new Error('Database indexing required. Please contact support.');
        } else if (error.message.includes('FAILED_PRECONDITION')) {
          console.error('❌ Firestore Query Precondition Failed');
          throw new Error('Database query configuration error. Please try again.');
        } else if (error.message.includes('permission-denied')) {
          console.error('❌ Firestore Permission Denied');
          throw new Error('Access denied. Please check your permissions.');
        }
      }
      
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        code: (error as any)?.code,
        stack: error instanceof Error ? error.stack : undefined
      });
      
      throw new Error('Failed to fetch activities');
    }
  }

  /**
   * Get public activities for homepage display
   */
  async getPublicActivities(limitCount = 6): Promise<Activity[]> {
    try {
      // First try the optimized query with composite index
      const q = query(
        collection(db, ACTIVITIES_COLLECTION),
        where('status', '==', 'published'),
        orderBy('eventDate', 'asc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => 
        this.convertFirestoreDocToActivity({
          id: doc.id,
          ...doc.data()
        } as ActivityFirestoreDoc)
      );
    } catch (error) {
      console.error('Error fetching public activities with index, falling back to client-side sorting:', error);
      
      // Fallback: Query without orderBy and sort client-side
      try {
        const fallbackQuery = query(
          collection(db, ACTIVITIES_COLLECTION),
          where('status', '==', 'published'),
          limit(limitCount * 3) // Get more docs to ensure we have enough after sorting
        );

        const fallbackSnapshot = await getDocs(fallbackQuery);
        const activities = fallbackSnapshot.docs
          .map(doc => this.convertFirestoreDocToActivity({
            id: doc.id,
            ...doc.data()
          } as ActivityFirestoreDoc))
          .sort((a, b) => {
            // Sort by eventDate first (ascending)
            const dateComparison = a.eventDate.localeCompare(b.eventDate);
            if (dateComparison !== 0) return dateComparison;
            
            // If same date, sort by startTime (ascending)
            return a.startTime.localeCompare(b.startTime);
          })
          .slice(0, limitCount); // Apply limit after sorting

        console.log('✅ Successfully fetched public activities with client-side sorting');
        return activities;
      } catch (fallbackError) {
        console.error('Error in fallback query for public activities:', fallbackError);
        return []; // Return empty array instead of throwing for public display
      }
    }
  }

  /**
   * Get upcoming activities
   */
  async getUpcomingActivities(limitCount = 10): Promise<Activity[]> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // First try the optimized query with composite index
      const q = query(
        collection(db, ACTIVITIES_COLLECTION),
        where('status', '==', 'published'),
        where('eventDate', '>=', today),
        orderBy('eventDate', 'asc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => 
        this.convertFirestoreDocToActivity({
          id: doc.id,
          ...doc.data()
        } as ActivityFirestoreDoc)
      );
    } catch (error) {
      console.error('Error fetching upcoming activities with index, falling back to client-side sorting:', error);
      
      // Fallback: Query without orderBy and sort client-side
      try {
        const today = new Date().toISOString().split('T')[0];
        const fallbackQuery = query(
          collection(db, ACTIVITIES_COLLECTION),
          where('status', '==', 'published'),
          where('eventDate', '>=', today),
          limit(limitCount * 2) // Get more docs to ensure we have enough after sorting
        );

        const fallbackSnapshot = await getDocs(fallbackQuery);
        const activities = fallbackSnapshot.docs
          .map(doc => this.convertFirestoreDocToActivity({
            id: doc.id,
            ...doc.data()
          } as ActivityFirestoreDoc))
          .sort((a, b) => {
            // Sort by eventDate first (ascending)
            const dateComparison = a.eventDate.localeCompare(b.eventDate);
            if (dateComparison !== 0) return dateComparison;
            
            // If same date, sort by startTime (ascending)
            return a.startTime.localeCompare(b.startTime);
          })
          .slice(0, limitCount); // Apply limit after sorting

        console.log('✅ Successfully fetched upcoming activities with client-side sorting');
        return activities;
      } catch (fallbackError) {
        console.error('Error in fallback query for upcoming activities:', fallbackError);
        return []; // Return empty array instead of throwing
      }
    }
  }

  /**
   * Get ALL activities for admin management (no limits)
   * This method should fetch all activities regardless of status
   */
  async getAllActivities(): Promise<Activity[]> {
    try {
      console.log('📊 Fetching ALL activities for admin...');
      
      // No filters, no limits - get everything for admin
      const q = query(
        collection(db, ACTIVITIES_COLLECTION),
        orderBy('createdAt', 'desc') // Sort by creation date for admin
      );
      
      const snapshot = await getDocs(q);
      const activities = snapshot.docs.map(doc => 
        this.convertFirestoreDocToActivity({
          id: doc.id,
          ...doc.data()
        } as ActivityFirestoreDoc)
      );
      
      console.log('✅ Successfully fetched all activities:', {
        total: activities.length,
        byStatus: {
          published: activities.filter(a => a.status === 'published').length,
          draft: activities.filter(a => a.status === 'draft').length,
          cancelled: activities.filter(a => a.status === 'cancelled').length,
          completed: activities.filter(a => a.status === 'completed').length
        }
      });
      
      return activities;
      
    } catch (error) {
      console.error('❌ Error fetching all activities:', error);
      
      // Fallback: try without orderBy to avoid index issues
      try {
        console.log('🔄 Fallback: fetching without orderBy...');
        const fallbackQuery = query(collection(db, ACTIVITIES_COLLECTION));
        const fallbackSnapshot = await getDocs(fallbackQuery);
        
        const activities = fallbackSnapshot.docs.map(doc => 
          this.convertFirestoreDocToActivity({
            id: doc.id,
            ...doc.data()
          } as ActivityFirestoreDoc)
        );
        
        console.log('✅ Fallback successful, total activities:', activities.length);
        return activities;
        
      } catch (fallbackError) {
        console.error('❌ Fallback also failed:', fallbackError);
        throw new Error('Failed to fetch activities. Please check your permissions.');
      }
    }
  }

  /**
   * Get a single activity by ID
   */
  async getActivityById(activityId: string): Promise<Activity | null> {
    try {
      const docRef = doc(db, ACTIVITIES_COLLECTION, activityId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return this.convertFirestoreDocToActivity({
          id: docSnap.id,
          ...docSnap.data()
        } as ActivityFirestoreDoc);
      }

      return null;
    } catch (error) {
      console.error('Error fetching activity:', error);
      throw new Error('Failed to fetch activity');
    }
  }

  /**
   * Update an existing activity
   */
  async updateActivity(
    activityId: string, 
    formData: Partial<ActivityFormData>, 
    userId: string
  ): Promise<Activity> {
    try {
      const docRef = doc(db, ACTIVITIES_COLLECTION, activityId);
      const currentDoc = await getDoc(docRef);

      if (!currentDoc.exists()) {
        throw new Error('Activity not found');
      }

      const currentData = currentDoc.data() as ActivityFirestoreDoc;
      let imageUrl = currentData.imageUrl;
      let imagePath = currentData.imagePath;

      // Handle image update
      if (formData.image) {
        // Delete old image if exists
        if (currentData.imagePath) {
          await this.deleteActivityImage(currentData.imagePath);
        }

        // Upload new image
        const result = await this.uploadActivityImage(formData.image);
        imageUrl = result.downloadURL;
        imagePath = result.path;
      }

      // Prepare update data
      const updateData: any = {
        updatedAt: serverTimestamp(),
        updatedBy: userId
      };

      // Only update provided fields
      if (formData.name !== undefined) updateData.name = formData.name.trim();
      if (formData.shortDescription !== undefined) updateData.shortDescription = formData.shortDescription.trim();
      if (formData.status !== undefined) updateData.status = formData.status;
      if (formData.isPublic !== undefined) updateData.isPublic = formData.isPublic;
      if (formData.needSubmission !== undefined) updateData.needSubmission = formData.needSubmission;
      if (formData.maxParticipants !== undefined) updateData.maxParticipants = formData.maxParticipants;
      if (formData.isOneDayActivity !== undefined) updateData.isOneDayActivity = formData.isOneDayActivity;
      if (formData.eventDate !== undefined) updateData.eventDate = formData.eventDate;
      
      // Handle eventEndDate properly - avoid undefined values
      if (formData.isOneDayActivity !== undefined || formData.eventEndDate !== undefined) {
        const isOneDayActivity = formData.isOneDayActivity !== undefined ? formData.isOneDayActivity : currentData.isOneDayActivity;
        
        if (isOneDayActivity) {
          // For one-day activities, remove the eventEndDate field
          updateData.eventEndDate = deleteField();
        } else if (formData.eventEndDate) {
          // For multi-day activities, set the eventEndDate if provided
          updateData.eventEndDate = formData.eventEndDate;
        }
      }
      
      if (formData.startTime !== undefined) updateData.startTime = formData.startTime;
      if (formData.endTime !== undefined) updateData.endTime = formData.endTime;
      if (formData.registrationDeadline !== undefined) updateData.registrationDeadline = formData.registrationDeadline;
      if (formData.venueName !== undefined) updateData.venueName = formData.venueName.trim();
      if (formData.venueLocation !== undefined) updateData.venueLocation = formData.venueLocation.trim();
      if (formData.description !== undefined) updateData.description = formData.description.trim();
      if (formData.organizers !== undefined) updateData.organizers = formData.organizers.map(org => org.trim()).filter(org => org.length > 0);
      if (formData.tags !== undefined) updateData.tags = formData.tags;
      if (formData.contactEmail !== undefined) updateData.contactEmail = formData.contactEmail.trim();
      if (formData.contactName !== undefined) updateData.contactName = formData.contactName.trim();
      if (formData.contactPhone !== undefined) updateData.contactPhone = formData.contactPhone.trim();

      // Handle speakers update if provided - store directly in the document
      if (formData.speakers !== undefined) {
        console.log('✅ Updating speakers directly in activity document:', activityId);
        // Clean speakers data to remove undefined values and exclude imagePath
        updateData.speakers = formData.speakers.map(speaker => {
          const cleanSpeaker: any = {
            id: speaker.id,
            name: speaker.name,
            role: speaker.role
          };
          
          // Only add fields that have actual values (exclude imagePath - it's for cleanup only)
          if (speaker.email) cleanSpeaker.email = speaker.email;
          if (speaker.phone) cleanSpeaker.phone = speaker.phone;
          if (speaker.otherRole) cleanSpeaker.otherRole = speaker.otherRole;
          if (speaker.bio) cleanSpeaker.bio = speaker.bio;
          if (speaker.image) cleanSpeaker.image = speaker.image;
          // Note: imagePath is excluded as it's only used for cleanup, not storage
          
          return cleanSpeaker;
        });
      }

      // Update image fields if changed
      if (formData.image) {
        updateData.imageUrl = imageUrl;
        updateData.imagePath = imagePath;
      }

      // Update in Firestore
      console.log('Updating activity with data:', updateData);
      await updateDoc(docRef, updateData);
      console.log('Activity updated successfully');

      // Return updated activity
      const updatedDoc = await getDoc(docRef);
      return this.convertFirestoreDocToActivity({
        id: updatedDoc.id,
        ...updatedDoc.data()
      } as ActivityFirestoreDoc);
    } catch (error) {
      console.error('Error updating activity:', error);
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('permission-denied')) {
          throw new Error('Permission denied. Please check your admin privileges.');
        } else if (error.message.includes('network')) {
          throw new Error('Network error. Please check your internet connection.');
        } else {
          throw new Error(`Failed to update activity: ${error.message}`);
        }
      }
      
      throw new Error('Failed to update activity due to an unknown error');
    }
  }

  /**
   * Delete an activity
   */
  async deleteActivity(activityId: string): Promise<void> {
    try {
      const docRef = doc(db, ACTIVITIES_COLLECTION, activityId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('Activity not found');
      }

      const activityData = docSnap.data() as ActivityFirestoreDoc;

      // Delete associated image if exists
      if (activityData.imagePath) {
        await this.deleteActivityImage(activityData.imagePath);
      }

      // Delete from Firestore
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting activity:', error);
      throw new Error('Failed to delete activity');
    }
  }

  /**
   * Bulk update activities
   */
  async bulkUpdateActivities(
    activityIds: string[], 
    updates: Partial<ActivityFirestoreDoc>,
    userId: string
  ): Promise<void> {
    try {
      const batch = writeBatch(db);

      const updateData = {
        ...updates,
        updatedAt: serverTimestamp(),
        updatedBy: userId
      };

      activityIds.forEach(activityId => {
        const docRef = doc(db, ACTIVITIES_COLLECTION, activityId);
        batch.update(docRef, updateData);
      });

      await batch.commit();
    } catch (error) {
      console.error('Error bulk updating activities:', error);
      throw new Error('Failed to bulk update activities');
    }
  }

  /**
   * Bulk delete activities
   */
  async bulkDeleteActivities(activityIds: string[]): Promise<void> {
    try {
      // Get all activities first to delete their images
      const activities = await Promise.all(
        activityIds.map(id => this.getActivityById(id))
      );

      // Delete images in parallel
      await Promise.all(
        activities
          .filter(activity => activity?.image)
          .map(activity => {
            // Extract path from URL or use stored path
            const imagePath = this.extractImagePathFromUrl(activity!.image!);
            return this.deleteActivityImage(imagePath);
          })
      );

      // Delete from Firestore using batch
      const batch = writeBatch(db);
      activityIds.forEach(activityId => {
        const docRef = doc(db, ACTIVITIES_COLLECTION, activityId);
        batch.delete(docRef);
      });

      await batch.commit();
    } catch (error) {
      console.error('Error bulk deleting activities:', error);
      throw new Error('Failed to bulk delete activities');
    }
  }

  /**
   * Duplicate an activity
   */
  async duplicateActivity(activityId: string, userId: string): Promise<Activity> {
    try {
      const original = await this.getActivityById(activityId);
      if (!original) {
        throw new Error('Original activity not found');
      }

      // Create duplicate with modifications
      const duplicateData: ActivityFormData = {
        image: null, // Don't duplicate image directly
        name: `${original.name} (Copy)`,
        shortDescription: original.shortDescription,
        status: 'draft', // Always start as draft
        isPublic: false, // Make private by default
        needSubmission: original.needSubmission,
        maxParticipants: original.maxParticipants,
        isOneDayActivity: original.isOneDayActivity,
        eventDate: original.eventDate,
        eventEndDate: original.eventEndDate || '',
        startTime: original.startTime,
        endTime: original.endTime,
        registrationDeadline: original.registrationDeadline,
        venueName: original.venueName,
        venueLocation: original.venueLocation || '',
        description: original.description,
        organizers: [...original.organizers],
        speakers: [...original.speakers], // Include speakers
        tags: [...original.tags],
        contactEmail: original.contactEmail,
        contactName: original.contactName,
        contactPhone: original.contactPhone
      };

      return this.createActivity(duplicateData, userId);
    } catch (error) {
      console.error('Error duplicating activity:', error);
      throw new Error('Failed to duplicate activity');
    }
  }

  /**
   * Search activities with advanced text search
   */
  async searchActivities(
    searchTerm: string, 
    filters?: Omit<ActivityFilters, 'search'>,
    limit = 20
  ): Promise<ActivitySearchResult> {
    try {
      // Get all activities that match other filters
      const response = await this.getActivities(filters, undefined, 1, 1000); // Get large set for search
      
      const searchTermLower = searchTerm.toLowerCase();
      const matchedActivities = response.activities.filter(activity => {
        // Search in multiple fields
        const searchableText = [
          activity.name,
          activity.shortDescription,
          activity.description || '',
          activity.venueName,
          activity.contactName || '',
          ...activity.organizers,
          ...activity.tags
        ].join(' ').toLowerCase();

        return searchableText.includes(searchTermLower);
      });

      // Generate search suggestions based on partial matches
      const suggestions = this.generateSearchSuggestions(searchTerm, response.activities);

      return {
        activities: matchedActivities.slice(0, limit),
        totalResults: matchedActivities.length,
        searchTerm,
        suggestions
      };
    } catch (error) {
      console.error('Error searching activities:', error);
      throw new Error('Failed to search activities');
    }
  }

  /**
   * Get activity analytics for dashboard
   */
  async getActivityAnalytics(): Promise<ActivityAnalytics> {
    try {
      const snapshot = await getDocs(collection(db, ACTIVITIES_COLLECTION));
      const activities = snapshot.docs.map(doc => 
        this.convertFirestoreDocToActivity({
          id: doc.id,
          ...doc.data()
        } as ActivityFirestoreDoc)
      );

      // Calculate status distribution
      const activitiesByStatus: Record<ActivityStatus, number> = {
        draft: 0,
        published: 0,
        cancelled: 0,
        completed: 0
      };

      let totalParticipants = 0;
      const tagCounts: Record<string, number> = {};
      const monthlyData: Record<string, { created: number; completed: number; participants: number }> = {};

      activities.forEach(activity => {
        // Status counts
        activitiesByStatus[activity.status]++;

        // Participant counts
        totalParticipants += activity.registeredParticipants || 0;

        // Tag popularity
        activity.tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });

        // Monthly trends
        const createdMonth = new Date(activity.createdAt).toISOString().slice(0, 7); // YYYY-MM
        if (!monthlyData[createdMonth]) {
          monthlyData[createdMonth] = { created: 0, completed: 0, participants: 0 };
        }
        monthlyData[createdMonth].created++;

        if (activity.status === 'completed') {
          monthlyData[createdMonth].completed++;
          monthlyData[createdMonth].participants += activity.registeredParticipants || 0;
        }
      });

      // Calculate derived metrics
      const totalActivities = activities.length;
      const averageParticipantsPerEvent = totalActivities > 0 ? Math.round(totalParticipants / totalActivities) : 0;
      const today = new Date().toISOString().split('T')[0];
      const upcomingEvents = activities.filter(a => a.eventDate >= today && a.status === 'published').length;
      const completedEvents = activitiesByStatus.completed;

      // Popular tags (top 10)
      const popularTags = Object.entries(tagCounts)
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Monthly trends (last 12 months)
      const monthlyTrends = Object.entries(monthlyData)
        .map(([month, data]) => ({
          month,
          eventsCreated: data.created,
          eventsCompleted: data.completed,
          totalParticipants: data.participants
        }))
        .sort((a, b) => a.month.localeCompare(b.month))
        .slice(-12);

      return {
        totalActivities,
        activitiesByStatus,
        totalParticipants,
        averageParticipantsPerEvent,
        upcomingEvents,
        completedEvents,
        popularTags,
        monthlyTrends
      };
    } catch (error) {
      console.error('Error fetching activity analytics:', error);
      throw new Error('Failed to fetch activity analytics');
    }
  }

  /**
   * Increment activity view count
   */
  async incrementViews(activityId: string): Promise<void> {
    try {
      const docRef = doc(db, ACTIVITIES_COLLECTION, activityId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const currentViews = docSnap.data().views || 0;
        await updateDoc(docRef, {
          views: currentViews + 1,
          updatedAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error incrementing views:', error);
      // Don't throw error for view counting
    }
  }

  /**
   * Update participant count
   */
  async updateParticipantCount(
    activityId: string, 
    registeredCount: number, 
    waitlistCount = 0
  ): Promise<void> {
    try {
      const docRef = doc(db, ACTIVITIES_COLLECTION, activityId);
      await updateDoc(docRef, {
        registeredParticipants: registeredCount,
        waitlistCount,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating participant count:', error);
      throw new Error('Failed to update participant count');
    }
  }

  /**
   * Private helper methods
   */
  private async uploadActivityImage(file: File): Promise<{ downloadURL: string; path: string }> {
    try {
      // Validate file
      const maxSize = 5 * 1024 * 1024; // 5MB
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

      if (file.size > maxSize) {
        throw new Error('Image file size must be less than 5MB');
      }

      if (!allowedTypes.includes(file.type)) {
        throw new Error('Only JPEG, PNG, and WebP images are allowed');
      }

      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const path = `${IMAGES_STORAGE_PATH}/${fileName}`;
      const storageRef = ref(storage, path);

      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      return { downloadURL, path };
    } catch (error) {
      console.error('Error uploading activity image:', error);
      throw error;
    }
  }

  private async deleteActivityImage(imagePath: string): Promise<void> {
    try {
      const imageRef = ref(storage, imagePath);
      await deleteObject(imageRef);
    } catch (error) {
      // Log error but don't throw - image might already be deleted
      console.warn('Error deleting activity image:', error);
    }
  }

  private extractImagePathFromUrl(imageUrl: string): string {
    try {
      // Extract path from Firebase Storage URL
      const url = new URL(imageUrl);
      const pathMatch = url.pathname.match(/\/o\/(.+)\?/);
      if (pathMatch) {
        return decodeURIComponent(pathMatch[1]);
      }
      return imageUrl; // Fallback to original URL
    } catch (error) {
      return imageUrl; // Fallback to original URL
    }
  }

  private generateSearchSuggestions(searchTerm: string, activities: Activity[]): string[] {
    const suggestions = new Set<string>();
    const searchTermLower = searchTerm.toLowerCase();

    activities.forEach(activity => {
      // Add partial matches from activity names
      if (activity.name.toLowerCase().includes(searchTermLower)) {
        suggestions.add(activity.name);
      }

      // Add matching tags
      activity.tags.forEach(tag => {
        if (tag.toLowerCase().includes(searchTermLower)) {
          suggestions.add(tag);
        }
      });

      // Add matching organizers
      activity.organizers.forEach(organizer => {
        if (organizer.toLowerCase().includes(searchTermLower)) {
          suggestions.add(organizer);
        }
      });
    });

    return Array.from(suggestions).slice(0, 5); // Return top 5 suggestions
  }

  private convertFirestoreDocToActivity(doc: ActivityFirestoreDoc): Activity {
    return {
      id: doc.id,
      image: doc.imageUrl, // Use imageUrl field from database
      name: doc.name,
      shortDescription: doc.shortDescription,
      status: doc.status,
      isPublic: doc.isPublic,
      needSubmission: doc.needSubmission || false,
      maxParticipants: doc.maxParticipants,
      isOneDayActivity: doc.isOneDayActivity !== undefined ? doc.isOneDayActivity : true,
      eventDate: doc.eventDate,
      eventEndDate: doc.eventEndDate,
      startTime: doc.startTime,
      endTime: doc.endTime,
      registrationDeadline: doc.registrationDeadline,
      venueName: doc.venueName,
      venueLocation: doc.venueLocation || '',
      description: doc.description || '',
      organizers: doc.organizers || [],
      speakers: doc.speakers || [], // Use speakers directly from the document
      tags: doc.tags || [],
      contactEmail: doc.contactEmail,
      contactName: doc.contactName || '',
      contactPhone: doc.contactPhone || '',
      createdAt: doc.createdAt?.toDate ? doc.createdAt.toDate().toISOString() : new Date().toISOString(),
      updatedAt: doc.updatedAt?.toDate ? doc.updatedAt.toDate().toISOString() : new Date().toISOString(),
      createdBy: doc.createdBy,
      updatedBy: doc.updatedBy,
      registeredParticipants: doc.registeredParticipants || 0,
      waitlistCount: doc.waitlistCount || 0,
      views: doc.views || 0
    };
  }
}

// Export singleton instance
export const activitiesService = ActivitiesService.getInstance();
export default activitiesService;
