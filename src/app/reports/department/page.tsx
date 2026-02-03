'use client';

import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2, Trophy } from 'lucide-react';
import { DepartmentRanking } from '@/components/departments/DepartmentRanking';

export default function DepartmentReportPage() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
              Báo cáo theo Phòng ban
            </h1>
            <p className="text-muted-foreground mt-0.5">
              So sánh điểm số BSC giữa các phòng ban trong công ty
            </p>
          </div>
        </div>

        {/* Year Selector */}
        <Select
          value={selectedYear.toString()}
          onValueChange={(val) => setSelectedYear(parseInt(val))}
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                Năm {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Department Ranking */}
      <DepartmentRanking year={selectedYear} />

      {/* Info Box */}
      <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-4">
        <div className="flex items-start gap-3">
          <Trophy className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-700 dark:text-blue-400">
              Cách đọc bảng xếp hạng
            </h4>
            <ul className="text-sm text-blue-600 dark:text-blue-300 mt-2 space-y-1">
              <li>• <strong>Điểm</strong>: Điểm tổng hợp BSC (trung bình có trọng số)</li>
              <li>• <strong>Tiến độ đo lường</strong>: % KPI đã được nhập kết quả thực tế</li>
              <li>• <strong>Xu hướng</strong>: So sánh với kỳ trước (↑ Tăng, ↓ Giảm, — Ổn định)</li>
              <li>• <strong>Top 3</strong>: Phòng ban có huy chương đạt điểm cao nhất</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
