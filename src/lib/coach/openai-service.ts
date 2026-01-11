import OpenAI from 'openai';
import crypto from 'crypto';
import type { CoachContext, CoachSettings, GeneratedPlan } from './types';

const ASSISTANT_ID = 'asst_hGDxZYgsyl42CikVw7q9HBes';

export async function generateCoachPlan(
  date: string,
  settings: CoachSettings,
  context: CoachContext
): Promise<GeneratedPlan> {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  // Build the prompt
  const prompt = buildCoachPrompt(date, settings, context);

  // Call the assistant
  console.log('[Coach] Creating thread...');
  const thread = await openai.beta.threads.create();
  const threadId = String(thread.id);
  console.log('[Coach] Thread created - ID:', threadId);

  // Add the message
  console.log('[Coach] Adding message to thread...');
  await openai.beta.threads.messages.create(threadId, {
    role: 'user',
    content: prompt,
  });
  console.log('[Coach] Message added');

  // Run the assistant
  console.log('[Coach] Creating run with assistant:', ASSISTANT_ID);
  const run = await openai.beta.threads.runs.create(threadId, {
    assistant_id: ASSISTANT_ID,
  });
  const runId = String(run.id);
  console.log('[Coach] Run created - ID:', runId, 'Status:', run.status);

  // Poll for completion
  let currentRun = run;
  let maxAttempts = 60;
  console.log('[Coach] Polling for completion (max', maxAttempts, 'attempts)...');
  
  while (currentRun.status !== 'completed' && maxAttempts > 0) {
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
    
    console.log('[Coach] Polling - threadId:', threadId, 'runId:', runId);
    try {
      // Use a fresh API call to retrieve the run
      const response = await fetch(
        `https://api.openai.com/v1/threads/${threadId}/runs/${runId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'OpenAI-Beta': 'assistants=v2',
          },
        }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to retrieve run: ${response.statusText}`);
      }
      
      const runData = await response.json();
      currentRun = runData;
      console.log('[Coach] Poll attempt - Status:', currentRun.status);
    } catch (pollError) {
      console.error('[Coach] Poll error:', pollError);
      throw pollError;
    }
    maxAttempts--;
  }

  if (currentRun.status !== 'completed') {
    throw new Error(`Assistant run failed: ${currentRun.status}`);
  }

  console.log('[Coach] Run completed, fetching messages...');
  // Get the response
  const messages = await openai.beta.threads.messages.list(threadId);
  const assistantMessage = messages.data.find(m => m.role === 'assistant');

  if (!assistantMessage || assistantMessage.content.length === 0) {
    throw new Error('No response from assistant');
  }

  // Extract text content
  const textContent = assistantMessage.content.find(c => c.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('Assistant response is not text');
  }

  // Parse JSON from the response - COMPREHENSIVE LOGGING
  let plan: GeneratedPlan;
  const rawText = (textContent as any).text;
  
  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('[Coach] PARSING RESPONSE - START');
  console.log('═══════════════════════════════════════════════════════');
  console.log('[Coach] rawText type:', typeof rawText);
  console.log('[Coach] rawText is null/undefined?', rawText === null || rawText === undefined);
  console.log('[Coach] rawText is object?', typeof rawText === 'object');
  console.log('[Coach] rawText is string?', typeof rawText === 'string');
  
  if (rawText) {
    if (typeof rawText === 'object') {
      console.log('[Coach] >>> OBJECT DETECTED');
      console.log('[Coach] Object keys:', Object.keys(rawText).join(', '));
      console.log('[Coach] Object properties:');
      for (const key of Object.keys(rawText)) {
        const val = (rawText as any)[key];
        console.log(`  - ${key}: ${typeof val} ${typeof val === 'string' ? `(length: ${val.length})` : ''}`);
      }
      console.log('[Coach] Full object (pretty):', JSON.stringify(rawText, null, 2).substring(0, 2000));
    } else if (typeof rawText === 'string') {
      console.log('[Coach] >>> STRING DETECTED');
      console.log('[Coach] String length:', rawText.length);
      console.log('[Coach] First 500 chars:', rawText.substring(0, 500));
      console.log('[Coach] Last 200 chars:', rawText.substring(Math.max(0, rawText.length - 200)));
    }
  }
  
  try {
    // The response might be wrapped in different ways
    let planData: any = null;
    let jsonString: string | null = null;
    
    // Case 1: rawText is a string (text content directly)
    if (typeof rawText === 'string') {
      console.log('[Coach] Case 1: rawText is string');
      jsonString = rawText;
    }
    // Case 2: rawText is an object with a "value" property containing JSON string
    else if (typeof rawText === 'object' && rawText !== null && typeof (rawText as any).value === 'string') {
      console.log('[Coach] Case 2: rawText.value is string, extracting...');
      jsonString = (rawText as any).value;
    }
    // Case 3: rawText is an object with a "text" property containing JSON string
    else if (typeof rawText === 'object' && rawText !== null && typeof (rawText as any).text === 'string') {
      console.log('[Coach] Case 3: rawText.text is string, extracting...');
      jsonString = (rawText as any).text;
    }
    // Case 4: rawText is already the plan object with verdict
    else if (typeof rawText === 'object' && rawText !== null && (rawText as any).verdict !== undefined) {
      console.log('[Coach] Case 4: rawText is already plan object');
      planData = rawText;
    }
    
    // If we have a JSON string, parse it
    if (jsonString && !planData) {
      console.log('[Coach] Parsing JSON string (length: ' + jsonString.length + ')');
      
      // Try markdown code blocks first
      const jsonMatch = jsonString.match(/```(?:json)?\n?([\s\S]*?)\n?```/);
      if (jsonMatch && jsonMatch[1]) {
        console.log('[Coach] Found JSON in code block');
        planData = JSON.parse(jsonMatch[1]);
      } else {
        console.log('[Coach] No code block, parsing directly');
        planData = JSON.parse(jsonString);
      }
    }
    
    if (!planData) {
      throw new Error('Failed to extract plan data from response');
    }
    
    plan = planData as GeneratedPlan;
    console.log('[Coach] ✅ Successfully parsed plan');
    console.log('[Coach] Plan keys:', Object.keys(plan).join(', '));
    console.log('[Coach] Plan.verdict:', plan.verdict);
    console.log('[Coach] Plan.summary exists?', !!plan.summary);
    console.log('[Coach] Plan.plan exists?', !!plan.plan);
    console.log('═══════════════════════════════════════════════════════');
    console.log('[Coach] PARSING RESPONSE - SUCCESS');
    console.log('═══════════════════════════════════════════════════════');
    console.log('');
    
  } catch (e) {
    console.error('');
    console.error('═══════════════════════════════════════════════════════');
    console.error('[Coach] PARSING RESPONSE - ERROR');
    console.error('═══════════════════════════════════════════════════════');
    console.error('[Coach] Error message:', e instanceof Error ? e.message : String(e));
    console.error('[Coach] Error type:', typeof e);
    if (e instanceof Error) {
      console.error('[Coach] Stack:', e.stack);
    }
    console.error('[Coach] rawText at error time:');
    console.error(JSON.stringify(rawText, null, 2));
    console.error('═══════════════════════════════════════════════════════');
    console.error('');
    
    const errorDetail = typeof rawText === 'object' ? JSON.stringify(rawText).substring(0, 500) : String(rawText).substring(0, 500);
    const error = new Error(`Invalid JSON response from assistant: ${errorDetail}`);
    throw error;
  }

  // Validate the plan structure
  validatePlanSchema(plan);

  return plan;
}

