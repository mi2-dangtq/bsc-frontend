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
  FormDescription,
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
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { strategicThemesAPI, type StrategicTheme } from '@/lib/api';

// Các từ khóa hành động theo tài liệu TOPPION
const ACTION_KEYWORDS = [
  'Tăng',
  'Giảm',
  'Duy trì',
  'Đảm bảo',
  'Tối ưu hóa',
  'Phát triển',
  'Cải tiến',
  'Cải thiện',
  'Nâng cao',
  'Mở rộng',
];

// Schema validation với Zod
const objectiveFormSchema = z.object({
  name: z
    .string()
    .min(5, 'Tên mục tiêu phải có ít nhất 5 ký tự')
    .max(255, 'Tên mục tiêu không được quá 255 ký tự')
    .refine(
      (value) => {
        const trimmedValue = value.trim().toLowerCase();
        // Check if value starts with any action keyword (hỗ trợ từ khóa nhiều chữ)
        return ACTION_KEYWORDS.some((keyword) =>
          trimmedValue.startsWith(keyword.toLowerCase())
        );
      },
      {
        message: `Tên mục tiêu phải bắt đầu bằng từ khóa hành động: ${ACTION_KEYWORDS.join(', ')}`,
      }
    ),
  code: z
    .string()
    .max(20, 'Mã mục tiêu không được quá 20 ký tự')
    .optional()
    .or(z.literal('')),
  weight: z
    .number()
    .min(0, 'Tỷ trọng không được âm')
    .max(100, 'Tỷ trọng không được quá 100%')
    .optional(),
  description: z.string().max(500, 'Mô tả không được quá 500 ký tự').optional(),
  themeId: z.number().optional().nullable(),
});

type ObjectiveFormValues = z.infer<typeof objectiveFormSchema>;

export interface ObjectiveData {
  id: string;
  dbId?: number;
  name: string;
  code?: string;
  weight?: number;
  description?: string;
  perspectiveId: number;
  perspectiveName: string;
  color: string;
  themeId?: number | null;
  year?: number;
}

interface ObjectiveEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  objective: ObjectiveData | null;
  onSave: (data: ObjectiveFormValues) => void;
  onDelete?: () => void;
  mode: 'create' | 'edit';
}

export function ObjectiveEditorDialog({
  open,
  onOpenChange,
  objective,
  onSave,
  onDelete,
  mode,
}: ObjectiveEditorDialogProps) {
  const [themes, setThemes] = useState<StrategicTheme[]>([]);
  
  const form = useForm<ObjectiveFormValues>({
    resolver: zodResolver(objectiveFormSchema),
    defaultValues: {
      name: '',
      code: '',
      weight: undefined,
      description: '',
      themeId: null,
    },
  });

  // Load themes when dialog opens
  useEffect(() => {
    if (open) {
      strategicThemesAPI.getAll(objective?.year || new Date().getFullYear())
        .then(setThemes)
        .catch(console.error);
    }
  }, [open, objective?.year]);

  // Reset form khi objective thay đổi
  useEffect(() => {
    if (objective && open) {
      form.reset({
        name: objective.name,
        code: objective.code || '',
        weight: objective.weight,
        description: objective.description || '',
        themeId: objective.themeId ?? null,
      });
    } else if (!objective && open) {
      form.reset({
        name: '',
        code: '',
        weight: undefined,
        description: '',
      });
    }
  }, [objective, open, form]);

  const onSubmit = (data: ObjectiveFormValues) => {
    onSave(data);
    onOpenChange(false);
  };

  // Check if name starts with action keyword
  const nameValue = form.watch('name');
  const hasValidKeyword = nameValue
    ? ACTION_KEYWORDS.some((keyword) =>
        nameValue.trim().toLowerCase().startsWith(keyword.toLowerCase())
      )
    : false;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === 'create' ? 'Thêm mục tiêu mới' : 'Chỉnh sửa mục tiêu'}
            {objective && (
              <Badge
                style={{ backgroundColor: objective.color }}
                className="text-white"
              >
                {objective.perspectiveName}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Mục tiêu chiến lược cần bắt đầu bằng từ khóa hành động
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Tên mục tiêu */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên mục tiêu *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        placeholder="VD: Tăng doanh thu từ khách hàng mới"
                        {...field}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {field.value && (
                          hasValidKeyword ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-amber-500" />
                          )
                        )}
                      </div>
                    </div>
                  </FormControl>
                  <FormDescription>
                    <span className="text-xs">
                      Từ khóa:{' '}
                      {ACTION_KEYWORDS.map((kw, i) => (
                        <span key={kw}>
                          <code className="bg-muted px-1 rounded text-xs">
                            {kw}
                          </code>
                          {i < ACTION_KEYWORDS.length - 1 ? ', ' : ''}
                        </span>
                      ))}
                    </span>
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Mã mục tiêu và Tỷ trọng trên cùng 1 hàng */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mã mục tiêu</FormLabel>
                    <FormControl>
                      <Input placeholder="VD: F-01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tỷ trọng (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        step={0.1}
                        placeholder="VD: 25"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value === '' ? undefined : parseFloat(value));
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Nhóm chiến lược */}
            {themes.length > 0 && (
              <FormField
                control={form.control}
                name="themeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nhóm Chiến lược</FormLabel>
                    <Select
                      value={field.value?.toString() || 'none'}
                      onValueChange={(val) => field.onChange(val === 'none' ? null : parseInt(val))}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn nhóm chiến lược" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Không thuộc nhóm nào</SelectItem>
                        {themes.map((theme) => (
                          <SelectItem key={theme.id} value={theme.id.toString()}>
                            <div className="flex items-center gap-2">
                              <span
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: theme.color }}
                              />
                              {theme.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Mô tả */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mô tả</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Mô tả chi tiết về mục tiêu này..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 sm:gap-0">
              {mode === 'edit' && onDelete && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => {
                    onDelete();
                    onOpenChange(false);
                  }}
                  className="mr-auto"
                >
                  Xóa
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Hủy
              </Button>
              <Button type="submit">
                {mode === 'create' ? 'Thêm mục tiêu' : 'Lưu thay đổi'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
