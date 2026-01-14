'use client';

import React, { useState, useEffect } from 'react';
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
  FolderTree,
  Search,
  Loader2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { perspectivesAPI, objectivesAPI, csfAPI } from '@/lib/api';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Perspective colors with gradients
const PERSPECTIVE_STYLES: Record<string, { color: string; gradient: string; bg: string }> = {
  'Tài chính': { 
    color: '#f59e0b', 
    gradient: 'from-amber-400 to-orange-500',
    bg: 'bg-amber-50 dark:bg-amber-950/30'
  },
  'Khách hàng': { 
    color: '#3b82f6', 
    gradient: 'from-blue-400 to-indigo-500',
    bg: 'bg-blue-50 dark:bg-blue-950/30'
  },
  'Quy trình nội bộ': { 
    color: '#10b981', 
    gradient: 'from-emerald-400 to-teal-500',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30'
  },
  'Học hỏi & Phát triển': { 
    color: '#8b5cf6', 
    gradient: 'from-purple-400 to-violet-500',
    bg: 'bg-purple-50 dark:bg-purple-950/30'
  },
};

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
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingCSFs, setLoadingCSFs] = useState<Set<string>>(new Set());

  // Fetch tree data
  useEffect(() => {
    const fetchTreeData = async () => {
      setLoading(true);
      try {
        const [perspectives, objectives] = await Promise.all([
          perspectivesAPI.getAll(),
          objectivesAPI.getAll({ year, departmentId }),
        ]);

        const tree: TreeNode[] = perspectives.map(p => {
          const perspectiveObjectives = objectives.filter(o => o.perspectiveId === p.id);
          const style = PERSPECTIVE_STYLES[p.name] || { color: '#6b7280', gradient: 'from-gray-400 to-gray-500', bg: 'bg-gray-50' };

          return {
            id: `perspective-${p.id}`,
            dbId: p.id,
            type: 'perspective' as TreeNodeType,
            name: p.name,
            weight: p.weightDefault ? Number(p.weightDefault) : undefined,
            color: style.color,
            children: perspectiveObjectives.map(o => ({
              id: `objective-${o.id}`,
              dbId: o.id,
              type: 'objective' as TreeNodeType,
              name: o.name,
              weight: o.weight ? Number(o.weight) : undefined,
              color: style.color,
              parentId: `perspective-${p.id}`,
              csfCount: o.csfs?.length || 0,
              children: [],
            })),
          };
        });

        setTreeData(tree);
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

    setLoadingCSFs(prev => new Set(prev).add(objectiveNode.id));
    try {
      const csfs = await csfAPI.getAll(objectiveNode.dbId);

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
    } finally {
      setLoadingCSFs(prev => {
        const newSet = new Set(prev);
        newSet.delete(objectiveNode.id);
        return newSet;
      });
    }
  };

  const toggleExpand = async (node: TreeNode) => {
    const newExpanded = new Set(expandedNodes);
    
    if (newExpanded.has(node.id)) {
      newExpanded.delete(node.id);
    } else {
      newExpanded.add(node.id);
      
      if (node.type === 'objective' && (!node.children || node.children.length === 0)) {
        await loadCSFsForObjective(node);
      }
    }
    
    setExpandedNodes(newExpanded);
  };

  // Filter tree by search
  const filterTree = (nodes: TreeNode[], query: string): TreeNode[] => {
    if (!query) return nodes;
    
    return nodes.reduce<TreeNode[]>((acc, node) => {
      const matchesQuery = node.name.toLowerCase().includes(query.toLowerCase());
      const filteredChildren = node.children ? filterTree(node.children, query) : [];
      
      if (matchesQuery || filteredChildren.length > 0) {
        acc.push({
          ...node,
          children: filteredChildren.length > 0 ? filteredChildren : node.children,
        });
      }
      return acc;
    }, []);
  };

  const filteredTreeData = filterTree(treeData, searchQuery);

  const renderNode = (node: TreeNode, depth: number = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const isSelected = selectedNode?.id === node.id;
    const hasChildren = node.children && node.children.length > 0;
    const canExpand = node.type !== 'kpi' && (hasChildren || node.type === 'objective');
    const isLoadingCSF = loadingCSFs.has(node.id);
    const style = Object.values(PERSPECTIVE_STYLES).find(s => s.color === node.color);

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

    const getTypeLabel = () => {
      switch (node.type) {
        case 'perspective': return 'Phương diện';
        case 'objective': return 'Mục tiêu';
        case 'csf': return 'CSF';
        case 'kpi': return 'KPI';
      }
    };

    return (
      <TooltipProvider key={node.id}>
        <div className="relative">
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  'flex items-center gap-2 py-2.5 px-3 rounded-lg cursor-pointer transition-all duration-200',
                  'hover:bg-slate-100 dark:hover:bg-slate-800',
                  isSelected && 'bg-gradient-to-r ring-1 ring-offset-1',
                  isSelected && style?.bg,
                  isSelected && 'ring-slate-300 dark:ring-slate-600',
                  node.type === 'perspective' && 'mt-1 first:mt-0'
                )}
                style={{ 
                  marginLeft: `${depth * 16}px`,
                }}
                onClick={() => onSelectNode(node)}
              >
                {/* Expand/collapse button */}
                {canExpand ? (
                  <button
                    className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpand(node);
                    }}
                  >
                    {isLoadingCSF ? (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                ) : (
                  <div className="w-6 flex-shrink-0" />
                )}

                {/* Icon with colored background for perspectives */}
                {node.type === 'perspective' ? (
                  <div 
                    className={cn(
                      'p-2 rounded-lg bg-gradient-to-br shadow-md',
                      style?.gradient
                    )}
                    style={{
                      boxShadow: `0 4px 12px ${node.color}40`
                    }}
                  >
                    {/* White icon for contrast */}
                    {node.name === 'Tài chính' && <TrendingUp className="h-4 w-4 text-white drop-shadow-sm" />}
                    {node.name === 'Khách hàng' && <Users className="h-4 w-4 text-white drop-shadow-sm" />}
                    {node.name === 'Quy trình nội bộ' && <Settings className="h-4 w-4 text-white drop-shadow-sm" />}
                    {node.name === 'Học hỏi & Phát triển' && <GraduationCap className="h-4 w-4 text-white drop-shadow-sm" />}
                  </div>
                ) : (
                  getIcon()
                )}

                {/* Name */}
                <span className={cn(
                  'flex-1 text-sm truncate leading-tight',
                  node.type === 'perspective' && 'font-bold text-foreground',
                  node.type === 'objective' && 'font-semibold text-foreground/90',
                  node.type === 'csf' && 'font-medium text-foreground/80',
                  node.type === 'kpi' && 'text-muted-foreground'
                )}>
                  {node.name}
                </span>

                {/* Badges */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {node.weight !== undefined && node.weight > 0 && (
                    <Badge 
                      variant="outline" 
                      className="text-[10px] h-5 px-1.5 font-semibold"
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
                    <Badge 
                      variant="secondary" 
                      className="text-[10px] h-5 px-1.5 font-medium bg-slate-200 dark:bg-slate-700"
                    >
                      {node.csfCount} CSF
                    </Badge>
                  )}

                  {node.type === 'csf' && node.kpiCount !== undefined && (
                    <Badge 
                      variant="secondary" 
                      className="text-[10px] h-5 px-1.5 font-medium bg-slate-200 dark:bg-slate-700"
                    >
                      {node.kpiCount} KPI
                    </Badge>
                  )}
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-xs">
              <p className="font-medium">{getTypeLabel()}</p>
              <p className="text-xs text-muted-foreground">{node.name}</p>
            </TooltipContent>
          </Tooltip>

          {/* Children */}
          {isExpanded && hasChildren && (
            <div className="relative">
              {/* Vertical line */}
              <div 
                className="absolute left-0 border-l-2 border-slate-200 dark:border-slate-700"
                style={{ 
                  left: `${depth * 16 + 16}px`,
                  top: 0,
                  bottom: 8
                }}
              />
              {node.children!.map((child) => renderNode(child, depth + 1))}
            </div>
          )}
        </div>
      </TooltipProvider>
    );
  };

  if (loading) {
    return (
      <div className="p-4 space-y-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex items-center gap-3 animate-pulse">
            <div className="h-8 w-8 bg-slate-200 dark:bg-slate-700 rounded-lg" />
            <div className="h-5 flex-1 bg-slate-200 dark:bg-slate-700 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-9 bg-slate-50 dark:bg-slate-900 border-slate-200"
          />
        </div>
      </div>
      
      {/* Tree */}
      <div className="py-2 px-2">
        {filteredTreeData.length === 0 && searchQuery ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Không tìm thấy kết quả cho &ldquo;{searchQuery}&rdquo;
          </div>
        ) : (
          filteredTreeData.map((node) => renderNode(node, 0))
        )}
      </div>
    </div>
  );
}

