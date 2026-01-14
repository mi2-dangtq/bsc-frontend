'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Target, Ruler } from 'lucide-react';

export interface KPI {
  id: string;
  csfId: string;
  name: string;
  unit?: string;
  target?: number;
  description?: string;
}

interface KPIItemProps {
  kpi: KPI;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
}

export function KPIItem({ kpi, index, onEdit, onDelete }: KPIItemProps) {
  return (
    <div className="flex items-center justify-between p-2 rounded-md bg-muted/50 hover:bg-muted transition-colors group">
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-[10px] px-1.5 h-5">
          KPI {index}
        </Badge>
        <span className="text-sm">{kpi.name}</span>
        {kpi.unit && (
          <span className="text-xs text-muted-foreground flex items-center gap-0.5">
            <Ruler className="h-3 w-3" />
            {kpi.unit}
          </span>
        )}
        {kpi.target !== undefined && (
          <span className="text-xs text-muted-foreground flex items-center gap-0.5">
            <Target className="h-3 w-3" />
            {kpi.target}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
          onClick={onEdit}
        >
          <Edit className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
