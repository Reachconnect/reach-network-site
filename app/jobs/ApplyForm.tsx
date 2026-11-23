"use client";

// Apply for a job (or just send a CV). Goes straight into the CRM; CVs are kept private.
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ApplyForm({ jobKey, jobTitle, compact = false }: { jobKey: string | null; jobTitle: string | null; compact?: boolean }) {
  const [f, setF] = useState({ name: "", email: "", phone: "", message: "", website: "" });
  const [cv, setCv] = useState<File | null>(null);
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF((p) => ({ ...p, [k]: e.target.value }));

  async function post(body: object) {
    const res = await fetch("/api/jobs/apply", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(j.error || "Something went wrong. Please try again.");
    return j;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStatus("sending");
    try {
      let cv_path: string | null = null;
      if (cv) {
        const up = await post({ action: "upload", filename: cv.name, size: cv.size });
        const { error: upErr } = await supabase.storage.from("crm-cvs").uploadToSignedUrl(up.path, up.token, cv, { contentType: cv.type || undefined });
        if (upErr) throw new Error("Your CV didn't upload. Please try again, or apply without it.");
        cv_path = up.path;
      }
      await post({ action: "apply", job: jobKey, ...f, cv_path, cv_name: cv?.name || null, consent });
      setStatus("done");
    } catch (err) {
      setError((err as Error).message);
      setStatus("idle");
    }
  }

  if (status === "done") {
    return (
      <div className="rounded-2xl bg-green-50 p-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-2xl text-green-700">✓</div>
        <p className="mt-3 font-display text-lg font-bold text-navy">Thanks, {f.name.split(" ")[0]}!</p>
        <p className="mt-1 text-sm text-slate-600">{jobTitle ? `We've got your application for ${jobTitle}.` : "We've got your details."} Darren or the team will be in touch soon, usually within one working day.</p>
      </div>
    );
  }

  const input = "w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange/20";
  return (
    <form onSubmit={submit} className="space-y-3">
      {!compact && <p className="font-display text-lg font-bold text-navy">{jobTitle ? "Apply for this job" : "Send us your CV"}</p>}
      <input className={input} placeholder="Full name" value={f.name} onChange={set("name")} required autoComplete="name" />
      <input className={input} type="email" placeholder="Email" value={f.email} onChange={set("email")} required autoComplete="email" />
      <input className={input} type="tel" placeholder="Mobile number" value={f.phone} onChange={set("phone")} autoComplete="tel" />
      <label className="flex cursor-pointer items-center justify-between gap-2 rounded-lg border-2 border-dashed border-slate-300 px-3 py-3 text-sm hover:border-orange">
        <span className={cv ? "font-semibold text-navy" : "text-slate-500"}>{cv ? `📎 ${cv.name}` : "Attach your CV (PDF or Word, optional)"}</span>
        <span className="text-xs font-semibold text-orange">{cv ? "Change" : "Choose"}</span>
        <input type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="hidden" onChange={(e) => setCv(e.target.files?.[0] || null)} />
      </label>
      <textarea className={input} rows={compact ? 2 : 3} placeholder="Anything we should know? (optional) e.g. licences, availability" value={f.message} onChange={set("message")} />
      <input tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" value={f.website} onChange={set("website")} />
      <label className="flex items-start gap-2 text-xs text-slate-600">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-4 w-4 flex-none accent-[#F7931E]" />
        <span>
          I&apos;m happy for Reach Network Recruitment to keep my details and contact me about this and other jobs. See our{" "}
          <a href="/privacy-notice" className="underline" target="_blank">
            privacy notice
          </a>
          .
        </span>
      </label>
      {error && <p className="rounded-lg bg-red-50 p-2.5 text-sm text-red-700">{error}</p>}
      <button type="submit" disabled={status === "sending" || !consent} className="w-full rounded-full bg-orange px-5 py-3 text-sm font-bold text-white transition hover:bg-orange-dark disabled:opacity-50">
        {status === "sending" ? "Sending…" : jobTitle ? "Apply now" : "Send my details"}
      </button>
      <p className="text-center text-xs text-slate-400">Prefer to talk? Call 0121 630 1643</p>
    </form>
  );
}
