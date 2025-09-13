/**
 * Film Update Fix Utility
 * Comprehensive solution for film update button issues
 */

import { 
  doc, 
  updateDoc, 
  getDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../firebase';
import { FeatureFilmData } from '../types/featureFilm.types';

export interface FilmUpdateResult {
  success: boolean;
  error?: string;
  data?: any;
  debugInfo?: any;
}

/**
 * Enhanced data preparation that handles all edge cases
 */
export const prepareFilmDataForUpdate = (filmData: Partial<FeatureFilmData>): any => {
  console.log('🧹 Preparing film data for update:', {
    originalKeys: Object.keys(filmData),
    hasUndefinedValues: Object.values(filmData).some(v => v === undefined)
  });

  const cleanData: any = {};
  
  Object.entries(filmData).forEach(([key, value]) => {
    // Skip system fields that shouldn't be updated
    if (['id', 'createdAt', 'createdBy'].includes(key)) {
      return;
    }
    
    // Handle galleryLogoIndex specially - it can be undefined (no logo)
    if (key === 'galleryLogoIndex') {
      // Only include if it's a valid number, otherwise omit completely
      if (typeof value === 'number' && value >= 0) {
        cleanData[key] = value;
      }
      // If undefined or invalid, don't include it (this removes the field)
      return;
    }
    
    // Handle arrays - ensure they're valid arrays
    if (Array.isArray(value)) {
      cleanData[key] = value.filter(item => item !== undefined && item !== null);
      return;
    }
    
    // Handle strings - trim and check for empty
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed !== '') {
        cleanData[key] = trimmed;
      }
      return;
    }
    
    // Include other non-undefined values
    if (value !== undefined) {
      cleanData[key] = value;
    }
  });
  
  console.log('✅ Film data prepared:', {
    cleanedKeys: Object.keys(cleanData),
    removedKeys: Object.keys(filmData).filter(k => !(k in cleanData)),
    hasGalleryLogoIndex: 'galleryLogoIndex' in cleanData,
    galleryLogoIndexValue: cleanData.galleryLogoIndex
  });
  
  return cleanData;
};

/**
 * Validate user permissions before update
 */
