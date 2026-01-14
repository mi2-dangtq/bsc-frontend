'use client';

import { useState, useCallback } from 'react';
import { kpiAllocationAPI, kpiMeasurementAPI, type KPIAllocation, type KPIMeasurement } from '@/lib/api';
import { toast } from 'sonner';

export interface LocalAllocation {
  id: number;
  kpiName: string;
  kpiUnit: string | null;
  kpiTrend: 'POSITIVE' | 'NEGATIVE';
  csfName: string;
  objectiveName: string;
  targetMin: number | null;
  targetThreshold: number | null;
  targetGoal: number;
  targetMax: number | null;
  weight: number;
  year: number;
  latestMeasurement?: {
    id: number;
    actualValue: number;
    scorePercent: number | null;
    status: string;
    measuredAt: string;
  };
}

export interface UseKpiMeasurementAPI {
  loading: boolean;
  error: string | null;
  allocations: LocalAllocation[];
  fetchAllocations: (year?: number, departmentId?: string) => Promise<void>;
  createMeasurement: (allocationId: number, actualValue: number, note?: string) => Promise<boolean>;
  calculatePreviewScore: (allocation: LocalAllocation, actualValue: number) => number;
}

export function useKpiMeasurementAPI(): UseKpiMeasurementAPI {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allocations, setAllocations] = useState<LocalAllocation[]>([]);

  // Fetch all allocations with optional filters
  const fetchAllocations = useCallback(async (year?: number, departmentId?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const filters: { year?: number; departmentId?: string } = {};
      if (year) filters.year = year;
      if (departmentId) filters.departmentId = departmentId;
      
      const data = await kpiAllocationAPI.getAll(Object.keys(filters).length > 0 ? filters : undefined);
      
      const mapped: LocalAllocation[] = data.map((alloc: KPIAllocation) => ({
        id: alloc.id,
        kpiName: alloc.kpiLib?.name || 'Unknown KPI',
        kpiUnit: alloc.kpiLib?.unit || null,
        kpiTrend: alloc.kpiLib?.trend || 'POSITIVE',
        csfName: alloc.csf?.content || 'Unknown CSF',
        objectiveName: (alloc.csf as any)?.objective?.name || 'Unknown Objective',
        targetMin: alloc.targetMin ? Number(alloc.targetMin) : null,
        targetThreshold: alloc.targetThreshold ? Number(alloc.targetThreshold) : null,
        targetGoal: Number(alloc.targetGoal),
        targetMax: alloc.targetMax ? Number(alloc.targetMax) : null,
        weight: Number(alloc.weight),
        year: alloc.year,
        latestMeasurement: alloc.measurements?.[0] ? {
          id: alloc.measurements[0].id,
          actualValue: Number(alloc.measurements[0].actualValue),
          scorePercent: alloc.measurements[0].scorePercent ? Number(alloc.measurements[0].scorePercent) : null,
          status: alloc.measurements[0].status,
          measuredAt: alloc.measurements[0].measuredAt,
        } : undefined,
      }));
      
      setAllocations(mapped);
    } catch (err) {
      console.error('Error fetching allocations:', err);
      setError('Không thể tải danh sách KPI');
      toast.error('Lỗi kết nối server');
    } finally {
      setLoading(false);
    }
  }, []);

  // Create measurement
  const createMeasurement = useCallback(async (
    allocationId: number,
    actualValue: number,
    note?: string
  ): Promise<boolean> => {
    try {
      await kpiMeasurementAPI.create({ allocationId, actualValue, note });
      toast.success('Đã lưu kết quả đo lường');
      return true;
    } catch (err) {
      console.error('Error creating measurement:', err);
      toast.error('Không thể lưu kết quả');
      return false;
    }
  }, []);

  // Calculate preview score (client-side, mirrors backend logic)
  const calculatePreviewScore = useCallback((
    allocation: LocalAllocation,
    actualValue: number
  ): number => {
    let actual = actualValue;
    const min = allocation.targetMin ?? 0;
    let threshold = allocation.targetThreshold ?? allocation.targetGoal * 0.8;
    let target = allocation.targetGoal;
    const max = allocation.targetMax ?? allocation.targetGoal * 1.2;

    // For negative KPIs, invert the logic
    if (allocation.kpiTrend === 'NEGATIVE') {
      actual = min + max - actualValue;
      const newThreshold = min + max - target;
      const newTarget = min + max - threshold;
      threshold = newThreshold;
      target = newTarget;
    }

    // Below threshold = 0%
    if (actual < threshold) return 0;

    // Cap at max
    if (actual > max) actual = max;

    // Between threshold and target: linear scale 0-100%
    if (actual <= target) {
      return ((actual - threshold) / (target - threshold)) * 100;
    }

    // Between target and max: bonus above 100%
    return 100 + ((actual - target) / (max - target)) * 20; // Max 120%
  }, []);

  return {
    loading,
    error,
    allocations,
    fetchAllocations,
    createMeasurement,
    calculatePreviewScore,
  };
}
