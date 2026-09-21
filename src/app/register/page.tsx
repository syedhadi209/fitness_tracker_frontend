"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { RelishWordmark } from "@/components/relish-mark";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/context/auth-context";
import { errorMessage } from "@/lib/api";
import { useClientReady } from "@/lib/use-client-ready";

export default function RegisterPage() {
  const { register, user, loading } = useAuth();
  const router = useRouter();
  const ready = useClientReady();
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace("/");
  }, [loading, user, router]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await register(email, password, firstName);
      router.replace("/onboarding");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (!ready || loading) {
    return <main className="min-h-screen bg-cream" />;
  }

  return (
    <main className="relative mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <div className="absolute right-6 top-6">
        <ThemeToggle compact />
      </div>
      <RelishWordmark size={48} />
      <h1 className="mt-4 font-serif text-3xl leading-tight">Start tracking in a minute.</h1>
      <form onSubmit={onSubmit} className="mt-10 space-y-4">
        <label className="block text-sm font-medium text-ink">
          First name
          <input
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            placeholder="Alex"
            className="field mt-1.5"
          />
        </label>
        <label className="block text-sm font-medium text-ink">
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className="field mt-1.5"
          />
        </label>
        <label className="block text-sm font-medium text-ink">
          Password
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="8+ characters"
            className="field mt-1.5"
          />
        </label>
        {error ? <p className="text-sm text-ember">{error}</p> : null}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-2xl bg-night py-3 font-semibold text-lime disabled:opacity-50"
        >
          {busy ? "Creating..." : "Create account"}
        </button>
      </form>
      <p className="mt-6 text-sm text-muted">
        Already have one?{" "}
        <Link href="/login" className="font-medium text-moss">
          Sign in
        </Link>
      </p>
    </main>
  );
}
