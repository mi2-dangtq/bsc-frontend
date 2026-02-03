'use client';

import { useState, useEffect } from 'react';
import { useDepartment } from '@/contexts';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface AssignedDepartment {
  id: string;
  name: string;
  code: string | null;
}

interface DepartmentAssignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  csfId: number;
  csfContent: string;
  currentDepartments: AssignedDepartment[];
  onSave: (departments: AssignedDepartment[]) => void;
}

export function DepartmentAssignDialog({
  open,
  onOpenChange,
  csfId,
  csfContent,
  currentDepartments,
  onSave,
}: DepartmentAssignDialogProps) {
  const { departments } = useDepartment();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  // Initialize with current assignments when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedIds(new Set(currentDepartments.map((d) => d.id)));
    }
  }, [open, currentDepartments]);

  const handleToggle = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/csf/${csfId}/departments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ departmentIds: Array.from(selectedIds) }),
      });

      if (res.ok) {
        const updated = await res.json();
        const newDepartments = updated.departments?.map(
          (d: { department: AssignedDepartment }) => d.department
        ) || [];
        onSave(newDepartments);
        toast.success('Đã cập nhật phòng ban phụ trách');
        onOpenChange(false);
      } else {
        throw new Error('Failed to assign departments');
      }
    } catch (err) {
      console.error('Error assigning departments:', err);
      toast.error('Lỗi khi cập nhật phòng ban');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Phân bổ phòng ban phụ trách</DialogTitle>
          <DialogDescription className="line-clamp-2">
            CSF: {csfContent}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-3 max-h-[300px] overflow-y-auto">
          {departments.map((dept) => (
            <label
              key={dept.id}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer"
            >
              <Checkbox
                checked={selectedIds.has(dept.id)}
                onCheckedChange={() => handleToggle(dept.id)}
              />
              <div className="flex-1">
                <span className="font-medium">{dept.name}</span>
                {dept.code && (
                  <Badge variant="outline" className="ml-2 text-xs">
                    {dept.code}
                  </Badge>
                )}
              </div>
            </label>
          ))}
          
          {departments.length === 0 && (
            <div className="text-center text-muted-foreground py-4">
              Chưa có phòng ban nào trong hệ thống
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Lưu ({selectedIds.size} phòng ban)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
