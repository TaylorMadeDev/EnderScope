import { useEffect, useRef, useState } from 'react';
import {
  Save,
  Plus,
  Trash2,
  Loader2,
  KeyRound,
  SlidersHorizontal,
  Palette,
  Bot,
  Network,
  ChevronDown,
  Check,
  Eye,
  EyeOff,
  Search,
  Send,
} from 'lucide-react';
import api from '../utils/api';

const panels = [
  { id: 'api', label: 'API Keys / Webhooks', icon: KeyRound },
  { id: 'scan', label: 'Scan Config', icon: SlidersHorizontal },
  { id: 'customization', label: 'Customization', icon: Palette },
  { id: 'accounts', label: 'Bot Accounts', icon: Bot },
  { id: 'proxies', label: 'Proxy List', icon: Network },
];

const themeOptions = [
  {
    value: 'dark',
    label: 'Dark',
    caption: 'Classic EnderScope contrast',
    tone: 'linear-gradient(135deg, #312e81, #7c3aed)',
  },
  {
    value: 'midnight',
    label: 'Midnight',
    caption: 'Cooler shadows with deep blue glass',
    tone: 'linear-gradient(135deg, #0f172a, #1d4ed8)',
  },
  {
    value: 'nebula',
    label: 'Nebula',
    caption: 'Vivid magenta highlights and glow',
    tone: 'linear-gradient(135deg, #7e22ce, #ec4899)',
  },
];

const fallbackMinecraftVersions = [
  '1.21.11',
  '1.21.10',
  '1.21.9',
  '1.21.8',
  '1.21.7',
  '1.21.6',
  '1.21.5',
  '1.21.4',
  '1.21.3',
  '1.21.2',
  '1.21.1',
  '1.21',
  '1.20.6',
  '1.20.5',
  '1.20.4',
  '1.20.3',
  '1.20.2',
  '1.20.1',
  '1.20',
  '1.19.4',
  '1.19.3',
  '1.19.2',
  '1.19.1',
  '1.19',
  '1.18.2',
  '1.18.1',
  '1.18',
  '1.17.1',
  '1.17',
  '1.16.5',
  '1.16.4',
  '1.16.3',
  '1.16.2',
  '1.16.1',
  '1.16',
  '1.15.2',
  '1.15.1',
  '1.15',
  '1.14.4',
  '1.14.3',
  '1.14.2',
  '1.14.1',
  '1.14',
  '1.13.2',
  '1.13.1',
  '1.13',
  '1.12.2',
  '1.12.1',
  '1.12',
  '1.11.2',
  '1.11.1',
  '1.11',
  '1.10.2',
  '1.10.1',
  '1.10',
  '1.9.4',
  '1.9.2',
  '1.9.1',
  '1.9',
  '1.8.9',
  '1.8.8',
  '1.8.7',
  '1.8.6',
  '1.8.5',
  '1.8.4',
  '1.8.3',
  '1.8.2',
  '1.8.1',
  '1.8',
];

const webhookDefaults = {
  username: 'EnderScope',
  message: 'Potential open server detected.',
  mentions: '',
  title: 'New Server Found: {ip}:{port}',
  description:
    '{motd}\nVersion: {version}\nPlayers: {players_online}/{players_max}\nWhitelist: {whitelist}\nSource: {source}',
  color: '#8b5cf6',
};

const webhookPreviewServer = {
  ip: 'play.endscope.gg',
  port: 25565,
  version: '1.21.11',
  motd: 'A hidden survival shard just drifted out of the void.',
  players_online: 12,
  players_max: 60,
  whitelist: false,
  source: 'shodan',
};

const webhookTokens = [
  '{ip}',
  '{port}',
  '{version}',
  '{motd}',
  '{players_online}',
  '{players_max}',
  '{whitelist}',
  '{source}',
];

const mojangManifestUrl = 'https://launchermeta.mojang.com/mc/game/version_manifest_v2.json';

function buildVersionOptions(versions) {
  return versions.map((version, index) => ({
    value: version,
    label: version,
    caption: index === 0 ? 'Latest official release' : 'Official Java Edition release',
  }));
}

