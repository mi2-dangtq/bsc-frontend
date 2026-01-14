'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Target,
  LayoutGrid,
  Table2,
  ArrowRight,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { ObjectiveCard } from './ObjectiveCard';
import { ObjectiveTable } from './ObjectiveTable';
import Link from 'next/link';
import { objectivesAPI, csfAPI, type Objective as APIObjective } from '@/lib/api';
import { toast } from 'sonner';

// 4 BSC Perspectives
const PERSPECTIVES = [
  { id: 1, name: 'Tài chính', nameEn: 'Financial', color: '#22c55e' },
  { id: 2, name: 'Khách hàng', nameEn: 'Customer', color: '#3b82f6' },
  { id: 3, name: 'Quy trình nội bộ', nameEn: 'Internal Process', color: '#f59e0b' },
  { id: 4, name: 'Học hỏi & Phát triển', nameEn: 'Learning & Growth', color: '#8b5cf6' },
];

export interface Objective {
  id: string;
  name: string;
  code?: string;
  weight?: number;
  description?: string;
  perspectiveId: number;
  perspectiveName: string;
  color: string;
  year: number;
  csfCount?: number;
  kpiCount?: number;
}

type ViewMode = 'card' | 'table';

export function ObjectivesManager() {
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [filterPerspective, setFilterPerspective] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch objectives from API
  const fetchObjectives = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [apiObjectives, csfs] = await Promise.all([
        objectivesAPI.getAll(),
        csfAPI.getAll(),
      ]);

      // Transform API data to component format
      const parsedObjectives: Objective[] = apiObjectives.map((obj: APIObjective) => {
        const perspective = PERSPECTIVES.find(p => p.id === obj.perspectiveId);
        
        // Count CSFs for this objective
        const objectiveCsfs = csfs.filter(c => c.objectiveId === obj.id);
        const csfCount = objectiveCsfs.length;
        const kpiCount = objectiveCsfs.reduce(
          (acc, csf) => acc + (csf.kpiAllocations?.length || 0),
          0
        );

        return {
          id: obj.id.toString(),
          name: obj.name,
          code: obj.code || undefined,
          weight: obj.weight ? Number(obj.weight) : undefined,
          description: obj.description || undefined,
          perspectiveId: obj.perspectiveId,
          perspectiveName: perspective?.name || 'Tài chính',
          color: perspective?.color || '#64748b',
          year: obj.year,
          csfCount,
          kpiCount,
        };
      });

      setObjectives(parsedObjectives);
    } catch (err) {
      console.error('Error loading objectives:', err);
      setError('Không thể tải dữ liệu từ server. Vui lòng kiểm tra backend.');
      toast.error('Lỗi kết nối server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchObjectives();
  }, []);

  // Filter objectives by perspective
  const filteredObjectives = useMemo(() => {
    if (filterPerspective === 'all') return objectives;
    return objectives.filter(obj => obj.perspectiveId === parseInt(filterPerspective));
  }, [objectives, filterPerspective]);

  // Group objectives by perspective
  const groupedObjectives = useMemo(() => {
    const groups: Record<number, Objective[]> = {};
    PERSPECTIVES.forEach(p => { groups[p.id] = []; });
    
    filteredObjectives.forEach(obj => {
      if (groups[obj.perspectiveId]) {
        groups[obj.perspectiveId].push(obj);
      }
    });
    
    return groups;
  }, [filteredObjectives]);

  // Statistics
  const stats = useMemo(() => {
    const totalCsf = objectives.reduce((acc, obj) => acc + (obj.csfCount || 0), 0);
    const totalKpi = objectives.reduce((acc, obj) => acc + (obj.kpiCount || 0), 0);
    return { totalObjectives: objectives.length, totalCsf, totalKpi };
  }, [objectives]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2 text-muted-foreground">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>Đang tải dữ liệu từ server...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-destructive">{error}</p>
        <Button onClick={fetchObjectives} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Thử lại
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quản lý Mục tiêu</h1>
          <p className="text-muted-foreground">
            Xem và quản lý các mục tiêu chiến lược từ Bản đồ chiến lược
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={fetchObjectives} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          <Button asChild>
            <Link href="/strategy-map">
              <Target className="h-4 w-4 mr-2" />
              Mở Bản đồ chiến lược
            </Link>
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tổng Mục tiêu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalObjectives}</div>
            <p className="text-xs text-muted-foreground">
              Khuyến nghị: 8-12 mục tiêu
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tổng CSF
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCsf}</div>
            <p className="text-xs text-muted-foreground">
              Yếu tố thành công then chốt
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tổng KPI
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalKpi}</div>
            <p className="text-xs text-muted-foreground">
              Chỉ số đo lường hiệu suất
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters & View Toggle */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Filter className="h-5 w-5 text-muted-foreground" />
              <Select value={filterPerspective} onValueChange={setFilterPerspective}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Lọc theo phương diện" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả phương diện</SelectItem>
                  {PERSPECTIVES.map((p) => (
                    <SelectItem key={p.id} value={p.id.toString()}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: p.color }}
                        />
                        {p.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <ToggleGroup
              type="single"
              value={viewMode}
              onValueChange={(v: string) => v && setViewMode(v as ViewMode)}
              className="bg-muted p-1 rounded-lg"
            >
              <ToggleGroupItem value="card" aria-label="Card view" className="h-8 px-3">
                <LayoutGrid className="h-4 w-4 mr-1" />
                Card
              </ToggleGroupItem>
              <ToggleGroupItem value="table" aria-label="Table view" className="h-8 px-3">
                <Table2 className="h-4 w-4 mr-1" />
                Table
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </CardHeader>
      </Card>

      {/* Content */}
      {objectives.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Chưa có mục tiêu nào</h3>
              <p className="mb-4">
                Hãy tạo mục tiêu trong Bản đồ chiến lược để bắt đầu.
              </p>
              <Button asChild>
                <Link href="/strategy-map">
                  Mở Bản đồ chiến lược
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : viewMode === 'card' ? (
        // Card View - Grouped by Perspective
        <div className="space-y-6">
          {PERSPECTIVES.map((perspective) => {
            const perspectiveObjectives = groupedObjectives[perspective.id];
            if (filterPerspective !== 'all' && filterPerspective !== perspective.id.toString()) {
              return null;
            }
            return (
              <Card key={perspective.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: perspective.color }}
                    />
                    <CardTitle className="text-lg">{perspective.name}</CardTitle>
                    <Badge variant="secondary">{perspectiveObjectives.length} mục tiêu</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {perspectiveObjectives.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      Chưa có mục tiêu nào trong phương diện này
                    </p>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {perspectiveObjectives.map((obj) => (
                        <ObjectiveCard key={obj.id} objective={obj} />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        // Table View
        <ObjectiveTable objectives={filteredObjectives} />
      )}
    </div>
  );
}
