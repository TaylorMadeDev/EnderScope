import { useState, useRef, useCallback } from 'react';
import { Search, Download, X, Loader2 } from 'lucide-react';
import api from '../utils/api';

export default function ShodanSearch() {
  const [version, setVersion] = useState('1.20');
  const [extra, setExtra] = useState('smp');
  const [maxResults, setMaxResults] = useState(100);
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const pollRef = useRef(null);

  const startScan = async () => {
    setScanning(true);
    setResults([]);
    setProgress(0);
    setError('');
    setStatus('Starting Shodan search...');
    try {
      const data = await api.post('/shodan/search', { version, extra_query: extra, max_results: maxResults });
      pollRef.current = setInterval(async () => {
        try {
          const task = await api.get(`/tasks/${data.task_id}`);
          setResults(task.results);
          setProgress(task.progress);
          setStatus(task.status === 'running' ? `Searching... ${task.results.length} found` : '');
          if (task.status !== 'running') {
            clearInterval(pollRef.current);
            setScanning(false);
            if (task.status === 'failed') setError(task.error);
            else setStatus(`Complete — ${task.results.length} servers found`);
          }
        } catch { /* ignore poll errors */ }
      }, 1200);
    } catch (e) {
      setError(e.message);
      setScanning(false);
    }
  };

  const cancelScan = () => {
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
    a.download = 'shodan_results.csv';
    a.click();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-8 tracking-tight">Shodan Search</h1>

      {/* Controls */}
      <div className="glass rounded-xl p-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
          <div>
            <label className="block text-xs text-gray-500 font-medium mb-1.5 uppercase tracking-wider">MC Version</label>
            <input className="input" value={version} onChange={e => setVersion(e.target.value)} placeholder="1.20" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 font-medium mb-1.5 uppercase tracking-wider">Extra Query</label>
            <input className="input" value={extra} onChange={e => setExtra(e.target.value)} placeholder="smp survival" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 font-medium mb-1.5 uppercase tracking-wider">Max Results</label>
            <input className="input" type="number" value={maxResults} onChange={e => setMaxResults(Number(e.target.value))} min={1} max={10000} />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn btn-primary" onClick={startScan} disabled={scanning}>
            {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {scanning ? 'Searching...' : 'Start Search'}
          </button>
          {scanning && (
            <button className="btn btn-danger" onClick={cancelScan}>
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

      {/* Progress */}
      {(scanning || progress > 0) && (
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
            <span>{status}</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
            <div className="h-full bg-purple-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-500/[0.08] border border-rose-500/20 text-rose-400 text-sm">{error}</div>
      )}

      {/* Results table */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {['IP', 'Port', 'Version', 'MOTD', 'Players', 'Status'].map(h => (
                  <th key={h} className="text-left py-3 px-5 text-gray-500 font-medium text-xs uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.length > 0 ? results.map((r, i) => (
                <tr key={i} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 px-5 font-mono text-xs text-purple-400">{r.ip}</td>
                  <td className="py-3 px-5 text-gray-400">{r.port}</td>
                  <td className="py-3 px-5">{r.version || '—'}</td>
                  <td className="py-3 px-5 text-gray-400 max-w-[200px] truncate">{r.motd || '—'}</td>
                  <td className="py-3 px-5 text-gray-400">{r.players_online}/{r.players_max}</td>
                  <td className="py-3 px-5">
                    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400">
                      <span className="w-1 h-1 bg-purple-400 rounded-full" /> {r.status}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={6} className="py-12 text-center text-gray-600 text-sm">No results yet. Start a search above.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