function normalizeHexColor(value) {
  const raw = String(value || '').trim().replace(/^#/, '');
  if (/^[0-9a-fA-F]{6}$/.test(raw)) {
    return `#${raw.toLowerCase()}`;
  }
  return webhookDefaults.color;
}

function getTemplateContext(server) {
  const whitelist =
    server.whitelist === false ? 'Open' : server.whitelist ? 'Whitelisted' : 'Unknown';

  return {
    ip: server.ip || 'unknown',
    port: String(server.port || 25565),
    version: server.version || 'unknown',
    motd: server.motd || '-',
    players_online: String(server.players_online || 0),
    players_max: String(server.players_max || 0),
    whitelist,
    source: server.source || 'unknown',
  };
}

function applyWebhookTemplate(template, server) {
  const context = getTemplateContext(server);
  return String(template || '').replace(/\{([a-z_]+)\}/gi, (_, token) => context[token] ?? '');
}

function getWebhookAppearance(settings) {
  return {
    username:
      settings.discord_webhook_username === undefined
        ? webhookDefaults.username
        : settings.discord_webhook_username,
    message:
      settings.discord_webhook_message === undefined
        ? webhookDefaults.message
        : settings.discord_webhook_message,
    mentions:
      settings.discord_webhook_mentions === undefined
        ? webhookDefaults.mentions
        : settings.discord_webhook_mentions,
    title:
      settings.discord_webhook_title === undefined
        ? webhookDefaults.title
        : settings.discord_webhook_title,
    description:
      settings.discord_webhook_description === undefined
        ? webhookDefaults.description
        : settings.discord_webhook_description,
    color: normalizeHexColor(
      settings.discord_webhook_color === undefined
        ? webhookDefaults.color
        : settings.discord_webhook_color
    ),
  };
}

function useAnimatedMenu(duration = 180) {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const closeTimeoutRef = useRef(null);

  const finishClose = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setClosing(false);
    setOpen(false);
  };

  const closeMenu = () => {
    if (!open) {
      return;
    }
    setClosing(true);
    closeTimeoutRef.current = setTimeout(finishClose, duration);
  };

  const openMenu = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
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
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
  }, []);

  return {
    isOpen: open && !closing,
    isVisible: open || closing,
    closing,
    openMenu,
    closeMenu,
    toggleMenu,
  };
}

function SecretInput({ label, value, onChange, placeholder }) {
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
        />
        <button
          type="button"
          className="settings-secret-toggle"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? `Hide ${label}` : `Show ${label}`}
        >
          {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          <span>{visible ? 'Hide' : 'Show'}</span>
        </button>
      </div>
    </div>
  );
}

