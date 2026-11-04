"use client"
import { useEffect, useRef, useState, type ReactNode } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  ArrowRight,
  Boxes,
  Check,
  ChevronRight,
  CircleAlert,
  Code2,
  Copy,
  Database,
  Eye,
  FileCode2,
  GitBranch,
  KeyRound,
  LayoutDashboard,
  LockKeyhole,
  Menu,
  Moon,
  Network,
  Play,
  Route,
  ServerCog,
  ShieldCheck,
  Sun,
  Terminal,
  Waypoints,
  X,
  Zap,
} from "lucide-react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import "./main.css"

gsap.registerPlugin(useGSAP, ScrollTrigger)

type Theme = "light" | "dark"

const navItems = [
  ["Features", "#features"],
  ["How It Works", "#how-it-works"],
  ["Integrations", "#integrations"],
  ["Architecture", "#architecture"],
  ["Documentation", "#developers"],
] as const

const capabilityItems = [
  [Network, "Universal API Gateway"],
  [Route, "Intelligent Routing"],
  [ShieldCheck, "Automatic Failover"],
  [LockKeyhole, "Secure Authentication"],
  [Eye, "Centralized Monitoring"],
] as const

const features = [
  {
    icon: Network,
    title: "Universal API Gateway",
    text: "Connect different providers through one unified gateway interface.",
    number: "01",
  },
  {
    icon: GitBranch,
    title: "Smart API Routing",
    text: "Route requests intelligently based on your configured provider rules.",
    number: "02",
  },
  {
    icon: ShieldCheck,
    title: "Automatic Failover",
    text: "Switch to configured fallback providers when the primary provider fails.",
    number: "03",
  },
  {
    icon: LockKeyhole,
    title: "Secure API Management",
    text: "Manage API credentials securely from a centralized environment.",
    number: "04",
  },
  {
    icon: LayoutDashboard,
    title: "Developer Dashboard",
    text: "Manage projects, API keys, providers, and gateway activity from one place.",
    number: "05",
  },
  {
    icon: Code2,
    title: "API Playground",
    text: "Explore and test API integrations through a developer-friendly interface.",
    number: "06",
  },
] as const

const steps = [
  [Boxes, "Create Your Project", "Create a project in the OneAPI dashboard."],
  [
    ServerCog,
    "Configure Providers",
    "Connect and configure supported API providers.",
  ],
  [
    KeyRound,
    "Generate API Credentials",
    "Create API keys and configure access permissions.",
  ],
  [
    Play,
    "Send Requests Through OneAPI",
    "Use the unified gateway to send requests and receive responses.",
  ],
] as const

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link className="brand" href="/" aria-label="OneAPI home">
      <span className="brand-mark overflow-hidden rounded-lg flex items-center justify-center p-0.5 shadow-sm">
        <Image
          src="/logo.png"
          alt="OneAPI Logo"
          width={compact ? 22 : 28}
          height={compact ? 22 : 28}
          className="w-full h-full object-contain"
          priority
        />
      </span>
      <span>OneAPI</span>
    </Link>
  )
}

