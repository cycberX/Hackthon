'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  LogIn,
} from 'lucide-react';
import { fetchApi, authStorage } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetchApi('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (!res.success) {
        if (res.error?.code === 'EMAIL_NOT_VERIFIED') {
          router.push(`/verify-otp?email=${encodeURIComponent(email)}`);
          return;
        }

        setError(res.error?.message || 'Invalid email or password.');
        setLoading(false);
        return;
      }

      if (res.data?.tokens) {
        authStorage.setToken(res.data.tokens.accessToken);
        authStorage.setRefreshToken(res.data.tokens.refreshToken);
        authStorage.setUser(res.data.user);
      }

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed.');
      setLoading(false);
    }
  };

  const inputClass =
    'w-full h-11 pl-10 pr-4 bg-[var(--surface-input)] rounded-xl text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] outline-none transition-all focus:ring-2 focus:ring-[var(--primary)]/20';

  return (
    <div className="w-full max-w-[440px] mx-auto text-[var(--foreground)]">
      {/* Header */}
      <div className="mb-8">
        {/* <div className="w-11 h-11 bg-[var(--primary)]/15 text-[var(--primary)] rounded-xl flex items-center justify-center mb-5">
          <LogIn className="w-5 h-5" />
        </div> */}

        <h1 className="text-[26px] font-bold tracking-tight text-[var(--foreground)]">
          Welcome back
        </h1>

        <p className="text-sm text-[var(--muted)] mt-2 leading-relaxed">
          Sign in to access your OneAPI developer workspace.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div
          role="alert"
          className="mb-5 px-4 py-3 rounded-xl bg-[var(--danger)]/10 text-[var(--danger)] text-sm font-medium"
        >
          {error}
        </div>
      )}

      {/* Login form */}
      <form onSubmit={handleLogin} className="space-y-5">
        {/* Email */}
        <div>
          <label className="block text-[13px] font-medium text-[var(--foreground)] mb-1.5">
            Email address
          </label>

          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />

            <input
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className={inputClass}
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[13px] font-medium text-[var(--foreground)]">
              Password
            </label>

            <Link
              href="/forgot-password"
              className="text-xs font-medium text-[var(--primary)] hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />

            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className={`${inputClass} pr-11`}
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--foreground)]"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full h-11 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 shadow-md shadow-[var(--primary)]/20 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            'Signing in...'
          ) : (
            <>
              Sign in
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Signup link */}
      <div className="mt-7 text-center text-sm text-[var(--muted)]">
        Don&apos;t have an account?{' '}
        <Link
          href="/signup"
          className="text-[var(--primary)] font-semibold hover:underline"
        >
          Create an account
        </Link>
      </div>

      {/* Security */}
      <div className="mt-8 pt-5 flex items-center justify-center gap-2 text-xs text-[var(--muted)]">
        <ShieldCheck className="w-4 h-4 text-[var(--success)]" />
        Secure authentication powered by OneAPI
      </div>
    </div>
  );
}
