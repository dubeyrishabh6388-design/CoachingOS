'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useApp } from '@/lib/context/AppContext';
import { db } from '@/lib/db/store';
import { Batch } from '@/lib/types';
import { 
  Users, 
  Clock, 
  MapPin, 
  Plus, 
  Layers,
  CheckCircle2, 
  Calendar,
  X,
  ChevronRight,
  Flame,
  AlertCircle,
  UserPlus,
  MessageSquare,
  ExternalLink
} from 'lucide-react';
import SyllabusVelocityTracker from '@/components/academics/SyllabusVelocityTracker';


export default function BatchesPage() {
  const { currentOrg, currentBranch, showToast } = useApp();
  const [activeTab, setActiveTab] = useState<'BATCHES' | 'TIMETABLE' | 'SYLLABUS_VELOCITY'>('BATCHES');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Dynamic Batches State
  const [batches, setBatches] = useState<Batch[]>(() => db.getBatches(currentOrg.id));

  // New batch form state
  const [batchName, setBatchName] = useState('');
  const [batchCode, setBatchCode] = useState('');
  const [capacity, setCapacity] = useState(40);
  const [room, setRoom] = useState('Room 101');

  // Waiting List State
  const [activeWaitingListBatch, setActiveWaitingListBatch] = useState<Batch | null>(null);
  const [waitingLists, setWaitingLists] = useState<Record<string, Array<{ id: string; name: string; phone: string; addedDate: string }>>>({
    'bat-jee-2027-evening': [
      { id: 'w-1', name: 'Kavya Sen', phone: '+919811223344', addedDate: '2026-09-18' },
      { id: 'w-2', name: 'Aditya Roy', phone: '+919811223355', addedDate: '2026-09-20' },
    ],
  });
  const [newWaitName, setNewWaitName] = useState('');
  const [newWaitPhone, setNewWaitPhone] = useState('');

  useEffect(() => {
    setBatches(db.getBatches(currentOrg.id));
    fetch(`/api/v1/batches?organizationId=${currentOrg.id}`)
      .then(res => res.json())
      .then(json => {
        if (json?.data) setBatches(json.data);
      })
      .catch(() => {});
  }, [currentOrg.id]);


  // Dynamic class sessions for current institute
  const sessions = useMemo(() => {
    const raw = db.getClassSessions ? db.getClassSessions(currentOrg.id) : [];
    if (raw.length > 0) {
      return raw.map(s => ({
        time: `${s.scheduledStart ? s.scheduledStart.slice(11, 16) : '16:00'} – ${s.scheduledEnd ? s.scheduledEnd.slice(11, 16) : '17:30'}`,
        subject: s.topicName || 'Academic Lecture',
        batch: s.topicName || 'Batch Class',
        faculty: 'Assigned Faculty',
        room: s.classroomName || 'Main Hall',
      }));
    }
    // If institute has batches, construct representative timetable based on its real batches
    if (batches.length > 0) {
      return batches.map((b, idx) => ({
        time: idx % 2 === 0 ? '16:00 – 17:30' : '17:45 – 19:15',
        subject: idx % 2 === 0 ? 'Physics / Science' : 'Mathematics',
        batch: b.name,
        faculty: 'Faculty Lead',
        room: `Hall ${idx + 1}`,
      }));
    }
    return [];
  }, [currentOrg.id, batches]);

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchName.trim()) return;

    const newBatchId = `batch-${Date.now().toString().slice(-6)}`;
    const code = batchCode.trim() || `${batchName.slice(0, 3).toUpperCase()}_${new Date().getFullYear().toString().slice(-2)}`;

    const newBatchObj: Batch = {
      id: newBatchId,
      organizationId: currentOrg.id,
      branchId: currentBranch.id,
      courseId: 'crs-jee-adv',
      name: batchName,
      code,
      academicYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
      startDate: new Date().toISOString().slice(0, 10),
      endDate: `${new Date().getFullYear() + 1}-04-30`,
      maxCapacity: Number(capacity) || 40,
      currentEnrollment: 0,
      status: 'ACTIVE',
    };

    try {
      await fetch('/api/v1/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBatchObj),
      });
    } catch (err) {
      console.warn('Backend batch offline, creating local batch:', err);
    }

    if (db.createBatch) {
      db.createBatch(newBatchObj);
    }

    setBatches(prev => [...prev, newBatchObj]);
    showToast(`Batch "${batchName}" created successfully!`, 'success');
    setIsCreateModalOpen(false);
    setBatchName('');
    setBatchCode('');
  };

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Batches &amp; Classes
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 text-[#991b1b] border border-red-200">
              {currentOrg.tradeName}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage student batches, seating capacities, and class schedules.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-medium">
            <button
              onClick={() => setActiveTab('BATCHES')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'BATCHES' ? 'bg-white text-[#991b1b] font-bold shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Active Batches ({batches.length})
            </button>
            <button
              onClick={() => setActiveTab('TIMETABLE')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'TIMETABLE' ? 'bg-white text-[#991b1b] font-bold shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Class Schedule ({sessions.length})
            </button>
            <button
              onClick={() => setActiveTab('SYLLABUS_VELOCITY')}
              className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
                activeTab === 'SYLLABUS_VELOCITY' ? 'bg-white text-[#991b1b] font-bold shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              <span>Syllabus Velocity Radar</span>
            </button>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#991b1b] hover:bg-[#7f1d1d] text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Batch</span>
          </button>
        </div>
      </div>

      {/* Batches Grid */}
      {activeTab === 'BATCHES' && (
        batches.length === 0 ? (
          <div className="p-16 bg-white rounded-2xl border border-dashed border-slate-200 text-center space-y-3">
            <Layers className="w-12 h-12 text-slate-300 mx-auto" />
            <div className="text-base font-bold text-slate-800">
              No batches created yet for {currentOrg.tradeName}
            </div>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Create your morning, evening, or weekend batches to start enrolling students, taking biometric attendance, and scheduling exams.
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#991b1b] hover:bg-[#7f1d1d] text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer mt-2"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create First Batch</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {batches.map(batch => {
              const maxCap = batch.maxCapacity || 40;
              const currentEnr = batch.currentEnrollment || 0;
              const pct = Math.min(100, Math.round((currentEnr / maxCap) * 100));
              const isFull = currentEnr >= maxCap;
              const seatsLeft = Math.max(0, maxCap - currentEnr);
              const waitList = waitingLists[batch.id] || [];

              return (
                <div 
                  key={batch.id} 
                  className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm leading-snug">{batch.name}</h3>
                      <span className="text-[11px] font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 inline-block mt-1">
                        {batch.code}
                      </span>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs font-medium bg-red-50 text-[#991b1b] border border-red-200/60 px-2 py-0.5 rounded">
                        {batch.status || 'Active'}
                      </span>
                      {isFull ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200">
                          Batch Full
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {seatsLeft} Seats Available
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Capacity Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Enrolled: <strong className="text-slate-900">{currentEnr}</strong> / {maxCap} seats</span>
                      <span className="font-semibold text-slate-700">{pct}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${pct >= 90 ? 'bg-amber-500' : 'bg-[#991b1b]'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Info details */}
                  <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{currentBranch.name} &bull; Room 101</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Mon, Wed, Fri &bull; 16:00 – 19:30</span>
                    </div>
                  </div>

                  {/* Actions & Waiting List */}
                  <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100">
                    <button
                      onClick={() => setActiveWaitingListBatch(batch)}
                      className="text-xs font-semibold text-amber-700 hover:text-amber-800 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Users className="w-3 h-3" />
                      <span>Waitlist ({waitList.length})</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <Link
                        href="/students"
                        className="text-xs font-semibold text-[#991b1b] hover:underline"
                      >
                        Roster
                      </Link>
                      <Link
                        href="/academics/attendance"
                        className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded border border-slate-200 text-xs font-medium transition-colors"
                      >
                        Attendance
                      </Link>
                    </div>
                  </div>
                </div>
              );

            })}
          </div>
        )
      )}

      {/* Timetable Schedule View */}
      {activeTab === 'TIMETABLE' && (
        sessions.length === 0 ? (
          <div className="p-16 bg-white rounded-2xl border border-dashed border-slate-200 text-center space-y-3">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
            <div className="text-base font-bold text-slate-800">
              No class schedules configured yet
            </div>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Once batches are configured, lecture timings and room allotments will appear here.
            </p>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold text-sm text-slate-900">Today's Class Schedule</h3>
                <p className="text-xs text-slate-500 mt-0.5">Assigned lecture halls and faculty rosters</p>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href="/academics/timetable"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-[#991b1b] border border-red-200 text-xs font-bold transition-colors"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Full Weekly Timetable &rarr;</span>
                </Link>
                <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                  {new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' })}
                </span>
              </div>
            </div>


            <div className="divide-y divide-slate-100 text-xs">
              {sessions.map((sess, idx) => (
                <div key={idx} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-12 py-1 bg-red-50 text-[#991b1b] font-bold text-center rounded border border-red-200 shrink-0">
                      {sess.time.split('–')[0].trim()}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 text-sm">{sess.subject}</div>
                      <div className="text-slate-500 text-[11px] mt-0.5">
                        {sess.batch} &bull; {sess.faculty}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <span className="px-2.5 py-1 rounded bg-slate-100 text-slate-600 font-medium text-[11px]">
                      {sess.room}
                    </span>
                    <Link
                      href="/academics/attendance"
                      className="px-3 py-1.5 bg-[#991b1b] hover:bg-[#7f1d1d] text-white rounded text-xs font-semibold transition-colors"
                    >
                      Roster &rarr;
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      )}

      {/* TAB 3: SYLLABUS VELOCITY RADAR */}
      {activeTab === 'SYLLABUS_VELOCITY' && (
        <SyllabusVelocityTracker instituteName={currentOrg.tradeName} />
      )}

      {/* Create Batch Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Create New Academic Batch</h3>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBatch} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Batch Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. JEE Main Morning Batch 2027"
                  value={batchName}
                  onChange={e => setBatchName(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[#991b1b]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Batch Code (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. JEE_MRN_27"
                  value={batchCode}
                  onChange={e => setBatchCode(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[#991b1b]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Max Capacity *
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={200}
                    value={capacity}
                    onChange={e => setCapacity(Number(e.target.value))}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[#991b1b]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Assigned Room
                  </label>
                  <input
                    type="text"
                    value={room}
                    onChange={e => setRoom(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[#991b1b]"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#991b1b] hover:bg-[#7f1d1d] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                >
                  Save &amp; Activate Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Waiting List Modal */}
      {activeWaitingListBatch && (

        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-600" />
                  <span>Waiting List: {activeWaitingListBatch.name}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Current: {activeWaitingListBatch.currentEnrollment} / {activeWaitingListBatch.maxCapacity} seats occupied
                </p>
              </div>
              <button 
                onClick={() => setActiveWaitingListBatch(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Existing waitlisted students */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Students on Waitlist ({(waitingLists[activeWaitingListBatch.id] || []).length})
              </h4>
              {(waitingLists[activeWaitingListBatch.id] || []).length === 0 ? (
                <div className="p-6 bg-slate-50 rounded-xl text-center text-xs text-slate-500 border border-slate-200">
                  No students currently waiting for a seat in this batch.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white max-h-48 overflow-y-auto">
                  {(waitingLists[activeWaitingListBatch.id] || []).map((wait, idx) => (
                    <div key={wait.id} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50">
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-[10px] font-extrabold">
                            {idx + 1}
                          </span>
                          <span>{wait.name}</span>
                        </div>
                        <span className="text-[11px] text-slate-500 ml-7">{wait.phone} &bull; Added {wait.addedDate}</span>
                      </div>
                      <button
                        onClick={() => {
                          showToast(`Seat notification sent to ${wait.name} via WhatsApp!`, 'success');
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-lg border border-emerald-200 transition-colors"
                      >
                        <MessageSquare className="w-3 h-3 text-emerald-600" />
                        <span>Notify Seat</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add student to waitlist form */}
            <div className="pt-3 border-t border-slate-100 space-y-3">
              <h4 className="text-xs font-bold text-slate-700">Add Prospective Student to Waitlist</h4>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Student Full Name"
                  value={newWaitName}
                  onChange={e => setNewWaitName(e.target.value)}
                  className="p-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[#991b1b]"
                />
                <input
                  type="tel"
                  placeholder="Parent / Student Mobile"
                  value={newWaitPhone}
                  onChange={e => setNewWaitPhone(e.target.value)}
                  className="p-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[#991b1b]"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!newWaitName.trim() || !newWaitPhone.trim()) {
                    showToast('Please enter name and phone number', 'error');
                    return;
                  }
                  const batchId = activeWaitingListBatch.id;
                  const newEntry = {
                    id: `w-${Date.now()}`,
                    name: newWaitName.trim(),
                    phone: newWaitPhone.trim(),
                    addedDate: new Date().toISOString().slice(0, 10),
                  };
                  setWaitingLists(prev => ({
                    ...prev,
                    [batchId]: [...(prev[batchId] || []), newEntry],
                  }));
                  setNewWaitName('');
                  setNewWaitPhone('');
                  showToast(`${newEntry.name} added to waitlist! Position: ${(waitingLists[batchId] || []).length + 1}`, 'success');
                }}
                className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                + Add to Batch Waitlist
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

