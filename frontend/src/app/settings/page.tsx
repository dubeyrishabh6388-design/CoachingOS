'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/lib/context/AppContext';
import {
  Settings,
  Building2,
  MapPin,
  Mail,
  ShieldCheck,
  UploadCloud,
  Save,
  CheckCircle2,
  Clock,
  Sparkles,
  CreditCard,
  MessageSquare
} from 'lucide-react';
import WhatsAppGatewayController from '@/components/settings/WhatsAppGatewayController';

export default function SettingsPage() {
  const { currentOrg, currentBranch, showToast } = useApp();
  const [instituteName, setInstituteName] = useState(currentOrg.tradeName);
  const [legalName, setLegalName] = useState(currentOrg.legalName);
  const [gstin, setGstin] = useState(currentOrg.gstin || '');
  const [phone, setPhone] = useState(currentBranch.phone || '');
  const [email, setEmail] = useState((currentOrg as any).primaryContactEmail || '');

  React.useEffect(() => {
    setInstituteName(currentOrg.tradeName);
    setLegalName(currentOrg.legalName);
    setGstin(currentOrg.gstin || '');
    setPhone(currentBranch.phone || '');
    setEmail((currentOrg as any).primaryContactEmail || '');
  }, [currentOrg, currentBranch]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Institute settings saved successfully!', 'success');
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
          <Settings className="w-7 h-7 text-[#991b1b]" />
          Institute Settings
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your coaching institute identity, default branches, fee receipt configurations, and parent notification rules.
        </p>
      </div>

      {/* Quick navigation cards for sub-tools */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/finance?tab=PAYMENT_SETUP"
          className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-red-200 hover:shadow-md transition-all shadow-xs flex items-center justify-between group"
        >
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-red-50 text-[#991b1b] rounded-xl group-hover:scale-105 transition-transform">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-slate-900">Payment Setup</h2>
              <p className="text-xs text-slate-500 mt-0.5">UPI, Online Gateway, Bank details &amp; Cash.</p>
            </div>
          </div>
          <span className="text-xs font-semibold text-[#991b1b]">Open →</span>
        </Link>

        <Link
          href="#whatsapp-hub"
          className="bg-white p-5 rounded-2xl border border-emerald-200 hover:border-emerald-300 hover:shadow-md transition-all shadow-xs flex items-center justify-between group ring-1 ring-emerald-500/20"
        >
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-105 transition-transform">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="font-bold text-sm text-slate-900">Free WhatsApp Hub</h2>
                <span className="px-1.5 py-0.2 text-[9px] font-bold bg-emerald-100 text-emerald-800 rounded">₹0 FREE</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">No subscription, test delivery &amp; QR link.</p>
            </div>
          </div>
          <span className="text-xs font-semibold text-emerald-700">Open ↓</span>
        </Link>

        <Link
          href="/settings/import"
          className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-red-200 hover:shadow-md transition-all shadow-xs flex items-center justify-between group"
        >
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-red-50 text-[#991b1b] rounded-xl group-hover:scale-105 transition-transform">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-slate-900">Import Student Data</h2>
              <p className="text-xs text-slate-500 mt-0.5">Bulk upload students &amp; fees from CSV / Excel.</p>
            </div>
          </div>
          <span className="text-xs font-semibold text-[#991b1b]">Open →</span>
        </Link>

        <Link
          href="/settings/audit"
          className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-red-200 hover:shadow-md transition-all shadow-xs flex items-center justify-between group"
        >
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-red-50 text-[#991b1b] rounded-xl group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-slate-900">Activity &amp; Security Log</h2>
              <p className="text-xs text-slate-500 mt-0.5">Immutable audit trail of staff actions &amp; logins.</p>
            </div>
          </div>
          <span className="text-xs font-semibold text-[#991b1b]">Open →</span>
        </Link>
      </div>

      {/* Institute Profile Form */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#991b1b]" />
            <h2 className="font-bold text-base text-slate-900">Institute Profile &amp; Legal Identity</h2>
          </div>
          <span className="text-xs font-semibold text-[#991b1b] bg-red-50 px-2.5 py-1 rounded-md">
            Tier: {currentOrg.tier}
          </span>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">
                Brand / Display Name (Trade Name)
              </label>
              <input
                type="text"
                required
                value={instituteName}
                onChange={(e) => setInstituteName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#991b1b]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">
                Registered Legal Entity Name
              </label>
              <input
                type="text"
                required
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#991b1b]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">
                GSTIN (For Tax Invoices)
              </label>
              <input
                type="text"
                value={gstin}
                onChange={(e) => setGstin(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#991b1b]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">
                Official Enquiry Phone
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#991b1b]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">
                Official Admin Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#991b1b]"
              />
            </div>
          </div>

          {/* Branch Details */}
          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-3 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-slate-400" />
              Active Campus / Branch: {currentBranch.name}
            </h3>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1 text-slate-600">
              <p><span className="font-semibold text-slate-800">Address:</span> {currentBranch.address}, {currentBranch.city}, {currentBranch.state} - {currentBranch.pincode}</p>
              <p><span className="font-semibold text-slate-800">Branch Phone:</span> {currentBranch.phone}</p>
              <p><span className="font-semibold text-slate-800">Status:</span> <span className="text-[#991b1b] font-semibold">{currentBranch.status}</span></p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#991b1b] hover:bg-[#7f1d1d] text-white rounded-xl text-sm font-semibold shadow-sm transition-colors"
            >
              <Save className="w-4 h-4" />
              Save Configuration
            </button>
          </div>
        </form>
      </div>

      {/* Free WhatsApp Gateway & Delivery Controller */}
      <div id="whatsapp-hub" className="pt-2">
        <WhatsAppGatewayController
          instituteName={currentOrg.tradeName}
          institutePhone={currentBranch.phone || '9876543210'}
        />
      </div>
    </div>
  );
}
