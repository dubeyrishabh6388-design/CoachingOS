'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/lib/context/AppContext';
import { db } from '@/lib/db/store';
import {
  Building2,
  Users,
  Zap,
  Megaphone,
  Package,
  Receipt,
  Plus,
  X,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  Calendar,
  Search,
  Filter,
  Edit2,
  Trash2,
  DollarSign,
  BarChart3,
  AlertCircle,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────

type ExpenseCategory = 'RENT' | 'SALARIES' | 'UTILITIES' | 'MARKETING' | 'SUPPLIES' | 'OTHER';

interface Expense {
  id: string;
  organizationId: string;
  category: ExpenseCategory;
  description: string;
  amountPaise: number;
  date: string;
  paidTo: string;
  receiptNo: string;
}

// ─── Category Config ─────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<ExpenseCategory, { label: string; Icon: React.FC<any>; color: string; bg: string; border: string }> = {
  RENT:      { label: 'Rent',      Icon: Building2,  color: 'text-violet-700', bg: 'bg-violet-50',  border: 'border-violet-200' },
  SALARIES:  { label: 'Salaries',  Icon: Users,      color: 'text-blue-700',   bg: 'bg-blue-50',    border: 'border-blue-200'   },
  UTILITIES: { label: 'Utilities', Icon: Zap,        color: 'text-amber-700',  bg: 'bg-amber-50',   border: 'border-amber-200'  },
  MARKETING: { label: 'Marketing', Icon: Megaphone,  color: 'text-pink-700',   bg: 'bg-pink-50',    border: 'border-pink-200'   },
  SUPPLIES:  { label: 'Supplies',  Icon: Package,    color: 'text-teal-700',   bg: 'bg-teal-50',    border: 'border-teal-200'   },
  OTHER:     { label: 'Other',     Icon: Receipt,    color: 'text-slate-700',  bg: 'bg-slate-50',   border: 'border-slate-200'  },
};

// ─── Seed Data ───────────────────────────────────────────────────────────────

const SEED_EXPENSES: Expense[] = [
  { id: 'exp-001', organizationId: 'org-kota-001', category: 'RENT',      description: 'Talwandi Centre Monthly Rent',      amountPaise: 8500000,  date: '2026-09-01', paidTo: 'Ramesh Properties Pvt Ltd',    receiptNo: 'RCPT-2609-001' },
  { id: 'exp-002', organizationId: 'org-kota-001', category: 'SALARIES',  description: 'Teaching Faculty Salaries – Sep',   amountPaise: 28000000, date: '2026-09-05', paidTo: 'Bank Transfer – Staff Account', receiptNo: 'RCPT-2609-002' },
  { id: 'exp-003', organizationId: 'org-kota-001', category: 'UTILITIES', description: 'Electricity Bill – September',       amountPaise: 1200000,  date: '2026-09-08', paidTo: 'KESCO Discom',                 receiptNo: 'RCPT-2609-003' },
  { id: 'exp-004', organizationId: 'org-kota-001', category: 'MARKETING', description: 'Meta Ads – JEE 2027 Campaign',       amountPaise: 3500000,  date: '2026-09-10', paidTo: 'Meta Platforms India',         receiptNo: 'RCPT-2609-004' },
  { id: 'exp-005', organizationId: 'org-kota-001', category: 'SUPPLIES',  description: 'Study Material Printing – Batch A', amountPaise: 650000,   date: '2026-09-14', paidTo: 'Kapoor Digital Printers',      receiptNo: 'RCPT-2609-005' },
  { id: 'exp-006', organizationId: 'org-kota-001', category: 'OTHER',     description: 'Office Pantry & Refreshments',       amountPaise: 280000,   date: '2026-09-18', paidTo: 'Cash Expenses',                receiptNo: 'RCPT-2609-006' },
  // Last month expenses (August)
  { id: 'exp-007', organizationId: 'org-kota-001', category: 'RENT',      description: 'Talwandi Centre Monthly Rent',      amountPaise: 8500000,  date: '2026-08-01', paidTo: 'Ramesh Properties Pvt Ltd',    receiptNo: 'RCPT-2608-001' },
  { id: 'exp-008', organizationId: 'org-kota-001', category: 'SALARIES',  description: 'Teaching Faculty Salaries – Aug',   amountPaise: 26500000, date: '2026-08-05', paidTo: 'Bank Transfer – Staff Account', receiptNo: 'RCPT-2608-002' },
  { id: 'exp-009', organizationId: 'org-kota-001', category: 'UTILITIES', description: 'Electricity Bill – August',          amountPaise: 1450000,  date: '2026-08-08', paidTo: 'KESCO Discom',                 receiptNo: 'RCPT-2608-003' },
  { id: 'exp-010', organizationId: 'org-kota-001', category: 'MARKETING', description: 'Newspaper Insertions – Aug',         amountPaise: 1800000,  date: '2026-08-12', paidTo: 'Dainik Bhaskar Kota',          receiptNo: 'RCPT-2608-004' },
];

