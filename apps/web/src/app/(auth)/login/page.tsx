"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/axios";
import { useAuthStore } from "@/stores/auth-store";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", form);
      setAuth(data.user, data.accessToken, data.refreshToken);
      router.push("/chat");
    } catch (err: any) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950 p-4">
      <div className="w-full max-w-sm">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 mb-6 group-hover:scale-110 transition-transform">
            <Sparkles size={24} className="text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-[28px] font-semibold text-gray-900 dark:text-white mb-2 tracking-tight">Welcome back</h1>
          <p className="text-[15px] text-gray-600 dark:text-gray-400">Continue to DocMind AI</p>
        </div>

        {/* Form Card */}
        <div className="bg-white dark:bg-gray-900/50 rounded-xl border border-gray-200/60 dark:border-gray-800/60 p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="px-3 py-2.5 bg-red-50 dark:bg-red-500/10 border border-red-200/60 dark:border-red-500/20 text-red-700 dark:text-red-400 text-sm rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email address</label>
              <input
                type="email"
                className="w-full px-3 py-2.5 bg-white dark:bg-gray-800/50 border border-gray-200/60 dark:border-gray-700/60 rounded-lg text-[15px] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:border-transparent transition-all"
                placeholder="you@example.com"
                required
                autoComplete="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
              <input
                type="password"
                className="w-full px-3 py-2.5 bg-white dark:bg-gray-800/50 border border-gray-200/60 dark:border-gray-700/60 rounded-lg text-[15px] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:border-transparent transition-all"
                placeholder="Enter your password"
                required
                autoComplete="current-password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-white dark:text-gray-900 rounded-lg transition-all font-medium text-[15px] shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" strokeWidth={2} />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Continue</span>
                  <ArrowRight size={18} strokeWidth={2} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-[14px] text-gray-600 dark:text-gray-400">
            Don&apos;t have an account?{" "}
            <Link 
              href="/register" 
              className="text-gray-900 dark:text-white hover:underline font-medium inline-flex items-center gap-1 group"
            >
              Sign up
              <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" strokeWidth={2} />
            </Link>
          </p>
        </div>

        {/* Divider */}
        <div className="mt-8 pt-6 border-t border-gray-200/60 dark:border-gray-800/60">
          <p className="text-xs text-center text-gray-500 dark:text-gray-500">
            By continuing, you agree to DocMind AI&apos;s Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
