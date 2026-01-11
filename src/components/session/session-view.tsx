'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/provider';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrashIcon, PencilIcon } from 'lucide-react';
import { SKILL_LABELS, TECHNIQUE_LABELS, MOVEMENT_LABELS, ASSISTANCE_LABELS, FORM_QUALITY_LABELS, PAIN_TAG_LABELS } from '@/lib/constants';
import type { Set, Session, Combo } from '@/types';
import { SessionCombos } from './session-combos';
import { SessionExposureSummary } from './session-exposure-summary';
import { getUserPreferencesAction } from '@/app/app/combo/actions';

export function SessionView() {
  const { user } = useAuth();
  const [session, setSession] = useState<Session | null>(null);
  const [sets, setSets] = useState<Set[]>([]);
  const [combos, setCombos] = useState<Combo[]>([]);
  const [comboItems, setComboItems] = useState<any[]>([]);
  const [bodyweight, setBodyweight] = useState(75);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    loadUserData();
  }, [user]);

  useEffect(() => {
    loadSessionData();
  }, [user]);

  const loadUserData = async () => {
    const result = await getUserPreferencesAction();
    if (result.bodyweight) {
      setBodyweight(result.bodyweight);
    }
  };

  const loadSessionData = async () => {
    if (!user) return;

    setLoading(true);

    try {
      const today = new Date().toISOString().split('T')[0];

      // Get or create today's session
      const { data: sessionData } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('session_date', today)
        .single();

      if (sessionData) {
        setSession(sessionData);

        // Get sets for this session
        const { data: setsData } = await supabase
          .from('sets')
          .select('*')
          .eq('session_id', sessionData.id)
          .order('performed_at', { ascending: true });

        setSets(setsData || []);

        // Get combos for this session
        const { data: combosData } = await supabase
          .from('combos')
          .select('*')
          .eq('session_id', sessionData.id)
          .order('performed_at', { ascending: true });

        setCombos((combosData || []) as Combo[]);

        // Get combo items for this session
        if (combosData && combosData.length > 0) {
          const comboIds = combosData.map((c) => c.id);
          const { data: itemsData } = await supabase
            .from('combo_items')
            .select('*')
            .in('combo_id', comboIds);

          setComboItems(itemsData || []);
        } else {
          setComboItems([]);
        }
      } else {
        setSession(null);
        setSets([]);
        setCombos([]);
        setComboItems([]);
      }
    } catch (error) {
      console.error('Error loading session:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (setId: string) => {
    if (!confirm('Delete this set?')) return;

    try {
      const { error } = await supabase.from('sets').delete().eq('id', setId);

      if (error) throw error;

      setSets(sets.filter((s) => s.id !== setId));
    } catch (error) {
      console.error('Error deleting set:', error);
      alert('Error deleting set');
    }
  };

  const calculateTotals = () => {
    // Calculate from sets
    const totalSeconds = sets
      .filter((s) => s.seconds)
      .reduce((acc, s) => acc + (s.seconds || 0), 0);

    const totalReps = sets
      .filter((s) => s.reps)
      .reduce((acc, s) => acc + (s.reps || 0), 0);

    const hardSets = sets.filter((s) => s.rpe >= 8).length;

    // Add combo items data
    let comboSeconds = 0;
    let comboReps = 0;

    for (const item of comboItems) {
      // Add holds to seconds
      if (item.movement === 'hold' && item.seconds) {
        comboSeconds += item.seconds;
      }
      // Add press, negative, pushup, pullup to reps
      if (['press', 'negative', 'pushup', 'pullup'].includes(item.movement) && item.reps) {
        comboReps += item.reps;
      }
    }

    return { 
      totalSeconds: totalSeconds + comboSeconds, 
      totalReps: totalReps + comboReps, 
      hardSets 
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  const { totalSeconds, totalReps, hardSets } = calculateTotals();
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);

  return (
    <div className="space-y-6 pb-24 p-4">
      <div className="pt-4">
        <h1 className="text-2xl font-bold mb-4">Today's Session</h1>

        {sets.length === 0 && combos.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground mb-4">No sets or combos logged yet today</p>
            <p className="text-sm text-muted-foreground">
              Go to the Log tab to add your first set
            </p>
          </Card>
        ) : (
          <>
            {/* Totals */}
            <Card className="p-4 mb-6 bg-secondary/50">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">
                    {minutes}:{String(seconds).padStart(2, '0')}
                  </p>
                  <p className="text-xs text-muted-foreground">Total Hold Time</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{totalReps}</p>
                  <p className="text-xs text-muted-foreground">Total Reps</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{hardSets}</p>
                  <p className="text-xs text-muted-foreground">Hard Sets (RPE≥8)</p>
                </div>
              </div>
            </Card>

            {/* Exposure Summary */}
            {session && <SessionExposureSummary sessionId={session.id} />}

            {/* Combos Section */}
            {combos.length > 0 && (
              <div className="mb-6">
                <SessionCombos
                  combos={combos}
                  bodyweight={bodyweight}
                  onComboDeleted={loadSessionData}
                />
              </div>
            )}

            {/* Sets List */}
            {sets.length > 0 && (
              <div className="space-y-3">
              {sets.map((set, idx) => (
                <Card key={set.id} className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <p className="font-semibold text-sm">
                        Set {idx + 1}: {SKILL_LABELS[set.skill]} - {TECHNIQUE_LABELS[set.technique]}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {MOVEMENT_LABELS[set.movement]} • {ASSISTANCE_LABELS[set.assistance_type]}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleDelete(set.id)}
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                    {set.seconds && (
                      <div>
                        <span className="text-muted-foreground">Duration:</span>
                        <span className="font-semibold ml-2">{set.seconds}s</span>
                      </div>
                    )}
                    {set.reps && (
                      <div>
                        <span className="text-muted-foreground">Reps:</span>
                        <span className="font-semibold ml-2">{set.reps}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-muted-foreground">RPE:</span>
                      <span className="font-semibold ml-2">{set.rpe}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Form:</span>
                      <span className="font-semibold ml-2">{FORM_QUALITY_LABELS[set.form_quality]}</span>
                    </div>
                  </div>

                  {set.pain_tag && (
                    <div className="mb-2">
                      <span className="text-xs bg-destructive/10 text-destructive px-2 py-1 rounded">
                        🔴 {PAIN_TAG_LABELS[set.pain_tag]}
                      </span>
                    </div>
                  )}

                  {set.notes && (
                    <p className="text-xs text-muted-foreground italic border-l-2 border-muted pl-2">
                      {set.notes}
                    </p>
                  )}
                </Card>
              ))}
            </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
