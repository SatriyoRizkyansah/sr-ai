"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/axios";
import { useAuthStore } from "@/stores/auth-store";
import { Loader2, Shield, Lock, Mail } from "lucide-react";

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
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-950">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 dark:from-black dark:via-gray-950 dark:to-black p-12 flex-col justify-between relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
              backgroundSize: "40px 40px",
            }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-14 h-14 flex items-center justify-center">
              <img src="/assets/logo/knowa-logo.png" alt="Knowa Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Knowa</h1>
              <p className="text-xs text-gray-400">AI Knowledge Assistant</p>
            </div>
          </div>

          <div className="mt-16 space-y-6 max-w-md">
            <h2 className="text-4xl font-bold text-white leading-tight">Document Intelligence Platform</h2>
            {/* <p className="text-gray-400 text-lg leading-relaxed">Advanced RAG-powered system for internal document management and AI-assisted knowledge retrieval.</p> */}

            {/* <div className="pt-8 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Shield size={16} className="text-emerald-400" strokeWidth={2} />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Secure & Compliant</h3>
                  <p className="text-sm text-gray-400">Enterprise-grade security with role-based access control</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Lock size={16} className="text-blue-400" strokeWidth={2} />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Intelligent Search</h3>
                  <p className="text-sm text-gray-400">AI-powered semantic search across all documents</p>
                </div>
              </div>
            </div> */}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} Knowa. All rights reserved.
            <br />
            Internal use only. Authorized personnel only.
          </p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center mb-4 w-24 h-24">
              <img src="/assets/logo/knowa-logo.png" alt="Knowa Logo" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Knowa</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">AI Knowledge Assistant</p>
          </div>

          {/* Form Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Sign In</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Access the internal document management system</p>
          </div>

          {/* Login Form */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="px-4 py-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 text-sm rounded-lg flex items-start gap-2">
                  <div className="flex-shrink-0 mt-0.5">⚠</div>
                  <div className="flex-1">{error}</div>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Corporate Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail size={18} className="text-gray-400" strokeWidth={2} />
                  </div>
                  <input
                    type="email"
                    className="w-full pl-10 pr-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    placeholder="your.name@company.com"
                    required
                    autoComplete="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock size={18} className="text-gray-400" strokeWidth={2} />
                  </div>
                  <input
                    type="password"
                    className="w-full pl-10 pr-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-all font-semibold text-sm shadow-sm"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" strokeWidth={2} />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <Shield size={16} strokeWidth={2} />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Footer Links */}
          <div className="mt-6 text-center space-y-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Need access?{" "}
              <Link href="/register" className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold">
                Request Account
              </Link>
            </p>
            {/* <p className="text-xs text-gray-500 dark:text-gray-500">
              For support, contact IT Department: <span className="font-mono">support@company.com</span>
            </p> */}
          </div>

          {/* Security Notice */}
          <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
            <div className="flex items-start gap-2">
              <Shield size={16} className="text-gray-500 flex-shrink-0 mt-0.5" strokeWidth={2} />
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">This system is for authorized use only. All activities are monitored and logged. Unauthorized access attempts will be reported.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
