'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, AlertCircle, Star, Minus, 
  TrendingUp, TrendingDown, AlertTriangle 
} from 'lucide-react';
import type { DepartmentWeight } from './KPIAllocationManager';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Department {
  id: string;
  name: string;
  code: string | null;
  primaryPerspectives: number[];
}

interface Perspective {
  id: number;
  name: string;
  color: string;
}

interface AllocationMatrixProps {
  departments: Department[];
  perspectives: Perspective[];
  companyWeights: Record<number, number>;
  departmentWeights: DepartmentWeight[];
  onUpdateWeight: (departmentId: string, perspectiveId: number, value: number) => void;
}

// Get status icon and color based on validation
function getWeightStatus(
  weight: number, 
  isPrimary: boolean, 
  isDualPrimary: boolean,
  dualPrimaryTotal?: number
) {
  if (isPrimary && !isDualPrimary && weight < 50) {
    return { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50' };
  }
  if (isDualPrimary && dualPrimaryTotal !== undefined && dualPrimaryTotal < 70) {
    return { icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-50' };
  }
  if (isPrimary && weight >= 50) {
    return { icon: Star, color: 'text-yellow-500', bg: 'bg-yellow-50' };
  }
  return null;
}

export function AllocationMatrix({
  departments,
  perspectives,
  companyWeights,
  departmentWeights,
  onUpdateWeight,
}: AllocationMatrixProps) {
  // Calculate averages
  const averages = perspectives.map(p => {
    const avg = departmentWeights.reduce((sum, dw) => sum + (dw.weights[p.id] || 0), 0) / 
                (departmentWeights.length || 1);
    const diff = avg - (companyWeights[p.id] || 25);
    return { perspectiveId: p.id, avg, diff };
  });

  return (
    <Card className="shadow-lg">
      <CardHeader className="border-b bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Ma trận Tỷ trọng Phòng ban</CardTitle>
            <CardDescription>
              Phân bổ tỷ trọng 4 phương diện BSC cho từng phòng ban.
              <span className="inline-flex items-center gap-1 ml-2">
                <Star className="h-3 w-3 text-yellow-500" /> = Phương diện chính
              </span>
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <TooltipProvider>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50/80 dark:bg-slate-900/80">
                  <th className="text-left py-4 px-5 font-semibold sticky left-0 bg-slate-50/80 dark:bg-slate-900/80 z-10">
                    Phòng ban
                  </th>
                  {perspectives.map((p) => (
                    <th key={p.id} className="text-center py-4 px-4 font-semibold min-w-[140px]">
                      <div className="flex flex-col items-center gap-2">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full shadow-sm"
                            style={{ backgroundColor: p.color }}
                          />
                          <span>{p.name}</span>
                        </div>
                        <Badge 
                          variant="secondary" 
                          className="text-xs font-normal bg-white dark:bg-slate-800 shadow-sm"
                        >
                          Công ty: {companyWeights[p.id]}%
                        </Badge>
                      </div>
                    </th>
                  ))}
                  <th className="text-center py-4 px-4 font-semibold min-w-[100px]">Tổng</th>
                  <th className="text-center py-4 px-4 font-semibold min-w-[80px]">Status</th>
                </tr>
              </thead>
              <tbody>
                {departments.map((dept) => {
                  const dw = departmentWeights.find((d) => d.departmentId === dept.id);
                  const total = dw ? Object.values(dw.weights).reduce((a, b) => a + b, 0) : 0;
                  const isValidTotal = total === 100;
                  
                  // Calculate dual primary total
                  const isDualPrimary = dept.primaryPerspectives.length === 2;
                  const dualPrimaryTotal = isDualPrimary 
                    ? dept.primaryPerspectives.reduce((sum, pid) => sum + (dw?.weights[pid] || 0), 0)
                    : undefined;
                  
                  // Check if single primary is valid
                  const singlePrimaryValid = !isDualPrimary && 
                    (dw?.weights[dept.primaryPerspectives[0]] || 0) >= 50;
                  
                  // Check if dual primary is valid  
                  const dualPrimaryValid = isDualPrimary && (dualPrimaryTotal || 0) >= 70;
                  
                  const isFullyValid = isValidTotal && (singlePrimaryValid || dualPrimaryValid);

                  return (
                    <tr 
                      key={dept.id} 
                      className={`border-b transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-900/50 ${
                        !isFullyValid ? 'bg-red-50/30 dark:bg-red-950/10' : ''
                      }`}
                    >
                      <td className="py-4 px-5 sticky left-0 bg-white dark:bg-slate-950 z-10">
                        <div className="flex items-center gap-3">
                          <Badge 
                            variant="outline" 
                            className="font-mono text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-800"
                          >
                            {dept.code || dept.name.slice(0, 3).toUpperCase()}
                          </Badge>
                          <div>
                            <span className="font-medium">{dept.name}</span>
                            {isDualPrimary && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                2 phương diện chính
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      
                      {perspectives.map((p) => {
                        const weight = dw?.weights[p.id] || 0;
                        const isPrimary = dept.primaryPerspectives.includes(p.id);
                        const status = getWeightStatus(weight, isPrimary, isDualPrimary, dualPrimaryTotal);
                        
                        return (
                          <td key={p.id} className="py-4 px-4 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <div className="relative">
                                <Input
                                  type="number"
                                  min={0}
                                  max={100}
                                  value={weight}
                                  onChange={(e) =>
                                    onUpdateWeight(dept.id, p.id, parseInt(e.target.value) || 0)
                                  }
                                  className={`w-20 text-center font-medium transition-all ${
                                    isPrimary 
                                      ? 'border-2 border-yellow-400 bg-yellow-50/50 dark:bg-yellow-950/20' 
                                      : 'border-slate-200'
                                  } ${status?.bg || ''}`}
                                />
                                {isPrimary && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Star className="absolute -top-1.5 -right-1.5 h-4 w-4 text-yellow-500 fill-yellow-400" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Phương diện chính {isDualPrimary ? `(1 trong 2, cần tổng ≥70%)` : `(cần ≥50%)`}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                              </div>
                              {status && !isPrimary && (
                                <status.icon className={`h-4 w-4 ${status.color}`} />
                              )}
                            </div>
                          </td>
                        );
                      })}
                      
                      <td className="py-4 px-4 text-center">
                        <Badge 
                          variant={isValidTotal ? 'default' : 'destructive'}
                          className={`text-sm font-semibold ${
                            isValidTotal ? 'bg-emerald-500 hover:bg-emerald-600' : ''
                          }`}
                        >
                          {total}%
                        </Badge>
                      </td>
                      
                      <td className="py-4 px-4 text-center">
                        {isFullyValid ? (
                          <div className="flex justify-center">
                            <div className="p-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/50">
                              <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                          </div>
                        ) : (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex justify-center cursor-help">
                                <div className="p-1.5 rounded-full bg-red-100 dark:bg-red-900/50">
                                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                                </div>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                {!isValidTotal && `Tổng = ${total}% (cần 100%)`}
                                {!isValidTotal && !singlePrimaryValid && !dualPrimaryValid && '. '}
                                {!singlePrimaryValid && !isDualPrimary && `Phương diện chính < 50%`}
                                {!dualPrimaryValid && isDualPrimary && `Tổng 2 PD chính = ${dualPrimaryTotal}% (cần ≥70%)`}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              
              {/* Footer: Average row */}
              <tfoot>
                <tr className="bg-slate-100/80 dark:bg-slate-800/80 font-medium">
                  <td className="py-4 px-5 sticky left-0 bg-slate-100/80 dark:bg-slate-800/80 z-10">
                    <div className="flex items-center gap-2">
                      <Minus className="h-4 w-4 text-muted-foreground" />
                      <span>Trung bình phòng ban</span>
                    </div>
                  </td>
                  {averages.map((a) => {
                    const isBalanced = Math.abs(a.diff) <= 5;
                    return (
                      <td key={a.perspectiveId} className="py-4 px-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-base font-bold">{a.avg.toFixed(1)}%</span>
                          <div className={`flex items-center gap-1 text-xs ${
                            isBalanced ? 'text-emerald-600' : 'text-amber-600'
                          }`}>
                            {a.diff > 0 ? (
                              <TrendingUp className="h-3 w-3" />
                            ) : a.diff < 0 ? (
                              <TrendingDown className="h-3 w-3" />
                            ) : null}
                            <span>{a.diff > 0 ? '+' : ''}{a.diff.toFixed(1)}%</span>
                          </div>
                        </div>
                      </td>
                    );
                  })}
                  <td></td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
