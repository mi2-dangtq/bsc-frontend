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
      className="absolute left-0 right-0 border-b border-dashed border-slate-300"
      style={{
        top: y,
        height: height,
      }}
    >
      {/* Lane Label - với pointer-events-auto để cho phép click */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[180px] flex flex-col justify-center px-4 border-r border-slate-200 pointer-events-auto z-10"
        style={{
          background: `linear-gradient(to right, ${color}15, transparent)`,
        }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: color }}
          />
          <div>
            <p className="text-sm font-semibold text-slate-700">{name}</p>
            <p className="text-xs text-slate-500">{nameEn}</p>
          </div>
        </div>
        
        {/* Add Objective Button */}
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 w-full justify-start text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100"
          onClick={(e) => {
            e.stopPropagation();
            onAddObjective?.();
          }}
        >
          <Plus className="w-3 h-3 mr-1" />
          Thêm mục tiêu
        </Button>
      </div>

      {/* Lane Guide Lines */}
      <div 
        className="absolute left-[180px] right-0 top-1/2 border-t border-dotted border-slate-200"
      />
    </div>
  );
}
