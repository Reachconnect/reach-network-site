"use client";

// Free AI CV builder: details in, polished CV out, free PDF download
import { useEffect, useState } from "react";
import Link from "next/link";
import SiteHeader from "../components/SiteHeader";
import Footer from "../components/Footer";
import { TICKETS, type Cv, type CvInput } from "@/lib/cvBuilderShared";

type Job = { title: string; employer: string; location: string; start: string; end: string; current: boolean; notes: string };
type Edu = { qualification: string; place: string; year: string };

const SECTORS = ["Driving", "Warehouse", "Manufacturing", "Engineering", "Other"];
const STEPS = ["About you", "Your jobs", "Licences and training", "Finishing touches"];
const STORE = "rnr_cv_builder_v1";
const emptyJob = (): Job => ({ title: "", employer: "", location: "", start: "", end: "", current: false, notes: "" });

const monthLabel = (v: string) => {
  if (!/^\d{4}-\d{2}$/.test(v)) return v;
  const [y, m] = v.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-GB", { month: "short", year: "numeric" });
};

const input = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-navy placeholder:text-slate-400 focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange/20";
const label = "mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500";

function CvPreview({ cv }: { cv: Cv }) {
  const Section = ({ t, children }: { t: string; children: React.ReactNode }) => (
    <div className="mt-5">
      <p className="border-b border-slate-200 pb-1 text-[10px] font-bold uppercase tracking-widest text-orange">{t}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
  const Bullets = ({ items, cols = 1 }: { items: string[]; cols?: number }) => (
    <ul className={`grid gap-x-6 gap-y-1 ${cols === 2 ? "sm:grid-cols-2" : ""}`}>
      {items.filter(Boolean).map((x, n) => (
        <li key={n} className="flex gap-2 text-[13px] leading-snug text-navy">
          <span className="mt-[7px] h-1 w-1 flex-none rounded-full bg-orange" />
          {x}
        </li>
      ))}
    </ul>
  );
  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-black/5">
      <div className="h-1.5 bg-orange" />
      <div className="p-6 sm:p-8">
        <p className="font-display text-3xl font-extrabold text-navy">{cv.name}</p>
        {cv.headline && <p className="mt-1 font-bold text-orange">{cv.headline}</p>}
        <p className="mt-1 text-xs text-slate-500">{[cv.town, cv.phone, cv.email].filter(Boolean).join("  |  ")}</p>
        {cv.summary && (
          <Section t="Profile">
            <p className="text-[13px] leading-relaxed text-navy">{cv.summary}</p>
          </Section>
        )}
        {cv.experience.length > 0 && (
          <Section t="Work experience">
            <div className="space-y-4">
              {cv.experience.map((j, n) => (
                <div key={n}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-bold text-navy">{j.title}</p>
                    <p className="text-xs text-slate-500">{j.dates}</p>
                  </div>
                  <p className="text-xs italic text-slate-500">{[j.employer, j.location].filter(Boolean).join(", ")}</p>
                  <div className="mt-1.5">
                    <Bullets items={j.bullets} />
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}
        {cv.qualifications.length > 0 && (
          <Section t="Licences, tickets and qualifications">
            <Bullets items={cv.qualifications} cols={2} />
          </Section>
        )}
        {cv.skills.length > 0 && (
          <Section t="Key skills">
            <Bullets items={cv.skills} cols={2} />
          </Section>
        )}
        {cv.education.length > 0 && (
          <Section t="Education">
            <Bullets items={cv.education} />
          </Section>
        )}
        {cv.extras.length > 0 && (
          <Section t="Additional information">
            <Bullets items={cv.extras} />
          </Section>
        )}
      </div>
    </div>
  );
}

export default function CvBuilderClient() {
  const [step, setStep] = useState(0);
  const [me, setMe] = useState({ name: "", email: "", phone: "", town: "", postcode: "", target: "", sector: "", about: "", extras: "" });
  const [jobs, setJobs] = useState<Job[]>([emptyJob()]);
  const [tickets, setTickets] = useState<string[]>([]);
  const [customTicket, setCustomTicket] = useState("");
  const [edu, setEdu] = useState<Edu[]>([]);
  const [cv, setCv] = useState<Cv | null>(null);
  const [status, setStatus] = useState<"idle" | "writing" | "downloading" | "downloaded">("idle");
  const [error, setError] = useState<string | null>(null);
  const [website, setWebsite] = useState("");
  const [loaded, setLoaded] = useState(false);

  // Keep their progress on this device, so nothing is lost if they close the page
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE);
      if (raw) {
        const d = JSON.parse(raw);
        if (d.me) setMe((p) => ({ ...p, ...d.me }));
        if (Array.isArray(d.jobs) && d.jobs.length) setJobs(d.jobs);
        if (Array.isArray(d.tickets)) setTickets(d.tickets);
        if (Array.isArray(d.edu)) setEdu(d.edu);
        if (d.cv) setCv(d.cv);
      }
    } catch {}
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORE, JSON.stringify({ me, jobs, tickets, edu, cv }));
    } catch {}
  }, [loaded, me, jobs, tickets, edu, cv]);

  const setM = (k: keyof typeof me) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setMe((p) => ({ ...p, [k]: e.target.value }));
  const setJob = (n: number, patch: Partial<Job>) => setJobs((p) => p.map((j, i) => (i === n ? { ...j, ...patch } : j)));

  const payload = (): CvInput => ({
    name: me.name,
    email: me.email,
    phone: me.phone,
    town: me.town,
    postcode: me.postcode,
    target: me.target,
    sector: me.sector,
    about: me.about,
    extras: me.extras,
    jobs: jobs.filter((j) => j.title || j.employer).map((j) => ({ title: j.title, employer: j.employer, location: j.location, start: monthLabel(j.start), end: j.current ? "Present" : monthLabel(j.end), current: j.current, notes: j.notes })),
    tickets,
    education: edu.filter((e) => e.qualification),
  });

  const stepOk = [
    !!(me.name.trim() && /\S+@\S+\.\S+/.test(me.email) && me.phone.trim() && me.town.trim() && me.target.trim()),
    jobs.some((j) => j.title && j.employer && j.start && (j.current || j.end)) || jobs.every((j) => !j.title && !j.employer),
    true,
    true,
  ];

  async function generate() {
    setStatus("writing");
    setError(null);
    try {
      const res = await fetch("/api/cv-builder", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "generate", input: payload(), website }) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Something went wrong.");
      setCv(j.cv);
      setStatus("idle");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setError((e as Error).message);
      setStatus("idle");
    }
  }

  async function download() {
    if (!cv) return;
    setStatus("downloading");
    setError(null);
    try {
      const res = await fetch("/api/cv-builder", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "download", input: payload(), cv }) });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Something went wrong.");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${cv.name || "My"} CV.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
      setStatus("downloaded");
    } catch (e) {
      setError((e as Error).message);
      setStatus("idle");
    }
  }

  const lines = (v: string) => v.split("\n").map((x) => x.trim()).filter(Boolean);
  const chip = (on: boolean) => `rounded-full border px-3.5 py-2 text-sm font-semibold transition ${on ? "border-orange bg-orange/10 text-navy" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`;

  return (
    <main className="overflow-x-hidden font-body">
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}@keyframes write{0%{width:0}100%{width:100%}}`}</style>
      <SiteHeader />

      {/* HERO */}
      <section className="relative overflow-hidden bg-navy pb-24 pt-12">
        <div className="pointer-events-none absolute -right-40 -top-40 h-[480px] w-[480px] rounded-full bg-orange/20 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <nav className="text-sm text-white/60">
            <Link href="/" className="hover:text-white">Home</Link> <span className="mx-1">›</span> <span className="text-white/90">Free CV builder</span>
          </nav>
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.3em] text-orange">Free CV builder</p>
          <h1 className="mt-3 max-w-3xl font-display text-4xl font-extrabold leading-tight text-white sm:text-5xl">
            A professional CV in <span className="text-orange">5 minutes.</span> Free.
          </h1>
          <p className="mt-4 max-w-xl text-lg text-white/80">Tell us the basics: where you&apos;ve worked, when, and your licences and tickets. We&apos;ll write the rest, and you download it free.</p>
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/75">
            {["100% free", "No sign-up", "Download as PDF", "Works on your phone"].map((x) => (
              <span key={x} className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange text-[10px] font-bold text-white">✓</span>
                {x}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="relative -mt-14 bg-transparent pb-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          {status === "writing" ? (
            <div className="mx-auto max-w-xl rounded-3xl bg-white p-10 text-center shadow-2xl">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange/10 text-3xl">✍️</div>
              <p className="mt-4 font-display text-2xl font-extrabold text-navy">Writing your CV…</p>
              <p className="mt-2 text-slate-600">This usually takes 10 to 20 seconds.</p>
              <div className="mx-auto mt-6 h-2 max-w-xs overflow-hidden rounded-full bg-slate-100">
                <div className="h-full animate-[write_18s_ease-out_forwards] rounded-full bg-orange" />
              </div>
            </div>
          ) : cv ? (
            /* ---------- EDIT AND DOWNLOAD ---------- */
            <div className="grid gap-6 lg:grid-cols-[440px_1fr]">
              <div className="space-y-4 rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-black/5 lg:max-h-[calc(100vh-120px)] lg:overflow-y-auto">
                <div className="rounded-2xl bg-orange/10 p-4 text-sm text-navy">
                  <p className="font-bold">Your CV is ready. Check it over.</p>
                  <p className="mt-1 text-slate-600">Change anything you like. Make sure every line is true: employers can check.</p>
                </div>
                <div>
                  <span className={label}>Headline</span>
                  <input className={input} value={cv.headline} onChange={(e) => setCv({ ...cv, headline: e.target.value })} />
                </div>
                <div>
                  <span className={label}>Profile</span>
                  <textarea className={input} rows={5} value={cv.summary} onChange={(e) => setCv({ ...cv, summary: e.target.value })} />
                </div>
                {cv.experience.map((j, n) => (
                  <div key={n} className="rounded-2xl border border-slate-200 p-4">
                    <div className="grid gap-2 sm:grid-cols-2">
                      <input className={input} value={j.title} onChange={(e) => setCv({ ...cv, experience: cv.experience.map((x, i) => (i === n ? { ...x, title: e.target.value } : x)) })} />
                      <input className={input} value={j.dates} onChange={(e) => setCv({ ...cv, experience: cv.experience.map((x, i) => (i === n ? { ...x, dates: e.target.value } : x)) })} />
                    </div>
                    <input className={`${input} mt-2`} value={[j.employer, j.location].filter(Boolean).join(", ")} onChange={(e) => setCv({ ...cv, experience: cv.experience.map((x, i) => (i === n ? { ...x, employer: e.target.value, location: "" } : x)) })} />
                    <span className={`${label} mt-3`}>What you did (one per line)</span>
                    <textarea className={input} rows={5} value={j.bullets.join("\n")} onChange={(e) => setCv({ ...cv, experience: cv.experience.map((x, i) => (i === n ? { ...x, bullets: e.target.value.split("\n") } : x)) })} onBlur={(e) => setCv({ ...cv, experience: cv.experience.map((x, i) => (i === n ? { ...x, bullets: lines(e.target.value) } : x)) })} />
                  </div>
                ))}
                {(
                  [
                    ["qualifications", "Licences, tickets and qualifications"],
                    ["skills", "Key skills"],
                    ["education", "Education"],
                    ["extras", "Additional information"],
                  ] as const
                ).map(([k, t]) => (
                  <div key={k}>
                    <span className={label}>{t} (one per line)</span>
                    <textarea className={input} rows={Math.max(3, cv[k].length + 1)} value={cv[k].join("\n")} onChange={(e) => setCv({ ...cv, [k]: e.target.value.split("\n") })} onBlur={(e) => setCv({ ...cv, [k]: lines(e.target.value) })} />
                  </div>
                ))}
                {error && <p className="rounded-lg bg-red-50 p-2.5 text-sm text-red-700">{error}</p>}
                <div className="sticky bottom-0 -mx-6 -mb-6 space-y-2 border-t border-slate-100 bg-white p-4">
                  <button onClick={download} disabled={status === "downloading"} className="w-full rounded-full bg-orange px-5 py-3.5 font-bold text-white shadow-lg shadow-orange/30 transition hover:bg-orange-dark disabled:opacity-50">
                    {status === "downloading" ? "Making your PDF…" : status === "downloaded" ? "Download again" : "Download my CV (free)"}
                  </button>
                  <div className="flex justify-between text-sm">
                    <button
                      onClick={() => {
                        setCv(null);
                        setStep(1);
                        setStatus("idle");
                      }}
                      className="font-semibold text-slate-500 hover:text-navy"
                    >
                      ← Change my details
                    </button>
                    <button onClick={generate} className="font-semibold text-slate-500 hover:text-navy">
                      Rewrite it ↻
                    </button>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                {status === "downloaded" && (
                  <div className="animate-[fadeIn_.4s_ease] rounded-3xl bg-navy p-6 text-white shadow-xl">
                    <p className="font-display text-xl font-extrabold">Downloaded. Good luck, {me.name.split(" ")[0]}!</p>
                    <p className="mt-1 text-white/75">Want us to find you work? We&apos;ve got your CV, and we&apos;ll be in touch if something suits you.</p>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <Link href="/looking-for-work" className="rounded-full bg-orange px-6 py-3 font-bold hover:bg-orange-dark">
                        See our jobs
                      </Link>
                      <Link href="/take-home-pay" className="rounded-full border border-white/25 px-6 py-3 font-bold hover:bg-white/10">
                        Take-home pay calculator
                      </Link>
                    </div>
                  </div>
                )}
                <CvPreview cv={{ ...cv, experience: cv.experience.map((j) => ({ ...j, bullets: j.bullets.filter((x) => x.trim()) })) }} />
              </div>
            </div>
          ) : (
            /* ---------- WIZARD ---------- */
            <div className="mx-auto max-w-3xl rounded-3xl bg-white shadow-2xl ring-1 ring-black/5">
              <div className="border-b border-slate-100 p-5 sm:p-6">
                <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                  <span className="uppercase tracking-wider text-orange">{STEPS[step]}</span>
                  <span>
                    Step {step + 1} of {STEPS.length}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-4 gap-1.5">
                  {STEPS.map((_, n) => (
                    <div key={n} className={`h-1.5 rounded-full transition-colors ${n <= step ? "bg-orange" : "bg-slate-100"}`} />
                  ))}
                </div>
              </div>

              <div key={step} className="animate-[fadeIn_.3s_ease] space-y-4 p-5 sm:p-8">
                {step === 0 && (
                  <>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <span className={label}>Full name</span>
                        <input className={input} value={me.name} onChange={setM("name")} autoComplete="name" placeholder="e.g. Jamie Smith" />
                      </div>
                      <div>
                        <span className={label}>Job you want</span>
                        <input className={input} value={me.target} onChange={setM("target")} placeholder="e.g. Class 1 driver, reach truck driver" />
                      </div>
                      <div>
                        <span className={label}>Email</span>
                        <input className={input} type="email" value={me.email} onChange={setM("email")} autoComplete="email" />
                      </div>
                      <div>
                        <span className={label}>Phone</span>
                        <input className={input} type="tel" value={me.phone} onChange={setM("phone")} autoComplete="tel" />
                      </div>
                      <div>
                        <span className={label}>Town</span>
                        <input className={input} value={me.town} onChange={setM("town")} autoComplete="address-level2" placeholder="e.g. Redditch" />
                      </div>
                      <div>
                        <span className={label}>Postcode (optional)</span>
                        <input className={input} value={me.postcode} onChange={setM("postcode")} autoComplete="postal-code" />
                      </div>
                    </div>
                    <div>
                      <span className={label}>Type of work</span>
                      <div className="flex flex-wrap gap-2">
                        {SECTORS.map((x) => (
                          <button type="button" key={x} onClick={() => setMe((p) => ({ ...p, sector: x }))} className={chip(me.sector === x)}>
                            {x}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {step === 1 && (
                  <>
                    <p className="text-sm text-slate-600">Add your jobs, most recent first. Just the basics: we&apos;ll write up what you did.</p>
                    {jobs.map((j, n) => (
                      <div key={n} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                        <div className="flex items-center justify-between">
                          <p className="font-display font-bold text-navy">Job {n + 1}</p>
                          {jobs.length > 1 && (
                            <button type="button" onClick={() => setJobs((p) => p.filter((_, i) => i !== n))} className="text-sm font-semibold text-slate-400 hover:text-red-600">
                              Remove
                            </button>
                          )}
                        </div>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          <input className={input} placeholder="Job title, e.g. Warehouse operative" value={j.title} onChange={(e) => setJob(n, { title: e.target.value })} />
                          <input className={input} placeholder="Company name" value={j.employer} onChange={(e) => setJob(n, { employer: e.target.value })} />
                          <input className={input} placeholder="Where (town)" value={j.location} onChange={(e) => setJob(n, { location: e.target.value })} />
                          <div className="grid grid-cols-2 gap-2">
                            <label>
                              <span className="text-[11px] font-semibold text-slate-500">Started</span>
                              <input className={input} type="month" value={j.start} onChange={(e) => setJob(n, { start: e.target.value })} />
                            </label>
                            <label>
                              <span className="text-[11px] font-semibold text-slate-500">Finished</span>
                              <input className={input} type="month" value={j.end} disabled={j.current} onChange={(e) => setJob(n, { end: e.target.value })} />
                            </label>
                          </div>
                        </div>
                        <label className="mt-2 flex items-center gap-2 text-sm text-navy">
                          <input type="checkbox" checked={j.current} onChange={(e) => setJob(n, { current: e.target.checked, end: "" })} className="h-4 w-4 accent-orange" />
                          I still work here
                        </label>
                        <textarea className={`${input} mt-3`} rows={2} placeholder="Anything you'd like mentioned? (optional) e.g. nights, multi-drop, trained new starters" value={j.notes} onChange={(e) => setJob(n, { notes: e.target.value })} />
                      </div>
                    ))}
                    {jobs.length < 8 && (
                      <button type="button" onClick={() => setJobs((p) => [...p, emptyJob()])} className="w-full rounded-2xl border-2 border-dashed border-slate-300 py-3 font-bold text-navy hover:border-orange hover:text-orange">
                        + Add another job
                      </button>
                    )}
                  </>
                )}

                {step === 2 && (
                  <>
                    <p className="text-sm text-slate-600">Tap everything you hold. Only pick what you actually have.</p>
                    {TICKETS.map((g) => (
                      <div key={g.group}>
                        <span className={label}>{g.group}</span>
                        <div className="flex flex-wrap gap-2">
                          {g.items.map((t) => (
                            <button type="button" key={t} onClick={() => setTickets((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]))} className={chip(tickets.includes(t))}>
                              {tickets.includes(t) ? "✓ " : ""}
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <input className={input} placeholder="Something else? e.g. Telehandler, NVQ Level 2" value={customTicket} onChange={(e) => setCustomTicket(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && customTicket.trim()) { e.preventDefault(); setTickets((p) => [...p, customTicket.trim()]); setCustomTicket(""); } }} />
                      <button type="button" onClick={() => { if (customTicket.trim()) { setTickets((p) => [...p, customTicket.trim()]); setCustomTicket(""); } }} className="flex-none rounded-xl bg-navy px-4 font-bold text-white">
                        Add
                      </button>
                    </div>
                    {tickets.filter((t) => !TICKETS.some((g) => g.items.includes(t))).length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {tickets.filter((t) => !TICKETS.some((g) => g.items.includes(t))).map((t) => (
                          <button type="button" key={t} onClick={() => setTickets((p) => p.filter((x) => x !== t))} className={chip(true)}>
                            ✓ {t} ✕
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="border-t border-slate-100 pt-4">
                      <span className={label}>School, college or courses (optional)</span>
                      {edu.map((e, n) => (
                        <div key={n} className="mb-2 grid grid-cols-[1fr_1fr_90px_auto] gap-2">
                          <input className={input} placeholder="e.g. GCSEs" value={e.qualification} onChange={(ev) => setEdu((p) => p.map((x, i) => (i === n ? { ...x, qualification: ev.target.value } : x)))} />
                          <input className={input} placeholder="Where" value={e.place} onChange={(ev) => setEdu((p) => p.map((x, i) => (i === n ? { ...x, place: ev.target.value } : x)))} />
                          <input className={input} placeholder="Year" value={e.year} onChange={(ev) => setEdu((p) => p.map((x, i) => (i === n ? { ...x, year: ev.target.value } : x)))} />
                          <button type="button" onClick={() => setEdu((p) => p.filter((_, i) => i !== n))} className="px-2 text-slate-400 hover:text-red-600" aria-label="Remove">
                            ✕
                          </button>
                        </div>
                      ))}
                      {edu.length < 6 && (
                        <button type="button" onClick={() => setEdu((p) => [...p, { qualification: "", place: "", year: "" }])} className="text-sm font-bold text-orange hover:underline">
                          + Add school, college or course
                        </button>
                      )}
                    </div>
                  </>
                )}

                {step === 3 && (
                  <>
                    <div>
                      <span className={label}>A few words about you (optional)</span>
                      <textarea className={input} rows={3} placeholder="e.g. Reliable, always on time, happy to do nights. Looking for something long term near Redditch." value={me.about} onChange={setM("about")} />
                    </div>
                    <div>
                      <span className={label}>Anything else? (optional)</span>
                      <textarea className={input} rows={2} placeholder="e.g. Languages, own transport, available to start straight away" value={me.extras} onChange={setM("extras")} />
                    </div>
                    <input className="hidden" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} aria-hidden="true" />
                    <p className="rounded-xl bg-slate-50 p-4 text-xs leading-relaxed text-slate-500">
                      When you create your CV, Reach Network Recruitment will save your details and CV so we can contact you about suitable work. It&apos;s free and you can ask us to delete your details at any time. See our{" "}
                      <Link href="/privacy-notice" className="underline">
                        privacy notice
                      </Link>
                      .
                    </p>
                  </>
                )}

                {error && <p className="rounded-lg bg-red-50 p-2.5 text-sm text-red-700">{error}</p>}
                <div className="flex gap-3 pt-2">
                  {step > 0 && (
                    <button type="button" onClick={() => setStep(step - 1)} className="rounded-full border border-slate-300 px-5 py-3 text-sm font-bold text-navy">
                      ← Back
                    </button>
                  )}
                  {step < STEPS.length - 1 ? (
                    <button type="button" disabled={!stepOk[step]} onClick={() => setStep(step + 1)} className="flex-1 rounded-full bg-orange px-5 py-3 font-bold text-white transition hover:bg-orange-dark disabled:opacity-40">
                      Next →
                    </button>
                  ) : (
                    <button type="button" onClick={generate} className="flex-1 rounded-full bg-orange px-5 py-3.5 font-bold text-white shadow-lg shadow-orange/30 transition hover:bg-orange-dark">
                      ✨ Write my CV
                    </button>
                  )}
                </div>
                {step === 0 && !stepOk[0] && <p className="text-center text-xs text-slate-400">Fill in your name, job you want, email, phone and town to carry on.</p>}
                {step === 1 && !stepOk[1] && <p className="text-center text-xs text-slate-400">Each job needs a title, company and start date, plus an end date or &ldquo;I still work here&rdquo;.</p>}
              </div>
            </div>
          )}
        </div>
      </section>

      {!cv && status !== "writing" && (
        <section className="bg-slate-50 py-14">
          <div className="mx-auto grid max-w-5xl gap-4 px-6 sm:grid-cols-3 lg:px-8">
            {[
              { t: "You give the basics", s: "Jobs, dates, licences and tickets. A few taps on your phone." },
              { t: "We write it up", s: "A clear profile, your duties for each job, and your key skills." },
              { t: "You check and download", s: "Change anything you like, then download your PDF free." },
            ].map((x, n) => (
              <div key={x.t} className="rounded-2xl bg-white p-6 ring-1 ring-black/5">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-orange font-extrabold text-white">{n + 1}</span>
                <p className="mt-3 font-display text-lg font-bold text-navy">{x.t}</p>
                <p className="mt-1 text-sm text-slate-600">{x.s}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <Footer />
    </main>
  );
}