function Navbar({
  theme,
  toggleTheme,
}: {
  theme: Theme
  toggleTheme: () => void
}) {
  const [open, setOpen] = useState(false)
  const navRef = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const reduce = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches
      if (reduce) return
      const timeline = gsap.timeline({ defaults: { ease: "power3.out" } })
      timeline
        .from(".nav-shell", { y: -24, opacity: 0, duration: 0.65 })
        .from(".brand", { scale: 0.86, opacity: 0, duration: 0.45 }, "-=.3")
        .from(
          ".desktop-nav a",
          { y: -8, opacity: 0, stagger: 0.06, duration: 0.35 },
          "-=.3",
        )
        .from(
          ".nav-actions > *",
          { x: 10, opacity: 0, stagger: 0.06, duration: 0.35 },
          "-=.3",
        )

      ScrollTrigger.create({
        start: 32,
        onUpdate: (self) =>
          navRef.current?.classList.toggle("is-scrolled", self.scroll() > 32),
      })
    },
    { scope: navRef },
  )

  return (
    <header className="navbar" ref={navRef}>
      <div className="nav-shell">
        <Brand compact />
        <nav className="desktop-nav" aria-label="Main navigation">
          {navItems.map(([label, href]) => (
            <a key={label} href={href}>
              {label}
            </a>
          ))}
        </nav>
        <div className="nav-actions">
          <button
            className="icon-button"
            onClick={toggleTheme}
            aria-label={`Switch to ${
              theme === "dark" ? "light" : "dark"
            } theme`}
          >
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <Link className="text-link desktop-only" href="/login">
            Login
          </Link>
          <Link className="button button-small desktop-only" href="/signup">
            Get Started <ArrowRight size={14} />
          </Link>
          <button
            className="icon-button mobile-menu-button"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-label="Toggle navigation"
          >
            {open ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>
        {open && (
          <div className="mobile-menu">
            {navItems.map(([label, href]) => (
              <a key={label} href={href} onClick={() => setOpen(false)}>
                {label}
                <ChevronRight size={16} />
              </a>
            ))}
            <Link
              className="text-link py-2 flex items-center justify-between"
              href="/login"
              onClick={() => setOpen(false)}
            >
              Login <ChevronRight size={16} />
            </Link>
            <Link
              className="button mt-2"
              href="/signup"
              onClick={() => setOpen(false)}
            >
              Get Started <ArrowRight size={15} />
            </Link>
          </div>
        )}
      </div>
    </header>
  )
}

function GatewayVisualization() {
  return (
    <div
      className="gateway-visual"
      aria-label="Diagram showing OneAPI routing requests between multiple providers"
    >
      <div className="visual-toolbar">
        <span>
          <i className="status-dot" /> Gateway online
        </span>
        <span className="mono">REGION / GLOBAL</span>
      </div>
      <svg
        className="gateway-lines"
        viewBox="0 0 620 510"
        role="img"
        aria-hidden="true"
      >
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path
          className="route-line route-draw"
          d="M310 252 C310 170 205 155 128 115"
        />
        <path
          className="route-line route-draw"
          d="M310 252 C390 240 450 174 493 115"
        />
        <path
          className="route-line route-draw"
          d="M310 252 C225 260 180 338 128 397"
        />
        <path
          className="route-line route-draw fallback"
          d="M310 252 C360 318 425 354 493 397"
        />
        <circle className="packet packet-a" cx="0" cy="0" r="4" />
        <circle className="packet packet-b" cx="0" cy="0" r="4" />
      </svg>
      <div className="provider-node node-a">
        <span className="provider-icon">A</span>
        <div>
          <b>Provider A</b>
          <small>Primary · 42ms</small>
        </div>
        <i className="health" />
      </div>
      <div className="provider-node node-b">
        <span className="provider-icon">B</span>
        <div>
          <b>Provider B</b>
          <small>Active · 68ms</small>
        </div>
        <i className="health" />
      </div>
      <div className="provider-node node-c">
        <span className="provider-icon">C</span>
        <div>
          <b>Provider C</b>
          <small>Standby</small>
        </div>
        <i className="health standby" />
      </div>
      <div className="provider-node node-d">
        <span className="provider-icon">D</span>
        <div>
          <b>Provider D</b>
          <small>Fallback</small>
        </div>
        <i className="health" />
      </div>
      <div className="gateway-node">
        <span className="gateway-rings" />
        <span className="brand-mark overflow-hidden rounded-lg flex items-center justify-center p-1 shadow-md">
          <Image
            src="/logo.png"
            alt="OneAPI Gateway"
            width={32}
            height={32}
            className="w-full h-full object-contain"
          />
        </span>
        <b>OneAPI</b>
        <small>SMART GATEWAY</small>
      </div>
      <div className="route-card mono">
        <span>POST</span>
        <code>/v1/execute</code>
        <i>200 OK</i>
      </div>
    </div>
  )
}

