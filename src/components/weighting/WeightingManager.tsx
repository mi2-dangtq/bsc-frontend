'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, Save, CheckCircle, AlertCircle, Scale } from 'lucide-react';
import { perspectivesAPI, objectivesAPI, type Perspective, type Objective } from '@/lib/api';
import { toast } from 'sonner';

interface WeightedPerspective {
  id: number;
  name: string;
  color: string | null;
  weight: number;
  objectives: WeightedObjective[];
}

interface WeightedObjective {
  id: number;
  name: string;
  weight: number;
}

export function WeightingManager() {
  const [perspectives, setPerspectives] = useState<WeightedPerspective[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedPerspectiveId, setSelectedPerspectiveId] = useState<number | null>(null);

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [perspecsData, objectivesData] = await Promise.all([
        perspectivesAPI.getAll(),
        objectivesAPI.getAll(),
      ]);

      const mapped: WeightedPerspective[] = perspecsData.map((p: Perspective) => ({
        id: p.id,
        name: p.name,
        color: p.color,
        weight: p.weightDefault ? Number(p.weightDefault) : 25, // Default 25% each
        objectives: objectivesData
          .filter((o: Objective) => o.perspectiveId === p.id)
          .map((o: Objective) => ({
            id: o.id,
            name: o.name,
            weight: o.weight ? Number(o.weight) : 0,
          })),
      }));

      setPerspectives(mapped);
      if (mapped.length > 0 && !selectedPerspectiveId) {
        setSelectedPerspectiveId(mapped[0].id);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      toast.error('Lỗi kết nối server');
    } finally {
      setLoading(false);
    }
  }, [selectedPerspectiveId]);

  useEffect(() => {
    fetchData();
  }, []);

  // Calculate totals
  const perspectiveTotal = perspectives.reduce((sum, p) => sum + p.weight, 0);
  const isPerspectiveValid = Math.abs(perspectiveTotal - 100) < 0.01;

  const selectedPerspective = perspectives.find(p => p.id === selectedPerspectiveId);
  const objectiveTotal = selectedPerspective?.objectives.reduce((sum, o) => sum + o.weight, 0) ?? 0;
  const isObjectiveValid = selectedPerspective 
    ? Math.abs(objectiveTotal - selectedPerspective.weight) < 0.01 
    : true;

  // Handle perspective weight change
  const handlePerspectiveWeightChange = (id: number, weight: number) => {
    setPerspectives(perspectives.map(p => 
      p.id === id ? { ...p, weight } : p
    ));
  };

  // Handle objective weight change
  const handleObjectiveWeightChange = (perspectiveId: number, objectiveId: number, weight: number) => {
    setPerspectives(perspectives.map(p => {
      if (p.id === perspectiveId) {
        return {
          ...p,
          objectives: p.objectives.map(o => 
            o.id === objectiveId ? { ...o, weight } : o
          ),
        };
      }
      return p;
    }));
  };

  // Save weights
  const handleSave = async () => {
    if (!isPerspectiveValid) {
      toast.error('Tổng tỷ trọng phương diện phải = 100%');
      return;
    }

    setSaving(true);
    try {
      // Save perspective weights
      for (const p of perspectives) {
        await perspectivesAPI.updateWeight(p.id, p.weight);
      }

      // Save objective weights
      for (const p of perspectives) {
        for (const o of p.objectives) {
          await objectivesAPI.update(o.id, { weight: o.weight });
        }
      }

      toast.success('Đã lưu tỷ trọng');
    } catch (err) {
      console.error('Error saving weights:', err);
      toast.error('Không thể lưu tỷ trọng');
    } finally {
      setSaving(false);
    }
  };

  // Distribute equally
  const distributeEqually = (type: 'perspectives' | 'objectives') => {
    if (type === 'perspectives') {
      const equalWeight = 100 / perspectives.length;
      setPerspectives(perspectives.map(p => ({ ...p, weight: equalWeight })));
    } else if (selectedPerspective) {
      const objCount = selectedPerspective.objectives.length;
      if (objCount > 0) {
        const equalWeight = selectedPerspective.weight / objCount;
        setPerspectives(perspectives.map(p => {
          if (p.id === selectedPerspective.id) {
            return {
              ...p,
              objectives: p.objectives.map(o => ({ ...o, weight: equalWeight })),
            };
          }
          return p;
        }));
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2 text-muted-foreground">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>Đang tải dữ liệu...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with gradient icon */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg">
            <Scale className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
              Thiết lập Tỷ trọng
            </h1>
            <p className="text-muted-foreground mt-0.5">
              Phân bổ tỷ trọng cho các phương diện và mục tiêu
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving || !isPerspectiveValid} className="shadow-sm">
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Đang lưu...' : 'Lưu tỷ trọng'}
        </Button>
      </div>

      <Tabs defaultValue="perspectives" className="space-y-4">
        <TabsList>
          <TabsTrigger value="perspectives">
            <Scale className="h-4 w-4 mr-2" />
            Phương diện
          </TabsTrigger>
          <TabsTrigger value="objectives">
            Mục tiêu
          </TabsTrigger>
        </TabsList>

        {/* Perspectives Tab */}
        <TabsContent value="perspectives">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Tỷ trọng 4 Phương diện</CardTitle>
                  <CardDescription>Tổng = 100%</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => distributeEqually('perspectives')}>
                  Chia đều
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {perspectives.map((p) => (
                <div key={p.id} className="flex items-center gap-4">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: p.color || '#64748b' }}
                  />
                  <span className="w-40 font-medium">{p.name}</span>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={p.weight}
                    onChange={(e) => handlePerspectiveWeightChange(p.id, parseFloat(e.target.value) || 0)}
                    className="w-24"
                  />
                  <span className="text-muted-foreground">%</span>
                  <span className="text-sm text-muted-foreground">
                    ({p.objectives.length} mục tiêu)
                  </span>
                </div>
              ))}

              {/* Total */}
              <div className="flex items-center gap-4 pt-4 border-t">
                <div className="w-3 h-3" />
                <span className="w-40 font-bold">Tổng cộng</span>
                <div className="w-24 text-center">
                  <Badge variant={isPerspectiveValid ? 'default' : 'destructive'}>
                    {perspectiveTotal.toFixed(1)}%
                  </Badge>
                </div>
                {isPerspectiveValid ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-destructive" />
                )}
              </div>

              {!isPerspectiveValid && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Tổng tỷ trọng phải bằng 100%. Hiện tại: {perspectiveTotal.toFixed(1)}%
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Objectives Tab */}
        <TabsContent value="objectives">
          <div className="grid gap-4 md:grid-cols-4">
            {/* Perspective selector */}
            <Card className="md:col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Chọn phương diện</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {perspectives.map((p) => (
                  <Button
                    key={p.id}
                    variant={selectedPerspectiveId === p.id ? 'default' : 'outline'}
                    className="w-full justify-start"
                    onClick={() => setSelectedPerspectiveId(p.id)}
                  >
                    <div 
                      className="w-3 h-3 rounded-full mr-2" 
                      style={{ backgroundColor: p.color || '#64748b' }}
                    />
                    {p.name}
                    <Badge variant="secondary" className="ml-auto">
                      {p.weight}%
                    </Badge>
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Objectives weights */}
            <Card className="md:col-span-3">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Tỷ trọng Mục tiêu - {selectedPerspective?.name}</CardTitle>
                    <CardDescription>
                      Tổng = {selectedPerspective?.weight}% (tỷ trọng phương diện)
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => distributeEqually('objectives')}>
                    Chia đều
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedPerspective?.objectives.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Chưa có mục tiêu nào trong phương diện này
                  </p>
                ) : (
                  <>
                    {selectedPerspective?.objectives.map((o) => (
                      <div key={o.id} className="flex items-center gap-4">
                        <span className="flex-1 font-medium">{o.name}</span>
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          value={o.weight}
                          onChange={(e) => handleObjectiveWeightChange(
                            selectedPerspective.id,
                            o.id,
                            parseFloat(e.target.value) || 0
                          )}
                          className="w-24"
                        />
                        <span className="text-muted-foreground">%</span>
                      </div>
                    ))}

                    {/* Total */}
                    <div className="flex items-center gap-4 pt-4 border-t">
                      <span className="flex-1 font-bold">Tổng cộng</span>
                      <div className="w-24 text-center">
                        <Badge variant={isObjectiveValid ? 'default' : 'destructive'}>
                          {objectiveTotal.toFixed(1)}%
                        </Badge>
                      </div>
                      <span className="text-muted-foreground">/ {selectedPerspective?.weight}%</span>
                    </div>

                    {!isObjectiveValid && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Tổng tỷ trọng mục tiêu phải = {selectedPerspective?.weight}%. 
                          Hiện tại: {objectiveTotal.toFixed(1)}%
                        </AlertDescription>
                      </Alert>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
