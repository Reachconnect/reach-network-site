"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { fetchMe, homeFor } from "@/lib/useRewardsUser";
import RewardsHeader from "@/app/components/rewards/RewardsHeader";

export default function RewardsLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  async function logIn(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (signInError) {
      setBusy(false);
      setError("That email and password don't match. Check them and try again.");
      return;
    }

    const me = await fetchMe();
    if (!me || !me.hasAccess) {
      await supabase.auth.signOut();
      setBusy(false);
      setError(
        "This account doesn't have Reach Rewards access. If you work for one of our clients, ask your employer to add you."
      );
      return;
    }

    router.replace(homeFor(me));
  }

  async function sendReset(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/rewards/set-password`,
    });
    setBusy(false);
    if (resetError) {
      setError("Couldn't send the reset email. Check the address and try again.");
      return;
    }
    setForgotSent(true);
  }

  const input =
    "w-full rounded-lg border border-slate-300 px-4 py-3 focus:border-[#F7931E] focus:outline-none focus:ring-2 focus:ring-[#F7931E]/30";

  return (
    <div className="min-h-screen bg-slate-50">
      <RewardsHeader me={null} />
      <main className="mx-auto max-w-md px-4 py-12">
        <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          {!forgotOpen ? (
            <>
              <h1 className="text-2xl font-bold text-[#0F2438]">Log in to Reach Rewards</h1>
              <p className="mt-2 text-sm text-slate-600">Reach workers: use your ReachConnect email and password.</p>

              <form onSubmit={logIn} className="mt-6 space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="email">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={input}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="password">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={input}
                  />
                </div>

                {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full rounded-lg bg-[#F7931E] py-3 font-semibold text-white hover:bg-[#e2841a] disabled:opacity-60"
                >
                  {busy ? "Logging in…" : "Log in"}
                </button>
              </form>

              <button
                onClick={() => {
                  setForgotOpen(true);
                  setError(null);
                }}
                className="mt-4 text-sm font-medium text-[#0F2438] hover:underline"
              >
                Forgot your password?
              </button>
            </>
          ) : forgotSent ? (
            <>
              <h1 className="text-2xl font-bold text-[#0F2438]">Check your email</h1>
              <p className="mt-3 text-slate-600">
                If there&apos;s an account for {email}, we&apos;ve sent a link to set a new password.
              </p>
              <button
                onClick={() => {
                  setForgotOpen(false);
                  setForgotSent(false);
                }}
                className="mt-6 text-sm font-medium text-[#0F2438] hover:underline"
              >
                Back to log in
              </button>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-[#0F2438]">Reset your password</h1>
              <p className="mt-2 text-sm text-slate-600">We&apos;ll email you a link to set a new one.</p>
              <form onSubmit={sendReset} className="mt-6 space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="reset-email">
                    Email
                  </label>
                  <input
                    id="reset-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={input}
                  />
                </div>
                {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
                <button
                  type="submit"
                  disabled={busy}
                  className="w-full rounded-lg bg-[#F7931E] py-3 font-semibold text-white hover:bg-[#e2841a] disabled:opacity-60"
                >
                  {busy ? "Sending…" : "Send reset link"}
                </button>
              </form>
              <button
                onClick={() => setForgotOpen(false)}
                className="mt-4 text-sm font-medium text-[#0F2438] hover:underline"
              >
                Back to log in
              </button>
            </>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-slate-600">
          New to Reach Rewards?{" "}
          <Link href="/rewards" className="font-medium text-[#0F2438] hover:underline">
            See how to get access
          </Link>
        </p>
      </main>
    </div>
  );
}