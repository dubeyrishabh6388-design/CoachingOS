'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/context/AppContext';
import {
  Building2,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Lock,
  Mail,
  Phone,
  User,
  MapPin,
  GraduationCap,
  CreditCard,
  Zap,
  HelpCircle,
  Eye,
  EyeOff,
} from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { registerInstitute, showToast } = useApp();

  const [step, setStep] = useState<1 | 2>(1);
  const [isLoading, setIsLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    instituteName: '',
    legalName: '',
    directorName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    city: 'Kota',
    state: 'Rajasthan',
    studentTier: 'GROWTH',
    targetExam: 'JEE_NEET',
    campusName: 'Main Campus',
    acceptTerms: true,
  });

  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.instituteName.trim()) {
      showToast('Please enter your Coaching Institute Name', 'error');
      return;
    }
    if (!formData.city.trim()) {
      showToast('Please specify your institute primary city', 'error');
      return;
    }
    setStep(2);
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.directorName.trim()) {
      showToast('Please enter Director / Owner Name', 'error');
      return;
    }
    if (!formData.email.trim()) {
      showToast('Please provide an official email address', 'error');
      return;
    }
    if (!formData.phone.trim()) {
      showToast('Please provide a contact phone number', 'error');
      return;
    }
    if (formData.password.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    setIsLoading(true);

    try {
      const result = await registerInstitute({
        instituteName: formData.instituteName,
        legalName: formData.legalName || `${formData.instituteName} Educational Academy`,
        directorName: formData.directorName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        city: formData.city,
        state: formData.state,
        studentTier: formData.studentTier,
      });

      if (result.success) {
        showToast(
          `Welcome to CoachingOS! ${formData.instituteName} is now live.`,
          'success'
        );
        router.push('/');
      }
    } catch (err: any) {
      showToast(err.message || 'Registration failed. Please retry.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#faf9f9] text-slate-900 selection:bg-[#991b1b] selection:text-white">
      {/* Left Column: Institute Value & Feature Showcase (Blood Red Gradient) */}
      <div className="lg:w-[45%] xl:w-[42%] bg-gradient-to-br from-[#450a0a] via-[#590d0d] to-[#240404] text-white p-8 lg:p-12 xl:p-14 flex flex-col justify-between relative overflow-hidden border-r border-[#380606] shadow-2xl">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#991b1b]/20 rounded-full blur-3xl pointer-events-none" />

        {/* Brand */}
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-[#991b1b] to-[#dc2626] border border-rose-400/40 flex items-center justify-center font-black text-white text-xl shadow-lg shadow-black/40 group-hover:scale-105 transition-transform">
              C
            </div>
            <div>
              <div className="font-extrabold text-2xl tracking-tight text-white flex items-center gap-2">
                CoachingOS
                <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-900/80 border border-rose-700/60 text-rose-200 px-2 py-0.5 rounded-full">
                  Registration
                </span>
              </div>
              <p className="text-xs text-rose-200/80 font-medium">
                The Intelligent Operating System for Indian Coaching Institutes
              </p>
            </div>
          </Link>

          {/* Heading */}
          <div className="mt-10 lg:mt-12 max-w-lg">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-semibold text-rose-100 mb-4">
              <Sparkles className="w-3.5 h-3.5 text-rose-300" />
              <span>Launch your Institute Portal in under 2 minutes</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-tight">
              Start running your coaching academy on autopilot.
            </h1>
            <p className="mt-3 text-rose-200/90 text-sm leading-relaxed">
              Join 150+ premier Indian institutes who replaced multiple disjointed tools with one synchronized platform for fees, attendance, batches, and parent messaging.
            </p>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="my-8 space-y-3.5 relative z-10">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-black/20 border border-rose-900/40 backdrop-blur-sm">
            <div className="w-8 h-8 rounded-lg bg-[#7f1d1d] flex items-center justify-center shrink-0 border border-rose-600/40 text-rose-100">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Direct Institute Fee Settlement
              </h4>
              <p className="text-xs text-rose-200/80 mt-0.5">
                Dynamic UPI QR codes credit directly to your institute's bank account with zero middleman holding and automatic receipt generation.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-black/20 border border-rose-900/40 backdrop-blur-sm">
            <div className="w-8 h-8 rounded-lg bg-[#7f1d1d] flex items-center justify-center shrink-0 border border-rose-600/40 text-rose-100">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Automated Parent WhatsApp Alerts
              </h4>
              <p className="text-xs text-rose-200/80 mt-0.5">
                Instant SMS and WhatsApp delivery for daily attendance, test scorecard releases, and upcoming installment reminders.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-black/20 border border-rose-900/40 backdrop-blur-sm">
            <div className="w-8 h-8 rounded-lg bg-[#7f1d1d] flex items-center justify-center shrink-0 border border-rose-600/40 text-rose-100">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Multi-Branch Center Management
              </h4>
              <p className="text-xs text-rose-200/80 mt-0.5">
                Expand across campuses seamlessly. Monitor admissions, revenue, and teacher schedules per branch or as a central headquarters.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Guarantee */}
        <div className="pt-4 border-t border-rose-900/60 flex items-center justify-between text-xs text-rose-200/90 relative z-10">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Bank-Grade Multi-Tenant Isolation</span>
          </div>
          <span className="font-semibold text-white">Zero Setup Fee</span>
        </div>
      </div>

      {/* Right Column: Multi-Step Registration Form */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-16 xl:px-20 py-10 lg:py-14">
        <div className="max-w-xl w-full mx-auto">
          {/* Form Header */}
          <div className="mb-6">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#991b1b] bg-red-50 px-2.5 py-1 rounded-md border border-red-200 mb-2">
              <Building2 className="w-3.5 h-3.5" />
              <span>Institute Onboarding</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              Register Your Coaching Institute
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Create your dedicated multi-tenant institute workspace in 2 steps.
            </p>
          </div>

          {/* Stepper Indicator */}
          <div className="flex items-center gap-3 mb-8">
            <div className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  step === 1
                    ? 'bg-[#991b1b] text-white shadow-sm'
                    : 'bg-emerald-600 text-white'
                }`}
              >
                {step === 2 ? <CheckCircle2 className="w-4 h-4" /> : '1'}
              </div>
              <span className={`text-xs font-bold ${step === 1 ? 'text-[#991b1b]' : 'text-slate-700'}`}>
                Institute Profile
              </span>
            </div>

            <div className="flex-1 h-[2px] bg-slate-200" />

            <div className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  step === 2
                    ? 'bg-[#991b1b] text-white shadow-sm'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                2
              </div>
              <span className={`text-xs font-bold ${step === 2 ? 'text-[#991b1b]' : 'text-slate-400'}`}>
                Director Account
              </span>
            </div>
          </div>

          {/* Step 1: Institute Information */}
          {step === 1 ? (
            <form onSubmit={handleStep1Submit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Institute Brand / Trade Name *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    name="instituteName"
                    required
                    value={formData.instituteName}
                    onChange={handleInputChange}
                    placeholder="e.g. Apex IIT-JEE & Medical Academy"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#991b1b] focus:border-[#991b1b] transition shadow-sm font-medium"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  This brand name will appear on student fee receipts, ID cards, and tests.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Legal Registered Entity Name (Optional)
                </label>
                <input
                  type="text"
                  name="legalName"
                  value={formData.legalName}
                  onChange={handleInputChange}
                  placeholder="e.g. Apex Career Education Pvt Ltd"
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#991b1b] focus:border-[#991b1b] transition shadow-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Primary City / Hub *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      name="city"
                      required
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="e.g. Kota, Pune, Delhi"
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#991b1b] focus:border-[#991b1b] transition shadow-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    State
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    placeholder="e.g. Rajasthan, Maharashtra"
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#991b1b] focus:border-[#991b1b] transition shadow-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Approximate Students
                  </label>
                  <select
                    name="studentTier"
                    value={formData.studentTier}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#991b1b] focus:border-[#991b1b] transition shadow-sm"
                  >
                    <option value="STARTER">1 – 150 Students (Single Branch)</option>
                    <option value="GROWTH">150 – 600 Students (Growing)</option>
                    <option value="PRO_INSTITUTE">600 – 2,000 Students (Multi-Batch)</option>
                    <option value="MULTI_BRANCH">2,000+ Students (Multi-Branch Hub)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Primary Academic Focus
                  </label>
                  <select
                    name="targetExam"
                    value={formData.targetExam}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#991b1b] focus:border-[#991b1b] transition shadow-sm"
                  >
                    <option value="JEE_NEET">IIT-JEE & NEET UG</option>
                    <option value="FOUNDATION">CBSE & ICSE Class 8-10 Foundation</option>
                    <option value="COMMERCE">Commerce, CA & CS</option>
                    <option value="GOVT_EXAM">UPSC, Banking & SSC</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-4 py-3 px-4 rounded-xl bg-[#991b1b] hover:bg-[#7f1d1d] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Continue to Director Account</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            /* Step 2: Director Credentials */
            <form onSubmit={handleFinalSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Managing Director / Founder Full Name *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    name="directorName"
                    required
                    value={formData.directorName}
                    onChange={handleInputChange}
                    placeholder="e.g. Dr. Ramesh Verma"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#991b1b] focus:border-[#991b1b] transition shadow-sm font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Official Work Email *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="director@institute.edu.in"
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#991b1b] focus:border-[#991b1b] transition shadow-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Mobile Number (SMS / WhatsApp) *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Phone className="w-4 h-4" />
                    </div>
                    <input
                      type="tel"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+91 98290 12345"
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#991b1b] focus:border-[#991b1b] transition shadow-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Create Password *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      required
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Minimum 6 characters"
                      className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#991b1b] focus:border-[#991b1b] transition shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      required
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="Re-enter password"
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#991b1b] focus:border-[#991b1b] transition shadow-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className="pt-2">
                <label className="flex items-start gap-2 cursor-pointer text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={formData.acceptTerms}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, acceptTerms: e.target.checked }))
                    }
                    className="w-4 h-4 rounded border-slate-300 text-[#991b1b] focus:ring-[#991b1b] mt-0.5"
                  />
                  <span>
                    I agree to the CoachingOS Terms of Service, Multi-Tenant Institute Data Isolation Policy, and Student Privacy Compliance.
                  </span>
                </label>
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  disabled={isLoading}
                  className="py-3 px-5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-100 transition cursor-pointer"
                >
                  Back
                </button>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-3 px-4 rounded-xl bg-[#991b1b] hover:bg-[#7f1d1d] active:bg-[#600f0f] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Creating Institute Portal...</span>
                    </>
                  ) : (
                    <>
                      <span>Complete Registration & Launch</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Already have an account */}
          <div className="mt-8 pt-6 border-t border-slate-200 text-center">
            <p className="text-xs text-slate-600">
              Already registered your coaching institute?{' '}
              <Link
                href="/login"
                className="font-bold text-[#991b1b] hover:text-[#7f1d1d] hover:underline"
              >
                Sign In to Your Portal →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
