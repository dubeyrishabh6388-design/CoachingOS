'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/context/AppContext';
import { 
  Search, 
  Users, 
  GraduationCap, 
  CreditCard, 
  CalendarCheck, 
  FileCheck2, 
  Sparkles,
  Layers,
  ArrowRight,
  X
} from 'lucide-react';

import { db } from '@/lib/db/store';

interface SearchItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'Students' | 'Leads' | 'Finance' | 'Academics' | 'Staff' | 'Actions';
  href: string;
}

export default function CommandPalette() {
  const router = useRouter();
  const { currentOrg } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const searchItems = React.useMemo<SearchItem[]>(() => {
    const students = db.getStudents(currentOrg.id);
    const leads = db.getLeads(currentOrg.id);
    const batches = db.getBatches(currentOrg.id);
    const users = db.getUsers(currentOrg.id);

    const studentItems: SearchItem[] = students.map((s) => ({
      id: `stu-${s.id}`,
      title: s.fullName,
      subtitle: `Roll: ${s.rollNumber} • ${s.guardianName ? `Parent: ${s.guardianName} • ` : ''}Status: ${s.status}`,
      category: 'Students',
      href: `/students/${s.id}`,
    }));

    const leadItems: SearchItem[] = leads.map((l) => ({
      id: `lead-${l.id}`,
      title: l.studentName,
      subtitle: `CRM Enquiry • ${l.phone} • Stage: ${l.stage.replace('_', ' ')}`,
      category: 'Leads',
      href: '/admissions',
    }));

    const batchItems: SearchItem[] = batches.map((b) => ({
      id: `batch-${b.id}`,
      title: b.name,
      subtitle: `Batch Code: ${b.code} • Capacity: ${b.currentEnrollment}/${b.maxCapacity}`,
      category: 'Academics',
      href: '/academics/batches',
    }));

    const staffItems: SearchItem[] = users.map((u) => ({
      id: `user-${u.id}`,
      title: u.fullName,
      subtitle: `Staff • ${u.role} • ${u.email}`,
      category: 'Staff',
      href: '/staff',
    }));

    const actionItems: SearchItem[] = [
      { id: 'act-1', title: 'New Student Admission', subtitle: 'Enroll student directly or convert lead', category: 'Actions', href: '/admissions' },
      { id: 'act-2', title: 'Collect Fees via Dynamic UPI POS', subtitle: 'Scan instant QR for tuition payment', category: 'Finance', href: '/finance' },
      { id: 'act-3', title: 'Mark Batch Attendance', subtitle: 'Rapid 1-tap roll call & WhatsApp blast', category: 'Academics', href: '/academics/attendance' },
      { id: 'act-4', title: 'Interactive Weekly Timetable', subtitle: 'Lecture hall schedule & substitute faculty', category: 'Academics', href: '/academics/timetable' },
      { id: 'act-5', title: 'Homework & Assignments', subtitle: 'Assign practice DPPs & grade submissions', category: 'Academics', href: '/academics/homework' },
      { id: 'act-6', title: 'Test Series & Topper Flyers', subtitle: 'Exam ranking & marketing posters', category: 'Academics', href: '/academics/tests' },
      { id: 'act-7', title: 'Ask AI Copilot Assistant', subtitle: 'Dropout analysis & auto worksheet generator', category: 'Actions', href: '/copilot' },
      { id: 'act-8', title: 'Business Expenses & Overhead', subtitle: 'Track rent, teacher salaries, marketing', category: 'Finance', href: '/expenses' },
      { id: 'act-9', title: 'Institute Reports & Analytics', subtitle: 'Performance, collections, academic trends', category: 'Actions', href: '/reports' },
      { id: 'act-10', title: 'Public Admission & Demo Booking', subtitle: 'Prospective student web booking page', category: 'Actions', href: '/enquiry' },
    ];

    return [...studentItems, ...leadItems, ...batchItems, ...staffItems, ...actionItems];
  }, [currentOrg.id]);

  const filteredItems = searchItems.filter(item => 
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.subtitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );


  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelect = (item: SearchItem) => {
    setIsOpen(false);
    setSearchTerm('');
    router.push(item.href);
  };

  return (
    <>
      {/* Search Input Trigger in Navbar with Blood Red Theme */}
      <button
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-between text-xs text-rose-200/90 bg-[#2c0505] hover:bg-[#5c0a0a] border border-[#7f1d1d] hover:border-rose-400/50 px-3 py-1.5 rounded-lg transition-all shadow-inner group"
      >
        <div className="flex items-center gap-2 truncate">
          <Search className="w-3.5 h-3.5 text-rose-300 group-hover:text-white shrink-0" />
          <span className="truncate text-rose-200/90 group-hover:text-white">Search students, leads, payments...</span>
        </div>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[10px] text-rose-200 font-mono bg-[#450a0a] px-1.5 py-0.5 rounded border border-[#7f1d1d] shadow-sm ml-2 shrink-0">
          ⌘K
        </kbd>
      </button>

      {/* Modal Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-start justify-center pt-20 p-4 animate-in fade-in duration-150">
          <div 
            className="fixed inset-0" 
            onClick={() => setIsOpen(false)} 
          />
          <div className="relative w-full max-w-xl bg-white border border-rose-100 rounded-2xl shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-150">
            {/* Input Header with Blood Red Theme */}
            <div className="flex items-center px-4 py-3.5 bg-[#450a0a] border-b border-[#2b0404] gap-3 text-white">
              <Search className="w-4 h-4 text-rose-300 shrink-0" />
              <input
                type="text"
                autoFocus
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Type a student name, invoice, or action..."
                className="w-full bg-transparent text-sm text-white placeholder-rose-200/60 focus:outline-none font-medium"
              />
              <button
                onClick={() => setIsOpen(false)}
                className="text-rose-300 hover:text-white p-1 rounded-md transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Results List */}
            <div className="max-h-80 overflow-y-auto p-2 divide-y divide-slate-50">
              {filteredItems.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No matching results found for "{searchTerm}"
                </div>
              ) : (
                filteredItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    className="w-full text-left px-3 py-2.5 rounded-xl flex items-center justify-between hover:bg-[#fff1f2] group transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 group-hover:bg-[#ffe4e6] group-hover:text-[#991b1b] flex items-center justify-center shrink-0 transition-colors">
                        {item.category === 'Students' && <GraduationCap className="w-4 h-4" />}
                        {item.category === 'Leads' && <Users className="w-4 h-4" />}
                        {item.category === 'Finance' && <CreditCard className="w-4 h-4" />}
                        {item.category === 'Actions' && <Sparkles className="w-4 h-4" />}
                        {item.category === 'Academics' && <Layers className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-slate-800 group-hover:text-[#4c0519] truncate">
                          {item.title}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {item.subtitle}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <span className="text-[10px] font-medium text-slate-400 bg-slate-100 group-hover:bg-[#ffe4e6] group-hover:text-[#991b1b] px-2 py-0.5 rounded-full transition-colors">
                        {item.category}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#991b1b] transition-colors" />
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-4 py-2.5 bg-[#fff1f2] border-t border-rose-100 text-[11px] text-[#991b1b] flex items-center justify-between font-semibold">
              <span>Navigate with arrow keys</span>
              <span>ESC to close</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
