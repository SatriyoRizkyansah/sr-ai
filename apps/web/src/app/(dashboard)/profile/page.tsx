"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { useAuthStore } from "@/stores/auth-store";
import { User, Mail, Shield, Calendar, LogOut, Loader2, FileText, MessageSquare, BrainCircuit, ArrowLeft } from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuthStore();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center">
              <BrainCircuit size="20" className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900">DocMind AI</h1>
              <p className="text-xs text-gray-400">Document Assistant</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          <button onClick={() => router.push("/documents")} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all">
            <FileText size="18" />
            Documents
          </button>
          <button onClick={() => router.push("/chat")} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all">
            <MessageSquare size="18" />
            Chat
          </button>
          <button onClick={() => router.push("/profile")} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-primary-50 text-primary-700 font-medium">
            <User size="18" />
            Profile
          </button>
        </nav>

        <div className="p-3 border-t border-gray-100">
          <div className="flex items-center gap-3 px-3 py-2 text-sm text-gray-600">
            <div className="w-7 h-7 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold">{user?.name?.charAt(0)?.toUpperCase() || "U"}</div>
            <span className="truncate flex-1">{user?.name || "User"}</span>
            <button
              onClick={() => {
                logout();
                router.push("/login");
              }}
              className="p-1 hover:bg-gray-100 rounded"
              title="Logout"
            >
              <LogOut size="16" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400">
              <ArrowLeft size="20" />
            </button>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Profile</h2>
              <p className="text-sm text-gray-500">Your account information</p>
            </div>
          </div>
        </header>

        <div className="flex-1 p-6 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size="32" className="animate-spin text-primary-600" />
            </div>
          ) : (
            <div className="max-w-2xl mx-auto space-y-6">
              {/* Avatar Card */}
              <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
                <div className="w-20 h-20 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-3xl font-bold mx-auto mb-4">
                  {profile?.name?.charAt(0)?.toUpperCase() || user?.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <h2 className="text-xl font-bold text-gray-900">{profile?.name || user?.name}</h2>
                <p className="text-gray-500">{profile?.email || user?.email}</p>
              </div>

              {/* Details */}
              <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
                <div className="flex items-center gap-4 px-6 py-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <User size="20" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Name</p>
                    <p className="text-sm font-medium text-gray-800">{profile?.name || user?.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 px-6 py-4">
                  <div className="w-10 h-10 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
                    <Mail size="20" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Email</p>
                    <p className="text-sm font-medium text-gray-800">{profile?.email || user?.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 px-6 py-4">
                  <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                    <Shield size="20" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Role</p>
                    <p className="text-sm font-medium text-gray-800 capitalize">{profile?.role || user?.role || "USER"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 px-6 py-4">
                  <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Calendar size="20" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Member Since</p>
                    <p className="text-sm font-medium text-gray-800">
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
                className="btn-danger w-full"
              >
                <LogOut size="18" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
