"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { useAuthStore } from "@/stores/auth-store";
import { FileText, Upload, Trash2, RefreshCw, File, Loader2, AlertCircle, CheckCircle2, Clock, Search, LogOut, MessageSquare, User, BrainCircuit } from "lucide-react";

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
  const { isAuthenticated, user, logout } = useAuthStore();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    fetchDocuments();
  }, [isAuthenticated]);

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
        return <CheckCircle2 size="16" className="text-emerald-500" />;
      case "PROCESSING":
        return <Loader2 size="16" className="text-amber-500 animate-spin" />;
      case "FAILED":
        return <AlertCircle size="16" className="text-red-500" />;
      default:
        return <Clock size="16" className="text-gray-400" />;
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center">
              <BrainCircuit size="20" className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900">DocMind AI</h1>
              <p className="text-xs text-gray-400">Document Assistant</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          <button onClick={() => router.push("/documents")} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-primary-50 text-primary-700 font-medium">
            <FileText size="18" />
            Documents
          </button>
          <button onClick={() => router.push("/chat")} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all">
            <MessageSquare size="18" />
            Chat
          </button>
          <button onClick={() => router.push("/profile")} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all">
            <User size="18" />
            Profile
          </button>
        </nav>

        <div className="p-3 border-t border-gray-100">
          <div className="flex items-center gap-3 px-3 py-2 text-sm text-gray-600">
            <div className="w-7 h-7 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold">{user?.name?.charAt(0)?.toUpperCase() || "U"}</div>
            <span className="truncate flex-1">{user?.name || "User"}</span>
            <button
              onClick={() => {
                logout();
                router.push("/login");
              }}
              className="p-1 hover:bg-gray-100 rounded"
              title="Logout"
            >
              <LogOut size="16" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Documents</h2>
              <p className="text-sm text-gray-500">
                {total} document{total !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => fetchDocuments(search)} className="btn-secondary">
                <RefreshCw size="16" />
                Refresh
              </button>
              <label className="btn-primary cursor-pointer">
                {uploading ? <Loader2 size="16" className="animate-spin" /> : <Upload size="16" />}
                {uploading ? "Uploading..." : "Upload"}
                <input ref={fileRef} type="file" accept=".pdf,.docx,.doc,.txt,.md" className="hidden" onChange={handleUpload} disabled={uploading} />
              </label>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 p-6 overflow-auto">
          {/* Search */}
          <div className="relative mb-4 max-w-md">
            <Search size="18" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search documents..."
              className="form-input pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") fetchDocuments(search);
              }}
            />
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size="32" className="animate-spin text-primary-600" />
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-20">
              <FileText size="48" className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-1">No documents yet</h3>
              <p className="text-sm text-gray-400 mb-4">Upload a PDF, DOCX, TXT, or Markdown file to get started</p>
              <label className="btn-primary cursor-pointer inline-flex">
                <Upload size="16" />
                Upload Document
                <input type="file" accept=".pdf,.docx,.doc,.txt,.md" className="hidden" onChange={handleUpload} />
              </label>
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Size</th>
                    <th>Status</th>
                    <th>Uploaded</th>
                    <th className="w-20">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => (
                    <tr key={doc.id} className="animate-slide-up">
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">
                            <File size="16" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{doc.title}</p>
                            <p className="text-xs text-gray-400">{doc.filename}</p>
                          </div>
                        </div>
                      </td>
                      <td className="text-sm">{doc.mimeType.split("/").pop()?.toUpperCase() || "-"}</td>
                      <td className="text-sm">{formatSize(doc.size)}</td>
                      <td>
                        <span className="flex items-center gap-1.5">
                          {statusIcon(doc.status)}
                          <span className={`text-sm font-medium ${doc.status === "READY" ? "text-emerald-600" : doc.status === "PROCESSING" ? "text-amber-600" : doc.status === "FAILED" ? "text-red-600" : "text-gray-600"}`}>
                            {doc.status}
                          </span>
                        </span>
                      </td>
                      <td className="text-sm text-gray-500">{new Date(doc.createdAt).toLocaleDateString()}</td>
                      <td>
                        <button onClick={() => handleDelete(doc.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Delete">
                          <Trash2 size="16" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
