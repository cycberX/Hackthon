
'use client';

import React, { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Cpu,
  FolderGit2,
  KeyRound,
  LayoutDashboard,
  Layers,
  Loader2,
  LogOut,
  Menu,
  Moon,
  Plus,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Sun,
  UserCircle,
  X,
} from 'lucide-react';

import { useTheme } from 'next-themes';
import ThemeToggle from '../components/ThemeToggle';
import { authStorage, fetchApi } from '@/lib/api';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Overview',
    icon: <LayoutDashboard size={18} />,
  },
  {
    href: '/dashboard/providers',
    label: 'API Providers',
    icon: <Cpu size={18} />,
  },
  {
    href: '/dashboard/routing',
    label: 'Routing & Failover',
    icon: <SlidersHorizontal size={18} />,
  },
  {
    href: '/dashboard/keys',
    label: 'API Keys',
    icon: <KeyRound size={18} />,
  },
  {
    href: '/dashboard/settings',
    label: 'Settings',
    icon: <Settings size={18} />,
  },
];

function DashboardLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { theme, setTheme, resolvedTheme } = useTheme();

  const [mounted, setMounted] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [user, setUser] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [activeProject, setActiveProject] = useState<any>(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [isCreatingProject, setIsCreatingProject] = useState(false);

  const createInputRef = useRef<HTMLInputElement>(null);

  const isWorkspaceLevel =
    pathname === '/dashboard/projects' ||
    pathname === '/dashboard/profile';

  const getProjectId = (project: any) =>
    project?._id || project?.id || null;

  const loadProjectsList = async () => {
    try {
      const res = await fetchApi('/api/v1/projects');

      if (!res.success || !Array.isArray(res.data?.projects)) {
        return;
      }

      const projectList = res.data.projects;
      setProjects(projectList);

      const paramProjectId =
        searchParams.get('project') ||
        searchParams.get('projectId');

      const storedActive = authStorage.getActiveProject();
      const targetId =
        paramProjectId || getProjectId(storedActive);

      if (targetId) {
        const match = projectList.find(
          (project: any) => getProjectId(project) === targetId,
        );

        if (match) {
          setActiveProject(match);
          authStorage.setActiveProject(match);
          return;
        }
      }

      if (!targetId && !isWorkspaceLevel) {
        router.push('/dashboard/projects');
      }
    } catch (error) {
      console.error('Failed to load projects list:', error);
    }
  };

  useEffect(() => {
    setMounted(true);

    const token = authStorage.getToken();

    if (!token) {
      router.push('/login');
      return;
    }

    const cachedUser = authStorage.getUser();

    if (cachedUser) {
      setUser(cachedUser);
    }

    const cachedProject = authStorage.getActiveProject();

    if (cachedProject) {
      setActiveProject(cachedProject);
    }

    fetchApi('/api/v1/auth/me')
      .then((res) => {
        if (res.success && res.data?.user) {
          setUser(res.data.user);
          authStorage.setUser(res.data.user);
        }
      })
      .catch((error) => {
        console.error('Failed to load user profile:', error);
      });

    loadProjectsList();

    const handleProjectChanged = (event: Event) => {
      const customEvent = event as CustomEvent;
      const project = customEvent.detail;

      if (project) {
        setActiveProject(project);
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      if (!target.closest('[data-create-modal]')) {
        // Modal is intentionally not closed by outside clicks.
      }
    };

    window.addEventListener(
      'oneapi_project_changed',
      handleProjectChanged,
    );

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener(
        'oneapi_project_changed',
        handleProjectChanged,
      );

      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [router, pathname, searchParams]);

  const handleSelectProject = (project: any) => {
    const projectId = getProjectId(project);

    if (!projectId) {
      alert('Unable to select this project. Project ID is missing.');
      return;
    }

    authStorage.setActiveProject(project);
    setActiveProject(project);

    window.dispatchEvent(
      new CustomEvent('oneapi_project_changed', {
        detail: project,
      }),
    );

    router.push(`/dashboard?project=${projectId}`);
  };

  const handleQuickCreateProject = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    const projectName = newProjectName.trim();

    if (!projectName || isCreatingProject) {
      return;
    }

    setIsCreatingProject(true);

    try {
      const res = await fetchApi('/api/v1/projects', {
        method: 'POST',
        body: JSON.stringify({
          name: projectName,
        }),
      });

      if (res.success && res.data?.project) {
        const createdProject = res.data.project;

        setProjects((previous) => [
          createdProject,
          ...previous,
        ]);

        setIsCreateModalOpen(false);
        setNewProjectName('');

        handleSelectProject(createdProject);
      } else {
        alert(
          res.error?.message || 'Failed to create project',
        );
      }
    } catch (error: any) {
      alert(error.message || 'Error creating project');
    } finally {
      setIsCreatingProject(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetchApi('/api/v1/auth/logout', {
        method: 'POST',
      });
    } catch {
      // Continue with local logout if the API is unavailable.
    }

    authStorage.clear();
    router.push('/login');
  };

  const closeCreateModal = () => {
    if (isCreatingProject) return;

    setIsCreateModalOpen(false);
    setNewProjectName('');
  };

  useEffect(() => {
    if (isCreateModalOpen) {
      createInputRef.current?.focus();
    }
  }, [isCreateModalOpen]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#080b12] flex items-center justify-center text-slate-400">
        <div className="flex flex-col items-center gap-4">
          <div className="w-11 h-11 rounded-xl overflow-hidden flex items-center justify-center shadow-lg shadow-[var(--primary)]/20 animate-pulse">
            <Image
              src="/logo.png"
              alt="OneAPI Logo"
              width={44}
              height={44}
              className="w-full h-full object-contain"
              priority
            />
          </div>

          <p className="text-sm font-medium">
            Initializing OneAPI workspace...
          </p>

          <div className="w-32 h-1 rounded-full bg-slate-800 overflow-hidden">
            <div className="h-full w-1/2 rounded-full bg-violet-500 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  const currentNavItem = NAV_ITEMS.find((item) =>
    item.href === '/dashboard'
      ? pathname === '/dashboard'
      : pathname.startsWith(item.href),
  );

  const pageTitle = currentNavItem?.label || 'Developer Gateway';

  const initials = user?.name
    ? user.name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part: string) => part[0])
        .join('')
        .toUpperCase()
    : 'DV';

  const activeProjectName =
    activeProject?.name || 'Select Project';

  // ============================================================
  // WORKSPACE LEVEL
  // Projects and Profile pages use a clean header without sidebar.
  // ============================================================

  if (isWorkspaceLevel) {
    return (
      <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex flex-col font-sans transition-colors duration-200">
        <header className="sticky top-0 z-40 h-16 shrink-0 bg-[var(--surface)] text-[var(--foreground)] backdrop-blur-xl shadow-sm">
          <div className="h-full max-w-[1600px] mx-auto px-4 sm:px-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <Link
                href="/dashboard/projects"
                className="flex items-center gap-2.5 shrink-0"
              >
                <span className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center shrink-0 shadow-md shadow-[var(--primary)]/20">
                  <Image
                    src="/logo.png"
                    alt="OneAPI Logo"
                    width={36}
                    height={36}
                    className="w-full h-full object-contain"
                    priority
                  />
                </span>

                <span className="text-lg font-bold tracking-tight text-[var(--foreground)]">
                  One<span className="text-[var(--primary)]">API</span>
                </span>
              </Link>

              <div className="hidden sm:block h-7 w-px bg-[var(--surface-secondary)]" />

              <nav className="hidden sm:flex items-center gap-2">
                <Link
                  href="/dashboard/projects"
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                    pathname === '/dashboard/projects'
                      ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
                      : 'text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-secondary)]'
                  }`}
                >
                  <FolderGit2 size={16} />
                  Projects
                </Link>

                <Link
                  href="/dashboard/profile"
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                    pathname === '/dashboard/profile'
                      ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
                      : 'text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-secondary)]'
                  }`}
                >
                  <UserCircle size={16} />
                  Profile
                </Link>
              </nav>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-md shadow-[var(--primary)]/20 transition-all cursor-pointer"
              >
                <Plus size={16} />
                <span className="hidden xs:inline">New Project</span>
                <span className="xs:hidden">New</span>
              </button>

              <Link
                href="/dashboard/profile"
                className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium transition-all ${
                  pathname === '/dashboard/profile'
                    ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
                    : 'bg-[var(--surface-secondary)] text-[var(--foreground)] hover:bg-[var(--surface-secondary)]/80'
                }`}
              >
                <span className="w-6 h-6 rounded-lg bg-[var(--primary)] text-white flex items-center justify-center text-xs font-bold">
                  {initials.slice(0, 1)}
                </span>

                <span className="hidden md:inline max-w-32 truncate">
                  {user?.name || 'Profile'}
                </span>
              </Link>

              <ThemeToggle />

              <button
                type="button"
                onClick={handleLogout}
                title="Sign out"
                aria-label="Sign out"
                className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--muted)] hover:text-[var(--danger)] hover:bg-[var(--danger)]/10 transition-all cursor-pointer"
              >
                <LogOut size={17} />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 w-full max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>

        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div
              data-create-modal
              className="w-full max-w-md rounded-2xl bg-[var(--surface)] text-[var(--foreground)] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            >
              <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/15 text-[var(--primary)] flex items-center justify-center">
                    <Layers size={19} />
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-[var(--foreground)]">
                      Create New Project
                    </h3>
                    <p className="text-xs text-[var(--muted)] mt-0.5">
                      Set up a new API workspace
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={closeCreateModal}
                  disabled={isCreatingProject}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-secondary)] transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <X size={17} />
                </button>
              </div>

              <form
                onSubmit={handleQuickCreateProject}
                className="p-6 space-y-5"
              >
                <div>
                  <label className="block text-xs font-semibold text-[var(--foreground)] uppercase tracking-wider mb-2">
                    Project Name
                  </label>

                  <input
                    ref={createInputRef}
                    type="text"
                    required
                    maxLength={80}
                    placeholder="e.g. Chatbot Router"
                    value={newProjectName}
                    onChange={(event) =>
                      setNewProjectName(event.target.value)
                    }
                    className="w-full rounded-xl bg-[var(--surface-input)] px-4 py-3 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] outline-none transition-all focus:ring-2 focus:ring-[var(--primary)]/20"
                  />

                  <p className="text-[11px] text-[var(--muted)] mt-2">
                    Give your project a clear and recognizable name.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeCreateModal}
                    disabled={isCreatingProject}
                    className="rounded-xl px-4 py-2.5 text-xs font-semibold text-[var(--muted)] hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)] transition-all disabled:opacity-50 cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={
                      isCreatingProject || !newProjectName.trim()
                    }
                    className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-[var(--primary)]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isCreatingProject ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <Plus size={15} />
                    )}
                    {isCreatingProject
                      ? 'Creating...'
                      : 'Create Project'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ============================================================
  // PROJECT LEVEL
  // Main dashboard with responsive sidebar.
  // ============================================================

  return (
    <div className="min-h-screen bg-[#080b12] text-slate-100 font-sans">
      {/* Mobile backdrop */}
      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar */}
    {/* Sidebar */}
<aside
  className={`fixed inset-y-0 left-0 z-50 flex flex-col
    border-r border-[var(--border)]
    bg-[var(--surface-secondary)]
    text-[var(--foreground)]
    transition-all duration-300
    ${
      sidebarCollapsed ? 'w-[76px]' : 'w-[260px]'
    }
    ${
      mobileMenuOpen
        ? 'translate-x-0'
        : '-translate-x-full lg:translate-x-0'
    }`}
>
  {/* Brand */}
  <div className="h-16 shrink-0 flex items-center justify-between border-b border-[var(--border)] px-4">
    <Link
      href="/dashboard"
      className="flex items-center gap-3 min-w-0"
    >
      <span className="w-9 h-9 shrink-0 rounded-xl overflow-hidden flex items-center justify-center shadow-md shadow-[var(--primary)]/20">
        <Image
          src="/logo.png"
          alt="OneAPI Logo"
          width={36}
          height={36}
          className="w-full h-full object-contain"
          priority
        />
      </span>

      {!sidebarCollapsed && (
        <span className="text-lg font-bold tracking-tight text-[var(--foreground)] whitespace-nowrap">
          One<span className="text-[var(--primary)]">API</span>
        </span>
      )}
    </Link>

    <button
      type="button"
      onClick={() =>
        setSidebarCollapsed((previous) => !previous)
      }
      title={
        sidebarCollapsed
          ? 'Expand sidebar'
          : 'Collapse sidebar'
      }
      className="hidden lg:flex w-8 h-8 shrink-0 items-center justify-center rounded-lg text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--surface)] transition-all"
    >
      {sidebarCollapsed ? (
        <ChevronRight size={17} />
      ) : (
        <ChevronLeft size={17} />
      )}
    </button>

    <button
      type="button"
      onClick={() => setMobileMenuOpen(false)}
      aria-label="Close sidebar"
      className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--surface)]"
    >
      <X size={19} />
    </button>
  </div>

  {/* Navigation */}
  <div className="flex-1 overflow-y-auto px-3 py-6">
    {!sidebarCollapsed && (
      <p className="px-3 mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
        Workspace
      </p>
    )}

    <nav className="space-y-1">
      {NAV_ITEMS.map((item) => {
        const isActive =
          item.href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileMenuOpen(false)}
            title={
              sidebarCollapsed ? item.label : undefined
            }
            className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200
              ${
                isActive
                  ? 'border border-[var(--primary)]/25 bg-[var(--primary)]/10 text-[var(--primary)] shadow-sm'
                  : 'border border-transparent text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]'
              }
              ${
                sidebarCollapsed
                  ? 'justify-center px-0'
                  : ''
              }`}
          >
            <span
              className={`shrink-0 transition-colors ${
                isActive
                  ? 'text-[var(--primary)]'
                  : 'text-[var(--muted)] group-hover:text-[var(--primary)]'
              }`}
            >
              {item.icon}
            </span>

            {!sidebarCollapsed && (
              <>
                <span className="truncate">
                  {item.label}
                </span>

                {isActive && (
                  <span className="absolute right-3 h-1.5 w-1.5 rounded-full bg-[var(--primary)]" />
                )}
              </>
            )}
          </Link>
        );
      })}
    </nav>
  </div>

  {/* Sidebar Bottom */}
  <div className="shrink-0 border-t border-[var(--border)] p-3">
    {/* Gateway Status */}
   

    {/* User Profile */}
    <div
      className={`flex items-center gap-3 rounded-xl p-2 hover:bg-[var(--surface)] transition-colors ${
        sidebarCollapsed ? 'justify-center' : ''
      }`}
    >
      <div className="w-9 h-9 shrink-0 rounded-xl bg-[var(--primary)]/10 border border-[var(--primary)]/20 flex items-center justify-center text-xs font-bold text-[var(--primary)]">
        {initials}
      </div>

      {!sidebarCollapsed && (
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-[var(--foreground)] truncate">
            {user?.name || 'Developer'}
          </p>

          <p className="text-[10px] text-[var(--muted)] truncate mt-0.5">
            {user?.email || 'dev@oneapi.io'}
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={handleLogout}
        title="Sign out"
        aria-label="Sign out"
        className="w-8 h-8 shrink-0 rounded-lg flex items-center justify-center text-[var(--muted)] hover:text-[var(--danger)] hover:bg-[var(--danger)]/10 transition-all"
      >
        <LogOut size={16} />
      </button>
    </div>
  </div>
</aside>

      {/* Main area */}
      <div
        className={`min-h-screen flex flex-col bg-[var(--surface-secondary)] transition-all duration-300 ${
          sidebarCollapsed ? 'lg:ml-[76px]' : 'lg:ml-[260px]'
        }`}
      >
        {/* Topbar */}
        <header className="sticky top-0 z-30 h-16 shrink-0 bg-[var(--surface-secondary)] text-[var(--foreground)] backdrop-blur-xl">
          <div className="h-full px-4 sm:px-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open navigation"
                className="lg:hidden w-9 h-9 shrink-0 rounded-xl flex items-center justify-center text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-secondary)] transition-all cursor-pointer"
              >
                <Menu size={20} />
              </button>

              {/* Back to Projects Button */}
              <Link
                href="/dashboard/projects"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--surface-secondary)] hover:bg-[var(--surface-secondary)]/80 text-[var(--foreground)] text-xs font-semibold shadow-sm transition-all shrink-0 cursor-pointer"
                title="Back to all projects"
              >
                <ArrowLeft size={14} className="text-[var(--primary)] shrink-0" />
                {/* <span className="hidden sm:inline">Projects</span> */}
              </Link>

              <div className="min-w-0">
                <div className="hidden sm:flex items-center gap-2 text-[11px] text-[var(--muted)] mb-0.5">
                  <span>Workspace</span>
                  <ChevronRight size={12} />
                  <span className="text-[var(--foreground)] font-semibold">
                    {pageTitle}
                  </span>
                </div>

                <h1 className="text-sm sm:text-base font-bold text-[var(--foreground)] truncate">
                  {pageTitle}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {/* Active project indicator - clickable to switch */}
              {activeProject && (
                <Link
                  href="/dashboard/projects"
                  className="hidden md:flex items-center gap-2 max-w-48 rounded-xl bg-[var(--surface-secondary)] hover:bg-[var(--surface-secondary)]/80 text-[var(--foreground)] px-3 py-2 transition-all cursor-pointer"
                  title={`Active project: ${activeProjectName}. Click to change project.`}
                >
                  <FolderGit2
                    size={14}
                    className="text-[var(--primary)] shrink-0"
                  />
                  <span className="text-xs font-medium truncate">
                    {activeProjectName}
                  </span>
                </Link>
              )}

              {/* Theme toggle */}
              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 w-full min-w-0 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>

      {/* Create Project Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div
            data-create-modal
            className="w-full max-w-md rounded-2xl border border-slate-700/80 bg-[#121a2a] shadow-2xl shadow-black/40 overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-slate-700/80 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-400/20 flex items-center justify-center">
                  <Layers
                    size={19}
                    className="text-violet-300"
                  />
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white">
                    Create New Project
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Set up a new API workspace
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeCreateModal}
                disabled={isCreatingProject}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                <X size={17} />
              </button>
            </div>

            <form
              onSubmit={handleQuickCreateProject}
              className="p-6 space-y-5"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Project Name
                </label>

                <input
                  ref={createInputRef}
                  type="text"
                  required
                  maxLength={80}
                  placeholder="e.g. Chatbot Router"
                  value={newProjectName}
                  onChange={(event) =>
                    setNewProjectName(event.target.value)
                  }
                  className="w-full rounded-xl border border-slate-700/80 bg-[#080b12] px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none transition-all focus:border-violet-400/60 focus:ring-2 focus:ring-violet-400/10"
                />

                <p className="text-[11px] text-slate-500 mt-2">
                  Give your project a clear and recognizable name.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  disabled={isCreatingProject}
                  className="rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition-all disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    isCreatingProject || !newProjectName.trim()
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-violet-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreatingProject ? (
                    <Loader2
                      size={15}
                      className="animate-spin"
                    />
                  ) : (
                    <Plus size={15} />
                  )}

                  {isCreatingProject
                    ? 'Creating...'
                    : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#080b12] flex items-center justify-center text-slate-400 text-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center shadow-lg shadow-[var(--primary)]/20 animate-pulse">
              <Image
                src="/logo.png"
                alt="OneAPI Logo"
                width={40}
                height={40}
                className="w-full h-full object-contain"
                priority
              />
            </div>

            <p>Loading OneAPI Workspace...</p>
          </div>
        </div>
      }
    >
      <DashboardLayoutContent>
        {children}
      </DashboardLayoutContent>
    </Suspense>
  );
}
