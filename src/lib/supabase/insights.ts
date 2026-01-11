import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { AssistanceType, Set, KPIAlert, UserAlertSummary, ComboItem } from '@/types';
import { calculateComboLoad } from '@/lib/utils/combo-calc';

// Initialize server-side Supabase client
export async function getServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

// KPI Definitions
const KPI_DEFINITIONS = {
  planche_hold: {
    name: 'Planche — Hold',
    filters: { skill: 'planche', technique: 'full', movement: 'hold' },
    type: 'hold' as const,
  },
  planche_dynamic: {
    name: 'Planche — Dynamic',
    filters: { skill: 'planche', technique: 'full', movement: 'press' },
    type: 'dynamic' as const,
  },
  front_hold: {
    name: 'Front — Hold',
    filters: { skill: 'front', technique: 'full', movement: 'hold' },
    type: 'hold' as const,
  },
  front_dynamic: {
    name: 'Front — Dynamic',
    filters: { skill: 'front', movement: 'pullup', technique: 'adv_tuck' },
    type: 'dynamic' as const,
  },
};

export type KPIKey = keyof typeof KPI_DEFINITIONS;
export type KPIType = 'hold' | 'dynamic';

// Get sets for a specific KPI within a timeframe
async function getKPISets(
  userId: string,
  kpiKey: KPIKey,
  startDate: string,
  assistance: AssistanceType
) {
  const supabase = await getServerSupabaseClient();
  const kpiDef = KPI_DEFINITIONS[kpiKey];

  const query = supabase
    .from('sets')
    .select('*')
    .eq('user_id', userId)
    .gte('performed_at', startDate)
    .eq('skill', kpiDef.filters.skill)
    .eq('technique', kpiDef.filters.technique)
    .eq('movement', kpiDef.filters.movement)
    .eq('assistance_type', assistance)
    .order('performed_at', { ascending: false });

  const { data, error } = await query;

  if (error) throw error;
  return (data || []) as Set[];
}

// Calculate best of today/7d/28d for a KPI
export async function getKPIMetrics(
  userId: string,
  kpiKey: KPIKey,
  assistance: AssistanceType,
  today: string
) {
  const kpiDef = KPI_DEFINITIONS[kpiKey];

  // Calculate dates
  const todayDate = new Date(today);
  const sevenDaysAgo = new Date(todayDate);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const twentyEightDaysAgo = new Date(todayDate);
  twentyEightDaysAgo.setDate(twentyEightDaysAgo.getDate() - 27);

  // Fetch sets
  const setsTwentyEightDays = await getKPISets(
    userId,
    kpiKey,
    twentyEightDaysAgo.toISOString().split('T')[0],
    assistance
  );
  const setsSevenDays = setsTwentyEightDays.filter(
    (s) => new Date(s.performed_at) >= sevenDaysAgo
  );
  const setsToday = setsTwentyEightDays.filter(
    (s) => s.performed_at.split('T')[0] === today
  );

  // Get best value (seconds for holds, reps for dynamics)
  const getBestValue = (sets: Set[]) => {
    if (sets.length === 0) return null;
    if (kpiDef.type === 'hold') {
      return Math.max(...sets.map((s) => s.seconds || 0));
    } else {
      return Math.max(...sets.map((s) => s.reps || 0));
    }
  };

  // Get best with form_quality='clean' (PR Clean)
  const getBestClean = (sets: Set[]) => {
    const cleanSets = sets.filter((s) => s.form_quality === 'clean');
    if (cleanSets.length === 0) return null;
    if (kpiDef.type === 'hold') {
      return Math.max(...cleanSets.map((s) => s.seconds || 0));
    } else {
      return Math.max(...cleanSets.map((s) => s.reps || 0));
    }
  };

  return {
    best_today: { absolute: getBestValue(setsToday), clean: getBestClean(setsToday) },
    best_7d: { absolute: getBestValue(setsSevenDays), clean: getBestClean(setsSevenDays) },
    best_28d: { absolute: getBestValue(setsTwentyEightDays), clean: getBestClean(setsTwentyEightDays) },
  };
}

// Get all 4 KPI metrics for all assistance levels
export async function getAllKPIMetrics(userId: string, today: string) {
  const assistances: AssistanceType[] = ['none', 'band_5', 'band_15', 'band_25'];
  const kpiKeys: KPIKey[] = [
    'planche_hold',
    'planche_dynamic',
    'front_hold',
    'front_dynamic',
  ];

  const metrics: Record<KPIKey, Record<AssistanceType, Awaited<ReturnType<typeof getKPIMetrics>>>> = {
    planche_hold: { none: {} as any, band_5: {} as any, band_15: {} as any, band_25: {} as any },
    planche_dynamic: { none: {} as any, band_5: {} as any, band_15: {} as any, band_25: {} as any },
    front_hold: { none: {} as any, band_5: {} as any, band_15: {} as any, band_25: {} as any },
    front_dynamic: { none: {} as any, band_5: {} as any, band_15: {} as any, band_25: {} as any },
  };

  for (const kpiKey of kpiKeys) {
    for (const assistance of assistances) {
      metrics[kpiKey][assistance] = await getKPIMetrics(userId, kpiKey, assistance, today);
    }
  }

  return metrics;
}

