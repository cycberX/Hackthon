
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Cpu,
  Shield,
  Key,
  Play,
  Trash2,
  SlidersHorizontal,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  RefreshCw,
  ExternalLink,
  Zap,
  Check,
  Ban,
  ArrowRight,
  X,
  Activity,
  Server,
  Cloud,
  Music2,
  Newspaper,
  Wind,
  Bot,
  AlertCircle,
  Clock3,
  Fingerprint,
  CircleDot,
  ChevronRight,
} from 'lucide-react';

import { fetchApi } from '@/lib/api';
import {
  PROVIDERS_CATALOG,
  ProviderCatalogItem,
  Category,
} from '@/lib/providersCatalog';

const CATEGORY_THEMES: Record<
  Category,
  {
    badge: string;
    text: string;
    iconBg: string;
    border: string;
    glow: string;
    icon: React.ElementType;
  }
> = {
  ai: {
    badge: 'bg-violet-500/10 text-violet-500 border-violet-500/20',
    text: 'text-violet-500',
    iconBg: 'bg-violet-500/10 text-violet-500',
    border: 'border-violet-500/20',
    glow: 'from-violet-500/[0.08]',
    icon: Bot,
  },
  weather: {
    badge: 'bg-sky-500/10 text-sky-500 border-sky-500/20',
    text: 'text-sky-500',
    iconBg: 'bg-sky-500/10 text-sky-500',
    border: 'border-sky-500/20',
    glow: 'from-sky-500/[0.08]',
    icon: Cloud,
  },
  music: {
    badge: 'bg-pink-500/10 text-pink-500 border-pink-500/20',
    text: 'text-pink-500',
    iconBg: 'bg-pink-500/10 text-pink-500',
    border: 'border-pink-500/20',
    glow: 'from-pink-500/[0.08]',
    icon: Music2,
  },
  news: {
    badge: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    text: 'text-amber-600',
    iconBg: 'bg-amber-500/10 text-amber-600',
    border: 'border-amber-500/20',
    glow: 'from-amber-500/[0.08]',
    icon: Newspaper,
  },
  environment: {
    badge: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    text: 'text-emerald-600',
    iconBg: 'bg-emerald-500/10 text-emerald-600',
    border: 'border-emerald-500/20',
    glow: 'from-emerald-500/[0.08]',
    icon: Wind,
  },
};

const categories = [
  { id: 'all', label: 'All providers' },
  { id: 'ai', label: 'AI & LLMs' },
  { id: 'weather', label: 'Weather' },
  { id: 'music', label: 'Music' },
  { id: 'news', label: 'News' },
  { id: 'environment', label: 'Environment' },
];

type ConfigMessage = {
  type: 'success' | 'error';
  text: string;
};

function SectionLabel({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
      {children}
    </p>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  detail,
  accent = 'text-[var(--primary)]',
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  detail: string;
  accent?: string;
}) {
  return (
    <div className="group rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 transition duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow)] sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-[var(--muted)]">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-[var(--foreground)]">
            {value}
          </p>
          <p className="mt-1 text-[11px] text-[var(--muted)]">{detail}</p>
        </div>
        <div className={`rounded-xl bg-[var(--surface-secondary)] p-2.5 ${accent}`}>
          <Icon size={19} />
        </div>
      </div>
    </div>
  );
}

