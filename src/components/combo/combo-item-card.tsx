'use client';

import { ComboItem as ComboItemType } from '@/types';
import { calculateEffectiveLoad, calculateItemScore } from '@/lib/utils/combo-calc';

interface ComboItemCardProps {
  item: ComboItemType;
  index: number;
  assistanceGlobal: number;
  overridePerItem: boolean;
  bodyweight: number;
  onUpdate: (updates: Partial<ComboItemType>) => void;
}

export default function ComboItemCard({
  item,
  index,
  assistanceGlobal,
  overridePerItem,
  bodyweight,
  onUpdate,
}: ComboItemCardProps) {
  const assistanceKg = overridePerItem && item.assistance_kg !== undefined
    ? item.assistance_kg
    : assistanceGlobal;

  const effectiveLoad = calculateEffectiveLoad(bodyweight, assistanceKg, 0);
  const itemScore = calculateItemScore(item, effectiveLoad);

  const value = item.movement === 'hold'
    ? `${item.seconds}s`
    : `${item.reps}x`;

  const movementLabel = item.movement === 'hold'
    ? 'Hold'
    : item.movement.charAt(0).toUpperCase() + item.movement.slice(1);

  return (
    <div className="p-3 border rounded-lg bg-card hover:bg-card/80 transition space-y-1">
      {/* Item Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="inline-block w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
              {index + 1}
            </span>
            <span className="font-semibold text-sm">
              {item.skill === 'planche' ? '🏋️' : '🤸'} {item.technique.charAt(0).toUpperCase() + item.technique.slice(1)}
            </span>
          </div>
          <div className="text-xs text-muted-foreground ml-8 mt-1">
            {movementLabel} • {value}
            {assistanceKg > 0 && ` • -${assistanceKg}kg`}
          </div>
        </div>
        <div className="text-right">
          <div className="font-bold text-sm text-primary">{itemScore.toFixed(1)}</div>
          <div className="text-xs text-muted-foreground">score</div>
        </div>
      </div>

      {/* Form Quality & Notes */}
      {(item.form_quality || item.notes) && (
        <div className="text-xs text-muted-foreground ml-8 space-y-0.5">
          {item.form_quality && (
            <div>Form: {item.form_quality}</div>
          )}
          {item.notes && (
            <div>Note: {item.notes}</div>
          )}
        </div>
      )}
    </div>
  );
}
