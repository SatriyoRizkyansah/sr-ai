"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { useAuthStore } from "@/stores/auth-store";
import { MessageSquare, Plus, Trash2, Send, Loader2, FileText, LogOut, Sparkles, MoreHorizontal, PanelLeftClose, PanelLeft, User as UserIcon, Moon, Sun, Terminal } from "lucide-react";
import { useThemeStore } from "@/stores/theme-store";
import LogViewerModal from "@/components/LogViewerModal";

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

function ThemeToggleMenuItem() {
  const { theme, toggleTheme } = useThemeStore();
  return (
    <button onClick={toggleTheme} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/90 hover:bg-white/5 transition-colors">
      {theme === "dark" ? <Sun size={16} strokeWidth={2} /> : <Moon size={16} strokeWidth={2} />}
      {theme === "dark" ? "Light mode" : "Dark mode"}
    </button>
  );
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + "px";
    }
  }, [input]);

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

  const selectSession = (id: string) => {
    setActiveSessionId(id);
    fetchMessages(id);
  };

  const sendMessage = async () => {
    if (!input.trim() || !activeSessionId || sending) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { id: "temp-" + Date.now(), content: userMsg, role: "USER", createdAt: new Date().toISOString() }]);
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

  return (
    <div className="h-screen bg-white dark:bg-gray-950 flex overflow-hidden">
      {/* Sidebar - ChatGPT Style */}
      <aside className={`${sidebarOpen ? "w-[260px]" : "w-0"} bg-[#171717] flex flex-col transition-all duration-200 ease-in-out flex-shrink-0 ${!sidebarOpen ? "overflow-hidden" : ""}`}>
        <div className="flex flex-col h-full min-w-[260px]">
          {/* Sidebar Header */}
          <div className="flex items-center gap-2 p-2.5 h-[56px]">
            <button onClick={createSession} className="flex-1 flex items-center gap-2.5 h-9 px-3 rounded-lg border border-white/20 hover:bg-white/5 text-white transition-colors text-[13px]">
              <Plus size={16} strokeWidth={2} />
              New chat
            </button>
            <button onClick={() => setSidebarOpen(false)} className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-white/5 text-white/70 hover:text-white transition-colors">
              <PanelLeftClose size={18} strokeWidth={2} />
            </button>
          </div>

          {/* Sessions List */}
          <div className="flex-1 overflow-y-auto px-2.5 py-2 space-y-0.5 custom-scrollbar">
            {loadingSessions ? (
              <div className="flex justify-center py-8">
                <Loader2 size={16} className="animate-spin text-white/40" />
              </div>
            ) : sessions.length === 0 ? (
              <p className="text-xs text-white/30 text-center py-8 px-3">No conversations yet</p>
            ) : (
              sessions.map((session) => (
                <div
                  key={session.id}
                  className={`group flex items-center gap-2.5 px-3 h-9 rounded-lg cursor-pointer transition-all text-[13px] relative ${
                    activeSessionId === session.id ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white"
                  }`}
                  onClick={() => selectSession(session.id)}
                >
                  <MessageSquare size={15} className="flex-shrink-0" strokeWidth={2} />
                  <span className="flex-1 truncate">{session.title}</span>
                  {activeSessionId === session.id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSession(session.id);
                      }}
                      className="p-1 opacity-0 group-hover:opacity-100 hover:bg-white/10 rounded transition-all"
                    >
                      <Trash2 size={13} strokeWidth={2} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

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
                      <UserIcon size={16} strokeWidth={2} />
                      Profile
                    </button>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        router.push("/documents");
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/90 hover:bg-white/5 transition-colors"
                    >
                      <FileText size={16} strokeWidth={2} />
                      Documents
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

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 relative bg-white dark:bg-[#212121]">
        {/* Top Bar */}
        <header className="h-[56px] border-b border-black/10 dark:border-white/10 flex items-center justify-between px-3 flex-shrink-0 bg-white dark:bg-[#212121]">
          <div className="flex items-center gap-2">
            {!sidebarOpen && (
              <button onClick={() => setSidebarOpen(true)} className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-black/5 dark:hover:bg-white/5 text-gray-600 dark:text-gray-300 transition-colors">
                <PanelLeft size={18} strokeWidth={2} />
              </button>
            )}
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                <Sparkles size={14} className="text-white" strokeWidth={2.5} />
              </div>
              <h1 className="text-[15px] font-semibold text-gray-900 dark:text-white">DocMind AI</h1>
            </div>
          </div>
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-white dark:bg-[#212121]">
          {!activeSessionId ? (
            <div className="flex flex-col items-center justify-center h-full px-4 pb-32">
              <h2 className="text-[28px] font-semibold text-gray-900 dark:text-white mb-6">Ready when you are.</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-md">Ask me anything about your documents.</p>
            </div>
          ) : loadingMessages ? (
            <div className="flex justify-center py-12">
              <Loader2 size={24} className="animate-spin text-gray-400 dark:text-gray-500" />
            </div>
          ) : (
            <div className="max-w-3xl mx-auto px-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 text-center">
                  <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 flex items-center justify-center mb-4">
                    <MessageSquare size={24} strokeWidth={2} />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400">Start a conversation</p>
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div key={msg.id} className={`py-5 group ${msg.role === "ASSISTANT" ? "bg-gray-100/40 dark:bg-white/5" : "bg-white dark:bg-[#212121]"} ${idx === 0 ? "pt-4" : ""}`}>
                    <div className="flex gap-5 max-w-[46rem] mx-auto">
                      <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center font-semibold text-xs">
                        {msg.role === "USER" ? (
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center font-semibold text-xs">{user?.name?.charAt(0)?.toUpperCase() || "U"}</div>
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                            <Sparkles size={14} className="text-white" strokeWidth={2.5} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 pt-0.5">
                        <div className="prose prose-sm max-w-none dark:prose-invert">
                          <p className="text-[15px] leading-relaxed text-gray-800 dark:text-[#ececec] whitespace-pre-wrap m-0">{msg.content}</p>
                        </div>
                        {msg.citations && (
                          <div className="mt-4 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <FileText size={14} strokeWidth={2} />
                            <span>Sources referenced</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}

              {sending && (
                <div className="py-5 bg-gray-100/40 dark:bg-white/5">
                  <div className="flex gap-5 max-w-[46rem] mx-auto">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center flex-shrink-0">
                      <Sparkles size={14} className="text-white" strokeWidth={2.5} />
                    </div>
                    <div className="flex-1 pt-1">
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area - ChatGPT Style */}
        {activeSessionId && (
          <div className="px-4 pb-4 pt-2 flex-shrink-0 bg-white dark:bg-[#212121]">
            <div className="max-w-[46rem] mx-auto">
              <div className="relative bg-white dark:bg-[#303030] border border-gray-300 dark:border-transparent rounded-3xl shadow-[0_2px_6px_rgba(0,0,0,0.08)] focus-within:shadow-[0_2px_12px_rgba(0,0,0,0.12)] transition-shadow">
                <textarea
                  ref={textareaRef}
                  className="w-full px-4 py-3 pr-12 bg-transparent border-0 focus:outline-none resize-none text-gray-900 dark:text-[#ececec] placeholder-gray-400 dark:placeholder-gray-500 text-[15px] leading-6 max-h-[200px]"
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

      {/* Log Viewer Modal */}
      <LogViewerModal open={showLogModal} onClose={() => setShowLogModal(false)} />
    </div>
  );
}
