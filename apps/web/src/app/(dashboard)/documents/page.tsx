"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { useAuthStore } from "@/stores/auth-store";
import {
  FileText,
  Upload,
  Trash2,
  RefreshCw,
  File,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Search,
  LogOut,
  MessageSquare,
  User,
  Sparkles,
  MoreHorizontal,
  PanelLeft,
  PanelLeftClose,
  Moon,
  Sun,
  Terminal,
  Database,
  ChevronDown,
  ChevronUp,
  Layers,
} from "lucide-react";
import { useThemeStore } from "@/stores/theme-store";
import LogViewerModal from "@/components/LogViewerModal";
import DashboardSidebar from "@/components/DashboardSidebar";

interface Document {
  id: string;
  title: string;
  filename: string;
  mimeType: string;
  size: number;
  status: string;
  createdAt: string;
  _count?: { chunks: number };
}

export default function DocumentsPage() {
  const router = useRouter();
  const { isAuthenticated, _hydrated, user, logout } = useAuthStore();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!_hydrated) return;
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    fetchDocuments();
  }, [_hydrated, isAuthenticated, router]);

  const fetchDocuments = async (q?: string) => {
    try {
      setLoading(true);
      const params: any = { limit: 50 };
      if (q) params.search = q;
      const { data } = await api.get("/documents", { params });
      setDocuments(data.data || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      console.error("Failed to fetch documents", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      await api.post("/documents/upload", formData);
      fetchDocuments(search);
    } catch (err: any) {
      console.error("Upload failed", err);
      const msg = err.response?.data?.message || err.message || "Upload failed";
      alert(msg);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this document?")) return;
    try {
      await api.delete(`/documents/${id}`);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      setTotal((t) => t - 1);
    } catch (err: any) {
      console.error("Delete failed", err);
    }
  };

  const readyDocs = documents.filter((d) => d.status === "READY");
  const totalChunks = readyDocs.reduce((acc, d) => acc + (d._count?.chunks || 0), 0);

  const statusIcon = (status: string) => {
    switch (status) {
      case "READY":
        return <CheckCircle2 size={16} className="text-emerald-600" strokeWidth={2} />;
      case "PROCESSING":
        return <Loader2 size={16} className="text-amber-600 animate-spin" strokeWidth={2} />;
      case "FAILED":
        return <AlertCircle size={16} className="text-red-600" strokeWidth={2} />;
      default:
        return <Clock size={16} className="text-gray-400" strokeWidth={2} />;
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "READY":
        return "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400";
      case "PROCESSING":
        return "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400";
      case "FAILED":
        return "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400";
      default:
        return "bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300";
    }
  };

  const fileIcon = (mimeType: string) => {
    if (mimeType.includes("pdf")) return <FileText size={18} strokeWidth={2} className="text-red-500" />;
    if (mimeType.includes("wordprocessing")) return <FileText size={18} strokeWidth={2} className="text-blue-500" />;
    return <File size={18} strokeWidth={2} className="text-gray-500" />;
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileExt = (mimeType: string) => {
    if (mimeType.includes("pdf")) return "PDF";
    if (mimeType.includes("wordprocessing")) return "DOCX";
    if (mimeType.includes("plain")) return "TXT";
    if (mimeType.includes("markdown")) return "MD";
    return mimeType.split("/").pop()?.toUpperCase() || "?";
  };

  if (!isAuthenticated) return null;

  const sidebarContent = (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Quick Stats */}
      <div className="px-3 py-3 mx-2.5 mt-1 rounded-lg bg-white/5 border border-white/10">
        <div className="text-[11px] text-white/40 uppercase tracking-wider font-semibold mb-2">Overview</div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[12px]">
            <span className="text-white/50">Total docs</span>
            <span className="text-white/80 font-medium">{total}</span>
          </div>
          <div className="flex items-center justify-between text-[12px]">
            <span className="text-white/50">Ready</span>
            <span className="text-emerald-400 font-medium">{readyDocs.length}</span>
          </div>
          <div className="flex items-center justify-between text-[12px]">
            <span className="text-white/50">Total chunks</span>
            <span className="text-blue-400 font-medium">{totalChunks}</span>
          </div>
        </div>
      </div>
      <div className="flex-1" />
    </div>
  );

  return (
    <div className="h-screen bg-white dark:bg-gray-950 flex overflow-hidden">
      <DashboardSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        showUserMenu={showUserMenu}
        setShowUserMenu={setShowUserMenu}
        onShowLogs={() => setShowLogModal(true)}
      >
        {sidebarContent}
      </DashboardSidebar>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#212121]">
        {/* Header */}
        <header className="h-14 border-b border-black/10 dark:border-white/10 flex items-center justify-between px-4 bg-white dark:bg-[#212121]">
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <button onClick={() => setSidebarOpen(true)} className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-black/5 dark:hover:bg-white/5 text-gray-600 dark:text-gray-300 transition-colors">
                <PanelLeft size={18} strokeWidth={2} />
              </button>
            )}
            <div className="w-6 h-6 rounded-md bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <FileText size={14} className="text-white" strokeWidth={2.5} />
            </div>
            <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white">Documents</h2>
            {documents.length > 0 && (
              <span className="text-[12px] text-gray-400 dark:text-gray-500">
                {total} file{total !== 1 ? "s" : ""}
                {totalChunks > 0 && ` · ${totalChunks} chunks`}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => fetchDocuments(search)} className="h-9 px-3.5 flex items-center gap-2 text-[13px] text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5 rounded-md transition-colors">
              <RefreshCw size={15} strokeWidth={2} />
              Refresh
            </button>
            <label className="h-9 px-3.5 flex items-center gap-2 bg-white dark:bg-white text-black hover:bg-gray-100 dark:hover:bg-gray-100 rounded-md transition-colors font-medium text-[13px] cursor-pointer border border-black/15 dark:border-white/15">
              {uploading ? <Loader2 size={14} className="animate-spin" strokeWidth={2} /> : <Upload size={14} strokeWidth={2} />}
              {uploading ? "Uploading..." : "Upload"}
              <input ref={fileRef} type="file" accept=".pdf,.docx,.doc,.txt,.md" className="hidden" onChange={handleUpload} disabled={uploading} />
            </label>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto bg-[#fafafa] dark:bg-[#212121]">
          <div className="max-w-5xl mx-auto p-5">
            {/* Stats Cards */}
            {documents.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <div className="bg-white dark:bg-[#2f2f2f] rounded-xl border border-gray-200 dark:border-white/8 p-3.5">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Database size={14} className="text-gray-400 dark:text-gray-500" strokeWidth={2} />
                    <span className="text-[11px] text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Total Files</span>
                  </div>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{total}</p>
                </div>
                <div className="bg-white dark:bg-[#2f2f2f] rounded-xl border border-gray-200 dark:border-white/8 p-3.5">
                  <div className="flex items-center gap-2 mb-1.5">
                    <CheckCircle2 size={14} className="text-emerald-500" strokeWidth={2} />
                    <span className="text-[11px] text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Ready</span>
                  </div>
                  <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{readyDocs.length}</p>
                </div>
                <div className="bg-white dark:bg-[#2f2f2f] rounded-xl border border-gray-200 dark:border-white/8 p-3.5">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Layers size={14} className="text-blue-500" strokeWidth={2} />
                    <span className="text-[11px] text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Total Chunks</span>
                  </div>
                  <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{totalChunks}</p>
                </div>
                <div className="bg-white dark:bg-[#2f2f2f] rounded-xl border border-gray-200 dark:border-white/8 p-3.5">
                  <div className="flex items-center gap-2 mb-1.5">
                    <AlertCircle size={14} className="text-red-500" strokeWidth={2} />
                    <span className="text-[11px] text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Failed</span>
                  </div>
                  <p className="text-xl font-bold text-red-600 dark:text-red-400">{documents.filter((d) => d.status === "FAILED").length}</p>
                </div>
              </div>
            )}

            {/* Search */}
            <div className="relative mb-6 max-w-md">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" strokeWidth={2} />
              <input
                type="text"
                placeholder="Search documents..."
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#303030] border border-gray-200 dark:border-white/10 rounded-xl text-[13px] text-gray-900 dark:text-[#ececec] placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black/15 dark:focus:ring-white/15 focus:border-transparent transition-shadow"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") fetchDocuments(search);
                }}
              />
            </div>

            {/* Documents */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 size={32} className="animate-spin text-gray-400 dark:text-gray-500" strokeWidth={2} />
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-14 h-14 rounded-xl bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center mx-auto mb-3 shadow-lg">
                  <FileText size={28} className="text-white" strokeWidth={2} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1.5">No documents yet</h3>
                <p className="text-[13px] text-gray-500 dark:text-gray-400 mb-5 max-w-sm mx-auto">Upload PDF, DOCX, TXT, or Markdown files to start asking questions about them</p>
                <label className="inline-flex items-center gap-2 h-9 px-4 bg-black hover:bg-gray-800 text-white rounded-md transition-colors font-medium text-[13px] cursor-pointer">
                  <Upload size={14} strokeWidth={2} />
                  Upload your first document
                  <input type="file" accept=".pdf,.docx,.doc,.txt,.md" className="hidden" onChange={handleUpload} />
                </label>
              </div>
            ) : (
              <div className="grid gap-2.5">
                {documents.map((doc) => {
                  const isExpanded = expandedId === doc.id;
                  const chunks = doc._count?.chunks || 0;
                  return (
                    <div key={doc.id} className="bg-white dark:bg-[#2f2f2f] rounded-xl border border-gray-200 dark:border-white/8 hover:border-gray-300 dark:hover:border-white/15 hover:shadow-sm transition-all group">
                      <div className="flex items-center gap-3.5 p-3.5">
                        <div className="w-9 h-9 rounded-lg bg-linear-to-br from-blue-50 to-blue-100 dark:from-white/8 dark:to-white/5 flex items-center justify-center shrink-0">{fileIcon(doc.mimeType)}</div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-[14px] text-gray-900 dark:text-[#ececec] truncate mb-0.5">{doc.title}</h3>
                          <div className="flex items-center gap-2 text-[12px] text-gray-500 dark:text-gray-400">
                            <span className="inline-flex items-center px-1.5 py-0.5 bg-gray-100 dark:bg-white/10 rounded text-[10px] font-bold uppercase tracking-wider">{getFileExt(doc.mimeType)}</span>
                            <span>{formatSize(doc.size)}</span>
                            <span className="opacity-40">·</span>
                            <span>{new Date(doc.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                            {doc.status === "READY" && chunks > 0 && (
                              <>
                                <span className="opacity-40">·</span>
                                <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium">
                                  <Layers size={11} strokeWidth={2.5} />
                                  {chunks} chunk{chunks !== 1 ? "s" : ""}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {doc.status === "READY" && chunks > 0 && (
                            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-[11px] font-medium cursor-default" title={`${chunks} chunks extracted`}>
                              <Database size={11} strokeWidth={2.5} />
                              {chunks} chunks
                            </div>
                          )}
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${statusColor(doc.status)}`}>
                            {statusIcon(doc.status)}
                            {doc.status === "READY" ? "Ready" : doc.status === "PROCESSING" ? "Processing" : doc.status === "FAILED" ? "Failed" : doc.status}
                          </span>
                          <button onClick={() => setExpandedId(isExpanded ? null : doc.id)} className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 rounded-md transition-all opacity-0 group-hover:opacity-100">
                            {isExpanded ? <ChevronUp size={16} strokeWidth={2} /> : <ChevronDown size={16} strokeWidth={2} />}
                          </button>
                          <button onClick={() => handleDelete(doc.id)} className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-all opacity-0 group-hover:opacity-100" title="Delete">
                            <Trash2 size={16} strokeWidth={2} />
                          </button>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="px-3.5 pb-3.5 pt-0 border-t border-gray-100 dark:border-white/5">
                          <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
                            <div className="bg-gray-50 dark:bg-white/5 rounded-lg p-2.5">
                              <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider font-medium block mb-1">File Type</span>
                              <span className="text-[13px] text-gray-800 dark:text-gray-200 font-medium">{getFileExt(doc.mimeType)} ({doc.mimeType.split("/").pop()})</span>
                            </div>
                            <div className="bg-gray-50 dark:bg-white/5 rounded-lg p-2.5">
                              <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider font-medium block mb-1">File Size</span>
                              <span className="text-[13px] text-gray-800 dark:text-gray-200 font-medium">{formatSize(doc.size)} ({doc.size.toLocaleString()} bytes)</span>
                            </div>
                            <div className="bg-gray-50 dark:bg-white/5 rounded-lg p-2.5">
                              <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider font-medium block mb-1">Uploaded</span>
                              <span className="text-[13px] text-gray-800 dark:text-gray-200 font-medium">{new Date(doc.createdAt).toLocaleString()}</span>
                            </div>
                            <div className="bg-gray-50 dark:bg-white/5 rounded-lg p-2.5">
                              <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider font-medium block mb-1">Chunks</span>
                              <span className="text-[13px] text-gray-800 dark:text-gray-200 font-medium">
                                {doc.status === "READY" ? (
                                  <><span className="text-blue-600 dark:text-blue-400">{chunks}</span> chunks extracted</>
                                ) : doc.status === "PROCESSING" ? (
                                  <span className="text-amber-600 dark:text-amber-400">Processing...</span>
                                ) : doc.status === "FAILED" ? (
                                  <span className="text-red-600 dark:text-red-400">Failed</span>
                                ) : "N/A"}
                              </span>
                            </div>
                            <div className="bg-gray-50 dark:bg-white/5 rounded-lg p-2.5">
                              <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider font-medium block mb-1">Status</span>
                              <span className={`text-[13px] font-medium ${doc.status === "READY" ? "text-emerald-600 dark:text-emerald-400" : doc.status === "PROCESSING" ? "text-amber-600 dark:text-amber-400" : doc.status === "FAILED" ? "text-red-600 dark:text-red-400" : "text-gray-600 dark:text-gray-400"}`}>{doc.status}</span>
                            </div>
                            <div className="bg-gray-50 dark:bg-white/5 rounded-lg p-2.5">
                              <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider font-medium block mb-1">Document ID</span>
                              <span className="text-[11px] text-gray-500 dark:text-gray-400 font-mono truncate block">{doc.id}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      <LogViewerModal open={showLogModal} onClose={() => setShowLogModal(false)} />
    </div>
  );
}
