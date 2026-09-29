"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { fetchMe, homeFor } from "@/lib/useRewardsUser";
import RewardsHeader from "@/app/components/rewards/RewardsHeader";

export default function SetPasswordPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"checking" | "ready" | "bad-link">("checking");
  const [linkError, setLinkError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const hashError = hash.get("error_description");
    if (hashError) {
      setLinkError(hashError.replace(/\+/g, " "));
      setStatus("bad-link");
      return;
    }

    let done = false;
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session && !done) {
        done = true;
        setStatus("ready");
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session && !done) {
        done = true;
        setStatus("ready");
      }
    });

    const timer = setTimeout(() => {
      if (!done) setStatus("bad-link");
    }, 4000);

    return () => {
      sub.subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) return setError("Use at least 8 characters.");
    if (password !== confirm) return setError("The two passwords don't match.");

    setBusy(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setBusy(false);
      return setError(updateError.message);
    }

    const me = await fetchMe();
    if (me?.hasAccess) {
      router.replace(homeFor(me));
    } else {
      setBusy(false);
      setError("Password saved, but this account doesn't have Reach Rewards access yet. Ask your employer to check.");
    }
  }

  const input =
    "w-full rounded-lg border border-slate-300 px-4 py-3 focus:border-[#F7931E] focus:outline-none focus:ring-2 focus:ring-[#F7931E]/30";

  return (
    <div className="min-h-screen bg-slate-50">
      <RewardsHeader me={null} />
      <main className="mx-auto max-w-md px-4 py-12">
        <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          {status === "checking" && <p className="text-sm text-slate-500">Checking your link…</p>}

          {status === "bad-link" && (
            <>
              <h1 className="text-2xl font-bold text-[#0F2438]">This link has expired</h1>
              <p className="mt-3 text-slate-600">
                {linkError ? `${linkError}. ` : ""}Links only work once and expire after 24 hours. Ask your company
                admin to resend your invite, or reset your password from the log-in page.
              </p>
              <Link
                href="/rewards/login"
                className="mt-6 inline-block rounded-lg bg-[#F7931E] px-5 py-3 font-semibold text-white hover:bg-[#e2841a]"
              >
                Go to log in
              </Link>
            </>
          )}

          {status === "ready" && (
            <>
              <h1 className="text-2xl font-bold text-[#0F2438]">Set your password</h1>
              <p className="mt-2 text-sm text-slate-600">You&apos;ll use this with your email to log in.</p>
              <form onSubmit={save} className="mt-6 space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="pw">
                    New password
                  </label>
                  <input
                    id="pw"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={input}
                  />
                  <p className="mt-1 text-xs text-slate-500">At least 8 characters.</p>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="pw2">
                    Type it again
                  </label>
                  <input
                    id="pw2"
                    type="password"
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className={input}
                  />
                </div>
                {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
                <button
                  type="submit"
                  disabled={busy}
                  className="w-full rounded-lg bg-[#F7931E] py-3 font-semibold text-white hover:bg-[#e2841a] disabled:opacity-60"
                >
                  {busy ? "Saving…" : "Save password"}
                </button>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  );
}