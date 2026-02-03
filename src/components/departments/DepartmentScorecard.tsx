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
  BarChart3,
  Target,
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface DepartmentKpiScore {
  allocationId: number;
  kpiName: string;
  unit: string | null;
  trend: 'POSITIVE' | 'NEGATIVE';
  weight: number;
  targetGoal: number;
  actualValue: number | null;
  performanceScore: number;
  weightedScore: number;
  status: 'NOT_MEASURED' | 'FAIL' | 'BELOW_TARGET' | 'ON_TARGET' | 'ABOVE_TARGET';
}

interface DepartmentObjectiveScore {
  objectiveId: number;
  objectiveCode: string | null;
  objectiveName: string;
  objectiveWeight: number;
  kpis: DepartmentKpiScore[];
  aggregateScore: number;
  weightedScore: number;
  kpiCount: number;
  measuredCount: number;
}

interface DepartmentPerspectiveScore {
  perspectiveId: number;
  perspectiveName: string;
  perspectiveWeight: number;
  color: string | null;
  objectives: DepartmentObjectiveScore[];
  aggregateScore: number;
  weightedScore: number;
  objectiveCount: number;
  kpiCount: number;
  measuredCount: number;
}

interface DepartmentScorecardData {
  departmentId: string;
  departmentName: string;
  year: number;
  period: string | null;
  perspectives: DepartmentPerspectiveScore[];
  overallScore: number;
  totalKpis: number;
  measuredKpis: number;
  measurementProgress: number;
}

interface DepartmentScorecardProps {
  departmentId: string;
  departmentName?: string;
  year?: number;
  period?: string;
}

// Color mapping for perspectives
const perspectiveColors: Record<number, string> = {
  1: 'from-amber-500 to-orange-600',
  2: 'from-cyan-500 to-blue-600',
  3: 'from-emerald-500 to-green-600',
  4: 'from-purple-500 to-indigo-600',
};

const perspectiveBgColors: Record<number, string> = {
  1: 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800',
  2: 'bg-cyan-50 border-cyan-200 dark:bg-cyan-950/30 dark:border-cyan-800',
  3: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800',
  4: 'bg-purple-50 border-purple-200 dark:bg-purple-950/30 dark:border-purple-800',
};

const statusConfig = {
  NOT_MEASURED: { icon: AlertCircle, color: 'text-slate-400', label: 'Chưa đo', bg: 'bg-slate-100' },
  FAIL: { icon: XCircle, color: 'text-red-500', label: 'Không đạt', bg: 'bg-red-100' },
  BELOW_TARGET: { icon: AlertCircle, color: 'text-amber-500', label: 'Dưới mục tiêu', bg: 'bg-amber-100' },
  ON_TARGET: { icon: CheckCircle, color: 'text-blue-500', label: 'Đạt mục tiêu', bg: 'bg-blue-100' },
  ABOVE_TARGET: { icon: TrendingUp, color: 'text-emerald-500', label: 'Vượt mục tiêu', bg: 'bg-emerald-100' },
};