function Hero() {
  const ref = useRef<HTMLElement>(null)
  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const tl = gsap.timeline({ defaults: { ease: "power3.out" } })
        tl.from(".hero-grid", { opacity: 0, duration: 0.8 })
          .from(".hero-glow", { scale: 0.5, opacity: 0, duration: 1.1 }, "<")
          .from(".hero-badge", { y: 16, opacity: 0, duration: 0.5 }, "-=.55")
          .from(
            ".hero-title .line",
            { yPercent: 105, stagger: 0.12, duration: 0.8, ease: "expo.out" },
            "-=.25",
          )
          .from(".hero-copy", { y: 18, opacity: 0, duration: 0.55 }, "-=.4")
          .from(
            ".hero-actions > *",
            { y: 12, opacity: 0, stagger: 0.1, duration: 0.45 },
            "-=.3",
          )
          .from(
            ".hero-points li",
            { y: 8, opacity: 0, stagger: 0.08, duration: 0.35 },
            "-=.25",
          )
          .from(".gateway-visual", { x: 35, opacity: 0, duration: 0.8 }, "-=.7")
          .from(
            ".gateway-node",
            { scale: 0.65, opacity: 0, duration: 0.65, ease: "back.out(1.4)" },
            "-=.35",
          )
          .from(
            ".provider-node",
            { scale: 0.8, opacity: 0, stagger: 0.09, duration: 0.4 },
            "-=.3",
          )
          .from(
            ".route-draw",
            {
              strokeDashoffset: 600,
              stagger: 0.08,
              duration: 0.8,
              ease: "power2.inOut",
            },
            "-=.4",
          )

        gsap.to(".packet-a", {
          x: 180,
          y: 105,
          duration: 1.6,
          repeat: -1,
          yoyo: true,
          ease: "power2.inOut",
        })
        gsap.to(".packet-b", {
          x: -180,
          y: -142,
          duration: 1.9,
          repeat: -1,
          yoyo: true,
          ease: "power2.inOut",
          delay: 0.4,
        })
        gsap.to(".gateway-rings", {
          scale: 1.3,
          opacity: 0,
          duration: 1.8,
          repeat: -1,
          ease: "power2.out",
        })
      })
      return () => mm.revert()
    },
    { scope: ref },
  )

  return (
    <section className="hero section" id="top" ref={ref}>
      <div className="hero-grid" />
      <div className="hero-glow" />
      <div className="container hero-layout">
        <div className="hero-content">
          <div className="eyebrow hero-badge">
            <span /> ONE GATEWAY. EVERY API.
          </div>
          <h1 className="hero-title">
            <span className="title-clip">
              <span className="line">One API.</span>
            </span>
            <span className="title-clip">
              <span className="line accent-text">Infinite Possibilities.</span>
            </span>
          </h1>
          <p className="hero-copy">
            Unify multiple API providers through one intelligent gateway.
            Simplify integrations, optimize routing, and build resilient
            applications without managing multiple API connections.
          </p>
          <div className="hero-actions">
            <Link className="button" href="/signup">
              Get Started Free <ArrowRight size={16} />
            </Link>
            <Link className="button button-secondary" href="/dashboard/docs">
              <FileCode2 size={16} /> Explore Documentation
            </Link>
          </div>
          <ul className="hero-points">
            {["Unified API Access", "Smart Routing", "Automatic Failover"].map(
              (item) => (
                <li key={item}>
                  <Check size={13} /> {item}
                </li>
              ),
            )}
          </ul>
        </div>
        <GatewayVisualization />
      </div>
    </section>
  )
}

function SectionHeading({
  eyebrow,
  title,
  description,
  centered = false,
}: {
  eyebrow: string
  title: string
  description: string
  centered?: boolean
}) {
  return (
    <header className={`section-heading reveal ${centered ? "centered" : ""}`}>
      <span className="eyebrow">
        <span /> {eyebrow}
      </span>
      <h2>{title}</h2>
      <p>{description}</p>
    </header>
  )
}

function RevealSection({
  children,
  className = "",
  id,
}: {
  children: ReactNode
  className?: string
  id?: string
}) {
  const ref = useRef<HTMLElement>(null)
  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(".reveal", {
          y: 34,
          opacity: 0,
          duration: 0.75,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ref.current,
            start: "top 78%",
            toggleActions: "play none none reverse",
          },
        })
      })
      return () => mm.revert()
    },
    { scope: ref },
  )
  return (
    <section className={`section ${className}`} id={id} ref={ref}>
      {children}
    </section>
  )
}

