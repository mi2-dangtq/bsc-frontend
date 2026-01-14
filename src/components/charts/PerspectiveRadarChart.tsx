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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

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
    color: 'hsl(var(--chart-1))',
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
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Radar Chart - 4 Phương diện BSC</CardTitle>
        <CardDescription>So sánh điểm số giữa các phương diện</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[300px]">
          <RechartsRadarChart data={chartData}>
            <PolarGrid gridType="polygon" />
            <PolarAngleAxis
              dataKey="perspective"
              tick={{ fontSize: 12 }}
              tickLine={false}
            />
            <PolarRadiusAxis
              angle={30}
              domain={[0, 100]}
              tick={{ fontSize: 10 }}
              tickCount={5}
            />
            <ChartTooltip
              content={<ChartTooltipContent />}
              formatter={(value) => [`${value}%`, 'Điểm số']}
            />
            <Radar
              name="Điểm BSC"
              dataKey="score"
              stroke="hsl(var(--primary))"
              fill="hsl(var(--primary))"
              fillOpacity={0.4}
              strokeWidth={2}
            />
          </RechartsRadarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
