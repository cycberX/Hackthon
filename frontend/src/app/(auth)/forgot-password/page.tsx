'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, ArrowRight, ArrowLeft } from 'lucide-react';
import { fetchApi } from '@/lib/api';

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetchApi('/api/v1/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });

      if (!res.success) {
        setError(res.error?.message || 'Failed to dispatch reset code.');
        setLoading(false);
        return;
      }

      router.push(`/reset-password?email=${encodeURIComponent(email)}`);
    } catch (err: any) {
      setError(err.message || 'Error sending recovery instructions.');
      setLoading(false);
    }
  };

  return (
    <div className="w-full text-[var(--foreground)]">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-[var(--foreground)] tracking-tight">Recover Password</h2>
        <p className="text-xs text-[var(--muted)] mt-1">
          Enter your registered email address to receive a 6-digit password reset code.
        </p>
      </div>

      {error && (
        <div className="mb-5 p-3 rounded-xl bg-[var(--danger)]/10 text-[var(--danger)] text-xs font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-[var(--foreground)] mb-1.5">Registered Email</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)] pointer-events-none" />
            <input
              type="email"
              placeholder="developer@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full pl-10 pr-4 py-2.5 bg-[var(--surface-input)] rounded-xl text-[var(--foreground)] text-sm placeholder:text-[var(--muted)] outline-none focus:ring-2 focus:ring-[var(--primary)]/20 transition-all"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-semibold text-sm h-11 rounded-xl shadow-md shadow-[var(--primary)]/20 mt-2 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
        >
          {loading ? (
            <span>Sending code...</span>
          ) : (
            <>
              <span>Send Reset Code</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        <div className="text-center pt-2">
          <Link
            href="/login"
            className="text-xs text-[var(--muted)] hover:text-[var(--primary)] transition-colors inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Sign In</span>
          </Link>
        </div>
      </form>
    </div>
  );
}
