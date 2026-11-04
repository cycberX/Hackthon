
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  SlidersHorizontal,
  Zap,
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Clock3,
  Sparkles,
  Server,
  Play,
  RotateCcw,
  Check,
  ChevronRight,
  ExternalLink,
  Plus,
  Trash2,
  Layers,
  Activity,
  Settings2,
  GitBranch,
  Lock,
  CircleDot,
  Save,
  X,
  Gauge,
  Workflow,
  AlertCircle,
} from 'lucide-react';

import { fetchApi } from '@/lib/api';
import {
  PROVIDERS_CATALOG,
  type Category,
} from '@/lib/providersCatalog';

interface RoutingConfigItem {
  category: Category;
  primaryProviderId: string;
  fallbackProviderId: string;
  fallbackProviderIds?: string[];
  timeoutMs: number;
  retryOnStatusCodes: number[];
  isCustomized?: boolean;
  updatedAt?: string | null;
}

const CATEGORY_DETAILS: Record<
  Category,
  {
    title: string;
    subtitle: string;
    icon: string;
    defaultTimeout: number;
    color: string;
    softColor: string;
    borderColor: string;
  }
> = {
  ai: {
    title: 'AI & Large Language Models',
    subtitle: 'Reasoning, chat completion and code generation.',
    icon: '✦',
    defaultTimeout: 25000,
    color: 'text-violet-500',
    softColor: 'bg-violet-500/10',
    borderColor: 'border-violet-500/20',
  },
  weather: {
    title: 'Weather & Meteorological Data',
    subtitle: 'Current weather, forecasts and atmospheric metrics.',
    icon: '☁',
    defaultTimeout: 5000,
    color: 'text-sky-500',
    softColor: 'bg-sky-500/10',
    borderColor: 'border-sky-500/20',
  },
  music: {
    title: 'Music & Audio Catalog',
    subtitle: 'Track metadata, artists and music discovery.',
    icon: '♫',
    defaultTimeout: 5000,
    color: 'text-pink-500',
    softColor: 'bg-pink-500/10',
    borderColor: 'border-pink-500/20',
  },
  news: {
    title: 'Global News & Feeds',
    subtitle: 'News search, articles and headline syndication.',
    icon: '▤',
    defaultTimeout: 5000,
    color: 'text-amber-500',
    softColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/20',
  },
  environment: {
    title: 'Environment & Air Quality',
    subtitle: 'Air quality, PM2.5 and environmental data.',
    icon: '♧',
    defaultTimeout: 5000,
    color: 'text-emerald-500',
    softColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/20',
  },
};

const COMMON_STATUS_CODES = [
  { code: 429, label: '429 Rate Limit' },
  { code: 500, label: '500 Server Error' },
  { code: 502, label: '502 Bad Gateway' },
  { code: 503, label: '503 Unavailable' },
  { code: 504, label: '504 Timeout' },
  { code: 401, label: '401 Auth Error' },
  { code: 410, label: '410 Retired' },
];

const CATEGORIES: Category[] = [
  'ai',
  'weather',
  'music',
  'news',
  'environment',
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-[var(--muted)]">
      {children}
    </p>
  );
}

