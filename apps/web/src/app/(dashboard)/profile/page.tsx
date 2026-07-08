"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { useAuthStore } from "@/stores/auth-store";
import { 
  User, Mail, Shield, Calendar, LogOut, Loader2, 
  FileText, MessageSquare, Sparkles, MoreHorizontal, 
  ArrowLeft, PanelLeft, PanelLeftClose
} from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuthStore();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    fetchProfile();
  }, [isAuthenticated]);

  const fetchProfile = async () => {
    try {
      const { data } = await api.get("/auth/profile");
      setProfile(data);
    } catch (err) {
      console.error("Failed to fetch profile", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="h-screen bg-white dark:bg-gray-950 flex overflow-hidden">
      {/* Sidebar */}
      <aside 
        className={`${
          sidebarOpen ? "w-[260px]" : "w-0"
        } bg-[#0f0f0f] flex flex-col transition-all duration-200 ease-in-out flex-shrink-0 border-r border-white/10 ${
          !sidebarOpen ? "overflow-hidden" : ""
        }`}
      >
        <div className="flex flex-col h-full min-w-[260px]">
          {/* Sidebar Header */}
          <div className="flex items-center gap-2 p-2 h-[60px]">
            <button 
              onClick={() => router.push("/chat")} 
              className="flex-1 flex items-center justify-center gap-2 h-11 px-3 rounded-lg hover:bg-white/10 text-white transition-colors text-sm font-medium"
            >
              <MessageSquare size={18} />
              Chats
            </button>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="h-11 w-11 flex items-center justify-center rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors"
            >
              <PanelLeftClose size={20} />
            </button>
          </div>

          {/* Menu Items */}
          <div className="px-2 py-2 space-y-1">
            <button
              onClick={() => router.push("/chat")}
              className="w-full flex items-center gap-3 px-3 h-10 rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-colors text-sm"
            >
              <MessageSquare size={16} />
              Chat
            </button>
            <button
              onClick={() => router.push("/documents")}
              className="w-full flex items-center gap-3 px-3 h-10 rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-colors text-sm"
            >
              <FileText size={16} />
              Documents
            </button>
            <button
              onClick={() => router.push("/profile")}
              className="w-full flex items-center gap-3 px-3 h-10 rounded-lg bg-white/10 text-white transition-colors text-sm"
            >
              <User size={16} />
              Profile
            </button>
          </div>

          <div className="flex-1" />

          {/* User Menu */}
          <div className="p-2 border-t border-white/10">
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-full flex items-center gap-3 px-3 h-12 rounded-lg hover:bg-white/10 text-white transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                  {user?.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <span className="flex-1 truncate text-sm text-left">{user?.name || "User"}</span>
                <MoreHorizontal size={18} className="opacity-60" />
              </button>
              
              {showUserMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="absolute bottom-full left-2 right-2 mb-2 bg-[#1a1a1a] rounded-lg shadow-xl border border-white/10 py-1.5 z-20">
                    <div className="h-px bg-white/10 my-1.5" />
                    <button
                      onClick={() => {
                        logout();
                        router.push("/login");
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-white/5 transition-colors"
                    >
                      <LogOut size={16} />
                      Log out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-gray-950">
        {/* Header */}
        <header className="h-[60px] border-b border-gray-100 dark:border-gray-800 flex items-center px-6 bg-white dark:bg-gray-950">
          {!sidebarOpen && (
            <button 
              onClick={() => setSidebarOpen(true)}
              className="h-10 w-10 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors mr-3"
            >
              <PanelLeft size={20} />
            </button>
          )}
          <button 
            onClick={() => router.back()} 
            className="h-10 w-10 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors mr-3"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
              <User size={16} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Profile</h2>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={32} className="animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="max-w-2xl mx-auto p-6 space-y-6">
              {/* Avatar Card */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 text-center">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-4xl font-bold text-white mx-auto mb-4 shadow-xl">
                  {profile?.name?.charAt(0)?.toUpperCase() || user?.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{profile?.name || user?.name}</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-1">{profile?.email || user?.email}</p>
              </div>

              {/* Details */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700 overflow-hidden">
                <div className="flex items-center gap-4 px-6 py-5 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
                    <User size={22} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium mb-1">Name</p>
                    <p className="text-base font-medium text-gray-900 dark:text-white truncate">{profile?.name || user?.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 px-6 py-5 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 flex items-center justify-center flex-shrink-0">
                    <Mail size={22} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium mb-1">Email</p>
                    <p className="text-base font-medium text-gray-900 dark:text-white truncate">{profile?.email || user?.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 px-6 py-5 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0">
                    <Shield size={22} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium mb-1">Role</p>
                    <p className="text-base font-medium text-gray-900 dark:text-white capitalize">{profile?.role || user?.role || "USER"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 px-6 py-5 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
                    <Calendar size={22} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium mb-1">Member Since</p>
                    <p className="text-base font-medium text-gray-900 dark:text-white">
                      {profile?.createdAt
                        ? new Date(profile.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })
                        : "-"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Logout */}
              <button
                onClick={() => {
                  logout();
                  router.push("/login");
                }}
                className="w-full flex items-center justify-center gap-2 h-11 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors font-medium"
              >
                <LogOut size={18} />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
