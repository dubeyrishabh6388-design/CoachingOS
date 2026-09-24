'use client';

import React from 'react';
import { 
  X, 
  Printer, 
  Download, 
  CheckCircle2, 
  Building2, 
  ShieldCheck, 
  Share2 
} from 'lucide-react';
import { PaymentReceipt } from '@/lib/types';

interface ReceiptViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  receipt: PaymentReceipt | null;
}

export default function ReceiptViewerModal({
  isOpen,
  onClose,
  receipt,
}: ReceiptViewerModalProps) {
  if (!isOpen || !receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    const text = `Fee Receipt #${receipt.receiptNumber} for ${receipt.studentName} of ₹${(receipt.amountPaise / 100).toLocaleString('en-IN')} paid successfully to ${receipt.organizationName}.`;
    if (navigator.share) {
      navigator.share({ title: 'Fee Receipt', text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      alert('Receipt summary copied to clipboard');
    }
  };

  const amountRupees = (receipt.amountPaise / 100).toLocaleString('en-IN');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/65 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Toolbar (hidden during print) */}
        <div className="print:hidden flex items-center justify-between px-6 py-3.5 border-b border-slate-100 bg-[#450a0a] text-white">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-rose-300" />
            <span className="text-sm font-bold">Official Fee Payment Receipt</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-rose-200 hover:text-white hover:bg-white/10 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper */}
        <div id="printable-receipt" className="flex-1 overflow-y-auto p-8 bg-white text-slate-900 font-sans">
          {/* Institute Header */}
          <div className="border-b-2 border-slate-900 pb-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-black tracking-tight text-slate-950 uppercase">
                  {receipt.organizationName}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">{receipt.organizationAddress || 'Main Institutional Campus'}</p>
                <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[11px] font-mono text-slate-600">
                  <span>GSTIN: <strong className="text-slate-800">{receipt.organizationGstin || '08AAACA1234F1Z5'}</strong></span>
                  <span>•</span>
                  <span>Branch: <strong>{receipt.branchName || 'Main Centre'}</strong></span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="inline-block px-3 py-1 rounded-md bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold uppercase tracking-wider">
                  ORIGINAL RECEIPT
                </span>
                <div className="mt-2 text-xs font-mono">
                  <span className="text-slate-400 block text-[10px]">RECEIPT NUMBER</span>
                  <span className="font-bold text-slate-900">{receipt.receiptNumber}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Student & Invoice Meta Grid */}
          <div className="grid grid-cols-2 gap-4 py-4 border-b border-slate-100 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Student Details</span>
              <span className="font-bold text-sm text-slate-900 block mt-0.5">{receipt.studentName}</span>
              <span className="text-slate-600 font-mono">Roll: {receipt.studentRoll}</span>
              {receipt.batchName && <span className="text-slate-500 block">Batch: {receipt.batchName}</span>}
            </div>
            <div className="text-right">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Payment Details</span>
              <span className="font-mono font-bold text-slate-800 block mt-0.5">Inv #{receipt.invoiceNumber}</span>
              <span className="text-slate-600 block">Date: {new Date(receipt.paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
              <span className="text-slate-500 block font-mono text-[11px]">Mode: {receipt.paymentMethod}</span>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="py-4">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] text-left">
                  <th className="pb-2">Description</th>
                  <th className="pb-2 text-right">Reference</th>
                  <th className="pb-2 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-3">
                    <span className="font-semibold text-slate-900 block">Tuition &amp; Course Enrollment Fee</span>
                    <span className="text-[11px] text-slate-500">{receipt.courseName || 'Coaching Academic Program'}</span>
                  </td>
                  <td className="py-3 text-right font-mono text-slate-600 text-[11px]">
                    {receipt.transactionReference}
                  </td>
                  <td className="py-3 text-right font-bold text-slate-900">
                    ₹{amountRupees}
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-900">
                  <td colSpan={2} className="pt-3 font-bold text-slate-900 text-sm">
                    Total Amount Received:
                  </td>
                  <td className="pt-3 text-right font-black text-slate-950 text-base">
                    ₹{amountRupees}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Payment Status Stamp */}
          <div className="mt-6 pt-4 border-t border-dashed border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-emerald-800 uppercase block tracking-wider">
                  Payment Captured &amp; Verified
                </span>
                <span className="text-[10px] text-slate-400">
                  Verified By: {receipt.verifiedBy || 'System Gateway'}
                </span>
              </div>
            </div>

            <div className="text-right">
              <div className="border border-slate-300 rounded px-3 py-1 inline-block text-center font-mono text-[9px] uppercase tracking-wider text-slate-500">
                Digitally Signed
                <span className="block font-bold text-slate-700">Accounts Department</span>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center text-[10px] text-slate-400">
            This is a computer generated official fee receipt and requires no physical signature.
          </div>
        </div>
      </div>
    </div>
  );
}
