'use client';

import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface PerspectiveLaneProps {
  name: string;
  nameEn: string;
  y: number;
  height: number;
  color: string;
  onAddObjective?: () => void;
}

export function PerspectiveLane({
  name,
  nameEn,
  y,
  height,
  color,
  onAddObjective,
}: PerspectiveLaneProps) {
  return (
    <div
      className="absolute left-0 right-0 border-b border-slate-100"
      style={{
        top: y,
        height: height,
      }}
    >
      {/* Lane Label - Flat Design */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[180px] flex flex-col justify-center px-4 
          border-r border-slate-100 pointer-events-auto z-10"
        style={{
          backgroundColor: `${color}06`, // Very subtle solid color
        }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: color }}
          />
          <div>
            <p className="text-sm font-semibold text-slate-700">{name}</p>
            <p className="text-[11px] text-slate-400">{nameEn}</p>
          </div>
        </div>
        
        {/* Add Objective Button */}
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 h-7 w-full justify-start text-xs text-slate-400 
            hover:text-slate-600 hover:bg-slate-100/50"
          onClick={(e) => {
            e.stopPropagation();
            onAddObjective?.();
          }}
        >
          <Plus className="w-3 h-3 mr-1" />
          Thêm mục tiêu
        </Button>
      </div>

      {/* Lane Guide Line - Subtle */}
      <div 
        className="absolute left-[180px] right-0 top-1/2 border-t border-slate-100"
      />
    </div>
  );
}
