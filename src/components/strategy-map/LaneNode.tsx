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
  onAddObjective?: () => void;
}

// Perspective gradient configurations
const PERSPECTIVE_CONFIG: Record<number, { 
  Icon: React.ComponentType<{ className?: string }>; 
  gradient: string;
}> = {
  1: { Icon: TrendingUp, gradient: 'from-amber-400 to-orange-500' },      // Tài chính
  2: { Icon: Users, gradient: 'from-blue-400 to-indigo-500' },            // Khách hàng
  3: { Icon: Settings, gradient: 'from-emerald-400 to-teal-500' },        // Quy trình nội bộ
  4: { Icon: GraduationCap, gradient: 'from-purple-400 to-violet-500' },  // Học hỏi & Phát triển
};

function LaneNodeComponent(props: NodeProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = props.data as any as LaneNodeData;
  const config = PERSPECTIVE_CONFIG[data.sortOrder] || { Icon: Settings, gradient: 'from-slate-400 to-slate-500' };
  const Icon = config.Icon;

  return (
    <div
      className="w-full h-full relative"
      style={{
        background: `linear-gradient(to right, ${data.color}08, transparent 60%)`,
      }}
    >
      {/* Bottom border with gradient */}
      <div 
        className="absolute left-0 right-0 bottom-0 h-px"
        style={{
          background: `linear-gradient(to right, ${data.color}40, ${data.color}15 50%, transparent)`,
        }}
      />

      {/* Lane Label - Modern design with gradient icon */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[180px] flex flex-col justify-center px-4 pointer-events-auto"
        style={{
          background: `linear-gradient(135deg, ${data.color}15, ${data.color}05 70%)`,
          borderRight: `1px solid ${data.color}20`,
        }}
      >
        {/* Perspective header */}
        <div className="flex items-start gap-3 mb-3">
          {/* Icon container with gradient - WHITE ICON for contrast */}
          <div 
            className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md bg-gradient-to-br ${config.gradient}`}
            style={{ 
              boxShadow: `0 4px 12px ${data.color}40`,
            }}
          >
            <Icon className="w-5 h-5 text-white drop-shadow-sm" />
          </div>
          
          {/* Labels */}
          <div className="min-w-0 flex-1 pt-0.5">
            <p 
              className="text-sm font-bold leading-tight truncate"
              style={{ color: data.color }}
            >
              {data.label}
            </p>
            <p className="text-[11px] text-slate-400 truncate mt-0.5">
              {data.labelEn}
            </p>
          </div>
        </div>

        {/* Add Objective Button - Modern style */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-xs h-8 px-2 rounded-lg
            text-slate-500 hover:text-slate-700 
            bg-white/60 hover:bg-white/90 
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
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          Thêm mục tiêu
        </Button>
      </div>

      {/* Lane center line - subtle guide */}
      <div
        className="absolute left-[180px] right-0 top-1/2"
        style={{
          borderTop: `1px dashed ${data.color}15`,
        }}
      />
    </div>
  );
}

export const LaneNode = memo(LaneNodeComponent);