function StatusPill({
  children,
  type = 'neutral',
}: {
  children: React.ReactNode;
  type?: 'success' | 'warning' | 'info' | 'danger' | 'neutral';
}) {
  const styles = {
    success:
      'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    warning:
      'border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400',
    info: 'border-sky-500/20 bg-sky-500/10 text-sky-600 dark:text-sky-400',
    danger:
      'border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400',
    neutral:
      'border-[var(--border)] bg-[var(--surface-secondary)] text-[var(--muted)]',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${styles[type]}`}
    >
      {children}
    </span>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  detail,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  detail: string;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-[var(--shadow)] sm:p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-[var(--muted)]">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-[var(--foreground)]">
            {value}
          </p>
          <p className="mt-1 text-[10px] text-[var(--muted)]">{detail}</p>
        </div>
        <div className={`rounded-xl bg-[var(--surface-secondary)] p-2.5 ${color}`}>
          <Icon size={19} />
        </div>
      </div>
    </div>
  );
}

export default function RoutingConfigPage() {
  const [routingRules, setRoutingRules] = useState<RoutingConfigItem[]>([]);
  const [vaultSecrets, setVaultSecrets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingCat, setSavingCat] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [testingCat, setTestingCat] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const loadData = async () => {
    setLoading(true);

    try {
      const [rulesRes, vaultRes] = await Promise.all([
        fetchApi('/api/v1/routing').catch(() => null),
        fetchApi('/api/v1/vault').catch(() => null),
      ]);

      if (rulesRes?.success) {
        const rules =
          rulesRes.data?.routingRules || rulesRes.data?.rules || [];
        setRoutingRules(rules);
      }

      if (vaultRes?.success) {
        const secrets =
          vaultRes.data?.vaultSecrets || vaultRes.data?.secrets || [];
        setVaultSecrets(secrets);
      }
    } catch (err) {
      console.error('Failed to load routing data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleProjectChanged = () => {
      loadData();
    };

    window.addEventListener('oneapi_project_changed', handleProjectChanged);
    return () => {
      window.removeEventListener('oneapi_project_changed', handleProjectChanged);
    };
  }, []);

  const showToast = (
    type: 'success' | 'error',
    text: string
  ) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const updateRuleField = (
    category: Category,
    field: keyof RoutingConfigItem,
    value: any
  ) => {
    setRoutingRules((prev) =>
      prev.map((rule) =>
        rule.category === category
          ? { ...rule, [field]: value }
          : rule
      )
    );
  };

  const toggleStatusCode = (category: Category, code: number) => {
    setRoutingRules((prev) =>
      prev.map((rule) => {
        if (rule.category !== category) return rule;

        const current = rule.retryOnStatusCodes || [];
        const exists = current.includes(code);

        return {
          ...rule,
          retryOnStatusCodes: exists
            ? current.filter((c) => c !== code)
            : [...current, code],
        };
      })
    );
  };

  const getFallbackList = (rule: RoutingConfigItem) => {
    return rule.fallbackProviderIds?.length
      ? [...rule.fallbackProviderIds]
      : rule.fallbackProviderId && rule.fallbackProviderId !== 'none'
        ? [rule.fallbackProviderId]
        : [];
  };

  const addFallbackStep = (
    category: Category,
    providerId: string
  ) => {
    setRoutingRules((prev) =>
      prev.map((rule) => {
        if (rule.category !== category) return rule;

        const currentList = getFallbackList(rule);

        if (currentList.includes(providerId)) return rule;

        const updated = [...currentList, providerId];

        return {
          ...rule,
          fallbackProviderIds: updated,
          fallbackProviderId: updated[0] || 'none',
        };
      })
    );
  };

  const removeFallbackStep = (
    category: Category,
    index: number
  ) => {
    setRoutingRules((prev) =>
      prev.map((rule) => {
        if (rule.category !== category) return rule;

        const updated = getFallbackList(rule).filter(
          (_, idx) => idx !== index
        );

        return {
          ...rule,
          fallbackProviderIds: updated,
          fallbackProviderId: updated[0] || 'none',
        };
      })
    );
  };

  const updateFallbackStep = (
    category: Category,
    index: number,
    newProviderId: string
  ) => {
    setRoutingRules((prev) =>
      prev.map((rule) => {
        if (rule.category !== category) return rule;

        const currentList = getFallbackList(rule);
        currentList[index] = newProviderId;

        const cleaned = Array.from(
          new Set(
            currentList.filter((id) => id && id !== 'none')
          )
        );

        return {
          ...rule,
          fallbackProviderIds: cleaned,
          fallbackProviderId: cleaned[0] || 'none',
        };
      })
    );
  };

  const handleSaveRule = async (category: Category) => {
    const rule = routingRules.find((r) => r.category === category);
    if (!rule) return;

    setSavingCat(category);

    try {
      const fallbackList = getFallbackList(rule);

      const res = await fetchApi('/api/v1/routing', {
        method: 'PUT',
        body: JSON.stringify({
          category: rule.category,
          primaryProviderId: rule.primaryProviderId,
          fallbackProviderId: fallbackList[0] || 'none',
          fallbackProviderIds: fallbackList,
          timeoutMs: rule.timeoutMs,
          retryOnStatusCodes: rule.retryOnStatusCodes,
        }),
      });

      if (res.success) {
        showToast(
          'success',
          `Routing for ${category.toUpperCase()} saved successfully.`
        );
        await loadData();
      } else {
        showToast(
          'error',
          res.error?.message || 'Failed to update routing configuration.'
        );
      }
    } catch (err: any) {
      showToast(
        'error',
        err.message || 'Network error saving configuration.'
      );
    } finally {
      setSavingCat(null);
    }
  };

  const handleTestPipeline = async (category: Category) => {
    const rule = routingRules.find((r) => r.category === category);
    if (!rule) return;

    setTestingCat(category);
    const startTime = performance.now();

    try {
      let endpoint = '';
      let method = 'GET';
      let body: any = undefined;

      if (category === 'ai') {
        endpoint = '/api/v1/proxy/ai/chat';
        method = 'POST';
        body = JSON.stringify({
          messages: [
            {
              role: 'user',
              content: 'What is OneAPI failover in 1 bullet point?',
            },
          ],
        });
      } else if (category === 'weather') {
        endpoint = '/api/v1/proxy/weather/current?city=Tokyo';
      } else if (category === 'music') {
        endpoint = '/api/v1/proxy/music/search?q=Radiohead&limit=2';
      } else if (category === 'news') {
        endpoint = '/api/v1/proxy/news/search?q=space&limit=2';
      } else if (category === 'environment') {
        endpoint =
          '/api/v1/proxy/environment/air-quality?city=Paris';
      }

      const res = await fetchApi(endpoint, { method, body });
      const latencyMs = Math.round(performance.now() - startTime);
      const payload = (res.data || res) as any;

      let summary = '';

      if (category === 'ai') {
        summary =
          payload.choices?.[0]?.message?.content ||
          payload.content ||
          'Reasoning response received.';
      } else if (category === 'weather') {
        summary = `${payload.location || 'Tokyo'}: ${
          payload.current?.condition || 'Clear'
        } | Temp: ${payload.current?.temperature ?? 20}°C`;
      } else if (category === 'music') {
        const count = payload.tracks?.length || 0;
        summary = `Retrieved ${count} tracks from ${
          res._oneapi?.finalProvider || 'provider'
        }.`;
      } else if (category === 'news') {
        const count = payload.articles?.length || 0;
        summary = `Retrieved ${count} articles from ${
          res._oneapi?.finalProvider || 'provider'
        }.`;
      } else if (category === 'environment') {
        summary = `Air Quality: PM2.5 = ${
          payload.airQuality?.pm25 ?? 'Normal'
        } (${payload.location || 'Paris'})`;
      }

      setTestResults((prev) => ({
        ...prev,
        [category]: {
          success: res.success,
          latencyMs,
          finalProvider:
            res._oneapi?.finalProvider || rule.primaryProviderId,
          fallbackTriggered: Boolean(res._oneapi?.fallbackTriggered),
          fallbackReason: res._oneapi?.fallbackReason,
          summary,
        },
      }));
    } catch (err: any) {
      setTestResults((prev) => ({
        ...prev,
        [category]: {
          success: false,
          latencyMs: Math.round(performance.now() - startTime),
          finalProvider: rule.primaryProviderId,
          fallbackTriggered: false,
          summary: `Execution error: ${err.message}`,
        },
      }));
    } finally {
      setTestingCat(null);
    }
  };

  const filteredCategories =
    filterCategory === 'all'
      ? CATEGORIES
      : CATEGORIES.filter((category) => category === filterCategory);

  const totalFallbacks = routingRules.reduce(
    (total, rule) => total + getFallbackList(rule).length,
    0
  );

  const directOnlyCount = routingRules.filter(
    (rule) => getFallbackList(rule).length === 0
  ).length;

  const configuredKeys = vaultSecrets.length;

  const categoriesWithRules = routingRules.length;

  const getRuleForCategory = (cat: Category): RoutingConfigItem => {
    const detail = CATEGORY_DETAILS[cat];
    const providers = PROVIDERS_CATALOG.filter(
      (provider) => provider.category === cat
    );

    return (
      routingRules.find((rule) => rule.category === cat) || {
        category: cat,
        primaryProviderId: providers[0]?.id || '',
        fallbackProviderId: 'none',
        fallbackProviderIds: [],
        timeoutMs: detail.defaultTimeout,
        retryOnStatusCodes: [429, 500, 502, 503, 504],
      }
    );
  };

  const savedRulesCount = useMemo(
    () => routingRules.filter((rule) => rule.isCustomized).length,
    [routingRules]
  );

  return (
    <div className="min-h-full space-y-6 pb-10">
      {/* Toast */}
      {toastMessage && (
        <div
          role="status"
          className={`fixed right-5 top-5 z-[70] flex max-w-sm items-start gap-3 rounded-2xl border p-4 shadow-2xl backdrop-blur-xl ${
            toastMessage.type === 'success'
              ? 'border-emerald-500/20 bg-[var(--card)] text-emerald-600 dark:text-emerald-400'
              : 'border-rose-500/20 bg-[var(--card)] text-rose-600 dark:text-rose-400'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
          ) : (
            <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          )}
          <p className="flex-1 text-xs font-semibold leading-5">
            {toastMessage.text}
          </p>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-[var(--muted)] hover:text-[var(--foreground)]"
            aria-label="Dismiss notification"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--primary)]">
            <Workflow size={13} />
            Infrastructure
            <ChevronRight size={12} />
            Routing control
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)] sm:text-3xl">
            Routing & Failover
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            Design how requests move across providers. Control primary
            engines, fallback cascades, timeout policies and retry triggers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/dashboard/providers"
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3.5 py-2.5 text-xs font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-secondary)]"
          >
            <Server size={14} />
            Provider catalog
          </Link>

          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:opacity-90 disabled:opacity-60"
          >
            <RefreshCw
              size={14}
              className={loading ? 'animate-spin' : ''}
            />
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow)]">
        <div className="pointer-events-none absolute -right-24 -top-32 h-80 w-80 rounded-full bg-[var(--primary)]/[0.09] blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-1/3 h-40 w-40 rounded-full bg-violet-500/[0.06] blur-3xl" />

        <div className="relative grid gap-6 p-5 sm:p-7 lg:grid-cols-[1fr_300px] lg:items-center">
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <StatusPill type="info">
                <Sparkles size={11} />
                High availability controller
              </StatusPill>
              <StatusPill type="success">
                <ShieldCheck size={11} />
                Multi-provider routing
              </StatusPill>
            </div>

            <h2 className="max-w-xl text-xl font-bold leading-tight tracking-tight text-[var(--foreground)] sm:text-2xl">
              Build resilient request pipelines with intelligent failover.
            </h2>

            <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--muted)]">
              Define a primary provider and an ordered sequence of
              alternatives. When a configured retry condition occurs,
              your gateway can move to the next provider in the cascade.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() =>
                  document
                    .getElementById('routing-domains')
                    ?.scrollIntoView({ behavior: 'smooth' })
                }
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2.5 text-xs font-bold text-white transition hover:opacity-90"
              >
                Configure pipelines
                <ArrowRight size={14} />
              </button>

              <Link
                href="/dashboard/providers"
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-xs font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-secondary)]"
              >
                View providers
                <ExternalLink size={13} />
              </Link>
            </div>
          </div>

          {/* Abstract cascade visual */}
          <div className="hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 lg:block">
            <div className="mb-4 flex items-center justify-between">
              <SectionLabel>Request flow</SectionLabel>
              <Activity size={15} className="text-[var(--primary)]" />
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
                  <Server size={15} />
                </div>
                <div>
                  <p className="text-xs font-bold text-[var(--foreground)]">
                    Incoming request
                  </p>
                  <p className="text-[10px] text-[var(--muted)]">
                    OneAPI gateway
                  </p>
                </div>
              </div>
            </div>

            <div className="ml-7 h-5 border-l border-dashed border-[var(--border)]" />

            <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-3">
              <div className="flex items-center gap-2">
                <Zap size={15} className="text-sky-500" />
                <div>
                  <p className="text-xs font-bold text-[var(--foreground)]">
                    Primary provider
                  </p>
                  <p className="text-[10px] text-[var(--muted)]">
                    First execution target
                  </p>
                </div>
                <span className="ml-auto text-[9px] font-bold text-sky-500">
                  01
                </span>
              </div>
            </div>

            <div className="ml-7 h-5 border-l border-dashed border-[var(--border)]" />

            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
              <div className="flex items-center gap-2">
                <RotateCcw size={15} className="text-emerald-500" />
                <div>
                  <p className="text-xs font-bold text-[var(--foreground)]">
                    Fallback cascade
                  </p>
                  <p className="text-[10px] text-[var(--muted)]">
                    Alternative execution targets
                  </p>
                </div>
                <span className="ml-auto text-[9px] font-bold text-emerald-500">
                  02+
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Layers}
          label="Service domains"
          value={CATEGORIES.length}
          detail="Available routing categories"
          color="text-violet-500"
        />
        <StatCard
          icon={GitBranch}
          label="Fallback stages"
          value={totalFallbacks}
          detail="Across loaded routing rules"
          color="text-emerald-500"
        />
        <StatCard
          icon={Zap}
          label="Direct-only routes"
          value={directOnlyCount}
          detail="Loaded rules without fallback"
          color="text-amber-500"
        />
        <StatCard
          icon={Settings2}
          label="Customized rules"
          value={savedRulesCount}
          detail="Marked customized by API response"
          color="text-sky-500"
        />
      </div>

      {/* Categories */}
      <section id="routing-domains" className="scroll-mt-5">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <SectionLabel>Routing workspace</SectionLabel>
            <h2 className="mt-1 text-lg font-bold text-[var(--foreground)]">
              Service domains
            </h2>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Configure execution priority and reliability policies per
              category.
            </p>
          </div>

          <span className="text-xs text-[var(--muted)]">
            {filteredCategories.length} domains displayed
          </span>
        </div>

        {/* Filters */}
        <div className="mb-5 flex gap-2 overflow-x-auto pb-2">
          <button
            type="button"
            onClick={() => setFilterCategory('all')}
            className={`shrink-0 rounded-xl border px-3.5 py-2.5 text-xs font-semibold transition ${
              filterCategory === 'all'
                ? 'border-[var(--primary)] bg-[var(--primary)] text-white shadow-md shadow-[var(--primary)]/15'
                : 'border-[var(--border)] bg-[var(--card)] text-[var(--muted)] hover:text-[var(--foreground)]'
            }`}
          >
            All domains
            <span className="ml-2 opacity-70">{CATEGORIES.length}</span>
          </button>

          {CATEGORIES.map((cat) => {
            const detail = CATEGORY_DETAILS[cat];
            const active = filterCategory === cat;

            return (
              <button
                key={cat}
                type="button"
                onClick={() => setFilterCategory(cat)}
                className={`inline-flex shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-semibold capitalize transition ${
                  active
                    ? 'border-[var(--primary)] bg-[var(--primary)] text-white shadow-md shadow-[var(--primary)]/15'
                    : 'border-[var(--border)] bg-[var(--card)] text-[var(--muted)] hover:text-[var(--foreground)]'
                }`}
              >
                <span>{detail.icon}</span>
                {cat}
              </button>
            );
          })}
        </div>

        <div className="space-y-5">
          {filteredCategories.map((cat) => {
            const detail = CATEGORY_DETAILS[cat];
            const catProviders = PROVIDERS_CATALOG.filter(
              (p) => p.category === cat
            );

            const currentRule = getRuleForCategory(cat);
            const activeFallbackList = getFallbackList(currentRule);

            const availableAdditionalFallbacks = catProviders.filter(
              (p) =>
                p.id !== currentRule.primaryProviderId &&
                !activeFallbackList.includes(p.id)
            );

            const isDirectOnly = activeFallbackList.length === 0;
            const primaryProviderObj = catProviders.find(
              (p) => p.id === currentRule.primaryProviderId
            );

            const primaryHasKey =
              !primaryProviderObj?.requiresKey ||
              vaultSecrets.some(
                (s) =>
                  s.category?.toLowerCase() === cat &&
                  s.providerId?.toLowerCase() ===
                    primaryProviderObj?.id?.toLowerCase()
              );

            const isSaving = savingCat === cat;
            const isTesting = testingCat === cat;
            const currentTest = testResults[cat];

            return (
              <article
                key={cat}
                className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm transition hover:shadow-[var(--shadow)]"
              >
                {/* Card header */}
                <div className="flex flex-col gap-4 border-b border-[var(--border)] bg-[var(--surface)]/70 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${detail.borderColor} ${detail.softColor}`}
                    >
                      <span className={`text-2xl ${detail.color}`}>
                        {detail.icon}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-bold text-[var(--foreground)] sm:text-base">
                          {detail.title}
                        </h3>
                        <span
                          className={`rounded-md border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${detail.borderColor} ${detail.softColor} ${detail.color}`}
                        >
                          {cat}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-[var(--muted)]">
                        {detail.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <StatusPill type={isDirectOnly ? 'neutral' : 'success'}>
                      {isDirectOnly ? (
                        <CircleDot size={11} />
                      ) : (
                        <Zap size={11} />
                      )}
                      {isDirectOnly ? 'Primary only' : 'Failover enabled'}
                    </StatusPill>

                    {currentRule.isCustomized && (
                      <StatusPill type="info">Customized</StatusPill>
                    )}
                  </div>
                </div>

                <div className="space-y-6 p-5 sm:p-6">
                  {/* Main selectors */}
                  <div className="grid gap-4 lg:grid-cols-2">
                    {/* Primary */}
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10 text-sky-500">
                            <Zap size={15} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-[var(--foreground)]">
                              Primary provider
                            </p>
                            <p className="text-[10px] text-[var(--muted)]">
                              First execution target
                            </p>
                          </div>
                        </div>

                        <StatusPill
                          type={primaryHasKey ? 'success' : 'warning'}
                        >
                          {primaryHasKey ? (
                            <>
                              <CheckCircle2 size={10} />
                              Ready
                            </>
                          ) : (
                            <>
                              <AlertCircle size={10} />
                              Key needed
                            </>
                          )}
                        </StatusPill>
                      </div>

                      <select
                        value={currentRule.primaryProviderId}
                        onChange={(e) =>
                          updateRuleField(
                            cat,
                            'primaryProviderId',
                            e.target.value
                          )
                        }
                        className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-3.5 py-3 text-xs font-semibold text-[var(--foreground)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10"
                      >
                        {catProviders.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}{' '}
                            {p.requiresKey
                              ? '(Key Required)'
                              : '(Public Free API)'}
                          </option>
                        ))}
                      </select>

                      <p className="mt-3 text-[10px] leading-5 text-[var(--muted)]">
                        Incoming requests are first routed to this provider.
                      </p>
                    </div>

                    {/* Fallback */}
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                            <Layers size={15} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-[var(--foreground)]">
                              Fallback cascade
                            </p>
                            <p className="text-[10px] text-[var(--muted)]">
                              Ordered backup providers
                            </p>
                          </div>
                        </div>

                        <StatusPill
                          type={
                            activeFallbackList.length ? 'success' : 'neutral'
                          }
                        >
                          {activeFallbackList.length} stages
                        </StatusPill>
                      </div>

                      {activeFallbackList.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--card)] p-4">
                          <div className="flex items-center gap-2 text-[var(--muted)]">
                            <CircleDot size={15} />
                            <p className="text-xs font-medium">
                              No fallback providers configured.
                            </p>
                          </div>
                          <p className="mt-1 text-[10px] leading-5 text-[var(--muted)]">
                            Requests use the primary provider only.
                          </p>

                          {availableAdditionalFallbacks.length > 0 && (
                            <button
                              type="button"
                              onClick={() =>
                                addFallbackStep(
                                  cat,
                                  availableAdditionalFallbacks[0].id
                                )
                              }
                              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-3 py-2 text-[10px] font-bold text-emerald-600 transition hover:bg-emerald-500/15 dark:text-emerald-400"
                            >
                              <Plus size={12} />
                              Add first fallback
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {activeFallbackList.map((fbId, fbIdx) => {
                            const fbObj = catProviders.find(
                              (p) => p.id === fbId
                            );

                            const hasKey =
                              !fbObj?.requiresKey ||
                              vaultSecrets.some(
                                (s) =>
                                  s.category?.toLowerCase() === cat &&
                                  s.providerId?.toLowerCase() ===
                                    fbId.toLowerCase()
                              );

                            return (
                              <div
                                key={`${fbId}-${fbIdx}`}
                                className="flex flex-col gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] p-3 sm:flex-row sm:items-center"
                              >
                                <div className="flex min-w-0 flex-1 items-center gap-2">
                                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                    {String(fbIdx + 1).padStart(2, '0')}
                                  </span>

                                  <div className="min-w-0 flex-1">
                                    <p className="mb-1 text-[9px] font-bold uppercase tracking-wider text-[var(--muted)]">
                                      Fallback stage {fbIdx + 1}
                                    </p>
                                    <select
                                      value={fbId}
                                      onChange={(e) =>
                                        updateFallbackStep(
                                          cat,
                                          fbIdx,
                                          e.target.value
                                        )
                                      }
                                      className="w-full min-w-0 bg-transparent text-xs font-semibold text-[var(--foreground)] outline-none"
                                    >
                                      {catProviders
                                        .filter(
                                          (p) =>
                                            p.id !==
                                            currentRule.primaryProviderId
                                        )
                                        .map((p) => (
                                          <option
                                            key={p.id}
                                            value={p.id}
                                          >
                                            {p.name}{' '}
                                            {p.requiresKey
                                              ? '(Key Required)'
                                              : '(Public)'}
                                          </option>
                                        ))}
                                    </select>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between gap-3 sm:justify-end">
                                  <StatusPill
                                    type={hasKey ? 'success' : 'warning'}
                                  >
                                    {hasKey ? 'Ready' : 'Key needed'}
                                  </StatusPill>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      removeFallbackStep(cat, fbIdx)
                                    }
                                    className="rounded-lg p-2 text-[var(--muted)] transition hover:bg-rose-500/10 hover:text-rose-500"
                                    title="Remove fallback"
                                    aria-label={`Remove fallback stage ${fbIdx + 1}`}
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {availableAdditionalFallbacks.length > 0 &&
                        activeFallbackList.length > 0 && (
                          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                            <p className="text-[10px] text-[var(--muted)]">
                              {availableAdditionalFallbacks.length} more
                              provider(s) available
                            </p>

                            <button
                              type="button"
                              onClick={() =>
                                addFallbackStep(
                                  cat,
                                  availableAdditionalFallbacks[0].id
                                )
                              }
                              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-[10px] font-bold text-[var(--foreground)] transition hover:border-emerald-500/40 hover:text-emerald-600"
                            >
                              <Plus size={12} className="text-emerald-500" />
                              Add fallback
                            </button>
                          </div>
                        )}
                    </div>
                  </div>

                  {/* Cascade visualization */}
                  <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <GitBranch
                          size={15}
                          className="text-[var(--primary)]"
                        />
                        <h4 className="text-xs font-bold text-[var(--foreground)]">
                          Execution pipeline
                        </h4>
                      </div>
                      <SectionLabel>Request sequence</SectionLabel>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
                      {/* Primary node */}
                      <div className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-sky-500/25 bg-sky-500/[0.06] p-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 text-sky-500">
                          <Zap size={16} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[9px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                            Primary
                          </p>
                          <p className="truncate text-xs font-bold text-[var(--foreground)]">
                            {PROVIDERS_CATALOG.find(
                              (p) =>
                                p.id === currentRule.primaryProviderId
                            )?.name || currentRule.primaryProviderId}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-center text-[var(--muted)]">
                        <ArrowRight
                          size={16}
                          className="rotate-90 sm:rotate-0"
                        />
                      </div>

                      {activeFallbackList.length === 0 ? (
                        <div className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-dashed border-[var(--border)] bg-[var(--card)] p-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--surface-secondary)] text-[var(--muted)]">
                            <CircleDot size={16} />
                          </div>
                          <div>
                            <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--muted)]">
                              No fallback
                            </p>
                            <p className="text-xs font-semibold text-[var(--foreground)]">
                              Direct-only mode
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex min-w-0 flex-1 flex-wrap gap-2">
                          {activeFallbackList.map((fbId, idx) => {
                            const provider = catProviders.find(
                              (p) => p.id === fbId
                            );

                            return (
                              <React.Fragment key={`${fbId}-${idx}`}>
                                <div className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.06] p-3">
                                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                                    <RotateCcw size={15} />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                                      Fallback {idx + 1}
                                    </p>
                                    <p className="truncate text-xs font-bold text-[var(--foreground)]">
                                      {provider?.name || fbId}
                                    </p>
                                  </div>
                                </div>
                              </React.Fragment>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <p className="mt-3 text-[10px] leading-5 text-[var(--muted)]">
                      The configured fallback providers are evaluated in
                      their displayed order when the gateway's retry
                      conditions are met.
                    </p>
                  </section>

                  {/* Advanced configuration */}
                  <section className="overflow-hidden rounded-2xl border border-[var(--border)]">
                    <div className="flex items-center gap-2 border-b border-[var(--border)] bg-[var(--surface)] px-4 py-3">
                      <Settings2
                        size={15}
                        className="text-[var(--primary)]"
                      />
                      <div>
                        <h4 className="text-xs font-bold text-[var(--foreground)]">
                          Advanced reliability settings
                        </h4>
                        <p className="text-[10px] text-[var(--muted)]">
                          Tune request timing and retry conditions.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-5 p-4 sm:p-5">
                      {/* Timeout */}
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-3">
                          <div className="rounded-lg bg-[var(--surface-secondary)] p-2 text-[var(--muted)]">
                            <Clock3 size={16} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-[var(--foreground)]">
                              Request timeout
                            </p>
                            <p className="mt-1 text-[10px] leading-5 text-[var(--muted)]">
                              Maximum configured waiting duration before
                              timeout handling.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={1000}
                            max={60000}
                            step={500}
                            value={currentRule.timeoutMs}
                            onChange={(e) =>
                              updateRuleField(
                                cat,
                                'timeoutMs',
                                Number(e.target.value)
                              )
                            }
                            className="w-32 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-right font-mono text-xs font-bold text-[var(--foreground)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10"
                          />
                          <span className="text-xs text-[var(--muted)]">
                            ms
                          </span>
                        </div>
                      </div>

                      <div className="h-px bg-[var(--border)]" />

                      {/* Retry codes */}
                      <div>
                        <div className="mb-3 flex items-start gap-3">
                          <div className="rounded-lg bg-[var(--surface-secondary)] p-2 text-[var(--muted)]">
                            <AlertTriangle size={16} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-[var(--foreground)]">
                              Retry trigger status codes
                            </p>
                            <p className="mt-1 text-[10px] leading-5 text-[var(--muted)]">
                              Select HTTP response codes that should trigger
                              fallback handling.
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {COMMON_STATUS_CODES.map((status) => {
                            const selected = (
                              currentRule.retryOnStatusCodes || []
                            ).includes(status.code);

                            return (
                              <button
                                key={status.code}
                                type="button"
                                onClick={() =>
                                  toggleStatusCode(cat, status.code)
                                }
                                aria-pressed={selected}
                                className={`rounded-lg border px-3 py-2 text-[10px] font-semibold transition ${
                                  selected
                                    ? 'border-[var(--primary)]/30 bg-[var(--primary)]/10 text-[var(--primary)]'
                                    : 'border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--foreground)]'
                                }`}
                              >
                                {selected && (
                                  <Check
                                    size={10}
                                    className="mr-1 inline"
                                  />
                                )}
                                {status.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Test results */}
                  {currentTest && (
                    <section
                      className={`overflow-hidden rounded-2xl border ${
                        currentTest.success
                          ? 'border-emerald-500/20'
                          : 'border-rose-500/20'
                      }`}
                    >
                      <div
                        className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3 ${
                          currentTest.success
                            ? 'bg-emerald-500/10'
                            : 'bg-rose-500/10'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {currentTest.success ? (
                            <CheckCircle2
                              size={16}
                              className="text-emerald-500"
                            />
                          ) : (
                            <AlertTriangle
                              size={16}
                              className="text-rose-500"
                            />
                          )}
                          <p className="text-xs font-bold text-[var(--foreground)]">
                            Pipeline test{' '}
                            {currentTest.success ? 'completed' : 'failed'}
                          </p>
                        </div>

                        <StatusPill
                          type={
                            currentTest.success ? 'success' : 'danger'
                          }
                        >
                          {currentTest.success
                            ? 'Successful'
                            : 'Error'}
                        </StatusPill>
                      </div>

                      <div className="space-y-3 bg-[var(--card)] p-4">
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                          <div className="rounded-xl bg-[var(--surface)] p-3">
                            <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--muted)]">
                              Latency
                            </p>
                            <p className="mt-1 text-sm font-bold text-[var(--foreground)]">
                              {currentTest.latencyMs} ms
                            </p>
                          </div>
                          <div className="rounded-xl bg-[var(--surface)] p-3">
                            <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--muted)]">
                              Final provider
                            </p>
                            <p className="mt-1 truncate text-sm font-bold text-[var(--foreground)]">
                              {currentTest.finalProvider}
                            </p>
                          </div>
                          <div className="col-span-2 rounded-xl bg-[var(--surface)] p-3 sm:col-span-1">
                            <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--muted)]">
                              Fallback triggered
                            </p>
                            <p className="mt-1 text-sm font-bold text-[var(--foreground)]">
                              {currentTest.fallbackTriggered ? 'Yes' : 'No'}
                            </p>
                          </div>
                        </div>

                        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
                          <p className="mb-1 text-[9px] font-bold uppercase tracking-wider text-[var(--muted)]">
                            Gateway response
                          </p>
                          <p className="break-words text-xs leading-5 text-[var(--foreground)]">
                            {currentTest.summary}
                          </p>
                        </div>
                      </div>
                    </section>
                  )}

                  {/* Footer actions */}
                  <div className="flex flex-col gap-3 border-t border-[var(--border)] pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-[10px] text-[var(--muted)]">
                      {currentRule.updatedAt ? (
                        <>
                          Last updated:{' '}
                          {new Date(currentRule.updatedAt).toLocaleString()}
                        </>
                      ) : (
                        'Using default routing configuration'
                      )}
                    </div>

                    <div className="flex flex-col-reverse gap-2 sm:flex-row">
                      <button
                        type="button"
                        disabled={isTesting}
                        onClick={() => handleTestPipeline(cat)}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-xs font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-secondary)] disabled:opacity-50"
                      >
                        <Play
                          size={13}
                          className={
                            isTesting ? 'animate-pulse text-sky-500' : ''
                          }
                        />
                        {isTesting ? 'Testing pipeline...' : 'Test pipeline'}
                      </button>

                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={() => handleSaveRule(cat)}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isSaving ? (
                          <>
                            <RefreshCw
                              size={13}
                              className="animate-spin"
                            />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save size={13} />
                            Save configuration
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Bottom note */}
      <div className="flex flex-col gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2.5">
          <ShieldCheck
            size={16}
            className="mt-0.5 shrink-0 text-[var(--primary)]"
          />
          <div>
            <p className="text-xs font-bold text-[var(--foreground)]">
              Routing configuration
            </p>
            <p className="mt-1 text-[10px] leading-5 text-[var(--muted)]">
              Review provider credentials in the provider catalog and save
              your routing changes to apply the configuration.
            </p>
          </div>
        </div>

        <Link
          href="/dashboard/providers"
          className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-[var(--primary)] hover:underline"
        >
          Open provider catalog
          <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  );
}
