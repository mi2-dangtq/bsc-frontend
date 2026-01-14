import { StrategyMapCanvas } from '@/components/strategy-map';
import { Map } from 'lucide-react';

export default function StrategyMapPage() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="space-y-6">
      {/* Header with gradient */}
      <div>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 shadow-lg">
            <Map className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
              Bản đồ Chiến lược
            </h1>
            <p className="text-muted-foreground mt-0.5">
              Vẽ mối quan hệ nhân quả giữa các mục tiêu trên 4 phương diện BSC
            </p>
          </div>
        </div>
      </div>

      <StrategyMapCanvas year={currentYear} />
    </div>
  );
}
