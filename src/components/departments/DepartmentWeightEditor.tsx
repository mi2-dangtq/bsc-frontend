'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Scale,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Loader2,
  Settings2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface PerspectiveWeight {
  perspectiveId: number;
  perspectiveName: string;
  weight: number;
  isPrimary: boolean;
  isSecondary: boolean;
}

interface DepartmentWeightValidation {
  isValid: boolean;
  totalEquals100: boolean;
  primaryPerspectiveValid: boolean;
  dualPerspectiveValid: boolean;
  errors: string[];
  warnings: string[];
}

interface DepartmentWeightStatus {
  departmentId: string;
  departmentName: string;
  primaryPerspectiveId: number | null;
  primaryPerspectiveName: string | null;
  weights: PerspectiveWeight[];
  totalWeight: number;
  validation: DepartmentWeightValidation;
}

interface Perspective {
  id: number;
  name: string;
  color: string | null;
}

interface DepartmentWeightEditorProps {
  departmentId: string;
  departmentName: string;
  onClose?: () => void;
}

// Color mapping for perspectives
const perspectiveColors: Record<number, string> = {
  1: 'from-amber-500 to-orange-600', // Tài chính
  2: 'from-cyan-500 to-blue-600', // Khách hàng
  3: 'from-emerald-500 to-green-600', // Quy trình
  4: 'from-purple-500 to-indigo-600', // Học hỏi
};

const perspectiveBgColors: Record<number, string> = {
  1: 'bg-amber-100 dark:bg-amber-900/30',
  2: 'bg-cyan-100 dark:bg-cyan-900/30',
  3: 'bg-emerald-100 dark:bg-emerald-900/30',
  4: 'bg-purple-100 dark:bg-purple-900/30',
};

export function DepartmentWeightEditor({
  departmentId,
  departmentName,
  onClose,
}: DepartmentWeightEditorProps) {
  const [weightStatus, setWeightStatus] = useState<DepartmentWeightStatus | null>(null);
  const [perspectives, setPerspectives] = useState<Perspective[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch department weights
  const fetchWeights = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/departments/${departmentId}/weights`);
      if (!res.ok) throw new Error('Failed to fetch weights');
      const data = await res.json();
      setWeightStatus(data);
    } catch (err) {
      setError('Không thể tải thông tin tỷ trọng');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch perspectives list
  const fetchPerspectives = async () => {
    try {
      const res = await fetch(`${API_URL}/perspectives`);
      if (!res.ok) throw new Error('Failed to fetch perspectives');
      const data = await res.json();
      setPerspectives(data);
    } catch (err) {
      console.error(err);
    }
  };

  // Set primary perspective
  const setPrimaryPerspective = async (perspectiveId: number) => {
    try {
      setSaving(true);
      const res = await fetch(`${API_URL}/departments/${departmentId}/primary-perspective`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ primaryPerspectiveId: perspectiveId }),
      });
      if (!res.ok) throw new Error('Failed to set primary perspective');
      await fetchWeights();
    } catch (err) {
      setError('Không thể cập nhật phương diện chính');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchWeights();
    fetchPerspectives();
  }, [departmentId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!weightStatus) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Không tìm thấy thông tin phòng ban</AlertDescription>
      </Alert>
    );
  }

  const { validation, weights, totalWeight, primaryPerspectiveId, primaryPerspectiveName } = weightStatus;

  return (
    <Card className="shadow-lg border-0">
      <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600">
              <Scale className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle>{departmentName}</CardTitle>
              <CardDescription>Quản lý tỷ trọng phương diện BSC</CardDescription>
            </div>
          </div>
          {onClose && (
            <Button variant="outline" size="sm" onClick={onClose}>
              Đóng
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        {/* Validation Status */}
        <div className="flex items-center gap-4">
          <div
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium',
              validation.isValid
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            )}
          >
            {validation.isValid ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            {validation.isValid ? 'Hợp lệ' : 'Chưa hợp lệ'}
          </div>

          <Badge variant="outline" className="text-sm">
            Tổng: {totalWeight.toFixed(2)}%
          </Badge>
        </div>

        {/* Errors */}
        {validation.errors.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1">
                {validation.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Warnings */}
        {validation.warnings.length > 0 && (
          <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/30">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-700 dark:text-amber-400">
              <ul className="list-disc list-inside space-y-1">
                {validation.warnings.map((warn, i) => (
                  <li key={i}>{warn}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Primary Perspective Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <Settings2 className="h-4 w-4" />
            Phương diện chính
          </label>
          <Select
            value={primaryPerspectiveId?.toString() || ''}
            onValueChange={(val) => setPrimaryPerspective(parseInt(val))}
            disabled={saving}
          >
            <SelectTrigger className="w-full max-w-xs">
              <SelectValue placeholder="Chọn phương diện chính" />
            </SelectTrigger>
            <SelectContent>
              {perspectives.map((p) => (
                <SelectItem key={p.id} value={p.id.toString()}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Phương diện chính phải có tỷ trọng ≥ 50%
          </p>
        </div>

        {/* Perspective Weights */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Tỷ trọng theo phương diện</h4>
          {weights.map((pw) => (
            <div
              key={pw.perspectiveId}
              className={cn(
                'p-4 rounded-xl border transition-all',
                pw.isPrimary && 'ring-2 ring-primary ring-offset-2',
                perspectiveBgColors[pw.perspectiveId] || 'bg-slate-100'
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{pw.perspectiveName}</span>
                  {pw.isPrimary && (
                    <Badge className="text-xs bg-gradient-to-r from-cyan-500 to-blue-600">
                      Chính
                    </Badge>
                  )}
                </div>
                <span className="text-lg font-bold">{pw.weight.toFixed(2)}%</span>
              </div>
              <Progress
                value={pw.weight}
                className="h-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Từ {weights.length > 0 ? Math.round(pw.weight / (totalWeight || 1) * 100) : 0}% KPI được phân bổ
              </p>
            </div>
          ))}
        </div>

        {/* Info Box */}
        <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-4">
          <h5 className="font-medium text-blue-700 dark:text-blue-400 mb-2">
            Quy tắc TOPPION
          </h5>
          <ul className="text-sm text-blue-600 dark:text-blue-300 space-y-1">
            <li>✓ Phương diện chính ≥ 50%</li>
            <li>✓ 2 phương diện chính ≥ 70%</li>
            <li>✓ Tổng tỷ trọng = 100%</li>
            <li>✓ Trung bình phòng ban ≤ ±5% so với công ty</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
