// A single guide
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "../../components/SiteHeader";
import Footer from "../../components/Footer";
import { GUIDES } from "@/lib/guides";
import { ogMeta } from "@/lib/og";

export const dynamicParams = false;

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const g = GUIDES.find((x) => x.slug === slug);
  if (!g) return {};
  return { title: `${g.title} | Reach Network Recruitment`, description: g.summary, alternates: { canonical: `/guides/${g.slug}` }, ...ogMeta({ title: g.title, description: g.summary, path: `/guides/${g.slug}`, kicker: `Guide · ${g.tag}`, sub: `${g.minutes} minute read`, photo: g.tag === "Warehouse" ? "warehouse" : "drivers" }) };
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const found = GUIDES.find((x) => x.slug === slug);
  if (!found) return notFound();
  const g = found;
  const others = GUIDES.filter((x) => x.slug !== g.slug).slice(0, 3);
  const jsonLd = { "@context": "https://schema.org", "@type": "Article", headline: g.title, description: g.summary, publisher: { "@type": "Organization", name: "Reach Network Recruitment" } };
  return (
    <main className="overflow-x-hidden font-body">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader />
      <section className="bg-navy py-14">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <nav className="text-sm text-white/60">
            <Link href="/" className="hover:text-white">Home</Link> <span className="mx-1">›</span> <Link href="/guides" className="hover:text-white">Guides</Link>
          </nav>
          <span className="mt-6 inline-block rounded-full bg-orange px-3 py-1 text-xs font-bold text-white">{g.tag}</span>
          <h1 className="mt-4 font-display text-3xl font-extrabold leading-tight text-white sm:text-4xl">{g.title}</h1>
          <p className="mt-3 text-sm text-white/60">
            {g.minutes} min read · Checked {g.checked}
          </p>
        </div>
      </section>
      <article className="bg-white py-14">
        <div className="mx-auto max-w-3xl space-y-9 px-6 lg:px-8">
          {g.sections.map((s) => (
            <section key={s.h}>
              <h2 className="font-display text-2xl font-extrabold text-navy">{s.h}</h2>
              {s.p?.map((p, i) => (
                <p key={i} className="mt-3 text-lg leading-relaxed text-slate-700">
                  {p}
                </p>
              ))}
              {s.list && (
                <ul className="mt-4 space-y-2">
                  {s.list.map((l) => (
                    <li key={l} className="flex items-start gap-3 text-lg text-slate-700">
                      <span className="mt-2.5 h-2 w-2 flex-none rounded-full bg-orange" />
                      {l}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
          <div className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-600">
            <p className="font-bold text-navy">Official sources</p>
            <ul className="mt-2 space-y-1">
              {g.sources.map((s) => (
                <li key={s.url}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-orange hover:underline">
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-slate-400">Rules change, so always check the official source. This guide is general information, not legal advice.</p>
          </div>
          <div className="rounded-3xl bg-navy p-7 text-white">
            <p className="font-display text-xl font-bold">Looking for work?</p>
            <p className="mt-1 text-white/70">See live jobs or send us your CV. It&apos;s free and takes two minutes.</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/looking-for-work" className="rounded-full bg-orange px-6 py-3 font-bold hover:bg-orange-dark">
                Find work
              </Link>
              <Link href="/refer" className="rounded-full border border-white/25 px-6 py-3 font-bold hover:bg-white/10">
                Refer a friend
              </Link>
            </div>
          </div>
        </div>
      </article>
      <section className="bg-slate-50 py-14">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <h2 className="font-display text-2xl font-extrabold text-navy">More guides</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {others.map((o) => (
              <Link key={o.slug} href={`/guides/${o.slug}`} className="rounded-2xl bg-white p-5 ring-1 ring-black/5 transition hover:shadow-lg">
                <span className="text-xs font-bold text-orange">{o.tag}</span>
                <p className="mt-2 font-display font-bold text-navy">{o.title}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
