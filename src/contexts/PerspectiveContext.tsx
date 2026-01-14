'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { perspectivesAPI, type Perspective as APIPerspective } from '@/lib/api';

// Perspective type with required fields
export interface Perspective {
  id: number;
  name: string;
  nameEn: string;
  sortOrder: number;
  weight: number; // From DB weightDefault
  color: string;
}

// Default perspectives (fallback when API fails)
const DEFAULT_PERSPECTIVES: Perspective[] = [
  { id: 1, sortOrder: 1, name: 'Tài chính', nameEn: 'Financial', color: '#22c55e', weight: 25 },
  { id: 2, sortOrder: 2, name: 'Khách hàng', nameEn: 'Customer', color: '#3b82f6', weight: 25 },
  { id: 3, sortOrder: 3, name: 'Quy trình nội bộ', nameEn: 'Internal Process', color: '#f59e0b', weight: 25 },
  { id: 4, sortOrder: 4, name: 'Học hỏi & Phát triển', nameEn: 'Learning & Growth', color: '#8b5cf6', weight: 25 },
];

interface PerspectiveContextType {
  perspectives: Perspective[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  getPerspectiveById: (id: number) => Perspective | undefined;
  getPerspectiveByLaneId: (laneId: string) => Perspective | undefined;
  getLaneIdByPerspectiveId: (id: number) => string;
}

const PerspectiveContext = createContext<PerspectiveContextType | undefined>(undefined);

export function PerspectiveProvider({ children }: { children: ReactNode }) {
  const [perspectives, setPerspectives] = useState<Perspective[]>(DEFAULT_PERSPECTIVES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPerspectives = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await perspectivesAPI.getAll();
      
      const mapped: Perspective[] = data
        .sort((a: APIPerspective, b: APIPerspective) => a.sortOrder - b.sortOrder)
        .map((p: APIPerspective) => ({
          id: p.id,
          name: p.name,
          nameEn: p.nameEn,
          sortOrder: p.sortOrder,
          weight: p.weightDefault ? Number(p.weightDefault) : 25,
          color: p.color || DEFAULT_PERSPECTIVES.find(dp => dp.sortOrder === p.sortOrder)?.color || '#64748b',
        }));
      
      setPerspectives(mapped.length > 0 ? mapped : DEFAULT_PERSPECTIVES);
    } catch (err) {
      console.error('Error fetching perspectives:', err);
      setError('Không thể tải dữ liệu phương diện');
      // Keep default perspectives on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPerspectives();
  }, [fetchPerspectives]);

  // Helper to get perspective by ID
  const getPerspectiveById = useCallback((id: number) => {
    return perspectives.find(p => p.id === id);
  }, [perspectives]);

  // Helper to get perspective by lane ID (e.g., 'lane-1' -> perspective with sortOrder 1)
  const getPerspectiveByLaneId = useCallback((laneId: string) => {
    const sortOrder = parseInt(laneId.replace('lane-', ''));
    return perspectives.find(p => p.sortOrder === sortOrder);
  }, [perspectives]);

  // Helper to get lane ID from perspective ID
  const getLaneIdByPerspectiveId = useCallback((id: number) => {
    const perspective = perspectives.find(p => p.id === id);
    return perspective ? `lane-${perspective.sortOrder}` : 'lane-1';
  }, [perspectives]);

  return (
    <PerspectiveContext.Provider value={{
      perspectives,
      loading,
      error,
      refetch: fetchPerspectives,
      getPerspectiveById,
      getPerspectiveByLaneId,
      getLaneIdByPerspectiveId,
    }}>
      {children}
    </PerspectiveContext.Provider>
  );
}

export function usePerspectives() {
  const context = useContext(PerspectiveContext);
  if (context === undefined) {
    throw new Error('usePerspectives must be used within a PerspectiveProvider');
  }
  return context;
}
