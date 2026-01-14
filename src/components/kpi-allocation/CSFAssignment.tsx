'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Link2, Users, Loader2 } from 'lucide-react';
import { type Department } from '@/hooks/useDepartments';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface CSF {
  id: number;
  content: string;
  objectiveId: number;
}

interface Objective {
  id: number;
  name: string;
}

interface CSFAssignmentProps {
  departments: (Department & { code: string | null })[];
}

export function CSFAssignment({ departments }: CSFAssignmentProps) {
  const [csfs, setCsfs] = useState<(CSF & { objectiveName?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<Record<number, string[]>>({});

  // Fetch CSFs from API
  useEffect(() => {
    const fetchCSFs = async () => {
      try {
        setLoading(true);
        // Fetch objectives first to get names
        const objRes = await fetch(`${API_URL}/objectives`);
        const objectives: Objective[] = objRes.ok ? await objRes.json() : [];

        // Fetch CSFs
        const csfRes = await fetch(`${API_URL}/csf`);
        const csfData: CSF[] = csfRes.ok ? await csfRes.json() : [];

        // Map objective names to CSFs
        const csfsWithObjectives = csfData.map((csf) => ({
          ...csf,
          objectiveName:
            objectives.find((o) => o.id === csf.objectiveId)?.name || 'Không xác định',
        }));

        setCsfs(csfsWithObjectives);

        // Initialize assignments
        const initialAssignments: Record<number, string[]> = {};
        csfsWithObjectives.forEach((csf) => {
          initialAssignments[csf.id] = [];
        });
        setAssignments(initialAssignments);
      } catch (err) {
        console.error('Failed to fetch CSFs:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCSFs();
  }, []);

  const toggleAssignment = (csfId: number, deptId: string) => {
    setAssignments((prev) => {
      const current = prev[csfId] || [];
      if (current.includes(deptId)) {
        return { ...prev, [csfId]: current.filter((id) => id !== deptId) };
      } else {
        return { ...prev, [csfId]: [...current, deptId] };
      }
    });
  };

  const getAssignedDepts = (csfId: number) => {
    const deptIds = assignments[csfId] || [];
    return departments.filter((d) => deptIds.includes(d.id));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (csfs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Phân công CSF cho Phòng ban
          </CardTitle>
          <CardDescription>Chưa có CSF nào. Vui lòng tạo CSF trước.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="h-5 w-5" />
          Phân công CSF cho Phòng ban
        </CardTitle>
        <CardDescription>
          Gán trách nhiệm cho từng CSF. Một CSF có thể do nhiều phòng ban phụ trách.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {csfs.map((csf) => {
            const assignedDepts = getAssignedDepts(csf.id);
            return (
              <div key={csf.id} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-medium">{csf.content}</h4>
                    <p className="text-sm text-muted-foreground">{csf.objectiveName}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{assignedDepts.length}</span>
                  </div>
                </div>

                {/* Department checkboxes */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                  {departments.map((dept) => {
                    const isAssigned = (assignments[csf.id] || []).includes(dept.id);
                    return (
                      <label
                        key={dept.id}
                        className={`flex items-center gap-2 p-2 rounded-md cursor-pointer border transition-colors ${
                          isAssigned
                            ? 'bg-primary/10 border-primary'
                            : 'hover:bg-muted border-transparent'
                        }`}
                      >
                        <Checkbox
                          checked={isAssigned}
                          onCheckedChange={() => toggleAssignment(csf.id, dept.id)}
                        />
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className="text-xs">
                            {dept.code || dept.name.substring(0, 3).toUpperCase()}
                          </Badge>
                          <span className="text-sm truncate">{dept.name}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>

                {/* Warning if multiple depts */}
                {assignedDepts.length > 1 && (
                  <p className="text-xs text-amber-600 mt-2">
                    ⚠️ Có {assignedDepts.length} phòng ban phụ trách - cần ít nhất 1 KPI riêng
                    cho mỗi phòng ban
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex justify-end">
          <Button>Lưu phân công</Button>
        </div>
      </CardContent>
    </Card>
  );
}
