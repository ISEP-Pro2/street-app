'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { User } from '@supabase/supabase-js';

interface TrainingStats {
  currentWeek?: {
    global_score: number;
    week: string;
    total_sets: number;
    hard_sets: number;
    hold_seconds_planche: number;
    dynamic_reps_planche: number;
    hold_seconds_front: number;
    dynamic_reps_front: number;
    hard_ratio: number;
  } | null;
  previousWeeks?: any[];
  rampPercentage: number;
  hardSetsDelta: number;
  warnings: any[];
}

interface SkillDrillDownProps {
  trainingStats: TrainingStats;
  user: User;
}

export function SkillDrillDown({
  trainingStats,
  user,
}: SkillDrillDownProps) {
  const [planscheOpen, setPlanscheOpen] = useState(false);
  const [frontOpen, setFrontOpen] = useState(false);
  const [timeRange, setTimeRange] = useState<'7' | '28' | '90'>('28');

  const currentWeek = trainingStats.currentWeek;
  if (!currentWeek) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Time Range Selector */}
      <div className="flex gap-2 justify-center">
        {(['7', '28', '90'] as const).map((range) => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`px-4 py-2 rounded text-sm font-medium transition ${
              timeRange === range
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            {range} days
          </button>
        ))}
      </div>

      {/* Planche Details */}
      <div className="border border-border rounded-lg overflow-hidden">
        <button
          onClick={() => setPlanscheOpen(!planscheOpen)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-secondary/50 transition text-left"
        >
          <span className="text-sm font-semibold">▸ Planche Details</span>
          <ChevronDown
            className={`w-4 h-4 transition transform ${planscheOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {planscheOpen && (
          <div className="px-4 py-4 bg-secondary/30 space-y-4 border-t">
            {/* Focus KPIs */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-card border rounded p-3">
                <p className="text-xs text-muted-foreground mb-1">Hold KPI</p>
                <p className="text-2xl font-bold">
                  {Math.round(currentWeek.hold_seconds_planche)}
                </p>
                <p className="text-xs text-muted-foreground">seconds</p>
              </div>
              <div className="bg-card border rounded p-3">
                <p className="text-xs text-muted-foreground mb-1">Dynamic KPI</p>
                <p className="text-2xl font-bold">
                  {currentWeek.dynamic_reps_planche}
                </p>
                <p className="text-xs text-muted-foreground">reps</p>
              </div>
            </div>

            {/* Best Performance (30 days placeholder) */}
            <div className="text-xs text-muted-foreground">
              <p className="font-medium mb-2">Best Performance (30 days)</p>
              <p>📊 Charts would load here based on time range</p>
            </div>
          </div>
        )}
      </div>

      {/* Front Details */}
      <div className="border border-border rounded-lg overflow-hidden">
        <button
          onClick={() => setFrontOpen(!frontOpen)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-secondary/50 transition text-left"
        >
          <span className="text-sm font-semibold">▸ Front Details</span>
          <ChevronDown
            className={`w-4 h-4 transition transform ${frontOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {frontOpen && (
          <div className="px-4 py-4 bg-secondary/30 space-y-4 border-t">
            {/* Focus KPIs */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-card border rounded p-3">
                <p className="text-xs text-muted-foreground mb-1">Hold KPI</p>
                <p className="text-2xl font-bold">
                  {Math.round(currentWeek.hold_seconds_front)}
                </p>
                <p className="text-xs text-muted-foreground">seconds</p>
              </div>
              <div className="bg-card border rounded p-3">
                <p className="text-xs text-muted-foreground mb-1">Dynamic KPI</p>
                <p className="text-2xl font-bold">
                  {currentWeek.dynamic_reps_front}
                </p>
                <p className="text-xs text-muted-foreground">reps</p>
              </div>
            </div>

            {/* Best Performance (30 days placeholder) */}
            <div className="text-xs text-muted-foreground">
              <p className="font-medium mb-2">Best Performance (30 days)</p>
              <p>📊 Charts would load here based on time range</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
