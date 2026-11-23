"use client";

// Our services: how we work with employers, and what's included
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Footer from "../components/Footer";

const SERVICES = [
  {
    key: "temp",
    label: "Temporary staffing",
    short: "Cover from one shift to several months",
    image: "/industries/ourserviceswarehouse.png",
    pos: "object-[65%_center]",
    intro: "Checked, reliable people for holidays, sickness, busy weeks and short-term projects. They work through us, so we look after their pay and timesheets, and you see everything live in Reach Connect.",
    included: ["Interviewed and checked before they start", "Workers confirm their shifts on WhatsApp", "GPS and face-checked clock-ins", "Timesheets you approve in a tap", "We handle their pay", "Replacements if someone isn't right"],
    pay: "An hourly rate for each worker, covering their pay and our costs. You only pay for the hours worked and approved.",
    speed: "Often the same or next day for short-notice cover",
    link: "/temporary-recruitment",
  },
  {
    key: "ttp",
    label: "Temp to perm",
    short: "Try before you hire",
    image: "/industries/happyworker.png",
    pos: "object-[75%_center]",
    intro: "Start someone as a temp and see their attendance and work first-hand. When you're sure, take them on permanently. It's the lowest-risk way to hire.",
    included: ["Everything in temporary staffing", "See real performance before you commit", "A smooth move onto your payroll", "Advice on the offer and start date"],
    pay: "The hourly temporary rate while they're with us, then a transfer fee when you take them on, as set out in our terms.",
    speed: "Start as quickly as temporary cover",
    link: "/temporary-recruitment",
  },
  {
    key: "perm",
    label: "Permanent recruitment",
    short: "Skilled, senior and hard-to-fill roles",
    image: "/industries/lookingforwork.png",
    pos: "object-[72%_center]",
    intro: "Engineers, managers, specialist drivers and skilled trades. We find people who aren't just looking at job boards, check them properly, and manage the process through to their first weeks with you.",
    included: ["A brief that covers what really matters to you", "A shortlist of interviewed, checked candidates", "Anonymous candidate profiles you can view online", "Interviews, offers and references handled", "Check-ins through their first weeks", "A rebate period if they leave early"],
    pay: "A one-off fee, usually a percentage of the first year's salary, paid only when someone starts. No fee if we don't fill the role.",
    speed: "Shortlist usually within a few days",
    link: "/permanent-recruitment",
  },
  {
    key: "volume",
    label: "Volume & peak",
    short: "Whole teams for busy periods and new contracts",
    image: "/industries/howitworks.png",
    pos: "object-[78%_center]",
    intro: "Peak season, a new contract, a new shift or a new site. We plan with you, recruit and check the whole team ahead of time, and brief everyone so they start together.",
    included: ["A plan for numbers, roles and start dates", "Recruitment and checks done in advance", "Site briefings before day one", "One point of contact for the whole team", "Live attendance in Reach Connect"],
    pay: "Hourly rates per worker, agreed up front for the whole team, so you can budget for the period.",
    speed: "Plan a few weeks ahead for the biggest teams",
    link: "/i-need-staff",
  },
];

const COMPARE: { feature: string; v: (boolean | string)[] }[] = [
  { feature: "Interviewed and checked candidates", v: [true, true, true, true] },
  { feature: "ID and right to work checks", v: [true, true, true, true] },
  { feature: "Licences and certificates checked", v: [true, true, true, true] },
  { feature: "We handle pay and timesheets", v: [true, "While temp", false, true] },
  { feature: "Reach Connect live portal", v: [true, "While temp", false, true] },
  { feature: "Anonymous candidate profiles online", v: [false, false, true, false] },
  { feature: "Replacement if someone isn't right", v: [true, true, "Rebate period", true] },
  { feature: "One named point of contact", v: [true, true, true, true] },
];

const SECTORS = [
  { label: "Drivers", href: "/industries/drivers", image: "/industries/happydriver.png", pos: "object-[72%_22%]", sub: "Class 1, Class 2, 7.5t, van, ADR" },
  { label: "Warehouse", href: "/industries/warehouse", image: "/industries/warehousehelp.png", pos: "object-[80%_center]", sub: "Pickers, packers, FLT, goods in" },
  { label: "Manufacturing", href: "/industries/manufacturing", image: "/industries/manufacturingpeople.png", pos: "object-[72%_center]", sub: "Operatives, setters, welders, QA" },
  { label: "Engineering", href: "/industries/engineering", image: "/industries/engineeringpeople.png", pos: "object-[78%_center]", sub: "Maintenance, electrical, HVAC, gas" },
];

