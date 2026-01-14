'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Target,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
} from 'lucide-react';
import {
  PerspectiveRadarChart,
  PerspectiveBarChart,
  OverallScoreGauge,
} from '@/components/charts';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface PerspectiveStat {
  id: number;
  name: string;
  nameEn: string;
  color: string | null;
  objectiveCount: number;
  kpiCount: number;
  score: number;
  trend: 'up' | 'down';
}

// Recent activities (still mock - TODO: implement activity log API)
const recentActivities = [
  {
    action: 'Cập nhật KPI',
    item: 'Doanh thu Q1',
    user: 'Nguyễn Văn A',
    time: '5 phút trước',
    status: 'success',
  },
  {
    action: 'Tạo mục tiêu',
    item: 'Tăng trưởng thị phần',
    user: 'Trần Thị B',
    time: '1 giờ trước',
    status: 'success',
  },
  {
    action: 'Nhập kết quả',
    item: 'CSAT tháng 1',
    user: 'Lê Văn C',
    time: '2 giờ trước',
    status: 'warning',
  },
  {
    action: 'Phê duyệt',
    item: 'Bản đồ chiến lược 2026',
    user: 'Phạm Văn D',
    time: '1 ngày trước',
    status: 'success',
  },
];

function getScoreColor(score: number) {
  if (score >= 90) return 'text-green-600';
  if (score >= 70) return 'text-blue-600';
  if (score >= 50) return 'text-amber-600';
  return 'text-red-600';
}

function getScoreBadge(score: number) {
  if (score >= 90) return { label: 'Xuất sắc', variant: 'default' as const };
  if (score >= 70) return { label: 'Đạt', variant: 'secondary' as const };
  if (score >= 50) return { label: 'Cần cải thiện', variant: 'outline' as const };
  return { label: 'Chưa đạt', variant: 'destructive' as const };
}

export default function DashboardPage() {
  const [stats, setStats] = useState<PerspectiveStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_URL}/perspectives/stats`);
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const totalScore =
    stats.length > 0
      ? Math.round(stats.reduce((sum, p) => sum + p.score, 0) / stats.length)
      : 0;

  const totalObjectives = stats.reduce((sum, p) => sum + p.objectiveCount, 0);
  const totalKpis = stats.reduce((sum, p) => sum + p.kpiCount, 0);

  // Prepare chart data
  const chartData = stats.map((p) => ({
    name: p.name,
    nameEn: p.nameEn,
    score: p.score,
    color: p.color || '#888',
  }));

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
          <h2 className="text-2xl font-bold tracking-tight">Tổng quan BSC</h2>
          <p className="text-muted-foreground">
            Kỳ đánh giá: Q1/2026 | Dữ liệu realtime từ hệ thống
          </p>
        </div>
      </div>

      {/* Top Section: Score Overview + Radar Chart */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Overall Score Card with Gauge */}
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Điểm tổng hợp BSC</CardTitle>
            <CardDescription>Trung bình 4 phương diện</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center">
            <OverallScoreGauge score={totalScore} label="Điểm BSC" />
            <div className="mt-4 flex items-center gap-4">
              {totalScore > 0 && (
                <Badge {...getScoreBadge(totalScore)} className="text-sm px-3 py-1">
                  {getScoreBadge(totalScore).label}
                </Badge>
              )}
              <div className="flex items-center gap-1 text-green-600">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm font-medium">+5% so với kỳ trước</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Radar Chart */}
        <PerspectiveRadarChart data={chartData} />
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Bar Chart by Perspective */}
        <PerspectiveBarChart data={chartData} />

        {/* Stats Grid */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Mục tiêu chiến lược</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalObjectives}</div>
              <p className="text-xs text-muted-foreground">
                Đang active trong hệ thống
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">KPIs đang theo dõi</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalKpis}</div>
              <p className="text-xs text-muted-foreground">
                Được phân bổ từ CSF cấp công ty
              </p>
            </CardContent>
          </Card>
          <Card className="sm:col-span-2 xl:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Cần chú ý</CardTitle>
              <AlertCircle className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-600">
                {stats.filter((s) => s.score > 0 && s.score < 70).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Phương diện dưới ngưỡng chấp nhận (70%)
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Perspective Cards */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Chi tiết theo Phương diện</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((perspective) => (
            <Card key={perspective.id} className="relative overflow-hidden">
              <div
                className="absolute left-0 top-0 bottom-0 w-1"
                style={{ backgroundColor: perspective.color || '#888' }}
              />
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center justify-between">
                  <span>{perspective.nameEn}</span>
                  {perspective.trend === 'up' ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                </CardDescription>
                <CardTitle className="text-lg">{perspective.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className={`text-3xl font-bold ${getScoreColor(perspective.score)}`}>
                    {perspective.score > 0 ? `${perspective.score}%` : 'N/A'}
                  </span>
                </div>
                <div className="mt-2 flex gap-3 text-xs text-muted-foreground">
                  <span>{perspective.objectiveCount} mục tiêu</span>
                  <span>•</span>
                  <span>{perspective.kpiCount} KPIs</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Hoạt động gần đây</CardTitle>
          <CardDescription>Các cập nhật mới nhất trong hệ thống</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivities.map((activity, index) => (
              <div key={index} className="flex items-center gap-4">
                <div
                  className={`h-2 w-2 rounded-full ${
                    activity.status === 'success'
                      ? 'bg-green-500'
                      : activity.status === 'warning'
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {activity.action}: <span className="font-normal">{activity.item}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">{activity.user}</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {activity.time}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