export const validateUpdatePermissions = async (
  filmId: string, 
  userId: string
): Promise<{ canUpdate: boolean; reason?: string; userRole?: string }> => {
  try {
    console.log('🔐 Validating update permissions:', { filmId, userId });
    
    // Check if film exists
    const filmRef = doc(db, 'films', filmId);
    const filmDoc = await getDoc(filmRef);
    
    if (!filmDoc.exists()) {
      return { canUpdate: false, reason: 'Film not found' };
    }
    
    const filmData = filmDoc.data();
    
    // Check user profile for role
    const profileRef = doc(db, 'profiles', userId);
    const profileDoc = await getDoc(profileRef);
    
    let userRole = 'user';
    if (profileDoc.exists()) {
      userRole = profileDoc.data()?.role || 'user';
    }
    
    console.log('🔐 Permission check:', {
      filmExists: true,
      filmUserId: filmData.userId,
      filmCreatedBy: filmData.createdBy,
      currentUserId: userId,
      userRole,
      isOwner: userId === filmData.userId || userId === filmData.createdBy,
      isAdmin: ['admin', 'super-admin'].includes(userRole),
      isEditor: userRole === 'editor'
    });
    
    // Check permissions based on Firestore rules logic
    const isOwner = userId === filmData.userId || userId === filmData.createdBy;
    const isAdmin = ['admin', 'super-admin'].includes(userRole);
    const isEditor = userRole === 'editor';
    
    const canUpdate = isOwner || isAdmin || isEditor;
    
    if (!canUpdate) {
      return { 
        canUpdate: false, 
        reason: `Insufficient permissions. User role: ${userRole}, Is owner: ${isOwner}`,
        userRole 
      };
    }
    
    return { canUpdate: true, userRole };
    
  } catch (error) {
    console.error('❌ Permission validation error:', error);
    return { 
      canUpdate: false, 
      reason: `Permission check failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
};

/**
 * Enhanced film update function with comprehensive error handling
 */
export const updateFilmWithFix = async (
  filmId: string,
  filmData: Partial<FeatureFilmData>
): Promise<FilmUpdateResult> => {
  const debugInfo: any = {
    timestamp: new Date().toISOString(),
    filmId,
    steps: []
  };
  
  try {
    debugInfo.steps.push('Starting film update');
    console.log('🚀 Starting enhanced film update:', { filmId });
    
    // Step 1: Check authentication
    const auth = getAuth();
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      debugInfo.steps.push('Authentication failed - no current user');
      return {
        success: false,
        error: 'User not authenticated',
        debugInfo
      };
    }
    
    debugInfo.currentUser = {
      uid: currentUser.uid,
      email: currentUser.email,
      emailVerified: currentUser.emailVerified
    };
    debugInfo.steps.push('Authentication verified');
    
    // Step 2: Validate permissions
    const permissionCheck = await validateUpdatePermissions(filmId, currentUser.uid);
    debugInfo.permissionCheck = permissionCheck;
    debugInfo.steps.push('Permission validation completed');
    
    if (!permissionCheck.canUpdate) {
      return {
        success: false,
        error: `Permission denied: ${permissionCheck.reason}`,
        debugInfo
      };
    }
    
    // Step 3: Prepare clean data
    const cleanData = prepareFilmDataForUpdate(filmData);
    debugInfo.dataPreparation = {
      originalFieldCount: Object.keys(filmData).length,
      cleanFieldCount: Object.keys(cleanData).length,
      removedFields: Object.keys(filmData).filter(k => !(k in cleanData))
    };
    debugInfo.steps.push('Data preparation completed');
    
    // Step 4: Check if we have data to update
    if (Object.keys(cleanData).length === 0) {
      debugInfo.steps.push('No valid data to update');
      return {
        success: false,
        error: 'No valid data to update after cleaning',
        debugInfo
      };
    }
    
    // Step 5: Prepare final update data
    const updateData = {
      ...cleanData,
      updatedAt: serverTimestamp()
    };
    
    debugInfo.finalUpdateData = {
      fieldCount: Object.keys(updateData).length,
      fields: Object.keys(updateData)
    };
    debugInfo.steps.push('Final update data prepared');
    
    // Step 6: Perform the update
    const filmRef = doc(db, 'films', filmId);
    
    console.log('💾 Attempting Firestore update:', {
      filmId,
      updateFields: Object.keys(updateData),
      userId: currentUser.uid
    });
    
    await updateDoc(filmRef, updateData);
    debugInfo.steps.push('Firestore update completed');
    
    // Step 7: Verify the update
    const updatedDoc = await getDoc(filmRef);
    if (!updatedDoc.exists()) {
      debugInfo.steps.push('Verification failed - document not found');
      return {
        success: false,
        error: 'Film document not found after update',
        debugInfo
      };
    }
    
    debugInfo.steps.push('Update verification completed');
    
    const result = {
      success: true,
      data: {
        id: filmId,
        ...updatedDoc.data()
      },
      debugInfo
    };
    
    console.log('✅ Film update completed successfully:', {
      filmId,
      updatedFields: Object.keys(updateData),
      totalSteps: debugInfo.steps.length
    });
    
    return result;
    
  } catch (error) {
    debugInfo.steps.push(`Error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`);
    debugInfo.error = {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    };
    
    console.error('💥 Film update failed:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Update failed',
      debugInfo
    };
  }
};

/**
 * Quick diagnostic function to check system health
 */
export const runQuickDiagnostic = async (): Promise<{
  auth: boolean;
  firestore: boolean;
  permissions: boolean;
  overall: 'healthy' | 'issues';
  details: any;
}> => {
  const details: any = {};
  
  try {
    // Check auth
    const auth = getAuth();
    const currentUser = auth.currentUser;
    const authOk = !!currentUser;
    details.auth = {
      hasCurrentUser: authOk,
      uid: currentUser?.uid,
      email: currentUser?.email
    };
    
    // Check Firestore connection
    let firestoreOk = false;
    try {
      // Try to access a test document
      const testRef = doc(db, 'films', 'test');
      await getDoc(testRef); // This will succeed even if document doesn't exist
      firestoreOk = true;
    } catch (error) {
      details.firestoreError = error instanceof Error ? error.message : 'Unknown error';
    }
    details.firestore = { connected: firestoreOk };
    
    // Check permissions (if user is authenticated)
    let permissionsOk = false;
    if (authOk && currentUser) {
      try {
        const profileRef = doc(db, 'profiles', currentUser.uid);
        const profileDoc = await getDoc(profileRef);
        permissionsOk = profileDoc.exists();
        details.permissions = {
          profileExists: profileDoc.exists(),
          role: profileDoc.exists() ? profileDoc.data()?.role : null
        };
      } catch (error) {
        details.permissionsError = error instanceof Error ? error.message : 'Unknown error';
      }
    }
    
    const overall = authOk && firestoreOk && permissionsOk ? 'healthy' : 'issues';
    
    return {
      auth: authOk,
      firestore: firestoreOk,
      permissions: permissionsOk,
      overall,
      details
    };
    
  } catch (error) {
    return {
      auth: false,
      firestore: false,
      permissions: false,
      overall: 'issues',
      details: {
        error: error instanceof Error ? error.message : 'Diagnostic failed'
      }
    };
  }
};

/**
 * Emergency update function that bypasses some checks
 * Use only when normal update fails
 */
export const emergencyFilmUpdate = async (
  filmId: string,
  updateData: Record<string, any>
): Promise<FilmUpdateResult> => {
  try {
    console.log('🚨 EMERGENCY UPDATE INITIATED:', { filmId, updateData });
    
    const auth = getAuth();
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      return {
        success: false,
        error: 'Emergency update requires authentication'
      };
    }
    
    // Minimal data cleaning
    const cleanData: any = {};
    Object.entries(updateData).forEach(([key, value]) => {
      if (value !== undefined && key !== 'id' && key !== 'createdAt' && key !== 'createdBy') {
        cleanData[key] = value;
      }
    });
    
    if (Object.keys(cleanData).length === 0) {
      return {
        success: false,
        error: 'No valid data for emergency update'
      };
    }
    
    const finalData = {
      ...cleanData,
      updatedAt: serverTimestamp()
    };
    
    const filmRef = doc(db, 'films', filmId);
    await updateDoc(filmRef, finalData);
    
    console.log('✅ Emergency update completed');
    
    return {
      success: true,
      data: { id: filmId, ...finalData }
    };
    
  } catch (error) {
    console.error('💥 Emergency update failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Emergency update failed'
    };
  }
};
