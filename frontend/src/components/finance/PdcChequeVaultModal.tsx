'use client';

import React, { useState } from 'react';
import { 
  Building2, 
  Banknote, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  Plus, 
  Clock, 
  FileText, 
  ArrowUpRight, 
  Sparkles,
  QrCode,
  Send,
  Printer
} from 'lucide-react';

export interface PdcCheque {
  id: string;
  chequeNumber: string;
  bankName: string;
  accountHolder: string;
  studentName: string;
  amountRupees: number;
  maturityDate: string;
  status: 'IN_DRAWER' | 'DUE_THIS_WEEK' | 'DEPOSITED' | 'CLEARED' | 'BOUNCED';
  notes?: string;
}

const INITIAL_CHEQUES: PdcCheque[] = [
  {
    id: 'ch-1',
    chequeNumber: '004128',
    bankName: 'State Bank of India',
    accountHolder: 'Rajesh Verma',
    studentName: 'Aarav Verma',
    amountRupees: 18000,
    maturityDate: '2026-09-25',
    status: 'DUE_THIS_WEEK',
    notes: 'Installment 2 of 3 (Target JEE Batch)',
  },
  {
    id: 'ch-2',
    chequeNumber: '782910',
    bankName: 'HDFC Bank',
    accountHolder: 'Sunita Sharma',
    studentName: 'Priya Sharma',
    amountRupees: 22500,
    maturityDate: '2026-09-27',
    status: 'DUE_THIS_WEEK',
    notes: 'Installment 2 of 2 (NEET Dropper)',
  },
  {
    id: 'ch-3',
    chequeNumber: '339102',
    bankName: 'Punjab National Bank',
    accountHolder: 'Manoj Gupta',
    studentName: 'Kunal Gupta',
    amountRupees: 15000,
    maturityDate: '2026-10-15',
    status: 'IN_DRAWER',
    notes: 'Installment 3 (Foundation Class 10)',
  },
  {
    id: 'ch-4',
    chequeNumber: '912044',
    bankName: 'ICICI Bank',
    accountHolder: 'Deepak Mishra',
    studentName: 'Rohan Mishra',
    amountRupees: 12000,
    maturityDate: '2026-09-10',
    status: 'CLEARED',
    notes: 'Cleared successfully at branch',
  },
];

interface PdcChequeVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  instituteName: string;
}

