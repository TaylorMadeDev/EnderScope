import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Search,
  Zap,
  Shield,
  Settings,
  FileText,
  Bell,
  Menu,
  X,
  LogOut,
  User,
  ChevronDown,
  Crown,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';

const baseNavItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/dashboard/shodan', icon: Search, label: 'Shodan Search' },
  { to: '/dashboard/bruteforce', icon: Zap, label: 'Bruteforce' },
  { to: '/dashboard/whitelist', icon: Shield, label: 'Whitelist Check' },
  { to: '/dashboard/settings', icon: Settings, label: 'Settings' },
  { to: '/dashboard/logs', icon: FileText, label: 'Logs' },
];

function useAnimatedMenu(duration = 180) {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const timeoutRef = useRef(null);

  const finishClose = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setClosing(false);
    setOpen(false);
  };

  const closeMenu = () => {
    if (!open) {
      return;
    }
    setClosing(true);
    timeoutRef.current = setTimeout(finishClose, duration);
  };

  const openMenu = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setClosing(false);
    setOpen(true);
  };

  const toggleMenu = () => {
    if (open && !closing) {
      closeMenu();
    } else {
      openMenu();
    }
  };

  useEffect(() => () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  return {
    isOpen: open && !closing,
    isVisible: open || closing,
    closing,
    closeMenu,
    openMenu,
    toggleMenu,
  };
}

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [recentTasks, setRecentTasks] = useState([]);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const notificationsRef = useRef(null);
  const profileRef = useRef(null);
  const profileMenu = useAnimatedMenu(190);

  useEffect(() => {
    let cancelled = false;

    const loadStats = async () => {
      try {
        const stats = await api.get('/dashboard/stats');
        if (!cancelled) {
          setRecentTasks(stats.tasks || []);
        }
      } catch {
        if (!cancelled) {
          setRecentTasks([]);
        }
      }
    };

    loadStats();
    const intervalId = setInterval(loadStats, 8000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target)
      ) {
        setNotificationsOpen(false);
      }

      if (profileRef.current && !profileRef.current.contains(event.target)) {
        profileMenu.closeMenu();
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [profileMenu]);

  const handleLogout = async () => {
    await logout();
    profileMenu.closeMenu();
    navigate('/');
  };

  const runningTasks = recentTasks.filter((task) => task.status === 'running').length;
  const navItems = user?.role === 'admin'
    ? [...baseNavItems, { to: '/dashboard/admin', icon: Crown, label: 'Admin' }]
    : baseNavItems;

  const statusStyles = (status) => {
    if (status === 'completed') {
      return 'bg-emerald-500/10 text-emerald-300';
    }
    if (status === 'running') {
      return 'bg-amber-500/10 text-amber-300';
    }
    if (status === 'failed') {
      return 'bg-rose-500/10 text-rose-300';
    }
    return 'bg-white/[0.06] text-gray-400';
  };

  return (
    <div className="flex h-screen bg-[#0b0014] overflow-hidden">
      {/* ---------- Mobile overlay ---------- */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ---------- Sidebar ---------- */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-40
          w-64 bg-[#0f0a1a] border-r border-purple-500/[0.06] flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-purple-500/[0.06]">
          <Link
            to="/"
            className="flex items-center gap-3 group rounded-xl px-2 py-1.5 -ml-2 hover:bg-white/[0.03] transition-all duration-300"
          >
            <span className="relative">
              <span className="absolute inset-0 rounded-full bg-purple-400/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <img
                src="/assets/EnderScopeLogo.svg"
                alt="EnderScope"
                className="relative h-7 w-auto object-contain brightness-100 group-hover:brightness-125 group-hover:scale-[1.03] transition-all duration-300"
              />
            </span>
            <span className="font-bold text-[17px] tracking-tight text-white/90 group-hover:text-white transition-colors duration-300">
              EnderScope
            </span>
          </Link>
          <button className="lg:hidden text-gray-400 hover:text-white" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-5 px-3 space-y-1 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Icon className="w-[18px] h-[18px]" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom accent */}
        <div className="px-4 py-4 border-t border-purple-500/[0.06]">
          <div className="glass rounded-xl p-4 text-center">
            <p className="text-[11px] text-gray-500 uppercase tracking-[2px] font-medium mb-1">Status</p>
            <div className="flex items-center justify-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse" />
              <span className="text-xs text-purple-400 font-medium">Online</span>
            </div>
          </div>
        </div>
      </aside>

      {/* ---------- Main area ---------- */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top nav */}
        <header className="relative z-[90] h-16 bg-[#0f0a1a]/80 backdrop-blur-2xl border-b border-purple-500/[0.06] flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden text-gray-400 hover:text-white transition-colors"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative z-[95]" ref={notificationsRef}>
              <button
                onClick={() => {
                  setNotificationsOpen((open) => !open);
                  profileMenu.closeMenu();
                }}
                className="relative w-9 h-9 rounded-lg bg-purple-500/[0.06] hover:bg-purple-500/[0.12] flex items-center justify-center text-gray-400 hover:text-white transition-all"
                title="Notifications"
              >
                <Bell className="w-[18px] h-[18px]" />
                {runningTasks > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-amber-400 text-[#170b22] text-[10px] font-bold flex items-center justify-center">
                    {runningTasks}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-3 w-[320px] glass-strong rounded-2xl border border-purple-500/15 shadow-[0_24px_80px_rgba(0,0,0,0.45)] overflow-hidden z-[140]">
                  <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-white">Notifications</p>
                      <p className="text-[11px] uppercase tracking-[2px] text-gray-500">Recent task activity</p>
                    </div>
                    <Link
                      to="/dashboard/logs"
                      onClick={() => setNotificationsOpen(false)}
                      className="text-xs text-purple-300 hover:text-white transition-colors"
                    >
                      Open Logs
                    </Link>
                  </div>

                  <div className="max-h-[320px] overflow-y-auto p-2">
                    {recentTasks.length > 0 ? (
                      recentTasks.slice(0, 6).map((task) => (
                        <div
                          key={task.id}
                          className="rounded-xl px-3 py-3 hover:bg-white/[0.03] transition-colors"
                        >
                          <div className="flex items-start justify-between gap-3 mb-1.5">
                            <div>
                              <p className="text-sm font-medium text-white capitalize">{task.type}</p>
                              <p className="text-[11px] text-gray-500 font-mono">{task.id}</p>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-[11px] font-medium ${statusStyles(task.status)}`}>
                              {task.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                              <div
                                className="h-full bg-purple-400 rounded-full transition-all duration-300"
                                style={{ width: `${task.progress}%` }}
                              />
                            </div>
                            <span className="text-[11px] text-gray-500 w-9 text-right">{task.progress}%</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="px-3 py-8 text-center text-sm text-gray-500">
                        No recent activity yet.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {user && (
              <div className="relative z-[100]" ref={profileRef}>
                <button
                  onClick={() => {
                    profileMenu.toggleMenu();
                    setNotificationsOpen(false);
                  }}
                  className="flex items-center gap-2 pl-1 pr-2 h-9 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.05] transition-all"
                >
                  <div className="w-8 h-8 rounded-lg bg-purple-500/[0.12] flex items-center justify-center text-purple-400 text-[13px] font-semibold overflow-hidden">
                    {user.avatar ? (
                      <img src={user.avatar} alt="" className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      user.username?.substring(0, 2).toUpperCase()
                    )}
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${profileMenu.isOpen ? 'rotate-180 text-white' : ''}`} />
                </button>

                {profileMenu.isVisible && (
                  <div className={`dashboard-profile-menu absolute right-0 mt-3 w-[280px] overflow-hidden z-[150] ${profileMenu.closing ? 'closing' : 'opening'}`}>
                    <div className="px-4 py-4 border-b border-white/[0.06]">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-purple-500/[0.12] flex items-center justify-center text-purple-300 font-semibold overflow-hidden">
                          {user.avatar ? (
                            <img src={user.avatar} alt="" className="w-full h-full object-cover rounded-xl" />
                          ) : (
                            user.username?.substring(0, 2).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{user.username}</p>
                          <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-2">
                      <Link
                        to="/dashboard/account"
                        onClick={() => profileMenu.closeMenu()}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-gray-300 hover:bg-white/[0.04] hover:text-white transition-colors"
                      >
                        <Settings className="w-4 h-4 text-purple-300" />
                        Account Settings
                      </Link>
                      <Link
                        to="/dashboard"
                        onClick={() => profileMenu.closeMenu()}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-gray-300 hover:bg-white/[0.04] hover:text-white transition-colors"
                      >
                        <User className="w-4 h-4 text-purple-300" />
                        Dashboard Home
                      </Link>
                      {user.role === 'admin' && (
                        <Link
                          to="/dashboard/admin"
                          onClick={() => profileMenu.closeMenu()}
                          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-gray-300 hover:bg-white/[0.04] hover:text-white transition-colors"
                        >
                          <Crown className="w-4 h-4 text-purple-300" />
                          Admin Panel
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-rose-300 hover:bg-rose-500/[0.08] transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
