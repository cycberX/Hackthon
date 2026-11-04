
'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  KeyRound,
  Plus,
  Trash2,
  Copy,
  Check,
  CheckCircle2,
  ShieldCheck,
  Key,
  RefreshCw,
  Eye,
  EyeOff,
  AlertCircle,
  LockKeyhole,
  ArrowUpRight,
  Terminal,
} from 'lucide-react';
import { authStorage, fetchApi } from '@/lib/api';

const STORAGE_LATEST_RAW_KEY = 'oneapi_latest_raw_developer_api_key';

interface ApiKey {
  _id: string;
  name: string;
  keyPrefix: string;
  fullKey?: string;
  scopes?: string[];
  isActive?: boolean;
  createdAt: string;
}
const card =
  'rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm';

const primaryButton =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2.5 text-xs font-semibold text-[var(--primary-foreground)] transition-all hover:bg-[var(--primary-hover)] disabled:cursor-not-allowed disabled:opacity-50';

const secondaryButton =
  'inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)] px-3.5 py-2.5 text-xs font-semibold text-[var(--foreground)] transition-all hover:border-[var(--primary)] hover:bg-[var(--surface)] disabled:opacity-50';

const inputClass =
  'w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted)] transition-all focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10';
export default function ApiKeysPage() {
  const [user, setUser] = useState<any>(null);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [creatingApiKey, setCreatingApiKey] = useState(false);
  const [freshRawApiKey, setFreshRawApiKey] = useState<string | null>(null);
  const [showFreshKey, setShowFreshKey] = useState(false);
  const [keyToValidate, setKeyToValidate] = useState('');
  const [validatingKey, setValidatingKey] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [revealedKeys, setRevealedKeys] = useState<Record<string, boolean>>({});
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const stored = authStorage.getUser();
      if (stored) setUser(stored);

      const savedRaw = localStorage.getItem(STORAGE_LATEST_RAW_KEY);
      if (savedRaw) setFreshRawApiKey(savedRaw);

      const [userRes, keysRes] = await Promise.all([
        fetchApi('/api/v1/auth/me'),
        fetchApi('/api/v1/auth/api-keys'),
      ]);

      if (userRes?.success && userRes.data?.user) {
        setUser(userRes.data.user);
        authStorage.setUser(userRes.data.user);
      }

      if (keysRes?.success && keysRes.data?.apiKeys) {
        setApiKeys(keysRes.data.apiKeys);
      } else {
        setError(keysRes?.message || 'Unable to load API keys.');
      }
    } catch (err: any) {
      console.error('Failed to load API keys:', err);
      setError(err.message || 'Failed to load API keys.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    const handleProjectChanged = () => {
      loadData();
    };

    window.addEventListener('oneapi_project_changed', handleProjectChanged);
    return () => {
      window.removeEventListener('oneapi_project_changed', handleProjectChanged);
    };
  }, [loadData]);

  const toggleRevealKey = (keyId: string) => {
    setRevealedKeys((prev) => ({
      ...prev,
      [keyId]: !prev[keyId],
    }));
  };

  const copyToClipboard = async (value: string, id: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Clipboard copy failed:', err);
      setError('Unable to copy. Check your browser clipboard permissions.');
    }
  };

  const handleCreateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();

    setCreatingApiKey(true);
    setError('');

    try {
      const res = await fetchApi('/api/v1/auth/create-api-key', {
        method: 'POST',
        body: JSON.stringify({
          name: newKeyName.trim() || 'Production Key',
          scopes: ['read', 'write', 'proxy'],
        }),
      });

      const rawKey =
        res.data?.rawApiKey ||
        res.data?.apiKey ||
        res.data?.fullKey;

      if (!res.success || !rawKey) {
        throw new Error(res.message || 'API key creation failed.');
      }

      setFreshRawApiKey(rawKey);
      setShowFreshKey(false);
      localStorage.setItem(STORAGE_LATEST_RAW_KEY, rawKey);

      setNewKeyName('');
      await loadData();
    } catch (err: any) {
      console.error('Failed to create API key:', err);
      setError(err.message || 'Failed to create API key.');
    } finally {
      setCreatingApiKey(false);
    }
  };

  const handleDeleteApiKey = async (keyId: string) => {
    const confirmed = window.confirm(
      'Are you sure you want to revoke this API key? Applications using it will immediately be rejected.'
    );

    if (!confirmed) return;

    setError('');

    try {
      const res = await fetchApi(`/api/v1/auth/api-keys/${keyId}`, {
        method: 'DELETE',
      });

      if (!res.success) {
        throw new Error(res.message || 'Unable to revoke API key.');
      }

      await loadData();
    } catch (err: any) {
      console.error('Failed to delete API key:', err);
      setError(err.message || 'Failed to revoke API key.');
    }
  };

  const handleValidateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!keyToValidate.trim() || !user) return;

    setValidatingKey(true);
    setValidationResult(null);

    try {
      const res = await fetchApi('/api/v1/auth/api-keys/validate', {
        method: 'POST',
        body: JSON.stringify({
          apiKey: keyToValidate.trim(),
          userId: user.user_id || user._id,
          email: user.email,
        }),
      });

      setValidationResult(res);
    } catch (err: any) {
      setValidationResult({
        success: false,
        error: { message: err.message || 'Validation failed.' },
      });
    } finally {
      setValidatingKey(false);
    }
  };

  const getKeyDisplay = (key: string) => {
    if (key.length <= 16) return key;
    return `${key.slice(0, 12)}${'•'.repeat(24)}${key.slice(-4)}`;
  };

  const isValidationSuccessful =
    validationResult?.valid || validationResult?.success;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-7 pb-10 text-[var(--foreground)]">

      {/* Header */}
      <section className={`${card} relative overflow-hidden p-6 sm:p-8`}>
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[var(--primary)]/10 blur-3xl" />

        <div className="relative flex flex-col gap-7">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
            <div className="max-w-2xl">
              <div className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--primary)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--primary)]" />
                Authentication Engine
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--primary)]/10 text-[var(--primary)]">
                  <KeyRound size={23} />
                </div>

                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Developer API Keys
                </h1>

                <span className="rounded-full border border-[var(--border)] bg-[var(--surface-secondary)] px-3 py-1 text-xs font-semibold text-[var(--foreground)]">
                  {apiKeys.length} keys
                </span>
              </div>

              <p className="mt-4 max-w-xl text-sm leading-6 text-[var(--muted)]">
                Generate and manage API keys to authenticate application
                servers and the official <code className="rounded-md bg-[var(--surface-secondary)] px-1.5 py-1 font-mono text-[var(--primary)]">@oneapi/sdk</code>
                {' '}against your proxy gateway.
              </p>
            </div>

            <div className="flex w-fit items-center gap-2 rounded-full border border-[var(--success)]/20 bg-[var(--success)]/10 px-3 py-2">
              <ShieldCheck size={15} className="text-[var(--success)]" />
              <span className="text-xs font-semibold text-[var(--success)]">
                Secure Key Management
              </span>
            </div>
          </div>

          <form
            onSubmit={handleCreateApiKey}
            className="flex flex-col gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3 sm:flex-row"
          >
            <input
              type="text"
              placeholder="Key name (e.g. Production Backend)"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              required
              maxLength={80}
              className="min-w-0 flex-1 rounded-xl border border-transparent bg-transparent px-3 py-3 text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted)] focus:border-[var(--border)]"
            />

            <button
              type="submit"
              disabled={creatingApiKey}
              className={`${primaryButton} min-h-11 px-5`}
            >
              <Plus size={16} />
              {creatingApiKey ? 'Generating...' : 'Create API Key'}
            </button>
          </form>
        </div>
      </section>

      {/* Error */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-[var(--danger)]/20 bg-[var(--danger)]/10 p-4 text-sm text-[var(--danger)]"
        >
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span className="flex-1">{error}</span>
          <button
            type="button"
            onClick={() => setError('')}
            className="text-xs font-semibold underline underline-offset-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Newly Generated Key */}
      {freshRawApiKey && (
        <section className="overflow-hidden rounded-2xl border border-[var(--success)]/30 bg-[var(--card)] shadow-[var(--shadow)]">
          <div className="flex flex-col justify-between gap-4 border-b border-[var(--success)]/20 bg-[var(--success)]/5 p-5 sm:flex-row sm:items-center sm:p-6">
            <div>
              <h2 className="flex items-center gap-2 text-base font-bold text-[var(--success)]">
                <CheckCircle2 size={19} />
                Your API key is ready
              </h2>
              <p className="mt-1.5 text-xs leading-5 text-[var(--muted)]">
                Copy and securely store this key. Treat it like a password.
                It may not be retrievable again from the server.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={secondaryButton}
                onClick={() => setShowFreshKey(!showFreshKey)}
              >
                {showFreshKey ? <EyeOff size={15} /> : <Eye size={15} />}
                {showFreshKey ? 'Hide' : 'Reveal'}
              </button>

              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--success)] px-4 py-2.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                onClick={() => copyToClipboard(freshRawApiKey, 'fresh')}
              >
                {copiedId === 'fresh' ? <Check size={15} /> : <Copy size={15} />}
                {copiedId === 'fresh' ? 'Copied!' : 'Copy API Key'}
              </button>
            </div>
          </div>

          <div className="space-y-4 p-5 sm:p-6">
            <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
              <code className="block min-w-max break-all font-mono text-sm text-[var(--foreground)]">
                {showFreshKey
                  ? freshRawApiKey
                  : getKeyDisplay(freshRawApiKey)}
              </code>
            </div>

            <p className="flex items-start gap-2 text-xs leading-5 text-[var(--success)]">
              <ShieldCheck size={15} className="mt-0.5 shrink-0" />
              Keep this secret private. Never expose it in frontend code or
              public repositories.
            </p>
          </div>
        </section>
      )}

      {/* Registered API Keys */}
      <section className={`${card} overflow-hidden`}>
        <div className="flex flex-col justify-between gap-4 border-b border-[var(--border)] p-5 sm:flex-row sm:items-center sm:p-6">
          <div>
            <h2 className="flex items-center gap-2 text-base font-bold">
              <Key size={18} className="text-[var(--primary)]" />
              Registered API Keys
            </h2>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Manage your existing API keys and their permissions.
            </p>
          </div>

          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className={secondaryButton}
          >
            <RefreshCw
              size={15}
              className={loading ? 'animate-spin' : ''}
            />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-[var(--muted)]">
            <RefreshCw size={25} className="animate-spin text-[var(--primary)]" />
            <p className="text-sm">Loading your API keys...</p>
          </div>
        ) : apiKeys.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-5 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--surface-secondary)] text-[var(--muted)]">
              <Key size={26} />
            </div>
            <h3 className="text-sm font-bold">No API keys yet</h3>
            <p className="mt-2 max-w-sm text-xs leading-5 text-[var(--muted)]">
              Create your first developer API key to start authenticating
              applications through OneAPI.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--surface-secondary)]">
                  {['Name', 'API Key Identifier', 'Scopes', 'Status', 'Created', 'Actions'].map((heading) => (
                    <th
                      key={heading}
                      className="px-5 py-4 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-[var(--border)]">
                {apiKeys.map((k) => {
                  const fullKey =
                    k.fullKey ||
                    (freshRawApiKey &&
                    freshRawApiKey.startsWith(k.keyPrefix?.slice(0, 10))
                      ? freshRawApiKey
                      : null);

                  const isRevealed = !!revealedKeys[k._id];
                  const keyToCopy = fullKey || k.keyPrefix;
                  const displayString =
                    isRevealed && fullKey ? fullKey : k.keyPrefix;

                  return (
                    <tr
                      key={k._id}
                      className="transition-colors hover:bg-[var(--surface)]"
                    >
                      <td className="px-5 py-4">
                        <span className="text-sm font-semibold text-[var(--foreground)]">
                          {k.name}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <code className="max-w-52 truncate rounded-lg bg-[var(--surface-secondary)] px-2.5 py-2 font-mono text-xs text-[var(--foreground)]">
                            {displayString}
                          </code>

                          <button
                            type="button"
                            onClick={() => toggleRevealKey(k._id)}
                            disabled={!fullKey}
                            title={isRevealed ? 'Mask key' : 'Reveal full key'}
                            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2 text-[var(--muted)] transition-colors hover:border-[var(--primary)] hover:text-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {isRevealed ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              copyToClipboard(keyToCopy, `row-${k._id}`)
                            }
                            title="Copy available key value"
                            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2 text-[var(--muted)] transition-colors hover:border-[var(--primary)] hover:text-[var(--primary)]"
                          >
                            {copiedId === `row-${k._id}` ? (
                              <Check size={14} className="text-[var(--success)]" />
                            ) : (
                              <Copy size={14} />
                            )}
                          </button>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {(k.scopes?.length
                            ? k.scopes
                            : ['read', 'write', 'proxy']
                          ).map((scope) => (
                            <span
                              key={scope}
                              className="rounded-md border border-[var(--border)] bg-[var(--surface-secondary)] px-2 py-1 text-[10px] font-medium text-[var(--muted)]"
                            >
                              {scope}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                            k.isActive !== false
                              ? 'bg-[var(--success)]/10 text-[var(--success)]'
                              : 'bg-[var(--danger)]/10 text-[var(--danger)]'
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${
                            k.isActive !== false
                              ? 'bg-[var(--success)]'
                              : 'bg-[var(--danger)]'
                          }`} />
                          {k.isActive !== false ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-xs text-[var(--muted)]">
                        {k.createdAt
                          ? new Date(k.createdAt).toLocaleDateString()
                          : '—'}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteApiKey(k._id)}
                          title="Revoke API key"
                          className="rounded-lg border border-[var(--danger)]/20 bg-[var(--danger)]/5 p-2.5 text-[var(--danger)] transition-colors hover:bg-[var(--danger)]/15"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="border-t border-[var(--border)] bg-[var(--surface)] px-5 py-4">
          <p className="text-[11px] leading-5 text-[var(--muted)]">
            Previously generated full keys are not necessarily available
            from the API. Only the original key can be copied when it is
            still available.
          </p>
        </div>
      </section>

      {/* API Key Validation */}
      <section className={`${card} overflow-hidden`}>
        <div className="flex flex-col justify-between gap-4 border-b border-[var(--border)] p-5 sm:flex-row sm:items-center sm:p-6">
          <div>
            <h2 className="flex items-center gap-2 text-base font-bold">
              <ShieldCheck size={19} className="text-[var(--primary)]" />
              Server-Side Key Validation
            </h2>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Test an API key using the validation endpoint.
            </p>
          </div>

          {freshRawApiKey && (
            <button
              type="button"
              onClick={() => setKeyToValidate(freshRawApiKey)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--primary)] transition-colors hover:text-[var(--primary-hover)]"
            >
              Use latest generated key
              <ArrowUpRight size={14} />
            </button>
          )}
        </div>

        <div className="p-5 sm:p-6">
          <form
            onSubmit={handleValidateApiKey}
            className="flex flex-col gap-3 sm:flex-row"
          >
            <div className="relative flex-1">
              <Terminal
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]"
              />
              <input
                type="password"
                placeholder="Paste your full API key (sk_live_...)"
                value={keyToValidate}
                onChange={(e) => setKeyToValidate(e.target.value)}
                required
                autoComplete="off"
                className={`${inputClass} pl-10`}
              />
            </div>

            <button
              type="submit"
              disabled={validatingKey || !keyToValidate.trim()}
              className={`${primaryButton} min-h-11 sm:min-w-36`}
            >
              {validatingKey ? (
                <>
                  <RefreshCw size={15} className="animate-spin" />
                  Validating...
                </>
              ) : (
                <>
                  <ShieldCheck size={15} />
                  Validate Key
                </>
              )}
            </button>
          </form>

          {validationResult && (
            <div
              className={`mt-5 overflow-hidden rounded-xl border ${
                isValidationSuccessful
                  ? 'border-[var(--success)]/25 bg-[var(--success)]/5'
                  : 'border-[var(--danger)]/25 bg-[var(--danger)]/5'
              }`}
            >
              <div
                className={`flex items-center gap-2 border-b px-4 py-3 ${
                  isValidationSuccessful
                    ? 'border-[var(--success)]/20 text-[var(--success)]'
                    : 'border-[var(--danger)]/20 text-[var(--danger)]'
                }`}
              >
                {isValidationSuccessful ? (
                  <CheckCircle2 size={17} />
                ) : (
                  <AlertCircle size={17} />
                )}

                <strong className="text-xs font-bold">
                  {isValidationSuccessful
                    ? 'Validation successful'
                    : 'Validation failed'}
                </strong>
              </div>

              <pre className="max-h-72 overflow-auto p-4 font-mono text-xs leading-6 text-[var(--foreground)]">
                {JSON.stringify(validationResult, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <div className="flex flex-col items-center justify-between gap-2 border-t border-[var(--border)] pt-5 sm:flex-row">
        <p className="text-[11px] text-[var(--muted)]">
          OneAPI Developer Authentication
        </p>
        <div className="flex items-center gap-1.5 text-[11px] text-[var(--muted)]">
          <LockKeyhole size={13} />
          Secure API key management
        </div>
      </div>
    </div>
  );
}
