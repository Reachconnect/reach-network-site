// A single job on the website: the full job spec, a map of the area, and an apply form
import type { Metadata } from "next";
import Link from "next/link";
import Footer from "../../components/Footer";
import ApplyForm from "../ApplyForm";
import { ogImageUrl, type OgPhoto } from "@/lib/og";
import { takeHome } from "@/lib/takeHome";
import { SITE_URL } from "@/lib/specs";
import { getPublicJob, jobPostingJsonLd, listPublicJobs, type PublicJob } from "@/lib/jobsPublic";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const j = await getPublicJob(slug);
  if (!j) return { title: "Job no longer available | Reach Network Recruitment", robots: { index: false } };
  const where = j.area || j.location;
  const title = `${j.title}${where ? ` in ${where}` : ""}${j.salary ? ` · ${j.salary}` : ""}`;
  const cat = `${j.category} ${j.title}`.toLowerCase();
  const photo: OgPhoto = /driv|hgv|class|van|lgv/.test(cat) ? "drivers" : /engineer|maint|electric|fitter/.test(cat) ? "engineering" : /production|manufactur|machine|food|assembly/.test(cat) ? "manufacturing" : "warehouse";
  const jobOg = ogImageUrl({ title: j.title, kicker: `${j.employment_type || "Job"} · ${j.category}`, sub: [where, j.salary].filter(Boolean).join(" · "), photo, tag: "Apply now" });
  const description = (j.summary || `${j.employment_type || ""} ${j.title} job${where ? ` in ${where}` : ""} with Reach Network Recruitment.`).slice(0, 160);
  return {
    title: `${title} | Reach Network Recruitment`,
    description,
    alternates: { canonical: `${SITE_URL}/jobs/${slug}` },
    openGraph: { title, description, url: `${SITE_URL}/jobs/${slug}`, type: "website", siteName: "Reach Network Recruitment", images: [{ url: jobOg, width: 1200, height: 630, alt: title }] },
    twitter: { card: "summary_large_image", title, description, images: [jobOg] },
  };
}

function posted(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  return days <= 0 ? "Posted today" : days === 1 ? "Posted yesterday" : days < 30 ? `Posted ${days} days ago` : "Posted over a month ago";
}

