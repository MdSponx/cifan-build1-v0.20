import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query, 
  orderBy, 
  where,
  serverTimestamp,
  onSnapshot,
  limit,
  startAfter,
  QueryDocumentSnapshot,
  DocumentData
} from 'firebase/firestore';
import { db } from '../firebase';
import { 
  FeatureFilmData, 
  FeatureFilm, 
  CreateFeatureFilmData, 
  UpdateFeatureFilmData, 
  FilmFilters,
  FileMetadata,
  PublicationStatus
} from '../types/featureFilm.types';
import { createMultipleGuests, getGuests, deleteAllGuests } from './guestService';
import { uploadFile, generateFeatureFilmUploadPath } from '../utils/fileUpload';

const COLLECTION_NAME = 'films';
const NEW_COLLECTION_NAME = 'films'; // Use the existing films collection consistently

export interface FeatureFilmServiceResult {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Enhanced gallery data merging function
 * Properly combines existing URLs with newly uploaded file URLs while preserving indices
 */
const mergeGalleryData = (
  existingUrls: string[] = [],
  newFileUrls: string[] = [],
  currentCoverIndex?: number,
  currentLogoIndex?: number
): {
  mergedUrls: string[];
  adjustedCoverIndex?: number;
  adjustedLogoIndex?: number;
} => {
  console.log('🔄 Merging gallery data:', {
    existingUrls: existingUrls.length,
    newFileUrls: newFileUrls.length,
    currentCoverIndex,
    currentLogoIndex
  });

  // Filter out empty URLs from existing data
  const cleanExistingUrls = existingUrls.filter(url => url && url.trim() !== '');
  
  // Merge existing URLs with new file URLs
  const mergedUrls = [...cleanExistingUrls, ...newFileUrls];
  
  // Adjust indices based on the merge
  let adjustedCoverIndex = currentCoverIndex;
  let adjustedLogoIndex = currentLogoIndex;
  
  // If indices are beyond the merged array length, reset to first item
  if (adjustedCoverIndex !== undefined && adjustedCoverIndex >= mergedUrls.length) {
    adjustedCoverIndex = mergedUrls.length > 0 ? 0 : undefined;
    console.log('📐 Adjusted cover index due to array bounds:', adjustedCoverIndex);
  }
  
  if (adjustedLogoIndex !== undefined && adjustedLogoIndex >= mergedUrls.length) {
    adjustedLogoIndex = mergedUrls.length > 0 ? 0 : undefined;
    console.log('📐 Adjusted logo index due to array bounds:', adjustedLogoIndex);
  }

  console.log('✅ Gallery data merged successfully:', {
    totalUrls: mergedUrls.length,
    adjustedCoverIndex,
    adjustedLogoIndex,
    urls: mergedUrls
  });

  return {
    mergedUrls,
    adjustedCoverIndex,
    adjustedLogoIndex
  };
};

/**
 * Upload files for a feature film with enhanced gallery handling
 */
const uploadFeatureFilmFiles = async (
  filmId: string,
  filmData: FeatureFilmData,
  userId?: string
): Promise<{ updatedData: Partial<FeatureFilmData>; errors: string[] }> => {
  const updatedData: Partial<FeatureFilmData> = {};
  const errors: string[] = [];

  try {
    console.log('🚀 Starting file upload process for film:', filmId, {
      hasPoster: !!filmData.posterFile,
      hasTrailer: !!filmData.trailerFile,
      galleryFileCount: filmData.galleryFiles?.length || 0,
      existingGalleryUrls: filmData.galleryUrls?.length || 0
    });

    // Upload poster file if provided
    if (filmData.posterFile) {
      try {
        console.log('📤 Uploading poster file:', filmData.posterFile.name);
        const posterPath = generateFeatureFilmUploadPath(filmId, 'posters', filmData.posterFile.name, userId);
        const posterResult = await uploadFile(filmData.posterFile, posterPath);
        updatedData.posterUrl = posterResult.url;
        console.log('✅ Poster uploaded successfully:', posterResult.url);
      } catch (error) {
        console.error('❌ Error uploading poster:', error);
        errors.push('Failed to upload poster');
      }
    }

    // Upload trailer file if provided
    if (filmData.trailerFile) {
      try {
        console.log('📤 Uploading trailer file:', filmData.trailerFile.name);
        const trailerPath = generateFeatureFilmUploadPath(filmId, 'trailers', filmData.trailerFile.name, userId);
        const trailerResult = await uploadFile(filmData.trailerFile, trailerPath);
        updatedData.trailerUrl = trailerResult.url;
        console.log('✅ Trailer uploaded successfully:', trailerResult.url);
      } catch (error) {
        console.error('❌ Error uploading trailer:', error);
        errors.push('Failed to upload trailer');
      }
    }

    // Enhanced gallery files upload with proper merging
    if (filmData.galleryFiles && filmData.galleryFiles.length > 0) {
      console.log('🖼️ Starting gallery files upload:', {
        fileCount: filmData.galleryFiles.length,
        filmId,
        userId,
        existingUrls: filmData.galleryUrls?.length || 0,
        currentCoverIndex: filmData.galleryCoverIndex,
        currentLogoIndex: filmData.galleryLogoIndex
      });
      
      try {
        const newFileUrls: string[] = [];
        const uploadPromises: Promise<void>[] = [];
        
        // Upload files in parallel for better performance
        for (let i = 0; i < filmData.galleryFiles.length; i++) {
          const file = filmData.galleryFiles[i];
          console.log(`📤 Uploading gallery file ${i + 1}/${filmData.galleryFiles.length}:`, {
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type
          });
          
          const uploadPromise = (async () => {
            try {
              const galleryPath = generateFeatureFilmUploadPath(filmId, 'gallery', file.name, userId);
              console.log(`🔗 Generated upload path for ${file.name}:`, galleryPath);
              
              const galleryResult = await uploadFile(file, galleryPath);
              console.log(`✅ Successfully uploaded ${file.name}:`, galleryResult.url);
              
              newFileUrls[i] = galleryResult.url; // Preserve order
            } catch (fileError) {
              console.error(`❌ Failed to upload ${file.name}:`, fileError);
              errors.push(`Failed to upload ${file.name}: ${fileError instanceof Error ? fileError.message : 'Unknown error'}`);
            }
          })();
          
          uploadPromises.push(uploadPromise);
        }
        
        // Wait for all uploads to complete
        await Promise.all(uploadPromises);
        
        // Filter out any failed uploads (undefined values)
        const successfulUrls = newFileUrls.filter(url => url);
        
        if (successfulUrls.length > 0) {
          // Use the enhanced merging function
          const mergeResult = mergeGalleryData(
            filmData.galleryUrls,
            successfulUrls,
            filmData.galleryCoverIndex,
            filmData.galleryLogoIndex
          );
          
          updatedData.galleryUrls = mergeResult.mergedUrls;
          updatedData.galleryCoverIndex = mergeResult.adjustedCoverIndex;
          updatedData.galleryLogoIndex = mergeResult.adjustedLogoIndex;
          
          console.log('📊 Gallery merge completed:', {
            originalUrls: filmData.galleryUrls?.length || 0,
            newUrls: successfulUrls.length,
            totalUrls: mergeResult.mergedUrls.length,
            coverIndex: mergeResult.adjustedCoverIndex,
            logoIndex: mergeResult.adjustedLogoIndex
          });
        }
        
        console.log('✅ Gallery files upload completed:', {
          uploadedFiles: successfulUrls.length,
          failedFiles: filmData.galleryFiles.length - successfulUrls.length,
          totalUrls: updatedData.galleryUrls?.length || 0,
          errors: errors.length
        });
        
      } catch (error) {
        console.error('❌ Critical error during gallery files upload:', error);
        errors.push(`Gallery upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } else {
      // Even if no new files are uploaded, preserve existing data and indices
      console.log('ℹ️ No new gallery files to upload, preserving existing data');
      
      if (filmData.galleryUrls && filmData.galleryUrls.length > 0) {
        const cleanUrls = filmData.galleryUrls.filter(url => url && url.trim() !== '');
        if (cleanUrls.length > 0) {
          updatedData.galleryUrls = cleanUrls;
          console.log('📋 Preserved existing gallery URLs:', cleanUrls.length);
        }
      }
      
      // Preserve indices
      if (filmData.galleryCoverIndex !== undefined) {
        updatedData.galleryCoverIndex = filmData.galleryCoverIndex;
        console.log('🖼️ Preserved cover index:', updatedData.galleryCoverIndex);
      }
      
      if (filmData.galleryLogoIndex !== undefined) {
        updatedData.galleryLogoIndex = filmData.galleryLogoIndex;
        console.log('🏷️ Preserved logo index:', updatedData.galleryLogoIndex);
      }
    }

    console.log('🎯 File upload process completed:', {
      updatedFields: Object.keys(updatedData),
      errorCount: errors.length,
      errors: errors
    });

    return { updatedData, errors };
  } catch (error) {
    console.error('💥 Critical error in uploadFeatureFilmFiles:', error);
    return { updatedData, errors: ['Failed to upload files'] };
  }
};

/**
 * Prepare film data for Firestore (remove File objects and undefined values)
 */
const prepareFilmDataForFirestore = (filmData: FeatureFilmData): Partial<FeatureFilmData> => {
  const { posterFile, trailerFile, galleryFiles, ...cleanData } = filmData;
  
  // Remove undefined values as Firestore doesn't accept them
  const firestoreData: any = {};
  
  Object.entries(cleanData).forEach(([key, value]) => {
    if (value !== undefined) {
      firestoreData[key] = value;
    }
  });
  
  return firestoreData;
};

/**
 * Helper method to extract crew members from film data for guests subcollection
 */
const extractCrewMembersFromFilmData = (filmData: Partial<FeatureFilmData>): any[] => {
  // Extract crew/cast information from film data
  const crewMembers: any[] = [];
  
  // PRIORITY 1: Use guests from the form if they exist (from GuestManagement component)
  if (filmData.guests && Array.isArray(filmData.guests) && filmData.guests.length > 0) {
    console.log('✅ Using guests from form data:', filmData.guests.length, 'guests');
    filmData.guests.forEach((guest, index) => {
      if (guest.name && guest.name.trim()) {
        // Direct mapping - no field conversion needed since Guest interface now matches guestService
        crewMembers.push({
          name: guest.name.trim(),
          role: guest.role || 'Guest',
          email: guest.email?.trim() || undefined,
          phone: guest.phone?.trim() || undefined,
          bio: guest.bio?.trim() || undefined
        });
      }
    });
    console.log('📊 Mapped guests to crew members for films collection:', crewMembers.length);
    return crewMembers; // Return early if we have form guests
  }
  
  // PRIORITY 2: Extract from basic film fields if no form guests exist
  console.log('⚠️ No form guests found, extracting from basic film fields');
  
  // Add director as primary crew member
  if (filmData.director && filmData.director.trim()) {
    crewMembers.push({
      name: filmData.director.trim(),
      contact: '', // Default empty contact
      role: 'Director',
      otherRole: undefined,
      remarks: ''
    });
  }
  
  // Add producer if available
  if (filmData.producer && filmData.producer.trim()) {
    crewMembers.push({
      name: filmData.producer.trim(),
      contact: '', // Default empty contact
      role: 'Producer',
      otherRole: undefined,
      remarks: ''
    });
  }
  
  // Add main actors if available
  if (filmData.mainActors && filmData.mainActors.trim()) {
    const actors = filmData.mainActors.split(',').map(actor => actor.trim());
    actors.forEach((actor) => {
      if (actor) {
        crewMembers.push({
          name: actor,
          contact: '', // Default empty contact
          role: 'Actor',
          otherRole: undefined,
          remarks: ''
        });
      }
    });
  }
  
  console.log('📊 Extracted crew members from basic fields:', crewMembers.length);
  return crewMembers;
};

/**
 * Create a new feature film record
 */
export const createFeatureFilm = async (
  filmData: Omit<FeatureFilmData, 'id' | 'createdAt' | 'updatedAt'>,
  userId: string
): Promise<FeatureFilmServiceResult> => {
  try {
    console.log('🎬 Creating new feature film:', {
      title: filmData.titleEn,
      userId,
      hasFiles: !!(filmData.posterFile || filmData.trailerFile || (filmData.galleryFiles && filmData.galleryFiles.length > 0))
    });

    // Separate guests from film data and prepare clean data for Firestore
    const { guests, ...filmDataWithoutGuests } = filmData;
    const cleanFilmData = prepareFilmDataForFirestore(filmDataWithoutGuests as FeatureFilmData);
    
    const docData = {
      ...cleanFilmData,
      userId: userId, // Use userId for films collection (matches Firestore rules)
      createdBy: userId, // Keep createdBy for compatibility
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    // Create the document first
    const docRef = await addDoc(collection(db, COLLECTION_NAME), docData);
    const filmId = docRef.id;
    console.log('✅ Film document created with ID:', filmId);
    
    // Upload files if any are provided
    const hasFiles = filmData.posterFile || filmData.trailerFile || (filmData.galleryFiles && filmData.galleryFiles.length > 0);
    if (hasFiles) {
      console.log('📤 Starting file upload process...');
      const { updatedData, errors } = await uploadFeatureFilmFiles(filmId, filmData, userId);
      
      if (errors.length > 0) {
        console.warn('⚠️ File upload errors:', errors);
      }
      
      // Update the document with file URLs if any files were uploaded
      if (Object.keys(updatedData).length > 0) {
        console.log('💾 Updating document with file URLs:', Object.keys(updatedData));
        await updateDoc(docRef, {
          ...updatedData,
          updatedAt: serverTimestamp()
        });
      }
    }
    
    // CRITICAL: Create guests subcollection from crew/cast data
    const crewMembers = extractCrewMembersFromFilmData(filmData as FeatureFilmData);
    if (crewMembers.length > 0) {
      try {
        await createMultipleGuests(filmId, crewMembers);
        console.log('✅ Guest subcollection created successfully in films collection');
      } catch (guestError) {
        console.error('❌ Error creating guest subcollection in films collection:', guestError);
        // Don't fail the entire film creation if guest creation fails
        // Guest Relations can create guests manually if needed
      }
    }

    // Fetch the created film data
    const createdDoc = await getDoc(docRef);
    if (createdDoc.exists()) {
      const createdData = { id: createdDoc.id, ...createdDoc.data() } as FeatureFilmData;
      console.log('🎉 Film created successfully:', createdData.id);
      return { success: true, data: createdData };
    } else {
      return { success: false, error: 'Film created but could not retrieve data' };
    }
    
  } catch (error) {
    console.error('💥 Error creating film:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create film' 
    };
  }
};

/**
 * Update an existing feature film record with enhanced gallery handling
 */
export const updateFeatureFilm = async (
  filmId: string,
  filmData: Partial<FeatureFilmData>,
  userId?: string
): Promise<FeatureFilmServiceResult> => {
  try {
    console.log('🔄 Updating feature film:', {
      filmId,
      userId,
      hasFiles: !!(filmData.posterFile || filmData.trailerFile || (filmData.galleryFiles && filmData.galleryFiles.length > 0)),
      hasGalleryUrls: !!(filmData.galleryUrls && filmData.galleryUrls.length > 0)
    });

    // Separate guests from film data and prepare clean data for Firestore
    const { guests, ...filmDataWithoutGuests } = filmData;
    const cleanFilmData = prepareFilmDataForFirestore(filmDataWithoutGuests as FeatureFilmData);
    
    const filmRef = doc(db, COLLECTION_NAME, filmId);
    
    // Upload files if any are provided
    const hasFiles = filmData.posterFile || filmData.trailerFile || (filmData.galleryFiles && filmData.galleryFiles.length > 0);
    let fileUploadData = {};
    
    if (hasFiles) {
      console.log('📤 Starting file upload process for update...');
      const { updatedData, errors } = await uploadFeatureFilmFiles(filmId, filmData as FeatureFilmData, userId);
      
      if (errors.length > 0) {
        console.warn('⚠️ File upload errors during update:', errors);
      }
      
      fileUploadData = updatedData;
      console.log('📊 File upload data prepared:', Object.keys(fileUploadData));
    }
    
    const updateData = {
      ...cleanFilmData,
      ...fileUploadData,
      updatedAt: serverTimestamp()
    };

    console.log('💾 Updating film document with data:', Object.keys(updateData));
    await updateDoc(filmRef, updateData);
    
    // CRITICAL: Update guests subcollection when film data changes
    const crewMembers = extractCrewMembersFromFilmData(filmData);
    console.log('🔄 Updating guests subcollection for film:', filmId, 'with', crewMembers.length, 'crew members');
    
    try {
      // Always delete existing guests first
      await deleteAllGuests(filmId);
      
      // Create new guests if we have crew members
      if (crewMembers.length > 0) {
        await createMultipleGuests(filmId, crewMembers);
        console.log('✅ Guest subcollection updated successfully in films collection');
      } else {
        console.log('ℹ️ No crew members found, guests subcollection cleared');
      }
    } catch (guestError) {
      console.error('❌ Error updating guest subcollection in films collection:', guestError);
      // Don't fail the entire film update if guest update fails
    }

    // Fetch updated data from films collection
    const updatedDoc = await getDoc(filmRef);
    if (updatedDoc.exists()) {
      const updatedData = { id: updatedDoc.id, ...updatedDoc.data() } as FeatureFilmData;
      console.log('🎉 Film updated successfully:', updatedData.id);
      return { success: true, data: updatedData };
    } else {
      return { success: false, error: 'Film not found in films collection after update' };
    }
  } catch (error) {
    console.error('💥 Error updating film in films collection:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update film in films collection' 
    };
  }
};

/**
 * Delete a feature film record
 */
export const deleteFeatureFilm = async (filmId: string): Promise<FeatureFilmServiceResult> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, filmId);
    await deleteDoc(docRef);
    
    return {
      success: true,
      data: { id: filmId }
    };
  } catch (error) {
    console.error('Error deleting feature film:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete feature film'
    };
  }
};

/**
 * Get a single feature film by ID
 */
export const getFeatureFilm = async (filmId: string): Promise<FeatureFilmServiceResult> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, filmId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      const filmData: any = {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate()
      };
      
      // ALWAYS attempt to load guests from subcollection
      // This ensures we get guest data even if guestComing flag is not properly set
      try {
        const guestsResult = await getGuests(filmId);
        if (guestsResult.success && guestsResult.data && guestsResult.data.length > 0) {
          // Direct mapping - no field conversion needed since Guest interface now matches guestService
          filmData.guests = guestsResult.data.map((guest: any) => ({
            id: guest.id,
            name: guest.name,
            email: guest.email || '',
            phone: guest.phone || '',
            role: guest.role || 'Guest',
            otherRole: guest.otherRole,
            bio: guest.bio || ''
          }));
          console.log('✅ Loaded', filmData.guests.length, 'guests from subcollection for film:', filmId);
        } else {
          filmData.guests = [];
          console.log('ℹ️ No guests found in subcollection for film:', filmId);
        }
      } catch (guestError) {
        console.warn('⚠️ Error loading guests from subcollection for film:', filmId, guestError);
        filmData.guests = [];
      }
      
      return {
        success: true,
        data: filmData
      };
    } else {
      return {
        success: false,
        error: 'Feature film not found'
      };
    }
  } catch (error) {
    console.error('Error getting feature film:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get feature film'
    };
  }
};

/**
 * Get all feature films with optional filtering
 */
export const getFeatureFilms = async (filters?: {
  category?: string;
  status?: string;
  createdBy?: string;
}): Promise<FeatureFilmServiceResult> => {
  try {
    let q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
    
    // Apply filters if provided
    if (filters?.category) {
      q = query(q, where('category', '==', filters.category));
    }
    if (filters?.status) {
      q = query(q, where('status', '==', filters.status));
    }
    if (filters?.createdBy) {
      q = query(q, where('createdBy', '==', filters.createdBy));
    }
    
    const querySnapshot = await getDocs(q);
    const films: FeatureFilmData[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      films.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate()
      } as FeatureFilmData);
    });
    
    return {
      success: true,
      data: films
    };
  } catch (error) {
    console.error('Error getting feature films:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get feature films'
    };
  }
};

/**
 * Get feature films by category
 */
export const getFeatureFilmsByCategory = async (category: string): Promise<FeatureFilmServiceResult> => {
  return getFeatureFilms({ category });
};

/**
 * Get feature films by status
 */
export const getFeatureFilmsByStatus = async (status: string): Promise<FeatureFilmServiceResult> => {
  return getFeatureFilms({ status });
};

/**
 * Search feature films by title
 */
export const searchFeatureFilms = async (searchTerm: string): Promise<FeatureFilmServiceResult> => {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('titleEn'));
    const querySnapshot = await getDocs(q);
    const films: FeatureFilmData[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const film = {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate()
      } as FeatureFilmData;
      
      // Client-side filtering for title search (case-insensitive)
      const searchLower = searchTerm.toLowerCase();
      if (
        film.titleEn.toLowerCase().includes(searchLower) ||
        (film.titleTh && film.titleTh.toLowerCase().includes(searchLower))
      ) {
        films.push(film);
      }
    });
    
    return {
      success: true,
      data: films
    };
  } catch (error) {
    console.error('Error searching feature films:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to search feature films'
    };
  }
};

/**
 * Get statistics about feature films
 */
export const getFeatureFilmStats = async (): Promise<FeatureFilmServiceResult> => {
  try {
    const result = await getFeatureFilms();
    
    if (!result.success || !result.data) {
      return result;
    }
    
    const films = result.data as FeatureFilmData[];
    
    const stats = {
      total: films.length,
      byCategory: {} as Record<string, number>,
      byStatus: {} as Record<string, number>,
      byGenre: {} as Record<string, number>,
      recentlyAdded: films.filter(film => {
        if (!film.createdAt) return false;
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return film.createdAt > weekAgo;
      }).length
    };
    
    // Calculate category distribution
    films.forEach(film => {
      stats.byCategory[film.category] = (stats.byCategory[film.category] || 0) + 1;
      stats.byStatus[film.status] = (stats.byStatus[film.status] || 0) + 1;
      // Handle multiple genres - count each genre separately
      if (film.genres && Array.isArray(film.genres)) {
        film.genres.forEach(genre => {
          stats.byGenre[genre] = (stats.byGenre[genre] || 0) + 1;
        });
      }
    });
    
    return {
      success: true,
      data: stats
    };
  } catch (error) {
    console.error('Error getting feature film stats:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get feature film statistics'
    };
  }
};

// ============================================================================
// NEW ENHANCED FEATURE FILM SYSTEM FUNCTIONS
// ============================================================================

/**
 * Upload files for the new enhanced feature film system
 */
const uploadEnhancedFilmFiles = async (
  filmId: string,
  filmData: CreateFeatureFilmData,
  userId: string
): Promise<{ files: Partial<FeatureFilm['files']>; errors: string[] }> => {
  const files: Partial<FeatureFilm['files']> = {};
  const errors: string[] = [];

  try {
    // Upload poster file if provided
    if (filmData.posterFile) {
      try {
        const posterPath = generateFeatureFilmUploadPath(filmId, 'posters', filmData.posterFile.name, userId);
        const posterResult = await uploadFile(filmData.posterFile, posterPath);
        files.poster = {
          url: posterResult.url,
          name: filmData.posterFile.name,
          size: filmData.posterFile.size,
          type: filmData.posterFile.type,
          uploadedAt: new Date(),
          uploadedBy: userId
        };
      } catch (error) {
        console.error('Error uploading poster:', error);
        errors.push('Failed to upload poster');
      }
    }

    // Upload trailer file if provided
    if (filmData.trailerFile) {
      try {
        const trailerPath = generateFeatureFilmUploadPath(filmId, 'trailers', filmData.trailerFile.name, userId);
        const trailerResult = await uploadFile(filmData.trailerFile, trailerPath);
        files.trailer = {
          url: trailerResult.url,
          name: filmData.trailerFile.name,
          size: filmData.trailerFile.size,
          type: filmData.trailerFile.type,
          uploadedAt: new Date(),
          uploadedBy: userId
        };
      } catch (error) {
        console.error('Error uploading trailer:', error);
        errors.push('Failed to upload trailer');
      }
    }

    // Upload stills files if provided
    if (filmData.stillsFiles && filmData.stillsFiles.length > 0) {
      try {
        const stillsMetadata: FileMetadata[] = [];
        for (const file of filmData.stillsFiles) {
          const stillPath = generateFeatureFilmUploadPath(filmId, 'stills', file.name, userId);
          const stillResult = await uploadFile(file, stillPath);
          stillsMetadata.push({
            url: stillResult.url,
            name: file.name,
            size: file.size,
            type: file.type,
            uploadedAt: new Date(),
            uploadedBy: userId
          });
        }
        files.stills = stillsMetadata;
      } catch (error) {
        console.error('Error uploading stills:', error);
        errors.push('Failed to upload stills');
      }
    }

    // Upload press kit file if provided
    if (filmData.pressKitFile) {
      try {
        const pressKitPath = generateFeatureFilmUploadPath(filmId, 'presskit', filmData.pressKitFile.name, userId);
        const pressKitResult = await uploadFile(filmData.pressKitFile, pressKitPath);
        files.pressKit = {
          url: pressKitResult.url,
          name: filmData.pressKitFile.name,
          size: filmData.pressKitFile.size,
          type: filmData.pressKitFile.type,
          uploadedAt: new Date(),
          uploadedBy: userId
        };
      } catch (error) {
        console.error('Error uploading press kit:', error);
        errors.push('Failed to upload press kit');
      }
    }

    return { files, errors };
  } catch (error) {
    console.error('Error in uploadEnhancedFilmFiles:', error);
    return { files, errors: ['Failed to upload files'] };
  }
};

/**
 * Generate URL-friendly slug from title
 */
const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim();
};

/**
 * Create a new feature film (Enhanced System)
 */
export const createEnhancedFeatureFilm = async (
  filmData: CreateFeatureFilmData,
  userId: string
): Promise<FeatureFilmServiceResult> => {
  try {
    // Generate slug if not provided
    const slug = filmData.slug || generateSlug(filmData.title);
    
    // Prepare clean data for Firestore (remove File objects)
    const { posterFile, trailerFile, stillsFiles, pressKitFile, ...cleanData } = filmData;
    
    const docData: Omit<FeatureFilm, 'id'> = {
      ...cleanData,
      slug,
      logline: '', // Add default logline since it's required in FeatureFilm interface
      files: {},
      createdBy: userId,
      updatedBy: userId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Create the document first
    const docRef = await addDoc(collection(db, NEW_COLLECTION_NAME), {
      ...docData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    const filmId = docRef.id;
    
    // Upload files if any are provided
    const hasFiles = posterFile || trailerFile || (stillsFiles && stillsFiles.length > 0) || pressKitFile;
    if (hasFiles) {
      const { files, errors } = await uploadEnhancedFilmFiles(filmId, filmData, userId);
      
      if (errors.length > 0) {
        console.warn('File upload errors:', errors);
      }
      
      // Update the document with file metadata if any files were uploaded
      if (Object.keys(files).length > 0) {
        await updateDoc(docRef, {
          files,
          updatedAt: serverTimestamp()
        });
      }
    }
    
    return {
      success: true,
      data: { id: filmId, ...docData }
    };
  } catch (error) {
    console.error('Error creating enhanced feature film:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create feature film'
    };
  }
};

/**
 * Update an existing feature film (Enhanced System)
 */
export const updateEnhancedFeatureFilm = async (
  filmId: string,
  filmData: UpdateFeatureFilmData,
  userId: string
): Promise<FeatureFilmServiceResult> => {
  try {
    // Prepare clean data for Firestore (remove File objects)
    const { posterFile, trailerFile, stillsFiles, pressKitFile, ...cleanData } = filmData;
    
    const docRef = doc(db, NEW_COLLECTION_NAME, filmId);
    
    // Upload files if any are provided
    const hasFiles = posterFile || trailerFile || (stillsFiles && stillsFiles.length > 0) || pressKitFile;
    let fileData = {};
    
    if (hasFiles) {
      const { files, errors } = await uploadEnhancedFilmFiles(filmId, filmData as CreateFeatureFilmData, userId);
      
      if (errors.length > 0) {
        console.warn('File upload errors:', errors);
      }
      
      if (Object.keys(files).length > 0) {
        fileData = { files };
      }
    }
    
    const updateData = {
      ...cleanData,
      ...fileData,
      updatedBy: userId,
      updatedAt: serverTimestamp()
    };

    await updateDoc(docRef, updateData);
    
    return {
      success: true,
      data: { id: filmId, ...updateData }
    };
  } catch (error) {
    console.error('Error updating enhanced feature film:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update feature film'
    };
  }
};

/**
 * Get a single feature film by ID (Enhanced System)
 */
export const getEnhancedFeatureFilm = async (filmId: string): Promise<FeatureFilmServiceResult> => {
  try {
    const docRef = doc(db, NEW_COLLECTION_NAME, filmId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      const filmData: FeatureFilm = {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as FeatureFilm;
      
      return {
        success: true,
        data: filmData
      };
    } else {
      return {
        success: false,
        error: 'Feature film not found'
      };
    }
  } catch (error) {
    console.error('Error getting enhanced feature film:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get feature film'
    };
  }
};

/**
 * Convert legacy FeatureFilmData to new FeatureFilm format
 */
const convertLegacyToEnhanced = (legacyData: any): FeatureFilm => {
  console.log('🔄 Converting legacy film data:', {
    id: legacyData.id,
    titleEn: legacyData.titleEn,
    publicationStatus: legacyData.publicationStatus,
    status: legacyData.status,
    hasGalleryUrls: !!legacyData.galleryUrls,
    hasPosterUrl: !!legacyData.posterUrl
  });

  // Determine the correct status - prioritize publicationStatus if it exists
  let status: 'draft' | 'published' | 'archived' = 'draft';
  if (legacyData.publicationStatus === 'public') {
    status = 'published';
  } else if (legacyData.publicationStatus === 'draft') {
    status = 'draft';
  } else if (typeof legacyData.status === 'string' && legacyData.status === 'ตอบรับ / Accepted') {
    // Fall back to legacy status mapping
    status = 'published';
  }

  // Handle duration/length field mapping - prioritize length field for legacy data
  const duration = legacyData.length || legacyData.duration || 120;
  
  // Handle release year - extract from various possible sources
  let releaseYear = legacyData.releaseYear;
  if (!releaseYear && legacyData.screeningDate1) {
    try {
      releaseYear = new Date(legacyData.screeningDate1).getFullYear();
    } catch (e) {
      releaseYear = new Date().getFullYear();
    }
  }
  if (!releaseYear) {
    releaseYear = new Date().getFullYear();
  }

  // Handle countries array - use first country or default
  const country = Array.isArray(legacyData.countries) && legacyData.countries.length > 0 
    ? legacyData.countries[0] 
    : (legacyData.country || 'Unknown');

  // Handle languages array
  const language = Array.isArray(legacyData.languages) && legacyData.languages.length > 0
    ? legacyData.languages
    : (legacyData.language ? [legacyData.language] : ['Unknown']);

  // Handle genres array - ensure it's always an array
  let genres: string[] = [];
  if (Array.isArray(legacyData.genres)) {
    genres = legacyData.genres;
  } else if (legacyData.genre) {
    genres = [legacyData.genre];
  }

  const convertedFilm = {
    id: legacyData.id,
    // Map legacy fields to new structure
    title: legacyData.titleEn || legacyData.title || 'Untitled',
    titleTh: legacyData.titleTh || undefined,
    logline: legacyData.logline || '', // Add logline field
    synopsis: legacyData.synopsis || '',
    synopsisTh: undefined,
    director: legacyData.director || 'Unknown',
    directorTh: undefined,
    duration: duration,
    releaseYear: releaseYear,
    language: language,
    subtitles: [],
    format: legacyData.format || 'Digital',
    aspectRatio: legacyData.aspectRatio || '16:9',
    soundFormat: legacyData.soundFormat || 'Stereo',
    genres: genres,
    country: country,
    rating: legacyData.rating,
    files: {
      poster: legacyData.posterUrl ? {
        url: legacyData.posterUrl,
        name: 'poster',
        size: 0,
        type: 'image/jpeg',
        uploadedAt: legacyData.createdAt || new Date(),
        uploadedBy: legacyData.createdBy || 'unknown'
      } : undefined,
      trailer: legacyData.trailerUrl ? {
        url: legacyData.trailerUrl,
        name: 'trailer',
        size: 0,
        type: 'video/mp4',
        uploadedAt: legacyData.createdAt || new Date(),
        uploadedBy: legacyData.createdBy || 'unknown'
      } : undefined,
      stills: legacyData.galleryUrls && legacyData.galleryUrls.length > 0 ? 
        legacyData.galleryUrls.map((url: string, index: number) => ({
          url,
          name: `still_${index + 1}`,
          size: 0,
          type: 'image/jpeg',
          uploadedAt: legacyData.createdAt || new Date(),
          uploadedBy: legacyData.createdBy || 'unknown',
          // CRITICAL: Preserve cover and logo information from legacy indices
          isCover: legacyData.galleryCoverIndex !== undefined ? index === legacyData.galleryCoverIndex : index === 0,
          isLogo: legacyData.galleryLogoIndex !== undefined ? index === legacyData.galleryLogoIndex : false
        })) : undefined
    },
    cast: legacyData.mainActors ? 
      legacyData.mainActors.split(',').map((actor: string) => ({
        name: actor.trim(),
        role: 'Actor',
        character: ''
      })) : [],
    crew: [
      {
        name: legacyData.director || 'Unknown',
        role: 'Director',
        department: 'Direction'
      },
      ...(legacyData.producer && legacyData.producer.trim() ? [{
        name: legacyData.producer.trim(),
        role: 'Producer',
        department: 'Production'
      }] : [])
    ],
    screenings: legacyData.screeningDate1 ? [{
      date: new Date(legacyData.screeningDate1),
      time: legacyData.timeEstimate || '',
      venue: legacyData.theatre || 'TBD'
    }] : undefined,
    status: status,
    featured: legacyData.featured || false,
    createdAt: legacyData.createdAt?.toDate ? legacyData.createdAt.toDate() : (legacyData.createdAt || new Date()),
    updatedAt: legacyData.updatedAt?.toDate ? legacyData.updatedAt.toDate() : (legacyData.updatedAt || new Date()),
    createdBy: legacyData.createdBy || 'unknown',
    updatedBy: legacyData.updatedBy || legacyData.createdBy || 'unknown',
    tags: legacyData.tags || [],
    slug: legacyData.slug || generateSlug(legacyData.titleEn || legacyData.title || 'untitled'),
    metaDescription: legacyData.metaDescription,
    publicationStatus: legacyData.publicationStatus || (status === 'published' ? 'public' : 'draft')
  } as FeatureFilm;

  console.log('✅ Successfully converted legacy film:', {
    id: convertedFilm.id,
    title: convertedFilm.title,
    publicationStatus: convertedFilm.publicationStatus,
    status: convertedFilm.status,
    duration: convertedFilm.duration,
    releaseYear: convertedFilm.releaseYear,
    country: convertedFilm.country,
    genres: convertedFilm.genres
  });

  return convertedFilm;
};

/**
 * Get all feature films with advanced filtering (Enhanced System)
 */
export const getEnhancedFeatureFilms = async (filters?: FilmFilters): Promise<FeatureFilmServiceResult> => {
  try {
    console.log('🎬 Getting enhanced feature films with filters:', filters);
    
    // Build Firestore query with server-side filtering for security-sensitive fields
    let q = query(collection(db, NEW_COLLECTION_NAME));
    
    // CRITICAL: Apply server-side filtering for publicationStatus to respect Firestore security rules
    if (filters?.publicationStatus) {
      console.log('🔒 Applying server-side publicationStatus filter:', filters.publicationStatus);
      q = query(q, where('publicationStatus', '==', filters.publicationStatus));
    }
    
    // Apply server-side filtering for other security-sensitive fields if needed
    if (filters?.status) {
      console.log('🔒 Applying server-side status filter:', filters.status);
      // For legacy compatibility, map status to publicationStatus if needed
      if (filters.status === 'published' && !filters.publicationStatus) {
        q = query(q, where('publicationStatus', '==', 'public'));
      }
    }
    
    // Apply sorting after filters - temporarily disabled until Firestore index is created
    // TODO: Re-enable after creating composite index for publicationStatus + createdAt
    // const sortBy = filters?.sortBy || 'createdAt';
    // const sortOrder = filters?.sortOrder || 'desc';
    // 
    // try {
    //   q = query(q, orderBy(sortBy, sortOrder));
    // } catch (error) {
    //   console.warn('⚠️ Sorting field not available, falling back to createdAt:', error);
    //   try {
    //     q = query(q, orderBy('createdAt', 'desc'));
    //   } catch (fallbackError) {
    //     console.warn('⚠️ Could not apply any ordering, using default');
    //   }
    // }
    console.log('ℹ️ Sorting temporarily disabled - waiting for Firestore index creation');
    
    // Apply pagination
    if (filters?.limit) {
      q = query(q, limit(filters.limit));
    }
    
    console.log('📡 Executing Firestore query...');
    const querySnapshot = await getDocs(q);
    console.log('📊 Query returned', querySnapshot.size, 'documents');
    
    const films: FeatureFilm[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      console.log('🎭 Processing film document:', doc.id, {
        titleEn: data.titleEn,
        title: data.title,
        status: data.status,
        publicationStatus: data.publicationStatus
      });
      
      try {
        // Convert legacy data to enhanced format
        const enhancedFilm = convertLegacyToEnhanced({
          id: doc.id,
          ...data
        });
        films.push(enhancedFilm);
        console.log('✅ Successfully converted film:', enhancedFilm.title);
      } catch (error) {
        console.warn('❌ Error converting legacy film data for', doc.id, ':', error);
        // Skip this film if conversion fails
      }
    });
    
    console.log('🔄 Total films after conversion:', films.length);
    
    // Apply client-side filters for complex queries
    let filteredFilms = films;
    
    // Publication Status filter - simplified logic using only publicationStatus
    if (filters?.publicationStatus) {
      console.log('🔍 Applying publicationStatus filter:', filters.publicationStatus);
      filteredFilms = filteredFilms.filter(film => {
        const filmPublicationStatus = film.publicationStatus || (film.status === 'published' ? 'public' : 'draft');
        const matches = filmPublicationStatus === filters.publicationStatus;
        console.log('🔍 Film:', film.title, 'publicationStatus:', filmPublicationStatus, 'matches:', matches);
        return matches;
      });
      console.log('📊 Films after publicationStatus filter:', filteredFilms.length);
    }
    
    // Status filter - handle both new and legacy status formats (kept for backward compatibility)
    if (filters?.status) {
      console.log('🔍 Applying status filter:', filters.status);
      filteredFilms = filteredFilms.filter(film => {
        const matchesNewStatus = film.status === filters.status;
        const matchesLegacyStatus = filters.status === 'published' && 
          (film.publicationStatus === 'public');
        return matchesNewStatus || matchesLegacyStatus;
      });
      console.log('📊 Films after status filter:', filteredFilms.length);
    }
    
    // Genre filter
    if (filters?.genre) {
      console.log('🔍 Applying genre filter:', filters.genre);
      filteredFilms = filteredFilms.filter(film => 
        film.genres.some(genre => genre.toLowerCase().includes(filters.genre!.toLowerCase()))
      );
      console.log('📊 Films after genre filter:', filteredFilms.length);
    }
    
    // Country filter
    if (filters?.country) {
      console.log('🔍 Applying country filter:', filters.country);
      filteredFilms = filteredFilms.filter(film => 
        film.country.toLowerCase().includes(filters.country!.toLowerCase())
      );
      console.log('📊 Films after country filter:', filteredFilms.length);
    }
    
    // Featured filter
    if (filters?.featured !== undefined) {
      console.log('🔍 Applying featured filter:', filters.featured);
      filteredFilms = filteredFilms.filter(film => film.featured === filters.featured);
      console.log('📊 Films after featured filter:', filteredFilms.length);
    }
    
    // Search filter
    if (filters?.search) {
      console.log('🔍 Applying search filter:', filters.search);
      const searchLower = filters.search.toLowerCase();
      filteredFilms = filteredFilms.filter(film => 
        film.title.toLowerCase().includes(searchLower) ||
        (film.titleTh && film.titleTh.toLowerCase().includes(searchLower)) ||
        film.director.toLowerCase().includes(searchLower) ||
        film.synopsis.toLowerCase().includes(searchLower)
      );
      console.log('📊 Films after search filter:', filteredFilms.length);
    }
    
    // Year filters
    if (filters?.yearFrom || filters?.yearTo) {
      console.log('🔍 Applying year filters:', { yearFrom: filters.yearFrom, yearTo: filters.yearTo });
      filteredFilms = filteredFilms.filter(film => {
        if (filters.yearFrom && film.releaseYear < filters.yearFrom) return false;
        if (filters.yearTo && film.releaseYear > filters.yearTo) return false;
        return true;
      });
      console.log('📊 Films after year filter:', filteredFilms.length);
    }
    
    // Duration filters
    if (filters?.durationFrom || filters?.durationTo) {
      console.log('🔍 Applying duration filters:', { durationFrom: filters.durationFrom, durationTo: filters.durationTo });
      filteredFilms = filteredFilms.filter(film => {
        if (filters.durationFrom && film.duration < filters.durationFrom) return false;
        if (filters.durationTo && film.duration > filters.durationTo) return false;
        return true;
      });
      console.log('📊 Films after duration filter:', filteredFilms.length);
    }
    
    console.log('🎉 Final filtered films count:', filteredFilms.length);
    
    return {
      success: true,
      data: filteredFilms
    };
  } catch (error) {
    console.error('💥 Error getting enhanced feature films:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get feature films'
    };
  }
};

/**
 * Delete a feature film (Enhanced System)
 */
export const deleteEnhancedFeatureFilm = async (filmId: string): Promise<FeatureFilmServiceResult> => {
  try {
    const docRef = doc(db, NEW_COLLECTION_NAME, filmId);
    await deleteDoc(docRef);
    
    return {
      success: true,
      data: { id: filmId }
    };
  } catch (error) {
    console.error('Error deleting enhanced feature film:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete feature film'
    };
  }
};

/**
 * Search feature films (Enhanced System)
 */
export const searchEnhancedFeatureFilms = async (searchTerm: string): Promise<FeatureFilmServiceResult> => {
  return getEnhancedFeatureFilms({ search: searchTerm });
};

/**
 * Get feature films by status (Enhanced System)
 */
export const getEnhancedFeatureFilmsByStatus = async (status: 'draft' | 'published' | 'archived'): Promise<FeatureFilmServiceResult> => {
  return getEnhancedFeatureFilms({ status });
};

/**
 * Get published feature films for public display
 */
export const getPublishedFeatureFilms = async (): Promise<FeatureFilmServiceResult> => {
  return getEnhancedFeatureFilms({ status: 'published' });
};

/**
 * Subscribe to feature films changes (Enhanced System)
 * Now properly handles filtering and legacy data conversion with server-side security filtering
 */
export const subscribeToFeatureFilms = (
  callback: (films: FeatureFilm[]) => void,
  onError: (error: string) => void,
  filters?: FilmFilters
): (() => void) => {
  console.log('🔔 Setting up real-time subscription with filters:', filters);
  
  // Build Firestore query with server-side filtering for security-sensitive fields
  let q = query(collection(db, NEW_COLLECTION_NAME));
  
  // CRITICAL: Apply server-side filtering for publicationStatus to respect Firestore security rules
  if (filters?.publicationStatus) {
    console.log('🔒 Applying server-side publicationStatus filter:', filters.publicationStatus);
    q = query(q, where('publicationStatus', '==', filters.publicationStatus));
  }
  
  // Apply server-side filtering for other security-sensitive fields if needed
  if (filters?.status) {
    console.log('🔒 Applying server-side status filter:', filters.status);
    // For legacy compatibility, map status to publicationStatus if needed
    if (filters.status === 'published' && !filters.publicationStatus) {
      q = query(q, where('publicationStatus', '==', 'public'));
    }
  }
  
  // Apply sorting after filters - temporarily disabled until Firestore index is created
  // TODO: Re-enable after creating composite index for publicationStatus + createdAt
  // try {
  //   q = query(q, orderBy('createdAt', 'desc'));
  // } catch (error) {
  //   console.warn('⚠️ Could not apply createdAt ordering, using default ordering');
  // }
  console.log('ℹ️ Sorting temporarily disabled - waiting for Firestore index creation');
  
  // Apply pagination if specified
  if (filters?.limit) {
    q = query(q, limit(filters.limit));
  }
  
  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    console.log('📡 Real-time update received, processing', querySnapshot.size, 'documents');
    
    if (querySnapshot.empty) {
      console.log('⚠️ No documents found in films collection');
      callback([]);
      return;
    }
    
    const allFilms: FeatureFilm[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      console.log('🎭 Processing real-time film document:', doc.id, {
        titleEn: data.titleEn,
        title: data.title,
        status: data.status,
        publicationStatus: data.publicationStatus,
        createdAt: data.createdAt,
        allFields: Object.keys(data)
      });
      
      try {
        // Convert legacy data to enhanced format
        const enhancedFilm = convertLegacyToEnhanced({
          id: doc.id,
          ...data
        });
        allFilms.push(enhancedFilm);
        console.log('✅ Successfully converted real-time film:', enhancedFilm.title, {
          publicationStatus: enhancedFilm.publicationStatus,
          status: enhancedFilm.status
        });
      } catch (error) {
        console.warn('❌ Error converting legacy film data in real-time for', doc.id, ':', error);
        // Skip this film if conversion fails
      }
    });
    
    console.log('🔄 Total films after real-time conversion:', allFilms.length);
    
    // Apply client-side filters if provided
    let filteredFilms = allFilms;
    
    if (filters) {
      console.log('🔍 Applying filters to', allFilms.length, 'films:', filters);
      
      // Publication Status filter - simplified logic using only publicationStatus
      if (filters.publicationStatus) {
        console.log('🔍 Applying real-time publicationStatus filter:', filters.publicationStatus);
        const beforeFilter = filteredFilms.length;
        filteredFilms = filteredFilms.filter(film => {
          const filmPublicationStatus = film.publicationStatus || (film.status === 'published' ? 'public' : 'draft');
          const matches = filmPublicationStatus === filters.publicationStatus;
          console.log('🔍 Real-time Film:', film.title, {
            filmPublicationStatus,
            filterValue: filters.publicationStatus,
            matches
          });
          return matches;
        });
        console.log('📊 Films after real-time publicationStatus filter:', filteredFilms.length, '(was', beforeFilter, ')');
      }
      
      // Status filter - handle both new and legacy status formats
      if (filters.status) {
        console.log('🔍 Applying real-time status filter:', filters.status);
        const beforeFilter = filteredFilms.length;
        filteredFilms = filteredFilms.filter(film => {
          const matchesNewStatus = film.status === filters.status;
          const matchesLegacyStatus = filters.status === 'published' && 
            (film.publicationStatus === 'public');
          const matches = matchesNewStatus || matchesLegacyStatus;
          console.log('🔍 Status filter for film:', film.title, {
            filmStatus: film.status,
            filmPublicationStatus: film.publicationStatus,
            filterValue: filters.status,
            matchesNewStatus,
            matchesLegacyStatus,
            matches
          });
          return matches;
        });
        console.log('📊 Films after real-time status filter:', filteredFilms.length, '(was', beforeFilter, ')');
      }
      
      // Apply other filters if needed
      if (filters.genre) {
        const beforeFilter = filteredFilms.length;
        filteredFilms = filteredFilms.filter(film => 
          film.genres.some(genre => genre.toLowerCase().includes(filters.genre!.toLowerCase()))
        );
        console.log('📊 Films after genre filter:', filteredFilms.length, '(was', beforeFilter, ')');
      }
      
      if (filters.country) {
        const beforeFilter = filteredFilms.length;
        filteredFilms = filteredFilms.filter(film => 
          film.country.toLowerCase().includes(filters.country!.toLowerCase())
        );
        console.log('📊 Films after country filter:', filteredFilms.length, '(was', beforeFilter, ')');
      }
      
      if (filters.featured !== undefined) {
        const beforeFilter = filteredFilms.length;
        filteredFilms = filteredFilms.filter(film => film.featured === filters.featured);
        console.log('📊 Films after featured filter:', filteredFilms.length, '(was', beforeFilter, ')');
      }
      
      if (filters.search) {
        const beforeFilter = filteredFilms.length;
        const searchLower = filters.search.toLowerCase();
        filteredFilms = filteredFilms.filter(film => 
          film.title.toLowerCase().includes(searchLower) ||
          (film.titleTh && film.titleTh.toLowerCase().includes(searchLower)) ||
          film.director.toLowerCase().includes(searchLower) ||
          film.synopsis.toLowerCase().includes(searchLower)
        );
        console.log('📊 Films after search filter:', filteredFilms.length, '(was', beforeFilter, ')');
      }
    } else {
      console.log('ℹ️ No filters applied, returning all', allFilms.length, 'films');
    }
    
    console.log('🎉 Final real-time filtered films count:', filteredFilms.length);
    
    // Log final films for debugging
    if (filteredFilms.length > 0) {
      console.log('📋 Final filtered films:', filteredFilms.map(f => ({
        id: f.id,
        title: f.title,
        publicationStatus: f.publicationStatus,
        status: f.status
      })));
    } else {
      console.log('⚠️ No films match the current filters');
    }
    
    callback(filteredFilms);
  }, (error) => {
    console.error('💥 Error in feature films real-time subscription:', error);
    onError(error.message || 'Subscription failed');
  });
  
  return unsubscribe;
};

/**
 * Get feature film by slug for public pages
 */
export const getFeatureFilmBySlug = async (slug: string): Promise<FeatureFilmServiceResult> => {
  try {
    const q = query(
      collection(db, NEW_COLLECTION_NAME), 
      where('slug', '==', slug),
      where('status', '==', 'published')
    );
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return {
        success: false,
        error: 'Feature film not found'
      };
    }
    
    const doc = querySnapshot.docs[0];
    const data = doc.data();
    const filmData: FeatureFilm = {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date()
    } as FeatureFilm;
    
    return {
      success: true,
      data: filmData
    };
  } catch (error) {
    console.error('Error getting feature film by slug:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get feature film'
    };
  }
};
