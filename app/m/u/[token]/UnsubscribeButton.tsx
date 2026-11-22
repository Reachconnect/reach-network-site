"use client";

import { useState } from "react";

export default function UnsubscribeButton({ token, email, already }: { token: string; email: string; already: boolean }) {
  const [done, setDone] = useState(already);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function go() {
    setBusy(true);
    const res = await fetch(`/api/m/u/${token}`, { method: "POST" }).catch(() => null);
    if (res?.ok) setDone(true);
    else setError("Something went wrong. Reply to the email and we'll take you off our list.");
    setBusy(false);
  }

  if (done) return <p className="mt-3 text-slate-600">You&apos;re unsubscribed. We won&apos;t send marketing emails to {email} again.</p>;
  return (
    <>
      <p className="mt-3 text-slate-600">Stop marketing emails from Reach Network Recruitment to {email}?</p>
      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
      <button onClick={go} disabled={busy} className="mt-6 rounded-lg bg-[#F7931E] px-5 py-3 font-semibold text-white disabled:opacity-50">
        {busy ? "One moment…" : "Unsubscribe me"}
      </button>
    </>
  );
}
