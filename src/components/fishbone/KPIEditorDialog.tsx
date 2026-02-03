'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Info, Building2 } from 'lucide-react';
import type { KPI } from './KPIItem';
import { csfAPI, type KPILibrary } from '@/lib/api';

const kpiFormSchema = z.object({
  kpiLibId: z.number().min(1, 'Vui lòng chọn KPI từ thư viện'),
  weight: z.number().min(0, 'Tỷ trọng phải >= 0').max(100, 'Tỷ trọng phải <= 100'),
  targetMin: z.number().optional(),
  targetThreshold: z.number().optional(),
  targetGoal: z.number().min(0, 'Mục tiêu phải >= 0'),
  targetMax: z.number().optional(),
});

type KPIFormValues = z.infer<typeof kpiFormSchema>;

interface CsfDepartment {
  id: string;
  name: string;
  code: string | null;
}

export interface KPISaveData {
  kpiLibId: number;
  weight: number;
  targets: {
    targetMin?: number;
    targetThreshold?: number;
    targetGoal: number;
    targetMax?: number;
  };
  departmentIds?: string[]; // NEW: Selected departments
}

interface KPIEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kpi: KPI | null;
  kpiLibrary: KPILibrary[];
  onSave: (data: KPISaveData) => void;
  mode: 'create' | 'edit';
  // Weight validation props
  objectiveWeight?: number;
  usedWeight?: number;
  editingKpiWeight?: number;
  // NEW: CSF ID for department fetching
  csfId?: number;
}

