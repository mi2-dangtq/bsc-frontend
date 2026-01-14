'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ChevronDown,
  ChevronRight,
  Edit,
  Trash2,
  Plus,
  Building2,
} from 'lucide-react';
import { KPIItem, type KPI } from './KPIItem';

interface AssignedDepartment {
  id: string;
  name: string;
  code: string | null;
}

export interface CSF {
  id: string;
  dbId?: number;
  objectiveId: string;
  name: string;
  description?: string;
  kpis: KPI[];
  departments?: AssignedDepartment[];
}

interface CSFCardProps {
  csf: CSF;
  index: number;
  objectiveColor: string;
  onEdit: () => void;
  onDelete: () => void;
  onUpdate: (csf: CSF) => void;
  onAddKpi?: (csfId: string, csfDbId?: number) => void;
  onDeleteKpi?: (csfId: string, kpiId: string) => void;
  onAssignDepartments?: (csf: CSF) => void;
}

export function CSFCard({
  csf,
  index,
  objectiveColor,
  onEdit,
  onDelete,
  onUpdate,
  onAddKpi,
  onDeleteKpi,
  onAssignDepartments,
}: CSFCardProps) {
  const [expanded, setExpanded] = useState(true);

  // Add KPI - delegate to parent if handler provided
  const handleAddKpi = () => {
    if (onAddKpi) {
      onAddKpi(csf.id, csf.dbId);
    }
  };

  // Delete KPI - delegate to parent if handler provided, else local
  const handleDeleteKpi = (kpiId: string) => {
    if (onDeleteKpi) {
      onDeleteKpi(csf.id, kpiId);
    } else {
      const newKpis = csf.kpis.filter((k) => k.id !== kpiId);
      onUpdate({ ...csf, kpis: newKpis });
    }
  };

  const departments = csf.departments || [];

  return (
    <Card className="border-l-4" style={{ borderLeftColor: objectiveColor }}>
      <CardHeader className="py-3 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
            <Badge variant="outline" className="text-xs">
              CSF {index}
            </Badge>
            <span className="font-medium">{csf.name}</span>
            {csf.kpis.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {csf.kpis.length} KPI
              </Badge>
            )}
            {/* Department badges */}
            {departments.length > 0 ? (
              departments.map((dept) => (
                <Badge
                  key={dept.id}
                  variant="outline"
                  className="text-xs bg-blue-50 text-blue-700 border-blue-200 cursor-pointer hover:bg-blue-100"
                  onClick={() => onAssignDepartments?.(csf)}
                >
                  <Building2 className="h-3 w-3 mr-1" />
                  {dept.code || dept.name.slice(0, 8)}
                </Badge>
              ))
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => onAssignDepartments?.(csf)}
              >
                <Building2 className="h-3 w-3 mr-1" />
                + Phòng ban
              </Button>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
              onClick={onEdit}
            >
              <Edit className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        {csf.description && (
          <p className="text-sm text-muted-foreground ml-8 mt-1">
            {csf.description}
          </p>
        )}
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0 pb-3 px-4">
          <div className="ml-8 space-y-2">
            {csf.kpis.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">
                Chưa có KPI. Bấm nút bên dưới để thêm.
              </p>
            ) : (
              csf.kpis.map((kpi, kpiIndex) => (
                <KPIItem
                  key={kpi.id}
                  kpi={kpi}
                  index={kpiIndex + 1}
                  onEdit={() => {}} // Edit through parent
                  onDelete={() => handleDeleteKpi(kpi.id)}
                />
              ))
            )}
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-2"
              onClick={handleAddKpi}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Thêm KPI từ Thư viện
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
