"use client";

import { useState, useEffect, useRef } from "react";
import api from "@/lib/axios";
import { X, Loader2, Terminal, Trash2, RefreshCw } from "lucide-react";

interface LogEntry {
  id: string;
  timestamp: string;
  level: "INFO" | "WARN" | "ERROR" | "DEBUG";
  action: string;
  message: string;
  metadata?: Record<string, any>;
}

interface LogViewerModalProps {
  open: boolean;
  onClose: () => void;
}

export default function LogViewerModal({ open, onClose }: LogViewerModalProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<string>("ALL");
  const [autoRefresh, setAutoRefresh] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params: any = { limit: 200 };
      if (filter !== "ALL") params.level = filter;
      const { data } = await api.get("/logs", { params });
      setLogs(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Failed to fetch logs", err);
    } finally {
      setLoading(false);
    }
  };

  const clearLogs = async () => {
    try {
      await api.delete("/logs");
      setLogs([]);
    } catch (err) {
      console.error("Failed to clear logs", err);
    }
  };

  useEffect(() => {
    if (open) {
      fetchLogs();
    }
  }, [open, filter]);

  // Auto-refresh every 3 seconds
  useEffect(() => {
    if (autoRefresh && open) {
      intervalRef.current = setInterval(fetchLogs, 3000);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [autoRefresh, open]);

  const levelColor = (level: string) => {
    switch (level) {
      case "ERROR":
        return "text-red-400 bg-red-500/10";
      case "WARN":
        return "text-amber-400 bg-amber-500/10";
      case "INFO":
        return "text-emerald-400 bg-emerald-500/10";
      case "DEBUG":
        return "text-blue-400 bg-blue-500/10";
      default:
        return "text-gray-400 bg-gray-500/10";
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-4xl max-h-[80vh] bg-[#1a1a1a] rounded-2xl shadow-2xl border border-white/10 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
              <Terminal size={16} className="text-white" strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-white">Application Logs</h2>
              <p className="text-[11px] text-gray-400">{logs.length} entries</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Auto Refresh Toggle */}
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                autoRefresh ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10"
              }`}
            >
              {autoRefresh ? "Live" : "Manual"}
            </button>

            {/* Refresh */}
            <button onClick={fetchLogs} disabled={loading} className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors disabled:opacity-50" title="Refresh">
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} strokeWidth={2} />
            </button>

            {/* Clear */}
            <button onClick={clearLogs} className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-red-400 transition-colors" title="Clear logs">
              <Trash2 size={15} strokeWidth={2} />
            </button>

            {/* Close */}
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors" title="Close">
              <X size={18} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 px-5 py-2.5 border-b border-white/5">
          {["ALL", "INFO", "WARN", "ERROR", "DEBUG"].map((lvl) => (
            <button key={lvl} onClick={() => setFilter(lvl)} className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${filter === lvl ? "bg-white/15 text-white" : "text-gray-500 hover:text-gray-300 hover:bg-white/5"}`}>
              {lvl === "ALL" ? "All" : lvl}
            </button>
          ))}
        </div>

        {/* Log List */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-3 space-y-1 font-mono text-[12px] leading-relaxed custom-scrollbar">
          {loading && logs.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={20} className="animate-spin text-gray-500" strokeWidth={2} />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No logs yet</p>
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 px-3 py-2 rounded-lg hover:bg-white/[0.03] transition-colors">
                {/* Timestamp */}
                <span className="text-gray-500 whitespace-nowrap flex-shrink-0 w-[140px]">
                  {new Date(log.timestamp).toLocaleTimeString("en-US", {
                    hour12: false,
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </span>

                {/* Level Badge */}
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold uppercase flex-shrink-0 w-[52px] justify-center ${levelColor(log.level)}`}>{log.level}</span>

                {/* Action */}
                <span className="text-emerald-400 flex-shrink-0 w-[130px] truncate" title={log.action}>
                  {log.action}
                </span>

                {/* Message */}
                <span className="text-gray-300 flex-1 min-w-0 truncate" title={log.message}>
                  {log.message}
                </span>

                {/* Metadata hint */}
                {log.metadata && Object.keys(log.metadata).length > 0 && <span className="text-gray-500 flex-shrink-0 text-[11px]">{Object.keys(log.metadata).length} fields</span>}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-white/10 flex items-center justify-between">
          <span className="text-[11px] text-gray-500">{autoRefresh ? "Auto-refreshing every 3s" : "Click refresh to update"}</span>
          <span className="text-[11px] text-gray-500">
            Showing {logs.length} of {logs.length} entries
          </span>
        </div>
      </div>
    </div>
  );
}
