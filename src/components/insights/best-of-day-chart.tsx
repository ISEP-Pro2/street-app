'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface BestOfDayChartProps {
  data: { date: string; value: number }[];
  title: string;
  yLabel: string;
}

export function BestOfDayChart({ data, title, yLabel }: BestOfDayChartProps) {
  return (
    <div className="w-full h-80 bg-card border border-border rounded-lg p-4">
      <h3 className="text-sm font-semibold mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} label={{ value: yLabel, angle: -90, position: 'insideLeft' }} />
          <Tooltip />
          <Line type="monotone" dataKey="value" stroke="#10b981" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