export default function PdcChequeVaultModal({
  isOpen,
  onClose,
  instituteName,
}: PdcChequeVaultModalProps) {
  const [cheques, setCheques] = useState<PdcCheque[]>(INITIAL_CHEQUES);
  const [activeTab, setActiveTab] = useState<'CHEQUES' | 'DAYBOOK'>('CHEQUES');
  const [filter, setFilter] = useState<'ALL' | 'DUE_THIS_WEEK' | 'IN_DRAWER' | 'BOUNCED'>('ALL');
  const [isAddChequeOpen, setIsAddChequeOpen] = useState(false);

  // New Cheque form state
  const [chequeNo, setChequeNo] = useState('');
  const [bank, setBank] = useState('State Bank of India');
  const [holder, setHolder] = useState('');
  const [student, setStudent] = useState('');
  const [amount, setAmount] = useState<number>(15000);
  const [matDate, setMatDate] = useState('2026-10-01');

  if (!isOpen) return null;

  const totalChequesInHand = cheques
    .filter(c => c.status === 'IN_DRAWER' || c.status === 'DUE_THIS_WEEK')
    .reduce((sum, c) => sum + c.amountRupees, 0);

  const dueThisWeekAmount = cheques
    .filter(c => c.status === 'DUE_THIS_WEEK')
    .reduce((sum, c) => sum + c.amountRupees, 0);

  const handleAddCheque = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chequeNo.trim() || !holder.trim()) return;

    const newC: PdcCheque = {
      id: `ch-${Date.now()}`,
      chequeNumber: chequeNo,
      bankName: bank,
      accountHolder: holder,
      studentName: student || holder,
      amountRupees: Number(amount),
      maturityDate: matDate,
      status: 'IN_DRAWER',
    };

    setCheques([newC, ...cheques]);
    setIsAddChequeOpen(false);
    setChequeNo('');
    setHolder('');
    setStudent('');
  };

  const handleUpdateStatus = (id: string, newStatus: PdcCheque['status']) => {
    setCheques(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
  };

  const filteredCheques = cheques.filter(c => {
    if (filter === 'ALL') return true;
    return c.status === filter;
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#2c0505] via-[#450a0a] to-[#7f1d1d] text-white p-6 relative overflow-hidden">
          <div className="flex items-start justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-950/80 border border-rose-500/30 flex items-center justify-center text-amber-300 shadow-inner">
                <Building2 className="w-6 h-6 text-amber-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black tracking-tight text-white">
                    PDC Cheque Vault &amp; Counter Daybook
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-amber-950">
                    Gullak &amp; Cheques
                  </span>
                </div>
                <p className="text-xs text-rose-200/80 mt-1 max-w-xl">
                  Track physical post-dated cheques in your office drawer, get bank clearance reminders, and reconcile daily counter cash &amp; UPI collections at 8 PM closing.
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

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-rose-900/60 relative z-10">
            <div className="bg-rose-950/50 p-3 rounded-xl border border-rose-800/40">
              <span className="text-[11px] font-semibold text-rose-200 block">Cheques in Drawer</span>
              <div className="text-xl font-black text-amber-300 mt-0.5">
                ₹{totalChequesInHand.toLocaleString('en-IN')}
              </div>
            </div>
            <div className="bg-rose-950/50 p-3 rounded-xl border border-rose-800/40">
              <span className="text-[11px] font-semibold text-rose-200 block">Bank Deposit This Week</span>
              <div className="text-xl font-black text-rose-300 mt-0.5">
                ₹{dueThisWeekAmount.toLocaleString('en-IN')}
              </div>
            </div>
            <div className="bg-rose-950/50 p-3 rounded-xl border border-rose-800/40">
              <span className="text-[11px] font-semibold text-rose-200 block">Cash in Drawer (Counter)</span>
              <div className="text-xl font-black text-white mt-0.5">
                ₹18,500
              </div>
            </div>
            <div className="bg-rose-950/50 p-3 rounded-xl border border-rose-800/40">
              <span className="text-[11px] font-semibold text-rose-200 block">Today&apos;s UPI at Counter</span>
              <div className="text-xl font-black text-emerald-300 mt-0.5">
                ₹34,000
              </div>
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="px-6 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('CHEQUES')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'CHEQUES'
                  ? 'bg-[#991b1b] text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Post-Dated Cheques ({cheques.length})
            </button>
            <button
              onClick={() => setActiveTab('DAYBOOK')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'DAYBOOK'
                  ? 'bg-[#991b1b] text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Daily Counter Daybook (Gullak)
            </button>
          </div>

          {activeTab === 'CHEQUES' && (
            <button
              onClick={() => setIsAddChequeOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#991b1b] hover:bg-[#7f1d1d] text-white text-xs font-bold rounded-xl shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record New PDC Cheque</span>
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {activeTab === 'CHEQUES' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredCheques.map(c => {
                  const isDueThisWeek = c.status === 'DUE_THIS_WEEK';
                  const isBounced = c.status === 'BOUNCED';

                  const bounceWaText = encodeURIComponent(
                    `*Notice from ${instituteName} Regarding Cheque*\n\n` +
                    `Namaste ${c.accountHolder},\n` +
                    `Your fee cheque #${c.chequeNumber} (${c.bankName}) of *₹${c.amountRupees.toLocaleString('en-IN')}* for student *${c.studentName}* could not be cleared due to a technical/bank error.\n\n` +
                    `Kindly pay the due amount via instant UPI or replace the physical cheque at the counter.\n\n` +
                    `Warm regards,\nAccounts Desk, ${instituteName}`
                  );

                  return (
                    <div
                      key={c.id}
                      className={`p-4 rounded-2xl border bg-white shadow-xs space-y-3 ${
                        isDueThisWeek ? 'border-amber-300 ring-1 ring-amber-100' : isBounced ? 'border-red-300' : 'border-slate-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                            CHQ #{c.chequeNumber}
                          </span>
                          <h4 className="font-bold text-slate-900 text-sm mt-1">{c.studentName}</h4>
                          <div className="text-xs text-slate-500">{c.bankName} &bull; A/C: {c.accountHolder}</div>
                        </div>

                        <div className="text-right">
                          <div className="text-base font-black text-slate-900 font-mono">
                            ₹{c.amountRupees.toLocaleString('en-IN')}
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-1 ${
                            isDueThisWeek ? 'bg-amber-100 text-amber-900' : c.status === 'CLEARED' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {c.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                        <div className="flex items-center gap-1 font-mono">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>Deposit Date: {c.maturityDate}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {c.status !== 'CLEARED' && (
                            <button
                              onClick={() => handleUpdateStatus(c.id, 'CLEARED')}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg text-[11px]"
                            >
                              Mark Cleared
                            </button>
                          )}
                          {c.status !== 'BOUNCED' && c.status !== 'CLEARED' && (
                            <button
                              onClick={() => handleUpdateStatus(c.id, 'BOUNCED')}
                              className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg text-[11px]"
                            >
                              Mark Bounced
                            </button>
                          )}
                          {isBounced && (
                            <a
                              href={`https://wa.me/?text=${bounceWaText}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2 py-1 bg-emerald-600 text-white font-bold rounded-lg text-[11px] inline-flex items-center gap-1"
                            >
                              <Send className="w-3 h-3" />
                              <span>WhatsApp Parent</span>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* DAYBOOK / DAILY COUNTER CLOSING VIEW */
            <div className="space-y-5 max-w-xl mx-auto">
              <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/90 shadow-xs space-y-4">
                <div className="text-center pb-3 border-b border-slate-200 space-y-1">
                  <span className="text-[11px] font-black uppercase tracking-wider text-rose-800 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
                    Daily 8 PM Counter Tally (Aaj Ki Dukan)
                  </span>
                  <h3 className="text-lg font-black text-slate-900 mt-2">Counter Cash &amp; Digital Register</h3>
                  <p className="text-xs text-slate-500">
                    Tally the physical cash in the office drawer with the digital collection entries.
                  </p>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-white border border-slate-200">
                    <div className="flex items-center gap-2.5">
                      <Banknote className="w-5 h-5 text-amber-600" />
                      <div>
                        <span className="font-bold text-slate-800 block">Physical Cash in Drawer</span>
                        <span className="text-[11px] text-slate-400">Cash receipts handed to receptionist today</span>
                      </div>
                    </div>
                    <span className="text-base font-black text-slate-900 font-mono">₹18,500</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-2xl bg-white border border-slate-200">
                    <div className="flex items-center gap-2.5">
                      <QrCode className="w-5 h-5 text-emerald-600" />
                      <div>
                        <span className="font-bold text-slate-800 block">UPI Payments at Front Desk QR</span>
                        <span className="text-[11px] text-slate-400">GPay, PhonePe, Paytm directly received</span>
                      </div>
                    </div>
                    <span className="text-base font-black text-emerald-700 font-mono">₹34,000</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-2xl bg-white border border-slate-200">
                    <div className="flex items-center gap-2.5">
                      <Building2 className="w-5 h-5 text-blue-600" />
                      <div>
                        <span className="font-bold text-slate-800 block">Post-Dated Cheques Handed In</span>
                        <span className="text-[11px] text-slate-400">2 cheques accepted for upcoming installments</span>
                      </div>
                    </div>
                    <span className="text-base font-black text-slate-700 font-mono">₹40,500</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900 text-white flex items-center justify-between mt-4">
                    <div>
                      <span className="text-xs text-slate-400 block font-semibold">Total Day&apos;s Collection Volume</span>
                      <span className="text-xl font-black text-amber-300 font-mono">₹93,000</span>
                    </div>
                    <button
                      onClick={() => window.print()}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-xs"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Print Counter Slip</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>{instituteName} Finance &amp; Cheque Custody Vault</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-100"
          >
            Close Vault
          </button>
        </div>
      </div>
    </div>
  );
}
