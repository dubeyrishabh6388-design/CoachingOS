'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/lib/context/AppContext';

import { db } from '@/lib/db/store';
import { Lead } from '@/lib/types';
import { 
  Users, 
  Plus, 
  Search, 
  Calendar, 
  CheckCircle2, 
  ArrowRight, 
  X, 
  Phone, 
  Mail, 
  UserCheck, 
  CreditCard,
  Sparkles,
  ChevronRight,
  MessageSquare,
  ExternalLink,
  Share2,
  Copy,
  Key,
  ShieldCheck,
  GraduationCap
} from 'lucide-react';
import { useRouter } from 'next/navigation';

import { CardSkeleton, KanbanSkeleton } from '@/components/ui/Skeleton';
import { buildDemoInviteWhatsAppUrl } from '@/lib/utils/whatsapp';
import { maskPhoneNumber } from '@/lib/utils/privacy';

export default function LeadsCrmPage() {
  const router = useRouter();
  const { currentOrg, currentBranch, currentUser, addUser, login, showToast } = useApp();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAdmissionModalOpen, setIsAdmissionModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [admissionSuccessData, setAdmissionSuccessData] = useState<{
    student: any;
    studentUser: any;
    parentUser: any;
    batchName: string;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<'PIPELINE' | 'TABLE'>('PIPELINE');
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [studentName, setStudentName] = useState('');
  const [phone, setPhone] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [course, setCourse] = useState('');
  const [source, setSource] = useState<Lead['source']>('WALK_IN');
  const [notes, setNotes] = useState('');

  // Admission Conversion Form
  const [admissionBatch, setAdmissionBatch] = useState('');
  const [admissionFee, setAdmissionFee] = useState(0);
  const [admissionDiscount, setAdmissionDiscount] = useState(0);
  const [admissionPaid, setAdmissionPaid] = useState(0);
  const [admissionPaymentMethod, setAdmissionPaymentMethod] = useState<'UPI' | 'CASH'>('UPI');

  const fetchLeads = async () => {
    try {
      const res = await fetch(`/api/v1/leads?organizationId=${currentOrg.id}`);
      const json = await res.json();
      if (json.data) setLeads(json.data);
    } catch (err) {
      console.error('Failed to fetch leads', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
    const orgBatches = db.getBatches(currentOrg.id);
    setBatches(orgBatches);
    if (orgBatches.length > 0) {
      setAdmissionBatch(orgBatches[0].id);
      setAdmissionFee((orgBatches[0] as any).feePaise ? Math.round((orgBatches[0] as any).feePaise / 100) : 0);
    } else {
      setAdmissionBatch('');
      setAdmissionFee(0);
    }
  }, [currentOrg.id]);

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName || !phone) return;

    try {
      const res = await fetch('/api/v1/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: currentOrg.id,
          branchId: currentBranch.id,
          studentName,
          phone,
          guardianName,
          targetCourse: course,
          source,
          notes,
        }),
      });
      const json = await res.json();
      if (json.data) {
        showToast(`Enquiry added for ${studentName}!`);
        setIsAddModalOpen(false);
        setStudentName('');
        setPhone('');
        setGuardianName('');
        setNotes('');
        fetchLeads();
      }
    } catch (err) {
      showToast('Error saving enquiry');
    }
  };

  const handleConvertToAdmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;

    let resultData: any = null;

    try {
      const res = await fetch('/api/v1/admissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: selectedLead.id,
          organizationId: currentOrg.id,
          branchId: currentBranch.id,
          batchId: admissionBatch,
          totalAmountPaise: admissionFee * 100,
          discountAmountPaise: admissionDiscount * 100,
          paidAmountPaise: admissionPaid * 100,
          paymentMethod: admissionPaymentMethod,
          admittedBy: currentUser.fullName || 'Admin',
        }),
      });

      const json = await res.json();
      if (json.data) {
        resultData = json.data;
      }
    } catch (err) {
      console.warn('Backend admission call error, falling back to local store:', err);
    }

    if (!resultData) {
      try {
        resultData = db.convertLeadToAdmission({
          leadId: selectedLead.id,
          organizationId: currentOrg.id,
          branchId: currentBranch.id,
          batchId: admissionBatch,
          totalAmountPaise: admissionFee * 100,
          discountAmountPaise: admissionDiscount * 100,
          paidAmountPaise: admissionPaid * 100,
          paymentMethod: admissionPaymentMethod,
          admittedBy: currentUser.fullName || 'Admin',
        });
      } catch (err: any) {
        showToast(err?.message || 'Error converting admission', 'error');
        return;
      }
    }

    if (resultData) {
      // Sync generated student and parent users into context
      if (resultData.studentUser && addUser) {
        addUser(resultData.studentUser);
      }
      if (resultData.parentUser && addUser) {
        addUser(resultData.parentUser);
      }

      const assignedBatch = batches.find(b => b.id === admissionBatch)?.name || 'Assigned Batch';

      setAdmissionSuccessData({
        student: resultData.student,
        studentUser: resultData.studentUser || {
          phone: selectedLead.phone,
          password: 'Student@123',
          fullName: selectedLead.studentName,
          role: 'STUDENT',
        },
        parentUser: resultData.parentUser || {
          phone: selectedLead.guardianPhone || selectedLead.phone,
          password: 'Parent@123',
          fullName: selectedLead.guardianName ? `${selectedLead.guardianName} (Parent)` : `${selectedLead.studentName}'s Parent`,
          role: 'PARENT',
        },
        batchName: assignedBatch,
      });

      showToast(`Student ${selectedLead.studentName} enrolled! Accounts created for Student & Parent.`, 'success');
      setIsAdmissionModalOpen(false);
      setSelectedLead(null);
      fetchLeads();
    }
  };

  const handleMoveStage = async (leadId: string, stage: Lead['stage']) => {
    try {
      const res = await fetch('/api/v1/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: leadId, stage }),
      });
      const json = await res.json();
      if (json.data) {
        showToast(`Lead moved to ${stage.replace('_', ' ')}`);
        fetchLeads();
      }
    } catch (err) {
      showToast('Error updating stage');
    }
  };

  const filteredLeads = leads.filter(l => 
    l.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.phone.includes(searchQuery) ||
    (l.targetCourse && l.targetCourse.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const stages = [
    { key: 'NEW_ENQUIRY', title: 'New Enquiry', color: 'bg-blue-50 text-blue-700 border-blue-200/60' },
    { key: 'CONTACTED', title: 'Counselling Call', color: 'bg-amber-50 text-amber-700 border-amber-200/60' },
    { key: 'DEMO_SCHEDULED', title: 'Demo Scheduled', color: 'bg-purple-50 text-purple-700 border-purple-200/60' },
    { key: 'CONVERTED', title: 'Admitted', color: 'bg-emerald-50 text-emerald-700 border-emerald-200/60' },
  ] as const;

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Leads & Admissions
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Track student inquiries, schedule demo classes, and convert to admissions.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-medium">
            <button
              onClick={() => setActiveTab('PIPELINE')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'PIPELINE' ? 'bg-white text-[#991b1b] font-bold shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pipeline
            </button>
            <button
              onClick={() => setActiveTab('TABLE')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'TABLE' ? 'bg-white text-[#991b1b] font-bold shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Table View
            </button>
          </div>

          <Link
            href="/enquiry"
            target="_blank"
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold rounded-lg shadow-sm transition-all"
            title="Open the public-facing admission and free demo booking page for parents"
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Public Enquiry Page</span>
            <span className="sm:hidden">Public</span>
          </Link>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#991b1b] hover:bg-[#7f1d1d] text-white text-xs font-bold rounded-lg shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Enquiry</span>
          </button>

        </div>
      </div>

      {loading ? (
        <div className="space-y-6">
          <CardSkeleton count={4} />
          <KanbanSkeleton columns={4} />
        </div>
      ) : (
        <>
          {/* KPI Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <span className="text-xs font-medium text-slate-500 block">Total Inquiries</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{leads.length}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">All active prospects</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <span className="text-xs font-medium text-slate-500 block">Counselling Due</span>
          <div className="text-2xl font-bold text-amber-600 mt-1">
            {leads.filter(l => l.stage === 'CONTACTED' || l.stage === 'NEW').length}
          </div>
          <div className="text-[11px] text-amber-700 font-medium mt-0.5">Calls to complete today</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <span className="text-xs font-medium text-slate-500 block">Demos Scheduled</span>
          <div className="text-2xl font-bold text-purple-700 mt-1">
            {leads.filter(l => l.stage === 'DEMO_SCHEDULED').length}
          </div>
          <div className="text-[11px] text-purple-700 font-medium mt-0.5">Orientation this weekend</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <span className="text-xs font-medium text-slate-500 block">Admissions Converted</span>
          <div className="text-2xl font-bold text-emerald-700 mt-1">
            {leads.filter(l => l.stage === 'CONVERTED').length}
          </div>
          <div className="text-[11px] text-emerald-700 font-medium mt-0.5">Enrolled into batches</div>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Filter enquiries by student name, phone number, or target course..."
          className="w-full bg-transparent text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
        />
      </div>

      {/* Pipeline View */}
      {activeTab === 'PIPELINE' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {stages.map(col => {
            const stageLeads = filteredLeads.filter(l => l.stage === col.key);
            return (
              <div key={col.key} className="bg-slate-50/80 border border-slate-200 rounded-xl p-3.5 space-y-3">
                <div className="flex justify-between items-center px-1">
                  <span className="text-xs font-semibold text-slate-800">{col.title}</span>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${col.color}`}>
                    {stageLeads.length}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {stageLeads.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 text-xs bg-white rounded-lg border border-dashed border-slate-200">
                      No enquiries here
                    </div>
                  ) : (
                    stageLeads.map(lead => (
                      <div key={lead.id} className="bg-white border border-slate-200/80 rounded-lg p-3.5 shadow-sm space-y-2.5 hover:border-slate-300 transition-colors">
                        <div>
                          <div className="font-semibold text-xs text-slate-900">{lead.studentName}</div>
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{lead.phone}</span>
                          </div>
                        </div>

                        <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
                          {lead.targetCourse || 'Course Inquiry'}
                        </div>

                        {lead.notes && (
                          <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                            {lead.notes}
                          </p>
                        )}

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                          {col.key !== 'CONVERTED' ? (
                            <button
                              onClick={() => {
                                setSelectedLead(lead);
                                setIsAdmissionModalOpen(true);
                              }}
                              className="text-xs font-bold text-[#991b1b] hover:text-[#7f1d1d]"
                            >
                              Admit Student &rarr;
                            </button>
                          ) : (
                            <span className="text-emerald-700 text-[11px] font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Enrolled
                            </span>
                          )}

                          {col.key === 'NEW_ENQUIRY' && (
                            <button
                              onClick={() => handleMoveStage(lead.id, 'CONTACTED')}
                              className="text-[11px] text-slate-500 hover:text-slate-800"
                            >
                              Call Due
                            </button>
                          )}
                          {col.key === 'CONTACTED' && (
                            <button
                              onClick={() => handleMoveStage(lead.id, 'DEMO_SCHEDULED')}
                              className="text-[11px] text-slate-500 hover:text-slate-800"
                            >
                              Book Demo
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table View */}
      {activeTab === 'TABLE' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[11px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Phone / Contact</th>
                  <th className="py-3 px-4">Target Course</th>
                  <th className="py-3 px-4">Stage</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500">
                      <div className="w-12 h-12 rounded-2xl bg-red-50 text-[#991b1b] flex items-center justify-center mx-auto mb-3">
                        <Users className="w-6 h-6" />
                      </div>
                      <div className="font-bold text-slate-800 text-sm">No enquiries recorded yet</div>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                        {searchQuery ? 'No leads match your search criteria.' : `Capture student walk-ins and admission enquiries for ${currentOrg.tradeName}.`}
                      </p>
                      {!searchQuery && (
                        <div className="mt-4 flex items-center justify-center">
                          <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#991b1b] hover:bg-[#7f1d1d] text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add First Enquiry</span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map(lead => (
                    <tr key={lead.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900">{lead.studentName}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {maskPhoneNumber(lead.phone, currentUser.role)}
                      </td>
                      <td className="py-3 px-4 text-slate-700">{lead.targetCourse || 'General'}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                          {lead.stage.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {lead.stage !== 'CONVERTED' && (
                            <a
                              href={buildDemoInviteWhatsAppUrl({
                                parentPhone: lead.phone,
                                studentName: lead.studentName,
                                targetCourse: lead.targetCourse || 'General Course',
                                demoDate: 'This Saturday',
                                demoTime: '4:00 PM',
                                instituteName: currentOrg.tradeName,
                                campusAddress: currentBranch?.name || 'Main Institute Campus',
                              })}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded text-xs transition-colors inline-flex items-center gap-1 cursor-pointer"
                              title="Send WhatsApp Demo Invitation"
                            >
                              <MessageSquare className="w-3 h-3" />
                              <span>Demo Invite</span>
                            </a>
                          )}
                          {lead.stage !== 'CONVERTED' ? (
                            <button
                              onClick={() => {
                                setSelectedLead(lead);
                                setIsAdmissionModalOpen(true);
                              }}
                              className="px-2.5 py-1 bg-[#991b1b] hover:bg-[#7f1d1d] text-white font-medium rounded text-xs transition-colors"
                            >
                              Admit
                            </button>
                          ) : (
                            <span className="text-emerald-700 font-medium text-xs">Enrolled</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      </>
      )}

      {/* Add Enquiry Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-semibold text-slate-900 text-base">New Student Enquiry</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Student Full Name *</label>
                <input
                  type="text"
                  required
                  value={studentName}
                  onChange={e => setStudentName(e.target.value)}
                  placeholder="e.g. Aryan Malhotra"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Student Phone *</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+91 98765 00000"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Parent Name</label>
                  <input
                    type="text"
                    value={guardianName}
                    onChange={e => setGuardianName(e.target.value)}
                    placeholder="Parent / Guardian"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Target Course</label>
                <input
                  type="text"
                  value={course}
                  onChange={e => setCourse(e.target.value)}
                  placeholder="e.g. IIT-JEE 2028 Super 40"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Counsellor Notes</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Remarks on demo date or fee discussions..."
                  rows={2.5}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#991b1b] hover:bg-[#7f1d1d] text-white font-bold rounded-lg shadow-sm transition-colors"
                >
                  Save Enquiry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admission Conversion Modal */}
      {isAdmissionModalOpen && selectedLead && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-semibold text-slate-900 text-base">Complete Student Admission</h3>
                <p className="text-xs text-slate-500">{selectedLead.studentName} ({selectedLead.phone})</p>
              </div>
              <button onClick={() => setIsAdmissionModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConvertToAdmission} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Assigned Batch *</label>
                <select
                  value={admissionBatch}
                  onChange={e => {
                    const bId = e.target.value;
                    setAdmissionBatch(bId);
                    const selected = batches.find(b => b.id === bId) as any;
                    if (selected && selected.feePaise) {
                      setAdmissionFee(Math.round(selected.feePaise / 100));
                    }
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900"
                >
                  {batches.length === 0 ? (
                    <option value="">No batches created yet in {currentOrg.tradeName}</option>
                  ) : (
                    batches.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.course || 'Course'})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Total Course Fee (₹)</label>
                  <input
                    type="number"
                    value={admissionFee}
                    onChange={e => setAdmissionFee(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Scholarship Waiver (₹)</label>
                  <input
                    type="number"
                    value={admissionDiscount}
                    onChange={e => setAdmissionDiscount(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Initial Instalment Paid (₹)</label>
                  <input
                    type="number"
                    value={admissionPaid}
                    onChange={e => setAdmissionPaid(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Payment Method</label>
                  <select
                    value={admissionPaymentMethod}
                    onChange={e => setAdmissionPaymentMethod(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900"
                  >
                    <option value="UPI">UPI (Google Pay / PhonePe)</option>
                    <option value="CASH">Cash Counter</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Net Payable:</span>
                  <span className="font-semibold text-slate-900">₹{(admissionFee - admissionDiscount).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Remaining Balance:</span>
                  <span className="font-bold text-emerald-700">₹{(admissionFee - admissionDiscount - admissionPaid).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdmissionModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#991b1b] hover:bg-[#7f1d1d] text-white font-bold rounded-lg shadow-sm transition-colors"
                >
                  Confirm Admission
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admission Success & Portal Credentials Activation Modal */}
      {admissionSuccessData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div 
            className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#450a0a] via-[#7f1d1d] to-[#991b1b] p-6 text-white relative">
              <button
                onClick={() => setAdmissionSuccessData(null)}
                className="absolute top-5 right-5 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-emerald-300" />
                </div>
                <div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 uppercase tracking-wider">
                    Admission Confirmed &amp; Activated
                  </span>
                  <h2 className="text-xl font-black mt-1">
                    {admissionSuccessData.student.fullName}
                  </h2>
                  <p className="text-xs text-rose-200/80">
                    Roll No: {admissionSuccessData.student.rollNumber} &bull; Batch: {admissionSuccessData.batchName}
                  </p>
                </div>
              </div>
            </div>

            {/* Content: Generated Student & Parent Accounts */}
            <div className="p-6 space-y-5">
              <p className="text-xs text-slate-600">
                User accounts have been automatically created with their mobile numbers as login IDs. Share these credentials or switch to their dedicated portal view below:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Student Credentials Card */}
                <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4 text-blue-700" />
                      Student Portal Login
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                      STUDENT
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 block">User ID / Mobile:</span>
                      <span className="font-mono font-bold text-slate-900">{admissionSuccessData.studentUser.phone}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Initial Temporary Password:</span>
                      <span className="font-mono font-bold text-blue-700">{admissionSuccessData.studentUser.password}</span>
                    </div>
                  </div>

                  <div className="pt-1 flex items-center gap-2">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`CoachingOS Student Login:\nUser ID: ${admissionSuccessData.studentUser.phone}\nPassword: ${admissionSuccessData.studentUser.password}\nLink: ${window.location.origin}/login`);
                        showToast('Student credentials copied to clipboard!', 'success');
                      }}
                      className="flex-1 py-1.5 px-2.5 rounded-xl bg-white border border-blue-300 text-blue-800 hover:bg-blue-100/60 text-[11px] font-bold flex items-center justify-center gap-1 transition-colors"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </button>
                    <button
                      onClick={() => {
                        login(admissionSuccessData.studentUser);
                        setAdmissionSuccessData(null);
                        router.push('/');
                      }}
                      className="py-1.5 px-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-[11px] font-bold transition-colors"
                      title="Log into the dedicated Student Dashboard"
                    >
                      Login as Student &rarr;
                    </button>
                  </div>
                </div>

                {/* Parent Credentials Card */}
                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-emerald-700" />
                      Parent Portal Login
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      PARENT
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 block">User ID / Mobile:</span>
                      <span className="font-mono font-bold text-slate-900">{admissionSuccessData.parentUser.phone}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Initial Temporary Password:</span>
                      <span className="font-mono font-bold text-emerald-700">{admissionSuccessData.parentUser.password}</span>
                    </div>
                  </div>

                  <div className="pt-1 flex items-center gap-2">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`CoachingOS Parent Login:\nUser ID: ${admissionSuccessData.parentUser.phone}\nPassword: ${admissionSuccessData.parentUser.password}\nLink: ${window.location.origin}/login`);
                        showToast('Parent credentials copied to clipboard!', 'success');
                      }}
                      className="flex-1 py-1.5 px-2.5 rounded-xl bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100/60 text-[11px] font-bold flex items-center justify-center gap-1 transition-colors"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </button>
                    <button
                      onClick={() => {
                        login(admissionSuccessData.parentUser);
                        setAdmissionSuccessData(null);
                        router.push('/');
                      }}
                      className="py-1.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold transition-colors"
                      title="Log into the dedicated Parent Dashboard"
                    >
                      Login as Parent &rarr;
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
                <a
                  href={`https://wa.me/${admissionSuccessData.parentUser.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Dear Parent, Admission confirmed for ${admissionSuccessData.student.fullName} in ${admissionSuccessData.batchName} at ${currentOrg.tradeName}.\n\nAccess your dedicated Parent Portal:\nMobile: ${admissionSuccessData.parentUser.phone}\nPassword: ${admissionSuccessData.parentUser.password}\nLogin: ${typeof window !== 'undefined' ? window.location.origin : ''}/login\n\nStudent Portal Login:\nMobile: ${admissionSuccessData.studentUser.phone}\nPassword: ${admissionSuccessData.studentUser.password}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Send Credentials via WhatsApp</span>
                </a>

                <button
                  type="button"
                  onClick={() => setAdmissionSuccessData(null)}
                  className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-colors"
                >
                  Done &amp; Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
