'use client';

import React, { useEffect, useState, useRef, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

function ProgressBarInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startProgress = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsVisible(true);
    setProgress(15);

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 90;
        }
        // Advance quickly at first, then slow down
        const step = Math.max(2, Math.floor((90 - prev) / 4));
        return prev + step;
      });
    }, 120);
  };

  const completeProgress = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setProgress(100);
    const hideTimer = setTimeout(() => {
      setIsVisible(false);
      setProgress(0);
    }, 280);
    return () => clearTimeout(hideTimer);
  };

  // Complete progress on route change
  useEffect(() => {
    if (isVisible) {
      completeProgress();
    }
  }, [pathname, searchParams]);

  // Global click interceptor for instant 0ms feedback on navigation
  useEffect(() => {
    const handleGlobalClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      // Check if clicked element or its closest ancestor is an anchor or interactive nav link
      const anchor = target.closest('a') as HTMLAnchorElement | null;
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      const targetAttr = anchor.getAttribute('target');

      // Internal link check
      if (
        href &&
        href.startsWith('/') &&
        !href.startsWith('//') &&
        (!targetAttr || targetAttr === '_self') &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.shiftKey &&
        !event.altKey
      ) {
        // If navigating to different path or params, start immediately
        const currentFullPath = `${window.location.pathname}${window.location.search}`;
        if (href !== currentFullPath) {
          startProgress();
        }
      }
    };

    window.addEventListener('click', handleGlobalClick, { capture: true });
    return () => {
      window.removeEventListener('click', handleGlobalClick, { capture: true });
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  if (!isVisible && progress === 0) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none"
      aria-hidden="true"
    >
      <div
        className="h-[3px] bg-gradient-to-r from-[#881337] via-[#e11d48] to-[#fb7185] transition-all ease-out"
        style={{
          width: `${progress}%`,
          transitionDuration: progress === 100 ? '200ms' : '150ms',
          boxShadow: '0 0 12px #f43f5e, 0 0 6px #e11d48',
        }}
      >
        {/* Glowing leading head */}
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-r from-transparent via-white/70 to-white blur-[1px] opacity-90" />
      </div>
    </div>
  );
}

export default function TopProgressBar() {
  return (
    <Suspense fallback={null}>
      <ProgressBarInner />
    </Suspense>
  );
}
