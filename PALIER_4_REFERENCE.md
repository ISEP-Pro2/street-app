# PALIER 4 — Developer Implementation Guide

## Architecture Overview

```
User logs sets (over time)
    ↓
28-day data window accumulated
    ↓
getUserAlerts(userId) called
    ↓
Analyze each KPI+assistance combo:
  - Fetch 28 days of performance data
  - Group by day, calculate best per day
  - Compare last 14d vs prev 14d (plateau)
  - Check last 2 sessions (fatigue)
  - Check pain tags + keywords (pain)
    ↓
Return KPIAlert[] sorted by severity
    ↓
UI renders AlertSummary component
    ↓
User sees alerts with recommendations
```

---

## File Structure

```
src/
├── lib/supabase/
│   └── insights.ts
│       ├── analyzeKPIForAlerts() (main detection)
│       ├── getUserAlerts() (coordinator)
│       └── helper functions (format, generate recommendations)
├── types/
│   └── index.ts (KPIAlert, UserAlertSummary interfaces)
├── components/insights/
│   ├── alert-card.tsx (displays single alert)
│   └── alert-summary.tsx (displays all alerts + stats)
└── app/app/insights/
    └── page.tsx (integrates alerts into insights page)

supabase/migrations/
└── 002_palier_4_indexes_views.sql (performance optimization)
```

---

## Core Functions

### `getUserAlerts(userId: string): Promise<UserAlertSummary>`

**Purpose**: Get all active alerts for a user

**Flow**:
1. Get user bodyweight (needed for score calc context)
2. Loop through KPI configs + assistance levels
3. Call `analyzeKPIForAlerts()` for each combination
4. Collect all alerts
5. Sort by severity
6. Return summary with counts and sorted alerts

**Returns**:
```typescript
{
  total_alerts: number
  critical_alerts: number
  warning_alerts: number
  by_type: { pain: number, fatigue: number, plateau: number }
  alerts: KPIAlert[]
}
```

---

### `analyzeKPIForAlerts(client, userId, skill, technique, movement, assistanceType, assistanceKg, bodyweight): Promise<KPIAlert[]>`

**Purpose**: Analyze a single KPI for all alert types

**Process**:

1. **Fetch Data**
   - Last 28 days of sets for this KPI combo
   - Filter by: user_id, skill, technique, movement, assistance_type, assistance_kg
   - Order by performed_at ascending

2. **Group by Date**
   - Create Map<date, PerformancePoint>
   - Per date: best value, avg RPE, form quality
   - Performance value = seconds (for holds/negatives) or reps (for dynamics)

3. **Detect Plateau** (if prev 14d data exists)
   - Last 14 days best vs prev 14 days best
   - If: `last_best ≤ prev_best AND avg_rpe ≥ 8 AND set_count ≥ 6`
   - Alert type: "plateau", level: "warning"

4. **Detect Fatigue** (if 2+ recent sessions exist)
   - Last session best vs previous session best
   - If: `last < prev AND regression ≥ 10% AND avg_rpe_last_2 ≥ 8`
   - Alert type: "fatigue", level: "critical"

5. **Detect Pain** (query pain_tag in last 7 days)
   - Count sets with pain_tag ≥ 2 → critical alert
   - OR contains sharp/electric/décharge keywords → critical alert

6. **Return**: Array of KPIAlert objects

---

## Data Structures

### `PerformancePoint`
```typescript
{
  date: string              // "2026-01-11"
  value: number             // seconds or reps
  rpe: number               // 1-10
  setCount: number          // count for that day
  formQuality: number       // 0-1 (clean=1, ok=0.5, ugly=0)
}
```

### `KPIAlert`
```typescript
{
  id: string                // "${skill}-${technique}-${movement}-${assistance}"
  type: 'plateau' | 'fatigue' | 'pain'
  level: 'critical' | 'warning' | 'info'
  kpi_name: string          // "Planche Full Hold (no assist)"
  skill: Skill
  technique: Technique
  movement: Movement
  assistance_type: AssistanceType
  assistance_kg?: number
  
  evidence: {
    last_14d_best: number
    prev_14d_best: number
    avg_rpe_14d: number
    set_count_14d: number
    pain_count_7d?: number
    fatigue_indicators?: string[]
  }
  
  recommendation: string    // actionable advice
  explanation: string       // why alert triggered
  created_at: string
}
```

---

## Detection Logic Details

### Plateau Detection

**Condition**:
```
last_14d_best ≤ prev_14d_best
AND avg_rpe_14d ≥ 8
AND set_count_14d ≥ 6
```

**Why this matters**:
- No improvement despite high intensity = adaptation plateau
- RPE check ensures it's not just lazy session
- Set count check ensures meaningful data (not 1-2 outliers)

