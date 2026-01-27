'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Plus, Search, Filter, Loader2, BookOpen, BarChart3, 
  TrendingUp, TrendingDown, Activity, Target, Pencil, Trash2
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { kpiLibraryAPI, KPILibrary } from '@/lib/api';

interface KpiLibraryItem {
  id: number;
  name: string;
  definition: string | null;
  unit: string | null;
  kpiType: 'INPUT' | 'PROCESS' | 'OUTPUT' | 'OUTCOME';
  trend: 'POSITIVE' | 'NEGATIVE';
  frequency: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  formula: string | null;
  isActive: boolean;
}

interface KpiFormData {
  name: string;
  definition: string;
  unit: string;
  kpiType: 'INPUT' | 'PROCESS' | 'OUTPUT' | 'OUTCOME';
  trend: 'POSITIVE' | 'NEGATIVE';
  frequency: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  formula: string;
}

const INITIAL_FORM_DATA: KpiFormData = {
  name: '',
  definition: '',
  unit: '',
  kpiType: 'OUTPUT',
  trend: 'POSITIVE',
  frequency: 'MONTHLY',
  formula: '',
};

const FREQUENCY_LABELS: Record<string, string> = {
  MONTHLY: 'Tháng',
  QUARTERLY: 'Quý',
  YEARLY: 'Năm',
};

const KPI_TYPE_OPTIONS = [
  { value: 'INPUT', label: 'Đầu vào' },
  { value: 'PROCESS', label: 'Quy trình' },
  { value: 'OUTPUT', label: 'Đầu ra' },
  { value: 'OUTCOME', label: 'Kết quả' },
];

const TREND_OPTIONS = [
  { value: 'POSITIVE', label: 'Thuận (cao hơn = tốt hơn)' },
  { value: 'NEGATIVE', label: 'Ngược (thấp hơn = tốt hơn)' },
];

const FREQUENCY_OPTIONS = [
  { value: 'MONTHLY', label: 'Hàng tháng' },
  { value: 'QUARTERLY', label: 'Hàng quý' },
  { value: 'YEARLY', label: 'Hàng năm' },
];

function getTypeBadge(type: string) {
  const styles: Record<string, { variant: 'default' | 'secondary' | 'outline' | 'destructive'; label: string; className?: string }> = {
    INPUT: { variant: 'outline', label: 'Đầu vào', className: 'bg-slate-50 text-slate-600 border-slate-300' },
    PROCESS: { variant: 'secondary', label: 'Quy trình', className: 'bg-blue-50 text-blue-600 border-blue-300' },
    OUTPUT: { variant: 'default', label: 'Đầu ra', className: 'bg-purple-50 text-purple-600 border-purple-300' },
    OUTCOME: { variant: 'destructive', label: 'Kết quả', className: 'bg-red-50 text-red-600 border-red-300' },
  };
  return styles[type] || { variant: 'outline', label: type };
}

