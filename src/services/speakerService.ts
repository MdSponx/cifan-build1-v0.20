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
  serverTimestamp
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { db, storage } from '../firebase';
import { Speaker } from '../types/activities';

export interface SpeakerServiceResult {
  success: boolean;
  data?: any;
  error?: string;
}

const SPEAKER_IMAGES_STORAGE_PATH = 'activities/speakers/images';

/**
 * Get the speakers subcollection reference for an activity
 */
const getSpeakersCollection = (activityId: string) => {
  return collection(db, 'activities', activityId, 'speakers');
};

/**
 * Upload speaker image to Firebase Storage
 */
const uploadSpeakerImage = async (file: File, activityId: string, speakerId: string): Promise<{ downloadURL: string; path: string }> => {
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
    const path = `${SPEAKER_IMAGES_STORAGE_PATH}/${activityId}/${speakerId}/${fileName}`;
    const storageRef = ref(storage, path);

    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);

    return { downloadURL, path };
  } catch (error) {
    console.error('Error uploading speaker image:', error);
    throw error;
  }
};

/**
 * Delete speaker image from Firebase Storage
 */
const deleteSpeakerImage = async (imagePath: string): Promise<void> => {
  try {
    const imageRef = ref(storage, imagePath);
    await deleteObject(imageRef);
  } catch (error) {
    // Log error but don't throw - image might already be deleted
    console.warn('Error deleting speaker image:', error);
  }
};

/**
 * Create a new speaker for an activity
 */
export const createSpeaker = async (
  activityId: string,
  speakerData: Omit<Speaker, 'id'>,
  imageFile?: File
): Promise<SpeakerServiceResult> => {
  try {
    let imageUrl = '';
    let imagePath = '';

    // First create the speaker document to get an ID
    const docData = {
      name: speakerData.name,
      email: speakerData.email || null,
      phone: speakerData.phone || null,
      role: speakerData.role,
      otherRole: speakerData.otherRole || null,
      bio: speakerData.bio || null,
      image: null,
      imagePath: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(getSpeakersCollection(activityId), docData);
    const speakerId = docRef.id;

    // Upload image if provided
    if (imageFile) {
      try {
        const result = await uploadSpeakerImage(imageFile, activityId, speakerId);
        imageUrl = result.downloadURL;
        imagePath = result.path;

        // Update the document with image information
        await updateDoc(docRef, {
          image: imageUrl,
          imagePath: imagePath,
          updatedAt: serverTimestamp()
        });
      } catch (imageError) {
        console.error('Error uploading speaker image:', imageError);
        // Continue without image - don't fail the entire operation
      }
    }
    
    return {
      success: true,
      data: { 
        id: speakerId, 
        ...docData,
        image: imageUrl || null,
        imagePath: imagePath || null
      }
    };
  } catch (error) {
    console.error('Error creating speaker:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create speaker'
    };
  }
};

/**
 * Update an existing speaker
 */
export const updateSpeaker = async (
  activityId: string,
  speakerId: string,
  speakerData: Partial<Speaker>,
  imageFile?: File
): Promise<SpeakerServiceResult> => {
  try {
    const docRef = doc(db, 'activities', activityId, 'speakers', speakerId);
    
    // Get current speaker data to handle image updates
    const currentDoc = await getDoc(docRef);
    if (!currentDoc.exists()) {
      return {
        success: false,
        error: 'Speaker not found'
      };
    }

    const currentData = currentDoc.data();
    let imageUrl = currentData.image;
    let imagePath = currentData.imagePath;

    // Handle image update
    if (imageFile) {
      // Delete old image if exists
      if (currentData.imagePath) {
        await deleteSpeakerImage(currentData.imagePath);
      }

      // Upload new image
      try {
        const result = await uploadSpeakerImage(imageFile, activityId, speakerId);
        imageUrl = result.downloadURL;
        imagePath = result.path;
      } catch (imageError) {
        console.error('Error uploading speaker image:', imageError);
        // Continue with update without new image
      }
    }

    const updateData = {
      ...speakerData,
      image: imageUrl,
      imagePath: imagePath,
      updatedAt: serverTimestamp()
    };

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key as keyof typeof updateData] === undefined) {
        delete updateData[key as keyof typeof updateData];
      }
    });

    await updateDoc(docRef, updateData);
    
    return {
      success: true,
      data: { id: speakerId, ...updateData }
    };
  } catch (error) {
    console.error('Error updating speaker:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update speaker'
    };
  }
};

/**
 * Delete a speaker
 */
export const deleteSpeaker = async (activityId: string, speakerId: string): Promise<SpeakerServiceResult> => {
  try {
    const docRef = doc(db, 'activities', activityId, 'speakers', speakerId);
    
    // Get speaker data to delete associated image
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const speakerData = docSnap.data();
      if (speakerData.imagePath) {
        await deleteSpeakerImage(speakerData.imagePath);
      }
    }

    await deleteDoc(docRef);
    
    return {
      success: true,
      data: { id: speakerId }
    };
  } catch (error) {
    console.error('Error deleting speaker:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete speaker'
    };
  }
};

