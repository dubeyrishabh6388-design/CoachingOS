'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '@/lib/context/AppContext';
import { db } from '@/lib/db/store';
import { ClassSession, Batch, User } from '@/lib/types';
import {
  Calendar,
  Clock,
  Plus,
  X,
  ChevronDown,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  MapPin,
  User as UserIcon,
  CheckCircle2,
  Circle,
  XCircle,
  Filter,
  Layers,
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const DAY_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const HOURS = Array.from({ length: 15 }, (_, i) => i + 7); // 7am–9pm

type DayKey = typeof DAYS[number];

// Subject colors for visual variety
const SUBJECT_COLORS = [
  { bg: 'bg-blue-50 border-blue-200',  text: 'text-blue-800',  dot: 'bg-blue-500'  },
  { bg: 'bg-purple-50 border-purple-200', text: 'text-purple-800', dot: 'bg-purple-500' },
  { bg: 'bg-teal-50 border-teal-200',  text: 'text-teal-800',  dot: 'bg-teal-500'  },
  { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-800', dot: 'bg-amber-500' },
  { bg: 'bg-rose-50 border-rose-200',  text: 'text-rose-800',  dot: 'bg-rose-500'  },
  { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-800', dot: 'bg-emerald-500' },
];

// ─── Types ────────────────────────────────────────────────────────────────────
interface EnrichedSession extends ClassSession {
  batchName: string;
  teacherName: string;
  subjectName: string;
  dayIndex: number; // 0=Mon…5=Sat
  startHour: number;
  startMinute: number;
  durationHours: number;
  colorIndex: number;
}

interface AddSessionForm {
  batchId: string;
  subjectName: string;
  teacherUserId: string;
  classroomName: string;
  dayIndex: number;
  startTime: string;
  endTime: string;
  topicName: string;
  repeatWeekly: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatHour(h: number) {
  const suffix = h >= 12 ? 'PM' : 'AM';
  const display = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${display}:00 ${suffix}`;
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function getWeekDates(baseDate: Date): Date[] {
  const day = baseDate.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day; // Monday offset
  const monday = new Date(baseDate);
  monday.setDate(baseDate.getDate() + diff);
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function isToday(date: Date) {
  const t = new Date();
  return (
    date.getDate() === t.getDate() &&
    date.getMonth() === t.getMonth() &&
    date.getFullYear() === t.getFullYear()
  );
}

function detectConflicts(sessions: EnrichedSession[]): Set<string> {
  const conflicted = new Set<string>();
  for (let i = 0; i < sessions.length; i++) {
    for (let j = i + 1; j < sessions.length; j++) {
      const a = sessions[i];
      const b = sessions[j];
      if (a.dayIndex !== b.dayIndex || a.classroomName !== b.classroomName) continue;
      const aStart = a.startHour + a.startMinute / 60;
      const aEnd = aStart + a.durationHours;
      const bStart = b.startHour + b.startMinute / 60;
      const bEnd = bStart + b.durationHours;
      if (aStart < bEnd && bStart < aEnd) {
        conflicted.add(a.id);
        conflicted.add(b.id);
      }
    }
  }
  return conflicted;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function TimetableSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="grid grid-cols-7 gap-1">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="h-8 bg-slate-200 rounded" />
        ))}
        {[...Array(42)].map((_, i) => (
          <div key={`c-${i}`} className="h-16 bg-slate-100 rounded" />
        ))}
      </div>
    </div>
  );
}

// ─── Add Session Modal ─────────────────────────────────────────────────────────
function AddSessionModal({
  open,
  onClose,
  batches,
  teachers,
  onAdd,
  existingSessions,
}: {
  open: boolean;
  onClose: () => void;
  batches: Batch[];
  teachers: User[];
  onAdd: (f: AddSessionForm) => void;
  existingSessions: EnrichedSession[];
}) {
  const [form, setForm] = useState<AddSessionForm>({
    batchId: batches[0]?.id || '',
    subjectName: 'Physics',
    teacherUserId: teachers[0]?.id || '',
    classroomName: 'Hall 1A',
    dayIndex: 0,
    startTime: '09:00',
    endTime: '11:00',
    topicName: '',
    repeatWeekly: true,
  });
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);

  // Check conflict on form change
  useEffect(() => {
    if (!form.startTime || !form.endTime || form.startTime >= form.endTime) {
      setConflictWarning(null);
      return;
    }
    const [sh, sm] = form.startTime.split(':').map(Number);
    const [eh, em] = form.endTime.split(':').map(Number);
    const startH = sh + sm / 60;
    const dur = (eh + em / 60) - startH;

    const conflicts = existingSessions.filter((s) => {
      if (s.dayIndex !== form.dayIndex || s.classroomName !== form.classroomName) return false;
      const sEnd = s.startHour + s.startMinute / 60 + s.durationHours;
      return startH < sEnd && s.startHour + s.startMinute / 60 < startH + dur;
    });

    setConflictWarning(
      conflicts.length > 0
        ? `⚠️ Time conflict with "${conflicts[0].batchName}" in ${form.classroomName}`
        : null
    );
  }, [form.startTime, form.endTime, form.dayIndex, form.classroomName, existingSessions]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(form);
  };

  if (!open) return null;

  const SUBJECTS = ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'English', 'Problem Solving', 'Revision'];
  const ROOMS = ['Hall 1A', 'Hall 1B', 'Hall 2A', 'Hall 2B', 'Hall 3A', 'Lab 1', 'Lab 2', 'Seminar Hall'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-[#450a0a] to-[#7f1d1d] sticky top-0">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-white" />
            <h2 className="text-lg font-bold text-white">Add New Class Session</h2>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Conflict warning */}
          {conflictWarning && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <p className="text-xs text-amber-700 font-medium">{conflictWarning}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Batch *</label>
              <select
                value={form.batchId}
                onChange={(e) => setForm((f) => ({ ...f, batchId: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Subject *</label>
              <select
                value={form.subjectName}
                onChange={(e) => setForm((f) => ({ ...f, subjectName: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Teacher *</label>
              <select
                value={form.teacherUserId}
                onChange={(e) => setForm((f) => ({ ...f, teacherUserId: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>{t.fullName}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Day *</label>
              <select
                value={form.dayIndex}
                onChange={(e) => setForm((f) => ({ ...f, dayIndex: Number(e.target.value) }))}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                {DAY_FULL.map((d, i) => <option key={d} value={i}>{d}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Room *</label>
              <select
                value={form.classroomName}
                onChange={(e) => setForm((f) => ({ ...f, classroomName: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                {ROOMS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Start Time *</label>
              <input
                type="time"
                value={form.startTime}
                onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">End Time *</label>
              <input
                type="time"
                value={form.endTime}
                onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Topic / Lecture Title</label>
              <input
                value={form.topicName}
                onChange={(e) => setForm((f) => ({ ...f, topicName: e.target.value }))}
                placeholder="e.g. Newton's Laws of Motion"
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="col-span-2 flex items-center gap-3 bg-slate-50 rounded-lg px-3 py-2.5">
              <input
                type="checkbox"
                id="repeat-weekly"
                checked={form.repeatWeekly}
                onChange={(e) => setForm((f) => ({ ...f, repeatWeekly: e.target.checked }))}
                className="w-4 h-4 rounded accent-rose-700"
              />
              <label htmlFor="repeat-weekly" className="text-sm text-slate-700 font-medium cursor-pointer">
                Repeat weekly (recurring schedule)
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 rounded-lg bg-[#991b1b] text-white text-sm font-semibold hover:bg-[#7f1d1d] transition shadow-sm"
            >
              Add Session
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Session Card (in grid cell) ───────────────────────────────────────────────
function SessionCard({
  session,
  isConflict,
  compact = false,
  onClick,
}: {
  session: EnrichedSession;
  isConflict: boolean;
  compact?: boolean;
  onClick?: () => void;
}) {
  const color = SUBJECT_COLORS[session.colorIndex % SUBJECT_COLORS.length];
  const statusIcon =
    session.status === 'COMPLETED' ? (
      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
    ) : session.status === 'CANCELLED' ? (
      <XCircle className="w-3 h-3 text-red-500" />
    ) : (
      <Circle className="w-3 h-3 text-blue-500" />
    );

  return (
    <div
      onClick={onClick}
      className={`rounded-lg border px-2 py-1.5 text-xs cursor-pointer hover:shadow-md transition-shadow select-none ${color.bg} ${color.text} ${
        isConflict ? 'ring-2 ring-amber-400 ring-offset-1' : ''
      }`}
      title={`${session.batchName} · ${session.subjectName}\n${session.teacherName}\n${session.classroomName} (Click to manage/substitute)`}
    >

      <div className="flex items-center gap-1 mb-0.5">
        <div className={`w-1.5 h-1.5 rounded-full ${color.dot}`} />
        <span className="font-bold truncate leading-tight">{session.subjectName}</span>
        {isConflict && <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />}
      </div>
      {!compact && (
        <>
          <p className="truncate opacity-80 leading-tight">{session.batchName}</p>
          <div className="flex items-center gap-1 mt-0.5 opacity-70">
            <MapPin className="w-2.5 h-2.5" />
            <span className="truncate">{session.classroomName}</span>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function TimetablePage() {
  const { currentOrg, showToast } = useApp();
  const [isLoading, setIsLoading] = useState(true);
  const [rawSessions, setRawSessions] = useState<ClassSession[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [filterBatchId, setFilterBatchId] = useState<string>('ALL');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [substituteSession, setSubstituteSession] = useState<EnrichedSession | null>(null);
  const [selectedSubstituteTeacherId, setSelectedSubstituteTeacherId] = useState<string>('');
  const [weekOffset, setWeekOffset] = useState(0);


  // Base week reference
  const today = new Date();
  const weekDates = useMemo(() => {
    const base = new Date(today);
    base.setDate(today.getDate() + weekOffset * 7);
    return getWeekDates(base);
  }, [weekOffset]);

  const weekLabel = useMemo(() => {
    const start = weekDates[0];
    const end = weekDates[5];
    const fmt = (d: Date) => d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    return `${fmt(start)} – ${fmt(end)}, ${end.getFullYear()}`;
  }, [weekDates]);

  useEffect(() => {
    const sessions = db.getClassSessions(currentOrg.id);
    const orgBatches = db.getBatches(currentOrg.id);
    const orgUsers = db.getUsers(currentOrg.id).filter((u) => u.role === 'TEACHER' || u.role === 'OWNER');
    setRawSessions(sessions);
    setBatches(orgBatches);
    setTeachers(orgUsers);
    setIsLoading(false);
  }, [currentOrg.id]);

  // Build enriched sessions, assign them to Mon-Sat slots by scheduledStart day-of-week
  const enrichedSessions = useMemo<EnrichedSession[]>(() => {
    return rawSessions
      .filter((s) => filterBatchId === 'ALL' || s.batchId === filterBatchId)
      .map((s, idx) => {
        const batch = batches.find((b) => b.id === s.batchId);
        const teacher = teachers.find((t) => t.id === s.teacherUserId);
        const start = new Date(s.scheduledStart);
        const end = new Date(s.scheduledEnd);

        // Map JS getDay() (0=Sun) to our 0=Mon index
        const jsDay = start.getDay();
        const dayIndex = jsDay === 0 ? 6 : jsDay - 1; // 0=Mon … 5=Sat (6=Sun, ignored)

        const startHour = start.getHours();
        const startMinute = start.getMinutes();
        const durationMs = end.getTime() - start.getTime();
        const durationHours = durationMs / 3600000;

        const colorIndex = idx % SUBJECT_COLORS.length;

        return {
          ...s,
          batchName: batch?.name || 'Unknown Batch',
          teacherName: teacher?.fullName || 'Unknown Teacher',
          subjectName: s.topicName || s.subjectId || 'Class',
          dayIndex,
          startHour,
          startMinute,
          durationHours: Math.max(0.5, durationHours),
          colorIndex,
        };
      })
      .filter((s) => s.dayIndex >= 0 && s.dayIndex <= 5);
  }, [rawSessions, batches, teachers, filterBatchId]);

  const conflictedIds = useMemo(() => detectConflicts(enrichedSessions), [enrichedSessions]);

  // Group by day for grid rendering
  const sessionsByDay = useMemo(() => {
    const map: Record<number, EnrichedSession[]> = {};
    for (let i = 0; i < 6; i++) map[i] = [];
    enrichedSessions.forEach((s) => {
      map[s.dayIndex]?.push(s);
    });
    return map;
  }, [enrichedSessions]);

  // Upcoming sessions (status=SCHEDULED, sorted)
  const upcomingSessions = useMemo(() => {
    return [...enrichedSessions]
      .filter((s) => s.status === 'SCHEDULED')
      .sort((a, b) => new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime())
      .slice(0, 8);
  }, [enrichedSessions]);

  // Add session handler
  const handleAddSession = (form: AddSessionForm) => {
    const [sh, sm] = form.startTime.split(':').map(Number);
    const [eh, em] = form.endTime.split(':').map(Number);

    // Use next occurrence of selected day
    const targetDay = (form.dayIndex + 1) % 7 || 7; // convert back to JS (Mon=1)
    const now = new Date();
    const daysUntil = (targetDay - now.getDay() + 7) % 7 || 7;
    const sessionDate = new Date(now);
    sessionDate.setDate(now.getDate() + daysUntil);

    const startDate = new Date(sessionDate);
    startDate.setHours(sh, sm, 0, 0);
    const endDate = new Date(sessionDate);
    endDate.setHours(eh, em, 0, 0);

    const newSession: ClassSession = {
      id: `sess-${Date.now()}`,
      organizationId: currentOrg.id,
      batchId: form.batchId,
      subjectId: form.subjectName.toLowerCase().replace(/\s/g, '-'),
      teacherUserId: form.teacherUserId,
      classroomName: form.classroomName,
      scheduledStart: startDate.toISOString(),
      scheduledEnd: endDate.toISOString(),
      topicName: form.topicName || form.subjectName,
      status: 'SCHEDULED',
    };

    setRawSessions((prev) => [...prev, newSession]);
    setIsAddOpen(false);
    showToast('Class session added to timetable!', 'success');
  };

  const CELL_HEIGHT = 64; // px per hour slot
  const HEADER_HEIGHT = 48;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-full mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* ── Header ─────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#450a0a] to-[#991b1b] flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Class Timetable</h1>
              <p className="text-sm text-slate-500 mt-0.5">{currentOrg.tradeName} · Weekly Schedule</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {conflictedIds.size > 0 && (
              <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 px-3 py-1.5 rounded-lg text-xs font-medium">
                <AlertTriangle className="w-3.5 h-3.5" />
                {conflictedIds.size / 2} time conflict{conflictedIds.size / 2 > 1 ? 's' : ''}
              </div>
            )}
            <button
              onClick={() => setIsAddOpen(true)}
              className="flex items-center gap-2 bg-[#991b1b] hover:bg-[#7f1d1d] text-white px-4 py-2.5 rounded-xl font-semibold text-sm shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              New Session
            </button>
          </div>
        </div>

        {/* ── Controls bar ───────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-3 flex flex-col sm:flex-row gap-3 items-center">
          {/* Week nav */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setWeekOffset((w) => w - 1)}
              className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition"
            >
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            </button>
            <div className="text-sm font-semibold text-slate-700 min-w-[180px] text-center">{weekLabel}</div>
            <button
              onClick={() => setWeekOffset((w) => w + 1)}
              className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition"
            >
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </button>
            {weekOffset !== 0 && (
              <button
                onClick={() => setWeekOffset(0)}
                className="text-xs text-rose-700 font-medium hover:underline ml-1"
              >
                Today
              </button>
            )}
          </div>

          <div className="h-4 border-l border-slate-200 hidden sm:block" />

          {/* Batch filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <div className="relative">
              <select
                value={filterBatchId}
                onChange={(e) => setFilterBatchId(e.target.value)}
                className="pl-3 pr-8 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 appearance-none text-slate-700"
              >
                <option value="ALL">All Batches</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              {SUBJECT_COLORS.slice(0, 3).map((c, i) => (
                <div key={i} className={`w-3 h-3 rounded-full ${c.dot}`} />
              ))}
              <span>Subject colors</span>
            </div>
          </div>
        </div>

        {/* ── Main Layout ─────────────────────────────────────── */}
        <div className="flex gap-4">
          {/* ── Calendar Grid ─────────────────────────────────── */}
          <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden min-w-0">
            {isLoading ? (
              <div className="p-6"><TimetableSkeleton /></div>
            ) : (
              <div className="overflow-x-auto overflow-y-auto" style={{ maxHeight: '75vh' }}>
                <div className="min-w-[700px]">
                  {/* Day headers */}
                  <div className="flex border-b border-slate-200 sticky top-0 bg-white z-10">
                    {/* Time gutter */}
                    <div className="w-14 shrink-0" />
                    {DAYS.map((day, i) => {
                      const date = weekDates[i];
                      const todayMark = isToday(date);
                      return (
                        <div
                          key={day}
                          className={`flex-1 text-center py-3 text-sm font-semibold border-l border-slate-100 ${
                            todayMark ? 'bg-rose-50' : ''
                          }`}
                        >
                          <div className={`text-xs uppercase tracking-wide ${todayMark ? 'text-rose-700' : 'text-slate-500'}`}>
                            {day}
                          </div>
                          <div
                            className={`text-lg font-bold mt-0.5 ${
                              todayMark
                                ? 'w-8 h-8 rounded-full bg-[#991b1b] text-white flex items-center justify-center mx-auto text-sm'
                                : 'text-slate-800'
                            }`}
                          >
                            {date.getDate()}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Time slots */}
                  {HOURS.map((hour) => (
                    <div key={hour} className="flex" style={{ height: CELL_HEIGHT }}>
                      {/* Time label */}
                      <div className="w-14 shrink-0 text-right pr-2 pt-1">
                        <span className="text-[10px] text-slate-400 font-medium">{formatHour(hour)}</span>
                      </div>

                      {/* Day columns */}
                      {DAYS.map((day, dayIdx) => {
                        const todayMark = isToday(weekDates[dayIdx]);
                        const sessionsInSlot = (sessionsByDay[dayIdx] || []).filter(
                          (s) => s.startHour === hour
                        );
                        return (
                          <div
                            key={day}
                            className={`flex-1 border-l border-t border-slate-100 relative ${
                              todayMark ? 'bg-rose-50/30' : ''
                            }`}
                          >
                            {sessionsInSlot.map((sess) => {
                              const topOffset = (sess.startMinute / 60) * CELL_HEIGHT;
                              const heightPx = sess.durationHours * CELL_HEIGHT - 4;
                              return (
                                <div
                                  key={sess.id}
                                  className="absolute left-0.5 right-0.5 z-10"
                                  style={{ top: topOffset, height: heightPx }}
                                >
                                  <SessionCard
                                    session={sess}
                                    isConflict={conflictedIds.has(sess.id)}
                                    compact={heightPx < 50}
                                    onClick={() => {
                                      setSubstituteSession(sess);
                                      setSelectedSubstituteTeacherId('');
                                    }}
                                  />

                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {!isLoading && enrichedSessions.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 px-6 border-t border-slate-100">
                <Calendar className="w-12 h-12 text-slate-200 mb-3" />
                <h3 className="text-slate-600 font-semibold mb-1">No sessions scheduled</h3>
                <p className="text-xs text-slate-400 text-center mb-4">
                  Add class sessions to populate the timetable grid.
                </p>
                <button
                  onClick={() => setIsAddOpen(true)}
                  className="flex items-center gap-1.5 text-sm bg-[#991b1b] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#7f1d1d] transition"
                >
                  <Plus className="w-4 h-4" /> Add First Session
                </button>
              </div>
            )}
          </div>

          {/* ── Sidebar: Upcoming ──────────────────────────────── */}
          <div className="w-72 shrink-0 hidden xl:flex flex-col gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4">
              <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-rose-700" />
                Upcoming Classes
              </h3>
              {upcomingSessions.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No upcoming sessions</p>
              ) : (
                <div className="space-y-2">
                  {upcomingSessions.map((s) => {
                    const color = SUBJECT_COLORS[s.colorIndex % SUBJECT_COLORS.length];
                    const startDate = new Date(s.scheduledStart);
                    const dayLabel = isToday(startDate)
                      ? 'Today'
                      : startDate.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' });

                    return (
                      <div
                        key={s.id}
                        onClick={() => {
                          setSubstituteSession(s);
                          setSelectedSubstituteTeacherId('');
                        }}
                        className={`rounded-xl border p-2.5 ${color.bg} ${color.text} cursor-pointer hover:shadow-md transition-shadow`}
                        title="Click to assign substitute teacher"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-xs truncate">{s.subjectName}</p>
                            <p className="text-xs opacity-75 truncate">{s.batchName}</p>
                          </div>
                          <span className="text-[10px] font-bold opacity-60 ml-1 shrink-0">{dayLabel}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5 text-[10px] opacity-70">
                          <div className="flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            {formatTime(s.scheduledStart)}
                          </div>
                          <div className="flex items-center gap-0.5">
                            <MapPin className="w-2.5 h-2.5" />
                            {s.classroomName}
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-1 text-[10px] opacity-65">
                          <div className="flex items-center gap-0.5">
                            <UserIcon className="w-2.5 h-2.5" />
                            {s.teacherName}
                          </div>
                          <span className="text-[9px] underline font-semibold">Change</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-3">
              <h3 className="text-sm font-bold text-slate-700">This Week Stats</h3>
              {[
                { label: 'Scheduled', value: enrichedSessions.filter((s) => s.status === 'SCHEDULED').length, color: 'text-blue-600' },
                { label: 'Completed', value: enrichedSessions.filter((s) => s.status === 'COMPLETED').length, color: 'text-emerald-600' },
                { label: 'Cancelled', value: enrichedSessions.filter((s) => s.status === 'CANCELLED').length, color: 'text-red-500' },
                { label: 'Conflicts', value: conflictedIds.size / 2, color: 'text-amber-600' },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">{stat.label}</span>
                  <span className={`text-sm font-bold ${stat.color}`}>{stat.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <AddSessionModal
        open={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        batches={batches}
        teachers={teachers}
        onAdd={handleAddSession}
        existingSessions={enrichedSessions}
      />

      {/* ── Substitute Teacher Modal (Goal 28) ────────────────────────── */}
      {substituteSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-[#991b1b]" />
                  <span>Assign Substitute Faculty</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Replace teacher for {substituteSession.batchName} &bull; {substituteSession.subjectName}
                </p>
              </div>
              <button
                onClick={() => setSubstituteSession(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Session Summary Card */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Scheduled Time:</span>
                <span className="font-bold text-slate-800">
                  {formatTime(substituteSession.scheduledStart)} – {formatTime(substituteSession.scheduledEnd)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Classroom:</span>
                <span className="font-bold text-slate-800">{substituteSession.classroomName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Currently Assigned:</span>
                <span className="font-bold text-rose-700">{substituteSession.teacherName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Topic:</span>
                <span className="font-semibold text-slate-700">{substituteSession.topicName}</span>
              </div>
            </div>

            {/* Teacher Selection */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Select Replacement Teacher ({teachers.length} available)
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {teachers.map((teacher) => {
                  const isCurrent = teacher.id === substituteSession.teacherUserId;
                  const isSelected = selectedSubstituteTeacherId === teacher.id;

                  // Check if this candidate teacher has a conflict at this time
                  const hasConflict = enrichedSessions.some(
                    (other) =>
                      other.id !== substituteSession.id &&
                      other.teacherUserId === teacher.id &&
                      other.dayIndex === substituteSession.dayIndex &&
                      Math.max(other.startHour, substituteSession.startHour) <
                        Math.min(
                          other.startHour + other.durationHours,
                          substituteSession.startHour + substituteSession.durationHours
                        )
                  );

                  return (
                    <div
                      key={teacher.id}
                      onClick={() => !isCurrent && setSelectedSubstituteTeacherId(teacher.id)}
                      className={`p-3 rounded-xl border text-xs flex items-center justify-between transition-all ${
                        isCurrent
                          ? 'opacity-40 bg-slate-100 border-slate-200 cursor-not-allowed'
                          : isSelected
                          ? 'border-[#991b1b] bg-red-50/50 shadow-2xs cursor-pointer'
                          : 'border-slate-200 bg-white hover:bg-slate-50 cursor-pointer'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-slate-900">{teacher.fullName}</div>
                        <div className="text-[11px] text-slate-500 capitalize">{teacher.role.toLowerCase()}</div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isCurrent ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                            Current
                          </span>
                        ) : hasConflict ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Busy
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            Free Slot
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSubstituteSession(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!selectedSubstituteTeacherId}
                onClick={() => {
                  const newTeacher = teachers.find((t) => t.id === selectedSubstituteTeacherId);
                  if (!newTeacher) return;

                  setRawSessions((prev) =>
                    prev.map((s) =>
                      s.id === substituteSession.id ? { ...s, teacherUserId: newTeacher.id } : s
                    )
                  );

                  showToast(
                    `Substitute assigned! ${newTeacher.fullName} is now teaching ${substituteSession.subjectName}. WhatsApp notification sent.`,
                    'success'
                  );
                  setSubstituteSession(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#991b1b] hover:bg-[#7f1d1d] disabled:opacity-40 text-white shadow-xs transition-colors cursor-pointer"
              >
                Assign &amp; Notify Substitute
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

