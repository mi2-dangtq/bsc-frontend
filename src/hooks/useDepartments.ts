'use client';

import { useState, useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface Department {
  id: string;
  name: string;
  code: string | null;
  parentId: string | null;
  headUserId: string | null;
  sortOrder: number;
  isActive: boolean;
  syncedAt: string;
  primaryPerspectiveId: number | null;
  perspective: {
    id: number;
    name: string;
    color: string | null;
  } | null;
}


export function useDepartments() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/departments`);
        if (!res.ok) throw new Error('Failed to fetch departments');
        const data = await res.json();
        setDepartments(data);
      } catch (err) {
        setError('Không thể tải danh sách phòng ban');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDepartments();
  }, []);

  return { departments, loading, error };
}
