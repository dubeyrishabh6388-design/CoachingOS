import React from 'react';
import { CardSkeleton, TableSkeleton, Skeleton } from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <div className="w-full space-y-6 animate-in fade-in duration-150">
      {/* Page Title & Actions Skeleton Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56 rounded-xl" />
          <Skeleton className="h-4 w-80 rounded-lg max-w-full" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-28 rounded-xl" />
          <Skeleton variant="red" className="h-10 w-36 rounded-xl" />
        </div>
      </div>

      {/* KPI Cards Skeleton */}
      <CardSkeleton count={4} />

      {/* Main Table / Content Skeleton */}
      <TableSkeleton rows={6} />
    </div>
  );
}
