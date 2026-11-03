'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authStorage } from '@/lib/api';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const token = authStorage.getToken();
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#090d16] flex items-center justify-center text-slate-400 text-sm">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white font-black text-base animate-pulse">
            ⚡
          </div>
          <p>Initializing OneAPI Environment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col antialiased">
      {children}
    </div>
  );
}
