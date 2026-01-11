'use client';

interface SkillLoadTrendProps {
  data: Array<{
    week: string;
    planche: number;
    front: number;
  }>;
}

export function SkillLoadTrend({ data }: SkillLoadTrendProps) {
  // Hide if less than 2 weeks of data
  if (!data || data.length < 2) {
    return (
      <div className="bg-card border rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Skill Load Trend</h2>
        <div className="p-8 text-center border border-dashed rounded-lg">
          <p className="text-muted-foreground text-sm">
            Need at least 2 weeks of data to display trends
          </p>
        </div>
      </div>
    );
  }

  // Calculate dimensions
  const width = 100;
  const height = 60;
  const padding = 8;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  // Find max value for scaling
  const maxLoad = Math.max(
    ...data.flatMap(d => [d.planche, d.front])
  );
  const scale = maxLoad > 0 ? chartHeight / maxLoad : 1;

  // Generate points for SVG lines
  const pointSpacing = chartWidth / (data.length - 1 || 1);

  let planchePath = `M ${padding}`;
  let frontPath = `M ${padding}`;

  data.forEach((d, i) => {
    const x = padding + i * pointSpacing;
    const planscheY = padding + chartHeight - (d.planche * scale);
    const frontY = padding + chartHeight - (d.front * scale);

    if (i === 0) {
      planchePath += ` ${planscheY}`;
      frontPath += ` ${frontY}`;
    } else {
      planchePath += ` L ${x} ${planscheY}`;
      frontPath += ` L ${x} ${frontY}`;
    }
  });

  return (
    <div className="bg-card border rounded-lg p-6">
      <h2 className="text-lg font-semibold mb-4">Skill Load Trend</h2>

      {/* Chart */}
      <div className="mb-6">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Grid lines */}
          <line
            x1={padding}
            y1={padding + chartHeight}
            x2={width - padding}
            y2={padding + chartHeight}
            stroke="currentColor"
            strokeWidth="0.5"
            className="text-muted-foreground/30"
          />

          {/* Planche line (blue) */}
          <path
            d={planchePath}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Front line (orange) */}
          <path
            d={frontPath}
            fill="none"
            stroke="#f97316"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points - Planche */}
          {data.map((d, i) => {
            const x = padding + i * pointSpacing;
            const y = padding + chartHeight - (d.planche * scale);
            return (
              <circle
                key={`planche-${i}`}
                cx={x}
                cy={y}
                r="1.5"
                fill="#3b82f6"
              />
            );
          })}

          {/* Data points - Front */}
          {data.map((d, i) => {
            const x = padding + i * pointSpacing;
            const y = padding + chartHeight - (d.front * scale);
            return (
              <circle
                key={`front-${i}`}
                cx={x}
                cy={y}
                r="1.5"
                fill="#f97316"
              />
            );
          })}

          {/* Week labels */}
          {data.map((d, i) => {
            if (data.length > 8 && i % 2 !== 0) return null; // Skip some labels if too many weeks
            const x = padding + i * pointSpacing;
            const y = height - 2;
            return (
              <text
                key={`label-${i}`}
                x={x}
                y={y}
                textAnchor="middle"
                fontSize="8"
                fill="currentColor"
                className="text-muted-foreground"
              >
                {d.week.split('-')[1]}
              </text>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex gap-6 justify-center text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-blue-500"></div>
          <span className="font-medium">Planche</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-orange-500"></div>
          <span className="font-medium">Front</span>
        </div>
      </div>

      {/* Current week comparison */}
      {data.length > 0 && (
        <div className="mt-4 pt-4 border-t flex gap-4 justify-center text-xs">
          <div className="text-center">
            <p className="text-muted-foreground">Current Planche</p>
            <p className="text-lg font-bold text-blue-600">
              {data[data.length - 1].planche}
            </p>
          </div>
          <div className="text-center">
            <p className="text-muted-foreground">Current Front</p>
            <p className="text-lg font-bold text-orange-600">
              {data[data.length - 1].front}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
