"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { useAuthStore } from "@/stores/auth-store";
import { CommandPalette } from "@/components/command-palette";
import { Sidebar } from "@/components/sidebar";
import { Navbar } from "@/components/navbar";
import { MessageSquare, Send, Loader2, FileText, Sparkles } from "lucide-react";

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
  const { isAuthenticated, user } = useAuthStore();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    fetchSessions();
  }, [isAuthenticated, router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
    <>
      <CommandPalette />
      <div className="h-screen bg-white dark:bg-gray-950 flex overflow-hidden">
        <Sidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSessionSelect={selectSession}
          onSessionDelete={deleteSession}
          onCreateSession={createSession}
          loadingSessions={loadingSessions}
        />

        <main className="flex-1 flex flex-col min-w-0 relative bg-white dark:bg-gray-950">
          <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

          <div className="flex-1 overflow-y-auto custom-scrollbar bg-white dark:bg-gray-950">
            {!activeSessionId ? (
              <div className="flex flex-col items-center justify-center h-full px-4 pb-32">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center mb-6 shadow-xl">
                  <Sparkles size={32} className="text-white" strokeWidth={2.5} />
                </div>
                <h2 className="text-3xl font-semibold text-gray-900 dark:text-white mb-3">How can I help you today?</h2>
                <p className="text-gray-500 dark:text-gray-400 text-center max-w-md mb-8">
                  Ask me anything about your documents. I'll search through them using advanced RAG technology.
                </p>
              </div>
            ) : loadingMessages ? (
              <div className="flex justify-center py-12">
                <Loader2 size={28} className="animate-spin text-gray-400" />
              </div>
            ) : (
              <div className="max-w-3xl mx-auto px-4">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-32 text-center">
                    <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-400 flex items-center justify-center mb-4">
                      <MessageSquare size={24} strokeWidth={2} />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400">Start a conversation</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => (
                    <div 
                      key={msg.id} 
                      className={`py-8 group ${
                        msg.role === "ASSISTANT" ? "bg-gray-50/50 dark:bg-gray-900/30" : "bg-white dark:bg-gray-950"
                      } ${idx === 0 ? "pt-6" : ""}`}
                    >
                      <div className="flex gap-6 max-w-3xl mx-auto">
                        <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center font-semibold text-sm">
                          {msg.role === "USER" ? (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center font-semibold text-sm">
                              {user?.name?.charAt(0)?.toUpperCase() || "U"}
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                              <Sparkles size={18} className="text-white" strokeWidth={2.5} />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 pt-1">
                          <div className="prose prose-sm max-w-none dark:prose-invert">
                            <p className="text-[15px] leading-7 text-gray-800 dark:text-gray-200 whitespace-pre-wrap m-0">
                              {msg.content}
                            </p>
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
                  <div className="py-8 bg-gray-50/50 dark:bg-gray-900/30">
                    <div className="flex gap-6 max-w-3xl mx-auto">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center flex-shrink-0">
                        <Sparkles size={18} className="text-white" strokeWidth={2.5} />
                      </div>
                      <div className="flex-1 pt-1">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                          <span className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                          <span className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {activeSessionId && (
            <div className="px-4 py-4 flex-shrink-0 bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800">
              <div className="max-w-3xl mx-auto">
                <div className="relative bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-3xl shadow-lg hover:shadow-xl transition-shadow focus-within:border-gray-400 dark:focus-within:border-gray-600">
                  <textarea
                    ref={textareaRef}
                    className="w-full px-4 py-4 pr-12 bg-transparent border-0 focus:outline-none resize-none text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-[15px] leading-6 max-h-[200px]"
                    rows={1}
                    placeholder="Message DocMind AI"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={sending}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim() || sending}
                    className="absolute right-3 bottom-3 w-8 h-8 rounded-full bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 disabled:bg-gray-200 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white dark:text-black flex items-center justify-center transition-all"
                  >
                    {sending ? (
                      <Loader2 size={16} className="animate-spin" strokeWidth={2.5} />
                    ) : (
                      <Send size={16} className="ml-0.5" strokeWidth={2.5} />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-3">
                  DocMind AI can make mistakes. Check important info.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
