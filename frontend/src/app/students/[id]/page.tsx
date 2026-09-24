'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '@/lib/context/AppContext';
import { db } from '@/lib/db/store';
import { Student, Batch, Course, Invoice, AttendanceRecord, ClassSession } from '@/lib/types';
import {
  ArrowLeft,
  Phone,
  MessageSquare,
  Edit3,
  Download,
  User,
  Calendar,
  BookOpen,
  CreditCard,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  GraduationCap,
  Users,
  Building2,
  BadgeCheck,
  AlertCircle,
  FileText,
  Send,
  Plus,
  Banknote,
  BarChart3,
  Star,
  Target,
  Layers,
  Shield,
  Info,
  Receipt,
} from 'lucide-react';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatRupees = (paise: number) => `₹${Math.round(paise / 100).toLocaleString('en-IN')}`;
const formatDate = (d?: string) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

// ─── Seeded test result data (per-student) ──────────────────────────────────

interface TestResult {
  id: string;
  testTitle: string;
  date: string;
  score: number;
  totalMarks: number;
  rank: number;
  batchSize: number;
  physics?: number;
  chemistry?: number;
  maths?: number;
}

function seedTestResults(studentId: string): TestResult[] {
  const hash = studentId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const base = 50 + (hash % 35);
  return [
    { id: 't1', testTitle: 'Weekly Test 01 – Kinematics', date: '2026-08-05', score: Math.min(100, base + 8), totalMarks: 100, rank: 4, batchSize: 28, physics: Math.min(40, Math.round((base+8)*0.4)), chemistry: Math.min(30, Math.round((base+8)*0.3)), maths: Math.min(30, Math.round((base+8)*0.3)) },
    { id: 't2', testTitle: 'Weekly Test 02 – Newton\'s Laws',  date: '2026-08-19', score: Math.min(100, base + 5), totalMarks: 100, rank: 6, batchSize: 28, physics: Math.min(40, Math.round((base+5)*0.4)), chemistry: Math.min(30, Math.round((base+5)*0.3)), maths: Math.min(30, Math.round((base+5)*0.3)) },
    { id: 't3', testTitle: 'Mid-Term – Physics + Chemistry',   date: '2026-09-02', score: Math.min(100, base + 12), totalMarks: 100, rank: 3, batchSize: 28, physics: Math.min(40, Math.round((base+12)*0.4)), chemistry: Math.min(30, Math.round((base+12)*0.3)), maths: Math.min(30, Math.round((base+12)*0.3)) },
    { id: 't4', testTitle: 'Weekly Test 03 – Thermodynamics',  date: '2026-09-16', score: Math.min(100, base - 5), totalMarks: 100, rank: 9, batchSize: 28, physics: Math.min(40, Math.round((base-5)*0.4)), chemistry: Math.min(30, Math.round((base-5)*0.3)), maths: Math.min(30, Math.round((base-5)*0.3)) },
  ];
}

