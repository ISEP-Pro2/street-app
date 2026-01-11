# PALIER 5 — COMBO TECHNICAL REFERENCE

## 1. Architecture Overview

### Layers
```
UI (React Components)
    ↓
Server Actions (Next.js)
    ↓
Supabase Client (RLS-filtered)
    ↓
PostgreSQL (combos, combo_items tables)
```

### Data Flow
1. **ComboMode** (client) → collect form data
2. **getOrCreateSessionAction** (server) → ensure session exists
3. **createComboAction** (server) → insert combo + items via Supabase
4. **calculateComboLoad** (utils) → compute scores for display

---

## 2. File Structure

```
src/
├── types/index.ts                           # Combo types
├── lib/
│   ├── utils/combo-calc.ts                 # Scoring utilities
│   └── supabase/
│       ├── combos.ts                        # CRUD operations
│       ├── sessions.ts                      # Session helpers
│       ├── user.ts                          # User prefs
│       └── insights.ts                      # (modified) GlobalScore
├── app/app/
│   └── combo/
│       ├── layout.tsx
│       ├── page.tsx
│       └── actions.ts                       # Server Actions
└── components/
    ├── combo/
    │   ├── combo-mode.tsx                  # Main container
    │   ├── combo-header.tsx                # Header
    │   ├── combo-quick-add.tsx             # Input zone
    │   ├── combo-items-list.tsx            # Items list
    │   ├── combo-item-card.tsx             # Single item display
    │   └── combo-summary.tsx               # Stats footer
    ├── log/
    │   └── log-form.tsx                    # (modified) + Combo button
    └── session/
        ├── session-view.tsx                # (modified) + combos section
        └── session-combos.tsx              # Combo display

supabase/
└── migrations/
    └── 003_combo_schema.sql                # Tables, indexes, RLS
```

---

## 3. Types (src/types/index.ts)

```typescript
// Union types for skill/technique/movement
export type ComboSkill = 'planche' | 'front';
export type ComboTechnique = 
  | 'lean' | 'tuck' | 'adv_tuck' | 'straddle' | 'full' | 'maltese'  // planche
  | 'tuck' | 'adv_tuck' | 'full';  // front
export type ComboMovement = 'hold' | 'press' | 'pushup' | 'pullup' | 'negative';

// Entity types
export interface ComboItem {
  id: string;
  combo_id: string;
  user_id: string;
  order_index: number;
  skill: ComboSkill;
  technique: ComboTechnique;
  movement: ComboMovement;
  seconds?: number;
  reps?: number;
  assistance_kg?: number;
  form_quality?: FormQuality;
  notes?: string;
  created_at: string;
}

export interface Combo {
  id: string;
  user_id: string;
  session_id: string;
  performed_at: string;
  assistance_global_kg: number;
  override_assistance_per_item: boolean;
  rpe_global?: number;
  form_global: FormQuality;
  notes?: string;
  created_at: string;
  updated_at: string;
  items?: ComboItem[];
}

export interface ComboLoadCalculation {
  itemScore: number;
  baseComboScore: number;
  chainFactor: number;
  comboLoadScore: number;
  distinctMovements: number;
  itemCount: number;
}

export interface ComboFormData {
  skill: ComboSkill;
  technique: ComboTechnique;
  movement: ComboMovement;
  seconds?: number;
  reps?: number;
  assistance_kg?: number;
}
```

---

## 4. Utility Functions (src/lib/utils/combo-calc.ts)

### calculateEffectiveLoad
```typescript
function calculateEffectiveLoad(
  bodyweightKg: number,
  assistanceKg: number = 0,
  addedWeightKg: number = 0
): number
```
Returns: `bodyweight - assistance + added_weight`

### calculateItemScore
```typescript
function calculateItemScore(
  item: ComboItem,
  effectiveLoad: number
): number
```
- Hold: `seconds * effectiveLoad`
- Others: `reps * effectiveLoad`

