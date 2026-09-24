'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/lib/context/AppContext';
import {
  LayoutDashboard,
  UserPlus,
  Users,
  Layers,
  CalendarCheck,
  FileCheck2,
  BookOpen,
  CreditCard,
  MessageSquare,
  BarChart3,
  Settings,
  Sparkles,
  X,
  Loader2,
  ClipboardList,
  Receipt,
  Clock,
  UsersRound,
  BookMarked,
  Wallet,
  ChevronRight,
  BrainCircuit
} from 'lucide-react';


interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
}

interface NavSection {
  sectionTitle?: string;
  items: NavItem[];
}

export default function Sidebar() {
  const pathname = usePathname();
  const [pendingHref, setPendingHref] = React.useState<string | null>(null);

  // Clear pendingHref when route updates
  React.useEffect(() => {
    setPendingHref(null);
  }, [pathname]);

  const { 
    currentUser, 
    isMobileMenuOpen, 
    setIsMobileMenuOpen,
    isSidebarOpen,
    setIsSidebarOpen,
    isSidebarCollapsed,
    toggleSidebarCollapse
  } = useApp();

  const allRoles = ['OWNER', 'TEACHER', 'COUNSELLOR', 'ACCOUNTANT', 'STUDENT', 'PARENT', 'BRANCH_ADMIN', 'MANAGER'];
  const adminRoles = ['OWNER', 'BRANCH_ADMIN', 'MANAGER'];
  const teacherRoles = ['OWNER', 'TEACHER', 'BRANCH_ADMIN', 'MANAGER'];
  const financeRoles = ['OWNER', 'ACCOUNTANT', 'BRANCH_ADMIN'];

  const navSections: NavSection[] = [
    {
      items: [
        {
          label: 'Dashboard',
          href: '/',
          icon: LayoutDashboard,
          roles: allRoles,
        },
      ],
    },
    {
      sectionTitle: 'STUDENTS & ADMISSIONS',
      items: [
        {
          label: 'Admissions & CRM',
          href: '/admissions',
          icon: UserPlus,
          roles: ['OWNER', 'COUNSELLOR', 'BRANCH_ADMIN', 'MANAGER'],
        },
        {
          label: 'Students',
          href: '/students',
          icon: Users,
          roles: ['OWNER', 'BRANCH_ADMIN', 'MANAGER', 'COUNSELLOR', 'TEACHER'],
        },
      ],
    },
    {
      sectionTitle: 'ACADEMICS',
      items: [
        {
          label: 'Batches & Classes',
          href: '/academics/batches',
          icon: Layers,
          roles: ['OWNER', 'TEACHER', 'BRANCH_ADMIN', 'MANAGER', 'STUDENT'],
        },
        {
          label: 'Timetable',
          href: '/academics/timetable',
          icon: Clock,
          roles: ['OWNER', 'TEACHER', 'BRANCH_ADMIN', 'MANAGER', 'STUDENT', 'PARENT'],
        },
        {
          label: 'Attendance',
          href: '/academics/attendance',
          icon: CalendarCheck,
          roles: ['OWNER', 'TEACHER', 'BRANCH_ADMIN', 'MANAGER', 'STUDENT', 'PARENT'],
        },
        {
          label: 'Homework & DPP',
          href: '/academics/homework',
          icon: BookMarked,
          roles: ['OWNER', 'TEACHER', 'BRANCH_ADMIN', 'MANAGER', 'STUDENT', 'PARENT'],
        },
        {
          label: 'Tests & Results',
          href: '/academics/tests',
          icon: FileCheck2,
          roles: allRoles,
        },
        {
          label: 'Study Materials',
          href: '/materials',
          icon: BookOpen,
          roles: allRoles,
        },
      ],
    },
    {
      sectionTitle: 'FINANCE',
      items: [
        {
          label: 'Fees & Payments',
          href: '/finance',
          icon: CreditCard,
          roles: [...financeRoles, 'PARENT', 'STUDENT'],
        },
        {
          label: 'Expenses',
          href: '/expenses',
          icon: Wallet,
          roles: financeRoles,
        },
      ],
    },
    {
      sectionTitle: 'COMMUNICATE',
      items: [
        {
          label: 'Messages',
          href: '/messages',
          icon: MessageSquare,
          roles: allRoles,
        },
      ],
    },
    {
      sectionTitle: 'TEAM & REPORTS',
      items: [
        {
          label: 'Staff',
          href: '/staff',
          icon: UsersRound,
          roles: adminRoles,
        },
        {
          label: 'Reports',
          href: '/reports',
          icon: BarChart3,
          roles: ['OWNER', 'BRANCH_ADMIN', 'MANAGER'],
        },
      ],
    },
    {
      sectionTitle: 'SYSTEM',
      items: [
        {
          label: 'AI Copilot',
          href: '/copilot',
          icon: BrainCircuit,
          roles: ['OWNER', 'TEACHER', 'BRANCH_ADMIN', 'MANAGER', 'COUNSELLOR'],
        },
        {
          label: 'Settings',
          href: '/settings',
          icon: Settings,
          roles: ['OWNER', 'SUPER_ADMIN', 'BRANCH_ADMIN', 'MANAGER'],
        },
      ],
    },
  ];




  const NavContent = ({ 
    isCollapsed = false, 
    onNavigate,
    isMobile = false
  }: { 
    isCollapsed?: boolean; 
    onNavigate?: () => void;
    isMobile?: boolean;
  }) => (
    <div className="flex flex-col h-full text-rose-100">
      <div className="space-y-4">
        <nav className="space-y-4">
          {navSections.map((section, sIdx) => {
            const visibleItems = section.items.filter(item => item.roles.includes(currentUser.role));
            if (visibleItems.length === 0) return null;

            return (
              <div key={sIdx} className="space-y-1">
                {section.sectionTitle && (
                  isCollapsed ? (
                    <div className="my-2 border-t border-[#450a0a]" />
                  ) : (
                    <div className="px-3.5 pb-1.5 text-xs font-bold tracking-wider text-rose-300 uppercase">
                      {section.sectionTitle}
                    </div>
                  )
                )}
                {visibleItems.map(item => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                  const isPending = pendingHref === item.href && pathname !== item.href;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      prefetch={true}
                      onClick={() => {
                        if (pathname !== item.href) {
                          setPendingHref(item.href);
                        }
                        if (onNavigate) onNavigate();
                      }}
                      title={isCollapsed ? item.label : undefined}
                      className={`relative flex items-center gap-3.5 rounded-lg text-sm font-medium transition-all duration-100 active:scale-[0.97] select-none ${
                        isCollapsed ? 'justify-center p-3' : 'px-3.5 py-2.5'
                      } ${
                        isActive || isPending
                          ? 'bg-[#881337] text-white font-semibold shadow-sm border-l-4 border-[#f43f5e] pl-3'
                          : 'text-rose-200/90 hover:bg-[#450a0a] hover:text-white'
                      }`}
                    >
                      <Icon className={`w-5 h-5 shrink-0 ${isActive || isPending ? 'text-[#fb7185]' : 'text-rose-300/80'}`} />
                      {!isCollapsed && (
                        <span className="truncate text-[13.5px] lg:text-sm font-medium flex-1">
                          {item.label}
                        </span>
                      )}
                      {/* 0ms Instant Pending Spinner Indicator */}
                      {isPending && !isCollapsed && (
                        <Loader2 className="w-3.5 h-3.5 text-rose-300 animate-spin shrink-0 ml-auto" />
                      )}
                      {isPending && isCollapsed && (
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-400 animate-ping" />
                      )}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Collapsible / Hideable Sidebar - Fixed/Sticky with independent scroll */}
      <aside 
        className={`hidden md:flex flex-col bg-[#2c0505] border-r border-[#1a0303] h-[calc(100vh-4rem)] overflow-y-auto shrink-0 transition-all duration-300 ease-in-out shadow-lg sticky top-0 ${
          !isSidebarOpen 
            ? 'w-0 p-0 border-r-0 opacity-0 overflow-hidden pointer-events-none' 
            : isSidebarCollapsed 
            ? 'w-[72px] p-3' 
            : 'w-68 lg:w-72 p-4'
        }`}
      >
        <NavContent isCollapsed={isSidebarCollapsed} />
      </aside>

      {/* Mobile Slide-in Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div 
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-150" 
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative w-72 max-w-[80vw] bg-[#2c0505] border-r border-[#1a0303] flex flex-col p-4 h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#450a0a] mb-3 text-white">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-300">Navigation Menu</span>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1 rounded-md text-rose-300 hover:text-white hover:bg-[#450a0a] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <NavContent onNavigate={() => setIsMobileMenuOpen(false)} isMobile={true} />
          </div>
        </div>
      )}
    </>
  );
}
