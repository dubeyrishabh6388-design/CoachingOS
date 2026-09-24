'use client';

import React, { useState } from 'react';
import { 
  Clock, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  BookOpen, 
  Plus, 
  X, 
  Sparkles,
  Flame,
  Layers,
  ChevronRight,
  ArrowUpRight
} from 'lucide-react';

export interface ExamMilestone {
  id: string;
  name: string;
  targetDate: string;
  targetExam: string;
  totalChapters: number;
  completedChapters: number;
  plannedLecturesPerWeek: number;
  actualLecturesPerWeek: number;
  subject: string;
  facultyName: string;
  batchName: string;
}

export interface LectureLogEntry {
  id: string;
  date: string;
  batchName: string;
  subject: string;
  facultyName: string;
  topicTaught: string;
  dppAssigned: string;
  attendancePercent: number;
}

const INITIAL_MILESTONES: ExamMilestone[] = [
  {
    id: 'm-1',
    name: 'Class 12 Physics - Board & JEE 2027',
    targetDate: '2027-01-24',
    targetExam: 'JEE Main Session 1',
    totalChapters: 16,
    completedChapters: 9,
    plannedLecturesPerWeek: 4,
    actualLecturesPerWeek: 3,
    subject: 'Physics',
    facultyName: 'Er. R.K. Sharma',
    batchName: 'Target JEE Batch A',
  },
  {
    id: 'm-2',
    name: 'Class 12 Chemistry - Physical & Organic',
    targetDate: '2027-02-15',
    targetExam: 'CBSE 12th Board',
    totalChapters: 14,
    completedChapters: 6,
    plannedLecturesPerWeek: 3,
    actualLecturesPerWeek: 2.2,
    subject: 'Chemistry',
    facultyName: 'Dr. V.P. Singh',
    batchName: 'Target JEE Batch A',
  },
  {
    id: 'm-3',
    name: 'Class 11 Biology - NEET Foundation',
    targetDate: '2027-05-03',
    targetExam: 'NEET UG 2027',
    totalChapters: 22,
    completedChapters: 15,
    plannedLecturesPerWeek: 4,
    actualLecturesPerWeek: 4.2,
    subject: 'Biology',
    facultyName: 'Dr. Ananya Roy',
    batchName: 'NEET Super 30',
  },
  {
    id: 'm-4',
    name: 'Class 10 Mathematics - Foundation Board',
    targetDate: '2027-02-20',
    targetExam: 'CBSE 10th Board',
    totalChapters: 15,
    completedChapters: 11,
    plannedLecturesPerWeek: 3,
    actualLecturesPerWeek: 3.0,
    subject: 'Mathematics',
    facultyName: 'Prof. S.K. Gupta',
    batchName: 'Class 10 Foundation',
  },
];

const INITIAL_LOGS: LectureLogEntry[] = [
  {
    id: 'log-1',
    date: '2026-09-22',
    batchName: 'Target JEE Batch A',
    subject: 'Physics',
    facultyName: 'Er. R.K. Sharma',
    topicTaught: 'Electrostatics: Gauss Theorem & Applications in Spherical Shells',
    dppAssigned: 'DPP-05 (20 MCQs with Previous Year JEE Questions)',
    attendancePercent: 94,
  },
  {
    id: 'log-2',
    date: '2026-09-22',
    batchName: 'NEET Super 30',
    subject: 'Biology',
    facultyName: 'Dr. Ananya Roy',
    topicTaught: 'Plant Physiology: Photosynthesis Light Reaction & Z-Scheme',
    dppAssigned: 'NCERT Exemplar Chapter 13 Q1-25 + Diagram Practice',
    attendancePercent: 96,
  },
  {
    id: 'log-3',
    date: '2026-09-21',
    batchName: 'Target JEE Batch A',
    subject: 'Chemistry',
    facultyName: 'Dr. V.P. Singh',
    topicTaught: 'Chemical Kinetics: Arrhenius Equation & Activation Energy',
    dppAssigned: 'Sheet #3 Exercise 2 Q10-30',
    attendancePercent: 88,
  },
];

