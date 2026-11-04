'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  FolderGit2,
  Settings2,
  Trash2,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Copy,
  Check,
  Star,
  Clock,
  Layers,
  ArrowRight,
  X,
  ExternalLink,
} from 'lucide-react';
import { authStorage, fetchApi } from '@/lib/api';

interface ProjectData {
  _id?: string;
  id?: string;
  name: string;
  slug: string;
  description?: string;
  isDefault: boolean;
  activeKeysCount?: number;
  vaultSecretsCount?: number;
  routingRulesCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [activeProject, setActiveProject] = useState<ProjectData | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  const [feedbackMsg, setFeedbackMsg] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Delete Project State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Load project details
  const loadProjectData = async () => {
    setLoading(true);
    try {
      const storedActive = authStorage.getActiveProject();
      const targetParamId = searchParams.get('project');

      const res = await fetchApi('/api/v1/projects');
      if (res.success && res.data?.projects) {
        const fetchedProjects: ProjectData[] = res.data.projects;
        setProjects(fetchedProjects);

        // Find active project
        let found: ProjectData | undefined;
        if (targetParamId) {
          found = fetchedProjects.find((p) => (p._id || p.id) === targetParamId);
        }
        if (!found && storedActive) {
          const storedId = storedActive._id || storedActive.id;
          found = fetchedProjects.find((p) => (p._id || p.id) === storedId);
        }
        if (!found && fetchedProjects.length > 0) {
          found = fetchedProjects.find((p) => p.isDefault) || fetchedProjects[0];
        }

        if (found) {
          const normalized = {
            ...found,
            _id: found._id || found.id,
            id: found._id || found.id,
          };
          setActiveProject(normalized);
          setName(normalized.name || '');
          setDescription(normalized.description || '');
          setIsDefault(Boolean(normalized.isDefault));
          authStorage.setActiveProject(normalized);
        }
      }
    } catch (err) {
      console.error('Failed to load project settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjectData();
  }, [searchParams]);

  const handleCopyProjectId = () => {
    const idToCopy = activeProject?._id || activeProject?.id;
    if (!idToCopy) return;
    navigator.clipboard.writeText(idToCopy);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  // Switch Active Project
  const handleSwitchProject = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    const found = projects.find((p) => (p._id || p.id) === selectedId);
    if (found) {
      const normalized = {
        ...found,
        _id: found._id || found.id,
        id: found._id || found.id,
      };
      setActiveProject(normalized);
      setName(normalized.name || '');
      setDescription(normalized.description || '');
      setIsDefault(Boolean(normalized.isDefault));
      setFeedbackMsg(null);
      authStorage.setActiveProject(normalized);
      window.dispatchEvent(new CustomEvent('oneapi_project_changed', { detail: normalized }));
      router.push(`/dashboard/settings?project=${normalized._id}`);
    }
  };

  // Update Project Details
  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    const projectId = activeProject?._id || activeProject?.id;
    if (!projectId) return;

    if (!name.trim()) {
      setFeedbackMsg({
        type: 'error',
        text: 'Project name cannot be empty.',
      });
      return;
    }

    setSaving(true);
    setFeedbackMsg(null);

    try {
      const res = await fetchApi(`/api/v1/projects/${projectId}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          isDefault,
        }),
      });

      if (res.success && res.data?.project) {
        const updated = res.data.project;
        const normalized = {
          ...activeProject,
          ...updated,
          _id: updated.id || updated._id || projectId,
          id: updated.id || updated._id || projectId,
        };

        setActiveProject(normalized);
        authStorage.setActiveProject(normalized);
        window.dispatchEvent(new CustomEvent('oneapi_project_changed', { detail: normalized }));

        setFeedbackMsg({
          type: 'success',
          text: `Project "${normalized.name}" details updated successfully.`,
        });

        // Refresh project list in background
        const listRes = await fetchApi('/api/v1/projects').catch(() => null);
        if (listRes?.success && listRes.data?.projects) {
          setProjects(listRes.data.projects);
        }
      } else {
        setFeedbackMsg({
          type: 'error',
          text: res.error?.message || 'Failed to update project settings.',
        });
      }
    } catch (err: any) {
      setFeedbackMsg({
        type: 'error',
        text: err.message || 'An error occurred while updating project.',
      });
    } finally {
      setSaving(false);
    }
  };

  // Delete Project
  const handleDeleteProject = async () => {
    const projectId = activeProject?._id || activeProject?.id;
    if (!projectId) return;

    if (deleteConfirmationText !== (activeProject?.slug || activeProject?.name || 'DELETE')) {
      setDeleteError(`Please type "${activeProject?.slug || activeProject?.name}" to confirm.`);
      return;
    }

    setDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetchApi(`/api/v1/projects/${projectId}`, {
        method: 'DELETE',
      });

      if (res.success) {
        authStorage.setActiveProject(null);
        window.dispatchEvent(new CustomEvent('oneapi_project_changed', { detail: null }));
        setIsDeleteModalOpen(false);
        router.push('/dashboard/projects');
      } else {
        setDeleteError(res.error?.message || 'Failed to delete project.');
        setDeleting(false);
      }
    } catch (err: any) {
      setDeleteError(err.message || 'Network error while deleting project.');
      setDeleting(false);
    }
  };

  const projectId = activeProject?._id || activeProject?.id || '';

  if (loading && !activeProject) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 text-[var(--muted)]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
        <p className="text-xs font-semibold">Loading project settings...</p>
      </div>
    );
  }

  if (!activeProject && !loading) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center space-y-4 text-[var(--foreground)]">
        <FolderGit2 className="w-12 h-12 text-[var(--muted)] mx-auto" />
        <h2 className="text-xl font-bold">No Active Project Selected</h2>
        <p className="text-xs text-[var(--muted)] max-w-sm mx-auto">
          Please select or create a project to configure its settings.
        </p>
        <Link
          href="/dashboard/projects"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--primary)] text-white text-xs font-bold shadow-md shadow-[var(--primary)]/20"
        >
          <span>View All Projects</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16 text-[var(--foreground)]">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-[var(--muted)] mb-1">
            <Settings2 className="w-3.5 h-3.5 text-[var(--primary)]" />
            <span>Developer Workspace</span>
            <span>/</span>
            <span className="text-[var(--foreground)] font-semibold">Project Settings</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--foreground)]">
            Project Settings
          </h1>
          <p className="text-xs md:text-sm text-[var(--muted)] mt-1">
            Configure metadata, identity, and lifecycle options for this project scope.
          </p>
        </div>

        {/* Project Switcher */}
        {projects.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--muted)] font-medium">Scope:</span>
            <select
              value={projectId}
              onChange={handleSwitchProject}
              className="bg-[var(--surface-input)] text-[var(--foreground)] text-xs font-semibold px-3 py-2 rounded-xl outline-none focus:ring-2 focus:ring-[var(--primary)]/20 cursor-pointer"
            >
              {projects.map((p) => {
                const pId = p._id || p.id;
                return (
                  <option key={pId} value={pId}>
                    {p.name} {p.isDefault ? '(Default)' : ''}
                  </option>
                );
              })}
            </select>
          </div>
        )}
      </div>

      {/* Feedback Banner */}
      {feedbackMsg && (
        <div
          className={`p-4 rounded-xl text-xs font-medium flex items-center gap-2.5 ${
            feedbackMsg.type === 'success'
              ? 'bg-[var(--success)]/10 text-[var(--success)]'
              : 'bg-[var(--danger)]/10 text-[var(--danger)]'
          }`}
        >
          {feedbackMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* 2. Project Details & Identity Card */}
      <section className="rounded-2xl bg-[var(--card)] shadow-[var(--shadow)] overflow-hidden">
        <div className="px-6 py-5 flex items-center justify-between border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/15 text-[var(--primary)] flex items-center justify-center font-bold text-sm shrink-0">
              {activeProject?.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[var(--foreground)]">
                  {activeProject?.name}
                </h2>
                {activeProject?.isDefault && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-semibold flex items-center gap-1">
                    <Star className="w-3 h-3 fill-amber-500" /> Default Scope
                  </span>
                )}
              </div>
              <p className="text-xs font-mono text-[var(--muted)] mt-0.5">
                slug: <span className="text-[var(--foreground)]">{activeProject?.slug}</span>
              </p>
            </div>
          </div>

          <Link
            href="/dashboard/projects"
            className="text-xs text-[var(--primary)] hover:underline inline-flex items-center gap-1 font-semibold"
          >
            <span>All Projects</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleUpdateProject} className="p-6 space-y-5">
          <div className="space-y-4">
            {/* Project Name */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--foreground)] mb-1.5">
                Project Name <span className="text-[var(--danger)]">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Production Mobile Gateway"
                className="w-full px-4 py-2.5 bg-[var(--surface-input)] rounded-xl text-xs text-[var(--foreground)] placeholder:text-[var(--muted)] outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
              />
            </div>

            {/* Project Slug (Read-only identifier) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]">
                  Project Slug
                </label>
                <span className="text-[10px] text-[var(--muted)]">API Header & URL Route Identifier</span>
              </div>
              <div className="flex items-center bg-[var(--surface-secondary)]/60 rounded-xl px-3.5 py-2.5 text-xs font-mono text-[var(--muted)]">
                <span className="select-none text-[var(--muted)]/70">x-project-slug:&nbsp;</span>
                <span className="text-[var(--foreground)] font-semibold">{activeProject?.slug}</span>
              </div>
            </div>

            {/* Project ID */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]">
                  Project ID
                </label>
                <button
                  type="button"
                  onClick={handleCopyProjectId}
                  className="text-[10px] text-[var(--primary)] hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  {copiedId ? <Check className="w-3 h-3 text-[var(--success)]" /> : <Copy className="w-3 h-3" />}
                  {copiedId ? 'Copied' : 'Copy ID'}
                </button>
              </div>
              <input
                type="text"
                disabled
                value={projectId}
                className="w-full px-4 py-2.5 bg-[var(--surface-secondary)]/60 rounded-xl text-xs font-mono text-[var(--muted)] cursor-not-allowed outline-none"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--foreground)] mb-1.5">
                Description
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the application scope, environment, or target platform..."
                className="w-full px-4 py-2.5 bg-[var(--surface-input)] rounded-xl text-xs text-[var(--foreground)] placeholder:text-[var(--muted)] outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
              />
            </div>

            {/* Set as Default Project */}
            <div className="pt-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="mt-0.5 rounded text-[var(--primary)] focus:ring-[var(--primary)]/20"
                />
                <div>
                  <span className="text-xs font-semibold text-[var(--foreground)]">
                    Default Workspace Scope
                  </span>
                  <p className="text-[11px] text-[var(--muted)] leading-relaxed">
                    Automatically load this project when opening the OneAPI developer dashboard.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Timestamps */}
          <div className="pt-4 border-t border-[var(--border)] flex flex-wrap items-center justify-between gap-4 text-[11px] text-[var(--muted)]">
            <div className="flex items-center gap-1.5 font-mono">
              <Clock className="w-3.5 h-3.5" />
              <span>
                Created: {activeProject?.createdAt ? new Date(activeProject.createdAt).toLocaleDateString() : 'Active'}
              </span>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-[var(--primary)]/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  Save Project Details
                </>
              )}
            </button>
          </div>
        </form>
      </section>

      {/* 3. Project Delete Options (Danger Zone) */}
      <section className="rounded-2xl bg-[var(--danger)]/5 shadow-[var(--shadow)] p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-[var(--danger)] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Delete Project
            </h2>
            <p className="text-xs text-[var(--muted)] max-w-xl leading-relaxed">
              Permanently delete project &ldquo;{activeProject?.name}&rdquo; and all of its associated scoped API keys, vault credentials, failover routing rules, and proxy request telemetry logs. This action cannot be reversed.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setDeleteConfirmationText('');
              setDeleteError(null);
              setIsDeleteModalOpen(true);
            }}
            className="px-5 py-2.5 rounded-xl bg-[var(--danger)] hover:bg-[var(--danger)]/90 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-[var(--danger)]/20 transition-all cursor-pointer shrink-0"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Project</span>
          </button>
        </div>
      </section>

      {/* Delete Project Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--surface)] text-[var(--foreground)] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl bg-[var(--danger)]/15 text-[var(--danger)] flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="p-1 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <h3 className="text-base font-bold text-[var(--foreground)]">
                Delete Project &ldquo;{activeProject?.name}&rdquo;?
              </h3>
              <p className="text-xs text-[var(--muted)] mt-1.5 leading-relaxed">
                All API keys, provider credentials in the vault, routing rules, and gateway logs associated with this project will be permanently erased.
              </p>
            </div>

            {deleteError && (
              <div className="p-3 rounded-xl bg-[var(--danger)]/10 text-[var(--danger)] text-xs font-medium">
                {deleteError}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[var(--muted)] mb-1.5">
                Type <strong className="text-[var(--danger)]">{activeProject?.slug || activeProject?.name}</strong> to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                placeholder={activeProject?.slug || activeProject?.name}
                className="w-full px-3.5 py-2.5 bg-[var(--surface-input)] rounded-xl text-xs text-[var(--foreground)] outline-none focus:ring-2 focus:ring-[var(--danger)]/30 font-mono"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-secondary)] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteProject}
                disabled={
                  deleting ||
                  deleteConfirmationText !== (activeProject?.slug || activeProject?.name)
                }
                className="px-5 py-2.5 rounded-xl bg-[var(--danger)] hover:bg-[var(--danger)]/90 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-[var(--danger)]/20 cursor-pointer"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Project
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
