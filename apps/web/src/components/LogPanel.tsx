import { useState, useEffect, useRef, useCallback } from 'react';
import { Terminal, X, ChevronDown, ChevronUp, Trash2, AlertCircle, Info, AlertTriangle, Bug } from 'lucide-react';
import api from '../lib/axios';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  action: string;
  message: string;
  metadata?: Record<string, any>;
}

const levelConfig = {
  INFO: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-100' },
  WARN: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100' },
  ERROR: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-100' },
  DEBUG: { icon: Bug, color: 'text-gray-400', bg: 'bg-gray-50', border: 'border-gray-100' },
};

export default function LogPanel() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [autoScroll, setAutoScroll] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchLogs = useCallback(async () => {
    try {
      const params = filter !== 'all' ? { level: filter } : {};
      const { data } = await api.get('/logs', { params });
      setLogs(data || []);
    } catch (err) {
      // Silently fail — don't spam if logs endpoint fails
    }
  }, [filter]);

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
      // Poll every 2 seconds when panel is open
      pollingRef.current = setInterval(fetchLogs, 2000);
    } else {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    }
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [isOpen, fetchLogs]);

  useEffect(() => {
    if (autoScroll && isOpen) {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll, isOpen]);

  const clearLogs = async () => {
    setLogs([]);
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const filteredLogs = logs;

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-2xl shadow-lg transition-all duration-200 ${
          isOpen
            ? 'bg-gray-900 text-white hover:bg-gray-800'
            : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700'
        }`}
        title={isOpen ? 'Close Log Panel' : 'Open Log Panel'}
      >
        <Terminal className="w-4 h-4" />
        <span className="text-sm font-medium">
          {isOpen ? 'Close Logs' : `Logs (${logs.length})`}
        </span>
        {isOpen ? (
          <ChevronDown className="w-3.5 h-3.5" />
        ) : logs.some(l => l.level === 'ERROR') ? (
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        ) : (
          <ChevronUp className="w-3.5 h-3.5" />
        )}
      </button>

      {/* Log panel */}
      <div
        className={`fixed bottom-0 right-0 z-40 w-full md:w-[520px] bg-white border-l border-t border-gray-200 shadow-2xl transition-all duration-300 ease-in-out ${
          isOpen ? 'translate-y-0 max-h-[50vh]' : 'translate-y-full max-h-0'
        }`}
        style={{ bottom: '72px', right: '24px', borderRadius: '16px 16px 0 0' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-gray-600" />
            <h3 className="text-sm font-semibold text-gray-800">Activity Logs</h3>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              {filteredLogs.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* Level filter */}
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1 text-gray-600 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
            >
              <option value="all">All</option>
              <option value="INFO">Info</option>
              <option value="WARN">Warn</option>
              <option value="ERROR">Error</option>
              <option value="DEBUG">Debug</option>
            </select>
            <button
              onClick={clearLogs}
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Clear logs"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Log entries */}
        <div
          className="overflow-y-auto"
          style={{ maxHeight: 'calc(50vh - 112px)' }}
          onScroll={(e) => {
            const el = e.currentTarget;
            const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
            setAutoScroll(isAtBottom);
          }}
        >
          {filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Terminal className="w-8 h-8 mb-2 text-gray-200" />
              <p className="text-sm font-medium">No logs yet</p>
              <p className="text-xs mt-1">Interact with the app to see activity logs</p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {filteredLogs.map((log) => {
                const config = levelConfig[log.level] || levelConfig.INFO;
                const Icon = config.icon;
                const isError = log.level === 'ERROR';
                const isWarn = log.level === 'WARN';

                return (
                  <div
                    key={log.id}
                    className={`group flex items-start gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors ${
                      isError ? 'bg-red-50/50 hover:bg-red-50' : isWarn ? 'bg-amber-50/30 hover:bg-amber-50/50' : 'hover:bg-gray-50'
                    }`}
                  >
                    {/* Level icon */}
                    <div className={`mt-0.5 flex-shrink-0 ${config.color}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 font-mono">{formatTime(log.timestamp)}</span>
                        <span className={`font-semibold font-mono text-[10px] uppercase ${
                          isError ? 'text-red-600' : isWarn ? 'text-amber-600' : 'text-gray-500'
                        }`}>
                          {log.action}
                        </span>
                      </div>
                      <p className={`mt-0.5 leading-relaxed ${isError ? 'text-red-700' : 'text-gray-700'}`}>
                        {log.message}
                      </p>
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <details className="mt-1">
                          <summary className="text-[10px] text-gray-400 cursor-pointer hover:text-gray-600">
                            Show metadata
                          </summary>
                          <pre className="mt-1 p-2 bg-gray-50 rounded-lg text-[10px] text-gray-500 overflow-x-auto max-h-32 overflow-y-auto font-mono">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={logsEndRef} />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-gray-100 bg-gray-50/50">
          <div className="flex items-center justify-between text-[10px] text-gray-400">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-400" />
                Live
              </span>
              <span>Polling 2s</span>
            </div>
            <button
              onClick={fetchLogs}
              className="text-blue-500 hover:text-blue-700 font-medium"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
