"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { Loader2, BrainCircuit } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, _hydrated } = useAuthStore();

  useEffect(() => {
    if (!_hydrated) return;
    if (isAuthenticated) {
      router.replace("/documents");
    } else {
      router.replace("/login");
    }
  }, [isAuthenticated, _hydrated, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-indigo-50">
      <div className="text-center animate-slide-up">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-600 text-white mb-4 shadow-lg shadow-primary-200">
          <BrainCircuit size="36" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">DocMind AI</h1>
        <Loader2 size="24" className="animate-spin text-primary-600 mx-auto" />
      </div>
    </div>
  );
}
