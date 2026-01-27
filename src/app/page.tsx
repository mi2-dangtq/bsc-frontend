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
import { Progress } from '@/components/ui/progress';
import {
  Target,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,

  Loader2,
  DollarSign,
  Users,
  Settings,
  GraduationCap,
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

// Perspective icons mapping
const perspectiveIcons: Record<number, React.ElementType> = {
  1: DollarSign,    // Financial
  2: Users,         // Customer
  3: Settings,      // Process
  4: GraduationCap, // Learning
};

// Enhanced perspective colors with gradients
const perspectiveGradients: Record<number, string> = {
  1: 'from-emerald-500 to-green-600',     // Financial - Green
  2: 'from-blue-500 to-indigo-600',       // Customer - Blue
  3: 'from-amber-500 to-orange-600',      // Process - Amber
  4: 'from-violet-500 to-purple-600',     // Learning - Purple
};

const perspectiveBgGradients: Record<number, string> = {
  1: 'from-emerald-50 to-green-100 dark:from-emerald-950/30 dark:to-green-900/30',
  2: 'from-blue-50 to-indigo-100 dark:from-blue-950/30 dark:to-indigo-900/30',
  3: 'from-amber-50 to-orange-100 dark:from-amber-950/30 dark:to-orange-900/30',
  4: 'from-violet-50 to-purple-100 dark:from-violet-950/30 dark:to-purple-900/30',
};



function getScoreColor(score: number) {
  if (score >= 90) return 'text-emerald-600';
  if (score >= 70) return 'text-blue-600';
  if (score >= 50) return 'text-amber-600';
  return 'text-red-600';
}

function getScoreBadge(score: number) {
  if (score >= 90) return { label: 'Xuất sắc', variant: 'default' as const, className: 'bg-emerald-500 hover:bg-emerald-600' };
  if (score >= 70) return { label: 'Đạt', variant: 'secondary' as const, className: 'bg-blue-500 text-white hover:bg-blue-600' };
  if (score >= 50) return { label: 'Cần cải thiện', variant: 'outline' as const, className: 'border-amber-500 text-amber-600' };
  return { label: 'Chưa đạt', variant: 'destructive' as const, className: '' };
}

function getProgressColor(score: number) {
  if (score >= 90) return 'bg-emerald-500';
  if (score >= 70) return 'bg-blue-500';
  if (score >= 50) return 'bg-amber-500';
  return 'bg-red-500';
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
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-pulse" />
            <Loader2 className="absolute inset-0 m-auto h-8 w-8 animate-spin text-blue-600" />
          </div>
          <p className="text-sm text-muted-foreground">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with gradient accent */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
            Tổng quan BSC
          </h2>
          <p className="text-muted-foreground mt-1">
            Kỳ đánh giá: <span className="font-semibold text-blue-600">Q1/2026</span> | Dữ liệu realtime từ hệ thống
          </p>
        </div>
        <Badge variant="outline" className="text-xs px-3 py-1 border-emerald-500 text-emerald-600 bg-emerald-50">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-2" />
          Live
        </Badge>
      </div>

      {/* Top Section: Score Overview + Radar Chart */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Overall Score Card with enhanced styling */}
        <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <CardHeader className="pb-2 relative">
            <CardTitle className="text-lg text-slate-200">Điểm tổng hợp BSC</CardTitle>
            <CardDescription className="text-slate-400">Trung bình 4 phương diện</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center relative">
            <OverallScoreGauge score={totalScore} label="Điểm BSC" />
            <div className="mt-4 flex items-center gap-4">
              {totalScore > 0 && (
                <Badge className={`text-sm px-3 py-1 ${getScoreBadge(totalScore).className}`}>
                  {getScoreBadge(totalScore).label}
                </Badge>
              )}
              <div className="flex items-center gap-1 text-emerald-400">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm font-medium">+5% so với kỳ trước</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Radar Chart with enhanced card */}
        <Card className="border shadow-lg">
          <PerspectiveRadarChart data={chartData} />
        </Card>
      </div>

      {/* Perspective Cards - Enhanced with gradients */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <div className="w-1 h-5 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full" />
          Chi tiết theo Phương diện
        </h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((perspective) => {
            const Icon = perspectiveIcons[perspective.id] || Target;
            const bgGradient = perspectiveBgGradients[perspective.id] || '';
            const iconGradient = perspectiveGradients[perspective.id] || 'from-slate-500 to-slate-600';
            
            return (
              <Card 
                key={perspective.id} 
                className={`relative overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 bg-gradient-to-br ${bgGradient}`}
              >
                {/* Color accent bar */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-lg"
                  style={{ backgroundColor: perspective.color || '#888' }}
                />
                
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${iconGradient} shadow-lg`}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    {perspective.trend === 'up' ? (
                      <div className="flex items-center gap-1 text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full text-xs">
                        <TrendingUp className="h-3 w-3" />
                        <span>Tăng</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-red-600 bg-red-100 px-2 py-0.5 rounded-full text-xs">
                        <TrendingDown className="h-3 w-3" />
                        <span>Giảm</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-2">
                    <p className="text-xs text-muted-foreground">{perspective.nameEn}</p>
                    <CardTitle className="text-base mt-0.5">{perspective.name}</CardTitle>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className={`text-3xl font-bold ${getScoreColor(perspective.score)}`}>
                      {perspective.score > 0 ? `${perspective.score}%` : 'N/A'}
                    </span>
                    <span className="text-xs text-muted-foreground">/ 100%</span>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-3">
                    <div 
                      className={`h-full ${getProgressColor(perspective.score)} rounded-full transition-all duration-500`}
                      style={{ width: `${perspective.score}%` }}
                    />
                  </div>
                  
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{perspective.objectiveCount} mục tiêu</span>
                    <span>{perspective.kpiCount} KPIs</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Bar Chart */}
        <Card className="shadow-lg border">
          <PerspectiveBarChart data={chartData} />
        </Card>

        {/* Stats Grid with enhanced colors */}
        <div className="grid gap-4 grid-cols-2">
          <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950/30 dark:to-indigo-900/30">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Mục tiêu chiến lược</CardTitle>
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
                <Target className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-blue-700 dark:text-blue-400">{totalObjectives}</div>
              <p className="text-xs text-muted-foreground mt-1">Đang active trong hệ thống</p>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-md bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-950/30 dark:to-green-900/30">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">KPIs theo dõi</CardTitle>
              <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg">
                <CheckCircle2 className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-emerald-700 dark:text-emerald-400">{totalKpis}</div>
              <p className="text-xs text-muted-foreground mt-1">Từ CSF cấp công ty</p>
            </CardContent>
          </Card>
          
          <Card className="col-span-2 border-0 shadow-md bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-950/30 dark:to-orange-900/30">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Cần chú ý</CardTitle>
              <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg">
                <AlertCircle className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-amber-700 dark:text-amber-400">
                {stats.filter((s) => s.score > 0 && s.score < 70).length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Phương diện dưới ngưỡng 70%
              </p>
            </CardContent>
          </Card>
        </div>
      </div>


    </div>
  );
}
