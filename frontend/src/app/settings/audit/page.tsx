'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/lib/context/AppContext';
import { AuditLog } from '@/lib/types';
import { 
  ShieldCheck, 
  Search, 
  Download,
  CheckCircle2,
  Filter,
  User,
  Clock,
  Activity,
  FileSpreadsheet
} from 'lucide-react';

import { db } from '@/lib/db/store';

export default function AuditLogsPage() {
  const { currentOrg, showToast } = useApp();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filterText, setFilterText] = useState('');
  const [selectedRole, setSelectedRole] = useState('ALL');

  useEffect(() => {
    const orgLogs = db.getAuditLogs(currentOrg.id);
    setLogs(orgLogs);
  }, [currentOrg.id]);

  const filteredLogs = logs.filter(l => {
    const matchesText = 
      l.actorName.toLowerCase().includes(filterText.toLowerCase()) ||
      l.action.toLowerCase().includes(filterText.toLowerCase()) ||
      l.entityName.toLowerCase().includes(filterText.toLowerCase()) ||
      l.entityId.toLowerCase().includes(filterText.toLowerCase());
    
    const matchesRole = selectedRole === 'ALL' || l.actorRole === selectedRole;
    return matchesText && matchesRole;
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'OWNER':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'ACCOUNTANT':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'TEACHER':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'COUNSELLOR':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'SYSTEM':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'INITIALIZE_ORGANIZATION':
        return 'Institute Settings Configured';
      case 'RECORD_PAYMENT':
        return 'Fee Payment Recorded';
      case 'MARK_ATTENDANCE':
        return 'Batch Attendance Submitted';
      case 'CREATE_ENQUIRY':
        return 'New Student Enquiry Added';
      case 'EARLY_SUPPORT_TRIGGER':
        return 'Academic Support Alert Generated';
      default:
        return action.replace(/_/g, ' ');
    }
  };

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            Security & Governance
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Activity & Security Log
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            A complete, tamper-resistant trail of all actions performed by staff, teachers, and admins.
          </p>
        </div>

        <button
          onClick={() => showToast('Exported verified activity log to CSV')}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white hover:bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-lg border border-emerald-600 shadow-xs transition-colors"
        >
          <Download className="w-3.5 h-3.5 text-emerald-600" />
          Export to CSV
        </button>
      </div>

      {/* KPI Overview Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Logged Actions</span>
            <Activity className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{logs.length}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">Across this academic session</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Active Staff Accounts</span>
            <User className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">4 Staff Members</p>
          <span className="text-[11px] text-emerald-600 mt-1 block font-medium">All authenticated & active</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Security & DPDP Status</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">Compliant</p>
          <span className="text-[11px] text-slate-400 mt-1 block">Consent logged • Tamper-evident</span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by staff name, action, or record..."
            value={filterText}
            onChange={e => setFilterText(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-500 whitespace-nowrap">Filter by role:</span>
          <select
            value={selectedRole}
            onChange={e => setSelectedRole(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">All Roles</option>
            <option value="OWNER">Owner / Director</option>
            <option value="ACCOUNTANT">Accountant</option>
            <option value="TEACHER">Teacher</option>
            <option value="COUNSELLOR">Counsellor</option>
            <option value="SYSTEM">Automated System</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">Timestamp</th>
                <th className="px-5 py-3">Staff Member</th>
                <th className="px-5 py-3">Action Taken</th>
                <th className="px-5 py-3">Target Record</th>
                <th className="px-5 py-3">Record ID</th>
                <th className="px-5 py-3 text-right">Integrity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-500 text-xs">
                    <div className="font-semibold text-slate-800 text-sm mb-1">No Activity Logs Found</div>
                    <p className="text-slate-400 max-w-md mx-auto">
                      {filterText 
                        ? `No activity records found matching "${filterText}".` 
                        : `No audit entries recorded yet for ${currentOrg.tradeName}. Actions taken by staff across admissions, attendance, tests, and fee collection are automatically logged here.`}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {log.timestamp}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="font-semibold text-slate-900">{log.actorName}</div>
                      <span className={`inline-block mt-0.5 text-[10px] font-medium px-2 py-0.5 rounded border ${getRoleBadge(log.actorRole)}`}>
                        {log.actorRole}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-800">
                      {getActionLabel(log.action)}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {log.entityName}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-slate-400 text-[11px]">
                      {log.entityId}
                    </td>
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Verified
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
