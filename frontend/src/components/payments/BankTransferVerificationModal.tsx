'use client';

import React, { useState } from 'react';
import { X, Building2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { Payment } from '@/lib/types';

interface BankTransferVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: Payment | null;
  onVerificationDone: () => void;
  actorName?: string;
}

export default function BankTransferVerificationModal({
  isOpen,
  onClose,
  payment,
  onVerificationDone,
  actorName = 'Accounts Admin',
}: BankTransferVerificationModalProps) {
  if (!isOpen || !payment) return null;

  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [showRejectBox, setShowRejectBox] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleAction = async (action: 'APPROVE' | 'REJECT') => {
    if (action === 'REJECT' && !rejectionReason.trim()) {
      setErrorMessage('Please state the rejection reason for the parent/student notice');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/v1/payments/manual-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId: payment.id,
          action,
          reason: rejectionReason.trim(),
          verifiedBy: actorName,
        }),
      });

      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error?.message || 'Verification update failed');
      onVerificationDone();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error processing manual verification');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/65 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-[#450a0a] text-white">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-rose-300" />
            <h3 className="text-base font-bold">Review Bank Transfer</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-rose-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400">Student:</span>
              <span className="font-bold text-slate-800">{payment.studentName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Claimed Amount:</span>
              <span className="font-bold text-slate-900 text-sm text-[#991b1b]">
                ₹{(payment.amountPaise / 100).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Bank UTR / Ref:</span>
              <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                {payment.providerPaymentId || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Transfer Date:</span>
              <span className="font-semibold text-slate-700">
                {payment.paidAt ? new Date(payment.paidAt).toLocaleDateString('en-IN') : 'Recently Submitted'}
              </span>
            </div>
            {payment.notes && (
              <div className="flex justify-between pt-1 border-t border-slate-200">
                <span className="text-slate-400">Payer Notes:</span>
                <span className="font-semibold text-slate-700 italic">{payment.notes}</span>
              </div>
            )}
          </div>

          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900 space-y-1">
            <span className="font-bold block">Verification Checklist:</span>
            <p className="text-amber-800/80 leading-relaxed">
              Open your net banking portal or mobile app. Ensure the credit of <strong>₹{(payment.amountPaise / 100).toLocaleString('en-IN')}</strong> matches UTR <strong>{payment.providerPaymentId}</strong> before confirming.
            </p>
          </div>

          {showRejectBox && (
            <div className="space-y-1.5 animate-in fade-in">
              <label className="block font-semibold text-rose-700">Rejection Reason *</label>
              <input
                type="text"
                placeholder="e.g. UTR not reflected in ICICI statement"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-rose-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            {!showRejectBox ? (
              <>
                <button
                  type="button"
                  onClick={() => setShowRejectBox(true)}
                  className="px-3.5 py-2 rounded-xl border border-rose-200 text-rose-700 font-semibold hover:bg-rose-50 transition-colors flex items-center gap-1.5"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Reject</span>
                </button>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleAction('APPROVE')}
                  className="px-4 py-2 rounded-xl bg-[#991b1b] hover:bg-[#7f1d1d] text-white font-bold transition-colors shadow-xs flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isProcessing ? 'Verifying...' : 'Approve & Settle Fee'}</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setShowRejectBox(false)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleAction('REJECT')}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition-colors shadow-xs flex items-center gap-1.5"
                >
                  <XCircle className="w-4 h-4" />
                  <span>{isProcessing ? 'Processing...' : 'Confirm Rejection'}</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
