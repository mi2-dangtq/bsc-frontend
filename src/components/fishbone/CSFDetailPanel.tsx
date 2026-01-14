'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Plus, Edit, Trash2, Target, FileText, BarChart3, Building2 } from 'lucide-react';
import type { TreeNode } from './CSFTreeNavigator';
import type { CSF } from './CSFCard';
import type { KPI } from './KPIItem';

interface CSFDetailPanelProps {
  selectedNode: TreeNode | null;
  csfs: CSF[];
  onAddCSF: () => void;
  onEditCSF: (csf: CSF) => void;
  onDeleteCSF: (csfId: string) => void;
  onAddKPI: (csfId: string, csfDbId?: number) => void;
  onEditKPI: (csf: CSF, kpi: KPI) => void;
  onDeleteKPI: (csf: CSF, kpiId: string) => void;
  onAssignDepartments?: (csf: CSF) => void;
  objectiveWeight?: number;
}

export function CSFDetailPanel({
  selectedNode,
  csfs,
  onAddCSF,
  onEditCSF,
  onDeleteCSF,
  onAddKPI,
  onEditKPI,
  onDeleteKPI,
  onAssignDepartments,
  objectiveWeight,
}: CSFDetailPanelProps) {
  if (!selectedNode) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center">
          <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Chọn một Mục tiêu hoặc CSF từ danh sách bên trái</p>
        </div>
      </div>
    );
  }

  // Perspective view
  if (selectedNode.type === 'perspective') {
    return (
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
            style={{ backgroundColor: selectedNode.color }}
          >
            {selectedNode.name.charAt(0)}
          </div>
          <div>
            <h2 className="text-xl font-semibold">{selectedNode.name}</h2>
            {selectedNode.weight && (
              <p className="text-sm text-muted-foreground">
                Tỷ trọng: {selectedNode.weight}%
              </p>
            )}
          </div>
        </div>
        <p className="text-muted-foreground">
          Chọn một Mục tiêu chiến lược để xem và quản lý CSF/KPI
        </p>
      </div>
    );
  }

  // Objective view - show CSFs
  if (selectedNode.type === 'objective') {
    return (
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${selectedNode.color}20` }}
            >
              <Target className="h-5 w-5" style={{ color: selectedNode.color }} />
            </div>
            <div>
              <h2 className="text-xl font-semibold">{selectedNode.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                {selectedNode.weight !== undefined && selectedNode.weight > 0 && (
                  <Badge 
                    variant="outline"
                    style={{ borderColor: selectedNode.color, color: selectedNode.color }}
                  >
                    Tỷ trọng: {selectedNode.weight}%
                  </Badge>
                )}
                <Badge variant="secondary">{csfs.length} CSF</Badge>
              </div>
            </div>
          </div>
          <Button onClick={onAddCSF}>
            <Plus className="h-4 w-4 mr-2" />
            Thêm CSF
          </Button>
        </div>

        {/* CSFs List */}
        {csfs.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground mb-4">
                Chưa có CSF nào. Thêm CSF để phân rã mục tiêu này.
              </p>
              <Button variant="outline" onClick={onAddCSF}>
                <Plus className="h-4 w-4 mr-2" />
                Thêm CSF đầu tiên
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {csfs.map((csf, index) => (
              <Card key={csf.id} className="border-l-4" style={{ borderLeftColor: selectedNode.color }}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">CSF {index + 1}</Badge>
                      <CardTitle className="text-base">{csf.name}</CardTitle>
                      {csf.departments && csf.departments.length > 0 && (
                        <div className="flex gap-1">
                          {csf.departments.map(dept => (
                            <Badge 
                              key={dept.id} 
                              variant="outline" 
                              className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                            >
                              <Building2 className="h-3 w-3 mr-1" />
                              {dept.code || dept.name.slice(0, 8)}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {onAssignDepartments && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8"
                          onClick={() => onAssignDepartments(csf)}
                        >
                          <Building2 className="h-4 w-4" />
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0"
                        onClick={() => onEditCSF(csf)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        onClick={() => onDeleteCSF(csf.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* KPIs Table */}
                  {csf.kpis.length === 0 ? (
                    <div className="py-4 text-center">
                      <p className="text-sm text-muted-foreground mb-2">Chưa có KPI</p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onAddKPI(csf.id, csf.dbId)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Thêm KPI
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[200px]">KPI</TableHead>
                            <TableHead className="w-[80px]">Đơn vị</TableHead>
                            <TableHead className="w-[80px] text-center">Mục tiêu</TableHead>
                            <TableHead className="w-[80px] text-center">Tỷ trọng</TableHead>
                            <TableHead className="w-[100px] text-right">Thao tác</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {csf.kpis.map((kpi, kpiIndex) => (
                            <TableRow key={kpi.id}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary" className="text-[10px]">
                                    KPI {index + 1}.{kpiIndex + 1}
                                  </Badge>
                                  {kpi.name}
                                </div>
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {kpi.unit || '-'}
                              </TableCell>
                              <TableCell className="text-center">
                                {kpi.targetGoal ?? kpi.target ?? '-'}
                              </TableCell>
                              <TableCell className="text-center">
                                {kpi.weight ? (
                                  <Badge variant="outline" className="text-xs">
                                    {kpi.weight}%
                                  </Badge>
                                ) : '-'}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0"
                                    onClick={() => onEditKPI(csf, kpi)}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                    onClick={() => onDeleteKPI(csf, kpi.id)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      <div className="mt-2 flex justify-end">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => onAddKPI(csf.id, csf.dbId)}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Thêm KPI
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // CSF or KPI - show parent objective's CSFs filtered
  if (selectedNode.type === 'csf' || selectedNode.type === 'kpi') {
    const selectedCsf = csfs.find(c => c.id === selectedNode.id || 
      c.id === `csf-${selectedNode.dbId}` ||
      c.kpis.some(k => k.id === selectedNode.id));
    
    if (selectedCsf) {
      return (
        <div className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${selectedNode.color}20` }}
              >
                <FileText className="h-5 w-5" style={{ color: selectedNode.color }} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">CSF</Badge>
                  <h2 className="text-xl font-semibold">{selectedCsf.name}</h2>
                </div>
                <Badge variant="secondary" className="mt-1">{selectedCsf.kpis.length} KPI</Badge>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onEditCSF(selectedCsf)}>
                <Edit className="h-4 w-4 mr-2" />
                Sửa CSF
              </Button>
              <Button onClick={() => onAddKPI(selectedCsf.id, selectedCsf.dbId)}>
                <Plus className="h-4 w-4 mr-2" />
                Thêm KPI
              </Button>
            </div>
          </div>

          {/* KPIs Table */}
          {selectedCsf.kpis.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground mb-4">
                  Chưa có KPI nào cho CSF này.
                </p>
                <Button variant="outline" onClick={() => onAddKPI(selectedCsf.id, selectedCsf.dbId)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm KPI đầu tiên
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>KPI</TableHead>
                    <TableHead className="w-[80px]">Đơn vị</TableHead>
                    <TableHead className="w-[80px] text-center">Mục tiêu</TableHead>
                    <TableHead className="w-[80px] text-center">Tỷ trọng</TableHead>
                    <TableHead className="w-[100px] text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedCsf.kpis.map((kpi, index) => (
                    <TableRow 
                      key={kpi.id}
                      className={selectedNode.id === kpi.id ? 'bg-primary/5' : ''}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-[10px]">
                            KPI {index + 1}
                          </Badge>
                          <span className={selectedNode.id === kpi.id ? 'font-medium' : ''}>
                            {kpi.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {kpi.unit || '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        {kpi.targetGoal ?? kpi.target ?? '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        {kpi.weight ? (
                          <Badge variant="outline" className="text-xs">
                            {kpi.weight}%
                          </Badge>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => onEditKPI(selectedCsf, kpi)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                            onClick={() => onDeleteKPI(selectedCsf, kpi.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </div>
      );
    }
  }

  return null;
}
