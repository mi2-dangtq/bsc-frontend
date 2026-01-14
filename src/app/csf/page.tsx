import { FishboneCanvas } from '@/components/fishbone';
import { GitBranchPlus } from 'lucide-react';

export default function CsfPage() {
  return (
    <div className="space-y-6">
      {/* Header with gradient */}
      <div>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
            <GitBranchPlus className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
              Phân rã CSF (Fishbone)
            </h1>
            <p className="text-muted-foreground mt-0.5">
              Phân rã mục tiêu chiến lược thành CSF và KPIs theo mô hình xương cá
            </p>
          </div>
        </div>
      </div>

      <FishboneCanvas />
    </div>
  );
}
