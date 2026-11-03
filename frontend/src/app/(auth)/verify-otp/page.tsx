'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShieldCheck, Mail, ArrowRight, RefreshCw, ArrowLeft } from 'lucide-react';
import { fetchApi, authStorage } from '@/lib/api';

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

      setSuccessMsg('Account verified successfully! Logging you in...');

      // Save tokens and session
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
      setError('Email address is required to resend verification code.');
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
        setError(res.error?.message || 'Failed to dispatch new OTP.');
        setResending(false);
        return;
      }

      setSuccessMsg('A new 6-digit code has been dispatched. (Check backend dev console)');
      setResending(false);
    } catch (err: any) {
      setError(err.message || 'Error requesting code resend.');
      setResending(false);
    }
  };

  return (
    <div>
      <div className="mb-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mx-auto mb-3">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">Verify Your Email</h2>
        <p className="text-xs text-slate-400 mt-1">
          Enter the 6-digit verification code sent to your email address (check backend console in dev mode).
        </p>
      </div>

      {error && (
        <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
          {error}
        </div>
      )}

      {successMsg && (
        <div className="mb-5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
          {successMsg}
        </div>
      )}

      <form onSubmit={handleVerify} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            <input
              type="email"
              placeholder="developer@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-slate-700/80 rounded-xl text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">6-Digit OTP Code</label>
          <input
            type="text"
            placeholder="123456"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            maxLength={6}
            required
            className="w-full px-4 py-2.5 bg-slate-900/60 border border-slate-700/80 rounded-xl text-white text-center text-lg tracking-widest font-mono font-bold placeholder:text-slate-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-semibold text-sm h-11 rounded-xl shadow-lg shadow-sky-500/25 mt-2 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
        >
          {loading ? (
            <span>Verifying...</span>
          ) : (
            <>
              <span>Verify & Continue</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 flex items-center justify-between text-xs text-slate-400">
        <button
          type="button"
          onClick={handleResend}
          disabled={resending}
          className="text-sky-400 hover:underline inline-flex items-center gap-1 font-semibold disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
          {resending ? 'Sending...' : 'Resend Code'}
        </button>

        <Link href="/login" className="inline-flex items-center gap-1 hover:text-slate-200">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
        </Link>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<div className="text-center text-xs text-slate-400 py-6">Loading verification...</div>}>
      <VerifyOtpContent />
    </Suspense>
  );
}
