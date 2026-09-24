'use client';

import React, { useState } from 'react';
import { AttritionAnalysis, InstituteAttritionSummary } from '@/lib/services/attritionEngine';
import { 
  AlertTriangle, 
  X, 
  Phone, 
  MessageSquare, 
  ShieldAlert, 
  TrendingDown, 
  Clock, 
  CheckCircle2, 
  UserCheck, 
  ArrowUpRight,
  Sparkles,
  HelpCircle,
  Calendar
} from 'lucide-react';

interface DropoutRadarModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: InstituteAttritionSummary;
  instituteName: string;
}

export default function DropoutRadarModal({
  isOpen,
  onClose,
  summary,
  instituteName,
}: DropoutRadarModalProps) {
  const [filter, setFilter] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'WATCHLIST'>('ALL');
  const [scheduledInterventions, setScheduledInterventions] = useState<Record<string, boolean>>({});

  if (!isOpen) return null;

  const filteredStudents = summary.students.filter(s => {
    if (filter === 'ALL') return s.riskLevel !== 'HEALTHY';
    return s.riskLevel === filter;
  });

  const handleSchedulePTM = (studentId: string, studentName: string) => {
    setScheduledInterventions(prev => ({ ...prev, [studentId]: true }));
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200/90 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header with High-Impact Warning Banner */}
        <div className="bg-gradient-to-r from-[#450a0a] via-[#7f1d1d] to-[#991b1b] text-white p-5 sm:p-6 relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-rose-500/20 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-start justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-950/80 border border-rose-500/40 flex items-center justify-center text-rose-300 shadow-inner">
                <ShieldAlert className="w-6 h-6 text-rose-300 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black tracking-tight text-white">
                    Student Churn &amp; Dropout Radar
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-950 text-rose-200 border border-rose-800">
                    Proprietary AI
                  </span>
                </div>
                <p className="text-xs text-rose-200/80 mt-1 max-w-xl">
                  Multi-signal early warning correlating attendance decline, test score drops, and delayed installments to prevent student dropouts 3–4 weeks before they quit.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Metrics Ticker */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-rose-900/60 relative z-10">
            <div className="bg-rose-950/50 backdrop-blur-xs p-3 rounded-xl border border-rose-800/40">
              <span className="text-[11px] font-semibold text-rose-200 block">Tuition Revenue at Risk</span>
              <div className="text-xl font-black text-white mt-0.5">
                ₹{summary.totalRevenueAtRiskRupees.toLocaleString('en-IN')}
              </div>
            </div>
            <div className="bg-rose-950/50 backdrop-blur-xs p-3 rounded-xl border border-rose-800/40">
              <span className="text-[11px] font-semibold text-rose-200 block">Critical Risk Students</span>
              <div className="text-xl font-black text-rose-300 mt-0.5 flex items-center gap-1.5">
                <span>{summary.criticalCount}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-600/80 text-white">Immediate</span>
              </div>
            </div>
            <div className="bg-rose-950/50 backdrop-blur-xs p-3 rounded-xl border border-rose-800/40">
              <span className="text-[11px] font-semibold text-rose-200 block">High Risk Students</span>
              <div className="text-xl font-black text-amber-300 mt-0.5">
                {summary.highRiskCount}
              </div>
            </div>
            <div className="bg-rose-950/50 backdrop-blur-xs p-3 rounded-xl border border-rose-800/40">
              <span className="text-[11px] font-semibold text-rose-200 block">Watchlist (Early Signs)</span>
              <div className="text-xl font-black text-slate-200 mt-0.5">
                {summary.watchlistCount}
              </div>
            </div>
          </div>
        </div>

        {/* Filter Navigation */}
        <div className="px-6 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-3 overflow-x-auto">
          <div className="flex items-center gap-1.5">
            {[
              { id: 'ALL', label: 'All At-Risk', count: summary.criticalCount + summary.highRiskCount + summary.watchlistCount },
              { id: 'CRITICAL', label: 'Critical Alert', count: summary.criticalCount },
              { id: 'HIGH', label: 'High Risk', count: summary.highRiskCount },
              { id: 'WATCHLIST', label: 'Watchlist', count: summary.watchlistCount },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  filter === tab.id
                    ? 'bg-[#991b1b] text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  filter === tab.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <span className="text-xs text-slate-400 font-medium hidden sm:block">
            {filteredStudents.length} Students flagged for attention
          </span>
        </div>

        {/* Students List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {filteredStudents.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <p className="text-base font-bold text-slate-800">No students currently in this risk category!</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Student attendance and marks are consistent. Our multi-signal radar monitors weekly tests and attendance continuously.
              </p>
            </div>
          ) : (
            filteredStudents.map(student => {
              const isCritical = student.riskLevel === 'CRITICAL';
              const isHigh = student.riskLevel === 'HIGH';
              const isScheduled = scheduledInterventions[student.studentId];

              // Clean phone number for WhatsApp link
              const cleanPhone = student.parentPhone.replace(/\D/g, '');
              const waLink = `https://wa.me/91${cleanPhone}?text=${student.whatsappMessage}`;

              return (
                <div
                  key={student.studentId}
                  className={`bg-white rounded-2xl border p-5 shadow-xs transition-all ${
                    isCritical
                      ? 'border-red-300 ring-1 ring-red-100'
                      : isHigh
                      ? 'border-amber-200'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-3 border-b border-slate-100">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          isCritical
                            ? 'bg-red-100 text-red-900 border border-red-300'
                            : isHigh
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-slate-100 text-slate-800 border border-slate-200'
                        }`}>
                          {student.riskLevel} CHURN THREAT
                        </span>
                        <h3 className="font-black text-slate-900 text-base">
                          {student.studentName}
                        </h3>
                        <span className="text-xs font-mono text-slate-400 font-semibold">
                          {student.rollNumber}
                        </span>
                      </div>

                      <div className="text-xs text-slate-500 flex items-center gap-2">
                        <span className="font-semibold text-slate-700">{student.batchName}</span>
                        <span>&bull;</span>
                        <span>Guardian: {student.parentName}</span>
                        <span>&bull;</span>
                        <span className="font-mono text-slate-600">{student.parentPhone}</span>
                      </div>
                    </div>

                    {/* Risk Gauge Badge */}
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <div className="text-xs font-semibold text-slate-400">Dropout Probability</div>
                        <div className={`text-2xl font-black ${
                          isCritical ? 'text-red-700' : isHigh ? 'text-amber-600' : 'text-slate-700'
                        }`}>
                          {student.riskScore}%
                        </div>
                      </div>
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                        <TrendingDown className={`w-6 h-6 ${
                          isCritical ? 'text-red-600' : isHigh ? 'text-amber-500' : 'text-slate-500'
                        }`} />
                      </div>
                    </div>
                  </div>

                  {/* 3 Metric Pills: Attendance, Test Score, Fees Overdue */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-3">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                      <span className="text-[11px] text-slate-500 font-medium block">Attendance Record</span>
                      <span className={`text-sm font-bold ${
                        student.attendanceRate < 70 ? 'text-red-700' : student.attendanceRate < 80 ? 'text-amber-600' : 'text-emerald-700'
                      }`}>
                        {student.attendanceRate}% average
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                      <span className="text-[11px] text-slate-500 font-medium block">Recent Tests Average</span>
                      <span className={`text-sm font-bold ${
                        student.recentTestAverage < 50 ? 'text-red-700' : student.recentTestAverage < 65 ? 'text-amber-600' : 'text-emerald-700'
                      }`}>
                        {student.recentTestAverage}% score
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                      <span className="text-[11px] text-slate-500 font-medium block">Pending Tuition Dues</span>
                      <span className={`text-sm font-bold ${
                        student.unpaidFeesPaise > 0 ? 'text-red-700 font-mono' : 'text-slate-700'
                      }`}>
                        {student.unpaidFeesPaise > 0 ? `₹${Math.round(student.unpaidFeesPaise / 100).toLocaleString('en-IN')}` : 'Cleared'}
                      </span>
                    </div>
                  </div>

                  {/* Root Cause Triggers */}
                  <div className="bg-slate-50/70 rounded-xl p-3 border border-slate-200/60 mb-4">
                    <span className="text-[11px] font-bold text-slate-700 block mb-1">
                      Identified Churn Triggers:
                    </span>
                    <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                      {student.factors.map((factor, fIdx) => (
                        <li key={fIdx}>{factor}</li>
                      ))}
                    </ul>
                  </div>

                  {/* 1-Click Director Action Toolbar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <div className="text-xs text-slate-500 max-w-sm">
                      <span className="font-semibold text-slate-700">Recommended: </span>
                      {student.recommendedAction}
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-2xs cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Send WhatsApp Care Alert</span>
                      </a>

                      <a
                        href={`tel:${student.parentPhone}`}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                        title="Call Parent Directly"
                      >
                        <Phone className="w-4 h-4" />
                      </a>

                      <button
                        onClick={() => handleSchedulePTM(student.studentId, student.studentName)}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors ${
                          isScheduled
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                            : 'bg-[#991b1b] hover:bg-[#7f1d1d] text-white shadow-2xs'
                        }`}
                      >
                        {isScheduled ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>PTM Booked</span>
                          </>
                        ) : (
                          <>
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Book 1-on-1 Director PTM</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#991b1b]" />
            <span>CoachingOS Attrition Engine updates automatically after every test and attendance record.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-100"
          >
            Close Radar
          </button>
        </div>
      </div>
    </div>
  );
}
