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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowUp, ArrowDown, Target, TrendingUp } from 'lucide-react';
import type { LocalAllocation } from '@/hooks/useKpiMeasurementAPI';

const measurementFormSchema = z.object({
  actualValue: z.number().min(0, 'Giá trị phải >= 0'),
  note: z.string().max(500, 'Ghi chú tối đa 500 ký tự').optional(),
});

type MeasurementFormValues = z.infer<typeof measurementFormSchema>;

interface MeasurementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  allocation: LocalAllocation | null;
  onSave: (allocationId: number, actualValue: number, note?: string) => Promise<boolean>;
  calculateScore: (allocation: LocalAllocation, actualValue: number) => number;
}

export function MeasurementDialog({
  open,
  onOpenChange,
  allocation,
  onSave,
  calculateScore,
}: MeasurementDialogProps) {
  const [previewScore, setPreviewScore] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const form = useForm<MeasurementFormValues>({
    resolver: zodResolver(measurementFormSchema),
    defaultValues: {
      actualValue: 0,
      note: '',
    },
  });

  // Reset form when allocation changes
  useEffect(() => {
    if (allocation && open) {
      const defaultValue = allocation.latestMeasurement?.actualValue ?? 0;
      form.reset({
        actualValue: defaultValue,
        note: '',
      });
      if (defaultValue > 0) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setPreviewScore(calculateScore(allocation, defaultValue));
      } else {
        setPreviewScore(null);
      }
    }
  }, [allocation, open, form, calculateScore]);

  // Calculate preview score on actual value change
  const handleActualValueChange = (value: number) => {
    form.setValue('actualValue', value);
    if (allocation && value >= 0) {
      setPreviewScore(calculateScore(allocation, value));
    } else {
      setPreviewScore(null);
    }
  };

  const onSubmit = async (data: MeasurementFormValues) => {
    if (!allocation) return;
    
    setSaving(true);
    const success = await onSave(allocation.id, data.actualValue, data.note);
    setSaving(false);
    
    if (success) {
      onOpenChange(false);
    }
  };

  if (!allocation) return null;

  const getScoreColor = (score: number) => {
    if (score >= 100) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressColor = (score: number) => {
    if (score >= 100) return 'bg-green-500';
    if (score >= 80) return 'bg-blue-500';
    if (score >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Nhập kết quả đo lường
          </DialogTitle>
          <DialogDescription>
            {allocation.kpiName}
          </DialogDescription>
        </DialogHeader>

        {/* KPI Info */}
        <div className="p-3 bg-muted rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{allocation.objectiveName}</span>
            <Badge variant={allocation.kpiTrend === 'POSITIVE' ? 'default' : 'secondary'}>
              {allocation.kpiTrend === 'POSITIVE' ? (
                <><ArrowUp className="h-3 w-3 mr-1" />Càng cao càng tốt</>
              ) : (
                <><ArrowDown className="h-3 w-3 mr-1" />Càng thấp càng tốt</>
              )}
            </Badge>
          </div>
          <div className="grid grid-cols-4 gap-2 text-xs">
            <div className="text-center p-2 bg-background rounded">
              <div className="text-muted-foreground">Min</div>
              <div className="font-medium">{allocation.targetMin ?? 0}</div>
            </div>
            <div className="text-center p-2 bg-background rounded">
              <div className="text-muted-foreground">Ngưỡng</div>
              <div className="font-medium">{allocation.targetThreshold ?? (allocation.targetGoal * 0.8).toFixed(0)}</div>
            </div>
            <div className="text-center p-2 bg-background rounded border-2 border-primary">
              <div className="text-muted-foreground flex items-center justify-center gap-1">
                <Target className="h-3 w-3" />Target
              </div>
              <div className="font-bold text-primary">{allocation.targetGoal}</div>
            </div>
            <div className="text-center p-2 bg-background rounded">
              <div className="text-muted-foreground">Max</div>
              <div className="font-medium">{allocation.targetMax ?? (allocation.targetGoal * 1.2).toFixed(0)}</div>
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="actualValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Giá trị thực tế *</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Nhập giá trị thực tế"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => handleActualValueChange(parseFloat(e.target.value) || 0)}
                      />
                      {allocation.kpiUnit && (
                        <span className="text-sm text-muted-foreground min-w-[60px]">
                          {allocation.kpiUnit}
                        </span>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Score Preview */}
            {previewScore !== null && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Điểm hiệu suất (Preview)</span>
                  <span className={`text-2xl font-bold ${getScoreColor(previewScore)}`}>
                    {previewScore.toFixed(1)}%
                  </span>
                </div>
                <div className="relative">
                  <Progress 
                    value={Math.min(previewScore, 120)} 
                    max={120}
                    className={`h-3 ${getProgressColor(previewScore)}`}
                  />
                  <div 
                    className="absolute top-0 w-0.5 h-3 bg-black" 
                    style={{ left: `${(100/120)*100}%` }}
                    title="Target 100%"
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>0%</span>
                  <span>100%</span>
                  <span>120%</span>
                </div>
              </div>
            )}

            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ghi chú</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ghi chú thêm về kết quả đo lường..."
                      className="resize-none"
                      rows={2}
                      {...field}
                    />
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
                disabled={saving}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Đang lưu...' : 'Lưu kết quả'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
