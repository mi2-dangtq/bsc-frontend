'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Building2, Target, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Perspective {
  id: number;
  name: string;
  nameEn: string;
  color: string | null;
}

interface DepartmentEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  department: {
    id: string;
    name: string;
    primaryPerspectiveId: number | null;
  } | null;
  onSaved?: () => void;
}

// Perspective color mapping
const perspectiveGradients: Record<number, string> = {
  1: 'from-amber-500 to-orange-600',
  2: 'from-cyan-500 to-blue-600',
  3: 'from-emerald-500 to-green-600',
  4: 'from-purple-500 to-indigo-600',
};

export function DepartmentEditDialog({
  open,
  onOpenChange,
  department,
  onSaved,
}: DepartmentEditDialogProps) {
  const [perspectives, setPerspectives] = useState<Perspective[]>([]);
  const [selectedPerspectiveId, setSelectedPerspectiveId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch perspectives
  useEffect(() => {
    const fetchPerspectives = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/perspectives`);
        if (res.ok) {
          const data = await res.json();
          setPerspectives(data);
        }
      } catch (err) {
        console.error('Failed to fetch perspectives:', err);
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      fetchPerspectives();
    }
  }, [open]);

  // Reset form when department changes
  useEffect(() => {
    if (department && open) {
      setSelectedPerspectiveId(
        department.primaryPerspectiveId?.toString() || ''
      );
    }
  }, [department, open]);

  const handleSave = async () => {
    if (!department || !selectedPerspectiveId) return;

    setSaving(true);
    try {
      const res = await fetch(
        `${API_URL}/departments/${department.id}/primary-perspective`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            primaryPerspectiveId: parseInt(selectedPerspectiveId),
          }),
        }
      );

      if (res.ok) {
        toast.success('Đã cập nhật phương diện chính');
        onSaved?.();
        onOpenChange(false);
      } else {
        const error = await res.json();
        throw new Error(error.message || 'Failed to update');
      }
    } catch (err) {
      console.error('Error updating department:', err);
      toast.error('Lỗi khi cập nhật phương diện chính');
    } finally {
      setSaving(false);
    }
  };

  const selectedPerspective = perspectives.find(
    (p) => p.id.toString() === selectedPerspectiveId
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle>Cấu hình phòng ban</DialogTitle>
              <DialogDescription className="line-clamp-1">
                {department?.name}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Primary Perspective Selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Phương diện chính
                </label>
                <Select
                  value={selectedPerspectiveId}
                  onValueChange={setSelectedPerspectiveId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Chọn phương diện chính" />
                  </SelectTrigger>
                  <SelectContent>
                    {perspectives.map((p) => (
                      <SelectItem key={p.id} value={p.id.toString()}>
                        <div className="flex items-center gap-2">
                          <div
                            className={cn(
                              'w-3 h-3 rounded-full bg-gradient-to-r',
                              perspectiveGradients[p.id] || 'from-slate-400 to-slate-500'
                            )}
                          />
                          {p.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Phương diện chính phải có tỷ trọng ≥ 50% theo quy tắc TOPPION
                </p>
              </div>

              {/* Selected Preview */}
              {selectedPerspective && (
                <div
                  className={cn(
                    'p-4 rounded-xl border-2',
                    'bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800'
                  )}
                  style={{
                    borderColor: selectedPerspective.color || '#3b82f6',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'p-2 rounded-lg bg-gradient-to-br',
                        perspectiveGradients[selectedPerspective.id] ||
                          'from-slate-400 to-slate-500'
                      )}
                    >
                      <Target className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium">{selectedPerspective.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {selectedPerspective.nameEn}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Warning */}
              <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/30">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-700 dark:text-amber-400 text-sm">
                  Sau khi đặt phương diện chính, các KPI phân bổ cho phòng ban
                  này phải đảm bảo tỷ trọng phù hợp.
                </AlertDescription>
              </Alert>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !selectedPerspectiveId}
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Lưu thay đổi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