function buildCoachPrompt(
  date: string,
  settings: CoachSettings,
  context: CoachContext
): string {
  return `You are a strength training coach planning a session for ${date}.

ATHLETE SETTINGS:
- Focus ratio: Planche ${Math.round(settings.focus_ratio_planche * 100)}% / Front ${Math.round(settings.focus_ratio_front * 100)}%
- Weekly load increase cap: +${Math.round(settings.weekly_cap_increase * 100)}%

RECENT PERFORMANCE (Last 7 days):
- Global Load: ${context.last_7d.global_load}
- Planche Load: ${context.last_7d.planche_load}
- Front Load: ${context.last_7d.front_load}
- Hard Sets (RPE≥8): ${context.last_7d.hard_sets}
- Pain Flags: ${context.last_7d.pain_flags_count}

TRENDS (Last 28 days):
- Load Trend: ${context.last_28d.load_trend.join(', ')}
- KPI Trend: ${context.last_28d.kpi_trend.join(', ')}

PERSONAL BESTS:
- Planche Hold: ${context.kpis.planche_hold_best}s
- Planche Press: ${context.kpis.planche_press_best} reps
- Front Hold: ${context.kpis.front_hold_best}s
- Front Pullup: ${context.kpis.front_pullup_best} reps

LAST SESSION:
- Status: ${context.last_session.status || 'none'}
- Date: ${context.last_session.date || 'never'}

Generate a JSON response with this exact structure:
{
  "verdict": "push|maintain|deload",
  "summary": {
    "why": "explanation of the verdict",
    "targets": {
      "weekly_cap_increase": 0.1,
      "focus_ratio_planche": 0.7,
      "focus_ratio_front": 0.3
    },
    "signals": {
      "weekly_load_change": 0,
      "pain_flags": ["none"],
      "hard_sets_week": 0
    }
  },
  "clipboard_text": "text to copy for athlete (markdown format)",
  "plan": {
    "blocks": [
      {
        "name": "block name",
        "items": [
          {
            "type": "set|combo",
            "set": { "skill": "planche|front", "technique": "full|tuck", "movement": "hold|press|negative|pushup|pullup", "assistance_kg": 0|5|15|25, "target_rpe": 7, "sets": 3, "seconds": 5, "reps": null },
            "combo": null
          }
        ]
      }
    ],
    "stop_rules": ["if X happens then do Y"]
  }
}

Respect the settings ratio and weekly cap. Return ONLY valid JSON, no markdown.`;
}

function validatePlanSchema(plan: any): void {
  if (!plan.verdict || !['push', 'maintain', 'deload'].includes(plan.verdict)) {
    throw new Error('Missing or invalid verdict');
  }
  if (!plan.summary || !plan.summary.why || !plan.summary.targets || !plan.summary.signals) {
    throw new Error('Missing or invalid summary structure');
  }
  if (!plan.clipboard_text || typeof plan.clipboard_text !== 'string') {
    throw new Error('Missing or invalid clipboard_text');
  }
  if (!plan.plan || !Array.isArray(plan.plan.blocks)) {
    throw new Error('Missing or invalid plan.blocks');
  }
  if (!Array.isArray(plan.plan.stop_rules)) {
    throw new Error('Missing or invalid plan.stop_rules');
  }
}

export function calculateContextHash(
  settings: CoachSettings,
  context: CoachContext
): string {
  const data = JSON.stringify({ settings, context });
  return crypto.createHash('sha256').update(data).digest('hex');
}
