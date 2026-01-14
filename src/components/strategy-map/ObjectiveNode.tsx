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
const NODE_HEIGHT = 120;

function ObjectiveNodeComponent(props: NodeProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = props.data as any as ObjectiveNodeData;
  const selected = props.selected;

  return (
    <>
      {/* Input Handle - Nhận mũi tên từ dưới lên */}
      <Handle
        type="target"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-gradient-to-br !from-slate-300 !to-slate-400 !border-2 !border-white 
          hover:!from-primary hover:!to-primary/80 hover:!scale-125 
          !transition-all !duration-200 !shadow-sm"
      />
      
      {/* Node card - Modern glassmorphism design */}
      <div 
        className={`
          group relative overflow-hidden
          bg-white/95 backdrop-blur-sm rounded-xl
          border border-white/60
          transition-all duration-300 ease-out
          cursor-grab active:cursor-grabbing
          ${selected 
            ? 'ring-2 ring-primary/70 ring-offset-2 shadow-xl shadow-primary/10' 
            : 'shadow-lg hover:shadow-xl hover:shadow-slate-200/50'
          }
          hover:-translate-y-1 hover:scale-[1.02]
        `}
        style={{ 
          width: NODE_WIDTH,
          height: NODE_HEIGHT,
        }}
      >
        {/* Left accent stripe with gradient */}
        <div 
          className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl"
          style={{ 
            background: `linear-gradient(to bottom, ${data.color}, ${data.color}99)`,
          }}
        />
        
        {/* Subtle glow effect on hover */}
        <div 
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at top left, ${data.color}10, transparent 70%)`,
          }}
        />

        {/* Content wrapper */}
        <div className="relative h-full flex flex-col pl-4 pr-3">
          {/* Header với code và indicators */}
          <div className="flex items-center justify-between gap-1 pt-2.5 pb-1 flex-shrink-0">
            <div className="flex items-center gap-1.5">
              {data.code ? (
                <Badge 
                  variant="outline" 
                  className="text-[10px] px-1.5 py-0 h-5 font-mono font-semibold tracking-wide
                    border-2 bg-white/50 backdrop-blur-sm shadow-sm"
                  style={{ borderColor: data.color, color: data.color }}
                >
                  {data.code}
                </Badge>
              ) : (
                <div 
                  className="w-5 h-5 rounded-md flex items-center justify-center"
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
                      <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center 
                        hover:bg-slate-200 transition-colors cursor-help">
                        <Info className="h-3 w-3 text-slate-500" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[220px] bg-slate-900 text-white border-0">
                      <p className="text-sm">{data.description}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {data.weight !== undefined && data.weight > 0 && (
                <Badge 
                  className="text-[10px] px-1.5 py-0 h-5 font-semibold
                    bg-gradient-to-r from-slate-100 to-slate-50 text-slate-700 
                    border border-slate-200 shadow-sm"
                >
                  {data.weight}%
                </Badge>
              )}
            </div>
          </div>
          
          {/* Main content - objective name */}
          <div className="flex-1 flex items-center py-1">
            <p className="text-[13px] font-medium leading-snug line-clamp-2 text-slate-800">
              {data.label || 'Mục tiêu mới'}
            </p>
          </div>
          
          {/* Theme Badge - bottom */}
          <div className="pb-2.5 flex-shrink-0">
            {data.theme ? (
              <div 
                className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px]
                  shadow-sm border border-white/50 backdrop-blur-sm"
                style={{ 
                  background: `linear-gradient(135deg, ${data.theme.color}25, ${data.theme.color}10)`,
                  color: data.theme.color,
                }}
              >
                <span 
                  className="w-1.5 h-1.5 rounded-full shadow-sm" 
                  style={{ backgroundColor: data.theme.color }}
                />
                <span className="font-semibold truncate max-w-[100px]">
                  {data.theme.name}
                </span>
              </div>
            ) : (
              <div className="h-5" /> // Spacer when no theme
            )}
          </div>
        </div>
      </div>

      {/* Output Handle - Gửi mũi tên lên trên */}
      <Handle
        type="source"
        position={Position.Top}
        className="!w-3 !h-3 !bg-gradient-to-br !from-slate-300 !to-slate-400 !border-2 !border-white 
          hover:!from-primary hover:!to-primary/80 hover:!scale-125 
          !transition-all !duration-200 !shadow-sm"
      />
    </>
  );
}

export const ObjectiveNode = memo(ObjectiveNodeComponent);

