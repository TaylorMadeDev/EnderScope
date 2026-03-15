import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Globe, Unlock, Lock, Activity, Search, Zap, Shield, ArrowRight } from 'lucide-react';
import api from '../utils/api';

const statCards = [
  { key: 'servers_discovered', label: 'Servers Found',  icon: Globe,   color: 'purple' },
  { key: 'open_servers',       label: 'Open Servers',   icon: Unlock,  color: 'cyan' },
  { key: 'whitelisted',        label: 'Whitelisted',    icon: Lock,    color: 'rose' },
  { key: 'scans_completed',    label: 'Scans Run',      icon: Activity, color: 'violet' },
];

const colorMap = {
  purple:  { icon: 'text-purple-400',  bg: 'bg-purple-500/[0.08]',  border: 'border-purple-500/20' },
  cyan:    { icon: 'text-cyan-400',    bg: 'bg-cyan-500/[0.08]',    border: 'border-cyan-500/20' },
  rose:    { icon: 'text-rose-400',    bg: 'bg-rose-500/[0.08]',    border: 'border-rose-500/20' },
  violet:  { icon: 'text-violet-400',  bg: 'bg-violet-500/[0.08]',  border: 'border-violet-500/20' },
};

const quickActions = [
  { label: 'Shodan Search', icon: Search, to: '/dashboard/shodan',     color: 'purple' },
  { label: 'Bruteforce',    icon: Zap,    to: '/dashboard/bruteforce', color: 'amber' },
  { label: 'Whitelist Check', icon: Shield, to: '/dashboard/whitelist', color: 'violet' },
];

export default function DashboardHome() {
  const [stats, setStats] = useState({ servers_discovered: 0, open_servers: 0, whitelisted: 0, scans_completed: 0, tasks: [] });

  useEffect(() => {
    api.get('/dashboard/stats').then(setStats).catch(() => {});
    const id = setInterval(() => {
      api.get('/dashboard/stats').then(setStats).catch(() => {});
    }, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-8 tracking-tight">Dashboard</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {statCards.map(({ key, label, icon: Icon, color }) => {
          const c = colorMap[color];
          return (
            <div key={key} className="stat-card">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[13px] text-gray-500 font-medium">{label}</span>
                <div className={`w-9 h-9 rounded-lg ${c.bg} flex items-center justify-center`}>
                  <Icon className={`w-[18px] h-[18px] ${c.icon}`} />
                </div>
              </div>
              <div className="text-3xl font-bold tracking-tight">{stats[key]?.toLocaleString?.() ?? stats[key]}</div>
            </div>
          );
        })}
      </div>

      {/* Quick actions */}
      <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {quickActions.map(({ label, icon: Icon, to, color }) => (
          <Link
            key={to}
            to={to}
            className="stat-card group flex items-center gap-4 hover:border-purple-500/20"
          >
            <div className={`w-11 h-11 rounded-xl bg-${color}-500/[0.1] flex items-center justify-center`}>
              <Icon className={`w-5 h-5 text-${color}-400`} />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold">{label}</div>
              <div className="text-xs text-gray-500">Launch tool</div>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
          </Link>
        ))}
      </div>

      {/* Recent tasks */}
      <h2 className="text-lg font-semibold mb-4">Recent Tasks</h2>
      <div className="glass rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06]">
              <th className="text-left py-3 px-5 text-gray-500 font-medium text-xs uppercase tracking-wider">ID</th>
              <th className="text-left py-3 px-5 text-gray-500 font-medium text-xs uppercase tracking-wider">Type</th>
              <th className="text-left py-3 px-5 text-gray-500 font-medium text-xs uppercase tracking-wider">Status</th>
              <th className="text-left py-3 px-5 text-gray-500 font-medium text-xs uppercase tracking-wider">Progress</th>
            </tr>
          </thead>
          <tbody>
            {stats.tasks && stats.tasks.length > 0 ? (
              stats.tasks.map((t) => (
                <tr key={t.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 px-5 font-mono text-xs text-gray-400">{t.id}</td>
                  <td className="py-3 px-5 capitalize">{t.type}</td>
                  <td className="py-3 px-5">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full
                      ${t.status === 'completed' ? 'bg-purple-500/10 text-purple-400' :
                        t.status === 'running' ? 'bg-amber-500/10 text-amber-400' :
                        t.status === 'failed' ? 'bg-rose-500/10 text-rose-400' :
                        'bg-gray-500/10 text-gray-400'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full
                        ${t.status === 'completed' ? 'bg-purple-400' :
                          t.status === 'running' ? 'bg-amber-400 animate-pulse' :
                          t.status === 'failed' ? 'bg-rose-400' :
                          'bg-gray-400'}`} />
                      {t.status}
                    </span>
                  </td>
                  <td className="py-3 px-5">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 rounded-full transition-all duration-500" style={{ width: `${t.progress}%` }} />
                      </div>
                      <span className="text-xs text-gray-500 w-8 text-right">{t.progress}%</span>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="py-10 text-center text-gray-600 text-sm">No tasks yet. Start a scan to see results here.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
