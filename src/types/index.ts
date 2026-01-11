export type Skill = 'planche' | 'front';

export type Technique = 
  | 'lean' | 'tuck' | 'adv_tuck' | 'straddle' | 'full' | 'maltese' // planche
  | 'tuck' | 'adv_tuck' | 'full'; // front

export type Movement =
  | 'hold' | 'press' | 'pushup' | 'negative' | 'combo';

export type AssistanceType = 'none' | 'band_5' | 'band_15' | 'band_25';

export type FormQuality = 'clean' | 'ok' | 'ugly';

export type PainTag = 'wrist' | 'elbow' | 'shoulder' | 'scap';

export type PrimaryFocus = 'planche_first' | 'front_first' | 'balanced';

export interface Session {
  id: string;
  user_id: string;
  session_date: string;
  notes?: string;
  created_at: string;
}

export interface Set {
  id: string;
  user_id: string;
  session_id: string;
  performed_at: string;
  skill: Skill;
  technique: Technique;
  movement: Movement;
  assistance_type: AssistanceType;
  assistance_kg?: number;
  added_weight_kg?: number;
  seconds?: number;
  reps?: number;
  rpe: number;
  form_quality: FormQuality;
  lockout: boolean;
  deadstop: boolean;
  pain_tag?: PainTag;
  notes?: string;
  created_at: string;
}

export interface UserPreferences {
  user_id: string;
  bodyweight_kg: number;
  primary_focus: PrimaryFocus;
  sessions_per_week_target: number;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface LogFormData {
  skill: Skill;
  technique: Technique;
  movement: Movement;
  assistance_type: AssistanceType;
  assistance_kg?: number;
  added_weight_kg?: number;
  seconds?: number;
  reps?: number;
  rpe: number;
  form_quality: FormQuality;
  lockout: boolean;
  deadstop: boolean;
  pain_tag?: PainTag;
  notes?: string;
}

// ============================================================================
// PALIER 4 — Plateau & Overtraining Detection Types
// ============================================================================

export type AlertType = 'plateau' | 'fatigue' | 'pain';
export type AlertLevel = 'info' | 'warning' | 'critical';

export interface PerformanceData {
  date: string;
  value: number;
  rpe: number;
  setCount: number;
  formQuality: number;
}

export interface KPIAlert {
  id: string; // Unique per KPI+assistance combo
  type: AlertType;
  level: AlertLevel;
  kpi_name: string; // e.g., "Planche — Hold (none)"
  skill: Skill;
  technique: Technique;
  movement: Movement;
  assistance_type: AssistanceType;
  assistance_kg?: number;
  
  // Alert evidence (what triggered it)
  evidence: {
    last_14d_best: number;
    prev_14d_best: number;
    avg_rpe_14d: number;
    set_count_14d: number;
    pain_count_7d?: number;
    fatigue_indicators?: string[];
  };
  
  // Recommendation
  recommendation: string;
  explanation: string;
  
  // Meta
  created_at: string;
}

export interface PlateauAnalysis {
  kpi_id: string;
  has_plateau: boolean;
  has_fatigue: boolean;
  has_pain: boolean;
  alerts: KPIAlert[];
}

export interface UserAlertSummary {
  total_alerts: number;
  critical_alerts: number;
  warning_alerts: number;
  by_type: {
    pain: number;
    fatigue: number;
    plateau: number;
  };
  alerts: KPIAlert[];
}

// ============================================================================
// PALIER 5 — Combo Types
// ============================================================================

export type ComboSkill = 'planche' | 'front';
export type ComboTechnique = 
  | 'lean' | 'tuck' | 'adv_tuck' | 'straddle' | 'full' | 'maltese'  // planche
  | 'tuck' | 'adv_tuck' | 'full';  // front
export type ComboMovement = 'hold' | 'press' | 'pushup' | 'pullup' | 'negative';

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
  assistance_kg?: number;  // Only if override_per_item = true
  form_quality?: FormQuality;
  notes?: string;
  created_at: string;
}

export interface Combo {
  id: string;
  user_id: string;
  session_id: string;
  performed_at: string;
  assistance_global_kg: number;  // 0, 5, 15, or 25
  override_assistance_per_item: boolean;
  rpe_global?: number;
  form_global: FormQuality;
  notes?: string;
  created_at: string;
  updated_at: string;
  items?: ComboItem[];  // Loaded separately
}

export interface ComboLoadCalculation {
  itemScore: number;  // seconds/reps * effectiveLoad
  baseComboScore: number;  // sum of all item scores
  chainFactor: number;  // 1 + 0.07*(n-1) + 0.05*(distinctMovements-1)
  comboLoadScore: number;  // baseComboScore * chainFactor
  distinctMovements: number;  // count of unique movements
  itemCount: number;  // total items in combo
}

export interface ComboFormData {
  skill: ComboSkill;
  technique: ComboTechnique;
  movement: ComboMovement;
  seconds?: number;
  reps?: number;
  assistance_kg?: number;
}