// Get best-of-day data for graphing (30 days)
export async function getBestOfDayData(
  userId: string,
  kpiKey: KPIKey,
  assistance: AssistanceType,
  days: number = 30
) {
  const supabase = await getServerSupabaseClient();
  const kpiDef = KPI_DEFINITIONS[kpiKey];

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data: sets, error } = await supabase
    .from('sets')
    .select('*')
    .eq('user_id', userId)
    .gte('performed_at', startDate.toISOString().split('T')[0])
    .eq('skill', kpiDef.filters.skill)
    .eq('technique', kpiDef.filters.technique)
    .eq('movement', kpiDef.filters.movement)
    .eq('assistance_type', assistance)
    .order('performed_at', { ascending: true });

  if (error) throw error;

  // Group by date and get best of day
  const bestOfDay = new Map<string, number>();
  (sets || []).forEach((set: Set) => {
    const date = set.performed_at.split('T')[0];
    const value = kpiDef.type === 'hold' ? (set.seconds || 0) : (set.reps || 0);
    const current = bestOfDay.get(date) || 0;
    bestOfDay.set(date, Math.max(current, value));
  });

  return Array.from(bestOfDay.entries()).map(([date, value]) => ({
    date,
    value,
  }));
}

// Calculate Global Score (sets + combos)
export async function getGlobalScoreData(userId: string) {
  const supabase = await getServerSupabaseClient();

  // Get user bodyweight
  const { data: prefs, error: prefsError } = await supabase
    .from('user_preferences')
    .select('bodyweight_kg')
    .eq('user_id', userId)
    .single();

  if (prefsError) throw prefsError;
  const bodyweight_kg = prefs.bodyweight_kg || 75;

  // Get all sets from last 60 days
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 60);
  const startDateStr = startDate.toISOString().split('T')[0];

  const { data: sets, error } = await supabase
    .from('sets')
    .select('*')
    .eq('user_id', userId)
    .gte('performed_at', startDateStr)
    .order('performed_at', { ascending: true });

  if (error) throw error;

  // Get all combos from last 60 days
  const { data: combos, error: combosError } = await supabase
    .from('combos')
    .select('*')
    .eq('user_id', userId)
    .gte('performed_at', startDateStr)
    .order('performed_at', { ascending: true });

  if (combosError) throw combosError;

  // Calculate scores by ISO week
  const scoreByWeek = new Map<string, number>();

  // Add set scores
  (sets || []).forEach((set: Set) => {
    const date = new Date(set.performed_at);
    const weekNumber = getISOWeek(date);
    const year = date.getFullYear();
    const weekKey = `${year}-W${String(weekNumber).padStart(2, '0')}`;

    // Calculate effective load
    const assistance = getAssistanceValue(set.assistance_type);
    const addedWeight = set.added_weight_kg || 0;
    const effectiveLoad = bodyweight_kg - assistance + addedWeight;

    // Calculate score
    let score = 0;
    if (set.movement === 'hold' || set.movement === 'negative') {
      score = (set.seconds || 0) * effectiveLoad;
    } else if (set.movement === 'press' || set.movement === 'pushup' || set.movement === 'combo') {
      score = (set.reps || 0) * effectiveLoad;
    }

    const current = scoreByWeek.get(weekKey) || 0;
    scoreByWeek.set(weekKey, current + score);
  });

  // Add combo loads
  for (const combo of combos || []) {
    // Get combo items
    const { data: items, error: itemsError } = await supabase
      .from('combo_items')
      .select('*')
      .eq('combo_id', combo.id)
      .order('order_index', { ascending: true });

    if (itemsError || !items) continue;

    // Calculate combo load
    const load = calculateComboLoad(
      items as ComboItem[],
      bodyweight_kg,
      combo.assistance_global_kg,
      combo.override_assistance_per_item
    );

    // Add to weekly score
    const date = new Date(combo.performed_at);
    const weekNumber = getISOWeek(date);
    const year = date.getFullYear();
    const weekKey = `${year}-W${String(weekNumber).padStart(2, '0')}`;

    const current = scoreByWeek.get(weekKey) || 0;
    scoreByWeek.set(weekKey, current + load.comboLoadScore);
  }

  return Array.from(scoreByWeek.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([week, score]) => ({
      week,
      score: Math.round(score),
    }));
}