function StatusPill({
  children,
  color = 'neutral',
}: {
  children: React.ReactNode;
  color?: 'success' | 'warning' | 'info' | 'danger' | 'neutral';
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
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${styles[color]}`}
    >
      {children}
    </span>
  );
}

export default function ProvidersPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [vaultSecrets, setVaultSecrets] = useState<any[]>([]);
  const [routingRules, setRoutingRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeConfigProvider, setActiveConfigProvider] =
    useState<ProviderCatalogItem | null>(null);
  const [configApiKeyInput, setConfigApiKeyInput] = useState('');
  const [showConfigApiKey, setShowConfigApiKey] = useState(false);
  const [savingConfigKey, setSavingConfigKey] = useState(false);
  const [configMsg, setConfigMsg] = useState<ConfigMessage | null>(null);

  const [testingProviderId, setTestingProviderId] = useState<string | null>(
    null
  );
  const [testResult, setTestResult] = useState<any>(null);

  const loadVaultAndRouting = async () => {
    setLoading(true);

    try {
      const [vaultRes, routingRes] = await Promise.all([
        fetchApi('/api/v1/vault').catch(() => null),
        fetchApi('/api/v1/routing').catch(() => null),
      ]);

      if (vaultRes?.success) {
        setVaultSecrets(
          vaultRes.data?.vaultSecrets || vaultRes.data?.secrets || []
        );
      }

      if (routingRes?.success) {
        setRoutingRules(
          routingRes.data?.routingRules || routingRes.data?.rules || []
        );
      }
    } catch (err) {
      console.error('Failed to load vault or routing:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVaultAndRouting();

    const handleProjectChanged = () => {
      loadVaultAndRouting();
    };

    window.addEventListener('oneapi_project_changed', handleProjectChanged);
    return () => {
      window.removeEventListener('oneapi_project_changed', handleProjectChanged);
    };
  }, []);

  const handleSaveProviderKey = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!activeConfigProvider || !configApiKeyInput.trim()) return;

    setSavingConfigKey(true);
    setConfigMsg(null);

    try {
      const res = await fetchApi('/api/v1/vault', {
        method: 'POST',
        body: JSON.stringify({
          category: activeConfigProvider.category,
          providerId: activeConfigProvider.id,
          apiKey: configApiKeyInput.trim(),
        }),
      });

      if (res.success) {
        setConfigMsg({
          type: 'success',
          text: `Credential for ${activeConfigProvider.name} was saved to the vault.`,
        });
        setConfigApiKeyInput('');
        await loadVaultAndRouting();
      } else {
        setConfigMsg({
          type: 'error',
          text: res.error?.message || 'Failed to save key into vault.',
        });
      }
    } catch (err: any) {
      setConfigMsg({
        type: 'error',
        text: err.message || 'Vault encryption error.',
      });
    } finally {
      setSavingConfigKey(false);
    }
  };

  const handleDeleteProviderKey = async (providerId: string) => {
    if (!confirm('Remove this credential from the encrypted vault?')) return;

    try {
      const res = await fetchApi(`/api/v1/vault/${providerId}`, {
        method: 'DELETE',
      });

      if (res.success) {
        setConfigMsg({
          type: 'success',
          text: 'Credential removed from the vault.',
        });
        await loadVaultAndRouting();
      } else {
        setConfigMsg({
          type: 'error',
          text: res.error?.message || 'Failed to remove credential.',
        });
      }
    } catch (err: any) {
      setConfigMsg({
        type: 'error',
        text: err.message || 'Failed to delete vault secret.',
      });
    }
  };

  const handleUpdateRouting = async (
    category: Category,
    primary: string,
    fallback: string
  ) => {
    try {
      const res = await fetchApi('/api/v1/routing', {
        method: 'PUT',
        body: JSON.stringify({
          category,
          primaryProviderId: primary,
          fallbackProviderId: fallback,
        }),
      });

      if (res.success) {
        setConfigMsg({
          type: 'success',
          text: `Updated ${category.toUpperCase()} routing configuration.`,
        });
        await loadVaultAndRouting();
      } else {
        setConfigMsg({
          type: 'error',
          text: res.error?.message || 'Failed to update routing rule.',
        });
      }
    } catch (err: any) {
      setConfigMsg({
        type: 'error',
        text: err.message || 'Failed to update routing.',
      });
    }
  };

  const handleSetPriorityRouting = async (
    category: Category,
    providerId: string,
    role: 'primary' | 'fallback' | 'disable_fallback'
  ) => {
    const currentRule = routingRules.find((r) => r.category === category);

    let primary = currentRule?.primaryProviderId || providerId;
    let fallback = currentRule?.fallbackProviderId || 'none';

    if (role === 'primary') {
      primary = providerId;
      if (fallback === providerId) fallback = 'none';
    } else if (role === 'fallback') {
      fallback = providerId;

      if (primary === providerId) {
        const other = PROVIDERS_CATALOG.find(
          (p) => p.category === category && p.id !== providerId
        );
        if (other) primary = other.id;
      }
    } else {
      fallback = 'none';
    }

    await handleUpdateRouting(category, primary, fallback);
  };

  const handleTestProvider = async (provider: ProviderCatalogItem) => {
    setTestingProviderId(provider.id);
    setTestResult(null);

    const startTime = performance.now();

    try {
      let endpoint = '';
      let method = 'GET';
      let body: any = undefined;

      if (provider.category === 'ai') {
        endpoint = '/api/v1/proxy/ai/chat';
        method = 'POST';
        body = JSON.stringify({
          provider: provider.id,
          messages: [
            {
              role: 'user',
              content: 'Respond in 1 short sentence: What is OneAPI failover?',
            },
          ],
        });
      } else if (provider.category === 'weather') {
        endpoint = '/api/v1/proxy/weather/current?city=San+Francisco';
      } else if (provider.category === 'music') {
        endpoint = '/api/v1/proxy/music/search?q=Daft+Punk&limit=2';
      } else if (provider.category === 'news') {
        endpoint = '/api/v1/proxy/news/search?q=technology&limit=2';
      } else if (provider.category === 'environment') {
        endpoint =
          '/api/v1/proxy/environment/air-quality?city=London';
      }

      const headers: Record<string, string> = {
        'x-oneapi-provider': provider.id,
      };

      const res = await fetchApi(endpoint, { method, headers, body });
      const latencyMs = Math.round(performance.now() - startTime);

      const payload = (res.data || res) as any;
      let summaryText = '';

      if (provider.category === 'ai') {
        summaryText =
          payload.choices?.[0]?.message?.content ||
          payload.content ||
          'AI response received.';
      } else if (provider.category === 'weather') {
        const cur = payload.current || {};
        summaryText = `${payload.location || 'San Francisco'}: ${
          cur.condition || 'Clear'
        } | Temperature: ${cur.temperature ?? 18}°C | Humidity: ${
          cur.humidity ?? 65
        }%`;
      } else if (provider.category === 'music') {
        const tracks = payload.tracks || [];
        summaryText =
          tracks.length > 0
            ? `Found ${tracks.length} tracks. First: "${tracks[0]?.title}" by ${tracks[0]?.artist}`
            : 'Music search completed.';
      } else if (provider.category === 'news') {
        const articles = payload.articles || [];
        summaryText =
          articles.length > 0
            ? `Headline: "${articles[0]?.title}" (${articles[0]?.source || 'News'})`
            : 'News search completed.';
      } else if (provider.category === 'environment') {
        const air = payload.airQuality || {};
        summaryText = `Air quality in ${
          payload.location || 'London'
        }: ${air.status || 'Moderate'} (PM2.5: ${
          air.pm25 ?? 'Normal'
        })`;
      }

      setTestResult({
        providerId: provider.id,
        category: provider.category,
        status: res.success ? 200 : res.error?.code || 500,
        latencyMs,
        finalProvider: res._oneapi?.finalProvider || provider.id,
        fallbackTriggered: Boolean(res._oneapi?.fallbackTriggered),
        fallbackReason: res._oneapi?.fallbackReason,
        summary: summaryText,
        raw: res,
      });
    } catch (err: any) {
      setTestResult({
        providerId: provider.id,
        category: provider.category,
        status: 500,
        latencyMs: Math.round(performance.now() - startTime),
        finalProvider: provider.id,
        fallbackTriggered: false,
        summary: `Error: ${err.message}`,
        raw: { error: err.message },
      });
    } finally {
      setTestingProviderId(null);
    }
  };

  const filteredProviders = useMemo(
    () =>
      selectedCategory === 'all'
        ? PROVIDERS_CATALOG
        : PROVIDERS_CATALOG.filter(
            (provider) => provider.category === selectedCategory
          ),
    [selectedCategory]
  );

  const configuredCount = PROVIDERS_CATALOG.filter((provider) =>
    vaultSecrets.some(
      (secret) =>
        secret.category?.toLowerCase() === provider.category?.toLowerCase() &&
        secret.providerId?.toLowerCase() === provider.id?.toLowerCase()
    )
  ).length;

  const categoryCount = (id: string) =>
    id === 'all'
      ? PROVIDERS_CATALOG.length
      : PROVIDERS_CATALOG.filter((p) => p.category === id).length;

  const currentProviderCount = filteredProviders.length;

  return (
    <div className="min-h-full space-y-6 pb-10">
      {/* Page heading */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--primary)]">
            <Cpu size={13} />
            Infrastructure
            <ChevronRight size={12} />
            Provider management
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)] sm:text-3xl">
            API Providers
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            Connect providers, securely manage credentials and control how
            requests are routed across your gateway.
          </p>
        </div>

        <button
          type="button"
          onClick={loadVaultAndRouting}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-2.5 text-xs font-semibold text-[var(--foreground)] shadow-sm transition hover:bg-[var(--surface-secondary)] disabled:cursor-not-allowed disabled:opacity-60 sm:self-auto"
        >
          <RefreshCw
            size={14}
            className={loading ? 'animate-spin text-[var(--primary)]' : ''}
          />
          {loading ? 'Synchronizing...' : 'Sync configuration'}
        </button>
      </div>

      {/* Overview banner */}
      <section className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow)]">
        <div className="pointer-events-none absolute -right-24 -top-32 h-80 w-80 rounded-full bg-[var(--primary)]/[0.08] blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-1/3 h-40 w-40 rounded-full bg-violet-500/[0.05] blur-3xl" />

        <div className="relative grid gap-6 p-5 sm:p-7 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="max-w-2xl">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <StatusPill color="success">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Gateway workspace
              </StatusPill>
              <StatusPill color="info">
                <Fingerprint size={11} />
                Encrypted credential vault
              </StatusPill>
            </div>

            <h2 className="text-xl font-bold tracking-tight text-[var(--foreground)] sm:text-2xl">
              Your providers. One control plane.
            </h2>

            <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--muted)]">
              Manage your integrations from one place. Configure provider
              credentials, assign routing priorities and test gateway
              connectivity without leaving your workspace.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Link
                href="/dashboard/routing"
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-[var(--primary)]/15 transition hover:opacity-90"
              >
                Manage routing
                <ArrowRight size={14} />
              </Link>

              <span className="inline-flex items-center gap-2 text-xs text-[var(--muted)]">
                <Lock size={13} />
                Credentials are stored in your vault
              </span>
            </div>
          </div>

          <div className="hidden min-w-[210px] rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-4 lg:block">
            <div className="flex items-center justify-between">
              <SectionLabel>Gateway control</SectionLabel>
              <Activity size={15} className="text-[var(--primary)]" />
            </div>

            <div className="mt-4 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl overflow-hidden shadow-sm">
                <Image src="/logo.png" alt="OneAPI" width={36} height={36} className="w-full h-full object-contain" />
              </div>
              <div>
                <p className="text-sm font-bold text-[var(--foreground)]">
                  OneAPI
                </p>
                <p className="text-[10px] text-[var(--muted)]">
                  Provider control plane
                </p>
              </div>
            </div>

            <div className="mt-4 border-t border-[var(--border)] pt-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--muted)]">Configured keys</span>
                <span className="font-bold tabular-nums text-[var(--foreground)]">
                  {configuredCount}/{PROVIDERS_CATALOG.length}
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--surface-secondary)]">
                <div
                  className="h-full rounded-full bg-[var(--primary)] transition-all"
                  style={{
                    width: `${
                      PROVIDERS_CATALOG.length
                        ? (configuredCount / PROVIDERS_CATALOG.length) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Cpu}
          label="Available providers"
          value={PROVIDERS_CATALOG.length}
          detail="Across all service categories"
        />
        <StatCard
          icon={Lock}
          label="Configured credentials"
          value={configuredCount}
          detail="Credentials found in your vault"
          accent="text-emerald-500"
        />
        <StatCard
          icon={Zap}
          label="Routing categories"
          value={routingRules.length}
          detail="Categories with saved routing rules"
          accent="text-violet-500"
        />
        <StatCard
          icon={Activity}
          label="Visible providers"
          value={currentProviderCount}
          detail={
            selectedCategory === 'all'
              ? 'Showing all categories'
              : `Filtered by ${selectedCategory}`
          }
          accent="text-sky-500"
        />
      </div>

      {/* Routing banner */}
      <section className="group relative overflow-hidden rounded-2xl border border-[var(--primary)]/20 bg-[var(--primary)]/[0.045] p-5 sm:p-6">
        <div className="pointer-events-none absolute -right-12 -top-20 h-48 w-48 rounded-full bg-[var(--primary)]/[0.08] blur-3xl" />

        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
              <Zap size={21} />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm font-bold text-[var(--foreground)] sm:text-base">
                  Routing & failover configuration
                </h2>
                <StatusPill color="info">Control center</StatusPill>
              </div>
              <p className="mt-1.5 max-w-xl text-xs leading-5 text-[var(--muted)]">
                Choose primary providers, configure secondary fallbacks and
                manage routing behavior for each service category.
              </p>
            </div>
          </div>

          <Link
            href="/dashboard/routing"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-[var(--primary)]/20 bg-[var(--card)] px-4 py-2.5 text-xs font-bold text-[var(--primary)] shadow-sm transition hover:border-[var(--primary)]/50 hover:bg-[var(--primary)]/5"
          >
            Open routing center
            <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* Provider section header */}
      <section>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <SectionLabel>Integrations</SectionLabel>
            <h2 className="mt-1 text-lg font-bold text-[var(--foreground)]">
              Provider directory
            </h2>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Select a provider to configure credentials or run a live test.
            </p>
          </div>

          <p className="text-xs text-[var(--muted)]">
            Showing{' '}
            <span className="font-bold text-[var(--foreground)]">
              {filteredProviders.length}
            </span>{' '}
            providers
          </p>
        </div>

        {/* Category filters */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((category) => {
            const active = selectedCategory === category.id;
            const count = categoryCount(category.id);

            return (
              <button
                key={category.id}
                type="button"
                onClick={() => setSelectedCategory(category.id)}
                className={`inline-flex shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-semibold transition ${
                  active
                    ? 'border-[var(--primary)] bg-[var(--primary)] text-white shadow-md shadow-[var(--primary)]/15'
                    : 'border-[var(--border)] bg-[var(--card)] text-[var(--muted)] hover:border-[var(--primary)]/40 hover:text-[var(--foreground)]'
                }`}
              >
                {category.label}
                <span
                  className={`rounded-md px-1.5 py-0.5 text-[10px] tabular-nums ${
                    active
                      ? 'bg-white/15 text-white'
                      : 'bg-[var(--surface-secondary)] text-[var(--muted)]'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Provider cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {filteredProviders.map((provider) => {
          const storedSecret = vaultSecrets.find(
            (s) =>
              s.category?.toLowerCase() ===
                provider.category?.toLowerCase() &&
              s.providerId?.toLowerCase() === provider.id?.toLowerCase()
          );

          const isConfigured = Boolean(storedSecret);
          const currentRule = routingRules.find(
            (r) => r.category === provider.category
          );
          const isPrimary =
            currentRule?.primaryProviderId === provider.id;
          const isFallback =
            currentRule?.fallbackProviderId === provider.id;
          const isTesting = testingProviderId === provider.id;
          const currentTest =
            testResult?.providerId === provider.id ? testResult : null;

          const theme = CATEGORY_THEMES[provider.category];
          const CategoryIcon = theme.icon;

          return (
            <article
              key={provider.id}
              className="group relative flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm transition duration-200 hover:-translate-y-1 hover:border-[var(--primary)]/30 hover:shadow-[var(--shadow)]"
            >
              <div
                className={`pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b ${theme.glow} to-transparent opacity-80`}
              />

              <div className="relative flex flex-1 flex-col p-5">
                {/* Provider identity */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2.5 shadow-sm transition group-hover:scale-105">
                      <img
                        src={provider.iconUrl}
                        alt={provider.name}
                        className="h-full w-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display =
                            'none';
                        }}
                      />
                    </div>

                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-bold text-[var(--foreground)] transition group-hover:text-[var(--primary)]">
                        {provider.name}
                      </h3>

                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${theme.badge}`}
                        >
                          {provider.category}
                        </span>

                        <a
                          href={provider.docUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] font-medium text-[var(--muted)] transition hover:text-[var(--primary)]"
                        >
                          Documentation
                          <ExternalLink size={10} />
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {isConfigured ? (
                      <StatusPill color="success">
                        <CheckCircle2 size={11} />
                        Connected
                      </StatusPill>
                    ) : provider.requiresKey ? (
                      <StatusPill color="warning">
                        <Key size={11} />
                        Setup required
                      </StatusPill>
                    ) : (
                      <StatusPill color="info">
                        <Check size={11} />
                        Keyless
                      </StatusPill>
                    )}
                  </div>
                </div>

                {/* Description */}
                <p className="mt-4 min-h-[40px] text-xs leading-5 text-[var(--muted)]">
                  {provider.tagline}
                </p>

                {/* Provider details */}
                <div className="mt-4 space-y-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2 text-[11px] text-[var(--muted)]">
                      <Lock size={13} />
                      Credential status
                    </span>

                    {isConfigured ? (
                      <span className="flex min-w-0 items-center gap-1.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 size={12} />
                        <span className="truncate">
                          {storedSecret.keyPreview
                            ? `•••• ${storedSecret.keyPreview}`
                            : 'Stored securely'}
                        </span>
                      </span>
                    ) : provider.requiresKey ? (
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                        <AlertCircle size={12} />
                        Not configured
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-sky-600 dark:text-sky-400">
                        <Check size={12} />
                        No key required
                      </span>
                    )}
                  </div>

                  <div className="h-px bg-[var(--border)]" />

                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2 text-[11px] text-[var(--muted)]">
                      <Activity size={13} />
                      Routing priority
                    </span>

                    {isPrimary ? (
                      <StatusPill color="info">
                        <Zap size={11} />
                        Primary
                      </StatusPill>
                    ) : isFallback ? (
                      <StatusPill color="success">
                        <Shield size={11} />
                        Fallback
                      </StatusPill>
                    ) : (
                      <StatusPill>
                        <CircleDot size={11} />
                        Standby
                      </StatusPill>
                    )}
                  </div>
                </div>

                {/* Live test result */}
                {currentTest && (
                  <div className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <StatusPill
                        color={
                          currentTest.status === 200 ? 'success' : 'danger'
                        }
                      >
                        <Activity size={11} />
                        HTTP {currentTest.status}
                      </StatusPill>

                      <span className="flex items-center gap-1 text-[10px] font-semibold text-[var(--muted)]">
                        <Clock3 size={11} />
                        {currentTest.latencyMs} ms
                      </span>

                      {currentTest.fallbackTriggered && (
                        <StatusPill color="warning">
                          <Shield size={11} />
                          Failover used
                        </StatusPill>
                      )}
                    </div>

                    <p className="mt-2 line-clamp-3 text-xs leading-5 text-[var(--muted)]">
                      {currentTest.summary}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="mt-auto flex gap-2 pt-5">
                  <button
                    type="button"
                    onClick={() => handleTestProvider(provider)}
                    disabled={isTesting}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-xs font-semibold text-[var(--foreground)] transition hover:border-[var(--primary)]/40 hover:bg-[var(--surface-secondary)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Play
                      size={13}
                      className={isTesting ? 'animate-pulse' : ''}
                      fill={isTesting ? 'none' : 'currentColor'}
                    />
                    {isTesting ? 'Testing...' : 'Test provider'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveConfigProvider(provider);
                      setConfigMsg(null);
                      setConfigApiKeyInput('');
                      setShowConfigApiKey(false);
                      setTestResult(null);
                    }}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-3 py-2.5 text-xs font-bold text-white shadow-sm transition hover:opacity-90"
                  >
                    <SlidersHorizontal size={13} />
                    Configure
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Empty state */}
      {filteredProviders.length === 0 && (
        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] px-5 py-14 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--surface-secondary)] text-[var(--muted)]">
            <Cpu size={22} />
          </div>
          <h3 className="mt-4 text-sm font-bold text-[var(--foreground)]">
            No providers found
          </h3>
          <p className="mt-1 text-xs text-[var(--muted)]">
            There are no providers in this category.
          </p>
        </div>
      )}

      {/* Configuration modal */}
      {activeConfigProvider && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-3 backdrop-blur-sm sm:p-5"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setActiveConfigProvider(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="provider-config-title"
            className="my-auto w-full max-w-2xl overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-2xl"
          >
            {/* Modal header */}
            <div className="relative overflow-hidden border-b border-[var(--border)] bg-[var(--surface)] px-5 py-5 sm:px-6">
              <div className="pointer-events-none absolute -right-12 -top-24 h-48 w-48 rounded-full bg-[var(--primary)]/[0.08] blur-3xl" />

              <div className="relative flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--card)] p-2.5">
                    <img
                      src={activeConfigProvider.iconUrl}
                      alt={activeConfigProvider.name}
                      className="h-full w-full object-contain"
                    />
                  </div>

                  <div className="min-w-0">
                    <SectionLabel>Provider configuration</SectionLabel>
                    <h2
                      id="provider-config-title"
                      className="mt-1 truncate text-base font-bold text-[var(--foreground)]"
                    >
                      {activeConfigProvider.name}
                    </h2>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span className="text-[10px] capitalize text-[var(--muted)]">
                        {activeConfigProvider.category} integration
                      </span>
                      <span className="h-1 w-1 rounded-full bg-[var(--muted)]" />
                      <a
                        href={activeConfigProvider.docUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] font-semibold text-[var(--primary)] hover:underline"
                      >
                        Official documentation
                        <ExternalLink size={10} />
                      </a>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveConfigProvider(null)}
                  className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-2 text-[var(--muted)] transition hover:text-[var(--foreground)]"
                  aria-label="Close configuration"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="max-h-[calc(90dvh-90px)] space-y-6 overflow-y-auto p-5 sm:p-6">
              {/* Feedback */}
              {configMsg && (
                <div
                  className={`flex items-start gap-2.5 rounded-xl border p-3 text-xs ${
                    configMsg.type === 'success'
                      ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {configMsg.type === 'success' ? (
                    <CheckCircle2 size={15} className="mt-0.5 shrink-0" />
                  ) : (
                    <AlertCircle size={15} className="mt-0.5 shrink-0" />
                  )}
                  <span>{configMsg.text}</span>
                </div>
              )}

              {/* Credential section */}
              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
                    <Key size={15} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[var(--foreground)]">
                      API credentials
                    </h3>
                    <p className="text-[10px] text-[var(--muted)]">
                      Manage your provider authentication key.
                    </p>
                  </div>
                </div>

                {activeConfigProvider.requiresKey ? (
                  <form
                    onSubmit={handleSaveProviderKey}
                    className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <label
                        htmlFor="provider-api-key"
                        className="text-xs font-semibold text-[var(--foreground)]"
                      >
                        Provider API key
                      </label>
                      <StatusPill color="success">
                        <Lock size={10} />
                        Encrypted vault
                      </StatusPill>
                    </div>

                    <div className="relative">
                      <Key className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />

                      <input
                        id="provider-api-key"
                        type={showConfigApiKey ? 'text' : 'password'}
                        placeholder={`Paste your ${activeConfigProvider.name} API key`}
                        value={configApiKeyInput}
                        onChange={(e) =>
                          setConfigApiKeyInput(e.target.value)
                        }
                        required
                        autoComplete="off"
                        className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] py-3 pl-10 pr-11 text-xs text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowConfigApiKey(!showConfigApiKey)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-[var(--muted)] transition hover:text-[var(--foreground)]"
                        aria-label={
                          showConfigApiKey ? 'Hide API key' : 'Show API key'
                        }
                      >
                        {showConfigApiKey ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </button>
                    </div>

                    <p className="text-[10px] leading-5 text-[var(--muted)]">
                      Your credential is submitted to the OneAPI vault.
                      Avoid sharing it or exposing it in client-side code.
                    </p>

                    <div className="flex flex-col gap-2 sm:flex-row">
                      <button
                        type="submit"
                        disabled={
                          savingConfigKey || !configApiKeyInput.trim()
                        }
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2.5 text-xs font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {savingConfigKey ? (
                          <>
                            <RefreshCw size={13} className="animate-spin" />
                            Saving credential...
                          </>
                        ) : (
                          <>
                            <Lock size={13} />
                            Save credential
                          </>
                        )}
                      </button>

                      {vaultSecrets.some(
                        (s) =>
                          s.category?.toLowerCase() ===
                            activeConfigProvider.category?.toLowerCase() &&
                          s.providerId?.toLowerCase() ===
                            activeConfigProvider.id?.toLowerCase()
                      ) && (
                        <button
                          type="button"
                          onClick={() =>
                            handleDeleteProviderKey(activeConfigProvider.id)
                          }
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-2.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-500/15 dark:text-rose-400"
                        >
                          <Trash2 size={13} />
                          Revoke key
                        </button>
                      )}
                    </div>
                  </form>
                ) : (
                  <div className="flex items-start gap-3 rounded-xl border border-sky-500/20 bg-sky-500/5 p-4">
                    <CheckCircle2
                      size={17}
                      className="mt-0.5 shrink-0 text-sky-500"
                    />
                    <div>
                      <p className="text-xs font-bold text-[var(--foreground)]">
                        No API key required
                      </p>
                      <p className="mt-1 text-[11px] leading-5 text-[var(--muted)]">
                        {activeConfigProvider.name} is configured as a
                        keyless public API in your provider catalog.
                      </p>
                    </div>
                  </div>
                )}
              </section>

              {/* Routing section */}
              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-500">
                    <Zap size={15} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[var(--foreground)]">
                      Routing priority
                    </h3>
                    <p className="text-[10px] text-[var(--muted)]">
                      Assign this provider a routing role.
                    </p>
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={() =>
                      handleSetPriorityRouting(
                        activeConfigProvider.category,
                        activeConfigProvider.id,
                        'primary'
                      )
                    }
                    className="flex flex-col items-start gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 text-left transition hover:border-sky-500/40 hover:bg-sky-500/5"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10 text-sky-500">
                      <Zap size={15} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[var(--foreground)]">
                        Primary
                      </p>
                      <p className="mt-1 text-[10px] leading-4 text-[var(--muted)]">
                        Main provider for requests
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleSetPriorityRouting(
                        activeConfigProvider.category,
                        activeConfigProvider.id,
                        'fallback'
                      )
                    }
                    className="flex flex-col items-start gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 text-left transition hover:border-violet-500/40 hover:bg-violet-500/5"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-500">
                      <Shield size={15} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[var(--foreground)]">
                        Fallback
                      </p>
                      <p className="mt-1 text-[10px] leading-4 text-[var(--muted)]">
                        Secondary provider on failure
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleSetPriorityRouting(
                        activeConfigProvider.category,
                        activeConfigProvider.id,
                        'disable_fallback'
                      )
                    }
                    className="flex flex-col items-start gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 text-left transition hover:border-rose-500/40 hover:bg-rose-500/5"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-500">
                      <Ban size={15} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[var(--foreground)]">
                        Disable fallback
                      </p>
                      <p className="mt-1 text-[10px] leading-4 text-[var(--muted)]">
                        Remove secondary provider
                      </p>
                    </div>
                  </button>
                </div>

                <Link
                  href="/dashboard/routing"
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[var(--primary)] hover:underline"
                >
                  Advanced routing settings
                  <ArrowRight size={12} />
                </Link>
              </section>

              {/* Live test section */}
              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                    <Activity size={15} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[var(--foreground)]">
                      Connection test
                    </h3>
                    <p className="text-[10px] text-[var(--muted)]">
                      Send a live request through the gateway.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleTestProvider(activeConfigProvider)}
                  disabled={testingProviderId === activeConfigProvider.id}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-xs font-bold text-emerald-600 transition hover:bg-emerald-500/15 disabled:cursor-not-allowed disabled:opacity-50 dark:text-emerald-400"
                >
                  {testingProviderId === activeConfigProvider.id ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      Executing live request...
                    </>
                  ) : (
                    <>
                      <Play size={13} fill="currentColor" />
                      Test provider connection
                    </>
                  )}
                </button>

                {testResult &&
                  testResult.providerId === activeConfigProvider.id && (
                    <div className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusPill
                          color={
                            testResult.status === 200 ? 'success' : 'danger'
                          }
                        >
                          HTTP {testResult.status}
                        </StatusPill>

                        <StatusPill>
                          <Clock3 size={10} />
                          {testResult.latencyMs} ms
                        </StatusPill>

                        <StatusPill color="info">
                          {testResult.finalProvider}
                        </StatusPill>

                        {testResult.fallbackTriggered && (
                          <StatusPill color="warning">
                            <Shield size={10} />
                            Fallback triggered
                          </StatusPill>
                        )}
                      </div>

                      {testResult.summary && (
                        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3">
                          <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                            <CheckCircle2
                              size={12}
                              className="text-emerald-500"
                            />
                            Gateway response
                          </p>
                          <p className="text-xs leading-5 text-[var(--foreground)]">
                            {testResult.summary}
                          </p>
                        </div>
                      )}

                      <details className="group/details">
                        <summary className="cursor-pointer text-[10px] font-semibold text-[var(--muted)] transition hover:text-[var(--foreground)]">
                          View raw JSON response
                        </summary>
                        <pre className="mt-2 max-h-48 overflow-auto rounded-lg border border-[var(--border)] bg-[var(--background)] p-3 text-[10px] leading-5 text-[var(--muted)]">
                          {JSON.stringify(testResult.raw, null, 2)}
                        </pre>
                      </details>
                    </div>
                  )}
              </section>

              {/* Modal footer */}
              <div className="flex flex-col-reverse gap-2 border-t border-[var(--border)] pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[10px] text-[var(--muted)]">
                  Changes are saved to your OneAPI configuration.
                </p>

                <button
                  type="button"
                  onClick={() => setActiveConfigProvider(null)}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-xs font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-secondary)]"
                >
                  Close configuration
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
