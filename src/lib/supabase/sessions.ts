/**
 * SUPABASE SESSIONS CLIENT
 * 
 * Session management utilities
 */

import { Session } from '@/types';
import { createClient as getServerSupabaseClient } from './server';

/**
 * Get or create a session for today
 * If no session exists for today, creates one
 */
export async function getOrCreateTodaySession(): Promise<Session | null> {
  const client = await getServerSupabaseClient();
  
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    console.error('User not authenticated');
    return null;
  }

  const today = new Date().toISOString().split('T')[0];

  // Check if session exists
  const { data: existingSession, error: fetchError } = await client
    .from('sessions')
    .select('*')
    .eq('user_id', user.id)
    .eq('session_date', today)
    .single();

  if (existingSession) {
    return existingSession as Session;
  }

  // Create new session
  const { data: newSession, error: createError } = await client
    .from('sessions')
    .insert({
      user_id: user.id,
      session_date: today,
    })
    .select()
    .single();

  if (createError || !newSession) {
    console.error('Error creating session:', createError);
    return null;
  }

  return newSession as Session;
}

/**
 * Get a session by date
 */
export async function getSessionByDate(date: string): Promise<Session | null> {
  const client = await getServerSupabaseClient();

  const { data, error } = await client
    .from('sessions')
    .select('*')
    .eq('session_date', date)
    .single();

  if (error || !data) {
    return null;
  }

  return data as Session;
}

/**
 * Get all sessions for a date range
 */
export async function getSessionsByDateRange(
  fromDate: string,
  toDate: string
): Promise<Session[]> {
  const client = await getServerSupabaseClient();

  const { data, error } = await client
    .from('sessions')
    .select('*')
    .gte('session_date', fromDate)
    .lte('session_date', toDate)
    .order('session_date', { ascending: false });

  if (error) {
    return [];
  }

  return (data || []) as Session[];
}
