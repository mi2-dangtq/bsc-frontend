'use client';

import { useState, useCallback } from 'react';
import { type Node, type Edge } from '@xyflow/react';
import { objectivesAPI, type Objective, type CreateObjectiveDTO, type CreateLinkDTO } from '@/lib/api';
import { toast } from 'sonner';

// Map perspective sort order to lane ID
const PERSPECTIVE_TO_LANE: Record<number, string> = {
  1: 'lane-1', // Financial
  2: 'lane-2', // Customer
  3: 'lane-3', // Process
  4: 'lane-4', // L&G
};

const LANE_TO_PERSPECTIVE: Record<string, number> = {
  'lane-1': 1,
  'lane-2': 2,
  'lane-3': 3,
  'lane-4': 4,
};

const PERSPECTIVES = [
  { id: 1, name: 'Tài chính', color: '#22c55e' },
  { id: 2, name: 'Khách hàng', color: '#3b82f6' },
  { id: 3, name: 'Quy trình nội bộ', color: '#f59e0b' },
  { id: 4, name: 'Học hỏi & Phát triển', color: '#8b5cf6' },
];

export interface UseStrategyMapAPI {
  loading: boolean;
  error: string | null;
  fetchObjectives: (year: number, departmentId?: string) => Promise<{ nodes: Node[]; edges: Edge[] }>;
  createObjective: (data: CreateObjectiveDTO, laneId: string, positionX: number) => Promise<Node | null>;
  updateObjective: (id: number, data: Partial<CreateObjectiveDTO>) => Promise<boolean>;
  deleteObjective: (id: number) => Promise<boolean>;
  createLink: (fromId: number, toId: number) => Promise<boolean>;
  deleteLink: (linkId: number) => Promise<boolean>;
}

export function useStrategyMapAPI(): UseStrategyMapAPI {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all objectives and convert to ReactFlow nodes/edges
  const fetchObjectives = useCallback(async (year: number, departmentId?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const [objectives, links] = await Promise.all([
        objectivesAPI.getAll({ year, departmentId }),
        objectivesAPI.getAllLinks(year),
      ]);

      // Convert objectives to ReactFlow nodes
      const nodes: Node[] = objectives.map((obj: Objective) => {
        const perspective = PERSPECTIVES.find(p => p.id === obj.perspectiveId);
        const laneId = PERSPECTIVE_TO_LANE[obj.perspectiveId];
        
        return {
          id: `obj-${obj.id}`,
          type: 'objective',
          position: {
            x: obj.positionX ?? 180,
            y: obj.positionY ?? 27,
          },
          data: {
            label: obj.name,
            code: obj.code,
            weight: obj.weight ? Number(obj.weight) : undefined,
            description: obj.description,
            perspectiveId: obj.perspectiveId,
            perspectiveName: perspective?.name || '',
            color: perspective?.color || '#64748b',
            year: obj.year,
            dbId: obj.id, // Store DB ID for API calls
            theme: obj.theme || undefined,
          },
          parentId: laneId,
          extent: 'parent' as const,
          draggable: true,
        };
      });

      // Convert links to ReactFlow edges
      const edges: Edge[] = links.map((link) => ({
        id: `edge-${link.id}`,
        source: `obj-${link.fromObjectiveId}`,
        target: `obj-${link.toObjectiveId}`,
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#64748b', strokeWidth: 2 },
        data: { dbId: link.id },
      }));

      return { nodes, edges };
    } catch (err) {
      console.error('Error fetching objectives:', err);
      setError('Không thể tải dữ liệu từ server');
      toast.error('Lỗi kết nối server');
      return { nodes: [], edges: [] };
    } finally {
      setLoading(false);
    }
  }, []);

  // Create new objective
  const createObjective = useCallback(async (
    data: CreateObjectiveDTO,
    laneId: string,
    positionX: number
  ): Promise<Node | null> => {
    try {
      const result = await objectivesAPI.create({
        ...data,
        positionX,
        positionY: 27,
      });

      const perspective = PERSPECTIVES.find(p => p.id === result.perspectiveId);
      
      const newNode: Node = {
        id: `obj-${result.id}`,
        type: 'objective',
        position: { x: positionX, y: 27 },
        data: {
          label: result.name,
          code: result.code,
          weight: result.weight ? Number(result.weight) : undefined,
          description: result.description,
          perspectiveId: result.perspectiveId,
          perspectiveName: perspective?.name || '',
          color: perspective?.color || '#64748b',
          year: result.year,
          dbId: result.id,
        },
        parentId: laneId,
        extent: 'parent' as const,
        draggable: true,
      };

      toast.success('Đã thêm mục tiêu mới');
      return newNode;
    } catch (err) {
      console.error('Error creating objective:', err);
      toast.error('Không thể tạo mục tiêu');
      return null;
    }
  }, []);

  // Update objective
  const updateObjective = useCallback(async (
    id: number,
    data: Partial<CreateObjectiveDTO>
  ): Promise<boolean> => {
    try {
      await objectivesAPI.update(id, data);
      toast.success('Đã cập nhật mục tiêu');
      return true;
    } catch (err) {
      console.error('Error updating objective:', err);
      toast.error('Không thể cập nhật mục tiêu');
      return false;
    }
  }, []);

  // Delete objective
  const deleteObjective = useCallback(async (id: number): Promise<boolean> => {
    try {
      await objectivesAPI.delete(id);
      toast.success('Đã xóa mục tiêu');
      return true;
    } catch (err) {
      console.error('Error deleting objective:', err);
      toast.error('Không thể xóa mục tiêu');
      return false;
    }
  }, []);

  // Create link
  const createLink = useCallback(async (
    fromId: number,
    toId: number
  ): Promise<boolean> => {
    try {
      await objectivesAPI.createLink({ fromObjectiveId: fromId, toObjectiveId: toId });
      toast.success('Đã tạo liên kết');
      return true;
    } catch (err: any) {
      console.error('Error creating link:', err);
      toast.error(err.message || 'Không thể tạo liên kết');
      return false;
    }
  }, []);

  // Delete link
  const deleteLink = useCallback(async (linkId: number): Promise<boolean> => {
    try {
      await objectivesAPI.deleteLink(linkId);
      return true;
    } catch (err) {
      console.error('Error deleting link:', err);
      return false;
    }
  }, []);

  return {
    loading,
    error,
    fetchObjectives,
    createObjective,
    updateObjective,
    deleteObjective,
    createLink,
    deleteLink,
  };
}

// Helper to extract DB ID from node ID
export function getDbIdFromNodeId(nodeId: string): number | null {
  const match = nodeId.match(/^obj-(\d+)$/);
  return match ? parseInt(match[1]) : null;
}

// Helper to get perspective ID from lane ID
export function getPerspectiveIdFromLane(laneId: string): number {
  return LANE_TO_PERSPECTIVE[laneId] || 1;
}
