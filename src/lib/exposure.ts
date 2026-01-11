/**
 * Exposure Tracking (ETP - Effective Technical Exposure)
 * Calculates weighted technical exposure for planche and front lever
 */

export type Skill = 'planche' | 'front';

export interface ExposureEntry {
  skill: Skill;
  technique: string;
  movement: string;
  seconds?: number;
  reps?: number;
  assistance_kg?: number;
}

export interface WeeklyExposure {
  week: string; // YYYY-W##
  raw_hold_seconds: number;
  etp_seconds: number;
  by_skill: {
    planche: { raw: number; etp: number };
    front: { raw: number; etp: number };
  };
}

// Assistance factor: higher assistance = lower factor
export function getAssistanceFactor(assistanceKg: number = 0): number {
  if (assistanceKg <= 0) return 1.0;
  if (assistanceKg <= 5) return 0.85;
  if (assistanceKg <= 15) return 0.65;
  if (assistanceKg <= 25) return 0.45;
  return 0.3; // very high assistance
}

// Technique factor - Planche
export function getPlancheTechniqueFactor(technique: string): number {
  switch (technique?.toLowerCase()) {
    case 'lean':
      return 0.35;
    case 'tuck':
      return 0.45;
    case 'adv_tuck':
    case 'advtuck':
    case 'adv-tuck':
      return 0.65;
    case 'straddle':
      return 0.85;
    case 'full':
      return 1.0;
    case 'maltese':
      return 1.1;
    default:
      return 0.45; // default to tuck
  }
}

// Technique factor - Front Lever
export function getFrontTechniqueFactor(technique: string): number {
  switch (technique?.toLowerCase()) {
    case 'tuck':
      return 0.5;
    case 'adv_tuck':
    case 'advtuck':
    case 'adv-tuck':
      return 0.7;
    case 'full':
      return 1.0;
    default:
      return 0.5; // default to tuck
  }
}

export function getTechniqueFactor(skill: Skill, technique: string): number {
  if (skill === 'planche') {
    return getPlancheTechniqueFactor(technique);
  } else if (skill === 'front') {
    return getFrontTechniqueFactor(technique);
  }
  return 0.5;
}

// Movement exposure factor - only holds count
export function getMovementExposureFactor(movement: string): number {
  const m = movement?.toLowerCase();
  if (m === 'hold') return 1.0;
  // press, pullup, pushup, negative don't count for ETP
  return 0.0;
}

// Calculate ETP seconds for a single entry
export function calcEntryETPSeconds(entry: ExposureEntry): number {
  // Only count holds
  if (!entry.seconds || getMovementExposureFactor(entry.movement) === 0) {
    return 0;
  }

  const assistanceFactor = getAssistanceFactor(entry.assistance_kg);
  const techniqueFactor = getTechniqueFactor(entry.skill as Skill, entry.technique);
  const movementFactor = getMovementExposureFactor(entry.movement);

  return entry.seconds * techniqueFactor * assistanceFactor * movementFactor;
}

// Get ISO week from date
function getISOWeek(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

export interface ExposureEntryWithDate extends ExposureEntry {
  date: Date;
}

// Aggregate entries by week
export function aggregateByWeek(entries: ExposureEntryWithDate[]): WeeklyExposure[] {
  const weekMap = new Map<string, WeeklyExposure>();

  for (const entry of entries) {
    const week = getISOWeek(entry.date);

    if (!weekMap.has(week)) {
      weekMap.set(week, {
        week,
        raw_hold_seconds: 0,
        etp_seconds: 0,
        by_skill: {
          planche: { raw: 0, etp: 0 },
          front: { raw: 0, etp: 0 },
        },
      });
    }

    const weekData = weekMap.get(week)!;
    const skill = entry.skill as Skill;
    const isHold = getMovementExposureFactor(entry.movement) > 0;

    if (isHold && entry.seconds) {
      // Add to raw hold seconds
      weekData.raw_hold_seconds += entry.seconds;
      weekData.by_skill[skill].raw += entry.seconds;

      // Add to ETP
      const etp = calcEntryETPSeconds(entry);
      weekData.etp_seconds += etp;
      weekData.by_skill[skill].etp += etp;
    }
  }

  return Array.from(weekMap.values()).sort((a, b) => a.week.localeCompare(b.week));
}

// Get the most recent week's exposure
export function getLatestWeekExposure(weeklyData: WeeklyExposure[]): WeeklyExposure | null {
  return weeklyData.length > 0 ? weeklyData[weeklyData.length - 1] : null;
}

// Get total exposure across all weeks
export function getTotalExposure(weeklyData: WeeklyExposure[]): {
  raw_hold_seconds: number;
  etp_seconds: number;
} {
  return weeklyData.reduce(
    (acc, week) => ({
      raw_hold_seconds: acc.raw_hold_seconds + week.raw_hold_seconds,
      etp_seconds: acc.etp_seconds + week.etp_seconds,
    }),
    { raw_hold_seconds: 0, etp_seconds: 0 }
  );
}

// Calculate ETP per session
export function calcSessionExposure(entries: ExposureEntry[]): {
  raw_hold_seconds: number;
  etp_seconds: number;
  by_skill: { planche: { raw: number; etp: number }; front: { raw: number; etp: number } };
} {
  let raw_hold_seconds = 0;
  let etp_seconds = 0;
  const by_skill = {
    planche: { raw: 0, etp: 0 },
    front: { raw: 0, etp: 0 },
  };

  for (const entry of entries) {
    const isHold = getMovementExposureFactor(entry.movement) > 0;

    if (isHold && entry.seconds) {
      raw_hold_seconds += entry.seconds;
      const skill = entry.skill as Skill;
      by_skill[skill].raw += entry.seconds;

      const etp = calcEntryETPSeconds(entry);
      etp_seconds += etp;
      by_skill[skill].etp += etp;
    }
  }

  return { raw_hold_seconds, etp_seconds, by_skill };
}
