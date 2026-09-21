"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Activity, MessageCircle, Settings, Sparkles } from "lucide-react";

import { RelishWordmark } from "@/components/relish-mark";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/context/auth-context";
import { initials } from "@/lib/format";

const NAV = [
  { href: "/", label: "Today", icon: Sparkles },
  { href: "/chat", label: "Trainer", icon: MessageCircle },
  { href: "/progress", label: "Progress", icon: Activity },
  { href: "/settings", label: "You", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <div className="h-10 w-10 animate-pulse rounded-full bg-lime" />
      </div>
    );
  }

  const isChat = pathname === "/chat";

  return (
    <div className={isChat ? "h-dvh overflow-hidden bg-cream" : "min-h-screen bg-cream"}>
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-ink/8 bg-paper px-4 py-6 lg:flex">
        <Link href="/" className="mb-8 px-2">
          <RelishWordmark size={34} />
          <p className="mt-1.5 pl-11 text-xs text-muted">Log it like a text</p>
        </Link>
        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition ${
                  active ? "bg-night text-lime" : "text-ink/70 hover:bg-sand"
                }`}
              >
                <Icon size={18} className="shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto space-y-3">
          <ThemeToggle />
          <div className="flex items-center gap-3 rounded-2xl bg-sand px-3 py-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-forest text-sm font-semibold text-lime">
              {initials(user.email, user.first_name)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{user.first_name || "You"}</p>
              <p className="truncate text-xs text-muted">{user.email}</p>
            </div>
          </div>
        </div>
      </aside>

      <main
        className={
          isChat
            ? "flex h-full min-h-0 flex-col overflow-hidden pb-[4.25rem] lg:ml-60 lg:pb-0"
            : "pb-24 lg:ml-60 lg:pb-8"
        }
      >
        {children}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t border-ink/8 bg-paper/95 backdrop-blur lg:hidden">
        {NAV.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 py-3 text-[11px] font-medium ${
                active ? "text-moss" : "text-muted"
              }`}
            >
              <Icon size={20} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
