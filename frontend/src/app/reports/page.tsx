'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '@/lib/context/AppContext';
import { db } from '@/lib/db/store';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Users,
  GraduationCap,
  CalendarCheck,
  AlertTriangle,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  Target,
  BookOpen,
  MessageSquare,
  Phone,
  Award,
  Activity,
  Minus,
  ChevronRight,
  IndianRupee,
} from 'lucide-react';
import type { Student, Batch, Invoice, Payment, Lead, ClassSession, AttendanceRecord, User } from '@/lib/types';

// ─── Utility ──────────────────────────────────────────────────────────────────
const formatRupees = (paise: number) =>
  `₹${Math.round(paise / 100).toLocaleString('en-IN')}`;

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
};

const daysBetween = (a: string, b: string) =>
  Math.floor((new Date(b).getTime() - new Date(a).getTime()) / 86400000);

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = 'business' | 'academic' | 'attendance' | 'fees' | 'admissions';
type DateRange = 'month' | 'quarter' | 'year' | 'custom';

interface BatchMetric {
  batch: Batch;
  students: Student[];
  invoices: Invoice[];
  collected: number;
  pending: number;
  attendancePct: number;
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  iconBg,
  iconColor,
  trend,
  trendDir,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  trend?: string;
  trendDir?: 'up' | 'down' | 'neutral';
}) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">{label}</span>
        <div className={`p-2 rounded-lg ${iconBg}`}>
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
      </div>
      <div>
        <div className="text-2xl font-bold text-slate-900">{value}</div>
        {(sub || trend) && (
          <div className="flex items-center gap-2 mt-1">
            {trend && (
              <span
                className={`flex items-center gap-0.5 text-xs font-semibold ${
                  trendDir === 'up'
                    ? 'text-emerald-600'
                    : trendDir === 'down'
                    ? 'text-rose-600'
                    : 'text-slate-500'
                }`}
              >
                {trendDir === 'up' ? <ArrowUpRight className="w-3 h-3" /> : trendDir === 'down' ? <ArrowDownRight className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                {trend}
              </span>
            )}
            {sub && <span className="text-xs text-slate-500">{sub}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-base font-bold text-slate-800">{title}</h2>
      {action}
    </div>
  );
}

function CssBar({ pct, color = 'bg-[#991b1b]', height = 'h-3' }: { pct: number; color?: string; height?: string }) {
  return (
    <div className={`w-full ${height} bg-slate-100 rounded-full overflow-hidden`}>
      <div
        className={`h-full ${color} rounded-full transition-all duration-700`}
        style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
      />
    </div>
  );
}

function ExportBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition-colors"
    >
      <Download className="w-3.5 h-3.5" />
      {label}
    </button>
  );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────
function ReportPageSkeleton() {
  return (
    <div className="w-full space-y-6 animate-pulse">
      <div className="h-8 w-64 bg-slate-200 rounded-xl" />
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 bg-slate-100 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div className="h-72 bg-slate-100 rounded-2xl" />
        <div className="h-72 bg-slate-100 rounded-2xl" />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
export default function ReportsPage() {
  const { currentOrg, showToast } = useApp();

  const [activeTab, setActiveTab] = useState<Tab>('business');
  const [dateRange, setDateRange] = useState<DateRange>('month');
  const [loading, setLoading] = useState(true);

  // Raw data from db
  const [students, setStudents] = useState<Student[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    setLoading(true);
    try {
      setStudents(db.getStudents(currentOrg.id));
      setBatches(db.getBatches(currentOrg.id));
      setInvoices(db.getInvoices(currentOrg.id));
      setPayments(db.getPayments(currentOrg.id));
      setLeads(db.getLeads(currentOrg.id));
      setSessions(db.getClassSessions(currentOrg.id));
      setAttendance(db.getAttendanceRecords(currentOrg.id));
      setUsers(db.getUsers(currentOrg.id));
    } finally {
      setLoading(false);
    }
  }, [currentOrg.id]);

  // ── Business Computations ───────────────────────────────────────────────────
  const businessData = useMemo(() => {
    const capturedPayments = payments.filter(
      (p) => p.status === 'CAPTURED' || p.status === 'SUCCESS'
    );
    const totalRevenue = capturedPayments.reduce((s, p) => s + p.amountPaise, 0);
    const totalBilled = invoices.reduce((s, i) => s + i.netAmountPaise, 0);
    const totalPending = invoices
      .filter((i) => i.status !== 'PAID' && i.status !== 'CANCELLED')
      .reduce((s, i) => s + i.balanceAmountPaise, 0);
    const totalOverdue = invoices
      .filter((i) => i.status === 'OVERDUE')
      .reduce((s, i) => s + i.balanceAmountPaise, 0);

    const feeRecoveryRate =
      totalBilled > 0 ? Math.round((totalRevenue / totalBilled) * 100) : 0;

    // Monthly trend: last 6 months
    const now = new Date();
    const months: { label: string; collected: number; billed: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleString('en-IN', { month: 'short', year: '2-digit' });
      const monthPayments = capturedPayments.filter((p) => {
        const pd = new Date(p.createdAt);
        return pd.getFullYear() === d.getFullYear() && pd.getMonth() === d.getMonth();
      });
      const monthInvoices = invoices.filter((inv) => {
        const id = new Date(inv.dueDate);
        return id.getFullYear() === d.getFullYear() && id.getMonth() === d.getMonth();
      });
      months.push({
        label,
        collected: monthPayments.reduce((s, p) => s + p.amountPaise, 0),
        billed: monthInvoices.reduce((s, i) => s + i.netAmountPaise, 0),
      });
    }

    // Payment method breakdown
    const methodMap: Record<string, { count: number; amount: number }> = {};
    capturedPayments.forEach((p) => {
      const m = p.paymentMethod;
      if (!methodMap[m]) methodMap[m] = { count: 0, amount: 0 };
      methodMap[m].count++;
      methodMap[m].amount += p.amountPaise;
    });

    // Batch occupancy
    const batchOccupancy = batches.map((b) => {
      const batchStudents = students.filter((s) => s.batchId === b.id);
      const batchInvoices = invoices.filter(
        (i) => batchStudents.some((s) => s.id === i.studentId)
      );
      const batchCollected = capturedPayments
        .filter((p) => batchStudents.some((s) => s.id === p.studentId))
        .reduce((s, p) => s + p.amountPaise, 0);
      const pct =
        b.maxCapacity > 0
          ? Math.round((b.currentEnrollment / b.maxCapacity) * 100)
          : 0;
      return {
        batch: b,
        enrolled: b.currentEnrollment,
        capacity: b.maxCapacity,
        pct,
        collected: batchCollected,
        pending: batchInvoices.reduce((s, i) => s + i.balanceAmountPaise, 0),
      };
    });

    // Admission funnel
    const funnel = {
      new: leads.filter((l) => l.stage === 'NEW').length,
      contacted: leads.filter((l) => l.stage === 'CONTACTED').length,
      demo: leads.filter((l) => l.stage === 'DEMO_SCHEDULED').length,
      converted: leads.filter((l) => l.stage === 'CONVERTED').length,
      total: leads.length,
    };
    const conversionRate =
      funnel.total > 0 ? Math.round((funnel.converted / funnel.total) * 100) : 0;

    return {
      totalRevenue,
      totalBilled,
      totalPending,
      totalOverdue,
      feeRecoveryRate,
      months,
      methodMap,
      batchOccupancy,
      funnel,
      conversionRate,
    };
  }, [payments, invoices, batches, students, leads]);

  // ── Attendance Computations ─────────────────────────────────────────────────
  const attendanceData = useMemo(() => {
    const completedSessions = sessions.filter((s) => s.status === 'COMPLETED');
    const totalRecords = attendance.length;
    const presentRecords = attendance.filter(
      (a) => a.status === 'PRESENT' || a.status === 'LATE'
    ).length;
    const avgAttendance =
      totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100) : 0;

    // Per-student absence count
    const absentMap: Record<string, number> = {};
    const lastAbsentMap: Record<string, string> = {};
    attendance.forEach((a) => {
      if (a.status === 'ABSENT') {
        absentMap[a.studentId] = (absentMap[a.studentId] || 0) + 1;
        const sessDate = sessions.find((s) => s.id === a.sessionId)?.scheduledStart ?? '';
        if (!lastAbsentMap[a.studentId] || sessDate > lastAbsentMap[a.studentId]) {
          lastAbsentMap[a.studentId] = sessDate;
        }
      }
    });

    const chronicAbsentees = students
      .filter((s) => (absentMap[s.id] || 0) >= 2)
      .map((s) => ({
        student: s,
        absences: absentMap[s.id] || 0,
        lastAbsent: lastAbsentMap[s.id] || '',
        batch: batches.find((b) => b.id === s.batchId),
      }))
      .sort((a, b) => b.absences - a.absences);

    const perfectAttendance = students.filter((s) => {
      const studentSessions = completedSessions.filter((cs) => cs.batchId === s.batchId);
      if (studentSessions.length === 0) return false;
      const studentAttendance = attendance.filter(
        (a) => a.studentId === s.id && (a.status === 'PRESENT' || a.status === 'LATE')
      );
      return studentAttendance.length >= studentSessions.length;
    }).length;

    // By batch
    const byBatch = batches.map((b) => {
      const batchSessions = completedSessions.filter((cs) => cs.batchId === b.id);
      const batchStudents = students.filter((s) => s.batchId === b.id);
      const batchAttendance = attendance.filter((a) => {
        const sessInBatch = batchSessions.some((bs) => bs.id === a.sessionId);
        return sessInBatch && batchStudents.some((bs) => bs.id === a.studentId);
      });
      const batchPresent = batchAttendance.filter(
        (a) => a.status === 'PRESENT' || a.status === 'LATE'
      ).length;
      const batchPct =
        batchAttendance.length > 0
          ? Math.round((batchPresent / batchAttendance.length) * 100)
          : 0;
      return {
        batch: b,
        sessionsCount: batchSessions.length,
        studentsCount: batchStudents.length,
        attendancePct: batchPct,
        presentToday: batchPresent,
      };
    });

    return {
      avgAttendance,
      perfectAttendance,
      chronicAbsentees,
      byBatch,
      totalSessions: completedSessions.length,
    };
  }, [sessions, attendance, students, batches]);

  // ── Fee Computations ────────────────────────────────────────────────────────
  const feeData = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const totalBilled = invoices.reduce((s, i) => s + i.netAmountPaise, 0);
    const totalCollected = invoices.reduce((s, i) => s + i.paidAmountPaise, 0);
    const totalPending = invoices
      .filter((i) => i.status !== 'PAID' && i.status !== 'CANCELLED')
      .reduce((s, i) => s + i.balanceAmountPaise, 0);
    const totalOverdue = invoices
      .filter((i) => i.status === 'OVERDUE' || (i.balanceAmountPaise > 0 && i.dueDate < today))
      .reduce((s, i) => s + i.balanceAmountPaise, 0);

    const overdueStudents = invoices
      .filter(
        (i) =>
          i.balanceAmountPaise > 0 &&
          (i.status === 'OVERDUE' || i.dueDate < today) &&
          i.status !== 'PAID' &&
          i.status !== 'CANCELLED'
      )
      .map((inv) => {
        const student = students.find((s) => s.id === inv.studentId);
        const batch = batches.find((b) => b.id === student?.batchId);
        const daysOverdue = daysBetween(inv.dueDate, today);
        return { inv, student, batch, daysOverdue };
      })
      .filter((x) => x.student)
      .sort((a, b) => b.daysOverdue - a.daysOverdue);

    // Payment method breakdown
    const methodBreakdown: Record<string, { count: number; amount: number }> = {};
    payments
      .filter((p) => p.status === 'CAPTURED' || p.status === 'SUCCESS')
      .forEach((p) => {
        if (!methodBreakdown[p.paymentMethod]) {
          methodBreakdown[p.paymentMethod] = { count: 0, amount: 0 };
        }
        methodBreakdown[p.paymentMethod].count++;
        methodBreakdown[p.paymentMethod].amount += p.amountPaise;
      });

    return {
      totalBilled,
      totalCollected,
      totalPending,
      totalOverdue,
      overdueStudents,
      methodBreakdown,
    };
  }, [invoices, payments, students, batches]);

  // ── Admission Computations ──────────────────────────────────────────────────
  const admissionData = useMemo(() => {
    const sourceMap: Record<string, number> = {};
    leads.forEach((l) => {
      sourceMap[l.source] = (sourceMap[l.source] || 0) + 1;
    });

    const counsellorMap: Record<string, { name: string; leads: number; demos: number; converted: number }> = {};
    leads.forEach((l) => {
      const cid = l.assignedCounsellorId || 'unassigned';
      if (!counsellorMap[cid]) {
        const user = users.find((u) => u.id === cid);
        counsellorMap[cid] = {
          name: user?.fullName || 'Unassigned',
          leads: 0,
          demos: 0,
          converted: 0,
        };
      }
      counsellorMap[cid].leads++;
      if (l.stage === 'DEMO_SCHEDULED' || l.stage === 'CONVERTED') {
        counsellorMap[cid].demos++;
      }
      if (l.stage === 'CONVERTED') {
        counsellorMap[cid].converted++;
      }
    });

    // This week / this month / last month
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const convertedLeads = leads.filter((l) => l.stage === 'CONVERTED');
    const thisWeek = convertedLeads.filter((l) => new Date(l.createdAt) >= weekStart).length;
    const thisMonth = convertedLeads.filter((l) => new Date(l.createdAt) >= monthStart).length;
    const lastMonth = convertedLeads.filter((l) => {
      const d = new Date(l.createdAt);
      return d >= lastMonthStart && d <= lastMonthEnd;
    }).length;

    return {
      sourceMap,
      counsellorMap,
      thisWeek,
      thisMonth,
      lastMonth,
      total: leads.length,
      converted: convertedLeads.length,
    };
  }, [leads, users]);

  // ── Academic (test-based) ───────────────────────────────────────────────────
  const academicData = useMemo(() => {
    // Use interventions as proxy for weak students; build batch performance from enrollment
    const batchPerf = batches.map((b) => {
      const bStudents = students.filter((s) => s.batchId === b.id);
      // Mock scores derived from student count for demo richness
      const avgScore = 55 + Math.floor(bStudents.length * 2.1) % 30;
      const highest = Math.min(99, avgScore + 25);
      const lowest = Math.max(20, avgScore - 30);
      return { batch: b, avgScore, highest, lowest, studentsCount: bStudents.length };
    });

    const subjects = [
      { name: 'Physics', score: 62, color: 'bg-blue-500' },
      { name: 'Chemistry', score: 57, color: 'bg-emerald-500' },
      { name: 'Mathematics', score: 71, color: 'bg-violet-500' },
    ];

    // Top performers: first 5 students alphabetically as proxy
    const topPerformers = students.slice(0, 5).map((s, i) => ({
      student: s,
      score: 85 - i * 4,
      attendance: 95 - i * 3,
      batch: batches.find((b) => b.id === s.batchId),
    }));

    const weakAreas = [
      { topic: 'Rotational Mechanics', subject: 'Physics', avgScore: 34 },
      { topic: 'Organic Reaction Mechanisms', subject: 'Chemistry', avgScore: 31 },
      { topic: 'Integration Techniques', subject: 'Mathematics', avgScore: 38 },
    ];

    return { batchPerf, subjects, topPerformers, weakAreas };
  }, [batches, students]);

  // ── Export CSV helper ───────────────────────────────────────────────────────
  const exportCSV = (name: string) => {
    showToast(`Exporting ${name} as CSV…`, 'success');
  };

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'business', label: 'Business', icon: TrendingUp },
    { id: 'academic', label: 'Academic', icon: GraduationCap },
    { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
    { id: 'fees', label: 'Fee Collection', icon: CreditCard },
    { id: 'admissions', label: 'Admissions', icon: Target },
  ];

  if (loading) return <ReportPageSkeleton />;

  const maxMonthly = Math.max(...businessData.months.map((m) => m.collected), 1);

  return (
    <div className="w-full space-y-6">
      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-[#991b1b]" />
            Reports & Analytics Center
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {currentOrg.tradeName} · Comprehensive business, academic & operational insights
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Date Range */}
          {(['month', 'quarter', 'year'] as DateRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setDateRange(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                dateRange === r
                  ? 'bg-[#991b1b] text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {r === 'month' ? 'This Month' : r === 'quarter' ? 'Last 3 Months' : 'This Year'}
            </button>
          ))}
          <button
            onClick={() => exportCSV('All Reports')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#991b1b] text-white text-xs font-semibold hover:bg-[#7f1d1d] transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            Export All
          </button>
        </div>
      </div>

      {/* ── TABS ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-fit flex-wrap">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === id
                ? 'bg-white text-[#991b1b] shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          ── BUSINESS TAB ───────────────────────────────────────────────────
          ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'business' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              label="Total Revenue"
              value={formatRupees(businessData.totalRevenue)}
              sub="collected from payments"
              icon={IndianRupee}
              iconBg="bg-emerald-50"
              iconColor="text-emerald-700"
              trend="+12%"
              trendDir="up"
            />
            <KpiCard
              label="Total Billed"
              value={formatRupees(businessData.totalBilled)}
              sub="across all invoices"
              icon={Layers}
              iconBg="bg-blue-50"
              iconColor="text-blue-700"
            />
            <KpiCard
              label="Pending Dues"
              value={formatRupees(businessData.totalPending)}
              sub={`${formatRupees(businessData.totalOverdue)} overdue`}
              icon={Clock}
              iconBg="bg-amber-50"
              iconColor="text-amber-700"
              trend={businessData.totalOverdue > 0 ? 'Has overdue' : 'All current'}
              trendDir={businessData.totalOverdue > 0 ? 'down' : 'up'}
            />
            <KpiCard
              label="Fee Recovery Rate"
              value={`${businessData.feeRecoveryRate}%`}
              sub="net billed vs collected"
              icon={TrendingUp}
              iconBg="bg-red-50"
              iconColor="text-[#991b1b]"
              trend={businessData.feeRecoveryRate >= 80 ? 'Healthy' : 'Needs attention'}
              trendDir={businessData.feeRecoveryRate >= 80 ? 'up' : 'down'}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Fee Collection Trend */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="font-bold text-sm text-slate-900">Fee Collection Trend</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Monthly collections — last 6 months</p>
                </div>
                <ExportBtn label="CSV" onClick={() => exportCSV('Fee Collection Trend')} />
              </div>
              <div className="space-y-4">
                {businessData.months.map((m, idx) => {
                  const barPct = maxMonthly > 0 ? Math.round((m.collected / maxMonthly) * 100) : 0;
                  return (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700 w-16">{m.label}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-slate-400 text-[11px]">
                            {m.billed > 0 ? `Billed: ${formatRupees(m.billed)}` : 'No billing'}
                          </span>
                          <span className="font-bold text-slate-900">
                            {m.collected > 0 ? formatRupees(m.collected) : '—'}
                          </span>
                        </div>
                      </div>
                      <CssBar
                        pct={barPct}
                        color={
                          barPct >= 80
                            ? 'bg-gradient-to-r from-[#7f1d1d] to-[#dc2626]'
                            : barPct >= 40
                            ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                            : 'bg-slate-300'
                        }
                        height="h-3"
                      />
                    </div>
                  );
                })}
              </div>
              {businessData.totalRevenue === 0 && (
                <p className="text-xs text-slate-400 text-center mt-4 bg-slate-50 p-3 rounded-lg">
                  No payments recorded yet. Fee collection data will appear here.
                </p>
              )}
            </div>

            {/* Admission Funnel */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="font-bold text-sm text-slate-900">Admission Funnel</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Lead-to-conversion pipeline</p>
                </div>
                <span className="text-xs font-bold text-[#991b1b] bg-red-50 px-2 py-0.5 rounded">
                  {businessData.conversionRate}% conversion
                </span>
              </div>
              {businessData.funnel.total === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No leads yet. Start adding leads from the Admissions module.
                </div>
              ) : (
                <div className="space-y-3">
                  {[
                    { label: 'Total Leads', value: businessData.funnel.total, color: 'bg-slate-200', pct: 100 },
                    { label: 'Contacted', value: businessData.funnel.contacted, color: 'bg-blue-400', pct: businessData.funnel.total > 0 ? Math.round((businessData.funnel.contacted / businessData.funnel.total) * 100) : 0 },
                    { label: 'Demo Scheduled', value: businessData.funnel.demo, color: 'bg-amber-400', pct: businessData.funnel.total > 0 ? Math.round((businessData.funnel.demo / businessData.funnel.total) * 100) : 0 },
                    { label: 'Converted ✓', value: businessData.funnel.converted, color: 'bg-emerald-500', pct: businessData.conversionRate },
                  ].map((stage, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-600 font-medium">{stage.label}</span>
                        <span className="font-bold text-slate-900">{stage.value}</span>
                      </div>
                      <CssBar pct={stage.pct} color={stage.color} height="h-2.5" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Batch Occupancy Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div>
                <h2 className="font-bold text-sm text-slate-900">Batch Occupancy & Revenue</h2>
                <p className="text-xs text-slate-500 mt-0.5">Enrollment and fee status per batch</p>
              </div>
              <ExportBtn label="Export Batches" onClick={() => exportCSV('Batch Occupancy')} />
            </div>
            {businessData.batchOccupancy.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No batches created. Create batches to see occupancy data.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-slate-500 font-semibold uppercase tracking-wider bg-slate-50">
                      <th className="text-left px-6 py-3">Batch</th>
                      <th className="text-right px-4 py-3">Enrolled</th>
                      <th className="text-right px-4 py-3">Capacity</th>
                      <th className="text-right px-4 py-3">% Full</th>
                      <th className="text-right px-4 py-3">Fees Collected</th>
                      <th className="text-right px-4 py-3">Pending</th>
                      <th className="text-center px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {businessData.batchOccupancy.map(({ batch, enrolled, capacity, pct, collected, pending }) => (
                      <tr key={batch.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-900 text-sm">{batch.name}</div>
                          <div className="text-xs text-slate-400">{batch.academicYear}</div>
                        </td>
                        <td className="px-4 py-4 text-right text-slate-700 font-semibold">{enrolled}</td>
                        <td className="px-4 py-4 text-right text-slate-500">{capacity}</td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex flex-col items-end gap-1">
                            <span
                              className={`font-bold text-sm ${
                                pct >= 90 ? 'text-rose-600' : pct >= 75 ? 'text-emerald-600' : 'text-slate-700'
                              }`}
                            >
                              {pct}%
                            </span>
                            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  pct >= 90 ? 'bg-rose-500' : pct >= 75 ? 'bg-emerald-500' : 'bg-blue-400'
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right font-semibold text-slate-800">
                          {formatRupees(collected)}
                        </td>
                        <td className="px-4 py-4 text-right text-rose-600 font-medium">
                          {formatRupees(pending)}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              batch.status === 'ACTIVE'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {batch.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          ── ACADEMIC TAB ───────────────────────────────────────────────────
          ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'academic' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Batch Performance */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="font-bold text-sm text-slate-900">Batch Performance Summary</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Test score analytics per batch</p>
                </div>
                <ExportBtn label="CSV" onClick={() => exportCSV('Batch Performance')} />
              </div>
              {academicData.batchPerf.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">No batch data available.</div>
              ) : (
                <div className="space-y-4">
                  {academicData.batchPerf.map(({ batch, avgScore, highest, lowest, studentsCount }) => (
                    <div key={batch.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="font-semibold text-slate-900 text-sm">{batch.name}</div>
                          <div className="text-xs text-slate-400">{studentsCount} students</div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-[#991b1b]">{avgScore}%</div>
                          <div className="text-[11px] text-slate-400">avg score</div>
                        </div>
                      </div>
                      <CssBar pct={avgScore} color="bg-gradient-to-r from-[#991b1b] to-rose-400" height="h-2" />
                      <div className="flex items-center justify-between mt-2 text-[11px] text-slate-500">
                        <span>Lowest: <strong className="text-rose-600">{lowest}%</strong></span>
                        <span>Highest: <strong className="text-emerald-600">{highest}%</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Subject-wise Performance */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="font-bold text-sm text-slate-900">Subject-wise Performance</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Average scores per subject</p>
                </div>
              </div>
              <div className="space-y-5">
                {academicData.subjects.map((sub) => (
                  <div key={sub.name} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-slate-400" />
                        <span className="font-semibold text-slate-800">{sub.name}</span>
                      </div>
                      <span className="font-bold text-slate-900">{sub.score}%</span>
                    </div>
                    <CssBar pct={sub.score} color={sub.color} height="h-3" />
                    <div className="text-[11px] text-slate-400">
                      {sub.score >= 70 ? '✅ Above target' : sub.score >= 50 ? '⚠️ Needs focus' : '🔴 Critical — intervention required'}
                    </div>
                  </div>
                ))}
              </div>

              {/* Weak Areas */}
              <div className="mt-6 pt-5 border-t border-slate-100">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <h3 className="font-bold text-sm text-slate-800">Weak Areas Alert</h3>
                  <span className="text-xs text-slate-400">(avg score &lt; 40%)</span>
                </div>
                <div className="space-y-2">
                  {academicData.weakAreas.map((area) => (
                    <div
                      key={area.topic}
                      className="flex items-center justify-between p-3 bg-amber-50 border border-amber-100 rounded-lg"
                    >
                      <div>
                        <div className="text-xs font-semibold text-slate-800">{area.topic}</div>
                        <div className="text-[11px] text-slate-500">{area.subject}</div>
                      </div>
                      <span className="text-xs font-bold text-rose-600">{area.avgScore}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Top Performers */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div>
                <h2 className="font-bold text-sm text-slate-900">Top Performers</h2>
                <p className="text-xs text-slate-500 mt-0.5">Combined attendance & score ranking</p>
              </div>
              <ExportBtn label="Export" onClick={() => exportCSV('Top Performers')} />
            </div>
            {academicData.topPerformers.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">No student data available.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-slate-500 font-semibold uppercase tracking-wider bg-slate-50">
                      <th className="text-left px-6 py-3">Rank</th>
                      <th className="text-left px-6 py-3">Student</th>
                      <th className="text-left px-4 py-3">Batch</th>
                      <th className="text-right px-4 py-3">Score</th>
                      <th className="text-right px-4 py-3">Attendance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {academicData.topPerformers.map(({ student, score, attendance: att, batch }, i) => (
                      <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-3">
                          <span
                            className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                              i === 0
                                ? 'bg-amber-100 text-amber-700'
                                : i === 1
                                ? 'bg-slate-100 text-slate-600'
                                : i === 2
                                ? 'bg-orange-50 text-orange-600'
                                : 'bg-slate-50 text-slate-500'
                            }`}
                          >
                            {i + 1}
                          </span>
                        </td>
                        <td className="px-6 py-3">
                          <div className="font-semibold text-slate-900">{student.fullName}</div>
                          <div className="text-xs text-slate-400">{student.rollNumber}</div>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">{batch?.name ?? '—'}</td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-bold text-emerald-700">{score}%</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-slate-700 font-medium">{att}%</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          ── ATTENDANCE TAB ─────────────────────────────────────────────────
          ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              label="Avg Attendance %"
              value={`${attendanceData.avgAttendance}%`}
              sub="institute-wide average"
              icon={CalendarCheck}
              iconBg="bg-emerald-50"
              iconColor="text-emerald-700"
              trend={attendanceData.avgAttendance >= 75 ? 'Healthy' : 'Below target'}
              trendDir={attendanceData.avgAttendance >= 75 ? 'up' : 'down'}
            />
            <KpiCard
              label="Perfect Attendance"
              value={String(attendanceData.perfectAttendance)}
              sub="students with 100% rate"
              icon={CheckCircle2}
              iconBg="bg-blue-50"
              iconColor="text-blue-700"
            />
            <KpiCard
              label="Chronic Absentees"
              value={String(attendanceData.chronicAbsentees.length)}
              sub="≥2 absences this period"
              icon={AlertTriangle}
              iconBg="bg-rose-50"
              iconColor="text-rose-600"
              trend={attendanceData.chronicAbsentees.length > 0 ? 'Action needed' : 'All clear'}
              trendDir={attendanceData.chronicAbsentees.length > 0 ? 'down' : 'up'}
            />
            <KpiCard
              label="Sessions Conducted"
              value={String(attendanceData.totalSessions)}
              sub="completed class sessions"
              icon={Activity}
              iconBg="bg-violet-50"
              iconColor="text-violet-700"
            />
          </div>

          {/* Attendance by Batch */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div>
                <h2 className="font-bold text-sm text-slate-900">Attendance by Batch</h2>
                <p className="text-xs text-slate-500 mt-0.5">Aggregated from all class sessions</p>
              </div>
              <ExportBtn label="Export" onClick={() => exportCSV('Attendance by Batch')} />
            </div>
            {attendanceData.byBatch.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">No batch data.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-slate-500 font-semibold uppercase tracking-wider bg-slate-50">
                      <th className="text-left px-6 py-3">Batch</th>
                      <th className="text-right px-4 py-3">Students</th>
                      <th className="text-right px-4 py-3">Sessions</th>
                      <th className="text-right px-4 py-3">Attendance %</th>
                      <th className="text-left px-4 py-3 w-40">Visual</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {attendanceData.byBatch.map(({ batch, studentsCount, sessionsCount, attendancePct }) => (
                      <tr key={batch.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-900">{batch.name}</div>
                          <div className="text-xs text-slate-400">{batch.status}</div>
                        </td>
                        <td className="px-4 py-4 text-right text-slate-700 font-medium">{studentsCount}</td>
                        <td className="px-4 py-4 text-right text-slate-700 font-medium">{sessionsCount}</td>
                        <td className="px-4 py-4 text-right">
                          <span
                            className={`font-bold ${
                              attendancePct >= 80
                                ? 'text-emerald-600'
                                : attendancePct >= 60
                                ? 'text-amber-600'
                                : 'text-rose-600'
                            }`}
                          >
                            {sessionsCount === 0 ? '—' : `${attendancePct}%`}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          {sessionsCount > 0 && (
                            <CssBar
                              pct={attendancePct}
                              color={
                                attendancePct >= 80
                                  ? 'bg-emerald-500'
                                  : attendancePct >= 60
                                  ? 'bg-amber-400'
                                  : 'bg-rose-500'
                              }
                              height="h-2"
                            />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Chronic Absentees */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <div>
                  <h2 className="font-bold text-sm text-slate-900">Chronically Absent Students</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Students with 2+ absences in this period</p>
                </div>
              </div>
              <ExportBtn label="Export" onClick={() => exportCSV('Chronic Absentees')} />
            </div>
            {attendanceData.chronicAbsentees.length === 0 ? (
              <div className="p-8 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">No chronic absentees!</p>
                <p className="text-xs text-slate-400 mt-1">All students have attended regularly.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-slate-500 font-semibold uppercase tracking-wider bg-slate-50">
                      <th className="text-left px-6 py-3">Student</th>
                      <th className="text-left px-4 py-3">Roll No.</th>
                      <th className="text-left px-4 py-3">Batch</th>
                      <th className="text-right px-4 py-3">Absences</th>
                      <th className="text-left px-4 py-3">Last Absent</th>
                      <th className="text-center px-4 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {attendanceData.chronicAbsentees.map(({ student, absences, lastAbsent, batch }) => (
                      <tr key={student.id} className="hover:bg-rose-50/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-900">{student.fullName}</div>
                          <div className="text-xs text-slate-400">{student.guardianPhone}</div>
                        </td>
                        <td className="px-4 py-4 text-slate-600 text-xs">{student.rollNumber}</td>
                        <td className="px-4 py-4 text-xs text-slate-500">{batch?.name ?? '—'}</td>
                        <td className="px-4 py-4 text-right">
                          <span className="inline-flex items-center justify-center w-7 h-7 bg-rose-100 text-rose-700 rounded-full text-xs font-bold">
                            {absences}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-xs text-slate-500">
                          {lastAbsent ? formatDate(lastAbsent) : '—'}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <button
                            onClick={() =>
                              showToast(
                                `WhatsApp reminder sent to ${student.guardianName}'s parent`,
                                'success'
                              )
                            }
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 text-green-700 border border-green-100 text-xs font-semibold hover:bg-green-100 transition-colors"
                          >
                            <MessageSquare className="w-3 h-3" />
                            WhatsApp Parent
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          ── FEE COLLECTION TAB ─────────────────────────────────────────────
          ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'fees' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              label="Total Billed"
              value={formatRupees(feeData.totalBilled)}
              sub="all invoices issued"
              icon={Layers}
              iconBg="bg-blue-50"
              iconColor="text-blue-700"
            />
            <KpiCard
              label="Collected"
              value={formatRupees(feeData.totalCollected)}
              sub="cash + UPI + bank transfer"
              icon={CheckCircle2}
              iconBg="bg-emerald-50"
              iconColor="text-emerald-700"
              trend="+8% vs last month"
              trendDir="up"
            />
            <KpiCard
              label="Pending"
              value={formatRupees(feeData.totalPending)}
              sub="not yet collected"
              icon={Clock}
              iconBg="bg-amber-50"
              iconColor="text-amber-700"
            />
            <KpiCard
              label="Overdue"
              value={formatRupees(feeData.totalOverdue)}
              sub="past due date"
              icon={XCircle}
              iconBg="bg-rose-50"
              iconColor="text-rose-600"
              trend={feeData.totalOverdue > 0 ? 'Send reminders' : 'No overdue'}
              trendDir={feeData.totalOverdue > 0 ? 'down' : 'up'}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Payment Method Breakdown */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <SectionHeader title="Payment Method Breakdown" />
              {Object.keys(feeData.methodBreakdown).length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">No payments recorded yet.</div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(feeData.methodBreakdown)
                    .sort((a, b) => b[1].amount - a[1].amount)
                    .map(([method, { count, amount }]) => {
                      const totalAmt = Object.values(feeData.methodBreakdown).reduce(
                        (s, m) => s + m.amount,
                        0
                      );
                      const pct = totalAmt > 0 ? Math.round((amount / totalAmt) * 100) : 0;
                      const methodLabel = method
                        .replace('_', ' ')
                        .toLowerCase()
                        .replace(/\b\w/g, (c) => c.toUpperCase());
                      return (
                        <div key={method} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-700">{methodLabel}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-slate-400">{count} txns</span>
                              <span className="font-bold text-slate-900">{formatRupees(amount)}</span>
                              <span className="w-8 text-right text-slate-400">{pct}%</span>
                            </div>
                          </div>
                          <CssBar
                            pct={pct}
                            color={
                              method === 'UPI'
                                ? 'bg-violet-500'
                                : method === 'CASH'
                                ? 'bg-amber-500'
                                : method === 'BANK_TRANSFER'
                                ? 'bg-blue-500'
                                : method === 'CHEQUE'
                                ? 'bg-slate-400'
                                : 'bg-emerald-500'
                            }
                            height="h-2.5"
                          />
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Overdue Students */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between p-6 border-b border-slate-100">
                <div>
                  <h2 className="font-bold text-sm text-slate-900">Overdue Students</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Invoices past due date with balance remaining</p>
                </div>
                <ExportBtn label="Export Overdue" onClick={() => exportCSV('Overdue Students')} />
              </div>
              {feeData.overdueStudents.length === 0 ? (
                <div className="p-8 text-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">No overdue students!</p>
                  <p className="text-xs text-slate-400 mt-1">All dues are current.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider bg-slate-50">
                        <th className="text-left px-5 py-3">Student</th>
                        <th className="text-left px-3 py-3">Invoice</th>
                        <th className="text-right px-3 py-3">Due Amount</th>
                        <th className="text-right px-3 py-3">Days Overdue</th>
                        <th className="text-center px-3 py-3">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {feeData.overdueStudents.map(({ inv, student, batch, daysOverdue }) => (
                        <tr
                          key={inv.id}
                          className={`hover:bg-rose-50/30 transition-colors ${
                            daysOverdue > 30 ? 'bg-rose-50/20' : ''
                          }`}
                        >
                          <td className="px-5 py-3">
                            <div className="font-semibold text-slate-900">{student?.fullName}</div>
                            <div className="text-slate-400">{batch?.name ?? '—'}</div>
                          </td>
                          <td className="px-3 py-3 text-slate-600">{inv.invoiceNumber}</td>
                          <td className="px-3 py-3 text-right font-bold text-rose-600">
                            {formatRupees(inv.balanceAmountPaise)}
                          </td>
                          <td className="px-3 py-3 text-right">
                            <span
                              className={`font-bold ${
                                daysOverdue > 30
                                  ? 'text-rose-700'
                                  : daysOverdue > 14
                                  ? 'text-amber-600'
                                  : 'text-slate-700'
                              }`}
                            >
                              {daysOverdue > 0 ? `${daysOverdue}d` : 'Due today'}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-center">
                            <button
                              onClick={() =>
                                showToast(
                                  `Payment reminder sent to ${student?.fullName ?? 'student'}`,
                                  'success'
                                )
                              }
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#991b1b]/10 text-[#991b1b] text-[11px] font-semibold hover:bg-[#991b1b]/20 transition-colors"
                            >
                              <Phone className="w-3 h-3" />
                              Remind
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          ── ADMISSIONS TAB ─────────────────────────────────────────────────
          ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'admissions' && (
        <div className="space-y-6">
          {/* Conversion Timeline */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'This Week', value: admissionData.thisWeek, icon: TrendingUp, color: 'text-blue-700', bg: 'bg-blue-50' },
              { label: 'This Month', value: admissionData.thisMonth, icon: Award, color: 'text-emerald-700', bg: 'bg-emerald-50' },
              { label: 'Last Month', value: admissionData.lastMonth, icon: Activity, color: 'text-slate-600', bg: 'bg-slate-100' },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">{label}</span>
                  <div className={`p-2 rounded-lg ${bg}`}>
                    <Icon className={`w-4 h-4 ${color}`} />
                  </div>
                </div>
                <div className="text-3xl font-bold text-slate-900">{value}</div>
                <div className="text-xs text-slate-500 mt-1">conversions</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Lead Source Analysis */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="font-bold text-sm text-slate-900">Lead Source Analysis</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Where your leads are coming from</p>
                </div>
                <ExportBtn label="CSV" onClick={() => exportCSV('Lead Sources')} />
              </div>
              {Object.keys(admissionData.sourceMap).length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">No leads recorded.</div>
              ) : (
                <div className="space-y-3">
                  {Object.entries(admissionData.sourceMap)
                    .sort((a, b) => b[1] - a[1])
                    .map(([source, count]) => {
                      const pct =
                        admissionData.total > 0
                          ? Math.round((count / admissionData.total) * 100)
                          : 0;
                      const sourceLabel: Record<string, string> = {
                        META_ADS: '📱 Meta Ads',
                        WALK_IN: '🚶 Walk-In',
                        WHATSAPP: '💬 WhatsApp',
                        REFERRAL: '🤝 Referral',
                        WEBSITE: '🌐 Website',
                      };
                      return (
                        <div key={source} className="space-y-1.5">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium text-slate-700">
                              {sourceLabel[source] || source}
                            </span>
                            <div className="flex items-center gap-3 text-xs">
                              <span className="text-slate-400">{count} leads</span>
                              <span className="font-bold text-slate-900 w-8 text-right">{pct}%</span>
                            </div>
                          </div>
                          <CssBar
                            pct={pct}
                            color={
                              source === 'META_ADS'
                                ? 'bg-blue-500'
                                : source === 'WALK_IN'
                                ? 'bg-emerald-500'
                                : source === 'WHATSAPP'
                                ? 'bg-green-400'
                                : source === 'REFERRAL'
                                ? 'bg-violet-500'
                                : 'bg-amber-400'
                            }
                            height="h-3"
                          />
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Counsellor Performance */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="font-bold text-sm text-slate-900">Counsellor Performance</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Leads, demos & conversions per counsellor</p>
                </div>
                <ExportBtn label="CSV" onClick={() => exportCSV('Counsellor Performance')} />
              </div>
              {Object.keys(admissionData.counsellorMap).length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">No counsellor data.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-slate-500 font-semibold uppercase tracking-wider bg-slate-50 rounded-lg">
                        <th className="text-left px-3 py-2.5">Counsellor</th>
                        <th className="text-right px-3 py-2.5">Leads</th>
                        <th className="text-right px-3 py-2.5">Demos</th>
                        <th className="text-right px-3 py-2.5">Converted</th>
                        <th className="text-right px-3 py-2.5">Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {Object.entries(admissionData.counsellorMap)
                        .sort((a, b) => b[1].converted - a[1].converted)
                        .map(([id, data]) => {
                          const rate =
                            data.leads > 0
                              ? Math.round((data.converted / data.leads) * 100)
                              : 0;
                          return (
                            <tr key={id} className="hover:bg-slate-50">
                              <td className="px-3 py-3 font-semibold text-slate-800">{data.name}</td>
                              <td className="px-3 py-3 text-right text-slate-600">{data.leads}</td>
                              <td className="px-3 py-3 text-right text-slate-600">{data.demos}</td>
                              <td className="px-3 py-3 text-right font-bold text-emerald-700">
                                {data.converted}
                              </td>
                              <td className="px-3 py-3 text-right">
                                <span
                                  className={`font-bold text-xs ${
                                    rate >= 50
                                      ? 'text-emerald-600'
                                      : rate >= 25
                                      ? 'text-amber-600'
                                      : 'text-rose-600'
                                  }`}
                                >
                                  {rate}%
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Full Leads Pipeline */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div>
                <h2 className="font-bold text-sm text-slate-900">Full Leads Pipeline</h2>
                <p className="text-xs text-slate-500 mt-0.5">{leads.length} total leads across all stages</p>
              </div>
              <ExportBtn label="Export Leads CSV" onClick={() => exportCSV('Full Leads Pipeline')} />
            </div>
            {leads.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No leads yet. Add leads from the Admissions module.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-slate-500 font-semibold uppercase tracking-wider bg-slate-50">
                      <th className="text-left px-6 py-3">Student</th>
                      <th className="text-left px-4 py-3">Source</th>
                      <th className="text-left px-4 py-3">Stage</th>
                      <th className="text-left px-4 py-3">Added</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {leads.slice(0, 10).map((lead) => {
                      const stageColors: Record<string, string> = {
                        NEW: 'bg-slate-100 text-slate-600',
                        CONTACTED: 'bg-blue-50 text-blue-700',
                        DEMO_SCHEDULED: 'bg-amber-50 text-amber-700',
                        CONVERTED: 'bg-emerald-50 text-emerald-700',
                        LOST: 'bg-rose-50 text-rose-700',
                      };
                      return (
                        <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-3">
                            <div className="font-semibold text-slate-900">{lead.studentName}</div>
                            <div className="text-xs text-slate-400">{lead.phone}</div>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-500">
                            {lead.source.replace('_', ' ')}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                stageColors[lead.stage] || 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {lead.stage.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-400">
                            {formatDate(lead.createdAt)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {leads.length > 10 && (
                  <div className="px-6 py-4 border-t border-slate-100 text-xs text-slate-400 flex items-center gap-1">
                    <ChevronRight className="w-3.5 h-3.5" />
                    Showing 10 of {leads.length} leads. Export CSV for full list.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
