'use client';

import { useState, useCallback } from 'react';
import { csfAPI, kpiLibraryAPI, kpiAllocationAPI, type CSF, type KPILibrary, type KPIAllocation } from '@/lib/api';
import { toast } from 'sonner';

export interface LocalKPI {
  id: string;
  dbId?: number; // KpiAllocation ID
  kpiLibId?: number; // KpiLibrary ID
  name: string;
  unit?: string;
  weight?: number; // KPI weight percentage
  target?: number; // Alias for targetGoal (backward compatibility)
  // Full target fields for scoring
  targetMin?: number;
  targetThreshold?: number;
  targetGoal?: number;
  targetMax?: number;
  description?: string;
  // Department assignments
  departments?: Array<{
    id: string;
    name: string;
    code: string | null;
  }>;
}

export interface LocalDepartment {
  id: string;
  name: string;
  code: string | null;
}

export interface LocalCSF {
  id: string;
  dbId?: number;
  objectiveId: number;
  name: string;
  description?: string;
  kpis: LocalKPI[];
  departments?: LocalDepartment[];
}

export interface UseFishboneAPI {
  loading: boolean;
  error: string | null;
  kpiLibrary: KPILibrary[];
  fetchCSFs: (objectiveId: number) => Promise<LocalCSF[]>;
  fetchKpiLibrary: () => Promise<void>;
  createCSF: (objectiveId: number, content: string) => Promise<LocalCSF | null>;
  updateCSF: (dbId: number, content: string) => Promise<boolean>;
  deleteCSF: (dbId: number) => Promise<boolean>;
  // KPI operations
  addKpiToCSF: (
    csfDbId: number,
    kpiLibId: number,
    targets: {
      targetMin?: number;
      targetThreshold?: number;
      targetGoal: number;
      targetMax?: number;
    },
    year: number,
    weight?: number
  ) => Promise<LocalKPI | null>;
  updateKpiAllocation: (
    allocationId: number,
    data: {
      weight?: number;
      targetMin?: number;
      targetThreshold?: number;
      targetGoal?: number;
      targetMax?: number;
    }
  ) => Promise<boolean>;
  removeKpiFromCSF: (allocationId: number) => Promise<boolean>;
}

