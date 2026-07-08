"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { useAuthStore } from "@/stores/auth-store";
import {
  User,
  Mail,
  Shield,
  Calendar,
  LogOut,
  Loader2,
  FileText,
  MessageSquare,
  Sparkles,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeft,
  Moon,
  Sun,
  Terminal,
} from "lucide-react";
import { useThemeStore } from "@/stores/theme-store";
import LogViewerModal from "@/components/LogViewerModal";
import DashboardSidebar from "@/components/DashboardSidebar";

export default function ProfilePage() {
  const router = useRouter();
  const { isAuthenticated, _hydrated, user, logout } = useAuthStore();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showLogModal, setShowLogModal] = useState(false);

  useEffect(() => {
    if (!_hydrated) return;
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    fetchProfile();
  }, [_hydrated, isAuthenticated, router]);

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
      <DashboardSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        showUserMenu={showUserMenu}
        setShowUserMenu={setShowUserMenu}
        onShowLogs={() => setShowLogModal(true)}
      />

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#212121]">
        {/* Header */}
        <header className="h-14 border-b border-black/10 dark:border-white/10 flex items-center px-4 bg-white dark:bg-[#212121]">
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-black/5 dark:hover:bg-white/5 text-gray-600 dark:text-gray-300 transition-colors mr-2"
            >
              <PanelLeft size={18} strokeWidth={2} />
            </button>
          )}
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-md bg-linear-to-br from-purple-500 to-purple-600 flex items-center justify-center">
              <User size={14} className="text-white" strokeWidth={2.5} />
            </div>
            <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white">Profile</h2>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto bg-[#fafafa] dark:bg-[#212121]">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={32} className="animate-spin text-gray-400 dark:text-gray-500" strokeWidth={2} />
            </div>
          ) : (
            <div className="max-w-2xl mx-auto p-6 space-y-6">
              {/* Avatar Card */}
              <div className="bg-white dark:bg-[#2f2f2f] rounded-2xl border border-gray-200 dark:border-white/8 p-8 text-center">
                <div className="w-24 h-24 rounded-full bg-linear-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-4xl font-bold text-white mx-auto mb-4 shadow-xl">
                  {profile?.name?.charAt(0)?.toUpperCase() || user?.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-[#ececec]">
                  {profile?.name || user?.name}
                </h2>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                  {profile?.email || user?.email}
                </p>
              </div>

              {/* Details */}
              <div className="bg-white dark:bg-[#2f2f2f] rounded-2xl border border-gray-200 dark:border-white/8 divide-y divide-gray-100 dark:divide-white/5 overflow-hidden">
                <div className="flex items-center gap-4 px-6 py-5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <User size={22} strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium mb-1">Name</p>
                    <p className="text-base font-medium text-gray-900 dark:text-[#ececec] truncate">{profile?.name || user?.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 px-6 py-5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 flex items-center justify-center shrink-0">
                    <Mail size={22} strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium mb-1">Email</p>
                    <p className="text-base font-medium text-gray-900 dark:text-[#ececec] truncate">{profile?.email || user?.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 px-6 py-5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                    <Shield size={22} strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium mb-1">Role</p>
                    <p className="text-base font-medium text-gray-900 dark:text-[#ececec] capitalize">{profile?.role || user?.role || "USER"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 px-6 py-5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <Calendar size={22} strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium mb-1">Member Since</p>
                    <p className="text-base font-medium text-gray-900 dark:text-[#ececec]">
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
            </div>
          )}
        </div>
      </main>

      <LogViewerModal open={showLogModal} onClose={() => setShowLogModal(false)} />
    </div>
  );
}