function CapabilityStrip() {
  return (
    <RevealSection className="capability-section" id="integrations">
      <div className="container capability-strip">
        {capabilityItems.map(([Icon, label]) => (
          <div className="capability reveal" key={label}>
            <Icon size={18} />
            <span>{label}</span>
          </div>
        ))}
      </div>
    </RevealSection>
  )
}

function ProblemSolution() {
  const traditional = [
    "Separate API integrations",
    "Different authentication mechanisms",
    "Provider-specific configurations",
    "Manual fallback management",
    "Scattered monitoring and logs",
  ]
  const unified = [
    "Unified API access",
    "Centralized configuration",
    "Smart routing",
    "Configured automatic failover",
    "Centralized request visibility",
  ]
  return (
    <RevealSection className="problem-section">
      <div className="container">
        <SectionHeading
          eyebrow="THE BETTER WAY"
          title="Stop Managing APIs Separately."
          description="Multiple providers shouldn't mean multiple integration headaches."
          centered
        />
        <div className="comparison">
          <article className="comparison-card traditional reveal">
            <div className="card-kicker">
              <CircleAlert size={17} /> TRADITIONAL INTEGRATION
            </div>
            <h3>Fragmented by default.</h3>
            <p>
              Every added provider introduces a new layer of operational
              overhead.
            </p>
            <ul>
              {traditional.map((item) => (
                <li key={item}>
                  <X size={14} />
                  {item}
                </li>
              ))}
            </ul>
          </article>
          <div className="comparison-transfer reveal">
            <ArrowRight size={18} />
            <span>UNIFY</span>
          </div>
          <article className="comparison-card unified reveal">
            <div className="card-kicker accent-text flex items-center gap-1.5">
              <span className="w-5 h-5 rounded overflow-hidden inline-flex items-center justify-center shrink-0">
                <Image src="/logo.png" alt="OneAPI" width={20} height={20} className="w-full h-full object-contain" />
              </span>
              ONEAPI GATEWAY
            </div>
            <h3>One control plane.</h3>
            <p>
              Bring providers, credentials, and routing logic into one coherent
              system.
            </p>
            <ul>
              {unified.map((item) => (
                <li key={item}>
                  <Check size={14} />
                  {item}
                </li>
              ))}
            </ul>
          </article>
        </div>
      </div>
    </RevealSection>
  )
}

function Features() {
  return (
    <RevealSection className="features-section" id="features">
      <div className="container">
        <SectionHeading
          eyebrow="CAPABILITIES"
          title="Everything You Need to Manage APIs."
          description="Powerful infrastructure capabilities designed to simplify your development workflow."
        />
        <div className="feature-grid">
          {features.map(({ icon: Icon, title, text, number }) => (
            <article className="feature-card reveal" key={title}>
              <div className="feature-card-top">
                <span className="feature-icon">
                  <Icon size={20} />
                </span>
                <span className="mono feature-number">/{number}</span>
              </div>
              <h3>{title}</h3>
              <p>{text}</p>
              <span className="feature-link">
                Explore capability <ArrowRight size={14} />
              </span>
            </article>
          ))}
        </div>
      </div>
    </RevealSection>
  )
}

