import { useState, useRef } from 'react';
import { Zap, Download, X, Loader2 } from 'lucide-react';
import api from '../utils/api';

export default function Bruteforce() {
  const [targets, setTargets] = useState('');
  const [threads, setThreads] = useState(50);
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
    setStatus('Starting port scan...');
    try {
      const data = await api.post('/bruteforce/scan', { targets, threads });
      pollRef.current = setInterval(async () => {
        try {
          const task = await api.get(`/tasks/${data.task_id}`);
          setResults(task.results);
          setProgress(task.progress);
          setStatus(task.status === 'running' ? `Scanning... ${task.results.length} found` : '');
          if (task.status !== 'running') {
            clearInterval(pollRef.current);
            setScanning(false);
            if (task.status === 'failed') setError(task.error);
            else setStatus(`Complete — ${task.results.length} open servers`);
          }
        } catch { /* ignore */ }
      }, 1000);
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
    a.download = 'bruteforce_results.csv';
    a.click();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-8 tracking-tight">Bruteforce / Port Scanner</h1>

      <div className="glass rounded-xl p-6 mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_200px] gap-4 mb-5">
          <div>
            <label className="block text-xs text-gray-500 font-medium mb-1.5 uppercase tracking-wider">Targets</label>
            <textarea
              className="input h-28"
              value={targets}
              onChange={e => setTargets(e.target.value)}
              placeholder={"One per line:\n192.168.1.0/24\n10.0.0.1:25565\n172.16.0.1"}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 font-medium mb-1.5 uppercase tracking-wider">Threads</label>
            <input className="input" type="number" value={threads} onChange={e => setThreads(Number(e.target.value))} min={1} max={500} />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn btn-primary" onClick={startScan} disabled={scanning}>
            {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            {scanning ? 'Scanning...' : 'Start Scan'}
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

      {(scanning || progress > 0) && (
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
            <span>{status}</span><span>{progress}%</span>
          </div>
          <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {error && <div className="mb-6 p-4 rounded-xl bg-rose-500/[0.08] border border-rose-500/20 text-rose-400 text-sm">{error}</div>}

      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {['IP', 'Port', 'Status', 'Latency', 'Source'].map(h => (
                  <th key={h} className="text-left py-3 px-5 text-gray-500 font-medium text-xs uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.length > 0 ? results.map((r, i) => (
                <tr key={i} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 px-5 font-mono text-xs text-purple-400">{r.ip}</td>
                  <td className="py-3 px-5 text-gray-400">{r.port}</td>
                  <td className="py-3 px-5">
                    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400">
                      <span className="w-1 h-1 bg-purple-400 rounded-full" /> {r.status}
                    </span>
                  </td>
                  <td className="py-3 px-5 text-gray-400">{r.latency_ms ? `${Number(r.latency_ms).toFixed(1)}ms` : '—'}</td>
                  <td className="py-3 px-5 text-gray-500">{r.source}</td>
                </tr>
              )) : (
                <tr><td colSpan={5} className="py-12 text-center text-gray-600 text-sm">No results yet. Enter targets and start a scan.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