const EXTRAS = [
  { title: "Candidate profiles you can view online", body: "Instead of a pile of CVs, you get a smart, anonymous profile page for each candidate. Pick the ones you like and ask us to call, in one tap.", icon: "M4 5h16v14H4zM8 9h8M8 13h5" },
  { title: "Video introductions", body: "A short video from your recruiter explaining why a candidate fits, so you get the context you'd normally only get on a phone call.", icon: "M3 7h12v10H3zM15 11l6-4v10l-6-4" },
  { title: "Branded, consistent CVs", body: "Every CV in the same clear Reach format, so you can compare candidates quickly.", icon: "M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6" },
  { title: "Sign our terms online", body: "Review and sign our terms of business on your phone in a couple of minutes, with a full signing certificate for your records.", icon: "M4 20h16M6 16l9-9 3 3-9 9H6z" },
  { title: "Reach Connect for temporary staff", body: "See who's on site live, approve timesheets in a tap and track costs by site.", icon: "M4 5h16v11H4zM9 20h6M12 16v4" },
  { title: "Checks you can rely on", body: "ID, right to work, licences, certificates and references, set out clearly for every sector.", icon: "M9 12l2 2 4-4m5.6-4A11.96 11.96 0 0 1 12 2.9 11.96 11.96 0 0 1 3.4 6 12 12 0 0 0 12 21a12 12 0 0 0 8.6-15z" },
];

const STEPS = [
  { title: "Talk to us", body: "A quick call or form about the role, your site and what matters to you." },
  { title: "Agree the plan", body: "Clear rates or fees, and our terms signed online before anything starts." },
  { title: "We find and check", body: "Interviews, ID, right to work, licences, certificates and references." },
  { title: "People start", body: "Briefed on your site and shifts, with us on hand from day one." },
];

function Icon({ d, className = "h-6 w-6" }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d={d} />
    </svg>
  );
}

function Cell({ v }: { v: boolean | string }) {
  if (v === true) return <span className="mx-auto flex h-7 w-7 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-700">✓</span>;
  if (v === false) return <span className="text-lg text-slate-300">–</span>;
  return <span className="text-xs font-semibold text-slate-600">{v}</span>;
}

const NAV_SECTIONS = [
  {
    label: "For Employers",
    links: [
      { label: "I need staff", href: "/i-need-staff" },
      { label: "Book a call", href: "/book-a-call" },
      { label: "Our services", href: "/our-services" },
      { label: "How it works", href: "/how-it-works" },
      { label: "Reach Connect sign in", href: "#" },
    ],
  },
  {
    label: "For Candidates",
    links: [
      { label: "Find a job", href: "/looking-for-work" },
      { label: "Register for work", href: "/looking-for-work" },
      { label: "Register CV", href: "/looking-for-work" },
      { label: "Career advice", href: "/looking-for-work" },
    ],
  },
  {
    label: "Reach Connect",
    links: [
      { label: "Book a demo", href: "/book-a-demo" },
      { label: "Features", href: "/book-a-demo#features" },
    ],
  },
  {
    label: "Reach Network Recruitment",
    links: [
      { label: "About us", href: "/about-us" },
      { label: "Why choose us", href: "/why-choose-us" },
      { label: "FAQ", href: "/faq" },
    ],
  },
];

