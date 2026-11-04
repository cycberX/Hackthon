
'use client';

import React, { useState } from 'react';
import {
  BookOpen,
  Terminal,
  Code2,
  Copy,
  Check,
  ChevronRight,
  ExternalLink,
  KeyRound,
  Zap,
  ShieldCheck,
  Cloud,
  Music2,
  Newspaper,
  Wind,
  Bot,
  FileUp,
  Search,
} from 'lucide-react';

const CodeExample = ({ children }: { children: string }) => {
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(children);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="group relative overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--background)]">
      <button
        type="button"
        onClick={copyCode}
        className="absolute right-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] px-2.5 py-1.5 text-xs font-medium text-[var(--muted)] transition hover:text-[var(--foreground)]"
        aria-label="Copy code"
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
        {copied ? 'Copied' : 'Copy'}
      </button>

      <pre className="overflow-x-auto p-5 pr-20 text-[13px] leading-7 text-[var(--foreground)]">
        <code>{children}</code>
      </pre>
    </div>
  );
};

const EndpointCard = ({
  method,
  endpoint,
  children,
  methodColor = 'violet',
  description,
}: {
  method: string;
  endpoint: string;
  children: string;
  methodColor?: string;
  description: string;
}) => {
  const methodStyles: Record<string, string> = {
    violet: 'bg-violet-500/10 text-violet-500 border-violet-500/20',
    sky: 'bg-sky-500/10 text-sky-500 border-sky-500/20',
    pink: 'bg-pink-500/10 text-pink-500 border-pink-500/20',
    amber: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] transition hover:border-[var(--primary)]/40">
      <div className="flex flex-col gap-3 border-b border-[var(--border)] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="mb-1 text-sm font-semibold text-[var(--foreground)]">
            {description}
          </p>
          <code className="break-all text-xs text-[var(--muted)]">
            {endpoint}
          </code>
        </div>

        <span
          className={`w-fit shrink-0 rounded-md border px-2.5 py-1 text-[10px] font-bold tracking-wider ${
            methodStyles[methodColor] || methodStyles.violet
          }`}
        >
          {method}
        </span>
      </div>

      <div className="p-3 sm:p-4">
        <CodeExample>{children}</CodeExample>
      </div>
    </div>
  );
};