### calculateBaseComboScore
```typescript
function calculateBaseComboScore(
  items: ComboItem[],
  bodyweightKg: number,
  globalAssistanceKg: number,
  overridePerItem: boolean
): number
```
Sums all item scores with proper assistance handling.

### calculateChainFactor
```typescript
function calculateChainFactor(
  itemCount: number,
  distinctMovements: number
): number
```
Formula: `1 + 0.07*(n-1) + 0.05*(distinctMovements-1)`, clamped to [1.0, 2.0]

### calculateComboLoadScore
```typescript
function calculateComboLoadScore(
  baseComboScore: number,
  chainFactor: number
): number
```
Returns: `baseComboScore * chainFactor`

### calculateComboLoad
```typescript
function calculateComboLoad(
  items: ComboItem[],
  bodyweightKg: number,
  globalAssistanceKg: number,
  overridePerItem: boolean
): ComboLoadCalculation
```
Full breakdown of all scoring components.

### Other Utilities
- `formatComboType(items)` → "PLANCHE" | "FRONT" | "MIX"
- `getAllowedTechniques(skill)` → string[]
- `getAllowedMovements(skill)` → string[]
- `validateComboItem(movement, seconds?, reps?)` → { valid, error? }

---

## 5. Supabase Operations

### combos.ts

```typescript
// CRUD operations for combos
export async function getCombosBySession(sessionId: string): Promise<Combo[]>
export async function getComboItems(comboId: string): Promise<ComboItem[]>
export async function getComboDetail(comboId: string): Promise<Combo | null>
export async function createCombo(...): Promise<Combo | null>
export async function updateCombo(comboId, updates): Promise<Combo | null>
export async function deleteCombo(comboId: string): Promise<boolean>
export async function getSessionComboIds(sessionId: string): Promise<string[]>
```

**Note**: These are client functions for app-side operations. Server actions should be used from `/app/app/combo/actions.ts` instead.

### sessions.ts

```typescript
export async function getOrCreateTodaySession(): Promise<Session | null>
export async function getSessionByDate(date: string): Promise<Session | null>
export async function getSessionsByDateRange(fromDate, toDate): Promise<Session[]>
```

### user.ts

```typescript
export async function getUserPreferences(): Promise<UserPreferences | null>
export async function updateUserPreferences(updates): Promise<UserPreferences | null>
export async function getCurrentUserId(): Promise<string | null>
```

### insights.ts (modified)

**Updated function**: `getGlobalScoreData(userId: string)`
- Now fetches both sets AND combos (60-day window)
- Calculates set scores as before
- Fetches combo items and calculates their loads
- Aggregates by ISO week
- Returns combined scores

```typescript
export async function getGlobalScoreData(userId: string) {
  // Get bodyweight
  // Fetch sets (60d)
  // Fetch combos (60d)
  // Calculate set scores
  // Calculate combo loads
  // Aggregate by week
  // Return [{ week, score }, ...]
}
```

---

## 6. Server Actions (src/app/app/combo/actions.ts)

### createComboAction
```typescript
export async function createComboAction(
  sessionId: string,
  assistanceGlobalKg: number,
  overrideAssistancePerItem: boolean,
  rpeGlobal: number | undefined,
  formGlobal: string,
  items: Array<{...}>,
  notes?: string
): Promise<{ success: boolean; comboId?: string; error?: string }>
```

**Steps**:
1. Get current user from auth
2. Insert combo row
3. Insert combo_items rows (with order_index)
4. Return success + comboId

### getOrCreateSessionAction
```typescript
export async function getOrCreateSessionAction()
  : Promise<{ sessionId?: string; sessionDate?: string; error?: string }>
```

Gets today's session or creates new one.

### getUserPreferencesAction
```typescript
export async function getUserPreferencesAction()
  : Promise<{ bodyweight?: number; error?: string }>
```

Gets user bodyweight (default 75).

---

## 7. Components

### ComboMode (combo-mode.tsx)
**Main container** - orchestrates all sub-components.

**Props**:
- `onCancel: () => void` - called when Cancel tapped
- `onSave?: () => void` - optional callback

