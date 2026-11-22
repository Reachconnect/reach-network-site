"use client";

import { useEffect, useRef, useState } from "react";
import type { SpecContent } from "@/lib/specs";
import IntroVideo from "./IntroVideo";

type Props = {
  token: string;
  preview: boolean;
  companyName: string;
  contactName: string | null;
  roleTitle: string | null;
  introducedOn: string;
  alreadyResponded: string | null;
  videoUrl?: string | null;
  content: SpecContent;
};

const NAVY = "#0F2438";
const ORANGE = "#F7931E";

async function send(token: string, body: object) {
  const res = await fetch(`/api/spec/${token}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    keepalive: true,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || "Something went wrong. Please try again.");
  return json;
}

function Tick() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5 flex-none" aria-hidden>
      <circle cx="10" cy="10" r="10" fill="#16A34A" />
      <path d="M5.5 10.5l3 3 6-6.5" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function SpecClient(p: Props) {
  const c = p.content;
  const [mode, setMode] = useState<null | "interested" | "not_hiring">(null);
  const [done, setDone] = useState<null | "interested" | "not_hiring">(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: p.contactName || "", phone: "", email: "", best_time: "Any time", message: "" });
  const [notHiring, setNotHiring] = useState({ retry_months: "3", reason: "" });
  const opened = useRef(false);

  // Let us know they opened it, and roughly how long they spent reading
  useEffect(() => {
    if (p.preview || opened.current) return;
    opened.current = true;
    send(p.token, { event: "open" }).catch(() => {});
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") send(p.token, { event: "ping" }).catch(() => {});
    }, 15000);
    const stop = setTimeout(() => clearInterval(timer), 20 * 60 * 1000);
    return () => {
      clearInterval(timer);
      clearTimeout(stop);
    };
  }, [p.preview, p.token]);

  async function submit(event: "interested" | "not_hiring") {
    if (p.preview) {
      setDone(event);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await send(p.token, event === "interested" ? { event, ...form } : { event, ...notHiring });
      setDone(event);
      setMode(null);
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(false);
  }

  const date = new Date(p.introducedOn).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const input = "w-full rounded-lg border border-slate-300 px-3 py-2.5 text-[15px] focus:border-[#F7931E] focus:outline-none";

  const facts = [
    c.area && ["Area", c.area],
    c.availability && ["Available", c.availability],
    c.job_type && ["Looking for", c.job_type],
    c.salary && ["Expecting", c.salary],
  ].filter(Boolean) as [string, string][];

  return (
    <main className="min-h-screen bg-slate-100 pb-16">
      {p.preview && (
        <div className="bg-amber-100 px-4 py-2 text-center text-sm font-medium text-amber-900">
          Preview: this is what {p.companyName} will see. Nothing you do here is recorded.
        </div>
      )}

      {/* Header */}
      <header style={{ background: NAVY }} className="px-5 py-5">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg text-lg font-extrabold text-white" style={{ background: ORANGE }}>
            R
          </span>
          <span className="text-lg font-bold text-white">Reach Network Recruitment</span>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4">
        {/* Intro */}
        <section className="-mt-1 rounded-b-2xl bg-white px-6 pb-6 pt-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide" style={{ color: ORANGE }}>
            Candidate profile for {p.companyName}
          </p>
          <h1 className="mt-2 text-3xl font-extrabold leading-tight" style={{ color: NAVY }}>
            {c.display_name}
          </h1>
          <p className="mt-1 text-lg text-slate-700">{c.headline}</p>
          {p.roleTitle && <p className="mt-2 text-sm text-slate-500">Put forward for: {p.roleTitle}</p>}

          {facts.length > 0 && (
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {facts.map(([k, v]) => (
                <div key={k} className="rounded-xl bg-slate-50 px-3 py-2.5">
                  <p className="text-xs text-slate-500">{k}</p>
                  <p className="text-[15px] font-semibold" style={{ color: NAVY }}>
                    {v}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {p.videoUrl && <IntroVideo url={p.videoUrl} token={p.token} preview={p.preview} about={`why we think ${c.display_name.split(" ")[0]} would suit you`} />}

        {/* Checklist and why */}
        <section className="mt-4 rounded-2xl bg-white p-6 shadow-sm">
          {c.checklist.length > 0 && (
            <ul className="space-y-2.5">
              {c.checklist.map((item) => (
                <li key={item} className="flex items-start gap-3 text-[15px] text-slate-800">
                  <Tick />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}
          {c.why && (
            <div className="mt-5 rounded-xl border-l-4 bg-orange-50 p-4" style={{ borderColor: ORANGE }}>
              <p className="text-sm font-semibold" style={{ color: NAVY }}>
                Why we think {c.display_name.split(" ")[0]} would suit you
              </p>
              <p className="mt-1.5 text-[15px] leading-relaxed text-slate-700">{c.why}</p>
            </div>
          )}
        </section>

        {/* Call to action */}
        <section className="mt-4 rounded-2xl p-6 shadow-sm" style={{ background: NAVY }}>
          {done === "interested" ? (
            <div className="text-white">
              <p className="text-xl font-bold">Thanks, we&apos;ll be in touch shortly.</p>
              <p className="mt-1 text-slate-300">We&apos;ll call to talk through {c.display_name.split(" ")[0]} and what you need.</p>
            </div>
          ) : done === "not_hiring" ? (
            <div className="text-white">
              <p className="text-xl font-bold">Thanks for letting us know.</p>
              <p className="mt-1 text-slate-300">We won&apos;t chase you before then. If anything changes, we&apos;re a call away.</p>
            </div>
          ) : mode === "interested" ? (
            <div>
              <p className="text-lg font-bold text-white">Leave your details and we&apos;ll call you</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <input className={input} placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                <input className={input} placeholder="Phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                <input className={input} placeholder="Email (optional)" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                <select className={input} value={form.best_time} onChange={(e) => setForm({ ...form, best_time: e.target.value })}>
                  <option>Any time</option>
                  <option>Morning</option>
                  <option>Lunchtime</option>
                  <option>Afternoon</option>
                </select>
                <textarea
                  className={`${input} sm:col-span-2`}
                  rows={3}
                  placeholder="Anything we should know? (optional)"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                />
              </div>
              {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
              <div className="mt-4 flex flex-wrap gap-3">
                <button disabled={busy} onClick={() => submit("interested")} className="rounded-lg px-5 py-3 font-semibold text-white disabled:opacity-50" style={{ background: ORANGE }}>
                  {busy ? "Sending…" : "Request a call"}
                </button>
                <button onClick={() => setMode(null)} className="rounded-lg px-4 py-3 text-slate-300 hover:text-white">
                  Back
                </button>
              </div>
            </div>
          ) : mode === "not_hiring" ? (
            <div>
              <p className="text-lg font-bold text-white">No problem. When should we check back?</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <select className={input} value={notHiring.retry_months} onChange={(e) => setNotHiring({ ...notHiring, retry_months: e.target.value })}>
                  <option value="1">In a month</option>
                  <option value="3">In 3 months</option>
                  <option value="6">In 6 months</option>
                  <option value="0">Please don&apos;t</option>
                </select>
                <input className={input} placeholder="Reason (optional)" value={notHiring.reason} onChange={(e) => setNotHiring({ ...notHiring, reason: e.target.value })} />
              </div>
              {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
              <div className="mt-4 flex flex-wrap gap-3">
                <button disabled={busy} onClick={() => submit("not_hiring")} className="rounded-lg bg-white px-5 py-3 font-semibold disabled:opacity-50" style={{ color: NAVY }}>
                  {busy ? "Sending…" : "Send"}
                </button>
                <button onClick={() => setMode(null)} className="rounded-lg px-4 py-3 text-slate-300 hover:text-white">
                  Back
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-xl font-bold text-white">Interested in {c.display_name.split(" ")[0]}?</p>
              <p className="mt-1 text-slate-300">One tap and we&apos;ll call you. No obligation.</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button onClick={() => setMode("interested")} className="rounded-lg px-5 py-3 font-semibold text-white" style={{ background: ORANGE }}>
                  I&apos;m interested, call me
                </button>
                <button onClick={() => setMode("not_hiring")} className="rounded-lg border border-slate-500 px-5 py-3 font-semibold text-slate-200 hover:bg-white/10">
                  Not hiring right now
                </button>
              </div>
              {p.alreadyResponded === "interested" && <p className="mt-3 text-sm text-slate-400">You&apos;ve already asked us to call. We&apos;ll be in touch.</p>}
            </div>
          )}
        </section>

        {/* Skills, qualifications, experience */}
        {(c.qualifications.length > 0 || c.highlights.length > 0) && (
          <section className="mt-4 grid gap-4 sm:grid-cols-2">
            {c.qualifications.length > 0 && (
              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <h2 className="font-bold" style={{ color: NAVY }}>
                  Licences and qualifications
                </h2>
                <ul className="mt-3 space-y-1.5 text-[15px] text-slate-700">
                  {c.qualifications.map((q) => (
                    <li key={q}>• {q}</li>
                  ))}
                </ul>
              </div>
            )}
            {c.highlights.length > 0 && (
              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <h2 className="font-bold" style={{ color: NAVY }}>
                  Skills
                </h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {c.highlights.map((s) => (
                    <span key={s} className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {c.experience.length > 0 && (
          <section className="mt-4 rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="font-bold" style={{ color: NAVY }}>
              Experience
            </h2>
            <ul className="mt-3 divide-y divide-slate-100">
              {c.experience.map((e, i) => (
                <li key={i} className="flex items-center justify-between gap-4 py-2.5 text-[15px]">
                  <span className="text-slate-800">{e.title}</span>
                  <span className="text-sm text-slate-500">{e.period}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Why Reach */}
        <section className="mt-4 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="font-bold" style={{ color: NAVY }}>
            Why work with Reach Network Recruitment
          </h2>
          {c.more_count > 0 && (
            <p className="mt-3 rounded-lg bg-orange-50 px-4 py-3 text-[15px] font-medium" style={{ color: NAVY }}>
              We have {c.more_count} more candidate{c.more_count === 1 ? "" : "s"} like {c.display_name.split(" ")[0]} in the area, ready to talk.
            </p>
          )}
          <ul className="mt-4 space-y-2.5 text-[15px] text-slate-700">
            <li className="flex gap-3">
              <Tick />
              <span>We speak to every candidate before we put them forward</span>
            </li>
            <li className="flex gap-3">
              <Tick />
              <span>One dedicated contact from first call to start date</span>
            </li>
            <li className="flex gap-3">
              <Tick />
              <span>Permanent and temporary staff, often within days</span>
            </li>
          </ul>
        </section>

        <p className="mt-6 px-2 text-center text-xs leading-relaxed text-slate-500">
          {c.display_name} was introduced to {p.companyName} by Reach Network Recruitment on {date}. Details have been anonymised to protect the
          candidate&apos;s privacy. Please contact us before engaging this candidate; our terms of business apply to any engagement that results from
          this introduction.
        </p>
      </div>
    </main>
  );
}
