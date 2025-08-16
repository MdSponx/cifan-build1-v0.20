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

// Interface for submission guests (different from feature film guests)
export interface SubmissionGuest {
  id?: string;
  fullName: string;
  fullNameTh?: string | null;
  role: string;
  customRole?: string | null;
  age?: number;
  phone?: string | null;
  email?: string | null;
  schoolName?: string | null;
  studentId?: string | null;
  order?: number;
  submissionId?: string;
  createdAt?: Date;
  updatedAt?: Date;
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

// ===== SUBMISSION GUESTS FUNCTIONS =====

/**
 * Get the guests subcollection reference for a submission
 */
const getSubmissionGuestsCollection = (submissionId: string) => {
  return collection(db, 'submissions', submissionId, 'guests');
};

/**
 * Create a new guest for a submission
 */
export const createSubmissionGuest = async (
  submissionId: string,
  guestData: Omit<SubmissionGuest, 'id' | 'createdAt' | 'updatedAt'>
): Promise<GuestServiceResult> => {
  try {
    const docData = {
      ...guestData,
      submissionId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(getSubmissionGuestsCollection(submissionId), docData);
    
    return {
      success: true,
      data: { id: docRef.id, ...docData }
    };
  } catch (error) {
    console.error('Error creating submission guest:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create submission guest'
    };
  }
};

/**
 * Update an existing submission guest
 */
export const updateSubmissionGuest = async (
  submissionId: string,
  guestId: string,
  guestData: Partial<SubmissionGuest>
): Promise<GuestServiceResult> => {
  try {
    const docRef = doc(db, 'submissions', submissionId, 'guests', guestId);
    
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
    console.error('Error updating submission guest:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update submission guest'
    };
  }
};

/**
 * Delete a submission guest
 */
export const deleteSubmissionGuest = async (submissionId: string, guestId: string): Promise<GuestServiceResult> => {
  try {
    const docRef = doc(db, 'submissions', submissionId, 'guests', guestId);
    await deleteDoc(docRef);
    
    return {
      success: true,
      data: { id: guestId }
    };
  } catch (error) {
    console.error('Error deleting submission guest:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete submission guest'
    };
  }
};

/**
 * Get a single submission guest by ID
 */
export const getSubmissionGuest = async (submissionId: string, guestId: string): Promise<GuestServiceResult> => {
  try {
    const docRef = doc(db, 'submissions', submissionId, 'guests', guestId);
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
        error: 'Submission guest not found'
      };
    }
  } catch (error) {
    console.error('Error getting submission guest:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get submission guest'
    };
  }
};

/**
 * Get all guests for a submission
 */
export const getSubmissionGuests = async (submissionId: string): Promise<GuestServiceResult> => {
  try {
    const q = query(getSubmissionGuestsCollection(submissionId), orderBy('order', 'asc'));
    const querySnapshot = await getDocs(q);
    const guests: SubmissionGuest[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      guests.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate()
      } as SubmissionGuest);
    });
    
    return {
      success: true,
      data: guests
    };
  } catch (error) {
    console.error('Error getting submission guests:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get submission guests'
    };
  }
};

/**
 * Bulk create guests for a submission
 */
export const createMultipleSubmissionGuests = async (
  submissionId: string,
  guestsData: Omit<SubmissionGuest, 'id' | 'createdAt' | 'updatedAt'>[]
): Promise<GuestServiceResult> => {
  try {
    const results = await Promise.all(
      guestsData.map(guestData => createSubmissionGuest(submissionId, guestData))
    );
    
    const failedResults = results.filter(result => !result.success);
    if (failedResults.length > 0) {
      return {
        success: false,
        error: `Failed to create ${failedResults.length} submission guests`
      };
    }
    
    return {
      success: true,
      data: results.map(result => result.data)
    };
  } catch (error) {
    console.error('Error creating multiple submission guests:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create submission guests'
    };
  }
};

/**
 * Delete all guests for a submission
 */
export const deleteAllSubmissionGuests = async (submissionId: string): Promise<GuestServiceResult> => {
  try {
    const guestsResult = await getSubmissionGuests(submissionId);
    if (!guestsResult.success || !guestsResult.data) {
      return guestsResult;
    }
    
    const guests = guestsResult.data as SubmissionGuest[];
    const deletePromises = guests.map(guest => 
      guest.id ? deleteSubmissionGuest(submissionId, guest.id) : Promise.resolve({ success: true })
    );
    
    await Promise.all(deletePromises);
    
    return {
      success: true,
      data: { deletedCount: guests.length }
    };
  } catch (error) {
    console.error('Error deleting all submission guests:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete all submission guests'
    };
  }
};

/**
 * Sync crew members data to submission guests subcollection
 * This function can be used to migrate existing submissions or update guest data
 */
export const syncCrewMembersToSubmissionGuests = async (
  submissionId: string,
  crewMembers: any[]
): Promise<GuestServiceResult> => {
  try {
    // First, delete all existing guests
    const deleteResult = await deleteAllSubmissionGuests(submissionId);
    if (!deleteResult.success) {
      console.warn('Failed to delete existing guests, continuing with sync...');
    }

    // Then create new guests from crew members
    if (!crewMembers || crewMembers.length === 0) {
      return {
        success: true,
        data: { message: 'No crew members to sync' }
      };
    }

    const guestsData = crewMembers.map((member, index) => ({
      fullName: member.fullName,
      fullNameTh: member.fullNameTh || null,
      role: member.role,
      customRole: member.customRole || null,
      age: member.age,
      phone: member.phone || null,
      email: member.email || null,
      schoolName: member.schoolName || null,
      studentId: member.studentId || null,
      order: index,
      submissionId: submissionId
    }));

    const createResult = await createMultipleSubmissionGuests(submissionId, guestsData);
    
    return {
      success: createResult.success,
      data: {
        message: `Synced ${crewMembers.length} crew members to guests subcollection`,
        guestsCreated: createResult.data
      },
      error: createResult.error
    };
  } catch (error) {
    console.error('Error syncing crew members to submission guests:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to sync crew members to submission guests'
    };
  }
};
