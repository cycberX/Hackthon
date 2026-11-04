'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Zap, Activity, Workflow, Code2 } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="auth-page min-h-screen bg-[var(--background)] text-[var(--foreground)] transition-colors duration-200">
      {/* Top navigation */}
      <header className="auth-nav max-w-[1240px] mx-auto px-5 sm:px-8 py-5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center shrink-0">
            <Image
              src="/logo.png"
              alt="OneAPI Logo"
              width={36}
              height={36}
              className="w-full h-full object-contain"
              priority
            />
          </span>
          <span className="text-xl font-bold tracking-tight text-[var(--foreground)]">
            One<span className="text-[var(--primary)]">API</span>
          </span>
        </Link>

        <div className="flex items-center gap-5">
          <Link href="/" className="hidden sm:block text-sm text-[var(--muted)] hover:text-[var(--primary)] transition-colors">
            Home
          </Link>
          <ThemeToggle />
        </div>
      </header>

      {/* Authentication content */}
      <div className="max-w-[1240px] mx-auto px-4 sm:px-8 py-5 sm:py-8">
        <div className="auth-main-grid grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] rounded-2xl overflow-hidden bg-[var(--surface)] shadow-[var(--shadow)]">
          {/* LEFT: Form */}
          <section className="auth-form-area flex items-center justify-center p-6 sm:p-10 lg:p-12 bg-[var(--surface)] text-[var(--foreground)]">
            <div className="w-full max-w-[480px]">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-xs text-[var(--muted)] hover:text-[var(--primary)] mb-9 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to home
              </Link>

              {children}
            </div>
          </section>

          {/* RIGHT: Atmospheric branding panel */}
          <section className="auth-visual-panel relative overflow-hidden hidden lg:flex flex-col justify-between p-10 xl:p-14 bg-[var(--card)] text-[var(--foreground)]">
            {/* Background decoration */}
            <div className="auth-visual-glow" />
            <div className="auth-visual-orbit orbit-one" />
            <div className="auth-visual-orbit orbit-two" />

            {/* Top label */}
            <div className="relative z-10">
              <span className="auth-status-badge inline-flex items-center gap-2 px-3 py-2 rounded-full text-xs bg-[var(--surface-secondary)] text-[var(--foreground)]">
                <span className="gateway-status-dot bg-[var(--primary)]" />
                API infrastructure, simplified
              </span>
            </div>

            {/* Main branding */}
            <div className="relative z-10 max-w-lg my-auto py-16">
              <div className="auth-illustration-mark mb-10 w-14 h-14 rounded-2xl overflow-hidden flex items-center justify-center shadow-lg shadow-[var(--primary)]/20">
                <Image
                  src="/logo.png"
                  alt="OneAPI Logo"
                  width={56}
                  height={56}
                  className="w-full h-full object-contain"
                  priority
                />
              </div>

              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--primary)] mb-5">
                The unified API platform
              </p>

              <h2 className="text-4xl xl:text-5xl font-bold tracking-tight leading-[1.15] text-[var(--foreground)]">
                One connection.
                <br />
                <span className="text-[var(--primary)]">
                  Endless possibilities.
                </span>
              </h2>

              <p className="text-sm leading-7 mt-6 max-w-sm text-[var(--muted)]">
                Connect multiple API providers through one intelligent
                gateway. Simplify integrations, manage requests and
                keep your applications running.
              </p>

              {/* Gateway features */}
              <div className="mt-10 space-y-3">
                <div className="auth-feature flex flex-row flex-nowrap items-center gap-3 p-3 rounded-xl bg-[var(--surface)]/80 text-[var(--foreground)]">
                  <Workflow className="w-4 h-4 shrink-0 text-[var(--primary)]" />
                  <span className="flex-1 min-w-0 whitespace-nowrap text-xs font-medium">
                    Intelligent API routing
                  </span>
                  <span className="auth-feature-status ml-auto shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--primary)]/15 text-[var(--primary)]">
                    Active
                  </span>
                </div>

                <div className="auth-feature flex flex-row flex-nowrap items-center gap-3 p-3 rounded-xl bg-[var(--surface)]/80 text-[var(--foreground)]">
                  <Activity className="w-4 h-4 shrink-0 text-[var(--primary)]" />
                  <span className="flex-1 min-w-0 whitespace-nowrap text-xs font-medium">
                    Automatic failover
                  </span>
                  <span className="auth-feature-status ml-auto shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--primary)]/15 text-[var(--primary)]">
                    Ready
                  </span>
                </div>

                <div className="auth-feature flex flex-row flex-nowrap items-center gap-3 p-3 rounded-xl bg-[var(--surface)]/80 text-[var(--foreground)]">
                  <Code2 className="w-4 h-4 shrink-0 text-[var(--primary)]" />
                  <span className="flex-1 min-w-0 whitespace-nowrap text-xs font-medium">
                    Unified API integration
                  </span>
                  <span className="auth-feature-status ml-auto shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--primary)]/15 text-[var(--primary)]">
                    Connected
                  </span>
                </div>
              </div>

              {/* Animated availability */}
              <div className="mt-9">
                <div className="flex justify-between text-xs mb-3">
                  <span className="text-[var(--muted)]">Gateway availability</span>
                  <span className="font-semibold text-[var(--primary)]">Monitoring</span>
                </div>

                <div className="gateway-progress-track h-1.5 w-full bg-[var(--surface-secondary)] rounded-full overflow-hidden">
                  <div className="gateway-progress-fill h-full bg-[var(--primary)] w-3/4 rounded-full" />
                </div>
              </div>
            </div>

            {/* Bottom branding */}
            <div className="relative z-10 flex justify-between items-center text-xs text-[var(--muted)]">
              <span>Built for modern developers</span>
              <span className="text-lg font-bold tracking-tight text-[var(--foreground)]">
                OneAPI<span className="text-[var(--primary)]">.</span>
              </span>
            </div>
          </section>
        </div>

        <footer className="text-center text-xs text-[var(--muted)] mt-6">
          © {new Date().getFullYear()} OneAPI. All rights reserved.
        </footer>
      </div>
    </main>
  );
}
