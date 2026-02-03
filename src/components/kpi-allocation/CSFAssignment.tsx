'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { 
  Link2, Users, Loader2, Search, AlertTriangle, 
  CheckCircle, Filter, ChevronDown 
} from 'lucide-react';
import { type Department } from '@/hooks/useDepartments';
import { toast } from 'sonner';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface CSF {
  id: number;
  content: string;
  objectiveId: number;
}

interface Objective {
  id: number;
  name: string;
}

interface CSFAssignmentProps {
  departments: (Department & { code: string | null })[];
}

export function CSFAssignment({ departments }: CSFAssignmentProps) {
  const [csfs, setCsfs] = useState<(CSF & { objectiveName?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [assignments, setAssignments] = useState<Record<number, string[]>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCSFs, setExpandedCSFs] = useState<Set<number>>(new Set());

  // Fetch CSFs from API
  useEffect(() => {
    const fetchCSFs = async () => {
      try {
        setLoading(true);
        const objRes = await fetch(`${API_URL}/objectives`);
        const objectives: Objective[] = objRes.ok ? await objRes.json() : [];

        const csfRes = await fetch(`${API_URL}/csf`);
        const csfData: CSF[] = csfRes.ok ? await csfRes.json() : [];

        const csfsWithObjectives = csfData.map((csf) => ({
          ...csf,
          objectiveName:
            objectives.find((o) => o.id === csf.objectiveId)?.name || 'Không xác định',
        }));

        setCsfs(csfsWithObjectives);

        // Initialize assignments and expand first 3
        const initialAssignments: Record<number, string[]> = {};
        const initialExpanded = new Set<number>();
        csfsWithObjectives.forEach((csf, index) => {
          initialAssignments[csf.id] = [];
          if (index < 3) initialExpanded.add(csf.id);
        });
        setAssignments(initialAssignments);
        setExpandedCSFs(initialExpanded);
      } catch (err) {
        console.error('Failed to fetch CSFs:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCSFs();
  }, []);

  const toggleAssignment = (csfId: number, deptId: string) => {
    setAssignments((prev) => {
      const current = prev[csfId] || [];
      if (current.includes(deptId)) {
        return { ...prev, [csfId]: current.filter((id) => id !== deptId) };
      } else {
        return { ...prev, [csfId]: [...current, deptId] };
      }
    });
  };

  const toggleExpanded = (csfId: number) => {
    setExpandedCSFs((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(csfId)) {
        newSet.delete(csfId);
      } else {
        newSet.add(csfId);
      }
      return newSet;
    });
  };

  const getAssignedDepts = (csfId: number) => {
    const deptIds = assignments[csfId] || [];
    return departments.filter((d) => deptIds.includes(d.id));
  };

  // Validation: CSF with multiple depts needs KPI for each
  const getValidationStatus = (csfId: number) => {
    const assignedCount = (assignments[csfId] || []).length;
    if (assignedCount === 0) return { status: 'unassigned', message: 'Chưa phân công' };
    if (assignedCount === 1) return { status: 'valid', message: 'Đã phân công' };
    return { 
      status: 'warning', 
      message: `${assignedCount} phòng ban - cần ${assignedCount} KPI riêng` 
    };
  };

  const handleSave = async () => {
    setIsSaving(true);
    // TODO: Implement API call
    await new Promise(r => setTimeout(r, 1000));
    toast.success('Đã lưu phân công CSF');
    setIsSaving(false);
  };

  // Filter CSFs by search
  const filteredCSFs = csfs.filter(csf => 
    searchQuery === '' || 
    csf.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    csf.objectiveName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Stats
  const assignedCount = Object.values(assignments).filter(a => a.length > 0).length;
  const warningCount = Object.values(assignments).filter(a => a.length > 1).length;

  if (loading) {
    return (
      <Card className="shadow-lg">
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-sm text-muted-foreground">Đang tải CSF...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (csfs.length === 0) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Phân công CSF cho Phòng ban
          </CardTitle>
          <CardDescription>
            Chưa có CSF nào. Vui lòng tạo CSF trước từ trang Phân rã Xương cá.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader className="border-b bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Link2 className="h-5 w-5" />
              Phân công CSF cho Phòng ban
            </CardTitle>
            <CardDescription>
              Gán trách nhiệm cho từng CSF. 
              <span className="text-amber-600 dark:text-amber-400 ml-1">
                Nếu CSF có nhiều phòng ban → cần ít nhất 1 KPI riêng cho mỗi phòng ban.
              </span>
            </CardDescription>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Badge variant="secondary" className="gap-1">
              <CheckCircle className="h-3 w-3" />
              {assignedCount}/{csfs.length} đã phân công
            </Badge>
            {warningCount > 0 && (
              <Badge variant="outline" className="gap-1 border-amber-500 text-amber-600">
                <AlertTriangle className="h-3 w-3" />
                {warningCount} cần KPI riêng
              </Badge>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="mt-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Tìm kiếm CSF hoặc mục tiêu..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="divide-y">
          {filteredCSFs.map((csf) => {
            const assignedDepts = getAssignedDepts(csf.id);
            const validation = getValidationStatus(csf.id);
            const isExpanded = expandedCSFs.has(csf.id);

            return (
              <Collapsible 
                key={csf.id} 
                open={isExpanded}
                onOpenChange={() => toggleExpanded(csf.id)}
              >
                <CollapsibleTrigger className="w-full">
                  <div className={`flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors cursor-pointer ${
                    validation.status === 'warning' ? 'bg-amber-50/50 dark:bg-amber-950/10' : ''
                  }`}>
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${
                        isExpanded ? 'rotate-180' : ''
                      }`} />
                      <div className="text-left min-w-0">
                        <h4 className="font-medium truncate">{csf.content}</h4>
                        <p className="text-sm text-muted-foreground truncate">
                          {csf.objectiveName}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 shrink-0">
                      {/* Assigned departments badges */}
                      <div className="hidden md:flex items-center gap-1">
                        {assignedDepts.slice(0, 3).map((dept) => (
                          <Badge 
                            key={dept.id} 
                            variant="secondary" 
                            className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                          >
                            {dept.code || dept.name.slice(0, 3).toUpperCase()}
                          </Badge>
                        ))}
                        {assignedDepts.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{assignedDepts.length - 3}
                          </Badge>
                        )}
                      </div>

                      {/* Count badge */}
                      <Badge 
                        variant={validation.status === 'warning' ? 'outline' : 'secondary'}
                        className={`gap-1 ${
                          validation.status === 'warning' 
                            ? 'border-amber-500 text-amber-600' 
                            : validation.status === 'valid'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
                              : ''
                        }`}
                      >
                        <Users className="h-3 w-3" />
                        {assignedDepts.length}
                      </Badge>
                    </div>
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="px-4 pb-4 pt-2 bg-slate-50/50 dark:bg-slate-900/30">
                    {/* Department checkboxes */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
                      {departments.map((dept) => {
                        const isAssigned = (assignments[csf.id] || []).includes(dept.id);
                        return (
                          <label
                            key={dept.id}
                            className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer border transition-all ${
                              isAssigned
                                ? 'bg-blue-50 border-blue-300 dark:bg-blue-950/30 dark:border-blue-700'
                                : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            <Checkbox
                              checked={isAssigned}
                              onCheckedChange={() => toggleAssignment(csf.id, dept.id)}
                            />
                            <div className="flex items-center gap-2 min-w-0">
                              <Badge 
                                variant="outline" 
                                className={`text-xs shrink-0 ${
                                  isAssigned ? 'border-blue-400 text-blue-700' : ''
                                }`}
                              >
                                {dept.code || dept.name.substring(0, 3).toUpperCase()}
                              </Badge>
                              <span className="text-sm truncate">{dept.name}</span>
                            </div>
                          </label>
                        );
                      })}
                    </div>

                    {/* Warning for multiple depts */}
                    {validation.status === 'warning' && (
                      <div className="flex items-center gap-2 mt-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                        <p className="text-sm text-amber-700 dark:text-amber-300">
                          <strong>Lưu ý:</strong> CSF này có {assignedDepts.length} phòng ban phụ trách. 
                          Theo quy tắc, mỗi phòng ban cần có ít nhất 1 KPI riêng để đo lường.
                        </p>
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>

        {filteredCSFs.length === 0 && searchQuery && (
          <div className="p-8 text-center text-muted-foreground">
            <Filter className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Không tìm thấy CSF phù hợp với "{searchQuery}"</p>
          </div>
        )}
      </CardContent>

      {/* Footer */}
      <div className="p-4 border-t bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {assignedCount} CSF đã được phân công • {warningCount} cần chú ý
        </p>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : null}
          Lưu phân công
        </Button>
      </div>
    </Card>
  );
}