export function useFishboneAPI(): UseFishboneAPI {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [kpiLibrary, setKpiLibrary] = useState<KPILibrary[]>([]);

  // Fetch KPI Library
  const fetchKpiLibrary = useCallback(async () => {
    try {
      const library = await kpiLibraryAPI.getAll();
      setKpiLibrary(library);
    } catch (err) {
      console.error('Error fetching KPI library:', err);
    }
  }, []);

  // Fetch all CSFs for an objective
  const fetchCSFs = useCallback(async (objectiveId: number): Promise<LocalCSF[]> => {
    setLoading(true);
    setError(null);
    
    try {
      const csfs = await csfAPI.getAll(objectiveId);

      // Transform API data to local format
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const localCSFs: LocalCSF[] = csfs.map((csf: any) => ({
        id: `csf-${csf.id}`,
        dbId: csf.id,
        objectiveId: csf.objectiveId,
        name: csf.content,
        description: '',
        kpis: (csf.kpiAllocations || []).map((alloc: any) => ({
          id: `kpi-${alloc.id}`,
          dbId: alloc.id,
          kpiLibId: alloc.kpiLibId,
          name: alloc.kpiLib?.name || 'KPI',
          unit: alloc.kpiLib?.unit || undefined,
          weight: alloc.weight ? Number(alloc.weight) : undefined,
          target: alloc.targetGoal ? Number(alloc.targetGoal) : undefined,
          targetMin: alloc.targetMin ? Number(alloc.targetMin) : undefined,
          targetThreshold: alloc.targetThreshold ? Number(alloc.targetThreshold) : undefined,
          targetGoal: alloc.targetGoal ? Number(alloc.targetGoal) : undefined,
          targetMax: alloc.targetMax ? Number(alloc.targetMax) : undefined,
          description: alloc.kpiLib?.definition || undefined,
          departments: (alloc.departments || []).map((d: any) => ({
            id: d.department?.id || d.departmentId,
            name: d.department?.name || '',
            code: d.department?.code || null,
          })),
        })),
        departments: (csf.departments || []).map((d: any) => ({
          id: d.department?.id || d.departmentId,
          name: d.department?.name || '',
          code: d.department?.code || null,
        })),
      }));

      return localCSFs;
    } catch (err) {
      console.error('Error fetching CSFs:', err);
      setError('Không thể tải dữ liệu CSF');
      toast.error('Lỗi kết nối server');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Create new CSF
  const createCSF = useCallback(async (
    objectiveId: number,
    content: string
  ): Promise<LocalCSF | null> => {
    try {
      const result = await csfAPI.create({ objectiveId, content });

      const newCSF: LocalCSF = {
        id: `csf-${result.id}`,
        dbId: result.id,
        objectiveId: result.objectiveId,
        name: result.content,
        description: '',
        kpis: [],
      };

      toast.success('Đã thêm CSF mới');
      return newCSF;
    } catch (err) {
      console.error('Error creating CSF:', err);
      toast.error('Không thể tạo CSF');
      return null;
    }
  }, []);

  // Update CSF
  const updateCSF = useCallback(async (
    dbId: number,
    content: string
  ): Promise<boolean> => {
    try {
      await csfAPI.update(dbId, { content });
      toast.success('Đã cập nhật CSF');
      return true;
    } catch (err) {
      console.error('Error updating CSF:', err);
      toast.error('Không thể cập nhật CSF');
      return false;
    }
  }, []);

  // Delete CSF
  const deleteCSF = useCallback(async (dbId: number): Promise<boolean> => {
    try {
      await csfAPI.delete(dbId);
      toast.success('Đã xóa CSF');
      return true;
    } catch (err) {
      console.error('Error deleting CSF:', err);
      toast.error('Không thể xóa CSF');
      return false;
    }
  }, []);

  // Add KPI to CSF via KpiAllocation
  const addKpiToCSF = useCallback(async (
    csfDbId: number,
    kpiLibId: number,
    targets: {
      targetMin?: number;
      targetThreshold?: number;
      targetGoal: number;
      targetMax?: number;
    },
    year: number,
    weight?: number
  ): Promise<LocalKPI | null> => {
    try {
      const allocation = await kpiAllocationAPI.create({
        csfId: csfDbId,
        kpiLibId,
        weight: weight ?? 100, // Use provided weight or default
        targetMin: targets.targetMin,
        targetThreshold: targets.targetThreshold,
        targetGoal: targets.targetGoal,
        targetMax: targets.targetMax,
        year,
      });

      const kpiLib = kpiLibrary.find(k => k.id === kpiLibId);

      const newKpi: LocalKPI = {
        id: `kpi-${allocation.id}`,
        dbId: allocation.id,
        kpiLibId: allocation.kpiLibId,
        name: kpiLib?.name || 'KPI',
        unit: kpiLib?.unit || undefined,
        target: Number(allocation.targetGoal),
        targetMin: allocation.targetMin ? Number(allocation.targetMin) : undefined,
        targetThreshold: allocation.targetThreshold ? Number(allocation.targetThreshold) : undefined,
        targetGoal: Number(allocation.targetGoal),
        targetMax: allocation.targetMax ? Number(allocation.targetMax) : undefined,
        description: kpiLib?.definition || undefined,
      };

      toast.success('Đã thêm KPI');
      return newKpi;
    } catch (err) {
      console.error('Error adding KPI:', err);
      toast.error('Không thể thêm KPI');
      return null;
    }
  }, [kpiLibrary]);

  // Update KPI Allocation
  const updateKpiAllocation = useCallback(async (
    allocationId: number,
    data: {
      weight?: number;
      targetMin?: number;
      targetThreshold?: number;
      targetGoal?: number;
      targetMax?: number;
    }
  ): Promise<boolean> => {
    try {
      await kpiAllocationAPI.update(allocationId, data);
      toast.success('Đã cập nhật KPI');
      return true;
    } catch (err) {
      console.error('Error updating KPI:', err);
      toast.error('Không thể cập nhật KPI');
      return false;
    }
  }, []);

  // Remove KPI from CSF (delete allocation)
  const removeKpiFromCSF = useCallback(async (allocationId: number): Promise<boolean> => {
    try {
      await kpiAllocationAPI.delete(allocationId);
      toast.success('Đã xóa KPI');
      return true;
    } catch (err) {
      console.error('Error removing KPI:', err);
      toast.error('Không thể xóa KPI');
      return false;
    }
  }, []);

  return {
    loading,
    error,
    kpiLibrary,
    fetchCSFs,
    fetchKpiLibrary,
    createCSF,
    updateCSF,
    deleteCSF,
    addKpiToCSF,
    updateKpiAllocation,
    removeKpiFromCSF,
  };
}

// Helper to extract DB ID from CSF local ID
export function getDbIdFromCsfId(csfId: string): number | null {
  const match = csfId.match(/^csf-(\d+)$/);
  return match ? parseInt(match[1]) : null;
}

// Helper to extract allocation ID from KPI local ID
export function getAllocationIdFromKpiId(kpiId: string): number | null {
  const match = kpiId.match(/^kpi-(\d+)$/);
  return match ? parseInt(match[1]) : null;
}
