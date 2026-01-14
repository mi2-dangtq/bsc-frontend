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

interface PerspectiveData {
  name: string;
  nameEn: string;
  score: number;
  color: string;
}

interface PerspectiveBarChartProps {
  data: PerspectiveData[];
}

// Enhanced colors for each perspective
const perspectiveColors: Record<string, string> = {
  'Tài chính': '#10b981',           // Emerald
  'Khách hàng': '#3b82f6',          // Blue
  'Quy trình nội bộ': '#f59e0b',    // Amber
  'Học hỏi & Phát triển': '#8b5cf6', // Violet
};

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
    fill: perspectiveColors[p.name] || p.color || '#64748b',
  }));

  return (
    <div className="p-6">
      <div className="mb-4">
        <h3 className="font-semibold text-lg">Điểm số theo Phương diện</h3>
        <p className="text-sm text-muted-foreground">Hiệu suất từng phương diện trong kỳ</p>
      </div>
      <ChartContainer config={chartConfig} className="h-[250px] w-full">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 40, left: 0, bottom: 5 }}
        >
          <defs>
            {chartData.map((entry, index) => (
              <linearGradient key={`gradient-${index}`} id={`barGradient-${index}`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={entry.fill} stopOpacity={0.9} />
                <stop offset="100%" stopColor={entry.fill} stopOpacity={0.6} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid 
            strokeDasharray="3 3" 
            horizontal={true} 
            vertical={false} 
            stroke="#e2e8f0"
          />
          <XAxis 
            type="number" 
            domain={[0, 100]} 
            tickFormatter={(v) => `${v}%`}
            tick={{ fontSize: 11, fill: '#64748b' }}
            axisLine={{ stroke: '#e2e8f0' }}
          />
          <YAxis
            dataKey="name"
            type="category"
            tickLine={false}
            axisLine={false}
            width={130}
            tick={{ fontSize: 12, fill: '#374151' }}
          />
          <ChartTooltip
            content={<ChartTooltipContent />}
            formatter={(value) => [`${value}%`, 'Điểm số']}
          />
          <Bar 
            dataKey="score" 
            radius={[0, 8, 8, 0]}
            barSize={28}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={`url(#barGradient-${index})`} />
            ))}
            <LabelList
              dataKey="score"
              position="right"
              formatter={(value: number) => `${value}%`}
              style={{ fontSize: 12, fontWeight: 600, fill: '#374151' }}
            />
          </Bar>
        </BarChart>
      </ChartContainer>
    </div>
  );
}
