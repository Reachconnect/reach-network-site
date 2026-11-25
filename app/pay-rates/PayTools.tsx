"use client";

// Pay rate checker and temp cost calculator
import { useMemo, useState } from "react";
import Link from "next/link";
import SiteHeader from "../components/SiteHeader";
import Footer from "../components/Footer";
import type { RoleRate } from "@/lib/payRates";

// 2026/27 employer costs (from 6 April 2026)
const HOLIDAY = 0.1207; // 5.6 weeks' holiday for irregular hours workers
const NI_RATE = 0.15;
const NI_THRESHOLD_WEEK = 96;
const PENSION_RATE = 0.03;
const PENSION_LOWER_WEEK = 120;
const PENSION_UPPER_WEEK = 967;
const PENSION_TRIGGER_WEEK = 192;

const gbp = (n: number, dp = 2) => `£${n.toLocaleString("en-GB", { minimumFractionDigits: dp, maximumFractionDigits: dp })}`;

function Calculator({ nlw }: { nlw: number }) {
  const [rate, setRate] = useState(13.5);
  const [hours, setHours] = useState(40);
  const [workers, setWorkers] = useState(1);
  const [pension, setPension] = useState(true);

  const c = useMemo(() => {
    const basic = rate * hours;
    const holiday = basic * HOLIDAY;
    const earnings = basic + holiday;
    const ni = Math.max(0, earnings - NI_THRESHOLD_WEEK) * NI_RATE;
    const pen = pension && earnings >= PENSION_TRIGGER_WEEK ? Math.max(0, Math.min(earnings, PENSION_UPPER_WEEK) - PENSION_LOWER_WEEK) * PENSION_RATE : 0;
    const total = earnings + ni + pen;
    return { basic, holiday, ni, pen, total, perHour: hours ? total / hours : 0 };
  }, [rate, hours, pension]);

  const rows = [
    { l: "Pay to the worker", v: c.basic, color: "bg-navy" },
    { l: "Holiday pay (12.07%)", v: c.holiday, color: "bg-sky-500" },
    { l: "Employer's National Insurance", v: c.ni, color: "bg-orange" },
    { l: "Employer's pension", v: c.pen, color: "bg-amber-300" },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
      <div className="space-y-6 rounded-3xl bg-white p-6 shadow-xl ring-1 ring-black/5 sm:p-8">
        <div>
          <div className="flex items-baseline justify-between">
            <label htmlFor="rate" className="font-semibold text-navy">Hourly pay rate</label>
            <span className="font-display text-2xl font-extrabold text-navy">{gbp(rate)}</span>
          </div>
          <input id="rate" type="range" min={nlw} max={30} step={0.05} value={rate} onChange={(e) => setRate(Number(e.target.value))} className="mt-3 w-full accent-orange" />
          <div className="mt-1 flex justify-between text-xs text-slate-400">
            <span>{gbp(nlw)} minimum</span>
            <span>£30.00</span>
          </div>
          {rate < nlw && <p className="mt-2 text-sm font-semibold text-red-600">That&apos;s below the National Living Wage for workers aged 21 and over.</p>}
        </div>
        <div>
          <div className="flex items-baseline justify-between">
            <label htmlFor="hours" className="font-semibold text-navy">Hours a week</label>
            <span className="font-display text-2xl font-extrabold text-navy">{hours}</span>
          </div>
          <input id="hours" type="range" min={8} max={60} step={1} value={hours} onChange={(e) => setHours(Number(e.target.value))} className="mt-3 w-full accent-orange" />
        </div>
        <div className="flex items-center justify-between">
          <span className="font-semibold text-navy">Number of workers</span>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setWorkers((w) => Math.max(1, w - 1))} className="h-9 w-9 rounded-full border border-slate-300 font-bold text-navy" aria-label="Fewer workers">−</button>
            <span className="w-8 text-center font-display text-xl font-extrabold text-navy">{workers}</span>
            <button type="button" onClick={() => setWorkers((w) => Math.min(200, w + 1))} className="h-9 w-9 rounded-full border border-slate-300 font-bold text-navy" aria-label="More workers">+</button>
          </div>
        </div>
        <label className="flex items-center gap-3 text-sm text-slate-600">
          <input type="checkbox" checked={pension} onChange={(e) => setPension(e.target.checked)} className="h-4 w-4 accent-orange" />
          Include auto-enrolment pension (3% on qualifying earnings)
        </label>
      </div>

      <div className="rounded-3xl bg-navy p-6 text-white shadow-xl sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange">Real cost of employing them</p>
        <p className="mt-3 font-display text-5xl font-extrabold tabular-nums">
          {gbp(c.perHour)}
          <span className="ml-2 text-lg font-semibold text-white/60">an hour</span>
        </p>
        <p className="mt-1 text-white/70">
          {gbp(c.total * workers)} a week for {workers} worker{workers === 1 ? "" : "s"}, before an agency fee
        </p>
        <div className="mt-6 flex h-4 overflow-hidden rounded-full bg-white/10">
          {rows.map((r) => (
            <div key={r.l} className={`${r.color} transition-all duration-500`} style={{ width: `${c.total ? (r.v / c.total) * 100 : 0}%` }} />
          ))}
        </div>
        <ul className="mt-5 space-y-2.5 text-sm">
          {rows.map((r) => (
            <li key={r.l} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-white/80">
                <span className={`h-2.5 w-2.5 rounded-full ${r.color}`} />
                {r.l}
              </span>
              <span className="font-semibold tabular-nums">
                {gbp(r.v * workers)}
                <span className="text-white/50"> /wk</span>
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-6 rounded-2xl bg-white/5 p-4 text-sm text-white/75">
          With Reach, we employ and pay the worker, so all of this is covered in one hourly charge rate, plus our fee. You get one weekly invoice and no payroll to run.
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/i-need-staff#request" className="rounded-full bg-orange px-6 py-3 font-bold hover:bg-orange-dark">
            Get a quote
          </Link>
          <Link href="/book-a-call" className="rounded-full border border-white/25 px-6 py-3 font-bold hover:bg-white/10">
            Talk it through
          </Link>
        </div>
      </div>
    </div>
  );
}

function RateChecker({ rates }: { rates: RoleRate[] }) {
  const [key, setKey] = useState(rates[0]?.key || "");
  const r = rates.find((x) => x.key === key);
  const [f, setF] = useState({ name: "", company: "", email: "", phone: "", area: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  const [hp, setHp] = useState("");
  const [started] = useState(() => Date.now());
  const sectors = Array.from(new Set(rates.map((x) => x.sector)));
  const input = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-navy focus:border-orange focus:outline-none";

  async function ask(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: f.name, companyName: f.company, jobTitle: "", phoneNumber: f.phone, workEmail: f.email, helpTopic: `Pay rate guide: ${r?.label}`, message: `Please send a pay rate guide for ${r?.label}${f.area ? ` in ${f.area}` : ""}.`, area: f.area, website: hp, _t: Date.now() - started }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Something went wrong.");
      setStatus("done");
    } catch (err) {
      setError((err as Error).message);
      setStatus("idle");
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <div className="space-y-4">
        {sectors.map((s) => (
          <div key={s}>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{s}</p>
            <div className="mt-2 space-y-1.5">
              {rates
                .filter((x) => x.sector === s)
                .map((x) => (
                  <button key={x.key} onClick={() => { setKey(x.key); setStatus("idle"); }} className={`flex w-full items-center justify-between rounded-xl border px-4 py-2.5 text-left text-sm font-semibold transition ${key === x.key ? "border-orange bg-orange/10 text-navy" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}>
                    {x.label}
                    {(x.hourly || x.annual) && <span className="h-2 w-2 rounded-full bg-green-500" title="Based on our jobs" />}
                  </button>
                ))}
            </div>
          </div>
        ))}
      </div>

      {r && (
        <div key={r.key} className="animate-[fadeIn_.3s_ease] rounded-3xl bg-white p-6 shadow-xl ring-1 ring-black/5 sm:p-8">
          <p className="text-xs font-bold uppercase tracking-wider text-orange">{r.sector}</p>
          <p className="mt-1 font-display text-2xl font-extrabold text-navy">{r.label}</p>
          {r.hourly || r.annual ? (
            <div className="mt-6 space-y-6">
              {r.hourly && (
                <div>
                  <p className="text-sm font-semibold text-slate-500">Hourly pay, temporary and contract</p>
                  <p className="mt-1 font-display text-4xl font-extrabold text-navy">
                    {gbp(r.hourly.low)} – {gbp(r.hourly.high)}
                  </p>
                  <div className="relative mt-4 h-3 rounded-full bg-gradient-to-r from-slate-200 via-orange/60 to-orange">
                    <span className="absolute -top-1.5 h-6 w-1.5 rounded-full bg-navy" style={{ left: `${((r.hourly.mid - r.hourly.low) / Math.max(0.01, r.hourly.high - r.hourly.low)) * 100}%` }} />
                  </div>
                  <p className="mt-2 text-sm text-slate-500">Typical: {gbp(r.hourly.mid)} an hour · from {r.hourly.n} of our jobs</p>
                </div>
              )}
              {r.annual && (
                <div>
                  <p className="text-sm font-semibold text-slate-500">Salary, permanent</p>
                  <p className="mt-1 font-display text-4xl font-extrabold text-navy">
                    {gbp(r.annual.low, 0)} – {gbp(r.annual.high, 0)}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">Typical: {gbp(r.annual.mid, 0)} · from {r.annual.n} of our jobs</p>
                </div>
              )}
              <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                Rates vary with shift pattern, nights and weekends, location and experience. Paying at the top of the range usually means faster fills and better retention.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/i-need-staff#request" className="rounded-full bg-orange px-6 py-3 font-bold text-white hover:bg-orange-dark">
                  Request staff at this rate
                </Link>
                <a href="#calculator" className="rounded-full border border-slate-300 px-6 py-3 font-bold text-navy hover:border-navy">
                  Work out the cost
                </a>
              </div>
            </div>
          ) : status === "done" ? (
            <p className="mt-6 rounded-xl bg-green-50 p-4 font-semibold text-green-700">Thanks. We&apos;ll send you current rates for {r.label.toLowerCase()} shortly.</p>
          ) : (
            <form onSubmit={ask} className="mt-5 space-y-3">
              <p className="text-slate-600">
                We only publish a range once we have enough real jobs to be fair. Tell us where your site is and we&apos;ll send you current local rates for this role, free.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <input className={input} placeholder="Your name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required />
                <input className={input} placeholder="Company" value={f.company} onChange={(e) => setF({ ...f, company: e.target.value })} required />
                <input className={input} type="email" placeholder="Work email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} required />
                <input className={input} type="tel" placeholder="Phone" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} required />
              </div>
              <input className={input} placeholder="Site town or postcode" value={f.area} onChange={(e) => setF({ ...f, area: e.target.value })} />
              <input type="text" name="website" tabIndex={-1} autoComplete="off" value={hp} onChange={(e) => setHp(e.target.value)} aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 opacity-0" />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button disabled={status === "sending"} className="rounded-full bg-orange px-6 py-3 font-bold text-white hover:bg-orange-dark disabled:opacity-50">
                {status === "sending" ? "Sending…" : "Send me local rates"}
              </button>
            </form>
          )}
          <p className="mt-6 border-t border-slate-100 pt-4 text-xs text-slate-400">The legal minimum for workers aged 21 and over is {gbp(NLW_DISPLAY)} an hour (National Living Wage from 1 April 2026).</p>
        </div>
      )}
    </div>
  );
}

const NLW_DISPLAY = 12.71;

export default function PayTools({ rates, nlw, guideLive = false }: { rates: RoleRate[]; nlw: number; guideLive?: boolean }) {
  return (
    <main className="overflow-x-hidden font-body">
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}`}</style>
      <SiteHeader />
      <section className="relative overflow-hidden bg-navy pb-16 pt-12">
        <div className="pointer-events-none absolute -right-40 -top-40 h-[480px] w-[480px] rounded-full bg-orange/20 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <nav className="text-sm text-white/60">
            <Link href="/" className="hover:text-white">Home</Link> <span className="mx-1">›</span> <span className="text-white/90">Pay rates and costs</span>
          </nav>
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.3em] text-orange">Free tools for employers</p>
          <h1 className="mt-3 max-w-3xl font-display text-4xl font-extrabold leading-tight text-white sm:text-5xl">
            What should you pay, and <span className="text-orange">what will it really cost?</span>
          </h1>
          <p className="mt-4 max-w-xl text-lg text-white/80">Check typical pay rates from our own jobs, then work out the true hourly cost of a worker, including holiday, National Insurance and pension.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#checker" className="rounded-full bg-orange px-6 py-3 font-bold text-white hover:bg-orange-dark">Pay rate checker</a>
            <a href="#calculator" className="rounded-full border border-white/30 px-6 py-3 font-bold text-white hover:bg-white/10">Cost calculator</a>
          </div>
        </div>
      </section>

      <section id="checker" className="scroll-mt-20 bg-slate-50 py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange">Pay rate checker</p>
          <h2 className="mt-3 font-display text-3xl font-extrabold text-navy">Pick a role</h2>
          <div className="mt-8">
            <RateChecker rates={rates} />
          </div>
        </div>
      </section>

      {guideLive && (
        <section className="bg-slate-50 pb-4">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <Link href="/salary-guide" className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-orange p-6 text-white shadow-lg transition hover:-translate-y-0.5">
              <span>
                <span className="block text-xs font-bold uppercase tracking-wider text-white/80">Free PDF</span>
                <span className="block font-display text-2xl font-extrabold">Get the full Midlands pay rates guide</span>
                <span className="block text-white/90">12 roles, official figures for both regions, and the true cost of a worker.</span>
              </span>
              <span className="rounded-full bg-navy px-6 py-3 font-bold">Download free →</span>
            </Link>
          </div>
        </section>
      )}

      <section id="calculator" className="scroll-mt-20 bg-white py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange">Cost calculator</p>
          <h2 className="mt-3 font-display text-3xl font-extrabold text-navy">What does a worker really cost?</h2>
          <p className="mt-2 max-w-2xl text-slate-600">Move the sliders. This shows the cost of employing someone directly for a week, using 2026/27 rates.</p>
          <div className="mt-8">
            <Calculator nlw={nlw} />
          </div>
          <p className="mt-6 max-w-3xl text-xs leading-relaxed text-slate-400">
            Estimates only, for one week, using 2026/27 figures: holiday pay at 12.07% for irregular hours, employer&apos;s National Insurance at 15% above £96 a week, and a 3% employer pension on earnings between £120 and £967 a week for workers earning over £192 a week. It doesn&apos;t include the Apprenticeship Levy, Employment Allowance, sick pay, training or PPE, which vary by business.
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}
