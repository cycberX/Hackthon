'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  FolderKanban,
  Cpu,
  KeyRound,
  BookOpen,
  UserCircle,
  Settings,
  Menu,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Shield,
  Layers,
  Key,
  Copy,
  Check,
  Plus,
  Trash2,
  Play,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Eye,
  EyeOff,
  Sliders,
  Terminal,
  Code2,
  Radio,
  Clock,
  Sparkles,
  Server,
  Database,
  Lock,
  Mail,
  Phone,
  User,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react';
import { authStorage, fetchApi } from '@/lib/api';

type Tab = 'overview' | 'projects' | 'providers' | 'keys' | 'docs' | 'profile' | 'settings';
type Category = 'ai' | 'music' | 'weather' | 'news' | 'environment';

interface ProviderCatalogItem {
  id: string;
  name: string;
  category: Category;
  requiresKey: boolean;
  tagline: string;
  docUrl: string;
  iconUrl: string;
  fallbackIcon: string;
}

const PROVIDERS_CATALOG: ProviderCatalogItem[] = [
  {
    id: 'gemini',
    name: 'Google Gemini (gemini-3.5-flash-lite)',
    category: 'ai',
    requiresKey: true,
    tagline: 'High-speed multimodal AI generation with massive context window.',
    docUrl: 'https://ai.google.dev',
    iconUrl: 'https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg',
    fallbackIcon: '🧠',
  },
  {
    id: 'groq',
    name: 'Groq Cloud (Llama 3.3 70B)',
    category: 'ai',
    requiresKey: true,
    tagline: 'Ultra-low latency LPU inference for real-time AI reasoning.',
    docUrl: 'https://console.groq.com',
    iconUrl: 'https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/svg/groq.svg',
    fallbackIcon: '⚡',
  },
  {
    id: 'openrouter',
    name: 'OpenRouter (Unified AI Models)',
    category: 'ai',
    requiresKey: true,
    tagline: 'Access 200+ models (Claude, GPT-4o, Llama 3.3, DeepSeek) through one key.',
    docUrl: 'https://openrouter.ai/docs',
    iconUrl: 'https://openrouter.ai/favicon.ico',
    fallbackIcon: '🌐',
  },
  {
    id: 'deezer',
    name: 'Deezer Music API',
    category: 'music',
    requiresKey: false,
    tagline: 'Global music catalog with metadata, tracks, artists, and album previews.',
    docUrl: 'https://developers.deezer.com/api',
    iconUrl: 'https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/svg/deezer.svg',
    fallbackIcon: '🎵',
  },
  {
    id: 'itunes',
    name: 'Apple iTunes Search API',
    category: 'music',
    requiresKey: false,
    tagline: 'Apple media repository spanning songs, albums, and podcasts.',
    docUrl: 'https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/iTuneSearchAPI/',
    iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/apple/apple-original.svg',
    fallbackIcon: '🍎',
  },
  {
    id: 'openmeteo',
    name: 'Open-Meteo Weather',
    category: 'weather',
    requiresKey: false,
    tagline: 'High-resolution global weather forecast models without API keys.',
    docUrl: 'https://open-meteo.com',
    iconUrl: 'https://open-meteo.com/images/logo.svg',
    fallbackIcon: '☀️',
  },
  {
    id: 'weatherstack',
    name: 'Weatherstack (APILayer)',
    category: 'weather',
    requiresKey: true,
    tagline: 'Production-ready real-time meteorological conditions for 2.6M+ cities.',
    docUrl: 'https://weatherstack.com',
    iconUrl: 'https://assets.apilayer.com/weatherstack/icon.png',
    fallbackIcon: '🌤️',
  },
  {
    id: 'hackernews',
    name: 'HackerNews Official API',
    category: 'news',
    requiresKey: false,
    tagline: 'Real-time trending tech headlines, stories, and top algorithmic submissions.',
    docUrl: 'https://github.com/HackerNews/API',
    iconUrl: 'https://news.ycombinator.com/y18.svg',
    fallbackIcon: '📰',
  },
  {
    id: 'spaceflight',
    name: 'Spaceflight News API',
    category: 'news',
    requiresKey: false,
    tagline: 'Curated space exploration and satellite launch reports worldwide.',
    docUrl: 'https://spaceflightnewsapi.net',
    iconUrl: 'https://spaceflightnewsapi.net/favicon.ico',
    fallbackIcon: '🚀',
  },
  {
    id: 'openaq',
    name: 'OpenAQ Global Air Quality',
    category: 'environment',
    requiresKey: false,
    tagline: 'Worldwide reference-grade ambient air quality & PM2.5 monitoring sensors.',
    docUrl: 'https://openaq.org',
    iconUrl: 'https://openaq.org/assets/graphics/content/logo.svg',
    fallbackIcon: '🌱',
  },
  {
    id: 'openmeteo_air',
    name: 'Open-Meteo Atmospheric Air',
    category: 'environment',
    requiresKey: false,
    tagline: 'Atmospheric pollutant dispersion modeling including AQI, NO2, O3, and PM10.',
    docUrl: 'https://open-meteo.com/en/docs/air-quality-api',
    iconUrl: 'https://open-meteo.com/images/logo.svg',
    fallbackIcon: '💨',
  },
];

