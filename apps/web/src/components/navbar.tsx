"use client";

import { useThemeStore } from "@/stores/theme-store";
import { 
  PanelLeft, Sparkles, Command, Moon, Sun, BrainCircuit
} from "lucide-react";

interface NavbarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  title?: string;
}

export function Navbar({ sidebarOpen, setSidebarOpen, title = "DocMind AI" }: NavbarProps) {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <header className="h-[60px] border-b border-gray-100 dark:border-gray-800 flex items-center justify-between px-4 flex-shrink-0 bg-white dark:bg-gray-950">
      <div className="flex items-center gap-2">
        {!sidebarOpen && (
          <button 
            onClick={() => setSidebarOpen(true)}
            className="h-10 w-10 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
          >
            <PanelLeft size={20} strokeWidth={2} />
          </button>
        )}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
            <Sparkles size={16} className="text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h1>
        </div>
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center gap-2">
        {/* Command Palette Trigger */}
        <button
          onClick={() => {}}
          className="h-9 px-3 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors border border-gray-200 dark:border-gray-700"
          title="Press Ctrl+K or Cmd+K"
        >
          <Command size={14} strokeWidth={2} />
          <span className="hidden sm:inline">Search</span>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] bg-gray-100 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">⌘K</kbd>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
          title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        >
          {theme === "light" ? (
            <Moon size={18} strokeWidth={2} />
          ) : (
            <Sun size={18} strokeWidth={2} />
          )}
        </button>

        {/* Logo/Brand */}
        <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
          <BrainCircuit size={18} className="text-white" strokeWidth={2.5} />
        </div>
      </div>
    </header>
  );
}
