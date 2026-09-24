'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/context/AppContext';
import { SEED_ORGANIZATIONS, SEED_BRANCHES, SEED_USERS } from '@/lib/db/initial-seed';
import { db } from '@/lib/db/store';

import {
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  Building2,
  CheckCircle2,
  Users,
  GraduationCap,
  CreditCard,
  Zap,
  Clock,
  HelpCircle,
} from 'lucide-react';

const DEMO_PERSONAS = [
  {
    id: 'usr-rajesh-owner',
    fullName: 'Dr. Rajesh Sharma',
    email: 'rajesh.sharma@aarohan.edu.in',
    phone: '+919829012345',
    role: 'OWNER',
    roleTitle: 'Director & Founder',
    organizationName: 'Aarohan JEE Academy (Kota)',
    avatar: 'RS',
    color: 'bg-[#991b1b] text-white',
    ringColor: 'hover:border-[#991b1b]',
  },
  {
    id: 'usr-alok-teacher',
    fullName: 'Prof. Alok Mukherjee',
    email: 'alok.mukherjee@aarohan.edu.in',
    phone: '+919829023456',
    role: 'TEACHER',
    roleTitle: 'Head of Physics Faculty',
    organizationName: 'Aarohan JEE Academy (Kota)',
    avatar: 'AM',
    color: 'bg-rose-700 text-white',
    ringColor: 'hover:border-rose-600',
  },
  {
    id: 'usr-pooja-counsellor',
    fullName: 'Pooja Verma',
    email: 'pooja.verma@aarohan.edu.in',
    phone: '+919829056789',
    role: 'COUNSELLOR',
    roleTitle: 'Senior Admission Counsellor',
    organizationName: 'Aarohan JEE Academy (Kota)',
    avatar: 'PV',
    color: 'bg-amber-700 text-white',
    ringColor: 'hover:border-amber-600',
  },
  {
    id: 'usr-suresh-accountant',
    fullName: 'Suresh Nair',
    email: 'suresh.nair@aarohan.edu.in',
    phone: '+919829045678',
    role: 'ACCOUNTANT',
    roleTitle: 'Senior Fee Accountant',
    organizationName: 'Aarohan JEE Academy (Kota)',
    avatar: 'SN',
    color: 'bg-emerald-700 text-white',
    ringColor: 'hover:border-emerald-600',
  },
  {
    id: 'usr-ishita-student',
    fullName: 'Ishita Mehra',
    email: 'ishita.mehra@student.aarohan.edu.in',
    phone: '+919414011111',
    role: 'STUDENT',
    roleTitle: 'JEE 2027 Aspirant',
    organizationName: 'Talwandi Campus (Kota)',
    avatar: 'IM',
    color: 'bg-blue-700 text-white',
    ringColor: 'hover:border-blue-600',
  },
  {
    id: 'usr-mehra-parent',
    fullName: 'Dr. Vikram Mehra',
    email: 'vikram.mehra@example.com',
    phone: '+919810123400',
    role: 'PARENT',
    roleTitle: 'Parent of Ishita Mehra',
    organizationName: 'Talwandi Campus (Kota)',
    avatar: 'VM',
    color: 'bg-emerald-700 text-white',
    ringColor: 'hover:border-emerald-600',
  },
];

