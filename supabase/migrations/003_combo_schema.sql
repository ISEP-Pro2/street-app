-- =============================================================================
-- PALIER 5: COMBO SCHEMA MIGRATION
-- Tables: combos, combo_items
-- Purpose: Enable logging of multi-item sequences with chaining bonus
-- =============================================================================

-- =============================================================================
-- TABLE: combos
-- A sequence of items (planche/front) performed together
-- =============================================================================
CREATE TABLE combos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  
  -- Timestamp of combo performance
  performed_at timestamptz NOT NULL DEFAULT now(),
  
  -- Assistance configuration
  assistance_global_kg numeric NOT NULL DEFAULT 0
    CHECK (assistance_global_kg IN (0, 5, 15, 25)),
  override_assistance_per_item boolean NOT NULL DEFAULT false,
  
  -- RPE and form (optional, global level)
  rpe_global integer NULL CHECK (rpe_global >= 1 AND rpe_global <= 10),
  form_global text NOT NULL DEFAULT 'ok' 
    CHECK (form_global IN ('clean', 'ok', 'ugly')),
  
  -- Notes
  notes text NULL,
  
  -- Audit
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for combos
CREATE INDEX idx_combos_user_performed 
  ON combos(user_id, performed_at DESC);
CREATE INDEX idx_combos_user_session 
  ON combos(user_id, session_id);

-- RLS for combos
ALTER TABLE combos ENABLE ROW LEVEL SECURITY;
CREATE POLICY combos_select ON combos
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY combos_insert ON combos
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY combos_update ON combos
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY combos_delete ON combos
  FOR DELETE USING (user_id = auth.uid());

-- =============================================================================
-- TABLE: combo_items
-- Individual items within a combo sequence
-- =============================================================================
CREATE TABLE combo_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  combo_id uuid NOT NULL REFERENCES combos(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Position in combo sequence
  order_index integer NOT NULL,
  
  -- Item type and technique
  skill text NOT NULL CHECK (skill IN ('planche', 'front')),
  technique text NOT NULL,
  -- Validation: planche allows lean, tuck, adv_tuck, straddle, full, maltese
  --            front allows tuck, adv_tuck, full
  
  -- Movement type
  movement text NOT NULL 
    CHECK (movement IN ('hold', 'press', 'pushup', 'pullup', 'negative')),
  -- Validation: hold => seconds required, others => reps required
  
  -- Performance metrics (mutually exclusive)
  seconds numeric NULL CHECK (seconds IS NULL OR seconds > 0),
  reps integer NULL CHECK (reps IS NULL OR reps >= 1),
  
  -- Assistance override (only if combo.override_assistance_per_item = true)
  assistance_kg numeric NULL 
    CHECK (assistance_kg IS NULL OR assistance_kg IN (0, 5, 15, 25)),
  
  -- Form quality for this item
  form_quality text NULL 
    CHECK (form_quality IN ('clean', 'ok', 'ugly')),
  
  -- Notes
  notes text NULL,
  
  -- Audit
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for combo_items
CREATE INDEX idx_combo_items_combo_order 
  ON combo_items(combo_id, order_index);
CREATE INDEX idx_combo_items_user_created 
  ON combo_items(user_id, created_at DESC);

-- RLS for combo_items
ALTER TABLE combo_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY combo_items_select ON combo_items
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY combo_items_insert ON combo_items
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY combo_items_update ON combo_items
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY combo_items_delete ON combo_items
  FOR DELETE USING (user_id = auth.uid());

-- =============================================================================
-- UTILITY FUNCTION: format_combo_name
-- Returns "PLANCHE", "FRONT", or "MIX" based on combo items
-- =============================================================================
CREATE OR REPLACE FUNCTION format_combo_name(combo_id uuid)
RETURNS text AS $$
DECLARE
  planche_count integer;
  front_count integer;
BEGIN
  SELECT 
    COUNT(*) FILTER (WHERE skill = 'planche'),
    COUNT(*) FILTER (WHERE skill = 'front')
  INTO planche_count, front_count
  FROM combo_items WHERE combo_id = $1;
  
  IF planche_count > 0 AND front_count > 0 THEN
    RETURN 'MIX';
  ELSIF planche_count > 0 THEN
    RETURN 'PLANCHE';
  ELSIF front_count > 0 THEN
    RETURN 'FRONT';
  ELSE
    RETURN 'EMPTY';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =============================================================================
-- UTILITY VIEW: combo_summary
-- Shows combo info with item counts and skill breakdown
-- =============================================================================
CREATE OR REPLACE VIEW combo_summary AS
SELECT 
  c.id,
  c.user_id,
  c.session_id,
  c.performed_at,
  c.assistance_global_kg,
  c.rpe_global,
  c.form_global,
  c.created_at,
  COUNT(ci.id) as item_count,
  COUNT(DISTINCT ci.skill) as skill_count,
  COUNT(DISTINCT ci.movement) as movement_count,
  format_combo_name(c.id) as combo_type,
  format(
    'Combo (%s) — items: %s — RPE: %s — Form: %s',
    format_combo_name(c.id),
    COUNT(ci.id),
    COALESCE(c.rpe_global::text, 'N/A'),
    c.form_global
  ) as display_label
FROM combos c
LEFT JOIN combo_items ci ON c.id = ci.combo_id
GROUP BY c.id, c.user_id, c.session_id, c.performed_at, 
         c.assistance_global_kg, c.rpe_global, c.form_global, c.created_at;

-- Grant access to view
ALTER VIEW combo_summary OWNER TO postgres;
GRANT SELECT ON combo_summary TO authenticated;
