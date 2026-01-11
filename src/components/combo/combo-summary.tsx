'use client';

import { ComboLoadCalculation } from '@/types';

interface ComboSummaryProps {
  load: ComboLoadCalculation;
  itemCount: number;
}

export default function ComboSummary({
  load,
  itemCount,
}: ComboSummaryProps) {
  return (
    <div className="grid grid-cols-4 gap-2 text-center">
      <div className="space-y-1">
        <div className="text-xs text-muted-foreground">Items</div>
        <div className="text-lg font-bold">{itemCount}</div>
      </div>
      <div className="space-y-1">
        <div className="text-xs text-muted-foreground">Base</div>
        <div className="text-lg font-bold">{load.baseComboScore.toFixed(0)}</div>
      </div>
      <div className="space-y-1">
        <div className="text-xs text-muted-foreground">Chain</div>
        <div className="text-lg font-bold">{load.chainFactor.toFixed(2)}x</div>
      </div>
      <div className="space-y-1">
        <div className="text-xs text-muted-foreground">Load</div>
        <div className="text-lg font-bold text-primary">{load.comboLoadScore.toFixed(0)}</div>
      </div>
    </div>
  );
}
