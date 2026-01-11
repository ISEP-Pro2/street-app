/**
 * COMBO LOAD CALCULATION UTILITIES
 * 
 * Handles scoring and load calculation for combo sequences.
 * Includes chaining bonus based on item count and movement diversity.
 */

import { ComboItem, ComboLoadCalculation } from '@/types';

/**
 * Calculate effective load for a single item
 * effectiveLoad = bodyweight - assistance + added_weight (always 0 for combos v1)
 */
export function calculateEffectiveLoad(
  bodyweightKg: number,
  assistanceKg: number = 0,
  addedWeightKg: number = 0
): number {
  return Math.max(0, bodyweightKg - assistanceKg + addedWeightKg);
}

/**
 * Calculate score for a single item
 * - Hold: score = seconds * effectiveLoad
 * - Other movements: score = reps * effectiveLoad
 */
export function calculateItemScore(
  item: ComboItem,
  effectiveLoad: number
): number {
  if (item.movement === 'hold') {
    if (item.seconds === undefined || item.seconds <= 0) {
      return 0;
    }
    return item.seconds * effectiveLoad;
  }

  // Press, PushUp, PullUp, Negative
  if (item.reps === undefined || item.reps < 1) {
    return 0;
  }
  return item.reps * effectiveLoad;
}

/**
 * Calculate base combo score
 * baseComboScore = sum of all item scores
 */
export function calculateBaseComboScore(
  items: ComboItem[],
  bodyweightKg: number,
  globalAssistanceKg: number,
  overridePerItem: boolean
): number {
  return items.reduce((sum, item) => {
    const assistanceKg = overridePerItem && item.assistance_kg !== undefined
      ? item.assistance_kg
      : globalAssistanceKg;
    
    const effectiveLoad = calculateEffectiveLoad(bodyweightKg, assistanceKg, 0);
    const itemScore = calculateItemScore(item, effectiveLoad);
    return sum + itemScore;
  }, 0);
}

/**
 * Calculate chain factor bonus
 * chainFactor = 1 + 0.07*(n-1) + 0.05*(distinctMovements-1)
 * clamp to [1.0, 2.0]
 * 
 * Incentivizes:
 * - Adding more items to the combo (7% per item)
 * - Varying movements (5% per unique movement type)
 */
export function calculateChainFactor(
  itemCount: number,
  distinctMovements: number
): number {
  if (itemCount < 1) {
    return 1.0;
  }

  const chainFactor = 1.0 
    + 0.07 * (itemCount - 1) 
    + 0.05 * (distinctMovements - 1);

  return Math.min(2.0, Math.max(1.0, chainFactor));
}

/**
 * Calculate combo load score
 * comboLoadScore = baseComboScore * chainFactor
 */
export function calculateComboLoadScore(
  baseComboScore: number,
  chainFactor: number
): number {
  return baseComboScore * chainFactor;
}

/**
 * Full combo load calculation
 * Returns breakdown of all scoring components
 */
export function calculateComboLoad(
  items: ComboItem[],
  bodyweightKg: number,
  globalAssistanceKg: number,
  overridePerItem: boolean
): ComboLoadCalculation {
  if (items.length === 0) {
    return {
      itemScore: 0,
      baseComboScore: 0,
      chainFactor: 1.0,
      comboLoadScore: 0,
      distinctMovements: 0,
      itemCount: 0,
    };
  }

  // Count unique movements
  const uniqueMovements = new Set(items.map(item => item.movement));
  const distinctMovements = uniqueMovements.size;

  // Calculate base score
  const baseComboScore = calculateBaseComboScore(
    items,
    bodyweightKg,
    globalAssistanceKg,
    overridePerItem
  );

  // Calculate chain factor
  const chainFactor = calculateChainFactor(items.length, distinctMovements);

  // Calculate combo load
  const comboLoadScore = calculateComboLoadScore(baseComboScore, chainFactor);

  return {
    itemScore: baseComboScore, // For compatibility with display
    baseComboScore,
    chainFactor,
    comboLoadScore,
    distinctMovements,
    itemCount: items.length,
  };
}

/**
 * Calculate session load including both sets and combos
 * globalLoad = sum(set scores) + sum(combo load scores)
 */
export function calculateSessionGlobalLoad(
  setsLoad: number,
  combosLoad: number
): number {
  return setsLoad + combosLoad;
}

/**
 * Format combo type for display
 * Returns "PLANCHE", "FRONT", or "MIX" based on items
 */
export function formatComboType(items: ComboItem[]): string {
  const skills = new Set(items.map(item => item.skill));

  if (skills.size === 0) {
    return 'EMPTY';
  }
  if (skills.size === 2) {
    return 'MIX';
  }
  if (skills.has('planche')) {
    return 'PLANCHE';
  }
  if (skills.has('front')) {
    return 'FRONT';
  }
  return 'UNKNOWN';
}

/**
 * Get allowed techniques for a given skill
 */
export function getAllowedTechniques(skill: 'planche' | 'front'): string[] {
  if (skill === 'planche') {
    return ['lean', 'tuck', 'adv_tuck', 'straddle', 'full', 'maltese'];
  }
  return ['tuck', 'adv_tuck', 'full'];
}

/**
 * Get allowed movements for a given skill
 */
export function getAllowedMovements(skill: 'planche' | 'front'): string[] {
  if (skill === 'planche') {
    return ['hold', 'press', 'negative', 'pushup'];
  }
  return ['hold', 'pullup', 'negative', 'press'];
}

/**
 * Validate combo item based on movement type
 * - hold: requires seconds > 0
 * - others: requires reps >= 1
 */
export function validateComboItem(
  movement: string,
  seconds?: number,
  reps?: number
): { valid: boolean; error?: string } {
  if (movement === 'hold') {
    if (seconds === undefined || seconds <= 0) {
      return { valid: false, error: 'Hold requires seconds > 0' };
    }
    if (reps !== undefined && reps !== null) {
      return { valid: false, error: 'Hold should not have reps' };
    }
  } else {
    // Press, PushUp, PullUp, Negative
    if (reps === undefined || reps < 1) {
      return { valid: false, error: `${movement} requires reps >= 1` };
    }
    if (seconds !== undefined && seconds !== null) {
      return { valid: false, error: `${movement} should not have seconds` };
    }
  }
  return { valid: true };
}
