import { createFeatureFilm, updateFeatureFilm, getFeatureFilm } from './featureFilmService';
import { FeatureFilmData, Guest } from '../types/featureFilm.types';

// Interface for guest form data (matches the updated Guest interface)
export interface GuestFormData {
  id?: string;
  name: string;
  email?: string;
  phone?: string;
  role: string;
  otherRole?: string;
  bio?: string;
}

/**
 * Create a feature film with guests using the existing featureFilmService
 * This leverages the existing guest subcollection functionality
 */
export const createFeatureFilmWithGuests = async (
  userId: string, 
  filmData: FeatureFilmData
): Promise<{filmId: string, guestIds: string[]}> => {
  try {
    console.log('🚀 createFeatureFilmWithGuests - Processing film data:', {
      userId,
      hasFortuneCardFile: !!filmData.fortuneCardFile,
      fortuneCardFileName: filmData.fortuneCardFile?.name,
      hasFortuneCard: !!filmData.fortuneCard,
      hasFortuneCardUrl: !!filmData.fortuneCardUrl
    });

    // CRITICAL FIX: Pass the complete filmData including File objects to the service
    // The featureFilmService.createFeatureFilm function handles file uploads internally
    // We should NOT strip out File objects here as they're needed for upload processing
    
    // Only remove system fields, but keep all File objects for upload processing
    const cleanCreateData: any = {};
    Object.entries(filmData).forEach(([key, value]) => {
      // Only skip system fields, but keep File objects for upload processing
      if (value !== undefined && 
          key !== 'id' && 
          key !== 'createdAt' && 
          key !== 'createdBy' && 
          key !== 'updatedAt') {
        cleanCreateData[key] = value;
      }
    });

    // Special handling for galleryLogoIndex - convert undefined to null or omit entirely
    if (filmData.galleryLogoIndex === undefined) {
      // Don't include galleryLogoIndex in the create if it's undefined
      delete cleanCreateData.galleryLogoIndex;
    }

    console.log('📤 Passing data to createFeatureFilm service:', {
      hasFortuneCardFile: !!cleanCreateData.fortuneCardFile,
      hasPosterFile: !!cleanCreateData.posterFile,
      hasTrailerFile: !!cleanCreateData.trailerFile,
      hasGalleryFiles: !!(cleanCreateData.galleryFiles && cleanCreateData.galleryFiles.length > 0),
      dataKeys: Object.keys(cleanCreateData)
    });

    // The existing featureFilmService already handles guest creation and file uploads
    // through the extractCrewMembersFromFilmData and uploadFeatureFilmFiles functions
    const result = await createFeatureFilm(cleanCreateData, userId);
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to create feature film');
    }
    
    console.log('✅ Film creation completed successfully:', result.data.id);
    
    // Return the film ID and empty guest IDs array since the existing service
    // handles guest creation internally
    return { 
      filmId: result.data.id, 
      guestIds: [] // Guest IDs are managed internally by the existing service
    };
  } catch (error) {
    console.error('💥 Error creating feature film with guests:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to create feature film with guests');
  }
};

/**
 * Update a feature film with guests using the existing featureFilmService
 * This leverages the existing guest subcollection functionality
 */
export const updateFeatureFilmWithGuests = async (
  filmId: string, 
  filmData: FeatureFilmData
): Promise<{filmId: string, guestIds: string[]}> => {
  try {
    console.log('🔄 updateFeatureFilmWithGuests - Processing film data:', {
      filmId,
      hasFortuneCardFile: !!filmData.fortuneCardFile,
      fortuneCardFileName: filmData.fortuneCardFile?.name,
      hasFortuneCard: !!filmData.fortuneCard,
      hasFortuneCardUrl: !!filmData.fortuneCardUrl
    });

    // CRITICAL FIX: Pass the complete filmData including File objects to the service
    // The featureFilmService.updateFeatureFilm function handles file uploads internally
    // We should NOT strip out File objects here as they're needed for upload processing
    
    // Only remove system fields, but keep all File objects for upload processing
    const cleanUpdateData: any = {};
    Object.entries(filmData).forEach(([key, value]) => {
      // Only skip system fields, but keep File objects for upload processing
      if (value !== undefined && 
          key !== 'id' && 
          key !== 'createdAt' && 
          key !== 'createdBy' && 
          key !== 'updatedAt') {
        cleanUpdateData[key] = value;
      }
    });

    // Special handling for galleryLogoIndex - convert undefined to null or omit entirely
    if (filmData.galleryLogoIndex === undefined) {
      // Don't include galleryLogoIndex in the update if it's undefined
      delete cleanUpdateData.galleryLogoIndex;
    }

    console.log('📤 Passing data to updateFeatureFilm service:', {
      hasFortuneCardFile: !!cleanUpdateData.fortuneCardFile,
      hasPosterFile: !!cleanUpdateData.posterFile,
      hasTrailerFile: !!cleanUpdateData.trailerFile,
      hasGalleryFiles: !!(cleanUpdateData.galleryFiles && cleanUpdateData.galleryFiles.length > 0),
      dataKeys: Object.keys(cleanUpdateData)
    });
    
    // The existing featureFilmService already handles guest updates and file uploads
    // through the extractCrewMembersFromFilmData and uploadFeatureFilmFiles functions
    const result = await updateFeatureFilm(filmId, cleanUpdateData);
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to update feature film');
    }
    
    console.log('✅ Film update completed successfully:', result.data?.id);
    
    // Return the film ID and empty guest IDs array since the existing service
    // handles guest updates internally
    return { 
      filmId, 
      guestIds: [] // Guest IDs are managed internally by the existing service
    };
  } catch (error) {
    console.error('💥 Error updating feature film with guests:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to update feature film with guests');
  }
};

/**
 * Load a feature film with guests using the existing featureFilmService
 * This leverages the existing guest loading functionality
 */
export const loadFeatureFilmWithGuests = async (filmId: string): Promise<FeatureFilmData | null> => {
  try {
    // The existing featureFilmService already loads guests from subcollection
    const result = await getFeatureFilm(filmId);
    
    if (!result.success || !result.data) {
      return null;
    }
    
    // The existing service already includes guests in the returned data
    return result.data as FeatureFilmData;
  } catch (error) {
    console.error('Error loading feature film with guests:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to load feature film with guests');
  }
};

/**
 * Helper function to convert form guest data to the format expected by existing service
 */
export const convertGuestFormDataToServiceFormat = (
  guestFormData: GuestFormData
): Guest => {
  return {
    id: guestFormData.id,
    name: guestFormData.name,
    email: guestFormData.email,
    phone: guestFormData.phone,
    role: guestFormData.role as any,
    otherRole: guestFormData.otherRole,
    bio: guestFormData.bio || ''
  };
};

/**
 * Helper function to convert service guest data to form format
 */
export const convertServiceGuestToFormData = (serviceGuest: Guest): GuestFormData => {
  return {
    id: serviceGuest.id,
    name: serviceGuest.name,
    email: serviceGuest.email || '',
    phone: serviceGuest.phone || '',
    role: serviceGuest.role,
    otherRole: serviceGuest.otherRole,
    bio: serviceGuest.bio || ''
  };
};
