'use server';

import { createClient } from '@/lib/supabase/server';
import { Combo, ComboItem } from '@/types';

/**
 * Server Action: Create a combo with items
 */
export async function createComboAction(
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
): Promise<{ success: boolean; comboId?: string; error?: string }> {
  try {
    const supabase = await createClient();
    
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Insert combo
    const { data: comboData, error: comboError } = await supabase
      .from('combos')
      .insert({
        user_id: user.id,
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
      return { success: false, error: comboError?.message || 'Failed to create combo' };
    }

    const comboId = (comboData as any).id;

    // Insert combo items
    const itemsToInsert = items.map((item, index) => ({
      combo_id: comboId,
      user_id: user.id,
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

    const { error: itemsError } = await supabase
      .from('combo_items')
      .insert(itemsToInsert);

    if (itemsError) {
      // Rollback combo
      await supabase.from('combos').delete().eq('id', comboId);
      return { success: false, error: itemsError.message };
    }

    return { success: true, comboId };
  } catch (error) {
    console.error('Error creating combo:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Server Action: Get today's session (or create if missing)
 */
export async function getOrCreateSessionAction(): Promise<{ sessionId?: string; sessionDate?: string; error?: string }> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Not authenticated' };
    }

    const today = new Date().toISOString().split('T')[0];

    // Check if session exists
    const { data: existingSession } = await supabase
      .from('sessions')
      .select('id')
      .eq('user_id', user.id)
      .eq('session_date', today)
      .single();

    if (existingSession) {
      return { sessionId: (existingSession as any).id, sessionDate: today };
    }

    // Create new session
    const { data: newSession, error: createError } = await supabase
      .from('sessions')
      .insert({
        user_id: user.id,
        session_date: today,
      })
      .select('id')
      .single();

    if (createError || !newSession) {
      return { error: createError?.message || 'Failed to create session' };
    }

    return { sessionId: (newSession as any).id, sessionDate: today };
  } catch (error) {
    console.error('Error getting or creating session:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Server Action: Get user preferences
 */
export async function getUserPreferencesAction(): Promise<{ bodyweight?: number; error?: string }> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Not authenticated' };
    }

    const { data, error } = await supabase
      .from('user_preferences')
      .select('bodyweight_kg')
      .eq('user_id', user.id)
      .single();

    if (error) {
      return { bodyweight: 75 }; // Default
    }

    return { bodyweight: (data as any)?.bodyweight_kg || 75 };
  } catch (error) {
    console.error('Error getting user preferences:', error);
    return { bodyweight: 75 };
  }
}