export default function OurServicesPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [svc, setSvc] = useState(0);
  const S = SERVICES[svc];

  return (
    <main className="overflow-x-hidden font-body">
      {/* HEADER */}
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

          <div className="flex shrink-0 items-center gap-3">
            <a href="tel:01216301643" className="hidden shrink-0 items-center gap-2 whitespace-nowrap text-sm font-semibold text-white/85 transition hover:text-white sm:flex">
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0">
                <path d="M3.5 2.5A1.5 1.5 0 0 1 5 1h1.3a1.5 1.5 0 0 1 1.46 1.16l.62 2.68a1.5 1.5 0 0 1-.4 1.42l-1.1 1.1a11.5 11.5 0 0 0 5 5l1.1-1.1a1.5 1.5 0 0 1 1.42-.4l2.68.62A1.5 1.5 0 0 1 18 12.7V14a1.5 1.5 0 0 1-1.5 1.5C8.5 15.5 3.5 10.5 3.5 2.5z" />
              </svg>
              0121 630 1643
            </a>
            <Link href="/book-a-call" className="hidden rounded-full bg-orange px-5 py-2.5 text-sm font-bold text-white transition hover:bg-orange-dark sm:block">
              Let&rsquo;s Talk
            </Link>
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              aria-expanded={menuOpen}
              aria-label="Toggle menu"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white transition hover:border-white/40"
            >
              {menuOpen ? (
                <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
                  <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                </svg>
              ) : (
                <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
                  <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div className={`overflow-hidden border-t border-white/10 bg-navy transition-[max-height] duration-300 ease-in-out ${menuOpen ? "max-h-96" : "max-h-0 border-t-0"}`}>
          <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-6 py-4 lg:px-8">
            {NAV_SECTIONS.map((section) => (
              <div key={section.label}>
                <button
                  type="button"
                  onClick={() => setOpenSection(openSection === section.label ? null : section.label)}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-left text-sm font-semibold text-white/85 transition hover:bg-white/5 hover:text-white"
                >
                  {section.label}
                  <svg viewBox="0 0 12 12" className={`h-3 w-3 opacity-60 transition-transform ${openSection === section.label ? "rotate-180" : ""}`} fill="none">
                    <path d="M2.5 4.5 6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                {openSection === section.label && (
                  <div className="ml-3 flex flex-col gap-0.5 border-l border-white/10 pl-3">
                    {section.links.map((link) => (
                      <Link key={link.label} href={link.href} className="rounded-lg px-3 py-2 text-left text-xs font-semibold text-white/70 transition hover:bg-white/5 hover:text-white">
                        {link.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <Link href="/contact-us" className="rounded-lg px-3 py-3 text-left text-sm font-semibold text-white/85 transition hover:bg-white/5 hover:text-white">
              Contact us
            </Link>
            <Link href="/book-a-call" className="mx-3 mt-2 rounded-full bg-orange px-5 py-2.5 text-center text-sm font-bold text-white transition hover:bg-orange-dark sm:hidden">
              Let&rsquo;s Talk
            </Link>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section className="relative isolate overflow-hidden bg-navy">
        <div className="absolute inset-0 -z-10">
          <Image src="/industries/ourservicescover.png" alt="Recruiter on the phone in the Reach office" fill priority sizes="100vw" className="object-cover object-[70%_25%]" />
          <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/85 to-navy/10" />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-navy to-transparent" />
        </div>
        <div className="mx-auto max-w-7xl px-6 pb-28 pt-12 lg:px-8 lg:pb-36 lg:pt-20">
          <nav className="text-sm text-white/60">
            <Link href="/" className="hover:text-white">Home</Link> <span className="mx-1">›</span> <span className="text-white/90">Our services</span>
          </nav>
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.3em] text-orange">Our services</p>
          <h1 className="mt-3 max-w-2xl font-display text-4xl font-extrabold leading-tight text-white sm:text-5xl">
            Recruitment that does more <span className="text-orange">than send CVs.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/80">Temporary cover, temp to perm, permanent hires and whole teams for peak, with checks you can rely on and tools that make working with us easy.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/i-need-staff#request" className="flex items-center gap-2 rounded-full bg-orange px-7 py-3.5 font-bold text-white shadow-lg shadow-orange/30 transition hover:bg-orange-dark">
              Request staff <span aria-hidden="true">→</span>
            </Link>
            <Link href="/book-a-call" className="rounded-full border border-white/30 px-7 py-3.5 font-bold text-white transition hover:bg-white/10">
              Book a call
            </Link>
          </div>
        </div>
      </section>

      {/* SERVICE PICKER */}
      <section className="relative z-10 -mt-16 px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-3 lg:grid-cols-4">
          {SERVICES.map((s, n) => (
            <button
              key={s.key}
              onClick={() => {
                setSvc(n);
                document.getElementById("service")?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className={`rounded-2xl p-5 text-left shadow-xl transition ${svc === n ? "bg-orange text-white" : "bg-white text-navy hover:-translate-y-0.5"}`}
            >
              <p className="font-display text-lg font-extrabold">{s.label}</p>
              <p className={`mt-1 text-sm ${svc === n ? "text-white/85" : "text-slate-500"}`}>{s.short}</p>
            </button>
          ))}
        </div>
      </section>

      {/* SERVICE DETAIL */}
      <section id="service" className="scroll-mt-24 bg-white py-16">
        <div key={S.key} className="mx-auto grid max-w-6xl animate-[fadeIn_.35s_ease] gap-10 px-6 lg:grid-cols-[1fr_1.1fr] lg:px-8">
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-navy shadow-lg">
            <Image src={S.image} alt={S.label} fill sizes="(max-width: 1024px) 100vw, 50vw" className={`object-cover ${S.pos}`} />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy/90 to-transparent p-6 pt-16">
              <p className="font-display text-2xl font-extrabold text-white">{S.label}</p>
              <p className="mt-1 text-sm text-white/75">⏱ {S.speed}</p>
            </div>
          </div>
          <div>
            <p className="text-lg leading-relaxed text-slate-700">{S.intro}</p>
            <p className="mt-6 text-xs font-bold uppercase tracking-wide text-slate-400">What&apos;s included</p>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {S.included.map((x) => (
                <li key={x} className="flex gap-2 text-sm text-slate-700">
                  <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-green-100 text-[11px] font-bold text-green-700">✓</span>
                  {x}
                </li>
              ))}
            </ul>
            <div className="mt-6 rounded-2xl bg-slate-50 p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">How you pay</p>
              <p className="mt-1 text-slate-700">{S.pay}</p>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/i-need-staff#request" className="rounded-full bg-orange px-6 py-3 text-sm font-bold text-white hover:bg-orange-dark">
                Get started
              </Link>
              <Link href={S.link} className="rounded-full border border-slate-300 px-6 py-3 text-sm font-bold text-navy hover:bg-slate-50">
                More detail →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* COMPARE */}
      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange">Side by side</p>
          <h2 className="mt-3 font-display text-3xl font-extrabold text-navy">Which is right for you?</h2>
          <div className="mt-8 overflow-x-auto rounded-3xl bg-white shadow-sm">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="p-5 text-left font-display text-base text-navy" />
                  {SERVICES.map((s, n) => (
                    <th key={s.key} className={`p-5 text-center font-display text-sm font-bold ${svc === n ? "text-orange" : "text-navy"}`}>
                      {s.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARE.map((r) => (
                  <tr key={r.feature} className="border-b border-slate-50 last:border-0">
                    <td className="p-4 pl-5 font-semibold text-navy">{r.feature}</td>
                    {r.v.map((v, n) => (
                      <td key={n} className={`p-4 text-center ${svc === n ? "bg-orange/5" : ""}`}>
                        <Cell v={v} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* EXTRAS */}
      <section className="bg-navy py-20">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange">The Reach difference</p>
          <h2 className="mt-3 max-w-2xl font-display text-3xl font-extrabold text-white">Tools that make working with us easier</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {EXTRAS.map((e) => (
              <div key={e.title} className="group rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:-translate-y-1 hover:border-orange/50 hover:bg-white/10">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange/15 text-orange transition group-hover:bg-orange group-hover:text-white">
                  <Icon d={e.icon} />
                </span>
                <p className="mt-4 font-display text-lg font-bold text-white">{e.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-white/65">{e.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTORS */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange">Sectors</p>
          <h2 className="mt-3 font-display text-3xl font-extrabold text-navy">Specialists in four sectors</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SECTORS.map((s) => (
              <Link key={s.label} href={s.href} className="group relative aspect-[3/4] overflow-hidden rounded-3xl bg-navy shadow-lg">
                <Image src={s.image} alt={s.label} fill sizes="(max-width: 640px) 100vw, 25vw" className={`object-cover ${s.pos} transition duration-700 group-hover:scale-105`} />
                <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/30 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <p className="font-display text-xl font-extrabold text-white">{s.label}</p>
                  <p className="mt-1 text-sm text-white/75">{s.sub}</p>
                  <p className="mt-3 text-sm font-bold text-orange">Find out more →</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* HOW WE START */}
      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange">Getting started</p>
          <h2 className="mt-3 font-display text-3xl font-extrabold text-navy">Up and running in four steps</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, n) => (
              <div key={s.title} className="rounded-2xl bg-white p-6 shadow-sm">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-navy font-display font-extrabold text-white">{n + 1}</span>
                <p className="mt-4 font-display text-lg font-bold text-navy">{s.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-navy p-10 sm:p-14">
            <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-orange/25 blur-3xl" />
            <h2 className="relative max-w-xl font-display text-3xl font-extrabold text-white sm:text-4xl">Not sure which service fits? Let&apos;s talk it through.</h2>
            <p className="relative mt-3 max-w-lg text-white/75">Tell us about the role and we&apos;ll recommend the best way to fill it, with clear rates or fees before anything starts.</p>
            <div className="relative mt-8 flex flex-wrap gap-3">
              <Link href="/i-need-staff#request" className="rounded-full bg-orange px-7 py-3.5 font-bold text-white shadow-lg shadow-orange/30 hover:bg-orange-dark">
                Request staff →
              </Link>
              <a href="tel:01216301643" className="rounded-full border border-white/30 px-7 py-3.5 font-bold text-white hover:bg-white/10">
                Call 0121 630 1643
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}`}</style>
    </main>
  );
}
