'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Building2,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Users,
  Loader2,
  CheckCircle,
  Network,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Department {
  id: string;
  name: string;
  code: string | null;
  parentId: string | null;
  headUserId: string | null;
  sortOrder: number;
  isActive: boolean;
  syncedAt: string;
  children?: Department[];
}

interface SyncResult {
  created: number;
  updated: number;
  total: number;
}

// Recursive Tree Node Component
function DepartmentNode({
  dept,
  level = 0,
  expandedIds,
  toggleExpand,
}: {
  dept: Department;
  level?: number;
  expandedIds: Set<string>;
  toggleExpand: (id: string) => void;
}) {
  const hasChildren = dept.children && dept.children.length > 0;
  const isExpanded = expandedIds.has(dept.id);

  return (
    <div className="select-none">
      <div
        className={cn(
          'flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors',
          level === 0 && 'bg-primary/5 font-semibold'
        )}
        style={{ paddingLeft: `${level * 24 + 12}px` }}
        onClick={() => hasChildren && toggleExpand(dept.id)}
      >
        {/* Expand/Collapse Icon */}
        <span className="w-5 h-5 flex items-center justify-center">
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )
          ) : (
            <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
          )}
        </span>

        {/* Department Icon */}
        <Building2
          className={cn(
            'h-4 w-4',
            level === 0 ? 'text-primary' : 'text-muted-foreground'
          )}
        />

        {/* Department Name */}
        <span className={cn('flex-1', level === 0 && 'text-primary')}>
          {dept.name}
        </span>

        {/* Code Badge */}
        {dept.code && (
          <Badge variant="outline" className="text-xs">
            {dept.code}
          </Badge>
        )}

        {/* Children Count */}
        {hasChildren && (
          <Badge variant="secondary" className="text-xs">
            {dept.children!.length}
          </Badge>
        )}

        {/* Head User Indicator */}
        {dept.headUserId && dept.headUserId !== '0' && (
          <Users className="h-3 w-3 text-muted-foreground" />
        )}
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="border-l-2 border-muted ml-6">
          {dept.children!.map((child) => (
            <DepartmentNode
              key={child.id}
              dept={child}
              level={level + 1}
              expandedIds={expandedIds}
              toggleExpand={toggleExpand}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function DepartmentsManager() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  // Fetch departments
  const fetchDepartments = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_URL}/departments`);
      if (!res.ok) throw new Error('Failed to fetch departments');
      const data = await res.json();
      setDepartments(data);
      // Auto-expand first level
      const rootIds = data
        .filter((d: Department) => !d.parentId)
        .map((d: Department) => d.id);
      setExpandedIds(new Set(rootIds));
    } catch (err) {
      setError('Không thể tải danh sách phòng ban');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Sync from Bitrix24
  const syncFromBitrix24 = async () => {
    try {
      setSyncing(true);
      setSyncResult(null);
      setError(null);
      const res = await fetch(`${API_URL}/departments/sync`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Sync failed');
      const result = await res.json();
      setSyncResult(result);
      // Refetch after sync
      await fetchDepartments();
    } catch (err) {
      setError('Không thể đồng bộ từ Bitrix24');
      console.error(err);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  // Build tree structure
  const departmentTree = useMemo(() => {
    const map = new Map<string, Department>();
    const roots: Department[] = [];

    // First pass: create map
    departments.forEach((dept) => {
      map.set(dept.id, { ...dept, children: [] });
    });

    // Second pass: build tree
    departments.forEach((dept) => {
      const node = map.get(dept.id)!;
      if (dept.parentId && map.has(dept.parentId)) {
        map.get(dept.parentId)!.children!.push(node);
      } else {
        roots.push(node);
      }
    });

    // Sort by sortOrder
    const sortNodes = (nodes: Department[]) => {
      nodes.sort((a, b) => a.sortOrder - b.sortOrder);
      nodes.forEach((n) => n.children && sortNodes(n.children));
    };
    sortNodes(roots);

    return roots;
  }, [departments]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedIds(new Set(departments.map((d) => d.id)));
  };

  const collapseAll = () => {
    setExpandedIds(new Set());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Network className="h-6 w-6" />
            Quản lý Phòng ban
          </h1>
          <p className="text-muted-foreground">
            Cấu trúc tổ chức đồng bộ từ Bitrix24
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={expandAll}>
            Mở rộng tất cả
          </Button>
          <Button variant="outline" onClick={collapseAll}>
            Thu gọn
          </Button>
          <Button onClick={syncFromBitrix24} disabled={syncing}>
            {syncing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Đang đồng bộ...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Đồng bộ Bitrix24
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Sync Result */}
      {syncResult && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Đồng bộ thành công: <strong>{syncResult.created}</strong> mới,{' '}
            <strong>{syncResult.updated}</strong> cập nhật. Tổng:{' '}
            <strong>{syncResult.total}</strong> phòng ban.
          </AlertDescription>
        </Alert>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tổng phòng ban
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{departments.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Phòng ban gốc
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{departmentTree.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Có trưởng phòng
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {departments.filter((d) => d.headUserId && d.headUserId !== '0').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Department Tree */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Cấu trúc tổ chức
          </CardTitle>
          <CardDescription>
            Click vào phòng ban để mở rộng/thu gọn các phòng ban con
          </CardDescription>
        </CardHeader>
        <CardContent>
          {departmentTree.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Chưa có phòng ban nào.</p>
              <p className="text-sm">Nhấn "Đồng bộ Bitrix24" để lấy dữ liệu.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {departmentTree.map((dept) => (
                <DepartmentNode
                  key={dept.id}
                  dept={dept}
                  expandedIds={expandedIds}
                  toggleExpand={toggleExpand}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
