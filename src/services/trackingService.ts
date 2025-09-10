import { registrationService } from './registrationService';
import { activitiesService } from './activitiesService';
import {
  ActivityRegistration,
  TrackingResult,
  RegistrationEmailData,
  QRCodeData
} from '../types/registration.types';
import { Activity } from '../types/activities';

export class TrackingService {
  private static instance: TrackingService;

  static getInstance(): TrackingService {
    if (!TrackingService.instance) {
      TrackingService.instance = new TrackingService();
    }
    return TrackingService.instance;
  }

  /**
   * Create a unique tracking code
   */
  async createTrackingCode(): Promise<string> {
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const code = this.generateTrackingCode();
      
      // Check if code already exists
      const existing = await registrationService.getRegistrationByTrackingCode(code);
      if (!existing) {
        return code;
      }
      
      attempts++;
    }

    // If we can't generate a unique code after max attempts, use timestamp
    return this.generateTrackingCodeWithTimestamp();
  }

  /**
   * Get registration details by tracking code
   */
  async getRegistrationByTrackingCode(trackingCode: string): Promise<TrackingResult> {
    try {
      console.log('🔍 Tracking registration with code:', trackingCode);

      if (!trackingCode || trackingCode.trim().length === 0) {
        return {
          found: false,
          error: 'Please enter a tracking code'
        };
      }

      const normalizedCode = trackingCode.trim().toUpperCase();
      
      // Get registration by tracking code
      const registration = await registrationService.getRegistrationByTrackingCode(normalizedCode);
      
      if (!registration) {
        return {
          found: false,
          error: 'No registration found with this tracking code'
        };
      }

      // Find the activity this registration belongs to
      const activity = await this.findActivityForRegistration(registration);
      
      if (!activity) {
        return {
          found: false,
          error: 'Activity information not found'
        };
      }

      console.log('✅ Registration found:', { 
        trackingCode: normalizedCode, 
        participantName: registration.participantName,
        activityName: activity.name 
      });

      return {
        found: true,
        registration,
        activity: {
          id: activity.id,
          name: activity.name,
          eventDate: activity.eventDate,
          startTime: activity.startTime,
          endTime: activity.endTime,
          venueName: activity.venueName,
          venueLocation: activity.venueLocation
        }
      };

    } catch (error) {
      console.error('❌ Error tracking registration:', error);
      return {
        found: false,
        error: 'An error occurred while searching. Please try again.'
      };
    }
  }

  /**
   * Get all registrations for an email address
   */
  async getRegistrationsByEmail(email: string): Promise<TrackingResult[]> {
    try {
      console.log('🔍 Tracking registrations for email:', email);

      if (!email || email.trim().length === 0) {
        return [];
      }

      const normalizedEmail = email.trim().toLowerCase();
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(normalizedEmail)) {
        return [{
          found: false,
          error: 'Please enter a valid email address'
        }];
      }

      // Get all registrations for this email
      const registrations = await registrationService.getRegistrationsByEmail(normalizedEmail);
      
      if (registrations.length === 0) {
        return [{
          found: false,
          error: 'No registrations found for this email address'
        }];
      }

      // Get activity details for each registration
      const results: TrackingResult[] = [];
      
      for (const registration of registrations) {
        const activity = await this.findActivityForRegistration(registration);
        
        if (activity) {
          results.push({
            found: true,
            registration,
            activity: {
              id: activity.id,
              name: activity.name,
              eventDate: activity.eventDate,
              startTime: activity.startTime,
              endTime: activity.endTime,
              venueName: activity.venueName,
              venueLocation: activity.venueLocation
            }
          });
        }
      }

      console.log('✅ Found registrations for email:', { 
        email: normalizedEmail, 
        count: results.length 
      });

      return results;

    } catch (error) {
      console.error('❌ Error tracking registrations by email:', error);
      return [{
        found: false,
        error: 'An error occurred while searching. Please try again.'
      }];
    }
  }

  /**
   * Send confirmation email to participant
   */
  async sendConfirmationEmail(registration: ActivityRegistration, activity: Activity): Promise<void> {
    try {
      console.log('📧 Preparing confirmation email for:', registration.email);

      const emailData: RegistrationEmailData = {
        participantName: registration.participantName,
        activityName: activity.name,
        eventDate: activity.eventDate,
        startTime: activity.startTime,
        endTime: activity.endTime,
        venueName: activity.venueName,
        venueLocation: activity.venueLocation,
        trackingCode: registration.trackingCode,
        registrationId: registration.id
      };

      // This would integrate with your email service (SendGrid, AWS SES, etc.)
      await this.sendEmail('confirmation', registration.email, emailData);

      console.log('✅ Confirmation email sent successfully');
    } catch (error) {
      console.error('❌ Error sending confirmation email:', error);
      throw new Error('Failed to send confirmation email');
    }
  }

  /**
   * Send status update email to participant
   */
  async sendStatusUpdateEmail(registration: ActivityRegistration, activity: Activity): Promise<void> {
    try {
      console.log('📧 Preparing status update email for:', registration.email);

      const emailData: RegistrationEmailData = {
        participantName: registration.participantName,
        activityName: activity.name,
        eventDate: activity.eventDate,
        startTime: activity.startTime,
        endTime: activity.endTime,
        venueName: activity.venueName,
        venueLocation: activity.venueLocation,
        trackingCode: registration.trackingCode,
        registrationId: registration.id
      };

      // This would integrate with your email service
      await this.sendEmail('status_update', registration.email, emailData);

      console.log('✅ Status update email sent successfully');
    } catch (error) {
      console.error('❌ Error sending status update email:', error);
      throw new Error('Failed to send status update email');
    }
  }

  /**
   * Generate QR code for registration
   */
  async generateQRCode(registration: ActivityRegistration, activityId: string): Promise<string> {
    try {
      console.log('🔲 Generating QR code for registration:', registration.id);

      const qrData: QRCodeData = {
        registrationId: registration.id,
        trackingCode: registration.trackingCode,
        activityId,
        participantName: registration.participantName,
        email: registration.email
      };

      // Create QR code data string
      const qrString = JSON.stringify(qrData);
      
      // This would use a QR code library like qrcode
      // For now, return a data URL placeholder
      const qrCodeDataUrl = await this.createQRCodeDataUrl(qrString);

      console.log('✅ QR code generated successfully');
      return qrCodeDataUrl;
    } catch (error) {
      console.error('❌ Error generating QR code:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  /**
   * Validate tracking code format
   */
  validateTrackingCode(code: string): boolean {
    if (!code || typeof code !== 'string') {
      return false;
    }

    const normalizedCode = code.trim().toUpperCase();
    
    // Check format: 8 characters, alphanumeric
    const trackingCodeRegex = /^[A-Z0-9]{8}$/;
    return trackingCodeRegex.test(normalizedCode);
  }

  /**
   * Get registration status display info
   */
  getStatusDisplayInfo(status: string, language: 'en' | 'th' = 'en') {
    const statusInfo = {
      registered: {
        en: { label: 'Registered', color: 'blue', description: 'Your registration is confirmed' },
        th: { label: 'ลงทะเบียนแล้ว', color: 'blue', description: 'การลงทะเบียนของคุณได้รับการยืนยันแล้ว' }
      },
      attended: {
        en: { label: 'Attended', color: 'green', description: 'You have attended the event' },
        th: { label: 'เข้าร่วมแล้ว', color: 'green', description: 'คุณได้เข้าร่วมงานแล้ว' }
      },
      absent: {
        en: { label: 'Absent', color: 'red', description: 'You did not attend the event' },
        th: { label: 'ไม่เข้าร่วม', color: 'red', description: 'คุณไม่ได้เข้าร่วมงาน' }
      }
    };

    return statusInfo[status as keyof typeof statusInfo]?.[language] || statusInfo.registered[language];
  }

  /**
   * Format event date and time for display
   */
  formatEventDateTime(eventDate: string, startTime: string, endTime: string, language: 'en' | 'th' = 'en'): string {
    try {
      const date = new Date(eventDate);
      const dateOptions: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      };

      const locale = language === 'th' ? 'th-TH' : 'en-US';
      const formattedDate = date.toLocaleDateString(locale, dateOptions);
      
      return `${formattedDate}, ${startTime} - ${endTime}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return `${eventDate}, ${startTime} - ${endTime}`;
    }
  }

  /**
   * Check if registration is still editable
   */
  isRegistrationEditable(registration: ActivityRegistration, activity: Activity): boolean {
    // Registration is editable if:
    // 1. Status is 'registered' (not attended or absent)
    // 2. Event hasn't started yet
    // 3. Registration deadline hasn't passed

    if (registration.status !== 'registered') {
      return false;
    }

    const now = new Date();
    const eventDate = new Date(activity.eventDate);
    const registrationDeadline = new Date(activity.registrationDeadline);

    return now < eventDate && now < registrationDeadline;
  }

  /**
   * Private helper methods
   */
  private generateTrackingCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private generateTrackingCodeWithTimestamp(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 4).toUpperCase();
    return (timestamp + random).substring(0, 8).padEnd(8, '0');
  }

  private async findActivityForRegistration(registration: ActivityRegistration): Promise<Activity | null> {
    try {
      // This is a simplified approach - in a real implementation, you might want to
      // store the activityId in the registration document for better performance
      
      // For now, we'll search through activities to find the one containing this registration
      // This could be optimized by storing activityId in registration or using a different approach
      
      console.log('🔍 Finding activity for registration:', registration.id);
      
      // Get all activities and search for the one containing this registration
      const activitiesResponse = await activitiesService.getActivities(undefined, undefined, 1, 1000);
      
      for (const activity of activitiesResponse.activities) {
        try {
          const registrations = await registrationService.getActivityRegistrations(activity.id);
          const found = registrations.registrations.find(reg => reg.id === registration.id);
          if (found) {
            return activity;
          }
        } catch (error) {
          // Continue searching other activities
          console.warn('Error searching activity:', activity.id, error);
        }
      }

      return null;
    } catch (error) {
      console.error('❌ Error finding activity for registration:', error);
      return null;
    }
  }

  private async sendEmail(
    template: 'confirmation' | 'status_update',
    email: string,
    data: RegistrationEmailData
  ): Promise<void> {
    // This would integrate with your email service
    // For now, just log the email that would be sent
    console.log(`📧 [${template.toUpperCase()}] Email to ${email}:`, {
      subject: template === 'confirmation' 
        ? `Registration Confirmation - ${data.activityName}`
        : `Status Update - ${data.activityName}`,
      data
    });

    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  private async createQRCodeDataUrl(data: string): Promise<string> {
    // This would use a QR code library like 'qrcode'
    // For now, return a placeholder data URL
    
    // Example implementation with qrcode library:
    // import QRCode from 'qrcode';
    // return await QRCode.toDataURL(data);
    
    // Placeholder implementation
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 200;
    canvas.height = 200;
    
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 200, 200);
      ctx.fillStyle = '#000000';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('QR Code', 100, 90);
      ctx.fillText('Placeholder', 100, 110);
    }
    
    return canvas.toDataURL();
  }
}

// Export singleton instance
export const trackingService = TrackingService.getInstance();
export default trackingService;
