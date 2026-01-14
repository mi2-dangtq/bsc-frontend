'use client';

import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts';

interface OverallScoreGaugeProps {
  score: number;
  label?: string;
}

function getScoreColor(score: number) {
  if (score >= 90) return '#10b981'; // Emerald
  if (score >= 70) return '#3b82f6'; // Blue  
  if (score >= 50) return '#f59e0b'; // Amber
  return '#ef4444'; // Red
}

function getScoreGradient(score: number) {
  if (score >= 90) return ['#10b981', '#059669'];
  if (score >= 70) return ['#3b82f6', '#2563eb'];
  if (score >= 50) return ['#f59e0b', '#d97706'];
  return ['#ef4444', '#dc2626'];
}

export function OverallScoreGauge({ score, label = 'BSC Score' }: OverallScoreGaugeProps) {
  const [color1, color2] = getScoreGradient(score);
  const data = [{ name: label, value: score, fill: color1 }];

  return (
    <div className="relative w-full max-w-[200px] mx-auto">
      <ResponsiveContainer width="100%" height={160}>
        <RadialBarChart
          innerRadius="65%"
          outerRadius="100%"
          data={data}
          startAngle={180}
          endAngle={0}
          cx="50%"
          cy="80%"
        >
          <defs>
            <linearGradient id="gaugeGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={color1} />
              <stop offset="100%" stopColor={color2} />
            </linearGradient>
          </defs>
          <PolarAngleAxis
            type="number"
            domain={[0, 100]}
            angleAxisId={0}
            tick={false}
          />
          <RadialBar
            background={{ fill: 'rgba(255,255,255,0.2)' }}
            dataKey="value"
            cornerRadius={15}
            fill="url(#gaugeGradient)"
          />
        </RadialBarChart>
      </ResponsiveContainer>
      
      {/* Overlay text */}
      <div 
        className="absolute inset-0 flex flex-col items-center justify-center"
        style={{ top: '15%' }}
      >
        <span 
          className="text-5xl font-bold drop-shadow-lg"
          style={{ color: '#fff' }}
        >
          {score > 0 ? `${score}%` : 'N/A'}
        </span>
        <span className="text-sm text-slate-300 mt-1 font-medium">
          {label}
        </span>
      </div>
    </div>
  );
}
