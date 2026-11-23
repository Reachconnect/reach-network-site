"use client";

// Take-home pay calculator for workers
import { useMemo, useState } from "react";
import Link from "next/link";
import SiteHeader from "../components/SiteHeader";
import Footer from "../components/Footer";
import { LOANS, TAX_YEAR, takeHome, type LoanKey } from "@/lib/takeHome";

export type RateJob = { key: string; title: string; href: string; hourly: number; area: string | null; salary: string | null };

const gbp = (n: number) => `£${n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const gbp0 = (n: number) => `£${Math.round(n).toLocaleString("en-GB")}`;

const FAQS = [
  { q: "Is this accurate?", a: `It uses the official ${TAX_YEAR} rates for the standard tax code 1257L, worked out for one week. Your payslip can differ if you have a different tax code, are paid monthly, have more than one job, or have other deductions.` },
  { q: "What's rolled-up holiday pay?", a: "Some temporary workers are paid an extra 12.07% on top of their hourly rate instead of taking paid holiday. Tick the box if your pay works like that." },
  { q: "Why does pension come out of my pay?", a: "If you earn over £192 a week you're usually enrolled in a workplace pension. You pay 4% of your qualifying earnings, the government adds 1% in tax relief, and your employer adds at least 3%. You can choose to opt out." },
  { q: "Which student loan plan am I on?", a: "Plan 2 for most people in England and Wales who started university between 2012 and 2023, Plan 5 if you started from August 2023, Plan 1 if you started before 2012 or studied in Northern Ireland, and Plan 4 if you studied in Scotland. Check on GOV.UK if you're not sure." },
];

function Slider({ id, label, value, min, max, step, onChange, fmt }: { id: string; label: string; value: number; min: number; max: number; step: number; onChange: (n: number) => void; fmt: (n: number) => string }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="font-semibold text-navy">{label}</label>
        <div className="flex items-center gap-1">
          <input
            aria-label={label}
            type="number"
            inputMode="decimal"
            value={value}
            min={min}
            max={max}
            step={step}
            onChange={(e) => onChange(Math.min(max, Math.max(0, Number(e.target.value) || 0)))}
            className="w-24 rounded-lg border border-slate-200 px-2 py-1 text-right font-display text-lg font-extrabold text-navy focus:border-orange focus:outline-none"
          />
        </div>
      </div>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="mt-3 w-full accent-orange" />
      <div className="mt-1 flex justify-between text-xs text-slate-400">
        <span>{fmt(min)}</span>
        <span>{fmt(max)}</span>
      </div>
    </div>
  );
}

export default function TakeHomeClient({ jobs }: { jobs: RateJob[] }) {
  const [rate, setRate] = useState(13.5);
  const [hours, setHours] = useState(40);
  const [otHours, setOtHours] = useState(0);
  const [otX, setOtX] = useState(1.5);
  const [holiday, setHoliday] = useState(false);
  const [scotland, setScotland] = useState(false);
  const [pension, setPension] = useState(true);
  const [loan, setLoan] = useState<LoanKey>("none");
  const [period, setPeriod] = useState<"week" | "month" | "year">("week");
  const [faq, setFaq] = useState<number | null>(null);

  const r = useMemo(() => takeHome({ rate, hours, overtimeHours: otHours, overtimeMultiplier: otX, holidayRolledUp: holiday, scotland, pension, loan }), [rate, hours, otHours, otX, holiday, scotland, pension, loan]);
  const mult = period === "week" ? 1 : period === "month" ? 52 / 12 : 52;
  const parts = [
    { l: "Take-home", v: r.net, c: "bg-green-500" },
    { l: "Income tax", v: r.tax, c: "bg-navy" },
    { l: "National Insurance", v: r.ni, c: "bg-sky-500" },
    { l: "Pension (your 4%)", v: r.pension, c: "bg-amber-400" },
    { l: "Student loan", v: r.loan, c: "bg-rose-400" },
  ].filter((p) => p.v > 0.004 || p.l === "Take-home");

  const better = jobs.filter((j) => j.hourly > rate).sort((a, b) => b.hourly - a.hourly).slice(0, 4);
  const upRate = Math.ceil(rate + 1);
  const atUp = takeHome({ rate: upRate, hours, overtimeHours: otHours, overtimeMultiplier: otX, holidayRolledUp: holiday, scotland, pension, loan });
  const chip = (on: boolean) => `rounded-full border px-3.5 py-2 text-sm font-semibold transition ${on ? "border-orange bg-orange/10 text-navy" : "border-slate-200 text-slate-600 hover:border-slate-300"}`;

  return (
    <main className="overflow-x-hidden font-body">
      <SiteHeader />

      <section className="relative overflow-hidden bg-navy pb-28 pt-12">
        <div className="pointer-events-none absolute -right-40 -top-40 h-[480px] w-[480px] rounded-full bg-orange/20 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <nav className="text-sm text-white/60">
            <Link href="/" className="hover:text-white">Home</Link> <span className="mx-1">›</span> <Link href="/guides" className="hover:text-white">Guides</Link> <span className="mx-1">›</span> <span className="text-white/90">Take-home pay calculator</span>
          </nav>
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.3em] text-orange">Free calculator · {TAX_YEAR} rates</p>
          <h1 className="mt-3 max-w-3xl font-display text-4xl font-extrabold leading-tight text-white sm:text-5xl">
            What will I <span className="text-orange">actually take home?</span>
          </h1>
          <p className="mt-4 max-w-xl text-lg text-white/80">Put in your hourly rate and hours to see your pay after tax, National Insurance, pension and student loan.</p>
        </div>
      </section>

      <section className="relative -mt-20 pb-16">
        <div className="mx-auto grid max-w-7xl gap-6 px-6 lg:grid-cols-[1fr_1.05fr] lg:px-8">
          {/* INPUTS */}
          <div className="space-y-7 rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-black/5 sm:p-8">
            <Slider id="rate" label="Hourly rate" value={rate} min={8} max={40} step={0.05} onChange={setRate} fmt={(n) => `£${n}`} />
            <Slider id="hours" label="Hours a week" value={hours} min={1} max={60} step={0.5} onChange={setHours} fmt={(n) => `${n}`} />
            <div className="rounded-2xl bg-slate-50 p-4">
              <Slider id="ot" label="Overtime hours a week" value={otHours} min={0} max={30} step={0.5} onChange={setOtHours} fmt={(n) => `${n}`} />
              {otHours > 0 && (
                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-semibold text-navy">Paid at</span>
                  {[1, 1.25, 1.5, 2].map((x) => (
                    <button type="button" key={x} onClick={() => setOtX(x)} className={chip(otX === x)}>
                      {x === 1 ? "Same rate" : `×${x}`}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-3">
              <label className="flex items-center gap-3 text-sm text-navy">
                <input type="checkbox" checked={holiday} onChange={(e) => setHoliday(e.target.checked)} className="h-4 w-4 accent-orange" />
                <span>
                  <span className="font-semibold">Holiday pay added to my pay</span> <span className="text-slate-500">(rolled-up, 12.07%)</span>
                </span>
              </label>
              <label className="flex items-center gap-3 text-sm text-navy">
                <input type="checkbox" checked={pension} onChange={(e) => setPension(e.target.checked)} className="h-4 w-4 accent-orange" />
                <span className="font-semibold">I&apos;m in a workplace pension</span>
              </label>
              <label className="flex items-center gap-3 text-sm text-navy">
                <input type="checkbox" checked={scotland} onChange={(e) => setScotland(e.target.checked)} className="h-4 w-4 accent-orange" />
                <span className="font-semibold">I live in Scotland</span>
              </label>
            </div>
            <div>
              <p className="text-sm font-semibold text-navy">Student loan</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(Object.keys(LOANS) as LoanKey[]).map((k) => (
                  <button type="button" key={k} onClick={() => setLoan(k)} className={chip(loan === k)}>
                    {k === "none" ? "None" : LOANS[k].label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* RESULT */}
          <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-3xl bg-navy p-6 text-white shadow-2xl sm:p-8">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange">Your take-home pay</p>
                <div className="flex rounded-full bg-white/10 p-1 text-xs font-bold">
                  {(["week", "month", "year"] as const).map((p) => (
                    <button key={p} onClick={() => setPeriod(p)} className={`rounded-full px-3 py-1.5 transition ${period === p ? "bg-white text-navy" : "text-white/70"}`}>
                      {p === "week" ? "Weekly" : p === "month" ? "Monthly" : "Yearly"}
                    </button>
                  ))}
                </div>
              </div>
              <p className="mt-4 font-display text-6xl font-extrabold tabular-nums">{period === "year" ? gbp0(r.net * mult) : gbp(r.net * mult)}</p>
              <p className="mt-1 text-white/70">
                a {period} from {period === "year" ? gbp0(r.gross * mult) : gbp(r.gross * mult)} before deductions · {gbp(r.perHour)} an hour after deductions
              </p>

              <div className="mt-6 flex h-4 overflow-hidden rounded-full bg-white/10">
                {parts.map((p) => (
                  <div key={p.l} className={`${p.c} transition-all duration-500`} style={{ width: `${r.gross ? (p.v / r.gross) * 100 : 0}%` }} />
                ))}
              </div>
              <ul className="mt-5 space-y-2.5 text-sm">
                {r.holiday > 0 && (
                  <li className="flex justify-between text-white/60">
                    <span>Includes holiday pay</span>
                    <span className="tabular-nums">{gbp(r.holiday * mult)}</span>
                  </li>
                )}
                {parts.map((p) => (
                  <li key={p.l} className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2 text-white/85">
                      <span className={`h-2.5 w-2.5 rounded-full ${p.c}`} />
                      {p.l}
                    </span>
                    <span className={`tabular-nums ${p.l === "Take-home" ? "font-bold" : "text-white/80"}`}>
                      {p.l === "Take-home" ? "" : "−"}
                      {gbp(p.v * mult)}
                    </span>
                  </li>
                ))}
              </ul>
              {rate < 12.71 && <p className="mt-5 rounded-xl bg-red-500/20 p-3 text-sm text-red-100">£{rate.toFixed(2)} is below the National Living Wage of £12.71 an hour for workers aged 21 and over.</p>}
            </div>

            <div className="rounded-3xl bg-orange p-6 text-white shadow-xl">
              <p className="font-display text-xl font-extrabold">Want more?</p>
              <p className="mt-1 text-white/90">
                At {gbp(upRate)} an hour you&apos;d take home {gbp(atUp.net)} a week, which is {gbp((atUp.net - r.net) * 52).replace(".00", "")} more a year.
              </p>
              {better.length > 0 ? (
                <ul className="mt-4 space-y-2">
                  {better.map((j) => (
                    <li key={j.key}>
                      <Link href={j.href} className="flex items-center justify-between gap-3 rounded-xl bg-white/15 px-4 py-3 text-sm font-semibold transition hover:bg-white/25">
                        <span className="min-w-0 truncate">
                          {j.title}
                          {j.area ? <span className="font-normal text-white/80"> · {j.area}</span> : null}
                        </span>
                        <span className="flex-none font-bold">{gbp(j.hourly)}/hr</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
              <Link href="/looking-for-work" className="mt-4 inline-block rounded-full bg-navy px-6 py-3 font-bold hover:bg-navy-deep">
                See all our jobs →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <h2 className="font-display text-3xl font-extrabold text-navy">Questions</h2>
          <div className="mt-6 divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
            {FAQS.map((x, n) => (
              <div key={x.q}>
                <button onClick={() => setFaq(faq === n ? null : n)} className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left">
                  <span className="font-display font-bold text-navy">{x.q}</span>
                  <span className={`flex h-7 w-7 flex-none items-center justify-center rounded-full bg-slate-100 text-navy transition ${faq === n ? "rotate-45" : ""}`}>+</span>
                </button>
                {faq === n && <p className="px-6 pb-5 leading-relaxed text-slate-600">{x.a}</p>}
              </div>
            ))}
          </div>
          <p className="mt-6 text-xs leading-relaxed text-slate-400">
            Estimate only, for one week on the standard 1257L tax code, using {TAX_YEAR} rates: Personal Allowance £12,570; income tax at 20%, 40% and 45% (Scottish rates 19% to 48%); employee National Insurance at 8% between £242 and £967 a week and 2% above; pension at 4% of earnings between £120 and £967 a week; student loans at 9% (6% postgraduate) above the yearly threshold. Not financial advice.
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}
