"use client";

import { Moon, Sun } from "lucide-react";

import { useTheme } from "@/context/theme-context";

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { resolved, setTheme } = useTheme();
  const dark = resolved === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? "light" : "dark")}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className={
        compact
          ? "flex h-10 w-10 items-center justify-center rounded-full border border-ink/12 bg-paper text-ink"
          : "inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-ink/12 bg-paper px-3 py-2.5 text-sm font-medium text-ink"
      }
    >
      {dark ? <Sun size={16} /> : <Moon size={16} />}
      {compact ? null : dark ? "Light" : "Dark"}
    </button>
  );
}
