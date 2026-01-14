'use client';

import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Target, Plus, RefreshCw, Building2 } from 'lucide-react';
import { CSFEditorDialog } from './CSFEditorDialog';
import { FishboneTable } from './FishboneTable';
import { KPIEditorDialog } from './KPIEditorDialog';
import type { KPI } from './KPIItem';
import type { CSF } from './CSFCard';
import { objectivesAPI, type Objective as APIObjective } from '@/lib/api';
import { useFishboneAPI, getAllocationIdFromKpiId } from '@/hooks/useFishboneAPI';
import { useDepartment } from '@/contexts';
import { DepartmentSelector } from '@/components/shared/DepartmentSelector';

export interface Objective {
  id: string;
  dbId: number;
  name: string;
  perspectiveName: string;
  color: string;
  year: number;
}

const PERSPECTIVES = [
  { id: 1, name: 'Tài chính', color: '#22c55e' },
  { id: 2, name: 'Khách hàng', color: '#3b82f6' },
  { id: 3, name: 'Quy trình nội bộ', color: '#f59e0b' },
  { id: 4, name: 'Học hỏi & Phát triển', color: '#8b5cf6' },
];



export function FishboneCanvas() {
  const api = useFishboneAPI();
  const { selectedDepartment, isCompanyView } = useDepartment();
  
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [selectedObjectiveId, setSelectedObjectiveId] = useState<string | null>(null);
  const [csfs, setCsfs] = useState<CSF[]>([]);
  const [loading, setLoading] = useState(true);
  
  // CSF Dialog state
  const [csfDialogOpen, setCsfDialogOpen] = useState(false);
  const [editingCsf, setEditingCsf] = useState<CSF | null>(null);
  
  // KPI Dialog state
  const [kpiDialogOpen, setKpiDialogOpen] = useState(false);
  const [editingKpi, setEditingKpi] = useState<KPI | null>(null);
  const [editingKpiCsfId, setEditingKpiCsfId] = useState<string | null>(null);
  const [editingKpiCsfDbId, setEditingKpiCsfDbId] = useState<number | null>(null);



  // Load objectives from API when department changes
  useEffect(() => {
    const loadObjectives = async () => {
      setLoading(true);
      try {
        // Filter objectives bằng departmentId nếu đang xem phòng ban cụ thể
        const [apiObjectives] = await Promise.all([
          objectivesAPI.getAll({ departmentId: selectedDepartment?.id }),
          api.fetchKpiLibrary(),
        ]);
        
        const mappedObjectives: Objective[] = apiObjectives.map((obj: APIObjective) => {
          const perspective = PERSPECTIVES.find(p => p.id === obj.perspectiveId);
          return {
            id: `obj-${obj.id}`,
            dbId: obj.id,
            name: obj.name,
            perspectiveName: perspective?.name || 'Tài chính',
            color: perspective?.color || '#64748b',
            year: obj.year,
          };
        });
        
        setObjectives(mappedObjectives);
        
        // Clear selected objective if no longer in filtered list
        setSelectedObjectiveId(prev => {
          if (prev && !mappedObjectives.find(o => o.id === prev)) {
            setCsfs([]);
            return null;
          }
          return prev;
        });
      } catch (error) {
        console.error('Error loading objectives:', error);
      } finally {
        setLoading(false);
      }
    };

    loadObjectives();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDepartment?.id]);

  const selectedObjective = objectives.find((o) => o.id === selectedObjectiveId);

  // Load CSFs when objective is selected
  const loadCsfs = useCallback(async (objectiveDbId: number) => {
    const fetchedCsfs = await api.fetchCSFs(objectiveDbId);
    
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
        target: kpi.target,
        description: kpi.description,
      })),
      departments: csf.departments?.map(d => ({
        id: d.id,
        name: d.name,
        code: d.code,
      })),
    }));
    
    setCsfs(localCsfs);
  }, [api]);

  // Handle objective selection
  const handleObjectiveChange = async (objectiveId: string) => {
    setSelectedObjectiveId(objectiveId);
    const objective = objectives.find(o => o.id === objectiveId);
    if (objective) {
      await loadCsfs(objective.dbId);
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

  const handleSaveCsf = async (data: { name: string; description?: string }) => {
    if (!selectedObjective) return;

    if (editingCsf && editingCsf.dbId) {
      const success = await api.updateCSF(editingCsf.dbId, data.name);
      if (success) {
        setCsfs(csfs.map(c => 
          c.id === editingCsf.id 
            ? { ...c, name: data.name, description: data.description } 
            : c
        ));
      }
    } else {
      const newCsf = await api.createCSF(selectedObjective.dbId, data.name);
      if (newCsf) {
        setCsfs([...csfs, {
          id: newCsf.id,
          dbId: newCsf.dbId,
          objectiveId: newCsf.objectiveId.toString(),
          name: newCsf.name,
          description: data.description,
          kpis: [],
        }]);
      }
    }

    setCsfDialogOpen(false);
    setEditingCsf(null);
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

  // KPI handlers - via API
  const handleAddKpi = (csfId: string, csfDbId?: number) => {
    setEditingKpiCsfId(csfId);
    setEditingKpiCsfDbId(csfDbId || null);
    setEditingKpi(null);
    setKpiDialogOpen(true);
  };

  const handleTableAddKpi = (csfId: string) => {
    const csf = csfs.find(c => c.id === csfId);
    handleAddKpi(csfId, csf?.dbId);
  };

  const handleTableEditKpi = (csf: CSF, kpi: KPI) => {
    console.log('handleTableEditKpi called:', { csf, kpi });
    setEditingKpiCsfId(csf.id);
    setEditingKpiCsfDbId(csf.dbId || null);
    setEditingKpi(kpi);
    setKpiDialogOpen(true);
  };

  const handleTableDeleteKpi = async (csf: CSF, kpiId: string) => {
    const allocId = getAllocationIdFromKpiId(kpiId);
    if (allocId) {
      const success = await api.removeKpiFromCSF(allocId);
      if (success) {
        const newKpis = csf.kpis.filter((k) => k.id !== kpiId);
        setCsfs(csfs.map(c => c.id === csf.id ? { ...c, kpis: newKpis } : c));
      }
    }
  };

  const handleSaveKpi = async (data: { kpiLibId: number; targets: { targetMin?: number; targetThreshold?: number; targetGoal: number; targetMax?: number } }) => {
    if (!editingKpiCsfDbId || !selectedObjective) return;

    if (editingKpi) {
      // Edit mode - for now just update locally (would need update endpoint)
      const kpiLib = api.kpiLibrary.find(k => k.id === data.kpiLibId);
      setCsfs(csfs.map(csf => {
        if (csf.id === editingKpiCsfId) {
          return {
            ...csf,
            kpis: csf.kpis.map(k => 
              k.id === editingKpi.id 
                ? { 
                    ...k, 
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
    } else {
      // Create new via API
      const newKpi = await api.addKpiToCSF(
        editingKpiCsfDbId,
        data.kpiLibId,
        data.targets,
        selectedObjective.year
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
    <div className="space-y-6">
      {/* Department Filter Notice */}
      {!isCompanyView && selectedDepartment && (
        <Alert>
          <Building2 className="h-4 w-4" />
          <AlertDescription>
            Đang xem CSF được gán cho <strong>{selectedDepartment.name}</strong>. Chọn &ldquo;Toàn công ty&rdquo; để xem tất cả.
          </AlertDescription>
        </Alert>
      )}

      {/* Objective Selector */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="h-5 w-5 text-primary" />
            Chọn mục tiêu để phân rã
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedObjectiveId || ''} onValueChange={handleObjectiveChange}>
            <SelectTrigger className="w-full max-w-lg">
              <SelectValue placeholder="Chọn một mục tiêu từ Bản đồ chiến lược..." />
            </SelectTrigger>
            <SelectContent>
              {objectives.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground text-center">
                  Chưa có mục tiêu nào. Hãy tạo mục tiêu trong Strategy Map trước.
                </div>
              ) : (
                objectives.map((obj) => (
                  <SelectItem key={obj.id} value={obj.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: obj.color }}
                      />
                      <span>{obj.name}</span>
                      <Badge variant="outline" className="ml-2 text-xs">
                        {obj.perspectiveName}
                      </Badge>
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Fishbone Content */}
      {selectedObjective && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: selectedObjective.color }}
                />
                <div>
                  <CardTitle className="text-lg">{selectedObjective.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {selectedObjective.perspectiveName} • {csfs.length} CSF •{' '}
                    {csfs.reduce((acc, c) => acc + c.kpis.length, 0)} KPI
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <DepartmentSelector showLabel={false} />
                
                <Button onClick={handleAddCsf} size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Thêm CSF
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <FishboneTable
              csfs={csfs}
              objectiveColor={selectedObjective.color}
              onEditCsf={handleEditCsf}
              onDeleteCsf={handleDeleteCsf}
              onAddKpi={handleTableAddKpi}
              onEditKpi={handleTableEditKpi}
              onDeleteKpi={handleTableDeleteKpi}
            />
          </CardContent>
        </Card>
      )}

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
      />

    </div>
  );
}
