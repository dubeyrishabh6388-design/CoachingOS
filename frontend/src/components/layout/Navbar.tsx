'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/context/AppContext';
import { 
  Building2, 
  MapPin, 
  ChevronDown, 
  Bell, 
  Menu, 
  X, 
  Plus, 
  UserPlus, 
  CreditCard, 
  CalendarCheck, 
  AlertTriangle,
  Search,
  CheckCircle2,
  GraduationCap,
  FileCheck2,
  Layers,
  MessageSquare,
  PanelLeft,
  PanelLeftClose,
  LogOut,
  Key
} from 'lucide-react';
import CommandPalette from './CommandPalette';
import ChangePasswordModal from './ChangePasswordModal';

export default function Navbar() {
  const { 
    currentOrg, 
    currentBranch, 
    currentUser, 
    allOrgs, 
    allBranches, 
    allUsers, 
    switchOrg, 
    switchBranch, 
    switchUser,
    isMobileMenuOpen,
    toggleMobileMenu,
    isSidebarOpen,
    toggleSidebar,
    logout,
    showToast
  } = useApp();

  const router = useRouter();

  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [orgMenuOpen, setOrgMenuOpen] = useState(false);
  const [branchMenuOpen, setBranchMenuOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  return (
    <header className="h-16 bg-[#450a0a] border-b border-[#2b0404] sticky top-0 z-40 px-4 sm:px-6 flex items-center justify-between text-white shadow-md">
      {/* Left: Sidebar Toggle, Brand & Organization Switchers */}
      <div className="flex items-center gap-3 lg:gap-4">
        {/* Desktop Sidebar Toggle Button */}
        <button
          onClick={toggleSidebar}
          className="hidden md:flex items-center justify-center p-2 rounded-lg text-rose-200 hover:text-white hover:bg-[#5c0a0a] transition-colors"
          title={isSidebarOpen ? "Close sidebar (Ctrl+B)" : "Open sidebar (Ctrl+B)"}
          aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          {isSidebarOpen ? (
            <PanelLeftClose className="w-5 h-5 text-rose-300" />
          ) : (
            <PanelLeft className="w-5 h-5 text-rose-300" />
          )}
        </button>

        {/* Mobile Hamburger Toggle */}
        <button
          onClick={toggleMobileMenu}
          className="md:hidden p-2 rounded-lg text-rose-200 hover:text-white hover:bg-[#5c0a0a] transition-colors"
          aria-label="Toggle Navigation Menu"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-[#991b1b] border border-[#dc2626] flex items-center justify-center font-bold text-white shadow-sm text-sm tracking-tight">
            C
          </div>
          <div>
            <span className="font-bold text-base tracking-tight text-white block leading-tight">
              CoachingOS
            </span>
            <span className="text-[11px] text-rose-200/80 hidden sm:block leading-none">
              Institute Management
            </span>
          </div>
        </Link>

        <div className="h-5 w-[1px] bg-[#7f1d1d] mx-1 hidden lg:block" />

        {/* Institute Selector */}
        <div className="relative hidden lg:block">
          {allOrgs.length > 1 ? (
            <>
              <button 
                onClick={() => { setOrgMenuOpen(!orgMenuOpen); setBranchMenuOpen(false); }}
                className="flex items-center gap-2 text-xs text-rose-100 bg-[#2c0505] hover:bg-[#5c0a0a] border border-[#7f1d1d] px-2.5 py-1.5 rounded-lg transition-colors font-medium"
              >
                <Building2 className="w-3.5 h-3.5 text-rose-300 shrink-0" />
                <span className="max-w-[150px] truncate">{currentOrg.tradeName}</span>
                <ChevronDown className="w-3 h-3 text-rose-300/70" />
              </button>

              {orgMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setOrgMenuOpen(false)} />
                  <div className="absolute top-full left-0 mt-1.5 w-64 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50 text-xs text-slate-800 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-3 pb-1.5 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                      Select Coaching Institute
                    </div>
                    {allOrgs.map(org => (
                      <button
                        key={org.id}
                        onClick={() => { switchOrg(org.id); setOrgMenuOpen(false); }}
                        className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-red-50 transition-colors ${
                          org.id === currentOrg.id ? 'bg-red-50 text-[#991b1b] font-semibold' : 'text-slate-700'
                        }`}
                      >
                        <div>
                          <div className="font-medium">{org.tradeName}</div>
                          <div className="text-[10px] text-slate-400">{org.legalName}</div>
                        </div>
                        {org.id === currentOrg.id && <CheckCircle2 className="w-3.5 h-3.5 text-[#991b1b] shrink-0" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="flex items-center gap-2 text-xs text-rose-100 bg-[#2c0505] border border-[#7f1d1d] px-2.5 py-1.5 rounded-lg font-medium shadow-inner" title="Dedicated Registered Institute">
              <Building2 className="w-3.5 h-3.5 text-rose-300 shrink-0" />
              <span className="max-w-[170px] truncate">{currentOrg.tradeName}</span>
            </div>
          )}
        </div>

        {/* Branch Selector */}
        <div className="relative hidden xl:block">
          <button 
            onClick={() => { setBranchMenuOpen(!branchMenuOpen); setOrgMenuOpen(false); }}
            className="flex items-center gap-2 text-xs text-rose-100 bg-[#2c0505] hover:bg-[#5c0a0a] border border-[#7f1d1d] px-2.5 py-1.5 rounded-lg transition-colors font-medium"
          >
            <MapPin className="w-3.5 h-3.5 text-rose-300 shrink-0" />
            <span className="max-w-[120px] truncate">{currentBranch.name}</span>
            <ChevronDown className="w-3 h-3 text-rose-300/70" />
          </button>

          {branchMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setBranchMenuOpen(false)} />
              <div className="absolute top-full left-0 mt-1.5 w-56 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50 text-xs text-slate-800 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 pb-1.5 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                  Select Branch Campus
                </div>
                {allBranches.map(br => (
                  <button
                    key={br.id}
                    onClick={() => { switchBranch(br.id); setBranchMenuOpen(false); }}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-[#fff1f2] transition-colors ${
                      br.id === currentBranch.id ? 'bg-[#fff1f2] text-[#991b1b] font-semibold' : 'text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="font-medium">{br.name}</div>
                      <div className="text-[10px] text-slate-400">{br.city}</div>
                    </div>
                    {br.id === currentBranch.id && <CheckCircle2 className="w-3.5 h-3.5 text-[#991b1b] shrink-0" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Center: Global Search Bar */}
      <div className="flex-1 max-w-md mx-4 hidden md:block">
        <CommandPalette />
      </div>

      {/* Right: Quick Create, Welcome text, Role switcher, and Logout Button */}
      <div className="flex items-center gap-3">
        {/* + Quick Create Button (Only for Admin / Faculty / Staff) */}
        {!['STUDENT', 'PARENT'].includes(currentUser.role) && (
          <div className="relative">
            <button
              onClick={() => { setQuickCreateOpen(!quickCreateOpen); setProfileMenuOpen(false); }}
              className="flex items-center gap-1.5 bg-[#dc2626] hover:bg-[#b91c1c] text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline">Quick Create</span>
              <ChevronDown className="w-3 h-3 opacity-80" />
            </button>

            {quickCreateOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setQuickCreateOpen(false)} />
                <div className="absolute top-full right-0 mt-1.5 w-56 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50 text-xs text-slate-800 animate-in fade-in zoom-in-95 duration-100">
                  <Link
                    href="/leads"
                    onClick={() => setQuickCreateOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-slate-700 hover:bg-red-50 hover:text-[#991b1b] transition-colors"
                  >
                    <UserPlus className="w-4 h-4 text-slate-400" />
                    <div>
                      <div className="font-medium">Add Student Enquiry</div>
                      <div className="text-[10px] text-slate-400">Capture CRM enquiry</div>
                    </div>
                  </Link>

                  <Link
                    href="/students"
                    onClick={() => setQuickCreateOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-slate-700 hover:bg-red-50 hover:text-[#991b1b] transition-colors"
                  >
                    <GraduationCap className="w-4 h-4 text-slate-400" />
                    <div>
                      <div className="font-medium">Direct Admission</div>
                      <div className="text-[10px] text-slate-400">Enroll new student</div>
                    </div>
                  </Link>

                  <Link
                    href="/finance"
                    onClick={() => setQuickCreateOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-slate-700 hover:bg-red-50 hover:text-[#991b1b] transition-colors"
                  >
                    <CreditCard className="w-4 h-4 text-slate-400" />
                    <div>
                      <div className="font-medium">Collect Fees (UPI)</div>
                      <div className="text-[10px] text-slate-400">Scan UPI counter POS</div>
                    </div>
                  </Link>

                  <Link
                    href="/academics/batches"
                    onClick={() => setQuickCreateOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-slate-700 hover:bg-red-50 hover:text-[#991b1b] transition-colors"
                  >
                    <Layers className="w-4 h-4 text-slate-400" />
                    <div>
                      <div className="font-medium">Create Batch</div>
                      <div className="text-[10px] text-slate-400">Setup class schedule</div>
                    </div>
                  </Link>

                  <Link
                    href="/academics/tests"
                    onClick={() => setQuickCreateOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-slate-700 hover:bg-red-50 hover:text-[#991b1b] transition-colors"
                  >
                    <FileCheck2 className="w-4 h-4 text-slate-400" />
                    <div>
                      <div className="font-medium">Schedule Test</div>
                      <div className="text-[10px] text-slate-400">Create chapter exam</div>
                    </div>
                  </Link>
                </div>
              </>
            )}
          </div>
        )}

        {/* Welcome greeting text */}
        <div className="hidden lg:flex flex-col text-right">
          <span className="text-xs font-semibold text-rose-100">
            Welcome, {currentUser.fullName.split(' ')[0]}
          </span>
          <span className="text-[10px] text-rose-300/80 capitalize">
            {currentUser.role.toLowerCase().replace('_', ' ')}
          </span>
        </div>

        {/* User Role Switcher Pill */}
        <div className="relative">
          <button
            onClick={() => { setProfileMenuOpen(!profileMenuOpen); setQuickCreateOpen(false); }}
            className="flex items-center gap-2 p-1.5 rounded-lg bg-[#2c0505] hover:bg-[#5c0a0a] border border-[#7f1d1d] text-rose-100 transition-colors"
            title="User Profile & Account Options"
          >
            <div className="w-6 h-6 rounded-full bg-[#991b1b] text-rose-100 border border-[#dc2626] flex items-center justify-center text-xs font-bold">
              {currentUser.fullName[0]}
            </div>
            <ChevronDown className="w-3 h-3 text-rose-300/70" />
          </button>

          {profileMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setProfileMenuOpen(false)} />
              <div className="absolute top-full right-0 mt-1.5 w-72 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50 text-xs text-slate-800 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-4 py-2 border-b border-slate-100">
                  <div className="font-semibold text-slate-900">{currentUser.fullName}</div>
                  <div className="text-slate-500 text-[11px]">{currentUser.email || currentUser.phone}</div>
                  <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-semibold bg-[#fff1f2] text-[#991b1b] px-2 py-0.5 rounded capitalize">
                      {currentUser.role.toLowerCase().replace('_', ' ')}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      ID: {currentUser.phone}
                    </span>
                  </div>
                </div>

                {/* For Staff/Admin: Team switcher. For Student/Parent: Dedicated Status card */}
                {!['STUDENT', 'PARENT'].includes(currentUser.role) ? (
                  allUsers.length > 1 ? (
                    <>
                      <div className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Institute Team Stakeholders ({allUsers.length})
                      </div>

                      <div className="max-h-48 overflow-y-auto">
                        {allUsers.map(user => (
                          <button
                            key={user.id}
                            onClick={() => { switchUser(user.id); setProfileMenuOpen(false); }}
                            className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-[#fff1f2] transition-colors ${
                              user.id === currentUser.id ? 'bg-[#fff1f2] text-[#991b1b] font-semibold' : 'text-slate-700'
                            }`}
                          >
                            <div>
                              <div className="font-medium">{user.fullName}</div>
                              <div className="text-[10px] text-slate-400 capitalize">{user.role.toLowerCase().replace('_', ' ')}</div>
                            </div>
                            {user.id === currentUser.id && <CheckCircle2 className="w-3.5 h-3.5 text-[#991b1b] shrink-0" />}
                          </button>
                        ))}
                      </div>
                    </>
                  ) : null
                ) : (
                  <div className="px-4 py-3 my-1 bg-rose-50/50 border-y border-rose-100 text-[11px] text-slate-600 flex items-center gap-2.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <div>
                      <div className="font-semibold text-slate-800">{currentOrg.tradeName}</div>
                      <div className="text-[10px] text-slate-500">Student &amp; Parent Secure Portal</div>
                    </div>
                  </div>
                )}

                <div className="p-2 border-t border-slate-100 bg-slate-50/50 flex flex-col gap-1">
                  {/* Change Password Button */}
                  <button
                    onClick={() => {
                      setProfileMenuOpen(false);
                      setIsChangePasswordOpen(true);
                    }}
                    className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-amber-50 hover:text-amber-800 flex items-center justify-between transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Key className="w-3.5 h-3.5 text-amber-600" />
                      <span>Change Password</span>
                    </span>
                    <span className="text-[10px] text-amber-700 font-medium">Security</span>
                  </button>

                  <Link
                    href="/login"
                    onClick={() => setProfileMenuOpen(false)}
                    className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-red-50 hover:text-[#991b1b] flex items-center justify-between transition-colors"
                  >
                    <span>Switch or Sign In to Another Account</span>
                    <span className="text-[10px] text-slate-400">/login</span>
                  </Link>

                  {!['STUDENT', 'PARENT'].includes(currentUser.role) && (
                    <Link
                      href="/register"
                      onClick={() => setProfileMenuOpen(false)}
                      className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium text-rose-700 hover:bg-red-50 flex items-center justify-between transition-colors"
                    >
                      <span>Register New Coaching Institute</span>
                      <span className="text-[10px] bg-red-100 text-red-800 px-1.5 py-0.5 rounded font-bold">New</span>
                    </Link>
                  )}

                  <button
                    onClick={() => {
                      setProfileMenuOpen(false);
                      logout();
                      router.push('/login');
                    }}
                    className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center justify-between transition-colors"
                  >
                    <span>Sign Out</span>
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Red Logout Button */}
        <button
          onClick={() => {
            logout();
            router.push('/login');
          }}
          className="flex items-center gap-1.5 bg-[#e11d48] hover:bg-[#be123c] text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm transition-colors"
          title="Sign out of CoachingOS"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Logout</span>
        </button>
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />
    </header>
  );
}
