/**
 * EXPOSURE DATA QUERIES
 * Fetch hold data from sets and combos for ETP calculations
 */

import { createClient as getServerSupabaseClient } from './server';
import type { ExposureEntry, ExposureEntryWithDate } from '@/lib/exposure';

export async function getSessionExposureData(sessionId: string): Promise<ExposureEntry[]> {
  const client = await getServerSupabaseClient();

  const entries: ExposureEntry[] = [];

  // Fetch sets with holds
  const { data: sets } = await client
    .from('sets')
    .select('skill, technique, movement, seconds, assistance_kg')
    .eq('session_id', sessionId)
    .eq('movement', 'hold');

  if (sets) {
    entries.push(
      ...sets.map((s) => ({
        skill: s.skill as 'planche' | 'front',
        technique: s.technique,
        movement: s.movement,
        seconds: s.seconds || 0,
        assistance_kg: s.assistance_kg || 0,
      }))
    );
  }

  // Fetch combos and their items with holds
  const { data: combos } = await client
    .from('combos')
    .select('id, assistance_global_kg, override_assistance_per_item')
    .eq('session_id', sessionId);

  if (combos) {
    for (const combo of combos) {
      const { data: items } = await client
        .from('combo_items')
        .select('skill, technique, movement, seconds, assistance_kg')
        .eq('combo_id', combo.id)
        .eq('movement', 'hold');

      if (items) {
        entries.push(
          ...items.map((item) => ({
            skill: item.skill as 'planche' | 'front',
            technique: item.technique,
            movement: item.movement,
            seconds: item.seconds || 0,
            assistance_kg:
              combo.override_assistance_per_item && item.assistance_kg
                ? item.assistance_kg
                : combo.assistance_global_kg,
          }))
        );
      }
    }
  }

  return entries;
}

export async function getUserLastNWeeksExposure(
  userId: string,
  weeks: number = 4
): Promise<ExposureEntryWithDate[]> {
  const client = await getServerSupabaseClient();

  const entries: ExposureEntryWithDate[] = [];

  // Calculate date range
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - weeks * 7);

  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];

  // Fetch sets with holds from date range
  const { data: sets } = await client
    .from('sets')
    .select('skill, technique, movement, seconds, assistance_kg, performed_at')
    .eq('user_id', userId)
    .eq('movement', 'hold')
    .gte('performed_at', `${startDateStr}T00:00:00`)
    .lte('performed_at', `${endDateStr}T23:59:59`);

  if (sets) {
    entries.push(
      ...sets.map((s) => ({
        skill: s.skill as 'planche' | 'front',
        technique: s.technique,
        movement: s.movement,
        seconds: s.seconds || 0,
        assistance_kg: s.assistance_kg || 0,
        date: new Date(s.performed_at),
      }))
    );
  }

  // Fetch combos and their items with holds from date range
  const { data: combos } = await client
    .from('combos')
    .select('id, assistance_global_kg, override_assistance_per_item, performed_at')
    .eq('user_id', userId)
    .gte('performed_at', `${startDateStr}T00:00:00`)
    .lte('performed_at', `${endDateStr}T23:59:59`);

  if (combos) {
    for (const combo of combos) {
      const { data: items } = await client
        .from('combo_items')
        .select('skill, technique, movement, seconds, assistance_kg')
        .eq('combo_id', combo.id)
        .eq('movement', 'hold');

      if (items) {
        entries.push(
          ...items.map((item) => ({
            skill: item.skill as 'planche' | 'front',
            technique: item.technique,
            movement: item.movement,
            seconds: item.seconds || 0,
            assistance_kg:
              combo.override_assistance_per_item && item.assistance_kg
                ? item.assistance_kg
                : combo.assistance_global_kg,
            date: new Date(combo.performed_at),
          }))
        );
      }
    }
  }

  return entries;
}
