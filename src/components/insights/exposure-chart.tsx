'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ExposureData {
  week: string;
  raw_hold_seconds: number;
  etp_seconds: number;
  by_skill: {
    planche: { raw: number; etp: number };
    front: { raw: number; etp: number };
  };
}

interface ExposureChartProps {
  weeklyData: ExposureData[];
}

export function ExposureChart({ weeklyData }: ExposureChartProps) {
  const [maxETP, setMaxETP] = useState(0);

  useEffect(() => {
    const max = Math.max(...weeklyData.map((w) => w.etp_seconds));
    setMaxETP(max);
  }, [weeklyData]);

  if (!weeklyData || weeklyData.length < 2) {
    return (
      <Card className="p-6">
        <h3 className="font-semibold mb-4">📊 Weekly ETP Trend</h3>
        <Alert>
          <AlertDescription>Not enough data (need 2+ weeks)</AlertDescription>
        </Alert>
      </Card>
    );
  }

  const chartHeight = 300;
  const padding = 40;
  const width = Math.min(800, weeklyData.length * 80);
  const barWidth = Math.max(40, (width - padding * 2) / weeklyData.length);

  return (
    <Card className="p-6 overflow-x-auto">
      <h3 className="font-semibold mb-4">📊 Weekly ETP Trend</h3>
      <div className="flex justify-between mb-4 text-sm">
        <span className="text-blue-600">■ ETP (Weighted)</span>
        <span className="text-gray-400">■ Raw Hold Time (reference)</span>
      </div>

      <svg
        width={width + padding * 2}
        height={chartHeight + padding * 2}
        className="bg-slate-50 dark:bg-slate-900 rounded"
      >
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((percent) => (
          <line
            key={`grid-${percent}`}
            x1={padding}
            y1={padding + (1 - percent) * (chartHeight - padding)}
            x2={width + padding}
            y2={padding + (1 - percent) * (chartHeight - padding)}
            stroke="#e2e8f0"
            strokeDasharray="4"
          />
        ))}

        {/* Y-axis labels */}
        {[0, 0.25, 0.5, 0.75, 1].map((percent) => (
          <text
            key={`label-${percent}`}
            x={padding - 10}
            y={padding + (1 - percent) * (chartHeight - padding) + 4}
            fontSize="12"
            textAnchor="end"
            className="text-muted-foreground"
          >
            {Math.round(maxETP * percent)}s
          </text>
        ))}

        {/* X-axis and bars */}
        <line x1={padding} y1={chartHeight + padding} x2={width + padding} y2={chartHeight + padding} stroke="#ccc" />

        {weeklyData.map((week, idx) => {
          const x = padding + idx * barWidth + barWidth / 2;
          const etpHeight = ((week.etp_seconds / (maxETP || 1)) * (chartHeight - padding)) || 1;
          const rawHeight = ((week.raw_hold_seconds / (maxETP || 1)) * (chartHeight - padding)) || 1;

          return (
            <g key={week.week}>
              {/* Raw hold time bar (background) */}
              <rect
                x={x - barWidth / 4}
                y={chartHeight + padding - rawHeight}
                width={barWidth / 2}
                height={rawHeight}
                fill="#e2e8f0"
                className="opacity-50"
              />

              {/* ETP bar (foreground) */}
              <rect
                x={x - barWidth / 4 + 2}
                y={chartHeight + padding - etpHeight}
                width={barWidth / 2 - 4}
                height={etpHeight}
                fill="#3b82f6"
                className="hover:opacity-80"
              />

              {/* Week label */}
              <text
                x={x}
                y={chartHeight + padding + 20}
                fontSize="12"
                textAnchor="middle"
                className="text-muted-foreground"
              >
                {week.week}
              </text>

              {/* Tooltip on hover */}
              <title>
                {`${week.week}: ETP ${Math.round(week.etp_seconds)}s (Raw: ${Math.round(week.raw_hold_seconds)}s)`}
              </title>
            </g>
          );
        })}
      </svg>

      <div className="mt-4 text-sm text-muted-foreground">
        <p>
          📈 ETP = Effective Technical Exposure (weighted by technique + assistance)
        </p>
        <p>
          Latest week: {weeklyData[weeklyData.length - 1]?.etp_seconds.toFixed(0)}s ETP (~
          {weeklyData[weeklyData.length - 1]?.raw_hold_seconds.toFixed(0)}s raw)
        </p>
      </div>
    </Card>
  );
}

interface SkillETPChartProps {
  weeklyData: ExposureData[];
}

export function SkillETPChart({ weeklyData }: SkillETPChartProps) {
  if (!weeklyData || weeklyData.length < 2) {
    return null;
  }

  const latestWeek = weeklyData[weeklyData.length - 1];
  const prevWeek = weeklyData[weeklyData.length - 2];

  const plancheETP = latestWeek.by_skill.planche.etp;
  const frontETP = latestWeek.by_skill.front.etp;
  const totalETP = plancheETP + frontETP;

  const planchePercent = totalETP > 0 ? (plancheETP / totalETP) * 100 : 0;
  const frontPercent = totalETP > 0 ? (frontETP / totalETP) * 100 : 0;

  return (
    <Card className="p-6">
      <h3 className="font-semibold mb-4">⚔️ Skill ETP Split (Latest Week)</h3>

      <div className="space-y-4">
        {/* Planche */}
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium">Planche</span>
            <span className="text-sm text-muted-foreground">
              {plancheETP.toFixed(0)}s ETP ({planchePercent.toFixed(0)}%)
            </span>
          </div>
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all"
              style={{ width: `${planchePercent}%` }}
            />
          </div>
          {prevWeek && (
            <p className="text-xs text-muted-foreground mt-1">
              Previous: {prevWeek.by_skill.planche.etp.toFixed(0)}s (
              {((plancheETP / prevWeek.by_skill.planche.etp - 1) * 100).toFixed(0)}%)
            </p>
          )}
        </div>

        {/* Front */}
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium">Front Lever</span>
            <span className="text-sm text-muted-foreground">
              {frontETP.toFixed(0)}s ETP ({frontPercent.toFixed(0)}%)
            </span>
          </div>
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-600 transition-all"
              style={{ width: `${frontPercent}%` }}
            />
          </div>
          {prevWeek && (
            <p className="text-xs text-muted-foreground mt-1">
              Previous: {prevWeek.by_skill.front.etp.toFixed(0)}s (
              {((frontETP / prevWeek.by_skill.front.etp - 1) * 100).toFixed(0)}%)
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 text-xs text-muted-foreground border-t pt-3">
        <p>💡 ETP accounts for technique difficulty and assistance level</p>
      </div>
    </Card>
  );
}
