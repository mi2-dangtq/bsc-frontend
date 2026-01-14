'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { RefreshCw, TrendingUp, Target, Edit, CheckCircle, Building2 } from 'lucide-react';
import { useKpiMeasurementAPI, type LocalAllocation } from '@/hooks/useKpiMeasurementAPI';
import { MeasurementDialog } from './MeasurementDialog';
import { useDepartment } from '@/contexts';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DepartmentSelector } from '@/components/shared/DepartmentSelector';

const YEARS = [2024, 2025, 2026];

export function KPIMeasurementManager() {
  const api = useKpiMeasurementAPI();
  const { selectedDepartment } = useDepartment();
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAllocation, setSelectedAllocation] = useState<LocalAllocation | null>(null);

  useEffect(() => {
    api.fetchAllocations(selectedYear, selectedDepartment?.id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear, selectedDepartment?.id]);

  // Allocations are now filtered server-side by departmentId
  const filteredAllocations = api.allocations;

  const handleYearChange = (year: string) => {
    setSelectedYear(parseInt(year));
  };

  const handleOpenMeasurement = (allocation: LocalAllocation) => {
    setSelectedAllocation(allocation);
    setDialogOpen(true);
  };

  const handleSaveMeasurement = async (allocationId: number, actualValue: number, note?: string) => {
    const success = await api.createMeasurement(allocationId, actualValue, note);
    if (success) {
      await api.fetchAllocations(selectedYear); // Refresh list
    }
    return success;
  };

  const getScoreBadgeVariant = (score: number | null): 'default' | 'secondary' | 'destructive' | 'outline' => {
    if (score === null) return 'outline';
    if (score >= 100) return 'default';
    if (score >= 80) return 'secondary';
    return 'destructive';
  };

  const getScoreLabel = (score: number | null): string => {
    if (score === null) return 'Chưa đo';
    return `${score.toFixed(1)}%`;
  };

  // Stats (use filteredAllocations)
  const stats = {
    total: filteredAllocations.length,
    measured: filteredAllocations.filter(a => a.latestMeasurement).length,
    avgScore: filteredAllocations.reduce((acc, a) => {
      if (a.latestMeasurement?.scorePercent) return acc + a.latestMeasurement.scorePercent;
      return acc;
    }, 0) / (filteredAllocations.filter(a => a.latestMeasurement?.scorePercent).length || 1),
  };

  if (api.loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2 text-muted-foreground">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>Đang tải dữ liệu...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with gradient icon */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
              Nhập kết quả KPI
            </h1>
            <p className="text-muted-foreground mt-0.5">
              Cập nhật giá trị thực tế cho các KPI đã phân bổ
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <DepartmentSelector showLabel={false} />
          <Select value={selectedYear.toString()} onValueChange={handleYearChange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Chọn năm" />
            </SelectTrigger>
            <SelectContent>
              {YEARS.map((y) => (
                <SelectItem key={y} value={y.toString()}>
                  Năm {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => api.fetchAllocations(selectedYear, selectedDepartment?.id)}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Department Filter Notice */}
      {selectedDepartment && (
        <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800">
          <Building2 className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-700 dark:text-blue-400">
            Đang xem KPI của <strong>{selectedDepartment.name}</strong>. Chọn &ldquo;Toàn công ty&rdquo; để xem tất cả.
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards with gradients */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 border border-blue-200 dark:border-blue-800">
          <div className="p-2.5 rounded-lg bg-blue-200 dark:bg-blue-800">
            <Target className="h-5 w-5 text-blue-600 dark:text-blue-300" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Tổng KPI</p>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{stats.total}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-emerald-900/30 border border-emerald-200 dark:border-emerald-800">
          <div className="p-2.5 rounded-lg bg-emerald-200 dark:bg-emerald-800">
            <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-300" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Đã đo lường</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{stats.measured}</p>
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400">
                {stats.total > 0 ? ((stats.measured / stats.total) * 100).toFixed(0) : 0}%
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30 border border-purple-200 dark:border-purple-800">
          <div className="p-2.5 rounded-lg bg-purple-200 dark:bg-purple-800">
            <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-300" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Điểm trung bình</p>
            <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">
              {stats.measured > 0 ? stats.avgScore.toFixed(1) : '-'}%
            </p>
          </div>
        </div>
      </div>

      {/* KPI Table */}
      <Card className="shadow-md border-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm">
        <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
          <CardTitle className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            Danh sách KPI năm {selectedYear}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {api.allocations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Chưa có KPI nào được phân bổ cho năm {selectedYear}.</p>
              <p className="text-sm">Hãy phân bổ KPI trong mục CSF/Fishbone trước.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>KPI</TableHead>
                  <TableHead>Mục tiêu</TableHead>
                  <TableHead className="text-right">Target</TableHead>
                  <TableHead className="text-right">Thực tế</TableHead>
                  <TableHead className="text-right">Điểm</TableHead>
                  <TableHead className="text-center">Trạng thái</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {api.allocations.map((alloc) => (
                  <TableRow key={alloc.id}>
                    <TableCell>
                      <div className="font-medium">{alloc.kpiName}</div>
                      <div className="text-xs text-muted-foreground">{alloc.csfName}</div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                      {alloc.objectiveName}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-medium">{alloc.targetGoal}</span>
                      {alloc.kpiUnit && <span className="text-xs text-muted-foreground ml-1">{alloc.kpiUnit}</span>}
                    </TableCell>
                    <TableCell className="text-right">
                      {alloc.latestMeasurement ? (
                        <span className="font-medium">{alloc.latestMeasurement.actualValue}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={getScoreBadgeVariant(alloc.latestMeasurement?.scorePercent ?? null)}>
                        {getScoreLabel(alloc.latestMeasurement?.scorePercent ?? null)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {alloc.latestMeasurement ? (
                        <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                      ) : (
                        <span className="text-xs text-muted-foreground">Chờ nhập</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant={alloc.latestMeasurement ? 'outline' : 'default'}
                        onClick={() => handleOpenMeasurement(alloc)}
                      >
                        <Edit className="h-3.5 w-3.5 mr-1" />
                        {alloc.latestMeasurement ? 'Cập nhật' : 'Nhập'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Measurement Dialog */}
      <MeasurementDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        allocation={selectedAllocation}
        onSave={handleSaveMeasurement}
        calculateScore={api.calculatePreviewScore}
      />
    </div>
  );
}
