import { useState, useRef } from 'react';
import { Shield, Download, X, Loader2 } from 'lucide-react';
import api from '../utils/api';

export default function WhitelistChecker() {
  const [servers, setServers] = useState('');
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const pollRef = useRef(null);

  const startCheck = async () => {
    const list = servers.split('\n').map(s => s.trim()).filter(Boolean);
    if (!list.length) { setError('Enter at least one server.'); return; }

    setScanning(true);
    setResults([]);
    setProgress(0);
    setError('');
    setStatus('Starting whitelist check...');
    try {
      const data = await api.post('/whitelist/check', { servers: list });
      pollRef.current = setInterval(async () => {
        try {
          const task = await api.get(`/tasks/${data.task_id}`);
          setResults(task.results);
          setProgress(task.progress);
          const open = task.results.filter(r => r.status === 'not_whitelisted').length;
          const wl = task.results.filter(r => r.status === 'whitelisted').length;
          setStatus(task.status === 'running' ? `Checking... ${task.results.length} done` : '');
          if (task.status !== 'running') {
            clearInterval(pollRef.current);
            setScanning(false);
            if (task.status === 'failed') setError(task.error);
            else setStatus(`Complete — ${open} open, ${wl} whitelisted`);
          }
        } catch { /* ignore */ }
      }, 1000);
    } catch (e) {
      setError(e.message);
      setScanning(false);
    }
  };

  const cancelCheck = () => {
    clearInterval(pollRef.current);
    setScanning(false);
    setStatus('Cancelled');
  };

  const exportCSV = () => {
    if (!results.length) return;
    const headers = Object.keys(results[0]);
    const rows = results.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'whitelist_results.csv';
    a.click();
  };

  const statusBadge = (st) => {
    const map = {
      not_whitelisted: { label: 'Open',        cls: 'bg-purple-500/10 text-purple-400', dot: 'bg-purple-400' },
      whitelisted:     { label: 'Whitelisted',  cls: 'bg-rose-500/10 text-rose-400',      dot: 'bg-rose-400' },
      error:           { label: 'Error',        cls: 'bg-amber-500/10 text-amber-400',     dot: 'bg-amber-400' },
    };
    const s = map[st] || { label: st, cls: 'bg-gray-500/10 text-gray-400', dot: 'bg-gray-400' };
    return (
      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${s.cls}`}>
        <span className={`w-1 h-1 rounded-full ${s.dot}`} /> {s.label}
      </span>
    );
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-8 tracking-tight">Whitelist Checker</h1>

      <div className="glass rounded-xl p-6 mb-6">
        <div className="mb-5">
          <label className="block text-xs text-gray-500 font-medium mb-1.5 uppercase tracking-wider">Server List</label>
          <textarea
            className="input h-32"
            value={servers}
            onChange={e => setServers(e.target.value)}
            placeholder={"One IP:port per line:\n192.168.1.10:25565\n10.0.0.1:25565"}
          />
        </div>
        <div className="flex items-center gap-3">
          <button className="btn btn-primary" onClick={startCheck} disabled={scanning}>
            {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
            {scanning ? 'Checking...' : 'Start Check'}
          </button>
          {scanning && (
            <button className="btn btn-danger" onClick={cancelCheck}>
              <X className="w-4 h-4" /> Cancel
            </button>
          )}
          {results.length > 0 && (
            <button className="btn btn-secondary ml-auto" onClick={exportCSV}>
              <Download className="w-4 h-4" /> Export CSV
            </button>
          )}
        </div>
      </div>

      {(scanning || progress > 0) && (
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
            <span>{status}</span><span>{progress}%</span>
          </div>
          <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
            <div className="h-full bg-violet-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {error && <div className="mb-6 p-4 rounded-xl bg-rose-500/[0.08] border border-rose-500/20 text-rose-400 text-sm">{error}</div>}

      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {['IP', 'Port', 'Status', 'Notes'].map(h => (
                  <th key={h} className="text-left py-3 px-5 text-gray-500 font-medium text-xs uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.length > 0 ? results.map((r, i) => (
                <tr key={i} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 px-5 font-mono text-xs text-purple-400">{r.ip}</td>
                  <td className="py-3 px-5 text-gray-400">{r.port}</td>
                  <td className="py-3 px-5">{statusBadge(r.status)}</td>
                  <td className="py-3 px-5 text-gray-500 text-xs max-w-[300px] truncate">{r.notes || '—'}</td>
                </tr>
              )) : (
                <tr><td colSpan={4} className="py-12 text-center text-gray-600 text-sm">No results yet. Enter servers and start a check.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
