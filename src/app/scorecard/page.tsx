import { ScorecardSummaryTable } from '@/components/scorecard/ScorecardSummaryTable';

export const metadata = {
  title: 'Scorecard Tổng hợp | BSC/KPI System',
  description: 'Bảng tóm tắt toàn bộ BSC với phương diện, mục tiêu và KPI',
};

export default function ScorecardPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Scorecard Tổng hợp</h1>
        <p className="text-muted-foreground">
          Bảng tóm tắt toàn bộ BSC với phương diện, mục tiêu và các chỉ số KPI
        </p>
      </div>

      <ScorecardSummaryTable />
    </div>
  );
}
