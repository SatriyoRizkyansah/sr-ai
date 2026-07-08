"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { useAuthStore } from "@/stores/auth-store";
import { MessageSquare, Plus, Trash2, Send, Loader2, FileText, LogOut, Sparkles, MoreHorizontal, PanelLeftClose, PanelLeft, User as UserIcon, Moon, Sun, Terminal, Search, Pencil, Check, X } from "lucide-react";
import Markdown from "react-markdown";
import { useThemeStore } from "@/stores/theme-store";
import LogViewerModal from "@/components/LogViewerModal";
import DashboardSidebar from "@/components/DashboardSidebar";

/** Strip [Source N: ...] citation markers from AI responses */
function stripCitations(text: string): string {
  return text
    .replace(/\[Source\s+\d+[^\]]*\]/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

interface Session {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  _count: { messages: number };
}

interface Message {
  id: string;
  content: string;
  role: string;
  citations?: any;
  createdAt: string;
}

function groupSessions(sessions: Session[]): { label: string; items: Session[] }[] {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart.getTime() - 86400000);
  const week7Start = new Date(todayStart.getTime() - 7 * 86400000);
  const monthStart = new Date(todayStart.getTime() - 30 * 86400000);

  const groups = [
    { label: "Today", items: [] as Session[] },
    { label: "Yesterday", items: [] as Session[] },
    { label: "Previous 7 days", items: [] as Session[] },
    { label: "Previous 30 days", items: [] as Session[] },
    { label: "Older", items: [] as Session[] },
  ];

  for (const s of sessions) {
    const d = new Date(s.updatedAt);
    if (d >= todayStart) groups[0].items.push(s);
    else if (d >= yesterdayStart) groups[1].items.push(s);
    else if (d >= week7Start) groups[2].items.push(s);
    else if (d >= monthStart) groups[3].items.push(s);
    else groups[4].items.push(s);
  }

  return groups.filter((g) => g.items.length > 0);
}

