'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import type { Objective } from './ObjectivesManager';

interface ObjectiveTableProps {
  objectives: Objective[];
}

export function ObjectiveTable({ objectives }: ObjectiveTableProps) {
  if (objectives.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Không có mục tiêu nào để hiển thị</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-[80px]">Mã</TableHead>
            <TableHead>Tên mục tiêu</TableHead>
            <TableHead className="w-[150px]">Phương diện</TableHead>
            <TableHead className="w-[80px] text-center">Tỷ trọng</TableHead>
            <TableHead className="w-[80px] text-center">CSF</TableHead>
            <TableHead className="w-[80px] text-center">KPI</TableHead>
            <TableHead className="w-[100px] text-right">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {objectives.map((obj) => (
            <TableRow key={obj.id}>
              <TableCell>
                {obj.code ? (
                  <Badge
                    variant="outline"
                    className="text-xs"
                    style={{ borderColor: obj.color, color: obj.color }}
                  >
                    {obj.code}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>
                <div>
                  <p className="font-medium text-sm">{obj.name}</p>
                  {obj.description && (
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {obj.description}
                    </p>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: obj.color }}
                  />
                  <span className="text-sm">{obj.perspectiveName}</span>
                </div>
              </TableCell>
              <TableCell className="text-center">
                {obj.weight !== undefined && obj.weight > 0 ? (
                  <Badge variant="secondary">{obj.weight}%</Badge>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell className="text-center">
                <span className="text-sm">{obj.csfCount || 0}</span>
              </TableCell>
              <TableCell className="text-center">
                <span className="text-sm">{obj.kpiCount || 0}</span>
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm" className="h-7 px-2" asChild>
                  <Link href={`/csf?objective=${obj.id}`}>
                    Chi tiết
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
