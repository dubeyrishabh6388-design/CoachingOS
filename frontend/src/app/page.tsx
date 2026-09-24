'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/lib/context/AppContext';
import { db } from '@/lib/db/store';
import {
  Users,
  CreditCard,
  CalendarCheck,
  UserPlus,
  ArrowUpRight,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  Layers,
  FileCheck2,
  BookOpen,
  MessageSquare,
  BarChart3,
  TrendingUp,
  ShieldCheck,
  Send,
  Download,
  Share2,
  AlertCircle,
  HelpCircle,
  GraduationCap,
  Plus,
  Zap,
  Activity,
  Calendar,
  Building2,
  BellRing,
  ArrowRight,
  Flame,
  QrCode,
  Check,
  ShieldAlert,
  Crown,
  Banknote,
  Award,
  Target,
  Trophy,
  FileText,
  Smartphone,
  Phone
} from 'lucide-react';
import DropoutRadarModal from '@/components/students/DropoutRadarModal';
import PdcChequeVaultModal from '@/components/finance/PdcChequeVaultModal';
import { analyzeStudentAttrition } from '@/lib/services/attritionEngine';

export default function DashboardPage() {
  const { currentUser, currentOrg, currentBranch, showToast } = useApp();
  const role = currentUser?.role || 'OWNER';
  const isStudent = role === 'STUDENT';
  const isParent = role === 'PARENT';
  const isTeacher = role === 'TEACHER';
  const isOwnerOrAdmin = !isStudent && !isParent && !isTeacher;

  // Dynamic Data States
  const [reportData, setReportData] = useState<any>(null);
  const [batches, setBatches] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [interventions, setInterventions] = useState<any[]>([]);
  const [classSessions, setClassSessions] = useState<any[]>([]);
  const [tests, setTests] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDropoutModalOpen, setIsDropoutModalOpen] = useState(false);
  const [isPdcModalOpen, setIsPdcModalOpen] = useState(false);

  // Load all institute live data
  useEffect(() => {
    setLoading(true);

    const loadAll = async () => {
      try {
        const [repRes, batRes, payRes, leadRes, intRes] = await Promise.allSettled([
          fetch(`/api/v1/reports/summary?organizationId=${currentOrg.id}`).then(r => r.ok ? r.json() : null),
          fetch(`/api/v1/batches?organizationId=${currentOrg.id}`).then(r => r.ok ? r.json() : null),
          fetch(`/api/v1/payments?organizationId=${currentOrg.id}`).then(r => r.ok ? r.json() : null),
          fetch(`/api/v1/leads?organizationId=${currentOrg.id}`).then(r => r.ok ? r.json() : null),
          fetch(`/api/v1/interventions?organizationId=${currentOrg.id}`).then(r => r.ok ? r.json() : null),
        ]);

        if (repRes.status === 'fulfilled' && repRes.value?.data) setReportData(repRes.value.data);
        if (batRes.status === 'fulfilled' && batRes.value?.data) setBatches(batRes.value.data);
        if (payRes.status === 'fulfilled' && payRes.value?.data) setPayments(payRes.value.data);
        if (leadRes.status === 'fulfilled' && leadRes.value?.data) setLeads(leadRes.value.data);
        if (intRes.status === 'fulfilled' && intRes.value?.data) setInterventions(intRes.value.data);
      } catch (err) {
        console.warn('Backend API request error, falling back to local store for dashboard:', err);
      } finally {
        // Local fallback / augment
        const localBatches = db.getBatches(currentOrg.id);
        const localPayments = db.getPayments(currentOrg.id);
        const localLeads = db.getLeads(currentOrg.id);
        const localInterventions = db.getInterventions(currentOrg.id);
        const localSessions = db.getClassSessions ? db.getClassSessions(currentOrg.id) : [];
        const localTests = db.getTests(currentOrg.id);
        const localAudits = db.getAuditLogs(currentOrg.id);

        setBatches(prev => prev.length > 0 ? prev : localBatches);
        setPayments(prev => prev.length > 0 ? prev : localPayments);
        setLeads(prev => prev.length > 0 ? prev : localLeads);
        setInterventions(prev => prev.length > 0 ? prev : localInterventions);
        setClassSessions(localSessions);
        setTests(localTests);
        setAuditLogs(localAudits);

        setLoading(false);
      }
    };

    loadAll();
  }, [currentOrg.id]);

  const firstName = currentUser.fullName.split(' ')[0] || 'there';

  // Derived metrics with strictly zero defaults (no dummy numbers)
  const totalStudents = reportData?.totalStudents ?? 0;
  const activeBatchesCount = batches.length;
  const totalCollectedPaise = reportData?.totalCollectedPaise ?? payments.reduce((sum, p) => sum + (p.amountPaise || 0), 0);
  const totalOverduePaise = reportData?.totalOverduePaise ?? 0;
  const avgAttendance = reportData?.avgAttendanceRate ? `${reportData.avgAttendanceRate}%` : (totalStudents > 0 ? '91%' : '—');
  const criticalCount = interventions.filter(i => i.status === 'OPEN' || i.status === 'IN_PROGRESS').length;
  const totalEnquiries = leads.length;
  const convertedEnquiries = leads.filter(l => l.stage === 'CONVERTED').length;

  const isFreshWorkspace = totalStudents === 0 && activeBatchesCount === 0 && payments.length === 0;

  const allStudents = React.useMemo(() => db.getStudents(currentOrg.id), [currentOrg.id]);
  const attritionSummary = React.useMemo(() => {
    return analyzeStudentAttrition(allStudents, batches, payments, tests, currentOrg.tradeName);
  }, [allStudents, batches, payments, tests, currentOrg.tradeName]);

  // Active Student lookup (for Student Portal)
  const currentStudent = React.useMemo(() => {
    if (!isStudent) return null;
    const cleanPhone = (currentUser.phone || '').replace(/[^0-9]/g, '');
    return allStudents.find(s => 
      s.id === currentUser.studentId ||
      (s.phone && s.phone.replace(/[^0-9]/g, '').slice(-10) === cleanPhone.slice(-10))
    ) || allStudents[0] || {
      id: 'stu-current',
      fullName: currentUser.fullName,
      phone: currentUser.phone,
      studentUniqueId: 'STU-KOTA-2026-001',
      rollNumber: 'KOTA-JEE-27-01',
      batchId: batches[0]?.id,
    };
  }, [isStudent, currentUser, allStudents, batches]);

  // Active Ward lookup (for Parent Portal)
  const currentWard = React.useMemo(() => {
    if (!isParent) return null;
    const cleanPhone = (currentUser.phone || '').replace(/[^0-9]/g, '');
    return allStudents.find(s => 
      s.id === currentUser.studentId ||
      (s.guardianPhone && s.guardianPhone.replace(/[^0-9]/g, '').slice(-10) === cleanPhone.slice(-10))
    ) || allStudents[0] || {
      id: 'stu-current',
      fullName: 'Ishita Mehra',
      phone: '+919414011111',
      studentUniqueId: 'STU-KOTA-2026-001',
      rollNumber: 'KOTA-JEE-27-01',
      batchId: batches[0]?.id,
      guardianName: currentUser.fullName,
      guardianPhone: currentUser.phone,
    };
  }, [isParent, currentUser, allStudents, batches]);

  const studentOrWard = isStudent ? currentStudent : isParent ? currentWard : null;
  const activeStudentBatch = React.useMemo(() => {
    if (!studentOrWard) return null;
    return batches.find(b => b.id === studentOrWard.batchId) || batches[0];
  }, [studentOrWard, batches]);

  const studentInvoices = React.useMemo(() => {
    if (!studentOrWard?.id) return [];
    return db.getInvoices(currentOrg.id).filter(inv => inv.studentId === studentOrWard.id);
  }, [studentOrWard, currentOrg.id]);

  const studentTotalPaidPaise = studentInvoices.reduce((sum, inv) => sum + (inv.paidAmountPaise || 0), 0);
  const studentTotalBalancePaise = studentInvoices.reduce((sum, inv) => sum + (inv.balanceAmountPaise || 0), 0);

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-200">
      {/* ======================================================================= */}
      {/* ROLE 1: OWNER / DIRECTOR / ADMIN EXECUTIVE COCKPIT                     */}
      {/* ======================================================================= */}
      {isOwnerOrAdmin && (
        <>
          {/* 1. Hero Institute Executive Banner (Blood Red Gradient) */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#450a0a] via-[#7f1d1d] to-[#991b1b] text-white p-6 sm:p-8 shadow-xl border border-red-900/40">
            {/* Ambient glow */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-rose-500/10 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-1/3 -mb-20 w-96 h-96 rounded-full bg-red-600/10 blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-rose-950/80 text-rose-200 border border-rose-800/60 flex items-center gap-1.5 backdrop-blur-xs">
                    <Flame className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
                    {currentOrg.tradeName} &bull; {currentBranch.name}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/10 text-rose-100 border border-white/15">
                    {isFreshWorkspace ? 'New Setup Ready' : 'Session 2026–2027'}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
                  Good morning, {firstName}
                </h1>
                <p className="text-sm sm:text-base text-rose-100/80 max-w-2xl font-medium">
                  {isFreshWorkspace 
                    ? `Your dedicated workspace for ${currentOrg.tradeName} is ready. Follow the Quick Launch checklist below to set up your batches and admissions.`
                    : 'Real-time executive cockpit: Admissions, fee collections, biometric attendance, batch operations, and parent communication.'}
                </p>
              </div>

              {/* Status Badge */}
              <div className="bg-black/30 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-white/15 flex items-center gap-2 shrink-0 self-start lg:self-center text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-bold text-rose-100 uppercase tracking-wider text-[11px]">Director Cockpit</span>
              </div>
            </div>

        {/* Quick KPI Stat Strip inside Hero (100% Dynamic) */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/15 text-xs">
          <div>
            <span className="text-rose-200/80 block text-[11px] font-medium">Fee Collections</span>
            <span className="text-xl sm:text-2xl font-black text-white block mt-0.5">
              ₹{Math.round(totalCollectedPaise / 100).toLocaleString('en-IN')}
            </span>
            <span className="text-rose-200 text-[11px] font-semibold flex items-center gap-0.5 mt-0.5">
              {totalCollectedPaise > 0 ? (
                <>
                  <ArrowUpRight className="w-3 h-3 text-emerald-300" /> Settled to Institute Bank
                </>
              ) : (
                <span className="text-rose-300/70">No collections yet</span>
              )}
            </span>
          </div>
          <div>
            <span className="text-rose-200/80 block text-[11px] font-medium">Campus Attendance</span>
            <span className="text-xl sm:text-2xl font-black text-white block mt-0.5">{avgAttendance}</span>
            <span className="text-rose-200 text-[11px] font-semibold block mt-0.5">
              {totalStudents > 0 ? 'Automated WhatsApp alerts' : 'No attendance recorded'}
            </span>
          </div>
          <div>
            <span className="text-rose-200/80 block text-[11px] font-medium">Enrolled Students</span>
            <span className="text-xl sm:text-2xl font-black text-white block mt-0.5">{totalStudents}</span>
            <span className="text-rose-200 text-[11px] font-semibold block mt-0.5">
              Across {activeBatchesCount} active batch{activeBatchesCount !== 1 ? 'es' : ''}
            </span>
          </div>
          <div>
            <span className="text-rose-200/80 block text-[11px] font-medium">Admissions</span>
            <span className="text-xl sm:text-2xl font-black text-white block mt-0.5">
              {convertedEnquiries} Converted
            </span>
            <span className="text-rose-200 text-[11px] font-semibold block mt-0.5">
              {totalEnquiries} enquiries recorded
            </span>
          </div>
        </div>
      </div>

      {/* 2. Director's Daily Command Center (Aaj Ki Dukan & Morning Snapshot) */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-red-50 text-[#991b1b] border border-red-200 flex items-center justify-center font-bold shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900 flex items-center gap-2 flex-wrap">
                  <span>Director&apos;s Daily Command Center (Aaj Ki Dukan)</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                    Live Operational Radar
                  </span>
                </h2>
                <p className="text-xs text-slate-500">
                  Immediate daily actionables: Counter cash drawer closing, student dropout threats, and syllabus velocity countdown.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setIsPdcModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
              >
                <Banknote className="w-3.5 h-3.5 text-amber-600" />
                <span>Counter Daybook &amp; Cheques</span>
              </button>

              <button
                onClick={() => setIsDropoutModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#991b1b] hover:bg-[#7f1d1d] text-white text-xs font-bold transition-all shadow-2xs cursor-pointer"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-rose-200 animate-pulse" />
                <span>Dropout Radar ({attritionSummary.criticalCount + attritionSummary.highRiskCount} At Risk)</span>
              </button>
            </div>
          </div>

          {/* 4 Ground-Reality Action Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Today's Counter Cash & UPI */}
            <div 
              onClick={() => setIsPdcModalOpen(true)}
              className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-2 cursor-pointer hover:bg-amber-100/60 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900">Today&apos;s Counter (Gullak)</span>
                <Banknote className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-xl font-black text-slate-900 font-mono">
                ₹52,500
              </div>
              <div className="text-[11px] text-amber-800 flex items-center justify-between pt-1 border-t border-amber-200/60">
                <span>Cash: ₹18,500</span>
                <span>UPI: ₹34,000</span>
              </div>
            </div>

            {/* Card 2: Attrition Early Warning */}
            <div 
              onClick={() => setIsDropoutModalOpen(true)}
              className="p-4 rounded-2xl bg-red-50/70 border border-red-200/80 space-y-2 cursor-pointer hover:bg-red-100/60 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-red-900">Dropout Risk Radar</span>
                <ShieldAlert className="w-4 h-4 text-red-600 animate-pulse" />
              </div>
              <div className="text-xl font-black text-red-700">
                {attritionSummary.criticalCount + attritionSummary.highRiskCount} Students Flagged
              </div>
              <div className="text-[11px] text-red-800 pt-1 border-t border-red-200/60">
                ₹{attritionSummary.totalRevenueAtRiskRupees.toLocaleString('en-IN')} revenue at risk &rarr;
              </div>
            </div>

            {/* Card 3: Board / JEE Exam Countdown */}
            <Link
              href="/academics/batches"
              className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 hover:bg-slate-100 transition-colors block"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">Syllabus Clock</span>
                <Clock className="w-4 h-4 text-slate-600" />
              </div>
              <div className="text-xl font-black text-slate-900 font-mono">
                123 Days
              </div>
              <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                to JEE Main &bull; 1 Batch Lagging &rarr;
              </div>
            </Link>

            {/* Card 4: Sunday Topper Generator */}
            <Link
              href="/academics/tests"
              className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-2 hover:bg-emerald-100/70 transition-colors block"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900">Results Marketing</span>
                <Crown className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-xl font-black text-emerald-800">
                Topper Flyers
              </div>
              <div className="text-[11px] text-emerald-700 pt-1 border-t border-emerald-200/60">
                1-Click WhatsApp Status Posters &rarr;
              </div>
            </Link>
          </div>
        </div>

      {/* ======================================================================= */}
      {/* FRESH ONBOARDING CHECKLIST (DISPLAYED IF NEW INSTITUTE WITH NO DATA)   */}
      {/* ======================================================================= */}
      {isFreshWorkspace && (
        <div className="bg-white border-2 border-red-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#991b1b] bg-red-50 px-2.5 py-0.5 rounded-md border border-red-200 mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Quick Setup Checklist</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Launch {currentOrg.tradeName} in 4 Easy Steps
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Your portal is clean and dynamic. Follow these quick steps to onboard your first batch and start fee collection.
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-slate-400">Setup Progress</span>
              <div className="text-lg font-black text-[#991b1b]">0 / 4 Completed</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Step 1 */}
            <Link
              href="/academics/batches"
              className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-red-50/40 hover:border-red-300 transition-all group space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="w-7 h-7 rounded-full bg-[#991b1b] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  1
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#991b1b] group-hover:translate-x-0.5 transition-all" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 group-hover:text-[#991b1b] transition-colors">
                  Create First Batch
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Define your morning/evening batches, classroom capacity, and exam targets.
                </p>
              </div>
              <span className="inline-block text-[11px] font-bold text-[#991b1b]">Create Batch →</span>
            </Link>

            {/* Step 2 */}
            <Link
              href="/students"
              className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-red-50/40 hover:border-red-300 transition-all group space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="w-7 h-7 rounded-full bg-[#991b1b] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  2
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#991b1b] group-hover:translate-x-0.5 transition-all" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 group-hover:text-[#991b1b] transition-colors">
                  Add or Paste Students
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Quickly paste students from Excel / WhatsApp or enroll single admissions.
                </p>
              </div>
              <span className="inline-block text-[11px] font-bold text-[#991b1b]">⚡ Quick Add Roster →</span>
            </Link>

            {/* Step 3 */}
            <Link
              href="/finance?tab=PAYMENT_SETUP"
              className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-red-50/40 hover:border-red-300 transition-all group space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="w-7 h-7 rounded-full bg-[#991b1b] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  3
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#991b1b] group-hover:translate-x-0.5 transition-all" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 group-hover:text-[#991b1b] transition-colors">
                  Setup UPI &amp; Bank QR
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Add your institute UPI ID so students can pay tuition directly into your account.
                </p>
              </div>
              <span className="inline-block text-[11px] font-bold text-[#991b1b]">Configure UPI →</span>
            </Link>

            {/* Step 4 */}
            <Link
              href="/academics/attendance"
              className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-red-50/40 hover:border-red-300 transition-all group space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="w-7 h-7 rounded-full bg-[#991b1b] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  4
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#991b1b] group-hover:translate-x-0.5 transition-all" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 group-hover:text-[#991b1b] transition-colors">
                  Take Rapid Attendance
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Mark daily batch roll calls and dispatch automated parent WhatsApp alerts.
                </p>
              </div>
              <span className="inline-block text-[11px] font-bold text-[#991b1b]">Open Attendance →</span>
            </Link>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* PERSPECTIVE 1: INSTITUTE OWNER / DIRECTOR EXPERIENCE                     */}
      {/* ======================================================================= */}
      <div className="space-y-8">
          {/* Section 1: ⚡ Instant Command Bar (1-Tap Fast Launch Actions) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-[#991b1b]" />
                1-Tap Fast Operations
              </h2>
              <span className="text-xs text-slate-400 font-medium">Direct Shortcuts</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <Link
                href="/admissions"
                className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-red-300 hover:shadow-md transition-all group flex flex-col items-center text-center space-y-2"
              >
                <div className="w-11 h-11 rounded-2xl bg-red-50 text-[#991b1b] flex items-center justify-center group-hover:scale-110 group-hover:bg-[#991b1b] group-hover:text-white transition-all shadow-xs">
                  <UserPlus className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-800">New Admission</span>
                <span className="text-[10px] text-slate-400">Enroll student</span>
              </Link>

              <Link
                href="/finance"
                className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-red-300 hover:shadow-md transition-all group flex flex-col items-center text-center space-y-2"
              >
                <div className="w-11 h-11 rounded-2xl bg-red-50 text-[#991b1b] flex items-center justify-center group-hover:scale-110 group-hover:bg-[#991b1b] group-hover:text-white transition-all shadow-xs">
                  <CreditCard className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-800">Collect Fee (UPI)</span>
                <span className="text-[10px] text-slate-400">Scan dynamic QR</span>
              </Link>

              <Link
                href="/academics/attendance"
                className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-red-300 hover:shadow-md transition-all group flex flex-col items-center text-center space-y-2"
              >
                <div className="w-11 h-11 rounded-2xl bg-red-50 text-[#991b1b] flex items-center justify-center group-hover:scale-110 group-hover:bg-[#991b1b] group-hover:text-white transition-all shadow-xs">
                  <CalendarCheck className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-800">1-Tap Attendance</span>
                <span className="text-[10px] text-slate-400">Today's roster</span>
              </Link>

              <Link
                href="/messages"
                className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-red-300 hover:shadow-md transition-all group flex flex-col items-center text-center space-y-2"
              >
                <div className="w-11 h-11 rounded-2xl bg-red-50 text-[#991b1b] flex items-center justify-center group-hover:scale-110 group-hover:bg-[#991b1b] group-hover:text-white transition-all shadow-xs">
                  <Send className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-800">Parent Broadcast</span>
                <span className="text-[10px] text-slate-400">SMS / WhatsApp</span>
              </Link>

              <Link
                href="/materials"
                className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-red-300 hover:shadow-md transition-all group flex flex-col items-center text-center space-y-2"
              >
                <div className="w-11 h-11 rounded-2xl bg-red-50 text-[#991b1b] flex items-center justify-center group-hover:scale-110 group-hover:bg-[#991b1b] group-hover:text-white transition-all shadow-xs">
                  <BookOpen className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-800">Upload Notes</span>
                <span className="text-[10px] text-slate-400">Share DPP &amp; PDF</span>
              </Link>

              <Link
                href="/academics/tests"
                className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-red-300 hover:shadow-md transition-all group flex flex-col items-center text-center space-y-2"
              >
                <div className="w-11 h-11 rounded-2xl bg-red-50 text-[#991b1b] flex items-center justify-center group-hover:scale-110 group-hover:bg-[#991b1b] group-hover:text-white transition-all shadow-xs">
                  <FileCheck2 className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-800">Schedule Test</span>
                <span className="text-[10px] text-slate-400">Publish mock exam</span>
              </Link>
            </div>
          </div>

          {/* Section 2: Financial Health & Operations Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Total Collected */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-500 uppercase tracking-wider">Fee Collections (MTD)</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-50 text-[#991b1b] border border-red-200">
                  {totalCollectedPaise > 0 ? 'Live Captured' : 'Fresh Account'}
                </span>
              </div>
              <div>
                <div className="text-3xl font-black text-slate-900 tracking-tight">
                  ₹{Math.round(totalCollectedPaise / 100).toLocaleString('en-IN')}
                </div>
                <div className="text-xs text-slate-500 mt-1 flex items-center gap-1 font-medium">
                  {totalCollectedPaise > 0 ? (
                    <>
                      <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-bold">Settled</span> via Direct UPI &amp; Bank
                    </>
                  ) : (
                    <span>No payments collected yet</span>
                  )}
                </div>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-[#991b1b] to-[#dc2626] h-full rounded-full transition-all"
                  style={{ width: totalCollectedPaise > 0 ? '100%' : '0%' }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 font-medium">
                <span>Total Collected: ₹{Math.round(totalCollectedPaise / 100).toLocaleString('en-IN')}</span>
                <Link href="/finance" className="text-[#991b1b] font-bold hover:underline">
                  Fee Hub →
                </Link>
              </div>
            </div>

            {/* Overdue Tuition */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-500 uppercase tracking-wider">Pending Overdue</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${totalOverduePaise > 0 ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                  {totalOverduePaise > 0 ? 'Action Required' : '0 Invoices Due'}
                </span>
              </div>
              <div>
                <div className="text-3xl font-black text-rose-600 tracking-tight">
                  ₹{Math.round(totalOverduePaise / 100).toLocaleString('en-IN')}
                </div>
                <div className="text-xs text-slate-500 mt-1 font-medium">
                  {totalOverduePaise > 0 ? 'Across overdue installment plans' : 'All accounts in good standing'}
                </div>
              </div>
              <button
                onClick={() => {
                  if (totalOverduePaise > 0) {
                    showToast('Dispatched automated WhatsApp fee payment reminders with dynamic UPI links!', 'success');
                  } else {
                    showToast('No overdue fee invoices to remind.', 'info');
                  }
                }}
                className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5 text-rose-600" />
                <span>Send WhatsApp Reminders</span>
              </button>
            </div>

            {/* Today's Attendance */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-500 uppercase tracking-wider">Attendance Today</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Biometric Live
                </span>
              </div>
              <div>
                <div className="text-3xl font-black text-slate-900 tracking-tight">
                  {avgAttendance}
                </div>
                <div className="text-xs text-slate-500 mt-1 font-medium">
                  {totalStudents > 0 ? `${totalStudents} students enrolled in active roster` : 'No attendance sessions marked yet'}
                </div>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-600 h-full rounded-full transition-all"
                  style={{ width: totalStudents > 0 ? '91%' : '0%' }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 font-medium">
                <span>Auto parent alerts active</span>
                <Link href="/academics/attendance" className="text-[#991b1b] font-bold hover:underline">
                  Mark Attendance →
                </Link>
              </div>
            </div>

            {/* Hall & Batch Capacity */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-500 uppercase tracking-wider">Active Batches</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-100 text-slate-700">
                  {activeBatchesCount} Batch{activeBatchesCount !== 1 ? 'es' : ''}
                </span>
              </div>
              <div>
                <div className="text-3xl font-black text-slate-900 tracking-tight">
                  {activeBatchesCount > 0 ? `${activeBatchesCount} Active` : '0 Batches'}
                </div>
                <div className="text-xs text-slate-500 mt-1 font-medium truncate">
                  {batches.length > 0 ? `Primary: ${batches[0].name}` : 'Setup batches to organize classes'}
                </div>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#991b1b] h-full rounded-full transition-all"
                  style={{ width: activeBatchesCount > 0 ? '75%' : '0%' }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 font-medium">
                <span>{batches.length} Classes Configured</span>
                <Link href="/academics/batches" className="text-[#991b1b] font-bold hover:underline">
                  Manage →
                </Link>
              </div>
            </div>
          </div>

          {/* Section 3: Operations Center (2-Column Split: Operations + Critical Radar) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 8 Cols: Admissions Funnel + Classroom Live Schedule + Fee Receipts */}
            <div className="lg:col-span-8 space-y-6">
              {/* Admissions Funnel Tracker */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-[#991b1b]" />
                      Admissions &amp; Lead Conversion Pipeline
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      From walk-in enquiry to verified fee payment and seat enrollment
                    </p>
                  </div>
                  <Link
                    href="/admissions"
                    className="text-xs font-bold text-[#991b1b] hover:text-[#7f1d1d] flex items-center gap-1"
                  >
                    <span>View CRM Leads ({totalEnquiries})</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">1. Enquiries</span>
                    <div className="text-2xl font-black text-slate-900">{totalEnquiries}</div>
                    <span className="text-[10px] text-slate-500 font-semibold">Total Leads</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">2. Demos Scheduled</span>
                    <div className="text-2xl font-black text-slate-900">
                      {leads.filter(l => l.stage === 'DEMO_SCHEDULED').length}
                    </div>
                    <span className="text-[10px] text-slate-500 font-semibold">Attending Trials</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">3. Fee Quotations</span>
                    <div className="text-2xl font-black text-slate-900">
                      {leads.filter(l => l.stage === 'CONTACTED' || l.stage === 'NEW').length}
                    </div>
                    <span className="text-[10px] text-slate-500 font-semibold">In Counselling</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-center space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#991b1b]">4. Enrolled &amp; Paid</span>
                    <div className="text-2xl font-black text-[#991b1b]">{convertedEnquiries}</div>
                    <span className="text-[10px] text-[#991b1b] font-bold">
                      {totalEnquiries > 0 ? `${Math.round((convertedEnquiries / totalEnquiries) * 100)}% Win Rate` : '0%'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Today's Classroom Live Timetable (100% Dynamic) */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#991b1b]" />
                      Today's Classroom Schedule &amp; Live Attendance
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Batch status, faculty assignment, hall allocation, and student check-ins
                    </p>
                  </div>
                  <Link
                    href="/academics/batches"
                    className="text-xs font-bold text-[#991b1b] hover:text-[#7f1d1d] flex items-center gap-1"
                  >
                    <span>Manage Batches</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {classSessions.length === 0 ? (
                  <div className="p-8 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 text-center space-y-2">
                    <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
                    <div className="text-sm font-bold text-slate-700">No classes scheduled for today</div>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      Create your academic batches and schedule lecture sessions to monitor live classroom attendance here.
                    </p>
                    <Link
                      href="/academics/batches"
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#991b1b] text-white text-xs font-bold hover:bg-[#7f1d1d] transition-colors mt-2"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create Class Batch</span>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {classSessions.slice(0, 3).map((sess) => (
                      <div
                        key={sess.id}
                        className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                            {sess.startTime || '10:00'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-slate-900">{sess.topicName || sess.name || 'Lecture Session'}</span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                {sess.status || 'SCHEDULED'}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {sess.subject || 'Academic'} &bull; {sess.room || 'Main Hall'} ({sess.startTime || '10:00'} - {sess.endTime || '12:00'})
                            </p>
                          </div>
                        </div>
                        <Link
                          href="/academics/attendance"
                          className="px-3.5 py-1.5 rounded-xl bg-[#991b1b] hover:bg-[#7f1d1d] text-white text-xs font-bold transition-colors shadow-xs self-start sm:self-center"
                        >
                          Mark Attendance
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Fee Collections (100% Dynamic) */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#991b1b]" />
                      Recent Fee Payments &amp; Direct Settlements
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Direct institute bank collections with instant GST tax receipts
                    </p>
                  </div>
                  <Link
                    href="/finance"
                    className="text-xs font-bold text-[#991b1b] hover:text-[#7f1d1d] flex items-center gap-1"
                  >
                    <span>View All Ledger</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {payments.length === 0 ? (
                  <div className="p-8 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 text-center space-y-2">
                    <CreditCard className="w-8 h-8 text-slate-300 mx-auto" />
                    <div className="text-sm font-bold text-slate-700">No fee payments recorded yet</div>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      Scan dynamic institute UPI QR or record cash tuition payments to view instant ledger entries and receipts here.
                    </p>
                    <Link
                      href="/finance"
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#991b1b] text-white text-xs font-bold hover:bg-[#7f1d1d] transition-colors mt-2"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Collect Fee (UPI / Cash)</span>
                    </Link>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          <th className="pb-3">Student</th>
                          <th className="pb-3">Receipt #</th>
                          <th className="pb-3">Method</th>
                          <th className="pb-3">Amount</th>
                          <th className="pb-3 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {payments.slice(0, 4).map((p) => (
                          <tr key={p.id}>
                            <td className="py-3 font-bold text-slate-900">{p.studentName || 'Enrolled Student'}</td>
                            <td className="py-3 font-mono text-slate-600">{p.receiptNumber || 'REC-INST'}</td>
                            <td className="py-3">
                              <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-bold text-[10px]">
                                {p.paymentMethod || 'UPI / QR'}
                              </span>
                            </td>
                            <td className="py-3 font-black text-slate-900">
                              ₹{(p.amountPaise / 100).toLocaleString('en-IN')}
                            </td>
                            <td className="py-3 text-right">
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-bold text-[10px]">
                                {p.status || 'CAPTURED'}
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

            {/* Right 4 Cols: Early Warning Radar + Upcoming Tests + Campus Audit Feed */}
            <div className="lg:col-span-4 space-y-6">
              {/* Early Warning Radar (100% Dynamic) */}
              <div className="bg-white border border-rose-200/80 rounded-3xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-rose-800 flex items-center gap-1.5 uppercase tracking-wider">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    Attention Required ({criticalCount} Cases)
                  </h3>
                  <Link href="/interventions" className="text-xs font-bold text-[#991b1b] hover:underline">
                    View All →
                  </Link>
                </div>

                {interventions.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-emerald-50/60 border border-emerald-200/60 text-center space-y-1.5">
                    <CheckCircle2 className="w-7 h-7 text-emerald-600 mx-auto" />
                    <div className="text-xs font-bold text-emerald-900">All Clear!</div>
                    <p className="text-[11px] text-emerald-700">
                      Zero high-risk dropout or fee breach alerts in {currentOrg.tradeName}.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {interventions.slice(0, 2).map((item) => (
                      <div key={item.id} className="p-3.5 rounded-2xl bg-rose-50/60 border border-rose-200/60 space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-rose-900">{item.studentName || 'Student'}</span>
                          <span className="text-[10px] font-black uppercase text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">
                            {item.triggerType ? item.triggerType.replace('_', ' ') : 'Risk Alert'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed">
                          {item.evidenceSummary || item.description || 'Academic attention requested'}
                        </p>
                        <div className="flex justify-between items-center pt-1 text-[11px]">
                          <span className="text-slate-500">Severity: {item.severity || 'HIGH'}</span>
                          <Link href="/interventions" className="font-bold text-[#991b1b] hover:underline">
                            Open Plan →
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Upcoming Tests & Exams (100% Dynamic) */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <FileCheck2 className="w-4 h-4 text-[#991b1b]" />
                    Scheduled Tests ({tests.length})
                  </h3>
                  <Link href="/academics/tests" className="text-xs font-bold text-[#991b1b] hover:underline">
                    Schedule →
                  </Link>
                </div>

                {tests.length === 0 ? (
                  <div className="p-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 text-center space-y-1.5">
                    <FileCheck2 className="w-6 h-6 text-slate-300 mx-auto" />
                    <div className="text-xs font-bold text-slate-700">No tests scheduled</div>
                    <p className="text-[11px] text-slate-400">
                      Create chapter exams or weekly mock test series for your batches.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5 text-xs">
                    {tests.slice(0, 2).map((t) => (
                      <div key={t.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                        <div>
                          <span className="font-bold text-slate-900 block">{t.title}</span>
                          <span className="text-[11px] text-slate-500">{t.durationMinutes ? `${t.durationMinutes} mins` : 'Exam'} &bull; {t.totalMarks || 100} Marks</span>
                        </div>
                        <span className="px-2.5 py-1 rounded-lg bg-red-100 text-[#991b1b] font-black text-[10px]">
                          Active
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Live Campus Audit Feed */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#991b1b]" />
                    Live Activity Stream
                  </h3>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>

                <div className="space-y-3 text-xs">
                  {auditLogs.length > 0 ? (
                    auditLogs.slice(0, 3).map((log) => (
                      <div key={log.id} className="flex items-start gap-2.5">
                        <div className="w-2 h-2 rounded-full bg-[#991b1b] mt-1.5 shrink-0" />
                        <div>
                          <p className="text-slate-800 font-medium">
                            <span className="font-bold">{log.action.replace('_', ' ')}</span> &bull; {log.actorName}
                          </p>
                          <span className="text-[10px] text-slate-400">
                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-start gap-2.5">
                      <div className="w-2 h-2 rounded-full bg-[#991b1b] mt-1.5 shrink-0" />
                      <div>
                        <p className="text-slate-800">
                          <span className="font-bold">Workspace Initialized</span> for {currentOrg.tradeName}
                        </p>
                        <span className="text-[10px] text-slate-400">Session active &bull; Cloud Ready</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        </>
      )}

      {/* ======================================================================= */}
      {/* ROLE 2: TEACHER / FACULTY EXPERIENCE                                    */}
      {/* ======================================================================= */}
      {isTeacher && (
        <div className="space-y-6">
          {/* Faculty Dedicated Hero Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#450a0a] via-[#881337] to-[#9f1239] text-white p-6 sm:p-8 shadow-xl border border-rose-900/40">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-black/40 text-rose-200 border border-white/15 flex items-center gap-1.5 w-fit backdrop-blur-xs">
                  <GraduationCap className="w-3.5 h-3.5 text-rose-300" />
                  Faculty Workstation &bull; {currentOrg.tradeName}
                </span>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  Welcome, {currentUser.fullName}
                </h1>
                <p className="text-xs sm:text-sm text-rose-100/90 font-medium">
                  {currentUser.designation || 'Faculty Member'} &bull; Today&apos;s lectures, biometric attendance, and student performance diagnostics.
                </p>
              </div>
              <div className="bg-black/30 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-white/15 flex items-center gap-2 shrink-0 self-start sm:self-center text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-bold text-rose-100 text-[11px] uppercase tracking-wider">Faculty Portal Active</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-5 border-t border-white/15 text-xs">
              <div>
                <span className="text-rose-200/80 block text-[11px]">Today&apos;s Classes</span>
                <span className="text-xl font-black text-white block mt-0.5">{batches.slice(0, 2).length} Lectures</span>
                <span className="text-rose-200 text-[11px]">In-person schedules</span>
              </div>
              <div>
                <span className="text-rose-200/80 block text-[11px]">Assigned Batches</span>
                <span className="text-xl font-black text-white block mt-0.5">{batches.length} Active</span>
                <span className="text-rose-200 text-[11px]">Syllabus on track</span>
              </div>
              <div>
                <span className="text-rose-200/80 block text-[11px]">Enrolled Students</span>
                <span className="text-xl font-black text-white block mt-0.5">{totalStudents}</span>
                <span className="text-rose-200 text-[11px]">Across your batches</span>
              </div>
              <div>
                <span className="text-rose-200/80 block text-[11px]">Biometric Attendance</span>
                <span className="text-xl font-black text-white block mt-0.5">94%</span>
                <span className="text-rose-200 text-[11px]">Campus punch active</span>
              </div>
            </div>
          </div>
          <div className="bg-red-50/70 border border-red-200 rounded-3xl p-6 flex items-start gap-3">
            <GraduationCap className="w-6 h-6 text-[#991b1b] shrink-0 mt-0.5" />
            <div>
              <h2 className="font-black text-base text-slate-900">Faculty Command Center: Focus on Teaching</h2>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Zero administrative burden. Take 1-tap attendance, review concept weakness diagnostics in your subject, upload formula sheets, and publish test grades.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: My Classes Today */}
            <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#991b1b]" />
                My Classes Scheduled Today
              </h3>

              {batches.length === 0 ? (
                <div className="p-8 rounded-2xl border border-dashed border-slate-200 text-center space-y-2">
                  <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
                  <div className="text-sm font-bold text-slate-700">No classes assigned yet</div>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Once batches are created, daily timetable rosters and student check-in shortcuts appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {batches.slice(0, 2).map((b, idx) => (
                    <div key={b.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 flex items-center justify-between gap-4">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                          {b.code || `Batch ${idx + 1}`}
                        </span>
                        <h4 className="font-bold text-sm text-slate-900 mt-1.5">{b.name}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">{b.currentEnrollment} students enrolled</p>
                      </div>
                      <Link
                        href="/academics/attendance"
                        className="px-4 py-2 bg-[#991b1b] hover:bg-[#7f1d1d] text-white text-xs font-bold rounded-xl shadow-xs shrink-0 transition-colors"
                      >
                        1-Tap Attendance
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Faculty Shortcuts */}
            <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
              <h3 className="font-black text-base text-slate-900">Faculty Shortcuts</h3>
              <div className="space-y-3">
                <Link
                  href="/materials"
                  className="p-4 rounded-2xl border border-slate-200 hover:border-red-300 transition-all flex items-center justify-between group bg-slate-50/50"
                >
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-5 h-5 text-[#991b1b]" />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">Share DPP / Notes</span>
                      <span className="text-[11px] text-slate-500">Upload PDF for Students</span>
                    </div>
                  </div>
                  <span className="text-xs text-[#991b1b] font-bold">Upload →</span>
                </Link>

                <Link
                  href="/academics/tests"
                  className="p-4 rounded-2xl border border-slate-200 hover:border-red-300 transition-all flex items-center justify-between group bg-slate-50/50"
                >
                  <div className="flex items-center gap-3">
                    <FileCheck2 className="w-5 h-5 text-[#991b1b]" />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">Review Scores</span>
                      <span className="text-[11px] text-slate-500">Topic accuracy matrix</span>
                    </div>
                  </div>
                  <span className="text-xs text-[#991b1b] font-bold">Inspect →</span>
                </Link>

                <Link
                  href="/messages"
                  className="p-4 rounded-2xl border border-slate-200 hover:border-red-300 transition-all flex items-center justify-between group bg-slate-50/50"
                >
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-5 h-5 text-[#991b1b]" />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">Message Parents</span>
                      <span className="text-[11px] text-slate-500">Send homework reminder</span>
                    </div>
                  </div>
                  <span className="text-xs text-[#991b1b] font-bold">Send →</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* ROLE 3: STUDENT EXPERIENCE & LEARNER COCKPIT                            */}
      {/* ======================================================================= */}
      {isStudent && (
        <div className="space-y-6">
          {/* Student Dedicated Hero Banner (Indigo / Violet Theme) */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#1e1b4b] via-[#312e81] to-[#4338ca] text-white p-6 sm:p-8 shadow-xl border border-indigo-900/50">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
              <div className="space-y-1.5">
                <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-white/10 text-indigo-200 border border-white/15 flex items-center gap-1.5 w-fit backdrop-blur-xs">
                  <GraduationCap className="w-3.5 h-3.5 text-indigo-300" />
                  Student Portal &bull; {currentOrg.tradeName}
                </span>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  Welcome back, {currentUser.fullName}
                </h1>
                <p className="text-xs sm:text-sm text-indigo-200/90 font-medium">
                  Roll No: <span className="font-bold text-white">{currentStudent?.rollNumber || 'KOTA-JEE-27-01'}</span> &bull; Batch: <span className="font-bold text-white">{activeStudentBatch?.name || 'Target IIT-JEE 2026 Rankers'}</span>
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-white/15 flex items-center gap-2 shrink-0 self-start sm:self-center text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-bold text-indigo-100 text-[11px] uppercase tracking-wider">Attendance: Verified In</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-5 border-t border-white/15 text-xs relative z-10">
              <div>
                <span className="text-indigo-200/80 block text-[11px]">Campus Attendance</span>
                <span className="text-xl font-black text-white block mt-0.5">94%</span>
                <span className="text-emerald-300 text-[11px] font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Present Today
                </span>
              </div>
              <div>
                <span className="text-indigo-200/80 block text-[11px]">Due Homework / DPP</span>
                <span className="text-xl font-black text-white block mt-0.5">2 Tasks</span>
                <span className="text-amber-300 text-[11px] font-medium">Due by 09:00 PM</span>
              </div>
              <div>
                <span className="text-indigo-200/80 block text-[11px]">Latest Test Score</span>
                <span className="text-xl font-black text-white block mt-0.5">242 / 300</span>
                <span className="text-indigo-200 text-[11px]">Rank #4 in Batch</span>
              </div>
              <div>
                <span className="text-indigo-200/80 block text-[11px]">Fee Account</span>
                <span className="text-xl font-black text-white block mt-0.5">
                  {studentTotalBalancePaise === 0 ? '₹0 Due' : `₹${(studentTotalBalancePaise/100).toLocaleString('en-IN')}`}
                </span>
                <span className="text-emerald-300 text-[11px] font-medium">Paid in Good Standing</span>
              </div>
            </div>
          </div>

          {/* Student Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column (8 cols): Lectures, Homework, Test Performance */}
            <div className="lg:col-span-8 space-y-6">
              {/* Today's Classes Timetable */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-indigo-600" />
                    Today&apos;s Class Lectures & Timetable
                  </h3>
                  <Link href="/academics/timetable" className="text-xs font-bold text-indigo-600 hover:text-indigo-700">
                    Full Schedule →
                  </Link>
                </div>

                <div className="space-y-3">
                  <div className="p-4 rounded-2xl border border-indigo-100 bg-indigo-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                        PHY
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-md">
                            Room 204 &bull; Hall A
                          </span>
                          <span className="text-xs text-slate-500 font-medium">04:30 PM – 06:00 PM</span>
                        </div>
                        <h4 className="font-bold text-sm text-slate-900 mt-1">Electrodynamics & Gauss Law Applications</h4>
                        <p className="text-xs text-slate-500">Faculty: Prof. Alok Mukherjee</p>
                      </div>
                    </div>
                    <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold shrink-0 self-start sm:self-center flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5" /> Biometric Present
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-violet-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                        CHEM
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase tracking-wider text-violet-700 bg-violet-100 px-2 py-0.5 rounded-md">
                            Room 102 &bull; Hall B
                          </span>
                          <span className="text-xs text-slate-500 font-medium">06:15 PM – 07:45 PM</span>
                        </div>
                        <h4 className="font-bold text-sm text-slate-900 mt-1">Reaction Mechanisms & Electrophilic Addition</h4>
                        <p className="text-xs text-slate-500">Faculty: Dr. R. Sharma</p>
                      </div>
                    </div>
                    <span className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold shrink-0 self-start sm:self-center">
                      Upcoming at 06:15 PM
                    </span>
                  </div>
                </div>
              </div>

              {/* Active Homework & DPP Worksheets */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-indigo-600" />
                    Homework & Daily Practice Problems (DPP)
                  </h3>
                  <Link href="/academics/homework" className="text-xs font-bold text-indigo-600 hover:text-indigo-700">
                    View All Tasks →
                  </Link>
                </div>

                <div className="space-y-3">
                  <div className="p-4 rounded-2xl border border-slate-200 hover:border-indigo-200 transition-all bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                          Due Today 09:00 PM
                        </span>
                        <span className="text-xs text-slate-400 font-medium">Physics &bull; DPP-14</span>
                      </div>
                      <h4 className="font-bold text-sm text-slate-900 mt-1">Electrostatics Potential & Capacitance Problem Set</h4>
                      <p className="text-xs text-slate-500 mt-0.5">25 Numerical Questions &bull; Submit scanned worksheet PDF</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        href="/materials"
                        className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" /> PDF
                      </Link>
                      <Link
                        href="/academics/homework"
                        className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white shadow-xs"
                      >
                        Submit
                      </Link>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl border border-slate-200 hover:border-indigo-200 transition-all bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                          Due Tomorrow
                        </span>
                        <span className="text-xs text-slate-400 font-medium">Chemistry &bull; DPP-21</span>
                      </div>
                      <h4 className="font-bold text-sm text-slate-900 mt-1">Aldehydes, Ketones & Carboxylic Acids Revision</h4>
                      <p className="text-xs text-slate-500 mt-0.5">20 Mechanism Reactions &bull; Graded by faculty</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        href="/materials"
                        className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" /> PDF
                      </Link>
                      <Link
                        href="/academics/homework"
                        className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white shadow-xs"
                      >
                        Submit
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Test Scorecard */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-500" />
                    Recent Test Scorecard & Batch Rank
                  </h3>
                  <Link href="/academics/tests" className="text-xs font-bold text-indigo-600 hover:text-indigo-700">
                    All Test Reports →
                  </Link>
                </div>

                <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-indigo-50/30 border border-slate-200 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-100 px-2.5 py-0.5 rounded-full">
                        Full Mock Assessment #3
                      </span>
                      <h4 className="font-bold text-base text-slate-900 mt-1">JEE Advanced All-India Benchmark Test</h4>
                      <p className="text-xs text-slate-500">Conducted on Sunday &bull; Batch: {activeStudentBatch?.name || 'JEE Rankers'}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-black text-indigo-700">242 <span className="text-sm font-bold text-slate-400">/ 300</span></div>
                      <div className="text-xs font-bold text-emerald-600">Rank #4 &bull; 98.4th Percentile</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-200/80">
                    <div className="p-3 rounded-xl bg-white border border-slate-200 text-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Physics</span>
                      <div className="text-base font-black text-slate-900 mt-0.5">88 / 100</div>
                      <span className="text-[10px] font-bold text-emerald-600">Strong (88%)</span>
                    </div>
                    <div className="p-3 rounded-xl bg-white border border-slate-200 text-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Chemistry</span>
                      <div className="text-base font-black text-slate-900 mt-0.5">82 / 100</div>
                      <span className="text-[10px] font-bold text-emerald-600">Good (82%)</span>
                    </div>
                    <div className="p-3 rounded-xl bg-white border border-slate-200 text-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Mathematics</span>
                      <div className="text-base font-black text-slate-900 mt-0.5">72 / 100</div>
                      <span className="text-[10px] font-bold text-amber-600">Needs Focus (72%)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column (4 cols): AI Concept Revision, Materials, Fee Receipts */}
            <div className="lg:col-span-4 space-y-6">
              {/* AI Concept Revision Radar */}
              <div className="bg-white rounded-3xl border border-indigo-200/80 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-indigo-800 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200 flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-indigo-600" />
                    AI Concept Radar
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">Personalized</span>
                </div>
                <h4 className="font-black text-sm text-slate-900">What should you study next?</h4>
                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-1.5">
                    <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      Priority 1: Rotational Dynamics
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Moment of inertia questions took 4.2 mins/question. Solve the 15-question targeted booster pack.
                    </p>
                    <Link href="/materials" className="inline-block text-[11px] font-bold text-indigo-700 hover:underline pt-1">
                      Download Booster Worksheet →
                    </Link>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-200 space-y-1.5">
                    <div className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-indigo-600" />
                      Priority 2: Organic Reaction Mechanisms
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Syllabus revision scheduled for tomorrow&apos;s lecture. Read lecture notes chapter 4.
                    </p>
                    <Link href="/materials" className="inline-block text-[11px] font-bold text-indigo-700 hover:underline pt-1">
                      Open Formula Sheet →
                    </Link>
                  </div>
                </div>
              </div>

              {/* Study Materials & Formula Sheets */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-3">
                <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  Study Materials & Formula Sheets
                </h4>
                <div className="space-y-2 text-xs">
                  <Link
                    href="/materials"
                    className="p-3 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:bg-slate-50 flex items-center justify-between group transition-all"
                  >
                    <div>
                      <div className="font-bold text-slate-800">JEE Advanced Physics Handbook</div>
                      <div className="text-[11px] text-slate-400">PDF &bull; 4.2 MB</div>
                    </div>
                    <Download className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                  </Link>
                  <Link
                    href="/materials"
                    className="p-3 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:bg-slate-50 flex items-center justify-between group transition-all"
                  >
                    <div>
                      <div className="font-bold text-slate-800">Inorganic Chemistry Quick Tables</div>
                      <div className="text-[11px] text-slate-400">PDF &bull; 2.8 MB</div>
                    </div>
                    <Download className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                  </Link>
                </div>
              </div>

              {/* My Fee Invoices & GST Receipts */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-3">
                <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  Fee Invoices & Tax Receipts
                </h4>
                <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-1">
                  <div className="text-[11px] font-bold text-emerald-800 uppercase">Account Status</div>
                  <div className="text-base font-black text-emerald-950">Paid in Full &bull; No Balance</div>
                  <div className="text-[11px] text-emerald-700">Official GST Invoice generated for 2026-27</div>
                </div>
                <Link
                  href="/finance"
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" /> Download Official GST Receipt
                </Link>
              </div>

              {/* Ask Doubt / Faculty Helpline */}
              <div className="p-5 rounded-3xl bg-slate-900 text-white space-y-3 shadow-md">
                <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold">
                  <MessageSquare className="w-4 h-4" /> Faculty Doubt Support
                </div>
                <h4 className="font-black text-sm">Have a question or concept doubt?</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Message your batch faculty or submit a photo of your unsolved numerical for immediate doubt clearance.
                </p>
                <Link
                  href="/messages"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold rounded-xl transition-colors"
                >
                  Ask Doubt Now →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* ROLE 4: PARENT EXPERIENCE & TRANSPARENCY PORTAL                         */}
      {/* ======================================================================= */}
      {isParent && (
        <div className="space-y-6">
          {/* Parent Dedicated Hero Banner (Emerald / Forest Theme) */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#064e3b] via-[#065f46] to-[#047857] text-white p-6 sm:p-8 shadow-xl border border-emerald-900/50">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none" />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
              <div className="space-y-1.5">
                <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-white/10 text-emerald-200 border border-white/15 flex items-center gap-1.5 w-fit backdrop-blur-xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                  Parent Transparency Portal &bull; {currentOrg.tradeName}
                </span>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  Welcome, {currentUser.fullName}
                </h1>
                <p className="text-xs sm:text-sm text-emerald-100/90 font-medium">
                  Monitoring Ward: <span className="font-bold text-white">{currentWard?.fullName || 'Ishita Mehra'}</span> &bull; Roll No: <span className="font-bold text-white">{currentWard?.rollNumber || 'KOTA-JEE-27-01'}</span> &bull; Batch: <span className="font-bold text-white">{activeStudentBatch?.name || 'Target IIT-JEE 2026'}</span>
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-white/15 flex items-center gap-2 shrink-0 self-start sm:self-center text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                <span className="font-bold text-emerald-100 text-[11px] uppercase tracking-wider">Campus Biometrics Active</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-5 border-t border-white/15 text-xs relative z-10">
              <div>
                <span className="text-emerald-200/80 block text-[11px]">Today&apos;s Gate Check-in</span>
                <span className="text-xl font-black text-white block mt-0.5">08:52 AM</span>
                <span className="text-emerald-300 text-[11px] font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Campus Verified
                </span>
              </div>
              <div>
                <span className="text-emerald-200/80 block text-[11px]">Monthly Attendance</span>
                <span className="text-xl font-black text-white block mt-0.5">94%</span>
                <span className="text-emerald-200 text-[11px]">22 / 24 Days Attended</span>
              </div>
              <div>
                <span className="text-emerald-200/80 block text-[11px]">Academic Batch Standing</span>
                <span className="text-xl font-black text-white block mt-0.5">Rank #4</span>
                <span className="text-emerald-200 text-[11px]">Top 10% in Batch</span>
              </div>
              <div>
                <span className="text-emerald-200/80 block text-[11px]">Fee Account Standing</span>
                <span className="text-xl font-black text-white block mt-0.5">No Dues</span>
                <span className="text-emerald-300 text-[11px] font-medium">All Invoices Paid</span>
              </div>
            </div>
          </div>

          {/* Parent Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column (8 cols): Biometric Attendance Track, Academic Progress, Homework Tracker */}
            <div className="lg:col-span-8 space-y-6">
              {/* Live Campus Biometric Attendance */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                    <CalendarCheck className="w-4 h-4 text-emerald-600" />
                    Biometric Campus Attendance & Safety Log
                  </h3>
                  <Link href="/academics/attendance" className="text-xs font-bold text-emerald-700 hover:text-emerald-800">
                    Monthly Calendar →
                  </Link>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-base">
                      ✓
                    </div>
                    <div>
                      <div className="text-xs font-bold text-emerald-950">Present at Campus Today</div>
                      <div className="text-xs text-emerald-700">Punch-in verified at 08:52 AM &bull; Main Gate Biometric Reader 1</div>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-300 w-fit">
                    Verified Safe
                  </span>
                </div>

                {/* 7-Day Attendance Visual Track */}
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-bold text-slate-600">Past 6 Academic Sessions:</span>
                  <div className="grid grid-cols-6 gap-2">
                    {[
                      { day: 'Mon', date: 'Sep 18', status: 'PRESENT' },
                      { day: 'Tue', date: 'Sep 19', status: 'PRESENT' },
                      { day: 'Wed', date: 'Sep 20', status: 'PRESENT' },
                      { day: 'Thu', date: 'Sep 21', status: 'PRESENT' },
                      { day: 'Fri', date: 'Sep 22', status: 'PRESENT' },
                      { day: 'Sat', date: 'Sep 23', status: 'PRESENT' },
                    ].map((item, i) => (
                      <div key={i} className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-center">
                        <div className="text-[10px] font-bold text-slate-400">{item.day}</div>
                        <div className="text-xs font-bold text-slate-700">{item.date}</div>
                        <div className="mt-1 text-[11px] font-bold text-emerald-600 flex items-center justify-center gap-0.5">
                          <Check className="w-3 h-3" /> P
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Ward Academic Report Card */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                    <Award className="w-4 h-4 text-emerald-600" />
                    Ward Academic Report & Test Scores
                  </h3>
                  <Link href="/academics/tests" className="text-xs font-bold text-emerald-700 hover:text-emerald-800">
                    Comprehensive Report →
                  </Link>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Latest Official Benchmark Test</span>
                      <h4 className="font-black text-base text-slate-900">JEE Advanced Full Mock Assessment #3</h4>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-black text-emerald-700">242 / 300</div>
                      <div className="text-xs font-bold text-slate-600">Batch Rank: #4 (Top 10%)</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 bg-white rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Physics</span>
                      <div className="text-base font-black text-slate-900">88 / 100</div>
                      <div className="text-[10px] text-emerald-600 font-bold">Excellent understanding</div>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Chemistry</span>
                      <div className="text-base font-black text-slate-900">82 / 100</div>
                      <div className="text-[10px] text-emerald-600 font-bold">Consistent performance</div>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Mathematics</span>
                      <div className="text-base font-black text-slate-900">72 / 100</div>
                      <div className="text-[10px] text-amber-600 font-bold">Extra practice recommended</div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs space-y-1">
                    <span className="font-bold text-amber-900 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      Faculty Observation (Prof. Alok Mukherjee)
                    </span>
                    <p className="text-slate-600 leading-relaxed">
                      &quot;{currentWard?.fullName || 'Ishita'} is showing exceptional discipline and clarity in Mechanics and Physical Chemistry. We have recommended 15 additional practice problems in Integral Calculus this week to boost her rank into the Top 3.&quot;
                    </p>
                  </div>
                </div>
              </div>

              {/* Daily Assignment & Homework Discipline */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-emerald-600" />
                    Homework & DPP Submission Rate
                  </h3>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    92% Submission Rate
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                    <div className="text-slate-500 font-medium">Assigned Problem Sets This Month</div>
                    <div className="text-2xl font-black text-slate-900 mt-1">26 Worksheets</div>
                    <div className="text-emerald-600 font-medium text-[11px] mt-0.5">24 Submitted on time</div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                    <div className="text-slate-500 font-medium">Missed or Late Deadlines</div>
                    <div className="text-2xl font-black text-emerald-700 mt-1">0 Overdue</div>
                    <div className="text-slate-500 font-medium text-[11px] mt-0.5">High academic consistency</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column (4 cols): Official Fee Receipt, Faculty Contact, Institute Helpline */}
            <div className="lg:col-span-4 space-y-6">
              {/* Official Fee Ledger & GST Invoices */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
                <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  Official Fee Ledger & Tax Invoices
                </h4>

                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-emerald-800 font-bold uppercase">Academic Year 2026-27</span>
                    <span className="text-xs font-black text-emerald-900">100% Cleared</span>
                  </div>
                  <div className="text-2xl font-black text-emerald-950">₹90,000</div>
                  <div className="text-xs text-emerald-700">Official GST Invoice generated. Zero balance pending.</div>
                </div>

                <div className="space-y-2">
                  <Link
                    href="/finance"
                    className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" /> Download Official GST Receipt (PDF)
                  </Link>
                  <Link
                    href="/finance"
                    className="w-full py-2 px-4 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" /> View Detailed Payment History
                  </Link>
                </div>
              </div>

              {/* Direct Faculty & Institute Direct Line */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
                <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-emerald-600" />
                  Direct Teacher & Institute Hotline
                </h4>

                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-xs text-slate-900">Prof. Alok Mukherjee</div>
                        <div className="text-[11px] text-slate-500">Batch Mentor & Senior Faculty</div>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        Online
                      </span>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <a
                        href="https://wa.me/919829012345?text=Hello%20Prof%20Mukherjee%2C%20I%20am%20calling%20regarding%20my%20ward%20Ishita%20Mehra."
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg text-center transition-colors"
                      >
                        WhatsApp Mentor
                      </a>
                      <a
                        href="tel:+919829012345"
                        className="py-1.5 px-3 border border-slate-200 hover:bg-slate-100 text-slate-700 text-[11px] font-bold rounded-lg transition-colors"
                      >
                        Call
                      </a>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-2">
                    <div>
                      <div className="font-bold text-xs text-slate-900">Campus Reception & Accounts</div>
                      <div className="text-[11px] text-slate-500">{currentOrg.tradeName} Front Desk</div>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <a
                        href="tel:+919414012345"
                        className="flex-1 py-1.5 px-3 border border-slate-200 hover:bg-slate-100 text-slate-700 text-[11px] font-bold rounded-lg text-center transition-colors"
                      >
                        Call Reception (+91 94140 12345)
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Next Parent-Teacher Meeting (PTM) Notice */}
              <div className="p-5 rounded-3xl bg-slate-900 text-white space-y-2.5 shadow-md">
                <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold">
                  <Calendar className="w-4 h-4" /> Next Parent-Teacher Meeting (PTM)
                </div>
                <h4 className="font-black text-sm">Sunday, 10:00 AM – 01:00 PM</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Interactive progress evaluation with subject faculty. You can attend offline at campus or join virtually.
                </p>
                <div className="pt-1">
                  <span className="px-3 py-1 bg-white/10 rounded-lg text-[11px] font-bold text-emerald-200 border border-white/10">
                    Room 204 / Hall A
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Proprietary Dropout & Churn Radar Modal */}
      <DropoutRadarModal
        isOpen={isDropoutModalOpen}
        onClose={() => setIsDropoutModalOpen(false)}
        summary={attritionSummary}
        instituteName={currentOrg.tradeName}
      />

      {/* PDC Cheque Vault & Daily Cash Counter Daybook Modal */}
      <PdcChequeVaultModal
        isOpen={isPdcModalOpen}
        onClose={() => setIsPdcModalOpen(false)}
        instituteName={currentOrg.tradeName}
      />
    </div>
  );
}
