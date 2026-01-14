'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Edit, Trash2, Plus } from 'lucide-react';
import type { CSF } from './CSFCard';
import type { KPI } from './KPIItem';

interface FishboneTableProps {
  csfs: CSF[];
  objectiveColor: string;
  onEditCsf: (csf: CSF) => void;
  onDeleteCsf: (csfId: string) => void;
  onAddKpi: (csfId: string) => void;
  onEditKpi: (csf: CSF, kpi: KPI) => void;
  onDeleteKpi: (csf: CSF, kpiId: string) => void;
}

export function FishboneTable({
  csfs,
  objectiveColor,
  onEditCsf,
  onDeleteCsf,
  onAddKpi,
  onEditKpi,
  onDeleteKpi,
}: FishboneTableProps) {
  if (csfs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Chưa có CSF nào. Bấm &quot;Thêm CSF&quot; để bắt đầu phân rã mục tiêu.</p>
      </div>
    );
  }

  // Flatten CSFs and KPIs into rows
  const rows: Array<{
    type: 'csf' | 'kpi';
    csf: CSF;
    kpi?: KPI;
    csfIndex: number;
    kpiIndex?: number;
  }> = [];

  csfs.forEach((csf, csfIndex) => {
    // Add CSF row
    rows.push({ type: 'csf', csf, csfIndex: csfIndex + 1 });
    
    // Add KPI rows under this CSF
    csf.kpis.forEach((kpi, kpiIndex) => {
      rows.push({
        type: 'kpi',
        csf,
        kpi,
        csfIndex: csfIndex + 1,
        kpiIndex: kpiIndex + 1,
      });
    });
  });

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-[80px]">Loại</TableHead>
            <TableHead>Tên</TableHead>
            <TableHead className="w-[100px]">Đơn vị</TableHead>
            <TableHead className="w-[100px]">Mục tiêu</TableHead>
            <TableHead className="w-[120px] text-right">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow
              key={row.type === 'csf' ? row.csf.id : row.kpi?.id}
              className={row.type === 'csf' ? 'bg-muted/30 font-medium' : ''}
            >
              <TableCell>
                {row.type === 'csf' ? (
                  <Badge
                    variant="outline"
                    className="text-xs"
                    style={{ borderColor: objectiveColor, color: objectiveColor }}
                  >
                    CSF {row.csfIndex}
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs ml-4">
                    KPI {row.csfIndex}.{row.kpiIndex}
                  </Badge>
                )}
              </TableCell>
              <TableCell className={row.type === 'kpi' ? 'pl-8' : ''}>
                {row.type === 'csf' ? row.csf.name : row.kpi?.name}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {row.type === 'kpi' ? row.kpi?.unit || '-' : ''}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {row.type === 'kpi' ? row.kpi?.target ?? '-' : ''}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  {row.type === 'csf' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => onAddKpi(row.csf.id)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      KPI
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                    onClick={() =>
                      row.type === 'csf'
                        ? onEditCsf(row.csf)
                        : onEditKpi(row.csf, row.kpi!)
                    }
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                    onClick={() =>
                      row.type === 'csf'
                        ? onDeleteCsf(row.csf.id)
                        : onDeleteKpi(row.csf, row.kpi!.id)
                    }
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
