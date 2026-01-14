'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Search, Filter, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface KpiLibraryItem {
  id: number;
  name: string;
  definition: string | null;
  unit: string | null;
  kpiType: 'INPUT' | 'PROCESS' | 'OUTPUT' | 'OUTCOME';
  trend: 'POSITIVE' | 'NEGATIVE';
  frequency: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  formula: string | null;
  isActive: boolean;
}

const FREQUENCY_LABELS: Record<string, string> = {
  MONTHLY: 'Tháng',
  QUARTERLY: 'Quý',
  YEARLY: 'Năm',
};

function getTypeBadge(type: string) {
  const styles: Record<string, { variant: 'default' | 'secondary' | 'outline' | 'destructive'; label: string }> = {
    INPUT: { variant: 'outline', label: 'Đầu vào' },
    PROCESS: { variant: 'secondary', label: 'Quy trình' },
    OUTPUT: { variant: 'default', label: 'Đầu ra' },
    OUTCOME: { variant: 'destructive', label: 'Kết quả' },
  };
  return styles[type] || { variant: 'outline', label: type };
}

function getTrendBadge(trend: string) {
  return trend === 'POSITIVE'
    ? { className: 'bg-green-100 text-green-700', label: '↑ Thuận' }
    : { className: 'bg-red-100 text-red-700', label: '↓ Ngược' };
}

export default function KpiLibraryPage() {
  const [kpiLibrary, setKpiLibrary] = useState<KpiLibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchKpiLibrary = async () => {
      try {
        const res = await fetch(`${API_URL}/kpi/library`);
        if (res.ok) {
          const data = await res.json();
          setKpiLibrary(data);
        }
      } catch (err) {
        console.error('Failed to fetch KPI library:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchKpiLibrary();
  }, []);

  const filteredKpis = kpiLibrary.filter((kpi) =>
    kpi.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Thư viện KPI</h2>
          <p className="text-muted-foreground">
            Quản lý các mẫu KPI có thể sử dụng trong hệ thống
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Thêm KPI mới
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm KPI..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Lọc
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Đang tải...</span>
            </div>
          ) : filteredKpis.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              {searchTerm ? 'Không tìm thấy KPI phù hợp' : 'Chưa có KPI nào trong thư viện'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên KPI</TableHead>
                  <TableHead>Đơn vị</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead>Xu hướng</TableHead>
                  <TableHead>Tần suất</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredKpis.map((kpi) => (
                  <TableRow key={kpi.id}>
                    <TableCell className="font-medium">{kpi.name}</TableCell>
                    <TableCell>{kpi.unit || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={getTypeBadge(kpi.kpiType).variant}>
                        {getTypeBadge(kpi.kpiType).label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getTrendBadge(kpi.trend).className}`}
                      >
                        {getTrendBadge(kpi.trend).label}
                      </span>
                    </TableCell>
                    <TableCell>{FREQUENCY_LABELS[kpi.frequency] || kpi.frequency}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        Sửa
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
