'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ReactFlow,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  applyNodeChanges,
  BackgroundVariant,
  MarkerType,
  type Node,
  type Edge,
  type Connection,
  type NodeTypes,
  type NodeMouseHandler,
  type NodeChange,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ObjectiveNode } from './ObjectiveNode';
import { LaneNode } from './LaneNode';
import { ObjectiveEditorDialog, type ObjectiveData } from './ObjectiveEditorDialog';
import { ThemeManagementDialog } from './ThemeManagementDialog';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Save, RotateCcw, RefreshCw, Layers } from 'lucide-react';
import { useStrategyMapAPI, getDbIdFromNodeId } from '@/hooks/useStrategyMapAPI';
import { useDepartment, usePerspectives } from '@/contexts';

const LANE_HEIGHT = 160;
const LANE_WIDTH = 1200;
const LABEL_WIDTH = 180;

// Tạo lane nodes (parent nodes)
function createLaneNodes(perspectives: { id: string; sortOrder: number; name: string; nameEn: string; color: string }[]): Node[] {
  return perspectives.map((p, index) => ({
    id: p.id,
    type: 'lane',
    position: { x: 0, y: index * LANE_HEIGHT },
    data: {
      label: p.name,
      labelEn: p.nameEn,
      color: p.color,
      sortOrder: p.sortOrder,
    },
    style: { width: LANE_WIDTH, height: LANE_HEIGHT },
    draggable: false,
    selectable: false,
  }));
}

