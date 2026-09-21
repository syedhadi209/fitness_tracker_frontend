"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/context/auth-context";
import { AppShell } from "@/components/app-shell";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user && !user.profile.height_cm) {
      router.replace("/onboarding");
    }
  }, [loading, user, router]);

  return <AppShell>{children}</AppShell>;
}
