'use client';

import { TrainingWarning } from '@/lib/supabase/insights';

interface WarningCardProps {
  warnings: TrainingWarning[];
}

export function WarningCard({ warnings }: WarningCardProps) {
  if (warnings.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {warnings.map((warning, idx) => (
        <div
          key={idx}
          className={`border-l-4 rounded-lg p-4 ${
            warning.level === 'red'
              ? 'border-red-500 bg-red-50 dark:bg-red-950'
              : 'border-orange-500 bg-orange-50 dark:bg-orange-950'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <h4 className="font-semibold text-sm">
                {warning.message}
              </h4>
              <p className="text-xs text-muted-foreground mt-1">
                {warning.explanation}
              </p>
              <p className="text-xs font-mono mt-2 text-muted-foreground">
                Threshold: {warning.threshold}
              </p>
            </div>
            <div className={`text-2xl ${warning.level === 'red' ? 'text-red-600' : 'text-orange-600'}`}>
              {warning.level === 'red' ? '●' : '◐'}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
