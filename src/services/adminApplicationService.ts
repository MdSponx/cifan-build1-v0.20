import { doc, getDoc, deleteDoc, collection, getDocs, writeBatch, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { deleteFile } from './fileUploadService';
import { AdminApplicationData } from '../types/admin.types';

export interface AdminDeleteProgress {
  stage: 'validating' | 'deleting-files' | 'deleting-comments' | 'deleting-application' | 'complete' | 'error';
  progress: number;
  message: string;
}

export interface AdminStatusChangeOptions {
  adminId: string;
  adminName: string;
  reason?: string;
  bypassValidation?: boolean;
  notifyUser?: boolean;
}

export interface ValidationBypassResult {
  canProceed: boolean;
  missingFields: string[];
  warnings: string[];
  requiresConfirmation: boolean;
}

export interface StatusChangeAuditLog {
  applicationId: string;
  adminId: string;
  adminName: string;
  oldStatus: string;
  newStatus: string;
  reason?: string;
  bypassedValidation: boolean;
  missingFields: string[];
  timestamp: Date;
  ipAddress?: string;
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
   * Check if user can change application status with validation bypass (admin or editor)
   */
  canBypassValidation(userRole: string | undefined): boolean {
    return userRole === 'admin' || userRole === 'super-admin' || userRole === 'editor';
  }

  /**
   * Validate application for admin status change (lighter validation)
   */
  validateForAdminStatusChange(application: AdminApplicationData): ValidationBypassResult {
    const missingFields: string[] = [];
    const warnings: string[] = [];

    // Critical fields that should always be present
    if (!application.filmTitle?.trim()) {
      missingFields.push('Film title');
    }

    if (!application.competitionCategory) {
      missingFields.push('Competition category');
    }

    // Warning fields (not blocking but should be noted)
    if (!application.synopsis?.trim()) {
      warnings.push('Synopsis is missing');
    }

    if (!application.genres || application.genres.length === 0) {
      warnings.push('No genres selected');
    }

    if (!application.duration || application.duration <= 0) {
      warnings.push('Duration not specified');
    }

    if (!application.files?.filmFile?.url) {
      warnings.push('Film file is missing');
    }

    if (!application.files?.posterFile?.url) {
      warnings.push('Poster file is missing');
    }

    // Can proceed if only critical fields are missing and user has bypass permission
    const canProceed = missingFields.length === 0;
    const requiresConfirmation = warnings.length > 0;

    return {
      canProceed,
      missingFields,
      warnings,
      requiresConfirmation
    };
  }

  /**
   * Change application status with admin privileges (can bypass validation)
   */
  async changeApplicationStatus(
    applicationId: string,
    newStatus: AdminApplicationData['status'],
    options: AdminStatusChangeOptions
  ): Promise<void> {
    try {
      // Get current application data
      const docRef = doc(db, 'submissions', applicationId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error('Application not found');
      }

      const application = { id: docSnap.id, ...docSnap.data() } as AdminApplicationData;
      const oldStatus = application.status || 'draft';

      // Note: Permission checking should be done at the UI level
      // This service method assumes the caller has already verified permissions

      // Perform validation check
      const validationResult = this.validateForAdminStatusChange(application);
      
      // If there are critical missing fields and bypass is not explicitly requested, throw error
      if (!validationResult.canProceed && !options.bypassValidation) {
        throw new Error(`Cannot change status due to missing critical fields: ${validationResult.missingFields.join(', ')}`);
      }

      // Update application status
      const updateData: any = {
        status: newStatus,
        lastReviewedAt: serverTimestamp(),
        lastModified: serverTimestamp()
      };

      // Add admin notes if reason is provided
      if (options.reason) {
        updateData.adminStatusChangeReason = options.reason;
        updateData.lastStatusChangeBy = options.adminName;
        updateData.lastStatusChangeAt = serverTimestamp();
      }

      await updateDoc(docRef, updateData);

      // Log the status change for audit trail
      await this.logStatusChange({
        applicationId,
        adminId: options.adminId,
        adminName: options.adminName,
        oldStatus,
        newStatus,
        reason: options.reason,
        bypassedValidation: !validationResult.canProceed || validationResult.warnings.length > 0,
        missingFields: [...validationResult.missingFields, ...validationResult.warnings],
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Error changing application status:', error);
      throw error;
    }
  }

  /**
   * Log status change for audit trail
   */
  private async logStatusChange(auditLog: StatusChangeAuditLog): Promise<void> {
    try {
      const auditRef = collection(db, 'auditLogs', 'statusChanges', 'logs');
      await writeBatch(db).set(doc(auditRef), {
        ...auditLog,
        timestamp: serverTimestamp()
      }).commit();
    } catch (error) {
      console.warn('Failed to log status change:', error);
      // Don't throw error for audit logging failure
    }
  }

  /**
   * Get validation status for an application (for UI display)
   */
  async getApplicationValidationStatus(applicationId: string): Promise<ValidationBypassResult> {
    try {
      const docRef = doc(db, 'submissions', applicationId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error('Application not found');
      }

      const application = { id: docSnap.id, ...docSnap.data() } as AdminApplicationData;
      return this.validateForAdminStatusChange(application);
    } catch (error) {
      console.error('Error getting validation status:', error);
      throw error;
    }
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