**Example**:
```
Days 1-14: 30s, 28s, 29s, 31s, 29s, 28s, 30s, 29s, 28s, 27s, 29s, 28s, 28s, 30s
  → best = 31s, avg RPE = 8.2, count = 14 ✓

Days 15-28: 30s, 29s, 28s, 29s, 28s, 27s, 28s, 29s, 28s, 27s, 28s, 29s, 28s, 28s
  → best = 30s, avg RPE = 8.1, count = 14 ✓

30s ≤ 31s? YES → Plateau triggered!
```

---

### Fatigue Detection

**Condition**:
```
last_session_best < prev_session_best
AND (prev_session_best - last_session_best) / prev_session_best ≥ 0.10
AND avg_rpe_last_2_sessions ≥ 8
```

**Why this matters**:
- Performance drop with high effort = CNS fatigue
- 10% threshold avoids noise from single-set variance
- Recent sessions shows acute fatigue (not chronic)

**Example**:
```
Session N-1: 8 reps, RPE 9
Session N:   6 reps, RPE 8
  → drop = 25%, avg_rpe = 8.5 → Fatigue triggered!

vs

Session N-1: 8 reps, RPE 9
Session N:   7 reps, RPE 8
  → drop = 12.5%, avg_rpe = 8.5 → OK, minor variance
```

---

### Pain Detection

**Condition**:
```
(count_pain_sets_last_7d ≥ 2) 
OR 
(pain_tag exists AND contains keyword)
```

**Keywords checked**:
- "sharp"
- "electric"
- "décharge"

**Why this matters**:
- Multiple pain instances = pattern, not anomaly
- Sharp pain keywords = acute injury risk

**Example**:
```
Set 1 (day 1): pain_tag = "elbow" → 1 set, wait
Set 2 (day 3): pain_tag = "elbow" → 2 sets, ALERT!

OR

Set 1 (day 1): pain_tag = "shoulder", notes = "sharp pain in shoulder" → ALERT!
```

---

## UI Components

### `<AlertCard alert={KPIAlert} />`

**Props**:
- `alert: KPIAlert` — single alert to display

**Renders**:
1. Header with icon, KPI name, badge (type + level)
2. Explanation text
3. Evidence section (numbers with labels)
4. Recommendation (actionable advice)

**Styling**:
- Red (critical), Yellow (warning), Blue (info)
- Left border colored per level
- White background with opacity for sections

---

### `<AlertSummary summary={UserAlertSummary} />`

**Props**:
- `summary: UserAlertSummary` — all alerts + counts

**Renders**:
1. If no alerts: "All Clear!" message
2. If alerts exist:
   - Stats grid (total, critical, warning, by type)
   - Alert cards list
   - Guidance based on alert count

**Features**:
- Conditional rendering for no alerts
- Color-coded stat cards
- Type badges showing breakdown
- Severity guidance messages

---

## Integration Points

### In `insights/page.tsx`

```typescript
// Import
import { getUserAlerts } from '@/lib/supabase/insights';
import { AlertSummary } from '@/components/insights/alert-summary';

// Data fetch
const alertSummary = await getUserAlerts(user.id);

// Render
<div>
  <h2>🚨 Training Alerts</h2>
  <AlertSummary summary={alertSummary} />
</div>
```

---

## Performance Optimization

### Database Indexes (Migration 002)

```sql
-- Composite index for KPI lookup
CREATE INDEX idx_sets_kpi_lookup 
  ON sets(user_id, skill, technique, movement, assistance_kg, performed_at DESC);

-- For pain queries
CREATE INDEX idx_sets_user_pain_performed 
  ON sets(user_id, pain_tag, performed_at DESC) WHERE pain_tag IS NOT NULL;

-- For RPE filtering
CREATE INDEX idx_sets_user_rpe_performed 
  ON sets(user_id, rpe, performed_at DESC);
```

### Query Optimization

- **One query per KPI**: `WHERE user_id + skill + technique + movement + assistance`
- **Date range**: Only last 28 days (`performed_at >= NOW() - INTERVAL '28 days'`)
- **Indexed filtering**: user_id always first in WHERE clause
- **Result limit**: Typically 20-50 sets per KPI (not thousands)

### Expected Performance

- **Per KPI analysis**: ~100-200ms (fetch + process + detect)
- **All KPIs**: ~1-2 seconds (8 KPIs × 4 assistance levels = 32 combos)
- **Handles**: 1000+ sets without slowdown
- **Database load**: Minimal (indexed, limited date range)

---

## Configuration & Thresholds

Located in `src/lib/supabase/insights.ts`:

```typescript
// Plateau detection windows
const PLATEAU_DAYS = 14;
const PLATEAU_MIN_SET_COUNT = 6;
const PLATEAU_MIN_RPE = 8;

// Fatigue detection threshold
const FATIGUE_REGRESSION_THRESHOLD = 0.10; // 10% drop
const FATIGUE_MIN_RPE = 8;

// Pain detection
const PAIN_SET_THRESHOLD = 2;
const PAIN_DAYS = 7;
const PAIN_KEYWORDS = ['sharp', 'electric', 'décharge'];
```

