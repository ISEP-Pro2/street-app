import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { CoachContext, CoachSettings } from './types';
import { getUserLastNWeeksExposure, getSessionExposureData } from '@/lib/supabase/exposure';
import { aggregateByWeek, calcSessionExposure } from '@/lib/exposure';
import type { Skill } from '@/lib/exposure';

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
          } catch {}
        },
      },
    }
  );
}

/**
 * Get coach settings for user with fallback defaults
 */
export async function getCoachSettings(
  userId: string
): Promise<CoachSettings> {
  // For now, return defaults
  // In future, fetch from user_preferences or settings table
  return {
    focus_ratio_planche: 0.7,
    focus_ratio_front: 0.3,
    weekly_cap_increase: 0.1,
  };
}

/**
 * Build complete coach context from Supabase data
 */
export async function buildCoachContext(userId: string): Promise<CoachContext> {
  const supabase = await getServerSupabaseClient();
  const settings = await getCoachSettings(userId);

  try {
    // Get last 7 days data
    const last7dStart = new Date();
    last7dStart.setDate(last7dStart.getDate() - 7);
    const last7dDateStr = last7dStart.toISOString().split('T')[0];

    const { data: setsLast7d } = await supabase
      .from('sets')
      .select('seconds, reps, rpe, skill, movement, assistance_type, added_weight_kg')
      .eq('user_id', userId)
      .gte('performed_at', last7dDateStr);

    // Get last 28 days for trends
    const last28dStart = new Date();
    last28dStart.setDate(last28dStart.getDate() - 28);
    const last28dDateStr = last28dStart.toISOString().split('T')[0];

    const { data: setsLast28d } = await supabase
      .from('sets')
      .select('seconds, reps, rpe, skill, movement')
      .eq('user_id', userId)
      .gte('performed_at', last28dDateStr);

    // Get ETP exposure data (7 and 14 days for trend)
    const exposureData7d = await getUserLastNWeeksExposure(userId, 1); // 7 days = 1 week
    const exposureData14d = await getUserLastNWeeksExposure(userId, 2); // 14 days = 2 weeks
    
    // Get last session exposure
    const { data: lastSessionData } = await supabase
      .from('sessions')
      .select('id')
      .eq('user_id', userId)
      .order('performed_date', { ascending: false })
      .limit(1)
      .single();
    
    let lastSessionExposure = {
      raw_hold_seconds: 0,
      etp_seconds: 0,
      by_skill: { planche: 0, front: 0 },
    };
    
    if (lastSessionData) {
      const sessionSets = await getSessionExposureData(lastSessionData.id);
      const sessionExposureRaw = calcSessionExposure(sessionSets);
      lastSessionExposure = {
        raw_hold_seconds: sessionExposureRaw.raw_hold_seconds,
        etp_seconds: sessionExposureRaw.etp_seconds,
        by_skill: {
          planche: sessionExposureRaw.by_skill.planche.etp,
          front: sessionExposureRaw.by_skill.front.etp,
        },
      };
    }

    // Calculate 7-day stats
    const bodyweight = 75; // default, should fetch from user_preferences
    let globalLoad7d = 0;
    let planscheLoad7d = 0;
    let frontLoad7d = 0;
    let hardSets7d = 0;

    (setsLast7d || []).forEach((set: any) => {
      // Simple load calculation
      let setLoad = 0;
      if (set.movement === 'hold' || set.movement === 'negative') {
        setLoad = (set.seconds || 0) * bodyweight;
      } else {
        setLoad = (set.reps || 0) * bodyweight;
      }

      globalLoad7d += setLoad;
      if (set.skill === 'planche') {
        planscheLoad7d += setLoad;
      } else if (set.skill === 'front') {
        frontLoad7d += setLoad;
      }

      if ((set.rpe || 0) >= 8) {
        hardSets7d++;
      }
    });

    // Calculate 28-day trend
    const load28d: number[] = [];
    (setsLast28d || []).forEach((set: any) => {
      const setLoad = (set.movement === 'hold' || set.movement === 'negative')
        ? (set.seconds || 0) * bodyweight
        : (set.reps || 0) * bodyweight;
      load28d.push(setLoad);
    });

    // Get last session status
    const { data: lastSession } = await supabase
      .from('planned_sessions')
      .select('status, date')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(1)
      .single();

    // Get KPIs (personal bests)
    const { data: plancheBests } = await supabase
      .from('sets')
      .select('seconds, reps')
      .eq('user_id', userId)
      .eq('skill', 'planche')
      .order('seconds', { ascending: false })
      .limit(1);

    const { data: frontBests } = await supabase
      .from('sets')
      .select('seconds, reps')
      .eq('user_id', userId)
      .eq('skill', 'front')
      .order('seconds', { ascending: false })
      .limit(1);

    // Calculate weekly aggregations for exposure
    const aggregated7d = aggregateByWeek(exposureData7d);
    const aggregated14d = aggregateByWeek(exposureData14d);
    
    // Get 7-day and 14-day totals
    const exposure7d = aggregated7d.length > 0 
      ? {
          raw_hold_seconds: aggregated7d[aggregated7d.length - 1].raw_hold_seconds,
          etp_seconds: aggregated7d[aggregated7d.length - 1].etp_seconds,
          by_skill: {
            planche: aggregated7d[aggregated7d.length - 1].by_skill.planche.etp,
            front: aggregated7d[aggregated7d.length - 1].by_skill.front.etp,
          },
        }
      : { raw_hold_seconds: 0, etp_seconds: 0, by_skill: { planche: 0, front: 0 } };
    
    const exposure14d = aggregated14d.length > 1 
      ? {
          raw_hold_seconds: aggregated14d[aggregated14d.length - 2].raw_hold_seconds,
          etp_seconds: aggregated14d[aggregated14d.length - 2].etp_seconds,
          by_skill: {
            planche: aggregated14d[aggregated14d.length - 2].by_skill.planche.etp,
            front: aggregated14d[aggregated14d.length - 2].by_skill.front.etp,
          },
        }
      : { raw_hold_seconds: 0, etp_seconds: 0, by_skill: { planche: 0, front: 0 } };
    
    const etp_trend_percent = exposure14d.etp_seconds > 0
      ? Math.round(((exposure7d.etp_seconds - exposure14d.etp_seconds) / exposure14d.etp_seconds) * 100)
      : 0;

    return {
      last_7d: {
        global_load: Math.round(globalLoad7d),
        planche_load: Math.round(planscheLoad7d),
        front_load: Math.round(frontLoad7d),
        hard_sets: hardSets7d,
        pain_flags_count: 0,
      },
      last_28d: {
        load_trend: load28d,
        kpi_trend: load28d,
      },
      kpis: {
        planche_hold_best: plancheBests?.[0]?.seconds || 0,
        planche_press_best: plancheBests?.[0]?.reps || 0,
        front_hold_best: frontBests?.[0]?.seconds || 0,
        front_pullup_best: frontBests?.[0]?.reps || 0,
      },
      last_session: {
        status: (lastSession?.status as any) || null,
        date: lastSession?.date || null,
      },
      exposure: {
        last_session: lastSessionExposure,
        last_7d: {
          raw_hold_seconds: Math.round(exposure7d.raw_hold_seconds),
          etp_seconds: Math.round(exposure7d.etp_seconds),
          by_skill: {
            planche: Math.round(exposure7d.by_skill.planche),
            front: Math.round(exposure7d.by_skill.front),
          },
        },
        trend_7d_vs_14d: {
          etp_change_percent: etp_trend_percent,
        },
      },
    };
  } catch (error) {
    console.error('[Coach] buildCoachContext error:', error);
    throw error;
  }
}
