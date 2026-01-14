'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { strategicThemesAPI, type StrategicTheme } from '@/lib/api';

interface ThemeManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  year: number;
  onThemesChange?: () => void;
}

interface ThemeFormData {
  name: string;
  description: string;
  color: string;
}

const DEFAULT_COLORS = [
  '#22c55e', // green
  '#3b82f6', // blue
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
];

export function ThemeManagementDialog({
  open,
  onOpenChange,
  year,
  onThemesChange,
}: ThemeManagementDialogProps) {
  const [themes, setThemes] = useState<StrategicTheme[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingTheme, setEditingTheme] = useState<StrategicTheme | null>(null);
  const [formData, setFormData] = useState<ThemeFormData>({
    name: '',
    description: '',
    color: DEFAULT_COLORS[0],
  });

  // Load themes when dialog opens
  useEffect(() => {
    if (open) {
      loadThemes();
    }
  }, [open, year]);

  const loadThemes = async () => {
    setLoading(true);
    try {
      const data = await strategicThemesAPI.getAll(year);
      setThemes(data);
    } catch (err) {
      console.error('Error loading themes:', err);
      toast.error('Lỗi khi tải danh sách nhóm chiến lược');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('Vui lòng nhập tên nhóm chiến lược');
      return;
    }

    setSaving(true);
    try {
      if (editingTheme) {
        await strategicThemesAPI.update(editingTheme.id, {
          name: formData.name,
          description: formData.description || undefined,
          color: formData.color,
        });
        toast.success('Đã cập nhật nhóm chiến lược');
      } else {
        await strategicThemesAPI.create({
          name: formData.name,
          description: formData.description || undefined,
          color: formData.color,
          year,
        });
        toast.success('Đã tạo nhóm chiến lược mới');
      }
      
      resetForm();
      loadThemes();
      onThemesChange?.();
    } catch (err) {
      console.error('Error saving theme:', err);
      toast.error('Lỗi khi lưu nhóm chiến lược');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (theme: StrategicTheme) => {
    setEditingTheme(theme);
    setFormData({
      name: theme.name,
      description: theme.description || '',
      color: theme.color,
    });
  };

  const handleDelete = async (theme: StrategicTheme) => {
    if (!confirm(`Xác nhận xóa "${theme.name}"?`)) return;

    try {
      await strategicThemesAPI.delete(theme.id);
      toast.success('Đã xóa nhóm chiến lược');
      loadThemes();
      onThemesChange?.();
    } catch (err) {
      console.error('Error deleting theme:', err);
      toast.error('Lỗi khi xóa nhóm chiến lược');
    }
  };

  const resetForm = () => {
    setEditingTheme(null);
    setFormData({
      name: '',
      description: '',
      color: DEFAULT_COLORS[themes.length % DEFAULT_COLORS.length],
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Quản lý Nhóm Chiến lược</DialogTitle>
          <DialogDescription>
            Tạo và quản lý các nhóm chiến lược (Strategic Themes) cho năm {year}
          </DialogDescription>
        </DialogHeader>

        {/* Form */}
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Tên
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="VD: Chiến lược năng suất"
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Mô tả
            </Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="(Tùy chọn)"
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Màu</Label>
            <div className="col-span-3 flex gap-2">
              {DEFAULT_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`w-8 h-8 rounded-full border-2 ${
                    formData.color === color ? 'border-foreground' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setFormData({ ...formData, color })}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            {editingTheme && (
              <Button variant="ghost" onClick={resetForm}>
                Hủy sửa
              </Button>
            )}
            <Button onClick={handleSubmit} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingTheme ? 'Cập nhật' : 'Thêm mới'}
              {!editingTheme && <Plus className="ml-2 h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">Màu</TableHead>
                <TableHead>Tên nhóm</TableHead>
                <TableHead className="w-[100px] text-center">Mục tiêu</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : themes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    Chưa có nhóm chiến lược nào
                  </TableCell>
                </TableRow>
              ) : (
                themes.map((theme) => (
                  <TableRow key={theme.id}>
                    <TableCell>
                      <div
                        className="w-6 h-6 rounded-full"
                        style={{ backgroundColor: theme.color }}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{theme.name}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">
                        {theme._count?.objectives || 0}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(theme)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(theme)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