const SectionHeading = ({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) => (
  <div className="flex items-start gap-3">
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
      <Icon size={19} />
    </div>
    <div>
      <h2 className="text-lg font-bold tracking-tight text-[var(--foreground)]">
        {title}
      </h2>
      <p className="mt-1 text-sm text-[var(--muted)]">{description}</p>
    </div>
  </div>
);

export default function DocsPage() {
  const [activeTab, setActiveTab] = useState<'sdk' | 'rest'>('sdk');

  const navigation = [
    { id: 'introduction', label: 'Introduction', icon: BookOpen },
    { id: 'installation', label: 'Installation', icon: Terminal },
    { id: 'sdk-usage', label: 'SDK Usage', icon: Code2 },
    { id: 'rest-api', label: 'REST API', icon: Zap },
    { id: 'authentication', label: 'Authentication', icon: KeyRound },
  ];

  return (
    <div className="min-h-full space-y-7 pb-10">
      {/* Page heading */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-[var(--primary)]">
            <BookOpen size={14} />
            DEVELOPER RESOURCES
            <ChevronRight size={13} />
            DOCUMENTATION
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)] sm:text-3xl">
            Developer Documentation
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            Everything you need to integrate your application with the
            OneAPI unified gateway.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 sm:self-auto">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          API Reference
        </div>
      </div>

      {/* Hero */}
      <section
        id="introduction"
        className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow)] sm:p-8"
      >
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-[var(--primary)]/10 blur-3xl" />

        <div className="relative grid gap-7 lg:grid-cols-[1fr_280px] lg:items-center">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--primary)]/20 bg-[var(--primary)]/10 px-3 py-1.5 text-xs font-semibold text-[var(--primary)]">
              <Zap size={13} />
              ONE API. MULTIPLE PROVIDERS.
            </div>

            <h2 className="max-w-xl text-2xl font-bold leading-tight tracking-tight text-[var(--foreground)] sm:text-3xl">
              Build faster with one unified API gateway.
            </h2>

            <p className="mt-4 max-w-xl text-sm leading-7 text-[var(--muted)]">
              Integrate AI, weather, music, news and environment services
              through a consistent interface. OneAPI abstracts provider
              differences and supports automatic failover when configured
              providers encounter errors.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() =>
                  document.getElementById('installation')?.scrollIntoView({
                    behavior: 'smooth',
                  })
                }
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Get started
                <ChevronRight size={16} />
              </button>

              <button
                onClick={() =>
                  document.getElementById('rest-api')?.scrollIntoView({
                    behavior: 'smooth',
                  })
                }
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-secondary)]"
              >
                Explore API
                <Code2 size={15} />
              </button>
            </div>
          </div>

          <div className="hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 lg:block">
            <div className="mb-5 flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--muted)]">
                GATEWAY OVERVIEW
              </span>
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-3 text-center">
              <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
                <Code2 size={18} />
              </div>
              <p className="text-sm font-bold text-[var(--foreground)]">
                Your Application
              </p>
              <p className="mt-1 text-xs text-[var(--muted)]">
                Single API key
              </p>
            </div>

            <div className="flex justify-center py-2">
              <div className="h-6 w-px bg-[var(--border)]" />
            </div>

            <div className="rounded-xl border border-[var(--primary)]/30 bg-[var(--primary)]/5 p-3 text-center">
              <p className="text-sm font-bold text-[var(--primary)]">
                OneAPI Gateway
              </p>
              <p className="mt-1 text-xs text-[var(--muted)]">
                Unified routing
              </p>
            </div>

            <div className="flex justify-center py-2">
              <div className="h-6 w-px bg-[var(--border)]" />
            </div>

            <div className="grid grid-cols-3 gap-2">
              {['AI', 'Weather', 'News'].map((item) => (
                <div
                  key={item}
                  className="rounded-lg border border-[var(--border)] bg-[var(--card)] py-2 text-center text-xs font-semibold text-[var(--muted)]"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Feature cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            icon: ShieldCheck,
            title: 'Unified Authentication',
            text: 'Use one API key across supported services.',
          },
          {
            icon: Zap,
            title: 'Smart Routing',
            text: 'Route requests through configured providers.',
          },
          {
            icon: Cloud,
            title: 'Multiple Services',
            text: 'Access multiple service categories through one gateway.',
          },
          {
            icon: Code2,
            title: 'Developer Friendly',
            text: 'Use SDK examples or standard REST requests.',
          },
        ].map((item) => (
          <div
            key={item.title}
            className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 transition hover:-translate-y-0.5 hover:shadow-[var(--shadow)]"
          >
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
              <item.icon size={18} />
            </div>
            <h3 className="text-sm font-bold text-[var(--foreground)]">
              {item.title}
            </h3>
            <p className="mt-1.5 text-xs leading-5 text-[var(--muted)]">
              {item.text}
            </p>
          </div>
        ))}
      </div>

      {/* Quick navigation */}
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
        <div className="mb-4">
          <h2 className="text-sm font-bold text-[var(--foreground)]">
            On this page
          </h2>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Jump directly to a documentation section.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {navigation.map((item) => (
            <button
              key={item.id}
              onClick={() =>
                document.getElementById(item.id)?.scrollIntoView({
                  behavior: 'smooth',
                })
              }
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-medium text-[var(--muted)] transition hover:border-[var(--primary)]/40 hover:text-[var(--primary)]"
            >
              <item.icon size={14} />
              {item.label}
            </button>
          ))}
        </div>
      </section>

      {/* SDK section */}
      <section
        id="sdk-usage"
        className="scroll-mt-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow)] sm:p-6"
      >
        <SectionHeading
          icon={Terminal}
          title="Official OneAPI SDK"
          description="Integrate OneAPI into your application using the JavaScript client."
        />

        <div className="mt-6 flex flex-wrap gap-2 border-b border-[var(--border)] pb-3">
          <button
            onClick={() => setActiveTab('sdk')}
            className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
              activeTab === 'sdk'
                ? 'bg-[var(--primary)] text-white'
                : 'bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--foreground)]'
            }`}
          >
            JavaScript SDK
          </button>

          <button
            onClick={() => setActiveTab('rest')}
            className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
              activeTab === 'rest'
                ? 'bg-[var(--primary)] text-white'
                : 'bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--foreground)]'
            }`}
          >
            REST API
          </button>
        </div>

        {activeTab === 'sdk' ? (
          <div className="mt-6 space-y-6">
            <div id="installation" className="scroll-mt-6 space-y-3">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--primary)]/10 text-xs font-bold text-[var(--primary)]">
                  1
                </span>
                <h3 className="text-sm font-bold text-[var(--foreground)]">
                  Installation & Initialization
                </h3>
              </div>

              <CodeExample>{`// Install the official package
npm install @oneapi/sdk

// Initialize the OneAPI client
import { OneAPI } from '@oneapi/sdk';

const oneapi = new OneAPI({
  apiKey: process.env.ONEAPI_API_KEY
});`}</CodeExample>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--primary)]/10 text-xs font-bold text-[var(--primary)]">
                  2
                </span>
                <h3 className="text-sm font-bold text-[var(--foreground)]">
                  Multi-Service SDK Usage
                </h3>
              </div>

              <p className="text-sm text-[var(--muted)]">
                Access different service categories through the same client.
              </p>

              <div className="mb-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  { icon: Bot, label: 'AI Chat', color: 'text-violet-500' },
                  { icon: FileUp, label: 'File Upload', color: 'text-sky-500' },
                  { icon: Cloud, label: 'Weather', color: 'text-amber-500' },
                  { icon: Music2, label: 'Music', color: 'text-pink-500' },
                  { icon: Newspaper, label: 'News', color: 'text-emerald-500' },
                  { icon: Wind, label: 'Air Quality', color: 'text-cyan-500' },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3"
                  >
                    <item.icon size={17} className={item.color} />
                    <span className="text-xs font-semibold text-[var(--foreground)]">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>

              <CodeExample>{`// 1. AI Chat Completion
const chat = await oneapi.ai.chat({
  messages: [
    { role: 'user', content: 'Explain quantum computing in two sentences.' }
  ],
  temperature: 0.7
});

console.log(chat.choices[0].message.content);

// 2. AI File Upload
const upload = await oneapi.ai.upload_file({
  file: 'Base64ContentOrBuffer',
  purpose: 'assistants',
  filename: 'specs.pdf'
});

// 3. Current Weather
const weather = await oneapi.weather.current({
  city: 'Tokyo'
});

// 4. Music Search
const music = await oneapi.music.search({
  query: 'Daft Punk',
  limit: 5
});

// 5. News Search
const news = await oneapi.news.search({
  query: 'artificial intelligence',
  limit: 5
});

// 6. Air Quality
const air = await oneapi.environment.airQuality({
  city: 'London'
});`}</CodeExample>
            </div>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            <h3 className="text-sm font-bold text-[var(--foreground)]">
              REST API Authentication
            </h3>
            <CodeExample>{`curl -X POST http://localhost:5000/api/v1/proxy/ai/chat \\
  -H "Authorization: Bearer sk_live_YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"prompt": "Hello from OneAPI"}'`}</CodeExample>
          </div>
        )}
      </section>

      {/* Authentication */}
      <section
        id="authentication"
        className="scroll-mt-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6"
      >
        <SectionHeading
          icon={KeyRound}
          title="Authentication"
          description="Authenticate your requests using your OneAPI secret key."
        />

        <div className="mt-5 rounded-xl border border-[var(--primary)]/20 bg-[var(--primary)]/5 p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck
              size={19}
              className="mt-0.5 shrink-0 text-[var(--primary)]"
            />
            <div>
              <p className="text-sm font-bold text-[var(--foreground)]">
                Keep your API key secure
              </p>
              <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                Store secret keys in environment variables on your server.
                Never expose secret API keys in browser-side code or public
                repositories.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <p className="text-sm font-semibold text-[var(--foreground)]">
            Supported authentication headers
          </p>
          <CodeExample>{`// Option 1: Bearer authentication
Authorization: Bearer sk_live_YOUR_API_KEY

// Option 2: API key header
x-api-key: sk_live_YOUR_API_KEY`}</CodeExample>
        </div>
      </section>

      {/* REST endpoints */}
      <section
        id="rest-api"
        className="scroll-mt-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow)] sm:p-6"
      >
        <SectionHeading
          icon={Code2}
          title="REST API Reference"
          description="Send HTTP requests directly to the OneAPI gateway."
        />

        <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <div className="flex items-start gap-3">
            <Search size={17} className="mt-0.5 shrink-0 text-[var(--muted)]" />
            <p className="text-xs leading-5 text-[var(--muted)]">
              All examples use the local development server at
              <code className="mx-1 rounded bg-[var(--surface-secondary)] px-1.5 py-0.5 text-[var(--foreground)]">
                localhost:5000
              </code>
              . Replace this base URL with your deployed gateway URL when
              using production.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <EndpointCard
            method="POST"
            endpoint="/api/v1/proxy/ai/chat"
            description="AI Chat Completion"
          >
{`curl -X POST http://localhost:5000/api/v1/proxy/ai/chat \\
  -H "Authorization: Bearer sk_live_YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"prompt": "Summarize architecture benefits of OneAPI gateway in 2 bullets"}'`}
          </EndpointCard>

          <EndpointCard
            method="POST"
            endpoint="/api/v1/proxy/ai/upload"
            description="AI File Upload"
          >
{`curl -X POST http://localhost:5000/api/v1/proxy/ai/upload \\
  -H "Authorization: Bearer sk_live_YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"purpose": "assistants", "filename": "whitepaper.pdf", "file": "base64..."}'`}
          </EndpointCard>

          <EndpointCard
            method="GET"
            methodColor="sky"
            endpoint="/api/v1/proxy/weather/current?city=Tokyo"
            description="Current Weather"
          >
{`curl "http://localhost:5000/api/v1/proxy/weather/current?city=Tokyo" \\
  -H "Authorization: Bearer sk_live_YOUR_API_KEY"`}
          </EndpointCard>

          <EndpointCard
            method="GET"
            methodColor="pink"
            endpoint="/api/v1/proxy/music/search?q=Daft+Punk"
            description="Music Search"
          >
{`curl "http://localhost:5000/api/v1/proxy/music/search?q=Daft+Punk" \\
  -H "Authorization: Bearer sk_live_YOUR_API_KEY"`}
          </EndpointCard>

          <EndpointCard
            method="GET"
            methodColor="amber"
            endpoint="/api/v1/proxy/news/search?query=AI"
            description="News Search"
          >
{`curl "http://localhost:5000/api/v1/proxy/news/search?query=AI" \\
  -H "Authorization: Bearer sk_live_YOUR_API_KEY"`}
          </EndpointCard>

          <EndpointCard
            method="GET"
            methodColor="emerald"
            endpoint="/api/v1/proxy/environment/air-quality?city=London"
            description="Air Quality"
          >
{`curl "http://localhost:5000/api/v1/proxy/environment/air-quality?city=London" \\
  -H "Authorization: Bearer sk_live_YOUR_API_KEY"`}
          </EndpointCard>
        </div>
      </section>

      {/* Footer */}
      <div className="flex flex-col gap-2 border-t border-[var(--border)] pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-[var(--muted)]">
          OneAPI Developer Documentation
        </p>
        <p className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
          Built for developers
          <ExternalLink size={12} />
        </p>
      </div>
    </div>
  );
}
