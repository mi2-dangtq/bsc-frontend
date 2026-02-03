'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Trophy,
  TrendingUp,
  TrendingDown,
  Minus,
  Loader2,
  Medal,
  Star,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface DepartmentRankingItem {
  rank: number;
  departmentId: string;
  departmentName: string;
  primaryPerspective: string | null;
  overallScore: number;
  measurementProgress: number;
  trend: 'UP' | 'DOWN' | 'STABLE' | 'NEW';
}

interface DepartmentRankingProps {
  year?: number;
  period?: string;
}

// Medal colors for top 3
const medalColors = {
  1: 'from-amber-400 to-yellow-500',
  2: 'from-slate-300 to-slate-400',
  3: 'from-amber-600 to-orange-700',
};

const medalBgColors = {
  1: 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800',
  2: 'bg-slate-50 border-slate-200 dark:bg-slate-950/30 dark:border-slate-800',
  3: 'bg-orange-50 border-orange-200 dark:bg-orange-950/30 dark:border-orange-800',
};

export function DepartmentRanking({ year, period }: DepartmentRankingProps) {
  const [ranking, setRanking] = useState<DepartmentRankingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentYear = year || new Date().getFullYear();

  const fetchRanking = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('year', currentYear.toString());
      if (period) params.append('period', period);

      const res = await fetch(`${API_URL}/departments/scorecard/ranking?${params}`);
      if (!res.ok) throw new Error('Failed to fetch ranking');
      const data = await res.json();
      setRanking(data);
    } catch (err) {
      setError('Không thể tải bảng xếp hạng');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRanking();
  }, [currentYear, period]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const TrendIcon = ({ trend }: { trend: DepartmentRankingItem['trend'] }) => {
    switch (trend) {
      case 'UP':
        return <TrendingUp className="h-4 w-4 text-emerald-500" />;
      case 'DOWN':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'STABLE':
        return <Minus className="h-4 w-4 text-slate-400" />;
      case 'NEW':
        return <Star className="h-4 w-4 text-amber-500" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-600 dark:text-emerald-400';
    if (score >= 70) return 'text-blue-600 dark:text-blue-400';
    if (score >= 50) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <Card className="shadow-lg border-0">
      <CardHeader className="border-b bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600">
            <Trophy className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle>Bảng xếp hạng phòng ban</CardTitle>
            <CardDescription>Năm {currentYear} - Theo điểm BSC tổng hợp</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {ranking.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="h-12 w-12 mx-auto text-slate-300 mb-3" />
            <p className="text-muted-foreground">Chưa có dữ liệu xếp hạng</p>
            <p className="text-sm text-muted-foreground">
              Cần phân bổ KPI và nhập kết quả đo lường
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {ranking.map((item) => (
              <div
                key={item.departmentId}
                className={cn(
                  'flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors',
                  item.rank <= 3 && medalBgColors[item.rank as 1 | 2 | 3]
                )}
              >
                {/* Rank */}
                <div className="flex-shrink-0 w-12">
                  {item.rank <= 3 ? (
                    <div
                      className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br shadow-md',
                        medalColors[item.rank as 1 | 2 | 3]
                      )}
                    >
                      <Medal className="h-5 w-5 text-white" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-800">
                      <span className="text-lg font-bold text-slate-500">
                        {item.rank}
                      </span>
                    </div>
                  )}
                </div>

                {/* Department Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">
                      {item.departmentName}
                    </span>
                    <TrendIcon trend={item.trend} />
                  </div>
                  {item.primaryPerspective && (
                    <Badge variant="outline" className="text-xs mt-1">
                      {item.primaryPerspective}
                    </Badge>
                  )}
                </div>

                {/* Score */}
                <div className="flex-shrink-0 text-right">
                  <div className={cn('text-2xl font-bold', getScoreColor(item.overallScore))}>
                    {item.overallScore.toFixed(1)}
                  </div>
                  <div className="text-xs text-muted-foreground">điểm</div>
                </div>

                {/* Progress */}
                <div className="flex-shrink-0 w-24">
                  <div className="text-xs text-muted-foreground mb-1">
                    Tiến độ đo lường
                  </div>
                  <Progress value={item.measurementProgress} className="h-1.5" />
                  <div className="text-xs text-right text-muted-foreground mt-0.5">
                    {item.measurementProgress.toFixed(0)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
