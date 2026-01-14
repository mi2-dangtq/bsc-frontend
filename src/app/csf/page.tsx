import { FishboneCanvas } from '@/components/fishbone';

export default function CsfPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Phân rã CSF (Fishbone)</h1>
        <p className="text-muted-foreground">
          Phân rã mục tiêu chiến lược thành CSF và KPIs theo mô hình xương cá
        </p>
      </div>

      <FishboneCanvas />
    </div>
  );
}