export function DepartmentScorecard({
  departmentId,
  departmentName,
  year,
  period,
}: DepartmentScorecardProps) {
  const [scorecard, setScorecard] = useState<DepartmentScorecardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedPerspectives, setExpandedPerspectives] = useState<Set<number>>(new Set());

  const currentYear = year || new Date().getFullYear();

  const fetchScorecard = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('year', currentYear.toString());
      if (period) params.append('period', period);

      const res = await fetch(`${API_URL}/departments/${departmentId}/scorecard?${params}`);
      if (!res.ok) throw new Error('Failed to fetch scorecard');
      const data = await res.json();
      setScorecard(data);
      // Auto-expand all perspectives
      setExpandedPerspectives(new Set(data.perspectives.map((p: DepartmentPerspectiveScore) => p.perspectiveId)));
    } catch (err) {
      setError('Không thể tải scorecard');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScorecard();
  }, [departmentId, currentYear, period]);

  const togglePerspective = (id: number) => {
    setExpandedPerspectives((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!scorecard) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <BarChart3 className="h-12 w-12 mx-auto text-slate-300 mb-3" />
          <p className="text-muted-foreground">Không tìm thấy dữ liệu scorecard</p>
        </CardContent>
      </Card>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 50) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <Card className="shadow-lg border-0">
      <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle>{departmentName || scorecard.departmentName}</CardTitle>
              <CardDescription>
                Scorecard năm {scorecard.year}
                {scorecard.period && ` - ${scorecard.period}`}
              </CardDescription>
            </div>
          </div>
          <div className="text-right">
            <div className={cn('text-3xl font-bold', getScoreColor(scorecard.overallScore))}>
              {scorecard.overallScore.toFixed(1)}
            </div>
            <div className="text-xs text-muted-foreground">Điểm tổng hợp</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30">
            <div className="text-2xl font-bold text-blue-600">{scorecard.totalKpis}</div>
            <div className="text-xs text-muted-foreground">Tổng KPI</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
            <div className="text-2xl font-bold text-emerald-600">{scorecard.measuredKpis}</div>
            <div className="text-xs text-muted-foreground">Đã đo lường</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-purple-50 dark:bg-purple-950/30">
            <div className="text-2xl font-bold text-purple-600">
              {scorecard.measurementProgress.toFixed(0)}%
            </div>
            <div className="text-xs text-muted-foreground">Tiến độ</div>
          </div>
        </div>

        {/* Perspectives */}
        {scorecard.perspectives.length === 0 ? (
          <div className="text-center py-8">
            <Target className="h-10 w-10 mx-auto text-slate-300 mb-3" />
            <p className="text-muted-foreground">Chưa có KPI nào được phân bổ</p>
          </div>
        ) : (
          <div className="space-y-4">
            {scorecard.perspectives.map((perspective) => (
              <div
                key={perspective.perspectiveId}
                className={cn(
                  'rounded-xl border overflow-hidden',
                  perspectiveBgColors[perspective.perspectiveId] || 'bg-slate-50 border-slate-200'
                )}
              >
                {/* Perspective Header */}
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/50 transition-colors"
                  onClick={() => togglePerspective(perspective.perspectiveId)}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-5">
                      {expandedPerspectives.has(perspective.perspectiveId) ? (
                        <ChevronDown className="h-5 w-5" />
                      ) : (
                        <ChevronRight className="h-5 w-5" />
                      )}
                    </span>
                    <div
                      className={cn(
                        'w-3 h-3 rounded-full bg-gradient-to-r',
                        perspectiveColors[perspective.perspectiveId] || 'from-slate-400 to-slate-500'
                      )}
                    />
                    <span className="font-medium">{perspective.perspectiveName}</span>
                    <Badge variant="outline" className="text-xs">
                      {perspective.kpiCount} KPI
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className={cn('text-lg font-bold', getScoreColor(perspective.aggregateScore))}>
                        {perspective.aggregateScore.toFixed(1)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Trọng số: {perspective.perspectiveWeight}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Objectives & KPIs */}
                {expandedPerspectives.has(perspective.perspectiveId) && (
                  <div className="px-4 pb-4 space-y-3">
                    {perspective.objectives.map((objective) => (
                      <div
                        key={objective.objectiveId}
                        className="bg-white dark:bg-slate-900 rounded-lg p-3 border"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">
                            {objective.objectiveCode && (
                              <span className="text-muted-foreground mr-2">
                                [{objective.objectiveCode}]
                              </span>
                            )}
                            {objective.objectiveName}
                          </span>
                          <span className={cn('font-bold', getScoreColor(objective.aggregateScore))}>
                            {objective.aggregateScore.toFixed(1)}
                          </span>
                        </div>
                        <div className="space-y-2">
                          {objective.kpis.map((kpi) => {
                            const status = statusConfig[kpi.status];
                            const StatusIcon = status.icon;
                            return (
                              <div
                                key={kpi.allocationId}
                                className="flex items-center gap-3 text-sm bg-slate-50 dark:bg-slate-800 rounded-lg p-2"
                              >
                                <StatusIcon className={cn('h-4 w-4', status.color)} />
                                <span className="flex-1 truncate">{kpi.kpiName}</span>
                                <span className="text-muted-foreground">
                                  {kpi.actualValue !== null
                                    ? `${kpi.actualValue} / ${kpi.targetGoal}`
                                    : '—'}
                                  {kpi.unit && ` ${kpi.unit}`}
                                </span>
                                <span className={cn('font-medium', getScoreColor(kpi.performanceScore))}>
                                  {kpi.performanceScore.toFixed(0)}%
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