export default function ChatPage() {
  const router = useRouter();
  const { isAuthenticated, _hydrated, user, logout } = useAuthStore();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [sessionSearch, setSessionSearch] = useState("");
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!_hydrated) return;
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    fetchSessions();
  }, [_hydrated, isAuthenticated, router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + "px";
    }
  }, [input]);

  useEffect(() => {
    if (editingSessionId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingSessionId]);

  const filteredSessions = useMemo(() => {
    if (!sessionSearch.trim()) return sessions;
    return sessions.filter((s) => s.title.toLowerCase().includes(sessionSearch.toLowerCase()));
  }, [sessions, sessionSearch]);

  const groupedSessions = useMemo(() => groupSessions(filteredSessions), [filteredSessions]);

  const fetchSessions = async () => {
    try {
      setLoadingSessions(true);
      const { data } = await api.get("/chat/sessions");
      setSessions(data || []);
    } catch (err) {
      console.error("Failed to fetch sessions", err);
    } finally {
      setLoadingSessions(false);
    }
  };

  const fetchMessages = async (sessionId: string) => {
    try {
      setLoadingMessages(true);
      const { data } = await api.get(`/chat/sessions/${sessionId}/messages`);
      setMessages(data || []);
    } catch (err) {
      console.error("Failed to fetch messages", err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const createSession = async () => {
    try {
      const { data } = await api.post("/chat/sessions", {});
      setSessions((prev) => [data, ...prev]);
      setActiveSessionId(data.id);
      setMessages([]);
    } catch (err) {
      console.error("Failed to create session", err);
    }
  };

  const deleteSession = async (id: string) => {
    try {
      await api.delete(`/chat/sessions/${id}`);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      if (activeSessionId === id) {
        setActiveSessionId(null);
        setMessages([]);
      }
    } catch (err) {
      console.error("Failed to delete session", err);
    }
  };

  const renameSession = async (id: string, newTitle: string) => {
    if (!newTitle.trim()) {
      setEditingSessionId(null);
      return;
    }
    // Optimistic update
    setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, title: newTitle.trim() } : s)));
    setEditingSessionId(null);
    // Try backend rename, fallback to local-only
    try {
      await api.patch(`/chat/sessions/${id}`, { title: newTitle.trim() });
    } catch {
      // Frontend-only rename is fine
    }
  };

  const selectSession = (id: string) => {
    setActiveSessionId(id);
    fetchMessages(id);
  };

  const sendMessage = async () => {
    if (!input.trim() || !activeSessionId || sending) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [
      ...prev,
      {
        id: "temp-" + Date.now(),
        content: userMsg,
        role: "USER",
        createdAt: new Date().toISOString(),
      },
    ]);
    setSending(true);

    try {
      const { data } = await api.post(`/chat/sessions/${activeSessionId}/messages`, {
        content: userMsg,
      });
      setMessages((prev) => [...prev, data]);
      fetchSessions();
    } catch (err: any) {
      console.error("Failed to send message", err);
      setMessages((prev) => [
        ...prev,
        {
          id: "error-" + Date.now(),
          content: "⚠️ Failed to send message. Please try again.",
          role: "ASSISTANT",
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isAuthenticated) return null;

  const sidebarContent = (
    <>
      {/* New Chat Button */}
      <div className="px-2.5 pb-2">
        <button onClick={createSession} className="w-full flex items-center gap-2.5 h-9 px-3 rounded-lg border border-white/20 hover:bg-white/5 text-white transition-colors text-[13px]">
          <Plus size={16} strokeWidth={2} />
          New chat
        </button>
      </div>

      {/* Search */}
      {sessions.length > 0 && (
        <div className="px-2.5 pb-2">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30" strokeWidth={2} />
            <input
              type="text"
              placeholder="Search chats..."
              value={sessionSearch}
              onChange={(e) => setSessionSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[12px] text-white placeholder-white/30 focus:outline-none focus:border-white/20 transition-colors"
            />
          </div>
        </div>
      )}

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto px-2.5 py-1 space-y-0.5 custom-scrollbar">
        {loadingSessions ? (
          <div className="flex justify-center py-8">
            <Loader2 size={16} className="animate-spin text-white/40" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="flex flex-col items-center py-8 px-3">
            <MessageSquare size={24} className="text-white/15 mb-2" strokeWidth={1.5} />
            <p className="text-xs text-white/30 text-center">No conversations yet</p>
            <button onClick={createSession} className="mt-3 text-[12px] text-emerald-400 hover:text-emerald-300 transition-colors">
              Start a new chat
            </button>
          </div>
        ) : (
          groupedSessions.map((group) => (
            <div key={group.label}>
              <div className="px-3 py-2 text-[11px] font-semibold text-white/30 uppercase tracking-wider">{group.label}</div>
              {group.items.map((session) => {
                const isActive = activeSessionId === session.id;
                const isEditing = editingSessionId === session.id;

                if (isEditing) {
                  return (
                    <div key={session.id} className="flex items-center gap-1.5 px-1.5 h-9 rounded-lg bg-white/10">
                      <input
                        ref={editInputRef}
                        className="flex-1 bg-transparent text-white text-[13px] outline-none px-1"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") renameSession(session.id, editTitle);
                          if (e.key === "Escape") setEditingSessionId(null);
                        }}
                      />
                      <button onClick={() => renameSession(session.id, editTitle)} className="p-1 hover:bg-white/10 rounded">
                        <Check size={13} className="text-emerald-400" />
                      </button>
                      <button onClick={() => setEditingSessionId(null)} className="p-1 hover:bg-white/10 rounded">
                        <X size={13} className="text-white/60" />
                      </button>
                    </div>
                  );
                }

                return (
                  <div
                    key={session.id}
                    className={`group flex items-center gap-2.5 px-3 h-9 rounded-lg cursor-pointer transition-all text-[13px] ${isActive ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white"}`}
                    onClick={() => selectSession(session.id)}
                  >
                    <MessageSquare size={15} className="shrink-0" strokeWidth={2} />
                    <span className="flex-1 truncate">{session.title}</span>
                    {isActive && (
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingSessionId(session.id);
                            setEditTitle(session.title);
                          }}
                          className="p-1 hover:bg-white/10 rounded"
                          title="Rename"
                        >
                          <Pencil size={12} strokeWidth={2} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSession(session.id);
                          }}
                          className="p-1 hover:bg-white/10 rounded"
                          title="Delete"
                        >
                          <Trash2 size={12} strokeWidth={2} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>
    </>
  );

  return (
    <div className="h-screen bg-white dark:bg-gray-950 flex overflow-hidden">
      <DashboardSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} showUserMenu={showUserMenu} setShowUserMenu={setShowUserMenu} onShowLogs={() => setShowLogModal(true)}>
        {sidebarContent}
      </DashboardSidebar>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 relative bg-white dark:bg-[#212121]">
        {/* Top Bar */}
        <header className="h-14 border-b border-black/10 dark:border-white/10 flex items-center justify-between px-3 shrink-0 bg-white dark:bg-[#212121]">
          <div className="flex items-center gap-2">
            {!sidebarOpen && (
              <button onClick={() => setSidebarOpen(true)} className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-black/5 dark:hover:bg-white/5 text-gray-600 dark:text-gray-300 transition-colors">
                <PanelLeft size={18} strokeWidth={2} />
              </button>
            )}
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-linear-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                <Sparkles size={14} className="text-white" strokeWidth={2.5} />
              </div>
              <h1 className="text-[15px] font-semibold text-gray-900 dark:text-white">DocMind AI</h1>
            </div>
          </div>
          {activeSessionId && (
            <div className="text-[12px] text-gray-400 dark:text-gray-500">
              {messages.length} message{messages.length !== 1 ? "s" : ""}
            </div>
          )}
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-white dark:bg-[#212121]">
          {!activeSessionId ? (
            <div className="flex flex-col items-center justify-center h-full px-4 pb-32">
              <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-emerald-400 to-emerald-600 flex items-center justify-center mb-6 shadow-lg">
                <Sparkles size={28} className="text-white" strokeWidth={2} />
              </div>
              <h2 className="text-[28px] font-semibold text-gray-900 dark:text-white mb-3">Ready when you are.</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-md mb-8">Ask me anything about your documents. Create a new chat to get started.</p>
              <button onClick={createSession} className="flex items-center gap-2 h-10 px-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors font-medium text-[13px] shadow-md">
                <Plus size={16} strokeWidth={2.5} />
                Start a new chat
              </button>
            </div>
          ) : loadingMessages ? (
            <div className="flex justify-center py-12">
              <Loader2 size={24} className="animate-spin text-gray-400 dark:text-gray-500" />
            </div>
          ) : (
            <div className="max-w-3xl mx-auto">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 text-center px-4">
                  <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 flex items-center justify-center mb-4">
                    <MessageSquare size={24} strokeWidth={2} />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400">Start a conversation</p>
                </div>
              ) : (
                messages.map((msg, idx) =>
                  msg.role === "USER" ? (
                    /* ── User Message: Right-aligned ── */
                    <div key={msg.id} className={`px-4 py-3 group ${idx === 0 ? "pt-4" : ""}`}>
                      <div className="flex justify-end">
                        <div className="flex items-end gap-3 max-w-[75%] flex-row-reverse">
                          <div className="w-7 h-7 rounded-full shrink-0 bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-xs shadow-sm">
                            {user?.name?.charAt(0)?.toUpperCase() || "U"}
                          </div>
                          <div className="bg-blue-500 text-white rounded-2xl rounded-br-md px-4 py-2.5 shadow-sm">
                            <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* ── AI Message: Left-aligned ── */
                    <div key={msg.id} className={`px-4 py-3 group ${idx === 0 ? "pt-4" : ""}`}>
                      <div className="flex justify-start">
                        <div className="flex items-start gap-3 max-w-[85%]">
                          <div className="w-7 h-7 rounded-full shrink-0 bg-linear-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-sm">
                            <Sparkles size={14} className="text-white" strokeWidth={2.5} />
                          </div>
                          <div className="min-w-0 pt-0.5 text-[15px] leading-relaxed text-gray-800 dark:text-[#ececec]">
                            <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1.5 prose-ul:my-2 prose-li:my-0.5 prose-strong:text-gray-900 dark:prose-strong:text-white prose-headings:mt-4 prose-headings:mb-2">
                              <Markdown
                                components={{
                                  ul: ({ children }) => <ul className="list-disc pl-5 space-y-1 my-2">{children}</ul>,
                                  ol: ({ children }) => <ol className="list-decimal pl-5 space-y-1 my-2">{children}</ol>,
                                  strong: ({ children }) => <strong className="font-semibold text-gray-900 dark:text-white">{children}</strong>,
                                }}
                              >
                                {stripCitations(msg.content)}
                              </Markdown>
                            </div>
                            {msg.citations && (
                              <div className="mt-3 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                <FileText size={14} strokeWidth={2} />
                                <span>Sources referenced</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ),
                )
              )}

              {sending && (
                <div className="px-4 py-3">
                  <div className="flex justify-start">
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-full shrink-0 bg-linear-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-sm">
                        <Sparkles size={14} className="text-white" strokeWidth={2.5} />
                      </div>
                      <div className="pt-1.5">
                        <div className="flex gap-1">
                          <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                          <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                          <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        {activeSessionId && (
          <div className="px-4 pb-4 pt-2 shrink-0 bg-white dark:bg-[#212121]">
            <div className="max-w-3xl mx-auto">
              <div className="relative bg-white dark:bg-[#303030] border border-gray-300 dark:border-transparent rounded-3xl shadow-[0_2px_6px_rgba(0,0,0,0.08)] focus-within:shadow-[0_2px_12px_rgba(0,0,0,0.12)] transition-shadow">
                <textarea
                  ref={textareaRef}
                  className="w-full px-4 py-3 pr-12 bg-transparent border-0 focus:outline-none resize-none text-gray-900 dark:text-[#ececec] placeholder-gray-400 dark:placeholder-gray-500 text-[15px] leading-6 max-h-50"
                  rows={1}
                  placeholder="Ask anything"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={sending}
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || sending}
                  className="absolute right-2.5 bottom-2.5 w-8 h-8 rounded-full bg-white dark:bg-white disabled:bg-gray-200 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-black dark:text-black flex items-center justify-center transition-all hover:bg-gray-100 dark:hover:bg-gray-200"
                >
                  {sending ? <Loader2 size={16} className="animate-spin text-black" strokeWidth={2.5} /> : <Send size={15} className="ml-0.5" strokeWidth={2.5} />}
                </button>
              </div>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 text-center mt-3">DocMind AI can make mistakes. Check important info.</p>
            </div>
          </div>
        )}
      </main>

      <LogViewerModal open={showLogModal} onClose={() => setShowLogModal(false)} />
    </div>
  );
}
