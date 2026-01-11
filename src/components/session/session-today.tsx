'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/provider';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Set } from '@/types';
import { Trash2, Edit2 } from 'lucide-react';
import {
  SKILL_LABELS,
  TECHNIQUE_LABELS,
  MOVEMENT_LABELS,
  FORM_QUALITY_LABELS,
  PAIN_TAG_LABELS,
} from '@/lib/constants';

export function SessionToday() {
  const { user } = useAuth();
  const [sets, setSets] = useState<Set[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!user) return;

    const fetchSets = async () => {
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('sets')
        .select('*')
        .eq('user_id', user.id)
        .gte('performed_at', `${today}T00:00:00`)
        .lt('performed_at', `${today}T23:59:59`)
        .order('performed_at', { ascending: true });

      if (error) {
        console.error('Error fetching sets:', error);
      } else {
        setSets(data as Set[]);
      }
      setLoading(false);
    };

    fetchSets();
  }, [user, supabase]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this set?')) return;

    const { error } = await supabase.from('sets').delete().eq('id', id);

    if (error) {
      alert('Error deleting set');
    } else {
      setSets(sets.filter((s) => s.id !== id));
    }
  };

  const totalSeconds = sets
    .filter((s) => s.seconds)
    .reduce((sum, s) => sum + (s.seconds || 0), 0);

  const totalReps = sets
    .filter((s) => s.reps)
    .reduce((sum, s) => sum + (s.reps || 0), 0);

  const hardSets = sets.filter((s) => s.rpe >= 8).length;

  return (
    <div className="space-y-4 pb-24">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="p-3 text-center">
          <div className="text-2xl font-bold text-primary">
            {Math.floor(totalSeconds)}
          </div>
          <div className="text-xs text-muted-foreground">Sec Holds</div>
        </Card>
        <Card className="p-3 text-center">
          <div className="text-2xl font-bold text-primary">{totalReps}</div>
          <div className="text-xs text-muted-foreground">Dynamic Reps</div>
        </Card>
        <Card className="p-3 text-center">
          <div className="text-2xl font-bold text-primary">{hardSets}</div>
          <div className="text-xs text-muted-foreground">Hard Sets</div>
        </Card>
      </div>

      {/* Sets List */}
      {loading ? (
        <div className="text-center py-8 text-muted-foreground">
          Loading today's sets...
        </div>
      ) : sets.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No sets logged today</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {sets.map((set) => (
            <Card key={set.id} className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <div className="flex gap-2 flex-wrap">
                    <span className="inline-block bg-primary/10 text-primary px-2 py-1 rounded text-xs font-medium">
                      {SKILL_LABELS[set.skill]}
                    </span>
                    <span className="inline-block bg-secondary/50 text-secondary-foreground px-2 py-1 rounded text-xs font-medium">
                      {TECHNIQUE_LABELS[set.technique]}
                    </span>
                    <span className="inline-block bg-secondary/50 text-secondary-foreground px-2 py-1 rounded text-xs font-medium">
                      {MOVEMENT_LABELS[set.movement]}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleDelete(set.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                {set.seconds && (
                  <div>
                    <span className="text-muted-foreground">Duration:</span>{' '}
                    <span className="font-medium">{set.seconds}s</span>
                  </div>
                )}
                {set.reps && (
                  <div>
                    <span className="text-muted-foreground">Reps:</span>{' '}
                    <span className="font-medium">{set.reps}</span>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">RPE:</span>{' '}
                  <span className="font-medium">{set.rpe}/10</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Form:</span>{' '}
                  <span className="font-medium">
                    {FORM_QUALITY_LABELS[set.form_quality]}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 text-xs flex-wrap">
                {set.lockout && (
                  <span className="bg-green-500/10 text-green-700 px-2 py-1 rounded">
                    Full Lockout
                  </span>
                )}
                {set.deadstop && (
                  <span className="bg-blue-500/10 text-blue-700 px-2 py-1 rounded">
                    Deadstop
                  </span>
                )}
                {set.added_weight_kg && (
                  <span className="bg-orange-500/10 text-orange-700 px-2 py-1 rounded">
                    +{set.added_weight_kg}kg
                  </span>
                )}
                {set.pain_tag && (
                  <span className="bg-red-500/10 text-red-700 px-2 py-1 rounded">
                    {PAIN_TAG_LABELS[set.pain_tag]}
                  </span>
                )}
              </div>

              {set.notes && (
                <p className="text-xs text-muted-foreground mt-2 italic">
                  "{set.notes}"
                </p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
