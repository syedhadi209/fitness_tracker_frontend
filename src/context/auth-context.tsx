"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { api, clearTokens, hasTokens, setTokens } from "@/lib/api";
import type { User } from "@/lib/types";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (email: string, password: string, firstName?: string) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<User | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function refreshUser() {
    if (!hasTokens()) {
      setUser(null);
      return null;
    }
    try {
      const me = await api.me();
      setUser(me);
      return me;
    } catch {
      clearTokens();
      setUser(null);
      return null;
    }
  }

  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      async login(email, password) {
        const tokens = await api.login(email, password);
        setTokens(tokens);
        const me = await api.me();
        setUser(me);
        return me;
      },
      async register(email, password, firstName) {
        await api.register({ email, password, first_name: firstName });
        const tokens = await api.login(email, password);
        setTokens(tokens);
        const me = await api.me();
        setUser(me);
        return me;
      },
      logout() {
        clearTokens();
        setUser(null);
      },
      refreshUser,
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
