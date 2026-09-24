'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useApp } from '@/lib/context/AppContext';
import { db } from '@/lib/db/store';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  UserCheck, 
  ArrowRight,
  Sparkles,
  Plus,
  ArrowUpRight,
  BookOpen,
  X
} from 'lucide-react';

export default function InterventionsPage() {
  const { currentOrg, showToast } = useApp();
  const [interventions, setInterventions] = useState<any[]>([]);
  const [selectedCase, setSelectedCase] = useState<any | null>(null);
  const [outcomeNotes, setOutcomeNotes] = useState('');
  const [filterTab, setFilterTab] = useState<'ALL' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED'>('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New intervention form state
  const [newStudentId, setNewStudentId] = useState('');
  const [newPlaybook, setNewPlaybook] = useState('1-on-1 Concept Remedial + Parent Call');
  const [newTriggerType, setNewTriggerType] = useState('ATTENDANCE_BREACH');
  const [newSeverity, setNewSeverity] = useState<'CRITICAL' | 'HIGH' | 'MEDIUM'>('HIGH');
  const [newDescription, setNewDescription] = useState('');

  const orgStudents = useMemo(() => db.getStudents(currentOrg.id), [currentOrg.id]);

  const fetchInterventions = async () => {
    try {
      const res = await fetch(`/api/v1/interventions?organizationId=${currentOrg.id}`);
      const json = await res.json();
      if (json.data) setInterventions(json.data);
    } catch (err) {
      console.error('Failed to load interventions', err);
    }
  };

  useEffect(() => {
    fetchInterventions();
    if (orgStudents.length > 0 && !newStudentId) {
      setNewStudentId(orgStudents[0].id);
    }
  }, [currentOrg.id, orgStudents]);

  const handleUpdateStatus = async (status: string) => {
    if (!selectedCase) return;

    try {
      const res = await fetch('/api/v1/interventions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedCase.id,
          status,
          outcomeNotes,
        }),
      });
      const json = await res.json();
      if (json.data) {
        showToast(`Status updated to ${status.replace('_', ' ')}`);
        setSelectedCase(null);
        setOutcomeNotes('');
        fetchInterventions();
      }
    } catch (err) {
      showToast('Error updating status');
    }
  };

  const handleCreateCase = (e: React.FormEvent) => {
    e.preventDefault();
    const student = orgStudents.find(s => s.id === newStudentId);
    if (!student) return;

    db.createIntervention({
      organizationId: currentOrg.id,
      branchId: student.primaryBranchId || 'branch-01',
      studentId: student.id,
      batchId: student.batchId,
      triggerType: newTriggerType as any,
      severity: newSeverity,
      description: newDescription || `Observation noted for ${student.fullName}. Assigned plan: ${newPlaybook}.`,
      status: 'OPEN',
      playbookAssigned: newPlaybook,
      ownerId: 'usr-002',
    });

    showToast(`Support plan created for ${student.fullName}`);
    setShowCreateModal(false);
    setNewDescription('');
    fetchInterventions();
  };

  const filteredCases = useMemo(() => {
    return interventions.filter(item => {
      if (filterTab === 'ALL') return true;
      if (filterTab === 'OPEN') return item.status === 'OPEN';
      if (filterTab === 'IN_PROGRESS') return item.status === 'IN_PROGRESS';
      if (filterTab === 'RESOLVED') return item.status === 'RESOLVED_RECOVERED' || item.status === 'RESOLVED';
      return true;
    });
  }, [interventions, filterTab]);

  const activeCount = interventions.filter(i => i.status !== 'RESOLVED_RECOVERED' && i.status !== 'RESOLVED').length;

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Students Needing Help
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Identify students struggling with attendance or tests early, assign support plans, and track progress.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span><strong>{activeCount}</strong> active cases</span>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#991b1b] hover:bg-[#7f1d1d] text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Support Plan</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-slate-200 text-xs font-medium space-x-2">
        {(['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setFilterTab(tab)}
            className={`pb-3 px-2 transition-colors border-b-2 font-semibold ${
              filterTab === tab 
                ? 'border-[#991b1b] text-[#991b1b]' 
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            {tab === 'ALL' && `All Cases (${interventions.length})`}
            {tab === 'OPEN' && `Action Required (${interventions.filter(i => i.status === 'OPEN').length})`}
            {tab === 'IN_PROGRESS' && `In Progress (${interventions.filter(i => i.status === 'IN_PROGRESS').length})`}
            {tab === 'RESOLVED' && `Resolved (${interventions.filter(i => i.status === 'RESOLVED_RECOVERED' || i.status === 'RESOLVED').length})`}
          </button>
        ))}
      </div>

      {/* Cases Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredCases.length === 0 ? (
          <div className="col-span-2 py-16 text-center bg-white border border-slate-200 rounded-2xl shadow-xs p-8">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              {interventions.length === 0 ? `Zero At-Risk Students in ${currentOrg.tradeName}` : 'No Cases in this Status'}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {interventions.length === 0
                ? 'All enrolled students are maintaining good attendance and benchmark test progress. You can manually log remedial notes or student support plans anytime.'
                : 'No support cases currently match your selected status filter.'}
            </p>
            {interventions.length === 0 && (
              <div className="mt-4 flex items-center justify-center">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#991b1b] hover:bg-[#7f1d1d] text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Log Student Support Note</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          filteredCases.map(item => (
            <div
              key={item.id}
              className={`bg-white border rounded-xl p-5 shadow-sm space-y-3.5 transition-all ${
                item.status === 'OPEN'
                  ? 'border-rose-200 hover:border-rose-300'
                  : item.status === 'IN_PROGRESS'
                  ? 'border-amber-200 hover:border-amber-300'
                  : 'border-slate-200'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase">{item.id}</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Link
                      href={`/students/${item.studentId}`}
                      className="text-sm font-bold text-slate-900 hover:text-[#991b1b] transition-colors flex items-center gap-1"
                    >
                      <span>{item.studentName || 'Enrolled Student'}</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
                    </Link>
                    <span className="text-[10px] font-medium bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                      {item.batchName || 'Academic Batch'}
                    </span>
                  </div>
                </div>

                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                  item.status === 'OPEN' ? 'bg-rose-50 text-rose-700 border-rose-200/60' :
                  item.status === 'IN_PROGRESS' ? 'bg-amber-50 text-amber-700 border-amber-200/60' :
                  'bg-emerald-50 text-emerald-700 border-emerald-200/60'
                }`}>
                  {item.status.replace('_', ' ')}
                </span>
              </div>

              {/* Observation Detail */}
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-xs space-y-1">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Observed Risk
                </span>
                <p className="text-slate-700 leading-relaxed">
                  {item.evidenceSummary || item.description}
                </p>
              </div>

              <div className="text-xs text-slate-600 space-y-1">
                <div><span className="text-slate-400">Assigned Plan:</span> <strong className="text-slate-800">{item.playbook || item.playbookAssigned}</strong></div>
                <div><span className="text-slate-400">Resolution Due:</span> <span className="font-mono text-slate-700">{item.dueDate || '2026-09-30'}</span></div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex flex-wrap justify-between items-center gap-2">
                <Link
                  href="/academics/tests"
                  className="text-xs text-[#991b1b] hover:underline flex items-center gap-1 font-medium"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>View Test Benchmarks</span>
                </Link>

                <button
                  onClick={() => setSelectedCase(item)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-medium transition-colors"
                >
                  Update Status &rarr;
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Update Status Modal */}
      {selectedCase && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-semibold text-slate-900 text-base">Update Support Plan</h3>
                <p className="text-xs text-slate-500">Student: {selectedCase.studentName} ({selectedCase.batchName})</p>
              </div>
              <button onClick={() => setSelectedCase(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/70 text-xs">
              <span className="text-slate-500 block font-semibold text-[10px] uppercase">Active Plan</span>
              <p className="text-slate-800 font-medium mt-0.5">{selectedCase.playbook || selectedCase.playbookAssigned}</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Faculty Notes & Student Progress:
              </label>
              <textarea
                rows={3}
                placeholder="Discussed friction formulas in 1-on-1 session. Student completed drill sheet with 82% accuracy..."
                value={outcomeNotes}
                onChange={e => setOutcomeNotes(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-emerald-500"
              />
            </div>

            <div className="pt-2 flex justify-between items-center">
              <button
                onClick={() => setSelectedCase(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg"
              >
                Cancel
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => handleUpdateStatus('IN_PROGRESS')}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium rounded-lg"
                >
                  Mark In Progress
                </button>
                <button
                  onClick={() => handleUpdateStatus('RESOLVED')}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm"
                >
                  Mark Resolved &check;
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Support Plan Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-semibold text-slate-900 text-base">
                Add Support Plan for Student
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCase} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Select Student *</label>
                <select
                  value={newStudentId}
                  onChange={e => setNewStudentId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900"
                >
                  {orgStudents.length === 0 ? (
                    <option value="">No students enrolled yet in {currentOrg.tradeName}</option>
                  ) : (
                    orgStudents.map(student => (
                      <option key={student.id} value={student.id}>
                        {student.fullName} ({student.studentUniqueId}) - Class {student.grade}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Reason</label>
                  <select
                    value={newTriggerType}
                    onChange={e => setNewTriggerType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900"
                  >
                    <option value="ATTENDANCE_BREACH">Attendance Drop (&lt;75%)</option>
                    <option value="TEST_SCORE_DROP">Test Score Drop</option>
                    <option value="HOMEWORK_INCOMPLETE">Homework Incomplete</option>
                    <option value="BEHAVIORAL_CONCERN">Engagement / Focus Concern</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Severity</label>
                  <select
                    value={newSeverity}
                    onChange={e => setNewSeverity(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900"
                  >
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Support Action Plan</label>
                <select
                  value={newPlaybook}
                  onChange={e => setNewPlaybook(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900"
                >
                  <option value="1-on-1 Concept Remedial + Parent Call">1-on-1 Concept Remedial + Parent Call</option>
                  <option value="Daily Attendance Tracking + SMS Wake-Up">Daily Attendance Tracking + SMS Wake-Up</option>
                  <option value="Targeted Topic Practice Drill Sheet">Targeted Topic Practice Drill Sheet</option>
                  <option value="Peer Mentorship Study Group">Peer Mentorship Study Group</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Teacher Notes</label>
                <textarea
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  placeholder="Explain why this student needs assistance..."
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#991b1b] hover:bg-[#7f1d1d] text-white font-semibold rounded-lg shadow-sm"
                >
                  Save Support Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
