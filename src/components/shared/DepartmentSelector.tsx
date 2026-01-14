'use client';

import { useDepartment } from '@/contexts';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2 } from 'lucide-react';

interface DepartmentSelectorProps {
  showLabel?: boolean;
  className?: string;
}

export function DepartmentSelector({ showLabel = true, className = '' }: DepartmentSelectorProps) {
  const { departments, selectedDepartment, setSelectedDepartment, loading } = useDepartment();

  const handleChange = (value: string) => {
    const dept = departments.find((d) => d.id === value);
    if (dept) setSelectedDepartment(dept);
  };

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {showLabel && <span className="text-sm text-muted-foreground">Phòng ban:</span>}
        <div className="h-9 w-[200px] bg-muted animate-pulse rounded-md" />
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showLabel && (
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Building2 className="h-4 w-4" />
          <span>Phòng ban:</span>
        </div>
      )}
      <Select
        value={selectedDepartment?.id || ''}
        onValueChange={handleChange}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Chọn phòng ban" />
        </SelectTrigger>
        <SelectContent>
          {departments.map((dept) => (
            <SelectItem key={dept.id} value={dept.id}>
              {dept.code ? `[${dept.code}] ` : ''}{dept.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

