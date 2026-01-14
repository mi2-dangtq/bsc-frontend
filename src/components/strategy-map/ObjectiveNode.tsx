'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info, Target } from 'lucide-react';

export interface ObjectiveNodeData extends Record<string, unknown> {
  label: string;
  perspectiveId: number;
  perspectiveName: string;
  color: string;
  code?: string;
  weight?: number;
  description?: string;
  year: number;
  theme?: {
    id: number;
    name: string;
    color: string;
  };
}

// Node dimensions
const NODE_WIDTH = 180;
const NODE_HEIGHT = 110;

function ObjectiveNodeComponent(props: NodeProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = props.data as any as ObjectiveNodeData;
  const selected = props.selected;

  return (
    <>
      {/* Input Handle - Bottom */}
      <Handle
        type="target"
        position={Position.Bottom}
        className="!w-2.5 !h-2.5 !bg-slate-300 !border-2 !border-white 
          hover:!bg-primary !transition-colors"
      />
      
      {/* Node Card - Flat Design */}
      <div 
        className={`
          group relative
          bg-white rounded-lg
          border transition-all duration-200
          cursor-grab active:cursor-grabbing
          ${selected 
            ? 'border-primary shadow-md ring-1 ring-primary/20' 
            : 'border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300'
          }
        `}
        style={{ 
          width: NODE_WIDTH,
          height: NODE_HEIGHT,
        }}
      >
        {/* Left Accent Stripe - Solid Color */}
        <div 
          className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg"
          style={{ backgroundColor: data.color }}
        />

        {/* Content */}
        <div className="h-full flex flex-col pl-3.5 pr-3">
          {/* Header */}
          <div className="flex items-center justify-between gap-1 pt-2.5 pb-1">
            <div className="flex items-center gap-1.5">
              {data.code ? (
                <Badge 
                  variant="outline" 
                  className="text-[10px] px-1.5 py-0 h-5 font-mono font-semibold"
                  style={{ borderColor: data.color, color: data.color }}
                >
                  {data.code}
                </Badge>
              ) : (
                <div 
                  className="w-5 h-5 rounded flex items-center justify-center"
                  style={{ backgroundColor: `${data.color}15` }}
                >
                  <Target className="w-3 h-3" style={{ color: data.color }} />
                </div>
              )}
            </div>
            <div className="flex items-center gap-1">
              {data.description && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="w-5 h-5 rounded flex items-center justify-center 
                        hover:bg-slate-100 transition-colors cursor-help">
                        <Info className="h-3 w-3 text-slate-400" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[200px]">
                      <p className="text-xs">{data.description}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {data.weight !== undefined && data.weight > 0 && (
                <Badge 
                  variant="secondary"
                  className="text-[10px] px-1.5 py-0 h-5 font-medium bg-slate-100 text-slate-600"
                >
                  {data.weight}%
                </Badge>
              )}
            </div>
          </div>
          
          {/* Main Content */}
          <div className="flex-1 flex items-center py-1">
            <p className="text-[13px] font-medium leading-snug line-clamp-2 text-slate-700">
              {data.label || 'Mục tiêu mới'}
            </p>
          </div>
          
          {/* Theme Badge */}
          <div className="pb-2">
            {data.theme ? (
              <div 
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium"
                style={{ 
                  backgroundColor: `${data.theme.color}12`,
                  color: data.theme.color,
                }}
              >
                <span 
                  className="w-1.5 h-1.5 rounded-full" 
                  style={{ backgroundColor: data.theme.color }}
                />
                <span className="truncate max-w-[100px]">
                  {data.theme.name}
                </span>
              </div>
            ) : (
              <div className="h-4" />
            )}
          </div>
        </div>
      </div>

      {/* Output Handle - Top */}
      <Handle
        type="source"
        position={Position.Top}
        className="!w-2.5 !h-2.5 !bg-slate-300 !border-2 !border-white 
          hover:!bg-primary !transition-colors"
      />
    </>
  );
}

export const ObjectiveNode = memo(ObjectiveNodeComponent);
