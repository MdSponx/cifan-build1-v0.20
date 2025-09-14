# Film Time Calculation Separation Fix Summary

## Issue Description
The film database rules had an issue where `screeningDate1` calculation was being used for both start and end time 1-2. When there was no `screeningDate2` data, the system was still calculating `startTime2` and `endTime2` using the `timeEstimate` fallback, which resulted in duplicate time calculations for both screening sessions.

## Root Cause
In the `calculateScreeningTimes` function in `src/utils/timeCalculations.ts`, the logic for calculating screening 2 times was:

```typescript
// Calculate times for screening 2
if (screeningDate2 || timeEstimate) {
  const startTime2 = screeningDate2 
    ? extractTimeFromScreeningDate(screeningDate2)
    : mapTimeEstimate(timeEstimate || '');
  
  result.startTime2 = startTime2;
  
  if (duration && duration > 0) {
    result.endTime2 = calculateEndTime(startTime2, duration);
  }
}
```

This meant that even when `screeningDate2` was not provided, the function would still calculate `startTime2` and `endTime2` using the `timeEstimate` fallback, resulting in the same times being used for both screening sessions.

## Solution Implemented
Modified the `calculateScreeningTimes` function to only calculate screening 2 times when `screeningDate2` actually exists:

```typescript
// Calculate times for screening 2 - ONLY if screeningDate2 exists
// Don't use timeEstimate fallback for screening 2 to avoid duplication
if (screeningDate2) {
  const startTime2 = extractTimeFromScreeningDate(screeningDate2);
  
  result.startTime2 = startTime2;
  
  if (duration && duration > 0) {
    result.endTime2 = calculateEndTime(startTime2, duration);
  }
}
```

## Key Changes
1. **Removed timeEstimate fallback for screening 2**: The condition `if (screeningDate2 || timeEstimate)` was changed to `if (screeningDate2)` only
2. **Proper separation of calculations**: Now screening 1 uses `screeningDate1` or falls back to `timeEstimate`, while screening 2 only calculates when `screeningDate2` is provided
3. **Preserved existing behavior for screening 1**: The logic for screening 1 remains unchanged to maintain backward compatibility

## Files Modified
- `src/utils/timeCalculations.ts` - Updated the `calculateScreeningTimes` function
- `src/components/admin/FeatureFilmForm.tsx` - Updated form logic and UI to properly handle screening 2 times

## Impact
- **Screening 1**: Still calculates `startTime1` and `endTime1` from `screeningDate1` or falls back to `timeEstimate`
- **Screening 2**: Only calculates `startTime2` and `endTime2` when `screeningDate2` is actually provided
- **No screeningDate2**: When `screeningDate2` is not provided, `startTime2` and `endTime2` will be `undefined`, preventing duplicate calculations
- **Form UI**: Start Time 2 and End Time 2 fields are now conditionally hidden when there's no `screeningDate2`

## Usage
The function is used in:
- `src/services/featureFilmService.ts` in the `addCalculatedTimeFields` function
- `src/components/admin/FeatureFilmForm.tsx` in the `startTime2` and `endTime2` useMemo calculations
- This ensures all film data processed through the service and displayed in the form will have properly separated time calculations

## Testing Scenarios
1. **Only screeningDate1 provided**: Should calculate startTime1/endTime1, leave startTime2/endTime2 undefined
2. **Both screeningDate1 and screeningDate2 provided**: Should calculate separate times for both screenings
3. **Only timeEstimate provided**: Should calculate startTime1/endTime1 from timeEstimate, leave startTime2/endTime2 undefined
4. **screeningDate1 and timeEstimate provided**: Should use screeningDate1 for screening 1, ignore timeEstimate for screening 2

## Backward Compatibility
This change maintains backward compatibility while fixing the duplication issue. Existing films with only one screening date will continue to work correctly, and films with two screening dates will now have properly separated calculations.