function seedActivityTimeline(student: Student): Array<{ id: string; type: string; title: string; desc: string; time: string; icon: React.ReactNode; color: string }> {
  return [
    { id: 'a1', type: 'ADMISSION', title: 'Student Enrolled', desc: `Admitted to batch. Roll No: ${student.rollNumber}`, time: '2026-06-01T10:00:00', icon: <GraduationCap className="w-4 h-4" />, color: 'bg-emerald-100 text-emerald-700' },
    { id: 'a2', type: 'PAYMENT',   title: 'Payment Received', desc: 'First installment of ₹48,000 collected via UPI', time: '2026-06-05T14:30:00', icon: <CreditCard className="w-4 h-4" />, color: 'bg-blue-100 text-blue-700' },
    { id: 'a3', type: 'ATTENDANCE',title: 'Attendance Warning', desc: 'Attendance dropped to 68% — parent notified', time: '2026-07-22T09:00:00', icon: <AlertCircle className="w-4 h-4" />, color: 'bg-amber-100 text-amber-700' },
    { id: 'a4', type: 'TEST',      title: 'Test Result Uploaded', desc: 'Scored 62/100 in Mid-Term Physics + Chemistry', time: '2026-09-02T17:00:00', icon: <FileText className="w-4 h-4" />, color: 'bg-violet-100 text-violet-700' },
    { id: 'a5', type: 'NOTE',      title: 'Teacher Note', desc: 'Student showing improvement in Organic Chemistry', time: '2026-09-15T11:20:00', icon: <Edit3 className="w-4 h-4" />, color: 'bg-slate-100 text-slate-700' },
    { id: 'a6', type: 'PAYMENT',   title: 'Payment Received', desc: 'Second installment of ₹48,000 collected via Bank Transfer', time: '2026-09-20T10:05:00', icon: <CreditCard className="w-4 h-4" />, color: 'bg-blue-100 text-blue-700' },
  ].reverse();
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: Student['status'] }) {
  const cfg = {
    ACTIVE:  { label: 'Active',  cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    ALUMNI:  { label: 'Alumni',  cls: 'bg-blue-100 text-blue-700 border-blue-200' },
    DROPOUT: { label: 'Dropout', cls: 'bg-rose-100 text-rose-700 border-rose-200' },
  }[status];
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${cfg.cls}`}>
      {status === 'ACTIVE' && <BadgeCheck className="w-3 h-3" />}
      {cfg.label}
    </span>
  );
}

function InvoiceStatusBadge({ status }: { status: Invoice['status'] }) {
  const cfg: Record<Invoice['status'], { label: string; cls: string }> = {
    DRAFT:           { label: 'Draft',           cls: 'bg-slate-100 text-slate-600' },
    ISSUED:          { label: 'Issued',           cls: 'bg-blue-100 text-blue-700' },
    PARTIALLY_PAID:  { label: 'Partial',          cls: 'bg-amber-100 text-amber-700' },
    PAID:            { label: 'Paid',             cls: 'bg-emerald-100 text-emerald-700' },
    OVERDUE:         { label: 'Overdue',          cls: 'bg-rose-100 text-rose-700' },
    CANCELLED:       { label: 'Cancelled',        cls: 'bg-slate-100 text-slate-500' },
    REFUNDED:        { label: 'Refunded',         cls: 'bg-violet-100 text-violet-700' },
  };
  const c = cfg[status] || cfg.ISSUED;
  return <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${c.cls}`}>{c.label}</span>;
}

