'use client';

interface TrainingStatusCardProps {
  currentScore: number;
  scoreChange: number;
  hardSets: number;
  rampPercentage: number;
}

export function TrainingStatusCard({
  currentScore,
  scoreChange,
  hardSets,
  rampPercentage,
}: TrainingStatusCardProps) {
  // Determine status based on score change and hard sets
  let status: 'stable' | 'rising' | 'overload';
  let emoji: string;
  let message: string;
  let color: string;

  if (scoreChange > 15 || hardSets > 12) {
    status = 'overload';
    emoji = '🔴';
    message = 'Risque de surcharge — deload recommandé';
    color = 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800';
  } else if (scoreChange > 5) {
    status = 'rising';
    emoji = '🟠';
    message = 'Charge en hausse rapide — surveille la récupération';
    color = 'bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800';
  } else {
    status = 'stable';
    emoji = '🟢';
    message = 'Charge maîtrisée — progression stable';
    color = 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800';
  }

  return (
    <div className={`border rounded-lg p-6 ${color}`}>
      <div className="flex items-start gap-4">
        <div className="text-4xl">{emoji}</div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold mb-2">Training Status</h2>
          <p className="text-sm font-medium">{message}</p>
          <div className="mt-3 grid grid-cols-3 gap-4 text-xs">
            <div>
              <p className="text-muted-foreground">Global Score</p>
              <p className="text-lg font-bold">{Math.round(currentScore)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Week Change</p>
              <p className={`text-lg font-bold ${scoreChange > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                {scoreChange > 0 ? '+' : ''}{scoreChange.toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Hard Sets</p>
              <p className="text-lg font-bold">{hardSets}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
