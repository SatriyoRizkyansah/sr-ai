"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { useAuthStore } from "@/stores/auth-store";
import { CommandPalette } from "@/components/command-palette";
import { Sidebar } from "@/components/sidebar";
import { Navbar } from "@/components/navbar";
import { 
  FileText, Upload, Trash2, RefreshCw, File, Loader2, 
  AlertCircle, CheckCircle2, Clock, Search, ChevronDown, ChevronUp,
  Package, FileCode, Database, HardDrive, Files
} from "lucide-react";

interface DocumentChunk {
  id: string;
  content: string;
  pageNumber: number | null;
}

interface Document {
  id: string;
  title: string;
  filename: string;
  mimeType: string;
  size: number;
  status: string;
  createdAt: string;
  _count?: {
    chunks: number;
  };
  chunks?: DocumentChunk[];
}

export default function DocumentsPage() {
  const router = useRouter();
  const { isAuthenticated, _hydrated } = useAuthStore();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalDocuments: 0,
    totalChunks: 0,
    totalSize: 0,
    readyCount: 0,
    processingCount: 0,
    failedCount: 0
  });
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!_hydrated) return; // Wait for hydration
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
      const docs = data.data || [];
      setDocuments(docs);
      setTotal(data.total || 0);
      
      // Calculate stats
      const totalChunks = docs.reduce((sum: number, doc: Document) => sum + (doc._count?.chunks || 0), 0);
      const totalSize = docs.reduce((sum: number, doc: Document) => sum + doc.size, 0);
      const readyCount = docs.filter((d: Document) => d.status === "READY").length;
      const processingCount = docs.filter((d: Document) => d.status === "PROCESSING").length;
      const failedCount = docs.filter((d: Document) => d.status === "FAILED").length;
      
      setStats({
        totalDocuments: docs.length,
        totalChunks,
        totalSize,
        readyCount,
        processingCount,
        failedCount
      });
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
      await api.post("/documents/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      fetchDocuments(search);
    } catch (err: any) {
      console.error("Upload failed", err);
      alert(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this document?")) return;
    try {
      await api.delete(`/documents/${id}`);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      setTotal((t) => t - 1);
      if (expandedDoc === id) setExpandedDoc(null);
      // Refresh to update stats
      fetchDocuments(search);
    } catch (err: any) {
      console.error("Delete failed", err);
    }
  };

  const toggleExpand = (docId: string) => {
    if (expandedDoc === docId) {
      setExpandedDoc(null);
    } else {
      setExpandedDoc(docId);
    }
  };

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

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (!isAuthenticated) return null;

  return (
    <>
      <CommandPalette />
      <div className="h-screen bg-white dark:bg-gray-950 flex overflow-hidden">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-gray-950">
          <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} title="Documents" />

          <div className="flex-1 overflow-auto bg-white dark:bg-gray-950">
            <div className="max-w-7xl mx-auto p-8">
              {/* Statistics Cards - Sleek ChatGPT Style */}
              {!loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                  {/* Total Documents */}
                  <div className="group relative bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200/60 dark:border-gray-700/60 p-4 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                        <Files size={20} className="text-blue-600 dark:text-blue-400" strokeWidth={2} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-0.5">Documents</p>
                        <p className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">{stats.totalDocuments}</p>
                      </div>
                    </div>
                    {stats.totalDocuments > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/50 flex items-center gap-2 text-xs">
                        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                          <div className="w-1 h-1 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                          {stats.readyCount}
                        </span>
                        {stats.processingCount > 0 && (
                          <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                            <div className="w-1 h-1 rounded-full bg-amber-600 dark:bg-amber-400 animate-pulse" />
                            {stats.processingCount}
                          </span>
                        )}
                        {stats.failedCount > 0 && (
                          <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                            <div className="w-1 h-1 rounded-full bg-red-600 dark:bg-red-400" />
                            {stats.failedCount}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Total Chunks */}
                  <div className="group relative bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200/60 dark:border-gray-700/60 p-4 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                        <Database size={20} className="text-emerald-600 dark:text-emerald-400" strokeWidth={2} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-0.5">Chunks</p>
                        <p className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">{stats.totalChunks.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/50">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {stats.totalDocuments > 0 
                          ? `${Math.round(stats.totalChunks / stats.totalDocuments)} avg per doc`
                          : 'No chunks generated'}
                      </p>
                    </div>
                  </div>

                  {/* Total Storage */}
                  <div className="group relative bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200/60 dark:border-gray-700/60 p-4 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-500/10 dark:bg-purple-500/20 flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                        <HardDrive size={20} className="text-purple-600 dark:text-purple-400" strokeWidth={2} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-0.5">Storage</p>
                        <p className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">{formatSize(stats.totalSize)}</p>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/50">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {stats.totalDocuments > 0
                          ? `${formatSize(stats.totalSize / stats.totalDocuments)} avg`
                          : 'No storage used'}
                      </p>
                    </div>
                  </div>

                  {/* Success Rate */}
                  <div className="group relative bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200/60 dark:border-gray-700/60 p-4 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                        <CheckCircle2 size={20} className="text-amber-600 dark:text-amber-400" strokeWidth={2} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-0.5">Success</p>
                        <p className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">
                          {stats.totalDocuments > 0 
                            ? `${Math.round((stats.readyCount / stats.totalDocuments) * 100)}%`
                            : '0%'}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/50">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {stats.readyCount} of {stats.totalDocuments}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Header Actions */}
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">Your Documents</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {total} {total === 1 ? 'document' : 'documents'} uploaded
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => fetchDocuments(search)} 
                    className="h-10 px-4 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                  >
                    <RefreshCw size={16} strokeWidth={2} />
                    <span className="hidden sm:inline">Refresh</span>
                  </button>
                  <label className="h-10 px-5 flex items-center gap-2 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 rounded-xl transition-all font-medium text-sm cursor-pointer shadow-sm hover:shadow">
                    {uploading ? <Loader2 size={16} className="animate-spin" strokeWidth={2} /> : <Upload size={16} strokeWidth={2} />}
                    {uploading ? "Uploading..." : "Upload"}
                    <input ref={fileRef} type="file" accept=".pdf,.docx,.doc,.txt,.md" className="hidden" onChange={handleUpload} disabled={uploading} />
                  </label>
                </div>
              </div>

              {/* Search */}
              <div className="relative mb-6">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" strokeWidth={2} />
                <input
                  type="text"
                  placeholder="Search documents..."
                  className="w-full pl-11 pr-4 py-3 bg-white dark:bg-gray-800/50 border border-gray-200/60 dark:border-gray-700/60 rounded-xl text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:border-transparent transition-all"
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
                  <Loader2 size={32} className="animate-spin text-gray-400" strokeWidth={2} />
                </div>
              ) : documents.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mx-auto mb-4 shadow-xl">
                    <FileText size={32} className="text-white" strokeWidth={2.5} />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No documents yet</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                    Upload PDF, DOCX, TXT, or Markdown files to start asking questions about them
                  </p>
                  <label className="inline-flex items-center gap-2 h-11 px-5 bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black rounded-xl transition-colors font-medium text-sm cursor-pointer">
                    <Upload size={16} strokeWidth={2} />
                    Upload your first document
                    <input type="file" accept=".pdf,.docx,.doc,.txt,.md" className="hidden" onChange={handleUpload} />
                  </label>
                </div>
              ) : (
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="group relative bg-white dark:bg-gray-800/50 rounded-lg border border-gray-200/60 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 overflow-hidden"
                    >
                      {/* Main Document Info */}
                      <div 
                        className="px-4 py-3 cursor-pointer"
                        onClick={() => toggleExpand(doc.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-200">
                            <File size={18} strokeWidth={2} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-[15px] text-gray-900 dark:text-white truncate mb-1">{doc.title}</h3>
                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                              <span className="inline-flex items-center gap-1 font-medium">
                                {doc.mimeType.split("/").pop()?.toUpperCase()}
                              </span>
                              <div className="w-0.5 h-0.5 rounded-full bg-gray-300 dark:bg-gray-600" />
                              <span>{formatSize(doc.size)}</span>
                              {doc._count && (
                                <>
                                  <div className="w-0.5 h-0.5 rounded-full bg-gray-300 dark:bg-gray-600" />
                                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                                    {doc._count.chunks} chunks
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${
                              doc.status === "READY" 
                                ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                                : doc.status === "PROCESSING"
                                ? "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400"
                                : doc.status === "FAILED"
                                ? "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400"
                                : "bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-400"
                            }`}>
                              {statusIcon(doc.status)}
                              <span className="hidden sm:inline">{doc.status}</span>
                            </span>
                            <button 
                              onClick={(e) => handleDelete(doc.id, e)} 
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-all opacity-0 group-hover:opacity-100"
                              title="Delete"
                            >
                              <Trash2 size={15} strokeWidth={2} />
                            </button>
                            {expandedDoc === doc.id ? (
                              <ChevronUp size={16} className="text-gray-400" strokeWidth={2} />
                            ) : (
                              <ChevronDown size={16} className="text-gray-400" strokeWidth={2} />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {expandedDoc === doc.id && (
                        <div className="border-t border-gray-200/60 dark:border-gray-700/60 bg-gray-50/50 dark:bg-gray-900/30 px-4 py-3">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                            {/* Created Date */}
                            <div className="bg-white dark:bg-gray-800/50 rounded-lg p-3 border border-gray-200/60 dark:border-gray-700/60">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-7 h-7 rounded-md bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center">
                                  <Clock size={14} className="text-blue-600 dark:text-blue-400" strokeWidth={2} />
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Created</p>
                              </div>
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                {new Date(doc.createdAt).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </p>
                            </div>

                            {/* File Size */}
                            <div className="bg-white dark:bg-gray-800/50 rounded-lg p-3 border border-gray-200/60 dark:border-gray-700/60">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-7 h-7 rounded-md bg-purple-500/10 dark:bg-purple-500/20 flex items-center justify-center">
                                  <Package size={14} className="text-purple-600 dark:text-purple-400" strokeWidth={2} />
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Size</p>
                              </div>
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatSize(doc.size)}</p>
                            </div>

                            {/* Chunks */}
                            <div className="bg-white dark:bg-gray-800/50 rounded-lg p-3 border border-gray-200/60 dark:border-gray-700/60">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-7 h-7 rounded-md bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center">
                                  <Database size={14} className="text-emerald-600 dark:text-emerald-400" strokeWidth={2} />
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Chunks</p>
                              </div>
                              <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                                {doc._count?.chunks || 0}
                              </p>
                            </div>

                            {/* Type */}
                            <div className="bg-white dark:bg-gray-800/50 rounded-lg p-3 border border-gray-200/60 dark:border-gray-700/60">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-7 h-7 rounded-md bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center">
                                  <FileCode size={14} className="text-amber-600 dark:text-amber-400" strokeWidth={2} />
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Type</p>
                              </div>
                              <p className="text-sm font-semibold text-gray-900 dark:text-white uppercase">
                                {doc.mimeType.split("/").pop()}
                              </p>
                            </div>
                          </div>

                          {/* Filename */}
                          <div className="bg-white dark:bg-gray-800/50 rounded-lg p-3 border border-gray-200/60 dark:border-gray-700/60">
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1.5">Filename</p>
                            <p className="text-xs font-mono text-gray-900 dark:text-white break-all bg-gray-50 dark:bg-gray-900/50 px-2 py-1.5 rounded">
                              {doc.filename}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
