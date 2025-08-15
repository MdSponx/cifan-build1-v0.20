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
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { FeatureFilmData } from '../types/featureFilm.types';
import { createMultipleGuests, getGuests, deleteAllGuests } from './guestService';
import { uploadFile, generateFeatureFilmUploadPath } from '../utils/fileUpload';

const COLLECTION_NAME = 'films';

export interface FeatureFilmServiceResult {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Upload files for a feature film
 */
const uploadFeatureFilmFiles = async (
  filmId: string,
  filmData: FeatureFilmData,
  userId?: string
): Promise<{ updatedData: Partial<FeatureFilmData>; errors: string[] }> => {
  const updatedData: Partial<FeatureFilmData> = {};
  const errors: string[] = [];

  try {
    // Upload poster file if provided
    if (filmData.posterFile) {
      try {
        const posterPath = generateFeatureFilmUploadPath(filmId, 'posters', filmData.posterFile.name, userId);
        const posterResult = await uploadFile(filmData.posterFile, posterPath);
        updatedData.posterUrl = posterResult.url;
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
        updatedData.trailerUrl = trailerResult.url;
      } catch (error) {
        console.error('Error uploading trailer:', error);
        errors.push('Failed to upload trailer');
      }
    }

    // Upload gallery files if provided
    if (filmData.galleryFiles && filmData.galleryFiles.length > 0) {
      try {
        const galleryUrls: string[] = [];
        for (const file of filmData.galleryFiles) {
          const galleryPath = generateFeatureFilmUploadPath(filmId, 'gallery', file.name, userId);
          const galleryResult = await uploadFile(file, galleryPath);
          galleryUrls.push(galleryResult.url);
        }
        // Merge with existing gallery URLs if any
        updatedData.galleryUrls = [
          ...(filmData.galleryUrls || []).filter(url => url.trim() !== ''),
          ...galleryUrls
        ];
      } catch (error) {
        console.error('Error uploading gallery files:', error);
        errors.push('Failed to upload gallery files');
      }
    }

    return { updatedData, errors };
  } catch (error) {
    console.error('Error in uploadFeatureFilmFiles:', error);
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
 * Create a new feature film record
 */
export const createFeatureFilm = async (
  filmData: Omit<FeatureFilmData, 'id' | 'createdAt' | 'updatedAt'>,
  userId: string
): Promise<FeatureFilmServiceResult> => {
  try {
    // Separate guests from film data and prepare clean data for Firestore
    const { guests, ...filmDataWithoutGuests } = filmData;
    const cleanFilmData = prepareFilmDataForFirestore(filmDataWithoutGuests as FeatureFilmData);
    
    const docData = {
      ...cleanFilmData,
      createdBy: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    // Create the document first
    const docRef = await addDoc(collection(db, COLLECTION_NAME), docData);
    const filmId = docRef.id;
    
    // Upload files if any are provided
    const hasFiles = filmData.posterFile || filmData.trailerFile || (filmData.galleryFiles && filmData.galleryFiles.length > 0);
    if (hasFiles) {
      const { updatedData, errors } = await uploadFeatureFilmFiles(filmId, filmData, userId);
      
      if (errors.length > 0) {
        console.warn('File upload errors:', errors);
      }
      
      // Update the document with file URLs if any files were uploaded
      if (Object.keys(updatedData).length > 0) {
        await updateDoc(docRef, {
          ...updatedData,
          updatedAt: serverTimestamp()
        });
      }
    }
    
    // Create guests in subcollection if any
    if (guests && guests.length > 0 && filmData.guestComing) {
      const guestsToCreate = guests.filter(guest => guest.name.trim() && guest.contact.trim());
      if (guestsToCreate.length > 0) {
        await createMultipleGuests(filmId, guestsToCreate);
      }
    }
    
    return {
      success: true,
      data: { id: filmId, ...docData, guests }
    };
  } catch (error) {
    console.error('Error creating feature film:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create feature film'
    };
  }
};

/**
 * Update an existing feature film record
 */
export const updateFeatureFilm = async (
  filmId: string,
  filmData: Partial<FeatureFilmData>,
  userId?: string
): Promise<FeatureFilmServiceResult> => {
  try {
    // Separate guests from film data and prepare clean data for Firestore
    const { guests, ...filmDataWithoutGuests } = filmData;
    const cleanFilmData = prepareFilmDataForFirestore(filmDataWithoutGuests as FeatureFilmData);
    
    const docRef = doc(db, COLLECTION_NAME, filmId);
    
    // Upload files if any are provided
    const hasFiles = filmData.posterFile || filmData.trailerFile || (filmData.galleryFiles && filmData.galleryFiles.length > 0);
    let fileUploadData = {};
    
    if (hasFiles) {
      const { updatedData, errors } = await uploadFeatureFilmFiles(filmId, filmData as FeatureFilmData, userId);
      
      if (errors.length > 0) {
        console.warn('File upload errors:', errors);
      }
      
      fileUploadData = updatedData;
    }
    
    const updateData = {
      ...cleanFilmData,
      ...fileUploadData,
      updatedAt: serverTimestamp()
    };

    await updateDoc(docRef, updateData);
    
    // Handle guests subcollection update
    if (filmData.guestComing !== undefined) {
      if (filmData.guestComing && guests && guests.length > 0) {
        // Delete existing guests and create new ones
        await deleteAllGuests(filmId);
        const guestsToCreate = guests.filter(guest => guest.name.trim() && guest.contact.trim());
        if (guestsToCreate.length > 0) {
          await createMultipleGuests(filmId, guestsToCreate);
        }
      } else if (!filmData.guestComing) {
        // Delete all guests if guestComing is false
        await deleteAllGuests(filmId);
      }
    }
    
    return {
      success: true,
      data: { id: filmId, ...updateData, guests }
    };
  } catch (error) {
    console.error('Error updating feature film:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update feature film'
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
      
      // Load guests from subcollection if guestComing is true
      if (data.guestComing) {
        const guestsResult = await getGuests(filmId);
        if (guestsResult.success) {
          filmData.guests = guestsResult.data || [];
        }
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
