'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info, TrendingUp, TrendingDown, Minus } from 'lucide-react';

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
  // New fields for status
  status?: 'on_track' | 'at_risk' | 'behind' | 'not_started';
  progress?: number; // 0-100
}

// Compact node dimensions
export const NODE_WIDTH = 185;
export const NODE_HEIGHT = 95;

// Status configurations
const STATUS_CONFIG = {
  on_track: { 
    color: '#10b981', 
    bgColor: '#10b98115', 
    label: 'Đúng tiến độ',
    Icon: TrendingUp,
  },
  at_risk: { 
    color: '#f59e0b', 
    bgColor: '#f59e0b15', 
    label: 'Cần theo dõi',
    Icon: Minus,
  },
  behind: { 
    color: '#ef4444', 
    bgColor: '#ef444415', 
    label: 'Chậm tiến độ',
    Icon: TrendingDown,
  },
  not_started: { 
    color: '#94a3b8', 
    bgColor: '#94a3b815', 
    label: 'Chưa bắt đầu',
    Icon: Minus,
  },
};

function ObjectiveNodeComponent(props: NodeProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = props.data as any as ObjectiveNodeData;
  const selected = props.selected;
  
  // Default status if not provided
  const status = data.status || 'not_started';
  const statusConfig = STATUS_CONFIG[status];
  const StatusIcon = statusConfig.Icon;

  return (
    <>
      {/* Input Handle - Bottom */}
      <Handle
        type="target"
        position={Position.Bottom}
        className="!w-2.5 !h-2.5 !bg-white !border-2 !border-slate-300 
          hover:!border-primary hover:!bg-primary/20 !transition-all !duration-200
          !shadow-sm"
      />
      
      {/* Compact Node Card - Glassmorphism Design */}
      <div 
        className={`
          group relative overflow-hidden
          rounded-lg
          transition-all duration-200 ease-out
          cursor-grab active:cursor-grabbing
          ${selected 
            ? 'scale-[1.02] shadow-lg ring-2 ring-primary/30' 
            : 'shadow-md hover:shadow-lg hover:scale-[1.01]'
          }
        `}
        style={{ 
          width: NODE_WIDTH,
          height: NODE_HEIGHT,
          background: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: `1px solid rgba(255, 255, 255, 0.6)`,
        }}
      >
        {/* Gradient accent - left edge */}
        <div 
          className="absolute top-0 left-0 bottom-0 w-1 rounded-l-lg"
          style={{ 
            background: `linear-gradient(180deg, ${data.color}, ${data.color}80)`,
          }}
        />

        {/* Content - compact layout */}
        <div className="h-full flex flex-col pl-2.5 pr-2 py-1.5">
          {/* Header row - code + weight + status */}
          <div className="flex items-center gap-1.5">
            {data.code && (
              <Badge 
                variant="outline" 
                className="text-[9px] px-1.5 py-0 h-4 font-mono font-bold border shadow-sm"
                style={{ 
                  borderColor: data.color, 
                  color: data.color,
                  backgroundColor: `${data.color}08`,
                }}
              >
                {data.code}
              </Badge>
            )}
            
            {data.weight !== undefined && data.weight > 0 && (
              <span 
                className="text-[9px] font-semibold"
                style={{ color: data.color }}
              >
                {data.weight}%
              </span>
            )}
            
            {/* Status indicator - right aligned */}
            <div className="ml-auto flex items-center gap-1">
              {data.description && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="w-4 h-4 rounded-full flex items-center justify-center 
                        bg-slate-100 hover:bg-slate-200 transition-colors cursor-help">
                        <Info className="h-2.5 w-2.5 text-slate-400" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[200px]">
                      <p className="text-xs">{data.description}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div 
                      className="w-4 h-4 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: statusConfig.bgColor }}
                    >
                      <StatusIcon 
                        className="w-2.5 h-2.5" 
                        style={{ color: statusConfig.color }} 
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    {statusConfig.label}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          
          {/* Main Content - label */}
          <div className="flex-1 flex items-center min-h-0 py-0.5">
            <p className="text-[11px] font-medium leading-tight line-clamp-2 text-slate-700">
              {data.label || 'Mục tiêu mới'}
            </p>
          </div>
          
          {/* Footer - Theme badge (compact) */}
          {data.theme && (
            <div className="flex items-center gap-1">
              <span 
                className="w-1.5 h-1.5 rounded-full flex-shrink-0" 
                style={{ backgroundColor: data.theme.color }}
              />
              <span 
                className="text-[9px] font-medium truncate max-w-[100px]"
                style={{ color: data.theme.color }}
              >
                {data.theme.name}
              </span>
            </div>
          )}
        </div>

        {/* Subtle hover glow */}
        <div 
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at center, ${data.color}06 0%, transparent 70%)`,
          }}
        />
      </div>

      {/* Output Handle - Top */}
      <Handle
        type="source"
        position={Position.Top}
        className="!w-2.5 !h-2.5 !bg-white !border-2 !border-slate-300 
          hover:!border-primary hover:!bg-primary/20 !transition-all !duration-200
          !shadow-sm"
      />
    </>
  );
}

export const ObjectiveNode = memo(ObjectiveNodeComponent);
