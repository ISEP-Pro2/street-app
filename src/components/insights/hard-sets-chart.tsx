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

interface HardSetsChartProps {
  data: { week: string; count: number }[];
}

export function HardSetsChart({ data }: HardSetsChartProps) {
  return (
    <div className="w-full h-80 bg-card border border-border rounded-lg p-4">
      <h3 className="text-sm font-semibold mb-4">Hard Sets per Week (RPE ≥ 8)</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="week" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Bar dataKey="count" fill="#ef4444" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
