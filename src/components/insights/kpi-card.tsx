'use client';

import { useState } from 'react';
import { AssistanceType } from '@/types';
import { cn } from '@/lib/utils';

interface KPIMetrics {
  best_today: { absolute: number | null; clean: number | null };
  best_7d: { absolute: number | null; clean: number | null };
  best_28d: { absolute: number | null; clean: number | null };
}

interface KPICardProps {
  title: string;
  metrics: Record<AssistanceType, KPIMetrics>;
  unit: string;
}

const assistances: AssistanceType[] = ['none', 'band_5', 'band_15', 'band_25'];
const assistanceLabels: Record<AssistanceType, string> = {
  none: 'None',
  band_5: '5kg',
  band_15: '15kg',
  band_25: '25kg',
};

export function KPICard({ title, metrics, unit }: KPICardProps) {
  const [selectedAssistance, setSelectedAssistance] = useState<AssistanceType>('none');
  const current = metrics[selectedAssistance];

  const formatValue = (value: number | null) => {
    if (value === null) return '—';
    return `${Math.round(value)} ${unit}`;
  };

  const getChangeClass = (absolute: number | null, clean: number | null) => {
    if (absolute === null || clean === null) return 'text-muted-foreground';
    return absolute > clean ? 'text-orange-600' : 'text-green-600';
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <h3 className="text-sm font-semibold mb-3">{title}</h3>

      {/* Assistance tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {assistances.map((a) => (
          <button
            key={a}
            onClick={() => setSelectedAssistance(a)}
            className={cn(
              'px-3 py-1 text-xs font-medium rounded whitespace-nowrap transition-colors',
              selectedAssistance === a
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            {assistanceLabels[a]}
          </button>
        ))}
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        {/* Today */}
        <div className="border border-border rounded p-2">
          <p className="text-muted-foreground text-xs mb-1">Today</p>
          <p className="font-bold text-lg">{formatValue(current.best_today.absolute)}</p>
          <p className={cn('text-xs mt-1', getChangeClass(current.best_today.absolute, current.best_today.clean))}>
            Clean: {formatValue(current.best_today.clean)}
          </p>
        </div>

        {/* 7 days */}
        <div className="border border-border rounded p-2">
          <p className="text-muted-foreground text-xs mb-1">7 days</p>
          <p className="font-bold text-lg">{formatValue(current.best_7d.absolute)}</p>
          <p className={cn('text-xs mt-1', getChangeClass(current.best_7d.absolute, current.best_7d.clean))}>
            Clean: {formatValue(current.best_7d.clean)}
          </p>
        </div>

        {/* 28 days */}
        <div className="border border-border rounded p-2">
          <p className="text-muted-foreground text-xs mb-1">28 days</p>
          <p className="font-bold text-lg">{formatValue(current.best_28d.absolute)}</p>
          <p className={cn('text-xs mt-1', getChangeClass(current.best_28d.absolute, current.best_28d.clean))}>
            Clean: {formatValue(current.best_28d.clean)}
          </p>
        </div>
      </div>
    </div>
  );
}
