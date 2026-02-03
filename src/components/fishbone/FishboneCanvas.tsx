'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Building2, Layers, Target, FileText, BarChart3 } from 'lucide-react';
import { CSFEditorDialog } from './CSFEditorDialog';
import { KPIEditorDialog } from './KPIEditorDialog';
import { DepartmentAssignDialog } from './DepartmentAssignDialog';
import { CSFTreeNavigator, type TreeNode } from './CSFTreeNavigator';
import { CSFDetailPanel } from './CSFDetailPanel';
import type { KPI } from './KPIItem';
import type { CSF } from './CSFCard';
import { objectivesAPI, kpiAllocationAPI, type Objective as APIObjective } from '@/lib/api';
import { useFishboneAPI, getAllocationIdFromKpiId } from '@/hooks/useFishboneAPI';
import { useDepartment, usePerspectives } from '@/contexts';
import { DepartmentSelector } from '@/components/shared/DepartmentSelector';

export interface Objective {
  id: string;
  dbId: number;
  name: string;
  perspectiveName: string;
  color: string;
  year: number;
  weight: number;
}

export function FishboneCanvas() {
  const { fetchKpiLibrary, fetchCSFs, ...api } = useFishboneAPI();
  const { selectedDepartment, isCompanyView } = useDepartment();
  const { perspectives } = usePerspectives();
  
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [csfs, setCsfs] = useState<CSF[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentObjective, setCurrentObjective] = useState<Objective | null>(null);
  
  // CSF Dialog state
  const [csfDialogOpen, setCsfDialogOpen] = useState(false);
  const [editingCsf, setEditingCsf] = useState<CSF | null>(null);
  
  // KPI Dialog state
  const [kpiDialogOpen, setKpiDialogOpen] = useState(false);
  const [editingKpi, setEditingKpi] = useState<KPI | null>(null);
  const [editingKpiCsfId, setEditingKpiCsfId] = useState<string | null>(null);
  const [editingKpiCsfDbId, setEditingKpiCsfDbId] = useState<number | null>(null);

  // Department Assign Dialog state
  const [deptDialogOpen, setDeptDialogOpen] = useState(false);
  const [assigningCsf, setAssigningCsf] = useState<CSF | null>(null);

  // Calculate used weight for KPI validation
  const usedWeight = csfs.reduce((total, csf) => {
    return total + csf.kpis.reduce((sum, kpi) => sum + (kpi.weight || 0), 0);
  }, 0);

  // Store perspectives in a ref to avoid dependency issues
  const perspectivesRef = useRef(perspectives);
  useEffect(() => {
    perspectivesRef.current = perspectives;
  }, [perspectives]);

  // Load objectives from API when department changes
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [apiObjectives] = await Promise.all([
          objectivesAPI.getAll({ departmentId: selectedDepartment?.id }),
          fetchKpiLibrary(),
        ]);
        
        const mappedObjectives: Objective[] = apiObjectives.map((obj: APIObjective) => {
          const perspective = perspectivesRef.current.find(p => p.id === obj.perspectiveId);
          return {
            id: `obj-${obj.id}`,
            dbId: obj.id,
            name: obj.name,
            perspectiveName: perspective?.name || 'Tài chính',
            color: perspective?.color || '#64748b',
            year: obj.year,
            weight: Number(obj.weight) || 0,
          };
        });
        
        setObjectives(mappedObjectives);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedDepartment?.id, fetchKpiLibrary]);

  // Load CSFs when selecting an objective node
  const loadCsfs = useCallback(async (objectiveDbId: number) => {
    const fetchedCsfs = await fetchCSFs(objectiveDbId);
    
    const localCsfs: CSF[] = fetchedCsfs.map(csf => ({
      id: csf.id,
      dbId: csf.dbId,
      objectiveId: csf.objectiveId.toString(),
      name: csf.name,
      description: csf.description,
      kpis: csf.kpis.map(kpi => ({
        id: kpi.id,
        dbId: kpi.dbId,
        kpiLibId: kpi.kpiLibId,
        csfId: csf.id,
        name: kpi.name,
        unit: kpi.unit,
        weight: kpi.weight,
        target: kpi.target,
        targetMin: kpi.targetMin,
        targetThreshold: kpi.targetThreshold,
        targetGoal: kpi.targetGoal,
        targetMax: kpi.targetMax,
        description: kpi.description,
        departments: kpi.departments,
      })),
      departments: csf.departments?.map(d => ({
        id: d.id,
        name: d.name,
        code: d.code,
      })),
    }));
    
    setCsfs(localCsfs);
  }, [fetchCSFs]);

  // Handle tree node selection
  const handleSelectNode = async (node: TreeNode) => {
    setSelectedNode(node);
    
    if (node.type === 'objective' && node.dbId) {
      const objective = objectives.find(o => o.dbId === node.dbId);
      if (objective) {
        setCurrentObjective(objective);
        await loadCsfs(node.dbId);
      }
    }
  };

  // CSF handlers
  const handleAddCsf = () => {
    setEditingCsf(null);
    setCsfDialogOpen(true);
  };

  const handleEditCsf = (csf: CSF) => {
    setEditingCsf(csf);
    setCsfDialogOpen(true);
  };

  const handleDeleteCsf = async (csfId: string) => {
    const csf = csfs.find(c => c.id === csfId);
    if (csf?.dbId) {
      const success = await api.deleteCSF(csf.dbId);
      if (success) {
        setCsfs(csfs.filter(c => c.id !== csfId));
      }
    }
  };

  const handleSaveCsf = async (data: { name: string; description?: string }) => {
    if (!currentObjective) return;
    
    if (editingCsf && editingCsf.dbId) {
      const success = await api.updateCSF(editingCsf.dbId, data.name);
      if (success) {
        setCsfs(csfs.map(c => 
          c.id === editingCsf.id ? { ...c, name: data.name, description: data.description } : c
        ));
      }
    } else {
      const newCsf = await api.createCSF(currentObjective.dbId, data.name);
      if (newCsf) {
        setCsfs([...csfs, {
          id: newCsf.id,
          dbId: newCsf.dbId,
          objectiveId: newCsf.objectiveId.toString(),
          name: newCsf.name,
          description: data.description || '',
          kpis: [],
        }]);
      }
    }
    
    setCsfDialogOpen(false);
    setEditingCsf(null);
  };

  // KPI handlers
  const handleAddKpi = (csfId: string, csfDbId?: number) => {
    setEditingKpiCsfId(csfId);
    setEditingKpiCsfDbId(csfDbId || null);
    setEditingKpi(null);
    setKpiDialogOpen(true);
  };

  const handleEditKpi = (csf: CSF, kpi: KPI) => {
    setEditingKpiCsfId(csf.id);
    setEditingKpiCsfDbId(csf.dbId || null);
    setEditingKpi(kpi);
    setKpiDialogOpen(true);
  };

  const handleDeleteKpi = async (csf: CSF, kpiId: string) => {
    const allocId = getAllocationIdFromKpiId(kpiId);
    if (allocId) {
      const success = await api.removeKpiFromCSF(allocId);
      if (success) {
        const newKpis = csf.kpis.filter((k) => k.id !== kpiId);
        setCsfs(csfs.map(c => c.id === csf.id ? { ...c, kpis: newKpis } : c));
      }
    }
  };

  const handleSaveKpi = async (data: { 
    kpiLibId: number; 
    weight: number; 
    targets: { targetMin?: number; targetThreshold?: number; targetGoal: number; targetMax?: number };
    departmentIds?: string[];
  }) => {
    if (!editingKpiCsfDbId || !currentObjective) return;

    if (editingKpi && editingKpi.dbId) {
      const success = await api.updateKpiAllocation(editingKpi.dbId, {
        weight: data.weight,
        targetMin: data.targets.targetMin,
        targetThreshold: data.targets.targetThreshold,
        targetGoal: data.targets.targetGoal,
        targetMax: data.targets.targetMax,
      });

      if (success) {
        // Save departments if provided (not inheriting all)
        if (data.departmentIds !== undefined) {
          try {
            await kpiAllocationAPI.setDepartments(editingKpi.dbId, data.departmentIds);
          } catch (err) {
            console.error('Error saving KPI departments:', err);
          }
        }

        // Refetch to get updated data including departments
        if (currentObjective.dbId) {
          await loadCsfs(currentObjective.dbId);
        }
      }
    } else {
      const newKpi = await api.addKpiToCSF(
        editingKpiCsfDbId,
        data.kpiLibId,
        data.targets,
        currentObjective.year,
        data.weight
      );

      if (newKpi) {
        // Save departments for new KPI if provided
        if (data.departmentIds !== undefined && newKpi.dbId) {
          try {
            await kpiAllocationAPI.setDepartments(newKpi.dbId, data.departmentIds);
          } catch (err) {
            console.error('Error saving KPI departments:', err);
          }
        }

        // Refetch to get updated data including departments
        if (currentObjective.dbId) {
          await loadCsfs(currentObjective.dbId);
        }
      }
    }

    setKpiDialogOpen(false);
    setEditingKpi(null);
    setEditingKpiCsfId(null);
    setEditingKpiCsfDbId(null);
  };

  // Department Assignment handler
  const handleAssignDepartments = (csf: CSF) => {
    setAssigningCsf(csf);
    setDeptDialogOpen(true);
  };

  const handleDeptSaved = (newDepartments: Array<{ id: string; name: string; code: string | null }>) => {
    if (assigningCsf) {
      setCsfs(csfs.map(c => 
        c.id === assigningCsf.id ? { ...c, departments: newDepartments } : c
      ));
    }
    setDeptDialogOpen(false);
    setAssigningCsf(null);
  };

  // Stats for header
  const totalObjectives = objectives.length;
  const totalCSFs = selectedNode?.type === 'objective' ? csfs.length : 0;
  const totalKPIs = csfs.reduce((sum, c) => sum + c.kpis.length, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="p-4 rounded-full bg-gradient-to-br from-indigo-50 to-purple-100 dark:from-indigo-950/50 dark:to-purple-900/50">
            <RefreshCw className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
          </div>
          <p className="text-sm text-muted-foreground">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Department Filter Notice */}
      {!isCompanyView && selectedDepartment && (
        <Alert className="mb-4 border-blue-200 bg-blue-50/50 dark:bg-blue-950/30">
          <Building2 className="h-4 w-4 text-blue-600" />
          <AlertDescription className="flex items-center justify-between">
            <span className="text-blue-700 dark:text-blue-300">
              Đang xem CSF được gán cho <strong>{selectedDepartment.name}</strong>
            </span>
            <DepartmentSelector showLabel={false} />
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border">
          <div className="p-2 rounded-lg bg-slate-200 dark:bg-slate-700">
            <Layers className="h-4 w-4 text-slate-600 dark:text-slate-300" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Phương diện</p>
            <p className="text-lg font-bold">4</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 border border-blue-200 dark:border-blue-800">
          <div className="p-2 rounded-lg bg-blue-200 dark:bg-blue-800">
            <Target className="h-4 w-4 text-blue-600 dark:text-blue-300" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Mục tiêu</p>
            <p className="text-lg font-bold text-blue-700 dark:text-blue-400">{totalObjectives}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-emerald-900/30 border border-emerald-200 dark:border-emerald-800">
          <div className="p-2 rounded-lg bg-emerald-200 dark:bg-emerald-800">
            <FileText className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">CSF đang xem</p>
            <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{totalCSFs}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30 border border-purple-200 dark:border-purple-800">
          <div className="p-2 rounded-lg bg-purple-200 dark:bg-purple-800">
            <BarChart3 className="h-4 w-4 text-purple-600 dark:text-purple-300" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">KPI đang xem</p>
            <p className="text-lg font-bold text-purple-700 dark:text-purple-400">{totalKPIs}</p>
          </div>
        </div>
      </div>

      {/* Two-column layout: Tree + Detail */}
      <div className="flex gap-4 items-start">
        {/* Left: Tree Navigator */}
        <Card className="w-[400px] flex-shrink-0 shadow-lg border-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm">
          <CardHeader className="py-3 px-4 border-b bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold">Cấu trúc phân rã</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Perspective → Mục tiêu → CSF → KPI
                </p>
              </div>
              <Badge variant="outline" className="text-xs">
                {totalObjectives} mục tiêu
              </Badge>
            </div>
          </CardHeader>
          <div>
            <CSFTreeNavigator
              selectedNode={selectedNode}
              onSelectNode={handleSelectNode}
              departmentId={selectedDepartment?.id}
              year={new Date().getFullYear()}
            />
          </div>
        </Card>

        {/* Right: Detail Panel */}
        <Card className="flex-1 shadow-lg border-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm">
          <CSFDetailPanel
              selectedNode={selectedNode}
              csfs={csfs}
              onAddCSF={handleAddCsf}
              onEditCSF={handleEditCsf}
              onDeleteCSF={handleDeleteCsf}
              onAddKPI={handleAddKpi}
              onEditKPI={handleEditKpi}
              onDeleteKPI={handleDeleteKpi}
              onAssignDepartments={handleAssignDepartments}
            objectiveWeight={currentObjective?.weight}
          />
        </Card>
      </div>

      {/* Dialogs */}
      <CSFEditorDialog
        open={csfDialogOpen}
        onOpenChange={setCsfDialogOpen}
        csf={editingCsf}
        onSave={handleSaveCsf}
        mode={editingCsf ? 'edit' : 'create'}
      />

      <KPIEditorDialog
        open={kpiDialogOpen}
        onOpenChange={setKpiDialogOpen}
        kpi={editingKpi}
        kpiLibrary={api.kpiLibrary}
        onSave={handleSaveKpi}
        mode={editingKpi ? 'edit' : 'create'}
        objectiveWeight={currentObjective?.weight || 0}
        usedWeight={usedWeight}
        editingKpiWeight={(editingKpi as unknown as { weight?: number })?.weight || 0}
        csfId={editingKpiCsfDbId || undefined}
      />

      {assigningCsf && (
        <DepartmentAssignDialog
          open={deptDialogOpen}
          onOpenChange={setDeptDialogOpen}
          csfId={assigningCsf.dbId || 0}
          csfContent={assigningCsf.name}
          currentDepartments={assigningCsf.departments || []}
          onSave={handleDeptSaved}
        />
      )}
    </div>
  );
}
