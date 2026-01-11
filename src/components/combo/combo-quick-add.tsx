'use client';

import { useState } from 'react';
import { ComboItem as ComboItemType } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, ChevronDown } from 'lucide-react';
import { getAllowedTechniques, getAllowedMovements, validateComboItem } from '@/lib/utils/combo-calc';

interface ComboQuickAddProps {
  lastSkill: 'planche' | 'front';
  lastRpe?: number;
  lastForm?: 'clean' | 'ok' | 'ugly';
  overridePerItem: boolean;
  onAddItem: (item: Omit<ComboItemType, 'id' | 'combo_id' | 'user_id' | 'created_at' | 'order_index'>) => void;
  onItemAdded?: () => void;
}

export default function ComboQuickAdd({
  lastSkill,
  lastRpe = 8,
  lastForm = 'ok',
  overridePerItem,
  onAddItem,
  onItemAdded,
}: ComboQuickAddProps) {
  const [showDetail, setShowDetail] = useState(false);
  
  // FAST mode
  const [skill, setSkill] = useState<'planche' | 'front'>(lastSkill);
  const [technique, setTechnique] = useState<string>(getAllowedTechniques(lastSkill)[0]);
  const initialMovement = getAllowedMovements(lastSkill)[0];
  const [movement, setMovement] = useState<string>(initialMovement);
  // Always initialize BOTH to undefined first, then set based on movement
  const [seconds, setSeconds] = useState<number | undefined>(
    initialMovement === 'hold' ? undefined : undefined
  );
  const [reps, setReps] = useState<number | undefined>(
    initialMovement === 'hold' ? undefined : 1
  );
  
  // DETAIL mode
  const [assistanceKg, setAssistanceKg] = useState<number>(0);
  const [rpeLocal, setRpeLocal] = useState<number | undefined>(lastRpe);
  const [formLocal, setFormLocal] = useState<'clean' | 'ok' | 'ugly'>(lastForm);
  const [notes, setNotes] = useState<string>('');

  const allowedTechniques = getAllowedTechniques(skill);
  const allowedMovements = getAllowedMovements(skill);

  const handleSkillChange = (newSkill: 'planche' | 'front') => {
    const newTechnique = getAllowedTechniques(newSkill)[0];
    const newMovement = getAllowedMovements(newSkill)[0];
    setSkill(newSkill);
    setTechnique(newTechnique);
    setMovement(newMovement);
    // Reset seconds/reps based on new movement
    if (newMovement === 'hold') {
      setSeconds(undefined);
      setReps(undefined);
    } else {
      setSeconds(0);
      setReps(1);
    }
  };

  const handleAddItem = () => {
    const validation = validateComboItem(movement, seconds, reps);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    const newItem: Omit<ComboItemType, 'id' | 'combo_id' | 'user_id' | 'created_at' | 'order_index'> = {
      skill,
      technique: technique as any,
      movement: movement as any,
      seconds: movement === 'hold' ? seconds : undefined,
      reps: movement !== 'hold' ? reps : undefined,
      assistance_kg: overridePerItem ? assistanceKg : undefined,
      form_quality: formLocal !== 'ok' ? formLocal : undefined,
      notes: notes.trim() ? notes : undefined,
    };

    onAddItem(newItem);
    onItemAdded?.();

    // Reset seconds/reps based on current movement for next item
    if (movement === 'hold') {
      setSeconds(undefined);
      setReps(undefined);
    } else {
      setSeconds(undefined);
      setReps(1);
    }
  };

  return (
    <div className="space-y-3">
      {/* ============================================================
          MODE FAST (always visible)
          ============================================================ */}
      <div className="space-y-3 bg-primary/5 p-3 rounded-lg border border-primary/10">
        <h3 className="font-semibold text-sm">Quick Add Item</h3>

        {/* Skill - Segmented */}
        <div>
          <div className="flex gap-2">
            {(['planche', 'front'] as const).map(s => (
              <button
                key={s}
                onClick={() => handleSkillChange(s)}
                className={`flex-1 py-2 rounded font-medium text-sm transition ${
                  skill === s
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground'
                }`}
              >
                {s === 'planche' ? '🏋️ Planche' : '🤸 Front'}
              </button>
            ))}
          </div>
        </div>

        {/* Technique - Chips */}
        <div>
          <div className="flex flex-wrap gap-2">
            {allowedTechniques.map(t => (
              <button
                key={t}
                onClick={() => setTechnique(t)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                  technique === t
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                {t.charAt(0).toUpperCase() + t.slice(1).replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Movement - Chips */}
        <div>
          <div className="flex flex-wrap gap-2">
            {allowedMovements.map(m => (
              <button
                key={m}
                onClick={() => {
                  setMovement(m);
                  // ALWAYS reset both, never leave dangling state
                  if (m === 'hold') {
                    setSeconds(undefined);
                    setReps(undefined);
                  } else {
                    setSeconds(undefined);
                    setReps(1);
                  }
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                  movement === m
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Value Input (Seconds OR Reps) */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">
            {movement === 'hold' ? 'Seconds' : 'Reps'}
            {skill === 'front' && movement === 'hold' && (
              <span className="text-xs text-primary ml-2">💡 Touch = Hold 1-2s</span>
            )}
          </label>
          {movement === 'hold' ? (
            <Input
              type="number"
              min="0"
              step="0.5"
              value={seconds || ''}
              onChange={(e) => setSeconds(e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder="e.g., 15"
              className="text-sm"
              autoFocus
            />
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setReps(Math.max(1, (reps || 1) - 1))}
                className="w-10 h-10 flex items-center justify-center border rounded font-bold text-lg hover:bg-secondary"
              >
                −
              </button>
              <Input
                type="number"
                min="1"
                value={reps || ''}
                onChange={(e) => setReps(Math.max(1, parseInt(e.target.value) || 1))}
                className="flex-1 text-center text-sm font-bold"
              />
              <button
                onClick={() => setReps((reps || 1) + 1)}
                className="w-10 h-10 flex items-center justify-center border rounded font-bold text-lg hover:bg-secondary"
              >
                +
              </button>
            </div>
          )}
        </div>

        {/* Save Button - Sticky, Always Visible */}
        <Button
          onClick={handleAddItem}
          className="w-full bg-primary hover:bg-primary/90"
          size="lg"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Item
        </Button>
      </div>

      {/* ============================================================
          MODE DETAIL (collapsed by default)
          ============================================================ */}
      <div className="border border-border rounded-lg overflow-hidden">
        <button
          onClick={() => setShowDetail(!showDetail)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-secondary/50 transition text-left"
        >
          <span className="text-sm font-medium">Advanced Details</span>
          <ChevronDown 
            className={`w-4 h-4 transition transform ${showDetail ? 'rotate-180' : ''}`}
          />
        </button>

        {showDetail && (
          <div className="px-4 py-4 bg-secondary/30 space-y-3 border-t">
            {/* Assistance Override */}
            {overridePerItem && (
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">Assistance</label>
                <div className="flex gap-2">
                  {[0, 5, 15, 25].map(kg => (
                    <button
                      key={kg}
                      onClick={() => setAssistanceKg(kg)}
                      className={`flex-1 py-1.5 px-2 rounded text-xs font-medium transition ${
                        assistanceKg === kg
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-secondary-foreground'
                      }`}
                    >
                      {kg === 0 ? 'None' : `${kg}kg`}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* RPE */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">
                RPE (optional): {rpeLocal || 'N/A'}
              </label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(rpe => (
                  <button
                    key={rpe}
                    onClick={() => setRpeLocal(rpe)}
                    className={`flex-1 py-1 px-0.5 rounded text-xs font-medium transition ${
                      rpeLocal === rpe
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground'
                    }`}
                  >
                    {rpe}
                  </button>
                ))}
              </div>
            </div>

            {/* Form Quality */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">Form</label>
              <div className="flex gap-2">
                {(['clean', 'ok', 'ugly'] as const).map(form => (
                  <button
                    key={form}
                    onClick={() => setFormLocal(form)}
                    className={`flex-1 py-1.5 rounded text-xs font-medium transition ${
                      formLocal === form
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground'
                    }`}
                  >
                    {form.charAt(0).toUpperCase() + form.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes..."
                className="w-full p-2 border rounded text-xs resize-none"
                rows={2}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