// Validation rules for arrows
function validateConnection(
  nodes: Node[],
  connection: Connection,
): { valid: boolean; error?: string } {
  const fromNode = nodes.find((n) => n.id === connection.source);
  const toNode = nodes.find((n) => n.id === connection.target);

  if (!fromNode || !toNode) {
    return { valid: false, error: 'Node not found' };
  }

  const fromLane = nodes.find((n) => n.id === fromNode.parentId);
  const toLane = nodes.find((n) => n.id === toNode.parentId);

  if (!fromLane || !toLane) {
    return { valid: false, error: 'Lane not found' };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fromSortOrder = (fromLane.data as any).sortOrder as number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const toSortOrder = (toLane.data as any).sortOrder as number;

  // Rule 03: No Horizontal
  if (fromSortOrder === toSortOrder) {
    return { valid: false, error: 'Không được vẽ mũi tên giữa các mục tiêu cùng phương diện' };
  }

  // Rule 04: No Top-down
  if (fromSortOrder < toSortOrder) {
    return { valid: false, error: 'Mũi tên phải đi từ dưới lên trên' };
  }

  // Rule 01: Max 2 levels
  const levelDiff = fromSortOrder - toSortOrder;
  if (levelDiff > 2) {
    return { valid: false, error: 'Mũi tên chỉ được vượt tối đa 2 bậc phương diện' };
  }

  return { valid: true };
}

export interface StrategyMapCanvasProps {
  year: number;
}

export function StrategyMapCanvas({ year }: StrategyMapCanvasProps) {
  const api = useStrategyMapAPI();
  const { selectedDepartment } = useDepartment();
  const { perspectives } = usePerspectives();
  
  // Map perspectives to lane format with lane-X ids
  const lanePerspectives = useMemo(() => 
    perspectives.map(p => ({
      id: `lane-${p.sortOrder}`,
      sortOrder: p.sortOrder,
      name: p.name,
      nameEn: p.nameEn,
      color: p.color,
    })), [perspectives]
  );
  
  const initialNodes = useMemo(() => createLaneNodes(lanePerspectives), [lanePerspectives]);
  const [nodes, setNodes] = useNodesState<Node>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [themeDialogOpen, setThemeDialogOpen] = useState(false);

  // Load data from API on mount and when department changes
  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      setIsLoading(true);
      const { nodes: apiNodes, edges: apiEdges } = await api.fetchObjectives(year, selectedDepartment?.id);
      
      if (isMounted) {
        // Merge lane nodes with objective nodes from API
        setNodes([...createLaneNodes(lanePerspectives), ...apiNodes]);
        setEdges(apiEdges);
        setIsLoading(false);
      }
    };

    loadData();
    
    return () => {
      isMounted = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, selectedDepartment?.id]);

  // Custom onNodesChange: lock Y position for objectives
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const constrainedChanges = changes.map((change) => {
        if (change.type === 'position' && change.position && change.id.startsWith('obj-')) {
          const node = nodes.find((n) => n.id === change.id);
          if (node) {
            return {
              ...change,
              position: { x: change.position.x, y: node.position.y },
            };
          }
        }
        return change;
      });

      setNodes((nds) => applyNodeChanges(constrainedChanges, nds));
    },
    [nodes, setNodes]
  );

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [selectedObjective, setSelectedObjective] = useState<ObjectiveData | null>(null);
  const [pendingLaneId, setPendingLaneId] = useState<string | null>(null);

  const nodeTypes: NodeTypes = useMemo(
    () => ({ lane: LaneNode, objective: ObjectiveNode }),
    []
  );

  // Handle new connection with validation + API
  const onConnect = useCallback(
    async (connection: Connection) => {
      const validation = validateConnection(nodes, connection);

      if (!validation.valid) {
        toast.error(validation.error);
        return;
      }

      // Get DB IDs from node IDs
      const fromDbId = getDbIdFromNodeId(connection.source!);
      const toDbId = getDbIdFromNodeId(connection.target!);

      if (!fromDbId || !toDbId) {
        toast.error('Không thể xác định mục tiêu');
        return;
      }

      // Create link via API
      const success = await api.createLink(fromDbId, toDbId);
      if (success) {
        setEdges((eds) =>
          addEdge(
            {
              ...connection,
              type: 'smoothstep',
              animated: false,
              style: { stroke: '#94a3b8', strokeWidth: 1.5 },
              markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' },
            },
            eds
          )
        );
      }
    },
    [nodes, setEdges, api]
  );

  // Handle edge deletion via keyboard (Delete/Backspace)
  const onEdgesDelete = useCallback(
    async (deletedEdges: Edge[]) => {
      for (const edge of deletedEdges) {
        // Get DB ID from edge data or edge id
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const dbId = (edge.data as any)?.dbId || parseInt(edge.id.replace('edge-', ''));
        if (dbId) {
          const success = await api.deleteLink(dbId);
          if (success) {
            toast.success('Đã xóa liên kết');
          }
        }
      }
    },
    [api]
  );

  // Open dialog to add new objective
  const openAddDialog = useCallback((laneId: string) => {
    const perspective = lanePerspectives.find((p) => p.id === laneId);
    if (!perspective) return;

    setPendingLaneId(laneId);
    setSelectedObjective({
      id: '',
      name: '',
      perspectiveId: perspective.sortOrder,
      perspectiveName: perspective.name,
      color: perspective.color,
    });
    setDialogMode('create');
    setDialogOpen(true);
  }, [lanePerspectives]);

  // Listen for add-objective events from LaneNode buttons
  useEffect(() => {
    const handleAddObjective = (event: Event) => {
      const customEvent = event as CustomEvent<{ laneId: string }>;
      openAddDialog(customEvent.detail.laneId);
    };

    window.addEventListener('add-objective', handleAddObjective);
    return () => window.removeEventListener('add-objective', handleAddObjective);
  }, [openAddDialog]);

  // Handle node double-click to edit
  const onNodeDoubleClick: NodeMouseHandler = useCallback(
    (event, node) => {
      if (node.type !== 'objective') return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const nodeData = node.data as any;
      const lane = lanePerspectives.find((p) => p.id === node.parentId);

      setSelectedObjective({
        id: node.id,
        name: nodeData.label || '',
        code: nodeData.code,
        weight: nodeData.weight,
        description: nodeData.description,
        perspectiveId: lane?.sortOrder || 1,
        perspectiveName: lane?.name || '',
        color: lane?.color || '#64748b',
        dbId: nodeData.dbId, // Store DB ID for API
      });
      setDialogMode('edit');
      setDialogOpen(true);
    },
    [lanePerspectives]
  );

  // Save objective (create or update) via API
  const handleSaveObjective = useCallback(
    async (data: { name: string; code?: string; weight?: number; description?: string; themeId?: number | null }) => {
      if (dialogMode === 'create' && pendingLaneId !== null) {
        const perspective = lanePerspectives.find((p) => p.id === pendingLaneId);
        if (!perspective) return;

        const existingInLane = nodes.filter((n) => n.parentId === pendingLaneId);
        const positionX = LABEL_WIDTH + 20 + existingInLane.length * 180;

        const newNode = await api.createObjective(
          {
            perspectiveId: perspective.sortOrder,
            departmentId: selectedDepartment?.id || '',
            name: data.name,
            code: data.code,
            description: data.description,
            weight: data.weight,
            themeId: data.themeId ?? undefined,
            year,
          },
          pendingLaneId,
          positionX
        );

        if (newNode) {
          setNodes((nds) => [...nds, newNode]);
        }
      } else if (dialogMode === 'edit' && selectedObjective) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const dbId = (selectedObjective as any).dbId || getDbIdFromNodeId(selectedObjective.id);
        if (dbId) {
          const success = await api.updateObjective(dbId, {
            name: data.name,
            code: data.code,
            weight: data.weight,
            description: data.description,
            themeId: data.themeId ?? undefined,
          });

          if (success) {
            setNodes((nds) =>
              nds.map((node) => {
                if (node.id === selectedObjective.id) {
                  return {
                    ...node,
                    data: { ...node.data, label: data.name, code: data.code, weight: data.weight, description: data.description },
                  };
                }
                return node;
              })
            );
          }
        }
      }

      setPendingLaneId(null);
      setSelectedObjective(null);
    },
    [dialogMode, pendingLaneId, selectedObjective, nodes, setNodes, year, api, selectedDepartment?.id, lanePerspectives]
  );

  // Delete objective via API
  const handleDeleteObjective = useCallback(async () => {
    if (!selectedObjective) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dbId = (selectedObjective as any).dbId || getDbIdFromNodeId(selectedObjective.id);
    if (dbId) {
      const success = await api.deleteObjective(dbId);
      if (success) {
        setNodes((nds) => nds.filter((n) => n.id !== selectedObjective.id));
        setEdges((eds) =>
          eds.filter((e) => e.source !== selectedObjective.id && e.target !== selectedObjective.id)
        );
      }
    }
    setSelectedObjective(null);
  }, [selectedObjective, setNodes, setEdges, api]);

  // Refresh data from API
  const handleRefresh = useCallback(async () => {
    setIsLoading(true);
    const { nodes: apiNodes, edges: apiEdges } = await api.fetchObjectives(year);
    setNodes([...createLaneNodes(lanePerspectives), ...apiNodes]);
    setEdges(apiEdges);
    setIsLoading(false);
    toast.success('Đã làm mới dữ liệu');
  }, [year, api, setNodes, setEdges, lanePerspectives]);

  // Save positions to API (when dragging)
  const handleSavePositions = useCallback(async () => {
    const objectiveNodes = nodes.filter((n) => n.type === 'objective');
    
    for (const node of objectiveNodes) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dbId = (node.data as any).dbId;
      if (dbId) {
        await api.updateObjective(dbId, {
          positionX: node.position.x,
          positionY: node.position.y,
        });
      }
    }
    toast.success('Đã lưu vị trí các mục tiêu');
  }, [nodes, api]);

  // Reset map
  const handleReset = useCallback(async () => {
    if (confirm('Bạn có chắc muốn xóa toàn bộ bản đồ chiến lược?')) {
      const objectiveNodes = nodes.filter((n) => n.type === 'objective');
      
      for (const node of objectiveNodes) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const dbId = (node.data as any).dbId;
        if (dbId) await api.deleteObjective(dbId);
      }
      
      setNodes(createLaneNodes(lanePerspectives));
      setEdges([]);
      toast.success('Đã xóa bản đồ chiến lược');
    }
  }, [nodes, setNodes, setEdges, api, lanePerspectives]);

  // Rule 02: Connectivity check - mỗi mục tiêu cần có đường vào/ra (trừ Financial là top-level)
  const objectiveNodes = nodes.filter((n) => n.type === 'objective');
  const objectiveCount = objectiveNodes.length;
  const disconnectedObjectives = objectiveNodes.filter((node) => {
    const hasIncoming = edges.some((e) => e.target === node.id);
    const hasOutgoing = edges.some((e) => e.source === node.id);
    const isFinancialPerspective = node.parentId === 'lane-1';
    const isLearningPerspective = node.parentId === 'lane-4';
    // Financial (top) doesn't need outgoing, Learning (bottom) doesn't need incoming
    if (isFinancialPerspective) return !hasIncoming;
    if (isLearningPerspective) return !hasOutgoing;
    return !hasIncoming || !hasOutgoing;
  });

  if (isLoading) {
    return (
      <div className="h-[680px] w-full flex items-center justify-center bg-slate-50 rounded-lg border">
        <div className="flex items-center gap-2 text-muted-foreground">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>Đang tải bản đồ chiến lược...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Toolbar - outside ReactFlow */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Năm:</span>
            <span className="text-sm font-bold">{year}</span>
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>{objectiveCount} mục tiêu</span>
            <span>•</span>
            <span>{edges.length} liên kết</span>
            {disconnectedObjectives.length > 0 && (
              <>
                <span>•</span>
                <span className="text-amber-600 font-medium">
                  ⚠ {disconnectedObjectives.length} chưa kết nối
                </span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setThemeDialogOpen(true)}>
            <Layers className="h-4 w-4 mr-1.5" />
            Nhóm CL
          </Button>
          <Button size="sm" variant="default" onClick={handleSavePositions}>
            <Save className="h-4 w-4 mr-1.5" />
            Lưu
          </Button>
          <Button size="sm" variant="outline" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-1.5" />
            Refresh
          </Button>
          <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-1.5" />
            Xóa
          </Button>
        </div>
      </div>

      {/* ReactFlow Canvas - clean, no internal panels */}
      <div className="h-[680px] w-full relative bg-slate-50 rounded-lg border overflow-hidden">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onEdgesDelete={onEdgesDelete}
          onConnect={onConnect}
          onNodeDoubleClick={onNodeDoubleClick}
          nodeTypes={nodeTypes}
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
          minZoom={1}
          maxZoom={1}
          zoomOnScroll={false}
          zoomOnPinch={false}
          zoomOnDoubleClick={false}
          panOnScroll={false}
          panOnDrag={false}
          preventScrolling={false}
          snapToGrid
          snapGrid={[10, 10]}
          nodesDraggable={true}
          nodesConnectable={true}
          elementsSelectable={true}
          deleteKeyCode={['Backspace', 'Delete']}
          defaultEdgeOptions={{ type: 'smoothstep', animated: false }}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
        </ReactFlow>
      </div>

      <ObjectiveEditorDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        objective={selectedObjective}
        onSave={handleSaveObjective}
        onDelete={dialogMode === 'edit' ? handleDeleteObjective : undefined}
        mode={dialogMode}
      />



      {/* Theme Management Dialog */}
      <ThemeManagementDialog
        open={themeDialogOpen}
        onOpenChange={setThemeDialogOpen}
        year={year}
      />
    </>
  );
}
