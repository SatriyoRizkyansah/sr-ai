"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { useAuthStore } from "@/stores/auth-store";
import { MessageSquare, Plus, Trash2, Send, Bot, User, Loader2, FileText, LogOut, BrainCircuit, Menu, X } from "lucide-react";

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

export default function ChatPage() {
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuthStore();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    fetchSessions();
  }, [isAuthenticated]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
      // Refresh sessions list to update message counts
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

  const activeSession = sessions.find((s) => s.id === activeSessionId);

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? "w-72" : "w-0"} bg-white border-r border-gray-200 flex flex-col transition-all duration-300 overflow-hidden flex-shrink-0`}>
        <div className="p-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-primary-600 flex items-center justify-center flex-shrink-0">
              <BrainCircuit size="18" className="text-white" />
            </div>
            <h1 className="font-bold text-gray-900 truncate">DocMind AI</h1>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 lg:hidden">
            <X size="18" />
          </button>
        </div>

        <div className="p-3 border-b border-gray-100">
          <button onClick={createSession} className="btn-primary w-full">
            <Plus size="16" />
            New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loadingSessions ? (
            <div className="flex justify-center py-8">
              <Loader2 size="20" className="animate-spin text-gray-400" />
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No conversations yet</p>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                className={`group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all ${activeSessionId === session.id ? "bg-primary-50 text-primary-700" : "text-gray-600 hover:bg-gray-100"}`}
                onClick={() => {
                  selectSession(session.id);
                  if (window.innerWidth < 1024) setSidebarOpen(false);
                }}
              >
                <MessageSquare size="16" className="flex-shrink-0" />
                <span className="flex-1 truncate text-sm">{session.title}</span>
                <span className="text-xs text-gray-400">{session._count?.messages || 0}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSession(session.id);
                  }}
                  className="p-1 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-600 rounded transition-all"
                >
                  <Trash2 size="14" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* User footer */}
        <div className="p-3 border-t border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3 px-3 py-2 text-sm text-gray-600">
            <div className="w-7 h-7 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold flex-shrink-0">{user?.name?.charAt(0)?.toUpperCase() || "U"}</div>
            <div className="flex-1 min-w-0">
              <p className="truncate font-medium">{user?.name || "User"}</p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </div>
            <button
              onClick={() => {
                logout();
                router.push("/login");
              }}
              className="p-1.5 hover:bg-gray-100 rounded text-gray-400"
              title="Logout"
            >
              <LogOut size="16" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 flex-shrink-0">
          {!sidebarOpen && (
            <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
              <Menu size="20" />
            </button>
          )}
          <div className="flex items-center gap-3 text-sm">
            <FileText size="16" className="text-primary-600" />
            <span className="text-gray-700 font-medium">{activeSession?.title || "Chat"}</span>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <button onClick={() => router.push("/documents")} className="btn-secondary text-xs px-3 py-1.5">
              <FileText size="14" />
              Documents
            </button>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
          {!activeSessionId ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center mb-4">
                <BrainCircuit size="32" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">DocMind AI</h2>
              <p className="text-gray-400 max-w-md mb-6">Start a new conversation or select an existing one. Your documents are automatically searched for relevant context.</p>
              <button onClick={createSession} className="btn-primary">
                <Plus size="16" />
                New Chat
              </button>
            </div>
          ) : loadingMessages ? (
            <div className="flex justify-center py-12">
              <Loader2 size="28" className="animate-spin text-primary-600" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <MessageSquare size="40" className="text-gray-300 mb-3" />
              <p className="text-gray-500">Send a message to start chatting</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 animate-slide-up ${msg.role === "USER" ? "justify-end" : "justify-start"}`}>
                {msg.role === "ASSISTANT" && (
                  <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot size="16" />
                  </div>
                )}
                <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${msg.role === "USER" ? "bg-primary-600 text-white rounded-br-md" : "bg-white border border-gray-200 text-gray-800 rounded-bl-md shadow-sm"}`}>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  <p className={`text-xs mt-1.5 ${msg.role === "USER" ? "text-primary-200" : "text-gray-400"}`}>{new Date(msg.createdAt).toLocaleTimeString()}</p>
                </div>
                {msg.role === "USER" && (
                  <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center flex-shrink-0 mt-1">
                    <User size="16" />
                  </div>
                )}
              </div>
            ))
          )}
          {sending && (
            <div className="flex gap-3 animate-slide-up">
              <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center flex-shrink-0">
                <Bot size="16" />
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        {activeSessionId && (
          <div className="border-t border-gray-200 bg-white px-4 py-3 flex-shrink-0">
            <div className="flex items-end gap-2 max-w-4xl mx-auto">
              <div className="flex-1 relative">
                <textarea
                  className="form-input block w-full resize-none pr-10 py-3 max-h-32"
                  rows={1}
                  placeholder="Ask about your documents..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={sending}
                />
              </div>
              <button onClick={sendMessage} disabled={!input.trim() || sending} className="btn-primary px-4 py-3 rounded-xl">
                {sending ? <Loader2 size="18" className="animate-spin" /> : <Send size="18" />}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
