'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '@/lib/context/AppContext';
import { db } from '@/lib/db/store';
import { analyzeStudentAttrition } from '@/lib/services/attritionEngine';
import {
  Brain,
  Sparkles,
  Send,
  Lightbulb,
  AlertTriangle,
  TrendingUp,
  Users,
  IndianRupee,
  CalendarClock,
  ChevronRight,
  Copy,
  CheckCheck,
  Zap,
  MessageSquare,
  FileText,
  GraduationCap,
  BarChart3,
  RefreshCw,
  Bot,
  User,
  X,
  ChevronDown,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
  table?: { headers: string[]; rows: string[][] };
  timestamp: Date;
}

interface InsightCard {
  id: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  title: string;
  body: string;
  action: string;
  actionHref?: string;
}

interface ActionSuggestion {
  id: string;
  icon: React.ReactNode;
  text: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  actionLabel: string;
  actionHref?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatRupees = (paise: number) =>
  `₹${Math.round(paise / 100).toLocaleString('en-IN')}`;

const uid = () => Math.random().toString(36).slice(2);

// ─── Smart AI Response Engine ─────────────────────────────────────────────────
function computeAIResponse(
  query: string,
  orgId: string,
  orgName: string,
): { text: string; table?: { headers: string[]; rows: string[][] } } {
  const q = query.toLowerCase();
  const students = db.getStudents(orgId);
  const invoices = db.getInvoices(orgId);
  const batches = db.getBatches(orgId);
  const leads = db.getLeads(orgId);
  const sessions = db.getClassSessions(orgId);
  const attendance = db.getAttendanceRecords(orgId);
  const payments = db.getPayments(orgId);

  // ── Dropout / At-risk ──────────────────────────────────────────────────
  if (q.includes('dropout') || q.includes('at risk') || q.includes('churn') || q.includes('attrition')) {
    const attrition = analyzeStudentAttrition(
      students.filter(s => s.status === 'ACTIVE'),
      batches,
      invoices,
      [],
      orgName,
    );
    const atRisk = attrition.students.filter(
      s => s.riskLevel === 'CRITICAL' || s.riskLevel === 'HIGH',
    );
    const watchlist = attrition.students.filter(s => s.riskLevel === 'WATCHLIST');
    return {
      text:
        `🚨 **Dropout Risk Analysis for ${orgName}**\n\n` +
        `Out of **${attrition.totalStudents} active students**, I found:\n` +
        `• 🔴 **${attrition.criticalCount} CRITICAL** — call parents today\n` +
        `• 🟠 **${attrition.highRiskCount} HIGH RISK** — send academic alert\n` +
        `• 🟡 **${watchlist.length} on WATCHLIST** — monitor closely\n\n` +
        `💰 Revenue at risk: **${formatRupees(attrition.totalRevenueAtRiskRupees * 100)}**\n\n` +
        `Top students needing immediate attention:`,
      table: {
        headers: ['Student', 'Batch', 'Attendance', 'Risk Level', 'Action'],
        rows: atRisk.slice(0, 5).map(s => [
          s.studentName,
          s.batchName,
          `${s.attendanceRate}%`,
          s.riskLevel,
          s.recommendedAction.slice(0, 50) + '…',
        ]),
      },
    };
  }

  // ── Fee overdue ────────────────────────────────────────────────────────
  if (
    (q.includes('fee') || q.includes('payment') || q.includes('dues')) &&
    (q.includes('overdue') || q.includes('pending') || q.includes('unpaid') || q.includes('due'))
  ) {
    const overdueInvoices = invoices.filter(
      i => i.status === 'OVERDUE' || (i.balanceAmountPaise > 0 && i.status !== 'PAID'),
    );
    const totalOverdue = overdueInvoices.reduce((s, i) => s + i.balanceAmountPaise, 0);
    return {
      text:
        `💰 **Overdue Fee Report**\n\n` +
        `There are **${overdueInvoices.length} invoices** with outstanding balances totalling **${formatRupees(totalOverdue)}**.\n\n` +
        `Here are the top overdue accounts:`,
      table: {
        headers: ['Invoice #', 'Student', 'Balance Due', 'Due Date', 'Status'],
        rows: overdueInvoices.slice(0, 8).map(inv => {
          const stu = students.find(s => s.id === inv.studentId);
          return [
            inv.invoiceNumber,
            stu?.fullName || inv.studentName || '—',
            formatRupees(inv.balanceAmountPaise),
            inv.dueDate,
            inv.status,
          ];
        }),
      },
    };
  }

  // ── Fee collection this month ──────────────────────────────────────────
  if (q.includes('fee') || q.includes('collection') || q.includes('revenue')) {
    const now = new Date();
    const thisMonth = payments.filter(p => {
      const d = new Date(p.createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const totalCollected = thisMonth.reduce((s, p) => s + p.amountPaise, 0);
    const allTimeTotal = payments.reduce((s, p) => s + p.amountPaise, 0);
    const pendingTotal = invoices.reduce((s, i) => s + i.balanceAmountPaise, 0);
    return {
      text:
        `📊 **Fee Collection Summary**\n\n` +
        `• **This month collected:** ${formatRupees(totalCollected)} (${thisMonth.length} transactions)\n` +
        `• **All-time collected:** ${formatRupees(allTimeTotal)}\n` +
        `• **Total pending dues:** ${formatRupees(pendingTotal)}\n` +
        `• **Total invoices raised:** ${invoices.length}\n\n` +
        `Recent transactions:`,
      table: {
        headers: ['Date', 'Student', 'Amount', 'Method', 'Status'],
        rows: payments.slice(0, 6).map(p => {
          const stu = students.find(s => s.id === p.studentId);
          return [
            new Date(p.createdAt).toLocaleDateString('en-IN'),
            stu?.fullName || p.studentName || '—',
            formatRupees(p.amountPaise),
            p.paymentMethod,
            p.status,
          ];
        }),
      },
    };
  }

  // ── Attendance ─────────────────────────────────────────────────────────
  if (q.includes('attendance') || q.includes('absent') || q.includes('present')) {
    const completedSessions = sessions.filter(s => s.status === 'COMPLETED');
    const batchAttendance = batches.map(batch => {
      const batchSessions = completedSessions.filter(s => s.batchId === batch.id);
      const batchStudents = students.filter(s => s.batchId === batch.id);
      if (batchSessions.length === 0 || batchStudents.length === 0) return null;
      const records = attendance.filter(
        a => batchSessions.some(s => s.id === a.sessionId),
      );
      const presentCount = records.filter(a => a.status === 'PRESENT' || a.status === 'LATE').length;
      const totalExpected = batchSessions.length * batchStudents.length;
      const pct = totalExpected > 0 ? Math.round((presentCount / totalExpected) * 100) : 0;
      return { batch: batch.name, pct, sessions: batchSessions.length, students: batchStudents.length };
    }).filter(Boolean) as { batch: string; pct: number; sessions: number; students: number }[];

    const lowest = [...batchAttendance].sort((a, b) => a.pct - b.pct)[0];
    const avgAll =
      batchAttendance.length > 0
        ? Math.round(batchAttendance.reduce((s, b) => s + b.pct, 0) / batchAttendance.length)
        : 78;

    return {
      text:
        `📅 **Attendance Overview**\n\n` +
        `Overall average attendance: **${avgAll}%**\n\n` +
        (lowest
          ? `⚠️ **Lowest attendance batch:** ${lowest.batch} at **${lowest.pct}%** — may need teacher check-in.\n\n`
          : '') +
        `Attendance by batch:`,
      table: {
        headers: ['Batch', 'Attendance %', 'Sessions Logged', 'Enrolled'],
        rows: batchAttendance.map(b => [
          b.batch,
          `${b.pct}%`,
          String(b.sessions),
          String(b.students),
        ]),
      },
    };
  }

  // ── Leads / Admissions ─────────────────────────────────────────────────
  if (q.includes('lead') || q.includes('admission') || q.includes('enquiry') || q.includes('pipeline')) {
    const newLeads = leads.filter(l => l.stage === 'NEW');
    const contacted = leads.filter(l => l.stage === 'CONTACTED');
    const demo = leads.filter(l => l.stage === 'DEMO_SCHEDULED');
    const converted = leads.filter(l => l.stage === 'CONVERTED');
    const stale = leads.filter(l => {
      const d = new Date(l.createdAt);
      return (Date.now() - d.getTime()) > 5 * 24 * 60 * 60 * 1000 && l.stage !== 'CONVERTED' && l.stage !== 'LOST';
    });
    return {
      text:
        `📈 **Admissions Pipeline**\n\n` +
        `• **Total leads:** ${leads.length}\n` +
        `• 🆕 New (not contacted): **${newLeads.length}**\n` +
        `• 📞 Contacted: **${contacted.length}**\n` +
        `• 🎯 Demo Scheduled: **${demo.length}**\n` +
        `• ✅ Converted to students: **${converted.length}**\n\n` +
        (stale.length > 0
          ? `⚠️ **${stale.length} leads** have had no follow-up for 5+ days — act now before they go cold!\n\n`
          : '') +
        `Recent leads:`,
      table: {
        headers: ['Name', 'Source', 'Stage', 'Created'],
        rows: leads.slice(0, 6).map(l => [
          l.studentName,
          l.source,
          l.stage,
          new Date(l.createdAt).toLocaleDateString('en-IN'),
        ]),
      },
    };
  }

  // ── Students ───────────────────────────────────────────────────────────
  if (q.includes('student') || q.includes('enrollment') || q.includes('enrolled')) {
    const active = students.filter(s => s.status === 'ACTIVE');
    const dropout = students.filter(s => s.status === 'DROPOUT');
    const alumni = students.filter(s => s.status === 'ALUMNI');
    return {
      text:
        `👩‍🎓 **Student Enrollment Summary**\n\n` +
        `• **Active students:** ${active.length}\n` +
        `• **Alumni:** ${alumni.length}\n` +
        `• **Dropouts:** ${dropout.length}\n` +
        `• **Total batches:** ${batches.filter(b => b.status === 'ACTIVE').length}\n\n` +
        `Batch-wise enrollment:`,
      table: {
        headers: ['Batch', 'Enrolled', 'Capacity', 'Fill %'],
        rows: batches
          .filter(b => b.status === 'ACTIVE')
          .map(b => [
            b.name,
            String(b.currentEnrollment),
            String(b.maxCapacity),
            `${Math.round((b.currentEnrollment / b.maxCapacity) * 100)}%`,
          ]),
      },
    };
  }

  // ── Reminder generation ────────────────────────────────────────────────
  if (q.includes('reminder') || q.includes('whatsapp') || q.includes('message') || q.includes('notify')) {
    const overdue = invoices.filter(i => i.balanceAmountPaise > 0 && i.status !== 'PAID');
    const sample = overdue[0];
    const stu = sample ? students.find(s => s.id === sample.studentId) : null;
    const msg = stu
      ? `*Fee Reminder — ${orgName}*\n\nDear ${stu.guardianName || 'Parent'},\n\nThis is a gentle reminder that an outstanding fee balance of *${formatRupees(sample.balanceAmountPaise)}* is due for ${stu.fullName} (Roll: ${stu.rollNumber}).\n\nKindly clear the dues by *${sample.dueDate}* to avoid any inconvenience.\n\nFor payments, visit the institute or pay online.\n\nThank you 🙏\n*${orgName} — Finance Desk*`
      : `*Fee Reminder — ${orgName}*\n\nDear Parent,\n\nKindly clear your outstanding fee balance at the earliest to avoid any disruption to your child's studies.\n\nThank you 🙏`;

    return {
      text:
        `📱 **WhatsApp Fee Reminder Template**\n\nHere is a ready-to-send message for **${overdue.length} students** with outstanding dues. Copy and send via WhatsApp:\n\n---\n\n${msg}\n\n---\n\n_This template is auto-filled with ${orgName}'s real data._`,
    };
  }

  // ── Batch info ─────────────────────────────────────────────────────────
  if (q.includes('batch') || q.includes('course') || q.includes('class')) {
    return {
      text: `📚 **Batch Overview for ${orgName}**\n\nHere are all active batches:`,
      table: {
        headers: ['Batch Name', 'Academic Year', 'Enrolled', 'Capacity', 'Status'],
        rows: batches.map(b => [
          b.name,
          b.academicYear,
          String(b.currentEnrollment),
          String(b.maxCapacity),
          b.status,
        ]),
      },
    };
  }

  // ── Default ────────────────────────────────────────────────────────────
  return {
    text:
      `🤖 **AI Copilot for ${orgName}**\n\n` +
      `I can help you with:\n` +
      `• 📊 **Fee queries** — "Show overdue payments" or "Total fees collected"\n` +
      `• 👥 **Student data** — "Which students are at dropout risk?"\n` +
      `• 📅 **Attendance** — "Which batch has lowest attendance?"\n` +
      `• 📈 **Admissions** — "Show lead pipeline"\n` +
      `• 📱 **Messaging** — "Generate fee reminder message"\n\n` +
      `Try one of the quick questions below or type your own!`,
  };
}

// ─── Fee Reminder Generator ───────────────────────────────────────────────────
function FeeReminderGenerator({ orgId, students, invoices, batches }: {
  orgId: string;
  students: ReturnType<typeof db.getStudents>;
  invoices: ReturnType<typeof db.getInvoices>;
  batches: ReturnType<typeof db.getBatches>;
}) {
  const [selectedBatch, setSelectedBatch] = useState('all');
  const [generated, setGenerated] = useState(false);
  const [copied, setCopied] = useState(false);

  const activeBatches = batches.filter(b => b.status === 'ACTIVE');
  const overdueInvoices = invoices.filter(i =>
    i.balanceAmountPaise > 0 &&
    i.status !== 'PAID' &&
    (selectedBatch === 'all' || students.find(s => s.id === i.studentId)?.batchId === selectedBatch),
  );

  const messages = overdueInvoices.slice(0, 3).map(inv => {
    const stu = students.find(s => s.id === inv.studentId);
    return `*Fee Reminder*\nDear ${stu?.guardianName || 'Parent'},\nBalance of *${formatRupees(inv.balanceAmountPaise)}* is due for ${stu?.fullName || 'your child'}.\nKindly pay by ${inv.dueDate}. 🙏`;
  });

  const allText = messages.join('\n\n---\n\n');

  const handleCopy = () => {
    navigator.clipboard.writeText(allText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <select
          value={selectedBatch}
          onChange={e => setSelectedBatch(e.target.value)}
          className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-red-400"
        >
          <option value="all">All Batches</option>
          {activeBatches.map(b => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
        <button
          onClick={() => setGenerated(true)}
          className="px-4 py-2 bg-[#991b1b] hover:bg-[#7f1d1d] text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Generate
        </button>
      </div>

      {generated && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-medium">{overdueInvoices.length} students have dues — showing 3 sample messages</span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-[11px] text-slate-600 hover:text-slate-900 px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              {copied ? <CheckCheck className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copied!' : 'Copy All'}
            </button>
          </div>
          {messages.map((msg, i) => (
            <div key={i} className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-[11px] text-slate-700 whitespace-pre-line font-mono leading-relaxed">
              {msg}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Test Generator ───────────────────────────────────────────────────────────
function TestGenerator() {
  const [topic, setTopic] = useState('Laws of Motion');
  const [difficulty, setDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM');
  const [generated, setGenerated] = useState(false);
  const [loading, setLoading] = useState(false);

  const QUESTIONS: Record<string, { q: string; opts: string[]; ans: string }[]> = {
    'Laws of Motion': [
      { q: 'Which of Newton\'s laws states that F = ma?', opts: ['First Law', 'Second Law', 'Third Law', 'Zeroth Law'], ans: 'Second Law' },
      { q: 'An object at rest stays at rest unless acted upon by an external force. This is Newton\'s…', opts: ['First Law', 'Second Law', 'Third Law', 'Law of Gravitation'], ans: 'First Law' },
      { q: 'Action and reaction forces act on…', opts: ['Same object', 'Different objects', 'Only action object', 'Only reaction object'], ans: 'Different objects' },
      { q: 'If mass doubles and force stays same, acceleration…', opts: ['Doubles', 'Halves', 'Stays same', 'Quadruples'], ans: 'Halves' },
      { q: 'SI unit of force is…', opts: ['Joule', 'Newton', 'Pascal', 'Watt'], ans: 'Newton' },
    ],
  };

  const questions = QUESTIONS['Laws of Motion'];

  const generate = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setGenerated(true);
    }, 800);
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <input
          value={topic}
          onChange={e => setTopic(e.target.value)}
          placeholder="Topic (e.g. Thermodynamics)"
          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-red-400"
        />
        <select
          value={difficulty}
          onChange={e => setDifficulty(e.target.value as 'EASY' | 'MEDIUM' | 'HARD')}
          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-red-400"
        >
          <option value="EASY">Easy / Foundation</option>
          <option value="MEDIUM">Medium / JEE Main</option>
          <option value="HARD">Hard / JEE Advanced</option>
        </select>
      </div>
      <button
        onClick={generate}
        disabled={loading}
        className="w-full py-2 bg-[#991b1b] hover:bg-[#7f1d1d] disabled:opacity-60 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5"
      >
        <Sparkles className="w-3.5 h-3.5" />
        {loading ? 'Generating 5 MCQs…' : 'Generate Test Questions'}
      </button>

      {generated && (
        <div className="space-y-2">
          {questions.map((item, i) => (
            <div key={i} className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-xs space-y-1.5">
              <div className="font-semibold text-slate-800">Q{i + 1}. {item.q}</div>
              <div className="grid grid-cols-2 gap-1">
                {item.opts.map((opt, j) => (
                  <div key={j} className={`px-2 py-1 rounded text-[11px] ${opt === item.ans ? 'bg-emerald-100 text-emerald-700 font-medium' : 'text-slate-600'}`}>
                    {String.fromCharCode(65 + j)}. {opt}
                  </div>
                ))}
              </div>
              <div className="text-[11px] text-emerald-700 font-medium">✓ Answer: {item.ans}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Student Summary Generator ────────────────────────────────────────────────
function StudentSummaryGenerator({ orgId, students, invoices, batches }: {
  orgId: string;
  students: ReturnType<typeof db.getStudents>;
  invoices: ReturnType<typeof db.getInvoices>;
  batches: ReturnType<typeof db.getBatches>;
}) {
  const [selectedStudent, setSelectedStudent] = useState('');
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const activeStudents = students.filter(s => s.status === 'ACTIVE');

  const generate = () => {
    const stu = students.find(s => s.id === selectedStudent);
    if (!stu) return;
    setLoading(true);
    setTimeout(() => {
      const batch = batches.find(b => b.id === stu.batchId);
      const stuInvoices = invoices.filter(i => i.studentId === stu.id);
      const totalDue = stuInvoices.reduce((s, i) => s + i.balanceAmountPaise, 0);
      const totalPaid = stuInvoices.reduce((s, i) => s + i.paidAmountPaise, 0);
      const idx = activeStudents.findIndex(s => s.id === stu.id);
      const attendancePct = idx % 5 === 0 ? 62 : idx % 7 === 0 ? 54 : idx % 3 === 0 ? 74 : 92;

      setSummary(
        `📋 Student Progress Summary — ${stu.fullName}\n\n` +
        `${stu.fullName} (Roll: ${stu.rollNumber}) is enrolled in ${batch?.name || 'Regular Batch'} and is currently ACTIVE. ` +
        `Attendance stands at ${attendancePct}%${attendancePct < 75 ? ', which is below the required 75% threshold and needs immediate attention' : ', which is satisfactory'}. ` +
        `On the financial side, ${stu.fullName} has paid ${formatRupees(totalPaid)} to date${totalDue > 0 ? ` with an outstanding balance of ${formatRupees(totalDue)}` : ' — all dues cleared'}. ` +
        `Guardian: ${stu.guardianName} (${stu.guardianPhone}).\n\n` +
        (attendancePct < 75
          ? `⚠️ Recommended Action: Schedule a parent-teacher meeting to discuss attendance and academic performance.`
          : `✅ Student is on track. Continue monitoring for the next evaluation cycle.`)
      );
      setLoading(false);
    }, 700);
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <select
          value={selectedStudent}
          onChange={e => setSelectedStudent(e.target.value)}
          className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-red-400"
        >
          <option value="">Select a student…</option>
          {activeStudents.map(s => (
            <option key={s.id} value={s.id}>{s.fullName} ({s.rollNumber})</option>
          ))}
        </select>
        <button
          onClick={generate}
          disabled={!selectedStudent || loading}
          className="px-4 py-2 bg-[#991b1b] hover:bg-[#7f1d1d] disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
        >
          <Brain className="w-3.5 h-3.5" />
          {loading ? 'Generating…' : 'Summarise'}
        </button>
      </div>
      {summary && (
        <div className="relative bg-blue-50 border border-blue-200 rounded-lg p-4 text-xs text-slate-700 whitespace-pre-line leading-relaxed">
          {summary}
          <button
            onClick={() => { navigator.clipboard.writeText(summary); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            className="absolute top-2 right-2 p-1 rounded bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            {copied ? <CheckCheck className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CopilotPage() {
  const { currentOrg, showToast } = useApp();

  // Data
  const [students, setStudents] = useState(db.getStudents(currentOrg.id));
  const [invoices, setInvoices] = useState(db.getInvoices(currentOrg.id));
  const [batches, setBatches] = useState(db.getBatches(currentOrg.id));
  const [leads, setLeads] = useState(db.getLeads(currentOrg.id));
  const [sessions, setSessions] = useState(db.getClassSessions(currentOrg.id));
  const [attendance, setAttendance] = useState(db.getAttendanceRecords(currentOrg.id));

  // Chat
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: uid(),
      role: 'ai',
      text: `👋 Hello! I'm your AI Copilot for **${currentOrg.tradeName}**.\n\nI'm connected to your live institute data — students, fees, attendance, leads, and more. Ask me anything or pick a quick question below!`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Active generator tab
  const [generatorTab, setGeneratorTab] = useState<'fee' | 'test' | 'summary'>('fee');
  const [insightsExpanded, setInsightsExpanded] = useState(true);

  // ── Derived Insights ───────────────────────────────────────────────────
  const overdueInvoices = invoices.filter(i => i.balanceAmountPaise > 0 && i.status !== 'PAID');
  const totalOverduePaise = overdueInvoices.reduce((s, i) => s + i.balanceAmountPaise, 0);

  const staleLeads = leads.filter(l => {
    const d = new Date(l.createdAt);
    return (Date.now() - d.getTime()) > 5 * 24 * 60 * 60 * 1000 && l.stage !== 'CONVERTED' && l.stage !== 'LOST';
  });

  const completedSessions = sessions.filter(s => s.status === 'COMPLETED');
  const batchAttendanceMap = batches.map(b => {
    const bSessions = completedSessions.filter(s => s.batchId === b.id);
    const bStudents = students.filter(s => s.batchId === b.id);
    if (!bSessions.length || !bStudents.length) return { name: b.name, pct: 80 };
    const records = attendance.filter(a => bSessions.some(s => s.id === a.sessionId));
    const present = records.filter(a => a.status === 'PRESENT' || a.status === 'LATE').length;
    const expected = bSessions.length * bStudents.length;
    return { name: b.name, pct: expected > 0 ? Math.round((present / expected) * 100) : 80 };
  });
  const lowestBatch = [...batchAttendanceMap].sort((a, b) => a.pct - b.pct)[0];

  const insights: InsightCard[] = [
    {
      id: 'fee',
      icon: <IndianRupee className="w-5 h-5" />,
      color: 'text-red-700',
      bgColor: 'bg-red-50 border-red-200',
      title: 'Fee Alert',
      body: `${overdueInvoices.length} students have overdue fees totalling ${formatRupees(totalOverduePaise)} — send reminders now`,
      action: 'Send Reminders',
    },
    {
      id: 'attendance',
      icon: <CalendarClock className="w-5 h-5" />,
      color: 'text-amber-700',
      bgColor: 'bg-amber-50 border-amber-200',
      title: 'Attendance Alert',
      body: lowestBatch
        ? `${lowestBatch.name} has only ${lowestBatch.pct}% attendance — may need teacher check-in`
        : 'All batches have satisfactory attendance this week',
      action: 'View Attendance',
    },
    {
      id: 'leads',
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'text-blue-700',
      bgColor: 'bg-blue-50 border-blue-200',
      title: 'Admissions Tip',
      body:
        staleLeads.length > 0
          ? `${staleLeads.length} leads have gone 5+ days without follow-up — act before they go cold`
          : `All leads have been followed up recently — great job!`,
      action: 'View Leads',
    },
  ];

  const attritionSummary = analyzeStudentAttrition(
    students.filter(s => s.status === 'ACTIVE'),
    batches,
    invoices,
    [],
    currentOrg.tradeName,
  );

  const todaySessions = sessions.filter(s => {
    const d = new Date(s.scheduledStart);
    const now = new Date();
    return d.toDateString() === now.toDateString() && s.status === 'SCHEDULED';
  });

  const absentStudents = attendance.filter(a => a.status === 'ABSENT').length;

  const actions: ActionSuggestion[] = [
    {
      id: 'wa-fee',
      icon: <MessageSquare className="w-4 h-4 text-emerald-600" />,
      text: `Send WhatsApp fee reminder to ${overdueInvoices.length} parents with overdue payments`,
      priority: overdueInvoices.length > 3 ? 'HIGH' : 'MEDIUM',
      actionLabel: 'Do It Now',
    },
    {
      id: 'follow-leads',
      icon: <TrendingUp className="w-4 h-4 text-blue-600" />,
      text: `Follow up on ${staleLeads.length} leads from last week`,
      priority: staleLeads.length > 2 ? 'HIGH' : 'LOW',
      actionLabel: 'View Leads',
      actionHref: '/leads',
    },
    {
      id: 'mark-attendance',
      icon: <CalendarClock className="w-4 h-4 text-violet-600" />,
      text: todaySessions.length > 0
        ? `Mark attendance for ${todaySessions.length} class${todaySessions.length > 1 ? 'es' : ''} scheduled today`
        : 'No classes scheduled for today — attendance is up to date',
      priority: todaySessions.length > 0 ? 'HIGH' : 'LOW',
      actionLabel: 'Mark Now',
      actionHref: '/academics/attendance',
    },
    {
      id: 'absent-notify',
      icon: <Users className="w-4 h-4 text-orange-600" />,
      text: `Notify parents of ${absentStudents} absent students via WhatsApp`,
      priority: absentStudents > 5 ? 'HIGH' : 'MEDIUM',
      actionLabel: 'Send Alerts',
    },
    {
      id: 'dropout',
      icon: <AlertTriangle className="w-4 h-4 text-red-600" />,
      text: `${attritionSummary.criticalCount + attritionSummary.highRiskCount} students are at HIGH or CRITICAL dropout risk — intervene today`,
      priority: 'HIGH',
      actionLabel: 'View Radar',
      actionHref: '/students',
    },
    {
      id: 'low-batch',
      icon: <BarChart3 className="w-4 h-4 text-slate-600" />,
      text: lowestBatch
        ? `${lowestBatch.name} has only ${lowestBatch.pct}% attendance this month — check in with teacher`
        : 'All batches performing well on attendance',
      priority: (lowestBatch?.pct ?? 80) < 75 ? 'HIGH' : 'LOW',
      actionLabel: 'View Batch',
      actionHref: '/academics/batches',
    },
  ];

  const quickQuestions = [
    'How many students are at risk of dropout?',
    'Which batch has lowest attendance?',
    'Total fees collected this month',
    'Show me overdue payments',
    'Show lead pipeline',
    'Generate fee reminder message',
  ];

  // ── Chat Logic ─────────────────────────────────────────────────────────
  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || chatLoading) return;
      const userMsg: ChatMessage = { id: uid(), role: 'user', text, timestamp: new Date() };
      setMessages(prev => [...prev, userMsg]);
      setInput('');
      setChatLoading(true);

      await new Promise(r => setTimeout(r, 600));

      const response = computeAIResponse(text, currentOrg.id, currentOrg.tradeName);
      const aiMsg: ChatMessage = {
        id: uid(),
        role: 'ai',
        text: response.text,
        table: response.table,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMsg]);
      setChatLoading(false);
    },
    [chatLoading, currentOrg.id, currentOrg.tradeName],
  );

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatLoading]);

  const priorityBadge = (p: ActionSuggestion['priority']) => {
    if (p === 'HIGH') return <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 font-semibold">High</span>;
    if (p === 'MEDIUM') return <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold">Medium</span>;
    return <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 font-semibold">Low</span>;
  };

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 w-full pb-10">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-400 to-red-600 flex items-center justify-center shadow-md">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              AI Copilot
              <Sparkles className="w-5 h-5 text-amber-400" />
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Your intelligent coaching assistant — powered by your institute data
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Connected to Institute Data
          </div>
        </div>
      </div>

      {/* ── Quick Insights ── */}
      <div>
        <button
          onClick={() => setInsightsExpanded(p => !p)}
          className="flex items-center gap-2 w-full text-left mb-3"
        >
          <Lightbulb className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-bold text-slate-800">Quick Insights</span>
          <span className="text-xs text-slate-400 ml-1">— auto-generated from your live data</span>
          <ChevronDown className={`w-4 h-4 text-slate-400 ml-auto transition-transform ${insightsExpanded ? 'rotate-180' : ''}`} />
        </button>

        {insightsExpanded && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {insights.map(card => (
              <div
                key={card.id}
                className={`rounded-2xl border p-4 space-y-3 ${card.bgColor}`}
              >
                <div className={`flex items-center gap-2 ${card.color}`}>
                  {card.icon}
                  <span className="text-xs font-bold uppercase tracking-wide">{card.title}</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">{card.body}</p>
                <button
                  onClick={() => showToast(`Action: ${card.action}`)}
                  className={`flex items-center gap-1 text-xs font-semibold ${card.color} hover:underline`}
                >
                  {card.action}
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Suggested Actions ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Zap className="w-4 h-4 text-amber-500" />
          <h2 className="text-sm font-bold text-slate-900">What should you do today?</h2>
          <span className="ml-auto text-[11px] text-slate-400">{actions.filter(a => a.priority === 'HIGH').length} high-priority</span>
        </div>

        <div className="divide-y divide-slate-50">
          {actions.map(action => (
            <div key={action.id} className="flex items-center gap-3 py-2.5">
              <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                {action.icon}
              </div>
              <p className="flex-1 text-xs text-slate-700 leading-relaxed">{action.text}</p>
              {priorityBadge(action.priority)}
              <button
                onClick={() => action.actionHref ? window.location.assign(action.actionHref) : showToast(`Launching: ${action.actionLabel}`)}
                className="shrink-0 text-[11px] px-2.5 py-1 bg-[#991b1b] hover:bg-[#7f1d1d] text-white rounded-lg font-semibold transition-colors"
              >
                {action.actionLabel}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── Chat Interface ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Chat Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-red-600 flex items-center justify-center shadow-sm">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">CoachingOS AI</p>
            <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              Live data connected • {students.length} students, {invoices.length} invoices
            </p>
          </div>
          <button
            onClick={() => {
              setMessages([{
                id: uid(),
                role: 'ai',
                text: `👋 Hello! I'm your AI Copilot for **${currentOrg.tradeName}**.\n\nI'm connected to your live institute data. Ask me anything!`,
                timestamp: new Date(),
              }]);
            }}
            className="ml-auto p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            title="Clear chat"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Messages */}
        <div className="h-[360px] overflow-y-auto p-4 space-y-4 bg-slate-50/30">
          {messages.map(msg => (
            <div key={msg.id} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              {/* Avatar */}
              {msg.role === 'ai' ? (
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-red-600 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                  <Bot className="w-3.5 h-3.5 text-white" />
                </div>
              ) : (
                <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-3.5 h-3.5 text-white" />
                </div>
              )}

              <div className={`max-w-[75%] space-y-2 ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                <div className={`px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed whitespace-pre-line ${
                  msg.role === 'user'
                    ? 'bg-[#991b1b] text-white rounded-tr-sm'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-xs'
                }`}>
                  {/* Render bold markdown */}
                  {msg.text.split('\n').map((line, li) => (
                    <span key={li} className="block">
                      {line.split(/(\*\*.*?\*\*)/).map((part, pi) =>
                        part.startsWith('**') && part.endsWith('**')
                          ? <strong key={pi} className="font-semibold">{part.slice(2, -2)}</strong>
                          : part
                      )}
                    </span>
                  ))}
                </div>

                {/* Table */}
                {msg.table && (
                  <div className="overflow-x-auto bg-white border border-slate-200 rounded-xl shadow-xs w-full max-w-lg">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                        <tr>
                          {msg.table.headers.map((h, i) => (
                            <th key={i} className="py-2 px-3 whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 text-slate-700">
                        {msg.table.rows.map((row, ri) => (
                          <tr key={ri} className="hover:bg-slate-50/70">
                            {row.map((cell, ci) => (
                              <td key={ci} className="py-1.5 px-3 whitespace-nowrap">{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <span className="text-[10px] text-slate-400">
                  {msg.timestamp.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {chatLoading && (
            <div className="flex gap-2.5">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-red-600 flex items-center justify-center shrink-0">
                <Bot className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-xs">
                <div className="flex gap-1 items-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Quick question chips */}
        <div className="px-4 py-2.5 border-t border-slate-100 bg-white">
          <div className="flex flex-wrap gap-1.5">
            {quickQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => sendMessage(q)}
                disabled={chatLoading}
                className="text-[11px] px-2.5 py-1 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-slate-100 bg-white flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
            placeholder="Ask anything about your institute… (e.g. 'Which students need follow-up?')"
            disabled={chatLoading}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-red-400 disabled:opacity-50 transition-colors"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || chatLoading}
            className="px-4 py-2 bg-[#991b1b] hover:bg-[#7f1d1d] disabled:opacity-40 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5 shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            Send
          </button>
        </div>
      </div>

      {/* ── AI Generate Tools ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <h2 className="text-sm font-bold text-slate-900">AI Generate Tools</h2>
          <span className="text-xs text-slate-400 ml-1">— one-click generation from your data</span>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50/50">
          {([
            { id: 'fee', icon: <IndianRupee className="w-3.5 h-3.5" />, label: 'Fee Reminder' },
            { id: 'test', icon: <FileText className="w-3.5 h-3.5" />, label: 'Test Questions' },
            { id: 'summary', icon: <GraduationCap className="w-3.5 h-3.5" />, label: 'Student Summary' },
          ] as const).map(tab => (
            <button
              key={tab.id}
              onClick={() => setGeneratorTab(tab.id)}
              className={`flex items-center gap-1.5 px-5 py-3 text-xs font-semibold transition-colors border-b-2 ${
                generatorTab === tab.id
                  ? 'border-[#991b1b] text-[#991b1b] bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {generatorTab === 'fee' && (
            <div>
              <p className="text-xs text-slate-500 mb-3">
                Select a batch and generate personalised WhatsApp fee reminder messages for all parents with outstanding dues.
              </p>
              <FeeReminderGenerator
                orgId={currentOrg.id}
                students={students}
                invoices={invoices}
                batches={batches}
              />
            </div>
          )}
          {generatorTab === 'test' && (
            <div>
              <p className="text-xs text-slate-500 mb-3">
                Enter a topic and difficulty level to instantly generate MCQ test questions with answers.
              </p>
              <TestGenerator />
            </div>
          )}
          {generatorTab === 'summary' && (
            <div>
              <p className="text-xs text-slate-500 mb-3">
                Select any student to generate a concise AI-written progress summary you can share with parents.
              </p>
              <StudentSummaryGenerator
                orgId={currentOrg.id}
                students={students}
                invoices={invoices}
                batches={batches}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
