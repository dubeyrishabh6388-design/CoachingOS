'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/lib/context/AppContext';
import { db } from '@/lib/db/store';
import {
  BookMarked,
  Plus,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  Search,
  Filter,
  FileText,
  ChevronDown,
  ChevronRight,
  X,
  MessageSquare,
  Award,
  Sparkles,
  ExternalLink,
  Layers,
  Send,
} from 'lucide-react';
import { maskPhoneNumber } from '@/lib/utils/privacy';

// ─── Interfaces ─────────────────────────────────────────────────────────────
interface HomeworkSubmission {
  id: string;
  studentId: string;
  studentName: string;
  rollNumber: string;
  submittedAt?: string;
  status: 'SUBMITTED' | 'PENDING' | 'GRADED';
  score?: number;
  totalMarks: number;
  teacherRemarks?: string;
}

interface Homework {
  id: string;
  organizationId: string;
  batchId: string;
  batchName: string;
  subject: string;
  title: string;
  description: string;
  dueDate: string;
  assignedDate: string;
  totalMarks: number;
  submissions: HomeworkSubmission[];
}

export default function HomeworkPage() {
  const { currentOrg, showToast } = useApp();

  const batches = useMemo(() => db.getBatches(currentOrg.id), [currentOrg.id]);
  const students = useMemo(() => db.getStudents(currentOrg.id), [currentOrg.id]);

  // Initial seed data for homework
  const [homeworkList, setHomeworkList] = useState<Homework[]>(() => {
    if (batches.length === 0) return [];
    const b1 = batches[0];
    const b1Students = students.filter(s => s.batchId === b1.id);
    const b2 = batches[1] || batches[0];
    const b2Students = students.filter(s => s.batchId === b2.id);

    return [
      {
        id: 'hw-001',
        organizationId: currentOrg.id,
        batchId: b1.id,
        batchName: b1.name,
        subject: 'Physics',
        title: 'Daily Practice Sheet (DPP 04) - Friction & Normal Force',
        description: 'Solve questions 1 through 25 from HC Verma Vol 1 Chapter 6. Write full derivation for problem 18 on block over block system.',
        assignedDate: '2026-09-20',
        dueDate: '2026-09-24',
        totalMarks: 50,
        submissions: b1Students.map((s, idx) => ({
          id: `sub-${s.id}-1`,
          studentId: s.id,
          studentName: s.fullName,
          rollNumber: s.rollNumber,
          submittedAt: idx % 2 === 0 ? '2026-09-22 17:30' : undefined,
          status: idx % 2 === 0 ? (idx === 0 ? 'GRADED' : 'SUBMITTED') : 'PENDING',
          score: idx === 0 ? 46 : undefined,
          totalMarks: 50,
          teacherRemarks: idx === 0 ? 'Excellent step-by-step free-body diagram calculation.' : undefined,
        })),
      },
      {
        id: 'hw-002',
        organizationId: currentOrg.id,
        batchId: b1.id,
        batchName: b1.name,
        subject: 'Chemistry',
        title: 'Worksheet on Chemical Kinetics & Arrhenius Equation',
        description: 'Complete integrated rate law derivations for first order and zero order kinetics. Upload photos of your notebook.',
        assignedDate: '2026-09-18',
        dueDate: '2026-09-21',
        totalMarks: 30,
        submissions: b1Students.map((s, idx) => ({
          id: `sub-${s.id}-2`,
          studentId: s.id,
          studentName: s.fullName,
          rollNumber: s.rollNumber,
          submittedAt: '2026-09-20 14:15',
          status: 'GRADED',
          score: Math.min(30, 22 + (idx % 8)),
          totalMarks: 30,
          teacherRemarks: 'Good grasp of rate constant units.',
        })),
      },
      {
        id: 'hw-003',
        organizationId: currentOrg.id,
        batchId: b2.id,
        batchName: b2.name,
        subject: 'Mathematics',
        title: 'Calculus Assignment - Limits & Continuity 30 MCQs',
        description: 'Strict 0/0 and infinity/infinity indeterminate forms. Practice L\'Hopital\'s rule and Taylor expansion methods.',
        assignedDate: '2026-09-21',
        dueDate: '2026-09-26',
        totalMarks: 100,
        submissions: b2Students.map((s, idx) => ({
          id: `sub-${s.id}-3`,
          studentId: s.id,
          studentName: s.fullName,
          rollNumber: s.rollNumber,
          submittedAt: idx === 0 ? '2026-09-22 20:00' : undefined,
          status: idx === 0 ? 'SUBMITTED' : 'PENDING',
          totalMarks: 100,
        })),
      },
    ];
  });

  const [selectedBatchFilter, setSelectedBatchFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'ALL' | 'ACTIVE' | 'GRADED' | 'DUE_SOON'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedHomeworkId, setExpandedHomeworkId] = useState<string | null>(null);

  // Create Assignment Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState('Physics');
  const [newBatchId, setNewBatchId] = useState(batches[0]?.id || '');
  const [newDueDate, setNewDueDate] = useState('');
  const [newTotalMarks, setNewTotalMarks] = useState('50');
  const [newDescription, setNewDescription] = useState('');

  // Grading Modal
  const [gradingSubmission, setGradingSubmission] = useState<{ hwId: string; sub: HomeworkSubmission } | null>(null);
  const [gradeScore, setGradeScore] = useState('');
  const [gradeRemarks, setGradeRemarks] = useState('');

  // Filtered Homework
  const filteredHomework = useMemo(() => {
    return homeworkList.filter(hw => {
      const matchBatch = selectedBatchFilter === 'ALL' || hw.batchId === selectedBatchFilter;
      const matchQuery =
        hw.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        hw.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        hw.batchName.toLowerCase().includes(searchQuery.toLowerCase());

      const today = new Date().toISOString().split('T')[0];
      let matchStatus = true;
      if (selectedStatusFilter === 'ACTIVE') {
        matchStatus = hw.dueDate >= today;
      } else if (selectedStatusFilter === 'DUE_SOON') {
        const diffDays = (new Date(hw.dueDate).getTime() - new Date(today).getTime()) / (1000 * 3600 * 24);
        matchStatus = diffDays >= 0 && diffDays <= 2;
      } else if (selectedStatusFilter === 'GRADED') {
        matchStatus = hw.submissions.some(s => s.status === 'GRADED');
      }

      return matchBatch && matchQuery && matchStatus;
    });
  }, [homeworkList, selectedBatchFilter, selectedStatusFilter, searchQuery]);

  // Aggregate Stats
  const stats = useMemo(() => {
    let totalAssigned = homeworkList.length;
    let totalSubsExpected = 0;
    let totalSubsReceived = 0;
    let totalGraded = 0;

    homeworkList.forEach(hw => {
      totalSubsExpected += hw.submissions.length;
      hw.submissions.forEach(s => {
        if (s.status === 'SUBMITTED' || s.status === 'GRADED') totalSubsReceived++;
        if (s.status === 'GRADED') totalGraded++;
      });
    });

    const completionRate = totalSubsExpected > 0 ? Math.round((totalSubsReceived / totalSubsExpected) * 100) : 0;
    return { totalAssigned, totalSubsExpected, totalSubsReceived, totalGraded, completionRate };
  }, [homeworkList]);

  // Handle Create Homework
  const handleCreateHomework = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      showToast('Please enter an assignment title', 'error');
      return;
    }
    const targetBatch = batches.find(b => b.id === newBatchId) || batches[0];
    if (!targetBatch) {
      showToast('Please select a valid batch', 'error');
      return;
    }

    const batchStudents = students.filter(s => s.batchId === targetBatch.id);
    const newHw: Homework = {
      id: `hw-${Date.now()}`,
      organizationId: currentOrg.id,
      batchId: targetBatch.id,
      batchName: targetBatch.name,
      subject: newSubject,
      title: newTitle,
      description: newDescription,
      assignedDate: new Date().toISOString().split('T')[0],
      dueDate: newDueDate || new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
      totalMarks: parseInt(newTotalMarks) || 50,
      submissions: batchStudents.map(s => ({
        id: `sub-${s.id}-${Date.now()}`,
        studentId: s.id,
        studentName: s.fullName,
        rollNumber: s.rollNumber,
        status: 'PENDING',
        totalMarks: parseInt(newTotalMarks) || 50,
      })),
    };

    setHomeworkList([newHw, ...homeworkList]);
    setIsCreateOpen(false);
    setNewTitle('');
    setNewDescription('');
    showToast(`Assignment "${newTitle}" assigned to ${batchStudents.length} students!`, 'success');
  };

  // Handle Grade Submission
  const handleSaveGrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingSubmission) return;

    const numScore = parseFloat(gradeScore);
    if (isNaN(numScore) || numScore < 0 || numScore > gradingSubmission.sub.totalMarks) {
      showToast(`Please enter a valid score between 0 and ${gradingSubmission.sub.totalMarks}`, 'error');
      return;
    }

    setHomeworkList(prev =>
      prev.map(hw => {
        if (hw.id !== gradingSubmission.hwId) return hw;
        return {
          ...hw,
          submissions: hw.submissions.map(sub => {
            if (sub.id !== gradingSubmission.sub.id) return sub;
            return {
              ...sub,
              status: 'GRADED',
              score: numScore,
              teacherRemarks: gradeRemarks.trim() || 'Reviewed & graded.',
            };
          }),
        };
      })
    );

    showToast(`Graded ${gradingSubmission.sub.studentName}: ${numScore}/${gradingSubmission.sub.totalMarks}`, 'success');
    setGradingSubmission(null);
    setGradeScore('');
    setGradeRemarks('');
  };

  // WhatsApp Reminder to Pending Students
  const handleWhatsAppPending = (hw: Homework) => {
    const pendingCount = hw.submissions.filter(s => s.status === 'PENDING').length;
    if (pendingCount === 0) {
      showToast('All students have already submitted this assignment!', 'info');
      return;
    }
    showToast(`WhatsApp reminder dispatched to ${pendingCount} students/parents for "${hw.title}"`, 'success');
  };

  return (
    <div className="w-full space-y-6">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <BookMarked className="w-7 h-7 text-[#991b1b]" />
            Homework &amp; Assignments
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Assign practice problem sheets, track student submissions, and review homework for {currentOrg.tradeName}.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-2 bg-[#991b1b] hover:bg-[#7f1d1d] text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Assign New Homework
        </button>
      </div>

      {/* ── KPI Metrics Cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Total Assignments</span>
            <div className="p-2 rounded-lg bg-red-50 text-[#991b1b]">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">{stats.totalAssigned}</span>
            <span className="text-xs font-semibold text-slate-500">active items</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Submissions Received</span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-700">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">{stats.totalSubsReceived}</span>
            <span className="text-xs font-semibold text-slate-500">of {stats.totalSubsExpected} expected</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Completion Rate</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">{stats.completionRate}%</span>
            <span className="text-xs font-semibold text-emerald-600">Overall submission</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Reviewed &amp; Graded</span>
            <div className="p-2 rounded-lg bg-purple-50 text-purple-700">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">{stats.totalGraded}</span>
            <span className="text-xs font-semibold text-purple-600">graded with marks</span>
          </div>
        </div>
      </div>

      {/* ── Filters & Search ───────────────────────────────────────────── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status Tabs */}
          {(['ALL', 'ACTIVE', 'DUE_SOON', 'GRADED'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setSelectedStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                selectedStatusFilter === tab
                  ? 'bg-[#991b1b] text-white shadow-2xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {tab === 'ALL' && 'All Assignments'}
              {tab === 'ACTIVE' && 'Active Deadlines'}
              {tab === 'DUE_SOON' && 'Due in 48h'}
              {tab === 'GRADED' && 'Has Graded'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Batch Filter Dropdown */}
          <select
            value={selectedBatchFilter}
            onChange={e => setSelectedBatchFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-[#991b1b]/20"
          >
            <option value="ALL">All Batches ({batches.length})</option>
            {batches.map(b => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>

          {/* Search Box */}
          <div className="relative flex-1 md:w-48">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search homework..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#991b1b]/20 text-slate-800"
            />
          </div>
        </div>
      </div>

      {/* ── Homework List ──────────────────────────────────────────────── */}
      {filteredHomework.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <BookMarked className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Assignments Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchQuery || selectedBatchFilter !== 'ALL'
              ? 'No assignments match your search or filter criteria.'
              : 'Keep students accountable by creating practice sheets, DPPs, and homework assignments.'}
          </p>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="mt-4 inline-flex items-center gap-1.5 bg-[#991b1b] hover:bg-[#7f1d1d] text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create First Homework
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredHomework.map(hw => {
            const isExpanded = expandedHomeworkId === hw.id;
            const submittedCount = hw.submissions.filter(s => s.status === 'SUBMITTED' || s.status === 'GRADED').length;
            const pendingCount = hw.submissions.filter(s => s.status === 'PENDING').length;
            const totalCount = hw.submissions.length;
            const pct = totalCount > 0 ? Math.round((submittedCount / totalCount) * 100) : 0;
            const isPastDue = new Date(hw.dueDate) < new Date(new Date().toISOString().split('T')[0]);

            return (
              <div
                key={hw.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition-all"
              >
                {/* Header Strip */}
                <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-red-50 text-[#991b1b] border border-red-200">
                        {hw.subject}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        {hw.batchName}
                      </span>
                      {isPastDue ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Past Due Date
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Due: {hw.dueDate}
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-slate-900">{hw.title}</h3>
                    <p className="text-xs text-slate-500 line-clamp-2">{hw.description}</p>
                  </div>

                  {/* Submission Progress & Actions */}
                  <div className="flex flex-wrap items-center gap-4 sm:gap-6 border-t md:border-t-0 pt-3 md:pt-0">
                    <div className="w-36">
                      <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                        <span>Submitted</span>
                        <span>{submittedCount}/{totalCount} ({pct}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            pct === 100 ? 'bg-emerald-500' : pct >= 50 ? 'bg-blue-500' : 'bg-amber-500'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleWhatsAppPending(hw)}
                        title="Send WhatsApp alert to students who haven't submitted"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 transition-colors cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Remind ({pendingCount})</span>
                      </button>

                      <button
                        onClick={() => setExpandedHomeworkId(isExpanded ? null : hw.id)}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                          isExpanded
                            ? 'bg-slate-800 text-white border-slate-800'
                            : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        <span>{isExpanded ? 'Hide' : 'Review'}</span>
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Submissions Detail Accordion */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/70 p-5 space-y-3 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Student Submissions &amp; Evaluation ({totalCount} enrolled)
                      </h4>
                      <span className="text-[11px] text-slate-500">Max Marks: {hw.totalMarks}</span>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                          <tr>
                            <th className="py-2.5 px-4">Student</th>
                            <th className="py-2.5 px-4">Roll No</th>
                            <th className="py-2.5 px-4">Submitted At</th>
                            <th className="py-2.5 px-4">Status</th>
                            <th className="py-2.5 px-4">Marks / Total</th>
                            <th className="py-2.5 px-4">Teacher Feedback</th>
                            <th className="py-2.5 px-4 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {hw.submissions.map(sub => (
                            <tr key={sub.id} className="hover:bg-slate-50/60 transition-colors">
                              <td className="py-2.5 px-4 font-semibold text-slate-900">{sub.studentName}</td>
                              <td className="py-2.5 px-4 text-slate-500">{sub.rollNumber}</td>
                              <td className="py-2.5 px-4 text-slate-500">{sub.submittedAt || '—'}</td>
                              <td className="py-2.5 px-4">
                                {sub.status === 'GRADED' ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                    Graded
                                  </span>
                                ) : sub.status === 'SUBMITTED' ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                    Submitted
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                    Pending
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-4 font-bold text-slate-900">
                                {sub.score !== undefined ? `${sub.score} / ${sub.totalMarks}` : `— / ${sub.totalMarks}`}
                              </td>
                              <td className="py-2.5 px-4 text-slate-500 max-w-xs truncate">
                                {sub.teacherRemarks || 'No remarks yet'}
                              </td>
                              <td className="py-2.5 px-4 text-right">
                                <button
                                  onClick={() => {
                                    setGradingSubmission({ hwId: hw.id, sub });
                                    setGradeScore(sub.score !== undefined ? String(sub.score) : '');
                                    setGradeRemarks(sub.teacherRemarks || '');
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-[#991b1b] hover:text-white text-slate-700 font-semibold text-[11px] transition-colors cursor-pointer"
                                >
                                  {sub.status === 'GRADED' ? 'Edit Grade' : 'Grade Now'}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Create Homework Modal ──────────────────────────────────────── */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-red-50 text-[#991b1b]">
                  <BookMarked className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Assign New Homework</h3>
                  <p className="text-xs text-slate-500">Create problem set or DPP for your coaching batch</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateHomework} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Assignment Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DPP 05 - Friction and Centripetal Motion"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#991b1b]/20 text-slate-800 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Subject</label>
                  <select
                    value={newSubject}
                    onChange={e => setNewSubject(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#991b1b]/20 text-slate-800 font-semibold"
                  >
                    <option value="Physics">Physics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Biology">Biology</option>
                    <option value="General Science">General Science</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Batch</label>
                  <select
                    value={newBatchId}
                    onChange={e => setNewBatchId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#991b1b]/20 text-slate-800 font-semibold"
                  >
                    {batches.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={e => setNewDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#991b1b]/20 text-slate-800 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Total Marks</label>
                  <input
                    type="number"
                    min="10"
                    max="500"
                    value={newTotalMarks}
                    onChange={e => setNewTotalMarks(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#991b1b]/20 text-slate-800 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Instructions / Description</label>
                <textarea
                  rows={3}
                  placeholder="Detail problem numbers, textbook references, and submission rules..."
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#991b1b]/20 text-slate-800 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#991b1b] hover:bg-[#7f1d1d] text-white shadow-xs transition-colors cursor-pointer"
                >
                  Assign to Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Grade Submission Modal ────────────────────────────────────── */}
      {gradingSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Grade Assignment</h3>
                <p className="text-xs text-slate-500">
                  {gradingSubmission.sub.studentName} ({gradingSubmission.sub.rollNumber})
                </p>
              </div>
              <button
                onClick={() => setGradingSubmission(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGrade} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Marks Obtained (out of {gradingSubmission.sub.totalMarks}) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  step="0.5"
                  min="0"
                  max={gradingSubmission.sub.totalMarks}
                  placeholder={`0 - ${gradingSubmission.sub.totalMarks}`}
                  value={gradeScore}
                  onChange={e => setGradeScore(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#991b1b]/20 text-slate-900 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Teacher Feedback / Remarks</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Good derivation steps, watch calculation on Q4..."
                  value={gradeRemarks}
                  onChange={e => setGradeRemarks(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#991b1b]/20 text-slate-800 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setGradingSubmission(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#991b1b] hover:bg-[#7f1d1d] text-white shadow-xs transition-colors cursor-pointer"
                >
                  Save Grade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
