'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Loader2, AlertTriangle, CheckCircle, Building2, BarChart3, 
  Scale, Save, RefreshCw, Info, Target, TrendingUp
} from 'lucide-react';
import { AllocationMatrix } from './AllocationMatrix';
import { CSFAssignment } from './CSFAssignment';
import { useDepartments, type Department } from '@/hooks/useDepartments';
import { usePerspectives } from '@/contexts';
import { toast } from 'sonner';

// Extended department for allocation
interface AllocationDepartment extends Department {
  primaryPerspectives: number[]; // Can have 1 or 2 primary perspectives
}

export interface DepartmentWeight {
  departmentId: string;
  weights: Record<number, number>;
}

export interface ValidationWarning {
  type: 'total' | 'primary' | 'dual_primary' | 'balance';
  departmentId: string;
  message: string;
  severity: 'error' | 'warning';
}

// Validation rules for department weight allocation
const RULES = {
  TOTAL_WEIGHT: 100,
  PRIMARY_MIN_WEIGHT: 50, // Single primary perspective >= 50%
  DUAL_PRIMARY_MIN_WEIGHT: 70, // Two primary perspectives combined >= 70%
  BALANCE_TOLERANCE: 5, // Average deviation from company <= 5%
};

export function KPIAllocationManager() {
  const { departments: apiDepts, loading } = useDepartments();
  const { perspectives } = usePerspectives();
  const [activeTab, setActiveTab] = useState('matrix');
  const [isSaving, setIsSaving] = useState(false);
  
  // Build company weights from perspectives (from DB)
  const companyWeights: Record<number, number> = useMemo(() => {
    const weights: Record<number, number> = {};
    perspectives.forEach(p => {
      weights[p.id] = p.weight;
    });
    return weights;
  }, [perspectives]);

  // Transform API departments to allocation format
  // Use primaryPerspectiveId from database
  const departments: AllocationDepartment[] = useMemo(() => {
    return apiDepts
      .filter((d) => d.isActive && !d.parentId) // Root departments only
      .map((dept) => {
        // Use primaryPerspectiveId from database, default to first perspective if not set
        const primaryPerspectives = dept.primaryPerspectiveId 
          ? [dept.primaryPerspectiveId] 
          : [1]; // Default to Financial if not set
        
        return {
          ...dept,
          code: dept.code || dept.name.substring(0, 3).toUpperCase(),
          primaryPerspectives,
        };
      });
  }, [apiDepts]);


  // Compute initial weights from departments
  const initialWeights = useMemo(() => {
    return departments.map((dept) => {
      const weights: Record<number, number> = {};
      const hasDualPrimary = dept.primaryPerspectives.length === 2;
      
      perspectives.forEach((p) => {
        if (dept.primaryPerspectives.includes(p.id)) {
          if (hasDualPrimary) {
            // Split 70% between two primary perspectives
            weights[p.id] = 35;
          } else {
            // Single primary gets 50%
            weights[p.id] = 50;
          }
        } else {
          // Remaining perspectives share the rest
          const remaining = hasDualPrimary ? 30 : 50;
          const otherCount = perspectives.length - dept.primaryPerspectives.length;
          weights[p.id] = Math.round(remaining / otherCount);
        }
      });
      
      // Ensure total = 100%
      const total = Object.values(weights).reduce((a, b) => a + b, 0);
      if (total !== 100) {
        const firstPrimary = dept.primaryPerspectives[0];
        weights[firstPrimary] += 100 - total;
      }
      
      return { departmentId: dept.id, weights };
    });
  }, [departments, perspectives]);

  // User edits stored separately
  const [weightEdits, setWeightEdits] = useState<Record<string, Record<number, number>>>({});

  // Merge initial weights with user edits
  const departmentWeights: DepartmentWeight[] = useMemo(() => {
    return initialWeights.map((iw) => ({
      departmentId: iw.departmentId,
      weights: { ...iw.weights, ...weightEdits[iw.departmentId] },
    }));
  }, [initialWeights, weightEdits]);

  // Enhanced validation with all TOPPION rules
  const validationWarnings = useMemo(() => {
    const warnings: ValidationWarning[] = [];

    departmentWeights.forEach((dw) => {
      const dept = departments.find((d) => d.id === dw.departmentId);
      if (!dept) return;

      // Rule 1: Total weight = 100%
      const total = Object.values(dw.weights).reduce((a, b) => a + b, 0);
      if (total !== RULES.TOTAL_WEIGHT) {
        warnings.push({
          type: 'total',
          departmentId: dw.departmentId,
          message: `${dept.name}: Tổng tỷ trọng = ${total}% (phải = ${RULES.TOTAL_WEIGHT}%)`,
          severity: 'error',
        });
      }

      // Rule 2: Single primary perspective >= 50%
      if (dept.primaryPerspectives.length === 1) {
        const primaryWeight = dw.weights[dept.primaryPerspectives[0]] || 0;
        if (primaryWeight < RULES.PRIMARY_MIN_WEIGHT) {
          const primaryName = perspectives.find((p) => p.id === dept.primaryPerspectives[0])?.name;
          warnings.push({
            type: 'primary',
            departmentId: dw.departmentId,
            message: `${dept.name}: ${primaryName} = ${primaryWeight}% (phải >= ${RULES.PRIMARY_MIN_WEIGHT}%)`,
            severity: 'error',
          });
        }
      }

      // Rule 3: Dual primary perspectives combined >= 70%
      if (dept.primaryPerspectives.length === 2) {
        const combinedWeight = dept.primaryPerspectives.reduce(
          (sum, pid) => sum + (dw.weights[pid] || 0), 0
        );
        if (combinedWeight < RULES.DUAL_PRIMARY_MIN_WEIGHT) {
          const names = dept.primaryPerspectives
            .map(pid => perspectives.find(p => p.id === pid)?.name)
            .join(' + ');
          warnings.push({
            type: 'dual_primary',
            departmentId: dw.departmentId,
            message: `${dept.name}: ${names} = ${combinedWeight}% (phải >= ${RULES.DUAL_PRIMARY_MIN_WEIGHT}%)`,
            severity: 'error',
          });
        }
      }
    });

    // Rule 4: Balance check - average deviation <= 5%
    if (departmentWeights.length > 0) {
      perspectives.forEach((p) => {
        const avg = departmentWeights.reduce((sum, dw) => sum + (dw.weights[p.id] || 0), 0) / departmentWeights.length;
        const perspWeight = companyWeights[p.id] || 25;
        const diff = Math.abs(avg - perspWeight);
        if (diff > RULES.BALANCE_TOLERANCE) {
          warnings.push({
            type: 'balance',
            departmentId: 'all',
            message: `${p.name}: TB phòng ban = ${avg.toFixed(1)}% (lệch ${diff > 0 ? '+' : ''}${(avg - perspWeight).toFixed(1)}% so với công ty)`,
            severity: 'warning',
          });
        }
      });
    }

    return warnings;
  }, [departmentWeights, departments, perspectives, companyWeights]);

  const errorCount = validationWarnings.filter(w => w.severity === 'error').length;
  const warningCount = validationWarnings.filter(w => w.severity === 'warning').length;

  // Update weight handler
  const updateWeight = (departmentId: string, perspectiveId: number, value: number) => {
    setWeightEdits((prev) => ({
      ...prev,
      [departmentId]: {
        ...prev[departmentId],
        [perspectiveId]: value,
      },
    }));
  };

  // Save handler
  const handleSave = async () => {
    if (errorCount > 0) {
      toast.error('Vui lòng sửa các lỗi trước khi lưu');
      return;
    }
    
    setIsSaving(true);
    // TODO: Implement API call to save weights
    await new Promise(r => setTimeout(r, 1000));
    toast.success('Đã lưu phân bổ tỷ trọng');
    setIsSaving(false);
  };

  // Reset handler
  const handleReset = () => {
    setWeightEdits({});
    toast.info('Đã khôi phục cài đặt mặc định');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm text-muted-foreground">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
            Phân bổ KPI
          </h1>
          <p className="text-muted-foreground mt-1">
            Gán tỷ trọng phương diện và KPI cho các phòng ban
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleReset} disabled={isSaving}>
            <RefreshCw className="h-4 w-4 mr-1.5" />
            Khôi phục
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isSaving || errorCount > 0}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-1.5" />
            )}
            Lưu phân bổ
          </Button>
        </div>
      </div>

      {/* Validation Status Bar */}
      <div className={`p-4 rounded-lg border ${
        errorCount > 0 
          ? 'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-900' 
          : warningCount > 0 
            ? 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900'
            : 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {errorCount > 0 ? (
              <div className="p-2 rounded-full bg-red-100 dark:bg-red-900">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
            ) : warningCount > 0 ? (
              <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900">
                <Info className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
            ) : (
              <div className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-900">
                <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            )}
            <div>
              <h3 className={`font-semibold ${
                errorCount > 0 ? 'text-red-700 dark:text-red-300' 
                : warningCount > 0 ? 'text-amber-700 dark:text-amber-300'
                : 'text-emerald-700 dark:text-emerald-300'
              }`}>
                {errorCount > 0 
                  ? `${errorCount} lỗi cần sửa` 
                  : warningCount > 0 
                    ? `${warningCount} cảnh báo`
                    : 'Cấu hình hợp lệ'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {errorCount > 0 
                  ? 'Không thể lưu khi còn lỗi validation'
                  : warningCount > 0
                    ? 'Có thể lưu nhưng nên xem xét các cảnh báo'
                    : 'Tất cả quy tắc đều được tuân thủ'}
              </p>
            </div>
          </div>
          {validationWarnings.length > 0 && (
            <div className="flex gap-2">
              {errorCount > 0 && (
                <Badge variant="destructive">{errorCount} lỗi</Badge>
              )}
              {warningCount > 0 && (
                <Badge variant="outline" className="border-amber-500 text-amber-600">
                  {warningCount} cảnh báo
                </Badge>
              )}
            </div>
          )}
        </div>
        
        {/* Warnings list */}
        {validationWarnings.length > 0 && (
          <div className="mt-4 space-y-2">
            {validationWarnings.slice(0, 5).map((w, i) => (
              <div key={i} className={`flex items-center gap-2 text-sm ${
                w.severity === 'error' ? 'text-red-700 dark:text-red-300' : 'text-amber-700 dark:text-amber-300'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  w.severity === 'error' ? 'bg-red-500' : 'bg-amber-500'
                }`} />
                {w.message}
              </div>
            ))}
            {validationWarnings.length > 5 && (
              <p className="text-xs text-muted-foreground">
                +{validationWarnings.length - 5} vấn đề khác...
              </p>
            )}
          </div>
        )}
      </div>

      {/* Rules Reference Card */}
      <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-900">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2 text-blue-700 dark:text-blue-300">
            <Scale className="h-4 w-4" />
            Quy tắc phân bổ tỷ trọng
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="shrink-0">1</Badge>
              <span>Tổng 4 phương diện của mỗi phòng ban = <strong>100%</strong></span>
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="shrink-0">2</Badge>
              <span>Phương diện chính (1 PD) phải ≥ <strong>50%</strong></span>
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="shrink-0">3</Badge>
              <span>Phương diện chính (2 PD) tổng phải ≥ <strong>70%</strong></span>
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="shrink-0">4</Badge>
              <span>TB phòng ban lệch công ty ≤ <strong>±5%</strong></span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950/30 dark:to-indigo-900/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Phòng ban</CardTitle>
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
              <Building2 className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-700 dark:text-blue-400">{departments.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Đang quản lý</p>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-md bg-gradient-to-br from-purple-50 to-violet-100 dark:from-purple-950/30 dark:to-violet-900/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Phương diện</CardTitle>
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 shadow-lg">
              <BarChart3 className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-700 dark:text-purple-400">{perspectives.length}</div>
            <p className="text-xs text-muted-foreground mt-1">BSC chuẩn</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-950/30 dark:to-green-900/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Mục tiêu</CardTitle>
            <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg">
              <Target className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-700 dark:text-emerald-400">
              12
            </div>
            <p className="text-xs text-muted-foreground mt-1">Đang theo dõi</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-950/30 dark:to-orange-900/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Trạng thái</CardTitle>
            <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {errorCount === 0 ? (
                <span className="text-emerald-600 dark:text-emerald-400">Hợp lệ</span>
              ) : (
                <span className="text-amber-600 dark:text-amber-400">Điều chỉnh</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {errorCount === 0 ? 'Sẵn sàng lưu' : `${errorCount} lỗi cần sửa`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Matrix and CSF */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-[400px] grid-cols-2">
          <TabsTrigger value="matrix" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Ma trận Tỷ trọng
          </TabsTrigger>
          <TabsTrigger value="csf" className="gap-2">
            <Target className="h-4 w-4" />
            Phân công CSF
          </TabsTrigger>
        </TabsList>

        <TabsContent value="matrix" className="mt-6">
          <AllocationMatrix
            departments={departments}
            perspectives={perspectives}
            companyWeights={companyWeights}
            departmentWeights={departmentWeights}
            onUpdateWeight={updateWeight}
          />
        </TabsContent>

        <TabsContent value="csf" className="mt-6">
          <CSFAssignment departments={departments} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