// Get hard sets per week (RPE >= 8)
export async function getHardSetsPerWeek(userId: string) {
  const supabase = await getServerSupabaseClient();

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 60);

  const { data: sets, error } = await supabase
    .from('sets')
    .select('*')
    .eq('user_id', userId)
    .gte('performed_at', startDate.toISOString().split('T')[0])
    .gte('rpe', 8)
    .order('performed_at', { ascending: true });

  if (error) throw error;

  // Group by ISO week
  const hardSetsByWeek = new Map<string, number>();

  (sets || []).forEach((set: Set) => {
    const date = new Date(set.performed_at);
    const weekNumber = getISOWeek(date);
    const year = date.getFullYear();
    const weekKey = `${year}-W${String(weekNumber).padStart(2, '0')}`;

    const current = hardSetsByWeek.get(weekKey) || 0;
    hardSetsByWeek.set(weekKey, current + 1);
  });

  return Array.from(hardSetsByWeek.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([week, count]) => ({
      week,
      count,
    }));
}

// Helper: Convert assistance type to kg
function getAssistanceValue(assistanceType: AssistanceType): number {
  const assistanceMap: Record<AssistanceType, number> = {
    none: 0,
    band_5: 5,
    band_15: 15,
    band_25: 25,
  };
  return assistanceMap[assistanceType] || 0;
}

// Helper: Get ISO week number
function getISOWeek(date: Date): number {
  const target = new Date(date.valueOf());
  const dayNr = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
  }
  return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
}

// ============== PALIER 3: Charge & Fatigue Metrics ==============

export interface WeeklyMetrics {
  week: string;
  total_sets: number;
  hard_sets: number;
  hold_seconds_planche: number;
  hold_seconds_front: number;
  dynamic_reps_planche: number;
  dynamic_reps_front: number;
  global_score: number;
  hard_ratio: number; // hard_sets / total_sets
}

export interface TrainingWarning {
  type: 'rapid_ramp' | 'hard_overload' | 'too_many_max_efforts';
  level: 'orange' | 'red';
  message: string;
  explanation: string;
  threshold: string;
}

export interface WeeklyTrainingStats {
  currentWeek: WeeklyMetrics | null;
  previousWeeks: WeeklyMetrics[];
  warnings: TrainingWarning[];
  rampPercentage: number;
  hardSetsDelta: number;
}

