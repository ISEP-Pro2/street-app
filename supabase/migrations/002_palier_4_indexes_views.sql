-- ============================================================================
-- PALIER 4 MIGRATION — Additional indexes and views for plateau/fatigue detection
-- ============================================================================

-- ============================================================================
-- SECTION 1: Performance Indexes for Plateau Detection
-- ============================================================================

-- Composite index for fast lookup of KPI-specific sets
CREATE INDEX IF NOT EXISTS idx_sets_kpi_lookup 
  ON sets(user_id, skill, technique, movement, assistance_kg, performed_at DESC);

-- Index for RPE filtering
CREATE INDEX IF NOT EXISTS idx_sets_user_rpe_performed 
  ON sets(user_id, rpe, performed_at DESC);

-- Index for pain tag queries
CREATE INDEX IF NOT EXISTS idx_sets_user_pain_performed 
  ON sets(user_id, pain_tag, performed_at DESC) WHERE pain_tag IS NOT NULL;

-- ============================================================================
-- SECTION 2: View for Daily Best Sets (for plateau detection)
-- ============================================================================

CREATE OR REPLACE VIEW daily_best_sets AS
SELECT
  user_id,
  DATE(performed_at) as session_date,
  skill,
  technique,
  movement,
  assistance_kg,
  assistance_type,
  -- Best performance for that day/KPI combo (either seconds or reps)
  CASE 
    WHEN movement IN ('hold', 'negative') THEN MAX(seconds)
    ELSE MAX(COALESCE(reps, 0))
  END as best_value,
  -- Average RPE for that day/KPI combo
  ROUND(AVG(rpe)::numeric, 1) as avg_rpe,
  -- Count of sets for this KPI that day
  COUNT(*) as set_count,
  -- Average form quality (clean = 1, ok = 0.5, ugly = 0)
  ROUND(AVG(CASE WHEN form_quality = 'clean' THEN 1 WHEN form_quality = 'ok' THEN 0.5 ELSE 0 END)::numeric, 2) as avg_form_quality
FROM sets
GROUP BY 
  user_id,
  DATE(performed_at),
  skill,
  technique,
  movement,
  assistance_kg,
  assistance_type;

-- ============================================================================
-- SECTION 3: View for Session-based Best Performance
-- ============================================================================

CREATE OR REPLACE VIEW session_best_sets AS
SELECT
  user_id,
  performed_at::date as session_date,
  ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY performed_at::date DESC) as session_rank,
  skill,
  technique,
  movement,
  assistance_kg,
  assistance_type,
  -- Best value in that session for that KPI
  CASE 
    WHEN movement IN ('hold', 'negative') THEN MAX(seconds)
    ELSE MAX(COALESCE(reps, 0))
  END as session_best_value,
  -- Average RPE in that session for that KPI
  ROUND(AVG(rpe)::numeric, 1) as session_avg_rpe,
  COUNT(*) as session_set_count
FROM sets
GROUP BY 
  user_id,
  performed_at::date,
  skill,
  technique,
  movement,
  assistance_kg,
  assistance_type;

-- ============================================================================
-- SECTION 4: View for Weekly Aggregates (for volume monitoring)
-- ============================================================================

CREATE OR REPLACE VIEW weekly_aggregates AS
SELECT
  user_id,
  DATE_TRUNC('week', performed_at)::date as week_start,
  EXTRACT(ISODOW FROM performed_at) as iso_week_day,
  COUNT(*) as total_sets,
  SUM(CASE WHEN rpe >= 8 THEN 1 ELSE 0 END) as hard_sets,
  ROUND(AVG(rpe)::numeric, 1) as avg_rpe,
  ROUND(SUM(COALESCE(seconds, 0))::numeric, 0) as total_seconds,
  SUM(CASE WHEN pain_tag IS NOT NULL THEN 1 ELSE 0 END) as pain_set_count,
  ROUND(
    (SELECT bodyweight_kg FROM user_preferences WHERE user_id = sets.user_id LIMIT 1)::numeric, 2
  ) as bodyweight_kg
FROM sets
GROUP BY user_id, DATE_TRUNC('week', performed_at), EXTRACT(ISODOW FROM performed_at);

-- ============================================================================
-- SECTION 5: View for Pain Analysis
-- ============================================================================

CREATE OR REPLACE VIEW pain_analysis AS
SELECT
  user_id,
  pain_tag,
  DATE(performed_at) as pain_date,
  COUNT(*) as pain_set_count,
  STRING_AGG(DISTINCT notes, ' | ' ORDER BY notes) as notes_summary,
  -- Check if any notes contain pain keywords
  COUNT(*) FILTER (WHERE 
    LOWER(COALESCE(notes, '')) LIKE '%sharp%' 
    OR LOWER(COALESCE(notes, '')) LIKE '%electric%'
    OR LOWER(COALESCE(notes, '')) LIKE '%décharge%'
  ) as sharp_sets,
  ARRAY_AGG(DISTINCT skill) as affected_skills
FROM sets
WHERE pain_tag IS NOT NULL
GROUP BY user_id, pain_tag, DATE(performed_at);

-- ============================================================================
-- SECTION 6: Summary View for All Alerts
-- ============================================================================

CREATE OR REPLACE VIEW user_alert_summary AS
SELECT
  user_id,
  -- Date for sorting
  NOW()::date as alert_date,
  -- Count of recent pain sets (last 7 days)
  (SELECT COUNT(*) FROM sets s1 
   WHERE s1.user_id = sets.user_id 
   AND s1.pain_tag IS NOT NULL 
   AND s1.performed_at >= NOW() - INTERVAL '7 days') as recent_pain_sets,
  -- Count of hard sets last 14 days
  (SELECT COUNT(*) FROM sets s2 
   WHERE s2.user_id = sets.user_id 
   AND s2.rpe >= 8 
   AND s2.performed_at >= NOW() - INTERVAL '14 days') as hard_sets_14d,
  -- Average RPE last 7 days
  (SELECT ROUND(AVG(rpe)::numeric, 1) FROM sets s3 
   WHERE s3.user_id = sets.user_id 
   AND s3.performed_at >= NOW() - INTERVAL '7 days') as avg_rpe_7d,
  -- Last session date
  (SELECT MAX(performed_at)::date FROM sets s4 
   WHERE s4.user_id = sets.user_id) as last_session_date,
  -- Session count last 14 days
  (SELECT COUNT(DISTINCT DATE(performed_at)) FROM sets s5 
   WHERE s5.user_id = sets.user_id 
   AND s5.performed_at >= NOW() - INTERVAL '14 days') as sessions_14d
FROM sets
GROUP BY user_id;

-- ============================================================================
-- NOTE: These views are for optimization and transparency
-- Main detection logic lives in TypeScript (src/lib/supabase/insights.ts)
-- to keep business logic maintainable and testable
-- ============================================================================
