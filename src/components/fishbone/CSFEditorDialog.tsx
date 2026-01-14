'use client';

import { useEffect } from 'react';
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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { CSF } from './CSFCard';

const csfFormSchema = z.object({
  name: z
    .string()
    .min(5, 'Tên CSF phải có ít nhất 5 ký tự')
    .max(150, 'Tên CSF không được quá 150 ký tự'),
  description: z.string().max(300, 'Mô tả không được quá 300 ký tự').optional(),
});

type CSFFormValues = z.infer<typeof csfFormSchema>;

interface CSFEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  csf: CSF | null;
  onSave: (data: CSFFormValues) => void;
  mode: 'create' | 'edit';
}

export function CSFEditorDialog({
  open,
  onOpenChange,
  csf,
  onSave,
  mode,
}: CSFEditorDialogProps) {
  const form = useForm<CSFFormValues>({
    resolver: zodResolver(csfFormSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  // Reset form when CSF changes
  useEffect(() => {
    if (csf && open) {
      form.reset({
        name: csf.name,
        description: csf.description || '',
      });
    } else if (!csf && open) {
      form.reset({
        name: '',
        description: '',
      });
    }
  }, [csf, open, form]);

  const onSubmit = (data: CSFFormValues) => {
    onSave(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Thêm CSF mới' : 'Chỉnh sửa CSF'}
          </DialogTitle>
          <DialogDescription>
            CSF (Critical Success Factor) - Yếu tố thành công then chốt
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên CSF *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="VD: Mở rộng kênh phân phối"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    CSF là yếu tố then chốt, không phải giải pháp cụ thể
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mô tả</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Mô tả chi tiết về CSF này..."
                      className="resize-none"
                      rows={3}
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
              >
                Hủy
              </Button>
              <Button type="submit">
                {mode === 'create' ? 'Thêm CSF' : 'Lưu thay đổi'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
