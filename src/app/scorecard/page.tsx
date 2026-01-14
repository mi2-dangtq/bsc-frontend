import { ScorecardSummaryTable } from '@/components/scorecard/ScorecardSummaryTable';
import { ClipboardList } from 'lucide-react';

export const metadata = {
  title: 'Scorecard Tổng hợp | BSC/KPI System',
  description: 'Bảng tóm tắt toàn bộ BSC với phương diện, mục tiêu và KPI',
};

export default function ScorecardPage() {
  return (
    <div className="space-y-6">
      {/* Header with gradient icon */}
      <div>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
            <ClipboardList className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
              Scorecard Tổng hợp
            </h1>
            <p className="text-muted-foreground mt-0.5">
              Bảng tóm tắt toàn bộ BSC với phương diện, mục tiêu và các chỉ số KPI
            </p>
          </div>
        </div>
      </div>

      <ScorecardSummaryTable />
    </div>
  );
}
