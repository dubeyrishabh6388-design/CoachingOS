'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useApp } from '@/lib/context/AppContext';
import { Invoice, Payment, PaymentAccount, PaymentReceipt, ReconciliationSummary } from '@/lib/types';
import PaymentCheckoutModal from '@/components/payments/PaymentCheckoutModal';
import ReceiptViewerModal from '@/components/payments/ReceiptViewerModal';
import RefundModal from '@/components/payments/RefundModal';
import BankTransferVerificationModal from '@/components/payments/BankTransferVerificationModal';
import { CardSkeleton, TableSkeleton } from '@/components/ui/Skeleton';
import PdcChequeVaultModal from '@/components/finance/PdcChequeVaultModal';
import { buildFeeReminderWhatsAppUrl } from '@/lib/utils/whatsapp';
import { 
  CreditCard, 
  QrCode, 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Receipt, 
  ArrowUpRight, 
  X,
  FileText,
  Printer,
  Download,
  Filter,
  ShieldCheck,
  Building2,
  Banknote,
  Send,
  RotateCcw,
  Sliders,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Lock,
  ChevronRight,
  Calendar
} from 'lucide-react';

type FinanceTab = 
  | 'OVERVIEW' 
  | 'STUDENT_FEES' 
  | 'PAYMENTS' 
  | 'PENDING_DUES' 
  | 'RECEIPTS' 
  | 'RECONCILIATION' 
  | 'PAYMENT_SETUP';

