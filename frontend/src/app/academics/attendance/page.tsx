'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useApp } from '@/lib/context/AppContext';
import { db } from '@/lib/db/store';
import { Student } from '@/lib/types';
import { 
  CalendarCheck, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Send, 
  Users,
  Check,
  X,
  MessageSquare,
  MessageCircle,
  PhoneCall,
  Phone,
  ShieldAlert,
  Layers,
  UserPlus,
  Zap,
  ArrowRight
} from 'lucide-react';
import { buildAbsentAlertWhatsAppUrl } from '@/lib/utils/whatsapp';
import { maskPhoneNumber } from '@/lib/utils/privacy';
import AbsenteeBlastModal from '@/components/academics/AbsenteeBlastModal';
import { absenteeQueueService } from '@/lib/services/absenteeQueue';

interface NotificationResult {
  studentName: string;
  to: string;
  status: 'SENT' | 'FAILED' | 'SIMULATED';
  messageId?: string;
  error?: string;
}

export default function AttendancePage() {
  const { currentOrg, currentBranch, currentUser, showToast } = useApp();
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [statusMap, setStatusMap] = useState<Record<string, 'PRESENT' | 'ABSENT' | 'LATE'>>({});
  const [reasonsMap, setReasonsMap] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isBlastModalOpen, setIsBlastModalOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationResult[]>([]);

  // Load live batches and students
  const batches = useMemo(() => db.getBatches(currentOrg.id), [currentOrg.id]);
  const allStudents = useMemo(() => db.getStudents(currentOrg.id), [currentOrg.id]);

  // Set initial selected batch when batches load or change
  useEffect(() => {
    if (batches.length > 0) {
      if (!selectedBatchId || !batches.find(b => b.id === selectedBatchId)) {
        setSelectedBatchId(batches[0].id);
      }
    } else {
      setSelectedBatchId('');
    }
  }, [batches, selectedBatchId]);

  // Students in selected batch (strictly filtered by currentOrg and batch)
  const batchStudents = useMemo(() => {
    if (!selectedBatchId) return [];
    return allStudents.filter(s => s.batchId === selectedBatchId);
  }, [allStudents, selectedBatchId]);

  const activeBatch = batches.find(b => b.id === selectedBatchId);

  // Initialize all to PRESENT by default
  useEffect(() => {
    const initial: Record<string, 'PRESENT' | 'ABSENT' | 'LATE'> = {};
    batchStudents.forEach((s) => {
      initial[s.id] = 'PRESENT';
    });
    setStatusMap(initial);
  }, [batchStudents]);

  const setStudentStatus = (studentId: string, status: 'PRESENT' | 'ABSENT' | 'LATE') => {
    setStatusMap(prev => ({ ...prev, [studentId]: status }));
  };

  const markAllPresent = () => {
    const updated: Record<string, 'PRESENT' | 'ABSENT' | 'LATE'> = {};
    batchStudents.forEach(s => {
      updated[s.id] = 'PRESENT';
    });
    setStatusMap(updated);
    showToast('All students marked Present');
  };

  const handleSaveAttendance = async () => {
    if (batchStudents.length === 0) return;
    setIsSaving(true);
    setNotifications([]);
    const records = batchStudents.map(s => ({
      studentId: s.id,
      status: statusMap[s.id] || 'PRESENT',
      reason: reasonsMap[s.id] || '',
    }));

    try {
      const res = await fetch('/api/v1/class-sessions/sess-today-01/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: currentOrg.id,
          records,
        }),
      });

      const json = await res.json();
      const notifResults: NotificationResult[] = json?.meta?.notifications || [];
      setNotifications(notifResults);

      const absentCount = records.filter(r => r.status === 'ABSENT').length;
      const sentCount = notifResults.filter(n => n.status === 'SENT' || n.status === 'SIMULATED').length;

      // Automatically sync absent students to Central Absentee Queue for Messages Hub
      if (absentCount > 0) {
        const absentStudents = batchStudents.filter(s => (statusMap[s.id] || 'PRESENT') === 'ABSENT');
        absenteeQueueService.syncFromAttendanceKiosk(
          currentOrg.id,
          selectedBatchId,
          activeBatch?.name || 'Class Session',
          absentStudents
        );
        showToast(`Attendance saved! ${absentCount} absentees synced to WhatsApp Queue. Click '1-Click Blast' to notify parents.`, 'info');
      } else {
        showToast('Attendance saved. All students present today! ✅', 'success');
      }
    } catch (err) {
      showToast('Attendance saved locally.');
    } finally {
      setIsSaving(false);
    }
  };

  const presentCount = Object.values(statusMap).filter(s => s === 'PRESENT').length;
  const absentCount = Object.values(statusMap).filter(s => s === 'ABSENT').length;
  const lateCount = Object.values(statusMap).filter(s => s === 'LATE').length;

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Rapid Attendance Kiosk
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 text-[#991b1b] border border-red-200">
              {currentOrg.tradeName}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Mark class roll calls in 3 seconds. Absentees trigger instant parent WhatsApp &amp; SMS alerts.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {batchStudents.length > 0 && (
            <button
              onClick={markAllPresent}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Mark All Present
            </button>
          )}

          <button
            onClick={handleSaveAttendance}
            disabled={isSaving || batchStudents.length === 0}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#991b1b] hover:bg-[#7f1d1d] disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer"
          >
            {isSaving ? (
              <Clock className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <CalendarCheck className="w-3.5 h-3.5" />
            )}
            <span>Save &amp; Notify Parents</span>
          </button>
        </div>
      </div>

      {batches.length === 0 ? (
        <div className="p-16 bg-white rounded-2xl border border-dashed border-slate-200 text-center space-y-3">
          <Layers className="w-12 h-12 text-slate-300 mx-auto" />
          <div className="text-base font-bold text-slate-800">
            No batches found in {currentOrg.tradeName}
          </div>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Create your first academic batch to populate classroom rosters and start tracking rapid attendance.
          </p>
          <Link
            href="/academics/batches"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#991b1b] hover:bg-[#7f1d1d] text-white text-xs font-bold rounded-xl shadow-sm transition-all mt-2"
          >
            <span>Create First Batch</span>
          </Link>
        </div>
      ) : (
        <>
          {/* Batch Selector & Summary Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Batch Picker */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-1.5">
              <label className="text-xs font-medium text-slate-500 block">Select Batch &amp; Class</label>
              <select
                value={selectedBatchId}
                onChange={e => setSelectedBatchId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-medium text-slate-800 focus:outline-none focus:bg-white focus:border-[#991b1b]"
              >
                {batches.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Present Count */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-1">
              <span className="text-xs font-medium text-slate-500 block">Present</span>
              <div className="text-2xl font-bold text-emerald-700">{presentCount}</div>
              <div className="text-[11px] text-slate-400">In class today</div>
            </div>

            {/* Absent Count */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-1">
              <span className="text-xs font-medium text-slate-500 block">Absent</span>
              <div className="text-2xl font-bold text-rose-600">{absentCount}</div>
              <div className="text-[11px] text-rose-600 font-medium">Automatic parent alerts</div>
            </div>

            {/* Late Count */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-1">
              <span className="text-xs font-medium text-slate-500 block">Late</span>
              <div className="text-2xl font-bold text-amber-700">{lateCount}</div>
              <div className="text-[11px] text-slate-400">Arrived after start time</div>
            </div>
          </div>

          {/* Absentee Parent Safety Alert Dispatch Tray */}
          {absentCount > 0 && (
            <div className="bg-red-50/90 border border-red-200 rounded-2xl p-5 shadow-xs space-y-3 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-red-200/80">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-red-600 animate-pulse shrink-0" />
                  <div>
                    <div className="font-bold text-red-950 text-sm">
                      {absentCount} Student{absentCount > 1 ? 's' : ''} Absent Today &bull; Parent Safety Notice
                    </div>
                    <p className="text-[11px] text-red-800">
                      All absent student data transfers automatically to Messages &bull; 1-click WhatsApp dispatch to their own numbers.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      const absentStudents = batchStudents.filter(s => (statusMap[s.id] || 'PRESENT') === 'ABSENT');
                      absenteeQueueService.syncFromAttendanceKiosk(
                        currentOrg.id,
                        selectedBatchId,
                        activeBatch?.name || 'Class Session',
                        absentStudents
                      );
                      setIsBlastModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>🚀 1-Click WhatsApp Blast ({absentCount})</span>
                  </button>

                  <Link
                    href="/messages?tab=ABSENTEES"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold shadow-2xs transition-all"
                  >
                    <span>View in Messages Queue</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {batchStudents.filter(s => statusMap[s.id] === 'ABSENT').map(student => {
                  const parentPhone = student.guardianPhone || (student as any).parentPhone || student.phone || '9876543210';
                  const waUrl = buildAbsentAlertWhatsAppUrl({
                    parentPhone,
                    parentName: student.guardianName || (student as any).parentName || `Parent of ${student.fullName}`,
                    studentName: student.fullName,
                    batchName: activeBatch?.name || 'Class Session',
                    classTime: 'Today\'s Lecture',
                    instituteName: currentOrg.tradeName,
                    directorPhone: currentBranch?.phone || '9876543210',
                  });

                  return (
                    <div key={student.id} className="bg-white rounded-xl p-3 border border-red-200 shadow-2xs flex items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-900 text-xs">{student.fullName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {maskPhoneNumber(parentPhone, currentUser?.role)}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs cursor-pointer"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>WhatsApp</span>
                        </a>
                        <a
                          href={`tel:${parentPhone}`}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                          title="Call Parent"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Roster Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="px-5 py-3.5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
                Student Roster ({batchStudents.length} Students in {activeBatch?.name || 'Batch'})
              </h2>
              <span className="text-xs text-slate-400 font-medium">
                Date: {new Date().toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
              </span>
            </div>

            {batchStudents.length === 0 ? (
              <div className="p-16 text-center space-y-3">
                <Users className="w-12 h-12 text-slate-300 mx-auto" />
                <div className="text-sm font-bold text-slate-700">
                  No students enrolled in {activeBatch?.name || 'this batch'}
                </div>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Admit walk-in students or assign enrolled candidates to this batch to mark attendance.
                </p>
                <Link
                  href="/admissions"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#991b1b] hover:bg-[#7f1d1d] text-white text-xs font-bold rounded-xl shadow-sm transition-all mt-2"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Enroll Students to Batch</span>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {batchStudents.map((student) => {
                  const currentStatus = statusMap[student.id] || 'PRESENT';

                  return (
                    <div 
                      key={student.id} 
                      className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                        currentStatus === 'ABSENT' ? 'bg-rose-50/30' : 'hover:bg-slate-50/60'
                      }`}
                    >
                      {/* Student Info */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-red-50 text-[#991b1b] font-semibold text-xs flex items-center justify-center shrink-0 border border-red-200">
                          {student.fullName.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-xs text-slate-900 truncate">{student.fullName}</div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {student.studentUniqueId} &bull; Guardian: {student.guardianName} ({student.guardianPhone})
                          </div>
                        </div>
                      </div>

                      {/* Status Toggle Buttons */}
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-medium">
                          <button
                            type="button"
                            onClick={() => setStudentStatus(student.id, 'PRESENT')}
                            className={`px-3 py-1.5 rounded-md flex items-center gap-1 transition-all ${
                              currentStatus === 'PRESENT'
                                ? 'bg-emerald-600 text-white font-bold shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            <Check className="w-3 h-3" />
                            <span>Present</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setStudentStatus(student.id, 'LATE')}
                            className={`px-3 py-1.5 rounded-md flex items-center gap-1 transition-all ${
                              currentStatus === 'LATE'
                                ? 'bg-amber-600 text-white font-bold shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            <Clock className="w-3 h-3" />
                            <span>Late</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setStudentStatus(student.id, 'ABSENT')}
                            className={`px-3 py-1.5 rounded-md flex items-center gap-1 transition-all ${
                              currentStatus === 'ABSENT'
                                ? 'bg-rose-600 text-white font-bold shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            <X className="w-3 h-3" />
                            <span>Absent</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* 1-Click Absentee WhatsApp Dispatcher Modal */}
      <AbsenteeBlastModal
        isOpen={isBlastModalOpen}
        onClose={() => setIsBlastModalOpen(false)}
        organizationId={currentOrg.id}
        instituteName={currentOrg.tradeName}
        directorPhone={currentBranch?.phone || '9876543210'}
        onDispatched={() => {
          showToast('WhatsApp absent alert status updated!');
        }}
      />
    </div>
  );
}