export function KPIEditorDialog({
  open,
  onOpenChange,
  kpi,
  kpiLibrary,
  onSave,
  mode,
  objectiveWeight = 0,
  usedWeight = 0,
  editingKpiWeight = 0,
  csfId,
}: KPIEditorDialogProps) {
  const [selectedKpi, setSelectedKpi] = useState<KPILibrary | null>(null);
  
  // NEW: Department selection state
  const [availableDepts, setAvailableDepts] = useState<CsfDepartment[]>([]);
  const [selectedDeptIds, setSelectedDeptIds] = useState<Set<string>>(new Set());
  const [inheritAll, setInheritAll] = useState(true);
  
  // Calculate remaining weight
  const remainingWeight = objectiveWeight - usedWeight + (mode === 'edit' ? editingKpiWeight : 0);

  const form = useForm<KPIFormValues>({
    resolver: zodResolver(kpiFormSchema),
    defaultValues: {
      kpiLibId: 0,
      weight: 0,
      targetMin: undefined,
      targetThreshold: undefined,
      targetGoal: 0,
      targetMax: undefined,
    },
  });

  // Reset form when KPI changes
  useEffect(() => {
    if (kpi && open && mode === 'edit') {
      // @ts-ignore - kpiLibId might exist from API
      const libId = kpi.kpiLibId || 0;
      form.reset({
        kpiLibId: libId,
        weight: (kpi as unknown as { weight?: number }).weight || 0,
        targetMin: kpi.targetMin,
        targetThreshold: kpi.targetThreshold,
        targetGoal: kpi.targetGoal || kpi.target || 0,
        targetMax: kpi.targetMax,
      });
      setSelectedKpi(kpiLibrary.find(k => k.id === libId) || null);
      
      // Load existing departments
      const kpiDepts = (kpi as unknown as { departments?: Array<{ id: string }> }).departments;
      if (kpiDepts && kpiDepts.length > 0) {
        setInheritAll(false);
        setSelectedDeptIds(new Set(kpiDepts.map(d => d.id)));
      } else {
        setInheritAll(true);
        setSelectedDeptIds(new Set());
      }
    } else if (!kpi && open) {
      form.reset({
        kpiLibId: 0,
        weight: Math.min(remainingWeight, 100),
        targetMin: undefined,
        targetThreshold: undefined,
        targetGoal: 0,
        targetMax: undefined,
      });
      setSelectedKpi(null);
      setInheritAll(true);
      setSelectedDeptIds(new Set());
    }
  }, [kpi, open, form, kpiLibrary, mode, remainingWeight]);

  // NEW: Fetch available departments from CSF when dialog opens
  useEffect(() => {
    if (!open || !csfId) {
      setAvailableDepts([]);
      return;
    }

    const fetchDepts = async () => {
      try {
        // Use csfAPI with auth token instead of direct fetch
        const depts = await csfAPI.getDepartments(csfId);
        setAvailableDepts(depts);
      } catch (err) {
        console.error('Error fetching CSF departments:', err);
      }
    };

    fetchDepts();
  }, [open, csfId]);

  const handleKpiSelect = (kpiLibId: string) => {
    const id = parseInt(kpiLibId);
    form.setValue('kpiLibId', id);
    const kpiItem = kpiLibrary.find(k => k.id === id);
    setSelectedKpi(kpiItem || null);
  };

  const onSubmit = (data: KPIFormValues) => {
    onSave({
      kpiLibId: data.kpiLibId,
      weight: data.weight,
      targets: {
        targetMin: data.targetMin,
        targetThreshold: data.targetThreshold,
        targetGoal: data.targetGoal,
        targetMax: data.targetMax,
      },
      // NEW: Include selected departments
      departmentIds: inheritAll ? undefined : Array.from(selectedDeptIds),
    });
    onOpenChange(false);
  };

  const handleDeptToggle = (deptId: string) => {
    const newSet = new Set(selectedDeptIds);
    if (newSet.has(deptId)) {
      newSet.delete(deptId);
    } else {
      newSet.add(deptId);
    }
    setSelectedDeptIds(newSet);
  };

  const isPositive = selectedKpi?.trend === 'POSITIVE';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Thêm KPI từ Thư viện' : 'Chỉnh sửa KPI'}
          </DialogTitle>
          <DialogDescription>
            Chọn KPI từ thư viện và thiết lập ngưỡng đo lường
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="kpiLibId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Chọn KPI từ Thư viện *</FormLabel>
                  <Select
                    onValueChange={handleKpiSelect}
                    defaultValue={field.value > 0 ? field.value.toString() : undefined}
                    disabled={mode === 'edit'}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn KPI..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {kpiLibrary.length === 0 ? (
                        <div className="p-4 text-sm text-muted-foreground text-center">
                          Chưa có KPI nào trong thư viện
                        </div>
                      ) : (
                        kpiLibrary.map((kpi) => (
                          <SelectItem key={kpi.id} value={kpi.id.toString()}>
                            <div className="flex items-center gap-2">
                              <span>{kpi.name}</span>
                              {kpi.unit && (
                                <Badge variant="outline" className="text-xs">
                                  {kpi.unit}
                                </Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Show selected KPI details */}
            {selectedKpi && (
              <div className="p-3 bg-muted rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{selectedKpi.name}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{selectedKpi.kpiType}</Badge>
                    <Badge variant={selectedKpi.trend === 'POSITIVE' ? 'default' : 'destructive'}>
                      {selectedKpi.trend === 'POSITIVE' ? '↑ Cao tốt' : '↓ Thấp tốt'}
                    </Badge>
                  </div>
                </div>
                {selectedKpi.definition && (
                  <p className="text-sm text-muted-foreground">{selectedKpi.definition}</p>
                )}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {selectedKpi.unit && <span>Đơn vị: {selectedKpi.unit}</span>}
                  <span>Tần suất: {selectedKpi.frequency}</span>
                </div>
              </div>
            )}

            {/* Weight field - show when KPI is selected */}
            {selectedKpi && objectiveWeight > 0 && (
              <FormField
                control={form.control}
                name="weight"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Tỷ trọng KPI *</FormLabel>
                      <span className={`text-xs ${remainingWeight < 0 ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}>
                        Còn lại: {remainingWeight.toFixed(1)}% / {objectiveWeight}%
                      </span>
                    </div>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="VD: 10"
                          value={field.value || ''}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          className="h-9"
                        />
                        <span className="text-sm text-muted-foreground">%</span>
                      </div>
                    </FormControl>
                    <FormDescription className="text-xs">
                      Tổng tỷ trọng các KPI phải bằng tỷ trọng Mục tiêu ({objectiveWeight}%)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Target fields - only show when KPI is selected */}
            {selectedKpi && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Info className="h-4 w-4 text-muted-foreground" />
                  Thiết lập ngưỡng đo lường
                </div>

                <Alert>
                  <AlertDescription className="text-xs">
                    {isPositive ? (
                      <>
                        <strong>KPI Thuận:</strong> Min &lt; Ngưỡng &lt; Mục tiêu &lt; Max
                        <br />
                        Ví dụ: Doanh thu Min=50, Ngưỡng=70, Mục tiêu=100, Max=120
                      </>
                    ) : (
                      <>
                        <strong>KPI Ngược:</strong> Min &gt; Ngưỡng &gt; Mục tiêu &gt; Max
                        <br />
                        Ví dụ: Tỷ lệ lỗi Min=10%, Ngưỡng=8%, Mục tiêu=5%, Max=2%
                      </>
                    )}
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-2 gap-4">
                  {/* Min */}
                  <FormField
                    control={form.control}
                    name="targetMin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Min (Điểm sàn)</FormLabel>
                        <FormControl>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              placeholder={isPositive ? "VD: 50" : "VD: 10"}
                              value={field.value ?? ''}
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                              className="h-9"
                            />
                            {selectedKpi?.unit && (
                              <span className="text-xs text-muted-foreground min-w-[40px]">
                                {selectedKpi.unit}
                              </span>
                            )}
                          </div>
                        </FormControl>
                        <FormDescription className="text-xs">
                          {isPositive ? '0% điểm' : 'Tệ nhất'}
                        </FormDescription>
                      </FormItem>
                    )}
                  />

                  {/* Threshold */}
                  <FormField
                    control={form.control}
                    name="targetThreshold"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Ngưỡng chấp nhận</FormLabel>
                        <FormControl>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              placeholder={isPositive ? "VD: 70" : "VD: 8"}
                              value={field.value ?? ''}
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                              className="h-9"
                            />
                            {selectedKpi?.unit && (
                              <span className="text-xs text-muted-foreground min-w-[40px]">
                                {selectedKpi.unit}
                              </span>
                            )}
                          </div>
                        </FormControl>
                        <FormDescription className="text-xs">
                          Dưới = Fail (0đ)
                        </FormDescription>
                      </FormItem>
                    )}
                  />

                  {/* Target Goal */}
                  <FormField
                    control={form.control}
                    name="targetGoal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Mục tiêu (100%) *</FormLabel>
                        <FormControl>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              placeholder={isPositive ? "VD: 100" : "VD: 5"}
                              value={field.value || ''}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              className="h-9"
                            />
                            {selectedKpi?.unit && (
                              <span className="text-xs text-muted-foreground min-w-[40px]">
                                {selectedKpi.unit}
                              </span>
                            )}
                          </div>
                        </FormControl>
                        <FormDescription className="text-xs">
                          100% điểm
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Max */}
                  <FormField
                    control={form.control}
                    name="targetMax"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Max (Điểm trần)</FormLabel>
                        <FormControl>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              placeholder={isPositive ? "VD: 120" : "VD: 2"}
                              value={field.value ?? ''}
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                              className="h-9"
                            />
                            {selectedKpi?.unit && (
                              <span className="text-xs text-muted-foreground min-w-[40px]">
                                {selectedKpi.unit}
                              </span>
                            )}
                          </div>
                        </FormControl>
                        <FormDescription className="text-xs">
                          {isPositive ? 'Vượt = tính bằng Max' : 'Tốt nhất'}
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            {/* Department Assignment - Show when KPI selected and CSF has departments */}
            {selectedKpi && availableDepts.length > 0 && (
              <div className="space-y-3 pt-2 border-t">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  Phòng ban phụ trách
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="inherit-all"
                    checked={inheritAll}
                    onCheckedChange={(checked) => {
                      setInheritAll(checked as boolean);
                      if (checked) {
                        setSelectedDeptIds(new Set());
                      }
                    }}
                  />
                  <label htmlFor="inherit-all" className="text-sm">
                    Áp dụng cho tất cả phòng ban của CSF
                  </label>
                </div>

                {!inheritAll && (
                  <div className="p-3 bg-muted rounded-lg space-y-2">
                    <p className="text-xs text-muted-foreground mb-2">
                      Chọn phòng ban cụ thể cho KPI này:
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {availableDepts.map((dept) => (
                        <div key={dept.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`dept-${dept.id}`}
                            checked={selectedDeptIds.has(dept.id)}
                            onCheckedChange={() => handleDeptToggle(dept.id)}
                          />
                          <label htmlFor={`dept-${dept.id}`} className="text-sm truncate">
                            {dept.name}
                          </label>
                        </div>
                      ))}
                    </div>
                    {selectedDeptIds.size === 0 && (
                      <p className="text-xs text-amber-500 mt-2">
                        ⚠️ Chưa chọn phòng ban nào
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={!selectedKpi}>
                {mode === 'create' ? 'Thêm KPI' : 'Lưu thay đổi'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
