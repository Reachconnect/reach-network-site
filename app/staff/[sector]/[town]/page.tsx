// Local landing pages, e.g. /staff/warehouse-staff/coventry
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import SiteHeader from "../../../components/SiteHeader";
import Footer from "../../../components/Footer";
import { OFFICE, SECTOR_PAGES, TOWNS, milesBetween, nearbyTowns } from "@/lib/locations";
import { getCoverage, type CoverageOut } from "@/lib/coverage";
import { listPublicJobs, type PublicJob } from "@/lib/jobsPublic";

export const revalidate = 86400;
export const dynamicParams = false;

type Params = { sector: string; town: string };

export function generateStaticParams(): Params[] {
  return SECTOR_PAGES.flatMap((s) => TOWNS.map((t) => ({ sector: s.slug, town: t.slug })));
}

function find(p: Params) {
  const s = SECTOR_PAGES.find((x) => x.slug === p.sector);
  const t = TOWNS.find((x) => x.slug === p.town);
  return s && t ? { s, t } : null;
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const f = find(await params);
  if (!f) return {};
  const title = `${f.s.headline(f.t.name)} | Reach Network Recruitment`;
  return {
    title,
    description: `Temporary and permanent ${f.s.people} in ${f.t.name}, ${f.t.county}. Checked people for short-notice cover, peaks and permanent roles, with live clock-ins in Reach Connect.`,
    alternates: { canonical: `/staff/${f.s.slug}/${f.t.slug}` },
  };
}

// Shared between pages in the same build, so the database is asked once per sector
const coverageCache = new Map<string, Promise<{ areas: CoverageOut[]; total: number }>>();
let jobsCache: Promise<PublicJob[]> | null = null;