/**
 * Get a single speaker by ID
 */
export const getSpeaker = async (activityId: string, speakerId: string): Promise<SpeakerServiceResult> => {
  try {
    const docRef = doc(db, 'activities', activityId, 'speakers', speakerId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        success: true,
        data: {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate()
        }
      };
    } else {
      return {
        success: false,
        error: 'Speaker not found'
      };
    }
  } catch (error) {
    console.error('Error getting speaker:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get speaker'
    };
  }
};

/**
 * Get all speakers for an activity
 */
export const getSpeakers = async (activityId: string): Promise<SpeakerServiceResult> => {
  try {
    const q = query(getSpeakersCollection(activityId), orderBy('createdAt', 'asc'));
    const querySnapshot = await getDocs(q);
    const speakers: Speaker[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      speakers.push({
        id: doc.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: data.role,
        otherRole: data.otherRole,
        bio: data.bio,
        image: data.image,
        imagePath: data.imagePath
      } as Speaker);
    });
    
    return {
      success: true,
      data: speakers
    };
  } catch (error) {
    console.error('Error getting speakers:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get speakers'
    };
  }
};

/**
 * Bulk create speakers for an activity
 */
export const createMultipleSpeakers = async (
  activityId: string,
  speakersData: Omit<Speaker, 'id'>[]
): Promise<SpeakerServiceResult> => {
  try {
    const results = await Promise.all(
      speakersData.map(speakerData => createSpeaker(activityId, speakerData))
    );
    
    const failedResults = results.filter(result => !result.success);
    if (failedResults.length > 0) {
      return {
        success: false,
        error: `Failed to create ${failedResults.length} speakers`
      };
    }
    
    return {
      success: true,
      data: results.map(result => result.data)
    };
  } catch (error) {
    console.error('Error creating multiple speakers:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create speakers'
    };
  }
};

/**
 * Delete all speakers for an activity
 */
export const deleteAllSpeakers = async (activityId: string): Promise<SpeakerServiceResult> => {
  try {
    const speakersResult = await getSpeakers(activityId);
    if (!speakersResult.success || !speakersResult.data) {
      return speakersResult;
    }
    
    const speakers = speakersResult.data as Speaker[];
    const deletePromises = speakers.map(speaker => 
      speaker.id ? deleteSpeaker(activityId, speaker.id) : Promise.resolve({ success: true })
    );
    
    await Promise.all(deletePromises);
    
    return {
      success: true,
      data: { deletedCount: speakers.length }
    };
  } catch (error) {
    console.error('Error deleting all speakers:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete all speakers'
    };
  }
};

/**
 * Sync speakers data from activity form to speakers subcollection
 * This function handles the migration from storing speakers in the activity document
 * to storing them in a subcollection
 */
export const syncSpeakersToSubcollection = async (
  activityId: string,
  speakers: Speaker[]
): Promise<SpeakerServiceResult> => {
  try {
    // First, delete all existing speakers in subcollection
    const deleteResult = await deleteAllSpeakers(activityId);
    if (!deleteResult.success) {
      console.warn('Failed to delete existing speakers, continuing with sync...');
    }

    // Then create new speakers from the provided data
    if (!speakers || speakers.length === 0) {
      return {
        success: true,
        data: { message: 'No speakers to sync' }
      };
    }

    // Process speakers one by one to handle images properly
    const results = [];
    for (const speaker of speakers) {
      // Extract image file if it's a data URL (from form)
      let imageFile: File | undefined;
      if (speaker.image && speaker.image.startsWith('data:')) {
        try {
          // Convert data URL to File object
          const response = await fetch(speaker.image);
          const blob = await response.blob();
          imageFile = new File([blob], `speaker_${Date.now()}.jpg`, { type: 'image/jpeg' });
        } catch (error) {
          console.warn('Failed to convert speaker image data URL to file:', error);
        }
      }

      const speakerData = {
        name: speaker.name,
        email: speaker.email,
        phone: speaker.phone,
        role: speaker.role,
        otherRole: speaker.otherRole,
        bio: speaker.bio
      };

      const result = await createSpeaker(activityId, speakerData, imageFile);
      results.push(result);
    }

    const failedResults = results.filter(result => !result.success);
    if (failedResults.length > 0) {
      return {
        success: false,
        error: `Failed to sync ${failedResults.length} speakers`
      };
    }
    
    return {
      success: true,
      data: {
        message: `Synced ${speakers.length} speakers to subcollection`,
        speakersCreated: results.map(result => result.data)
      }
    };
  } catch (error) {
    console.error('Error syncing speakers to subcollection:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to sync speakers to subcollection'
    };
  }
};
