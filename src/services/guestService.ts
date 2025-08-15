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
import { db } from '../firebase';
import { Guest } from '../types/featureFilm.types';

export interface GuestServiceResult {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Get the guests subcollection reference for a film
 */
const getGuestsCollection = (filmId: string) => {
  return collection(db, 'films', filmId, 'guests');
};

/**
 * Create a new guest for a film
 */
export const createGuest = async (
  filmId: string,
  guestData: Omit<Guest, 'id' | 'createdAt' | 'updatedAt'>
): Promise<GuestServiceResult> => {
  try {
    const docData = {
      ...guestData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(getGuestsCollection(filmId), docData);
    
    return {
      success: true,
      data: { id: docRef.id, ...docData }
    };
  } catch (error) {
    console.error('Error creating guest:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create guest'
    };
  }
};

/**
 * Update an existing guest
 */
export const updateGuest = async (
  filmId: string,
  guestId: string,
  guestData: Partial<Guest>
): Promise<GuestServiceResult> => {
  try {
    const docRef = doc(db, 'films', filmId, 'guests', guestId);
    
    const updateData = {
      ...guestData,
      updatedAt: serverTimestamp()
    };

    await updateDoc(docRef, updateData);
    
    return {
      success: true,
      data: { id: guestId, ...updateData }
    };
  } catch (error) {
    console.error('Error updating guest:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update guest'
    };
  }
};

/**
 * Delete a guest
 */
export const deleteGuest = async (filmId: string, guestId: string): Promise<GuestServiceResult> => {
  try {
    const docRef = doc(db, 'films', filmId, 'guests', guestId);
    await deleteDoc(docRef);
    
    return {
      success: true,
      data: { id: guestId }
    };
  } catch (error) {
    console.error('Error deleting guest:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete guest'
    };
  }
};

/**
 * Get a single guest by ID
 */
export const getGuest = async (filmId: string, guestId: string): Promise<GuestServiceResult> => {
  try {
    const docRef = doc(db, 'films', filmId, 'guests', guestId);
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
        error: 'Guest not found'
      };
    }
  } catch (error) {
    console.error('Error getting guest:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get guest'
    };
  }
};

/**
 * Get all guests for a film
 */
export const getGuests = async (filmId: string): Promise<GuestServiceResult> => {
  try {
    const q = query(getGuestsCollection(filmId), orderBy('createdAt', 'asc'));
    const querySnapshot = await getDocs(q);
    const guests: Guest[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      guests.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate()
      } as Guest);
    });
    
    return {
      success: true,
      data: guests
    };
  } catch (error) {
    console.error('Error getting guests:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get guests'
    };
  }
};

/**
 * Bulk create guests for a film
 */
export const createMultipleGuests = async (
  filmId: string,
  guestsData: Omit<Guest, 'id' | 'createdAt' | 'updatedAt'>[]
): Promise<GuestServiceResult> => {
  try {
    const results = await Promise.all(
      guestsData.map(guestData => createGuest(filmId, guestData))
    );
    
    const failedResults = results.filter(result => !result.success);
    if (failedResults.length > 0) {
      return {
        success: false,
        error: `Failed to create ${failedResults.length} guests`
      };
    }
    
    return {
      success: true,
      data: results.map(result => result.data)
    };
  } catch (error) {
    console.error('Error creating multiple guests:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create guests'
    };
  }
};

/**
 * Delete all guests for a film
 */
export const deleteAllGuests = async (filmId: string): Promise<GuestServiceResult> => {
  try {
    const guestsResult = await getGuests(filmId);
    if (!guestsResult.success || !guestsResult.data) {
      return guestsResult;
    }
    
    const guests = guestsResult.data as Guest[];
    const deletePromises = guests.map(guest => 
      guest.id ? deleteGuest(filmId, guest.id) : Promise.resolve({ success: true })
    );
    
    await Promise.all(deletePromises);
    
    return {
      success: true,
      data: { deletedCount: guests.length }
    };
  } catch (error) {
    console.error('Error deleting all guests:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete all guests'
    };
  }
};
