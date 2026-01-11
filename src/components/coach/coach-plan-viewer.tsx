'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Copy, Loader2, CheckCircle, XCircle } from 'lucide-react';
import type { GeneratedPlan } from '@/lib/coach/types';

interface PlannedSession {
  id: string;
  date: string;
  status: 'planned' | 'done' | 'skipped';
  plan_json: GeneratedPlan;
  verdict: string;
  completed_at?: string;
  skip_reason?: string;
}

interface CoachPlanViewerProps {
  onPlanGenerated?: (plan: GeneratedPlan) => void;
}

export function CoachPlanViewer({ onPlanGenerated }: CoachPlanViewerProps) {
  const [plannedSession, setPlannedSession] = useState<PlannedSession | null>(null);
  const [plan, setPlan] = useState<GeneratedPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [source, setSource] = useState<'cache' | 'generated' | null>(null);
  const [copied, setCopied] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [skipReason, setSkipReason] = useState('');
  const [showSkipInput, setShowSkipInput] = useState(false);

  // Fetch existing plan on mount
  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const response = await fetch(`/api/coach/plan?date=${today}`);
        const data = await response.json();

        if (data.planned_session) {
          setPlannedSession(data.planned_session);
          setPlan(data.planned_session.plan_json);
          setSource('cache');
        }
      } catch (err) {
        console.error('Failed to fetch plan:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlan();
  }, []);

  const generatePlan = async () => {
    setGenerating(true);
    setError(null);
    setLogs([]);
    try {
      const response = await fetch('/api/coach/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const data = await response.json();
      
      if (data.logs) {
        setLogs(data.logs);
      }

      if (!response.ok) {
        setError(data.error || 'Failed to generate plan');
        if (data.details) {
          setError(prev => `${prev}: ${data.details}`);
        }
        return;
      }

      // Plan generation returns plan_json, but we need to fetch the full session
      if (data.planned_session_id) {
        const today = new Date().toISOString().split('T')[0];
        const fetchResponse = await fetch(`/api/coach/plan?date=${today}`);
        const fetchData = await fetchResponse.json();
        
        if (fetchData.planned_session) {
          setPlannedSession(fetchData.planned_session);
          setPlan(fetchData.planned_session.plan_json);
        }
      } else {
        setPlan(data.plan_json);
      }

      setSource(data.source);
      onPlanGenerated?.(data.plan_json);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(`Client error: ${errorMsg}`);
      console.error('Error generating plan:', err);
    } finally {
      setGenerating(false);
    }
  };

  const updateStatus = async (newStatus: 'done' | 'skipped', reason?: string) => {
    if (!plannedSession) return;

    setUpdatingStatus(true);
    try {
      const response = await fetch('/api/coach/plan/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planned_session_id: plannedSession.id,
          status: newStatus,
          skip_reason: reason || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to update status');
        return;
      }

      setPlannedSession(data.planned_session);
      setShowSkipInput(false);
      setSkipReason('');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(`Error updating status: ${errorMsg}`);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const copyToClipboard = () => {
    if (plan?.clipboard_text) {
      navigator.clipboard.writeText(plan.clipboard_text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  if (loading) {
    return (
      <Card className="p-6 text-center">
        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
        <p className="text-muted-foreground">Loading plan...</p>
      </Card>
    );
  }

  // No plan exists yet
  if (!plan) {
    return (
      <div className="space-y-4">
        <Card className="p-6 border-dashed">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">Daily Coach Plan</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Generate your personalized training plan for today
            </p>
            <Button
              onClick={generatePlan}
              disabled={generating}
              className="gap-2"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Today Plan'
              )}
            </Button>
          </div>
        </Card>

        {logs.length > 0 && (
          <Card className="p-4 bg-slate-950 text-slate-100">
            <h4 className="text-xs font-semibold mb-3 text-slate-400">
              Generation Logs:
            </h4>
            <div className="space-y-1 max-h-64 overflow-y-auto font-mono text-xs">
              {logs.map((log, idx) => (
                <div key={idx} className="text-slate-300">
                  {log}
                </div>
              ))}
            </div>
          </Card>
        )}

        {error && (
          <Card className="p-4 bg-red-950 border-red-700 text-red-100">
            <h4 className="text-xs font-semibold mb-2">Error:</h4>
            <p className="text-sm font-mono">{error}</p>
          </Card>
        )}
      </div>
    );
  }

  // Plan exists - show it with status badges and actions
  return (
    <div className="space-y-4">
      {/* Status Badge */}
      {plannedSession && (
        <Card className={`p-3 ${
          plannedSession.status === 'done' ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800' :
          plannedSession.status === 'skipped' ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800' :
          'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {plannedSession.status === 'done' && (
                <>
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-semibold text-green-600">Completed</span>
                </>
              )}
              {plannedSession.status === 'skipped' && (
                <>
                  <XCircle className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm font-semibold text-yellow-600">Skipped</span>
                </>
              )}
              {plannedSession.status === 'planned' && (
                <>
                  <div className="w-2 h-2 bg-blue-600 rounded-full" />
                  <span className="text-sm font-semibold text-blue-600">Planned</span>
                </>
              )}
            </div>
            {plannedSession.status === 'skipped' && plannedSession.skip_reason && (
              <span className="text-xs text-muted-foreground">
                Reason: {plannedSession.skip_reason}
              </span>
            )}
          </div>
        </Card>
      )}

      {/* Main plan card */}
      <Card className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">
                {plan.verdict === 'push' && '📈'}
                {plan.verdict === 'maintain' && '➡️'}
                {plan.verdict === 'deload' && '⬇️'}
              </span>
              <h2 className="text-xl font-bold capitalize">{plan.verdict}</h2>
            </div>
            <p className="text-sm text-muted-foreground font-medium">{plan.summary.why}</p>
            <div className="mt-2 pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                📊 Load change: {plan.summary.signals.weekly_load_change > 0 ? '+' : ''}{plan.summary.signals.weekly_load_change}% | 
                💪 Hard sets: {plan.summary.signals.hard_sets_week} | 
                🎯 Pain: {plan.summary.signals.pain_flags.join(', ')}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={copyToClipboard}
            className="gap-2"
          >
            <Copy className="w-4 h-4" />
            {copied ? 'Copied!' : 'Copy'}
          </Button>
        </div>

        <div className="bg-secondary/50 rounded p-3">
          <p className="text-xs font-medium text-muted-foreground mb-2">
            Athlete Notes:
          </p>
          <p className="text-sm whitespace-pre-wrap font-mono">
            {plan.clipboard_text}
          </p>
        </div>
      </Card>

      {/* Plan blocks */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Today's Blocks</h3>
        <div className="space-y-4">
          {plan.plan.blocks.map((block, blockIdx) => (
            <div key={blockIdx} className="border rounded-lg p-4 bg-slate-50 dark:bg-slate-900">
              <h4 className="font-semibold text-sm mb-3">{block.name}</h4>
              <div className="space-y-3">
                {block.items.map((item, itemIdx) => (
                  <div key={itemIdx} className="border-l-2 border-blue-400 pl-3 py-1">
                    {item.type === 'set' && item.set && (
                      <div>
                        <p className="text-sm font-medium">
                          🏋️ {item.set.skill.toUpperCase()} - {item.set.movement}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.set.technique} | {item.set.sets} × {item.set.seconds ? `${item.set.seconds}s` : `${item.set.reps}x`} @ RPE {item.set.target_rpe}
                          {item.set.assistance_kg > 0 && ` | +${item.set.assistance_kg}kg`}
                        </p>
                      </div>
                    )}
                    {item.type === 'combo' && item.combo && (
                      <div>
                        <p className="text-sm font-medium">⛓️ Combo (RPE {item.combo.target_rpe})</p>
                        <div className="text-xs text-muted-foreground ml-2 mt-1 space-y-1">
                          {item.combo.items.map((comboItem, cIdx) => (
                            <p key={cIdx}>
                              • {comboItem.skill.toUpperCase()} {comboItem.movement} ({comboItem.seconds ? `${comboItem.seconds}s` : `${comboItem.reps}x`})
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Stop rules */}
      {plan.plan.stop_rules.length > 0 && (
        <Card className="p-6 border-orange-200 dark:border-orange-900">
          <h3 className="font-semibold mb-3">⚠️ Stop Rules</h3>
          <ul className="space-y-2">
            {plan.plan.stop_rules.map((rule, idx) => (
              <li key={idx} className="text-sm text-muted-foreground">
                • {rule}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Action buttons */}
      {plannedSession && plannedSession.status === 'planned' && (
        <div className="space-y-3">
          {!showSkipInput ? (
            <div className="flex gap-2">
              <Button
                onClick={() => updateStatus('done')}
                disabled={updatingStatus}
                className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
              >
                {updatingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Mark as Done
              </Button>
              <Button
                onClick={() => setShowSkipInput(true)}
                disabled={updatingStatus}
                variant="outline"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Skip
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Why skip? (optional)"
                value={skipReason}
                onChange={(e) => setSkipReason(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => updateStatus('skipped', skipReason)}
                  disabled={updatingStatus}
                  className="flex-1 bg-yellow-600 hover:bg-yellow-700"
                >
                  {updatingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Skip'}
                </Button>
                <Button
                  onClick={() => {
                    setShowSkipInput(false);
                    setSkipReason('');
                  }}
                  variant="outline"
                  disabled={updatingStatus}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {plannedSession && plannedSession.status !== 'planned' && (
        <Button
          onClick={generatePlan}
          disabled={generating}
          variant="outline"
          className="w-full"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Generating...
            </>
          ) : (
            'Generate New Plan'
          )}
        </Button>
      )}

      {!plannedSession && (
        <Button
          onClick={generatePlan}
          disabled={generating}
          className="w-full"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Generating...
            </>
          ) : (
            'Regenerate Plan'
          )}
        </Button>
      )}

      {logs.length > 0 && (
        <Card className="p-4 bg-slate-950 text-slate-100">
          <h4 className="text-xs font-semibold mb-3 text-slate-400">
            Generation Logs:
          </h4>
          <div className="space-y-1 max-h-64 overflow-y-auto font-mono text-xs">
            {logs.map((log, idx) => (
              <div key={idx} className="text-slate-300">
                {log}
              </div>
            ))}
          </div>
        </Card>
      )}

      {error && (
        <Card className="p-4 bg-red-950 border-red-700 text-red-100">
          <h4 className="text-xs font-semibold mb-2">Error:</h4>
          <p className="text-sm font-mono">{error}</p>
        </Card>
      )}
    </div>
  );
}
