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
import type { KPI } from './KPIItem';
import type { KPILibrary } from '@/lib/api';

const kpiFormSchema = z.object({
  kpiLibId: z.number().min(1, 'Vui lòng chọn KPI từ thư viện'),
  target: z.number().min(0, 'Mục tiêu phải >= 0'),
});

type KPIFormValues = z.infer<typeof kpiFormSchema>;

interface KPIEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kpi: KPI | null;
  kpiLibrary: KPILibrary[];
  onSave: (data: { kpiLibId: number; target: number }) => void;
  mode: 'create' | 'edit';
}

export function KPIEditorDialog({
  open,
  onOpenChange,
  kpi,
  kpiLibrary,
  onSave,
  mode,
}: KPIEditorDialogProps) {
  const [selectedKpi, setSelectedKpi] = useState<KPILibrary | null>(null);

  const form = useForm<KPIFormValues>({
    resolver: zodResolver(kpiFormSchema),
    defaultValues: {
      kpiLibId: 0,
      target: 0,
    },
  });

  // Reset form when KPI changes
  useEffect(() => {
    if (kpi && open && mode === 'edit') {
      // @ts-ignore - kpiLibId might exist from API
      const libId = kpi.kpiLibId || 0;
      form.reset({
        kpiLibId: libId,
        target: kpi.target || 0,
      });
      setSelectedKpi(kpiLibrary.find(k => k.id === libId) || null);
    } else if (!kpi && open) {
      form.reset({
        kpiLibId: 0,
        target: 0,
      });
      setSelectedKpi(null);
    }
  }, [kpi, open, form, kpiLibrary, mode]);

  const handleKpiSelect = (kpiLibId: string) => {
    const id = parseInt(kpiLibId);
    form.setValue('kpiLibId', id);
    const kpiItem = kpiLibrary.find(k => k.id === id);
    setSelectedKpi(kpiItem || null);
  };

  const onSubmit = (data: KPIFormValues) => {
    onSave(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Thêm KPI từ Thư viện' : 'Chỉnh sửa KPI'}
          </DialogTitle>
          <DialogDescription>
            Chọn KPI từ thư viện có sẵn và đặt mục tiêu
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

            <FormField
              control={form.control}
              name="target"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mục tiêu (Target Goal) *</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        placeholder="Nhập giá trị mục tiêu"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                      {selectedKpi?.unit && (
                        <span className="text-sm text-muted-foreground min-w-[60px]">
                          {selectedKpi.unit}
                        </span>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
