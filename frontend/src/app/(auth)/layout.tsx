import React from 'react';
import Link from 'next/link';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#090d16] px-4 py-12 overflow-hidden">
      {/* Background ambient decorative glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-sky-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative w-full max-w-md z-10">
        {/* Brand header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <span className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-sky-500/20 group-hover:scale-105 transition-transform">
              ⚡
            </span>
            <span className="text-2xl font-bold tracking-tight text-white">
              One<span className="text-sky-400">API</span>
            </span>
          </Link>
          <p className="text-xs font-medium text-slate-400 mt-2">
            Multi-Provider Gateway & Zero-Downtime Failover Proxy
          </p>
        </div>

        {/* Auth Page Content (Card) */}
        <div className="bg-[#111827]/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/60">
          {children}
        </div>
      </div>
    </div>
  );
}
