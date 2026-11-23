"use client";

// Details form: the guide is only sent once these are filled in
import { useState } from "react";

const ROLES = ["Drivers", "Warehouse", "FLT", "Production", "Engineering"];

export default function GuideForm() {
  const [f, setF] = useState({ name: "", company: "", jobTitle: "", email: "", phone: "", sites: "", website: "" });
  const [roles, setRoles] = useState<string[]>([]);
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF((p) => ({ ...p, [k]: e.target.value }));
  const input = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-navy focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange/20";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError(null);
    try {
      const res = await fetch("/api/salary-guide", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...f, roles: roles.join(", ") }) });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Something went wrong.");
      }
      const blob = await res.blob();
      const link = URL.createObjectURL(blob);
      setUrl(link);
      const a = document.createElement("a");
      a.href = link;
      a.download = "Reach Midlands pay rates 2026-27.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setStatus("done");
    } catch (err) {
      setError(`${(err as Error).message} You can also call us on 0121 630 1643.`);
      setStatus("idle");
    }
  }

  if (status === "done") {
    return (
      <div className="rounded-3xl bg-white p-8 text-center shadow-2xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl text-green-700">✓</div>
        <p className="mt-4 font-display text-2xl font-extrabold text-navy">Your guide is ready</p>
        <p className="mt-2 text-slate-600">It should be downloading now, and we&apos;ve emailed a copy to {f.email}.</p>
        {url && (
          <a href={url} download="Reach Midlands pay rates 2026-27.pdf" className="mt-5 inline-block rounded-full bg-orange px-6 py-3 font-bold text-white hover:bg-orange-dark">
            Download again
          </a>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
      <p className="font-display text-2xl font-extrabold text-navy">Get the free guide</p>
      <p className="text-sm text-slate-500">Fill in your details and it downloads straight away. We&apos;ll email you a copy too.</p>
      <input className="hidden" tabIndex={-1} autoComplete="off" value={f.website} onChange={set("website")} aria-hidden="true" />
      <div className="grid gap-3 sm:grid-cols-2">
        <input className={input} placeholder="Full name" value={f.name} onChange={set("name")} autoComplete="name" required />
        <input className={input} placeholder="Job title" value={f.jobTitle} onChange={set("jobTitle")} autoComplete="organization-title" />
      </div>
      <input className={input} placeholder="Company" value={f.company} onChange={set("company")} autoComplete="organization" required />
      <div className="grid gap-3 sm:grid-cols-2">
        <input className={input} type="email" placeholder="Work email" value={f.email} onChange={set("email")} autoComplete="email" required />
        <input className={input} type="tel" placeholder="Phone" value={f.phone} onChange={set("phone")} autoComplete="tel" required />
      </div>
      <input className={input} placeholder="Site town or postcode (optional)" value={f.sites} onChange={set("sites")} />
      <div>
        <p className="text-sm font-semibold text-navy">Roles you hire for (optional)</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {ROLES.map((r) => (
            <button type="button" key={r} onClick={() => setRoles((p) => (p.includes(r) ? p.filter((x) => x !== r) : [...p, r]))} className={`rounded-full border px-3.5 py-2 text-sm font-semibold transition ${roles.includes(r) ? "border-orange bg-orange/10 text-navy" : "border-slate-200 text-slate-600"}`}>
              {roles.includes(r) ? "✓ " : ""}
              {r}
            </button>
          ))}
        </div>
      </div>
      {error && <p className="rounded-lg bg-red-50 p-2.5 text-sm text-red-700">{error}</p>}
      <button disabled={status === "sending"} className="w-full rounded-full bg-orange px-5 py-3.5 font-bold text-white shadow-lg shadow-orange/30 transition hover:bg-orange-dark disabled:opacity-50">
        {status === "sending" ? "Preparing your guide…" : "Download the guide"}
      </button>
      <p className="text-center text-xs text-slate-400">
        We&apos;ll use your details to send the guide and follow up about recruitment. You can opt out any time. See our <a href="/privacy-notice" className="underline">privacy notice</a>.
      </p>
    </form>
  );
}
