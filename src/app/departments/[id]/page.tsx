'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Scale, BarChart3, Building2 } from 'lucide-react';
import { DepartmentWeightEditor } from '@/components/departments/DepartmentWeightEditor';
import { DepartmentScorecard } from '@/components/departments/DepartmentScorecard';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Department {
  id: string;
  name: string;
  code: string | null;
  parentId: string | null;
  headUserId: string | null;
  isActive: boolean;
  perspective: {
    id: number;
    name: string;
    color: string | null;
  } | null;
}

export default function DepartmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const departmentId = params.id as string;

  const [department, setDepartment] = useState<Department | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('weights');

  useEffect(() => {
    const fetchDepartment = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/departments/${departmentId}`);
        if (!res.ok) throw new Error('Failed to fetch department');
        const data = await res.json();
        setDepartment(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (departmentId) {
      fetchDepartment();
    }
  }, [departmentId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!department) {
    return (
      <div className="text-center py-12">
        <Building2 className="h-12 w-12 mx-auto text-slate-300 mb-3" />
        <p className="text-muted-foreground">Không tìm thấy phòng ban</p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
              {department.name}
            </h1>
            <p className="text-muted-foreground">
              {department.perspective?.name
                ? `Phương diện chính: ${department.perspective.name}`
                : 'Chưa thiết lập phương diện chính'}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="weights" className="gap-2">
            <Scale className="h-4 w-4" />
            Tỷ trọng
          </TabsTrigger>
          <TabsTrigger value="scorecard" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Scorecard
          </TabsTrigger>
        </TabsList>

        <TabsContent value="weights">
          <DepartmentWeightEditor
            departmentId={department.id}
            departmentName={department.name}
          />
        </TabsContent>

        <TabsContent value="scorecard">
          <DepartmentScorecard
            departmentId={department.id}
            departmentName={department.name}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
