'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowUp, ArrowDown, FileSpreadsheet, Target, BarChart3, 
  TrendingUp, Users, Settings, GraduationCap 
} from 'lucide-react';
import { scorecardAPI, type ScorecardSummary, type ScorecardPerspective, type ScorecardKPI } from '@/lib/api';
import { DepartmentSelector } from '@/components/shared/DepartmentSelector';
import { useDepartment } from '@/contexts';

// Perspective configuration with colors, icons, and gradients
const PERSPECTIVE_CONFIG: Record<string, { 
  color: string; 
  gradient: string;
  Icon: React.ComponentType<{ className?: string }>;
}> = {
  'Tài chính': { 
    color: '#f59e0b', 
    gradient: 'from-amber-400 to-orange-500',
    Icon: TrendingUp 
  },
  'Khách hàng': { 
    color: '#3b82f6', 
    gradient: 'from-blue-400 to-indigo-500',
    Icon: Users 
  },
  'Quy trình nội bộ': { 
    color: '#10b981', 
    gradient: 'from-emerald-400 to-teal-500',
    Icon: Settings 
  },
  'Học hỏi & Phát triển': { 
    color: '#8b5cf6', 
    gradient: 'from-purple-400 to-violet-500',
    Icon: GraduationCap 
  },
};

export function ScorecardSummaryTable() {
  const { selectedDepartment } = useDepartment();
  const [data, setData] = useState<ScorecardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await scorecardAPI.getSummary({
          departmentId: selectedDepartment?.id,
          year: currentYear,
        });
        setData(result);
      } catch (err) {
        console.error('Error fetching scorecard:', err);
        setError('Không thể tải dữ liệu Scorecard');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedDepartment, currentYear]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!data || data.perspectives.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Chưa có dữ liệu KPI nào.</p>
            <p className="text-sm mt-2">
              Hãy thêm Mục tiêu, CSF và KPI trong phần Bản đồ chiến lược và Phân rã CSF.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate total rows for perspective/objective spanning
  const calculatePerspectiveRows = (perspective: ScorecardPerspective) => {
    return perspective.objectives.reduce((sum, obj) => sum + Math.max(obj.kpis.length, 1), 0);
  };

  const calculateObjectiveRows = (kpis: ScorecardKPI[]) => {
    return Math.max(kpis.length, 1);
  };

  return (
    <div className="space-y-4">
      {/* Stats Bar with gradient cards */}
      <div className="grid grid-cols-4 gap-3">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border">
          <DepartmentSelector showLabel={false} />
        </div>
        <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950/30 dark:to-indigo-900/30 border border-indigo-200 dark:border-indigo-800">
          <div className="p-2 rounded-lg bg-indigo-200 dark:bg-indigo-800">
            <FileSpreadsheet className="h-4 w-4 text-indigo-600 dark:text-indigo-300" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Năm</p>
            <p className="text-lg font-bold text-indigo-700 dark:text-indigo-400">{currentYear}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 border border-blue-200 dark:border-blue-800">
          <div className="p-2 rounded-lg bg-blue-200 dark:bg-blue-800">
            <Target className="h-4 w-4 text-blue-600 dark:text-blue-300" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Mục tiêu</p>
            <p className="text-lg font-bold text-blue-700 dark:text-blue-400">{data.totals.objectiveCount}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30 border border-purple-200 dark:border-purple-800">
          <div className="p-2 rounded-lg bg-purple-200 dark:bg-purple-800">
            <BarChart3 className="h-4 w-4 text-purple-600 dark:text-purple-300" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">KPIs</p>
            <p className="text-lg font-bold text-purple-700 dark:text-purple-400">{data.totals.kpiCount}</p>
          </div>
        </div>
      </div>

      {/* Scorecard Table */}
      <Card className="shadow-md border-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm">
        <CardHeader className="pb-3 border-b bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
          <CardTitle className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
              <FileSpreadsheet className="h-4 w-4 text-white" />
            </div>
            Bảng Tóm Tắt BSC - Balanced Scorecard
          </CardTitle>
          <CardDescription>
            {data.departmentName || 'Toàn công ty'} - Năm {data.year}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 border-b-2">
                  <TableHead className="w-[160px] font-bold text-slate-700 dark:text-slate-200">Góc Nhìn</TableHead>
                  <TableHead className="w-[180px] font-bold text-slate-700 dark:text-slate-200">Mục Tiêu</TableHead>
                  <TableHead className="w-[180px] font-bold text-slate-700 dark:text-slate-200">KPI</TableHead>
                  <TableHead className="w-[60px] font-bold text-center text-slate-700 dark:text-slate-200">Tỷ trọng</TableHead>
                  <TableHead className="w-[60px] font-bold text-center text-slate-700 dark:text-slate-200">Đơn vị</TableHead>
                  <TableHead className="w-[50px] font-bold text-center text-slate-700 dark:text-slate-200">Loại</TableHead>
                  <TableHead className="w-[70px] font-bold text-center text-slate-600 dark:text-slate-300">Min</TableHead>
                  <TableHead className="w-[70px] font-bold text-center text-slate-600 dark:text-slate-300">Ngưỡng</TableHead>
                  <TableHead className="w-[80px] font-bold text-center bg-primary/15 text-primary">Mục tiêu</TableHead>
                  <TableHead className="w-[70px] font-bold text-center text-slate-600 dark:text-slate-300">Max</TableHead>
                  <TableHead className="w-[100px] font-bold text-slate-700 dark:text-slate-200">Tần suất</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.perspectives.map((perspective, pIdx) => {
                  const perspectiveRowSpan = calculatePerspectiveRows(perspective);
                  const config = PERSPECTIVE_CONFIG[perspective.name] || { 
                    color: '#6b7280', 
                    gradient: 'from-slate-400 to-slate-500',
                    Icon: Target 
                  };
                  const PerspectiveIcon = config.Icon;

                  return perspective.objectives.map((objective, oIdx) => {
                    const objectiveRowSpan = calculateObjectiveRows(objective.kpis);

                    return objective.kpis.length > 0 ? (
                      objective.kpis.map((kpi, kIdx) => (
                        <TableRow 
                          key={`${perspective.id}-${objective.id}-${kpi.id}`}
                          className="group hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                        >
                          {/* Perspective cell - only on first row */}
                          {oIdx === 0 && kIdx === 0 && (
                            <TableCell 
                              rowSpan={perspectiveRowSpan}
                              className="align-top font-medium border-r-2"
                              style={{ 
                                borderLeft: `4px solid ${config.color}`,
                                backgroundColor: `${config.color}08`,
                              }}
                            >
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <div 
                                    className={`p-1.5 rounded-lg bg-gradient-to-br ${config.gradient} shadow-sm`}
                                    style={{ boxShadow: `0 2px 8px ${config.color}30` }}
                                  >
                                    <PerspectiveIcon className="h-3.5 w-3.5 text-white" />
                                  </div>
                                  <span className="text-sm font-bold" style={{ color: config.color }}>
                                    {perspective.name}
                                  </span>
                                </div>
                                {perspective.weight && (
                                  <Badge 
                                    variant="secondary" 
                                    className="text-xs font-semibold"
                                    style={{ backgroundColor: `${config.color}15`, color: config.color }}
                                  >
                                    {perspective.weight}%
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                          )}

                          {/* Objective cell - only on first KPI of each objective */}
                          {kIdx === 0 && (
                            <TableCell 
                              rowSpan={objectiveRowSpan}
                              className="align-top border-r"
                            >
                              <div className="space-y-1">
                                {objective.code && (
                                  <Badge variant="outline" className="text-xs">
                                    {objective.code}
                                  </Badge>
                                )}
                                <p className="text-sm">{objective.name}</p>
                                {objective.weight && (
                                  <span className="text-xs text-muted-foreground">
                                    {objective.weight}%
                                  </span>
                                )}
                              </div>
                            </TableCell>
                          )}

                          {/* KPI Name */}
                          <TableCell className="text-sm">{kpi.name}</TableCell>

                          {/* KPI Weight */}
                          <TableCell className="text-center">
                            {kpi.weight ? (
                              <Badge 
                                variant="outline" 
                                className="text-xs font-medium"
                                style={{ 
                                  backgroundColor: `${config.color}15`,
                                  borderColor: config.color,
                                  color: config.color 
                                }}
                              >
                                {kpi.weight}%
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-xs">-</span>
                            )}
                          </TableCell>

                          {/* Unit */}
                          <TableCell className="text-center text-sm text-muted-foreground">
                            {kpi.unit || '-'}
                          </TableCell>

                          {/* Trend */}
                          <TableCell className="text-center">
                            {kpi.trend === 'POSITIVE' ? (
                              <Badge variant="default" className="bg-green-500 text-xs px-1">
                                <ArrowUp className="h-3 w-3" />
                              </Badge>
                            ) : (
                              <Badge variant="destructive" className="text-xs px-1">
                                <ArrowDown className="h-3 w-3" />
                              </Badge>
                            )}
                          </TableCell>

                          {/* Target values */}
                          <TableCell className="text-center text-sm">
                            {kpi.targetMin ?? '-'}
                          </TableCell>
                          <TableCell className="text-center text-sm">
                            {kpi.targetThreshold ?? '-'}
                          </TableCell>
                          <TableCell className="text-center text-sm font-medium bg-primary/5">
                            {kpi.targetGoal}
                          </TableCell>
                          <TableCell className="text-center text-sm">
                            {kpi.targetMax ?? '-'}
                          </TableCell>

                          {/* Frequency */}
                          <TableCell className="text-sm text-muted-foreground">
                            {kpi.frequency === 'MONTHLY' && 'Tháng'}
                            {kpi.frequency === 'QUARTERLY' && 'Quý'}
                            {kpi.frequency === 'YEARLY' && 'Năm'}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      // Objective without KPIs
                      <TableRow key={`${perspective.id}-${objective.id}-empty`} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                        {oIdx === 0 && (
                          <TableCell 
                            rowSpan={perspectiveRowSpan}
                            className="align-top font-medium border-r-2"
                            style={{ 
                              borderLeft: `4px solid ${config.color}`,
                              backgroundColor: `${config.color}08`,
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <div 
                                className={`p-1.5 rounded-lg bg-gradient-to-br ${config.gradient} shadow-sm`}
                                style={{ boxShadow: `0 2px 8px ${config.color}30` }}
                              >
                                <PerspectiveIcon className="h-3.5 w-3.5 text-white" />
                              </div>
                              <span className="text-sm font-bold" style={{ color: config.color }}>
                                {perspective.name}
                              </span>
                            </div>
                          </TableCell>
                        )}
                        <TableCell className="align-top border-r">
                          {objective.name}
                        </TableCell>
                        <TableCell colSpan={9} className="text-center text-muted-foreground text-sm italic">
                          Chưa có KPI
                        </TableCell>
                      </TableRow>
                    );
                  });
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
