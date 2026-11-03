'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authStorage } from '@/lib/api';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const token = authStorage.getToken();
    if (token) {
      router.replace('/dashboard');
    } else {
      router.replace('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-[#090d16] flex items-center justify-center text-slate-400 text-sm">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white font-black text-base animate-pulse">
          ⚡
        </div>
        <p>Connecting to OneAPI...</p>
      </div>
    </div>
  );
}
