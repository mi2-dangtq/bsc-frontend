'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
  LabelList,
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

interface PerspectiveBarChartProps {
  data: PerspectiveData[];
}

const chartConfig = {
  score: {
    label: 'Điểm số',
  },
} satisfies ChartConfig;

export function PerspectiveBarChart({ data }: PerspectiveBarChartProps) {
  const chartData = data.map((p) => ({
    name: p.name,
    nameEn: p.nameEn,
    score: p.score,
    fill: p.color || '#888',
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Điểm số theo Phương diện</CardTitle>
        <CardDescription>Hiệu suất từng phương diện trong kỳ</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
            <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
            <YAxis
              dataKey="name"
              type="category"
              tickLine={false}
              axisLine={false}
              width={120}
              tick={{ fontSize: 12 }}
            />
            <ChartTooltip
              content={<ChartTooltipContent />}
              formatter={(value) => [`${value}%`, 'Điểm số']}
            />
            <Bar dataKey="score" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
              <LabelList
                dataKey="score"
                position="right"
                formatter={(value: number) => `${value}%`}
                className="fill-foreground font-medium"
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
