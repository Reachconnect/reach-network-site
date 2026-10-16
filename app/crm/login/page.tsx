"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function CrmLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (authError || !data.user) {
      setBusy(false);
      return setError("That email or password isn't right.");
    }
    const { data: staff } = await supabase.from("agency_users").select("id").eq("user_id", data.user.id).maybeSingle();
    if (!staff) {
      await supabase.auth.signOut();
      setBusy(false);
      return setError("This account doesn't have access to the CRM.");
    }
    router.push("/crm");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#1F3447] p-4">
      <form onSubmit={signIn} className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F7931E] font-bold text-white">R</span>
          <span className="text-xl font-bold text-[#1F3447]">
            Reach <span className="font-medium text-slate-500">CRM</span>
          </span>
        </div>
        <p className="mt-2 text-sm text-slate-500">Sign in with your ReachConnect account.</p>

        <label className="mt-6 block text-sm font-semibold text-slate-700">
          Email
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:border-[#F7931E] focus:outline-none focus:ring-2 focus:ring-[#F7931E]/30"
          />
        </label>
        <label className="mt-4 block text-sm font-semibold text-slate-700">
          Password
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:border-[#F7931E] focus:outline-none focus:ring-2 focus:ring-[#F7931E]/30"
          />
        </label>

        {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <button type="submit" disabled={busy} className="mt-6 w-full rounded-lg bg-[#F7931E] py-3 font-semibold text-white hover:brightness-95 disabled:opacity-50">
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}