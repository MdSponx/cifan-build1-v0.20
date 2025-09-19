import { Venue, VenueCollection } from '../types/venue.types';

export const FESTIVAL_VENUES: VenueCollection = {
  stageZone: {
    id: '1',
    code: 'stageZone',
    nameEn: 'Stage Zone',
    nameTh: 'โซนเวที',
    fullLocationEn: 'Railway Park CIFAN Pavilion : Stage Zone',
    fullLocationTh: 'สวนสาธารณะรถไฟ ศาลาซีแฟน : โซนเวที',
    notes: 'Primary venue for main events and ceremonies',
    locationUrl: 'https://maps.app.goo.gl/cxMLzFkjeu9fqX4t7'
  },
  expoZone: {
    id: '2',
    code: 'expoZone',
    nameEn: 'EXPO Zone',
    nameTh: 'โซนเอ็กซ์โป',
    fullLocationEn: 'Railway Park CIFAN Pavilion : EXPO Zone',
    fullLocationTh: 'สวนสาธารณะรถไฟ ศาลาซีแฟน : โซนเอ็กซ์โป',
    notes: 'Exhibition and workshop space',
    locationUrl: 'https://maps.app.goo.gl/cxMLzFkjeu9fqX4t8'
  },
  majorTheatre7: {
    id: '3',
    code: 'majorTheatre7',
    nameEn: 'Major Theatre 7',
    nameTh: 'เมเจอร์ โรง 7',
    fullLocationEn: 'Major Theatre 7',
    fullLocationTh: 'เมเจอร์ โรง 7',
    notes: 'Commercial cinema venue',
    locationUrl: 'https://maps.app.goo.gl/fzULD32UgoeKK6B16'
  },
  majorImax: {
    id: '4',
    code: 'majorImax',
    nameEn: 'Major IMAX',
    nameTh: 'เมเจอร์ IMAX',
    fullLocationEn: 'Major IMAX',
    fullLocationTh: 'เมเจอร์ IMAX',
    notes: 'Premium cinema experience',
    locationUrl: 'https://maps.app.goo.gl/fzULD32UgoeKK6B16'
  },
  market: {
    id: '5',
    code: 'market',
    nameEn: 'Market',
    nameTh: 'ตลาด',
    fullLocationEn: 'Railway Park CIFAN Market',
    fullLocationTh: 'สวนสาธารณะรถไฟ ตลาดซีแฟน',
    notes: 'Outdoor market area',
    locationUrl: 'https://maps.app.goo.gl/cxMLzFkjeu9fqX4t7'
  },
  anusarn: {
    id: '6',
    code: 'anusarn',
    nameEn: 'Anusarn',
    nameTh: 'อนุสาร',
    fullLocationEn: 'Anusarn Building Sanpakoi',
    fullLocationTh: 'อาคารอนุสารสันป่าข่อย',
    notes: 'Cultural venue space',
    locationUrl: 'https://maps.app.goo.gl/mb3EyMUu7TTDEwJc6'
  }
};

// Array version for easier iteration
export const VENUES_ARRAY: Venue[] = Object.values(FESTIVAL_VENUES);

// Helper functions
export const getVenueByCode = (code: string): Venue | undefined => {
  return FESTIVAL_VENUES[code];
};

export const getVenueById = (id: string): Venue | undefined => {
  return VENUES_ARRAY.find(venue => venue.id === id);
};

export const getVenueDisplayName = (code: string, language: 'en' | 'th' = 'en'): string => {
  const venue = getVenueByCode(code);
  if (!venue) return code;

  return language === 'th' ? venue.nameTh : venue.nameEn;
};

export const getVenueFullLocation = (code: string, language: 'en' | 'th' = 'en'): string => {
  const venue = getVenueByCode(code);
  if (!venue) return '';

  return language === 'th' ? venue.fullLocationTh : venue.fullLocationEn;
};
