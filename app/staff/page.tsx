// Index of local pages
import type { Metadata } from "next";
import { ogMeta } from "@/lib/og";
import Link from "next/link";
import SiteHeader from "../components/SiteHeader";
import Footer from "../components/Footer";
import { SECTOR_PAGES, TOWNS } from "@/lib/locations";

export const metadata: Metadata = {
  title: "Areas we cover: drivers, warehouse, manufacturing and engineering staff | Reach Network Recruitment",
  description: "Local recruitment for drivers, warehouse, production staff and engineers across the West Midlands, Worcestershire, Staffordshire, Warwickshire and the East Midlands.",
  alternates: { canonical: "/staff" },
  ...ogMeta({ title: "Local staff, across the Midlands", description: "Drivers, warehouse, production staff and engineers across the Midlands.", path: "/staff", kicker: "Areas we cover", sub: "22 towns · 4 sectors" }),
};

export default function StaffIndex() {
  return (
    <main className="overflow-x-hidden font-body">
      <SiteHeader />
      <section className="bg-navy py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-orange">Areas we cover</p>
          <h1 className="mt-3 font-display text-4xl font-extrabold text-white sm:text-5xl">Local staff, across the Midlands</h1>
          <p className="mt-4 max-w-xl text-lg text-white/80">From our Bromsgrove office, with drivers working right across the UK.</p>
        </div>
      </section>
      <section className="bg-white py-16">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
          {SECTOR_PAGES.map((s) => (
            <div key={s.slug}>
              <h2 className="font-display text-xl font-extrabold text-navy">{s.noun}</h2>
              <ul className="mt-4 space-y-1.5">
                {TOWNS.map((t) => (
                  <li key={t.slug}>
                    <Link href={`/staff/${s.slug}/${t.slug}`} className="text-slate-600 hover:text-orange">
                      {t.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
      <Footer />
    </main>
  );
}
