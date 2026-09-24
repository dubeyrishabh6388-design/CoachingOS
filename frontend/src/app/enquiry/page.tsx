'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/lib/context/AppContext';
import { db } from '@/lib/db/store';
import {
  GraduationCap,
  Sparkles,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
  CheckCircle2,
  BookOpen,
  Users,
  Award,
  ArrowRight,
  ShieldCheck,
  Check,
  Building2,
  ChevronRight,
  Star,
  Flame,
} from 'lucide-react';

export default function PublicEnquiryPage() {
  const { currentOrg, currentBranch, showToast } = useApp();

  const courses = db.getCourses(currentOrg.id);
  const batches = db.getBatches(currentOrg.id);

  const [studentName, setStudentName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [interestedCourseId, setInterestedCourseId] = useState(courses[0]?.id || '');
  const [preferredBatchTiming, setPreferredBatchTiming] = useState('EVENING');
  const [demoDate, setDemoDate] = useState('');
  const [currentGrade, setCurrentGrade] = useState('Class 11');
  const [notes, setNotes] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [referenceId, setReferenceId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim() || !phone.trim()) {
      showToast('Please fill in student name and contact phone number', 'error');
      return;
    }

    const newLead = db.createLead({
      organizationId: currentOrg.id,
      branchId: currentBranch.id,
      source: 'WEBSITE',
      studentName: studentName.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      guardianName: guardianName.trim() || undefined,
      guardianPhone: guardianPhone.trim() || undefined,
      interestedCourseId,
      stage: demoDate ? 'DEMO_SCHEDULED' : 'NEW',
      notes: `Public Web Booking. Grade: ${currentGrade}. Preferred Timing: ${preferredBatchTiming}. ${notes ? `Notes: ${notes}` : ''}`,
      followUpDate: demoDate || new Date(Date.now() + 86400000).toISOString().split('T')[0],
    });

    const genRef = `ENQ-${Date.now().toString().slice(-6)}`;
    setReferenceId(genRef);
    setIsSubmitted(true);
    showToast('Enquiry & Demo class booked successfully!', 'success');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#faf9f9] to-slate-100 text-slate-900 selection:bg-[#991b1b] selection:text-white pb-16">
      {/* ── Top Header / Brand Nav ────────────────────────────────────── */}
      <header className="bg-[#450a0a] text-white border-b border-[#2b0404] sticky top-0 z-30 shadow-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#991b1b] border border-[#dc2626] flex items-center justify-center font-bold text-white shadow-sm text-base">
              C
            </div>
            <div>
              <span className="font-extrabold text-lg text-white leading-tight block">
                {currentOrg.tradeName}
              </span>
              <span className="text-[11px] text-rose-200/80 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {currentBranch.name}, {currentBranch.city}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <a
              href={`tel:${currentBranch.phone}`}
              className="hidden sm:inline-flex items-center gap-1.5 text-xs text-rose-200 hover:text-white transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-rose-400" />
              <span>{currentBranch.phone}</span>
            </a>
            <Link
              href="/"
              className="text-xs font-bold text-rose-200 hover:text-white bg-white/10 hover:bg-white/15 px-3 py-1.5 rounded-lg transition-colors border border-white/10"
            >
              Staff Portal Login &rarr;
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero Banner ──────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#450a0a] via-[#7f1d1d] to-[#991b1b] text-white py-14 px-4 sm:px-6">
        <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center space-y-4 relative z-10">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-white/10 border border-white/20 text-rose-100 backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5 text-rose-300" />
            Admissions Open for Session 2026–2027
          </span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Crack Competitive Exams With Kota&apos;s Elite Faculty
          </h1>
          <p className="text-sm sm:text-base text-rose-100/90 max-w-2xl mx-auto font-medium">
            Join {currentOrg.tradeName}. Experience conceptual rigor, personalized doubt clearing, Sunday test series, and comprehensive study material.
          </p>

          <div className="pt-3 flex flex-wrap justify-center items-center gap-4 text-xs font-semibold text-rose-200">
            <div className="flex items-center gap-1.5 bg-black/20 px-3 py-1.5 rounded-full border border-white/10">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>100% Free Demo Lecture</span>
            </div>
            <div className="flex items-center gap-1.5 bg-black/20 px-3 py-1.5 rounded-full border border-white/10">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Merit Scholarships Up to 90%</span>
            </div>
            <div className="flex items-center gap-1.5 bg-black/20 px-3 py-1.5 rounded-full border border-white/10">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Limited 35 Students Per Batch</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content Grid ────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Courses Offered & Institute Highlights */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#991b1b]" />
              Courses &amp; Batches Available
            </h2>
            <div className="space-y-3">
              {courses.map(crs => (
                <div
                  key={crs.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-red-50/50 hover:border-red-200 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900">{crs.name}</span>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-red-100 text-[#991b1b]">
                      {crs.targetExam}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" /> {crs.durationMonths} Months
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" /> Morning &amp; Evening
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Testimonial / Credibility Box */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200 p-6 shadow-xs space-y-3">
            <div className="flex items-center gap-1 text-amber-500">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400" />
              ))}
            </div>
            <p className="text-xs text-slate-700 font-medium italic leading-relaxed">
              &quot;The personalized doubt resolution and Sunday test ranking system helped our child secure AIR 418 in JEE Advanced. Aarohan teachers truly care about student outcomes.&quot;
            </p>
            <div className="pt-2 border-t border-amber-200/60 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-900">Dr. Vikram Mehra (Parent)</span>
              <span className="text-amber-700 font-semibold">Verified Parent</span>
            </div>
          </div>

          {/* Contact Details Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3 text-xs text-slate-600">
            <h3 className="font-bold text-slate-900 text-sm">Campus Contact Information</h3>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{currentBranch.address}, {currentBranch.city}, {currentBranch.state} - {currentBranch.pincode}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{currentBranch.phone}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Counselling Desk Open: Mon–Sun 8:00 AM – 8:00 PM</span>
            </div>
          </div>
        </div>

        {/* Right Column: Admission Enquiry & Demo Booking Form */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            {isSubmitted ? (
              <div className="text-center py-10 space-y-4 animate-in zoom-in-95 duration-200">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-black text-slate-900">Enquiry Registered!</h3>
                <p className="text-sm text-slate-600 max-w-md mx-auto">
                  Thank you, <span className="font-bold text-slate-900">{studentName}</span>. Your enquiry reference ID is:
                </p>
                <div className="inline-block px-4 py-2 bg-slate-100 border border-slate-200 rounded-xl font-mono text-base font-extrabold text-[#991b1b]">
                  {referenceId}
                </div>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Our Senior Admission Counsellor will contact you at <span className="font-semibold">{phone}</span> within 2 business hours with course curriculum brochures and demo class timings.
                </p>
                <button
                  onClick={() => {
                    setIsSubmitted(false);
                    setStudentName('');
                    setPhone('');
                    setEmail('');
                    setNotes('');
                  }}
                  className="mt-4 px-6 py-2.5 rounded-xl bg-[#991b1b] text-white text-xs font-bold hover:bg-[#7f1d1d] transition-colors cursor-pointer"
                >
                  Submit Another Enquiry
                </button>
              </div>
            ) : (
              <>
                <div className="border-b border-slate-100 pb-4">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-red-50 text-[#991b1b] border border-red-200 mb-2">
                    <Flame className="w-3 h-3" /> Quick 2-Minute Form
                  </div>
                  <h2 className="text-xl font-black text-slate-900">
                    Book Free Demo Class &amp; Counselling
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Fill in your details below to schedule your trial lecture and download the detailed course curriculum brochure.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Student Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Student Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Aryan Sharma"
                        value={studentName}
                        onChange={e => setStudentName(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#991b1b]/20 text-slate-900 font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Student Mobile (WhatsApp) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="10-digit mobile number"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#991b1b]/20 text-slate-900 font-semibold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Father / Mother Name
                      </label>
                      <input
                        type="text"
                        placeholder="Parent or Guardian name"
                        value={guardianName}
                        onChange={e => setGuardianName(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#991b1b]/20 text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Parent Contact Phone
                      </label>
                      <input
                        type="tel"
                        placeholder="Guardian mobile number"
                        value={guardianPhone}
                        onChange={e => setGuardianPhone(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#991b1b]/20 text-slate-900"
                      />
                    </div>
                  </div>

                  {/* Course & Grade Selection */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Interested Target Course
                      </label>
                      <select
                        value={interestedCourseId}
                        onChange={e => setInterestedCourseId(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#991b1b]/20 text-slate-900 font-bold"
                      >
                        {courses.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.targetExam})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Current Class / School Status
                      </label>
                      <select
                        value={currentGrade}
                        onChange={e => setCurrentGrade(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#991b1b]/20 text-slate-900 font-semibold"
                      >
                        <option value="Class 9">Class 9 (Foundation)</option>
                        <option value="Class 10">Class 10 (Board + Pre-JEE)</option>
                        <option value="Class 11">Class 11 (2-Year Target)</option>
                        <option value="Class 12">Class 12 (Board + Target)</option>
                        <option value="12th Pass / Dropper">12th Pass / Dropper Batch</option>
                      </select>
                    </div>
                  </div>

                  {/* Demo Class Preferences */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Preferred Free Demo Date
                      </label>
                      <input
                        type="date"
                        value={demoDate}
                        onChange={e => setDemoDate(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#991b1b]/20 text-slate-900 font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Preferred Shift Timing
                      </label>
                      <select
                        value={preferredBatchTiming}
                        onChange={e => setPreferredBatchTiming(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#991b1b]/20 text-slate-900 font-semibold"
                      >
                        <option value="MORNING">Morning Regular (8:00 AM – 1:00 PM)</option>
                        <option value="EVENING">Evening School-Integrated (4:00 PM – 8:00 PM)</option>
                        <option value="WEEKEND">Weekend Intensive (Saturday &amp; Sunday)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Academic Background or Specific Questions
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Scored 94% in Class 10; seeking details on hostel tie-ups and scholarship test..."
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#991b1b]/20 text-slate-800"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full py-3.5 rounded-xl bg-[#991b1b] hover:bg-[#7f1d1d] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Book Free Demo &amp; Get Fee Structure</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <p className="text-center text-[11px] text-slate-400 mt-2 flex items-center justify-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      100% Privacy Protected. DPDP Act Compliant. No Spam.
                    </p>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
