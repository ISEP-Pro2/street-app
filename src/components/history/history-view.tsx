'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/provider';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import { SKILL_LABELS, TECHNIQUE_LABELS, MOVEMENT_LABELS, ASSISTANCE_LABELS } from '@/lib/constants';
import type { Session, Set } from '@/types';

interface SessionWithSets extends Session {
  sets?: Set[];
  combos?: any[];
  comboItems?: any[];
}

export function HistoryView() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<SessionWithSets[]>([]);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    if (user) {
      loadSessions();
    }
  }, [user]);

  const loadSessions = async () => {
    if (!user) return;

    setLoading(true);

    try {
      // Get last 30 days of sessions
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const startDate = thirtyDaysAgo.toISOString().split('T')[0];

      const { data: sessionsData } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', user.id)
        .gte('session_date', startDate)
        .order('session_date', { ascending: false });

      setSessions(sessionsData || []);
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSessionDetails = async (sessionId: string) => {
    try {
      // Load sets
      const { data: setsData } = await supabase
        .from('sets')
        .select('*')
        .eq('session_id', sessionId)
        .order('performed_at', { ascending: true });

      // Load combos
      const { data: combosData } = await supabase
        .from('combos')
        .select('*')
        .eq('session_id', sessionId)
        .order('performed_at', { ascending: true });

      // Load combo items if combos exist
      let allComboItems: any[] = [];
      if (combosData && combosData.length > 0) {
        const comboIds = combosData.map((c) => c.id);
        const { data: itemsData } = await supabase
          .from('combo_items')
          .select('*')
          .in('combo_id', comboIds)
          .order('created_at', { ascending: true });
        allComboItems = itemsData || [];
      }

      setSessions(
        sessions.map((s) =>
          s.id === sessionId
            ? { ...s, sets: setsData || [], combos: combosData || [], comboItems: allComboItems }
            : s
        )
      );
    } catch (error) {
      console.error('Error loading session details:', error);
    }
  };

  const handleToggleExpand = (sessionId: string) => {
    if (expandedSession === sessionId) {
      setExpandedSession(null);
    } else {
      setExpandedSession(sessionId);
      const session = sessions.find((s) => s.id === sessionId);
      if (session && !session.sets) {
        loadSessionDetails(sessionId);
      }
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24 p-4">
      <div className="pt-4">
        <h1 className="text-2xl font-bold mb-4">History (Last 30 Days)</h1>

        {sessions.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No sessions yet</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {sessions.map((session) => (
              <div key={session.id}>
                <Button
                  variant="outline"
                  className="w-full justify-between h-auto py-3 px-4"
                  onClick={() => handleToggleExpand(session.id)}
                >
                  <div className="text-left">
                    <p className="font-semibold">{formatDate(session.session_date)}</p>
                    <p className="text-xs text-muted-foreground">
                      {session.sets?.length || '?'} sets • {session.combos?.length || '?'} combos
                    </p>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${
                      expandedSession === session.id ? 'rotate-180' : ''
                    }`}
                  />
                </Button>

                {expandedSession === session.id && (
                  <div className="mt-2 space-y-2 pl-2 border-l-2 border-primary">
                    {session.sets && session.sets.length > 0 ? (
                      session.sets.map((set, idx) => (
                        <Card key={set.id} className="p-3 bg-secondary/50">
                          <p className="text-xs font-semibold mb-1">
                            Set {idx + 1}: {SKILL_LABELS[set.skill]} {TECHNIQUE_LABELS[set.technique]}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {MOVEMENT_LABELS[set.movement]} • {ASSISTANCE_LABELS[set.assistance_type]}
                          </p>
                          <div className="text-xs mt-1 flex gap-3">
                            {set.seconds && <span>⏱ {set.seconds}s</span>}
                            {set.reps && <span>🔄 {set.reps} reps</span>}
                            <span>RPE: {set.rpe}</span>
                          </div>
                        </Card>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground">No sets</p>
                    )}

                    {session.combos && session.combos.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <p className="text-xs font-semibold text-primary mb-2">Combos</p>
                        {session.combos.map((combo, comboIdx) => {
                          const comboItemsForThisCombo = session.comboItems?.filter(
                            (item) => item.combo_id === combo.id
                          ) || [];
                          return (
                            <Card key={combo.id} className="p-3 bg-primary/10 mb-2">
                              <p className="text-xs font-semibold mb-2">
                                🎯 Combo {comboIdx + 1} ({comboItemsForThisCombo.length} items)
                              </p>
                              <div className="text-xs space-y-1 ml-2">
                                {comboItemsForThisCombo.map((item, itemIdx) => (
                                  <div key={item.id} className="text-muted-foreground">
                                    • {SKILL_LABELS[item.skill]} {TECHNIQUE_LABELS[item.technique]} •{' '}
                                    {MOVEMENT_LABELS[item.movement]}
                                    {item.seconds && ` • ⏱ ${item.seconds}s`}
                                    {item.reps && ` • 🔄 ${item.reps} reps`}
                                  </div>
                                ))}
                              </div>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
