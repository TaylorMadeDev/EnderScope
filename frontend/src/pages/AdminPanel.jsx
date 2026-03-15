import { useEffect, useMemo, useState } from 'react';
import {
  ShieldCheck,
  Users2,
  Boxes,
  Crown,
  Save,
  Loader2,
  Sparkles,
  BadgeCheck,
} from 'lucide-react';
import { getPlanMeta, getRoleMeta, planCatalog, roleCatalog } from '../utils/accountAccess';
import { useAuth } from '../contexts/AuthContext';

const adminTabs = [
  { id: 'membership', label: 'Membership Console', icon: Users2 },
  { id: 'tiers', label: 'Plans & Roles', icon: Boxes },
  { id: 'overview', label: 'Overview', icon: ShieldCheck },
];

export default function AdminPanel() {
  const { user, checkSession } = useAuth();
  const [activeTab, setActiveTab] = useState('membership');
  const [accessMeta, setAccessMeta] = useState({
    plans: planCatalog.map((plan) => plan.key),
    roles: roleCatalog.map((role) => role.key),
  });
  const [memberRoster, setMemberRoster] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingAccessId, setSavingAccessId] = useState(null);
  const [message, setMessage] = useState('');

  const requestAuth = async (path, options = {}) => {
    const res = await fetch(path, {
      credentials: 'include',
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || data.detail || 'Request failed.');
    }
    return data;
  };

  useEffect(() => {
    let cancelled = false;

    const loadAdminData = async () => {
      try {
        const [metaData, usersData] = await Promise.all([
          requestAuth('/auth/access-meta'),
          requestAuth('/auth/admin/users'),
        ]);

        if (!cancelled) {
          setAccessMeta({
            plans: metaData.plans || planCatalog.map((plan) => plan.key),
            roles: metaData.roles || roleCatalog.map((role) => role.key),
          });
          setMemberRoster(usersData.users || []);
        }
      } catch (error) {
        if (!cancelled) {
          setMessage(error.message || 'Failed to load admin workspace.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadAdminData();

    return () => {
      cancelled = true;
    };
  }, []);

  const adminStats = useMemo(() => {
    const countsByPlan = accessMeta.plans.reduce((acc, planKey) => {
      acc[planKey] = memberRoster.filter((member) => member.plan === planKey).length;
      return acc;
    }, {});

    const countsByRole = accessMeta.roles.reduce((acc, roleKey) => {
      acc[roleKey] = memberRoster.filter((member) => member.role === roleKey).length;
      return acc;
    }, {});

    return {
      totalUsers: memberRoster.length,
      countsByPlan,
      countsByRole,
      newestUsers: [...memberRoster]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 4),
    };
  }, [accessMeta.plans, accessMeta.roles, memberRoster]);

  const updateRosterField = (targetId, field, value) => {
    setMemberRoster((current) =>
      current.map((member) =>
        member.id === targetId ? { ...member, [field]: value } : member
      )
    );
  };

  const saveMemberAccess = async (member) => {
    setSavingAccessId(member.id);
    setMessage('');

    try {
      const data = await requestAuth(`/auth/admin/users/${member.id}/access`, {
        method: 'PUT',
        body: JSON.stringify({
          plan: member.plan,
          role: member.role,
        }),
      });

      setMemberRoster((current) =>
        current.map((entry) => (entry.id === member.id ? { ...entry, ...data.user } : entry))
      );

      if (member.id === user?.id) {
        await checkSession();
      }

      setMessage(`Updated ${member.username}'s admin access.`);
    } catch (error) {
      setMessage(error.message || 'Failed to update membership.');
    } finally {
      setSavingAccessId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Loading admin workspace...
      </div>
    );
  }

  return (
    <div className="max-w-6xl admin-page">
      <section className="admin-hero glass rounded-[28px] p-6 lg:p-8">
        <div className="admin-hero-orb admin-hero-orb-left" />
        <div className="admin-hero-orb admin-hero-orb-right" />
        <div className="relative z-10">
          <div className="account-kicker">Admin workspace</div>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between mt-3">
            <div>
              <h1 className="account-title">EnderScope Control Room</h1>
              <p className="account-subtitle">
                Manage memberships, account types, and platform access from a dedicated admin surface.
              </p>
            </div>
            <div className="account-provider-row">
              <span className="account-pill success">
                <Crown className="w-3.5 h-3.5" />
                Admin access active
              </span>
              <span className="account-pill subtle">
                <Users2 className="w-3.5 h-3.5" />
                {adminStats.totalUsers} members
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="settings-toolbar glass-strong rounded-2xl p-2 mb-6 mt-6">
        <div className="settings-toolbar-scroll">
          {adminTabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`settings-tab ${activeTab === id ? 'active' : ''}`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {message && (
        <div className={`mb-5 rounded-2xl border px-4 py-3 text-sm ${
          message.startsWith('Updated')
            ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200'
            : 'border-rose-400/20 bg-rose-500/10 text-rose-200'
        }`}>
          {message}
        </div>
      )}

      {activeTab === 'membership' && (
        <section className="glass rounded-[24px] p-6 account-panel">
          <div className="account-panel-head">
            <div>
              <h2 className="settings-panel-title">Membership Console</h2>
              <p className="settings-panel-copy">
                Assign Minecraft block memberships and account types for every user in the system.
              </p>
            </div>
            <span className="account-security-status">
              <ShieldCheck className="w-4 h-4" />
              Admin only
            </span>
          </div>

          <div className="space-y-4 mt-6">
            {memberRoster.map((member) => {
              const memberPlan = getPlanMeta(member.plan);
              const memberRole = getRoleMeta(member.role);

              return (
                <div
                  key={member.id}
                  className="admin-member-card rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-4 backdrop-blur-xl"
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-12 h-12 rounded-2xl border border-white/10 bg-white/[0.06] overflow-hidden flex items-center justify-center text-sm font-semibold text-white/85 shrink-0">
                        {member.avatar ? (
                          <img src={member.avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          member.username.slice(0, 2).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="font-semibold text-white/90">{member.username}</div>
                          {member.id === user?.id && (
                            <span className="rounded-full border border-purple-400/25 bg-purple-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-purple-200">
                              You
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-400 truncate">{member.email}</div>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[11px] text-gray-300">
                            {memberPlan.name}
                          </span>
                          <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[11px] text-gray-300">
                            {memberRole.name}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      className="btn btn-secondary shrink-0"
                      onClick={() => saveMemberAccess(member)}
                      disabled={savingAccessId === member.id}
                    >
                      {savingAccessId === member.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      {savingAccessId === member.id ? 'Saving...' : 'Save access'}
                    </button>
                  </div>

                  <div className="grid gap-4 mt-4 lg:grid-cols-2">
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gray-500 mb-2">
                        Membership
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {accessMeta.plans.map((planKey) => {
                          const plan = getPlanMeta(planKey);
                          const selected = member.plan === plan.key;

                          return (
                            <button
                              type="button"
                              key={plan.key}
                              onClick={() => updateRosterField(member.id, 'plan', plan.key)}
                              className={`rounded-2xl border px-3 py-3 text-left transition-all duration-200 ${
                                selected
                                  ? 'border-purple-400/45 bg-purple-500/14 shadow-[0_10px_30px_rgba(139,92,246,0.18)]'
                                  : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <img src={plan.image} alt="" className="w-10 h-10 object-contain shrink-0" />
                                <div>
                                  <div className="font-medium text-white/90">{plan.name}</div>
                                  <div className="text-xs text-gray-400">{plan.price}{plan.period}</div>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gray-500 mb-2">
                        Account Type
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {accessMeta.roles.map((roleKey) => {
                          const role = getRoleMeta(roleKey);
                          const selected = member.role === role.key;

                          return (
                            <button
                              type="button"
                              key={role.key}
                              onClick={() => updateRosterField(member.id, 'role', role.key)}
                              className={`rounded-2xl border px-3 py-3 text-left transition-all duration-200 ${
                                selected
                                  ? 'border-cyan-300/40 bg-cyan-400/12 shadow-[0_10px_30px_rgba(34,211,238,0.16)]'
                                  : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]'
                              }`}
                            >
                              <div className="font-medium text-white/90">{role.name}</div>
                              <div className="text-xs text-gray-400 mt-1">{role.description}</div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {!memberRoster.length && (
              <div className="rounded-[20px] border border-dashed border-white/10 bg-white/[0.02] px-4 py-6 text-sm text-gray-400">
                No accounts found yet. Once more players register, they will appear here.
              </div>
            )}
          </div>
        </section>
      )}

      {activeTab === 'tiers' && (
        <section className="glass rounded-[24px] p-6 account-panel">
          <div className="account-panel-head">
            <div>
              <h2 className="settings-panel-title">Plans &amp; Roles</h2>
              <p className="settings-panel-copy">
                A quick reference for all membership tiers and account types available in EnderScope.
              </p>
            </div>
            <span className="account-security-status">
              <Sparkles className="w-4 h-4" />
              Reference
            </span>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.4fr)_minmax(260px,0.85fr)] gap-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {planCatalog.map((plan) => (
                <div key={plan.key} className="admin-tier-card rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-xs uppercase tracking-[0.24em] text-gray-500 font-semibold">
                        {plan.tagline}
                      </div>
                      <div className="text-lg font-semibold text-white/90 mt-2">{plan.name}</div>
                      <div className="text-sm text-purple-200 mt-1">{plan.price}{plan.period}</div>
                    </div>
                    <img src={plan.image} alt={`${plan.name} block`} className="w-16 h-16 object-contain shrink-0" />
                  </div>
                  <p className="text-sm text-gray-400 mt-3 leading-relaxed">{plan.description}</p>
                  <div className="grid gap-2 mt-4">
                    {plan.features.slice(0, 3).map((feature) => (
                      <div key={feature} className="rounded-2xl border border-white/8 bg-white/[0.04] px-3 py-2 text-sm text-gray-300">
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              {roleCatalog.map((role) => {
                const count = adminStats.countsByRole[role.key] || 0;

                return (
                  <div key={role.key} className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-base font-semibold text-white/90">{role.name}</div>
                      <span className="account-pill subtle">{count} users</span>
                    </div>
                    <p className="text-sm text-gray-400 mt-2 leading-relaxed">{role.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {activeTab === 'overview' && (
        <section className="glass rounded-[24px] p-6 account-panel">
          <div className="account-panel-head">
            <div>
              <h2 className="settings-panel-title">Overview</h2>
              <p className="settings-panel-copy">
                Snapshot of the current user base and access distribution.
              </p>
            </div>
            <span className="account-security-status">
              <BadgeCheck className="w-4 h-4" />
              Live from database
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="account-stat-card">
              <div className="account-stat-label">Total users</div>
              <div className="account-stat-value text-2xl">{adminStats.totalUsers}</div>
            </div>
            <div className="account-stat-card">
              <div className="account-stat-label">Admins</div>
              <div className="account-stat-value text-2xl">{adminStats.countsByRole.admin || 0}</div>
            </div>
            <div className="account-stat-card">
              <div className="account-stat-label">Paying tiers</div>
              <div className="account-stat-value text-2xl">
                {(adminStats.countsByPlan.iron || 0) + (adminStats.countsByPlan.diamond || 0) + (adminStats.countsByPlan.netherite || 0)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-6 mt-6">
            <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
              <div className="text-xs uppercase tracking-[0.24em] text-gray-500 font-semibold">
                Membership spread
              </div>
              <div className="space-y-3 mt-4">
                {accessMeta.plans.map((planKey) => {
                  const plan = getPlanMeta(planKey);
                  const count = adminStats.countsByPlan[planKey] || 0;
                  const width = adminStats.totalUsers ? `${Math.max((count / adminStats.totalUsers) * 100, count ? 12 : 0)}%` : '0%';

                  return (
                    <div key={plan.key}>
                      <div className="flex items-center justify-between gap-3 mb-1.5">
                        <div className="flex items-center gap-2 text-sm text-white/90">
                          <img src={plan.image} alt="" className="w-6 h-6 object-contain" />
                          {plan.name}
                        </div>
                        <div className="text-xs text-gray-400">{count} users</div>
                      </div>
                      <div className="h-2 rounded-full bg-white/[0.05] overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-purple-400 to-cyan-300 transition-all duration-500" style={{ width }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
              <div className="text-xs uppercase tracking-[0.24em] text-gray-500 font-semibold">
                Newest accounts
              </div>
              <div className="space-y-3 mt-4">
                {adminStats.newestUsers.map((member) => (
                  <div key={member.id} className="rounded-2xl border border-white/8 bg-white/[0.04] px-3 py-3">
                    <div className="font-medium text-white/90">{member.username}</div>
                    <div className="text-xs text-gray-400 mt-1">{member.email}</div>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="account-pill subtle">{getPlanMeta(member.plan).name}</span>
                      <span className="account-pill subtle">{getRoleMeta(member.role).name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
