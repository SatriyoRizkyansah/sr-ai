"use client";

import { type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { MessageSquare, FileText, User, PanelLeftClose, PanelLeft, MoreHorizontal, LogOut, Moon, Sun, Terminal, Sparkles } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { useThemeStore } from "@/stores/theme-store";
import { useState } from "react";

function ThemeToggleMenuItem() {
  const { theme, toggleTheme } = useThemeStore();
  return (
    <button onClick={toggleTheme} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/90 hover:bg-white/5 transition-colors">
      {theme === "dark" ? <Sun size={16} strokeWidth={2} /> : <Moon size={16} strokeWidth={2} />}
      {theme === "dark" ? "Light mode" : "Dark mode"}
    </button>
  );
}

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  header?: ReactNode;
  showUserMenu: boolean;
  setShowUserMenu: (show: boolean) => void;
  onShowLogs?: () => void;
  children?: ReactNode;
}

export default function DashboardSidebar({ sidebarOpen, setSidebarOpen, header, showUserMenu, setShowUserMenu, onShowLogs, children }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  const isActive = (path: string) => pathname === path;

  const navItems = [
    { path: "/chat", label: "Chat", icon: MessageSquare },
    { path: "/documents", label: "Documents", icon: FileText },
    { path: "/profile", label: "Profile", icon: User },
  ];

  return (
    <aside className={`${sidebarOpen ? "w-65" : "w-0"} bg-[#171717] flex flex-col transition-all duration-200 ease-in-out shrink-0 ${!sidebarOpen ? "overflow-hidden" : ""}`}>
      <div className="flex flex-col h-full min-w-65">
        {/* Sidebar Header */}
        <div className="flex items-center gap-2 p-2.5 h-14">
          {header || (
            <div className="flex items-center gap-2 flex-1 pl-1">
              <div className="w-5 h-5 rounded-md bg-linear-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                <Sparkles size={12} className="text-white" strokeWidth={2.5} />
              </div>
              <span className="text-[14px] font-semibold text-white">DocMind AI</span>
            </div>
          )}
          <button onClick={() => setSidebarOpen(false)} className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-white/5 text-white/70 hover:text-white transition-colors shrink-0">
            <PanelLeftClose size={18} strokeWidth={2} />
          </button>
        </div>

        {/* Navigation */}
        <div className="px-2.5 py-1 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className={`w-full flex items-center gap-2.5 px-3 h-9 rounded-lg transition-colors text-[13px] ${active ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white"}`}
              >
                <Icon size={15} strokeWidth={2} />
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Page-specific content */}
        {children && <div className="flex-1 flex flex-col min-h-0">{children}</div>}

        {!children && <div className="flex-1" />}

        {/* User Menu */}
        <div className="p-2.5">
          <div className="relative">
            <button onClick={() => setShowUserMenu(!showUserMenu)} className="w-full flex items-center gap-2.5 px-2.5 h-10 rounded-lg hover:bg-white/5 text-white transition-colors">
              <div className="w-7 h-7 rounded-full bg-linear-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-xs font-semibold shrink-0 text-white">{user?.name?.charAt(0)?.toUpperCase() || "U"}</div>
              <span className="flex-1 truncate text-[13px] text-left">{user?.name || "User"}</span>
              <MoreHorizontal size={16} className="opacity-50" strokeWidth={2} />
            </button>

            {showUserMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
                <div className="absolute bottom-full left-2 right-2 mb-2 bg-[#212121] rounded-xl shadow-2xl border border-white/10 py-1.5 z-20">
                  <ThemeToggleMenuItem />
                  {onShowLogs && (
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onShowLogs();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/90 hover:bg-white/5 transition-colors"
                    >
                      <Terminal size={16} strokeWidth={2} />
                      Logs
                    </button>
                  )}
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
  );
}