// Calculate weekly training metrics
export async function getWeeklyTrainingMetrics(userId: string) {
  const supabase = await getServerSupabaseClient();

  // Get user bodyweight for Global Score calculation
  const { data: prefs, error: prefsError } = await supabase
    .from('user_preferences')
    .select('bodyweight_kg')
    .eq('user_id', userId)
    .single();

  if (prefsError) throw prefsError;
  const bodyweight_kg = prefs.bodyweight_kg || 75;

  // Get last 60 days of sets
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 60);

  const { data: sets, error } = await supabase
    .from('sets')
    .select('*')
    .eq('user_id', userId)
    .gte('performed_at', startDate.toISOString().split('T')[0])
    .order('performed_at', { ascending: true });

  if (error) throw error;

  // Get last 60 days of combos to get combo_items
  const { data: combos, error: combosError } = await supabase
    .from('combos')
    .select('id, performed_at')
    .eq('user_id', userId)
    .gte('performed_at', startDate.toISOString().split('T')[0])
    .order('performed_at', { ascending: true });

  if (combosError) throw combosError;

  let comboItems: any[] = [];
  if (combos && combos.length > 0) {
    const comboIds = combos.map((c) => c.id);
    const { data: items } = await supabase
      .from('combo_items')
      .select('*')
      .in('combo_id', comboIds);
    
    if (items) {
      // Add performed_at from parent combo to each item
      comboItems = items.map((item) => {
        const parentCombo = combos.find((c) => c.id === item.combo_id);
        return {
          ...item,
          performed_at: parentCombo?.performed_at || new Date().toISOString(),
        };
      });
    }
  }

  // Group sets by ISO week
  const metricsByWeek = new Map<string, WeeklyMetrics>();

  (sets || []).forEach((set: Set) => {
    const date = new Date(set.performed_at);
    const weekNumber = getISOWeek(date);
    const year = date.getFullYear();
    const weekKey = `${year}-W${String(weekNumber).padStart(2, '0')}`;

    if (!metricsByWeek.has(weekKey)) {
      metricsByWeek.set(weekKey, {
        week: weekKey,
        total_sets: 0,
        hard_sets: 0,
        hold_seconds_planche: 0,
        hold_seconds_front: 0,
        dynamic_reps_planche: 0,
        dynamic_reps_front: 0,
        global_score: 0,
        hard_ratio: 0,
      });
    }

    const metrics = metricsByWeek.get(weekKey)!;

    // Count total and hard sets
    metrics.total_sets += 1;
    if (set.rpe >= 8) {
      metrics.hard_sets += 1;
    }

    // Accumulate hold seconds by skill
    if (set.movement === 'hold' || set.movement === 'negative') {
      const seconds = set.seconds || 0;
      if (set.skill === 'planche') {
        metrics.hold_seconds_planche += seconds;
      } else if (set.skill === 'front') {
        metrics.hold_seconds_front += seconds;
      }
    }

    // Accumulate dynamic reps by skill
    if (set.movement === 'press' || set.movement === 'pushup' || set.movement === 'pullup' || set.movement === 'negative' || set.movement === 'combo') {
      const reps = set.reps || 0;
      if (set.skill === 'planche') {
        metrics.dynamic_reps_planche += reps;
      } else if (set.skill === 'front') {
        metrics.dynamic_reps_front += reps;
      }
    }

    // Calculate Global Score contribution
    const assistance = getAssistanceValue(set.assistance_type);
    const addedWeight = set.added_weight_kg || 0;
    const effectiveLoad = bodyweight_kg - assistance + addedWeight;

    let score = 0;
    if (set.movement === 'hold' || set.movement === 'negative') {
      score = (set.seconds || 0) * effectiveLoad;
    } else if (set.movement === 'press' || set.movement === 'pushup' || set.movement === 'combo') {
      score = (set.reps || 0) * effectiveLoad;
    }
    metrics.global_score += score;

    // Calculate hard ratio
    metrics.hard_ratio = metrics.total_sets > 0 ? metrics.hard_sets / metrics.total_sets : 0;
  });

  // Process combo items
  comboItems.forEach((item) => {
    const date = new Date(item.performed_at);
    const weekNumber = getISOWeek(date);
    const year = date.getFullYear();
    const weekKey = `${year}-W${String(weekNumber).padStart(2, '0')}`;

    if (!metricsByWeek.has(weekKey)) {
      metricsByWeek.set(weekKey, {
        week: weekKey,
        total_sets: 0,
        hard_sets: 0,
        hold_seconds_planche: 0,
        hold_seconds_front: 0,
        dynamic_reps_planche: 0,
        dynamic_reps_front: 0,
        global_score: 0,
        hard_ratio: 0,
      });
    }

    const metrics = metricsByWeek.get(weekKey)!;

    // Accumulate hold seconds from combo items
    if (item.movement === 'hold' || item.movement === 'negative') {
      const seconds = item.seconds || 0;
      if (item.skill === 'planche') {
        metrics.hold_seconds_planche += seconds;
      } else if (item.skill === 'front') {
        metrics.hold_seconds_front += seconds;
      }
    }

    // Accumulate dynamic reps from combo items
    if (item.movement === 'press' || item.movement === 'pushup' || item.movement === 'pullup' || item.movement === 'negative') {
      const reps = item.reps || 0;
      if (item.skill === 'planche') {
        metrics.dynamic_reps_planche += reps;
      } else if (item.skill === 'front') {
        metrics.dynamic_reps_front += reps;
      }
    }
  });

  // Convert to sorted array (most recent first)
  const weeks = Array.from(metricsByWeek.entries())
    .map(([_, metrics]) => ({
      ...metrics,
      global_score: Math.round(metrics.global_score),
    }))
    .sort((a, b) => b.week.localeCompare(a.week));

  // Get current week (ISO week)
  const today = new Date();
  const currentWeekNumber = getISOWeek(today);
  const currentYear = today.getFullYear();
  const currentWeekKey = `${currentYear}-W${String(currentWeekNumber).padStart(2, '0')}`;

  const currentWeekMetrics = weeks.find((w) => w.week === currentWeekKey) || null;
  const previousWeeks = weeks.filter((w) => w.week !== currentWeekKey).slice(0, 3);

  // Calculate warnings
  const warnings = calculateTrainingWarnings(currentWeekMetrics, previousWeeks);

  // Calculate ramp percentage
  const avgScore = previousWeeks.length > 0
    ? previousWeeks.reduce((sum, w) => sum + w.global_score, 0) / previousWeeks.length
    : 0;

  const rampPercentage = avgScore > 0 && currentWeekMetrics
    ? ((currentWeekMetrics.global_score - avgScore) / avgScore) * 100
    : 0;

  // Calculate hard sets delta
  const avgHardSets = previousWeeks.length > 0
    ? previousWeeks.reduce((sum, w) => sum + w.hard_sets, 0) / previousWeeks.length
    : 0;

  const hardSetsDelta = currentWeekMetrics
    ? currentWeekMetrics.hard_sets - Math.round(avgHardSets)
    : 0;

  return {
    currentWeek: currentWeekMetrics,
    previousWeeks,
    warnings,
    rampPercentage: Math.round(rampPercentage * 10) / 10,
    hardSetsDelta,
  };
}