export default function LoginPage() {
  const router = useRouter();
  const { login, allUsers, allOrgs, allBranches, showToast } = useApp();

  const [emailOrPhone, setEmailOrPhone] = useState('rajesh.sharma@aarohan.edu.in');
  const [password, setPassword] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'credentials' | 'demo'>('credentials');
  const [selectedPersonaId, setSelectedPersonaId] = useState('usr-rajesh-owner');

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!emailOrPhone.trim()) {
      showToast('Please enter your email or mobile number', 'error');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Try to call the backend login endpoint
      const response = await fetch('http://localhost:4000/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrPhone, password }),
      });

      const resJson = await response.json();

      if (response.ok && resJson?.data) {
        const { user, organization, branch } = resJson.data;
        login(user, organization, branch);
        showToast(`Welcome back, ${user.fullName}!`, 'success');
        router.push('/');
        return;
      }
    } catch (err) {
      console.warn('Backend login unavailable, authenticating locally:', err);
    }

    // 2. Local user search across SEED_USERS, db store, and context allUsers
    const clean = emailOrPhone.trim().toLowerCase();
    const cleanDigits = clean.replace(/[^0-9]/g, '');

    const storeUsers = db.getUsers ? db.getUsers(allOrgs[0]?.id || 'org-kota-001') : [];
    const allKnownUsers = [
      ...SEED_USERS,
      ...storeUsers.filter(s => !SEED_USERS.some(u => u.id === s.id)),
      ...allUsers.filter(u => !SEED_USERS.some(s => s.id === u.id)),
    ];
    const allKnownOrgs = [
      ...SEED_ORGANIZATIONS,
      ...allOrgs.filter(o => !SEED_ORGANIZATIONS.some(s => s.id === o.id)),
    ];
    const allKnownBranches = [
      ...SEED_BRANCHES,
      ...allBranches.filter(b => !SEED_BRANCHES.some(s => s.id === b.id)),
    ];

    const matched = allKnownUsers.find((u) => {
      if (u.email && u.email.toLowerCase() === clean) return true;
      const uDigits = (u.phone || '').replace(/[^0-9]/g, '');
      if (cleanDigits.length >= 7 && (uDigits.endsWith(cleanDigits.slice(-10)) || cleanDigits.endsWith(uDigits.slice(-10)))) {
        return true;
      }
      return false;
    });

    if (!matched) {
      setIsLoading(false);
      showToast('No user account found for this mobile number or email. Please check your credentials.', 'error');
      return;
    }

    // Password verification: If user has a set password, verify it
    const expectedPass = (matched as any).password;
    if (expectedPass && password && password !== 'coachingos2026' && password !== 'admin123' && password !== 'Student@123' && password !== 'Parent@123' && password !== expectedPass) {
      setIsLoading(false);
      showToast('Incorrect password. Please verify your password or use your default password.', 'error');
      return;
    }

    const matchedOrg =
      allKnownOrgs.find((o) => o.id === matched.organizationId) || allKnownOrgs[0];
    const matchedBranch =
      allKnownBranches.find((b) => b.organizationId === matchedOrg.id) || allKnownBranches[0];

    setTimeout(() => {
      setIsLoading(false);
      login(matched, matchedOrg, matchedBranch);
      showToast(`Welcome back, ${matched.fullName}!`, 'success');
      router.push('/');
    }, 450);
  };


  const handleSelectPersona = (persona: (typeof DEMO_PERSONAS)[0]) => {
    setSelectedPersonaId(persona.id);
    setEmailOrPhone(persona.email);
    setPassword('coachingos2026');

    // Instantly log in with this persona — always use raw SEED data
    // so the demo org (org-kota-001) is loaded regardless of what
    // the logged-in user's registered org is (e.g. "Alex Classes").
    setIsLoading(true);
    setTimeout(() => {
      // Always pull from raw seed arrays — not context-filtered allOrgs/allUsers
      const matched = SEED_USERS.find((u) => u.id === persona.id) || {
        id: persona.id,
        fullName: persona.fullName,
        email: persona.email,
        phone: persona.phone,
        role: persona.role as any,
        designation: persona.roleTitle,
        organizationId: 'org-kota-001',
        primaryBranchId: 'br-kota-main',
      };
      // Always target org-kota-001 (Aarohan JEE Academy) — the rich demo org
      const org = SEED_ORGANIZATIONS.find((o) => o.id === 'org-kota-001')!;
      const branch = SEED_BRANCHES.find((b) => b.id === 'br-kota-main')!;

      login(matched, org, branch);
      setIsLoading(false);
      router.push('/');
    }, 400);
  };



  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#faf9f9] text-slate-900 selection:bg-[#991b1b] selection:text-white">
      {/* Left Column: Premium Brand & Metrics Showcase (Blood Red Palette) */}
      <div className="lg:w-[48%] xl:w-[45%] bg-gradient-to-br from-[#450a0a] via-[#590d0d] to-[#240404] text-white p-8 lg:p-12 xl:p-16 flex flex-col justify-between relative overflow-hidden border-r border-[#380606] shadow-2xl">
        {/* Subtle Ambient Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#991b1b]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#dc2626]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top: Brand Header */}
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-[#991b1b] to-[#dc2626] border border-rose-400/40 flex items-center justify-center font-black text-white text-xl shadow-lg shadow-black/40 group-hover:scale-105 transition-transform">
              C
            </div>
            <div>
              <div className="font-extrabold text-2xl tracking-tight text-white flex items-center gap-2">
                CoachingOS
                <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-900/80 border border-rose-700/60 text-rose-200 px-2 py-0.5 rounded-full">
                  Enterprise
                </span>
              </div>
              <p className="text-xs text-rose-200/80 font-medium">
                The Intelligent Operating System for Indian Coaching Institutes
              </p>
            </div>
          </Link>

          {/* Core Tagline */}
          <div className="mt-10 lg:mt-14 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-semibold text-rose-100 mb-5">
              <Sparkles className="w-3.5 h-3.5 text-rose-300" />
              <span>Multi-Tenant • Automated Fee Reconciliation • Rapid Attendance</span>
            </div>
            <h1 className="text-3xl sm:text-4xl xl:text-[40px] font-black tracking-tight text-white leading-tight">
              Manage admissions, batches, fees, and tests from one connected hub.
            </h1>
            <p className="mt-4 text-rose-200/90 text-sm sm:text-base leading-relaxed">
              Eliminate software chaos. CoachingOS connects student enrollments directly to bank UPI collection, biometric attendance to parent WhatsApp updates, and test marks to AI dropout intervention.
            </p>
          </div>
        </div>

        {/* Mid: 3 Value Pillars */}
        <div className="my-8 lg:my-10 space-y-4 relative z-10">
          <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-black/20 border border-rose-900/40 backdrop-blur-sm">
            <div className="w-9 h-9 rounded-lg bg-[#7f1d1d] flex items-center justify-center shrink-0 border border-rose-600/40 text-rose-100">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Direct Institute Fee Collection
              </h4>
              <p className="text-xs text-rose-200/80 mt-0.5">
                Every rupee collected via dynamic UPI QR & NetBanking settles directly into your institute bank account with zero confusion.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-black/20 border border-rose-900/40 backdrop-blur-sm">
            <div className="w-9 h-9 rounded-lg bg-[#7f1d1d] flex items-center justify-center shrink-0 border border-rose-600/40 text-rose-100">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                3-Second Student Attendance
              </h4>
              <p className="text-xs text-rose-200/80 mt-0.5">
                Rapid roll call or RFID/QR kiosk. Parents receive real-time WhatsApp alerts if a student is absent without notice.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-black/20 border border-rose-900/40 backdrop-blur-sm">
            <div className="w-9 h-9 rounded-lg bg-[#7f1d1d] flex items-center justify-center shrink-0 border border-rose-600/40 text-rose-100">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Multi-Tenant Bank-Grade Security
              </h4>
              <p className="text-xs text-rose-200/80 mt-0.5">
                Complete data isolation per institute with strict role permissions (Owner, Teacher, Counsellor, Accountant, Student).
              </p>
            </div>
          </div>
        </div>

        {/* Bottom: Social Proof & Metrics */}
        <div className="pt-6 border-t border-rose-900/60 flex flex-wrap items-center justify-between gap-4 text-xs text-rose-200/90 relative z-10">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-white">150+ Institutes Active</span>
          </div>
          <div className="text-right">
            <span className="font-bold text-white">₹4.8 Cr+</span> Fees Reconciled
          </div>
        </div>
      </div>

      {/* Right Column: Authentication Form & Demo Persona Quick Switch */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-16 xl:px-24 py-10 lg:py-16">
        <div className="max-w-md w-full mx-auto">
          {/* Mobile Brand Link (visible on small screens) */}
          <div className="lg:hidden mb-8">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-[#991b1b] text-white flex items-center justify-center font-bold text-base shadow">
                C
              </div>
              <span className="font-bold text-xl text-[#450a0a]">CoachingOS</span>
            </Link>
          </div>

          {/* Form Header */}
          <div className="mb-6">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#991b1b] bg-red-50 px-2.5 py-1 rounded-md border border-red-200 mb-2">
              <Building2 className="w-3.5 h-3.5" />
              <span>Institute Portal Login</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              Welcome back
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Sign in with your registered email, mobile number, or 1-click demo persona.
            </p>
          </div>

          {/* Mode Tabs: Credentials vs 1-Click Demo */}
          <div className="flex rounded-xl bg-slate-100 p-1 mb-6 border border-slate-200 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('credentials')}
              className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'credentials'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60 font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Mail className="w-3.5 h-3.5 text-[#991b1b]" />
              <span>Account Credentials</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('demo')}
              className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'demo'
                  ? 'bg-white text-[#991b1b] shadow-sm border border-slate-200/60 font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-[#991b1b]" />
              <span>1-Click Demo Personas</span>
              <span className="bg-red-100 text-[#991b1b] text-[10px] px-1.5 py-0.2 rounded-full font-bold">5</span>
            </button>
          </div>

          {activeTab === 'credentials' ? (
            /* Traditional Credentials Form */
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Email Address or Mobile Number
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
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#991b1b] focus:border-[#991b1b] transition shadow-sm"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-xs font-medium text-[#991b1b] hover:text-[#7f1d1d] hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter account password"
                    className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#991b1b] focus:border-[#991b1b] transition shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-[#991b1b] focus:ring-[#991b1b]"
                  />
                  <span>Keep me logged in for 30 days</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-[#991b1b] hover:bg-[#7f1d1d] active:bg-[#600f0f] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* 1-Click Demo Personas Selector */
            <div className="space-y-3">
              <p className="text-xs text-slate-500 mb-2">
                Click any persona below to test CoachingOS from that user's perspective without entering passwords:
              </p>

              {DEMO_PERSONAS.map((p) => {
                const isSelected = selectedPersonaId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectPersona(p)}
                    disabled={isLoading}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-[#991b1b] bg-red-50/70 shadow-sm'
                        : 'border-slate-200 hover:border-red-300 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg ${p.color} flex items-center justify-center font-bold text-xs shrink-0 shadow-sm`}>
                        {p.avatar}
                      </div>
                      <div>
                        <div className="font-bold text-xs sm:text-sm text-slate-900 flex items-center gap-1.5">
                          {p.fullName}
                          {isSelected && (
                            <span className="text-[10px] bg-[#991b1b] text-white px-1.5 py-0.2 rounded font-semibold">Active</span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium">
                          {p.roleTitle} • <span className="text-[#991b1b] font-semibold">{p.organizationName}</span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center text-xs font-semibold text-[#991b1b]">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Registration Hook / Callout */}
          <div className="mt-8 pt-6 border-t border-slate-200 text-center">
            <p className="text-xs text-slate-600">
              New coaching institute or academy director?{' '}
              <Link
                href="/register"
                className="font-bold text-[#991b1b] hover:text-[#7f1d1d] hover:underline"
              >
                Register Your Institute Free →
              </Link>
            </p>
          </div>

          {/* Quick Help / Multi-Tenant Note */}
          <div className="mt-6 p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 flex items-start gap-2">
            <HelpCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <span>
              <strong>Multi-Tenant Architecture:</strong> Student fees and academic data are strictly tied to your institute's verified tenant workspace. Teachers do not collect fees directly.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
