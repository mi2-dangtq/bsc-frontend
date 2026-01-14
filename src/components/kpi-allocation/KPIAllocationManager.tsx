'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertTriangle, CheckCircle, Building2, BarChart3 } from 'lucide-react';
import { AllocationMatrix } from './AllocationMatrix';
import { CSFAssignment } from './CSFAssignment';
import { useDepartments, type Department } from '@/hooks/useDepartments';
import { usePerspectives } from '@/contexts';



// Extended department for allocation
interface AllocationDepartment extends Department {
  primaryPerspective: number;
}

export interface DepartmentWeight {
  departmentId: string;
  weights: Record<number, number>;
}

export interface ValidationWarning {
  type: 'total' | 'primary' | 'balance';
  departmentId: string;
  message: string;
}

export function KPIAllocationManager() {
  const { departments: apiDepts, loading } = useDepartments();
  const { perspectives } = usePerspectives();
  
  // Build company weights from perspectives (from DB)
  const companyWeights: Record<number, number> = useMemo(() => {
    const weights: Record<number, number> = {};
    perspectives.forEach(p => {
      weights[p.id] = p.weight;
    });
    return weights;
  }, [perspectives]);

  // Transform API departments to allocation format
  const departments: AllocationDepartment[] = useMemo(() => {
    return apiDepts
      .filter((d) => d.isActive && !d.parentId) // Root departments only
      .slice(0, 10) // Limit for UI
      .map((dept, index) => ({
        ...dept,
        code: dept.code || dept.name.substring(0, 3).toUpperCase(),
        primaryPerspective: (index % 4) + 1,
      }));
  }, [apiDepts]);

  // Compute initial weights from departments (derived state)
  const initialWeights = useMemo(() => {
    return departments.map((dept) => {
      const weights: Record<number, number> = {};
      perspectives.forEach((p) => {
        if (p.id === dept.primaryPerspective) {
          weights[p.id] = 50;
        } else {
          weights[p.id] = Math.round(50 / 3);
        }
      });
      const total = Object.values(weights).reduce((a, b) => a + b, 0);
      if (total !== 100) {
        weights[dept.primaryPerspective] += 100 - total;
      }
      return { departmentId: dept.id, weights };
    });
  }, [departments, perspectives]);

  // User edits are stored separately and merged with initial weights
  const [weightEdits, setWeightEdits] = useState<Record<string, Record<number, number>>>({});

  // Merge initial weights with user edits
  const departmentWeights: DepartmentWeight[] = useMemo(() => {
    return initialWeights.map((iw) => ({
      departmentId: iw.departmentId,
      weights: { ...iw.weights, ...weightEdits[iw.departmentId] },
    }));
  }, [initialWeights, weightEdits]);

  // Validation warnings
  const validationWarnings = useMemo(() => {
    const warnings: ValidationWarning[] = [];

    departmentWeights.forEach((dw) => {
      const dept = departments.find((d) => d.id === dw.departmentId);
      if (!dept) return;

      const total = Object.values(dw.weights).reduce((a, b) => a + b, 0);
      if (total !== 100) {
        warnings.push({
          type: 'total',
          departmentId: dw.departmentId,
          message: `${dept.name}: Tổng tỷ trọng = ${total}% (phải = 100%)`,
        });
      }

      const primaryWeight = dw.weights[dept.primaryPerspective] || 0;
      if (primaryWeight < 50) {
        const primaryPerspective = perspectives.find((p) => p.id === dept.primaryPerspective);
        warnings.push({
          type: 'primary',
          departmentId: dw.departmentId,
          message: `${dept.name}: ${primaryPerspective?.name} = ${primaryWeight}% (phải >= 50%)`,
        });
      }
    });

    if (departmentWeights.length > 0) {
      perspectives.forEach((p) => {
        const avg =
          departmentWeights.reduce((sum, dw) => sum + (dw.weights[p.id] || 0), 0) /
          departmentWeights.length;
        const perspWeight = companyWeights[p.id] || 25;
        const diff = avg - perspWeight;
        if (Math.abs(diff) > 5) {
          warnings.push({
            type: 'balance',
            departmentId: 'all',
            message: `${p.name}: TB phòng ban = ${avg.toFixed(1)}% (lệch ${diff > 0 ? '+' : ''}${diff.toFixed(1)}% so với công ty)`,
          });
        }
      });
    }

    return warnings;
  }, [departmentWeights, departments, perspectives, companyWeights]);

  // Update department weight
  const updateWeight = (departmentId: string, perspectiveId: number, value: number) => {
    setWeightEdits((prev) => ({
      ...prev,
      [departmentId]: {
        ...prev[departmentId],
        [perspectiveId]: value,
      },
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Phân bổ KPI</h1>
          <p className="text-muted-foreground">Gán tỷ trọng và KPI cho các phòng ban</p>
        </div>
        <div className="flex items-center gap-4">
          {validationWarnings.length > 0 ? (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {validationWarnings.length} cảnh báo
            </Badge>
          ) : (
            <Badge variant="default" className="flex items-center gap-1 bg-green-600">
              <CheckCircle className="h-3 w-3" />
              Hợp lệ
            </Badge>
          )}
        </div>
      </div>

      {/* Validation Warnings */}
      {validationWarnings.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-amber-700">
              <AlertTriangle className="h-4 w-4" />
              Cảnh báo Validation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-amber-700 space-y-1">
              {validationWarnings.map((w, i) => (
                <li key={i}>• {w.message}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
              <Building2 className="h-4 w-4" />
              Phòng ban
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{departments.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
              <BarChart3 className="h-4 w-4" />
              Phương diện
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Trạng thái</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {validationWarnings.length === 0 ? (
                <span className="text-green-600">Hợp lệ</span>
              ) : (
                <span className="text-amber-600">Cần điều chỉnh</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Allocation Matrix */}
      <AllocationMatrix
        departments={departments}
        perspectives={perspectives}
        companyWeights={companyWeights}
        departmentWeights={departmentWeights}
        onUpdateWeight={updateWeight}
      />

      {/* CSF Assignment */}
      <CSFAssignment departments={departments} />
    </div>
  );
}