function HowItWorks() {
  const ref = useRef<HTMLElement>(null)
  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: ".steps",
            start: "top 72%",
            end: "bottom 55%",
            scrub: 0.7,
          },
        })
        tl.fromTo(".timeline-progress", { scaleX: 0 }, {
          scaleX: 1,
          ease: "none",
        })
          .from(
            ".step",
            { opacity: 0.25, y: 18, stagger: 0.25, duration: 0.6 },
            "<",
          )
          .from(
            ".step-icon",
            {
              scale: 0.6,
              rotate: -8,
              stagger: 0.25,
              duration: 0.5,
              ease: "back.out(1.4)",
            },
            "<",
          )
      })
      return () => mm.revert()
    },
    { scope: ref },
  )
  return (
    <section className="section how-section" id="how-it-works" ref={ref}>
      <div className="container">
        <SectionHeading
          eyebrow="WORKFLOW"
          title="From Integration to Execution in Four Steps."
          description="A clear path from setup to your first unified request."
          centered
        />
        <div className="steps">
          <div className="timeline-line">
            <span className="timeline-progress" />
          </div>
          {steps.map(([Icon, title, text], index) => (
            <article className="step" key={title}>
              <span className="step-number mono">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="step-icon">
                <Icon size={20} />
              </span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function ArchitectureDiagram() {
  return (
    <div className="architecture-diagram reveal">
      <svg
        className="architecture-paths"
        viewBox="0 0 1000 610"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          className="arch-line primary-path"
          d="M500 75 V145 M500 215 V275 M500 345 V400 M500 400 H205 V468 M500 400 V468 M500 400 H795 V468"
        />
        <path
          className="arch-line fallback-path"
          d="M205 510 C300 560 700 560 795 510"
        />
        <path
          className="arch-line response-path"
          d="M795 515 C760 590 570 570 500 560"
        />
      </svg>
      <div className="arch-node application">
        <Terminal size={18} />
        <span>
          <small>REQUEST ORIGIN</small>Your Application
        </span>
      </div>
      <div className="arch-node gateway">
        <span className="w-6 h-6 rounded overflow-hidden inline-flex items-center justify-center shrink-0">
          <Image src="/logo.png" alt="OneAPI Gateway" width={24} height={24} className="w-full h-full object-contain" />
        </span>
        <span>
          <small>UNIFIED ENTRY</small>OneAPI Gateway
        </span>
      </div>
      <div className="arch-node auth">
        <LockKeyhole size={18} />
        <span>
          <small>POLICY LAYER</small>Authentication & Validation
        </span>
      </div>
      <div className="arch-node router">
        <Waypoints size={18} />
        <span>
          <small>ORCHESTRATION</small>Smart Routing Engine
        </span>
      </div>
      {["Provider A", "Provider B", "Provider C"].map((label, index) => (
        <div className={`arch-node provider provider-${index + 1}`} key={label}>
          <Database size={17} />
          <span>
            <small>{index === 1 ? "SELECTED" : "AVAILABLE"}</small>
            {label}
          </span>
        </div>
      ))}
      <div className="arch-node response">
        <Check size={18} />
        <span>
          <small>NORMALIZED</small>Unified Response
        </span>
      </div>
      <span className="request-pulse pulse-1" />
      <span className="request-pulse pulse-2" />
      <div className="diagram-legend mono">
        <span>
          <i className="solid" /> PRIMARY
        </span>
        <span>
          <i className="dashed" /> FALLBACK
        </span>
        <span>
          <i className="return" /> RESPONSE
        </span>
      </div>
    </div>
  )
}

function Architecture() {
  const ref = useRef<HTMLElement>(null)
  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: ".architecture-diagram",
            start: "top 70%",
            toggleActions: "play none none reverse",
          },
        })
        tl.from(".arch-node", {
          opacity: 0,
          scale: 0.88,
          stagger: 0.08,
          duration: 0.45,
          ease: "back.out(1.4)",
        }).from(
          ".arch-line",
          {
            strokeDashoffset: 1500,
            stagger: 0.12,
            duration: 1.1,
            ease: "power2.inOut",
          },
          "-=.45",
        )
        gsap.to(".pulse-1", {
          y: 350,
          duration: 2.2,
          repeat: -1,
          ease: "power2.inOut",
        })
        gsap.to(".pulse-2", {
          x: 290,
          y: 425,
          duration: 2.8,
          repeat: -1,
          yoyo: true,
          ease: "power2.inOut",
          delay: 0.7,
        })
      })
      return () => mm.revert()
    },
    { scope: ref },
  )
  return (
    <section
      className="section architecture-section"
      id="architecture"
      ref={ref}
    >
      <div className="container">
        <SectionHeading
          eyebrow="ARCHITECTURE"
          title="One Gateway. Multiple Providers. Unified Execution."
          description="Every request passes through centralized infrastructure designed to simplify API execution."
          centered
        />
        <ArchitectureDiagram />
      </div>
    </section>
  )
}

