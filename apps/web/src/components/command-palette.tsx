"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { 
  Search, MessageSquare, FileText, User, LogOut, 
  Moon, Sun, Plus, Home, Settings
} from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { useThemeStore } from "@/stores/theme-store";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();

  // Toggle with Ctrl/Cmd + K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-in fade-in-0">
      <div className="fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%]">
        <Command className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-2xl">
          <div className="flex items-center border-b border-gray-200 dark:border-gray-700 px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Command.Input
              placeholder="Type a command or search..."
              className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-gray-500 dark:placeholder:text-gray-400 disabled:cursor-not-allowed disabled:opacity-50 text-gray-900 dark:text-gray-100"
            />
          </div>
          <Command.List className="max-h-[300px] overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
              No results found.
            </Command.Empty>

            <Command.Group heading="Navigation" className="text-xs font-medium text-gray-500 dark:text-gray-400 px-2 py-1.5">
              <Command.Item
                onSelect={() => {
                  router.push("/chat");
                  setOpen(false);
                }}
                className="flex items-center gap-2 px-2 py-2 text-sm rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 aria-selected:bg-gray-100 dark:aria-selected:bg-gray-700"
              >
                <MessageSquare size={16} />
                <span>Chat</span>
              </Command.Item>
              <Command.Item
                onSelect={() => {
                  router.push("/documents");
                  setOpen(false);
                }}
                className="flex items-center gap-2 px-2 py-2 text-sm rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 aria-selected:bg-gray-100 dark:aria-selected:bg-gray-700"
              >
                <FileText size={16} />
                <span>Documents</span>
              </Command.Item>
              <Command.Item
                onSelect={() => {
                  router.push("/profile");
                  setOpen(false);
                }}
                className="flex items-center gap-2 px-2 py-2 text-sm rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 aria-selected:bg-gray-100 dark:aria-selected:bg-gray-700"
              >
                <User size={16} />
                <span>Profile</span>
              </Command.Item>
            </Command.Group>

            <Command.Separator className="h-px bg-gray-200 dark:bg-gray-700 my-1" />

            <Command.Group heading="Actions" className="text-xs font-medium text-gray-500 dark:text-gray-400 px-2 py-1.5">
              <Command.Item
                onSelect={() => {
                  toggleTheme();
                  setOpen(false);
                }}
                className="flex items-center gap-2 px-2 py-2 text-sm rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 aria-selected:bg-gray-100 dark:aria-selected:bg-gray-700"
              >
                {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
                <span>Toggle {theme === "light" ? "Dark" : "Light"} Mode</span>
              </Command.Item>
              <Command.Item
                onSelect={() => {
                  logout();
                  router.push("/login");
                  setOpen(false);
                }}
                className="flex items-center gap-2 px-2 py-2 text-sm rounded-lg cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 aria-selected:bg-red-50 dark:aria-selected:bg-red-900/20"
              >
                <LogOut size={16} />
                <span>Log out</span>
              </Command.Item>
            </Command.Group>
          </Command.List>
          
          <div className="border-t border-gray-200 dark:border-gray-700 px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
            Press <kbd className="px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 rounded">⌘</kbd>
            <kbd className="px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 rounded ml-1">K</kbd> to toggle
          </div>
        </Command>
      </div>
      <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
    </div>
  );
}
