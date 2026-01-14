'use client';

import { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import { Button } from '@/components/ui/button';
import { Plus, TrendingUp, Users, Settings, GraduationCap } from 'lucide-react';

export interface LaneNodeData extends Record<string, unknown> {
  label: string;
  labelEn: string;
  color: string;
  sortOrder: number;
  weight?: number;
  onAddObjective?: () => void;
}

// Perspective gradient configurations with enhanced styling
const PERSPECTIVE_CONFIG: Record<number, { 
  Icon: React.ComponentType<{ className?: string }>; 
  gradient: string;
  bgGradient: string;
}> = {
  1: { 
    Icon: TrendingUp, 
    gradient: 'from-amber-400 to-orange-500',
    bgGradient: 'from-amber-50/80 via-orange-50/40 to-transparent',
  },
  2: { 
    Icon: Users, 
    gradient: 'from-blue-400 to-indigo-500',
    bgGradient: 'from-blue-50/80 via-indigo-50/40 to-transparent',
  },
  3: { 
    Icon: Settings, 
    gradient: 'from-emerald-400 to-teal-500',
    bgGradient: 'from-emerald-50/80 via-teal-50/40 to-transparent',
  },
  4: { 
    Icon: GraduationCap, 
    gradient: 'from-purple-400 to-violet-500',
    bgGradient: 'from-purple-50/80 via-violet-50/40 to-transparent',
  },
};

function LaneNodeComponent(props: NodeProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = props.data as any as LaneNodeData;
  const config = PERSPECTIVE_CONFIG[data.sortOrder] || { 
    Icon: Settings, 
    gradient: 'from-slate-400 to-slate-500',
    bgGradient: 'from-slate-50/80 via-slate-50/40 to-transparent',
  };
  const Icon = config.Icon;
  const weight = data.weight ?? 25;

  return (
    <div
      className={`w-full h-full relative bg-gradient-to-r ${config.bgGradient}`}
    >
      {/* Noise texture overlay for depth */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          mixBlendMode: 'overlay',
        }}
      />

      {/* Bottom border with gradient */}
      <div 
        className="absolute left-0 right-0 bottom-0 h-px"
        style={{
          background: `linear-gradient(to right, ${data.color}60, ${data.color}20 50%, transparent)`,
        }}
      />

      {/* Lane Label - Modern glassmorphism design */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[180px] flex flex-col justify-between py-3 px-4 pointer-events-auto"
        style={{
          background: `linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.6) 70%)`,
          borderRight: `2px solid ${data.color}30`,
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
      >
        {/* Top section: Icon + Labels */}
        <div className="flex items-start gap-2.5">
          {/* Icon container with gradient */}
          <div 
            className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md bg-gradient-to-br ${config.gradient}`}
            style={{ 
              boxShadow: `0 4px 12px ${data.color}30`,
            }}
          >
            <Icon className="w-4.5 h-4.5 text-white drop-shadow-sm" />
          </div>
          
          {/* Labels */}
          <div className="min-w-0 flex-1">
            <p 
              className="text-sm font-bold leading-tight truncate"
              style={{ color: data.color }}
            >
              {data.label}
            </p>
            <p className="text-[10px] text-slate-400 truncate mt-0.5">
              {data.labelEn}
            </p>
          </div>
        </div>

        {/* Middle section: Weight display - smaller */}
        <div className="flex items-center justify-center">
          <div 
            className="flex items-baseline gap-0.5 px-2.5 py-1 rounded-md"
            style={{ 
              background: `${data.color}10`,
              border: `1px solid ${data.color}20`,
            }}
          >
            <span 
              className="text-base font-semibold tabular-nums"
              style={{ color: data.color }}
            >
              {weight}
            </span>
            <span 
              className="text-xs font-medium"
              style={{ color: `${data.color}80` }}
            >
              %
            </span>
          </div>
        </div>

        {/* Bottom section: Compact Add Button */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-center text-[10px] h-7 px-2 rounded-lg
            text-slate-500 hover:text-slate-700 
            bg-white/50 hover:bg-white/80 
            border border-slate-200/60 hover:border-slate-300
            shadow-sm hover:shadow
            transition-all duration-200"
          onClick={(e) => {
            e.stopPropagation();
            const event = new CustomEvent('add-objective', {
              detail: { laneId: props.id },
            });
            window.dispatchEvent(event);
          }}
        >
          <Plus className="w-3 h-3 mr-1" />
          Thêm
        </Button>
      </div>

      {/* Lane center line - subtle guide with glow */}
      <div
        className="absolute left-[180px] right-0 top-1/2"
        style={{
          borderTop: `1px dashed ${data.color}20`,
        }}
      />

      {/* Decorative elements */}
      <div 
        className="absolute right-4 top-1/2 -translate-y-1/2 w-24 h-24 rounded-full opacity-10"
        style={{
          background: `radial-gradient(circle, ${data.color} 0%, transparent 70%)`,
        }}
      />
    </div>
  );
}

export const LaneNode = memo(LaneNodeComponent);
