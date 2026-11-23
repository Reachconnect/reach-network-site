"use client";

// Refer a friend form
import { useState } from "react";

export default function ReferForm() {
  const [f, setF] = useState({ yourName: "", yourPhone: "", yourEmail: "", friendName: "", friendPhone: "", friendEmail: "", work: "", notes: "", website: "" });
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF((p) => ({ ...p, [k]: e.target.value }));
  const input = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-navy focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange/20";
  const WORK = ["Driving", "Warehouse", "FLT", "Production", "Engineering", "Not sure"];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError(null);
    try {
      const res = await fetch("/api/refer", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...f, consent }) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Something went wrong.");
      setStatus("done");
    } catch (err) {
      setError((err as Error).message);
      setStatus("idle");
    }
  }

  if (status === "done") {
    return (
      <div className="rounded-3xl bg-white p-10 text-center shadow-2xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl text-green-700">✓</div>
        <p className="mt-4 font-display text-2xl font-extrabold text-navy">Thanks, {f.yourName.split(" ")[0]}!</p>
        <p className="mt-2 text-slate-600">We&apos;ll give {f.friendName.split(" ")[0]} a call soon and keep you posted.</p>
        <button
          onClick={() => {
            setF((p) => ({ ...p, friendName: "", friendPhone: "", friendEmail: "", work: "", notes: "" }));
            setConsent(false);
            setStatus("idle");
          }}
          className="mt-6 rounded-full border border-slate-300 px-6 py-3 font-bold text-navy"
        >
          Refer someone else
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-6 rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
      <input className="hidden" tabIndex={-1} autoComplete="off" value={f.website} onChange={set("website")} aria-hidden="true" />
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-orange">1. About you</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <input className={input} placeholder="Your name" value={f.yourName} onChange={set("yourName")} autoComplete="name" required />
          <input className={input} type="tel" placeholder="Your phone" value={f.yourPhone} onChange={set("yourPhone")} autoComplete="tel" required />
        </div>
        <input className={`${input} mt-3`} type="email" placeholder="Your email (optional)" value={f.yourEmail} onChange={set("yourEmail")} autoComplete="email" />
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-orange">2. Your friend</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <input className={input} placeholder="Their name" value={f.friendName} onChange={set("friendName")} required />
          <input className={input} type="tel" placeholder="Their phone" value={f.friendPhone} onChange={set("friendPhone")} required />
        </div>
        <input className={`${input} mt-3`} type="email" placeholder="Their email (optional)" value={f.friendEmail} onChange={set("friendEmail")} />
        <p className="mt-4 text-sm font-semibold text-navy">What kind of work?</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {WORK.map((w) => (
            <button type="button" key={w} onClick={() => setF((p) => ({ ...p, work: w }))} className={`rounded-full border px-3.5 py-2 text-sm font-semibold transition ${f.work === w ? "border-orange bg-orange/10 text-navy" : "border-slate-200 text-slate-600"}`}>
              {w}
            </button>
          ))}
        </div>
        <textarea className={`${input} mt-3`} rows={2} placeholder="Anything useful? Licences, experience, where they live (optional)" value={f.notes} onChange={set("notes")} />
      </div>
      <label className="flex items-start gap-3 text-sm text-slate-600">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-4 w-4 accent-orange" />
        My friend knows I&apos;m passing on their details and is happy for Reach to contact them about work.
      </label>
      {error && <p className="rounded-lg bg-red-50 p-2.5 text-sm text-red-700">{error}</p>}
      <button disabled={!consent || status === "sending"} className="w-full rounded-full bg-orange px-5 py-3.5 font-bold text-white shadow-lg shadow-orange/30 transition hover:bg-orange-dark disabled:opacity-40">
        {status === "sending" ? "Sending…" : "Refer my friend"}
      </button>
    </form>
  );
}
