"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { useAuthStore } from "@/stores/auth-store";
import { FileText, Upload, Trash2, RefreshCw, File, Loader2, AlertCircle, CheckCircle2, Clock, Search, LogOut, MessageSquare, User, Sparkles, MoreHorizontal, PanelLeft, PanelLeftClose, Moon, Sun, Terminal } from "lucide-react";
import { useThemeStore } from "@/stores/theme-store";
import LogViewerModal from "@/components/LogViewerModal";

function ThemeToggleMenuItem() {
  const { theme, toggleTheme } = useThemeStore();
  return (
    <button onClick={toggleTheme} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/90 hover:bg-white/5 transition-colors">
      {theme === "dark" ? <Sun size={16} strokeWidth={2} /> : <Moon size={16} strokeWidth={2} />}
      {theme === "dark" ? "Light mode" : "Dark mode"}
    </button>
  );
}

interface Document {
  id: string;
  title: string;
  filename: string;
  mimeType: string;
  size: number;
  status: string;
  createdAt: string;
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
    <div className="h-screen bg-white flex overflow-hidden">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? "w-[260px]" : "w-0"} bg-[#171717] flex flex-col transition-all duration-200 ease-in-out flex-shrink-0 ${!sidebarOpen ? "overflow-hidden" : ""}`}>
        <div className="flex flex-col h-full min-w-[260px]">
          {/* Sidebar Header */}
          <div className="flex items-center gap-2 p-2.5 h-[56px]">
            <button onClick={() => router.push("/chat")} className="flex-1 flex items-center gap-2.5 h-9 px-3 rounded-lg border border-white/20 hover:bg-white/5 text-white transition-colors text-[13px]">
              <MessageSquare size={16} strokeWidth={2} />
              Chats
            </button>
            <button onClick={() => setSidebarOpen(false)} className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-white/5 text-white/70 hover:text-white transition-colors">
              <PanelLeftClose size={18} strokeWidth={2} />
            </button>
          </div>

          {/* Menu Items */}
          <div className="px-2.5 py-2 space-y-0.5">
            <button onClick={() => router.push("/chat")} className="w-full flex items-center gap-2.5 px-3 h-9 rounded-lg text-white/60 hover:bg-white/5 hover:text-white transition-colors text-[13px]">
              <MessageSquare size={15} strokeWidth={2} />
              Chat
            </button>
            <button onClick={() => router.push("/documents")} className="w-full flex items-center gap-2.5 px-3 h-9 rounded-lg bg-white/10 text-white transition-colors text-[13px]">
              <FileText size={15} strokeWidth={2} />
              Documents
            </button>
          </div>

          <div className="flex-1" />

          {/* User Menu */}
          <div className="p-2.5">
            <div className="relative">
              <button onClick={() => setShowUserMenu(!showUserMenu)} className="w-full flex items-center gap-2.5 px-2.5 h-10 rounded-lg hover:bg-white/5 text-white transition-colors">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-xs font-semibold flex-shrink-0 text-white">{user?.name?.charAt(0)?.toUpperCase() || "U"}</div>
                <span className="flex-1 truncate text-[13px] text-left">{user?.name || "User"}</span>
                <MoreHorizontal size={16} className="opacity-50" strokeWidth={2} />
              </button>

              {showUserMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
                  <div className="absolute bottom-full left-2 right-2 mb-2 bg-[#212121] rounded-xl shadow-2xl border border-white/10 py-1.5 z-20">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        router.push("/profile");
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/90 hover:bg-white/5 transition-colors"
                    >
                      <User size={16} strokeWidth={2} />
                      Profile
                    </button>
                    <div className="h-px bg-white/10 my-1.5" />
                    <ThemeToggleMenuItem />
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        setShowLogModal(true);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/90 hover:bg-white/5 transition-colors"
                    >
                      <Terminal size={16} strokeWidth={2} />
                      Logs
                    </button>
                    <div className="h-px bg-white/10 my-1.5" />
                    <button
                      onClick={() => {
                        logout();
                        router.push("/login");
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-white/5 transition-colors"
                    >
                      <LogOut size={16} strokeWidth={2} />
                      Log out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#212121]">
        {/* Header */}
        <header className="h-[56px] border-b border-black/10 dark:border-white/10 flex items-center justify-between px-4 bg-white dark:bg-[#212121]">
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <button onClick={() => setSidebarOpen(true)} className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-black/5 dark:hover:bg-white/5 text-gray-600 dark:text-gray-300 transition-colors">
                <PanelLeft size={18} strokeWidth={2} />
              </button>
            )}
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <FileText size={14} className="text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white">Documents</h2>
            </div>
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
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mx-auto mb-3 shadow-lg">
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
                {documents.map((doc) => (
                  <div key={doc.id} className="bg-white dark:bg-[#2f2f2f] rounded-xl border border-gray-200 dark:border-white/8 hover:border-gray-300 dark:hover:border-white/15 hover:shadow-sm p-3.5 transition-all group">
                    <div className="flex items-center gap-3.5">
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-white/8 dark:to-white/5 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
                        <File size={18} strokeWidth={2} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-[14px] text-gray-900 dark:text-[#ececec] truncate mb-0.5">{doc.title}</h3>
                        <div className="flex items-center gap-2.5 text-[12px] text-gray-500 dark:text-gray-400">
                          <span className="uppercase font-medium">{doc.mimeType.split("/").pop()}</span>
                          <span className="opacity-40">•</span>
                          <span>{formatSize(doc.size)}</span>
                          <span className="opacity-40">•</span>
                          <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                            doc.status === "READY"
                              ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                              : doc.status === "PROCESSING"
                                ? "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                                : doc.status === "FAILED"
                                  ? "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                                  : "bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {statusIcon(doc.status)}
                          {doc.status}
                        </span>
                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-all opacity-0 group-hover:opacity-100"
                          title="Delete"
                        >
                          <Trash2 size={16} strokeWidth={2} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Log Viewer Modal */}
      <LogViewerModal open={showLogModal} onClose={() => setShowLogModal(false)} />
    </div>
  );
}
