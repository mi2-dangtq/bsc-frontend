import { WeightingManager } from '@/components/weighting';
import { WeightValidationCard } from '@/components/weighting/WeightValidationCard';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* Weight Validation Status */}
      <WeightValidationCard />
      
      {/* Weight Management */}
      <WeightingManager />
    </div>
  );
}