export default async function LocalPage({ params }: { params: Promise<Params> }) {
  const f = find(await params);
  if (!f) return notFound();
  const { s, t } = f;

  if (!coverageCache.has(s.key)) coverageCache.set(s.key, getCoverage(s.key).catch(() => ({ areas: [], total: 0 })));
  if (!jobsCache) jobsCache = listPublicJobs().catch(() => []);
  const [cov, allJobs] = await Promise.all([coverageCache.get(s.key)!, jobsCache]);

  const local = cov.areas.filter((a) => t.postcodes.includes(a.key));
  const localCount = local.reduce((n, a) => n + a.all, 0);
  const jobs = allJobs
    .filter((j) => s.jobRe.test(`${j.title} ${j.category}`))
    .filter((j) => (j.postcode_area && t.postcodes.some((p) => new RegExp(`^${p}\\d`).test(j.postcode_area!))) || (j.area || j.location || "").toLowerCase().includes(t.name.toLowerCase()))
    .slice(0, 6);
  const miles = Math.round(milesBetween(OFFICE, t));
  const near = nearbyTowns(t);
  const others = SECTOR_PAGES.filter((x) => x.slug !== s.slug);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "EmploymentAgency",
    name: "Reach Network Recruitment",
    url: "https://reachnetworkrec.com",
    telephone: "+441216301643",
    address: { "@type": "PostalAddress", streetAddress: "132a High Street", addressLocality: "Bromsgrove", postalCode: "B61 8ES", addressCountry: "GB" },
    areaServed: { "@type": "City", name: t.name },
    makesOffer: { "@type": "Offer", itemOffered: { "@type": "Service", name: `${s.noun} in ${t.name}` } },
  };

  return (
    <main className="overflow-x-hidden font-body">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader />

      <section className="relative overflow-hidden bg-navy">
        <Image src={s.img} alt="" fill priority sizes="100vw" className="object-cover opacity-25" />
        <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/90 to-navy/40" />
        <div className="relative mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
          <nav className="text-sm text-white/60">
            <Link href="/" className="hover:text-white">Home</Link> <span className="mx-1">›</span>{" "}
            <Link href={s.industryHref} className="hover:text-white">{s.noun}</Link> <span className="mx-1">›</span> <span className="text-white/90">{t.name}</span>
          </nav>
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.3em] text-orange">
            {s.noun} · {t.county}
          </p>
          <h1 className="mt-3 max-w-3xl font-display text-4xl font-extrabold leading-tight text-white sm:text-5xl">{s.headline(t.name)}</h1>
          <p className="mt-5 max-w-xl text-lg text-white/80">
            Checked {s.people} for short-notice cover, peak periods and permanent roles in {t.name}
            {miles > 2 ? `, about ${miles} miles from our Bromsgrove office` : ", from our office on the High Street"}.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/i-need-staff#request" className="rounded-full bg-orange px-7 py-3.5 font-bold text-white shadow-lg shadow-orange/30 hover:bg-orange-dark">
              Request {s.people}
            </Link>
            <a href="tel:01216301643" className="rounded-full border border-white/30 px-6 py-3.5 font-bold text-white hover:bg-white/10">
              Call 0121 630 1643
            </a>
          </div>
          <div className="mt-10 grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
              <p className="font-display text-2xl font-extrabold text-orange">{localCount >= 5 ? `${localCount}+` : "Local"}</p>
              <p className="text-sm text-white/65">{localCount >= 5 ? `${s.people} registered in the ${t.postcodes.join(", ")} postcode area` : `${s.people} across ${t.county}`}</p>
            </div>
            <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
              <p className="font-display text-2xl font-extrabold text-orange">{miles > 2 ? `${miles} miles` : "On the doorstep"}</p>
              <p className="text-sm text-white/65">from our Bromsgrove office</p>
            </div>
            <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
              <p className="font-display text-2xl font-extrabold text-orange">Live</p>
              <p className="text-sm text-white/65">clock-ins and timesheets in Reach Connect</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange">Roles we fill in {t.name}</p>
            <h2 className="mt-3 font-display text-3xl font-extrabold text-navy">The people you need</h2>
            <ul className="mt-6 grid gap-2 sm:grid-cols-2">
              {s.roles.map((r) => (
                <li key={r} className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 font-semibold text-navy">
                  <span className="h-2 w-2 flex-none rounded-full bg-orange" />
                  {r}
                </li>
              ))}
            </ul>
            <p className="mt-6 text-slate-600">
              Temporary, temp-to-perm or permanent. Tell us the role, shifts and pay rate and we&apos;ll tell you honestly how quickly we can fill it in {t.name}.{" "}
              <Link href="/pay-rates" className="font-bold text-orange hover:underline">
                Check typical pay rates
              </Link>
              .
            </p>
          </div>
          <div className="rounded-3xl bg-navy p-8 text-white">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange">Before they arrive</p>
            <h2 className="mt-3 font-display text-2xl font-extrabold">Every worker, checked</h2>
            <ul className="mt-5 space-y-3">
              {s.checks.map((c) => (
                <li key={c} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-orange text-[10px] font-bold">✓</span>
                  <span className="text-white/85">{c}</span>
                </li>
              ))}
            </ul>
            <Link href="/how-it-works" className="mt-6 inline-block font-bold text-orange hover:underline">
              How it works →
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange">Jobs near {t.name}</p>
              <h2 className="mt-3 font-display text-3xl font-extrabold text-navy">{jobs.length ? "Hiring now" : `Looking for work in ${t.name}?`}</h2>
            </div>
            <Link href="/looking-for-work" className="font-bold text-orange hover:underline">
              All jobs →
            </Link>
          </div>
          {jobs.length ? (
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {jobs.map((j) => (
                <Link key={j.key} href={j.href} className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-orange/50 hover:shadow-lg">
                  <span className="rounded-full bg-orange/10 px-2.5 py-0.5 text-xs font-bold text-orange">{j.category}</span>
                  <p className="mt-3 font-display text-lg font-bold text-navy group-hover:text-orange">{j.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{[j.area || j.location, j.salary].filter(Boolean).join(" · ")}</p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="mt-4 max-w-2xl text-slate-600">
              We regularly need {s.people} in and around {t.name}. <Link href="/looking-for-work" className="font-bold text-orange hover:underline">Send us your CV</Link> and we&apos;ll call you when something fits.
            </p>
          )}
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <h2 className="font-display text-2xl font-extrabold text-navy">{s.noun} near {t.name}</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {near.map((n) => (
                <Link key={n.slug} href={`/staff/${s.slug}/${n.slug}`} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-navy hover:border-orange">
                  {n.name} <span className="text-slate-400">· {Math.round(n.miles)} mi</span>
                </Link>
              ))}
            </div>
          </div>
          <div>
            <h2 className="font-display text-2xl font-extrabold text-navy">More in {t.name}</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {others.map((o) => (
                <Link key={o.slug} href={`/staff/${o.slug}/${t.slug}`} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-navy hover:border-orange">
                  {o.headline(t.name)}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-orange py-14">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 text-center lg:flex-row lg:px-8 lg:text-left">
          <div>
            <p className="font-display text-2xl font-extrabold text-white sm:text-3xl">Need {s.people} in {t.name}?</p>
            <p className="mt-1 text-white/90">Send a request in two minutes or call 0121 630 1643.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/i-need-staff#request" className="rounded-full bg-navy px-7 py-3.5 font-bold text-white hover:bg-navy-deep">
              Request staff
            </Link>
            <Link href="/book-a-call" className="rounded-full border-2 border-white px-7 py-3.5 font-bold text-white hover:bg-white hover:text-orange">
              Book a call
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
