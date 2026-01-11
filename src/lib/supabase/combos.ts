/**
 * SUPABASE COMBO CLIENT
 * 
 * CRUD operations for combos and combo_items tables
 * All queries are RLS-filtered by user_id
 */

import { Combo, ComboItem } from '@/types';
import { createClient as getServerSupabaseClient } from './server';

/**
 * Get combos for a specific session
 */
export async function getCombosBySession(sessionId: string): Promise<Combo[]> {
  const client = await getServerSupabaseClient();

  const { data, error } = await client
    .from('combos')
    .select('*')
    .eq('session_id', sessionId)
    .order('performed_at', { ascending: false });

  if (error) {
    console.error('Error fetching combos by session:', error);
    return [];
  }

  return (data || []) as Combo[];
}

/**
 * Get combo items for a specific combo
 */
export async function getComboItems(comboId: string): Promise<ComboItem[]> {
  const client = await getServerSupabaseClient();

  const { data, error } = await client
    .from('combo_items')
    .select('*')
    .eq('combo_id', comboId)
    .order('order_index', { ascending: true });

  if (error) {
    console.error('Error fetching combo items:', error);
    return [];
  }

  return (data || []) as ComboItem[];
}

/**
 * Get combo with all items loaded
 */
export async function getComboDetail(comboId: string): Promise<Combo | null> {
  const client = await getServerSupabaseClient();

  const { data, error } = await client
    .from('combos')
    .select('*')
    .eq('id', comboId)
    .single();

  if (error || !data) {
    console.error('Error fetching combo:', error);
    return null;
  }

  const items = await getComboItems(comboId);

  return {
    ...(data as Combo),
    items,
  };
}

/**
 * Create a new combo with items
 * 
 * Steps:
 * 1. Insert combo row
 * 2. Insert combo_items rows with order_index
 * 3. Return created combo with items
 */
export async function createCombo(
  userId: string,
  sessionId: string,
  assistanceGlobalKg: number,
  overrideAssistancePerItem: boolean,
  rpeGlobal: number | undefined,
  formGlobal: string,
  items: Array<{
    skill: string;
    technique: string;
    movement: string;
    seconds?: number;
    reps?: number;
    assistanceKg?: number;
    formQuality?: string;
    notes?: string;
  }>,
  notes?: string
): Promise<Combo | null> {
  const client = await getServerSupabaseClient();

  // 1. Insert combo
  const { data: comboData, error: comboError } = await client
    .from('combos')
    .insert({
      user_id: userId,
      session_id: sessionId,
      assistance_global_kg: assistanceGlobalKg,
      override_assistance_per_item: overrideAssistancePerItem,
      rpe_global: rpeGlobal,
      form_global: formGlobal,
      notes,
      performed_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (comboError || !comboData) {
    console.error('Error creating combo:', comboError);
    return null;
  }

  const comboId = (comboData as Combo).id;

  // 2. Insert combo items
  const itemsToInsert = items.map((item, index) => ({
    combo_id: comboId,
    user_id: userId,
    order_index: index,
    skill: item.skill,
    technique: item.technique,
    movement: item.movement,
    seconds: item.seconds || null,
    reps: item.reps || null,
    assistance_kg: overrideAssistancePerItem ? item.assistanceKg || null : null,
    form_quality: item.formQuality || null,
    notes: item.notes || null,
  }));

  const { error: itemsError } = await client
    .from('combo_items')
    .insert(itemsToInsert);

  if (itemsError) {
    console.error('Error creating combo items:', itemsError);
    // Rollback combo creation
    await client.from('combos').delete().eq('id', comboId);
    return null;
  }

  // 3. Return combo with items
  return await getComboDetail(comboId);
}

/**
 * Update combo metadata (not items)
 * Can update: assistance_global_kg, override_assistance_per_item, rpe_global, form_global, notes
 */
export async function updateCombo(
  comboId: string,
  updates: Partial<{
    assistance_global_kg: number;
    override_assistance_per_item: boolean;
    rpe_global: number | null;
    form_global: string;
    notes: string | null;
  }>
): Promise<Combo | null> {
  const client = await getServerSupabaseClient();

  const { error } = await client
    .from('combos')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', comboId);

  if (error) {
    console.error('Error updating combo:', error);
    return null;
  }

  return await getComboDetail(comboId);
}

/**
 * Update a combo item
 */
export async function updateComboItem(
  itemId: string,
  updates: Partial<{
    seconds: number | null;
    reps: number | null;
    assistance_kg: number | null;
    form_quality: string | null;
    notes: string | null;
  }>
): Promise<ComboItem | null> {
  const client = await getServerSupabaseClient();

  const { data, error } = await client
    .from('combo_items')
    .update(updates)
    .eq('id', itemId)
    .select()
    .single();

  if (error) {
    console.error('Error updating combo item:', error);
    return null;
  }

  return (data || null) as ComboItem | null;
}

/**
 * Delete a combo item
 * Cascade delete is handled by database
 */
export async function deleteComboItem(itemId: string): Promise<boolean> {
  const client = await getServerSupabaseClient();

  const { error } = await client
    .from('combo_items')
    .delete()
    .eq('id', itemId);

  if (error) {
    console.error('Error deleting combo item:', error);
    return false;
  }

  return true;
}

/**
 * Delete a combo and all its items (cascade)
 */
export async function deleteCombo(comboId: string): Promise<boolean> {
  const client = await getServerSupabaseClient();

  const { error } = await client
    .from('combos')
    .delete()
    .eq('id', comboId);

  if (error) {
    console.error('Error deleting combo:', error);
    return false;
  }

  return true;
}

/**
 * Get all combos for a user in a date range
 * Used for history view
 */
export async function getCombosByDateRange(
  userId: string,
  fromDate: string,
  toDate: string
): Promise<Combo[]> {
  const client = await getServerSupabaseClient();

  const { data, error } = await client
    .from('combos')
    .select('*')
    .eq('user_id', userId)
    .gte('performed_at', fromDate)
    .lte('performed_at', toDate)
    .order('performed_at', { ascending: false });

  if (error) {
    console.error('Error fetching combos by date range:', error);
    return [];
  }

  return (data || []) as Combo[];
}

/**
 * Get total combo load for a session
 * Used for session load calculation
 * 
 * Note: actual load calculation happens in app layer using calculateComboLoad()
 */
export async function getSessionComboIds(sessionId: string): Promise<string[]> {
  const client = await getServerSupabaseClient();

  const { data, error } = await client
    .from('combos')
    .select('id')
    .eq('session_id', sessionId);

  if (error) {
    console.error('Error fetching session combo IDs:', error);
    return [];
  }

  return (data || []).map(row => (row as { id: string }).id);
}