export default function SyllabusVelocityTracker({ instituteName }: { instituteName: string }) {
  const [milestones, setMilestones] = useState<ExamMilestone[]>(INITIAL_MILESTONES);
  const [lectureLogs, setLectureLogs] = useState<LectureLogEntry[]>(INITIAL_LOGS);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);

  // New log form state
  const [newBatch, setNewBatch] = useState('Target JEE Batch A');
  const [newSubject, setNewSubject] = useState('Physics');
  const [newFaculty, setNewFaculty] = useState('Er. R.K. Sharma');
  const [newTopic, setNewTopic] = useState('');
  const [newDpp, setNewDpp] = useState('');

  const handleAddLecture = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopic.trim()) return;

    const entry: LectureLogEntry = {
      id: `log-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      batchName: newBatch,
      subject: newSubject,
      facultyName: newFaculty,
      topicTaught: newTopic,
      dppAssigned: newDpp || 'No homework assigned',
      attendancePercent: 92,
    };

    setLectureLogs([entry, ...lectureLogs]);
    setNewTopic('');
    setNewDpp('');
    setIsLogModalOpen(false);
  };

  const calculateDaysRemaining = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - new Date().getTime();
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Syllabus Velocity Alert */}
      <div className="bg-gradient-to-r from-[#2c0505] via-[#450a0a] to-[#7f1d1d] text-white p-6 rounded-3xl shadow-xl border border-red-900/60 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-950 text-rose-200 border border-rose-800">
              Exam Countdown Radar
            </span>
            <span className="text-xs text-rose-300 font-semibold">Real-Time Syllabus Velocity</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Faculty Teaching Pace &amp; Exam Readiness Clock
          </h2>
          <p className="text-xs text-rose-200/80 max-w-xl">
            Calculates whether faculty will finish the syllabus before Board and competitive exam deadlines. Alerts the Director weeks in advance so extra Sunday classes can be scheduled before exam panic.
          </p>
        </div>

        <button
          onClick={() => setIsLogModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#991b1b] hover:bg-[#b91c1c] active:bg-[#7f1d1d] text-white text-xs font-bold transition-all shadow-lg shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Log Today&apos;s Lecture &amp; DPP</span>
        </button>
      </div>

      {/* Grid of Exam Syllabus Velocity Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {milestones.map((m) => {
          const daysLeft = calculateDaysRemaining(m.targetDate);
          const weeksLeft = Math.max(1, Math.round(daysLeft / 7));
          const chaptersLeft = m.totalChapters - m.completedChapters;
          const completionPct = Math.round((m.completedChapters / m.totalChapters) * 100);

          // Expected chapters per week to finish on time
          const requiredPace = (chaptersLeft / weeksLeft).toFixed(1);
          // Pace calculation: actual lectures per week divided by typical 4 lectures per chapter
          const actualPaceChapters = (m.actualLecturesPerWeek / 3.8).toFixed(1);
          const isLagging = m.actualLecturesPerWeek < m.plannedLecturesPerWeek;

          return (
            <div
              key={m.id}
              className={`bg-white rounded-2xl border p-5 shadow-xs transition-all ${
                isLagging ? 'border-red-300 ring-1 ring-red-100' : 'border-slate-200'
              }`}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                      {m.subject}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">{m.batchName}</span>
                  </div>
                  <h3 className="font-black text-slate-900 text-base mt-1">{m.name}</h3>
                  <div className="text-xs text-slate-500 mt-0.5">Faculty: <span className="font-semibold text-slate-700">{m.facultyName}</span></div>
                </div>

                {/* Days Countdown Badge */}
                <div className="text-right shrink-0">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900 text-white text-xs font-bold font-mono">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>{daysLeft} Days to {m.targetExam}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">({weeksLeft} weeks left)</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">
                    Syllabus Completed: {m.completedChapters} of {m.totalChapters} Chapters
                  </span>
                  <span className={`font-black ${completionPct >= 70 ? 'text-emerald-700' : 'text-[#991b1b]'}`}>
                    {completionPct}%
                  </span>
                </div>
                <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isLagging ? 'bg-gradient-to-r from-red-600 to-rose-500' : 'bg-gradient-to-r from-emerald-600 to-teal-500'
                    }`}
                    style={{ width: `${completionPct}%` }}
                  />
                </div>
              </div>

              {/* Velocity Math & Action Pill */}
              <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-slate-100 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                  <span className="text-slate-400 block text-[11px]">Required Velocity</span>
                  <span className="font-bold text-slate-800 text-sm mt-0.5 block">
                    {requiredPace} chapters/week
                  </span>
                  <span className="text-[10px] text-slate-500">Need {m.plannedLecturesPerWeek} lectures/wk</span>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                  <span className="text-slate-400 block text-[11px]">Actual Faculty Pace</span>
                  <span className={`font-bold text-sm mt-0.5 block ${isLagging ? 'text-red-700' : 'text-emerald-700'}`}>
                    {m.actualLecturesPerWeek} lectures/week
                  </span>
                  <span className="text-[10px] text-slate-500">Current running speed</span>
                </div>
              </div>

              {/* Recommendation Callout */}
              <div className="mt-3">
                {isLagging ? (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                      <span>
                        <strong>Lagging by ~2.5 weeks:</strong> Organic/Mechanics will exceed target date without extra classes.
                      </span>
                    </div>
                    <span className="px-2 py-1 bg-red-600 text-white rounded-lg text-[10px] font-bold shrink-0">
                      Add 1 Extra Lecture/Week
                    </span>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span><strong>On Track:</strong> Syllabus will be completed 3 weeks prior to exam for full revision tests.</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Daily Lecture & Homework Diary Section */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#991b1b]" />
              <span>Director&apos;s Lecture &amp; DPP Log</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Chronological log of what every faculty member taught in class today and which homework was assigned.
            </p>
          </div>

          <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
            {lectureLogs.length} Lectures Recorded
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {lectureLogs.map((log) => (
            <div key={log.id} className="py-4 flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#991b1b] text-white">
                    {log.subject}
                  </span>
                  <span className="text-xs font-bold text-slate-800">{log.batchName}</span>
                  <span className="text-xs text-slate-400">&bull;</span>
                  <span className="text-xs text-slate-500">{log.facultyName}</span>
                  <span className="text-xs text-slate-400">&bull;</span>
                  <span className="text-xs font-mono text-slate-500">{log.date}</span>
                </div>

                <div className="text-sm font-semibold text-slate-900">
                  {log.topicTaught}
                </div>

                <div className="text-xs text-slate-600 flex items-center gap-2">
                  <span className="font-semibold text-slate-700">Assigned Homework / DPP:</span>
                  <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-800 font-mono text-[11px]">
                    {log.dppAssigned}
                  </span>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-3">
                <div className="text-right">
                  <span className="text-[11px] text-slate-400 block">Class Attendance</span>
                  <span className="text-sm font-bold text-emerald-700">{log.attendancePercent}% present</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Log Modal */}
      {isLogModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-900 text-base">Record Daily Class Lecture &amp; DPP</h3>
              <button onClick={() => setIsLogModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddLecture} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Batch</label>
                  <select
                    value={newBatch}
                    onChange={(e) => setNewBatch(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  >
                    <option value="Target JEE Batch A">Target JEE Batch A</option>
                    <option value="NEET Super 30">NEET Super 30</option>
                    <option value="Class 10 Foundation">Class 10 Foundation</option>
                    <option value="Crash Course 2026">Crash Course 2026</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Subject</label>
                  <select
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  >
                    <option value="Physics">Physics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Biology">Biology</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Faculty Name</label>
                <input
                  type="text"
                  value={newFaculty}
                  onChange={(e) => setNewFaculty(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Topic / Concepts Taught Today</label>
                <textarea
                  rows={2}
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  placeholder="e.g. Current Electricity: Kirchhoff's Laws & Wheatstone Bridge derivations"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">DPP / Homework Assigned</label>
                <input
                  type="text"
                  value={newDpp}
                  onChange={(e) => setNewDpp(e.target.value)}
                  placeholder="e.g. DPP #08 Q1-20 + Previous Years JEE Questions"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsLogModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#991b1b] hover:bg-[#7f1d1d] text-white font-bold shadow-xs"
                >
                  Save to Lecture Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