function getTrendBadge(trend: string) {
  return trend === 'POSITIVE'
    ? { className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400', label: '↑ Thuận', icon: TrendingUp }
    : { className: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400', label: '↓ Ngược', icon: TrendingDown };
}

export default function KpiLibraryPage() {
  const [kpiLibrary, setKpiLibrary] = useState<KpiLibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingKpi, setEditingKpi] = useState<KpiLibraryItem | null>(null);
  const [deletingKpi, setDeletingKpi] = useState<KpiLibraryItem | null>(null);
  const [formData, setFormData] = useState<KpiFormData>(INITIAL_FORM_DATA);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchKpiLibrary = useCallback(async () => {
    try {
      setLoading(true);
      const data = await kpiLibraryAPI.getAll();
      setKpiLibrary(data as KpiLibraryItem[]);
    } catch (err) {
      console.error('Failed to fetch KPI library:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKpiLibrary();
  }, [fetchKpiLibrary]);

  const filteredKpis = kpiLibrary.filter((kpi) =>
    kpi.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Stats calculations
  const stats = useMemo(() => {
    const outcomeCount = kpiLibrary.filter(k => k.kpiType === 'OUTCOME').length;
    const outputCount = kpiLibrary.filter(k => k.kpiType === 'OUTPUT').length;
    const processCount = kpiLibrary.filter(k => k.kpiType === 'PROCESS').length;
    const inputCount = kpiLibrary.filter(k => k.kpiType === 'INPUT').length;
    const positiveCount = kpiLibrary.filter(k => k.trend === 'POSITIVE').length;
    const negativeCount = kpiLibrary.filter(k => k.trend === 'NEGATIVE').length;
    
    return { 
      total: kpiLibrary.length, 
      outcomeCount, 
      outputCount,
      processInputCount: processCount + inputCount, 
      positiveCount, 
      negativeCount 
    };
  }, [kpiLibrary]);

  // Open dialog for creating new KPI
  const handleOpenCreate = () => {
    setEditingKpi(null);
    setFormData(INITIAL_FORM_DATA);
    setDialogOpen(true);
  };

  // Open dialog for editing KPI
  const handleOpenEdit = (kpi: KpiLibraryItem) => {
    setEditingKpi(kpi);
    setFormData({
      name: kpi.name,
      definition: kpi.definition || '',
      unit: kpi.unit || '',
      kpiType: kpi.kpiType,
      trend: kpi.trend,
      frequency: kpi.frequency,
      formula: kpi.formula || '',
    });
    setDialogOpen(true);
  };

  // Open delete confirmation dialog
  const handleOpenDelete = (kpi: KpiLibraryItem) => {
    setDeletingKpi(kpi);
    setDeleteDialogOpen(true);
  };

  // Handle form submit (create or update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      setSaving(true);
      const payload = {
        name: formData.name.trim(),
        definition: formData.definition.trim() || null,
        unit: formData.unit.trim() || null,
        kpiType: formData.kpiType,
        trend: formData.trend,
        frequency: formData.frequency,
        formula: formData.formula.trim() || null,
        isActive: true,
      };

      if (editingKpi) {
        await kpiLibraryAPI.update(editingKpi.id, payload);
      } else {
        await kpiLibraryAPI.create(payload);
      }

      setDialogOpen(false);
      await fetchKpiLibrary();
    } catch (err) {
      console.error('Failed to save KPI:', err);
      alert('Có lỗi khi lưu KPI. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!deletingKpi) return;

    try {
      setDeleting(true);
      await kpiLibraryAPI.delete(deletingKpi.id);
      setDeleteDialogOpen(false);
      setDeletingKpi(null);
      await fetchKpiLibrary();
    } catch (err) {
      console.error('Failed to delete KPI:', err);
      alert('Có lỗi khi xóa KPI. Vui lòng thử lại.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with gradient icon */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg">
            <BookOpen className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
              Thư viện KPI
            </h1>
            <p className="text-muted-foreground mt-0.5">
              Quản lý các mẫu KPI có thể sử dụng trong hệ thống
            </p>
          </div>
        </div>
        <Button className="shadow-sm gap-2" onClick={handleOpenCreate}>
          <Plus className="h-4 w-4" />
          Thêm KPI mới
        </Button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-5 gap-3">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border">
          <div className="p-2 rounded-lg bg-slate-200 dark:bg-slate-700">
            <BarChart3 className="h-4 w-4 text-slate-600 dark:text-slate-300" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Tổng số KPI</p>
            <p className="text-lg font-bold">{stats.total}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/30 border border-red-200 dark:border-red-800">
          <div className="p-2 rounded-lg bg-red-200 dark:bg-red-800">
            <Target className="h-4 w-4 text-red-600 dark:text-red-300" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">KPI Kết quả</p>
            <p className="text-lg font-bold text-red-700 dark:text-red-400">{stats.outcomeCount}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30 border border-purple-200 dark:border-purple-800">
          <div className="p-2 rounded-lg bg-purple-200 dark:bg-purple-800">
            <Activity className="h-4 w-4 text-purple-600 dark:text-purple-300" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">KPI Đầu ra</p>
            <p className="text-lg font-bold text-purple-700 dark:text-purple-400">{stats.outputCount}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-emerald-900/30 border border-emerald-200 dark:border-emerald-800">
          <div className="p-2 rounded-lg bg-emerald-200 dark:bg-emerald-800">
            <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Xu hướng Thuận</p>
            <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{stats.positiveCount}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/30 border border-orange-200 dark:border-orange-800">
          <div className="p-2 rounded-lg bg-orange-200 dark:bg-orange-800">
            <TrendingDown className="h-4 w-4 text-orange-600 dark:text-orange-300" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Xu hướng Ngược</p>
            <p className="text-lg font-bold text-orange-700 dark:text-orange-400">{stats.negativeCount}</p>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <Card className="shadow-md border-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm">
        <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm KPI..."
                className="pl-9 bg-white dark:bg-slate-900"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Lọc
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="p-4 rounded-full bg-gradient-to-br from-violet-50 to-purple-100 dark:from-violet-950/50 dark:to-purple-900/50 mb-3">
                <Loader2 className="h-8 w-8 animate-spin text-violet-600 dark:text-violet-400" />
              </div>
              <span className="text-muted-foreground">Đang tải thư viện KPI...</span>
            </div>
          ) : filteredKpis.length === 0 ? (
            <div className="text-center py-16">
              <div className="p-4 rounded-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950/50 dark:to-slate-800/50 inline-block mb-4">
                <BookOpen className="h-10 w-10 text-slate-400" />
              </div>
              <p className="text-muted-foreground">
                {searchTerm ? 'Không tìm thấy KPI phù hợp' : 'Chưa có KPI nào trong thư viện'}
              </p>
              {!searchTerm && (
                <Button className="mt-4" onClick={handleOpenCreate}>
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm KPI đầu tiên
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold">Tên KPI</TableHead>
                  <TableHead className="font-semibold">Đơn vị</TableHead>
                  <TableHead className="font-semibold">Loại</TableHead>
                  <TableHead className="font-semibold">Xu hướng</TableHead>
                  <TableHead className="font-semibold">Tần suất</TableHead>
                  <TableHead className="text-right font-semibold">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredKpis.map((kpi) => {
                  const trendBadge = getTrendBadge(kpi.trend);
                  const TrendIcon = trendBadge.icon;
                  return (
                    <TableRow key={kpi.id} className="group">
                      <TableCell className="font-medium">{kpi.name}</TableCell>
                      <TableCell className="text-muted-foreground">{kpi.unit || '-'}</TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline"
                          className={getTypeBadge(kpi.kpiType).className}
                        >
                          {getTypeBadge(kpi.kpiType).label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${trendBadge.className}`}
                        >
                          <TrendIcon className="h-3 w-3" />
                          {trendBadge.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {FREQUENCY_LABELS[kpi.frequency] || kpi.frequency}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleOpenEdit(kpi)}
                          >
                            <Pencil className="h-4 w-4 mr-1" />
                            Sửa
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleOpenDelete(kpi)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600">
                <BookOpen className="h-4 w-4 text-white" />
              </div>
              {editingKpi ? 'Chỉnh sửa KPI' : 'Thêm KPI mới'}
            </DialogTitle>
            <DialogDescription>
              {editingKpi ? 'Cập nhật thông tin KPI trong thư viện.' : 'Tạo một KPI mới trong thư viện để sử dụng cho các mục tiêu.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Tên KPI <span className="text-red-500">*</span></Label>
              <Input
                id="name"
                placeholder="VD: Doanh thu thuần"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="definition">Định nghĩa</Label>
              <Textarea
                id="definition"
                placeholder="Mô tả chi tiết về KPI..."
                value={formData.definition}
                onChange={(e) => setFormData(prev => ({ ...prev, definition: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unit">Đơn vị</Label>
                <Input
                  id="unit"
                  placeholder="VD: VNĐ, %, người"
                  value={formData.unit}
                  onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="kpiType">Loại KPI</Label>
                <Select
                  value={formData.kpiType}
                  onValueChange={(value: KpiFormData['kpiType']) => setFormData(prev => ({ ...prev, kpiType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {KPI_TYPE_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="trend">Xu hướng</Label>
                <Select
                  value={formData.trend}
                  onValueChange={(value: KpiFormData['trend']) => setFormData(prev => ({ ...prev, trend: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TREND_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="frequency">Tần suất đo</Label>
                <Select
                  value={formData.frequency}
                  onValueChange={(value: KpiFormData['frequency']) => setFormData(prev => ({ ...prev, frequency: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FREQUENCY_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="formula">Công thức tính</Label>
              <Input
                id="formula"
                placeholder="VD: Tổng doanh thu / Số khách hàng"
                value={formData.formula}
                onChange={(e) => setFormData(prev => ({ ...prev, formula: e.target.value }))}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
                Hủy
              </Button>
              <Button type="submit" disabled={saving || !formData.name.trim()}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingKpi ? 'Lưu thay đổi' : 'Tạo KPI'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Xác nhận xóa KPI
            </DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa KPI <strong className="text-foreground">&quot;{deletingKpi?.name}&quot;</strong>? 
              Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
              Hủy
            </Button>
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Xóa KPI
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
