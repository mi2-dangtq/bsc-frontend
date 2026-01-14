'use client';

import {
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';

interface PerspectiveData {
  name: string;
  nameEn: string;
  score: number;
  color: string;
}

interface PerspectiveRadarChartProps {
  data: PerspectiveData[];
}

const chartConfig = {
  score: {
    label: 'Điểm số',
    color: '#6366f1', // Indigo
  },
} satisfies ChartConfig;

export function PerspectiveRadarChart({ data }: PerspectiveRadarChartProps) {
  // Transform data for radar chart
  const chartData = data.map((p) => ({
    perspective: p.name,
    score: p.score,
    fullMark: 100,
  }));

  return (
    <div className="p-6">
      <div className="mb-4">
        <h3 className="font-semibold text-lg">Radar Chart - 4 Phương diện</h3>
        <p className="text-sm text-muted-foreground">So sánh điểm số giữa các phương diện</p>
      </div>
      <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[280px]">
        <RechartsRadarChart data={chartData} cx="50%" cy="50%" outerRadius="75%">
          <defs>
            <linearGradient id="radarGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity={0.8} />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.3} />
            </linearGradient>
          </defs>
          <PolarGrid 
            gridType="polygon" 
            stroke="#e2e8f0"
            strokeDasharray="3 3"
          />
          <PolarAngleAxis
            dataKey="perspective"
            tick={{ fontSize: 11, fill: '#64748b' }}
            tickLine={false}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 100]}
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            tickCount={5}
            axisLine={false}
          />
          <ChartTooltip
            content={<ChartTooltipContent />}
            formatter={(value) => [`${value}%`, 'Điểm số']}
          />
          <Radar
            name="Điểm BSC"
            dataKey="score"
            stroke="#6366f1"
            strokeWidth={2.5}
            fill="url(#radarGradient)"
            fillOpacity={0.6}
            dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
          />
        </RechartsRadarChart>
      </ChartContainer>
    </div>
  );
}
