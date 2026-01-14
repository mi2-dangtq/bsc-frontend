'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Target,
  ArrowRight,
  Filter,
  RefreshCw,
  FileText,
  BarChart3,
  Layers,
} from 'lucide-react';
import Link from 'next/link';
import { objectivesAPI, csfAPI, type Objective as APIObjective } from '@/lib/api';
import { usePerspectives } from '@/contexts';
import { toast } from 'sonner';

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
  themeId?: number | null;
  themeName?: string;
  themeColor?: string;
}

export function ObjectivesManager() {
  const { perspectives } = usePerspectives();
  const [objectives, setObjectives] = useState<Objective[]>([]);
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
        const perspective = perspectives.find(p => p.id === obj.perspectiveId);
        
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
          themeId: obj.theme?.id,
          themeName: obj.theme?.name,
          themeColor: obj.theme?.color,
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

  // Group objectives by perspective for display
  const groupedByPerspective = useMemo(() => {
    const result: { perspective: typeof perspectives[0]; objectives: Objective[] }[] = [];
    
    perspectives.forEach(p => {
      const perspectiveObjs = filteredObjectives.filter(o => o.perspectiveId === p.id);
      if (filterPerspective === 'all' || filterPerspective === p.id.toString()) {
        result.push({ perspective: p, objectives: perspectiveObjs });
      }
    });
    
    return result;
  }, [filteredObjectives, filterPerspective, perspectives]);

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
          <span>Đang tải dữ liệu...</span>
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
            Danh sách tất cả mục tiêu chiến lược theo phương diện BSC
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
              Bản đồ chiến lược
            </Link>
          </Button>
        </div>
      </div>

      {/* Statistics - Compact inline */}
      <div className="flex items-center gap-6 py-3 px-4 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Mục tiêu:</span>
          <span className="font-semibold">{stats.totalObjectives}</span>
        </div>
        <div className="h-4 w-px bg-border" />
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">CSF:</span>
          <span className="font-semibold">{stats.totalCsf}</span>
        </div>
        <div className="h-4 w-px bg-border" />
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">KPI:</span>
          <span className="font-semibold">{stats.totalKpi}</span>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filterPerspective} onValueChange={setFilterPerspective}>
            <SelectTrigger className="w-[180px] h-8">
              <SelectValue placeholder="Lọc phương diện" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả phương diện</SelectItem>
              {perspectives.map((p) => (
                <SelectItem key={p.id} value={p.id.toString()}>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: p.color }}
                    />
                    {p.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Unified Table View - Grouped by Perspective */}
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
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="w-[160px] font-semibold">Phương diện</TableHead>
                  <TableHead className="w-[80px] font-semibold">Mã</TableHead>
                  <TableHead className="font-semibold">Tên mục tiêu</TableHead>
                  <TableHead className="w-[150px] font-semibold">Nhóm CL</TableHead>
                  <TableHead className="w-[80px] text-center font-semibold">Tỷ trọng</TableHead>
                  <TableHead className="w-[60px] text-center font-semibold">CSF</TableHead>
                  <TableHead className="w-[60px] text-center font-semibold">KPI</TableHead>
                  <TableHead className="w-[90px] text-center font-semibold">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupedByPerspective.map(({ perspective, objectives: perspectiveObjs }) => {
                  if (perspectiveObjs.length === 0) return null;
                  
                  return perspectiveObjs.map((obj, idx) => (
                    <TableRow key={obj.id} className="hover:bg-muted/30">
                      {/* Perspective - only show on first row */}
                      {idx === 0 ? (
                        <TableCell 
                          rowSpan={perspectiveObjs.length}
                          className="align-top font-medium border-r"
                          style={{ 
                            borderLeft: `3px solid ${perspective.color}`,
                            backgroundColor: `${perspective.color}05`,
                          }}
                        >
                          <div className="py-1">
                            <p className="text-sm font-semibold">{perspective.name}</p>
                            <p className="text-[11px] text-muted-foreground">{perspective.nameEn}</p>
                          </div>
                        </TableCell>
                      ) : null}
                      
                      {/* Code */}
                      <TableCell>
                        {obj.code ? (
                          <Badge
                            variant="outline"
                            className="text-xs font-mono"
                            style={{ borderColor: obj.color, color: obj.color }}
                          >
                            {obj.code}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                      </TableCell>
                      
                      {/* Name + Description */}
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{obj.name}</p>
                          {obj.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                              {obj.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      
                      {/* Theme */}
                      <TableCell>
                        {obj.themeName ? (
                          <div 
                            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium"
                            style={{ 
                              backgroundColor: `${obj.themeColor}15`,
                              color: obj.themeColor,
                            }}
                          >
                            <span 
                              className="w-1.5 h-1.5 rounded-full" 
                              style={{ backgroundColor: obj.themeColor }}
                            />
                            {obj.themeName}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      
                      {/* Weight */}
                      <TableCell className="text-center">
                        {obj.weight !== undefined && obj.weight > 0 ? (
                          <Badge variant="secondary" className="text-xs">
                            {obj.weight}%
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                      </TableCell>
                      
                      {/* CSF Count */}
                      <TableCell className="text-center">
                        <span className={`text-sm ${(obj.csfCount || 0) === 0 ? 'text-muted-foreground' : ''}`}>
                          {obj.csfCount || 0}
                        </span>
                      </TableCell>
                      
                      {/* KPI Count */}
                      <TableCell className="text-center">
                        <span className={`text-sm ${(obj.kpiCount || 0) === 0 ? 'text-muted-foreground' : ''}`}>
                          {obj.kpiCount || 0}
                        </span>
                      </TableCell>
                      
                      {/* Actions */}
                      <TableCell className="text-center">
                        <Button variant="ghost" size="sm" className="h-7 px-2" asChild>
                          <Link href={`/csf?objective=${obj.id}`}>
                            <FileText className="h-3.5 w-3.5 mr-1" />
                            CSF
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ));
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
