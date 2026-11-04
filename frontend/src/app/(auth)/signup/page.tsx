'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Mail,
  Lock,
  User,
  Phone,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { fetchApi } from '@/lib/api';

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!termsAccepted) {
      setError('You must accept the terms & conditions to create an account.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetchApi('/api/v1/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          name,
          phone_no: phone,
          email,
          password,
          terms_accepted: true,
        }),
      });

      if (!res.success) {
        setError(res.error?.message || 'Failed to register account.');
        setLoading(false);
        return;
      }

      router.push(`/verify-otp?email=${encodeURIComponent(email)}`);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
      setLoading(false);
    }
  };

  const inputClass =
    'w-full h-11 pl-10 pr-10 rounded-xl text-sm outline-none transition-all bg-[var(--surface-input)] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:ring-2 focus:ring-[var(--primary)]/20';

  const labelClass =
    'block text-xs font-semibold text-[var(--foreground)] mb-1.5';

  return (
    <div className="auth-glass-card w-full text-[var(--foreground)]">
      {/* Heading */}
      <div className="mb-7">
        <p className="text-[11px] uppercase tracking-[0.18em] font-semibold text-[var(--primary)] mb-3">
          Start for free
        </p>

        <h1 className="text-3xl sm:text-[34px] font-bold tracking-tight text-[var(--foreground)]">
          Create your account<span className="text-[var(--primary)]">.</span>
        </h1>

        <p className="text-sm text-[var(--muted)] mt-2">
          Already have an account?{' '}
          <Link
            href="/login"
            className="text-[var(--primary)] font-semibold hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>

      {/* Error */}
      {error && (
        <div
          role="alert"
          className="mb-5 p-3 rounded-xl bg-[var(--danger)]/10 text-[var(--danger)] text-sm font-medium"
        >
          {error}
        </div>
      )}

      {/* Signup form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name and phone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Full name</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Phone number</label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
              <input
                type="tel"
                placeholder="Phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                autoComplete="tel"
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Email */}
        <div>
          <label className={labelClass}>Email address</label>
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
          <label className={labelClass}>Password</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />

            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Minimum 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              className={inputClass}
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

          <p className="text-[11px] text-[var(--muted)] mt-1.5">
            Use at least 8 characters.
          </p>
        </div>

        {/* Terms */}
        <div className="flex items-start gap-2.5 pt-1">
          <input
            id="terms"
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className="mt-0.5 w-4 h-4 accent-[var(--primary)] cursor-pointer shrink-0"
          />

          <label
            htmlFor="terms"
            className="text-xs text-[var(--muted)] leading-relaxed cursor-pointer"
          >
            I agree to the{' '}
            <Link href="/terms" className="text-[var(--primary)] font-medium hover:underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-[var(--primary)] font-medium hover:underline">
              Privacy Policy
            </Link>
            .
          </label>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full h-11 mt-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 shadow-md shadow-[var(--primary)]/20 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            'Creating account...'
          ) : (
            <>
              Create account
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Security */}
      <div className="mt-6 pt-5 flex items-center justify-center gap-2 text-xs text-[var(--muted)]">
        <ShieldCheck className="w-4 h-4 text-[var(--success)]" />
        Secure account registration
      </div>
    </div>
  );
}
