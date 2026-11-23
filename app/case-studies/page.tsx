// Case studies. Add real ones in lib/siteConfig.ts
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "../components/SiteHeader";
import Footer from "../components/Footer";
import { CASE_STUDIES } from "@/lib/siteConfig";

export const metadata: Metadata = { title: "Case studies | Reach Network Recruitment", description: "How we've helped clients fill driving, warehouse, manufacturing and engineering roles.", alternates: { canonical: "/case-studies" } };

export default function CaseStudiesPage() {
  if (!CASE_STUDIES.length) notFound();
  return (
    <main className="overflow-x-hidden font-body">
      <SiteHeader />
      <section className="bg-navy py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-orange">Case studies</p>
          <h1 className="mt-3 font-display text-4xl font-extrabold text-white sm:text-5xl">Real problems, solved</h1>
        </div>
      </section>
      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-4xl space-y-6 px-6 lg:px-8">
          {CASE_STUDIES.map((c) => (
            <article key={c.slug} id={c.slug} className="scroll-mt-24 rounded-3xl bg-white p-8 shadow-sm ring-1 ring-black/5">
              <p className="text-xs font-bold uppercase tracking-wider text-orange">
                {c.sector} · {c.place}
              </p>
              <h2 className="mt-2 font-display text-2xl font-extrabold text-navy">{c.title}</h2>
              {c.stat && (
                <p className="mt-4 font-display text-5xl font-extrabold text-orange">
                  {c.stat} <span className="text-base font-semibold text-slate-500">{c.statLabel}</span>
                </p>
              )}
              <div className="mt-6 grid gap-5 md:grid-cols-3">
                {[
                  ["The challenge", c.challenge],
                  ["What we did", c.what],
                  ["The result", c.result],
                ].map(([h, t]) => (
                  <div key={h}>
                    <p className="font-display font-bold text-navy">{h}</p>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600">{t}</p>
                  </div>
                ))}
              </div>
            </article>
          ))}
          <div className="text-center">
            <Link href="/i-need-staff#request" className="inline-block rounded-full bg-orange px-7 py-3.5 font-bold text-white hover:bg-orange-dark">
              Request staff
            </Link>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
