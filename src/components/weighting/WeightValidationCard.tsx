'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { CheckCircle, AlertCircle, ChevronDown, RefreshCw, Scale } from 'lucide-react';
import { weightingAPI, type WeightValidationStatus, type PerspectiveWeightStatus } from '@/lib/api';
import { Button } from '@/components/ui/button';

interface PerspectiveRowProps {
  perspective: PerspectiveWeightStatus;
}

function PerspectiveRow({ perspective }: PerspectiveRowProps) {
  const [open, setOpen] = useState(false);
  const hasIssues = !perspective.isValid || perspective.objectives.some(o => !o.isValid);
  
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
          <div className="flex items-center gap-3">
            <div 
              className="w-3 h-3 rounded-full shrink-0" 
              style={{ backgroundColor: perspective.color || '#64748b' }} 
            />
            <span className="font-medium">{perspective.name}</span>
            {hasIssues ? (
              <AlertCircle className="h-4 w-4 text-amber-500" />
            ) : (
              <CheckCircle className="h-4 w-4 text-green-500" />
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-right">
              <span className={!perspective.isValid ? 'text-amber-600 font-medium' : ''}>
                {perspective.objectivesSum}%
              </span>
              <span className="text-muted-foreground"> / {perspective.weight}%</span>
            </div>
            <Badge variant={perspective.objectives.length > 0 ? 'secondary' : 'outline'}>
              {perspective.objectives.length} mục tiêu
            </Badge>
            <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
          </div>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="pl-6 pr-3 pb-3 space-y-2">
          {perspective.objectives.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">Chưa có mục tiêu nào</p>
          ) : (
            perspective.objectives.map(obj => (
              <div 
                key={obj.id} 
                className={`flex items-center justify-between p-2 rounded text-sm ${
                  !obj.isValid ? 'bg-amber-50 border border-amber-200' : 'bg-muted/30'
                }`}
              >
                <div className="flex items-center gap-2">
                  {obj.isValid ? (
                    <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                  )}
                  <span>{obj.code && <span className="text-muted-foreground">{obj.code}: </span>}{obj.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`${!obj.isValid ? 'text-amber-600 font-medium' : 'text-muted-foreground'}`}>
                    KPIs: {obj.kpisSum}% / {obj.weight}%
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {obj.kpis.length} KPI
                  </Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function WeightValidationCard() {
  const [status, setStatus] = useState<WeightValidationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await weightingAPI.getStatus();
      setStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Đang kiểm tra tỷ trọng...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="py-8 text-center">
          <p className="text-destructive">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchStatus} className="mt-4">
            Thử lại
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!status) return null;

  return (
    <Card className={status.isValid ? 'border-green-200' : 'border-amber-200'}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Scale className="h-5 w-5" />
            Kiểm tra Tỷ trọng
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={fetchStatus}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            {status.isValid ? (
              <Badge className="bg-green-500 hover:bg-green-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                Hợp lệ
              </Badge>
            ) : (
              <Badge variant="destructive" className="bg-amber-500 hover:bg-amber-600">
                <AlertCircle className="h-3 w-3 mr-1" />
                Cần điều chỉnh
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-1">
        {/* Perspectives total */}
        <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg mb-3">
          <span className="text-sm font-medium">Tổng 4 phương diện</span>
          <span className={`text-sm font-medium ${
            status.isPerspectivesTotalValid ? 'text-green-600' : 'text-amber-600'
          }`}>
            {status.totalPerspectivesWeight}% / 100%
          </span>
        </div>

        {/* Perspectives breakdown */}
        <div className="divide-y">
          {status.perspectives.map(p => (
            <PerspectiveRow key={p.id} perspective={p} />
          ))}
        </div>

        {!status.isValid && (
          <p className="text-xs text-muted-foreground mt-3 pt-3 border-t">
            💡 <strong>Lưu ý:</strong> Tổng tỷ trọng Mục tiêu phải bằng tỷ trọng Phương diện. 
            Tổng tỷ trọng KPI phải bằng tỷ trọng Mục tiêu.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
