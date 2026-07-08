"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { useAuthStore } from "@/stores/auth-store";
import { CommandPalette } from "@/components/command-palette";
import { Sidebar } from "@/components/sidebar";
import { Navbar } from "@/components/navbar";
import LogViewerModal from "@/components/LogViewerModal";
import {
  User,
  Mail,
  Shield,
  Calendar,
  Loader2,
} from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const { isAuthenticated, user, _hydrated } = useAuthStore();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showLogModal, setShowLogModal] = useState(false);

  useEffect(() => {
    if (!_hydrated) return; // Wait for hydration
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
    <>
      <CommandPalette />
      <LogViewerModal open={showLogModal} onClose={() => setShowLogModal(false)} />
      <div className="h-screen bg-white dark:bg-gray-950 flex overflow-hidden">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-gray-950">
          <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} title="Profile" onShowLogs={() => setShowLogModal(true)} />

          <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 size={32} className="animate-spin text-gray-400" strokeWidth={2} />
              </div>
            ) : (
              <div className="max-w-2xl mx-auto p-6 space-y-6">
                {/* Avatar Card */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 text-center shadow-sm">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-4xl font-bold text-white mx-auto mb-4 shadow-xl">
                    {profile?.name?.charAt(0)?.toUpperCase() || user?.name?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {profile?.name || user?.name}
                  </h2>
                  <p className="text-gray-500 dark:text-gray-400 mt-1">
                    {profile?.email || user?.email}
                  </p>
                </div>

                {/* Details */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700 overflow-hidden shadow-sm">
                  <div className="flex items-center gap-4 px-6 py-5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <User size={22} strokeWidth={2} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium mb-1">Name</p>
                      <p className="text-base font-medium text-gray-900 dark:text-white truncate">{profile?.name || user?.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 px-6 py-5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="w-12 h-12 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 flex items-center justify-center shrink-0">
                      <Mail size={22} strokeWidth={2} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium mb-1">Email</p>
                      <p className="text-base font-medium text-gray-900 dark:text-white truncate">{profile?.email || user?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 px-6 py-5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                      <Shield size={22} strokeWidth={2} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium mb-1">Role</p>
                      <p className="text-base font-medium text-gray-900 dark:text-white capitalize">{profile?.role || user?.role || "USER"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 px-6 py-5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                      <Calendar size={22} strokeWidth={2} />
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
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
