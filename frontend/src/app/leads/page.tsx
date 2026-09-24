'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LeadsRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/admissions');
  }, [router]);

  return (
    <div className="p-12 text-center text-slate-400 text-xs">
      Redirecting to Admissions &amp; Inquiries...
    </div>
  );
}
