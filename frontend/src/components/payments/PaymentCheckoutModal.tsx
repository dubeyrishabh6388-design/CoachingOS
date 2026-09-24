'use client';

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { 
  X, 
  QrCode, 
  CreditCard, 
  Building2, 
  Banknote, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Copy, 
  ExternalLink,
  ShieldCheck,
  Receipt
} from 'lucide-react';
import { Invoice, PaymentAccount } from '@/lib/types';

interface PaymentCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice;
  organizationId: string;
  onPaymentSuccess: (paymentResult: any) => void;
  defaultPayAmountRupees?: number;
  userRole?: string;
}

export default function PaymentCheckoutModal({
  isOpen,
  onClose,
  invoice,
  organizationId,
  onPaymentSuccess,
  defaultPayAmountRupees,
  userRole = 'STUDENT',
}: PaymentCheckoutModalProps) {
  const [account, setAccount] = useState<PaymentAccount | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [selectedMethod, setSelectedMethod] = useState<'UPI' | 'ONLINE_GATEWAY' | 'BANK_TRANSFER' | 'CASH'>('UPI');
  const [payAmountRupees, setPayAmountRupees] = useState<number>(
    defaultPayAmountRupees || Math.max(0, invoice.balanceAmountPaise / 100)
  );

  // UPI State
  const [upiQrUrl, setUpiQrUrl] = useState<string>('');
  const [upiDeepLink, setUpiDeepLink] = useState<string>('');

  // Bank Transfer State
  const [utrNumber, setUtrNumber] = useState<string>('');
  const [transferDate, setTransferDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [bankNotes, setBankNotes] = useState<string>('');

  // Processing State
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Load institute-specific payment account configuration
  useEffect(() => {
    if (!isOpen) return;
    setLoadingConfig(true);
    setErrorMessage(null);

    fetch(`/api/v1/payments/settings?organizationId=${organizationId}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.data) {
          setAccount(json.data);
          // Set initial active method based on what the institute has enabled
          if (json.data.upiEnabled) setSelectedMethod('UPI');
          else if (json.data.gatewayEnabled) setSelectedMethod('ONLINE_GATEWAY');
          else if (json.data.bankTransferEnabled) setSelectedMethod('BANK_TRANSFER');
          else if (json.data.cashEnabled) setSelectedMethod('CASH');
        }
      })
      .catch((err) => {
        console.error('Error fetching institute payment settings', err);
        setErrorMessage('Failed to load institute payment configuration');
      })
      .finally(() => setLoadingConfig(false));
  }, [isOpen, organizationId]);

  // Generate UPI QR when account or amount changes
  useEffect(() => {
    if (!account || selectedMethod !== 'UPI') return;

    const amountStr = payAmountRupees.toFixed(2);
    const merchantName = encodeURIComponent(account.upiMerchantName || 'Coaching Institute');
    const note = encodeURIComponent(`Fee Inv ${invoice.invoiceNumber.slice(-6)}`);
    const uri = `upi://pay?pa=${account.upiId}&pn=${merchantName}&am=${amountStr}&cu=INR&tn=${note}`;

    setUpiDeepLink(uri);
    QRCode.toDataURL(uri, { width: 260, margin: 1 })
      .then(setUpiQrUrl)
      .catch((err) => console.error('QR generation failed', err));
  }, [account, selectedMethod, payAmountRupees, invoice.invoiceNumber]);

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2500);
  };

  // 1. Submit UPI or Counter Simulation
  const handleSimulatedUPIPayment = async () => {
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/v1/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          branchId: invoice.branchId,
          invoiceId: invoice.id,
          studentId: invoice.studentId,
          amountPaise: payAmountRupees * 100,
          paymentMethod: 'UPI',
          channel: 'STUDENT_PORTAL',
          idempotencyKey: `upi_${invoice.id}_${Date.now()}`,
        }),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error?.message || 'Payment capture failed');
      onPaymentSuccess(json.data);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Payment simulation failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // 2. Submit Instant Online Gateway
  const handleOnlineGatewayPayment = async () => {
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      const verifyRes = await fetch('/api/v1/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          branchId: invoice.branchId,
          invoiceId: invoice.id,
          studentId: invoice.studentId,
          amountPaise: payAmountRupees * 100,
          paymentMethod: 'ONLINE_GATEWAY',
          providerPaymentId: `sbx_pay_${Date.now()}`,
          providerOrderId: `sbx_ord_${invoice.id}`,
          signature: 'test_signature_valid',
          idempotencyKey: `gw_${invoice.id}_${Date.now()}`,
        }),
      });

      const verifyJson = await verifyRes.json();
      if (!verifyRes.ok || verifyJson.error) throw new Error(verifyJson.error?.message || 'Gateway verification declined');
      onPaymentSuccess(verifyJson.data);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Online payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // 3. Submit Manual Bank Wire UTR
  const handleBankTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!utrNumber.trim()) {
      setErrorMessage('Please enter the Bank Transfer UTR / Transaction Reference Number');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/v1/payments/bank-transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          branchId: invoice.branchId,
          invoiceId: invoice.id,
          studentId: invoice.studentId,
          amountPaise: payAmountRupees * 100,
          utrNumber: utrNumber.trim(),
          bankName: account?.bankName,
          transferDate,
          notes: bankNotes,
        }),
      });

      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error?.message || 'Failed to submit bank transfer');
      onPaymentSuccess(json.data);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error submitting bank transfer');
    } finally {
      setIsProcessing(false);
    }
  };

  // 4. Submit Cash Payment (Staff only)
  const handleCashPayment = async () => {
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/v1/payments/cash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          branchId: invoice.branchId,
          invoiceId: invoice.id,
          studentId: invoice.studentId,
          amountPaise: payAmountRupees * 100,
          collectedBy: 'Authorized Institute Counter',
          notes: 'Counter Cash Collection',
          idempotencyKey: `cash_${invoice.id}_${Date.now()}`,
        }),
      });

      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error?.message || 'Failed to record cash');
      onPaymentSuccess(json.data);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error recording cash payment');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/65 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#450a0a] text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-400/30 flex items-center justify-center text-rose-300 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight">Direct Institute Fee Checkout</h3>
                {account?.testMode && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    TEST MODE
                  </span>
                )}
              </div>
              <p className="text-xs text-rose-200/80 mt-0.5">
                Paying directly to: <span className="font-semibold text-white">{account?.upiMerchantName || 'Your Institute'}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-rose-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Invoice Summary Banner */}
        <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-200/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Student</span>
            <span className="font-bold text-slate-800">{invoice.studentName}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Invoice #</span>
            <span className="font-mono font-bold text-slate-800">{invoice.invoiceNumber}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Total Invoice</span>
            <span className="font-semibold text-slate-700">₹{(invoice.totalAmountPaise / 100).toLocaleString('en-IN')}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Outstanding Balance</span>
            <span className="font-black text-amber-600">
              ₹{(invoice.balanceAmountPaise / 100).toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Modal Body: 2-Column Wide Layout */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column (lg:col-span-5): Amount & Payment Method Selection */}
            <div className="lg:col-span-5 space-y-5">
              {/* Payment Amount Card */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Payment Amount (₹)
                  </label>
                  <button
                    type="button"
                    onClick={() => setPayAmountRupees(invoice.balanceAmountPaise / 100)}
                    className="text-[11px] font-bold text-[#991b1b] hover:underline"
                  >
                    Pay Full Balance
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-base font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    min={1}
                    max={invoice.balanceAmountPaise / 100}
                    value={payAmountRupees}
                    onChange={(e) => setPayAmountRupees(Number(e.target.value))}
                    className="w-full pl-8 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-lg font-black text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#991b1b]"
                  />
                </div>
              </div>

              {/* Payment Method Selector (Rich Stacked Cards) */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Payment Method
                </label>

                {/* 1. UPI */}
                <button
                  type="button"
                  disabled={!account?.upiEnabled}
                  onClick={() => setSelectedMethod('UPI')}
                  className={`w-full p-3 rounded-2xl border text-left transition-all flex items-center justify-between ${
                    selectedMethod === 'UPI'
                      ? 'border-[#991b1b] bg-red-50/60 ring-2 ring-[#991b1b]/20 shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  } ${!account?.upiEnabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      selectedMethod === 'UPI' ? 'bg-[#991b1b] text-white' : 'bg-slate-100 text-slate-700'
                    }`}>
                      <QrCode className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">UPI / Dynamic QR</h4>
                      <p className="text-[11px] text-slate-500">GPay, PhonePe, Paytm, BHIM</p>
                    </div>
                  </div>
                  {selectedMethod === 'UPI' && (
                    <div className="w-5 h-5 rounded-full bg-[#991b1b] text-white flex items-center justify-center">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                  )}
                </button>

                {/* 2. Online Gateway */}
                <button
                  type="button"
                  disabled={!account?.gatewayEnabled}
                  onClick={() => setSelectedMethod('ONLINE_GATEWAY')}
                  className={`w-full p-3 rounded-2xl border text-left transition-all flex items-center justify-between ${
                    selectedMethod === 'ONLINE_GATEWAY'
                      ? 'border-[#991b1b] bg-red-50/60 ring-2 ring-[#991b1b]/20 shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  } ${!account?.gatewayEnabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      selectedMethod === 'ONLINE_GATEWAY' ? 'bg-[#991b1b] text-white' : 'bg-slate-100 text-slate-700'
                    }`}>
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Online Gateway</h4>
                      <p className="text-[11px] text-slate-500">Cards, NetBanking, Wallets</p>
                    </div>
                  </div>
                  {selectedMethod === 'ONLINE_GATEWAY' && (
                    <div className="w-5 h-5 rounded-full bg-[#991b1b] text-white flex items-center justify-center">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                  )}
                </button>

                {/* 3. Bank Transfer */}
                <button
                  type="button"
                  disabled={!account?.bankTransferEnabled}
                  onClick={() => setSelectedMethod('BANK_TRANSFER')}
                  className={`w-full p-3 rounded-2xl border text-left transition-all flex items-center justify-between ${
                    selectedMethod === 'BANK_TRANSFER'
                      ? 'border-[#991b1b] bg-red-50/60 ring-2 ring-[#991b1b]/20 shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  } ${!account?.bankTransferEnabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      selectedMethod === 'BANK_TRANSFER' ? 'bg-[#991b1b] text-white' : 'bg-slate-100 text-slate-700'
                    }`}>
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Bank Wire / NEFT</h4>
                      <p className="text-[11px] text-slate-500">Direct Account Transfer &amp; UTR</p>
                    </div>
                  </div>
                  {selectedMethod === 'BANK_TRANSFER' && (
                    <div className="w-5 h-5 rounded-full bg-[#991b1b] text-white flex items-center justify-center">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                  )}
                </button>

                {/* 4. Cash at Counter */}
                <button
                  type="button"
                  disabled={!account?.cashEnabled}
                  onClick={() => setSelectedMethod('CASH')}
                  className={`w-full p-3 rounded-2xl border text-left transition-all flex items-center justify-between ${
                    selectedMethod === 'CASH'
                      ? 'border-[#991b1b] bg-red-50/60 ring-2 ring-[#991b1b]/20 shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  } ${!account?.cashEnabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      selectedMethod === 'CASH' ? 'bg-[#991b1b] text-white' : 'bg-slate-100 text-slate-700'
                    }`}>
                      <Banknote className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Cash Counter POS</h4>
                      <p className="text-[11px] text-slate-500">Collect Physical Currency</p>
                    </div>
                  </div>
                  {selectedMethod === 'CASH' && (
                    <div className="w-5 h-5 rounded-full bg-[#991b1b] text-white flex items-center justify-center">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                  )}
                </button>
              </div>

              {/* Direct Settlement Notice */}
              <div className="p-3.5 rounded-2xl bg-red-50/60 border border-red-100 text-[11px] text-red-950 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#991b1b]" />
                  <span>Direct Institute Settlement</span>
                </div>
                <p className="text-red-900/80 leading-relaxed">
                  100% of this payment is routed directly into the institute bank account. CoachingOS holds zero escrow.
                </p>
              </div>
            </div>

            {/* Right Column (lg:col-span-7): Active Execution Workspace */}
            <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
              {errorMessage && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* 1. UPI ACTIVE WORKSPACE */}
              {selectedMethod === 'UPI' && (
                <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 flex flex-col items-center text-center space-y-4">
                  <div>
                    <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-red-100 text-[#991b1b]">
                      Scan &amp; Pay via Any UPI App
                    </span>
                    <h4 className="text-2xl font-black text-slate-900 mt-2">
                      ₹{payAmountRupees.toLocaleString('en-IN')}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Instant verification &bull; Real-time receipt generated
                    </p>
                  </div>

                  {/* QR Code */}
                  <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-200 inline-block">
                    {upiQrUrl ? (
                      <img src={upiQrUrl} alt="UPI QR" className="w-48 h-48 object-contain mx-auto" />
                    ) : (
                      <div className="w-48 h-48 flex items-center justify-center text-slate-400">
                        <Clock className="w-6 h-6 animate-spin" />
                      </div>
                    )}
                  </div>

                  {/* Institute UPI ID pill */}
                  <div className="w-full max-w-sm flex items-center justify-between p-2.5 px-3 rounded-xl bg-white border border-slate-200 font-mono text-xs">
                    <span className="truncate text-slate-800">{account?.upiId}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(account?.upiId || '', 'upiId')}
                      className="text-[#991b1b] hover:text-[#7f1d1d] ml-2 shrink-0 font-sans text-xs flex items-center gap-1 font-bold"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedField === 'upiId' ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>

                  {/* Action Buttons */}
                  <div className="w-full max-w-sm flex flex-col sm:flex-row gap-2.5 pt-2">
                    <a
                      href={upiDeepLink}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-900 transition-colors shadow-xs"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Open in UPI App</span>
                    </a>
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={handleSimulatedUPIPayment}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#991b1b] text-white text-xs font-bold hover:bg-[#7f1d1d] transition-colors shadow-xs"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isProcessing ? 'Verifying...' : 'Verify UPI Payment'}</span>
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-400">
                    Works with Google Pay, PhonePe, Paytm, BHIM, CRED &amp; all Indian banking apps.
                  </p>
                </div>
              )}

              {/* 2. ONLINE GATEWAY ACTIVE WORKSPACE */}
              {selectedMethod === 'ONLINE_GATEWAY' && (
                <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 space-y-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-[#991b1b]">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Instant Online Gateway</h4>
                      <p className="text-xs text-slate-500">
                        Provider: <span className="font-semibold text-slate-800">{account?.gatewayProvider}</span> &bull; 256-Bit TLS Secured
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Tuition Fee Amount:</span>
                      <span className="font-bold text-slate-900">₹{payAmountRupees.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Platform Processing Fee:</span>
                      <span className="font-semibold text-emerald-600">₹0.00 (Waived)</span>
                    </div>
                    <div className="pt-3 border-t border-slate-100 flex justify-between font-black text-base text-slate-900">
                      <span>Total Payable:</span>
                      <span className="text-[#991b1b]">₹{payAmountRupees.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={handleOnlineGatewayPayment}
                      className="w-full py-3 rounded-xl bg-[#991b1b] hover:bg-[#7f1d1d] text-white text-xs font-bold transition-colors shadow-sm flex items-center justify-center gap-2"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>{isProcessing ? 'Processing Transaction...' : `Proceed to Pay ₹${payAmountRupees.toLocaleString('en-IN')}`}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* 3. BANK TRANSFER ACTIVE WORKSPACE */}
              {selectedMethod === 'BANK_TRANSFER' && (
                <form onSubmit={handleBankTransferSubmit} className="p-6 rounded-3xl bg-slate-50 border border-slate-200 space-y-4">
                  <div>
                    <span className="text-[11px] font-bold text-[#991b1b] uppercase tracking-wider">
                      Institute Beneficiary Bank Details
                    </span>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Transfer fees via NEFT / RTGS / IMPS to the institute account below:
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-white border border-slate-200">
                      <span className="text-slate-400 block text-[10px]">Bank Name</span>
                      <span className="font-bold text-slate-800">{account?.bankName || 'HDFC Bank'}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-white border border-slate-200">
                      <span className="text-slate-400 block text-[10px]">Account Holder</span>
                      <span className="font-bold text-slate-800">{account?.bankAccountHolder || account?.upiMerchantName}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Account Number</span>
                        <span className="font-mono font-bold text-slate-800">{account?.bankAccountNumber || '50200011223344'}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(account?.bankAccountNumber || '50200011223344', 'accNum')}
                        className="text-[#991b1b] font-sans text-xs font-bold"
                      >
                        {copiedField === 'accNum' ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <div className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
                      <div>
                        <span className="text-slate-400 block text-[10px]">IFSC Code</span>
                        <span className="font-mono font-bold text-slate-800">{account?.bankIfsc || 'HDFC0000123'}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(account?.bankIfsc || 'HDFC0000123', 'ifsc')}
                        className="text-[#991b1b] font-sans text-xs font-bold"
                      >
                        {copiedField === 'ifsc' ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>

                  {/* UTR Submission Form */}
                  <div className="pt-2 space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Bank Transaction / UTR / Reference Number *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 423512398412 or NEFT-HDFC-99128"
                        value={utrNumber}
                        onChange={(e) => setUtrNumber(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#991b1b]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Transfer Date
                        </label>
                        <input
                          type="date"
                          value={transferDate}
                          onChange={(e) => setTransferDate(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Remitter Notes (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Paid from father's account"
                          value={bankNotes}
                          onChange={(e) => setBankNotes(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isProcessing}
                      className="w-full py-3 rounded-xl bg-[#991b1b] hover:bg-[#7f1d1d] text-white text-xs font-bold transition-colors shadow-sm flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isProcessing ? 'Submitting...' : 'Submit UTR for Verification'}</span>
                    </button>
                  </div>
                </form>
              )}

              {/* 4. CASH AT COUNTER ACTIVE WORKSPACE */}
              {selectedMethod === 'CASH' && (
                <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
                      <Banknote className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Institute Cash Counter POS</h4>
                      <p className="text-xs text-slate-500">Front desk physical currency collection &amp; instant receipt</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-slate-200 text-xs space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Student Roll:</span>
                      <span className="font-mono font-bold text-slate-800">{invoice.studentRoll || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Cash Amount:</span>
                      <span className="font-black text-slate-900 text-sm">₹{payAmountRupees.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Authorized Counter:</span>
                      <span className="font-semibold text-slate-700">Main Campus Front Desk</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={handleCashPayment}
                      className="w-full py-3 rounded-xl bg-[#991b1b] hover:bg-[#7f1d1d] text-white text-xs font-bold transition-colors shadow-sm flex items-center justify-center gap-2"
                    >
                      <Receipt className="w-4 h-4" />
                      <span>{isProcessing ? 'Recording...' : `Record Cash Receipt of ₹${payAmountRupees.toLocaleString('en-IN')}`}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
