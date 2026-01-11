/**
 * SUPABASE USER CLIENT
 * 
 * User preferences and data management
 */

import { UserPreferences } from '@/types';
import { createClient as getServerSupabaseClient } from './server';

/**
 * Get user preferences (bodyweight, primary focus, etc.)
 */
export async function getUserPreferences(): Promise<UserPreferences | null> {
  const client = await getServerSupabaseClient();

  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    console.error('User not authenticated');
    return null;
  }

  const { data, error } = await client
    .from('user_preferences')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error || !data) {
    console.error('Error fetching user preferences:', error);
    return null;
  }

  return data as UserPreferences;
}

/**
 * Update user preferences
 */
export async function updateUserPreferences(
  updates: Partial<UserPreferences>
): Promise<UserPreferences | null> {
  const client = await getServerSupabaseClient();

  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    console.error('User not authenticated');
    return null;
  }

  const { data, error } = await client
    .from('user_preferences')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', user.id)
    .select()
    .single();

  if (error || !data) {
    console.error('Error updating user preferences:', error);
    return null;
  }

  return data as UserPreferences;
}

/**
 * Get current user ID
 */
export async function getCurrentUserId(): Promise<string | null> {
  const client = await getServerSupabaseClient();

  const {
    data: { user },
  } = await client.auth.getUser();

  return user?.id || null;
}
