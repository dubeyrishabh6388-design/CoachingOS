import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from '@/lib/context/AppContext';
import AppShell from '@/components/layout/AppShell';

export const metadata: Metadata = {
  title: 'CoachingOS India — The AI Operating System for Coaching Institutes',
  description: 'Manage leads, admissions, fee reconciliation, rapid attendance, tests, and student interventions.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css"
          crossOrigin="anonymous"
        />
      </head>
      <body className="antialiased selection:bg-red-600 selection:text-white">
        <AppProvider>
          <AppShell>{children}</AppShell>
        </AppProvider>
      </body>
    </html>
  );
}
