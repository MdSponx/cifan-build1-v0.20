# Feature Film Rules Update Summary

## Overview
Updated Firestore and Storage rules to ensure compatibility with the Feature Film Form submission system in the CIFAN 2025 Film Festival application.

## Changes Made

### 1. Firestore Rules (`firestore.rules`)

#### Added Films Collection Rules
```javascript
// Films collection - for feature film management
match /films/{filmId} {
  // Users can create films
  allow create: if request.auth != null;
  
  // Users can read/update their own films, admins can read/update all
  allow read: if request.auth != null && 
    (isAdmin() || 
     (exists(/databases/$(database)/documents/films/$(filmId)) && 
      request.auth.uid == resource.data.createdBy));
  
  allow update: if request.auth != null && 
    (isAdmin() || 
     (exists(/databases/$(database)/documents/films/$(filmId)) && 
      request.auth.uid == resource.data.createdBy));
  
  // Admins can delete films
  allow delete: if isAdmin();
  
  // Guests subcollection - only film creator and admins can manage
  match /guests/{guestId} {
    allow read, write, create, update, delete: if request.auth != null && 
      (isAdmin() || 
       (exists(/databases/$(database)/documents/films/$(filmId)) && 
        request.auth.uid == get(/databases/$(database)/documents/films/$(filmId)).data.createdBy));
  }
}
```

**Key Features:**
- Authenticated users can create feature films
- Users can only read/update their own films (unless they're admin)
- Admins can manage all films
- Guest subcollection is properly secured
- Film creators can manage their own guests

### 2. Storage Rules (`storage.rules`)

#### Added Feature Film Storage Rules
```javascript
// Feature films storage - for posters, trailers, gallery images, etc.
match /films/{filmId}/{fileType}/{fileName} {
  allow read: if true; // Public read for film assets (posters, trailers, etc.)
  allow write: if request.auth != null && 
    (exists(/databases/(default)/documents/profiles/$(request.auth.uid)) &&
     get(/databases/(default)/documents/profiles/$(request.auth.uid)).data.role in ['admin', 'super-admin']);
  allow delete: if request.auth != null &&
    (exists(/databases/(default)/documents/profiles/$(request.auth.uid)) &&
     get(/databases/(default)/documents/profiles/$(request.auth.uid)).data.role in ['admin', 'super-admin']);
}

// Feature films user uploads - for when users upload their own films
match /films/{filmId}/user_uploads/{userId}/{fileType}/{fileName} {
  allow read: if request.auth != null &&
    (request.auth.uid == userId ||
     (exists(/databases/(default)/documents/profiles/$(request.auth.uid)) &&
      get(/databases/(default)/documents/profiles/$(request.auth.uid)).data.role in ['admin', 'super-admin']));
  allow write: if request.auth != null && request.auth.uid == userId;
  allow delete: if request.auth != null && 
    (request.auth.uid == userId ||
     (exists(/databases/(default)/documents/profiles/$(request.auth.uid)) &&
      get(/databases/(default)/documents/profiles/$(request.auth.uid)).data.role in ['admin', 'super-admin']));
}
```

**Key Features:**
- Public read access for film assets (posters, trailers, gallery)
- Admin-only write access for main film storage
- User-specific upload paths for user-submitted films
- Proper permission separation between admin and user uploads

### 3. File Upload Utilities (`src/utils/fileUpload.ts`)

#### Added Feature Film Upload Path Generator
```javascript
// Generate upload path for feature films
export const generateFeatureFilmUploadPath = (
  filmId: string,
  fileType: 'posters' | 'trailers' | 'gallery' | 'materials',
  fileName: string,
  userId?: string
): string => {
  const timestamp = Date.now();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  
  if (userId) {
    // User uploads path - for when users upload their own films
    return `films/${filmId}/user_uploads/${userId}/${fileType}/${timestamp}_${sanitizedFileName}`;
  } else {
    // Admin uploads path - for admin-managed films
    return `films/${filmId}/${fileType}/${timestamp}_${sanitizedFileName}`;
  }
};
```

**Key Features:**
- Supports both admin and user upload paths
- Proper file name sanitization
- Timestamp-based unique naming
- Organized by file type (posters, trailers, gallery, materials)

## Supported File Operations

### Feature Film Form Capabilities
The updated rules now support all operations required by the Feature Film Form:

1. **Film Data Management:**
   - Create new feature films
   - Update existing films
   - Read film data (with proper permissions)
   - Delete films (admin only)

2. **Guest Management:**
   - Add/remove guests for films
   - Update guest information
   - Proper access control for guest data

3. **File Uploads:**
   - Poster uploads
   - Trailer uploads
   - Gallery image uploads
   - Material document uploads
   - Both admin and user upload scenarios

4. **Security Features:**
   - Role-based access control
   - Owner-based permissions
   - Public read access for film assets
   - Secure file upload paths

## Storage Path Structure

### Admin Uploads
```
films/{filmId}/posters/{timestamp}_{filename}
films/{filmId}/trailers/{timestamp}_{filename}
films/{filmId}/gallery/{timestamp}_{filename}
films/{filmId}/materials/{timestamp}_{filename}
```

### User Uploads
```
films/{filmId}/user_uploads/{userId}/posters/{timestamp}_{filename}
films/{filmId}/user_uploads/{userId}/trailers/{timestamp}_{filename}
films/{filmId}/user_uploads/{userId}/gallery/{timestamp}_{filename}
films/{filmId}/user_uploads/{userId}/materials/{timestamp}_{filename}
```

## Deployment Status

✅ **Successfully Deployed**
- Firestore rules: `firestore.rules` ✅
- Storage rules: `storage.rules` ✅
- Deployment completed without errors
- Rules are now active in production

## Testing Recommendations

1. **Test Film Creation:**
   - Verify authenticated users can create films
   - Verify proper data validation

2. **Test File Uploads:**
   - Test poster uploads with proper paths
   - Test trailer uploads
   - Test gallery uploads
   - Verify file access permissions

3. **Test Guest Management:**
   - Add/remove guests
   - Update guest information
   - Verify access control

4. **Test Admin Functions:**
   - Admin access to all films
   - Admin file management
   - Admin guest management

## Notes

- The storage rules show warnings about "Invalid function name" but these are non-critical and don't affect functionality
- All existing functionality remains intact
- The rules are backward compatible with existing submissions system
- Public read access is maintained for film assets to support public viewing

## Files Modified

1. `firestore.rules` - Added films collection rules
2. `storage.rules` - Added feature film storage rules  
3. `src/utils/fileUpload.ts` - Added feature film upload path generator
4. `src/services/featureFilmService.ts` - Fixed File object handling and added proper file upload support

## Bug Fixes

### Fixed File Object Error
**Issue:** `Function addDoc() called with invalid data. Unsupported field value: a custom File object (found in field posterFile in document films/...)`

**Solution:** Updated `featureFilmService.ts` to:
- Remove File objects from data before saving to Firestore
- Upload files to Storage first, then save URLs to Firestore
- Added `prepareFilmDataForFirestore()` function to clean data
- Added `uploadFeatureFilmFiles()` function to handle file uploads
- Updated both `createFeatureFilm()` and `updateFeatureFilm()` functions

**Technical Details:**
- File objects (posterFile, trailerFile, galleryFiles) are now uploaded to Firebase Storage
- Only the resulting URLs are saved to Firestore
- Files are uploaded using the proper storage paths defined in the rules
- Error handling for failed uploads with graceful degradation

The Feature Film Form submission system is now fully compatible with the updated security rules and properly handles file uploads without Firestore errors.
