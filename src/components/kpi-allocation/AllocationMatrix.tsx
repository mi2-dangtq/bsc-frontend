'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle } from 'lucide-react';
import type { DepartmentWeight } from './KPIAllocationManager';

interface Department {
  id: string;
  name: string;
  code: string | null;
  primaryPerspective: number;
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

export function AllocationMatrix({
  departments,
  perspectives,
  companyWeights,
  departmentWeights,
  onUpdateWeight,
}: AllocationMatrixProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ma trận Tỷ trọng Phòng ban</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-medium">Phòng ban</th>
                {perspectives.map((p) => (
                  <th key={p.id} className="text-center py-3 px-4 font-medium min-w-[120px]">
                    <div className="flex flex-col items-center gap-1">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: p.color }}
                      />
                      <span>{p.name}</span>
                      <Badge variant="outline" className="text-xs">
                        Công ty: {companyWeights[p.id]}%
                      </Badge>
                    </div>
                  </th>
                ))}
                <th className="text-center py-3 px-4 font-medium">Tổng</th>
                <th className="text-center py-3 px-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {departments.map((dept) => {
                const dw = departmentWeights.find((d) => d.departmentId === dept.id);
                const total = dw
                  ? Object.values(dw.weights).reduce((a, b) => a + b, 0)
                  : 0;
                const isValid = total === 100;
                const primaryWeight = dw?.weights[dept.primaryPerspective] || 0;
                const primaryValid = primaryWeight >= 50;

                return (
                  <tr key={dept.id} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{dept.code || dept.name.slice(0, 3).toUpperCase()}</Badge>
                        <span className="font-medium">{dept.name}</span>
                      </div>
                    </td>
                    {perspectives.map((p) => {
                      const weight = dw?.weights[p.id] || 0;
                      const isPrimary = p.id === dept.primaryPerspective;
                      return (
                        <td key={p.id} className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Input
                              type="number"
                              min={0}
                              max={100}
                              value={weight}
                              onChange={(e) =>
                                onUpdateWeight(dept.id, p.id, parseInt(e.target.value) || 0)
                              }
                              className={`w-16 text-center ${isPrimary ? 'border-primary' : ''}`}
                            />
                            <span className="text-muted-foreground">%</span>
                          </div>
                          {isPrimary && (
                            <div className="text-xs text-muted-foreground mt-1">
                              (Chính)
                            </div>
                          )}
                        </td>
                      );
                    })}
                    <td className="py-3 px-4 text-center">
                      <Badge variant={isValid ? 'default' : 'destructive'}>
                        {total}%
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {isValid && primaryValid ? (
                        <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-amber-500 mx-auto" />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {/* Footer: Average row */}
            <tfoot>
              <tr className="bg-muted/50">
                <td className="py-3 px-4 font-medium">Trung bình</td>
                {perspectives.map((p) => {
                  const avg =
                    departmentWeights.reduce(
                      (sum, dw) => sum + (dw.weights[p.id] || 0),
                      0
                    ) / departmentWeights.length;
                  const diff = avg - companyWeights[p.id];
                  const isBalanced = Math.abs(diff) <= 5;
                  return (
                    <td key={p.id} className="py-3 px-4 text-center">
                      <div className="font-medium">{avg.toFixed(1)}%</div>
                      <div
                        className={`text-xs ${isBalanced ? 'text-green-600' : 'text-amber-600'}`}
                      >
                        {diff > 0 ? '+' : ''}
                        {diff.toFixed(1)}%
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
      </CardContent>
    </Card>
  );
}
