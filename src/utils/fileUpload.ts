import { ref, uploadBytesResumable, getDownloadURL, UploadTask } from 'firebase/storage';
import { storage } from '../firebase';
import { FILE_TYPES } from './formConstants';

export interface UploadProgress {
  progress: number;
  isUploading: boolean;
  error?: string;
}

export interface FileUploadResult {
  url: string;
  fileName: string;
  fileSize: number;
}

// Upload file to Firebase Storage with progress tracking
export const uploadFile = async (
  file: File, 
  path: string,
  onProgress?: (progress: number) => void
): Promise<FileUploadResult> => {
  return new Promise((resolve, reject) => {
    try {
      const storageRef = ref(storage, path);
      const uploadTask: UploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // Calculate progress percentage
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          
          // Call progress callback if provided
          if (onProgress) {
            onProgress(Math.round(progress));
          }
        },
        (error) => {
          console.error('File upload error:', error);
          reject(new Error('Failed to upload file'));
        },
        async () => {
          try {
            // Upload completed successfully, get download URL
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            
            resolve({
              url,
              fileName: file.name,
              fileSize: file.size
            });
          } catch (error) {
            console.error('Error getting download URL:', error);
            reject(new Error('Failed to get download URL'));
          }
        }
      );
    } catch (error) {
      console.error('File upload initialization error:', error);
      reject(new Error('Failed to initialize file upload'));
    }
  });
};

// Generate upload path based on category and file type
export const generateUploadPath = (
  category: string,
  fileType: 'films' | 'posters' | 'proofs',
  fileName: string
): string => {
  const timestamp = Date.now();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `submissions/${category}/${fileType}/${timestamp}_${sanitizedFileName}`;
};

// Generate upload path for feature films
export const generateFeatureFilmUploadPath = (
  filmId: string,
  fileType: 'posters' | 'trailers' | 'gallery' | 'materials' | 'stills' | 'presskit' | 'fortune-cards',
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

// Validate file before upload
export const validateFileForUpload = (
  file: File,
  fileType: keyof typeof FILE_TYPES
): { isValid: boolean; error?: string } => {
  const config = FILE_TYPES[fileType];
  
  // Check file size
  if (file.size > config.maxSize) {
    const maxSizeMB = Math.round(config.maxSize / (1024 * 1024));
    return {
      isValid: false,
      error: `File size too large. Maximum size is ${maxSizeMB}MB`
    };
  }
  
  // Check file type
  if (!config.types.includes(file.type)) {
    return {
      isValid: false,
      error: `Invalid file type. Allowed types: ${config.types.join(', ')}`
    };
  }
  
  return { isValid: true };
};

// Format file size for display
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Get file extension
export const getFileExtension = (fileName: string): string => {
  return fileName.slice((fileName.lastIndexOf('.') - 1 >>> 0) + 2);
};

// Check if file is image
export const isImageFile = (file: File): boolean => {
  return file.type.startsWith('image/');
};

// Check if file is video
export const isVideoFile = (file: File): boolean => {
  return file.type.startsWith('video/');
};

// Create file preview URL
export const createFilePreview = (file: File): string => {
  return URL.createObjectURL(file);
};

// Cleanup file preview URL
export const cleanupFilePreview = (url: string): void => {
  URL.revokeObjectURL(url);
};