// Calculate training warnings based on metrics
function calculateTrainingWarnings(
  currentWeek: WeeklyMetrics | null,
  previousWeeks: WeeklyMetrics[]
): TrainingWarning[] {
  const warnings: TrainingWarning[] = [];

  if (!currentWeek || previousWeeks.length === 0) {
    return warnings;
  }

  // Calculate averages from previous 3 weeks
  const avgScore = previousWeeks.reduce((sum, w) => sum + w.global_score, 0) / previousWeeks.length;
  const avgHardSets = previousWeeks.reduce((sum, w) => sum + w.hard_sets, 0) / previousWeeks.length;

  // Warning 1: Rapid ramp (score increased too fast)
  const rampThreshold = avgScore * 1.25;
  if (currentWeek.global_score > rampThreshold) {
    warnings.push({
      type: 'rapid_ramp',
      level: 'orange',
      message: '⚠️ Rapid volume increase',
      explanation: 'Your training volume increased significantly compared to the last 3 weeks. Monitor fatigue levels.',
      threshold: `${Math.round(rampThreshold)} points (avg: ${Math.round(avgScore)})`,
    });
  }

  // Warning 2: Hard overload (hard sets increased too fast)
  const hardThreshold = avgHardSets * 1.3;
  if (currentWeek.hard_sets > hardThreshold) {
    warnings.push({
      type: 'hard_overload',
      level: 'red',
      message: '🔴 Hard sets overload',
      explanation: 'Too many hard sets (RPE≥8) this week. Risk of overtraining.',
      threshold: `${Math.round(hardThreshold)} sets (avg: ${Math.round(avgHardSets)})`,
    });
  }

  // Warning 3: Too many max efforts (hard ratio > 45%)
  if (currentWeek.hard_ratio > 0.45) {
    warnings.push({
      type: 'too_many_max_efforts',
      level: 'orange',
      message: '⚠️ Too many max efforts',
      explanation: 'Over 45% of your sets are at RPE≥8. Consider reducing intensity.',
      threshold: `${Math.round(currentWeek.hard_ratio * 100)}% hard sets (max: 45%)`,
    });
  }

  return warnings;
}

// ============================================================================
// PALIER 4 — Plateau, Fatigue & Pain Detection
// ============================================================================

interface PerformancePoint {
  date: string;
  value: number;
  rpe: number;
  setCount: number;
  formQuality: number;
}

/**
 * Analyze a specific KPI for plateau/fatigue/pain
 * Returns alerts if conditions are met
 */
