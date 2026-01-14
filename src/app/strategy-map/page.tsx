import { StrategyMapCanvas } from '@/components/strategy-map';

export default function StrategyMapPage() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Bản đồ Chiến lược</h1>
        <p className="text-muted-foreground mt-1">
          Vẽ mối quan hệ nhân quả giữa các mục tiêu trên 4 phương diện BSC
        </p>
      </div>

      <StrategyMapCanvas year={currentYear} />


    </div>
  );
}
