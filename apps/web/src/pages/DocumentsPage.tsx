import { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Upload,
  Trash2,
  CloudUpload,
  File,
  FileType,
  Loader2,
  FileCheck,
  AlertCircle,
  Hash,
  HardDrive,
} from 'lucide-react';
import api from '../lib/axios';

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
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const { data } = await api.get('/documents');
      setDocuments(data.data || data);
    } catch (err) {
      console.error('Failed to load documents', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (file: File) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/markdown',
    ];

    if (!allowedTypes.includes(file.type)) {
      alert('Unsupported file type. Please upload PDF, DOCX, TXT, or MD files.');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      loadDocuments();
    } catch (err) {
      console.error('Upload failed', err);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      await api.delete(`/documents/${id}`);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return <FileText className="w-6 h-6 text-red-500" />;
    if (mimeType.includes('word')) return <FileText className="w-6 h-6 text-blue-500" />;
    if (mimeType.includes('markdown')) return <File className="w-6 h-6 text-purple-500" />;
    return <FileType className="w-6 h-6 text-gray-500" />;
  };

  const getFileBg = (mimeType: string) => {
    if (mimeType.includes('pdf')) return 'bg-red-50 border-red-100';
    if (mimeType.includes('word')) return 'bg-blue-50 border-blue-100';
    if (mimeType.includes('markdown')) return 'bg-purple-50 border-purple-100';
    return 'bg-gray-50 border-gray-100';
  };

  const statusBadge = (status: string) => {
    const configs: Record<string, { bg: string; text: string; icon: any }> = {
      PROCESSING: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', icon: Loader2 },
      READY: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', icon: FileCheck },
      FAILED: { bg: 'bg-red-50 border-red-200', text: 'text-red-700', icon: AlertCircle },
    };
    const config = configs[status] || { bg: 'bg-gray-50 border-gray-200', text: 'text-gray-700', icon: AlertCircle };
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${config.bg} ${config.text}`}>
        <Icon className={`w-3 h-3 ${status === 'PROCESSING' ? 'animate-spin' : ''}`} />
        {status.charAt(0) + status.slice(1).toLowerCase()}
      </span>
    );
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Documents</h2>
          <p className="text-gray-500 mt-1">Upload and manage your knowledge base</p>
        </div>
        <div>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".pdf,.docx,.txt,.md"
            onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-primary flex items-center gap-2 group"
            disabled={uploading}
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 transition-transform group-hover:-translate-y-0.5" />
                Upload Document
              </>
            )}
          </button>
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-2xl p-10 text-center mb-8 transition-all duration-200 cursor-pointer ${
          dragOver
            ? 'border-blue-400 bg-blue-50/80 shadow-glow'
            : 'border-gray-200 bg-gray-50/50 hover:border-blue-300 hover:bg-blue-50/40'
        }`}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center transition-colors ${
          dragOver ? 'bg-blue-100' : 'bg-gray-100'
        }`}>
          <CloudUpload className={`w-8 h-8 transition-colors ${dragOver ? 'text-blue-500' : 'text-gray-400'}`} />
        </div>
        <p className="text-gray-700 font-medium">
          {dragOver ? 'Drop to upload' : 'Drag & drop files here'}
        </p>
        <p className="text-gray-400 text-sm mt-1.5">PDF, DOCX, TXT, MD — max 20MB</p>
      </div>

      {/* Stats bar */}
      {documents.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white/70 backdrop-blur-sm rounded-xl border border-gray-200/60 p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <HardDrive className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">{documents.length}</p>
              <p className="text-xs text-gray-500">Total files</p>
            </div>
          </div>
          <div className="bg-white/70 backdrop-blur-sm rounded-xl border border-gray-200/60 p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
              <FileCheck className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">{documents.filter((d) => d.status === 'READY').length}</p>
              <p className="text-xs text-gray-500">Ready</p>
            </div>
          </div>
          <div className="bg-white/70 backdrop-blur-sm rounded-xl border border-gray-200/60 p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
              <Hash className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">{documents.reduce((acc, d) => acc + (d._count?.chunks || 0), 0)}</p>
              <p className="text-xs text-gray-500">Chunks indexed</p>
            </div>
          </div>
        </div>
      )}

      {/* Document list */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin mb-3" />
          <span className="text-sm">Loading documents...</span>
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-gray-300" />
          </div>
          <p className="text-lg font-medium text-gray-600">No documents yet</p>
          <p className="text-sm text-gray-400 mt-1.5">Upload your first document to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc, index) => (
            <div
              key={doc.id}
              className="group bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/60 p-4 flex items-center justify-between hover:shadow-md transition-all duration-200 animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl border flex items-center justify-center flex-shrink-0 ${getFileBg(doc.mimeType)}`}>
                  {getFileIcon(doc.mimeType)}
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{doc.title}</h3>
                  <div className="flex items-center gap-2.5 mt-1 text-sm text-gray-500">
                    <span>{formatSize(doc.size)}</span>
                    {statusBadge(doc.status)}
                    {doc._count && (
                      <span className="text-gray-400 flex items-center gap-1">
                        <Hash className="w-3 h-3" />
                        {doc._count.chunks} chunks
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleDelete(doc.id)}
                className="opacity-0 group-hover:opacity-100 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-150"
                title="Delete document"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
