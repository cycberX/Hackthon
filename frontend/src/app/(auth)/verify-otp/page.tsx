'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ShieldCheck,
  Mail,
  ArrowRight,
  RefreshCw,
  ArrowLeft,
  Zap,
  CheckCircle2,
} from 'lucide-react';
import { fetchApi, authStorage } from '@/lib/api';
import ThemeToggle from '../../components/ThemeToggle';

function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const emailParam = searchParams.get('email');

    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    setError(null);
    setSuccessMsg(null);

    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP code.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetchApi('/api/v1/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ email, otp }),
      });

      if (!res.success) {
        setError(res.error?.message || 'Invalid or expired OTP code.');
        setLoading(false);
        return;
      }

      setSuccessMsg('Email verified successfully! Redirecting...');

      if (res.data?.tokens) {
        authStorage.setToken(res.data.tokens.accessToken);
        authStorage.setRefreshToken(res.data.tokens.refreshToken);
        authStorage.setUser(res.data.user);
      }

      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);

    } catch (err: any) {
      setError(err.message || 'Verification failed.');
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setError('Email address is required.');
      return;
    }

    setResending(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetchApi('/api/v1/auth/resend-otp', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });

      if (!res.success) {
        setError(res.error?.message || 'Failed to resend OTP.');
        setResending(false);
        return;
      }

      setSuccessMsg('A new verification code has been sent.');
      setResending(false);

    } catch (err: any) {
      setError(err.message || 'Unable to resend verification code.');
      setResending(false);
    }
  };

  return (
    <main className="otp-page bg-[var(--background)] text-[var(--foreground)]">
      {/* Background decoration */}
      <div className="otp-glow otp-glow-one" />
      <div className="otp-glow otp-glow-two" />

      {/* Brand & Theme Toggle Topbar */}
      <div className="w-full max-w-[460px] mx-auto flex items-center justify-between mb-2 relative z-10">
        <Link href="/" className="otp-brand">
          <span className="otp-brand-icon overflow-hidden flex items-center justify-center p-0.5 shadow-md shadow-[var(--primary)]/20">
            <Image
              src="/logo.png"
              alt="OneAPI Logo"
              width={32}
              height={32}
              className="w-full h-full object-contain"
              priority
            />
          </span>

          <span className="text-[var(--foreground)]">
            One<span className="text-[var(--primary)]">API</span>
          </span>
        </Link>

        <ThemeToggle />
      </div>

      {/* Center card */}
      <div className="otp-content">
        <div className="otp-card bg-[var(--surface)] text-[var(--foreground)] shadow-[var(--shadow)]">
          {/* Icon */}
          <div className="otp-icon bg-[var(--primary)]/15 text-[var(--primary)]">
            <ShieldCheck className="w-7 h-7" />
          </div>

          {/* Heading */}
          <div className="text-center mt-6 mb-8">
            <span className="otp-eyebrow text-[var(--primary)]">
              ACCOUNT SECURITY
            </span>

            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] mt-3 tracking-tight">
              Verify your email
            </h1>

            <p className="text-sm text-[var(--muted)] mt-3 leading-6">
              We&apos;ve sent a verification code to your email address.
              Enter the six-digit code below to activate your account.
            </p>
          </div>

          {/* Messages */}
          {error && (
            <div
              role="alert"
              className="otp-error mb-5 bg-[var(--danger)]/10 text-[var(--danger)]"
            >
              {error}
            </div>
          )}

          {successMsg && (
            <div
              role="status"
              className="otp-success mb-5 bg-[var(--success)]/10 text-[var(--success)]"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {successMsg}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleVerify} className="space-y-6">
            {/* Email */}
            <div>
              <label className="otp-label text-[var(--foreground)]">
                Email address
              </label>

              <div className="relative">
                <Mail className="otp-input-icon text-[var(--muted)]" />
                <input
                  type="email"
                  placeholder="developer@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="otp-input !pl-14 bg-[var(--surface-input)] text-[var(--foreground)] placeholder:text-[var(--muted)]"
                />
              </div>
            </div>

            {/* OTP */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="otp-label mb-0 text-[var(--foreground)]">
                  Verification code
                </label>

                <span className="text-xs text-[var(--primary)] font-medium">
                  6 DIGITS
                </span>
              </div>

              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="000000"
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))
                }
                maxLength={6}
                required
                className="otp-input otp-code-input bg-[var(--surface-input)] text-[var(--foreground)] placeholder:text-[var(--muted)]"
              />

              <p className="text-xs text-[var(--muted)] mt-2">
                Enter the code sent to your registered email.
              </p>
            </div>

            {/* Verify */}
            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="otp-submit bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white shadow-md shadow-[var(--primary)]/20"
            >
              {loading ? (
                <>
                  <span className="otp-spinner" />
                  Verifying...
                </>
              ) : (
                <>
                  Verify & Continue
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Resend */}
          <div className="otp-divider" />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="otp-resend text-[var(--muted)] hover:text-[var(--primary)] transition-colors"
            >
              <RefreshCw
                className={`w-4 h-4 ${resending ? 'animate-spin' : ''}`}
              />
              {resending ? 'Sending code...' : 'Resend verification code'}
            </button>

            <Link href="/login" className="otp-back text-[var(--muted)] hover:text-[var(--primary)] transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to sign in
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="otp-footer text-[var(--muted)]">
          <ShieldCheck className="w-4 h-4 text-[var(--success)]" />
          Secure verification powered by OneAPI
        </div>
      </div>
    </main>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense
      fallback={
        <div className="otp-page flex items-center justify-center text-[var(--muted)] bg-[var(--background)]">
          Loading verification...
        </div>
      }
    >
      <VerifyOtpContent />
    </Suspense>
  );
}
