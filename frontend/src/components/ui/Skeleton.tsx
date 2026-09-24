'use client';

import React from 'react';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'red';
}

export function Skeleton({ className = '', variant = 'default', ...props }: SkeletonProps) {
  const shimmerClass = variant === 'red' ? 'animate-shimmer-red bg-rose-100/70' : 'animate-shimmer bg-slate-200/80';
  return (
    <div
      className={`rounded-md ${shimmerClass} ${className}`}
      {...props}
    />
  );
}

/**
 * Metric / KPI Card Skeleton
 */
export function CardSkeleton({ count = 4, className = '' }: { count?: number; className?: string }) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between h-[126px]"
        >
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-28" />
            <Skeleton variant="red" className="h-8 w-8 rounded-xl" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Table Skeleton with Header, Search bar, and Rows
 */
export function TableSkeleton({
  rows = 5,
  columns = 5,
  withToolbar = true,
  className = '',
}: {
  rows?: number;
  columns?: number;
  withToolbar?: boolean;
  className?: string;
}) {
  return (
    <div className={`space-y-4 ${className}`}>
      {withToolbar && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Skeleton className="h-10 w-full sm:w-72 rounded-xl" />
            <Skeleton className="h-10 w-24 rounded-xl" />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Skeleton className="h-10 w-28 rounded-xl" />
            <Skeleton variant="red" className="h-10 w-32 rounded-xl" />
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
        {/* Table Header Bar */}
        <div className="border-b border-slate-200/80 bg-slate-50/75 px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-6 w-full">
            <Skeleton className="h-4 w-6 rounded" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-28 hidden md:block" />
            <Skeleton className="h-4 w-24 hidden lg:block" />
            <Skeleton className="h-4 w-20 hidden lg:block" />
            <div className="ml-auto">
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        </div>

        {/* Table Rows */}
        <div className="divide-y divide-slate-100">
          {Array.from({ length: rows }).map((_, rIdx) => (
            <div
              key={rIdx}
              className="px-6 py-4 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4 flex-1">
                <Skeleton className="h-4 w-4 rounded shrink-0" />
                <Skeleton variant="red" className="h-10 w-10 rounded-full shrink-0" />
                <div className="space-y-1.5 flex-1 max-w-xs">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
              <Skeleton className="h-4 w-28 hidden md:block" />
              <Skeleton className="h-6 w-20 rounded-full hidden lg:block" />
              <Skeleton className="h-4 w-20 hidden sm:block" />
              <div className="flex items-center gap-2 shrink-0">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <Skeleton className="h-8 w-8 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Kanban Pipeline Skeleton (for Admissions / CRM)
 */
export function KanbanSkeleton({ columns = 4, className = '' }: { columns?: number; className?: string }) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      {Array.from({ length: columns }).map((_, colIdx) => (
        <div
          key={colIdx}
          className="bg-slate-50/90 border border-slate-200/80 rounded-2xl p-4 flex flex-col gap-3 min-h-[420px]"
        >
          {/* Column Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
            <Skeleton className="h-4 w-24" />
            <Skeleton variant="red" className="h-5 w-7 rounded-full" />
          </div>

          {/* Cards inside column */}
          {Array.from({ length: 3 }).map((_, cardIdx) => (
            <div
              key={cardIdx}
              className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-16 rounded-md" />
                <Skeleton className="h-3 w-12" />
              </div>
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <Skeleton className="h-6 w-20 rounded-md" />
                <Skeleton className="h-7 w-7 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Report / Dashboard Overview Skeleton
 */
export function ReportSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`w-full space-y-6 ${className}`}>
      {/* Header Banner Skeleton */}
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-[#450a0a]/80 via-[#7f1d1d]/80 to-[#991b1b]/80 border border-red-900/40 shadow-xl space-y-4">
        <Skeleton variant="red" className="h-6 w-40 rounded-full bg-rose-200/30" />
        <Skeleton variant="red" className="h-8 w-72 bg-rose-200/30" />
        <Skeleton variant="red" className="h-4 w-96 max-w-full bg-rose-200/20" />
      </div>

      {/* 4 KPI Cards */}
      <CardSkeleton count={4} />

      {/* 2 Split Chart / Table Blocks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-8 w-24 rounded-lg" />
          </div>
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-8 w-24 rounded-lg" />
          </div>
          <div className="space-y-3 pt-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 border border-slate-100 rounded-xl">
                <div className="space-y-1 flex-1">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
                <Skeleton className="h-6 w-20 rounded-md" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
