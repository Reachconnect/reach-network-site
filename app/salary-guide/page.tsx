// Free salary guide: employers fill in their details to download it
import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "../components/SiteHeader";
import Footer from "../components/Footer";
import GuideForm from "./GuideForm";
import { ogMeta } from "@/lib/og";
import { GUIDE_YEAR, SALARY_GUIDE_LIVE } from "@/lib/salaryGuide";

const description = `Free PDF: typical hourly pay for drivers, warehouse, manufacturing and engineering roles in the West and East Midlands, plus what a worker really costs in ${GUIDE_YEAR}.`;

export const metadata: Metadata = {
  title: `Free Midlands pay rates guide ${GUIDE_YEAR}: drivers, warehouse, production, engineers | Reach Network Recruitment`,
  description,
  alternates: { canonical: "/salary-guide" },
  robots: SALARY_GUIDE_LIVE ? undefined : { index: false, follow: false },
  ...ogMeta({ title: `Midlands pay rates ${GUIDE_YEAR}`, description, path: "/salary-guide", kicker: "Free guide for employers", sub: "Drivers · Warehouse · Manufacturing · Engineering", tag: "Free PDF" }),
};

const INSIDE = [
  { t: "Hourly pay by role", s: "12 roles across driving, warehouse, manufacturing and engineering." },
  { t: "West and East Midlands", s: "Official ONS median pay for both regions, April 2026." },
  { t: "What we're seeing", s: "Current rates from our own recent jobs, where we have enough." },
  { t: "The true cost of a worker", s: "Holiday pay, NI and pension at six pay rates, per hour, week and year." },
  { t: "The 2026/27 numbers", s: "Minimum wage, NI thresholds, holiday and pension rules on one page." },
];

export default function SalaryGuidePage() {
  return (
    <main className="overflow-x-hidden font-body">
      <SiteHeader />
      <section className="relative overflow-hidden bg-navy pb-16 pt-12">
        <div className="pointer-events-none absolute -left-40 -top-40 h-[480px] w-[480px] rounded-full bg-orange/20 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl items-start gap-12 px-6 lg:grid-cols-[1fr_480px] lg:px-8">
          <div>
            <nav className="text-sm text-white/60">
              <Link href="/" className="hover:text-white">Home</Link> <span className="mx-1">›</span> <Link href="/pay-rates" className="hover:text-white">Pay rates</Link> <span className="mx-1">›</span> <span className="text-white/90">Salary guide</span>
            </nav>
            <p className="mt-6 text-xs font-bold uppercase tracking-[0.3em] text-orange">Free guide for employers</p>
            <h1 className="mt-3 font-display text-4xl font-extrabold leading-tight text-white sm:text-5xl">
              Midlands pay rates <span className="text-orange">{GUIDE_YEAR}</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg text-white/80">What to pay drivers, warehouse, production staff and engineers, and what each worker really costs you.</p>

            <div className="mt-10 grid items-center gap-8 sm:grid-cols-[200px_1fr]">
              {/* cover preview */}
              <div className="relative mx-auto aspect-[1/1.414] w-48 -rotate-3 overflow-hidden rounded-lg bg-navy-deep shadow-2xl ring-1 ring-white/15 sm:w-full">
                <div className="absolute -left-16 -top-16 h-44 w-44 rounded-full bg-orange/30" />
                <div className="relative flex h-full flex-col justify-between p-4">
                  <div className="flex items-center gap-1.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-orange">
                      <span className="h-1.5 w-1.5 rounded-full bg-orange" />
                    </span>
                    <span className="font-display text-[10px] font-extrabold text-white">REACH</span>
                  </div>
                  <div>
                    <p className="text-[7px] font-bold uppercase tracking-widest text-orange">Free guide for employers</p>
                    <p className="mt-1 font-display text-lg font-extrabold leading-tight text-white">Midlands pay rates</p>
                    <p className="font-display text-lg font-extrabold text-orange">{GUIDE_YEAR}</p>
                  </div>
                  <div className="h-1 w-full rounded bg-orange" />
                </div>
              </div>
              <ul className="space-y-3">
                {INSIDE.map((x) => (
                  <li key={x.t} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-orange text-xs font-bold text-white">✓</span>
                    <span>
                      <span className="block font-bold text-white">{x.t}</span>
                      <span className="block text-sm text-white/65">{x.s}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="lg:sticky lg:top-24">
            <GuideForm />
          </div>
        </div>
      </section>
      <section className="bg-white py-14">
        <div className="mx-auto max-w-3xl px-6 text-center lg:px-8">
          <p className="font-display text-2xl font-extrabold text-navy">Want a quick answer instead?</p>
          <p className="mt-2 text-slate-600">Try our pay rate checker and cost calculator, or call us on 0121 630 1643.</p>
          <Link href="/pay-rates" className="mt-5 inline-block rounded-full border border-slate-300 px-6 py-3 font-bold text-navy hover:border-navy">
            Pay rates and costs →
          </Link>
        </div>
      </section>
      <Footer />
    </main>
  );
}