function FinanceContent() {
  const { currentOrg, currentBranch, currentUser, showToast } = useApp();
  const searchParams = useSearchParams();

  // Tab State
  const initialTab = (searchParams.get('tab')?.toUpperCase() as FinanceTab) || 'OVERVIEW';
  const [activeTab, setActiveTab] = useState<FinanceTab>(initialTab);

  // Data States
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [receipts, setReceipts] = useState<PaymentReceipt[]>([]);
  const [reconciliation, setReconciliation] = useState<ReconciliationSummary | null>(null);
  const [paymentAccount, setPaymentAccount] = useState<PaymentAccount | null>(null);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OVERDUE' | 'PARTIALLY_PAID' | 'PAID'>('ALL');
  const [methodFilter, setMethodFilter] = useState<string>('ALL');

  // Modal States
  const [checkoutInvoice, setCheckoutInvoice] = useState<Invoice | null>(null);
  const [activeReceipt, setActiveReceipt] = useState<PaymentReceipt | null>(null);
  const [refundPayment, setRefundPayment] = useState<Payment | null>(null);
  const [reviewPayment, setReviewPayment] = useState<Payment | null>(null);
  const [isPdcVaultOpen, setIsPdcVaultOpen] = useState(false);

  // Setup Form State
  const [setupForm, setSetupForm] = useState<Partial<PaymentAccount>>({});
  const [savingSetup, setSavingSetup] = useState(false);

  // Load all finance data for active organization
  const loadFinanceData = async () => {
    setLoading(true);
    try {
      const [invRes, payRes, recRes, reconRes, setRes] = await Promise.all([
        fetch(`/api/v1/invoices?organizationId=${currentOrg.id}`),
        fetch(`/api/v1/payments?organizationId=${currentOrg.id}`),
        fetch(`/api/v1/payments/receipts?organizationId=${currentOrg.id}`),
        fetch(`/api/v1/payments/reconciliation?organizationId=${currentOrg.id}`),
        fetch(`/api/v1/payments/settings?organizationId=${currentOrg.id}`),
      ]);

      const [invJson, payJson, recJson, reconJson, setJson] = await Promise.all([
        invRes.json(),
        payRes.json(),
        recRes.json(),
        reconRes.json(),
        setRes.json(),
      ]);

      if (invJson.data) setInvoices(invJson.data);
      if (payJson.data) setPayments(payJson.data);
      if (recJson.data) setReceipts(recJson.data);
      if (reconJson.data) setReconciliation(reconJson.data);
      if (setJson.data) {
        setPaymentAccount(setJson.data);
        setSetupForm(setJson.data);
      }
    } catch (err) {
      console.error('Error loading finance data', err);
      showToast('Error refreshing finance data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFinanceData();
  }, [currentOrg.id]);

  // Handle Save Payment Setup
  const handleSaveSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSetup(true);
    try {
      const res = await fetch('/api/v1/payments/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...setupForm,
          organizationId: currentOrg.id,
        }),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error?.message || 'Failed to save settings');
      setPaymentAccount(json.data);
      showToast('Institute payment configuration saved successfully!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Error saving payment settings', 'error');
    } finally {
      setSavingSetup(false);
    }
  };

  // Dispatch Automated Fee Reminder
  const handleSendReminder = async (invoice: Invoice) => {
    try {
      const invAny = invoice as any;
      const waUrl = buildFeeReminderWhatsAppUrl({
        parentPhone: invAny.guardianPhone || invAny.parentPhone || invAny.phone || '9876543210',
        parentName: invAny.guardianName || invAny.parentName || `Parent of ${invoice.studentName || 'Student'}`,
        studentName: invoice.studentName || 'Enrolled Student',
        batchName: invoice.batchName || 'Academic Batch',
        dueAmountRupees: Math.round((invoice.balanceAmountPaise || 0) / 100),
        dueDate: invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-IN') : 'Immediate',
        instituteName: currentOrg.tradeName,
        institutePhone: currentBranch?.phone || '9876543210',
      });
      window.open(waUrl, '_blank');
      showToast(`Opening WhatsApp fee reminder for ${invoice.studentName || 'Student'}...`, 'success');

      // Also notify backend
      fetch('/api/v1/payments/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: currentOrg.id,
          invoiceId: invoice.id,
          studentId: invoice.studentId,
          channel: 'WHATSAPP',
          reminderType: invoice.status === 'OVERDUE' ? 'OVERDUE' : 'UPCOMING',
        }),
      }).catch(() => {});
    } catch (err) {
      showToast('Error opening fee reminder', 'error');
    }
  };

  // Metric Computations
  const totalBilledRupees = useMemo(() => invoices.reduce((sum, i) => sum + (i.netAmountPaise || 0), 0) / 100, [invoices]);
  const totalCollectedRupees = useMemo(() => invoices.reduce((sum, i) => sum + (i.paidAmountPaise || 0), 0) / 100, [invoices]);
  const totalPendingRupees = useMemo(() => invoices.reduce((sum, i) => sum + (i.balanceAmountPaise || 0), 0) / 100, [invoices]);
  const overdueInvoices = useMemo(() => invoices.filter((i) => i.status === 'OVERDUE' || (i.balanceAmountPaise > 0 && new Date(i.dueDate) < new Date())), [invoices]);
  const overdueRupees = useMemo(() => overdueInvoices.reduce((sum, i) => sum + i.balanceAmountPaise, 0) / 100, [overdueInvoices]);

  // Filtered Invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchSearch =
        (inv.invoiceNumber?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (inv.studentName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (inv.studentRoll?.toLowerCase() || '').includes(searchQuery.toLowerCase());
      
      const matchStatus =
        statusFilter === 'ALL'
          ? true
          : statusFilter === 'OVERDUE'
          ? inv.status === 'OVERDUE' || (inv.balanceAmountPaise > 0 && new Date(inv.dueDate) < new Date())
          : inv.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [invoices, searchQuery, statusFilter]);

  // Filtered Payments
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const matchSearch =
        (p.receiptNumber?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (p.studentName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (p.id?.toLowerCase() || '').includes(searchQuery.toLowerCase());

      const matchMethod = methodFilter === 'ALL' || p.paymentMethod === methodFilter;

      return matchSearch && matchMethod;
    });
  }, [payments, searchQuery, methodFilter]);

  // Filtered Receipts
  const filteredReceipts = useMemo(() => {
    return receipts.filter((r) => {
      return (
        (r.receiptNumber?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (r.studentName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (r.studentRoll?.toLowerCase() || '').includes(searchQuery.toLowerCase())
      );
    });
  }, [receipts, searchQuery]);

  // If role is Teacher, show restriction message
  if (currentUser.role === 'TEACHER') {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-700 mb-4">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Fee Administration Restricted</h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-2">
            In accordance with platform governance, student tuition fee collections and payment gateway accounts are managed strictly by institute directors and finance officers. Teachers do not receive student fee payments.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <a
              href="/academics/batches"
              className="px-5 py-2.5 rounded-xl bg-[#991b1b] text-white text-xs font-bold hover:bg-[#7f1d1d] transition-colors"
            >
              Go to Classes &amp; Batches
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-slate-900">Fees &amp; Payments</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 text-[#991b1b] border border-red-200">
              {currentOrg.tradeName}
            </span>
            {paymentAccount?.testMode && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                SANDBOX TEST MODE
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Institute fee plans, automated installments, multi-channel payment collection, GST receipts &amp; reconciliation.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadFinanceData()}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors shadow-2xs"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              if (invoices.length > 0) {
                setCheckoutInvoice(invoices[0]);
              }
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#991b1b] hover:bg-[#7f1d1d] text-white text-xs font-bold transition-colors shadow-xs"
          >
            <CreditCard className="w-4 h-4" />
            <span>Collect Fee</span>
          </button>
          <button
            onClick={() => setIsPdcVaultOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Building2 className="w-4 h-4 text-amber-200" />
            <span>PDC Cheques &amp; Gullak</span>
          </button>
        </div>
      </div>

      {/* 7-Tab Navigation Bar */}
      <div className="border-b border-slate-200 overflow-x-auto">
        <nav className="flex space-x-1 min-w-max pb-px">
          {[
            { id: 'OVERVIEW', label: 'Overview', icon: TrendingUp },
            { id: 'STUDENT_FEES', label: 'Student Fees', count: invoices.length, icon: FileText },
            { id: 'PAYMENTS', label: 'Payments', count: payments.length, icon: CreditCard },
            { id: 'PENDING_DUES', label: 'Pending Dues', count: overdueInvoices.length, icon: Clock },
            { id: 'RECEIPTS', label: 'Receipts', count: receipts.length, icon: Receipt },
            { id: 'RECONCILIATION', label: 'Reconciliation', icon: Sliders },
            { id: 'PAYMENT_SETUP', label: 'Payment Setup', icon: Building2 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as FinanceTab)}
                className={`flex items-center gap-2 py-3 px-4 border-b-2 text-xs font-bold transition-colors ${
                  isActive
                    ? 'border-[#991b1b] text-[#991b1b]'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-red-100 text-red-900' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {loading ? (
        <div className="space-y-6 pt-2">
          <CardSkeleton count={4} />
          <TableSkeleton rows={6} />
        </div>
      ) : (
        <>
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'OVERVIEW' && (
        <div className="space-y-6">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <span className="text-xs font-semibold text-slate-400 block">Total Tuition Billed</span>
              <div className="text-2xl font-black text-slate-900 mt-1">
                ₹{totalBilledRupees.toLocaleString('en-IN')}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">Across {invoices.length} active invoices</span>
            </div>

            <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 shadow-2xs">
              <span className="text-xs font-semibold text-emerald-700 block">Collected Fees</span>
              <div className="text-2xl font-black text-emerald-950 mt-1">
                ₹{totalCollectedRupees.toLocaleString('en-IN')}
              </div>
              <span className="text-[11px] text-emerald-700 font-semibold mt-1 block">
                {totalBilledRupees > 0 ? Math.round((totalCollectedRupees / totalBilledRupees) * 100) : 0}% Collection Rate
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-amber-50/60 border border-amber-200/80 shadow-2xs">
              <span className="text-xs font-semibold text-amber-700 block">Outstanding Pending</span>
              <div className="text-2xl font-black text-amber-950 mt-1">
                ₹{totalPendingRupees.toLocaleString('en-IN')}
              </div>
              <span className="text-[11px] text-amber-700 mt-1 block">In upcoming installment milestones</span>
            </div>

            <div className="p-5 rounded-2xl bg-rose-50/60 border border-rose-200/80 shadow-2xs">
              <span className="text-xs font-semibold text-rose-700 block">Overdue Fees</span>
              <div className="text-2xl font-black text-rose-950 mt-1">
                ₹{overdueRupees.toLocaleString('en-IN')}
              </div>
              <span className="text-[11px] text-rose-700 font-semibold mt-1 block">
                {overdueInvoices.length} students past due date
              </span>
            </div>
          </div>

          {/* Payment Method Breakdown Cards */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Collection Channels (Institute Direct)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <QrCode className="w-4 h-4 text-[#991b1b]" />
                    <span>UPI &amp; QR Payments</span>
                  </div>
                  <div className="text-lg font-black text-slate-900 mt-1">
                    ₹{((reconciliation?.onlineCollectionsPaise ?? 0) / 100).toLocaleString('en-IN')}
                  </div>
                </div>
                <span className="text-xs font-semibold text-[#991b1b] bg-red-50 px-2 py-1 rounded-md border border-red-200">
                  {paymentAccount?.upiId || 'Not Configured'}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <Building2 className="w-4 h-4 text-[#991b1b]" />
                    <span>Bank Transfer (NEFT/IMPS)</span>
                  </div>
                  <div className="text-lg font-black text-slate-900 mt-1">
                    ₹{((reconciliation?.bankTransferCollectionsPaise ?? 0) / 100).toLocaleString('en-IN')}
                  </div>
                </div>
                <span className="text-xs font-semibold text-slate-600 bg-white px-2 py-1 rounded-md border border-slate-200">
                  {paymentAccount?.bankName || 'Not Linked'}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <Banknote className="w-4 h-4 text-amber-600" />
                    <span>Cash Counter POS</span>
                  </div>
                  <div className="text-lg font-black text-slate-900 mt-1">
                    ₹{((reconciliation?.cashCollectionsPaise ?? 0) / 100).toLocaleString('en-IN')}
                  </div>
                </div>
                <span className="text-xs font-semibold text-slate-600 bg-white px-2 py-1 rounded-md border border-slate-200">
                  Authorized Counter
                </span>
              </div>
            </div>
          </div>

          {/* Recent Verified Payments Table Preview */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Recent Payment Receipts</h3>
                <p className="text-xs text-slate-500">Latest transactions captured and credited</p>
              </div>
              {payments.length > 0 && (
                <button
                  onClick={() => setActiveTab('PAYMENTS')}
                  className="text-xs font-semibold text-[#991b1b] hover:underline flex items-center gap-1"
                >
                  <span>View All Payments</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {payments.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 rounded-2xl bg-red-50 text-[#991b1b] flex items-center justify-center mx-auto mb-3">
                  <Receipt className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">No payment receipts yet</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  Payments received via UPI QR, bank transfer, or cash counters will automatically appear here with official GST receipts.
                </p>
                <div className="mt-4 flex items-center justify-center gap-3">
                  <button
                    onClick={() => setActiveTab('PAYMENT_SETUP')}
                    className="px-3.5 py-1.5 rounded-xl bg-[#991b1b] text-white text-xs font-bold hover:bg-[#7f1d1d] transition-colors"
                  >
                    Setup Institute UPI QR
                  </button>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {payments.slice(0, 5).map((p) => (
                  <div key={p.id} className="px-6 py-3.5 flex items-center justify-between hover:bg-slate-50/60 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">{p.studentName}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2">
                          <span className="font-mono">Receipt #{p.receiptNumber}</span>
                          <span>•</span>
                          <span>{p.paymentMethod}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-black text-slate-900">
                        ₹{(p.amountPaise / 100).toLocaleString('en-IN')}
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        {p.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: STUDENT FEES (INVOICES & INSTALLMENTS) */}
      {activeTab === 'STUDENT_FEES' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search student, roll number, invoice..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#991b1b]"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {(['ALL', 'OVERDUE', 'PARTIALLY_PAID', 'PAID'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    statusFilter === st
                      ? 'bg-[#991b1b] text-white shadow-2xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  {st.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Invoices List */}
          {filteredInvoices.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-2xs">
              <div className="w-12 h-12 rounded-2xl bg-red-50 text-[#991b1b] flex items-center justify-center mx-auto mb-3">
                <Receipt className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">No fee invoices found</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                {searchQuery || statusFilter !== 'ALL'
                  ? 'No invoices match your search filters.'
                  : `No student fee schedules or tuition invoices generated yet for ${currentOrg.tradeName}. Enroll a student or create a batch fee structure.`}
              </p>
              {!searchQuery && statusFilter === 'ALL' && (
                <div className="mt-4 flex items-center justify-center gap-3">
                  <a
                    href="/admissions"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#991b1b] hover:bg-[#7f1d1d] text-white text-xs font-bold transition-colors shadow-xs"
                  >
                    <span>+ Enroll First Student</span>
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="divide-y divide-slate-100">
                {filteredInvoices.map((inv) => {
                  const paidPct = inv.netAmountPaise > 0 ? Math.min(100, Math.round((inv.paidAmountPaise / inv.netAmountPaise) * 100)) : 100;
                  return (
                    <div key={inv.id} className="p-5 hover:bg-slate-50/60 transition-colors">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        {/* Left: Student & Invoice Info */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-900">{inv.studentName}</span>
                            <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                              {inv.studentRoll}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                inv.status === 'PAID'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : inv.status === 'OVERDUE'
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {inv.status.replace('_', ' ')}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                            <span>Invoice: <strong className="font-mono text-slate-700">{inv.invoiceNumber}</strong></span>
                            <span>•</span>
                            <span>Batch: <strong>{inv.batchName}</strong></span>
                            <span>•</span>
                            <span>Due Date: <strong>{inv.dueDate}</strong></span>
                          </div>
                        </div>

                        {/* Middle: Installment Progress Bar */}
                        <div className="w-full lg:w-48 space-y-1.5">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-slate-400">Paid: {paidPct}%</span>
                            <span className="font-semibold text-slate-700">
                              ₹{(inv.paidAmountPaise / 100).toLocaleString('en-IN')} / ₹{(inv.netAmountPaise / 100).toLocaleString('en-IN')}
                            </span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className={`h-full transition-all ${
                                paidPct >= 100 ? 'bg-emerald-500' : paidPct > 50 ? 'bg-[#991b1b]' : 'bg-amber-500'
                              }`}
                              style={{ width: `${paidPct}%` }}
                            />
                          </div>
                        </div>

                        {/* Right: Balance & Actions */}
                        <div className="flex items-center justify-between lg:justify-end gap-3 shrink-0">
                          <div className="text-right">
                            <span className="text-[10px] uppercase font-semibold text-slate-400 block">Balance Due</span>
                            <span className="text-base font-black text-slate-900">
                              ₹{(inv.balanceAmountPaise / 100).toLocaleString('en-IN')}
                            </span>
                          </div>

                          {inv.balanceAmountPaise > 0 ? (
                            <button
                              onClick={() => setCheckoutInvoice(inv)}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#991b1b] hover:bg-[#7f1d1d] text-white text-xs font-bold transition-colors shadow-xs"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>Pay Fee</span>
                            </button>
                          ) : (
                            <span className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Settled</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PAYMENTS LEDGER */}
      {activeTab === 'PAYMENTS' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search receipt, student name, txn..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#991b1b]"
              />
            </div>
            <div className="flex items-center gap-2">
              {['ALL', 'UPI', 'ONLINE_GATEWAY', 'BANK_TRANSFER', 'CASH'].map((m) => (
                <button
                  key={m}
                  onClick={() => setMethodFilter(m)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    methodFilter === m
                      ? 'bg-[#991b1b] text-white shadow-2xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  {m.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Payments Table */}
          {filteredPayments.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-2xs">
              <div className="w-12 h-12 rounded-2xl bg-red-50 text-[#991b1b] flex items-center justify-center mx-auto mb-3">
                <CreditCard className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">No payment transactions recorded</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                {searchQuery || methodFilter !== 'ALL'
                  ? 'No payments match your filter criteria.'
                  : `No student fee transactions or payments have been processed yet for ${currentOrg.tradeName}. Recorded receipts and verified gateway settlements will appear here.`}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px]">
                  <tr>
                    <th className="px-5 py-3">Receipt &amp; Date</th>
                    <th className="px-5 py-3">Student</th>
                    <th className="px-5 py-3">Amount</th>
                    <th className="px-5 py-3">Method</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-mono font-bold text-slate-900">{p.receiptNumber}</div>
                        <div className="text-[11px] text-slate-400">
                          {new Date(p.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-slate-900">{p.studentName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">Roll: {p.studentRoll}</div>
                      </td>
                      <td className="px-5 py-3.5 font-bold text-slate-900 text-sm">
                        ₹{(p.amountPaise / 100).toLocaleString('en-IN')}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                          {p.paymentMethod}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            p.status === 'SUCCESS' || p.status === 'CAPTURED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : p.status === 'MANUAL_REVIEW'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                              : p.status === 'REFUNDED'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {p.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right space-x-1.5">
                        {p.status === 'MANUAL_REVIEW' && (
                          <button
                            onClick={() => setReviewPayment(p)}
                            className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold shadow-2xs"
                          >
                            Review UTR
                          </button>
                        )}
                        {(p.status === 'SUCCESS' || p.status === 'CAPTURED') && (
                          <>
                            <button
                              onClick={() => {
                                const r = receipts.find((rec) => rec.paymentId === p.id) || {
                                  id: p.receiptNumber,
                                  receiptNumber: p.receiptNumber,
                                  organizationId: p.organizationId,
                                  organizationName: currentOrg.tradeName,
                                  organizationGstin: currentOrg.gstin,
                                  organizationAddress: 'Main Institutional Campus',
                                  branchName: currentBranch.name,
                                  paymentId: p.id,
                                  invoiceId: p.invoiceId,
                                  invoiceNumber: p.invoiceNumber || 'INV-001',
                                  studentId: p.studentId,
                                  studentName: p.studentName || 'Student',
                                  studentRoll: p.studentRoll || 'ROLL-001',
                                  amountPaise: p.amountPaise,
                                  paymentMethod: p.paymentMethod,
                                  paymentDate: p.createdAt,
                                  transactionReference: p.providerPaymentId || p.id,
                                  status: p.status,
                                };
                                setActiveReceipt(r);
                              }}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                              title="View Receipt"
                            >
                              <Receipt className="w-4 h-4 text-[#991b1b]" />
                            </button>
                            <button
                              onClick={() => setRefundPayment(p)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Process Refund"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: PENDING DUES */}
      {activeTab === 'PENDING_DUES' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-700">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-rose-950">Overdue Tuition Accounts</h4>
                <p className="text-xs text-rose-700">
                  {overdueInvoices.length} students have crossed scheduled installment deadlines. Total arrears: ₹{overdueRupees.toLocaleString('en-IN')}.
                </p>
              </div>
            </div>
            {overdueInvoices.length > 0 && (
              <button
                onClick={() => {
                  overdueInvoices.forEach((i) => handleSendReminder(i));
                  showToast(`Sent WhatsApp reminders to ${overdueInvoices.length} overdue guardians!`, 'success');
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Reminders to All</span>
              </button>
            )}
          </div>

          {overdueInvoices.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-2xs">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">Zero Overdue Fees</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                All enrolled students are fully up to date on their fee installments, or no invoices are due at this time.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs divide-y divide-slate-100 overflow-hidden">
              {overdueInvoices.map((inv) => (
                <div key={inv.id} className="p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors">
                  <div>
                    <div className="font-bold text-xs text-slate-900">{inv.studentName}</div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      Invoice: {inv.invoiceNumber} • Roll: {inv.studentRoll}
                    </div>
                    <div className="text-[11px] text-rose-600 font-semibold mt-0.5">
                      Deadline passed: {inv.dueDate}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block uppercase">Overdue Amount</span>
                      <span className="text-sm font-bold text-rose-600">
                        ₹{(inv.balanceAmountPaise / 100).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <button
                      onClick={() => handleSendReminder(inv)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 transition-colors"
                    >
                      <Send className="w-3.5 h-3.5 text-emerald-600" />
                      <span>WhatsApp Reminder</span>
                    </button>
                    <button
                      onClick={() => setCheckoutInvoice(inv)}
                      className="px-3 py-1.5 rounded-xl bg-[#991b1b] text-white text-xs font-bold hover:bg-[#7f1d1d] transition-colors"
                    >
                      Pay
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: RECEIPTS DIRECTORY */}
      {activeTab === 'RECEIPTS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="relative w-80">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by receipt number, student name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#991b1b]"
              />
            </div>
            <span className="text-xs text-slate-500 font-semibold">
              {filteredReceipts.length} Official GST Receipts Registered
            </span>
          </div>

          {filteredReceipts.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-2xs">
              <div className="w-12 h-12 rounded-2xl bg-red-50 text-[#991b1b] flex items-center justify-center mx-auto mb-3">
                <Printer className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">No GST receipts generated</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                {searchQuery
                  ? 'No receipts match your search query.'
                  : `Official GST fee receipts with printable breakdown will be generated automatically as soon as tuition payments are recorded for ${currentOrg.tradeName}.`}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredReceipts.map((r) => (
                <div
                  key={r.id}
                  className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between hover:border-[#991b1b] transition-all group"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-100 font-mono">
                      <span>{r.receiptNumber}</span>
                      <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        {r.paymentMethod}
                      </span>
                    </div>
                    <div className="mt-3">
                      <h4 className="font-bold text-sm text-slate-900">{r.studentName}</h4>
                      <p className="text-xs text-slate-500 font-mono">Roll: {r.studentRoll}</p>
                      <p className="text-xs text-slate-400 mt-1">Invoice: #{r.invoiceNumber}</p>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Paid Amount</span>
                      <span className="text-base font-black text-slate-900">
                        ₹{(r.amountPaise / 100).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <button
                      onClick={() => setActiveReceipt(r)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 group-hover:bg-[#991b1b] group-hover:text-white text-slate-700 border border-slate-200 text-xs font-semibold transition-all"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>View &amp; Print</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 6: RECONCILIATION */}
      {activeTab === 'RECONCILIATION' && reconciliation && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Financial Audit &amp; Settlement Reconciliation</h3>
                <p className="text-xs text-slate-500">Live ledger integrity matching billed invoices against verified collections</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold text-slate-400 block">Settlement Health</span>
                <span className="text-xl font-black text-emerald-600">{reconciliation.reconciledPercentage}%</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 text-xs">Total Expected Gross</span>
                <div className="text-xl font-black text-slate-900 mt-1">
                  ₹{(reconciliation.expectedCollectionPaise / 100).toLocaleString('en-IN')}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                <span className="text-emerald-700 text-xs font-semibold">Actual Bank Settled</span>
                <div className="text-xl font-black text-emerald-950 mt-1">
                  ₹{(reconciliation.actualCollectedPaise / 100).toLocaleString('en-IN')}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                <span className="text-amber-700 text-xs font-semibold">Scheduled Pending</span>
                <div className="text-xl font-black text-amber-950 mt-1">
                  ₹{(reconciliation.pendingDuesPaise / 100).toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Discrepancy / Unallocated Ledger Delta: <strong>₹{(reconciliation.discrepancyPaise / 100).toLocaleString('en-IN')}</strong></span>
              <button
                onClick={() => showToast('Full audit settlement ledger exported to CSV', 'success')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Settlement Audit</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: PAYMENT SETUP (MULTI-TENANT INSTITUTE GATEWAY CONFIG) */}
      {activeTab === 'PAYMENT_SETUP' && (
        <form onSubmit={handleSaveSetup} className="space-y-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-6">
            <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Institute Payment Collection Setup</h3>
                <p className="text-xs text-slate-500">Configure your institute's exclusive payment accounts. Students pay directly into these accounts.</p>
              </div>
              <button
                type="submit"
                disabled={savingSetup}
                className="px-4 py-2 rounded-xl bg-[#991b1b] hover:bg-[#7f1d1d] text-white text-xs font-bold transition-colors shadow-xs"
              >
                {savingSetup ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* UPI Settings */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center text-[#991b1b]">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">UPI Payments &amp; Dynamic QR</h4>
                    <p className="text-xs text-slate-500">NPCI compliant UPI collection for GPay, PhonePe, Paytm, BHIM</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={setupForm.upiEnabled ?? true}
                    onChange={(e) => setSetupForm({ ...setupForm, upiEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#991b1b]"></div>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Institute UPI ID (VPA) *</label>
                  <input
                    type="text"
                    required
                    value={setupForm.upiId || ''}
                    onChange={(e) => setSetupForm({ ...setupForm, upiId: e.target.value })}
                    placeholder="e.g. aarohanjee@icici or apexprep@hdfcbank"
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#991b1b]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">UPI Merchant Display Name *</label>
                  <input
                    type="text"
                    required
                    value={setupForm.upiMerchantName || ''}
                    onChange={(e) => setSetupForm({ ...setupForm, upiMerchantName: e.target.value })}
                    placeholder="e.g. Aarohan JEE Academy"
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#991b1b]"
                  />
                </div>
              </div>
            </div>

            {/* Online Gateway Settings */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center text-[#991b1b]">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Online Payment Gateway</h4>
                    <p className="text-xs text-slate-500">Credit/Debit Cards, Net Banking, and Wallets</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={setupForm.gatewayEnabled ?? true}
                    onChange={(e) => setSetupForm({ ...setupForm, gatewayEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#991b1b]"></div>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Gateway Provider</label>
                  <select
                    value={setupForm.gatewayProvider || 'SANDBOX'}
                    onChange={(e) => setSetupForm({ ...setupForm, gatewayProvider: e.target.value as any })}
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#991b1b]"
                  >
                    <option value="SANDBOX">CoachingOS Sandbox Provider (Safe Testing)</option>
                    <option value="RAZORPAY">Razorpay Gateway (Production)</option>
                    <option value="STRIPE">Stripe Gateway (International)</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={setupForm.testMode ?? true}
                      onChange={(e) => setSetupForm({ ...setupForm, testMode: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                  <span className="text-xs font-semibold text-slate-700">Sandbox Test Mode Active</span>
                </div>
              </div>
            </div>

            {/* Bank Transfer Settings */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center text-[#991b1b]">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Direct Bank Transfer (NEFT / RTGS / IMPS)</h4>
                    <p className="text-xs text-slate-500">Displays institute account details with administrative UTR review</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={setupForm.bankTransferEnabled ?? true}
                    onChange={(e) => setSetupForm({ ...setupForm, bankTransferEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#991b1b]"></div>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={setupForm.bankName || ''}
                    onChange={(e) => setSetupForm({ ...setupForm, bankName: e.target.value })}
                    placeholder="e.g. HDFC Bank, ICICI Bank, SBI"
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Account Holder Name</label>
                  <input
                    type="text"
                    value={setupForm.bankAccountHolder || ''}
                    onChange={(e) => setSetupForm({ ...setupForm, bankAccountHolder: e.target.value })}
                    placeholder="Official Institute Registered Name"
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Bank Account Number</label>
                  <input
                    type="text"
                    value={setupForm.bankAccountNumber || ''}
                    onChange={(e) => setSetupForm({ ...setupForm, bankAccountNumber: e.target.value })}
                    placeholder="e.g. 50200011223344"
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl font-mono text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">IFSC Code</label>
                  <input
                    type="text"
                    value={setupForm.bankIfsc || ''}
                    onChange={(e) => setSetupForm({ ...setupForm, bankIfsc: e.target.value })}
                    placeholder="e.g. HDFC0000123"
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl font-mono text-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* Cash at Counter Toggle */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
                  <Banknote className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Cash Counter POS</h4>
                  <p className="text-xs text-slate-500">Allow counter staff to record physical cash collections</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={setupForm.cashEnabled ?? true}
                  onChange={(e) => setSetupForm({ ...setupForm, cashEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#991b1b]"></div>
              </label>
            </div>
          </div>
        </div>
      </form>
      )}
      </>
      )}

      {/* MODALS */}
      {checkoutInvoice && (
        <PaymentCheckoutModal
          isOpen={Boolean(checkoutInvoice)}
          onClose={() => setCheckoutInvoice(null)}
          invoice={checkoutInvoice}
          organizationId={currentOrg.id}
          userRole={currentUser.role}
          onPaymentSuccess={(paymentResult) => {
            showToast(`Payment captured! Receipt #${paymentResult.receiptNumber || 'REC-001'} issued.`, 'success');
            loadFinanceData();
          }}
        />
      )}

      {activeReceipt && (
        <ReceiptViewerModal
          isOpen={Boolean(activeReceipt)}
          onClose={() => setActiveReceipt(null)}
          receipt={activeReceipt}
        />
      )}

      {refundPayment && (
        <RefundModal
          isOpen={Boolean(refundPayment)}
          onClose={() => setRefundPayment(null)}
          payment={refundPayment}
          organizationId={currentOrg.id}
          actorName={currentUser.fullName}
          onRefundSuccess={() => {
            showToast('Refund completed and ledger balance restored', 'success');
            loadFinanceData();
          }}
        />
      )}

      {reviewPayment && (
        <BankTransferVerificationModal
          isOpen={Boolean(reviewPayment)}
          onClose={() => setReviewPayment(null)}
          payment={reviewPayment}
          actorName={currentUser.fullName}
          onVerificationDone={() => {
            showToast('Manual bank transfer updated successfully', 'success');
            loadFinanceData();
          }}
        />
      )}

      {/* PDC Cheque Vault & Daily Cash Counter Daybook Modal */}
      <PdcChequeVaultModal
        isOpen={isPdcVaultOpen}
        onClose={() => setIsPdcVaultOpen(false)}
        instituteName={currentOrg.tradeName}
      />
    </div>
  );
}

export default function FinancePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading fee records...</div>}>
      <FinanceContent />
    </Suspense>
  );
}
