'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import TopProgressBar from './TopProgressBar';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // For standalone authentication pages, render without sidebar and top navbar
  const isAuthPage = 
    pathname === '/login' || 
    pathname?.startsWith('/login/') ||
    pathname === '/register' || 
    pathname?.startsWith('/register/') ||
    pathname === '/forgot-password';

  if (isAuthPage) {
    return (
      <main className="min-h-screen w-full bg-[#faf9f9] text-slate-900 font-sans antialiased selection:bg-red-600 selection:text-white">
        <TopProgressBar />
        {children}
      </main>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#faf9f9] text-slate-900 font-sans antialiased selection:bg-red-100 selection:text-red-900">
      <TopProgressBar />
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