function AttendanceBadge({ status }: { status: AttendanceRecord['status'] }) {
  const cfg = {
    PRESENT: { label: 'Present', cls: 'bg-emerald-100 text-emerald-700', icon: <CheckCircle2 className="w-3 h-3" /> },
    ABSENT:  { label: 'Absent',  cls: 'bg-rose-100 text-rose-700',    icon: <XCircle className="w-3 h-3" /> },
    LATE:    { label: 'Late',    cls: 'bg-amber-100 text-amber-700',   icon: <Clock className="w-3 h-3" /> },
    EXCUSED: { label: 'Excused', cls: 'bg-slate-100 text-slate-600',   icon: <Shield className="w-3 h-3" /> },
  }[status];
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${cfg.cls}`}>
      {cfg.icon}{cfg.label}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

type Tab = 'OVERVIEW' | 'ATTENDANCE' | 'FEES' | 'TESTS' | 'ACTIVITY';

export default function StudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { currentOrg, showToast } = useApp();
  const studentId = params?.id as string;

  const [activeTab, setActiveTab] = useState<Tab>('OVERVIEW');
  const [noteText, setNoteText] = useState('');
  const [activityFeed, setActivityFeed] = useState<ReturnType<typeof seedActivityTimeline>>([]);

  // ── Data loading ─────────────────────────────────────────────────────────
  const [student, setStudent] = useState<Student | null | undefined>(undefined); // undefined = loading
  const [batches, setBatches] = useState<Batch[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [classSessions, setClassSessions] = useState<ClassSession[]>([]);

  useEffect(() => {
    // Load from in-memory store first (synchronous)
    const s = db.getStudentById(studentId) || db.getStudents(currentOrg.id).find(s => s.id === studentId);
    setStudent(s || null);

    const b = db.getBatches(currentOrg.id);
    const c = db.getCourses(currentOrg.id);
    const inv = db.getInvoices(currentOrg.id);
    const att = db.getAttendanceRecords(currentOrg.id, studentId);
    const cs = db.getClassSessions(currentOrg.id);

    setBatches(b);
    setCourses(c);
    setInvoices(inv);
    setAttendanceRecords(att);
    setClassSessions(cs);

    if (s) setActivityFeed(seedActivityTimeline(s));

    // Try live fetch (graceful fallback)
    fetch(`/api/v1/students/${studentId}?organizationId=${currentOrg.id}`)
      .then(r => r.json())
      .then(json => { if (json?.data) { setStudent(json.data); setActivityFeed(seedActivityTimeline(json.data)); } })
      .catch(() => {});
  }, [studentId, currentOrg.id]);

  // ── Derived data ─────────────────────────────────────────────────────────
  const batch = useMemo(() => batches.find(b => b.id === student?.batchId), [batches, student]);
  const course = useMemo(() => courses.find(c => c.id === batch?.courseId), [courses, batch]);
  const studentInvoices = useMemo(() => invoices.filter(i => i.studentId === studentId), [invoices, studentId]);
  const testResults = useMemo(() => student ? seedTestResults(student.id) : [], [student]);

  // Attendance stats
  const attendanceBySession = useMemo(() => {
    if (!batch) return [];
    const batchSessions = classSessions.filter(cs => cs.batchId === batch.id && cs.status === 'COMPLETED');
    return batchSessions.slice(-10).map(sess => {
      const rec = attendanceRecords.find(a => a.sessionId === sess.id && a.studentId === studentId);
      return { session: sess, status: rec?.status || 'ABSENT' as AttendanceRecord['status'] };
    });
  }, [classSessions, attendanceRecords, batch, studentId]);

  const totalSessions = attendanceBySession.length || 24; // fallback
  const presentCount = attendanceBySession.filter(r => r.status === 'PRESENT' || r.status === 'LATE').length || 19;
  const attendancePct = Math.round((presentCount / totalSessions) * 100);

  // Fee stats
  const totalFeePaid = studentInvoices.reduce((s, i) => s + i.paidAmountPaise, 0);
  const totalFeeBalance = studentInvoices.reduce((s, i) => s + i.balanceAmountPaise, 0);

  // Score trend
  const avgScore = testResults.length ? Math.round(testResults.reduce((s, t) => s + t.score, 0) / testResults.length) : 0;
  const lastScore = testResults[testResults.length - 1]?.score || 0;
  const prevScore = testResults[testResults.length - 2]?.score || lastScore;
  const scoreImproving = lastScore >= prevScore;

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    const newActivity = {
      id: `note-${Date.now()}`,
      type: 'NOTE',
      title: 'Teacher Note Added',
      desc: noteText.trim(),
      time: new Date().toISOString(),
      icon: <Edit3 className="w-4 h-4" />,
      color: 'bg-slate-100 text-slate-700',
    };
    setActivityFeed(prev => [newActivity, ...prev]);
    setNoteText('');
    showToast('Note added to student activity', 'success');
  };

  // ─── Loading skeleton ─────────────────────────────────────────────────
  if (student === undefined) {
    return (
      <div className="p-6 space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded-xl w-32" />
        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex gap-6">
          <div className="w-20 h-20 rounded-2xl bg-slate-200" />
          <div className="flex-1 space-y-3">
            <div className="h-7 bg-slate-200 rounded-lg w-48" />
            <div className="h-4 bg-slate-100 rounded w-32" />
            <div className="h-4 bg-slate-100 rounded w-64" />
          </div>
        </div>
        <div className="h-64 bg-slate-200 rounded-2xl" />
      </div>
    );
  }

  // ─── 404 Not Found ────────────────────────────────────────────────────
  if (student === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <div className="w-20 h-20 rounded-2xl bg-rose-50 flex items-center justify-center mb-4">
          <AlertCircle className="w-10 h-10 text-rose-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Student Not Found</h2>
        <p className="text-slate-500 max-w-sm mb-6">
          We couldn't find a student with ID <code className="bg-slate-100 px-1.5 py-0.5 rounded text-sm font-mono">{studentId}</code>.
          They may have been removed or the link may be incorrect.
        </p>
        <Link
          href="/students"
          className="flex items-center gap-2 bg-[#991b1b] hover:bg-[#7f1d1d] text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Students
        </Link>
      </div>
    );
  }

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'OVERVIEW',   label: 'Overview',   icon: <Info className="w-4 h-4" /> },
    { key: 'ATTENDANCE', label: 'Attendance', icon: <Calendar className="w-4 h-4" /> },
    { key: 'FEES',       label: 'Fees',       icon: <CreditCard className="w-4 h-4" /> },
    { key: 'TESTS',      label: 'Tests',      icon: <BarChart3 className="w-4 h-4" /> },
    { key: 'ACTIVITY',   label: 'Activity',   icon: <Activity className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ─── Back bar ────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center gap-3">
        <Link href="/students" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 font-medium transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Students
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
        <span className="text-sm text-slate-900 font-semibold">{student.fullName}</span>
      </div>

      {/* ─── Hero Section ─────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <div className="flex flex-col sm:flex-row sm:items-start gap-5">
          {/* Avatar */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[#991b1b] to-[#450a0a] flex items-center justify-center text-white text-2xl font-bold shadow-lg flex-shrink-0">
            {getInitials(student.fullName)}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-start gap-3 mb-2">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{student.fullName}</h1>
              <StatusBadge status={student.status} />
              {student.gender === 'FEMALE' && (
                <span className="text-xs font-semibold px-2 py-1 bg-pink-50 text-pink-600 border border-pink-200 rounded-full">♀ Female</span>
              )}
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-slate-500">
              <span className="flex items-center gap-1.5"><Receipt className="w-3.5 h-3.5" /> Roll: <strong className="text-slate-700">{student.rollNumber}</strong></span>
              {batch && <span className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5" /> {batch.name}</span>}
              {student.phone && <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {student.phone}</span>}
              <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Guardian: <strong className="text-slate-700">{student.guardianName}</strong></span>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex flex-wrap gap-2 flex-shrink-0">
            <a
              href={`https://wa.me/${(student.guardianPhone || '').replace(/\D/g, '')}?text=Hello%20${encodeURIComponent(student.guardianName)}%2C%20regarding%20${encodeURIComponent(student.fullName)}'s%20progress.`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold border border-emerald-200 transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              WhatsApp Parent
            </a>
            <a
              href={`tel:${student.phone || student.guardianPhone}`}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold border border-blue-200 transition-colors"
            >
              <Phone className="w-3.5 h-3.5" />
              Call
            </a>
            <button
              onClick={() => showToast('Edit student modal coming soon!', 'info')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit
            </button>
            <button
              onClick={() => showToast('Exporting student profile PDF...', 'success')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Export
            </button>
          </div>
        </div>

        {/* Quick Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-100">
          {[
            { label: 'Attendance', value: `${attendancePct}%`, icon: <Calendar className="w-4 h-4" />, color: attendancePct >= 75 ? 'text-emerald-600' : 'text-rose-600', trend: attendancePct >= 75 ? '✅' : '⚠️' },
            { label: 'Fees Paid', value: formatRupees(totalFeePaid), icon: <Banknote className="w-4 h-4" />, color: 'text-blue-600', trend: totalFeeBalance > 0 ? `${formatRupees(totalFeeBalance)} due` : 'Fully Paid' },
            { label: 'Tests Taken', value: String(testResults.length), icon: <FileText className="w-4 h-4" />, color: 'text-violet-600', trend: `Avg ${avgScore}%` },
            { label: 'Last Active', value: 'Today', icon: <Activity className="w-4 h-4" />, color: 'text-slate-600', trend: 'Online' },
          ].map(stat => (
            <div key={stat.label} className="bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
              <div className="flex items-center gap-2 mb-1">
                <span className={stat.color}>{stat.icon}</span>
                <p className="text-xs text-slate-500 font-medium">{stat.label}</p>
              </div>
              <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{stat.trend}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Tab Navigation ───────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200 px-6 sticky top-0 z-10">
        <div className="flex gap-0 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-4 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.key ? 'border-[#991b1b] text-[#991b1b]' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-200'}`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Tab Content ──────────────────────────────────────────────── */}
      <div className="p-6">

        {/* ── OVERVIEW TAB ────────────────────────────────────────────── */}
        {activeTab === 'OVERVIEW' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-5">

              {/* Personal Details */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
                <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                  <User className="w-4 h-4 text-[#991b1b]" />
                  Personal Details
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Date of Birth',    value: formatDate(student.dob) },
                    { label: 'Gender',           value: student.gender.charAt(0) + student.gender.slice(1).toLowerCase() },
                    { label: 'Target Exam',      value: student.targetExam || course?.targetExam || '—' },
                    { label: 'Board',            value: student.board || '—' },
                    { label: 'School',           value: student.grade ? `Grade ${student.grade}` : '—' },
                    { label: 'DPDP Consent',     value: student.dpdpConsentGranted ? '✅ Granted' : '❌ Not Granted' },
                  ].map(item => (
                    <div key={item.label} className="space-y-1">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{item.label}</p>
                      <p className="text-sm font-semibold text-slate-800">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Guardian Details */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
                <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#991b1b]" />
                  Guardian Details
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Name',         value: student.guardianName },
                    { label: 'Relationship', value: student.guardianRelationship.replace('_', ' ') },
                    { label: 'Phone',        value: student.guardianPhone },
                    { label: 'Email',        value: student.guardianEmail || '—' },
                  ].map(item => (
                    <div key={item.label} className="space-y-1">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{item.label}</p>
                      <p className="text-sm font-semibold text-slate-800">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Enrollment Info */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
                <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-[#991b1b]" />
                  Enrollment Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Roll No',        value: student.rollNumber },
                    { label: 'Student ID',     value: student.studentUniqueId },
                    { label: 'Batch',          value: batch?.name || '—' },
                    { label: 'Course',         value: course?.name || '—' },
                    { label: 'Academic Year',  value: batch?.academicYear || '—' },
                    { label: 'Batch Capacity', value: batch ? `${batch.currentEnrollment}/${batch.maxCapacity}` : '—' },
                  ].map(item => (
                    <div key={item.label} className="space-y-1">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{item.label}</p>
                      <p className="text-sm font-semibold text-slate-800">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column – Quick Stats */}
            <div className="space-y-5">
              {/* Attendance Quick View */}
              <div className={`rounded-2xl border shadow-xs p-5 ${attendancePct >= 75 ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
                <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Attendance
                </h3>
                <div className="text-center mb-3">
                  <p className={`text-4xl font-black ${attendancePct >= 75 ? 'text-emerald-700' : 'text-rose-700'}`}>{attendancePct}%</p>
                  <p className="text-xs text-slate-500 mt-1">{presentCount} of {totalSessions} sessions attended</p>
                </div>
                <div className="w-full bg-white rounded-full h-3 shadow-inner">
                  <div
                    className={`h-3 rounded-full transition-all ${attendancePct >= 75 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                    style={{ width: `${attendancePct}%` }}
                  />
                </div>
                {attendancePct < 75 && (
                  <p className="text-xs text-rose-600 font-medium mt-2 text-center">⚠️ Below 75% threshold</p>
                )}
              </div>

              {/* Fee Summary */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
                <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-[#991b1b]" />
                  Fee Summary
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Total Billed</span>
                    <span className="font-bold text-slate-900">{formatRupees(studentInvoices.reduce((s, i) => s + i.netAmountPaise, 0))}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Paid</span>
                    <span className="font-bold text-emerald-700">{formatRupees(totalFeePaid)}</span>
                  </div>
                  <div className="flex justify-between text-sm border-t border-slate-100 pt-2">
                    <span className="text-slate-500">Balance</span>
                    <span className={`font-bold ${totalFeeBalance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{formatRupees(totalFeeBalance)}</span>
                  </div>
                </div>
              </div>

              {/* Test Performance */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
                <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                  <Target className="w-4 h-4 text-[#991b1b]" />
                  Test Performance
                </h3>
                <div className="text-center mb-3">
                  <p className="text-4xl font-black text-slate-900">{avgScore}<span className="text-lg text-slate-400">/100</span></p>
                  <div className={`flex items-center justify-center gap-1 text-xs font-medium mt-1 ${scoreImproving ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {scoreImproving ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {scoreImproving ? 'Improving' : 'Needs attention'}
                  </div>
                </div>
                <div className="space-y-1.5">
                  {testResults.slice(-3).map(t => (
                    <div key={t.id} className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 truncate max-w-[60%]">{t.testTitle.split(' – ')[0]}</span>
                      <span className="font-bold text-slate-800">{t.score}/100</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── ATTENDANCE TAB ───────────────────────────────────────────── */}
        {activeTab === 'ATTENDANCE' && (
          <div className="space-y-6">
            {/* Summary Card */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: 'Attendance %', value: `${attendancePct}%`, color: attendancePct >= 75 ? 'text-emerald-700' : 'text-rose-700', sub: 'This academic year' },
                { label: 'Present',      value: String(presentCount),                color: 'text-emerald-700', sub: 'Sessions attended' },
                { label: 'Absent',       value: String(totalSessions - presentCount), color: 'text-rose-700',   sub: 'Sessions missed' },
              ].map(stat => (
                <div key={stat.label} className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 text-center">
                  <p className={`text-4xl font-black ${stat.color} mb-1`}>{stat.value}</p>
                  <p className="text-sm font-semibold text-slate-700">{stat.label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{stat.sub}</p>
                </div>
              ))}
            </div>

            {/* Progress Bar */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-bold text-slate-700">Overall Attendance Progress</h3>
                <span className={`text-sm font-bold ${attendancePct >= 75 ? 'text-emerald-600' : 'text-rose-600'}`}>{attendancePct}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-4 relative">
                <div
                  className={`h-4 rounded-full transition-all duration-700 ${attendancePct >= 75 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                  style={{ width: `${attendancePct}%` }}
                />
                {/* 75% threshold marker */}
                <div className="absolute top-0 bottom-0 w-0.5 bg-amber-500" style={{ left: '75%' }} />
                <div className="absolute -top-5 text-xs text-amber-600 font-semibold" style={{ left: '75%', transform: 'translateX(-50%)' }}>75%</div>
              </div>
              <div className="flex justify-between text-xs text-slate-400 mt-2">
                <span>0%</span>
                <span>Required: 75%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Last 10 sessions */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
              <h3 className="text-sm font-bold text-slate-700 mb-4">Last {attendanceBySession.length || 10} Sessions</h3>
              {attendanceBySession.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <Calendar className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No session records found for this student.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {attendanceBySession.map(({ session, status }) => (
                    <div key={session.id} className="flex items-center justify-between py-2.5 px-4 rounded-xl hover:bg-slate-50 transition-colors border border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${status === 'PRESENT' ? 'bg-emerald-500' : status === 'LATE' ? 'bg-amber-500' : 'bg-rose-500'}`} />
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{session.topicName}</p>
                          <p className="text-xs text-slate-400">{formatDate(session.scheduledStart)}</p>
                        </div>
                      </div>
                      <AttendanceBadge status={status} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Monthly Heatmap (Simulated) */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
              <h3 className="text-sm font-bold text-slate-700 mb-4">September 2026 – Attendance Heatmap</h3>
              <div className="grid grid-cols-7 gap-1.5">
                {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
                  <div key={d} className="text-center text-xs font-semibold text-slate-400 pb-1">{d}</div>
                ))}
                {/* Empty padding for September 1 (Tuesday) */}
                <div />
                {Array.from({ length: 30 }, (_, i) => {
                  const day = i + 1;
                  const isWeekend = (i + 1) % 7 === 0 || (i + 2) % 7 === 0;
                  const hasClass = !isWeekend && day <= 23;
                  const present = hasClass && (day % 3 !== 0);
                  return (
                    <div
                      key={day}
                      title={`Sep ${day}`}
                      className={`aspect-square rounded-md flex items-center justify-center text-xs font-semibold transition-colors ${
                        !hasClass ? 'bg-slate-50 text-slate-300' :
                        present   ? 'bg-emerald-400 text-white' : 'bg-rose-300 text-white'
                      }`}
                    >
                      {day}
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-emerald-400" />Present</div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-rose-300" />Absent</div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-slate-100" />No Class</div>
              </div>
            </div>
          </div>
        )}

        {/* ── FEES TAB ──────────────────────────────────────────────────── */}
        {activeTab === 'FEES' && (
          <div className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: 'Total Billed',  value: formatRupees(studentInvoices.reduce((s, i) => s + i.netAmountPaise, 0)),  color: 'text-slate-900' },
                { label: 'Total Paid',    value: formatRupees(totalFeePaid),   color: 'text-emerald-700' },
                { label: 'Balance Due',   value: formatRupees(totalFeeBalance), color: totalFeeBalance > 0 ? 'text-rose-700' : 'text-emerald-700' },
              ].map(stat => (
                <div key={stat.label} className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 text-center">
                  <p className={`text-3xl font-black ${stat.color} mb-1`}>{stat.value}</p>
                  <p className="text-sm font-semibold text-slate-600">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Invoice List */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-700">Invoices</h3>
                <button
                  onClick={() => showToast('Collect payment modal coming soon!', 'info')}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 bg-[#991b1b] hover:bg-[#7f1d1d] text-white rounded-xl transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Collect Payment
                </button>
              </div>
              {studentInvoices.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <Receipt className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No invoices found for this student.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        <th className="px-5 py-3 text-left">Invoice No.</th>
                        <th className="px-5 py-3 text-right">Total</th>
                        <th className="px-5 py-3 text-right">Paid</th>
                        <th className="px-5 py-3 text-right">Balance</th>
                        <th className="px-5 py-3 text-left">Due Date</th>
                        <th className="px-5 py-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {studentInvoices.map(inv => (
                        <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-5 py-4 font-mono text-xs text-slate-600">{inv.invoiceNumber}</td>
                          <td className="px-5 py-4 text-right font-semibold text-slate-900">{formatRupees(inv.netAmountPaise)}</td>
                          <td className="px-5 py-4 text-right font-semibold text-emerald-700">{formatRupees(inv.paidAmountPaise)}</td>
                          <td className="px-5 py-4 text-right font-semibold text-rose-700">{formatRupees(inv.balanceAmountPaise)}</td>
                          <td className="px-5 py-4 text-slate-500 whitespace-nowrap">{formatDate(inv.dueDate)}</td>
                          <td className="px-5 py-4 text-center"><InvoiceStatusBadge status={inv.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Payment History */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
              <h3 className="text-sm font-bold text-slate-700 mb-4">Payment History</h3>
              {db.getPayments(currentOrg.id).filter(p => p.studentId === studentId).length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">No payment records found.</p>
              ) : (
                <div className="space-y-3">
                  {db.getPayments(currentOrg.id).filter(p => p.studentId === studentId).map(pay => (
                    <div key={pay.id} className="flex items-center justify-between py-3 px-4 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center">
                          <Banknote className="w-4 h-4 text-emerald-700" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{pay.paymentMethod} Payment</p>
                          <p className="text-xs text-slate-400">{pay.receiptNumber} · {formatDate(pay.createdAt)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-emerald-700">{formatRupees(pay.amountPaise)}</p>
                        <p className="text-xs text-slate-400">{pay.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TESTS TAB ─────────────────────────────────────────────────── */}
        {activeTab === 'TESTS' && (
          <div className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              {[
                { label: 'Tests Taken', value: String(testResults.length), color: 'text-slate-900' },
                { label: 'Avg Score',   value: `${avgScore}%`,             color: avgScore >= 60 ? 'text-emerald-700' : 'text-rose-700' },
                { label: 'Best Score',  value: `${Math.max(...testResults.map(t => t.score))}%`, color: 'text-violet-700' },
                { label: 'Trend',       value: scoreImproving ? '📈 Up' : '📉 Down', color: scoreImproving ? 'text-emerald-700' : 'text-rose-700' },
              ].map(stat => (
                <div key={stat.label} className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 text-center">
                  <p className={`text-3xl font-black ${stat.color} mb-1`}>{stat.value}</p>
                  <p className="text-sm font-semibold text-slate-600">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Score Trend Visual */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
              <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#991b1b]" />
                Score Trend
              </h3>
              <div className="flex items-end gap-3 h-28">
                {testResults.map((t, i) => {
                  const pct = (t.score / t.totalMarks) * 100;
                  const isLast = i === testResults.length - 1;
                  return (
                    <div key={t.id} className="flex-1 flex flex-col items-center gap-1">
                      <span className={`text-xs font-bold ${isLast ? 'text-[#991b1b]' : 'text-slate-600'}`}>{t.score}</span>
                      <div className="w-full relative">
                        <div
                          className={`rounded-t-lg transition-all duration-500 ${isLast ? 'bg-[#991b1b]' : 'bg-slate-200'}`}
                          style={{ height: `${Math.max(8, pct * 0.8)}px` }}
                        />
                      </div>
                      <span className="text-xs text-slate-400 text-center leading-tight">T{i + 1}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Subject-wise Performance */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
              <h3 className="text-sm font-bold text-slate-700 mb-4">Subject-wise Performance (Latest Test)</h3>
              {testResults.length > 0 && (() => {
                const latest = testResults[testResults.length - 1];
                return (
                  <div className="space-y-4">
                    {[
                      { subject: 'Physics', score: latest.physics || 0, max: 40, color: 'bg-blue-500' },
                      { subject: 'Chemistry', score: latest.chemistry || 0, max: 30, color: 'bg-violet-500' },
                      { subject: 'Mathematics', score: latest.maths || 0, max: 30, color: 'bg-amber-500' },
                    ].map(sub => {
                      const pct = Math.round((sub.score / sub.max) * 100);
                      return (
                        <div key={sub.subject} className="space-y-1.5">
                          <div className="flex justify-between items-center text-sm">
                            <span className="font-semibold text-slate-700">{sub.subject}</span>
                            <span className="font-bold text-slate-900">{sub.score}/{sub.max} <span className="text-slate-400 text-xs">({pct}%)</span></span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2.5">
                            <div className={`${sub.color} h-2.5 rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* Test List */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs">
              <div className="px-5 py-4 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-700">All Test Results</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      <th className="px-5 py-3 text-left">Test</th>
                      <th className="px-5 py-3 text-left">Date</th>
                      <th className="px-5 py-3 text-right">Score</th>
                      <th className="px-5 py-3 text-right">%</th>
                      <th className="px-5 py-3 text-right">Rank</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {testResults.map((t, i) => {
                      const pct = Math.round((t.score / t.totalMarks) * 100);
                      const prev = testResults[i - 1];
                      const up = prev ? t.score > prev.score : false;
                      return (
                        <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-5 py-4 font-medium text-slate-800">{t.testTitle}</td>
                          <td className="px-5 py-4 text-slate-500 whitespace-nowrap">{formatDate(t.date)}</td>
                          <td className="px-5 py-4 text-right font-bold text-slate-900">{t.score}/{t.totalMarks}</td>
                          <td className="px-5 py-4 text-right">
                            <span className={`inline-flex items-center gap-1 font-bold text-xs px-2 py-0.5 rounded-full ${pct >= 60 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                              {i > 0 && (up ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />)}
                              {pct}%
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <span className="flex items-center justify-end gap-1 text-slate-600 font-semibold">
                              <Star className="w-3 h-3 text-amber-400" />
                              {t.rank}/{t.batchSize}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── ACTIVITY TAB ──────────────────────────────────────────────── */}
        {activeTab === 'ACTIVITY' && (
          <div className="max-w-2xl space-y-6">
            {/* Add Note */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
              <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-[#991b1b]" />
                Add a Note
              </h3>
              <textarea
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                placeholder="Add a teacher note, observation, or flag for this student..."
                rows={3}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 resize-none outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400 transition-all placeholder:text-slate-400"
              />
              <div className="flex justify-end mt-3">
                <button
                  onClick={handleAddNote}
                  disabled={!noteText.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-[#991b1b] hover:bg-[#7f1d1d] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors"
                >
                  <Send className="w-4 h-4" />
                  Add Note
                </button>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
              <h3 className="text-sm font-bold text-slate-700 mb-5 flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#991b1b]" />
                Activity Timeline
              </h3>
              {activityFeed.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">No activity yet.</p>
              ) : (
                <div className="relative">
                  <div className="absolute left-5 top-0 bottom-0 w-px bg-slate-200" />
                  <div className="space-y-5">
                    {activityFeed.map(evt => (
                      <div key={evt.id} className="flex gap-4 relative">
                        <div className={`w-10 h-10 rounded-xl ${evt.color} flex items-center justify-center flex-shrink-0 z-10 border-2 border-white shadow-sm`}>
                          {evt.icon}
                        </div>
                        <div className="flex-1 pb-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-semibold text-slate-800">{evt.title}</p>
                            <p className="text-xs text-slate-400 whitespace-nowrap">{formatDate(evt.time)}</p>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">{evt.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