function SettingsSelect({ label, value, options, onChange }) {
  const rootRef = useRef(null);
  const menu = useAnimatedMenu();
  const selected = options.find((option) => option.value === value) || options[0];

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        menu.closeMenu();
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        menu.closeMenu();
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [menu.isOpen]);

  return (
    <div className="settings-select" ref={rootRef}>
      <span className="block text-xs text-gray-500 font-medium mb-1.5">{label}</span>
      <button
        type="button"
        className={`settings-select-trigger ${menu.isOpen ? 'open' : ''}`}
        aria-haspopup="listbox"
        aria-expanded={menu.isOpen}
        onClick={menu.toggleMenu}
      >
        <span className="settings-select-content">
          <span className="settings-select-swatch" style={{ background: selected.tone }} />
          <span className="settings-select-copy">
            <span className="settings-select-label">{selected.label}</span>
            <span className="settings-select-caption">{selected.caption}</span>
          </span>
        </span>
        <ChevronDown className={`settings-select-chevron ${menu.isOpen ? 'open' : ''}`} />
      </button>

      {menu.isVisible && (
        <div
          className={`settings-select-menu ${menu.closing ? 'closing' : 'opening'}`}
          role="listbox"
          aria-label={label}
        >
          {options.map((option) => {
            const active = option.value === selected.value;

            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={active}
                className={`settings-select-option ${active ? 'active' : ''}`}
                onClick={() => {
                  onChange(option.value);
                  menu.closeMenu();
                }}
              >
                <span className="settings-select-content">
                  <span className="settings-select-swatch" style={{ background: option.tone }} />
                  <span className="settings-select-copy">
                    <span className="settings-select-label">{option.label}</span>
                    <span className="settings-select-caption">{option.caption}</span>
                  </span>
                </span>
                <span className={`settings-select-check ${active ? 'active' : ''}`}>
                  <Check className="w-4 h-4" />
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SettingsAutocomplete({
  label,
  value,
  options,
  onChange,
  helperText,
  loading,
}) {
  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const menu = useAnimatedMenu();
  const selected = options.find((option) => option.value === value) || null;
  const [query, setQuery] = useState(selected?.label || '');
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  useEffect(() => {
    if (!menu.isOpen && !menu.closing) {
      setQuery(selected?.label || '');
    }
  }, [value, options.length, menu.isOpen, menu.closing]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setQuery(selected?.label || '');
        menu.closeMenu();
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setQuery(selected?.label || '');
        menu.closeMenu();
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [selected?.label, menu.isOpen]);

  const filteredOptions = options
    .filter((option) => {
      const needle = query.trim().toLowerCase();
      if (!needle) {
        return true;
      }
      return (
        option.label.toLowerCase().includes(needle) ||
        option.caption.toLowerCase().includes(needle)
      );
    })
    .slice(0, 14);

  useEffect(() => {
    if (!menu.isOpen) {
      return;
    }

    const nextIndex = filteredOptions.findIndex((option) => option.value === value);
    setHighlightedIndex(nextIndex >= 0 ? nextIndex : 0);
  }, [query, menu.isOpen, value, options.length]);

  const selectOption = (option) => {
    onChange(option.value);
    setQuery(option.label);
    menu.closeMenu();
  };

  return (
    <div className="settings-combobox" ref={rootRef}>
      <span className="block text-xs text-gray-500 font-medium mb-1.5">{label}</span>
      <div className={`settings-combobox-shell ${menu.isOpen ? 'open' : ''}`}>
        <Search className="settings-combobox-icon" />
        <input
          ref={inputRef}
          className="settings-combobox-input"
          value={query}
          onFocus={() => menu.openMenu()}
          onChange={(event) => {
            setQuery(event.target.value);
            if (!menu.isOpen) {
              menu.openMenu();
            }
          }}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown') {
              event.preventDefault();
              if (!menu.isOpen) {
                menu.openMenu();
                return;
              }
              setHighlightedIndex((current) =>
                current >= filteredOptions.length - 1 ? 0 : current + 1
              );
            }

            if (event.key === 'ArrowUp') {
              event.preventDefault();
              if (!menu.isOpen) {
                menu.openMenu();
                return;
              }
              setHighlightedIndex((current) =>
                current <= 0 ? Math.max(filteredOptions.length - 1, 0) : current - 1
              );
            }

            if (event.key === 'Enter' && filteredOptions[highlightedIndex]) {
              event.preventDefault();
              selectOption(filteredOptions[highlightedIndex]);
            }

            if (event.key === 'Tab') {
              setQuery(selected?.label || '');
              menu.closeMenu();
            }
          }}
          placeholder="Search official Minecraft releases"
          role="combobox"
          aria-expanded={menu.isOpen}
          aria-autocomplete="list"
          aria-controls="mc-version-options"
        />
        <button
          type="button"
          className="settings-combobox-toggle"
          onClick={() => {
            if (!menu.isOpen) {
              inputRef.current?.focus();
              menu.openMenu();
              return;
            }
            setQuery(selected?.label || '');
            menu.closeMenu();
          }}
          aria-label={menu.isOpen ? 'Close Minecraft version list' : 'Open Minecraft version list'}
        >
          <ChevronDown className={`settings-select-chevron ${menu.isOpen ? 'open' : ''}`} />
        </button>
      </div>

      <div className="settings-combobox-meta">
        <span>{helperText}</span>
        <span className={`settings-inline-status ${loading ? 'loading' : ''}`}>
          {loading ? 'Refreshing' : 'Ready'}
        </span>
      </div>

      {menu.isVisible && (
        <div
          id="mc-version-options"
          className={`settings-select-menu settings-combobox-menu ${
            menu.closing ? 'closing' : 'opening'
          }`}
        >
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, index) => {
              const active = option.value === value;
              const highlighted = index === highlightedIndex;

              return (
                <button
                  key={option.value}
                  type="button"
                  className={`settings-combobox-option ${active ? 'active' : ''} ${
                    highlighted ? 'highlighted' : ''
                  }`}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  onClick={() => selectOption(option)}
                >
                  <span className="settings-combobox-option-copy">
                    <span className="settings-combobox-option-label">{option.label}</span>
                    <span className="settings-combobox-option-caption">{option.caption}</span>
                  </span>
                  {active && (
                    <span className="settings-select-check active">
                      <Check className="w-4 h-4" />
                    </span>
                  )}
                </button>
              );
            })
          ) : (
            <div className="settings-combobox-empty">
              No official release matched that search.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Settings() {
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [newAccount, setNewAccount] = useState('');
  const [newProxy, setNewProxy] = useState('');
  const [activePanel, setActivePanel] = useState('api');
  const [mcVersionOptions, setMcVersionOptions] = useState(
    buildVersionOptions(fallbackMinecraftVersions)
  );
  const [versionsLoading, setVersionsLoading] = useState(true);
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [webhookTestMessage, setWebhookTestMessage] = useState('');

  useEffect(() => {
    api.get('/settings').then(setSettings).catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadVersions = async () => {
      try {
        const response = await fetch(mojangManifestUrl);
        const data = await response.json();
        const releases = Array.isArray(data.versions)
          ? data.versions.filter((entry) => entry.type === 'release').map((entry) => entry.id)
          : [];

        if (!cancelled && releases.length > 0) {
          setMcVersionOptions(buildVersionOptions(releases));
        }
      } catch {
        // Fall back to the bundled release list if Mojang is unavailable.
      } finally {
        if (!cancelled) {
          setVersionsLoading(false);
        }
      }
    };

    loadVersions();

    return () => {
      cancelled = true;
    };
  }, []);

  const update = (key, value) => setSettings((prev) => ({ ...prev, [key]: value }));

  const addAccount = () => {
    if (!newAccount.trim()) return;
    const parts = newAccount.trim().split(':');
    const acc = { username: parts[0], password: parts[1] || '', premium: parts.length > 1 };
    update('bot_accounts', [...(settings.bot_accounts || []), acc]);
    setNewAccount('');
  };

  const removeAccount = (i) => {
    update(
      'bot_accounts',
      (settings.bot_accounts || []).filter((_, idx) => idx !== i)
    );
  };

  const addProxy = () => {
    if (!newProxy.trim()) return;
    update('proxy_list', [...(settings.proxy_list || []), newProxy.trim()]);
    setNewProxy('');
  };

  const removeProxy = (i) => {
    update(
      'proxy_list',
      (settings.proxy_list || []).filter((_, idx) => idx !== i)
    );
  };

  const save = async () => {
    const validVersions = new Set(mcVersionOptions.map((option) => option.value));
    const nextSettings = {
      ...settings,
      discord_webhook_color: normalizeHexColor(settings.discord_webhook_color),
    };

    if (!validVersions.has(nextSettings.mc_version)) {
      setMsg('Error: Choose a valid Minecraft release from the official version list.');
      return;
    }

    setSaving(true);
    setMsg('');
    setSettings(nextSettings);

    try {
      await api.put('/settings', nextSettings);
      setMsg('Settings saved successfully.');
    } catch (e) {
      setMsg(`Error: ${e.message}`);
    }

    setSaving(false);
  };

  const sendWebhookTest = async () => {
    setTestingWebhook(true);
    setWebhookTestMessage('');

    try {
      await api.post('/settings/test-webhook', {
        discord_webhook_url: settings.discord_webhook_url,
        discord_webhook_username: settings.discord_webhook_username,
        discord_webhook_message: settings.discord_webhook_message,
        discord_webhook_mentions: settings.discord_webhook_mentions,
        discord_webhook_title: settings.discord_webhook_title,
        discord_webhook_description: settings.discord_webhook_description,
        discord_webhook_color: normalizeHexColor(settings.discord_webhook_color),
        mc_version: settings.mc_version,
      });
      setWebhookTestMessage('Test webhook sent.');
    } catch (error) {
      setWebhookTestMessage(`Error: ${error.message}`);
    } finally {
      setTestingWebhook(false);
    }
  };

  if (!settings) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading settings...
      </div>
    );
  }

  const webhookAppearance = getWebhookAppearance(settings);
  const previewContent = [webhookAppearance.mentions, webhookAppearance.message]
    .map((line) => String(line || '').trim())
    .filter(Boolean)
    .join('\n');
  const previewTitle = applyWebhookTemplate(webhookAppearance.title, webhookPreviewServer);
  const previewDescription = applyWebhookTemplate(
    webhookAppearance.description,
    webhookPreviewServer
  );
  const previewContext = getTemplateContext(webhookPreviewServer);

  return (
    <div className="max-w-5xl">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-2">Settings</h1>
          <p className="text-sm text-gray-500 max-w-2xl">
            Tune how EnderScope searches, verifies, and presents results. Use the panel bar to jump between config areas.
          </p>
        </div>
        <div className="flex items-center gap-4">
          {msg && (
            <span className={`text-sm ${msg.startsWith('Error') ? 'text-rose-400' : 'text-purple-400'}`}>
              {msg}
            </span>
          )}
          <button className="btn btn-primary" onClick={save} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>

      <div className="settings-toolbar glass-strong rounded-2xl p-2 mb-6">
        <div className="settings-toolbar-scroll">
          {panels.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActivePanel(id)}
              className={`settings-tab ${activePanel === id ? 'active' : ''}`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {activePanel === 'api' && (
        <section className="settings-panel glass rounded-2xl p-6 mb-6">
          <h2 className="settings-panel-title">API Keys &amp; Webhooks</h2>
          <p className="settings-panel-copy">Connect external services used for discovery and alerts.</p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-6">
            <div className="settings-card">
              <SecretInput
                label="Shodan API Key"
                value={settings.shodan_api_key || ''}
                onChange={(event) => update('shodan_api_key', event.target.value)}
                placeholder="Your Shodan API key"
              />
            </div>
            <div className="settings-card">
              <SecretInput
                label="Discord Webhook URL"
                value={settings.discord_webhook_url || ''}
                onChange={(event) => update('discord_webhook_url', event.target.value)}
                placeholder="https://discord.com/api/webhooks/..."
              />
            </div>
            <div className="settings-card lg:col-span-2">
              <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-5">
                <div>
                  <label className="block text-xs text-gray-500 font-medium mb-1.5">
                    Webhook Appearance
                  </label>
                  <p className="text-sm text-gray-500 max-w-2xl">
                    Shape the Discord alert message and preview it before EnderScope sends anything.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {webhookTestMessage && (
                    <span className={`text-sm ${webhookTestMessage.startsWith('Error:') ? 'text-rose-300' : 'text-emerald-300'}`}>
                      {webhookTestMessage}
                    </span>
                  )}
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={sendWebhookTest}
                    disabled={testingWebhook}
                  >
                    {testingWebhook ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {testingWebhook ? 'Sending...' : 'Send Test'}
                  </button>
                  <span className="settings-inline-badge">Live Preview</span>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.1fr)_minmax(300px,0.9fr)] gap-5">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 font-medium mb-1.5">
                        Webhook Name
                      </label>
                      <input
                        className="input"
                        value={settings.discord_webhook_username ?? webhookDefaults.username}
                        onChange={(event) => update('discord_webhook_username', event.target.value)}
                        placeholder="EnderScope"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 font-medium mb-1.5">
                        Accent Color
                      </label>
                      <div className="settings-color-row">
                        <input
                          className="settings-color-picker"
                          type="color"
                          value={normalizeHexColor(settings.discord_webhook_color)}
                          onChange={(event) =>
                            update('discord_webhook_color', normalizeHexColor(event.target.value))
                          }
                        />
                        <input
                          className="input settings-color-input"
                          value={settings.discord_webhook_color ?? webhookDefaults.color}
                          onChange={(event) => update('discord_webhook_color', event.target.value)}
                          onBlur={(event) =>
                            update('discord_webhook_color', normalizeHexColor(event.target.value))
                          }
                          placeholder="#8b5cf6"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 font-medium mb-1.5">
                      Alert Line
                    </label>
                    <input
                      className="input"
                      value={settings.discord_webhook_message ?? webhookDefaults.message}
                      onChange={(event) => update('discord_webhook_message', event.target.value)}
                      placeholder={webhookDefaults.message}
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 font-medium mb-1.5">
                      Mentions
                    </label>
                    <textarea
                      className="input settings-textarea settings-textarea-compact"
                      rows={3}
                      value={settings.discord_webhook_mentions ?? webhookDefaults.mentions}
                      onChange={(event) => update('discord_webhook_mentions', event.target.value)}
                      placeholder="<@123456789012345678> <@&987654321098765432> @everyone"
                    />
                    <p className="settings-field-hint">
                      Use Discord mention syntax for users, roles, or `@everyone` / `@here`. Multiple mentions are fine.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 font-medium mb-1.5">
                      Embed Title
                    </label>
                    <input
                      className="input"
                      value={settings.discord_webhook_title ?? webhookDefaults.title}
                      onChange={(event) => update('discord_webhook_title', event.target.value)}
                      placeholder={webhookDefaults.title}
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 font-medium mb-1.5">
                      Embed Description
                    </label>
                    <textarea
                      className="input settings-textarea"
                      rows={7}
                      value={settings.discord_webhook_description ?? webhookDefaults.description}
                      onChange={(event) =>
                        update('discord_webhook_description', event.target.value)
                      }
                      placeholder={webhookDefaults.description}
                    />
                  </div>

                  <div>
                    <span className="block text-xs text-gray-500 font-medium mb-2">
                      Available Tokens
                    </span>
                    <div className="settings-token-grid">
                      {webhookTokens.map((token) => (
                        <span key={token} className="settings-token-pill">
                          {token}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="settings-preview-card">
                  <div className="settings-preview-head">
                    <span className="settings-preview-dot" />
                    Discord Preview
                  </div>
                  <div className="settings-webhook-preview">
                    <div className="settings-webhook-avatar">
                      {String(webhookAppearance.username || 'E').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="settings-webhook-message">
                      <div className="settings-webhook-meta">
                        <span className="settings-webhook-name">
                          {webhookAppearance.username || webhookDefaults.username}
                        </span>
                        <span className="settings-webhook-bot">BOT</span>
                        <span className="settings-webhook-time">now</span>
                      </div>

                      {previewContent && (
                        <p className="settings-webhook-content">{previewContent}</p>
                      )}

                      <div
                        className="settings-webhook-embed"
                        style={{ borderLeftColor: webhookAppearance.color }}
                      >
                        {previewTitle && (
                          <p className="settings-webhook-title">{previewTitle}</p>
                        )}
                        {previewDescription && (
                          <p className="settings-webhook-description">{previewDescription}</p>
                        )}
                        <div className="settings-webhook-fields">
                          <div className="settings-webhook-field">
                            <span>IP:Port</span>
                            <strong>
                              {previewContext.ip}:{previewContext.port}
                            </strong>
                          </div>
                          <div className="settings-webhook-field">
                            <span>Version</span>
                            <strong>{previewContext.version}</strong>
                          </div>
                          <div className="settings-webhook-field">
                            <span>Players</span>
                            <strong>
                              {previewContext.players_online}/{previewContext.players_max}
                            </strong>
                          </div>
                          <div className="settings-webhook-field">
                            <span>Whitelist</span>
                            <strong>{previewContext.whitelist}</strong>
                          </div>
                          <div className="settings-webhook-field full">
                            <span>Source</span>
                            <strong>{previewContext.source}</strong>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {activePanel === 'scan' && (
        <section className="settings-panel glass rounded-2xl p-6 mb-6">
          <h2 className="settings-panel-title">Scan Configuration</h2>
          <p className="settings-panel-copy">Default behavior for discovery, port scans, and whitelist verification.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-6">
            <div className="settings-card">
              <SettingsAutocomplete
                label="Default MC Version"
                value={settings.mc_version || fallbackMinecraftVersions[0]}
                options={mcVersionOptions}
                onChange={(nextVersion) => update('mc_version', nextVersion)}
                helperText="Official Java Edition releases from Mojang"
                loading={versionsLoading}
              />
            </div>
            <div className="settings-card">
              <label className="block text-xs text-gray-500 font-medium mb-1.5">Extra Shodan Query</label>
              <input className="input" value={settings.shodan_extra_query || ''} onChange={e => update('shodan_extra_query', e.target.value)} />
            </div>
            <div className="settings-card">
              <label className="block text-xs text-gray-500 font-medium mb-1.5">Max Shodan Results</label>
              <input className="input input-number" type="number" value={settings.shodan_max_results || 100} onChange={e => update('shodan_max_results', Number(e.target.value))} />
            </div>
            <div className="settings-card">
              <label className="block text-xs text-gray-500 font-medium mb-1.5">Bruteforce Threads</label>
              <input className="input input-number" type="number" value={settings.max_bruteforce_threads || 50} onChange={e => update('max_bruteforce_threads', Number(e.target.value))} />
            </div>
            <div className="settings-card">
              <label className="block text-xs text-gray-500 font-medium mb-1.5">Whitelist Check Threads</label>
              <input className="input input-number" type="number" value={settings.whitelist_check_threads || 10} onChange={e => update('whitelist_check_threads', Number(e.target.value))} />
            </div>
            <div className="settings-card">
              <label className="block text-xs text-gray-500 font-medium mb-1.5">Scan Timeout (s)</label>
              <input className="input input-number" type="number" value={settings.scan_timeout || 5} onChange={e => update('scan_timeout', Number(e.target.value))} />
            </div>
          </div>
        </section>
      )}

      {activePanel === 'customization' && (
        <section className="settings-panel glass rounded-2xl p-6 mb-6">
          <h2 className="settings-panel-title">Customization</h2>
          <p className="settings-panel-copy">Interface preferences and automation behavior for your workspace.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-6">
            <div className="settings-card">
              <SettingsSelect
                label="Theme"
                value={settings.theme || 'dark'}
                options={themeOptions}
                onChange={(nextTheme) => update('theme', nextTheme)}
              />
            </div>
            <div className="settings-card">
              <label className="block text-xs text-gray-500 font-medium mb-1.5">
                Auto Discord Notify
              </label>
              <button
                type="button"
                onClick={() => update('auto_notify_discord', !settings.auto_notify_discord)}
                className={`settings-switch ${settings.auto_notify_discord ? 'active' : ''}`}
              >
                <span className="settings-switch-track">
                  <span className="settings-switch-thumb">
                    <span className="settings-switch-thumb-core" />
                  </span>
                </span>
                <span className="settings-switch-copy">
                  <span className="settings-switch-label">
                    {settings.auto_notify_discord ? 'Alerts armed' : 'Alerts paused'}
                  </span>
                  <span className="settings-switch-caption">
                    {settings.auto_notify_discord
                      ? 'Send Discord notifications automatically when a server opens up.'
                      : 'Keep webhook notifications manual until you are ready.'}
                  </span>
                </span>
              </button>
            </div>
          </div>
        </section>
      )}

      {activePanel === 'accounts' && (
        <section className="settings-panel glass rounded-2xl p-6 mb-6">
          <h2 className="settings-panel-title">Bot Accounts</h2>
          <p className="settings-panel-copy">Accounts used during whitelist checks and related server verification flows.</p>
          <div className="space-y-2 mt-6 mb-4">
            {(settings.bot_accounts || []).map((a, i) => (
              <div key={i} className="settings-list-row">
                <span className="flex-1 text-sm font-mono">{a.username}{a.premium ? ' (premium)' : ' (offline)'}</span>
                <button className="text-gray-500 hover:text-rose-400 transition-colors" onClick={() => removeAccount(i)}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              className="input flex-1"
              value={newAccount}
              onChange={e => setNewAccount(e.target.value)}
              placeholder="username  or  username:password"
              onKeyDown={e => e.key === 'Enter' && addAccount()}
            />
            <button className="btn btn-secondary" onClick={addAccount}><Plus className="w-4 h-4" /> Add</button>
          </div>
        </section>
      )}

      {activePanel === 'proxies' && (
        <section className="settings-panel glass rounded-2xl p-6 mb-6">
          <h2 className="settings-panel-title">Proxy List</h2>
          <p className="settings-panel-copy">Optional proxy endpoints for outbound traffic during specific account flows.</p>
          <div className="space-y-2 mt-6 mb-4">
            {(settings.proxy_list || []).map((p, i) => (
              <div key={i} className="settings-list-row">
                <span className="flex-1 text-sm font-mono">{p}</span>
                <button className="text-gray-500 hover:text-rose-400 transition-colors" onClick={() => removeProxy(i)}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              className="input flex-1"
              value={newProxy}
              onChange={e => setNewProxy(e.target.value)}
              placeholder="http://host:port  or  socks5://host:port"
              onKeyDown={e => e.key === 'Enter' && addProxy()}
            />
            <button className="btn btn-secondary" onClick={addProxy}><Plus className="w-4 h-4" /> Add</button>
          </div>
        </section>
      )}
    </div>
  );
}
