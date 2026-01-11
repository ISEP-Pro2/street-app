'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface GlobalScoreChartProps {
  data: { week: string; score: number }[];
  currentWeekScore?: number;
  previousWeekScore?: number;
}

export function GlobalScoreChart({
  data,
  currentWeekScore,
  previousWeekScore,
}: GlobalScoreChartProps) {
  const delta =
    currentWeekScore && previousWeekScore
      ? ((currentWeekScore - previousWeekScore) / previousWeekScore) * 100
      : 0;
  const deltaColor = delta > 0 ? 'text-green-600' : delta < 0 ? 'text-red-600' : 'text-gray-600';

  return (
    <div className="w-full bg-card border border-border rounded-lg p-4">
      <div className="mb-4">
        <div className="flex items-baseline gap-2">
          <h3 className="text-sm font-semibold">Weekly Global Score</h3>
          {currentWeekScore && (
            <>
              <span className="text-2xl font-bold">{Math.round(currentWeekScore)}</span>
              <span className={`text-sm font-medium ${deltaColor}`}>
                {delta > 0 ? '+' : ''}{delta.toFixed(1)}%
              </span>
            </>
          )}
        </div>
      </div>
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="week" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="score" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
