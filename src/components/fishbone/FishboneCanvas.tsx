'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, Building2 } from 'lucide-react';
import { CSFEditorDialog } from './CSFEditorDialog';
import { KPIEditorDialog } from './KPIEditorDialog';
import { CSFTreeNavigator, type TreeNode } from './CSFTreeNavigator';
import { CSFDetailPanel } from './CSFDetailPanel';
import type { KPI } from './KPIItem';
import type { CSF } from './CSFCard';
import { objectivesAPI, type Objective as APIObjective } from '@/lib/api';
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
    
    // If selecting an objective, load its CSFs
    if (node.type === 'objective' && node.dbId) {
      const objective = objectives.find(o => o.dbId === node.dbId);
      if (objective) {
        setCurrentObjective(objective);
        await loadCsfs(node.dbId);
      }
    }
    // If selecting a CSF or KPI, load parent objective's CSFs
    else if ((node.type === 'csf' || node.type === 'kpi') && node.parentId) {
      // Find parent objective
      const parentId = node.type === 'kpi' ? 
        node.parentId.replace('csf-', '') : node.parentId;
      
      // Try to find objective in current state or refetch
      // For now, keep current csfs if same objective
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
      // Update existing
      const success = await api.updateCSF(editingCsf.dbId, data.name);
      if (success) {
        setCsfs(csfs.map(c => 
          c.id === editingCsf.id ? { ...c, name: data.name, description: data.description } : c
        ));
      }
    } else {
      // Create new
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

  const handleSaveKpi = async (data: { kpiLibId: number; weight: number; targets: { targetMin?: number; targetThreshold?: number; targetGoal: number; targetMax?: number } }) => {
    if (!editingKpiCsfDbId || !currentObjective) return;

    if (editingKpi && editingKpi.dbId) {
      // Edit mode - call API to update
      const success = await api.updateKpiAllocation(editingKpi.dbId, {
        weight: data.weight,
        targetMin: data.targets.targetMin,
        targetThreshold: data.targets.targetThreshold,
        targetGoal: data.targets.targetGoal,
        targetMax: data.targets.targetMax,
      });

      if (success) {
        const kpiLib = api.kpiLibrary.find(k => k.id === data.kpiLibId);
        setCsfs(csfs.map(csf => {
          if (csf.id === editingKpiCsfId) {
            return {
              ...csf,
              kpis: csf.kpis.map(k => 
                k.id === editingKpi.id 
                  ? { 
                      ...k, 
                      weight: data.weight,
                      target: data.targets.targetGoal,
                      targetMin: data.targets.targetMin,
                      targetThreshold: data.targets.targetThreshold,
                      targetGoal: data.targets.targetGoal,
                      targetMax: data.targets.targetMax,
                      name: kpiLib?.name || k.name 
                    }
                  : k
              ),
            };
          }
          return csf;
        }));
      }
    } else {
      // Create new via API
      const newKpi = await api.addKpiToCSF(
        editingKpiCsfDbId,
        data.kpiLibId,
        data.targets,
        currentObjective.year,
        data.weight
      );

      if (newKpi) {
        setCsfs(csfs.map(csf => {
          if (csf.id === editingKpiCsfId) {
            return { ...csf, kpis: [...csf.kpis, { ...newKpi, csfId: csf.id }] };
          }
          return csf;
        }));
      }
    }

    setKpiDialogOpen(false);
    setEditingKpi(null);
    setEditingKpiCsfId(null);
    setEditingKpiCsfDbId(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2 text-muted-foreground">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>Đang tải dữ liệu từ server...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-180px)]">
      {/* Department Filter Notice */}
      {!isCompanyView && selectedDepartment && (
        <Alert className="mb-4">
          <Building2 className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              Đang xem CSF được gán cho <strong>{selectedDepartment.name}</strong>
            </span>
            <DepartmentSelector showLabel={false} />
          </AlertDescription>
        </Alert>
      )}

      {/* Two-column layout: Tree + Detail */}
      <div className="flex gap-4 h-full">
        {/* Left: Tree Navigator */}
        <Card className="w-[380px] flex-shrink-0 overflow-hidden">
          <div className="p-3 border-b bg-muted/30">
            <h3 className="font-semibold text-sm">Cấu trúc phân rã</h3>
            <p className="text-xs text-muted-foreground">
              Perspective → Mục tiêu → CSF → KPI
            </p>
          </div>
          <div className="h-[calc(100%-60px)] overflow-auto">
            <CSFTreeNavigator
              selectedNode={selectedNode}
              onSelectNode={handleSelectNode}
              departmentId={selectedDepartment?.id}
              year={new Date().getFullYear()}
            />
          </div>
        </Card>

        {/* Right: Detail Panel */}
        <Card className="flex-1 overflow-hidden">
          <div className="h-full overflow-auto">
            <CSFDetailPanel
              selectedNode={selectedNode}
              csfs={csfs}
              onAddCSF={handleAddCsf}
              onEditCSF={handleEditCsf}
              onDeleteCSF={handleDeleteCsf}
              onAddKPI={handleAddKpi}
              onEditKPI={handleEditKpi}
              onDeleteKPI={handleDeleteKpi}
              objectiveWeight={currentObjective?.weight}
            />
          </div>
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
      />
    </div>
  );
}
