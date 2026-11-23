// Guides and advice for candidates
import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "../components/SiteHeader";
import Footer from "../components/Footer";
import { GUIDES } from "@/lib/guides";

export const metadata: Metadata = {
  title: "Guides for drivers and warehouse workers: CPC, tacho cards, FLT, right to work | Reach Network Recruitment",
  description: "Plain-English guides to Driver CPC, digital tachograph cards, HGV licence categories, FLT training and proving your right to work.",
  alternates: { canonical: "/guides" },
};

export default function GuidesPage() {
  return (
    <main className="overflow-x-hidden font-body">
      <SiteHeader />
      <section className="relative overflow-hidden bg-navy py-16">
        <div className="pointer-events-none absolute -right-40 -top-40 h-[420px] w-[420px] rounded-full bg-orange/20 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <nav className="text-sm text-white/60">
            <Link href="/" className="hover:text-white">Home</Link> <span className="mx-1">›</span> <span className="text-white/90">Guides</span>
          </nav>
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.3em] text-orange">Guides and advice</p>
          <h1 className="mt-3 max-w-2xl font-display text-4xl font-extrabold text-white sm:text-5xl">The stuff you need to know, in plain English</h1>
          <p className="mt-4 max-w-xl text-lg text-white/80">Licences, cards, training and paperwork, checked against GOV.UK and the HSE.</p>
        </div>
      </section>
      <section className="bg-slate-50 py-16">
        <div className="mx-auto grid max-w-7xl gap-4 px-6 sm:grid-cols-2 lg:grid-cols-3 lg:px-8">
          {GUIDES.map((g) => (
            <Link key={g.slug} href={`/guides/${g.slug}`} className="group flex flex-col rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5 transition hover:-translate-y-1 hover:shadow-xl">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-orange/10 px-2.5 py-0.5 text-xs font-bold text-orange">{g.tag}</span>
                <span className="text-xs text-slate-400">{g.minutes} min read</span>
              </div>
              <p className="mt-4 font-display text-lg font-bold leading-snug text-navy group-hover:text-orange">{g.title}</p>
              <p className="mt-2 flex-1 text-sm text-slate-600">{g.summary}</p>
              <span className="mt-5 text-sm font-bold text-orange">Read the guide →</span>
            </Link>
          ))}
        </div>
      </section>
      <Footer />
    </main>
  );
}
