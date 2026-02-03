'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Plus, Edit, Trash2, Target, FileText, BarChart3, 
  Building2, Sparkles, TrendingUp, Layers 
} from 'lucide-react';
import type { TreeNode } from './CSFTreeNavigator';
import type { CSF } from './CSFCard';
import type { KPI } from './KPIItem';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
  // Empty state
  if (!selectedNode) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="mb-6 relative">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-950/50 dark:to-purple-950/50 flex items-center justify-center">
              <Target className="h-10 w-10 text-indigo-500" />
            </div>
            <div className="absolute -top-2 -right-2 animate-bounce">
              <Sparkles className="h-6 w-6 text-amber-500" />
            </div>
          </div>
          <h3 className="text-lg font-semibold mb-2">Chọn một mục tiêu</h3>
          <p className="text-muted-foreground text-sm">
            Chọn một Mục tiêu hoặc CSF từ danh sách bên trái để xem chi tiết và quản lý các yếu tố thành công
          </p>
        </div>
      </div>
    );
  }

  // Perspective view
  if (selectedNode.type === 'perspective') {
    return (
      <div className="p-8">
        <div className="flex items-center gap-4 mb-8">
          <div 
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg"
            style={{ 
              background: `linear-gradient(135deg, ${selectedNode.color}, ${selectedNode.color}cc)` 
            }}
          >
            {selectedNode.name.charAt(0)}
          </div>
          <div>
            <Badge variant="secondary" className="mb-1">Phương diện</Badge>
            <h2 className="text-2xl font-bold">{selectedNode.name}</h2>
            {selectedNode.weight && (
              <p className="text-muted-foreground mt-1">
                Tỷ trọng: <span className="font-semibold" style={{ color: selectedNode.color }}>{selectedNode.weight}%</span>
              </p>
            )}
          </div>
        </div>
        
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Layers className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">
              Chọn một Mục tiêu chiến lược để xem và quản lý CSF/KPI
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate weight usage
  const totalKPIWeight = csfs.reduce((sum, csf) => 
    sum + csf.kpis.reduce((s, k) => s + (k.weight || 0), 0), 0
  );
  const weightProgress = objectiveWeight ? (totalKPIWeight / objectiveWeight) * 100 : 0;

  // Objective view - show CSFs
  if (selectedNode.type === 'objective') {
    return (
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center shadow-md"
              style={{ 
                background: `linear-gradient(135deg, ${selectedNode.color}20, ${selectedNode.color}10)` 
              }}
            >
              <Target className="h-6 w-6" style={{ color: selectedNode.color }} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-xs">Mục tiêu</Badge>
                {selectedNode.weight !== undefined && selectedNode.weight > 0 && (
                  <Badge 
                    style={{ borderColor: selectedNode.color, color: selectedNode.color }}
                    variant="outline"
                  >
                    {selectedNode.weight}%
                  </Badge>
                )}
              </div>
              <h2 className="text-xl font-bold">{selectedNode.name}</h2>
            </div>
          </div>
          <Button onClick={onAddCSF} className="gap-2 shadow-md">
            <Plus className="h-4 w-4" />
            Thêm CSF
          </Button>
        </div>

        {/* Weight Progress */}
        {objectiveWeight && objectiveWeight > 0 && (
          <Card className="mb-6 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/50">
            <CardContent className="py-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Tỷ trọng KPI đã sử dụng</span>
                <span className={`text-sm font-bold ${weightProgress > 100 ? 'text-red-600' : 'text-emerald-600'}`}>
                  {totalKPIWeight}% / {objectiveWeight}%
                </span>
              </div>
              <Progress 
                value={Math.min(weightProgress, 100)} 
                className="h-2"
              />
              {weightProgress > 100 && (
                <p className="text-xs text-red-600 mt-2">
                  ⚠️ Tổng tỷ trọng KPI vượt quá tỷ trọng mục tiêu!
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* CSFs List */}
        {csfs.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="py-16 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/50 dark:to-teal-950/50 flex items-center justify-center">
                <FileText className="h-8 w-8 text-emerald-500" />
              </div>
              <h3 className="font-semibold mb-2">Chưa có CSF nào</h3>
              <p className="text-muted-foreground mb-6 text-sm max-w-sm mx-auto">
                Thêm các yếu tố thành công then chốt (CSF) để phân rã mục tiêu này thành các chỉ số đo lường được
              </p>
              <Button onClick={onAddCSF} variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                Thêm CSF đầu tiên
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {csfs.map((csf, index) => (
              <Card 
                key={csf.id} 
                className="overflow-hidden transition-all hover:shadow-md"
                style={{ borderLeftWidth: '4px', borderLeftColor: selectedNode.color }}
              >
                <CardHeader className="pb-3 bg-gradient-to-r from-slate-50/50 to-transparent dark:from-slate-900/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shadow-sm"
                        style={{ backgroundColor: selectedNode.color }}
                      >
                        {index + 1}
                      </div>
                      <div>
                        <CardTitle className="text-base">{csf.name}</CardTitle>
                        {csf.departments && csf.departments.length > 0 && (
                          <div className="flex gap-1 mt-1.5">
                            {csf.departments.map(dept => (
                              <Badge 
                                key={dept.id} 
                                variant="outline" 
                                className="text-[10px] bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800"
                              >
                                <Building2 className="h-2.5 w-2.5 mr-1" />
                                {dept.code || dept.name.slice(0, 8)}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <TooltipProvider>
                        {onAssignDepartments && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0"
                                onClick={() => onAssignDepartments(csf)}
                              >
                                <Building2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Gán phòng ban</TooltipContent>
                          </Tooltip>
                        )}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0"
                              onClick={() => onEditCSF(csf)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Sửa CSF</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              onClick={() => onDeleteCSF(csf.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Xóa CSF</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {/* KPIs Table */}
                  {csf.kpis.length === 0 ? (
                    <div className="py-6 text-center border-t">
                      <BarChart3 className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                      <p className="text-sm text-muted-foreground mb-3">Chưa có KPI</p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onAddKPI(csf.id, csf.dbId)}
                        className="gap-1"
                      >
                        <Plus className="h-3 w-3" />
                        Thêm KPI
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Table>
                        <TableHeader>
                          <TableRow className="hover:bg-transparent">
                            <TableHead className="w-[35%]">KPI</TableHead>
                            <TableHead className="w-[10%]">Đơn vị</TableHead>
                            <TableHead className="w-[10%] text-center">Mục tiêu</TableHead>
                            <TableHead className="w-[10%] text-center">Tỷ trọng</TableHead>
                            <TableHead className="w-[20%]">Phòng ban</TableHead>
                            <TableHead className="w-[15%] text-right">Thao tác</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {csf.kpis.map((kpi, kpiIndex) => (
                            <TableRow key={kpi.id} className="group">
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Badge 
                                    variant="secondary" 
                                    className="text-[10px] shrink-0 bg-slate-200 dark:bg-slate-700"
                                  >
                                    {index + 1}.{kpiIndex + 1}
                                  </Badge>
                                  <span className="font-medium">{kpi.name}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {kpi.unit || '-'}
                              </TableCell>
                              <TableCell className="text-center font-medium">
                                {kpi.targetGoal ?? kpi.target ?? '-'}
                              </TableCell>
                              <TableCell className="text-center">
                                {kpi.weight ? (
                                  <Badge 
                                    variant="outline" 
                                    className="text-xs font-semibold"
                                    style={{ borderColor: selectedNode.color, color: selectedNode.color }}
                                  >
                                    {kpi.weight}%
                                  </Badge>
                                ) : '-'}
                              </TableCell>
                              <TableCell>
                                {kpi.departments && kpi.departments.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {kpi.departments.map(dept => (
                                      <Badge 
                                        key={dept.id} 
                                        variant="outline" 
                                        className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800"
                                      >
                                        <Building2 className="h-2.5 w-2.5 mr-1" />
                                        {dept.code || dept.name.slice(0, 8)}
                                      </Badge>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-xs text-muted-foreground">Tất cả</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
                      <div className="mt-3 flex justify-end border-t pt-3">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => onAddKPI(csf.id, csf.dbId)}
                          className="gap-1"
                        >
                          <Plus className="h-3 w-3" />
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
            <div className="flex items-center gap-4">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center shadow-md"
                style={{ 
                  background: `linear-gradient(135deg, ${selectedNode.color}20, ${selectedNode.color}10)` 
                }}
              >
                <FileText className="h-6 w-6" style={{ color: selectedNode.color }} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-xs">CSF</Badge>
                </div>
                <h2 className="text-xl font-bold">{selectedCsf.name}</h2>
                <Badge variant="secondary" className="mt-1">{selectedCsf.kpis.length} KPI</Badge>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onEditCSF(selectedCsf)} className="gap-2">
                <Edit className="h-4 w-4" />
                Sửa CSF
              </Button>
              <Button onClick={() => onAddKPI(selectedCsf.id, selectedCsf.dbId)} className="gap-2">
                <Plus className="h-4 w-4" />
                Thêm KPI
              </Button>
            </div>
          </div>

          {/* KPIs Table */}
          {selectedCsf.kpis.length === 0 ? (
            <Card className="border-dashed border-2">
              <CardContent className="py-16 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-100 to-violet-100 dark:from-purple-950/50 dark:to-violet-950/50 flex items-center justify-center">
                  <BarChart3 className="h-8 w-8 text-purple-500" />
                </div>
                <h3 className="font-semibold mb-2">Chưa có KPI</h3>
                <p className="text-muted-foreground mb-6 text-sm max-w-sm mx-auto">
                  Thêm các KPI để đo lường CSF này
                </p>
                <Button onClick={() => onAddKPI(selectedCsf.id, selectedCsf.dbId)} variant="outline" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Thêm KPI đầu tiên
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>KPI</TableHead>
                    <TableHead className="w-[80px]">Đơn vị</TableHead>
                    <TableHead className="w-[80px] text-center">Mục tiêu</TableHead>
                    <TableHead className="w-[80px] text-center">Tỷ trọng</TableHead>
                    <TableHead className="w-[150px]">Phòng ban</TableHead>
                    <TableHead className="w-[100px] text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedCsf.kpis.map((kpi, index) => (
                    <TableRow 
                      key={kpi.id}
                      className={selectedNode.id === kpi.id ? 'bg-primary/5 ring-1 ring-primary/20' : ''}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-[10px]">
                            KPI {index + 1}
                          </Badge>
                          <span className={selectedNode.id === kpi.id ? 'font-semibold' : 'font-medium'}>
                            {kpi.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {kpi.unit || '-'}
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {kpi.targetGoal ?? kpi.target ?? '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        {kpi.weight ? (
                          <Badge variant="outline" className="text-xs font-semibold">
                            {kpi.weight}%
                          </Badge>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        {kpi.departments && kpi.departments.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {kpi.departments.map(dept => (
                              <Badge 
                                key={dept.id} 
                                variant="outline" 
                                className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800"
                              >
                                <Building2 className="h-2.5 w-2.5 mr-1" />
                                {dept.code || dept.name.slice(0, 8)}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Tất cả</span>
                        )}
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
