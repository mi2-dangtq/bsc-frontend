'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, Trophy, Medal, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface DepartmentScore {
  departmentId: string;
  departmentName: string;
  code: string | null;
  overallScore: number;
  rank: number;
  perspectiveScores: { perspectiveId: number; perspectiveName: string; score: number }[];
}

const rankIcons: Record<number, { icon: React.ReactNode; color: string }> = {
  1: { icon: <Trophy className="h-5 w-5" />, color: 'text-yellow-500' },
  2: { icon: <Medal className="h-5 w-5" />, color: 'text-slate-400' },
  3: { icon: <Medal className="h-5 w-5" />, color: 'text-orange-400' },
};

function getScoreColor(score: number) {
  if (score >= 90) return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30';
  if (score >= 70) return 'text-blue-600 bg-blue-50 dark:bg-blue-950/30';
  if (score >= 50) return 'text-amber-600 bg-amber-50 dark:bg-amber-950/30';
  return 'text-red-600 bg-red-50 dark:bg-red-950/30';
}

export function DepartmentRankingWidget() {
  const [departments, setDepartments] = useState<DepartmentScore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRanking = async () => {
      try {
        const token = localStorage.getItem('bsc_token');
        const res = await fetch(`${API_URL}/departments/scorecard/ranking`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          setDepartments(data.slice(0, 3)); // Top 3 only
        }
      } catch (err) {
        console.error('Failed to fetch department ranking:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRanking();
  }, []);

  if (loading) {
    return (
      <Card className="border shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Top Phòng Ban
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (departments.length === 0) {
    return (
      <Card className="border shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Top Phòng Ban
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Chưa có dữ liệu xếp hạng
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border shadow-lg overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Top Phòng Ban
            </CardTitle>
            <CardDescription>Xếp hạng theo điểm BSC tổng hợp</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/reports/department" className="text-xs">
              Xem tất cả <ChevronRight className="h-3 w-3 ml-1" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-3">
          {departments.map((dept) => {
            const rankInfo = rankIcons[dept.rank];
            return (
              <div
                key={dept.departmentId}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                {/* Rank */}
                <div className={`flex-shrink-0 ${rankInfo?.color || 'text-muted-foreground'}`}>
                  {rankInfo?.icon || (
                    <span className="w-5 h-5 flex items-center justify-center text-sm font-bold">
                      {dept.rank}
                    </span>
                  )}
                </div>

                {/* Department Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="font-medium truncate">{dept.departmentName}</span>
                    {dept.code && (
                      <Badge variant="outline" className="text-[10px] flex-shrink-0">
                        {dept.code}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Score */}
                <div className={`flex-shrink-0 px-3 py-1 rounded-full font-bold text-sm ${getScoreColor(dept.overallScore)}`}>
                  {dept.overallScore.toFixed(1)}%
                </div>

                {/* Trend indicator (placeholder) */}
                <div className="flex-shrink-0">
                  {dept.rank === 1 ? (
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-slate-400" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
