import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Construction } from 'lucide-react';
import Link from 'next/link';

export default function ScorecardReportPage() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Construction className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle>Scorecard tổng hợp</CardTitle>
          <CardDescription>Báo cáo điểm số BSC toàn công ty</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Trang này đang được phát triển. Vui lòng quay lại sau!
          </p>
          <Button asChild>
            <Link href="/">Về trang chủ</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
