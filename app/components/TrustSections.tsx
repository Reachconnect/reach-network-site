// Reviews, accreditations and case studies. Each one only appears once real details are in lib/siteConfig.ts
import Link from "next/link";
import { CASE_STUDIES, REVIEWS, SITE } from "@/lib/siteConfig";

export function hasTrust() {
  const a = SITE.accreditations;
  return !!(a.companyNumber || a.icoNumber || a.recMember || a.insured);
}

export function TrustBar({ dark = false }: { dark?: boolean }) {
  const a = SITE.accreditations;
  const items = [
    a.recMember && { t: "REC member", s: "Recruitment & Employment Confederation" },
    a.icoNumber && { t: "ICO registered", s: `Reg. no. ${a.icoNumber}` },
    a.insured && { t: "Fully insured", s: "Employer's and public liability" },
    a.companyNumber && { t: "Registered company", s: `Company no. ${a.companyNumber}` },
  ].filter(Boolean) as { t: string; s: string }[];
  if (!items.length) return null;
  return (
    <section className={dark ? "border-y border-white/10 bg-navy-deep py-6" : "border-y border-slate-200 bg-white py-6"}>
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-10 gap-y-4 px-6 lg:px-8">
        {items.map((i) => (
          <div key={i.t} className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-orange/15 text-orange">✓</span>
            <div>
              <p className={`font-display text-sm font-bold ${dark ? "text-white" : "text-navy"}`}>{i.t}</p>
              <p className={`text-xs ${dark ? "text-white/55" : "text-slate-500"}`}>{i.s}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function Reviews() {
  if (!REVIEWS.length) return null;
  const avg = REVIEWS.reduce((n, r) => n + r.stars, 0) / REVIEWS.length;
  return (
    <section className="bg-white py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange">Reviews</p>
            <h2 className="mt-3 font-display text-3xl font-extrabold text-navy sm:text-4xl">What people say about us</h2>
            <p className="mt-2 flex items-center gap-2 text-slate-600">
              <span className="text-lg text-orange">{"★".repeat(Math.round(avg))}</span>
              {avg.toFixed(1)} from {REVIEWS.length} review{REVIEWS.length === 1 ? "" : "s"}
            </p>
          </div>
          {SITE.googleReviewUrl && (
            <a href={SITE.googleReviewUrl} target="_blank" rel="noopener noreferrer" className="rounded-full border border-slate-300 px-5 py-2.5 text-sm font-bold text-navy hover:border-navy">
              Leave us a review
            </a>
          )}
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {REVIEWS.slice(0, 6).map((r, n) => (
            <figure key={n} className="flex flex-col rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <p className="text-orange">{"★".repeat(r.stars)}</p>
              <blockquote className="mt-3 flex-1 leading-relaxed text-slate-700">&ldquo;{r.text}&rdquo;</blockquote>
              <figcaption className="mt-5 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-navy font-bold text-white">{r.name.slice(0, 1)}</span>
                <span>
                  <span className="block font-bold text-navy">{r.name}</span>
                  <span className="block text-xs text-slate-500">
                    {[r.role, r.company].filter(Boolean).join(", ")}
                    {r.source === "Google" ? " · Google review" : ""}
                  </span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CaseStudyStrip() {
  if (!CASE_STUDIES.length) return null;
  return (
    <section className="bg-slate-50 py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange">Case studies</p>
            <h2 className="mt-3 font-display text-3xl font-extrabold text-navy sm:text-4xl">Recent work</h2>
          </div>
          <Link href="/case-studies" className="font-bold text-orange hover:underline">
            See all →
          </Link>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {CASE_STUDIES.slice(0, 3).map((c) => (
            <Link key={c.slug} href={`/case-studies#${c.slug}`} className="group rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5 transition hover:-translate-y-1 hover:shadow-xl">
              <p className="text-xs font-bold uppercase tracking-wider text-orange">
                {c.sector} · {c.place}
              </p>
              {c.stat && (
                <p className="mt-3 font-display text-4xl font-extrabold text-navy">
                  {c.stat}
                  <span className="ml-2 text-sm font-semibold text-slate-500">{c.statLabel}</span>
                </p>
              )}
              <p className="mt-3 font-display text-lg font-bold text-navy group-hover:text-orange">{c.title}</p>
              <p className="mt-2 line-clamp-3 text-sm text-slate-600">{c.result}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
