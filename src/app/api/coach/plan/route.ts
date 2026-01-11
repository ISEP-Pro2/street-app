import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { generateCoachPlan, calculateContextHash } from '@/lib/coach/openai-service';
import { buildCoachContext, getCoachSettings, getServerSupabaseClient } from '@/lib/coach/context-builder';

// GET /api/coach/plan?date=YYYY-MM-DD
// Returns existing planned_session for that date, or null if none exists
export async function GET(request: NextRequest) {
  const logs: string[] = [];
  const log = (msg: string) => {
    const timestamp = new Date().toISOString();
    const message = `[${timestamp}] ${msg}`;
    console.log(message);
    logs.push(message);
  };

  try {
    log('📍 Fetching planned session...');
    
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    log(`📅 Requested date: ${date}`);

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

    const { data: plannedSession, error } = await supabase
      .from('planned_sessions')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', date)
      .single();

    if (error && error.code !== 'PGRST116') {
      log(`⚠️ Error fetching plan: ${error.message}`);
      return NextResponse.json({ error: error.message, logs }, { status: 500 });
    }

    if (!plannedSession) {
      log('📋 No planned session found for this date');
      return NextResponse.json({ planned_session: null, logs }, { status: 200 });
    }

    log(`✅ Found planned session: ${plannedSession.id} (status: ${plannedSession.status})`);
    return NextResponse.json({ planned_session: plannedSession, logs }, { status: 200 });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    log(`❌ Error: ${errorMsg}`);
    return NextResponse.json({ error: errorMsg, logs }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const logs: string[] = [];
  
  const log = (msg: string) => {
    const timestamp = new Date().toISOString();
    const message = `[${timestamp}] ${msg}`;
    console.log(message);
    logs.push(message);
  };

  try {
    log('📍 Starting coach plan generation...');
    
    const body = await request.json();
    const { date = null } = body;
    log(`📍 Request body: date=${date}`);

    // Get the authenticated user
    log('🔐 Getting authentication...');
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

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      log('❌ User not authenticated');
      return NextResponse.json(
        { error: 'Unauthorized', logs },
        { status: 401 }
      );
    }
    
    log(`✅ User authenticated: ${user.id}`);

    // Use provided date or today
    const targetDate = date || new Date().toISOString().split('T')[0];
    log(`📅 Target date: ${targetDate}`);

    // Check if planned session already exists for today
    log('🔍 Checking for existing plan...');
    const { data: existingPlan, error: checkError } = await supabase
      .from('planned_sessions')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', targetDate)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      log(`⚠️ Error checking existing plan: ${checkError.message}`);
    }

    if (existingPlan) {
      log(`✅ Found existing plan (cache hit for date ${targetDate})`);
      return NextResponse.json(
        {
          source: 'cache',
          planned_session_id: existingPlan.id,
          plan_json: existingPlan.plan_json,
          logs,
        },
        { status: 200 }
      );
    }
    
    log('📋 No existing plan found, building context...');

    // Get settings and context
    log('⚙️ Getting coach settings...');
    const [settings, context] = await Promise.all([
      getCoachSettings(user.id),
      buildCoachContext(user.id),
    ]);
    
    log(`✅ Settings retrieved: planche=${settings.focus_ratio_planche}, front=${settings.focus_ratio_front}`);
    log(`✅ Context built: 7d_load=${context.last_7d.global_load}, 28d_sessions=${context.last_28d.load_trend.length}`);

    // Calculate context hash
    log('🔐 Calculating context hash...');
    const contextHash = calculateContextHash(settings, context);
    log(`✅ Context hash: ${contextHash}`);

    // Check if last plan has same context hash
    log('🔍 Checking cache by context hash...');
    const { data: lastPlan, error: lastPlanError } = await supabase
      .from('planned_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(1)
      .single();

    if (lastPlanError && lastPlanError.code !== 'PGRST116') {
      log(`⚠️ Error fetching last plan: ${lastPlanError.message}`);
    }

    if (lastPlan && lastPlan.context_hash === contextHash && lastPlan.status !== 'started' && lastPlan.status !== 'done') {
      log(`✅ Cache hit! Last plan (${lastPlan.date}) has same context hash`);
      return NextResponse.json(
        {
          source: 'cache',
          planned_session_id: lastPlan.id,
          plan_json: lastPlan.plan_json,
          logs,
        },
        { status: 200 }
      );
    }

    log('🤖 Context hash mismatch or status requires regeneration, calling OpenAI...');
    // Generate new plan from OpenAI
    const plan = await generateCoachPlan(targetDate, settings, context);
    log('✅ OpenAI plan received');

    // Save to database
    log('💾 Saving plan to database...');
    const { data: newPlan, error: insertError } = await supabase
      .from('planned_sessions')
      .insert({
        user_id: user.id,
        date: targetDate,
        status: 'planned',
        context_hash: contextHash,
        plan_json: plan,
        verdict: plan.verdict,
      })
      .select()
      .single();

    if (insertError) {
      log(`❌ Failed to save planned session: ${insertError.message} (code: ${insertError.code})`);
      return NextResponse.json(
        { error: 'Failed to save plan', details: insertError.message, logs },
        { status: 500 }
      );
    }

    log(`✅ Plan saved successfully: ${newPlan.id}`);
    log('🎉 Plan generation complete!');

    return NextResponse.json(
      {
        source: 'generated',
        planned_session_id: newPlan.id,
        plan_json: newPlan.plan_json,
        logs,
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    log(`❌ FATAL ERROR: ${errorMsg}`);
    if (error instanceof Error && error.stack) {
      log(`Stack: ${error.stack}`);
    }
    console.error('Error in /api/coach/plan:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: errorMsg, logs },
      { status: 500 }
    );
  }
}
