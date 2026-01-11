'use client';

import { cn } from '@/lib/utils';

interface TrainingMetricCardProps {
  label: string;
  value: number | string;
  unit?: string;
  delta?: number;
  deltaLabel?: string;
  trend?: 'up' | 'down' | 'neutral';
  secondaryValue?: number | string;
  secondaryLabel?: string;
}

export function TrainingMetricCard({
  label,
  value,
  unit = '',
  delta,
  deltaLabel,
  trend = 'neutral',
  secondaryValue,
  secondaryLabel,
}: TrainingMetricCardProps) {
  const trendColor =
    trend === 'up'
      ? 'text-green-600'
      : trend === 'down'
        ? 'text-red-600'
        : 'text-gray-600';

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <p className="text-xs text-muted-foreground mb-2">{label}</p>
      
      <div className="flex items-end justify-between">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">{value}</span>
            {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
          </div>

          {delta !== undefined && (
            <p className={cn('text-xs mt-1 font-medium', trendColor)}>
              {trend === 'up' ? '↑ ' : trend === 'down' ? '↓ ' : ''}
              {delta > 0 ? '+' : ''}{delta} {deltaLabel || ''}
            </p>
          )}

          {secondaryValue !== undefined && (
            <p className="text-xs text-muted-foreground mt-2">
              <span className="font-medium">{secondaryLabel}:</span> {secondaryValue}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