async function analyzeKPIForAlerts(
  client: any,
  userId: string,
  skill: string,
  technique: string,
  movement: string,
  assistanceType: string,
  assistanceKg: number | null,
  bodyweight: number
): Promise<KPIAlert[]> {
  const alerts: KPIAlert[] = [];

  // Fetch last 28 days of performance data for this KPI
  const { data: sets, error } = await client
    .from('sets')
    .select('*')
    .eq('user_id', userId)
    .eq('skill', skill)
    .eq('technique', technique)
    .eq('movement', movement)
    .eq('assistance_type', assistanceType)
    .eq('assistance_kg', assistanceKg || 0)
    .gte('performed_at', new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString())
    .order('performed_at', { ascending: true });

  if (error || !sets || sets.length === 0) {
    return alerts;
  }

  // Group by date and get best performance per day
  const byDate = new Map<string, PerformancePoint>();
  
  sets.forEach((set: Set) => {
    const date = new Date(set.performed_at).toISOString().split('T')[0];
    const value = movement === 'hold' || movement === 'negative' 
      ? (set.seconds || 0) 
      : (set.reps || 0);
    
    const formScore = set.form_quality === 'clean' ? 1 : set.form_quality === 'ok' ? 0.5 : 0;
    
    const existing = byDate.get(date);
    if (!existing || value > existing.value) {
      byDate.set(date, {
        date,
        value,
        rpe: set.rpe,
        setCount: 1,
        formQuality: formScore,
      });
    }
  });

  const sortedDates = Array.from(byDate.keys()).sort();
  const last14Days = sortedDates.slice(-14);
  const prev14Days = sortedDates.slice(Math.max(0, sortedDates.length - 28), -14);

  // Only analyze if we have sufficient data
  if (last14Days.length < 6) {
    return alerts; // Insufficient data
  }

  // ✅ PLATEAU DETECTION
  if (prev14Days.length >= 6) {
    const last14Best = Math.max(...last14Days.map(d => byDate.get(d)!.value));
    const prev14Best = Math.max(...prev14Days.map(d => byDate.get(d)!.value));
    const avg_rpe_14d = 
      last14Days.reduce((sum, d) => sum + byDate.get(d)!.rpe, 0) / last14Days.length;
    
    // Plateau: No improvement + high RPE + enough data
    if (last14Best <= prev14Best && avg_rpe_14d >= 8) {
      const kpiName = formatKPIName(skill, technique, movement, assistanceType, assistanceKg);
      
      alerts.push({
        id: `${skill}-${technique}-${movement}-${assistanceType}-${assistanceKg || 0}`,
        type: 'plateau',
        level: 'warning',
        kpi_name: kpiName,
        skill: skill as any,
        technique: technique as any,
        movement: movement as any,
        assistance_type: assistanceType as any,
        assistance_kg: assistanceKg || undefined,
        evidence: {
          last_14d_best: last14Best,
          prev_14d_best: prev14Best,
          avg_rpe_14d: Math.round(avg_rpe_14d * 10) / 10,
          set_count_14d: last14Days.length,
        },
        recommendation: generatePlateauRecommendation(movement),
        explanation: `No improvement on ${kpiName} in the last 14 days despite high intensity (avg RPE ${Math.round(avg_rpe_14d)}).`,
        created_at: new Date().toISOString(),
      });
    }
  }

  // ✅ FATIGUE DETECTION
  if (sortedDates.length >= 2) {
    const lastDate = sortedDates[sortedDates.length - 1];
    const prevDate = sortedDates[sortedDates.length - 2];
    
    const lastValue = byDate.get(lastDate)!.value;
    const prevValue = byDate.get(prevDate)!.value;
    const lastRpe = byDate.get(lastDate)!.rpe;
    const prevRpe = byDate.get(prevDate)!.rpe;
    
    // Check for regression pattern: performance dropped with high RPE
    // (This is simplified; full version would check 2-session pattern)
    if (lastValue < prevValue && (lastRpe >= 8 || prevRpe >= 8)) {
      const avg_rpe_last_2 = (lastRpe + prevRpe) / 2;
      
      if (avg_rpe_last_2 >= 8) {
        const kpiName = formatKPIName(skill, technique, movement, assistanceType, assistanceKg);
        
        // Only alert if it's a significant regression
        const regressionPercent = Math.round(((prevValue - lastValue) / prevValue) * 100);
        if (regressionPercent >= 10) {
          alerts.push({
            id: `${skill}-${technique}-${movement}-${assistanceType}-${assistanceKg || 0}-fatigue`,
            type: 'fatigue',
            level: 'critical',
            kpi_name: kpiName,
            skill: skill as any,
            technique: technique as any,
            movement: movement as any,
            assistance_type: assistanceType as any,
            assistance_kg: assistanceKg || undefined,
            evidence: {
              last_14d_best: lastValue,
              prev_14d_best: prevValue,
              avg_rpe_14d: Math.round(avg_rpe_last_2 * 10) / 10,
              set_count_14d: Math.min(last14Days.length, 2),
              fatigue_indicators: ['Performance regression', `${regressionPercent}% drop`, 'High RPE maintained'],
            },
            recommendation: generateFatigueRecommendation(),
            explanation: `Performance dropped ${regressionPercent}% on ${kpiName} with high intensity. Sign of nervous system fatigue.`,
            created_at: new Date().toISOString(),
          });
        }
      }
    }
  }

  // ✅ PAIN DETECTION
  const { data: painSets } = await client
    .from('sets')
    .select('pain_tag, notes')
    .eq('user_id', userId)
    .eq('skill', skill)
    .eq('technique', technique)
    .eq('movement', movement)
    .eq('assistance_type', assistanceType)
    .eq('assistance_kg', assistanceKg || 0)
    .gte('performed_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .not('pain_tag', 'is', null);

  if (painSets && painSets.length > 0) {
    // Check for multiple pain sets (2+) in last 7 days
    if (painSets.length >= 2) {
      const kpiName = formatKPIName(skill, technique, movement, assistanceType, assistanceKg);
      
      alerts.push({
        id: `${skill}-${technique}-${movement}-${assistanceType}-${assistanceKg || 0}-pain`,
        type: 'pain',
        level: 'critical',
        kpi_name: kpiName,
        skill: skill as any,
        technique: technique as any,
        movement: movement as any,
        assistance_type: assistanceType as any,
        assistance_kg: assistanceKg || undefined,
        evidence: {
          last_14d_best: 0,
          prev_14d_best: 0,
          avg_rpe_14d: 0,
          set_count_14d: 0,
          pain_count_7d: painSets.length,
        },
        recommendation: generatePainRecommendation(),
        explanation: `Reported pain (${painSets.map((s: any) => s.pain_tag).join(', ')}) on ${painSets.length} sets in last 7 days. Reduce intensity immediately.`,
        created_at: new Date().toISOString(),
      });
    } 
    // Also check for sharp/electric pain keywords
    else if (painSets.some((s: any) => hasSharpKeyword(s.notes))) {
      const kpiName = formatKPIName(skill, technique, movement, assistanceType, assistanceKg);
      
      alerts.push({
        id: `${skill}-${technique}-${movement}-${assistanceType}-${assistanceKg || 0}-sharp`,
        type: 'pain',
        level: 'critical',
        kpi_name: kpiName,
        skill: skill as any,
        technique: technique as any,
        movement: movement as any,
        assistance_type: assistanceType as any,
        assistance_kg: assistanceKg || undefined,
        evidence: {
          last_14d_best: 0,
          prev_14d_best: 0,
          avg_rpe_14d: 0,
          set_count_14d: 0,
          pain_count_7d: 1,
        },
        recommendation: generatePainRecommendation(),
        explanation: `Sharp/electric sensation reported in notes. Indicates acute issue. Stop this movement immediately.`,
        created_at: new Date().toISOString(),
      });
    }
  }

  return alerts;
}

/**
 * Get skill load trend by week (Planche vs Front)
 * Returns weekly scores for each skill over the last 60 days
 */
export async function getSkillLoadByWeek(userId: string) {
  const supabase = await getServerSupabaseClient();

  // Get user bodyweight
  const { data: prefs, error: prefsError } = await supabase
    .from('user_preferences')
    .select('bodyweight_kg')
    .eq('user_id', userId)
    .single();

  if (prefsError) throw prefsError;
  const bodyweight_kg = prefs.bodyweight_kg || 75;

  // Get all sets from last 60 days
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 60);
  const startDateStr = startDate.toISOString().split('T')[0];

  const { data: sets, error } = await supabase
    .from('sets')
    .select('*')
    .eq('user_id', userId)
    .gte('performed_at', startDateStr)
    .order('performed_at', { ascending: true });

  if (error) throw error;

  // Get all combos from last 60 days
  const { data: combos, error: combosError } = await supabase
    .from('combos')
    .select('*')
    .eq('user_id', userId)
    .gte('performed_at', startDateStr)
    .order('performed_at', { ascending: true });

  if (combosError) throw combosError;

  // Calculate scores by ISO week and skill
  const scoreByWeekAndSkill = new Map<
    string,
    { planche: number; front: number }
  >();

  // Add set scores
  (sets || []).forEach((set: Set) => {
    const date = new Date(set.performed_at);
    const weekNumber = getISOWeek(date);
    const year = date.getFullYear();
    const weekKey = `${year}-W${String(weekNumber).padStart(2, '0')}`;

    // Initialize if not exists
    if (!scoreByWeekAndSkill.has(weekKey)) {
      scoreByWeekAndSkill.set(weekKey, { planche: 0, front: 0 });
    }

    // Calculate effective load
    const assistance = getAssistanceValue(set.assistance_type);
    const addedWeight = set.added_weight_kg || 0;
    const effectiveLoad = bodyweight_kg - assistance + addedWeight;

    // Calculate score
    let score = 0;
    if (set.movement === 'hold' || set.movement === 'negative') {
      score = (set.seconds || 0) * effectiveLoad;
    } else if (
      set.movement === 'press' ||
      set.movement === 'pushup' ||
      set.movement === 'combo'
    ) {
      score = (set.reps || 0) * effectiveLoad;
    }

    // Add to skill-specific score
    const skills = scoreByWeekAndSkill.get(weekKey)!;
    if (set.skill === 'planche') {
      skills.planche += score;
    } else if (set.skill === 'front') {
      skills.front += score;
    }
  });

  // Add combo loads
  for (const combo of combos || []) {
    // Get combo items
    const { data: items, error: itemsError } = await supabase
      .from('combo_items')
      .select('*')
      .eq('combo_id', combo.id)
      .order('order_index', { ascending: true });

    if (itemsError || !items) continue;

    // Calculate combo load
    const load = calculateComboLoad(
      items as ComboItem[],
      bodyweight_kg,
      combo.assistance_global_kg,
      combo.override_assistance_per_item
    );

    // Determine combo skill (if all items are same skill)
    const skillSet = new Set(items.map((i: ComboItem) => i.skill));
    let comboSkill: 'planche' | 'front' | null = null;
    if (skillSet.size === 1) {
      comboSkill = items[0].skill as 'planche' | 'front';
    }

    // Add to weekly score
    const date = new Date(combo.performed_at);
    const weekNumber = getISOWeek(date);
    const year = date.getFullYear();
    const weekKey = `${year}-W${String(weekNumber).padStart(2, '0')}`;

    // Initialize if not exists
    if (!scoreByWeekAndSkill.has(weekKey)) {
      scoreByWeekAndSkill.set(weekKey, { planche: 0, front: 0 });
    }

    // Add combo score to appropriate skill
    const skills = scoreByWeekAndSkill.get(weekKey)!;
    if (comboSkill === 'planche') {
      skills.planche += load.comboLoadScore;
    } else if (comboSkill === 'front') {
      skills.front += load.comboLoadScore;
    } else {
      // Mixed combo: split evenly
      const half = load.comboLoadScore / 2;
      skills.planche += half;
      skills.front += half;
    }
  }

  return Array.from(scoreByWeekAndSkill.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([week, skills]) => ({
      week,
      planche: Math.round(skills.planche),
      front: Math.round(skills.front),
    }));
}

