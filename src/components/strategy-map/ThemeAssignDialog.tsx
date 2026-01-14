'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { strategicThemesAPI, objectivesAPI, type StrategicTheme } from '@/lib/api';

interface ThemeAssignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  objectiveId: number;
  objectiveName: string;
  currentThemeId: number | null;
  year: number;
  onSave: (themeId: number | null, theme: StrategicTheme | null) => void;
}

export function ThemeAssignDialog({
  open,
  onOpenChange,
  objectiveId,
  objectiveName,
  currentThemeId,
  year,
  onSave,
}: ThemeAssignDialogProps) {
  const [themes, setThemes] = useState<StrategicTheme[]>([]);
  const [selectedThemeId, setSelectedThemeId] = useState<string>(
    currentThemeId?.toString() || 'none'
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      loadThemes();
      setSelectedThemeId(currentThemeId?.toString() || 'none');
    }
  }, [open, currentThemeId, year]);

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

  const handleSave = async () => {
    setSaving(true);
    try {
      const themeId = selectedThemeId === 'none' ? null : parseInt(selectedThemeId);
      
      await objectivesAPI.update(objectiveId, { themeId: themeId ?? undefined });
      
      const selectedTheme = themeId 
        ? themes.find(t => t.id === themeId) || null
        : null;
      
      onSave(themeId, selectedTheme);
      toast.success('Đã cập nhật nhóm chiến lược');
      onOpenChange(false);
    } catch (err) {
      console.error('Error saving theme assignment:', err);
      toast.error('Lỗi khi cập nhật nhóm chiến lược');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Chọn Nhóm Chiến lược</DialogTitle>
          <DialogDescription>
            Gán mục tiêu &ldquo;{objectiveName}&rdquo; vào nhóm chiến lược
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <RadioGroup
              value={selectedThemeId}
              onValueChange={setSelectedThemeId}
              className="space-y-3"
            >
              <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50">
                <RadioGroupItem value="none" id="theme-none" />
                <Label
                  htmlFor="theme-none"
                  className="flex-1 cursor-pointer text-muted-foreground"
                >
                  Không thuộc nhóm nào
                </Label>
              </div>
              
              {themes.map((theme) => (
                <div
                  key={theme.id}
                  className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50"
                >
                  <RadioGroupItem
                    value={theme.id.toString()}
                    id={`theme-${theme.id}`}
                  />
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: theme.color }}
                  />
                  <Label
                    htmlFor={`theme-${theme.id}`}
                    className="flex-1 cursor-pointer font-medium"
                  >
                    {theme.name}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Lưu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