const codeLines = [
  ["import { ", "OneAPI", " } from ", '"@oneapi/sdk"', ";"],
  [""],
  ["// Initialize client with your OneAPI key"],
  ["const ", "oneapi", " = new ", "OneAPI", "({"],
  ['  apiKey: process.env.', "ONEAPI_API_KEY", ", ", "// 'sk_live_...'"],
  ["});"],
  [""],
  ["// Automated multi-provider failover (Gemini -> Groq -> OpenRouter)"],
  ["const ", "response", " = await ", "oneapi.ai.chat", "({"],
  ["  messages: ["],
  ['    { role: ', '"user"', ', content: ', '"Hello from OneAPI!"', " }"],
  ["  ],"],
  ['  model: ', '"default"', ","],
  ["});"],
  [""],
  ["console", ".log(", "response", ".choices[0].message.content);"],
]

function CodeEditor() {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    await navigator.clipboard.writeText(
      codeLines.map((line) => line.join("")).join("\n"),
    )
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }
  return (
    <div className="code-editor reveal">
      <div className="editor-topbar">
        <div className="window-dots">
          <i />
          <i />
          <i />
        </div>
        <span className="editor-file">
          <FileCode2 size={13} /> example.ts
        </span>
        <button onClick={copy} aria-label="Copy SDK code">
          {copied ? <Check size={14} /> : <Copy size={14} />}{" "}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <div className="editor-body mono">
        {codeLines.map((line, i) => (
          <div className="code-line" key={i}>
            <span className="line-no">{String(i + 1).padStart(2, "0")}</span>
            <code>
              {line.map((part, j) => (
                <span
                  className={
                    part.startsWith("//") || part.includes("//")
                      ? "code-comment text-[#777] italic"
                      : part.includes('"')
                        ? "code-string text-[#e6a06b]"
                        : ["import ", "from ", "const ", "new ", "await "].some((k) =>
                            part.includes(k),
                          )
                          ? "code-keyword text-[#c98cff]"
                          : ""
                  }
                  key={j}
                >
                  {part}
                </span>
              ))}
            </code>
          </div>
        ))}
      </div>
      <div className="editor-status mono">
        <span>
          <i className="status-dot" /> OFFICIAL ONEAPI SDK
        </span>
        <span>TYPESCRIPT / NODE.JS</span>
      </div>
    </div>
  )
}

function DeveloperExperience() {
  const items = [
    "Simple integration workflow",
    "Centralized API access",
    "Developer-friendly configuration",
    "Easy project management",
  ]
  return (
    <RevealSection className="developer-section" id="developers">
      <div className="container split-layout">
        <div>
          <SectionHeading
            eyebrow="DEVELOPER EXPERIENCE"
            title="Built for Developers. Designed for Simplicity."
            description="Keep your integration workflow simple and your infrastructure centralized."
          />
          <ul className="developer-list">
            {items.map((item, index) => (
              <li className="reveal" key={item}>
                <span className="mono">0{index + 1}</span>
                <div>
                  <Check size={15} />
                  <b>{item}</b>
                </div>
              </li>
            ))}
          </ul>
          <p className="code-disclaimer reveal">
            Install with <code className="text-[var(--primary)] font-semibold font-mono">npm install @oneapi/sdk</code>. Automatic failover intelligently cascades across Gemini, Groq, and OpenRouter without rewriting client code.
          </p>
        </div>
        <CodeEditor />
      </div>
    </RevealSection>
  )
}

