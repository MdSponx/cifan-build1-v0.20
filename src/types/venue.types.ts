export interface Venue {
  id: string;
  nameEn: string;
  nameTh: string;
  fullLocationEn: string;
  fullLocationTh: string;
  notes: string;
  locationUrl: string;
  code: string; // camelCase code for internal use
}

export interface VenueCollection {
  [key: string]: Venue;
}