export default function DashboardPage() {
  const router = useRouter();

  // Navigation & Layout State
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Authenticated User State
  const [user, setUser] = useState<any>(null);

  // Projects State
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [currentProject, setCurrentProject] = useState<any>(null);
  const [newProjectName, setNewProjectName] = useState('');
  const [creatingProject, setCreatingProject] = useState(false);
  const [freshProjectToken, setFreshProjectToken] = useState<string | null>(null);

  // Vault Secrets & Routing Rules State
  const [vaultSecrets, setVaultSecrets] = useState<any[]>([]);
  const [routingRules, setRoutingRules] = useState<any[]>([]);

  // Project Analytics (Real Backend Data)
  const [analytics, setAnalytics] = useState<{
    totalRequests: number;
    totalFallbacks: number;
    fallbackRatePercentage: string;
    recentLogs: any[];
  }>({
    totalRequests: 0,
    totalFallbacks: 0,
    fallbackRatePercentage: '0.00%',
    recentLogs: [],
  });

  // Developer API Keys (Real Backend Data)
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [creatingApiKey, setCreatingApiKey] = useState(false);
  const [freshRawApiKey, setFreshRawApiKey] = useState<string | null>(null);
  const [keyToValidate, setKeyToValidate] = useState('');
  const [validatingKey, setValidatingKey] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);

  // Provider Connect / Config Modal State
  const [activeConfigProvider, setActiveConfigProvider] = useState<ProviderCatalogItem | null>(null);
  const [configApiKeyInput, setConfigApiKeyInput] = useState('');
  const [showConfigApiKey, setShowConfigApiKey] = useState(false);
  const [savingConfigKey, setSavingConfigKey] = useState(false);
  const [configMsg, setConfigMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [providerTestLoading, setProviderTestLoading] = useState(false);
  const [providerTestResult, setProviderTestResult] = useState<any>(null);

  // Settings: Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordChangeMsg, setPasswordChangeMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Clipboard Copied Indicator
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // 1. Initial Load: User & Projects & API Keys
  useEffect(() => {
    loadUserProfile();
    loadProjects();
    loadApiKeys();
  }, []);

  // 2. When Selected Project Changes: Load Project Details & Analytics
  useEffect(() => {
    if (selectedProjectId) {
      loadProjectDetails(selectedProjectId);
      loadProjectAnalytics(selectedProjectId);
    }
  }, [selectedProjectId]);

  const loadUserProfile = async () => {
    const stored = authStorage.getUser();
    if (stored) {
      setUser(stored);
    }
    try {
      const res = await fetchApi('/api/v1/auth/me');
      if (res.success && res.data?.user) {
        setUser(res.data.user);
        authStorage.setUser(res.data.user);
      }
    } catch (err) {
      console.error('Failed to load profile', err);
    }
  };

  const loadProjects = async () => {
    try {
      const res = await fetchApi('/api/v1/projects');
      if (res.success && res.data?.projects) {
        setProjects(res.data.projects);
        if (res.data.projects.length > 0 && !selectedProjectId) {
          const firstProj = res.data.projects[0];
          setSelectedProjectId(firstProj.projectId || firstProj._id);
        }
      }
    } catch (err) {
      console.error('Failed to load projects', err);
    }
  };

  const loadProjectDetails = async (projId: string) => {
    try {
      const res = await fetchApi(`/api/v1/projects/${projId}`);
      if (res.success && res.data) {
        setCurrentProject(res.data.project);
        setRoutingRules(res.data.routingRules || []);
        setVaultSecrets(res.data.vaultSecrets || []);
      }
    } catch (err) {
      console.error('Failed to load project details', err);
    }
  };

  const loadProjectAnalytics = async (projId: string) => {
    try {
      const res = await fetchApi(`/api/v1/projects/${projId}/analytics`);
      if (res.success && res.data) {
        setAnalytics({
          totalRequests: res.data.totalRequests || 0,
          totalFallbacks: res.data.totalFallbacks || 0,
          fallbackRatePercentage: res.data.fallbackRatePercentage || '0.00%',
          recentLogs: res.data.recentLogs || [],
        });
      }
    } catch (err) {
      console.error('Failed to load project analytics', err);
    }
  };

  const loadApiKeys = async () => {
    try {
      const res = await fetchApi('/api/v1/auth/api-keys');
      if (res.success && res.data?.apiKeys) {
        setApiKeys(res.data.apiKeys);
      }
    } catch (err) {
      console.error('Failed to load API keys', err);
    }
  };

  // Create Project
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    setCreatingProject(true);
    try {
      const res = await fetchApi('/api/v1/projects', {
        method: 'POST',
        body: JSON.stringify({ name: newProjectName.trim() }),
      });

      if (res.success && res.data) {
        setNewProjectName('');
        setFreshProjectToken(res.data.projectToken);
        authStorage.setProjectToken(res.data.projectToken);
        const createdId = res.data.project.projectId || res.data.project._id;
        authStorage.setProjectId(createdId);
        await loadProjects();
        setSelectedProjectId(createdId);
        loadProjectDetails(createdId);
      }
    } catch (err) {
      console.error('Error creating project', err);
    } finally {
      setCreatingProject(false);
    }
  };

  // Create Developer API Key
  const handleCreateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingApiKey(true);
    setFreshRawApiKey(null);

    try {
      const res = await fetchApi('/api/v1/auth/create-api-key', {
        method: 'POST',
        body: JSON.stringify({
          name: newKeyName.trim() || 'Production Key',
          scopes: ['read', 'write', 'proxy'],
        }),
      });

      if (res.success && res.data) {
        setFreshRawApiKey(res.data.rawApiKey);
        setNewKeyName('');
        loadApiKeys();
      }
    } catch (err) {
      console.error('Failed to create API key', err);
    } finally {
      setCreatingApiKey(false);
    }
  };

  // Delete Developer API Key
  const handleDeleteApiKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to revoke this API key? Applications using it will immediately be rejected.')) return;
    try {
      const res = await fetchApi(`/api/v1/auth/api-keys/${keyId}`, { method: 'DELETE' });
      if (res.success) {
        loadApiKeys();
      }
    } catch (err) {
      console.error('Failed to delete key', err);
    }
  };

  // Validate API Key
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
      setValidationResult({ success: false, error: { message: err.message } });
    } finally {
      setValidatingKey(false);
    }
  };

  // Save Provider Secret to AES-256 Vault
  const handleSaveProviderKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConfigProvider || !selectedProjectId) return;

    setSavingConfigKey(true);
    setConfigMsg(null);

    try {
      const res = await fetchApi(`/api/v1/projects/${selectedProjectId}/vault`, {
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
          text: `Credential for ${activeConfigProvider.name} safely encrypted with AES-256-GCM.`,
        });
        setConfigApiKeyInput('');
        loadProjectDetails(selectedProjectId);
      } else {
        setConfigMsg({ type: 'error', text: res.error?.message || 'Failed to save key into vault.' });
      }
    } catch (err: any) {
      setConfigMsg({ type: 'error', text: err.message || 'Vault encryption error.' });
    } finally {
      setSavingConfigKey(false);
    }
  };

  // Delete Provider Secret from Vault
  const handleDeleteProviderKey = async (secretId: string) => {
    if (!confirm('Remove this credential from AES-256 Vault?')) return;
    try {
      const res = await fetchApi(`/api/v1/projects/${selectedProjectId}/vault/${secretId}`, {
        method: 'DELETE',
      });
      if (res.success) {
        setConfigMsg({ type: 'success', text: 'Credential deleted from vault.' });
        loadProjectDetails(selectedProjectId);
      }
    } catch (err) {
      console.error('Failed to delete vault secret', err);
    }
  };

  // Update Priority Routing
  const handleSetPriorityRouting = async (category: Category, providerId: string, role: 'primary' | 'fallback') => {
    if (!selectedProjectId) return;
    const currentRule = routingRules.find((r) => r.category === category);
    const primary = role === 'primary' ? providerId : (currentRule?.primaryProviderId || providerId);
    const fallback = role === 'fallback' ? providerId : (currentRule?.fallbackProviderId || providerId);

    try {
      const res = await fetchApi(`/api/v1/projects/${selectedProjectId}/routing`, {
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
          text: `Updated ${category.toUpperCase()} routing: Primary = ${primary}, Fallback = ${fallback}`,
        });
        loadProjectDetails(selectedProjectId);
      }
    } catch (err: any) {
      setConfigMsg({ type: 'error', text: err.message || 'Failed to update routing rule.' });
    }
  };

  // Test Provider Live Call
  const handleTestProviderCall = async (provider: ProviderCatalogItem) => {
    setProviderTestLoading(true);
    setProviderTestResult(null);

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
          messages: [{ role: 'user', content: 'Respond in 1 sentence: What is the OneAPI gateway?' }],
          prompt: 'Respond in 1 sentence: What is the OneAPI gateway?',
        });
      } else if (provider.category === 'weather') {
        endpoint = '/api/v1/proxy/weather/current?city=San+Francisco';
      } else if (provider.category === 'music') {
        endpoint = '/api/v1/proxy/music/search?q=Daft+Punk';
      } else if (provider.category === 'news') {
        endpoint = '/api/v1/proxy/news/top?limit=2';
      } else if (provider.category === 'environment') {
        endpoint = '/api/v1/proxy/environment/air-quality?city=London';
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-oneapi-provider': provider.id,
      };
      if (selectedProjectId) {
        headers['x-project-id'] = selectedProjectId;
      }
      const activeTok = freshProjectToken || authStorage.getProjectToken();
      if (activeTok) {
        headers['x-project-token'] = activeTok;
      }

      const res = await fetchApi(endpoint, { method, headers, body });
      const latencyMs = Math.round(performance.now() - startTime);

      let contentText: string | undefined;
      if (res.data?.choices?.[0]?.message?.content) {
        contentText = res.data.choices[0].message.content;
      } else if (typeof res.data?.content === 'string') {
        contentText = res.data.content;
      }

      setProviderTestResult({
        status: res.success ? 200 : res.error?.code || 500,
        latencyMs,
        provider: res._oneapi?.finalProvider || provider.id,
        fallbackTriggered: res._oneapi?.fallbackTriggered || false,
        fallbackReason: res._oneapi?.fallbackReason,
        content: contentText,
        data: res,
      });
    } catch (err: any) {
      setProviderTestResult({
        status: 500,
        latencyMs: Math.round(performance.now() - startTime),
        provider: provider.id,
        fallbackTriggered: false,
        data: { error: err.message },
      });
    } finally {
      setProviderTestLoading(false);
    }
  };

  // Settings: Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordChangeMsg(null);

    if (newPassword !== confirmPassword) {
      setPasswordChangeMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordChangeMsg({ type: 'error', text: 'New password must be at least 8 characters long.' });
      return;
    }

    setChangingPassword(true);
    try {
      const res = await fetchApi('/api/v1/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      if (res.success) {
        setPasswordChangeMsg({ type: 'success', text: 'Password successfully updated!' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordChangeMsg({ type: 'error', text: res.error?.message || 'Failed to update password.' });
      }
    } catch (err: any) {
      setPasswordChangeMsg({ type: 'error', text: err.message || 'Error updating password.' });
    } finally {
      setChangingPassword(false);
    }
  };

  // Logout Handler
  const handleLogout = async () => {
    try {
      await fetchApi('/api/v1/auth/logout', { method: 'POST' });
    } catch (e) {
      // Ignore
    }
    authStorage.clear();
    router.push('/login');
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Navigation Items
  const navItems: { id: Tab; label: string; icon: React.ReactNode; badge?: string | number }[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'projects', label: 'Projects', icon: <FolderKanban className="w-5 h-5" />, badge: projects.length },
    { id: 'providers', label: 'API Providers', icon: <Cpu className="w-5 h-5" />, badge: PROVIDERS_CATALOG.length },
    { id: 'keys', label: 'API Keys', icon: <KeyRound className="w-5 h-5" />, badge: apiKeys.length },
    { id: 'docs', label: 'Documentation', icon: <BookOpen className="w-5 h-5" /> },
    { id: 'profile', label: 'Profile', icon: <UserCircle className="w-5 h-5" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <div className="flex h-screen bg-[#090d16] text-slate-100 overflow-hidden font-sans">
      {/* ------------------------------------------------------------- */}
      {/* 1. RESPONSIVE COLLAPSIBLE SIDEBAR                             */}
      {/* ------------------------------------------------------------- */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-[#0b0f19] border-r border-slate-800/80 transition-all duration-300 ease-in-out md:static ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        } ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/80 shrink-0">
          <Link href="/dashboard" className="flex items-center gap-2.5 overflow-hidden">
            <span className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-sky-500/20 shrink-0">
              ⚡
            </span>
            {!sidebarCollapsed && (
              <span className="text-xl font-bold tracking-tight text-white whitespace-nowrap">
                One<span className="text-sky-400">API</span>
              </span>
            )}
          </Link>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 cursor-pointer transition-colors"
            title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {/* Mobile Close Button */}
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden p-1.5 text-slate-400 hover:text-white"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items List */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-all ${
                  isActive
                    ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30 shadow-sm shadow-sky-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850/60 border border-transparent'
                } ${sidebarCollapsed ? 'justify-center px-0' : ''}`}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <span className="shrink-0">{item.icon}</span>
                {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                {!sidebarCollapsed && item.badge !== undefined && (
                  <span className="ml-auto text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Mini Profile & Logout */}
        <div className="p-3 border-t border-slate-800/80 bg-[#090d16]/60 shrink-0">
          {!sidebarCollapsed ? (
            <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-xs shrink-0">
                  {user?.name ? user.name.slice(0, 2).toUpperCase() : 'DV'}
                </div>
                <div className="overflow-hidden text-left">
                  <div className="text-xs font-semibold text-white truncate">{user?.name || 'Developer'}</div>
                  <div className="text-[10px] text-slate-400 truncate">{user?.email || 'dev@oneapi.io'}</div>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg cursor-pointer transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center p-2.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl cursor-pointer transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          )}
        </div>
      </aside>

      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
        />
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. MAIN CONTENT AREA                                          */}
      {/* ------------------------------------------------------------- */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#090d16]">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-slate-800/80 bg-[#0f172a]/70 backdrop-blur-md px-6 flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Current Tab Heading */}
            <h1 className="text-lg font-bold text-white capitalize tracking-tight flex items-center gap-2">
              <span>{activeTab === 'keys' ? 'API Keys' : activeTab === 'docs' ? 'API Documentation' : activeTab}</span>
            </h1>
          </div>

          {/* Active Project Selector & Status Pill */}
          <div className="flex items-center gap-3">
            {projects.length > 0 && (
              <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs">
                <span className="text-slate-400 hidden sm:inline">Project:</span>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
                >
                  {projects.map((p) => (
                    <option key={p.projectId || p._id} value={p.projectId || p._id} className="bg-slate-900 text-white">
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="hidden sm:flex items-center gap-2 text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Gateway 99.9% Uptime
            </div>
          </div>
        </header>

        {/* Dynamic Tab Body */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          {/* ======================================================== */}
          {/* VIEW 1: OVERVIEW (NEVER MOCK DATA)                       */}
          {/* ======================================================== */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Active Workspace Banner */}
              <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 text-[10px] font-mono font-bold tracking-wider uppercase">
                      ACTIVE PROJECT
                    </span>
                    <h2 className="text-2xl font-bold text-white mt-1">
                      {currentProject?.name || 'Default Project'}
                    </h2>
                    <p className="text-xs text-slate-400 mt-1 max-w-xl">
                      Unified proxy gateway with AES-256-GCM vault and zero-downtime automated provider failover.
                    </p>
                  </div>

                  {currentProject && (
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <div className="bg-slate-950 border border-slate-800 px-3 py-2 rounded-xl flex items-center gap-2">
                        <span className="text-slate-400">Project ID:</span>
                        <code className="text-sky-400 font-mono font-bold">{currentProject.projectId || currentProject._id}</code>
                        <button
                          onClick={() => copyToClipboard(currentProject.projectId || currentProject._id, 'proj-ov')}
                          className="text-slate-500 hover:text-slate-300 ml-1 cursor-pointer"
                        >
                          {copiedId === 'proj-ov' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      <div className="bg-slate-950 border border-slate-800 px-3 py-2 rounded-xl flex items-center gap-2">
                        <span className="text-slate-400">Token:</span>
                        <code className="text-amber-400 font-mono font-bold">{currentProject.projectTokenPrefix || 'oneapi_••••'}</code>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 4 Real Metric KPI Cards (100% Real Backend Data) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Active Projects */}
                <div className="p-5 rounded-2xl bg-[#111827] border border-slate-800 shadow-lg">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Projects</span>
                    <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
                      <FolderKanban className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-3xl font-extrabold text-white">{projects.length}</div>
                  <div className="text-[11px] text-slate-500 mt-2 flex items-center gap-1.5">
                    <span className="text-emerald-400 font-medium">100% Live</span> &bull; Synchronized with MongoDB
                  </div>
                </div>

                {/* Developer API Keys */}
                <div className="p-5 rounded-2xl bg-[#111827] border border-slate-800 shadow-lg">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Developer API Keys</span>
                    <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center">
                      <KeyRound className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-3xl font-extrabold text-white">{apiKeys.length}</div>
                  <div className="text-[11px] text-slate-500 mt-2 flex items-center gap-1.5">
                    <span className="text-violet-400 font-medium">Active Keys</span> &bull; Scoped client server access
                  </div>
                </div>

                {/* Vault Credentials */}
                <div className="p-5 rounded-2xl bg-[#111827] border border-slate-800 shadow-lg">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Vault Credentials</span>
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                      <Shield className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-3xl font-extrabold text-white">{vaultSecrets.length}</div>
                  <div className="text-[11px] text-slate-500 mt-2 flex items-center gap-1.5">
                    <span className="text-amber-400 font-medium">AES-256 Encrypted</span> &bull; Third-party API keys
                  </div>
                </div>

                {/* Gateway Requests */}
                <div className="p-5 rounded-2xl bg-[#111827] border border-slate-800 shadow-lg">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Proxy Requests</span>
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <Activity className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-3xl font-extrabold text-white">{analytics.totalRequests}</div>
                  <div className="text-[11px] text-slate-500 mt-2 flex items-center gap-1.5">
                    <span className="text-emerald-400 font-medium">Failovers: {analytics.totalFallbacks}</span> ({analytics.fallbackRatePercentage})
                  </div>
                </div>
              </div>

              {/* Real Gateway Activity & Telemetry Table */}
              <div className="p-6 rounded-2xl bg-[#111827] border border-slate-800 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Activity className="w-4 h-4 text-sky-400" />
                      Live Gateway Logs & Telemetry
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Real requests logged by the OneAPI proxy gateway for this project.</p>
                  </div>

                  <button
                    onClick={() => selectedProjectId && loadProjectAnalytics(selectedProjectId)}
                    className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer transition-colors"
                    title="Refresh Logs"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>

                {analytics.recentLogs.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl">
                    <Terminal className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-xs font-medium text-slate-400">No gateway proxy requests logged yet for this project.</p>
                    <p className="text-[11px] text-slate-600 mt-1">
                      Execute a test query from the <strong className="text-sky-400 cursor-pointer" onClick={() => setActiveTab('providers')}>API Providers</strong> or <strong className="text-sky-400 cursor-pointer" onClick={() => setActiveTab('docs')}>Documentation</strong> tab to see live telemetry.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                          <th className="pb-3">Timestamp</th>
                          <th className="pb-3">Category</th>
                          <th className="pb-3">Endpoint</th>
                          <th className="pb-3">Provider</th>
                          <th className="pb-3">Status</th>
                          <th className="pb-3">Latency</th>
                          <th className="pb-3">Failover</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 font-mono">
                        {analytics.recentLogs.map((log: any) => (
                          <tr key={log._id || Math.random()} className="hover:bg-slate-900/50">
                            <td className="py-2.5 text-slate-500 text-[11px]">
                              {new Date(log.createdAt).toLocaleTimeString()}
                            </td>
                            <td className="py-2.5 text-slate-300 capitalize">{log.category}</td>
                            <td className="py-2.5 text-sky-400 font-semibold">{log.endpoint}</td>
                            <td className="py-2.5 text-amber-300">{log.finalProvider}</td>
                            <td className="py-2.5">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  log.statusCode < 400
                                    ? 'bg-emerald-500/10 text-emerald-400'
                                    : 'bg-rose-500/10 text-rose-400'
                                }`}
                              >
                                {log.statusCode}
                              </span>
                            </td>
                            <td className="py-2.5 text-slate-400">{log.latencyMs}ms</td>
                            <td className="py-2.5">
                              {log.fallbackTriggered ? (
                                <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[10px] font-bold">
                                  Triggered
                                </span>
                              ) : (
                                <span className="text-slate-600 text-[10px]">Direct</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW 2: PROJECTS                                         */}
          {/* ======================================================== */}
          {activeTab === 'projects' && (
            <div className="space-y-6">
              {/* Projects Header & Create Bar */}
              <div className="p-6 rounded-2xl bg-[#111827] border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-white">Project Workspaces</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Organize separate environments, API routing rules, and isolated encrypted vaults.
                  </p>
                </div>

                <form onSubmit={handleCreateProject} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Project name (e.g. Production Staging)..."
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    required
                    className="px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
                  />
                  <button
                    type="submit"
                    disabled={creatingProject}
                    className="px-4 py-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-sky-500/25 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {creatingProject ? 'Creating...' : 'Create Project'}
                  </button>
                </form>
              </div>

              {/* Newly Created Project Token Notice */}
              {freshProjectToken && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-start justify-between gap-4">
                  <div>
                    <p className="font-bold flex items-center gap-1.5 text-amber-400">
                      <AlertTriangle className="w-4 h-4" /> Save your new Project Gateway Token:
                    </p>
                    <code className="mt-1.5 block font-mono select-all bg-slate-950 px-3 py-2 rounded-lg border border-amber-500/20 text-white font-bold break-all">
                      {freshProjectToken}
                    </code>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Include this token in proxy requests header: <span className="text-sky-300 font-mono">x-project-token</span>.
                    </p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(freshProjectToken, 'fresh-tok')}
                    className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    {copiedId === 'fresh-tok' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} Copy
                  </button>
                </div>
              )}

              {/* Projects List Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map((proj) => {
                  const isCurrent = (proj.projectId || proj._id) === selectedProjectId;
                  return (
                    <div
                      key={proj.projectId || proj._id}
                      className={`p-5 rounded-2xl border transition-all ${
                        isCurrent
                          ? 'bg-slate-900/90 border-sky-500 shadow-xl shadow-sky-500/5 ring-1 ring-sky-500/40'
                          : 'bg-[#111827] border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center font-bold text-xs">
                            {proj.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-white">{proj.name}</h3>
                            <div className="text-[10px] text-slate-500 font-mono">{new Date(proj.createdAt).toLocaleDateString()}</div>
                          </div>
                        </div>

                        {isCurrent && (
                          <span className="px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-400 border border-sky-500/30 text-[10px] font-bold">
                            ACTIVE
                          </span>
                        )}
                      </div>

                      <div className="space-y-2 text-xs font-mono my-4 p-3 rounded-xl bg-slate-950/80 border border-slate-800/80">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Project ID:</span>
                          <span className="text-slate-300">{proj.projectId || proj._id.slice(-8)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Token Prefix:</span>
                          <span className="text-amber-400">{proj.projectTokenPrefix || 'oneapi_••••'}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-800">
                        {!isCurrent ? (
                          <button
                            onClick={() => setSelectedProjectId(proj.projectId || proj._id)}
                            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl cursor-pointer transition-colors"
                          >
                            Switch to this Project
                          </button>
                        ) : (
                          <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1 mx-auto">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Currently Active Workspace
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW 3: API PROVIDERS (CARDS WITH REAL PUBLIC ICONS)      */}
          {/* ======================================================== */}
          {activeTab === 'providers' && (
            <div className="space-y-6">
              {/* Header */}
              <div className="p-6 rounded-2xl bg-[#111827] border border-slate-800 shadow-xl">
                <h2 className="text-lg font-bold text-white">Supported Third-Party API Providers</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Pre-integrated production providers across AI, Music, Weather, News, and Environment. Click{' '}
                  <strong className="text-sky-400">Connect / Config</strong> to store your credentials in the AES-256 Vault or configure failover routing.
                </p>
              </div>

              {/* Provider Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {PROVIDERS_CATALOG.map((provider) => {
                  const storedSecret = vaultSecrets.find((s) => s.category === provider.category && s.providerId === provider.id);
                  const isConfigured = !!storedSecret;
                  const currentRule = routingRules.find((r) => r.category === provider.category);
                  const isPrimary = currentRule?.primaryProviderId === provider.id;
                  const isFallback = currentRule?.fallbackProviderId === provider.id;

                  return (
                    <div
                      key={provider.id}
                      className="p-5 rounded-2xl bg-[#111827] border border-slate-800 hover:border-slate-700 shadow-xl flex flex-col justify-between transition-all"
                    >
                      <div>
                        {/* Provider Header with Real Logo */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center p-2 shrink-0 overflow-hidden">
                              <img
                                src={provider.iconUrl}
                                alt={provider.name}
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                  // Fallback to text icon if network blocks image
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                            </div>
                            <div>
                              <h3 className="text-sm font-bold text-white leading-tight">{provider.name}</h3>
                              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                                {provider.category}
                              </span>
                            </div>
                          </div>

                          {/* Requirement Badge */}
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              provider.requiresKey
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            }`}
                          >
                            {provider.requiresKey ? 'Key Required' : 'Public API'}
                          </span>
                        </div>

                        {/* Tagline */}
                        <p className="text-xs text-slate-400 leading-relaxed mb-4">{provider.tagline}</p>

                        {/* Status Badges */}
                        <div className="space-y-2 p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono mb-4">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">Vault Key:</span>
                            {isConfigured ? (
                              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                                <Lock className="w-3 h-3" /> Encrypted ({storedSecret.keyPreview})
                              </span>
                            ) : provider.requiresKey ? (
                              <span className="text-rose-400 font-semibold">Not Configured</span>
                            ) : (
                              <span className="text-sky-400 font-semibold">Free Public</span>
                            )}
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">Routing Status:</span>
                            {isPrimary ? (
                              <span className="text-sky-400 font-bold">⚡ Primary Route</span>
                            ) : isFallback ? (
                              <span className="text-amber-400 font-bold">🛡️ Fallback Route</span>
                            ) : (
                              <span className="text-slate-500">Standby</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Connect / Config Button */}
                      <button
                        onClick={() => {
                          setActiveConfigProvider(provider);
                          setConfigMsg(null);
                          setConfigApiKeyInput('');
                          setProviderTestResult(null);
                        }}
                        className="w-full py-2.5 bg-slate-800 hover:bg-sky-600 text-white font-semibold text-xs rounded-xl shadow cursor-pointer transition-colors flex items-center justify-center gap-2"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        Connect / Config
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Interactive Provider Connect / Config Modal */}
              {activeConfigProvider && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                  <div className="w-full max-w-lg bg-[#111827] border border-slate-800 rounded-2xl p-6 shadow-2xl relative space-y-5">
                    {/* Modal Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 p-2 flex items-center justify-center">
                          <img
                            src={activeConfigProvider.iconUrl}
                            alt=""
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-white">{activeConfigProvider.name}</h3>
                          <p className="text-xs text-slate-400 capitalize">
                            Category: <strong className="text-sky-400">{activeConfigProvider.category}</strong>
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => setActiveConfigProvider(null)}
                        className="p-1 rounded-lg text-slate-400 hover:text-white"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Notification Msg */}
                    {configMsg && (
                      <div
                        className={`p-3 rounded-xl text-xs font-medium ${
                          configMsg.type === 'success'
                            ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                            : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                        }`}
                      >
                        {configMsg.text}
                      </div>
                    )}

                    {/* Step A: API Key Vault */}
                    {activeConfigProvider.requiresKey && (
                      <form onSubmit={handleSaveProviderKey} className="space-y-3">
                        <label className="block text-xs font-semibold text-slate-300">
                          AES-256 Encrypted API Key
                        </label>
                        <div className="relative">
                          <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                          <input
                            type={showConfigApiKey ? 'text' : 'password'}
                            placeholder="sk-•••••••• or 3rd-party API key"
                            value={configApiKeyInput}
                            onChange={(e) => setConfigApiKeyInput(e.target.value)}
                            required
                            className="w-full pl-10 pr-10 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfigApiKey(!showConfigApiKey)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                          >
                            {showConfigApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="submit"
                            disabled={savingConfigKey || !configApiKeyInput.trim()}
                            className="flex-1 py-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs rounded-xl shadow cursor-pointer disabled:opacity-50"
                          >
                            {savingConfigKey ? 'Encrypting...' : 'Save to AES-256 Vault'}
                          </button>

                          {/* If already stored in vault, allow deletion */}
                          {vaultSecrets.some((s) => s.category === activeConfigProvider.category && s.providerId === activeConfigProvider.id) && (
                            <button
                              type="button"
                              onClick={() => {
                                const secret = vaultSecrets.find((s) => s.category === activeConfigProvider.category && s.providerId === activeConfigProvider.id);
                                if (secret) handleDeleteProviderKey(secret._id);
                              }}
                              className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-semibold cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </form>
                    )}

                    {/* Step B: Routing Role Buttons */}
                    <div className="space-y-2 pt-2 border-t border-slate-800">
                      <label className="block text-xs font-semibold text-slate-300">Failover Routing Role</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => handleSetPriorityRouting(activeConfigProvider.category, activeConfigProvider.id, 'primary')}
                          className="py-2 bg-slate-900 hover:bg-sky-500/20 border border-slate-700 hover:border-sky-500 text-slate-200 text-xs font-semibold rounded-xl cursor-pointer transition-colors"
                        >
                          ⚡ Set as Primary Route
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSetPriorityRouting(activeConfigProvider.category, activeConfigProvider.id, 'fallback')}
                          className="py-2 bg-slate-900 hover:bg-amber-500/20 border border-slate-700 hover:border-amber-500 text-slate-200 text-xs font-semibold rounded-xl cursor-pointer transition-colors"
                        >
                          🛡️ Set as Fallback Route
                        </button>
                      </div>
                    </div>

                    {/* Step C: Live Test Runner */}
                    <div className="space-y-2 pt-2 border-t border-slate-800">
                      <button
                        onClick={() => handleTestProviderCall(activeConfigProvider)}
                        disabled={providerTestLoading}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        {providerTestLoading ? 'Executing Live Gateway Query...' : 'Test Provider Live Response'}
                      </button>

                      {providerTestResult && (
                        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2 font-mono">
                          <div className="flex items-center justify-between text-[11px] flex-wrap gap-1">
                            <span className="text-emerald-400 font-bold">Status: {providerTestResult.status}</span>
                            <span className="text-sky-400">Latency: {providerTestResult.latencyMs}ms</span>
                            <span className="text-amber-400">Used: {providerTestResult.provider}</span>
                            {providerTestResult.fallbackTriggered && (
                              <span className="text-purple-400 font-semibold bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-800/50">
                                ⚡ Fallback Active
                              </span>
                            )}
                          </div>

                          {/* Direct Content Response Display */}
                          {providerTestResult.content && (
                            <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs font-sans leading-relaxed">
                              <div className="text-[10px] uppercase font-bold text-emerald-400/80 mb-1 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                Live AI Content Response:
                              </div>
                              {providerTestResult.content}
                            </div>
                          )}

                          <pre className="max-h-36 overflow-y-auto text-[10px] text-slate-300">
                            {JSON.stringify(providerTestResult.data, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW 4: API KEYS (REAL BACKEND API KEYS)                 */}
          {/* ======================================================== */}
          {activeTab === 'keys' && (
            <div className="space-y-6">
              {/* Header & Create API Key Form */}
              <div className="p-6 rounded-2xl bg-[#111827] border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-sky-400" />
                    Developer API Keys ({apiKeys.length})
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Generate and manage API keys to authenticate application servers against OneAPI.
                  </p>
                </div>

                <form onSubmit={handleCreateApiKey} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Key name (e.g. Backend Production)..."
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    required
                    className="px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
                  />
                  <button
                    type="submit"
                    disabled={creatingApiKey}
                    className="px-4 py-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-sky-500/25 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {creatingApiKey ? 'Generating...' : 'Create Key'}
                  </button>
                </form>
              </div>

              {/* Newly Created Key Alert */}
              {freshRawApiKey && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-start justify-between gap-4">
                  <div>
                    <p className="font-bold flex items-center gap-1.5 text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" /> API Key Created! Copy it now (it cannot be shown again):
                    </p>
                    <code className="mt-1.5 block font-mono select-all bg-slate-950 px-3 py-2 rounded-lg border border-emerald-500/20 text-white font-bold break-all">
                      {freshRawApiKey}
                    </code>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Authenticate API calls using the header: <span className="text-sky-300 font-mono">x-api-key</span>.
                    </p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(freshRawApiKey, 'fresh-raw-key')}
                    className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    {copiedId === 'fresh-raw-key' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} Copy
                  </button>
                </div>
              )}

              {/* Existing Keys Table */}
              <div className="p-6 rounded-2xl bg-[#111827] border border-slate-800 shadow-xl">
                {apiKeys.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl">
                    <Key className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-xs text-slate-400">No developer API keys created yet.</p>
                    <p className="text-[11px] text-slate-600 mt-1">Use the form above to generate your first API key.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                          <th className="pb-3">Name</th>
                          <th className="pb-3">Prefix</th>
                          <th className="pb-3">Scopes</th>
                          <th className="pb-3">Status</th>
                          <th className="pb-3">Created</th>
                          <th className="pb-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 font-mono">
                        {apiKeys.map((k) => (
                          <tr key={k._id} className="hover:bg-slate-900/50">
                            <td className="py-3 font-sans font-bold text-white">{k.name}</td>
                            <td className="py-3 text-sky-400">{k.keyPrefix || k.prefix}••••</td>
                            <td className="py-3 text-slate-400">{k.scopes?.join(', ') || 'read, write, proxy'}</td>
                            <td className="py-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  k.isActive !== false ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'
                                }`}
                              >
                                {k.isActive !== false ? 'ACTIVE' : 'INACTIVE'}
                              </span>
                            </td>
                            <td className="py-3 text-slate-500 text-[11px]">
                              {new Date(k.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-3 text-right">
                              <button
                                onClick={() => handleDeleteApiKey(k._id)}
                                className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg cursor-pointer transition-colors"
                                title="Revoke Key"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Server-Side API Key Validation Tester */}
              <div className="p-6 rounded-2xl bg-[#111827] border border-slate-800 shadow-xl space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Test Server-Side Key Validation
                </h3>
                <p className="text-xs text-slate-400">
                  Verify an API key against the real database endpoint <code className="text-sky-300">POST /api/v1/auth/api-keys/validate</code>.
                </p>

                <form onSubmit={handleValidateApiKey} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Paste full API key (e.g. oneapi_...)..."
                    value={keyToValidate}
                    onChange={(e) => setKeyToValidate(e.target.value)}
                    required
                    className="flex-1 px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
                  />
                  <button
                    type="submit"
                    disabled={validatingKey}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow cursor-pointer disabled:opacity-50"
                  >
                    {validatingKey ? 'Validating...' : 'Validate Key'}
                  </button>
                </form>

                {validationResult && (
                  <div
                    className={`p-3 rounded-xl text-xs font-mono ${
                      validationResult.valid || validationResult.success
                        ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                        : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                    }`}
                  >
                    <pre className="text-[10px] overflow-x-auto">{JSON.stringify(validationResult, null, 2)}</pre>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW 5: DOCUMENTATION                                    */}
          {/* ======================================================== */}
          {activeTab === 'docs' && (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-[#111827] border border-slate-800 shadow-xl">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-sky-400" />
                  OneAPI Gateway Developer Reference & Unified SDK
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Interact with unified endpoints and the official <code className="text-sky-400">@oneapi/sdk</code>. The OneAPI Gateway abstracts vendor specifics and automatically fails over if a provider times out or returns 429/5xx errors.
                </p>
              </div>

              {/* Unified SDK Section (PRD Section 2.3 & 3.1) */}
              <div className="p-6 rounded-2xl bg-[#111827] border border-slate-800 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    Official OneAPI Client SDK (<code className="text-emerald-400">@oneapi/sdk</code>)
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                    PRD §3.1 Compliant
                  </span>
                </div>

                <div className="space-y-3">
                  {/* SDK Installation & Init */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <span className="text-xs font-bold text-slate-300">1. Installation & Initialization</span>
                    <pre className="p-3 bg-slate-900 rounded-lg text-[11px] text-slate-300 font-mono overflow-x-auto">
{`// Install official package
npm install @oneapi/sdk

// Initialize OneAPI SDK in your application
import { OneAPI } from '@oneapi/sdk';

const oneapi = new OneAPI({
  apiKey: '${currentProject?.projectTokenPrefix || 'YOUR_PROJECT_TOKEN'}',
  projectId: '${currentProject?.projectId || currentProject?._id || 'YOUR_PROJECT_ID'}'
});`}
                    </pre>
                  </div>

                  {/* SDK Multi-Domain Usage */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <span className="text-xs font-bold text-slate-300">2. Multi-Domain SDK Usage (AI, Weather, Music, News, Air Quality)</span>
                    <pre className="p-3 bg-slate-900 rounded-lg text-[11px] text-slate-300 font-mono overflow-x-auto">
{`// 1. AI Chat Completion (Gemini -> Groq -> OpenRouter Failover)
const chat = await oneapi.ai.chat({
  messages: [{ role: 'user', content: 'Explain quantum computing in two sentences.' }],
  temperature: 0.7
});
console.log(chat.choices[0].message.content);

// 2. AI File Upload (PRD §3.1)
const upload = await oneapi.ai.upload_file({
  file: 'Base64ContentOrBuffer',
  purpose: 'assistants',
  filename: 'specs.pdf'
});
console.log('File ID:', upload.fileId);

// 3. Current Weather (Open-Meteo -> Weatherstack Failover)
const weather = await oneapi.weather.current({ city: 'Tokyo' });

// 4. Music Search (Deezer -> Apple iTunes Failover)
const music = await oneapi.music.search({ query: 'Daft Punk', limit: 5 });

// 5. News Search (HackerNews -> Spaceflight Failover)
const news = await oneapi.news.search({ query: 'artificial intelligence', limit: 5 });

// 6. Air Quality (OpenAQ -> Open-Meteo Atmospheric Failover)
const air = await oneapi.environment.airQuality({ city: 'London' });`}
                    </pre>
                  </div>
                </div>
              </div>

              {/* cURL Endpoints Card */}
              <div className="p-6 rounded-2xl bg-[#111827] border border-slate-800 shadow-xl space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-violet-400" />
                  REST API & cURL Proxy Endpoints
                </h3>

                <div className="space-y-4">
                  {/* AI Chat */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="px-2 py-0.5 rounded bg-violet-500/10 text-violet-400 font-bold">POST</span>
                      <span className="text-slate-300">http://localhost:5000/api/v1/proxy/ai/chat</span>
                    </div>
                    <pre className="p-3 bg-slate-900 rounded-lg text-[11px] text-slate-300 font-mono overflow-x-auto">
{`curl -X POST http://localhost:5000/api/v1/proxy/ai/chat \\
  -H "Content-Type: application/json" \\
  -H "x-project-token: ${currentProject?.projectTokenPrefix || 'YOUR_PROJECT_TOKEN'}" \\
  -d '{"prompt": "Summarize architecture benefits of OneAPI gateway in 2 bullets"}'`}
                    </pre>
                  </div>

                  {/* AI File Upload */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="px-2 py-0.5 rounded bg-violet-500/10 text-violet-400 font-bold">POST</span>
                      <span className="text-slate-300">http://localhost:5000/api/v1/proxy/ai/upload</span>
                    </div>
                    <pre className="p-3 bg-slate-900 rounded-lg text-[11px] text-slate-300 font-mono overflow-x-auto">
{`curl -X POST http://localhost:5000/api/v1/proxy/ai/upload \\
  -H "Content-Type: application/json" \\
  -H "x-project-token: ${currentProject?.projectTokenPrefix || 'YOUR_PROJECT_TOKEN'}" \\
  -d '{"purpose": "assistants", "filename": "whitepaper.pdf", "file": "base64..."}'`}
                    </pre>
                  </div>

                  {/* Weather */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 font-bold">GET</span>
                      <span className="text-slate-300">http://localhost:5000/api/v1/proxy/weather/current?city=Tokyo</span>
                    </div>
                    <pre className="p-3 bg-slate-900 rounded-lg text-[11px] text-slate-300 font-mono overflow-x-auto">
{`curl http://localhost:5000/api/v1/proxy/weather/current?city=Tokyo \\
  -H "x-project-token: ${currentProject?.projectTokenPrefix || 'YOUR_PROJECT_TOKEN'}"`}
                    </pre>
                  </div>

                  {/* Music */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="px-2 py-0.5 rounded bg-pink-500/10 text-pink-400 font-bold">GET</span>
                      <span className="text-slate-300">http://localhost:5000/api/v1/proxy/music/search?q=Daft+Punk</span>
                    </div>
                    <pre className="p-3 bg-slate-900 rounded-lg text-[11px] text-slate-300 font-mono overflow-x-auto">
{`curl http://localhost:5000/api/v1/proxy/music/search?q=Daft+Punk \\
  -H "x-project-token: ${currentProject?.projectTokenPrefix || 'YOUR_PROJECT_TOKEN'}"`}
                    </pre>
                  </div>

                  {/* News */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-bold">GET</span>
                      <span className="text-slate-300">http://localhost:5000/api/v1/proxy/news/search?query=AI</span>
                    </div>
                    <pre className="p-3 bg-slate-900 rounded-lg text-[11px] text-slate-300 font-mono overflow-x-auto">
{`curl "http://localhost:5000/api/v1/proxy/news/search?query=AI" \\
  -H "x-project-token: ${currentProject?.projectTokenPrefix || 'YOUR_PROJECT_TOKEN'}"`}
                    </pre>
                  </div>

                  {/* Environment */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold">GET</span>
                      <span className="text-slate-300">http://localhost:5000/api/v1/proxy/environment/air-quality?city=London</span>
                    </div>
                    <pre className="p-3 bg-slate-900 rounded-lg text-[11px] text-slate-300 font-mono overflow-x-auto">
{`curl "http://localhost:5000/api/v1/proxy/environment/air-quality?city=London" \\
  -H "x-project-token: ${currentProject?.projectTokenPrefix || 'YOUR_PROJECT_TOKEN'}"`}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW 6: PROFILE (ONLY REAL PROFILE DETAILS)              */}
          {/* ======================================================== */}
          {activeTab === 'profile' && (
            <div className="space-y-6 max-w-3xl">
              <div className="p-6 rounded-2xl bg-[#111827] border border-slate-800 shadow-xl">
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-800">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white font-extrabold text-2xl shadow-lg shadow-sky-500/20">
                    {user?.name ? user.name.slice(0, 2).toUpperCase() : 'DV'}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">{user?.name || 'Developer'}</h2>
                    <p className="text-xs text-slate-400">{user?.email || 'dev@example.com'}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-sky-500/10 text-sky-400 border border-sky-500/20">
                        {user?.role || 'user'}
                      </span>
                      {user?.isVerified ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Email Verified
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          Verification Pending
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Profile Fields List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 block mb-1">Developer User ID</span>
                    <span className="font-mono text-white font-semibold">{user?.user_id || user?._id || 'usr_••••'}</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 block mb-1">Email Address</span>
                    <span className="text-white font-semibold">{user?.email || 'N/A'}</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 block mb-1">Phone Number</span>
                    <span className="text-white font-semibold">{user?.phone_no || 'N/A'}</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 block mb-1">Terms & Conditions</span>
                    <span className="text-emerald-400 font-semibold">
                      {user?.terms_accepted ? 'Accepted' : 'Pending'}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 block mb-1">Account Created At</span>
                    <span className="text-white font-semibold">
                      {user?.createdAt ? new Date(user.createdAt).toLocaleString() : 'N/A'}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 block mb-1">Database Sync</span>
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <Database className="w-3.5 h-3.5" /> Live Mongoose Document
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW 7: SETTINGS (PASSWORD CHANGE & LOGOUT)              */}
          {/* ======================================================== */}
          {activeTab === 'settings' && (
            <div className="space-y-6 max-w-2xl">
              {/* Password Change Card */}
              <div className="p-6 rounded-2xl bg-[#111827] border border-slate-800 shadow-xl space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Lock className="w-4 h-4 text-sky-400" />
                  Change Account Password
                </h3>
                <p className="text-xs text-slate-400">
                  Update your security password directly on the backend database.
                </p>

                {passwordChangeMsg && (
                  <div
                    className={`p-3 rounded-xl text-xs font-medium ${
                      passwordChangeMsg.type === 'success'
                        ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                        : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                    }`}
                  >
                    {passwordChangeMsg.text}
                  </div>
                )}

                <form onSubmit={handleChangePassword} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Current Password</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">New Password</label>
                    <input
                      type="password"
                      placeholder="Min. 8 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={8}
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Confirm New Password</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={8}
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={changingPassword}
                    className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs rounded-xl shadow cursor-pointer disabled:opacity-50"
                  >
                    {changingPassword ? 'Updating Password...' : 'Update Password'}
                  </button>
                </form>
              </div>

              {/* Sign Out Card */}
              <div className="p-6 rounded-2xl bg-[#111827] border border-slate-800 shadow-xl flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Sign Out of Session</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Revoke tokens and return to the login screen.</p>
                </div>

                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 font-semibold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
