'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, GitBranch, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import type { Objective } from './ObjectivesManager';

interface ObjectiveCardProps {
  objective: Objective;
}

export function ObjectiveCard({ objective }: ObjectiveCardProps) {
  return (
    <Card
      className="hover:shadow-md transition-shadow border-l-4"
      style={{ borderLeftColor: objective.color }}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              {objective.code && (
                <Badge
                  variant="outline"
                  className="text-xs mb-1"
                  style={{ borderColor: objective.color, color: objective.color }}
                >
                  {objective.code}
                </Badge>
              )}
              <h4 className="font-medium text-sm leading-tight line-clamp-2">
                {objective.name}
              </h4>
            </div>
            {objective.weight !== undefined && objective.weight > 0 && (
              <Badge variant="secondary" className="shrink-0">
                {objective.weight}%
              </Badge>
            )}
          </div>

          {/* Description */}
          {objective.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {objective.description}
            </p>
          )}

          {/* Stats */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <GitBranch className="h-3 w-3" />
              {objective.csfCount || 0} CSF
            </span>
            <span className="flex items-center gap-1">
              <BarChart3 className="h-3 w-3" />
              {objective.kpiCount || 0} KPI
            </span>
          </div>

          {/* Actions */}
          <div className="pt-2 border-t">
            <Button variant="ghost" size="sm" className="w-full text-xs" asChild>
              <Link href={`/csf?objective=${objective.id}`}>
                Phân rã CSF/KPI
                <ArrowRight className="h-3 w-3 ml-1" />
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
