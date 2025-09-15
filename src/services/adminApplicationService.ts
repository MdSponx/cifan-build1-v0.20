import { doc, getDoc, deleteDoc, collection, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { deleteFile } from './fileUploadService';
import { AdminApplicationData } from '../types/admin.types';

export interface AdminDeleteProgress {
  stage: 'validating' | 'deleting-files' | 'deleting-comments' | 'deleting-application' | 'complete' | 'error';
  progress: number;
  message: string;
}

export class AdminApplicationService {
  private onProgress?: (progress: AdminDeleteProgress) => void;

  constructor(onProgress?: (progress: AdminDeleteProgress) => void) {
    this.onProgress = onProgress;
  }

  /**
   * Delete an application (admin/editor only - can delete any status)
   * This is more comprehensive than the regular deleteApplication method
   */
  async deleteApplication(applicationId: string): Promise<void> {
    try {
      this.updateProgress('validating', 0, 'Validating application...');

      // Get current application data
      const docRef = doc(db, 'submissions', applicationId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error('Application not found');
      }

      const application = { id: docSnap.id, ...docSnap.data() } as AdminApplicationData;

      this.updateProgress('deleting-files', 10, 'Preparing to delete files...');

      // Delete associated files with progress tracking
      const filesToDelete = [
        { path: application.files?.filmFile?.url, name: 'film file' },
        { path: application.files?.posterFile?.url, name: 'poster file' },
        { path: application.files?.proofFile?.url, name: 'proof file' }
      ].filter(file => file.path);

      if (filesToDelete.length > 0) {
        for (let i = 0; i < filesToDelete.length; i++) {
          const file = filesToDelete[i];
          const progress = 10 + ((i + 1) / filesToDelete.length) * 40; // 10% to 50%
          
          this.updateProgress('deleting-files', progress, `Deleting ${file.name}...`);
          
          try {
            // Extract storage path from URL if needed
            const storagePath = this.extractStoragePathFromUrl(file.path!);
            if (storagePath) {
              await deleteFile(storagePath);
            }
          } catch (error) {
            console.warn('Failed to delete file:', file.path, error);
            // Continue with deletion even if file deletion fails
          }
        }
      } else {
        this.updateProgress('deleting-files', 50, 'No files to delete...');
      }

      this.updateProgress('deleting-comments', 60, 'Deleting comments and scores...');

      // Delete all comments and scores in the subcollection
      try {
        const commentsRef = collection(db, 'submissions', applicationId, 'shortFilmComments');
        const commentsSnapshot = await getDocs(commentsRef);
        
        if (!commentsSnapshot.empty) {
          const batch = writeBatch(db);
          commentsSnapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
          });
          await batch.commit();
          this.updateProgress('deleting-comments', 80, `Deleted ${commentsSnapshot.docs.length} comments and scores...`);
        } else {
          this.updateProgress('deleting-comments', 80, 'No comments to delete...');
        }
      } catch (error) {
        console.warn('Failed to delete comments:', error);
        // Continue with deletion even if comment deletion fails
        this.updateProgress('deleting-comments', 80, 'Comments deletion failed, continuing...');
      }

      this.updateProgress('deleting-application', 90, 'Removing application record...');

      // Delete the main application document
      await deleteDoc(docRef);

      this.updateProgress('complete', 100, 'Application deleted successfully!');

    } catch (error) {
      console.error('Error deleting application:', error);
      this.updateProgress('error', 0, error instanceof Error ? error.message : 'Unknown error occurred');
      throw error;
    }
  }

  /**
   * Check if user can delete applications (admin or editor)
   */
  canDeleteApplication(userRole: string | undefined): boolean {
    return userRole === 'admin' || userRole === 'super-admin' || userRole === 'editor';
  }

  /**
   * Delete multiple applications (bulk delete)
   */
  async bulkDeleteApplications(applicationIds: string[]): Promise<void> {
    try {
      this.updateProgress('validating', 0, `Validating ${applicationIds.length} applications...`);

      if (applicationIds.length === 0) {
        throw new Error('No applications selected for deletion');
      }

      let completedCount = 0;
      const totalCount = applicationIds.length;
      const errors: string[] = [];

      for (const applicationId of applicationIds) {
        try {
          this.updateProgress('deleting-application', 
            Math.round((completedCount / totalCount) * 100), 
            `Deleting application ${completedCount + 1} of ${totalCount}...`
          );

          // Use the existing single delete method for each application
          const singleDeleteService = new AdminApplicationService();
          await singleDeleteService.deleteApplication(applicationId);
          
          completedCount++;
        } catch (error) {
          console.error(`Failed to delete application ${applicationId}:`, error);
          errors.push(`Failed to delete application ${applicationId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      if (errors.length > 0) {
        const successCount = completedCount;
        const failureCount = errors.length;
        
        if (successCount > 0) {
          this.updateProgress('complete', 100, 
            `Bulk delete completed: ${successCount} successful, ${failureCount} failed`
          );
        } else {
          throw new Error(`All deletions failed: ${errors.join('; ')}`);
        }
      } else {
        this.updateProgress('complete', 100, `Successfully deleted all ${totalCount} applications`);
      }

    } catch (error) {
      console.error('Error in bulk delete:', error);
      this.updateProgress('error', 0, error instanceof Error ? error.message : 'Unknown error occurred');
      throw error;
    }
  }

  /**
   * Extract storage path from Firebase Storage URL
   */
  private extractStoragePathFromUrl(url: string): string | null {
    try {
      // Handle Firebase Storage URLs
      if (url.includes('firebasestorage.googleapis.com')) {
        const urlObj = new URL(url);
        const pathMatch = urlObj.pathname.match(/\/o\/(.+?)\?/);
        if (pathMatch) {
          return decodeURIComponent(pathMatch[1]);
        }
      }
      
      // If it's already a path, return as is
      if (!url.startsWith('http')) {
        return url;
      }
      
      return null;
    } catch (error) {
      console.warn('Failed to extract storage path from URL:', url, error);
      return null;
    }
  }

  /**
   * Update progress callback
   */
  private updateProgress(
    stage: AdminDeleteProgress['stage'],
    progress: number,
    message: string
  ): void {
    this.onProgress?.({
      stage,
      progress,
      message
    });
  }
}

export default AdminApplicationService;