function Security() {
  const items = [
    [
      KeyRound,
      "Centralized API Credentials",
      "Keep provider access in one managed environment.",
    ],
    [
      ShieldCheck,
      "Secure Authentication",
      "Control how applications connect to your gateway.",
    ],
    [
      Boxes,
      "Project-Level Management",
      "Organize access by project and configuration.",
    ],
    [Eye, "Request Visibility", "Understand gateway activity from one place."],
  ] as const
  return (
    <RevealSection className="security-section">
      <div className="container">
        <SectionHeading
          eyebrow="CONTROL"
          title="Your API Infrastructure. Under Your Control."
          description="Manage API access and credentials through a centralized platform."
          centered
        />
        <div className="security-layout">
          <div className="security-orbit reveal">
            <span className="orbit orbit-1" />
            <span className="orbit orbit-2" />
            <div className="security-core">
              <LockKeyhole size={32} />
              <b>Protected access</b>
              <small className="mono">POLICY / CREDENTIALS / KEYS</small>
            </div>
            <span className="orbit-point point-a">
              <KeyRound size={14} />
            </span>
            <span className="orbit-point point-b">
              <ShieldCheck size={14} />
            </span>
            <span className="orbit-point point-c">
              <Eye size={14} />
            </span>
          </div>
          <div className="security-items">
            {items.map(([Icon, title, text]) => (
              <article className="security-item reveal" key={title}>
                <span>
                  <Icon size={18} />
                </span>
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </RevealSection>
  )
}

function FinalCTA() {
  return (
    <RevealSection className="final-section" id="final-cta">
      <div className="container">
        <div className="final-card reveal">
          <div className="final-grid" />
          <div className="final-glow" />
          <span className="eyebrow">
            <span /> START BUILDING
          </span>
          <h2>
            Ready to Simplify
            <br />
            <span className="accent-text">Your API Infrastructure?</span>
          </h2>
          <p>
            Bring your API integrations together and build with a unified
            gateway.
          </p>
          <div className="final-actions">
            <Link
              className="button"
              href="/signup"
            >
              Get Started Free <ArrowRight size={16} />
            </Link>
            <Link className="button button-secondary" href="/login">
              Sign In to OneAPI <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </RevealSection>
  )
}

function Footer() {
  const groups: Array<[string, string[]]> = [
    ["Product", ["Features", "Architecture", "Integrations", "Documentation"]],
    ["Developers", ["Documentation", "API Playground", "Dashboard"]],
    ["Account", ["Login", "Register"]],
  ]
  const hrefFor = (item: string) =>
    item === "Features"
      ? "#features"
      : item === "Architecture"
        ? "#architecture"
        : item === "Integrations"
          ? "#integrations"
          : item === "Documentation"
            ? "/dashboard/docs"
            : item === "API Playground"
              ? "/dashboard"
              : item === "Dashboard"
                ? "/dashboard"
                : item === "Login"
                  ? "/login"
                  : item === "Register"
                    ? "/signup"
                    : "#top"
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <Brand />
          <p>
            One unified gateway for simplified API integration, intelligent
            routing, and reliable infrastructure.
          </p>
        </div>
        {groups.map(([title, items]) => (
          <div className="footer-links" key={title}>
            <h3>{title}</h3>
            {items.map((item) => {
              const href = hrefFor(item);
              const isRoute = href.startsWith('/');
              return isRoute ? (
                <Link href={href} key={item}>
                  {item}
                </Link>
              ) : (
                <a href={href} key={item}>
                  {item}
                </a>
              );
            })}
          </div>
        ))}
      </div>
      <div className="container footer-bottom">
        <span>© 2026 OneAPI. All rights reserved.</span>
        <span className="mono">
          <i className="status-dot" /> SYSTEMS OPERATIONAL
        </span>
      </div>
    </footer>
  )
}

export default function App() {
  const [theme, setTheme] = useState<Theme>(
    () => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('oneapi-theme') as Theme) || 'dark';
    }
    return 'dark';
  },
  )

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark")
    document.documentElement.dataset.theme = theme
    localStorage.setItem("oneapi-theme", theme)
    requestAnimationFrame(() => ScrollTrigger.refresh())
  }, [theme])

  return (
    <>
      <Navbar
        theme={theme}
        toggleTheme={() => setTheme(theme === "dark" ? "light" : "dark")}
      />
      <main>
        <Hero />
        <CapabilityStrip />
        <ProblemSolution />
        <Features />
        <HowItWorks />
        <Architecture />
        <DeveloperExperience />
        <Security />
        <FinalCTA />
      </main>
      <Footer />
    </>
  )
}
