'use client';

interface SkillContributionChartProps {
  planschePercent: number;
  frontPercent: number;
}

export function SkillContributionChart({
  planschePercent,
  frontPercent,
}: SkillContributionChartProps) {
  return (
    <div className="bg-card border rounded-lg p-6">
      <h2 className="text-lg font-semibold mb-6">Skill Contribution</h2>

      {/* Stacked Bar */}
      <div className="mb-6">
        <div className="flex h-12 rounded-lg overflow-hidden shadow-sm border">
          <div
            className="bg-blue-500 dark:bg-blue-600 flex items-center justify-center text-white font-semibold text-sm"
            style={{ width: `${planschePercent}%` }}
          >
            {planschePercent.toFixed(0)}%
          </div>
          <div
            className="bg-amber-500 dark:bg-amber-600 flex items-center justify-center text-white font-semibold text-sm"
            style={{ width: `${frontPercent}%` }}
          >
            {frontPercent.toFixed(0)}%
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-6">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-blue-500 dark:bg-blue-600"></div>
          <span className="text-sm font-medium">Planche</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-amber-500 dark:bg-amber-600"></div>
          <span className="text-sm font-medium">Front</span>
        </div>
      </div>
    </div>
  );
}
