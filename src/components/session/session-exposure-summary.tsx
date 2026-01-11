'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { calcSessionExposure } from '@/lib/exposure';
import type { ExposureEntry } from '@/lib/exposure';

interface SessionExposureSummaryProps {
  sessionId: string;
}

export function SessionExposureSummary({ sessionId }: SessionExposureSummaryProps) {
  const [exposure, setExposure] = useState<{
    raw_hold_seconds: number;
    etp_seconds: number;
    by_skill: { planche: { raw: number; etp: number }; front: { raw: number; etp: number } };
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExposure = async () => {
      try {
        const response = await fetch(`/api/session/${sessionId}/exposure`);
        const data = await response.json();
        setExposure(data.exposure || null);
      } catch (err) {
        console.error('Failed to fetch exposure:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchExposure();
  }, [sessionId]);

  if (loading || !exposure) {
    return null;
  }

  const planschePercent =
    exposure.by_skill.planche.etp + exposure.by_skill.front.etp > 0
      ? (exposure.by_skill.planche.etp / (exposure.by_skill.planche.etp + exposure.by_skill.front.etp)) * 100
      : 0;

  return (
    <Card className="p-4 bg-gradient-to-r from-blue-50 to-amber-50 dark:from-blue-950 dark:to-amber-950">
      <h4 className="font-semibold text-sm mb-3">📊 Exposure Summary</h4>

      <div className="grid grid-cols-2 gap-3">
        {/* Raw Hold Time */}
        <div>
          <p className="text-xs text-muted-foreground">Raw Hold Time</p>
          <p className="text-lg font-bold">{exposure.raw_hold_seconds.toFixed(0)}s</p>
        </div>

        {/* ETP (Weighted) */}
        <div>
          <p className="text-xs text-muted-foreground">ETP (Weighted)</p>
          <p className="text-lg font-bold text-blue-600">{exposure.etp_seconds.toFixed(0)}s</p>
        </div>

        {/* Planche ETP */}
        <div>
          <p className="text-xs text-muted-foreground">Planche ETP</p>
          <p className="text-sm font-semibold text-blue-600">
            {exposure.by_skill.planche.etp.toFixed(0)}s ({planschePercent.toFixed(0)}%)
          </p>
        </div>

        {/* Front ETP */}
        <div>
          <p className="text-xs text-muted-foreground">Front ETP</p>
          <p className="text-sm font-semibold text-amber-600">
            {exposure.by_skill.front.etp.toFixed(0)}s ({(100 - planschePercent).toFixed(0)}%)
          </p>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mt-3 border-t pt-2">
        💡 ETP = Raw seconds × Technique Factor × Assistance Factor
      </p>
    </Card>
  );
}
