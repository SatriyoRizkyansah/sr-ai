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
  AlertCircle, CheckCircle2, Clock, Search
} from "lucide-react";

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
  const { isAuthenticated } = useAuthStore();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    fetchDocuments();
  }, [isAuthenticated, router]);

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
    <>
      <CommandPalette />
      <div className="h-screen bg-white dark:bg-gray-950 flex overflow-hidden">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-gray-950">
          <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} title="Documents" />

          <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
            <div className="max-w-7xl mx-auto p-6">
              {/* Header Actions */}
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Documents</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {total} document{total !== 1 ? "s" : ""} uploaded
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => fetchDocuments(search)} 
                    className="h-10 px-4 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors border border-gray-200 dark:border-gray-700"
                  >
                    <RefreshCw size={16} strokeWidth={2} />
                    Refresh
                  </button>
                  <label className="h-10 px-4 flex items-center gap-2 bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black rounded-lg transition-colors font-medium text-sm cursor-pointer">
                    {uploading ? <Loader2 size={16} className="animate-spin" strokeWidth={2} /> : <Upload size={16} strokeWidth={2} />}
                    {uploading ? "Uploading..." : "Upload"}
                    <input ref={fileRef} type="file" accept=".pdf,.docx,.doc,.txt,.md" className="hidden" onChange={handleUpload} disabled={uploading} />
                  </label>
                </div>
              </div>

              {/* Search */}
              <div className="relative mb-6 max-w-md">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" strokeWidth={2} />
                <input
                  type="text"
                  placeholder="Search documents..."
                  className="w-full pl-11 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-shadow"
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
                <div className="grid gap-3">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm p-4 transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
                          <File size={20} strokeWidth={2} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 dark:text-white truncate mb-0.5">{doc.title}</h3>
                          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                            <span className="uppercase font-medium">{doc.mimeType.split("/").pop()}</span>
                            <span>•</span>
                            <span>{formatSize(doc.size)}</span>
                            <span>•</span>
                            <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                            doc.status === "READY" 
                              ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400"
                              : doc.status === "PROCESSING"
                              ? "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400"
                              : doc.status === "FAILED"
                              ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
                              : "bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-400"
                          }`}>
                            {statusIcon(doc.status)}
                            {doc.status}
                          </span>
                          <button 
                            onClick={() => handleDelete(doc.id)} 
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
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
      </div>
    </>
  );
}