// ─── Formatters ───────────────────────────────────────────────────────────────

const formatRupees = (paise: number) => `₹${Math.round(paise / 100).toLocaleString('en-IN')}`;
const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

// ─── Component ───────────────────────────────────────────────────────────────

export default function ExpensesPage() {
  const { currentOrg, showToast } = useApp();

  // ── State ────────────────────────────────────────────────────────────────
  const [expenses, setExpenses] = useState<Expense[]>(() =>
    SEED_EXPENSES.filter(e => e.organizationId === 'org-kota-001')
  );
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1); // 1-12
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [categoryFilter, setCategoryFilter] = useState<ExpenseCategory | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading] = useState(false);

  // ── Form state ───────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    category: 'RENT' as ExpenseCategory,
    description: '',
    amountRupees: '',
    date: new Date().toISOString().split('T')[0],
    paidTo: '',
    receiptNo: '',
  });
  const [formErrors, setFormErrors] = useState<Partial<typeof form>>({});

  // ── Derived Data ─────────────────────────────────────────────────────────
  const thisMonthExpenses = useMemo(() =>
    expenses.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear;
    }), [expenses, selectedMonth, selectedYear]);

  const lastMonthExpenses = useMemo(() => {
    const prevMonth = selectedMonth === 1 ? 12 : selectedMonth - 1;
    const prevYear  = selectedMonth === 1 ? selectedYear - 1 : selectedYear;
    return expenses.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() + 1 === prevMonth && d.getFullYear() === prevYear;
    });
  }, [expenses, selectedMonth, selectedYear]);

  const totalThisMonth = useMemo(() => thisMonthExpenses.reduce((s, e) => s + e.amountPaise, 0), [thisMonthExpenses]);
  const totalLastMonth = useMemo(() => lastMonthExpenses.reduce((s, e) => s + e.amountPaise, 0), [lastMonthExpenses]);

  const categoryTotals = useMemo(() => {
    const map: Partial<Record<ExpenseCategory, number>> = {};
    for (const exp of thisMonthExpenses) {
      map[exp.category] = (map[exp.category] || 0) + exp.amountPaise;
    }
    return map;
  }, [thisMonthExpenses]);

  const MONTHLY_TARGET_PAISE = 45000000; // ₹4,50,000 target

  // Revenue: sum of invoices paid this month
  const invoices = db.getInvoices(currentOrg.id);
  const totalRevenue = useMemo(() => {
    return invoices
      .filter(inv => {
        if (!inv.createdAt) return false;
        const d = new Date(inv.createdAt);
        return d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear;
      })
      .reduce((s, inv) => s + inv.paidAmountPaise, 0);
  }, [invoices, selectedMonth, selectedYear]);

  const netPosition = totalRevenue - totalThisMonth;

  // Filtered table rows
  const filteredExpenses = useMemo(() => {
    return thisMonthExpenses.filter(exp => {
      const matchCat = categoryFilter === 'ALL' || exp.category === categoryFilter;
      const q = searchQuery.toLowerCase();
      const matchSearch = !q || exp.description.toLowerCase().includes(q) || exp.paidTo.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [thisMonthExpenses, categoryFilter, searchQuery]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const validateForm = () => {
    const errs: Partial<typeof form> = {};
    if (!form.description.trim()) errs.description = 'Required';
    if (!form.amountRupees || Number(form.amountRupees) <= 0) errs.amountRupees = 'Enter valid amount';
    if (!form.date) errs.date = 'Required';
    if (!form.paidTo.trim()) errs.paidTo = 'Required';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleAddExpense = () => {
    if (!validateForm()) return;
    const newExp: Expense = {
      id: `exp-${Date.now()}`,
      organizationId: currentOrg.id,
      category: form.category,
      description: form.description.trim(),
      amountPaise: Math.round(Number(form.amountRupees) * 100),
      date: form.date,
      paidTo: form.paidTo.trim(),
      receiptNo: form.receiptNo.trim() || `RCPT-${Date.now().toString().slice(-6)}`,
    };
    setExpenses(prev => [newExp, ...prev]);
    setIsModalOpen(false);
    setForm({ category: 'RENT', description: '', amountRupees: '', date: new Date().toISOString().split('T')[0], paidTo: '', receiptNo: '' });
    setFormErrors({});
    showToast(`Expense recorded: ${formatRupees(newExp.amountPaise)}`, 'success');
  };

  const handleDelete = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    showToast('Expense deleted', 'info');
  };

  const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  const deltaPercent = totalLastMonth > 0 ? Math.round(((totalThisMonth - totalLastMonth) / totalLastMonth) * 100) : 0;
  const isOverTarget = totalThisMonth > MONTHLY_TARGET_PAISE;

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 animate-pulse">
        <div className="h-10 bg-slate-200 rounded-xl w-72" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-2xl" />
          ))}
        </div>
        <div className="h-72 bg-slate-200 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ─── Header ─────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Receipt className="w-6 h-6 text-rose-700" />
              Business Expenses &amp; Overhead
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">Track and categorize your institute's operating costs</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Month / Year Selector */}
            <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-xl px-3 py-2">
              <Calendar className="w-4 h-4 text-slate-500" />
              <select
                value={selectedMonth}
                onChange={e => setSelectedMonth(Number(e.target.value))}
                className="text-sm font-medium text-slate-700 bg-transparent border-none outline-none cursor-pointer"
              >
                {MONTH_NAMES.map((m, i) => (
                  <option key={m} value={i + 1}>{m}</option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={e => setSelectedYear(Number(e.target.value))}
                className="text-sm font-medium text-slate-700 bg-transparent border-none outline-none cursor-pointer"
              >
                {[2024, 2025, 2026, 2027].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-[#991b1b] hover:bg-[#7f1d1d] text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Expense
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">

        {/* ─── KPI Cards ────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {/* Total This Month */}
          <div className="col-span-2 md:col-span-1 xl:col-span-1 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total This Month</p>
              <DollarSign className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{formatRupees(totalThisMonth)}</p>
            <div className={`flex items-center gap-1 text-xs font-medium ${deltaPercent > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {deltaPercent > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {Math.abs(deltaPercent)}% vs last month
            </div>
            {isOverTarget && (
              <div className="flex items-center gap-1 text-xs text-amber-600 font-medium">
                <AlertCircle className="w-3 h-3" /> Over budget
              </div>
            )}
          </div>

          {/* Per-category KPIs */}
          {(Object.keys(CATEGORY_CONFIG) as ExpenseCategory[]).map(cat => {
            const cfg = CATEGORY_CONFIG[cat];
            const amt = categoryTotals[cat] || 0;
            return (
              <div key={cat} className={`bg-white rounded-2xl border ${cfg.border} shadow-xs p-4 flex flex-col gap-2`}>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{cfg.label}</p>
                  <div className={`w-7 h-7 rounded-lg ${cfg.bg} flex items-center justify-center`}>
                    <cfg.Icon className={`w-4 h-4 ${cfg.color}`} />
                  </div>
                </div>
                <p className="text-xl font-bold text-slate-900">{formatRupees(amt)}</p>
                {totalThisMonth > 0 && (
                  <p className="text-xs text-slate-500">{Math.round((amt / totalThisMonth) * 100)}% of total</p>
                )}
              </div>
            );
          })}
        </div>

        {/* ─── Middle Row: Breakdown + Monthly Comparison + P/L ─────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Category Breakdown */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
            <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-rose-700" />
              Category Breakdown
            </h3>
            <div className="space-y-3">
              {(Object.keys(CATEGORY_CONFIG) as ExpenseCategory[]).map(cat => {
                const cfg = CATEGORY_CONFIG[cat];
                const amt = categoryTotals[cat] || 0;
                const pct = totalThisMonth > 0 ? Math.round((amt / totalThisMonth) * 100) : 0;
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className={`flex items-center gap-1.5 font-medium ${cfg.color}`}>
                        <cfg.Icon className="w-3.5 h-3.5" />
                        {cfg.label}
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <span>{formatRupees(amt)}</span>
                        <span className="text-slate-400 w-8 text-right">{pct}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${cfg.bg.replace('bg-', 'bg-').replace('-50', '-400')}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Monthly Comparison */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
            <h3 className="text-sm font-bold text-slate-700 mb-4">Monthly Comparison</h3>
            <div className="space-y-4">
              {[
                { label: MONTH_NAMES[selectedMonth - 1] + ' (Current)', amount: totalThisMonth, color: 'bg-rose-500', target: MONTHLY_TARGET_PAISE },
                { label: MONTH_NAMES[(selectedMonth - 2 + 12) % 12] + ' (Last)', amount: totalLastMonth, color: 'bg-slate-400', target: MONTHLY_TARGET_PAISE },
                { label: 'Budget Target', amount: MONTHLY_TARGET_PAISE, color: 'bg-emerald-400', target: MONTHLY_TARGET_PAISE },
              ].map(row => {
                const pct = Math.min(100, Math.round((row.amount / MONTHLY_TARGET_PAISE) * 100));
                return (
                  <div key={row.label} className="space-y-1.5">
                    <div className="flex justify-between text-xs text-slate-600 font-medium">
                      <span>{row.label}</span>
                      <span className="font-bold text-slate-900">{formatRupees(row.amount)}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3">
                      <div className={`${row.color} h-3 rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-xs text-slate-400">{pct}% of budget</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Profit / Loss Summary */}
          <div className={`rounded-2xl border shadow-xs p-5 ${netPosition >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
            <h3 className="text-sm font-bold text-slate-700 mb-4">Profit / Loss Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-slate-200">
                <span className="text-sm text-slate-600 font-medium">Total Revenue</span>
                <span className="text-sm font-bold text-emerald-700">{formatRupees(totalRevenue)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-200">
                <span className="text-sm text-slate-600 font-medium">Total Expenses</span>
                <span className="text-sm font-bold text-rose-700">{formatRupees(totalThisMonth)}</span>
              </div>
              <div className={`flex justify-between items-center py-3 rounded-xl px-3 ${netPosition >= 0 ? 'bg-emerald-100' : 'bg-rose-100'}`}>
                <span className="text-sm font-bold text-slate-700">Net Position</span>
                <div className="flex items-center gap-1">
                  {netPosition >= 0 ? <TrendingUp className="w-4 h-4 text-emerald-600" /> : <TrendingDown className="w-4 h-4 text-rose-600" />}
                  <span className={`text-lg font-bold ${netPosition >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {netPosition < 0 ? '-' : ''}{formatRupees(Math.abs(netPosition))}
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-500 text-center mt-2">
                {netPosition >= 0 ? '✅ In the green for this month' : '⚠️ Expenses exceed revenue this month'}
              </p>
            </div>
          </div>
        </div>

        {/* ─── Expenses Table ───────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs">
          {/* Table Header */}
          <div className="p-5 border-b border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900">
                  {MONTH_NAMES[selectedMonth - 1]} {selectedYear} Expenses
                  <span className="ml-2 text-sm font-normal text-slate-400">({filteredExpenses.length} records)</span>
                </h3>
              </div>
              {/* Search */}
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 w-full sm:w-56">
                <Search className="w-3.5 h-3.5 text-slate-400" />
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search expenses..."
                  className="text-sm bg-transparent outline-none text-slate-700 w-full placeholder:text-slate-400"
                />
              </div>
            </div>
            {/* Category Filter Chips */}
            <div className="flex flex-wrap gap-2 mt-3">
              <button
                onClick={() => setCategoryFilter('ALL')}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${categoryFilter === 'ALL' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}
              >
                All
              </button>
              {(Object.keys(CATEGORY_CONFIG) as ExpenseCategory[]).map(cat => {
                const cfg = CATEGORY_CONFIG[cat];
                const active = categoryFilter === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors flex items-center gap-1 ${active ? `${cfg.bg} ${cfg.color} ${cfg.border}` : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}
                  >
                    <cfg.Icon className="w-3 h-3" />
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Table */}
          {filteredExpenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Receipt className="w-12 h-12 text-slate-300 mb-3" />
              <p className="text-slate-500 font-medium">No expenses found</p>
              <p className="text-xs text-slate-400 mt-1">Add an expense using the button above</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wide">
                    <th className="px-5 py-3 text-left">Date</th>
                    <th className="px-5 py-3 text-left">Category</th>
                    <th className="px-5 py-3 text-left">Description</th>
                    <th className="px-5 py-3 text-right">Amount</th>
                    <th className="px-5 py-3 text-left">Paid To</th>
                    <th className="px-5 py-3 text-left">Receipt No.</th>
                    <th className="px-5 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredExpenses.map(exp => {
                    const cfg = CATEGORY_CONFIG[exp.category];
                    return (
                      <tr key={exp.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-5 py-4 text-slate-600 whitespace-nowrap">{formatDate(exp.date)}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.color} ${cfg.border} border`}>
                            <cfg.Icon className="w-3 h-3" />
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-slate-800 font-medium max-w-xs truncate">{exp.description}</td>
                        <td className="px-5 py-4 text-right font-bold text-slate-900 whitespace-nowrap">{formatRupees(exp.amountPaise)}</td>
                        <td className="px-5 py-4 text-slate-600 max-w-[160px] truncate">{exp.paidTo}</td>
                        <td className="px-5 py-4 text-slate-500 font-mono text-xs">{exp.receiptNo}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors">
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(exp.id)}
                              className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 border-t-2 border-slate-200">
                    <td colSpan={3} className="px-5 py-3 text-sm font-bold text-slate-700">Total ({filteredExpenses.length} items)</td>
                    <td className="px-5 py-3 text-right text-sm font-bold text-slate-900">
                      {formatRupees(filteredExpenses.reduce((s, e) => s + e.amountPaise, 0))}
                    </td>
                    <td colSpan={3} />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ─── Add Expense Modal ────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Add New Expense</h2>
                <p className="text-xs text-slate-500 mt-0.5">Record a business expense or overhead cost</p>
              </div>
              <button onClick={() => { setIsModalOpen(false); setFormErrors({}); }} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-5 space-y-4">
              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Category *</label>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.keys(CATEGORY_CONFIG) as ExpenseCategory[]).map(cat => {
                    const cfg = CATEGORY_CONFIG[cat];
                    const active = form.category === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, category: cat }))}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-colors ${active ? `${cfg.bg} ${cfg.color} ${cfg.border}` : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}
                      >
                        <cfg.Icon className="w-3.5 h-3.5" />
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Description *</label>
                <input
                  value={form.description}
                  onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="e.g. Monthly rent for Talwandi Centre"
                  className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400 transition-all ${formErrors.description ? 'border-rose-400 bg-rose-50' : 'border-slate-200'}`}
                />
                {formErrors.description && <p className="text-xs text-rose-500 mt-1">{formErrors.description}</p>}
              </div>

              {/* Amount + Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Amount (₹) *</label>
                  <input
                    type="number"
                    value={form.amountRupees}
                    onChange={e => setForm(prev => ({ ...prev, amountRupees: e.target.value }))}
                    placeholder="0"
                    min="0"
                    className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400 transition-all ${formErrors.amountRupees ? 'border-rose-400 bg-rose-50' : 'border-slate-200'}`}
                  />
                  {formErrors.amountRupees && <p className="text-xs text-rose-500 mt-1">{formErrors.amountRupees}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Date *</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={e => setForm(prev => ({ ...prev, date: e.target.value }))}
                    className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400 transition-all ${formErrors.date ? 'border-rose-400 bg-rose-50' : 'border-slate-200'}`}
                  />
                  {formErrors.date && <p className="text-xs text-rose-500 mt-1">{formErrors.date}</p>}
                </div>
              </div>

              {/* Paid To */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Paid To *</label>
                <input
                  value={form.paidTo}
                  onChange={e => setForm(prev => ({ ...prev, paidTo: e.target.value }))}
                  placeholder="e.g. Ramesh Properties Pvt Ltd"
                  className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400 transition-all ${formErrors.paidTo ? 'border-rose-400 bg-rose-50' : 'border-slate-200'}`}
                />
                {formErrors.paidTo && <p className="text-xs text-rose-500 mt-1">{formErrors.paidTo}</p>}
              </div>

              {/* Receipt No */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Receipt No. <span className="text-slate-400 font-normal">(optional)</span></label>
                <input
                  value={form.receiptNo}
                  onChange={e => setForm(prev => ({ ...prev, receiptNo: e.target.value }))}
                  placeholder="e.g. RCPT-2609-001"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400 transition-all"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
              <button
                onClick={() => { setIsModalOpen(false); setFormErrors({}); }}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddExpense}
                className="flex-1 py-2.5 rounded-xl bg-[#991b1b] hover:bg-[#7f1d1d] text-white text-sm font-semibold transition-colors"
              >
                Record Expense
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
