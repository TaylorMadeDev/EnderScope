import { useState, useEffect, useRef } from 'react';
import { Trash2, ArrowDown } from 'lucide-react';
import api from '../utils/api';

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => {
    api.get('/logs').then(d => setLogs(d.logs || [])).catch(() => {});
    const id = setInterval(() => {
      api.get('/logs').then(d => setLogs(d.logs || [])).catch(() => {});
    }, 2000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const levelColor = (line) => {
    if (line.includes('ERROR') || line.includes('CRITICAL')) return 'text-rose-400';
    if (line.includes('WARNING')) return 'text-amber-400';
    if (line.includes('DEBUG')) return 'text-gray-500';
    return 'text-purple-400/80';
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Application Logs</h1>
        <div className="flex items-center gap-2">
          <button className="btn btn-secondary text-xs" onClick={() => setAutoScroll(!autoScroll)}>
            <ArrowDown className={`w-3.5 h-3.5 ${autoScroll ? 'text-purple-400' : ''}`} />
            Auto-scroll {autoScroll ? 'ON' : 'OFF'}
          </button>
          <button className="btn btn-secondary text-xs" onClick={() => setLogs([])}>
            <Trash2 className="w-3.5 h-3.5" /> Clear
          </button>
        </div>
      </div>

      <div className="flex-1 glass rounded-xl overflow-hidden min-h-0">
        <div className="h-full overflow-y-auto p-5 font-mono text-[12px] leading-[1.85] bg-[#0a0618]">
          {logs.length > 0 ? (
            logs.map((line, i) => (
              <div key={i} className={`${levelColor(line)} whitespace-pre-wrap`}>{line}</div>
            ))
          ) : (
            <div className="text-gray-600 text-sm text-center py-20">No log entries yet. Start a scan to see live output here.</div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  );
}
