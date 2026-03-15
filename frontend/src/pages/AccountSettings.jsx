import { useEffect, useMemo, useState } from 'react';
import {
  Loader2,
  Save,
  Shield,
  Mail,
  UserRound,
  Sparkles,
  KeyRound,
  BadgeCheck,
  LogOut,
  Eye,
  EyeOff,
  Link2,
  Boxes,
  Crown,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getPlanMeta, getRoleMeta } from '../utils/accountAccess';

function SecretField({
  label,
  value,
  onChange,
  placeholder,
  autoComplete,
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label className="block text-xs text-gray-500 font-medium mb-1.5">{label}</label>
      <div className="settings-secret-shell">
        <input
          className="input settings-secret-input"
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
        />
        <button
          type="button"
          className="settings-secret-toggle"
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          <span>{visible ? 'Hide' : 'Show'}</span>
        </button>
      </div>
    </div>
  );
}

function formatTimestamp(value) {
  if (!value) {
    return 'Unknown';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 'Unknown';
  }

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(parsed);
}

export default function AccountSettings() {
  const { user, logout, checkSession } = useAuth();
  const [account, setAccount] = useState(null);
  const [profile, setProfile] = useState({ username: '', avatar: '' });
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const [securityMessage, setSecurityMessage] = useState('');
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    let cancelled = false;

    const loadAccount = async () => {
      try {
        const res = await fetch('/auth/account', { credentials: 'include' });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to load account.');
        }

        if (!cancelled) {
          setAccount(data.account);
          setProfile({
            username: data.account.username || '',
            avatar: data.account.avatar || '',
          });
        }
      } catch (error) {
        if (!cancelled) {
          setProfileMessage(error.message || 'Failed to load account.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadAccount();

    return () => {
      cancelled = true;
    };
  }, []);

  const avatarFallback = useMemo(() => {
    return (profile.username || user?.username || 'ES').slice(0, 2).toUpperCase();
  }, [profile.username, user?.username]);

  const providerSummary = useMemo(() => {
    if (!account) {
      return [];
    }

    const providers = [];
    if (account.hasGoogle) {
      providers.push({ label: 'Google connected', tone: 'success' });
    }
    if (account.hasPassword) {
      providers.push({ label: 'Password login enabled', tone: 'default' });
    }
    if (!providers.length) {
      providers.push({ label: 'Session only', tone: 'default' });
    }
    return providers;
  }, [account]);

  const activePlan = getPlanMeta(account?.plan || user?.plan);
  const activeRole = getRoleMeta(account?.role || user?.role);

  const saveProfile = async () => {
    setSavingProfile(true);
    setProfileMessage('');

    try {
      const res = await fetch('/auth/account', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          username: profile.username,
          avatar: profile.avatar,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update profile.');
      }

      setAccount(data.account);
      setProfile({
        username: data.account.username || '',
        avatar: data.account.avatar || '',
      });
      await checkSession();
      setProfileMessage('Profile updated.');
    } catch (error) {
      setProfileMessage(error.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async () => {
    if (passwordForm.newPassword.length < 8) {
      setSecurityMessage('New password must be at least 8 characters.');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setSecurityMessage('New password and confirmation do not match.');
      return;
    }

    setSavingPassword(true);
    setSecurityMessage('');

    try {
      const res = await fetch('/auth/account/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          current_password: passwordForm.currentPassword,
          new_password: passwordForm.newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update password.');
      }

      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setAccount((current) =>
        current ? { ...current, hasPassword: true } : current
      );
      setSecurityMessage('Password updated.');
    } catch (error) {
      setSecurityMessage(error.message || 'Failed to update password.');
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Loading account settings...
      </div>
    );
  }

  return (
    <div className="max-w-6xl account-settings-page">
      <section className="account-hero glass rounded-[28px] p-6 lg:p-8">
        <div className="account-hero-orb account-hero-orb-left" />
        <div className="account-hero-orb account-hero-orb-right" />
        <div className="account-hero-content">
          <div className="account-hero-id">
            <div className="account-hero-avatar">
              {profile.avatar ? (
                <img src={profile.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                avatarFallback
              )}
            </div>
            <div>
              <div className="account-kicker">Account settings</div>
              <h1 className="account-title">{profile.username || user?.username}</h1>
              <p className="account-subtitle">
                Manage your personal identity, membership, security, and sign-in methods for EnderScope.
              </p>
            </div>
          </div>

          <div className="account-provider-row">
            <span className="account-pill subtle">
              <Boxes className="w-3.5 h-3.5" />
              Membership: {activePlan.name}
            </span>
            <span className={`account-pill ${activeRole.key === 'admin' ? 'success' : ''}`}>
              <Crown className="w-3.5 h-3.5" />
              Account Type: {activeRole.name}
            </span>
            {providerSummary.map((provider) => (
              <span
                key={provider.label}
                className={`account-pill ${provider.tone === 'success' ? 'success' : ''}`}
              >
                {provider.tone === 'success' ? <BadgeCheck className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
                {provider.label}
              </span>
            ))}
            <span className="account-pill subtle">
              <Mail className="w-3.5 h-3.5" />
              {account?.email || user?.email}
            </span>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.15fr)_360px] gap-6 mt-6">
        <div className="space-y-6">
          <section className="glass rounded-[24px] p-6 account-panel account-panel-delay-1">
            <div className="account-panel-head">
              <div>
                <h2 className="settings-panel-title">Profile</h2>
                <p className="settings-panel-copy">
                  Update the name and avatar the dashboard uses while you are signed in.
                </p>
              </div>
              <button className="btn btn-primary" onClick={saveProfile} disabled={savingProfile}>
                {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {savingProfile ? 'Saving...' : 'Save profile'}
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)] gap-6 mt-6">
              <div className="account-preview-card">
                <div className="account-preview-avatar">
                  {profile.avatar ? (
                    <img src={profile.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    avatarFallback
                  )}
                </div>
                <div className="account-preview-name">{profile.username || 'Username'}</div>
                <div className="account-preview-email">{account?.email || user?.email}</div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-500 font-medium mb-1.5">Display name</label>
                  <input
                    className="input"
                    value={profile.username}
                    onChange={(event) =>
                      setProfile((current) => ({ ...current, username: event.target.value }))
                    }
                    placeholder="Your display name"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-500 font-medium mb-1.5">Email address</label>
                  <input className="input opacity-80" value={account?.email || user?.email || ''} disabled />
                </div>

                <div>
                  <label className="block text-xs text-gray-500 font-medium mb-1.5">Avatar URL</label>
                  <input
                    className="input"
                    value={profile.avatar}
                    onChange={(event) =>
                      setProfile((current) => ({ ...current, avatar: event.target.value }))
                    }
                    placeholder="https://..."
                  />
                </div>

                {profileMessage && (
                  <p className={`text-sm ${profileMessage.includes('updated') ? 'text-emerald-300' : 'text-rose-300'}`}>
                    {profileMessage}
                  </p>
                )}
              </div>
            </div>
          </section>

          <section className="glass rounded-[24px] p-6 account-panel account-panel-delay-2">
            <div className="account-panel-head">
              <div>
                <h2 className="settings-panel-title">Security</h2>
                <p className="settings-panel-copy">
                  Keep a password on the account even if you mostly sign in with Google.
                </p>
              </div>
              <span className="account-security-status">
                <Shield className="w-4 h-4" />
                {account?.hasPassword ? 'Password active' : 'Password not set'}
              </span>
            </div>

            <div className="space-y-4 mt-6">
              {account?.hasPassword && (
                <SecretField
                  label="Current password"
                  value={passwordForm.currentPassword}
                  onChange={(event) =>
                    setPasswordForm((current) => ({
                      ...current,
                      currentPassword: event.target.value,
                    }))
                  }
                  placeholder="Enter your current password"
                  autoComplete="current-password"
                />
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SecretField
                  label={account?.hasPassword ? 'New password' : 'Create password'}
                  value={passwordForm.newPassword}
                  onChange={(event) =>
                    setPasswordForm((current) => ({
                      ...current,
                      newPassword: event.target.value,
                    }))
                  }
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                />
                <SecretField
                  label="Confirm password"
                  value={passwordForm.confirmPassword}
                  onChange={(event) =>
                    setPasswordForm((current) => ({
                      ...current,
                      confirmPassword: event.target.value,
                    }))
                  }
                  placeholder="Repeat your new password"
                  autoComplete="new-password"
                />
              </div>

              <div className="flex items-center justify-between gap-4 pt-1">
                <p className="text-sm text-gray-500">
                  Passwords are only required if one is already enabled or you want a backup sign-in method.
                </p>
                <button className="btn btn-secondary" onClick={savePassword} disabled={savingPassword}>
                  {savingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                  {savingPassword ? 'Updating...' : account?.hasPassword ? 'Change password' : 'Set password'}
                </button>
              </div>

              {securityMessage && (
                <p className={`text-sm ${securityMessage.includes('updated') ? 'text-emerald-300' : 'text-rose-300'}`}>
                  {securityMessage}
                </p>
              )}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="glass rounded-[24px] p-6 account-panel account-panel-delay-3">
            <div className="account-side-title">
              <Sparkles className="w-4 h-4 text-purple-300" />
              Overview
            </div>
            <div className="account-stat-list mt-5">
              <div className="account-stat-card">
                <div className="account-stat-label">Joined</div>
                <div className="account-stat-value">{formatTimestamp(account?.createdAt)}</div>
              </div>
              <div className="account-stat-card">
                <div className="account-stat-label">Updated</div>
                <div className="account-stat-value">{formatTimestamp(account?.updatedAt)}</div>
              </div>
              <div className="account-stat-card">
                <div className="account-stat-label">Membership</div>
                <div className="account-stat-value">{activePlan.name}</div>
              </div>
              <div className="account-stat-card">
                <div className="account-stat-label">Account type</div>
                <div className="account-stat-value">{activeRole.name}</div>
              </div>
              <div className="account-stat-card">
                <div className="account-stat-label">Primary sign-in</div>
                <div className="account-stat-value">
                  {account?.hasGoogle ? 'Google + session' : account?.hasPassword ? 'Email + password' : 'Session'}
                </div>
              </div>
            </div>
          </section>

          <section className="glass rounded-[24px] p-6 account-panel account-panel-delay-4">
            <div className="account-side-title">
              <Boxes className="w-4 h-4 text-purple-300" />
              Membership
            </div>
            <div className="mt-5 rounded-[24px] border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-[0.24em] text-gray-500 font-semibold">
                    {activePlan.tagline}
                  </div>
                  <div className="text-xl font-semibold text-white/90 mt-2">
                    {activePlan.name} plan
                  </div>
                  <p className="text-sm text-gray-400 mt-2 leading-relaxed">
                    {activePlan.description}
                  </p>
                </div>
                <img src={activePlan.image} alt={`${activePlan.name} block`} className="w-20 h-20 object-contain shrink-0" />
              </div>
              <div className="grid grid-cols-1 gap-2 mt-4">
                {activePlan.features.slice(0, 3).map((feature) => (
                  <div key={feature} className="rounded-2xl border border-white/8 bg-white/[0.04] px-3 py-2 text-sm text-gray-300">
                    {feature}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="glass rounded-[24px] p-6 account-panel account-panel-delay-4">
            <div className="account-side-title">
              <Crown className="w-4 h-4 text-purple-300" />
              Account Type
            </div>
            <div className="mt-5 rounded-[24px] border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-[0.24em] text-gray-500 font-semibold">
                    Access tier
                  </div>
                  <div className="text-xl font-semibold text-white/90 mt-2">
                    {activeRole.name}
                  </div>
                  <p className="text-sm text-gray-400 mt-2 leading-relaxed">
                    {activeRole.description}
                  </p>
                </div>
                <div className={`account-pill ${activeRole.key === 'admin' ? 'success' : ''}`}>
                  <Crown className="w-3.5 h-3.5" />
                  {activeRole.name}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-2 mt-4">
                <div className="rounded-2xl border border-white/8 bg-white/[0.04] px-3 py-2 text-sm text-gray-300">
                  Membership tier: <span className="text-white/90 font-medium">{activePlan.name}</span>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/[0.04] px-3 py-2 text-sm text-gray-300">
                  Permissions: <span className="text-white/90 font-medium">{activeRole.name}</span>
                </div>
              </div>
            </div>
          </section>

          <section className="glass rounded-[24px] p-6 account-panel account-panel-delay-4">
            <div className="account-side-title">
              <Link2 className="w-4 h-4 text-purple-300" />
              Linked access
            </div>
            <div className="space-y-3 mt-5">
              <div className="account-link-card">
                <div>
                  <div className="account-link-title">Google</div>
                  <div className="account-link-copy">
                    {account?.hasGoogle ? 'Connected and ready for one-tap sign in.' : 'Not connected yet.'}
                  </div>
                </div>
                <span className={`account-link-badge ${account?.hasGoogle ? 'success' : ''}`}>
                  {account?.hasGoogle ? 'Linked' : 'Unavailable'}
                </span>
              </div>
              <div className="account-link-card">
                <div>
                  <div className="account-link-title">Password</div>
                  <div className="account-link-copy">
                    {account?.hasPassword ? 'Backup sign-in is enabled on this account.' : 'Set one below for backup access.'}
                  </div>
                </div>
                <span className={`account-link-badge ${account?.hasPassword ? 'success' : ''}`}>
                  {account?.hasPassword ? 'Enabled' : 'Optional'}
                </span>
              </div>
            </div>
          </section>

          <section className="glass rounded-[24px] p-6 account-panel account-panel-delay-5">
            <div className="account-side-title">
              <UserRound className="w-4 h-4 text-purple-300" />
              Session actions
            </div>
            <p className="settings-panel-copy mt-4">
              Sign out of the current browser session whenever you want to hand off the machine or reset access.
            </p>
            <button className="btn btn-secondary w-full mt-5 justify-center" onClick={logout}>
              <LogOut className="w-4 h-4" />
              Sign out here
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