**State**:
- items: ComboItem[]
- assistanceGlobal, overridePerItem, rpeGlobal, formGlobal
- lastSkill (for quick-add inheritance)
- bodyweight, user

**Renders**:
- ComboHeader
- Global settings form
- ComboQuickAdd
- ComboItemsList
- ComboSummary
- Footer buttons

### ComboHeader (combo-header.tsx)
Sticky header with cancel/save buttons and type badge.

### ComboQuickAdd (combo-quick-add.tsx)
Input zone for adding items. Maintains separate state for form fields.

**Validation**: `validateComboItem()`

### ComboItemsList (combo-items-list.tsx)
Renders list of items with delete buttons.

### ComboItemCard (combo-item-card.tsx)
Single item display - shows skill, technique, movement, value, score.

### ComboSummary (combo-summary.tsx)
4-column stats grid: Items | Base | Chain | Load

### SessionCombos (session-combos.tsx)
Displays combos in session view with expandable details.

**Features**:
- Lazy load items on expand
- Delete button with confirm
- Load calculation display
- Item list on expand

---

## 8. SQL Schema (003_combo_schema.sql)

### combos Table
```sql
CREATE TABLE combos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  performed_at timestamptz NOT NULL DEFAULT now(),
  assistance_global_kg numeric NOT NULL DEFAULT 0
    CHECK (assistance_global_kg IN (0, 5, 15, 25)),
  override_assistance_per_item boolean NOT NULL DEFAULT false,
  rpe_global integer NULL CHECK (rpe_global >= 1 AND rpe_global <= 10),
  form_global text NOT NULL DEFAULT 'ok'
    CHECK (form_global IN ('clean', 'ok', 'ugly')),
  notes text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_combos_user_performed ON combos(user_id, performed_at DESC);
CREATE INDEX idx_combos_user_session ON combos(user_id, session_id);
```

### combo_items Table
```sql
CREATE TABLE combo_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  combo_id uuid NOT NULL REFERENCES combos(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_index integer NOT NULL,
  skill text NOT NULL CHECK (skill IN ('planche', 'front')),
  technique text NOT NULL,
  movement text NOT NULL CHECK (movement IN ('hold', 'press', 'pushup', 'pullup', 'negative')),
  seconds numeric NULL CHECK (seconds IS NULL OR seconds > 0),
  reps integer NULL CHECK (reps IS NULL OR reps >= 1),
  assistance_kg numeric NULL CHECK (assistance_kg IS NULL OR assistance_kg IN (0, 5, 15, 25)),
  form_quality text NULL CHECK (form_quality IN ('clean', 'ok', 'ugly')),
  notes text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_combo_items_combo_order ON combo_items(combo_id, order_index);
CREATE INDEX idx_combo_items_user_created ON combo_items(user_id, created_at DESC);
```

### RLS Policies
All tables have 4 policies:
- SELECT WHERE user_id = auth.uid()
- INSERT WITH CHECK user_id = auth.uid()
- UPDATE WHERE/WITH CHECK user_id = auth.uid()
- DELETE WHERE user_id = auth.uid()

### Utility Function
```sql
CREATE OR REPLACE FUNCTION format_combo_name(combo_id uuid)
RETURNS text AS $$
  -- Returns "PLANCHE", "FRONT", or "MIX" based on items
$$
```

### View
```sql
CREATE OR REPLACE VIEW combo_summary AS
  -- Shows combo with item counts, skill breakdown, display label
```

---

## 9. Key Design Decisions

### 1. Server Actions vs Direct Calls
- Combos are created via **server actions** (not direct Supabase calls)
- Reason: Cannot import next/headers in client components
- Benefits: Centralized auth, cleaner error handling

### 2. Hard Delete (not soft)
- `DELETE FROM combos WHERE id = ?`
- Cascade delete: `ON DELETE CASCADE` on combo_items
- No "archived_at" field
- Reason: Simplicity, user expects immediate removal

