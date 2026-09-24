'use client';

import React, { useState } from 'react';
import { 
  MessageSquare, 
  Send, 
  CheckCircle2, 
  Smartphone, 
  QrCode, 
  Sparkles, 
  ShieldCheck, 
  AlertTriangle, 
  ExternalLink,
  RefreshCw,
  Zap,
  Info
} from 'lucide-react';
import { 
  buildWhatsAppUniversalUrl, 
  buildFeeReminderWhatsAppUrl, 
  buildAbsentAlertWhatsAppUrl, 
  buildDemoInviteWhatsAppUrl,
  normalizeIndianPhone 
} from '@/lib/utils/whatsapp';

interface WhatsAppGatewayControllerProps {
  instituteName: string;
  institutePhone: string;
}

export default function WhatsAppGatewayController({
  instituteName,
  institutePhone,
}: WhatsAppGatewayControllerProps) {
  const [activeMode, setActiveMode] = useState<'DIRECT_FREE' | 'QR_LINKED' | 'META_API'>('DIRECT_FREE');
  const [testPhone, setTestPhone] = useState('9876543210');
  const [templateType, setTemplateType] = useState<'FEE' | 'ABSENT' | 'TEST' | 'DEMO'>('ABSENT');
  const [isQrPaired, setIsQrPaired] = useState(false);
  const [customStudentName, setCustomStudentName] = useState('Aarav Verma');

  // Generate test message preview
  const getPreviewData = () => {
    switch (templateType) {
      case 'FEE':
        return {
          title: 'Tuition Fee Installment Notice',
          url: buildFeeReminderWhatsAppUrl({
            parentPhone: testPhone,
            parentName: 'Mr. Verma',
            studentName: customStudentName,
            batchName: 'Target JEE Batch A',
            dueAmountRupees: 18500,
            dueDate: '25-Sep-2026',
            instituteName,
            institutePhone,
            upiVpa: `${instituteName.toLowerCase().replace(/\s+/g, '')}@upi`,
          }),
        };
      case 'ABSENT':
        return {
          title: 'Student Absent Emergency Notice',
          url: buildAbsentAlertWhatsAppUrl({
            parentPhone: testPhone,
            parentName: 'Parent',
            studentName: customStudentName,
            batchName: 'Class 12 Physics (4:00 PM)',
            classTime: '4:00 PM Lecture',
            instituteName,
            directorPhone: institutePhone,
          }),
        };
      case 'DEMO':
        return {
          title: 'Free Demo Class Invitation',
          url: buildDemoInviteWhatsAppUrl({
            parentPhone: testPhone,
            studentName: customStudentName,
            targetCourse: 'NEET Foundation 2027',
            demoDate: 'This Saturday',
            demoTime: '4:00 PM',
            instituteName,
            campusAddress: 'Main Institute Campus, Floor 2',
          }),
        };
      case 'TEST':
      default:
        const testText = 
          `*Weekly Test Scorecard from ${instituteName}*\n\n` +
          `Student: *${customStudentName}* (ROLL-012)\n` +
          `Batch: *Target JEE 2027*\n` +
          `Test: *Sunday Periodic Assessment*\n\n` +
          `🏆 *Batch Rank:* Rank #1 in 45 students\n` +
          `📊 *Total Score:* 284 / 300 (94.6%)\n\n` +
          `📌 *Subject Breakdown:*\n` +
          `• Physics: 96/100\n` +
          `• Chemistry: 94/100\n` +
          `• Mathematics: 94/100\n\n` +
          `Proudly guided by *${instituteName}*.`;
        return {
          title: 'Weekly Test Scorecard with Rank',
          url: buildWhatsAppUniversalUrl(testPhone, testText),
        };
    }
  };

  const preview = getPreviewData();

  const handleTestDeliver = () => {
    // Open in new tab or trigger WhatsApp
    window.open(preview.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden space-y-6 p-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-emerald-900 text-white p-6 rounded-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[10px] font-black tracking-widest uppercase">
              <Zap className="w-3 h-3 text-emerald-400" />
              <span>100% Free WhatsApp Delivery Architecture</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Zero-Cost WhatsApp Messaging Gateway
            </h2>
            <p className="text-xs text-emerald-100/80 max-w-xl">
              Deliver fee dues with UPI pay links, emergency absent notices, and test report cards to parents with <strong className="text-white">₹0.00 subscription cost</strong> and <strong className="text-white">NO Meta API key required</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-emerald-900/60 p-2 rounded-xl border border-emerald-500/30 shrink-0">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <div className="text-xs">
              <span className="font-bold text-white block">Zero API Subscription</span>
              <span className="text-[11px] text-emerald-200">100% Free Forever</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mode Selector Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <button
          onClick={() => setActiveMode('DIRECT_FREE')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            activeMode === 'DIRECT_FREE'
              ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-600/20'
              : 'border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
              Method 1 (Instant &amp; Free)
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
              Active Now
            </span>
          </div>
          <h3 className="font-black text-slate-900 text-sm mt-1">Universal Deep Link Dispatcher</h3>
          <p className="text-xs text-slate-500 mt-1">
            0ms setup. Opens WhatsApp Web or Mobile with pre-typed message. Press Enter to send. Zero risk of Meta bans.
          </p>
        </button>

        <button
          onClick={() => setActiveMode('QR_LINKED')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            activeMode === 'QR_LINKED'
              ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-600/20'
              : 'border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Method 2 (Background Automation)
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800">
              Free (QR Session)
            </span>
          </div>
          <h3 className="font-black text-slate-900 text-sm mt-1">Linked Device QR Web Bridge</h3>
          <p className="text-xs text-slate-500 mt-1">
            Scan QR code once with your institute phone (like WhatsApp Web). Sends in background silently without API keys.
          </p>
        </button>

        <button
          onClick={() => setActiveMode('META_API')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            activeMode === 'META_API'
              ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-600/20'
              : 'border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Method 3 (Paid Meta Cloud)
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
              Official API Key
            </span>
          </div>
          <h3 className="font-black text-slate-900 text-sm mt-1">Meta Business Cloud API</h3>
          <p className="text-xs text-slate-500 mt-1">
            Only needed for Green Tick or 50,000+ daily broadcasts. Costs ₹0.40–₹0.85 per conversation.
          </p>
        </button>
      </div>

      {/* Mode 1: Interactive Live Test Dispatcher */}
      {activeMode === 'DIRECT_FREE' && (
        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-600" />
                <span>Test Live Message Delivery to Your Phone</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Type your own mobile number to verify message delivery directly to your WhatsApp.
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-100/70 px-2.5 py-1 rounded-md">
              Normalized: +{normalizeIndianPhone(testPhone)}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Enter Test Mobile Number</label>
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs">
                <span className="font-bold text-slate-500 font-mono">+91</span>
                <input
                  type="text"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder="9876543210"
                  className="w-full bg-transparent text-slate-900 font-mono font-bold focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Message Template</label>
              <select
                value={templateType}
                onChange={(e) => setTemplateType(e.target.value as any)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium"
              >
                <option value="ABSENT">🚨 Student Absent Emergency Notice</option>
                <option value="FEE">💰 Tuition Fee Due with 1-Click UPI</option>
                <option value="TEST">🏆 Weekly Test Scorecard with Rank</option>
                <option value="DEMO">🌟 Free Demo Class Invitation</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Student Name</label>
              <input
                type="text"
                value={customStudentName}
                onChange={(e) => setCustomStudentName(e.target.value)}
                placeholder="Student Name"
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium"
              />
            </div>
          </div>

          {/* Test Deliver Action Button */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-slate-500">
              Clicking will open WhatsApp Web or Desktop with the pre-filled message ready to hit send.
            </div>

            <button
              onClick={handleTestDeliver}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black text-xs shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>🚀 Deliver to My WhatsApp Now (Free)</span>
            </button>
          </div>
        </div>
      )}

      {/* Mode 2: QR Code Linked Device Bridge Explanation */}
      {activeMode === 'QR_LINKED' && (
        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 space-y-4">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="bg-white p-4 rounded-2xl border-2 border-slate-300 shadow-md text-center shrink-0">
              <div className="w-44 h-44 bg-slate-900 rounded-xl p-2 flex items-center justify-center text-white relative">
                <QrCode className="w-36 h-36 text-white" />
                {isQrPaired && (
                  <div className="absolute inset-0 bg-emerald-900/90 rounded-xl flex flex-col items-center justify-center text-white p-3 space-y-2">
                    <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                    <span className="font-bold text-xs text-center">Linked as +91 {institutePhone}</span>
                  </div>
                )}
              </div>
              <span className="text-[11px] font-bold text-slate-500 mt-2 block">
                {isQrPaired ? '🟢 Device Linked & Active' : 'Scan with WhatsApp > Linked Devices'}
              </span>
            </div>

            <div className="space-y-3 flex-1 text-xs">
              <h3 className="text-base font-black text-slate-900">
                How WhatsApp Linked Device Bridge Works (Zero Cost Background Sending)
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Just like logging into WhatsApp Web on your office computer, CoachingOS can maintain a direct WebSocket session to WhatsApp servers using open-source libraries (e.g. Baileys).
              </p>
              <div className="space-y-2 bg-white p-3 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2 font-bold text-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>100% Free: No Meta platform charges or monthly fees</span>
                </div>
                <div className="flex items-center gap-2 font-bold text-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Sends from your coaching&apos;s official phone number directly</span>
                </div>
                <div className="flex items-center gap-2 font-bold text-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Automatic background delivery when attendance is marked Absent</span>
                </div>
              </div>

              <button
                onClick={() => setIsQrPaired(!isQrPaired)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs"
              >
                {isQrPaired ? 'Unlink Device' : 'Simulate QR Device Pairing'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mode 3: Official Meta Cloud API Information */}
      {activeMode === 'META_API' && (
        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 space-y-4 text-xs">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="font-bold text-slate-900 text-sm">When is an Official Meta API Key Required?</h3>
              <p className="text-slate-600 leading-relaxed">
                An official Meta WhatsApp Business Cloud API key is <strong>NOT required</strong> for 90% of Indian coaching centers (with up to 1,000 students). It is only necessary if:
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
              <span className="font-bold text-slate-800 block">1. Green Verified Badge</span>
              <span className="text-slate-500">You want the official green checkmark next to your coaching name on WhatsApp.</span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
              <span className="font-bold text-slate-800 block">2. High-Volume Cold Blasts</span>
              <span className="text-slate-500">You are broadcasting 50,000+ promo messages per day to unknown numbers.</span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
              <span className="font-bold text-slate-800 block">3. Multi-Agent BPO Call Center</span>
              <span className="text-slate-500">You have 20 telecallers sharing one central WhatsApp inbox simultaneously.</span>
            </div>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px] font-medium">
            💡 <strong>Recommendation for CoachingOS:</strong> Use <strong>Method 1 (Universal Deep Link)</strong> or <strong>Method 2 (QR Web Session)</strong>. They deliver 100% free of cost, keep your operating expenses at ₹0, and take zero approval time from Meta.
          </div>
        </div>
      )}
    </div>
  );
}
