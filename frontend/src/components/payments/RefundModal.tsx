'use client';

import React, { useState } from 'react';
import { X, RotateCcw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Payment } from '@/lib/types';

interface RefundModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: Payment | null;
  organizationId: string;
  onRefundSuccess: () => void;
  actorName?: string;
}

export default function RefundModal({
  isOpen,
  onClose,
  payment,
  organizationId,
  onRefundSuccess,
  actorName = 'Accounts Officer',
}: RefundModalProps) {
  if (!isOpen || !payment) return null;

  const maxAmount = payment.amountPaise / 100;
  const [refundAmountRupees, setRefundAmountRupees] = useState<number>(maxAmount);
  const [reason, setReason] = useState<string>('Course Batch Rescheduling / Scholarship Adjustment');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (refundAmountRupees <= 0 || refundAmountRupees > maxAmount) {
      setErrorMessage(`Refund amount must be between ₹1 and ₹${maxAmount.toLocaleString('en-IN')}`);
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/v1/payments/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          paymentId: payment.id,
          invoiceId: payment.invoiceId,
          studentId: payment.studentId,
          amountPaise: refundAmountRupees * 100,
          reason,
          requestedBy: actorName,
        }),
      });

      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error?.message || 'Refund processing failed');
      onRefundSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error processing refund');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/65 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-rose-950 text-white">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-rose-400" />
            <h3 className="text-base font-bold">Process Fee Refund</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-rose-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Payment Context */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-400">Payment ID:</span>
              <span className="font-mono font-bold text-slate-800">{payment.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Original Paid Amount:</span>
              <span className="font-bold text-slate-900">₹{maxAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Payment Method:</span>
              <span className="font-semibold text-slate-700">{payment.paymentMethod}</span>
            </div>
          </div>

          {/* Refund Amount Input */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Refund Amount (₹) *
            </label>
            <input
              type="number"
              min={1}
              max={maxAmount}
              value={refundAmountRupees}
              onChange={(e) => setRefundAmountRupees(Number(e.target.value))}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Restores up to ₹{maxAmount.toLocaleString('en-IN')} on invoice #{payment.invoiceNumber}
            </p>
          </div>

          {/* Reason Input */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Reason for Refund *
            </label>
            <textarea
              rows={2}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Provide reason for audit logging..."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition-colors shadow-xs flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{isProcessing ? 'Refunding...' : 'Confirm Refund'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
