import { useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  Search,
  Zap,
  Shield,
  Bell,
  ArrowRight,
  ChevronDown,
  Check,
  Crown,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { planCatalog } from '../utils/accountAccess';

gsap.registerPlugin(ScrollTrigger);

/* ------------------------------------------------------------------ */
/* Data                                                                */
/* ------------------------------------------------------------------ */
const features = [
  {
    icon: Search,
    color: '#a855f7',
    bg: 'rgba(168,85,247,0.12)',
    title: 'Shodan Discovery',
    desc: 'Search millions of indexed Minecraft servers via Shodan API. Filter by version, keywords, and player count.',
  },
  {
    icon: Zap,
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.12)',
    title: 'Port Scanner',
    desc: 'Blazing-fast multi-threaded TCP scanner. CIDR ranges, IP lists, and custom ports — scan thousands of targets.',
  },
  {
    icon: Shield,
    color: '#818cf8',
    bg: 'rgba(129,140,248,0.12)',
    title: 'Whitelist Verifier',
    desc: 'Pure-Python Minecraft protocol handshake. Detects whitelist status by analyzing server kick messages.',
  },
  {
    icon: Bell,
    color: '#4ade80',
    bg: 'rgba(74,222,128,0.12)',
    title: 'Discord Alerts',
    desc: 'Instant webhook notifications with rich embeds for every open server found. Never miss a discovery.',
  },
];

const steps = [
  { num: '01', title: 'Configure', desc: 'Enter your Shodan API key, Discord webhook, and target parameters in the settings panel.' },
  { num: '02', title: 'Scan', desc: 'Launch Shodan searches, port scans, or whitelist checks — all from the web dashboard.' },
  { num: '03', title: 'Analyze', desc: 'Review results in sortable tables, export to CSV/JSON, and receive real-time Discord alerts.' },
];

