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
import { ArrowUp, ArrowDown, FileSpreadsheet, Target, BarChart3 } from 'lucide-react';
import { scorecardAPI, type ScorecardSummary, type ScorecardPerspective, type ScorecardKPI } from '@/lib/api';
import { DepartmentSelector } from '@/components/shared/DepartmentSelector';
import { useDepartment } from '@/contexts';

// Perspective colors
const PERSPECTIVE_COLORS: Record<string, string> = {
  'Tài chính': '#f59e0b',
  'Khách hàng': '#3b82f6',
  'Quy trình nội bộ': '#10b981',
  'Học hỏi & Phát triển': '#8b5cf6',
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
      {/* Header with filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <DepartmentSelector />
          <Badge variant="outline" className="text-sm">
            Năm {currentYear}
          </Badge>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Target className="h-4 w-4" />
            {data.totals.objectiveCount} Mục tiêu
          </span>
          <span className="flex items-center gap-1">
            <BarChart3 className="h-4 w-4" />
            {data.totals.kpiCount} KPIs
          </span>
        </div>
      </div>

      {/* Scorecard Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
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
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[140px] font-semibold">Góc Nhìn</TableHead>
                  <TableHead className="w-[180px] font-semibold">Mục Tiêu</TableHead>
                  <TableHead className="w-[180px] font-semibold">KPI</TableHead>
                  <TableHead className="w-[60px] font-semibold text-center">Tỷ trọng</TableHead>
                  <TableHead className="w-[60px] font-semibold text-center">Đơn vị</TableHead>
                  <TableHead className="w-[50px] font-semibold text-center">Loại</TableHead>
                  <TableHead className="w-[70px] font-semibold text-center">Min</TableHead>
                  <TableHead className="w-[70px] font-semibold text-center">Ngưỡng</TableHead>
                  <TableHead className="w-[80px] font-semibold text-center bg-primary/10">Mục tiêu</TableHead>
                  <TableHead className="w-[70px] font-semibold text-center">Max</TableHead>
                  <TableHead className="w-[100px] font-semibold">Tần suất</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.perspectives.map((perspective, pIdx) => {
                  const perspectiveRowSpan = calculatePerspectiveRows(perspective);
                  const perspectiveColor = PERSPECTIVE_COLORS[perspective.name] || '#6b7280';

                  return perspective.objectives.map((objective, oIdx) => {
                    const objectiveRowSpan = calculateObjectiveRows(objective.kpis);

                    return objective.kpis.length > 0 ? (
                      objective.kpis.map((kpi, kIdx) => (
                        <TableRow 
                          key={`${perspective.id}-${objective.id}-${kpi.id}`}
                          className={pIdx % 2 === 0 ? 'bg-background' : 'bg-muted/30'}
                        >
                          {/* Perspective cell - only on first row */}
                          {oIdx === 0 && kIdx === 0 && (
                            <TableCell 
                              rowSpan={perspectiveRowSpan}
                              className="align-top font-medium border-r"
                              style={{ 
                                borderLeft: `4px solid ${perspectiveColor}`,
                                backgroundColor: `${perspectiveColor}10`,
                              }}
                            >
                              <div className="space-y-1">
                                <span className="text-sm font-semibold">{perspective.name}</span>
                                {perspective.weight && (
                                  <Badge 
                                    variant="secondary" 
                                    className="block w-fit text-xs"
                                    style={{ backgroundColor: `${perspectiveColor}20`, color: perspectiveColor }}
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
                                  backgroundColor: `${perspectiveColor}15`,
                                  borderColor: perspectiveColor,
                                  color: perspectiveColor 
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
                      <TableRow key={`${perspective.id}-${objective.id}-empty`}>
                        {oIdx === 0 && (
                          <TableCell 
                            rowSpan={perspectiveRowSpan}
                            className="align-top font-medium border-r"
                            style={{ borderLeft: `4px solid ${perspectiveColor}` }}
                          >
                            {perspective.name}
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
