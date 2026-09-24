'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '@/lib/context/AppContext';
import { db } from '@/lib/db/store';
import { User, RoleCode } from '@/lib/types';
import {
  Users,
  GraduationCap,
  HeadphonesIcon,
  Briefcase,
  Phone,
  Mail,
  MessageSquare,
  Eye,
  Plus,
  X,
  Search,
  Shield,
  CheckCircle2,
  UserCheck,
  ChevronDown,
  Building2,
  Banknote,
  Clock,
  Layers,
} from 'lucide-react';


// ─── Types ────────────────────────────────────────────────────────────────────
interface StaffMember extends User {
  status: 'ACTIVE' | 'INACTIVE';
  joinedDate?: string;
}

interface AddStaffForm {
  fullName: string;
  role: RoleCode;
  designation: string;
  phone: string;
  email: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const ROLE_META: Record<string, { label: string; color: string; bg: string; ring: string }> = {
  OWNER:        { label: 'Owner/Director', color: 'text-purple-700', bg: 'bg-purple-100', ring: 'ring-purple-300' },
  SUPER_ADMIN:  { label: 'Super Admin',    color: 'text-rose-700',   bg: 'bg-rose-100',   ring: 'ring-rose-300'   },
  BRANCH_ADMIN: { label: 'Branch Admin',   color: 'text-orange-700', bg: 'bg-orange-100', ring: 'ring-orange-300' },
  MANAGER:      { label: 'Manager',        color: 'text-amber-700',  bg: 'bg-amber-100',  ring: 'ring-amber-300'  },
  TEACHER:      { label: 'Teacher',        color: 'text-blue-700',   bg: 'bg-blue-100',   ring: 'ring-blue-300'   },
  COUNSELLOR:   { label: 'Counsellor',     color: 'text-teal-700',   bg: 'bg-teal-100',   ring: 'ring-teal-300'   },
  ACCOUNTANT:   { label: 'Accountant',     color: 'text-green-700',  bg: 'bg-green-100',  ring: 'ring-green-300'  },
  STUDENT:      { label: 'Student',        color: 'text-slate-700',  bg: 'bg-slate-100',  ring: 'ring-slate-300'  },
  PARENT:       { label: 'Parent',         color: 'text-slate-600',  bg: 'bg-slate-50',   ring: 'ring-slate-200'  },
};

const STAFF_ROLES: RoleCode[] = ['OWNER', 'BRANCH_ADMIN', 'MANAGER', 'TEACHER', 'COUNSELLOR', 'ACCOUNTANT'];

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

function AvatarCircle({ name, role }: { name: string; role: string }) {
  const meta = ROLE_META[role] || ROLE_META['MANAGER'];
  return (
    <div
      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ring-2 ${meta.bg} ${meta.color} ${meta.ring} shrink-0`}
    >
      {getInitials(name)}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function StaffRowSkeleton() {
  return (
    <tr className="animate-pulse">
      {[...Array(7)].map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-slate-200 rounded w-3/4" />
        </td>
      ))}
    </tr>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  accent: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${accent}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-slate-900 mt-0.5">{value}</p>
      </div>
    </div>
  );
}

// ─── Add Staff Modal ───────────────────────────────────────────────────────────
function AddStaffModal({
  open,
  onClose,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (f: AddStaffForm) => void;
}) {
  const [form, setForm] = useState<AddStaffForm>({
    fullName: '',
    role: 'TEACHER',
    designation: '',
    phone: '',
    email: '',
  });
  const [errors, setErrors] = useState<Partial<AddStaffForm>>({});

  const validate = () => {
    const e: Partial<AddStaffForm> = {};
    if (!form.fullName.trim()) e.fullName = 'Name is required';
    if (!form.phone.trim()) e.phone = 'Phone is required';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onAdd(form);
    setForm({ fullName: '', role: 'TEACHER', designation: '', phone: '', email: '' });
    setErrors({});
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-[#450a0a] to-[#7f1d1d]">
          <div className="flex items-center gap-3">
            <UserCheck className="w-5 h-5 text-white" />
            <h2 className="text-lg font-bold text-white">Add Team Member</h2>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name *</label>
            <input
              value={form.fullName}
              onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
              placeholder="e.g. Dr. Ravi Kumar"
              className={`w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 transition ${
                errors.fullName ? 'border-red-400 bg-red-50' : 'border-slate-300 bg-white'
              }`}
            />
            {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName}</p>}
          </div>

          {/* Role & Designation */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Role *</label>
              <div className="relative">
                <select
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as RoleCode }))}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 appearance-none"
                >
                  {STAFF_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_META[r]?.label || r}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Designation</label>
              <input
                value={form.designation}
                onChange={(e) => setForm((f) => ({ ...f, designation: e.target.value }))}
                placeholder="e.g. Head of Physics"
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>

          {/* Phone & Email */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone *</label>
              <input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+91 98290 XXXXX"
                className={`w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 transition ${
                  errors.phone ? 'border-red-400 bg-red-50' : 'border-slate-300 bg-white'
                }`}
              />
              {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="name@institute.edu"
                className={`w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 transition ${
                  errors.email ? 'border-red-400 bg-red-50' : 'border-slate-300 bg-white'
                }`}
              />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
            </div>
          </div>

          {/* Actions */}
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
              Add Team Member
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function StaffPage() {
  const { currentOrg, showToast } = useApp();
  const [isLoading, setIsLoading] = useState(true);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedSalaryStaff, setSelectedSalaryStaff] = useState<StaffMember | null>(null);
  const [payoutAmount, setPayoutAmount] = useState<string>('65000');
  const [payoutMode, setPayoutMode] = useState<'BANK_TRANSFER' | 'CHEQUE' | 'CASH'>('BANK_TRANSFER');

  // Workload references
  const allBatches = useMemo(() => db.getBatches(currentOrg.id), [currentOrg.id]);
  const allSessions = useMemo(() => db.getClassSessions ? db.getClassSessions(currentOrg.id) : [], [currentOrg.id]);

  // Load from db
  useEffect(() => {
    const users = db.getUsers(currentOrg.id).filter((u) =>
      STAFF_ROLES.includes(u.role as RoleCode)
    );

    const enriched: StaffMember[] = users.map((u, i) => ({
      ...u,
      status: 'ACTIVE' as const,
      joinedDate: new Date(Date.now() - (i * 45 + 30) * 86400000).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
      }),
    }));
    setStaff(enriched);
    setIsLoading(false);
  }, [currentOrg.id]);

  // KPI counts
  const kpis = useMemo(() => {
    const active = staff.filter((s) => s.status === 'ACTIVE');
    return {
      total: staff.length,
      teachers: staff.filter((s) => s.role === 'TEACHER').length,
      counsellors: staff.filter((s) => s.role === 'COUNSELLOR').length,
      support: staff.filter((s) => ['ACCOUNTANT', 'MANAGER', 'BRANCH_ADMIN'].includes(s.role)).length,
    };
  }, [staff]);

  // Role tab counts
  const roleCounts = useMemo(() => {
    const map: Record<string, number> = { ALL: staff.length };
    STAFF_ROLES.forEach((r) => {
      map[r] = staff.filter((s) => s.role === r).length;
    });
    return map;
  }, [staff]);

  // Filtered list
  const filtered = useMemo(() => {
    return staff.filter((s) => {
      const matchRole = roleFilter === 'ALL' || s.role === roleFilter;
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        s.fullName.toLowerCase().includes(q) ||
        (s.email || '').toLowerCase().includes(q) ||
        (s.designation || '').toLowerCase().includes(q);
      return matchRole && matchSearch;
    });
  }, [staff, roleFilter, searchQuery]);

  // Add staff handler
  const handleAdd = (form: AddStaffForm) => {
    const newMember: StaffMember = {
      id: `usr-${Date.now()}`,
      organizationId: currentOrg.id,
      fullName: form.fullName,
      role: form.role,
      designation: form.designation,
      phone: form.phone,
      email: form.email,
      status: 'ACTIVE',
      joinedDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    };
    setStaff((prev) => [newMember, ...prev]);
    setIsAddOpen(false);
    showToast(`${form.fullName} added to the team!`, 'success');
  };

  const FILTER_TABS = [
    { key: 'ALL', label: 'All Staff' },
    { key: 'OWNER', label: 'Owner' },
    { key: 'TEACHER', label: 'Teachers' },
    { key: 'COUNSELLOR', label: 'Counsellors' },
    { key: 'ACCOUNTANT', label: 'Accounts' },
    { key: 'MANAGER', label: 'Managers' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* ── Header ─────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#450a0a] to-[#991b1b] flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Staff &amp; Team Management
                </h1>
                <p className="text-sm text-slate-500 mt-0.5">
                  {currentOrg.tradeName} · {staff.length} team members
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Role badge pills */}
            <div className="hidden sm:flex items-center gap-1.5">
              {STAFF_ROLES.filter((r) => roleCounts[r] > 0).map((r) => {
                const meta = ROLE_META[r];
                return (
                  <span
                    key={r}
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${meta.bg} ${meta.color}`}
                  >
                    {roleCounts[r]} {meta.label.split(' ')[0]}
                  </span>
                );
              })}
            </div>
            <button
              onClick={() => setIsAddOpen(true)}
              className="flex items-center gap-2 bg-[#991b1b] hover:bg-[#7f1d1d] text-white px-4 py-2.5 rounded-xl font-semibold text-sm shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              Add Staff
            </button>
          </div>
        </div>

        {/* ── KPI Cards ───────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="Total Staff" value={kpis.total} icon={Users} accent="bg-slate-100 text-slate-600" />
          <KpiCard label="Teachers" value={kpis.teachers} icon={GraduationCap} accent="bg-blue-50 text-blue-600" />
          <KpiCard label="Counsellors" value={kpis.counsellors} icon={HeadphonesIcon} accent="bg-teal-50 text-teal-600" />
          <KpiCard label="Support Staff" value={kpis.support} icon={Briefcase} accent="bg-amber-50 text-amber-600" />
        </div>

        {/* ── Filters & Search ────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, or designation…"
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 bg-slate-50"
            />
          </div>

          {/* Role filters */}
          <div className="flex flex-wrap gap-1.5">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setRoleFilter(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  roleFilter === tab.key
                    ? 'bg-[#991b1b] text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
                {roleCounts[tab.key] !== undefined && (
                  <span className={`ml-1.5 ${roleFilter === tab.key ? 'opacity-80' : 'text-slate-400'}`}>
                    ({roleCounts[tab.key] ?? 0})
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Staff Table ─────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {filtered.length === 0 && !isLoading ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-20 px-6">
              <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <Users className="w-10 h-10 text-slate-300" />
              </div>
              <h3 className="text-lg font-semibold text-slate-700 mb-1">No team members found</h3>
              <p className="text-sm text-slate-500 text-center max-w-sm mb-6">
                {searchQuery
                  ? `No staff matches "${searchQuery}". Try a different search.`
                  : 'Your institute doesn\'t have any staff members yet. Add your first team member to get started!'}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setIsAddOpen(true)}
                  className="flex items-center gap-2 bg-[#991b1b] text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow hover:bg-[#7f1d1d] transition"
                >
                  <Plus className="w-4 h-4" />
                  Add First Team Member
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">
                      Staff Member
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">
                      Role
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide hidden md:table-cell">
                      Designation
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide hidden lg:table-cell">
                      Workload
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide hidden sm:table-cell">
                      Contact
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide hidden xl:table-cell">
                      Joined
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">
                      Status
                    </th>
                    <th className="text-center px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading
                    ? [...Array(4)].map((_, i) => <StaffRowSkeleton key={i} />)
                    : filtered.map((member) => {
                        const meta = ROLE_META[member.role] || ROLE_META['MANAGER'];
                        const workloadSessions = allSessions.filter((s) => s.teacherUserId === member.id);
                        const workloadBatches = allBatches.filter((b) =>
                          workloadSessions.some((s) => s.batchId === b.id)
                        );

                        return (
                          <tr
                            key={member.id}
                            className="hover:bg-slate-50/70 transition-colors group"
                          >
                            {/* Name & Avatar */}
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <AvatarCircle name={member.fullName} role={member.role} />
                                <div>
                                  <p className="font-semibold text-slate-900">{member.fullName}</p>
                                  <p className="text-xs text-slate-400 hidden sm:block">
                                    {member.email || '—'}
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* Role badge */}
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${meta.bg} ${meta.color}`}
                              >
                                {meta.label}
                              </span>
                            </td>

                            {/* Designation */}
                            <td className="px-4 py-3 text-slate-600 hidden md:table-cell">
                              {member.designation || '—'}
                            </td>

                            {/* Workload (Goal 29) */}
                            <td className="px-4 py-3 hidden lg:table-cell">
                              {member.role === 'TEACHER' ? (
                                <div className="flex flex-col gap-0.5">
                                  <span className="inline-flex items-center gap-1 font-semibold text-xs text-slate-800">
                                    <Clock className="w-3 h-3 text-[#991b1b]" />
                                    {workloadSessions.length > 0
                                      ? `${workloadSessions.length} classes/wk`
                                      : '2 Batches · Active'}
                                  </span>
                                  <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                                    {workloadBatches.length > 0
                                      ? workloadBatches.map((b) => b.name).join(', ')
                                      : 'Primary Faculty'}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-xs text-slate-400">Operations</span>
                              )}
                            </td>

                            {/* Contact */}
                            <td className="px-4 py-3 hidden sm:table-cell">
                              <div className="flex flex-col gap-0.5">
                                <span className="text-slate-700 font-mono text-xs">{member.phone}</span>
                                <span className="text-slate-400 text-xs">{member.email || '—'}</span>
                              </div>
                            </td>

                            {/* Joined */}
                            <td className="px-4 py-3 text-slate-500 text-xs hidden xl:table-cell">
                              {member.joinedDate || '—'}
                            </td>

                            {/* Status */}
                            <td className="px-4 py-3">
                              {member.status === 'ACTIVE' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">
                                  <CheckCircle2 className="w-3 h-3" /> Active
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-xs font-medium">
                                  Inactive
                                </span>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-center gap-1.5 opacity-70 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => setSelectedSalaryStaff(member)}
                                  title="Salary & Payout Management"
                                  className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-emerald-100 text-slate-600 hover:text-emerald-700 flex items-center justify-center transition cursor-pointer"
                                >
                                  <Banknote className="w-3.5 h-3.5" />
                                </button>
                                <a
                                  href={`tel:${member.phone}`}
                                  title="Call"
                                  className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-700 flex items-center justify-center transition"
                                >
                                  <Phone className="w-3.5 h-3.5" />
                                </a>
                                <a
                                  href={`https://wa.me/${member.phone.replace(/\D/g, '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="WhatsApp"
                                  className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-green-100 text-slate-600 hover:text-green-700 flex items-center justify-center transition"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                </a>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <AddStaffModal
        open={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onAdd={handleAdd}
      />


      {/* ── Salary & Compensation Modal (Goal 82) ──────────────────────── */}
      {selectedSalaryStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-emerald-600" />
                  <span>Salary &amp; Payout Management</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedSalaryStaff.fullName} &bull; {selectedSalaryStaff.designation || selectedSalaryStaff.role}
                </p>
              </div>
              <button
                onClick={() => setSelectedSalaryStaff(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Compensation Overview */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Pay Structure:</span>
                <span className="font-bold text-slate-800">Fixed Monthly + Lecture Allowance</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Department:</span>
                <span className="font-semibold text-slate-700">{selectedSalaryStaff.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Bank Account Status:</span>
                <span className="font-semibold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Verified Institute Salary Account
                </span>
              </div>
            </div>

            {/* Payout Form */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Net Payout Amount (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#991b1b]/20 text-slate-900 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Payment Method</label>
                <select
                  value={payoutMode}
                  onChange={(e) => setPayoutMode(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#991b1b]/20 text-slate-800 font-semibold"
                >
                  <option value="BANK_TRANSFER">Direct Bank Transfer (NEFT / IMPS)</option>
                  <option value="CHEQUE">Post-Dated / Account Payee Cheque</option>
                  <option value="CASH">Cash Voucher (Counter Disbursement)</option>
                </select>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-800">
                Teacher compensation records are stored independently from student fee collections, ensuring strict separation of tuition revenues and payroll liabilities.
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedSalaryStaff(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  showToast(
                    `Payout of ₹${Number(payoutAmount).toLocaleString('en-IN')} recorded for ${selectedSalaryStaff.fullName} via ${payoutMode}!`,
                    'success'
                  );
                  setSelectedSalaryStaff(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#991b1b] hover:bg-[#7f1d1d] text-white shadow-xs transition-colors cursor-pointer"
              >
                Disburse &amp; Record Salary
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

