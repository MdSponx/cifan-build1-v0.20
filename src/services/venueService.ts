import { Venue, VenueCollection } from '../types/venue.types';
import { FESTIVAL_VENUES, VENUES_ARRAY, getVenueByCode, getVenueById, getVenueDisplayName, getVenueFullLocation } from '../data/venues';

/**
 * Venue Service - Provides centralized access to venue data and utilities
 */
class VenueService {
  /**
   * Get all venues as a collection object
   */
  getAllVenues(): VenueCollection {
    return FESTIVAL_VENUES;
  }

  /**
   * Get all venues as an array
   */
  getAllVenuesArray(): Venue[] {
    return VENUES_ARRAY;
  }

  /**
   * Get a venue by its code (e.g., 'stageZone')
   */
  getVenueByCode(code: string): Venue | undefined {
    return getVenueByCode(code);
  }

  /**
   * Get a venue by its ID
   */
  getVenueById(id: string): Venue | undefined {
    return getVenueById(id);
  }

  /**
   * Get venue display name in specified language
   */
  getVenueDisplayName(code: string, language: 'en' | 'th' = 'en'): string {
    return getVenueDisplayName(code, language);
  }

  /**
   * Get venue full location in specified language
   */
  getVenueFullLocation(code: string, language: 'en' | 'th' = 'en'): string {
    return getVenueFullLocation(code, language);
  }

  /**
   * Get venue location URL
   */
  getVenueLocationUrl(code: string): string | undefined {
    const venue = this.getVenueByCode(code);
    return venue?.locationUrl;
  }

  /**
   * Get venue notes/description
   */
  getVenueNotes(code: string): string | undefined {
    const venue = this.getVenueByCode(code);
    return venue?.notes;
  }

  /**
   * Check if a venue code exists
   */
  venueExists(code: string): boolean {
    return !!this.getVenueByCode(code);
  }

  /**
   * Get venues for a specific type/category
   */
  getVenuesByType(type?: 'cinema' | 'outdoor' | 'cultural'): Venue[] {
    if (!type) return VENUES_ARRAY;

    const typeMappings = {
      cinema: ['majorTheatre7', 'majorImax'],
      outdoor: ['stageZone', 'expoZone', 'market'],
      cultural: ['anusarn']
    };

    const codes = typeMappings[type] || [];
    return codes.map(code => this.getVenueByCode(code)).filter(Boolean) as Venue[];
  }

  /**
   * Search venues by name or location
   */
  searchVenues(query: string, language: 'en' | 'th' = 'en'): Venue[] {
    const lowerQuery = query.toLowerCase();

    return VENUES_ARRAY.filter(venue => {
      const name = language === 'th' ? venue.nameTh : venue.nameEn;
      const location = language === 'th' ? venue.fullLocationTh : venue.fullLocationEn;

      return name.toLowerCase().includes(lowerQuery) ||
             location.toLowerCase().includes(lowerQuery) ||
             venue.notes.toLowerCase().includes(lowerQuery);
    });
  }

  /**
   * Get venue options for dropdown/select components
   */
  getVenueOptions(language: 'en' | 'th' = 'en'): Array<{ value: string; label: string; location: string }> {
    return VENUES_ARRAY.map(venue => ({
      value: venue.code,
      label: language === 'th' ? venue.nameTh : venue.nameEn,
      location: language === 'th' ? venue.fullLocationTh : venue.fullLocationEn
    }));
  }

  /**
   * Get venue information for schedule display
   */
  getVenueForSchedule(code: string, language: 'en' | 'th' = 'en'): {
    name: string;
    fullLocation: string;
    locationUrl?: string;
    notes?: string;
  } | null {
    const venue = this.getVenueByCode(code);
    if (!venue) return null;

    return {
      name: language === 'th' ? venue.nameTh : venue.nameEn,
      fullLocation: language === 'th' ? venue.fullLocationTh : venue.fullLocationEn,
      locationUrl: venue.locationUrl,
      notes: venue.notes
    };
  }
}

// Export singleton instance
export const venueService = new VenueService();

// Export individual functions for convenience
export {
  getVenueByCode,
  getVenueById,
  getVenueDisplayName,
  getVenueFullLocation
};
