'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  UserCircle,
  CheckCircle2,
  Mail,
  Phone,
  Shield,
  Calendar,
  Key,
  ShieldCheck,
  AlertCircle,
  Lock,
  LogOut,
  Trash2,
  Save,
  Loader2,
  Eye,
  EyeOff,
  Copy,
  Check,
  ArrowRight,
  AlertTriangle,
  X,
} from 'lucide-react';
import { authStorage, fetchApi } from '@/lib/api';

interface ProfileUser {
  name?: string;
  email?: string;
  phone_no?: string;
  role?: string;
  user_id?: string;
  _id?: string;
  isVerified?: boolean;
  terms_accepted?: boolean;
  createdAt?: string;
}

export default function ProfilePage() {
  const router = useRouter();

  const [user, setUser] = useState<ProfileUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(false);

  // Profile Edit State
  const [name, setName] = useState('');
  const [phoneNo, setPhoneNo] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Session / Signout State
  const [loggingOut, setLoggingOut] = useState(false);

  // Delete Account State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    const cached = authStorage.getUser();
    if (cached) {
      setUser(cached);
      setName(cached.name || '');
      setPhoneNo(cached.phone_no || '');
    }

    fetchApi('/api/v1/auth/me')
      .then((res) => {
        if (res.success && res.data?.user) {
          const u = res.data.user;
          setUser(u);
          setName(u.name || '');
          setPhoneNo(u.phone_no || '');
          authStorage.setUser(u);
        }
      })
      .catch((err) => {
        console.error('Failed to load profile:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleCopyUserId = () => {
    const idToCopy = user?.user_id || user?._id || '';
    if (!idToCopy) return;
    navigator.clipboard.writeText(idToCopy);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  // Update Profile Info
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    setSavingProfile(true);

    try {
      const res = await fetchApi('/api/v1/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({
          name: name.trim(),
          phone_no: phoneNo.trim() || undefined,
        }),
      });

      if (res.success && res.data?.user) {
        setUser(res.data.user);
        authStorage.setUser(res.data.user);
        setProfileMsg({
          type: 'success',
          text: 'Profile details successfully updated.',
        });
      } else {
        setProfileMsg({
          type: 'error',
          text: res.error?.message || 'Failed to update profile.',
        });
      }
    } catch (err: any) {
      setProfileMsg({
        type: 'error',
        text: err.message || 'An error occurred while updating profile.',
      });
    } finally {
      setSavingProfile(false);
    }
  };

  // Update Password
  const passwordStrength = (() => {
    if (!newPassword) return 0;
    let score = 0;
    if (newPassword.length >= 8) score++;
    if (/[A-Z]/.test(newPassword)) score++;
    if (/[0-9]/.test(newPassword)) score++;
    if (/[^A-Za-z0-9]/.test(newPassword)) score++;
    return score;
  })();

  const strengthLabel = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong'][passwordStrength];

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (newPassword !== confirmPassword) {
      setPasswordMsg({
        type: 'error',
        text: 'New passwords do not match.',
      });
      return;
    }

    if (newPassword.length < 8) {
      setPasswordMsg({
        type: 'error',
        text: 'New password must be at least 8 characters long.',
      });
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordMsg({
        type: 'error',
        text: 'Your new password must be different from your current password.',
      });
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
        setPasswordMsg({
          type: 'success',
          text: 'Your password has been successfully updated.',
        });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordMsg({
          type: 'error',
          text: res.error?.message || 'Failed to update password.',
        });
      }
    } catch (err: any) {
      setPasswordMsg({
        type: 'error',
        text: err.message || 'An error occurred while updating password.',
      });
    } finally {
      setChangingPassword(false);
    }
  };

  // Sign Out
  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);

    try {
      await fetchApi('/api/v1/auth/logout', {
        method: 'POST',
      });
    } catch {
      // Continue clearing local state
    }

    authStorage.clear();
    router.push('/login');
  };

  // Delete Account
  const handleDeleteAccount = async () => {
    if (deleteConfirmationText !== 'DELETE') {
      setDeleteError('Please type DELETE to confirm.');
      return;
    }

    setDeletingAccount(true);
    setDeleteError(null);

    try {
      const res = await fetchApi('/api/v1/auth/account', {
        method: 'DELETE',
      });

      if (res.success) {
        authStorage.clear();
        router.push('/login');
      } else {
        setDeleteError(res.error?.message || 'Failed to delete account.');
        setDeletingAccount(false);
      }
    } catch (err: any) {
      setDeleteError(err.message || 'Network error while deleting account.');
      setDeletingAccount(false);
    }
  };

  const initials = user?.name
    ? user.name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase()
    : 'DV';

  const accountCreated = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : 'Active';

  if (loading && !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 text-[var(--muted)]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
        <p className="text-xs font-semibold">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16 text-[var(--foreground)]">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <span className="text-xs font-mono font-bold tracking-wider uppercase text-[var(--primary)]">
            ACCOUNT MANAGEMENT
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--foreground)] mt-1">
            My Profile
          </h1>
          <p className="text-xs md:text-sm text-[var(--muted)] mt-1">
            Manage your personal profile, credentials security, sessions, and account options.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="px-4 py-2.5 rounded-xl bg-[var(--danger)]/10 hover:bg-[var(--danger)]/20 text-[var(--danger)] font-semibold text-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            {loggingOut ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <LogOut className="w-4 h-4" />
            )}
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* 2. Overview Card */}
      <section className="p-6 rounded-2xl bg-[var(--card)] shadow-[var(--shadow)] flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-[var(--primary)] text-white font-extrabold text-xl flex items-center justify-center shadow-lg shadow-[var(--primary)]/20 shrink-0">
            {initials}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-[var(--foreground)]">
                {user?.name || 'Developer'}
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-[var(--primary)]/15 text-[var(--primary)] text-[10px] font-bold uppercase tracking-wider">
                {user?.role || 'DEVELOPER'}
              </span>
            </div>

            <p className="text-xs text-[var(--muted)]">{user?.email}</p>

            <div className="flex items-center gap-3 pt-1">
              {user?.isVerified ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--success)]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Email Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-500">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Verification Pending
                </span>
              )}
              <span className="text-[var(--muted)] text-xs">&bull;</span>
              <span className="text-[11px] text-[var(--muted)]">Member since {accountCreated}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-center bg-[var(--surface-secondary)] px-3 py-1.5 rounded-xl">
          <span className="w-2 h-2 rounded-full bg-[var(--success)] shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
          <span className="text-xs font-semibold text-[var(--foreground)]">Account Active</span>
        </div>
      </section>

      {/* 3. Personal Information Form */}
      <section className="rounded-2xl bg-[var(--card)] shadow-[var(--shadow)] overflow-hidden">
        <div className="px-6 py-5 flex items-center justify-between border-b border-[var(--border)]">
          <div>
            <h2 className="text-base font-bold text-[var(--foreground)] flex items-center gap-2">
              <UserCircle className="w-4 h-4 text-[var(--primary)]" />
              Personal Information
            </h2>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              Update your registered developer profile details.
            </p>
          </div>
        </div>

        <form onSubmit={handleUpdateProfile} className="p-6 space-y-5">
          {profileMsg && (
            <div
              className={`p-3.5 rounded-xl text-xs font-medium flex items-center gap-2 ${
                profileMsg.type === 'success'
                  ? 'bg-[var(--success)]/10 text-[var(--success)]'
                  : 'bg-[var(--danger)]/10 text-[var(--danger)]'
              }`}
            >
              {profileMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{profileMsg.text}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--foreground)] mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                className="w-full px-4 py-2.5 bg-[var(--surface-input)] rounded-xl text-xs text-[var(--foreground)] placeholder:text-[var(--muted)] outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
              />
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--foreground)] mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-[var(--muted)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={phoneNo}
                  onChange={(e) => setPhoneNo(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full pl-10 pr-4 py-2.5 bg-[var(--surface-input)] rounded-xl text-xs text-[var(--foreground)] placeholder:text-[var(--muted)] outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
                />
              </div>
            </div>

            {/* Email (Read Only) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]">
                  Email Address
                </label>
                <span className="text-[10px] text-[var(--muted)]">Read-only</span>
              </div>
              <div className="relative">
                <Mail className="w-4 h-4 text-[var(--muted)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full pl-10 pr-4 py-2.5 bg-[var(--surface-secondary)]/50 rounded-xl text-xs text-[var(--muted)] cursor-not-allowed outline-none"
                />
              </div>
            </div>

            {/* User ID (Read Only + Copy) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]">
                  Developer ID
                </label>
                <button
                  type="button"
                  onClick={handleCopyUserId}
                  className="text-[10px] text-[var(--primary)] hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  {copiedId ? <Check className="w-3 h-3 text-[var(--success)]" /> : <Copy className="w-3 h-3" />}
                  {copiedId ? 'Copied' : 'Copy ID'}
                </button>
              </div>
              <div className="relative">
                <Key className="w-4 h-4 text-[var(--muted)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  disabled
                  value={user?.user_id || user?._id || ''}
                  className="w-full pl-10 pr-4 py-2.5 bg-[var(--surface-secondary)]/50 rounded-xl text-xs font-mono text-[var(--muted)] cursor-not-allowed outline-none"
                />
              </div>
            </div>
          </div>

          <div className="pt-3 flex justify-end">
            <button
              type="submit"
              disabled={savingProfile}
              className="px-5 py-2.5 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-[var(--primary)]/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {savingProfile ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  Save Profile Details
                </>
              )}
            </button>
          </div>
        </form>
      </section>

      {/* 4. Update Password Section */}
      <section className="rounded-2xl bg-[var(--card)] shadow-[var(--shadow)] overflow-hidden">
        <div className="px-6 py-5 flex items-center justify-between border-b border-[var(--border)]">
          <div>
            <h2 className="text-base font-bold text-[var(--foreground)] flex items-center gap-2">
              <Lock className="w-4 h-4 text-[var(--primary)]" />
              Change Password
            </h2>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              Secure your account credentials by updating your password periodically.
            </p>
          </div>
        </div>

        <form onSubmit={handleChangePassword} className="p-6 space-y-5">
          {passwordMsg && (
            <div
              className={`p-3.5 rounded-xl text-xs font-medium flex items-center gap-2 ${
                passwordMsg.type === 'success'
                  ? 'bg-[var(--success)]/10 text-[var(--success)]'
                  : 'bg-[var(--danger)]/10 text-[var(--danger)]'
              }`}
            >
              {passwordMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{passwordMsg.text}</span>
            </div>
          )}

          <div className="max-w-xl space-y-4">
            {/* Current Password */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--foreground)] mb-1.5">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full px-4 py-2.5 pr-11 bg-[var(--surface-input)] rounded-xl text-xs text-[var(--foreground)] placeholder:text-[var(--muted)] outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[var(--muted)] hover:text-[var(--foreground)]"
                >
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--foreground)] mb-1.5">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="w-full px-4 py-2.5 pr-11 bg-[var(--surface-input)] rounded-xl text-xs text-[var(--foreground)] placeholder:text-[var(--muted)] outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[var(--muted)] hover:text-[var(--foreground)]"
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {newPassword && (
                <div className="mt-2.5">
                  <div className="flex items-center justify-between text-[11px] mb-1.5">
                    <span className="text-[var(--muted)]">Password strength:</span>
                    <span className="font-semibold text-[var(--foreground)]">{strengthLabel}</span>
                  </div>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`h-1.5 flex-1 rounded-full transition-colors ${
                          passwordStrength >= level
                            ? 'bg-[var(--success)]'
                            : 'bg-[var(--surface-secondary)]'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--foreground)] mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full px-4 py-2.5 pr-11 bg-[var(--surface-input)] rounded-xl text-xs text-[var(--foreground)] placeholder:text-[var(--muted)] outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[var(--muted)] hover:text-[var(--foreground)]"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {confirmPassword && (
                <div
                  className={`mt-2 flex items-center gap-1.5 text-[11px] ${
                    newPassword === confirmPassword ? 'text-[var(--success)]' : 'text-[var(--danger)]'
                  }`}
                >
                  {newPassword === confirmPassword ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5" />
                  )}
                  <span>{newPassword === confirmPassword ? 'Passwords match' : 'Passwords do not match'}</span>
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 flex justify-end">
            <button
              type="submit"
              disabled={
                changingPassword ||
                !currentPassword ||
                !newPassword ||
                !confirmPassword ||
                newPassword !== confirmPassword
              }
              className="px-5 py-2.5 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-[var(--primary)]/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {changingPassword ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Updating Password...
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  Update Password
                </>
              )}
            </button>
          </div>
        </form>
      </section>

      {/* 5. Session Sign Out Card */}
      <section className="rounded-2xl bg-[var(--card)] shadow-[var(--shadow)] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div>
          <h2 className="text-base font-bold text-[var(--foreground)] flex items-center gap-2">
            <LogOut className="w-4 h-4 text-[var(--primary)]" />
            Sign Out of OneAPI
          </h2>
          <p className="text-xs text-[var(--muted)] mt-1 max-w-lg">
            End your current active session on this device. You will be redirected to the login screen and will need your credentials to sign back in.
          </p>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="px-5 py-2.5 rounded-xl bg-[var(--surface-secondary)] hover:bg-[var(--surface-secondary)]/80 text-[var(--foreground)] font-semibold text-xs flex items-center gap-2 transition-all cursor-pointer shrink-0"
        >
          {loggingOut ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <LogOut className="w-4 h-4" />
          )}
          <span>Sign Out</span>
        </button>
      </section>

      {/* 6. Danger Zone: Delete Account */}
      <section className="rounded-2xl bg-[var(--danger)]/5 shadow-[var(--shadow)] p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-[var(--danger)] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Delete Account
            </h2>
            <p className="text-xs text-[var(--muted)] max-w-xl leading-relaxed">
              Permanently delete your account along with all of your isolated projects, active API keys, secret credentials in the vault, routing rules, and proxy request logs. This action is irreversible.
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
            <span>Delete Account</span>
          </button>
        </div>
      </section>

      {/* Delete Account Confirmation Modal */}
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
                Are you absolutely sure?
              </h3>
              <p className="text-xs text-[var(--muted)] mt-1.5 leading-relaxed">
                This action cannot be undone. This will permanently delete your OneAPI account, revoke all API keys, clear your credentials vault, and wipe all proxy telemetry logs.
              </p>
            </div>

            {deleteError && (
              <div className="p-3 rounded-xl bg-[var(--danger)]/10 text-[var(--danger)] text-xs font-medium">
                {deleteError}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[var(--muted)] mb-1.5">
                Type <strong className="text-[var(--danger)]">DELETE</strong> to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                placeholder="DELETE"
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
                onClick={handleDeleteAccount}
                disabled={deletingAccount || deleteConfirmationText !== 'DELETE'}
                className="px-5 py-2.5 rounded-xl bg-[var(--danger)] hover:bg-[var(--danger)]/90 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-[var(--danger)]/20 cursor-pointer"
              >
                {deletingAccount ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    Permanently Delete
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
