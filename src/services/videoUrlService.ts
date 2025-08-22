/**
 * Video URL Service
 * Handles YouTube and Vimeo URL validation, metadata extraction, and embed URL generation
 */

export interface VideoMetadata {
  isValid: boolean;
  platform: 'youtube' | 'vimeo' | null;
  videoId: string | null;
  title?: string;
  duration?: number;
  thumbnailUrl?: string;
  description?: string;
  error?: string;
}

export class VideoUrlService {
  private static readonly YOUTUBE_REGEX = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  private static readonly VIMEO_REGEX = /(?:vimeo\.com\/)(?:.*\/)?(\d+)/;

  /**
   * Validates and extracts metadata from a video URL
   */
  static async validateAndExtractMetadata(url: string): Promise<VideoMetadata> {
    console.log('🔍 VideoUrlService: Validating URL:', url);
    
    try {
      const platform = this.detectPlatform(url);
      console.log('🎯 VideoUrlService: Detected platform:', platform);
      
      if (!platform) {
        console.log('❌ VideoUrlService: No platform detected');
        return {
          isValid: false,
          platform: null,
          videoId: null,
          error: 'Unsupported video platform. Please use YouTube or Vimeo URLs.'
        };
      }

      const videoId = this.extractVideoId(url, platform);
      console.log('🆔 VideoUrlService: Extracted video ID:', videoId);
      
      if (!videoId) {
        console.log('❌ VideoUrlService: No video ID extracted');
        return {
          isValid: false,
          platform,
          videoId: null,
          error: `Invalid ${platform} URL format.`
        };
      }

      // For now, we'll do basic validation without API calls
      // In a production environment, you might want to call the respective APIs
      // to verify the video exists and is accessible
      
      const result = {
        isValid: true,
        platform,
        videoId,
        title: 'Video Title', // Would be fetched from API
        thumbnailUrl: this.getThumbnailUrl(platform, videoId)
      };
      
      console.log('✅ VideoUrlService: Validation successful:', result);
      return result;

    } catch (error) {
      console.error('❌ VideoUrlService: Validation error:', error);
      return {
        isValid: false,
        platform: null,
        videoId: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Detects the video platform from URL
   */
  static detectPlatform(url: string): 'youtube' | 'vimeo' | null {
    if (this.YOUTUBE_REGEX.test(url)) {
      return 'youtube';
    }
    if (this.VIMEO_REGEX.test(url)) {
      return 'vimeo';
    }
    return null;
  }

  /**
   * Extracts video ID from URL
   */
  static extractVideoId(url: string, platform: 'youtube' | 'vimeo'): string | null {
    if (platform === 'youtube') {
      const match = url.match(this.YOUTUBE_REGEX);
      return match ? match[1] : null;
    }
    
    if (platform === 'vimeo') {
      const match = url.match(this.VIMEO_REGEX);
      return match ? match[1] : null;
    }
    
    return null;
  }

  /**
   * Generates embed URL for iframe
   */
  static getEmbedUrl(platform: 'youtube' | 'vimeo', videoId: string): string {
    if (platform === 'youtube') {
      return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;
    }
    
    if (platform === 'vimeo') {
      return `https://player.vimeo.com/video/${videoId}?title=0&byline=0&portrait=0`;
    }
    
    return '';
  }

  /**
   * Gets thumbnail URL
   */
  static getThumbnailUrl(platform: 'youtube' | 'vimeo', videoId: string): string {
    if (platform === 'youtube') {
      return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    }
    
    if (platform === 'vimeo') {
      // Vimeo thumbnails require API call, return placeholder for now
      return `https://vumbnail.com/${videoId}.jpg`;
    }
    
    return '';
  }

  /**
   * Validates URL format without API calls
   */
  static isValidUrlFormat(url: string, platform: 'youtube' | 'vimeo'): boolean {
    const videoId = this.extractVideoId(url, platform);
    return videoId !== null;
  }

  /**
   * Gets platform icon emoji
   */
  static getPlatformIcon(platform: 'youtube' | 'vimeo'): string {
    return platform === 'youtube' ? '📺' : '🎬';
  }

  /**
   * Gets platform display name
   */
  static getPlatformName(platform: 'youtube' | 'vimeo', language: 'en' | 'th' = 'en'): string {
    if (platform === 'youtube') {
      return 'YouTube';
    }
    if (platform === 'vimeo') {
      return 'Vimeo';
    }
    return '';
  }

  /**
   * Validates video accessibility (basic check)
   */
  static async checkVideoAccessibility(url: string): Promise<{ accessible: boolean; error?: string }> {
    try {
      // Basic check - in production, you might want to use oEmbed APIs
      const metadata = await this.validateAndExtractMetadata(url);
      
      if (!metadata.isValid) {
        return {
          accessible: false,
          error: metadata.error
        };
      }

      // For now, assume all valid URLs are accessible
      // In production, you would make API calls to verify
      return {
        accessible: true
      };

    } catch (error) {
      return {
        accessible: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Generates video preview data for admin display
   */
  static generatePreviewData(platform: 'youtube' | 'vimeo', videoId: string, url: string) {
    return {
      platform,
      videoId,
      url,
      embedUrl: this.getEmbedUrl(platform, videoId),
      thumbnailUrl: this.getThumbnailUrl(platform, videoId),
      platformIcon: this.getPlatformIcon(platform),
      platformName: this.getPlatformName(platform)
    };
  }
}

export default VideoUrlService;