function List({ title, items, tick }: { title: string; items: string[]; tick?: boolean }) {
  if (!items.length) return null;
  return (
    <section className="mt-8">
      <h2 className="font-display text-lg font-bold text-navy">{title}</h2>
      <ul className="mt-3 space-y-2">
        {items.map((x, i) => (
          <li key={i} className="flex gap-3 text-[15px] leading-relaxed text-slate-700">
            <span className={`mt-1 flex h-5 w-5 flex-none items-center justify-center rounded-full text-xs font-bold ${tick ? "bg-green-100 text-green-700" : "bg-orange/15 text-orange-dark"}`}>{tick ? "✓" : "•"}</span>
            <span>{x}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-navy">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-orange">
            <span className="h-3 w-3 rounded-full bg-orange" />
          </span>
          <span className="font-display leading-none">
            <span className="block text-lg font-extrabold tracking-tight text-white">REACH</span>
            <span className="block text-[9px] font-semibold tracking-[0.2em] text-white/60">NETWORK RECRUITMENT</span>
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/looking-for-work" className="text-sm font-semibold text-white/85 hover:text-white">
            All jobs
          </Link>
          <a href="tel:01216301643" className="hidden rounded-full bg-orange px-5 py-2.5 text-sm font-bold text-white hover:bg-orange-dark sm:block">
            0121 630 1643
          </a>
        </div>
      </div>
    </header>
  );
}

function MapBox({ j }: { j: PublicJob }) {
  if (j.lat == null || j.lng == null) return null;
  const d = 0.045;
  const bbox = `${j.lng - d * 1.6},${j.lat - d},${j.lng + d * 1.6},${j.lat + d}`;
  return (
    <section className="mt-8">
      <h2 className="font-display text-lg font-bold text-navy">Where it is</h2>
      <p className="mt-1 text-sm text-slate-500">Around {j.area || j.location}. We&apos;ll share the exact address when we speak to you.</p>
      <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200">
        <iframe
          title={`Map of ${j.area || j.location}`}
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${j.lat},${j.lng}`}
          className="h-72 w-full"
          loading="lazy"
        />
      </div>
      <a href={`https://www.google.com/maps/dir/?api=1&destination=${j.lat},${j.lng}`} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm font-semibold text-orange-dark hover:underline">
        Check your journey in Google Maps →
      </a>
    </section>
  );
}

export default async function JobPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const j = await getPublicJob(slug);

  if (!j) {
    return (
      <>
        <Header />
        <main className="flex min-h-[60vh] items-center justify-center bg-slate-50 px-6 py-20">
          <div className="max-w-md text-center">
            <h1 className="font-display text-2xl font-bold text-navy">This job has been filled or closed</h1>
            <p className="mt-2 text-slate-600">Good news: we&apos;re recruiting for lots of other roles.</p>
            <Link href="/looking-for-work" className="mt-6 inline-block rounded-full bg-orange px-6 py-3 font-bold text-white">
              See all our jobs
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const url = `${SITE_URL}/jobs/${slug}`;
  const similar = (await listPublicJobs()).filter((x) => x.key !== j.key && x.category === j.category).slice(0, 3);
  const facts: [string, string | null][] = [
    ["Pay", j.salary],
    ["Job type", j.employment_type],
    ["Hours", j.hours],
    ["Location", j.area || j.location],
    ["Start", j.start],
    ["Positions", j.positions > 1 ? `${j.positions} people needed` : null],
  ];
  const share = encodeURIComponent(`${j.title}${j.location ? ` in ${j.location}` : ""}: ${url}`);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jobPostingJsonLd(j, url)).replace(/</g, "\\u003c") }} />
      <Header />
      <main className="bg-slate-50 pb-20">
        <div className="bg-navy pb-24 pt-10">
          <div className="mx-auto max-w-6xl px-6 lg:px-8">
            <Link href="/looking-for-work" className="text-sm text-white/60 hover:text-white">
              ← All jobs
            </Link>
            <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-orange">{j.category}</p>
            <h1 className="mt-1 font-display text-3xl font-extrabold text-white sm:text-4xl">{j.title}</h1>
            <p className="mt-2 text-white/75">
              {[j.area || j.location, j.employment_type, j.salary].filter(Boolean).join(" · ")}
            </p>
            <p className="mt-1 text-sm text-white/50">
              {posted(j.created_at)}
              {j.company ? ` · ${j.company}` : ""}
              {j.closing_date ? ` · Closes ${new Date(j.closing_date).toLocaleDateString("en-GB", { day: "numeric", month: "long" })}` : ""}
            </p>
            <a href="#apply" className="mt-5 inline-block rounded-full bg-orange px-6 py-3 font-bold text-white hover:bg-orange-dark lg:hidden">
              Apply now
            </a>
          </div>
        </div>

        <div className="mx-auto -mt-16 grid max-w-6xl gap-6 px-6 lg:grid-cols-[1fr_380px] lg:px-8">
          <article className="rounded-2xl bg-white p-6 shadow-sm sm:p-8">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {facts
                .filter(([, v]) => v)
                .map(([k, v]) => (
                  <div key={k} className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{k}</p>
                    <p className="mt-0.5 font-semibold text-navy">{v}</p>
                  </div>
                ))}
            </div>

            {j.summary && (
              <section className="mt-8">
                <h2 className="font-display text-lg font-bold text-navy">About the job</h2>
                <p className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed text-slate-700">{j.summary}</p>
              </section>
            )}
            <List title="What you'll do" items={j.duties} />
            <List title="What you'll need" items={j.requirements} />
            <List title="What you get" items={j.benefits} tick />
            <MapBox j={j} />

            <section className="mt-8 rounded-xl bg-slate-50 p-4">
              <p className="text-sm font-semibold text-navy">Know someone who&apos;d be good for this?</p>
              <div className="mt-2 flex flex-wrap gap-2 text-sm">
                <a href={`https://wa.me/?text=${share}`} target="_blank" rel="noopener noreferrer" className="rounded-full bg-[#25D366] px-4 py-2 font-semibold text-white">
                  Share on WhatsApp
                </a>
                <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer" className="rounded-full bg-[#0A66C2] px-4 py-2 font-semibold text-white">
                  LinkedIn
                </a>
                <a href={`mailto:?subject=${encodeURIComponent(j.title)}&body=${share}`} className="rounded-full border border-slate-300 px-4 py-2 font-semibold text-navy">
                  Email
                </a>
              </div>
            </section>
          </article>

          <aside id="apply" className="scroll-mt-24">
            <div className="rounded-2xl bg-white p-6 shadow-sm lg:sticky lg:top-24">
              <ApplyForm jobKey={j.key} jobTitle={j.title} />
              {(() => {
                const hr = Number(j.salary_to) && Number(j.salary_to) < 100 ? Number(j.salary_to) : Number(j.salary_from) && Number(j.salary_from) < 100 ? Number(j.salary_from) : 0;
                if (!hr) return null;
                const t = takeHome({ rate: hr, hours: 40, overtimeHours: 0, overtimeMultiplier: 1, holidayRolledUp: false, scotland: false, pension: false, loan: "none" });
                return (
                  <a href="/take-home-pay" className="mt-5 block rounded-xl bg-orange/5 p-4 text-sm ring-1 ring-orange/30 transition hover:bg-orange/10">
                    <span className="block text-slate-500">At £{hr.toFixed(2)} an hour for 40 hours, that&apos;s about</span>
                    <span className="block font-display text-xl font-extrabold text-navy">£{t.net.toFixed(2)} a week take-home</span>
                    <span className="block text-xs text-slate-500">after tax and NI, before pension. <span className="font-bold text-orange">Work out yours →</span></span>
                  </a>
                );
              })()}
            </div>
          </aside>
        </div>

        {similar.length > 0 && (
          <div className="mx-auto mt-10 max-w-6xl px-6 lg:px-8">
            <h2 className="font-display text-lg font-bold text-navy">Similar jobs</h2>
            <div className="mt-3 grid gap-4 sm:grid-cols-3">
              {similar.map((s) => (
                <Link key={s.key} href={s.href} className="rounded-2xl bg-white p-5 shadow-sm transition hover:shadow-md">
                  <p className="font-display font-bold text-navy">{s.title}</p>
                  <p className="mt-1 text-sm text-slate-500">{[s.area || s.location, s.employment_type, s.salary].filter(Boolean).join(" · ")}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
