"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { 
  MessageSquare, Plus, Trash2, Loader2, FileText, 
  LogOut, PanelLeftClose, User as UserIcon, MoreHorizontal
} from "lucide-react";

interface Session {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  _count: { messages: number };
}

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  sessions?: Session[];
  activeSessionId?: string | null;
  onSessionSelect?: (id: string) => void;
  onSessionDelete?: (id: string) => void;
  onCreateSession?: () => void;
  loadingSessions?: boolean;
}

export function Sidebar({
  sidebarOpen,
  setSidebarOpen,
  sessions = [],
  activeSessionId = null,
  onSessionSelect,
  onSessionDelete,
  onCreateSession,
  loadingSessions = false,
}: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const isChat = pathname === "/chat";

  return (
    <aside 
      className={`${
        sidebarOpen ? "w-[260px]" : "w-0"
      } bg-[#171717] flex flex-col transition-all duration-200 ease-in-out flex-shrink-0 border-r border-white/10 ${
        !sidebarOpen ? "overflow-hidden" : ""
      }`}
    >
      <div className="flex flex-col h-full min-w-[260px]">
        {/* Sidebar Header */}
        <div className="flex items-center gap-2 p-2 h-[60px]">
          {isChat ? (
            <button 
              onClick={onCreateSession} 
              className="flex-1 flex items-center justify-center gap-2 h-11 px-3 rounded-lg hover:bg-white/10 text-white transition-colors text-sm font-medium"
            >
              <Plus size={18} strokeWidth={2} />
              New chat
            </button>
          ) : (
            <button 
              onClick={() => router.push("/chat")} 
              className="flex-1 flex items-center justify-center gap-2 h-11 px-3 rounded-lg hover:bg-white/10 text-white transition-colors text-sm font-medium"
            >
              <MessageSquare size={18} strokeWidth={2} />
              Chats
            </button>
          )}
          <button 
            onClick={() => setSidebarOpen(false)}
            className="h-11 w-11 flex items-center justify-center rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          >
            <PanelLeftClose size={20} strokeWidth={2} />
          </button>
        </div>

        {/* Sessions List (only on chat page) */}
        {isChat && (
          <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1 custom-scrollbar">
            {loadingSessions ? (
              <div className="flex justify-center py-8">
                <Loader2 size={18} className="animate-spin text-white/40" />
              </div>
            ) : sessions.length === 0 ? (
              <p className="text-xs text-white/40 text-center py-8 px-3">No conversations yet</p>
            ) : (
              sessions.map((session) => (
                <div
                  key={session.id}
                  className={`group flex items-center gap-2 px-3 h-10 rounded-lg cursor-pointer transition-all text-sm relative ${
                    activeSessionId === session.id 
                      ? "bg-white/10 text-white" 
                      : "text-white/70 hover:bg-white/5 hover:text-white"
                  }`}
                  onClick={() => onSessionSelect?.(session.id)}
                >
                  <MessageSquare size={16} className="flex-shrink-0" strokeWidth={2} />
                  <span className="flex-1 truncate">{session.title}</span>
                  {activeSessionId === session.id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSessionDelete?.(session.id);
                      }}
                      className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-white/10 rounded transition-all"
                    >
                      <Trash2 size={14} strokeWidth={2} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Spacer for non-chat pages */}
        {!isChat && <div className="flex-1" />}

        {/* Bottom Menu - Documents & Profile */}
        <div className="px-2 py-2 border-t border-white/10 space-y-1">
          <button
            onClick={() => router.push("/documents")}
            className={`w-full flex items-center gap-3 px-3 h-10 rounded-lg transition-colors text-sm ${
              pathname === "/documents"
                ? "bg-white/10 text-white"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            <FileText size={16} strokeWidth={2} />
            Documents
          </button>
          <button
            onClick={() => router.push("/profile")}
            className={`w-full flex items-center gap-3 px-3 h-10 rounded-lg transition-colors text-sm ${
              pathname === "/profile"
                ? "bg-white/10 text-white"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            <UserIcon size={16} strokeWidth={2} />
            Profile
          </button>
        </div>

        {/* User Section */}
        <div className="p-2 border-t border-white/10">
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-full flex items-center gap-3 px-3 h-12 rounded-lg hover:bg-white/10 text-white transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-sm font-semibold flex-shrink-0 text-white">
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-medium truncate">{user?.name || "User"}</p>
                <p className="text-xs text-white/50 truncate">{user?.email}</p>
              </div>
              <MoreHorizontal size={18} className="opacity-60" strokeWidth={2} />
            </button>
            
            {showUserMenu && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="absolute bottom-full left-2 right-2 mb-2 bg-[#2c2c2c] rounded-lg shadow-xl border border-white/10 py-1.5 z-20">
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
  );
}
