'use client';

import React, { useCallback, useEffect, useState ,Suspense} from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Activity,
  ArrowDownRight,
  ArrowLeft,
  FolderGit2,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  KeyRound,
  Layers3,
  Loader2,
  RefreshCw,
  ShieldCheck,
  TerminalSquare,
  Workflow,
  Zap,
} from 'lucide-react';
import { authStorage, fetchApi } from '@/lib/api';

interface GatewayLog {
  _id?: string;
  createdAt: string;
  category?: string;
  endpoint?: string;
  finalProvider?: string;
  statusCode?: number;
  latencyMs?: number;
  fallbackTriggered?: boolean;
}

interface OverviewData {
  totalRequests: number;
  totalFallbacks: number;
  fallbackRatePercentage: string;
  averageLatencyMs: number;
  activeKeysCount: number;
  configuredVaultCount: number;
  recentLogs: GatewayLog[];
}

const initialOverview: OverviewData = {
  totalRequests: 0,
  totalFallbacks: 0,
  fallbackRatePercentage: '0.00%',
  averageLatencyMs: 0,
  activeKeysCount: 0,
  configuredVaultCount: 0,
  recentLogs: [],
};

function formatNumber(value?: number) {
  return new Intl.NumberFormat('en-IN').format(value ?? 0);
}

