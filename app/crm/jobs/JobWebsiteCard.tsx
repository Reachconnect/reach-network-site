"use client";

// Put a job on reachnetworkrec.com: write the advert (or let the AI), then publish
import { useState } from "react";
import { supabase } from "@/lib/supabase";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

const field = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#F7931E] focus:outline-none";
const label = "mb-1 block text-xs font-semibold text-slate-500";

async function call(body: object) {
  const { data } = await supabase.auth.getSession();
  const res = await fetch("/api/crm/jobs/website", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session?.access_token ?? ""}` },
    body: JSON.stringify(body),
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(j.error || "Something went wrong.");
  return j;
}

export default function JobWebsiteCard({ job, onChange }: { job: Any; onChange?: () => void }) {
  const [open, setOpen] = useState(false);
  const [published, setPublished] = useState(!!job.published);
  const [slug, setSlug] = useState<string | null>(job.slug || null);
  const [f, setF] = useState({
    web_title: job.web_title || job.title || "",
    job_type: job.job_type || "permanent",
    pay_text: job.pay_text || "",
    hours: job.hours || "",
    start_text: job.start_text || "",
    summary: job.summary || "",
    duties: job.duties || "",
    requirements: job.requirements || "",
    benefits: job.benefits || "",
    show_company: !!job.show_company,
    closing_date: job.closing_date || "",
  });
  const [extra, setExtra] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF((p) => ({ ...p, [k]: e.target.value }));
  const url = slug ? `${typeof window !== "undefined" ? window.location.origin : "https://reachnetworkrec.com"}/jobs/${slug}` : null;

  async function write() {
    setBusy("write");
    setError(null);
    try {
      const { advert } = await call({ action: "write", jobId: job.id, extra });
      setF((p) => ({ ...p, ...Object.fromEntries(Object.entries(advert).filter(([, v]) => v)) }));
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(null);
  }

  async function save(pub: boolean) {
    setBusy(pub ? "publish" : "save");
    setError(null);
    try {
      const j = await call({ action: "save", jobId: job.id, ...f, published: pub });
      setPublished(pub);
      if (j.url) setSlug(j.url.split("/jobs/")[1]);
      if (pub) setOpen(false);
      onChange?.();
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(null);
  }

  const live = published && job.status === "open";

  return (
    <div className="mt-4 rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-[#1F3447]">On the website</h2>
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${live ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
            {live ? "Live" : published ? "Hidden while not open" : "Not advertised"}
          </span>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          {live && url && (
            <>
              <a href={url} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-slate-300 px-3 py-1.5 font-semibold text-[#1F3447]">
                View
              </a>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(url);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-slate-600"
              >
                {copied ? "Copied" : "Copy link"}
              </button>
              <a href={`https://wa.me/?text=${encodeURIComponent(`${f.web_title}: ${url}`)}`} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-slate-300 px-3 py-1.5 text-slate-600">
                WhatsApp
              </a>
            </>
          )}
          <button onClick={() => setOpen(!open)} className="rounded-lg bg-[#F7931E] px-3 py-1.5 font-semibold text-white">
            {open ? "Close" : published ? "Edit advert" : "Advertise this job"}
          </button>
        </div>
      </div>
      {!open && <p className="mt-1 text-xs text-slate-500">{live ? "Applications go straight onto this job's shortlist, and you get an email for each one." : "Put it on reachnetworkrec.com with a full job spec and map. It comes down by itself when the job is filled or closed."}</p>}

      {open && (
        <div className="mt-4 space-y-3">
          {error && <p className="rounded-lg bg-red-50 p-2.5 text-sm text-red-700">{error}</p>}
          <div className="rounded-xl bg-orange-50 p-3">
            <p className="text-sm font-semibold text-[#9a5200]">Let the AI write it</p>
            <p className="text-xs text-[#9a5200]/80">It uses the job details above. Add anything else it should know (shifts, benefits, licences needed), then press the button.</p>
            <textarea className={`${field} mt-2 bg-white`} rows={2} value={extra} onChange={(e) => setExtra(e.target.value)} placeholder="e.g. Nights 10pm to 6am, Sunday to Thursday. Overtime at time and a half. Needs CPC and tacho card." />
            <button onClick={write} disabled={!!busy} className="mt-2 rounded-lg bg-[#F7931E] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
              {busy === "write" ? "Writing…" : "Write it for me"}
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={label}>Title on the website</label>
              <input className={field} value={f.web_title} onChange={set("web_title")} />
            </div>
            <div>
              <label className={label}>Job type</label>
              <select className={field} value={f.job_type} onChange={set("job_type")}>
                <option value="permanent">Permanent</option>
                <option value="temporary">Temporary</option>
                <option value="temp_to_perm">Temp to perm</option>
                <option value="contract">Contract</option>
              </select>
            </div>
            <div>
              <label className={label}>Pay (as shown)</label>
              <input className={field} value={f.pay_text} onChange={set("pay_text")} placeholder="e.g. £17 an hour, or £38,000 to £42,000" />
            </div>
            <div>
              <label className={label}>Hours or shifts</label>
              <input className={field} value={f.hours} onChange={set("hours")} placeholder="e.g. Monday to Friday, 7am to 4pm" />
            </div>
            <div>
              <label className={label}>Start</label>
              <input className={field} value={f.start_text} onChange={set("start_text")} placeholder="e.g. Immediate, or January" />
            </div>
          </div>
          <div>
            <label className={label}>Summary (2 or 3 sentences)</label>
            <textarea className={field} rows={3} value={f.summary} onChange={set("summary")} />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className={label}>What you&apos;ll do (one per line)</label>
              <textarea className={field} rows={6} value={f.duties} onChange={set("duties")} />
            </div>
            <div>
              <label className={label}>What you&apos;ll need (one per line)</label>
              <textarea className={field} rows={6} value={f.requirements} onChange={set("requirements")} />
            </div>
            <div>
              <label className={label}>What you get (one per line)</label>
              <textarea className={field} rows={6} value={f.benefits} onChange={set("benefits")} />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className={label}>Closing date (optional)</label>
              <input type="date" className={field} value={f.closing_date} onChange={set("closing_date")} />
            </div>
            <label className="flex items-center gap-2 self-end pb-2 text-sm text-slate-700">
              <input type="checkbox" checked={f.show_company} onChange={(e) => setF((p) => ({ ...p, show_company: e.target.checked }))} />
              Show the client&apos;s name ({job.crm_companies?.name || "client"})
            </label>
          </div>
          <p className="text-xs text-slate-400">The map shows the area round the job&apos;s postcode (e.g. B12), not the exact site. Leave the client&apos;s name off unless they&apos;re happy to be named.</p>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => save(true)} disabled={!!busy} className="rounded-lg bg-[#F7931E] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
              {busy === "publish" ? "Publishing…" : published ? "Save and keep live" : "Publish on the website"}
            </button>
            <button onClick={() => save(false)} disabled={!!busy} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-600 disabled:opacity-50">
              {published ? "Take it off the website" : "Save without publishing"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
