# Palier 3 - Developer Reference

Quick technical reference for implementing and maintaining Palier 3 features.

---

## Architecture

### Data Flow

```
User logs sets
    ↓
Database updated (sets table)
    ↓
Server fetches via getWeeklyTrainingMetrics()
    ↓
Calculate warnings via calculateTrainingWarnings()
    ↓
Render WarningCard + TrainingMetricCard components
    ↓
User sees warnings + metrics
```

---

## Key Functions

### `getWeeklyTrainingMetrics(userId: string)`

**Location**: `src/lib/supabase/insights.ts:getWeeklyTrainingMetrics()`

**Purpose**: Aggregate weekly metrics and calculate warnings

**Parameters**:
- `userId`: string (user's Supabase ID)

**Returns**:
```typescript
{
  currentWeek: WeeklyMetrics | null
  previousWeeks: WeeklyMetrics[]
  warnings: TrainingWarning[]
  rampPercentage: number
  hardSetsDelta: number
}
```

**Implementation Details**:
1. Fetches last 60 days of sets for user
2. Groups by ISO week (year-week format)
3. Calculates 8 metrics per week
4. Calls `calculateTrainingWarnings()` with 3-week average
5. Returns ordered weeks with latest first

**Performance**: ~200-500ms for typical data volume

---

### `calculateTrainingWarnings()`

**Location**: `src/lib/supabase/insights.ts:calculateTrainingWarnings()`

**Purpose**: Detect training overload conditions

**Parameters**:
```typescript
currentWeek: WeeklyMetrics
previousWeeks: WeeklyMetrics[]
```

**Returns**:
```typescript
TrainingWarning[]
```

**Warning Types**:

1. **Rapid Ramp**
   - Condition: `currentScore > avg(3 weeks) × 1.25`
   - Level: orange
   - Example: 7,333 avg → 9,167+ triggers warning

2. **Hard Overload**
   - Condition: `currentHard > avg(3 weeks) × 1.3`
   - Level: red
   - Example: 5 avg → 6.5+ sets triggers warning

3. **Too Many Max Efforts**
   - Condition: `hardRatio > 0.45`
   - Level: orange
   - Example: 9+ hard sets in 20 total = 45% = threshold

---

## Interfaces

### `WeeklyMetrics`

```typescript
interface WeeklyMetrics {
  week_key: string           // "2024-W01"
  year: number               // 2024
  week_number: number        // 1-52
  total_sets: number         // All sets
  hard_sets: number          // RPE ≥ 8
  hold_seconds_planche: number
  hold_seconds_front: number
  dynamic_reps_planche: number
  dynamic_reps_front: number
  global_score: number       // Weighted total
  hard_ratio: number         // 0.0-1.0
}
```

### `TrainingWarning`

```typescript
interface TrainingWarning {
  type: 'rapid_ramp' | 'hard_overload' | 'too_many_max_efforts'
  level: 'orange' | 'red'
  message: string             // Short title
  explanation: string         // Full description
  threshold: number          // The limit (e.g., 9,167 pts)
  current_value: number      // Your current value
}
```

---

## Database Queries

### Sets Fetched for Metrics

```sql
SELECT * FROM sets 
WHERE user_id = $1 
AND performed_at >= NOW() - INTERVAL '60 days'
ORDER BY performed_at DESC
```

**Fields Used**:
- `rpe` (integer, 1-10) → for hard_sets count
- `movement` (enum) → identifies hold vs dynamic
- `seconds` (integer) → aggregated for hold_seconds
- `reps` (integer) → aggregated for dynamic_reps
- `assistance_kg` (decimal) → for global_score calc
- `added_weight_kg` (decimal) → for global_score calc
- `performed_at` (timestamp) → for week grouping
- `skill` (enum: planche/front) → for breakdown

### Global Score Calculation

```
For each set:
  effectiveLoad = bodyweight_kg - assistance_kg + added_weight_kg
  
  if movement is 'hold' or 'negative':
    score = seconds × effectiveLoad
  else (dynamic):
    score = reps × effectiveLoad

Weekly total = SUM(all scores)
```

**Bodyweight Fetch**:
```sql
SELECT bodyweight_kg FROM user_preferences WHERE user_id = $1
```

---

## Component Usage

### `<WarningCard>`

**Props**:
```typescript
warning: TrainingWarning
```

**Example**:
```tsx
<WarningCard 
  warning={{
    type: 'hard_overload',
    level: 'red',
    message: 'Hard sets overload',
    explanation: 'Too many max-effort sets this week...',
    threshold: 6.5,
    current_value: 7
  }}
/>
```

**Rendering**:
- Red left border (red) or orange left border (orange)
- Title, description, threshold comparison
- Recommendations shown in explanation

---

### `<TrainingMetricCard>`

**Props**:
```typescript
title: string
value: number | string
unit?: string
delta?: number           // Percentage change
trend?: 'up' | 'down' | 'neutral'
secondary?: {
  label: string
  value: string | number
}
```

**Example**:
```tsx
<TrainingMetricCard
  title="Global Score"
  value={8500}
  unit="pts"
  delta={15}
  trend="up"
  secondary={{
    label: "vs avg",
    value: "+1,200 pts"
  }}
/>
```

**Rendering**:
- Large value with unit
- Delta % with trend arrow (↑↓→)
- Secondary metric below

---

## Page Integration

### Insights Page Data Fetch

**Location**: `src/app/app/insights/page.tsx`

**Flow**:
```typescript
const [
  kpiMetrics,
  globalScoreData,
  hardSetsData,
  trainingStats,
  ...bestOfDayDataArray
] = await Promise.all([
  getAllKPIMetrics(userId),
  getGlobalScoreData(userId),
  getHardSetsPerWeek(userId),
  getWeeklyTrainingMetrics(userId),  // ← Palier 3
  ...getBestOfDayCharts(userId)
]);
```

**Rendering**:
1. KPI Cards (Palier 2)
2. Charts (Palier 2)
3. **Warnings Section** (Palier 3)
   - Conditional: only if `trainingStats.warnings.length > 0`
   - Maps warnings to `<WarningCard>` components
4. **This Week Summary** (Palier 3)
   - 4-column grid
   - GlobalScore, HardSets, PlancheLoad, FrontLoad cards
   - Each uses `<TrainingMetricCard>`

---

## Threshold Configuration

Current thresholds are hardcoded in `calculateTrainingWarnings()`:

```typescript
// Modify these for different sensitivity

const RAPID_RAMP_MULTIPLIER = 1.25;      // 25% increase
const HARD_OVERLOAD_MULTIPLIER = 1.3;    // 30% increase
const TOO_MANY_MAX_EFFORTS_RATIO = 0.45;  // 45% of sets
```

**To adjust**:
1. Edit `src/lib/supabase/insights.ts`
2. Search for constants above
3. Change multipliers
4. Test with various data scenarios
5. Update PALIER_3.md documentation

---

## Testing Checklist

### Unit Tests
- [ ] `getWeeklyTrainingMetrics()` with 0 weeks data
- [ ] `getWeeklyTrainingMetrics()` with <3 weeks data
- [ ] `getWeeklyTrainingMetrics()` with 4+ weeks data
- [ ] `calculateTrainingWarnings()` - no warnings triggered
- [ ] `calculateTrainingWarnings()` - each warning type individually
- [ ] Global Score calculation accuracy

### Integration Tests
- [ ] Insights page loads with warnings
- [ ] Warnings disappear when training is safe
- [ ] Delta % calculation correct
- [ ] Warning cards styled properly

### Manual Tests
- [ ] Log sets over 4 weeks, verify rolling average
- [ ] Trigger each warning type individually
- [ ] Verify threshold boundaries (off-by-one edge cases)
- [ ] Check mobile responsiveness
- [ ] Verify no data leaks between users

---

## Performance Optimization

### Current Approach
- Server-side data fetch (one call)
- In-memory calculations
- ~500ms typical latency

### Possible Improvements
- Cache weekly metrics in Supabase
- Pre-calculate warnings as trigger
- Use materialized view for weekly data
- Consider Redis for frequently accessed data

---

## Future Enhancements

### Palier 4 Ideas
- Automated deload recommendations
- Injury risk scoring
- Sleep/recovery integration
- Machine learning prediction

### Settings
- User-configurable thresholds
- Warning tone (strict/normal/relaxed)
- Metric preferences (which to track)
- Custom goal targets

---

## Common Issues & Solutions

### Issue: Warnings always orange/red

**Cause**: Threshold multipliers too low
**Fix**: Increase `RAPID_RAMP_MULTIPLIER` to 1.35+

### Issue: No data showing for new user

**Cause**: <3 weeks of sets logged
**Fix**: Check `if (previousWeeks.length < 3)` → show "building baseline"

### Issue: Delta shows NaN

**Cause**: Division by zero in percentage calc
**Fix**: Add `if (avgScore === 0) delta = 0`

### Issue: Hard ratio wrong calculation

**Cause**: `total_sets === 0`
**Fix**: Return 0 instead of NaN when dividing by zero

---

## File Locations

| Feature | File |
|---------|------|
| Warning logic | `src/lib/supabase/insights.ts` |
| Warning UI | `src/components/insights/warning-card.tsx` |
| Metric UI | `src/components/insights/training-metric-card.tsx` |
| Page | `src/app/app/insights/page.tsx` |
| Types | `src/types/index.ts` |
| Tests | `TESTING.md` (section 5.14) |
| Docs | `PALIER_3.md` |

---

## Deployment Notes

- No database migrations needed (Palier 3 uses existing tables)
- `recharts` dependency required (already in package.json)
- Build time: 3-4 seconds
- No breaking changes to Palier 0-2

---

**Last Updated**: January 11, 2026  
**Status**: Production Ready ✅
