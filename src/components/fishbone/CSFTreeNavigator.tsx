'use client';

import { useState, useEffect } from 'react';
import { 
  ChevronRight, 
  ChevronDown, 
  Target, 
  FileText, 
  BarChart3, 
  TrendingUp,
  Users,
  Settings,
  GraduationCap,
  FolderTree
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { perspectivesAPI, objectivesAPI, csfAPI } from '@/lib/api';

// Perspective colors
const PERSPECTIVE_COLORS: Record<string, string> = {
  'Tài chính': '#f59e0b',
  'Khách hàng': '#3b82f6',
  'Quy trình nội bộ': '#10b981',
  'Học hỏi & Phát triển': '#8b5cf6',
};

// Map perspective names to Lucide icons
const getPerspectiveIcon = (name: string, color: string) => {
  const iconClass = "h-4 w-4 flex-shrink-0";
  switch (name) {
    case 'Tài chính':
      return <TrendingUp className={iconClass} style={{ color }} />;
    case 'Khách hàng':
      return <Users className={iconClass} style={{ color }} />;
    case 'Quy trình nội bộ':
      return <Settings className={iconClass} style={{ color }} />;
    case 'Học hỏi & Phát triển':
      return <GraduationCap className={iconClass} style={{ color }} />;
    default:
      return <FolderTree className={iconClass} style={{ color }} />;
  }
};

export type TreeNodeType = 'perspective' | 'objective' | 'csf' | 'kpi';

export interface TreeNode {
  id: string;
  dbId?: number;
  type: TreeNodeType;
  name: string;
  weight?: number;
  color?: string;
  children?: TreeNode[];
  parentId?: string;
  kpiCount?: number;
  csfCount?: number;
  // For KPI nodes
  unit?: string;
  target?: number;
}

interface CSFTreeNavigatorProps {
  selectedNode: TreeNode | null;
  onSelectNode: (node: TreeNode) => void;
  departmentId?: string;
  year?: number;
}

export function CSFTreeNavigator({
  selectedNode,
  onSelectNode,
  departmentId,
  year = new Date().getFullYear(),
}: CSFTreeNavigatorProps) {
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // Fetch tree data
  useEffect(() => {
    const fetchTreeData = async () => {
      setLoading(true);
      try {
        // Fetch perspectives and objectives
        const [perspectives, objectives] = await Promise.all([
          perspectivesAPI.getAll(),
          objectivesAPI.getAll({ year, departmentId }),
        ]);

        // Build tree structure
        const tree: TreeNode[] = perspectives.map(p => {
          const perspectiveObjectives = objectives.filter(o => o.perspectiveId === p.id);
          const color = PERSPECTIVE_COLORS[p.name] || '#6b7280';

          return {
            id: `perspective-${p.id}`,
            dbId: p.id,
            type: 'perspective' as TreeNodeType,
            name: p.name,
            weight: p.weightDefault ? Number(p.weightDefault) : undefined,
            color,
            children: perspectiveObjectives.map(o => ({
              id: `objective-${o.id}`,
              dbId: o.id,
              type: 'objective' as TreeNodeType,
              name: o.name,
              weight: o.weight ? Number(o.weight) : undefined,
              color,
              parentId: `perspective-${p.id}`,
              csfCount: o.csfs?.length || 0,
              children: [], // CSFs loaded on expand
            })),
          };
        });

        setTreeData(tree);
        
        // Auto-expand perspectives
        setExpandedNodes(new Set(tree.map(p => p.id)));
      } catch (error) {
        console.error('Error fetching tree data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTreeData();
  }, [year, departmentId]);

  // Load CSFs when objective is expanded
  const loadCSFsForObjective = async (objectiveNode: TreeNode) => {
    if (!objectiveNode.dbId) return;

    try {
      const csfs = await csfAPI.getAll(objectiveNode.dbId);

      // Update tree with CSFs
      setTreeData(prev => {
        const updateChildren = (nodes: TreeNode[]): TreeNode[] => {
          return nodes.map(node => {
            if (node.id === objectiveNode.id) {
              return {
                ...node,
                csfCount: csfs.length,
                children: csfs.map((csf: any) => ({
                  id: `csf-${csf.id}`,
                  dbId: csf.id,
                  type: 'csf' as TreeNodeType,
                  name: csf.content,
                  parentId: objectiveNode.id,
                  color: objectiveNode.color,
                  kpiCount: csf.kpiAllocations?.length || 0,
                  children: (csf.kpiAllocations || []).map((kpi: any) => ({
                    id: `kpi-${kpi.id}`,
                    dbId: kpi.id,
                    type: 'kpi' as TreeNodeType,
                    name: kpi.kpiLib?.name || 'KPI',
                    parentId: `csf-${csf.id}`,
                    color: objectiveNode.color,
                    unit: kpi.kpiLib?.unit,
                    target: kpi.targetGoal ? Number(kpi.targetGoal) : undefined,
                    weight: kpi.weight ? Number(kpi.weight) : undefined,
                  })),
                })),
              };
            }
            if (node.children) {
              return { ...node, children: updateChildren(node.children) };
            }
            return node;
          });
        };
        return updateChildren(prev);
      });
    } catch (error) {
      console.error('Error loading CSFs:', error);
    }
  };

  const toggleExpand = async (node: TreeNode) => {
    const newExpanded = new Set(expandedNodes);
    
    if (newExpanded.has(node.id)) {
      newExpanded.delete(node.id);
    } else {
      newExpanded.add(node.id);
      
      // Load CSFs if expanding objective
      if (node.type === 'objective' && (!node.children || node.children.length === 0)) {
        await loadCSFsForObjective(node);
      }
    }
    
    setExpandedNodes(newExpanded);
  };

  const renderNode = (node: TreeNode, depth: number = 0, isLast: boolean = false, parentLines: boolean[] = []) => {
    const isExpanded = expandedNodes.has(node.id);
    const isSelected = selectedNode?.id === node.id;
    const hasChildren = node.children && node.children.length > 0;
    const canExpand = node.type !== 'kpi' && (hasChildren || node.type === 'objective');

    const getIcon = () => {
      const iconClass = "h-4 w-4 flex-shrink-0";
      switch (node.type) {
        case 'perspective':
          return getPerspectiveIcon(node.name, node.color || '#6b7280');
        case 'objective':
          return <Target className={iconClass} style={{ color: node.color }} />;
        case 'csf':
          return <FileText className={iconClass} style={{ color: node.color }} />;
        case 'kpi':
          return <BarChart3 className={iconClass} style={{ color: node.color }} />;
      }
    };

    // Calculate indentation (for tree lines)
    const indentWidth = 20; // px per level

    return (
      <div key={node.id} className="relative">
        {/* Tree connecting lines */}
        {depth > 0 && (
          <>
            {/* Vertical lines from parent levels */}
            {parentLines.map((showLine, index) => (
              showLine && (
                <div
                  key={`vline-${index}`}
                  className="absolute border-l border-muted-foreground/30"
                  style={{
                    left: `${(index + 1) * indentWidth + 2}px`,
                    top: 0,
                    bottom: 0,
                  }}
                />
              )
            ))}
            {/* Horizontal line to this node */}
            <div
              className="absolute border-t border-muted-foreground/30"
              style={{
                left: `${depth * indentWidth + 2}px`,
                top: '18px',
                width: `${indentWidth - 6}px`,
              }}
            />
            {/* Vertical line segment for this level */}
            <div
              className="absolute border-l border-muted-foreground/30"
              style={{
                left: `${depth * indentWidth + 2}px`,
                top: 0,
                height: isLast ? '18px' : '100%',
              }}
            />
          </>
        )}

        <div
          className={cn(
            'flex items-center gap-2 py-2 px-3 rounded-lg cursor-pointer transition-all duration-150',
            'hover:bg-muted/60',
            isSelected && 'bg-primary/10 ring-1 ring-primary/40 shadow-sm'
          )}
          style={{ 
            marginLeft: `${depth * indentWidth}px`,
            marginRight: '8px',
          }}
          onClick={() => onSelectNode(node)}
        >
          {/* Expand/collapse button */}
          {canExpand ? (
            <button
              className="p-0.5 hover:bg-muted rounded-md transition-colors flex-shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(node);
              }}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          ) : (
            <div className="w-5 flex-shrink-0" />
          )}

          {/* Icon */}
          {getIcon()}

          {/* Name */}
          <span className={cn(
            'flex-1 text-sm truncate leading-tight',
            node.type === 'perspective' && 'font-semibold text-foreground',
            node.type === 'objective' && 'font-medium text-foreground/90',
            node.type === 'csf' && 'text-foreground/80',
            node.type === 'kpi' && 'text-muted-foreground'
          )}>
            {node.name}
          </span>

          {/* Badges */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {node.weight !== undefined && node.weight > 0 && (
              <Badge 
                variant="outline" 
                className="text-[10px] h-5 px-1.5 font-medium"
                style={{ 
                  borderColor: node.color,
                  color: node.color,
                  backgroundColor: `${node.color}15`
                }}
              >
                {node.weight}%
              </Badge>
            )}

            {node.type === 'objective' && node.csfCount !== undefined && (
              <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-medium">
                {node.csfCount} CSF
              </Badge>
            )}

            {node.type === 'csf' && node.kpiCount !== undefined && (
              <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-medium">
                {node.kpiCount} KPI
              </Badge>
            )}
          </div>
        </div>

        {/* Children with tree lines */}
        {isExpanded && hasChildren && (
          <div className="relative">
            {node.children!.map((child, index) => {
              const isLastChild = index === node.children!.length - 1;
              // Track which parent levels need vertical lines
              const newParentLines = depth === 0 ? [] : [...parentLines, !isLast];
              return renderNode(child, depth + 1, isLastChild, newParentLines);
            })}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-4 space-y-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-4 w-4 bg-muted/50 rounded animate-pulse" />
            <div className="h-6 flex-1 bg-muted/50 rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="py-3 px-2">
      {treeData.map((node, index) => renderNode(node, 0, index === treeData.length - 1, []))}
    </div>
  );
}
