import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// POST /api/coach/plan/status
// Update status of a planned session: done | skipped
export async function POST(request: NextRequest) {
  const logs: string[] = [];
  const log = (msg: string) => {
    const timestamp = new Date().toISOString();
    const message = `[${timestamp}] ${msg}`;
    console.log(message);
    logs.push(message);
  };

  try {
    log('📍 Updating planned session status...');
    
    const body = await request.json();
    const { planned_session_id, status, skip_reason = null } = body;
    
    log(`📌 Session ID: ${planned_session_id}`);
    log(`📊 New status: ${status}`);
    if (skip_reason) log(`📝 Skip reason: ${skip_reason}`);

    if (!['done', 'skipped'].includes(status)) {
      log(`❌ Invalid status: ${status}`);
      return NextResponse.json({ error: 'Invalid status', logs }, { status: 400 });
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
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

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      log('❌ User not authenticated');
      return NextResponse.json({ error: 'Unauthorized', logs }, { status: 401 });
    }

    log(`✅ User authenticated: ${user.id}`);

    // Verify ownership before updating
    const { data: existingSession, error: fetchError } = await supabase
      .from('planned_sessions')
      .select('*')
      .eq('id', planned_session_id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existingSession) {
      log(`❌ Session not found or not owned by user`);
      return NextResponse.json({ error: 'Session not found', logs }, { status: 404 });
    }

    // Update the session
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'done') {
      updateData.completed_at = new Date().toISOString();
    }

    if (status === 'skipped' && skip_reason) {
      updateData.skip_reason = skip_reason;
    }

    const { data: updatedSession, error: updateError } = await supabase
      .from('planned_sessions')
      .update(updateData)
      .eq('id', planned_session_id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      log(`❌ Failed to update session: ${updateError.message}`);
      return NextResponse.json({ error: updateError.message, logs }, { status: 500 });
    }

    log(`✅ Session updated successfully (status: ${updatedSession.status})`);
    return NextResponse.json({ planned_session: updatedSession, logs }, { status: 200 });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    log(`❌ Error: ${errorMsg}`);
    return NextResponse.json({ error: errorMsg, logs }, { status: 500 });
  }
}