### 3. Combo Excluded from KPI
- All KPI queries explicitly: `WHERE table = 'sets'`
- NOT a join with combo_items
- Reason: Combos are polymorphic (multi-skill, multi-movement)

### 4. ChainFactor Clamped [1.0, 2.0]
- Min: 1.0 (no bonus for single item)
- Max: 2.0 (100% boost with 7+ items + 3+ movements)
- Reason: Avoid excessive scaling

### 5. Assistance Inheritance
- Global → item (unless override_per_item = true)
- Cleaner UX, reduces form fields

---

## 10. Performance Considerations

### Database Indexes
- `(user_id, performed_at DESC)` for time-ordered queries
- `(user_id, session_id)` for session grouping
- `(combo_id, order_index)` for item ordering

### Computation
- Load calculation: **O(n)** where n = items per combo (typical 5-15)
- GlobalScore: Fetches 60d combos + sets, aggregates by week ~ **500ms**
- No caching (can add Redis later)

### Limits
- Combo items fetched lazily in session view (expand on demand)
- No bulk insert optimization yet

---

## 11. Error Handling

### Common Errors

| Scenario | Handling |
|----------|----------|
| Not authenticated | Server action returns error, UI shows alert |
| Session creation fails | Suggest reload, check auth |
| Combo insert fails | Rollback not automatic (combo row exists) |
| Items insert fails | Rollback: delete combo row |
| Network error | Catch + alert in ComboMode.handleSave |

### Future Improvements
- [ ] Automatic rollback on partial failure
- [ ] Retry logic with exponential backoff
- [ ] Retry notifications in UI

---

## 12. Testing Checklist

### Unit Tests (combo-calc.ts)
- [ ] calculateEffectiveLoad(75, 5, 0) = 70
- [ ] calculateItemScore(hold, 20s, 75) = 1500
- [ ] calculateBaseComboScore(...) sums correctly
- [ ] calculateChainFactor(8, 4) = 1.64
- [ ] validateComboItem('hold', 10, undefined) = { valid: true }
- [ ] validateComboItem('press', undefined, 5) = { valid: true }
- [ ] validateComboItem('hold', undefined, 5) = { valid: false }

### Integration Tests
- [ ] Create session → create combo → read combo_items
- [ ] Delete combo → cascade delete items
- [ ] RLS: user A cannot see combos of user B
- [ ] GlobalScore includes combo load in week
- [ ] KPI unaffected by combo items

### E2E Tests
- [ ] Combo mode: 8 items in < 30s
- [ ] Quick-add: inheritance + reset works
- [ ] Session view: combos + sets both visible
- [ ] Delete: confirm dialog → hard delete
- [ ] Navigation: save → redirect to session

---

## 13. Future Enhancements

### V2 Candidates
- [ ] Combo timer + densité (items/min)
- [ ] REST periods between items
- [ ] Combo templates/presets
- [ ] "Counts for KPI" toggle
- [ ] Video/photo attachment
- [ ] Edit items (not just delete)
- [ ] Duplicate combo

### V3+
- [ ] Combo analytics (progression, best combos)
- [ ] AI-generated combo recommendations
- [ ] Combo sharing with other users
- [ ] Combo form scoring (separate from load)

---

## 14. Deployment Notes

### Prerequisites
- Supabase project with RLS enabled
- Next.js 16.1.1+
- Node 18+

### Steps
1. Run migration: `npx supabase migration up` (or manual SQL)
2. Deploy app: `vercel deploy` or similar
3. Test combo creation in staging

### Monitoring
- Watch: `combos` table row count growth
- Watch: `GlobalScore` calculations (perf)
- Alert: RLS policy violations in logs

---

## 15. References

- **User Guide**: [COMBO.md](COMBO.md)
- **Types**: [src/types/index.ts](src/types/index.ts)
- **Utils**: [src/lib/utils/combo-calc.ts](src/lib/utils/combo-calc.ts)
- **Schema**: [supabase/migrations/003_combo_schema.sql](supabase/migrations/003_combo_schema.sql)

