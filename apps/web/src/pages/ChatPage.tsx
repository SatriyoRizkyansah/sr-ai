import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Plus, Send, Bot, User, Trash2, Sparkles } from 'lucide-react';
import api from '../lib/axios';

interface Session {
  id: string;
  title: string;
  createdAt: string;
  _count?: { messages: number };
}

interface Message {
  id: string;
  content: string;
  role: string;
  createdAt: string;
}

export default function ChatPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    if (activeSessionId) {
      loadMessages(activeSessionId);
    } else {
      setMessages([]);
    }
  }, [activeSessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/chat/sessions');
      setSessions(data);
    } catch (err) {
      console.error('Failed to load sessions', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (sessionId: string) => {
    try {
      const { data } = await api.get(`/chat/sessions/${sessionId}/messages`);
      setMessages(data);
    } catch (err) {
      console.error('Failed to load messages', err);
    }
  };

  const createSession = async () => {
    try {
      const { data } = await api.post('/chat/sessions', { title: 'New Chat' });
      setSessions((prev) => [data, ...prev]);
      setActiveSessionId(data.id);
    } catch (err) {
      console.error('Failed to create session', err);
    }
  };

  const deleteSession = async (id: string) => {
    try {
      await api.delete(`/chat/sessions/${id}`);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      if (activeSessionId === id) setActiveSessionId(null);
    } catch (err) {
      console.error('Failed to delete session', err);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || sending) return;

    let sessionId = activeSessionId;
    if (!sessionId) {
      try {
        const { data } = await api.post('/chat/sessions', { title: input.slice(0, 50) });
        sessionId = data.id;
        setActiveSessionId(data.id);
        setSessions((prev) => [data, ...prev]);
      } catch (err) {
        console.error('Failed to create session', err);
        return;
      }
    }

    const userMessage: Message = {
      id: 'temp-' + Date.now(),
      content: input,
      role: 'USER',
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setSending(true);

    try {
      const { data } = await api.post(`/chat/sessions/${sessionId}/messages`, {
        content: userMessage.content,
      });
      setMessages((prev) => [...prev, data]);
      loadSessions();
    } catch (err) {
      console.error('Failed to send message', err);
      setMessages((prev) => [
        ...prev,
        {
          id: 'error-' + Date.now(),
          content: 'Failed to send message. Please try again.',
          role: 'ASSISTANT',
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex h-full">
      {/* Sessions sidebar */}
      <div className="w-80 bg-white/60 backdrop-blur-sm border-r border-gray-200/60 flex flex-col">
        <div className="p-4 border-b border-gray-100">
          <button
            onClick={createSession}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            New Conversation
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-300">
              <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin mb-3" />
              <span className="text-sm">Loading conversations...</span>
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mb-3">
                <MessageSquare className="w-6 h-6 text-gray-300" />
              </div>
              <p className="text-sm font-medium text-gray-500">No conversations</p>
              <p className="text-xs text-gray-400 mt-1">Start a new one above</p>
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                className={`group flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 cursor-pointer ${
                  activeSessionId === session.id
                    ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-sm border border-blue-100/60'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
                onClick={() => setActiveSessionId(session.id)}
              >
                <MessageSquare className={`w-4 h-4 flex-shrink-0 ${
                  activeSessionId === session.id ? 'text-blue-500' : 'text-gray-300'
                }`} />
                <div className="flex-1 min-w-0">
                  <div className={`font-medium truncate ${activeSessionId === session.id ? 'text-blue-700' : 'text-gray-700'}`}>
                    {session.title}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {session._count?.messages || 0} messages
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteSession(session.id); }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-gray-300 hover:text-red-500 transition-all duration-150"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col bg-gray-50/50">
        {activeSessionId ? (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="max-w-3xl mx-auto space-y-6">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 animate-slide-up ${msg.role === 'USER' ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    {/* Avatar */}
                    <div className={`w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center shadow-sm ${
                      msg.role === 'USER'
                        ? 'bg-gradient-to-br from-blue-500 to-indigo-500'
                        : 'bg-gradient-to-br from-gray-700 to-gray-800'
                    }`}>
                      {msg.role === 'USER'
                        ? <User className="w-4 h-4 text-white" />
                        : <Bot className="w-4 h-4 text-white" />
                      }
                    </div>
                    {/* Message bubble */}
                    <div className={`max-w-[75%] ${msg.role === 'USER' ? 'text-right' : ''}`}>
                      <div
                        className={`rounded-2xl px-4 py-3 ${
                          msg.role === 'USER'
                            ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-br-md shadow-md'
                            : 'bg-white text-gray-800 rounded-bl-md shadow-sm border border-gray-100'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      </div>
                      <p className={`text-[11px] mt-1.5 ${msg.role === 'USER' ? 'text-gray-400' : 'text-gray-400'}`}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
                {sending && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center shadow-sm flex-shrink-0">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-sm border border-gray-100">
                      <div className="flex gap-1.5 items-center">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input bar */}
            <div className="border-t border-gray-200/60 bg-white/80 backdrop-blur-sm p-4">
              <div className="max-w-3xl mx-auto flex gap-3 items-center">
                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    type="text"
                    className="w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-200 rounded-xl text-sm transition-all duration-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 placeholder:text-gray-400"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask anything about your documents..."
                    disabled={sending}
                  />
                </div>
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || sending}
                  className="w-11 h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 flex-shrink-0"
                >
                  {sending ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
              <p className="text-[11px] text-gray-400 text-center mt-2">Press Enter to send — answers from your documents</p>
            </div>
          </>
        ) : (
          /* Empty state */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center animate-fade-in">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-inner">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-md">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">DocMind AI Chat</h3>
              <p className="text-sm text-gray-500 max-w-xs mx-auto">
                Start a new conversation to ask questions about your documents
              </p>
              <button
                onClick={createSession}
                className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
              >
                <Plus className="w-4 h-4" />
                Start Chatting
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
