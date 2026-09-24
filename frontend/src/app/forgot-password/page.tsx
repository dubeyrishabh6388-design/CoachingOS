'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/context/AppContext';
import {
  Mail,
  ArrowRight,
  ArrowLeft,
  Building2,
  CheckCircle2,
  Lock,
  KeyRound,
  Sparkles,
} from 'lucide-react';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { showToast } = useApp();

  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [demoOtp, setDemoOtp] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrPhone.trim()) {
      showToast('Please enter your registered email or phone', 'error');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        'http://localhost:4000/api/v1/auth/forgot-password',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emailOrPhone }),
        }
      );
      const resJson = await response.json();
      if (response.ok && resJson?.data) {
        setDemoOtp(resJson.data.demoOtp || '492815');
      }
    } catch (err) {
      console.warn('Backend offline, using fallback OTP:', err);
      setDemoOtp('492815');
    }

    setTimeout(() => {
      setIsLoading(false);
      setSubmitted(true);
      showToast(`Password reset code generated for ${emailOrPhone}`, 'info');
    }, 400);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#faf9f9] text-slate-900 px-4 py-12 selection:bg-[#991b1b] selection:text-white">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-xl p-8 sm:p-10 relative overflow-hidden">
        {/* Top accent bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#450a0a] via-[#991b1b] to-[#dc2626]" />

        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link href="/login" className="inline-flex items-center gap-2.5 mb-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#991b1b] to-[#dc2626] border border-rose-300/40 flex items-center justify-center font-extrabold text-white shadow-md group-hover:scale-105 transition-transform">
              C
            </div>
            <span className="font-extrabold text-xl text-slate-900 tracking-tight">
              CoachingOS
            </span>
          </Link>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Reset Portal Password
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Enter your registered coaching institute work email or mobile number.
          </p>
        </div>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Work Email or Mobile Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                  placeholder="director@institute.edu.in or 9829012345"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#991b1b] focus:border-[#991b1b] transition shadow-sm font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-[#991b1b] hover:bg-[#7f1d1d] active:bg-[#600f0f] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying Account...</span>
                </>
              ) : (
                <>
                  <span>Send Reset Instructions</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          <div className="space-y-5 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 text-[#991b1b] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">Verification Code Sent</h3>
              <p className="text-xs text-slate-500 mt-1">
                We've sent a 6-digit verification code to <strong>{emailOrPhone}</strong>.
              </p>
            </div>

            {demoOtp && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-left">
                <div className="text-[11px] font-bold text-[#991b1b] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Instant Verification Code</span>
                </div>
                <div className="text-xl font-mono font-black text-slate-900 tracking-widest text-center py-1">
                  {demoOtp}
                </div>
                <p className="text-[11px] text-slate-500 text-center">
                  Valid for 10 minutes. Use this code to authenticate or sign in directly.
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={() => router.push('/login')}
              className="w-full py-2.5 px-4 rounded-xl bg-[#991b1b] hover:bg-[#7f1d1d] text-white font-bold text-sm shadow transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Proceed to Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="mt-6 pt-5 border-t border-slate-200 text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#991b1b] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Login</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
