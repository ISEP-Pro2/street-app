'use client';

import { Combo, ComboItem } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrashIcon, ChevronDown } from 'lucide-react';
import { useState, useEffect } from 'react';
import { formatComboType, calculateComboLoad } from '@/lib/utils/combo-calc';
import { createClient } from '@/lib/supabase/client';

interface SessionCombosProps {
  combos: Combo[];
  bodyweight: number;
  onComboDeleted?: () => void;
}

export function SessionCombos({
  combos,
  bodyweight,
  onComboDeleted,
}: SessionCombosProps) {
  const [expandedComboId, setExpandedComboId] = useState<string | null>(null);
  const supabase = createClient();

  const handleDeleteCombo = async (comboId: string) => {
    if (!confirm('Delete this combo?')) return;

    try {
      const { error } = await supabase.from('combos').delete().eq('id', comboId);

      if (error) throw error;

      onComboDeleted?.();
    } catch (error) {
      console.error('Error deleting combo:', error);
      alert('Error deleting combo');
    }
  };

  if (combos.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-sm">⛓️ Combos ({combos.length})</h3>
      {combos.map((combo) => (
        <ComboCard
          key={combo.id}
          combo={combo}
          bodyweight={bodyweight}
          isExpanded={expandedComboId === combo.id}
          onToggleExpand={() =>
            setExpandedComboId(
              expandedComboId === combo.id ? null : combo.id
            )
          }
          onDelete={() => handleDeleteCombo(combo.id)}
        />
      ))}
    </div>
  );
}

interface ComboCardProps {
  combo: Combo;
  bodyweight: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onDelete: () => void;
}

function ComboCard({
  combo,
  bodyweight,
  isExpanded,
  onToggleExpand,
  onDelete,
}: ComboCardProps) {
  const [items, setItems] = useState<ComboItem[]>(combo.items || []);
  const [loaded, setLoaded] = useState(!!combo.items);
  const supabase = createClient();

  // Load items immediately when component mounts
  useEffect(() => {
    if (!loaded && !combo.items) {
      loadItems();
    }
  }, [combo.id]);

  const loadItems = async () => {
    if (loaded) return;

    try {
      const { data } = await supabase
        .from('combo_items')
        .select('*')
        .eq('combo_id', combo.id)
        .order('order_index', { ascending: true });

      setItems((data || []) as ComboItem[]);
      setLoaded(true);
    } catch (error) {
      console.error('Error loading combo items:', error);
    }
  };

  const handleExpand = () => {
    if (!loaded) {
      loadItems();
    }
    onToggleExpand();
  };

  const load =
    loaded && items.length > 0
      ? calculateComboLoad(items, bodyweight, combo.assistance_global_kg, combo.override_assistance_per_item)
      : null;

  const comboType = formatComboType(items);

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex-1 flex items-center gap-2">
          <button
            onClick={handleExpand}
            className="flex-1 flex items-start gap-2"
          >
            <ChevronDown
              className={`w-4 h-4 mt-0.5 transition transform ${
                isExpanded ? 'rotate-0' : '-rotate-90'
              }`}
            />
            <div className="flex-1 text-left">
              <p className="font-semibold text-sm">
                Combo ({comboType}) — {items.length} items{' '}
                {combo.rpe_global && `— RPE: ${combo.rpe_global}`}
              </p>
              {load && (
                <p className="text-xs text-muted-foreground">
                  Load: {load.comboLoadScore.toFixed(0)} (Chain: {load.chainFactor.toFixed(2)}x)
                </p>
              )}
            </div>
          </button>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 flex-shrink-0"
          onClick={onDelete}
        >
          <TrashIcon className="w-4 h-4" />
        </Button>
      </div>

      {isExpanded && loaded && (
        <div className="mt-3 pt-3 border-t space-y-2">
          {items.map((item, idx) => (
            <div key={item.id} className="text-xs space-y-1">
              <div className="flex items-center gap-2">
                <span className="inline-block w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                  {idx + 1}
                </span>
                <span className="font-medium">
                  {item.skill === 'planche' ? '🏋️' : '🤸'} {item.technique}
                </span>
                <span className="text-muted-foreground">
                  {item.movement}
                </span>
              </div>
              <div className="text-muted-foreground ml-7">
                {item.movement === 'hold'
                  ? `${item.seconds}s`
                  : `${item.reps}x`}
                {item.assistance_kg !== undefined && item.assistance_kg > 0 && (
                  <span> • -{item.assistance_kg}kg</span>
                )}
                {item.form_quality && (
                  <span> • Form: {item.form_quality}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