const stats = [
  { value: '1M+', label: 'Servers Indexed' },
  { value: '50K+', label: 'Scans Completed' },
  { value: '99.9%', label: 'Detection Rate' },
  { value: '< 3s', label: 'Avg Scan Time' },
];

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */
export default function Landing() {
  const containerRef = useRef(null);
  const { user, loading, logout } = useAuth();

  /* Generate twinkling stars */
  const stars = useMemo(() =>
    Array.from({ length: 160 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 0.5,
      delay: Math.random() * 6,
      duration: Math.random() * 3 + 2,
      opacity: Math.random() * 0.6 + 0.2,
    })),
  []);

  useEffect(() => {
    const ctx = gsap.context(() => {

      /* ── Hero entrance ── */
      const hero = gsap.timeline({ defaults: { ease: 'power3.out' } });
      hero
        .fromTo('.hero-badge', { y: -30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.7 })
        .fromTo('.hero-title-line', { y: 80, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.9, stagger: 0.12 }, '-=0.3')
        .fromTo('.hero-sub', { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.7 }, '-=0.4')
        .fromTo('.hero-btns', { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.6 }, '-=0.3')
        .fromTo('.hero-terminal', { y: 60, autoAlpha: 0, scale: 0.97 }, { y: 0, autoAlpha: 1, scale: 1, duration: 1 }, '-=0.4')
        .fromTo('.hero-scroll', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6 }, '-=0.3');

      /* ── Scroll-triggered sections ── */
      gsap.fromTo('.feat-heading', { y: 50, autoAlpha: 0 }, {
        y: 0, autoAlpha: 1, duration: 0.8,
        scrollTrigger: { trigger: '.feat-section', start: 'top 85%', toggleActions: 'play none none none' },
      });
      gsap.fromTo('.feature-card', { y: 80, autoAlpha: 0 }, {
        y: 0, autoAlpha: 1, duration: 0.7, stagger: 0.13,
        scrollTrigger: { trigger: '.feat-cards', start: 'top 85%', toggleActions: 'play none none none' },
      });

      gsap.fromTo('.step-item', { x: -60, autoAlpha: 0 }, {
        x: 0, autoAlpha: 1, duration: 0.7, stagger: 0.18,
        scrollTrigger: { trigger: '.steps-section', start: 'top 85%', toggleActions: 'play none none none' },
      });

      gsap.fromTo('.pricing-heading', { y: 50, autoAlpha: 0 }, {
        y: 0, autoAlpha: 1, duration: 0.8,
        scrollTrigger: { trigger: '.pricing-section', start: 'top 85%', toggleActions: 'play none none none' },
      });
      gsap.fromTo('.pricing-card', { y: 60, autoAlpha: 0 }, {
        y: 0, autoAlpha: 1, duration: 0.7, stagger: 0.15,
        scrollTrigger: { trigger: '.pricing-cards', start: 'top 85%', toggleActions: 'play none none none' },
      });

      gsap.fromTo('.stat-block', { y: 50, autoAlpha: 0 }, {
        y: 0, autoAlpha: 1, duration: 0.6, stagger: 0.1,
        scrollTrigger: { trigger: '.stats-section', start: 'top 85%', toggleActions: 'play none none none' },
      });

      gsap.fromTo('.cta-inner > *', { y: 40, autoAlpha: 0 }, {
        y: 0, autoAlpha: 1, duration: 0.7, stagger: 0.14,
        scrollTrigger: { trigger: '.cta-section', start: 'top 85%', toggleActions: 'play none none none' },
      });

      /* ── PARALLAX DECORATIONS ── */

      /* End Islands — slide in from sides */
      gsap.fromTo('.end-island-left', { x: -300, autoAlpha: 0 }, {
        x: 0, autoAlpha: 0.7, ease: 'none',
        scrollTrigger: { trigger: '.feat-section', start: 'top bottom', end: 'bottom top', scrub: 1.5 },
      });
      gsap.fromTo('.end-island-right', { x: 300, autoAlpha: 0 }, {
        x: 0, autoAlpha: 0.7, ease: 'none',
        scrollTrigger: { trigger: '.steps-section', start: 'top bottom', end: 'bottom top', scrub: 1.5 },
      });
      gsap.fromTo('.end-island-left-2', { x: -250, autoAlpha: 0 }, {
        x: 0, autoAlpha: 0.6, ease: 'none',
        scrollTrigger: { trigger: '.pricing-section', start: 'top bottom', end: 'bottom top', scrub: 1.5 },
      });
      gsap.fromTo('.end-island-right-2', { x: 250, autoAlpha: 0 }, {
        x: 0, autoAlpha: 0.5, ease: 'none',
        scrollTrigger: { trigger: '.stats-section', start: 'top bottom', end: 'bottom top', scrub: 1.5 },
      });

      /* Enderman — peek in tilted from sides */
      gsap.fromTo('.enderman-left', { x: -120, rotation: -15, autoAlpha: 0 }, {
        x: 0, rotation: -8, autoAlpha: 0.85, ease: 'none',
        scrollTrigger: { trigger: '.steps-section', start: 'top 90%', end: 'center center', scrub: 1 },
      });
      gsap.fromTo('.enderman-right', { x: 120, rotation: 12, autoAlpha: 0 }, {
        x: 0, rotation: 6, autoAlpha: 0.85, ease: 'none',
        scrollTrigger: { trigger: '.pricing-section', start: 'top 90%', end: 'center center', scrub: 1 },
      });

      /* Chorus Plants — grow from bottom */
      ScrollTrigger.refresh();
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div ref={containerRef} className="bg-[#0b0014] text-white min-h-screen overflow-x-hidden relative">

      {/* ========== STAR FIELD ========== */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {stars.map((s) => (
          <div
            key={s.id}
            className="absolute rounded-full bg-white star-twinkle"
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: `${s.size}px`,
              height: `${s.size}px`,
              opacity: s.opacity,
              animationDelay: `${s.delay}s`,
              animationDuration: `${s.duration}s`,
            }}
          />
        ))}
      </div>

      {/* ========== PARALLAX MC DECORATIONS ========== */}
      {/* End Islands from left/right */}
      <img src="/assets/end-island.webp" alt="" className="end-island-left absolute left-[-60px] top-[110vh] w-[280px] pointer-events-none z-[1] invisible select-none" />
      <img src="/assets/end-island.webp" alt="" className="end-island-right absolute right-[-60px] top-[220vh] w-[250px] pointer-events-none z-[1] invisible select-none" style={{ transform: 'scaleX(-1)' }} />
      <img src="/assets/end-island.webp" alt="" className="end-island-left-2 absolute left-[-40px] top-[340vh] w-[220px] pointer-events-none z-[1] invisible select-none" />
      <img src="/assets/end-island.webp" alt="" className="end-island-right-2 absolute right-[-50px] top-[430vh] w-[200px] pointer-events-none z-[1] invisible select-none" style={{ transform: 'scaleX(-1)' }} />

      {/* Enderman peeking tilted */}
      <img src="/assets/enderman.png" alt="" className="enderman-left absolute left-0 top-[230vh] w-[120px] pointer-events-none z-[2] invisible select-none" />
      <img src="/assets/enderman.png" alt="" className="enderman-right absolute right-0 top-[360vh] w-[110px] pointer-events-none z-[2] invisible select-none" style={{ transform: 'scaleX(-1)' }} />

      {/* Chorus Plants growing from bottom */}
      {/* ========== NAVBAR ========== */}
      <nav className="fixed top-0 w-full z-50 bg-[#0b0014]/70 backdrop-blur-2xl border-b border-purple-500/[0.08]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/assets/enderman.png" alt="" className="w-6 h-6 object-contain" />
            <span className="font-bold text-[17px] tracking-tight">EnderScope</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-[13px] text-gray-500 font-medium">
            <a href="#features" className="hover:text-purple-400 transition-colors duration-200">Features</a>
            <a href="#how-it-works" className="hover:text-purple-400 transition-colors duration-200">How It Works</a>
            <a href="#pricing" className="hover:text-purple-400 transition-colors duration-200">Blocks</a>
            <a href="#stats" className="hover:text-purple-400 transition-colors duration-200">Stats</a>
          </div>
          <div className="flex items-center gap-3">
            {!loading && user ? (
              <>
                <Link to="/dashboard" className="text-[13px] font-medium text-gray-300 hover:text-white transition-colors px-4 py-2">
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-[13px] font-semibold text-purple-300 bg-purple-500/[0.1] border border-purple-500/25
                             px-5 py-2 rounded-lg hover:bg-purple-500/[0.2] transition-all duration-200"
                >
                  Log Out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-[13px] font-medium text-gray-400 hover:text-white transition-colors px-4 py-2">
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="text-[13px] font-semibold text-purple-300 bg-purple-500/[0.1] border border-purple-500/25
                             px-5 py-2 rounded-lg hover:bg-purple-500/[0.2] transition-all duration-200"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ========== HERO ========== */}
      <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden z-10">
        <div className="end-grid" />
        <div className="absolute top-[-250px] left-[-150px] w-[700px] h-[700px] bg-purple-600 rounded-full blur-[200px] opacity-[0.08] animate-float pointer-events-none" />
        <div className="absolute bottom-[-200px] right-[-200px] w-[600px] h-[600px] bg-indigo-600 rounded-full blur-[200px] opacity-[0.05] animate-float-delay pointer-events-none" />
        <div className="absolute top-[30%] right-[10%] w-[300px] h-[300px] bg-fuchsia-600 rounded-full blur-[160px] opacity-[0.04] pointer-events-none" />

        <div className="relative z-10 max-w-6xl mx-auto px-6 flex flex-col items-center text-center">
          <div className="hero-badge invisible inline-flex items-center gap-2.5 bg-purple-500/[0.1] border border-purple-500/25
                          rounded-full px-5 py-1.5 text-[13px] text-purple-400 font-medium mb-10">
            <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse" />
            v2.0 — The End Dimension
          </div>

          <h1 className="text-6xl sm:text-7xl md:text-[88px] font-black tracking-tight leading-[0.95] mb-7">
            <span className="hero-title-line invisible block text-white/90">ENDER</span>
            <span className="hero-title-line invisible block bg-gradient-to-r from-purple-400 via-fuchsia-400 to-indigo-400
                             bg-clip-text text-transparent text-glow-purple">
              SCOPE
            </span>
          </h1>

          <p className="hero-sub invisible text-base sm:text-lg text-gray-400 max-w-xl leading-relaxed mb-10">
            Advanced Minecraft server discovery &amp; penetration testing platform.
            Shodan search, port scanning, whitelist detection, and Discord alerts — all from one dashboard.
          </p>

          <div className="hero-btns invisible flex flex-col sm:flex-row items-center gap-4 mb-16">
            <Link
              to="/register"
              className="group bg-purple-600 hover:bg-purple-500 text-white font-semibold px-8 py-3.5 rounded-xl
                         transition-all duration-300 hover:shadow-[0_0_50px_rgba(168,85,247,0.35)] flex items-center gap-2"
            >
              Get Started Free
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="#features"
              className="bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white font-medium
                         px-8 py-3.5 rounded-xl transition-all duration-200"
            >
              Explore Features
            </a>
          </div>

          {/* Terminal */}
          <div className="hero-terminal invisible w-full max-w-2xl">
            <div className="terminal">
              <div className="terminal-bar">
                <div className="terminal-dot bg-[#ff5f57]" />
                <div className="terminal-dot bg-[#ffbd2e]" />
                <div className="terminal-dot bg-[#28c840]" />
                <span className="text-[11px] text-gray-500 ml-3 font-mono">enderscope - the end</span>
              </div>
              <div className="terminal-body text-left">
                <div className="terminal-line"><span className="text-purple-400">$</span> <span className="text-gray-300">enderscope scan --version 1.20 --query smp</span></div>
                <div className="terminal-line text-gray-500">Initializing Shodan search...</div>
                <div className="terminal-line"><span className="text-purple-400">&#10003;</span> <span className="text-gray-300">Connected to Shodan API</span></div>
                <div className="terminal-line"><span className="text-purple-400">&#10003;</span> <span className="text-gray-300">Found <span className="text-purple-400 font-semibold">142</span> Minecraft servers</span></div>
                <div className="terminal-line"><span className="text-purple-400">&#10003;</span> <span className="text-gray-300">89 open, 53 whitelisted</span></div>
                <div className="terminal-line"><span className="text-indigo-400">&#8599;</span> <span className="text-gray-300">Discord notification sent</span></div>
                <div className="terminal-line"><span className="text-purple-400">$</span> <span className="animate-blink text-purple-400/70">&#9612;</span></div>
              </div>
            </div>
          </div>

          <div className="hero-scroll invisible mt-16">
            <a href="#features" className="flex flex-col items-center text-gray-600 hover:text-purple-400 transition-colors">
              <span className="text-[11px] uppercase tracking-[3px] font-medium mb-2">Scroll</span>
              <ChevronDown className="w-4 h-4 animate-bounce" />
            </a>
          </div>
        </div>
      </section>

      {/* ========== FEATURES ========== */}
      <section id="features" className="feat-section relative py-32 px-6 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="feat-heading text-center mb-20">
            <span className="text-purple-400/80 text-[13px] font-semibold uppercase tracking-[4px]">Features</span>
            <h2 className="text-4xl sm:text-5xl font-bold mt-4 tracking-tight">Powerful Tools for<br />Server Analysis</h2>
            <p className="text-gray-500 mt-5 max-w-lg mx-auto leading-relaxed">
              Everything you need to discover, scan, and analyze Minecraft servers — built for speed and reliability.
            </p>
          </div>

          <div className="feat-cards grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f) => (
              <div key={f.title} className="feature-card group cursor-default">
                <div className="feature-icon" style={{ background: f.bg, color: f.color }}>
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold mb-3 text-white/90">{f.title}</h3>
                <p className="text-gray-500 text-[13.5px] leading-relaxed mb-5">{f.desc}</p>
                <span className="text-[13px] font-medium flex items-center gap-1.5 transition-colors"
                      style={{ color: f.color }}>
                  Learn more <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== HOW IT WORKS ========== */}
      <section id="how-it-works" className="steps-section relative py-32 px-6 border-t border-purple-500/[0.06] z-10">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-20">
            <span className="text-indigo-400/80 text-[13px] font-semibold uppercase tracking-[4px]">Workflow</span>
            <h2 className="text-4xl sm:text-5xl font-bold mt-4 tracking-tight">How It Works</h2>
          </div>

          <div className="space-y-14">
            {steps.map((s) => (
              <div key={s.num} className="step-item step-card flex items-start gap-6">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20
                                flex items-center justify-center text-purple-400 font-bold text-sm">
                  {s.num}
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">{s.title}</h3>
                  <p className="text-gray-500 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== PRICING ========== */}
      <section id="pricing" className="pricing-section relative py-32 px-6 border-t border-purple-500/[0.06] z-10">
        <div className="max-w-6xl mx-auto">
          <div className="pricing-heading text-center mb-20">
            <span className="text-fuchsia-400/80 text-[13px] font-semibold uppercase tracking-[4px]">Blocks</span>
            <h2 className="text-4xl sm:text-5xl font-bold mt-4 tracking-tight">Choose Your Block</h2>
            <p className="text-gray-500 mt-5 max-w-lg mx-auto leading-relaxed">
              Every tier is named like a Minecraft block so the product feels native now, and each step leaves room for future bot tooling.
            </p>
          </div>

          <div className="pricing-cards grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {planCatalog.map((plan) => (
              <div
                key={plan.key}
                className={`pricing-card relative rounded-2xl p-8 transition-all duration-300 ${
                  plan.featured
                    ? 'bg-gradient-to-b from-purple-500/[0.12] to-purple-900/[0.05] border-2 border-purple-500/30 shadow-[0_0_60px_rgba(168,85,247,0.1)]'
                    : 'glass-end hover:border-purple-500/20'
                }`}
              >
                {plan.featured && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-purple-600 text-white text-xs font-bold px-4 py-1.5 rounded-full">
                    <Crown className="w-3.5 h-3.5" /> Most Popular
                  </div>
                )}
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${plan.accent} opacity-80 pointer-events-none`} />
                <div className="relative z-10">
                  <div className="flex items-start justify-between gap-4 mb-6">
                    <div>
                      <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] ${plan.badgeTone}`}>
                        {plan.tagline}
                      </span>
                      <h3 className="text-lg font-bold mt-4 mb-1">{plan.name}</h3>
                      <p className="text-gray-400 text-sm leading-relaxed">{plan.description}</p>
                    </div>
                    <div className="relative shrink-0">
                      <div className="absolute inset-0 rounded-2xl bg-white/10 blur-2xl opacity-50" />
                      <img
                        src={plan.image}
                        alt={`${plan.name} block`}
                        className="relative w-20 h-20 object-contain drop-shadow-[0_16px_28px_rgba(8,4,20,0.55)]"
                      />
                    </div>
                  </div>
                  <div className="mb-8">
                    <span className="text-4xl font-black">{plan.price}</span>
                    <span className="text-gray-500 text-sm ml-1">{plan.period}</span>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feat) => (
                      <li key={feat} className="flex items-center gap-2.5 text-sm text-gray-300">
                        <Check className={`w-4 h-4 flex-shrink-0 ${plan.featured ? 'text-purple-300' : 'text-gray-500'}`} />
                        {feat}
                      </li>
                    ))}
                  </ul>
                  <Link
                    to="/register"
                    className={`btn w-full ${plan.featured ? 'btn-primary' : 'btn-secondary'}`}
                  >
                    {plan.key === 'dirt' ? 'Start Free' : `Choose ${plan.name}`}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== STATS ========== */}
      <section id="stats" className="stats-section relative py-32 px-6 border-t border-purple-500/[0.06] z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-500/[0.02] to-transparent pointer-events-none" />
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s) => (
            <div key={s.label} className="stat-block text-center">
              <div className="text-4xl sm:text-5xl font-black text-purple-400 text-glow-purple mb-2">{s.value}</div>
              <div className="text-gray-500 text-sm font-medium tracking-wide uppercase">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ========== CTA ========== */}
      <section className="cta-section relative py-32 px-6 border-t border-purple-500/[0.06] z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-purple-600 rounded-full blur-[250px] opacity-[0.06] pointer-events-none" />
        <div className="cta-inner max-w-2xl mx-auto text-center relative z-10">
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6">Ready to Enter<br />The End?</h2>
          <p className="text-gray-500 leading-relaxed mb-10 text-lg">
            Create your account, enter your API keys, and start discovering Minecraft servers in seconds.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold
                       px-10 py-4 rounded-xl transition-all duration-300 hover:shadow-[0_0_50px_rgba(168,85,247,0.35)]"
          >
            Get Started <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ========== FOOTER ========== */}
      <footer className="footer-grove border-t border-purple-500/[0.06] py-12 px-6 z-30 relative overflow-visible">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-fuchsia-950/25 via-purple-950/10 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-[#14071f]/80 blur-2xl" />
        <img
          src="/assets/chorus-plant.png"
          alt=""
          className="chorus-grove-left absolute -left-2 bottom-0 w-[124px] sm:w-[156px] md:w-[192px] z-[40] select-none pointer-events-none"
        />
        <img
          src="/assets/chorus-plant.png"
          alt=""
          className="chorus-grove-center absolute left-1/2 bottom-0 w-[72px] sm:w-[92px] md:w-[108px] -translate-x-1/2 z-[40] select-none pointer-events-none opacity-70"
        />
        <img
          src="/assets/chorus-plant.png"
          alt=""
          className="chorus-grove-right absolute -right-3 bottom-0 w-[136px] sm:w-[168px] md:w-[204px] z-[40] select-none pointer-events-none"
          style={{ transform: 'scaleX(-1)' }}
        />
        <div className="relative z-50 max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <img src="/assets/enderman.png" alt="" className="w-5 h-5 object-contain" />
            <span className="font-bold tracking-tight text-sm">EnderScope</span>
          </div>
          <p className="text-gray-600 text-[13px]">&copy; {new Date().getFullYear()} EnderScope. Built for the End dimension.</p>
        </div>
      </footer>
    </div>
  );
}
