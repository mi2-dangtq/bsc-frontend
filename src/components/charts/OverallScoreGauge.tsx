'use client';

import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts';

interface OverallScoreGaugeProps {
  score: number;
  label?: string;
}

function getScoreColor(score: number) {
  if (score >= 90) return '#22c55e'; // green
  if (score >= 70) return '#3b82f6'; // blue
  if (score >= 50) return '#f59e0b'; // amber
  return '#ef4444'; // red
}

function getScoreBg(score: number) {
  if (score >= 90) return 'bg-green-500/20';
  if (score >= 70) return 'bg-blue-500/20';
  if (score >= 50) return 'bg-amber-500/20';
  return 'bg-red-500/20';
}

export function OverallScoreGauge({ score, label = 'BSC Score' }: OverallScoreGaugeProps) {
  const data = [{ name: label, value: score, fill: getScoreColor(score) }];
  const color = getScoreColor(score);

  return (
    <div className="relative w-full max-w-[200px] mx-auto">
      <ResponsiveContainer width="100%" height={160}>
        <RadialBarChart
          innerRadius="70%"
          outerRadius="100%"
          data={data}
          startAngle={180}
          endAngle={0}
          cx="50%"
          cy="80%"
        >
          <PolarAngleAxis
            type="number"
            domain={[0, 100]}
            angleAxisId={0}
            tick={false}
          />
          <RadialBar
            background={{ fill: '#e5e7eb' }}
            dataKey="value"
            cornerRadius={10}
            fill={color}
          />
        </RadialBarChart>
      </ResponsiveContainer>
      {/* Overlay text - positioned absolutely */}
      <div 
        className="absolute inset-0 flex flex-col items-center justify-center"
        style={{ top: '20%' }}
      >
        <span 
          className="text-4xl font-bold"
          style={{ color }}
        >
          {score > 0 ? `${score}%` : 'N/A'}
        </span>
        <span className="text-sm text-muted-foreground mt-1">
          {label}
        </span>
      </div>
    </div>
  );
}
