# Festival Schedule Venue Mapping Fix Summary

## Issue Description
The festival schedule was not displaying activities correctly in their respective venue columns. Only the "anusarn" venue was showing activities, while other venues (stageZone, expoZone, majorTheatre7, majorImax, market) appeared empty despite having activities in the database.

## Root Cause Analysis

### 1. **Venue Name Mapping Inconsistency**
- **Database Storage**: Activities are stored with camelCase venue names (`stageZone`, `expoZone`, `majorTheatre7`, etc.)
- **Schedule Grid**: The venue mapping logic was converting camelCase to kebab-case (`stage-zone`, `expo-zone`, etc.)
- **Result**: Venue filtering failed because the mapped venue names didn't match the original database values

### 2. **Grid Column Calculation Error**
- The venue column grid positioning was incorrectly calculated
- Grid columns were not properly aligned with the venue headers

### 3. **Data Verification Results**
From database analysis:
- **Total published activities**: 7 activities across festival dates
- **Venue distribution**: 
  - `stageZone`: 3 activities
  - `expoZone`: 2 activities  
  - `anusarn`: 2 activities
  - `majorTheatre7`, `majorImax`, `market`: 0 activities
- **Date distribution**: Activities spread across Sep 20-26, 2025

## Fixes Implemented

### 1. **Fixed Venue Name Mapping (`src/hooks/useScheduleData.ts`)**
```typescript
// ✅ BEFORE (Incorrect - converting to kebab-case)
const venueMap = {
  'stageZone': 'stage-zone',
  'expoZone': 'expo-zone',
  // ...
};

// ✅ AFTER (Correct - keeping camelCase format)
const venueMap = {
  'stageZone': 'stageZone',
  'expoZone': 'expoZone',
  'majorTheatre7': 'majorTheatre7',
  'majorImax': 'majorImax',
  'market': 'market',
  'anusarn': 'anusarn',
  // Legacy display name mappings
  'Stage Zone': 'stageZone',
  'EXPO Zone': 'expoZone',
  // ...
};
```

### 2. **Updated Schedule Types (`src/types/schedule.types.ts`)**
```typescript
// ✅ Ensured FESTIVAL_VENUES uses correct camelCase names
export const FESTIVAL_VENUES: VenueColumn[] = [
  { name: 'stageZone', displayName: 'Stage Zone', gridColumn: 1, color: '#FF6B6B' },
  { name: 'expoZone', displayName: 'EXPO Zone', gridColumn: 2, color: '#4ECDC4' },
  { name: 'market', displayName: 'Market', gridColumn: 3, color: '#FFEAA7' },
  { name: 'majorTheatre7', displayName: 'Major Theatre 7', gridColumn: 4, color: '#45B7D1' },
  { name: 'majorImax', displayName: 'Major IMAX', gridColumn: 5, color: '#96CEB4' },
  { name: 'anusarn', displayName: 'Anusarn', gridColumn: 6, color: '#DDA0DD' }
];
```

### 3. **Fixed Grid Column Calculation (`src/components/schedule/FestivalScheduleGrid.tsx`)**
```typescript
// ✅ Corrected grid column positioning
return FESTIVAL_VENUES.map((venue, index) => ({
  ...venue,
  color: colors[index % colors.length],
  gridColumn: index + 2 // +2 to account for time column (index 1)
}));
```

### 4. **Added Debug Logging**
- Enhanced console logging to track venue mapping process
- Added venue column calculation debugging
- Created debug scripts to verify database content

## Testing and Verification

### 1. **Database Verification Scripts**
- `debug-schedule-venues.cjs`: Checks activities for specific dates
- `debug-all-activities.cjs`: Analyzes all published activities and venue distribution

### 2. **Expected Results After Fix**
- **September 20, 2025**: 1 activity in stageZone column (opening ceremony)
- **September 21, 2025**: 1 activity in stageZone column (concert)
- **September 23, 2025**: 1 activity in anusarn column (location manager workshop)
- **September 24, 2025**: 1 activity in expoZone column (grip and lighting workshop)
- **September 25, 2025**: 2 activities (1 in expoZone, 1 in anusarn)
- **September 26, 2025**: 1 activity in stageZone column

## Key Changes Made

### Files Modified:
1. **`src/hooks/useScheduleData.ts`**
   - Fixed `mapVenueName` function to preserve camelCase format
   - Updated venue mapping logic to handle both database and legacy formats

2. **`src/types/schedule.types.ts`**
   - Verified FESTIVAL_VENUES configuration uses correct camelCase names
   - Added documentation comments

3. **`src/components/schedule/FestivalScheduleGrid.tsx`**
   - Fixed grid column calculation for venue positioning
   - Added debug logging for venue column mapping
   - Corrected venue filtering logic

### Debug Scripts Created:
1. **`debug-schedule-venues.cjs`** - Analyzes venue names for specific dates
2. **`debug-all-activities.cjs`** - Comprehensive activity and venue analysis

## Validation Steps

1. **Verify Database Content**: Run debug scripts to confirm activity data
2. **Check Console Logs**: Monitor venue mapping and filtering processes
3. **Test Different Dates**: Navigate through festival dates to verify correct display
4. **Verify Column Alignment**: Ensure activities appear in correct venue columns

## Expected Behavior After Fix

- Activities should now appear in their correct venue columns
- September 20, 2025 should show the opening ceremony in the "Stage Zone" column
- Other dates should show activities in their respective venues (stageZone, expoZone, anusarn)
- Empty venues (majorTheatre7, majorImax, market) should remain empty as expected
- Venue filtering and column mapping should work correctly

## Notes

- The issue was primarily caused by venue name format inconsistency between database storage (camelCase) and display logic (kebab-case)
- The fix maintains backward compatibility with legacy venue name formats
- Debug logging has been added to help identify similar issues in the future
- The solution preserves the original database structure while fixing the display logic