/**
 * Get all active alerts for a user across all KPIs
 */
export async function getUserAlerts(userId: string): Promise<UserAlertSummary> {
  const client = await getServerSupabaseClient();
  
  // Get user bodyweight
  const { data: prefs } = await client
    .from('user_preferences')
    .select('bodyweight_kg')
    .eq('user_id', userId)
    .single();
  
  const bodyweight = prefs?.bodyweight_kg || 75;

  const allAlerts: KPIAlert[] = [];

  // Analyze each KPI combination
  const kpiConfigs = [
    { skill: 'planche', technique: 'full', movement: 'hold' },
    { skill: 'planche', technique: 'full', movement: 'press' },
    { skill: 'planche', technique: 'full', movement: 'negative' },
    { skill: 'planche', technique: 'adv_tuck', movement: 'hold' },
    { skill: 'planche', technique: 'adv_tuck', movement: 'press' },
    { skill: 'front', technique: 'full', movement: 'hold' },
    { skill: 'front', technique: 'full', movement: 'press' },
    { skill: 'front', technique: 'adv_tuck', movement: 'hold' },
  ];

  const assistanceLevels = [
    { type: 'none', kg: null },
    { type: 'band_5', kg: 5 },
    { type: 'band_15', kg: 15 },
    { type: 'band_25', kg: 25 },
  ];

  for (const config of kpiConfigs) {
    for (const assistance of assistanceLevels) {
      const alerts = await analyzeKPIForAlerts(
        client,
        userId,
        config.skill,
        config.technique,
        config.movement,
        assistance.type,
        assistance.kg,
        bodyweight
      );
      allAlerts.push(...alerts);
    }
  }

  // Sort by severity: critical > warning > info
  const severityOrder = { critical: 0, warning: 1, info: 2 };
  allAlerts.sort((a, b) => severityOrder[a.level] - severityOrder[b.level]);

  // Count by type
  const counts = {
    pain: allAlerts.filter(a => a.type === 'pain').length,
    fatigue: allAlerts.filter(a => a.type === 'fatigue').length,
    plateau: allAlerts.filter(a => a.type === 'plateau').length,
  };

  return {
    total_alerts: allAlerts.length,
    critical_alerts: allAlerts.filter(a => a.level === 'critical').length,
    warning_alerts: allAlerts.filter(a => a.level === 'warning').length,
    by_type: counts,
    alerts: allAlerts,
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatKPIName(
  skill: string,
  technique: string,
  movement: string,
  assistanceType: string,
  assistanceKg: number | null
): string {
  const skillName = skill === 'planche' ? 'Planche' : 'Front';
  const moveName = movement === 'hold' ? 'Hold' : movement === 'press' ? 'Dynamic' : movement === 'negative' ? 'Negative' : 'Move';
  const assistName = assistanceType === 'none' ? '(no assist)' : `(${assistanceKg}kg band)`;
  return `${skillName} ${moveName} ${assistName}`;
}

function generatePlateauRecommendation(movement: string): string {
  if (movement === 'hold' || movement === 'negative') {
    return '🔄 Switch stimulus for 7 days: Try easier progression + more reps, or increase set volume.';
  }
  return '🔄 Switch stimulus for 7 days: Try tempo work, paused reps, or controlled negatives.';
}

function generateFatigueRecommendation(): string {
  return '⚠️ Take 2–3 days off OR deload: -40% volume, no RPE>8, focus on form & mobility.';
}

function generatePainRecommendation(): string {
  return '🛑 Reduce intensity 3–5 days: +1 assistance level, lower RPE to 4–6, focus on perfect technique, no max efforts.';
}

function hasSharpKeyword(notes: string | null | undefined): boolean {
  if (!notes) return false;
  const lower = notes.toLowerCase();
  return lower.includes('sharp') || lower.includes('electric') || lower.includes('décharge');
}