**To adjust**: Edit these constants in the function definition

---

## Testing Strategy

### Unit Tests Needed

1. **Plateau Detection**
   - No improvement, high RPE, enough data → alert
   - Small improvement → no alert
   - Low RPE despite plateau → no alert
   - Insufficient data → no alert

2. **Fatigue Detection**
   - Performance drop + high RPE → alert
   - Performance drop + low RPE → no alert
   - Small drop → no alert
   - Only 1 session → no alert

3. **Pain Detection**
   - 2+ pain sets in 7d → alert
   - 1 pain set + sharp keyword → alert
   - 1 pain set, no keyword → no alert

### Integration Tests Needed

1. Load Insights page with mixed data
2. Verify alerts appear in correct order
3. Verify evidence shows correct numbers
4. Verify no duplicate alerts per KPI+assistance
5. Verify severity badges display correctly

### Manual Tests

1. Create test data with known plateau
2. Create test data with fatigue pattern
3. Create test data with pain reports
4. Verify alerts trigger correctly
5. Verify recommendations make sense

---

## Common Issues & Solutions

### Issue: Always No Alerts

**Possible causes**:
- Insufficient data (< 6 sets in last 14 days)
- Recent user (no plateau yet)
- All RPEs below 8 (no high-intensity work)

**Check**:
```sql
SELECT COUNT(*), AVG(rpe) FROM sets 
WHERE user_id = '...' 
AND performed_at >= NOW() - INTERVAL '14 days'
AND skill = 'planche' AND movement = 'hold';
```

### Issue: False Plateau Alert

**Possible causes**:
- One bad session skewing averages
- Fatigue misdiagnosed as plateau

**Check evidence**:
- Verify exact best values
- Check RPE avg
- Confirm set count

### Issue: Missing Pain Alert

**Possible causes**:
- Pain tags not logged
- Keywords misspelled

**Fix**:
- Educate users on pain_tag selection
- Expand PAIN_KEYWORDS if needed

---

## Security & RLS

All queries include `user_id` filtering:

```typescript
const { data: sets } = await client
  .from('sets')
  .select('*')
  .eq('user_id', userId)  // ← RLS enforced here
  .eq('skill', skill)
  // ... more filters
```

**RLS Policy ensures**: Users only see their own alerts

---

## Future Enhancements

### Phase 2
- [ ] Alert history (archived alerts)
- [ ] User-configurable thresholds
- [ ] ML-based plateau prediction

### Phase 3
- [ ] Sleep/recovery integration
- [ ] Injury risk percentage
- [ ] Deload auto-scheduling

---

## Useful SQL Queries (for debugging)

### See last 28 days of a KPI
```sql
SELECT DATE(performed_at), MAX(seconds) as best, AVG(rpe)
FROM sets
WHERE user_id = '...' 
AND skill = 'planche' AND technique = 'full' AND movement = 'hold'
AND assistance_kg = 0
AND performed_at >= NOW() - INTERVAL '28 days'
GROUP BY DATE(performed_at)
ORDER BY performed_at DESC;
```

### Count pain sets
```sql
SELECT DATE(performed_at), pain_tag, COUNT(*)
FROM sets
WHERE user_id = '...'
AND pain_tag IS NOT NULL
AND performed_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(performed_at), pain_tag;
```

### Check RPE distribution
```sql
SELECT rpe, COUNT(*)
FROM sets
WHERE user_id = '...'
AND performed_at >= NOW() - INTERVAL '14 days'
GROUP BY rpe
ORDER BY rpe DESC;
```

---

## Code Examples

### Detect Plateau Manually
```typescript
const last14 = sets.filter(s => daysSince(s) <= 14);
const prev14 = sets.filter(s => daysSince(s) > 14 && daysSince(s) <= 28);

const last14Best = Math.max(...last14.map(s => s.value));
const prev14Best = Math.max(...prev14.map(s => s.value));
const avg_rpe = last14.reduce((sum, s) => sum + s.rpe, 0) / last14.length;

if (last14Best <= prev14Best && avg_rpe >= 8 && last14.length >= 6) {
  // Plateau detected
}
```

### Detect Fatigue Manually
```typescript
const recentDates = [...new Set(sets.map(s => s.date))].sort().slice(-2);
const lastValue = sets.filter(s => s.date === recentDates[1])[0]?.value || 0;
const prevValue = sets.filter(s => s.date === recentDates[0])[0]?.value || 0;

const regression = (prevValue - lastValue) / prevValue;
const avgRpeRecent = ...;

if (lastValue < prevValue && regression >= 0.10 && avgRpeRecent >= 8) {
  // Fatigue detected
}
```

---

**Version**: Palier 4 v1.0  
**Status**: ✅ Production Ready  
**Last Updated**: January 11, 2026
