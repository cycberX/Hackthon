'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FolderGit2,
  Plus,
  Search,
  ArrowRight,
  Star,
  Trash2,
  Layers,
  X,
  Loader2,
  Clock,
  UserCircle,
} from 'lucide-react';
import { authStorage, fetchApi } from '@/lib/api';

interface ProjectItem {
  _id?: string;
  id?: string;
  name: string;
  slug: string;
  description?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  activeKeysCount?: number;
  vaultSecretsCount?: number;
}

export default function ProjectsPortalPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // New Project Form State
  const [newName, setNewName] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [autoSlug, setAutoSlug] = useState(true);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const cachedUser = authStorage.getUser();
      if (cachedUser) setUser(cachedUser);

      const [userRes, projectsRes] = await Promise.all([
        fetchApi('/api/v1/auth/me').catch(() => null),
        fetchApi('/api/v1/projects').catch(() => null),
      ]);

      if (userRes?.success && userRes.data?.user) {
        setUser(userRes.data.user);
        authStorage.setUser(userRes.data.user);
      }

      if (projectsRes?.success && projectsRes.data?.projects) {
        setProjects(projectsRes.data.projects);
      }
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleNameChange = (val: string) => {
    setNewName(val);
    if (autoSlug) {
      setNewSlug(
        val
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')
      );
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      setCreateError('Project name is required');
      return;
    }

    setIsCreating(true);
    setCreateError(null);

    try {
      const res = await fetchApi('/api/v1/projects', {
        method: 'POST',
        body: JSON.stringify({
          name: newName.trim(),
          slug: newSlug.trim() || undefined,
          description: newDescription.trim() || undefined,
        }),
      });

      if (!res.success) {
        setCreateError(res.error?.message || 'Failed to create project');
        setIsCreating(false);
        return;
      }

      const created = res.data?.project;
      if (created) {
        const normalized = {
          ...created,
          _id: created._id || created.id,
          id: created._id || created.id,
        };
        authStorage.setActiveProject(normalized);
        window.dispatchEvent(new CustomEvent('oneapi_project_changed', { detail: normalized }));
        setIsCreateModalOpen(false);
        router.push(`/dashboard?project=${normalized._id}`);
      } else {
        await loadProjects();
        setIsCreateModalOpen(false);
      }
    } catch (err: any) {
      setCreateError(err.message || 'Network error while creating project');
    } finally {
      setIsCreating(false);
    }
  };

  const handleSelectProject = (project: ProjectItem) => {
    const projectId = project._id || project.id;
    const normalized = {
      ...project,
      _id: projectId,
      id: projectId,
    };
    authStorage.setActiveProject(normalized);
    window.dispatchEvent(new CustomEvent('oneapi_project_changed', { detail: normalized }));
    router.push(`/dashboard?project=${projectId}`);
  };

  const handleDeleteProject = async (project: ProjectItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const projectId = project._id || project.id;
    if (!projectId) return;

    if (!confirm(`Are you sure you want to delete project "${project.name}"? All associated API keys, vault credentials, and routing rules will be permanently removed.`)) {
      return;
    }

    try {
      const res = await fetchApi(`/api/v1/projects/${projectId}`, {
        method: 'DELETE',
      });
      if (res.success) {
        const active = authStorage.getActiveProject();
        const activeId = active?._id || active?.id;
        if (activeId === projectId) {
          authStorage.setActiveProject(null);
        }
        await loadProjects();
      } else {
        alert(res.error?.message || 'Failed to delete project');
      }
    } catch (err: any) {
      alert(err.message || 'Error deleting project');
    }
  };

  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12 text-[var(--foreground)]">
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-[var(--primary)] animate-pulse" />
            <span className="text-xs font-mono font-bold tracking-wider uppercase text-[var(--primary)]">
              DEVELOPER WORKSPACE
            </span>
            <span className="text-[var(--muted)] text-xs">&bull;</span>
            <span className="text-xs text-[var(--muted)]">{user?.email || 'dev@oneapi.io'}</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--foreground)] flex items-center gap-2.5">
            Projects
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[var(--surface-secondary)] text-[var(--muted)]">
              {projects.length}
            </span>
          </h1>
          <p className="text-xs md:text-sm text-[var(--muted)] mt-1 max-w-xl">
            Select an isolated project scope to manage its API providers, credentials vault, failover chains, and developer tokens.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/profile"
            className="px-3.5 py-2.5 rounded-xl bg-[var(--surface)] hover:bg-[var(--surface-secondary)] text-[var(--foreground)] text-xs font-semibold flex items-center gap-2 shadow-sm transition-all"
          >
            <UserCircle className="w-4 h-4 text-[var(--primary)]" />
            <span>Profile</span>
          </Link>

          <button
            onClick={() => {
              setNewName('');
              setNewSlug('');
              setNewDescription('');
              setCreateError(null);
              setIsCreateModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-bold text-xs shadow-md shadow-[var(--primary)]/20 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Project</span>
          </button>
        </div>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[var(--muted)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search projects by name or slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[var(--surface-input)] rounded-xl text-xs text-[var(--foreground)] placeholder:text-[var(--muted)] outline-none focus:ring-2 focus:ring-[var(--primary)]/20 transition-all"
          />
        </div>

        <div className="text-xs text-[var(--muted)] font-mono flex items-center gap-2 self-end sm:self-center">
          <span>Sort by:</span>
          <span className="text-[var(--foreground)] font-semibold">Recently Updated</span>
        </div>
      </div>

      {/* 3. Projects Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-6 rounded-2xl bg-[var(--card)] animate-pulse space-y-4 h-48 shadow-[var(--shadow)]"
            >
              <div className="h-5 bg-[var(--surface-secondary)] rounded w-1/2" />
              <div className="h-3 bg-[var(--surface-secondary)]/60 rounded w-3/4" />
              <div className="h-8 bg-[var(--surface-secondary)]/40 rounded mt-6" />
            </div>
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-16 rounded-2xl bg-[var(--card)] shadow-[var(--shadow)]">
          <FolderGit2 className="w-10 h-10 text-[var(--muted)] mx-auto mb-3" />
          <h3 className="text-sm font-bold text-[var(--foreground)]">No projects found</h3>
          <p className="text-xs text-[var(--muted)] mt-1 max-w-sm mx-auto">
            {searchQuery
              ? `No projects matching "${searchQuery}". Try a different keyword.`
              : 'Create your first project to start routing API requests with automated failover.'}
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="mt-4 px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-bold text-xs rounded-xl inline-flex items-center gap-1.5 shadow-md shadow-[var(--primary)]/20 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map((project, idx) => {
            const projectId = project._id || project.id || String(idx);
            return (
              <div
                key={projectId}
                onClick={() => handleSelectProject(project)}
                className="group p-6 rounded-2xl bg-[var(--card)] hover:bg-[var(--surface-secondary)]/50 shadow-[var(--shadow)] transition-all duration-200 cursor-pointer flex flex-col justify-between relative overflow-hidden"
              >
                {/* Subtle hover gradient glow */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--primary)]/5 group-hover:bg-[var(--primary)]/10 rounded-full blur-2xl transition-all pointer-events-none" />

                <div>
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div className="w-9 h-9 rounded-xl bg-[var(--primary)]/15 text-[var(--primary)] flex items-center justify-center font-bold text-sm shrink-0">
                        {project.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="overflow-hidden">
                        <div className="text-base font-bold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors truncate">
                          {project.name}
                        </div>
                        <div className="text-[11px] font-mono text-[var(--muted)] truncate">
                          slug: <span className="text-[var(--foreground)]/80">{project.slug}</span>
                        </div>
                      </div>
                    </div>

                    {project.isDefault && (
                      <span className="shrink-0 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-semibold flex items-center gap-1">
                        <Star className="w-3 h-3 fill-amber-500" /> Default
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-xs text-[var(--muted)] line-clamp-2 mt-2 leading-relaxed">
                    {project.description || 'Dedicated configuration scope for OneAPI credentials and routing rules.'}
                  </p>
                </div>

                {/* Footer info & open action */}
                <div className="mt-6 pt-4 flex items-center justify-between text-xs">
                  <div className="text-[11px] text-[var(--muted)] flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3" />
                    <span>{project.updatedAt ? new Date(project.updatedAt).toLocaleDateString() : 'Active'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {!project.isDefault && (
                      <button
                        type="button"
                        onClick={(e) => handleDeleteProject(project, e)}
                        className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--danger)] hover:bg-[var(--danger)]/10 transition-colors"
                        title="Delete Project"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <span className="px-3 py-1.5 rounded-xl bg-[var(--primary)]/10 group-hover:bg-[var(--primary)] text-[var(--primary)] group-hover:text-white font-semibold text-xs flex items-center gap-1 transition-all">
                      <span>Open</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Create Project Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--surface)] text-[var(--foreground)] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-5 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[var(--foreground)] flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[var(--primary)]" />
                  Create New Project
                </h3>
                <p className="text-xs text-[var(--muted)] mt-0.5">
                  Establish an isolated scope for third-party vault keys and proxy routing rules.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-secondary)] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateProject} className="p-6 space-y-4">
              {createError && (
                <div className="p-3 rounded-xl bg-[var(--danger)]/10 text-[var(--danger)] text-xs font-medium">
                  {createError}
                </div>
              )}

              {/* Project Name */}
              <div>
                <label className="block text-xs font-semibold text-[var(--foreground)] uppercase tracking-wider mb-1.5">
                  Project Name <span className="text-[var(--danger)]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mobile App Backend, AI Search Router"
                  value={newName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[var(--surface-input)] rounded-xl text-xs text-[var(--foreground)] placeholder:text-[var(--muted)] outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
                />
              </div>

              {/* Project Slug */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-[var(--foreground)] uppercase tracking-wider">
                    Project Slug <span className="text-[var(--muted)] font-normal">(URL & Header identifier)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setAutoSlug(!autoSlug)}
                    className="text-[10px] text-[var(--primary)] hover:underline cursor-pointer"
                  >
                    {autoSlug ? 'Customize slug' : 'Auto-sync from name'}
                  </button>
                </div>
                <div className="flex items-center bg-[var(--surface-input)] rounded-xl px-3 py-2 text-xs font-mono text-[var(--muted)]">
                  <span className="select-none">project/</span>
                  <input
                    type="text"
                    required
                    value={newSlug}
                    onChange={(e) => {
                      setAutoSlug(false);
                      setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''));
                    }}
                    className="flex-1 bg-transparent text-[var(--foreground)] outline-none pl-1"
                  />
                </div>
              </div>

              {/* Project Description */}
              <div>
                <label className="block text-xs font-semibold text-[var(--foreground)] uppercase tracking-wider mb-1.5">
                  Description <span className="text-[var(--muted)] font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Brief description of the application or service scope..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[var(--surface-input)] rounded-xl text-xs text-[var(--foreground)] placeholder:text-[var(--muted)] outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
                />
              </div>

              {/* Actions */}
              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-secondary)] transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-5 py-2.5 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-[var(--primary)]/20 cursor-pointer"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      Create Project
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