function formatTime(value?: string) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function getInitials(name?: string) {
  if (!name?.trim()) return 'D';
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function OverviewContent() {
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [overview, setOverview] = useState<OverviewData>(initialOverview);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);

    try {
      const storedUser = authStorage.getUser();
      if (storedUser) setUser(storedUser);

      const paramProjectId = searchParams.get('project') || searchParams.get('projectId');
      if (paramProjectId) {
        authStorage.setProjectId(paramProjectId);
      }

      const storedProject = authStorage.getActiveProject();
      // if (storedProject) setCurrentProject(storedProject);

      const targetProjectId = paramProjectId || storedProject?._id || storedProject?.id;
      const overviewPath = targetProjectId
        ? `/api/v1/dashboard/overview?projectId=${encodeURIComponent(targetProjectId)}`
        : '/api/v1/dashboard/overview';

      const [userRes, overviewRes] = await Promise.all([
        fetchApi('/api/v1/auth/me').catch(() => null),
        fetchApi(overviewPath).catch(() => null),
      ]);

      if (userRes?.success && userRes.data?.user) {
        setUser(userRes.data.user);
        authStorage.setUser(userRes.data.user);
      }

      if (overviewRes?.success && overviewRes.data) {
        const raw = overviewRes.data;
        const m = raw.metrics || {};
        setOverview({
          ...initialOverview,
          ...raw,
          ...m,
          totalRequests: raw.totalRequests ?? m.totalRequests ?? 0,
          totalFallbacks: raw.totalFallbacks ?? m.totalFallbacks ?? 0,
          fallbackRatePercentage: raw.fallbackRatePercentage ?? m.fallbackRatePercentage ?? '0.00%',
          averageLatencyMs: raw.averageLatencyMs ?? m.averageLatencyMs ?? 0,
          activeKeysCount: raw.activeKeysCount ?? m.activeKeysCount ?? 0,
          configuredVaultCount: raw.configuredVaultCount ?? m.configuredVaultCount ?? 0,
          recentLogs: Array.isArray(raw.recentLogs)
            ? raw.recentLogs
            : [],
        });
      } else {
        setLoadError(
          overviewRes?.error?.message ||
            'We could not refresh your workspace metrics. Please try again.',
        );
      }
    } catch (error) {
      console.error('Failed to load dashboard overview:', error);
      setLoadError('Unable to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    void loadData();

    const handleProjectChanged = () => {
      void loadData();
    };

    window.addEventListener('oneapi_project_changed', handleProjectChanged);

    const interval = setInterval(() => {
      void loadData();
    }, 15000);

    const handleFocus = () => {
      void loadData();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('oneapi_project_changed', handleProjectChanged);
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, [loadData]);

  const metrics = [
    {
      label: 'Total requests',
      value: formatNumber(overview.totalRequests),
      detail: 'Requests processed by the gateway',
      icon: Activity,
      accent: 'metric-accent-violet',
    },
    {
      label: 'Fallback events',
      value: formatNumber(overview.totalFallbacks),
      detail: `${overview.fallbackRatePercentage || '0.00%'} of total requests`,
      icon: Workflow,
      accent: 'metric-accent-cyan',
    },
    {
      label: 'Active API keys',
      value: formatNumber(overview.activeKeysCount),
      detail: 'Credentials available to your projects',
      icon: KeyRound,
      accent: 'metric-accent-indigo',
    },
    {
      label: 'Vault credentials',
      value: formatNumber(overview.configuredVaultCount),
      detail: 'Encrypted provider credentials',
      icon: ShieldCheck,
      accent: 'metric-accent-emerald',
    },
  ];

  return (
    <main className="dashboard-page bg-[var(--surface-secondary)] space-y-7">
            {/* Page heading */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link
            href="/dashboard/projects"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--surface)] hover:bg-[var(--surface-secondary)] text-[var(--foreground)] text-xs font-semibold shadow-sm transition-all mb-2.5 w-fit cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-[var(--primary)]" />
            <span>Back to Projects</span>
          </Link>
          <div className="mb-2 flex items-center gap-2">
            <span className="dashboard-overline">WORKSPACE</span>
            <span className="dashboard-overline-divider" />
            <span className="text-xs dashboard-muted">Overview</span>
          </div>

          <h1 className="dashboard-heading text-2xl font-semibold tracking-tight sm:text-[30px]">
            Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
          </h1>
          <p className="dashboard-description mt-1.5 text-sm">
            A clear view of your API traffic, credentials and gateway activity.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void loadData()}
            disabled={loading}
            className="dashboard-secondary-button inline-flex h-10 items-center justify-center gap-2 rounded-lg px-3.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <Link
            href="/dashboard/providers"
            className="dashboard-primary-button inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium"
          >
            Configure providers
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Workspace summary */}
      <section className="dashboard-welcome relative overflow-hidden rounded-2xl border p-5 sm:p-7">
        <div className="dashboard-welcome-decoration" aria-hidden="true" />
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-medium dashboard-welcome-label">
              <span className="dashboard-live-dot" />
              ONEAPI GATEWAY
            </div>

            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
              Your API infrastructure, in one place.
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 dashboard-welcome-copy">
              Monitor requests, manage upstream providers and keep your
              integrations organised from a single workspace.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard/keys" className="dashboard-welcome-action">
              <KeyRound className="h-4 w-4" />
              Manage API keys
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link href="/dashboard/providers" className="dashboard-welcome-action dashboard-welcome-action-secondary">
              <Layers3 className="h-4 w-4" />
              View providers
            </Link>
          </div>
        </div>
      </section>

      {/* Metrics */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="dashboard-section-title">Gateway metrics</h2>
            <p className="dashboard-section-description">
              Key figures from your workspace
            </p>
          </div>
          <span className="dashboard-period-label">ALL TIME</span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => {
            const Icon = metric.icon;

            return (
              <article key={metric.label} className="dashboard-metric-card">
                <div className="flex items-start justify-between gap-3">
                  <p className="dashboard-metric-label">{metric.label}</p>
                  <span className={`dashboard-metric-icon ${metric.accent}`}>
                    <Icon className="h-[17px] w-[17px]" strokeWidth={1.8} />
                  </span>
                </div>

                <div className="mt-4 flex items-baseline gap-2">
                  <span className="dashboard-metric-value tabular-nums">
                    {loading ? '—' : metric.value}
                  </span>
                </div>

                <p className="dashboard-metric-detail mt-2">{metric.detail}</p>
              </article>
            );
          })}
        </div>
      </section>

      {/* Operational snapshot */}
      <section className="grid grid-cols-1 gap-3 lg:grid-cols-[1.35fr_0.65fr]">
        <article className="dashboard-panel p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="dashboard-section-title">Request performance</h2>
              <p className="dashboard-section-description">
                Current gateway performance indicators
              </p>
            </div>
            <span className="dashboard-subtle-icon">
              <Activity className="h-4 w-4" />
            </span>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <p className="dashboard-metric-label">Average latency</p>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="dashboard-secondary-value tabular-nums">
                  {loading ? '—' : formatNumber(overview.averageLatencyMs)}
                </span>
                <span className="dashboard-unit">ms</span>
              </div>
              <p className="dashboard-metric-detail mt-1">
                Average response time
              </p>
            </div>

            <div className="sm:border-l sm:pl-6 dashboard-performance-divider">
              <p className="dashboard-metric-label">Fallback rate</p>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="dashboard-secondary-value tabular-nums">
                  {loading ? '—' : overview.fallbackRatePercentage || '0.00%'}
                </span>
              </div>
              <p className="dashboard-metric-detail mt-1">
                Requests routed through a fallback
              </p>
            </div>
          </div>
        </article>

        <article className="dashboard-panel p-5 sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="dashboard-section-title">Workspace shortcuts</h2>
              <p className="dashboard-section-description">
                Common management tasks
              </p>
            </div>
            <span className="dashboard-subtle-icon">
              <Zap className="h-4 w-4" />
            </span>
          </div>

          <div className="mt-4 divide-y dashboard-list-divider">
            <Link href="/dashboard/keys" className="dashboard-shortcut">
              <span className="dashboard-shortcut-icon">
                <KeyRound className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">API keys</span>
                <span className="dashboard-metric-detail">Manage client access</span>
              </span>
              <ArrowUpRight className="h-4 w-4 dashboard-muted" />
            </Link>

            <Link href="/dashboard/providers" className="dashboard-shortcut">
              <span className="dashboard-shortcut-icon">
                <Layers3 className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">Providers</span>
                <span className="dashboard-metric-detail">Configure integrations</span>
              </span>
              <ArrowUpRight className="h-4 w-4 dashboard-muted" />
            </Link>
          </div>
        </article>
      </section>

      {/* Gateway activity */}
      <section className="dashboard-panel overflow-hidden">
        <div className="flex flex-col gap-3 border-b dashboard-panel-divider px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-start gap-3">
            <span className="dashboard-activity-icon">
              <TerminalSquare className="h-4 w-4" />
            </span>
            <div>
              <h2 className="dashboard-section-title">Recent gateway activity</h2>
              <p className="dashboard-section-description">
                The latest requests recorded by your gateway
              </p>
            </div>
          </div>

          <span className="dashboard-period-label">LATEST RECORDS</span>
        </div>

        {loadError && (
          <div className="mx-5 mt-4 rounded-lg border border-rose-500/20 bg-rose-500/5 px-4 py-3 text-sm text-rose-400 sm:mx-6">
            {loadError}
          </div>
        )}

        {loading ? (
          <div className="space-y-3 p-5 sm:p-6" aria-label="Loading activity">
            {[0, 1, 2].map((item) => (
              <div key={item} className="dashboard-skeleton-row">
                <span className="dashboard-skeleton h-4 w-24" />
                <span className="dashboard-skeleton h-4 w-20" />
                <span className="dashboard-skeleton h-4 flex-1" />
                <span className="dashboard-skeleton h-4 w-14" />
              </div>
            ))}
          </div>
        ) : overview.recentLogs.length === 0 ? (
          <div className="px-5 py-12 text-center sm:px-6">
            <div className="dashboard-empty-icon mx-auto">
              <Clock3 className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-sm font-semibold">No requests recorded yet</h3>
            <p className="dashboard-section-description mx-auto mt-1 max-w-md leading-6">
              Once your application sends requests through OneAPI, request
              details and gateway responses will appear here.
            </p>
            <Link
              href="/dashboard/providers"
              className="dashboard-text-link mt-4 inline-flex items-center gap-1.5 text-sm font-medium"
            >
              Test a provider
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="dashboard-table w-full min-w-[760px] text-left">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Category</th>
                  <th>Endpoint</th>
                  <th>Provider</th>
                  <th>Status</th>
                  <th>Latency</th>
                  <th>Routing</th>
                </tr>
              </thead>
              <tbody>
                {overview.recentLogs.map((log, index) => {
                  const successful =
                    typeof log.statusCode === 'number' &&
                    log.statusCode >= 200 &&
                    log.statusCode < 400;

                  return (
                    <tr key={log._id || `${log.createdAt}-${log.endpoint}-${index}`}>
                      <td className="whitespace-nowrap">{formatTime(log.createdAt)}</td>
                      <td className="capitalize">{log.category || '—'}</td>
                      <td>
                        <span className="dashboard-endpoint" title={log.endpoint}>
                          {log.endpoint || '—'}
                        </span>
                      </td>
                      <td>{log.finalProvider || '—'}</td>
                      <td>
                        <span className={`dashboard-status ${successful ? 'is-success' : 'is-error'}`}>
                          <span className="dashboard-status-dot" />
                          {typeof log.statusCode === 'number' ? log.statusCode : 'Unknown'}
                        </span>
                      </td>
                      <td className="whitespace-nowrap">
                        {typeof log.latencyMs === 'number' ? `${log.latencyMs} ms` : '—'}
                      </td>
                      <td>
                        {log.fallbackTriggered ? (
                          <span className="dashboard-route-tag is-fallback">
                            <ArrowDownRight className="h-3 w-3" />
                            Fallback
                          </span>
                        ) : (
                          <span className="dashboard-route-tag">Direct</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && overview.recentLogs.length > 0 && (
          <div className="flex items-center justify-between border-t dashboard-panel-divider px-5 py-3 sm:px-6">
            <span className="dashboard-metric-detail">
              Showing {overview.recentLogs.length} recent records
            </span>
            <span className="dashboard-metric-detail inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 dashboard-success-icon" />
              Gateway records loaded
            </span>
          </div>
        )}
      </section>

      {/* Workspace identity */}
      <footer className="flex flex-col gap-1 border-t dashboard-panel-divider pt-4 text-xs sm:flex-row sm:items-center sm:justify-between">
        <span className="dashboard-muted">
          Signed in as <strong className="dashboard-footer-name">{user?.email || 'your account'}</strong>
        </span>
        <span className="dashboard-muted">OneAPI workspace</span>
      </footer>
    </main>
  );
}

export default function OverviewPage() {
  return (
    <Suspense
      fallback={
        <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-500 text-xs">
          <Loader2 className="w-6 h-6 animate-spin text-violet-300" />
          <span>Loading project overview...</span>
        </div>
      }
    >
      <OverviewContent />
    </Suspense>
  );
}
