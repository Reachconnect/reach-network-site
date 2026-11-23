"use client";

// Why choose Reach Network Recruitment
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Footer from "../components/Footer";

const REASONS = [
  {
    key: "specialist",
    title: "Specialists, not generalists",
    short: "Drivers, warehouse, manufacturing and engineering.",
    body: "We focus on the sectors we know. That means we understand licences, tickets, shift patterns and what a good worker looks like on your site, and we already know people who fit.",
    points: ["Class 1, Class 2 and delivery drivers", "Warehouse and FLT operatives", "Production and engineering roles"],
    link: { label: "See our sectors", href: "/our-services" },
    icon: "M3 21h18M5 21V8l7-5 7 5v13M9 21v-6h6v6",
  },
  {
    key: "checked",
    title: "Checked before they arrive",
    short: "ID, right to work, history and licences, every time.",
    body: "Every worker goes through the same checks before they're offered to you, and it's all recorded. No shortcuts when we're busy.",
    points: ["ID and right to work", "Work history reviewed", "Licences and tickets confirmed", "Site induction before day one"],
    link: { label: "How our checks work", href: "/how-it-works" },
    icon: "M9 12l2 2 4-4m5.6-4A11.96 11.96 0 0 1 12 2.9 11.96 11.96 0 0 1 3.4 6 12 12 0 0 0 12 21a12 12 0 0 0 8.6-15z",
  },
  {
    key: "tech",
    title: "Technology you can see",
    short: "Reach Connect shows you everything, live.",
    body: "Temporary staffing clients get Reach Connect: see who's on site, GPS and face-checked clock-ins, timesheets approved in a tap and costs by site.",
    points: ["Live on-site board", "Timesheets in a tap", "Costs and reports by site", "Online terms, signed in minutes"],
    link: { label: "Explore Reach Connect", href: "/reach-connect" },
    icon: "M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm4 17h2",
  },
  {
    key: "contact",
    title: "One point of contact",
    short: "A team that knows your sites.",
    body: "You deal with a small team who know your sites, your rules and your people. No call centre and no starting from scratch every time you call.",
    points: ["Know your sites and shifts", "Quick answers by phone or message", "Honest advice on pay and availability"],
    link: { label: "Book a call", href: "/book-a-call" },
    icon: "M21 12a8 8 0 0 1-11.8 7L4 20l1-4.6A8 8 0 1 1 21 12z",
  },
  {
    key: "pricing",
    title: "Clear pricing",
    short: "Agreed upfront, with no hidden extras.",
    body: "A clear charge rate for temporary staff and a clear fee for permanent hires, agreed and signed before we start. One weekly invoice for temps.",
    points: ["Rates agreed before we start", "One weekly invoice", "No surprise charges"],
    link: { label: "Our services", href: "/our-services" },
    icon: "M12 2v20M17 6H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",
  },
  {
    key: "local",
    title: "Local to the Midlands",
    short: "Based in Bromsgrove, working across the UK.",
    body: "Our office is on Bromsgrove High Street. We know the Midlands well, and our drivers cover jobs right across the UK.",
    points: ["132a High Street, Bromsgrove", "Midlands knowledge", "UK-wide driver coverage"],
    link: { label: "Contact us", href: "/book-a-call" },
    icon: "M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21zm0-9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  },
];

const COMPARE: { row: string; us: string; them: string }[] = [
  { row: "Who you deal with", us: "A small team who know your sites", them: "Whoever picks up the phone" },
  { row: "Worker checks", us: "The same checks, every worker, recorded", them: "Varies when they're busy" },
  { row: "Seeing who's on site", us: "Live, in Reach Connect", them: "Phone round and hope" },
  { row: "Timesheets", us: "Approved in a tap", them: "Paper, emails and chasing" },
  { row: "Pricing", us: "Agreed and signed upfront", them: "Extras appear on the invoice" },
  { row: "Sector knowledge", us: "Drivers, warehouse, manufacturing, engineering", them: "A bit of everything" },
];

const PROMISES = [
  "We'll tell you honestly if we can fill it, and when.",
  "We'll only send people we'd be happy to put our name to.",
  "If something goes wrong on site, we'll deal with it quickly.",
  "We'll keep you updated without you having to chase.",
];

function Icon({ d, className = "h-6 w-6" }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d={d} />
    </svg>
  );
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

export default function WhyChooseUsPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [active, setActive] = useState(0);
  const r = REASONS[active];

  return (
    <main className="overflow-x-hidden font-body">
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}`}</style>
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
      <section className="relative overflow-hidden bg-navy">
        <div className="pointer-events-none absolute -left-40 -top-40 h-[480px] w-[480px] rounded-full bg-orange/15 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-6 py-16 lg:grid-cols-2 lg:px-8 lg:py-20">
          <div>
            <nav className="text-sm text-white/60">
              <Link href="/" className="hover:text-white">Home</Link> <span className="mx-1">›</span> <span className="text-white/90">Why choose us</span>
            </nav>
            <p className="mt-6 text-xs font-bold uppercase tracking-[0.3em] text-orange">Why choose us</p>
            <h1 className="mt-3 font-display text-4xl font-extrabold leading-tight text-white sm:text-5xl">
              A recruitment partner <span className="text-orange">you can actually see working.</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg text-white/80">Specialist sectors, proper checks, live technology and a team who know your sites.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/i-need-staff#request" className="rounded-full bg-orange px-7 py-3.5 font-bold text-white shadow-lg shadow-orange/30 hover:bg-orange-dark">
                Request staff →
              </Link>
              <Link href="/book-a-call" className="rounded-full border border-white/30 px-6 py-3.5 font-bold text-white hover:bg-white/10">
                Book a call
              </Link>
            </div>
          </div>
          <div className="relative">
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl shadow-2xl ring-1 ring-white/10">
              <Image src="/industries/aboutusone.png" alt="Reach Network Recruitment team at work" fill priority sizes="(max-width: 1024px) 100vw, 50vw" className="scale-[1.06] object-cover" />
            </div>
            <div className="absolute -bottom-6 -left-4 hidden w-60 rounded-2xl bg-white p-4 shadow-xl sm:block">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Live on site</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" /><span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" /></span>
                <p className="text-sm font-bold text-navy">Clock-ins checked by GPS and face</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* REASONS EXPLORER */}
      <section className="bg-slate-50 py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange">Six reasons</p>
          <h2 className="mt-3 font-display text-3xl font-extrabold text-navy">What makes us different</h2>
          <div className="mt-10 grid gap-6 lg:grid-cols-[400px_1fr]">
            <div className="space-y-2">
              {REASONS.map((x, n) => (
                <button key={x.key} onClick={() => setActive(n)} className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition ${active === n ? "border-orange bg-white shadow-lg" : "border-transparent hover:bg-white"}`}>
                  <span className={`flex h-11 w-11 flex-none items-center justify-center rounded-xl transition ${active === n ? "bg-orange text-white" : "bg-orange/10 text-orange"}`}>
                    <Icon d={x.icon} className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block font-display font-bold text-navy">{x.title}</span>
                    <span className="block text-xs text-slate-500">{x.short}</span>
                  </span>
                </button>
              ))}
            </div>
            <div key={r.key} className="animate-[fadeIn_.35s_ease] rounded-3xl bg-navy p-8 text-white shadow-xl lg:p-10">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange text-white">
                <Icon d={r.icon} className="h-7 w-7" />
              </span>
              <p className="mt-5 font-display text-3xl font-extrabold">{r.title}</p>
              <p className="mt-3 max-w-xl text-lg leading-relaxed text-white/80">{r.body}</p>
              <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                {r.points.map((p) => (
                  <li key={p} className="flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3 text-sm font-semibold">
                    <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-orange text-[10px] font-bold">✓</span>
                    {p}
                  </li>
                ))}
              </ul>
              <Link href={r.link.href} className="mt-7 inline-block font-bold text-orange hover:underline">
                {r.link.label} →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* COMPARISON */}
      <section className="bg-white py-16 lg:py-20">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <p className="text-center text-xs font-bold uppercase tracking-[0.25em] text-orange">Side by side</p>
          <h2 className="mt-3 text-center font-display text-3xl font-extrabold text-navy">Reach vs a typical agency</h2>
          <div className="mt-10 overflow-hidden rounded-3xl border border-slate-200">
            <div className="grid grid-cols-[1fr_1.2fr_1.2fr] bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
              <div className="p-4" />
              <div className="bg-navy p-4 text-orange">Reach</div>
              <div className="p-4">Typical agency</div>
            </div>
            {COMPARE.map((c) => (
              <div key={c.row} className="grid grid-cols-[1fr_1.2fr_1.2fr] border-t border-slate-200 text-sm">
                <div className="p-4 font-bold text-navy">{c.row}</div>
                <div className="flex items-start gap-2 bg-navy/[0.03] p-4 font-semibold text-navy">
                  <span className="mt-0.5 flex h-4 w-4 flex-none items-center justify-center rounded-full bg-green-500 text-[9px] text-white">✓</span>
                  {c.us}
                </div>
                <div className="flex items-start gap-2 p-4 text-slate-500">
                  <span className="mt-0.5 flex h-4 w-4 flex-none items-center justify-center rounded-full bg-slate-300 text-[9px] text-white">✕</span>
                  {c.them}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROMISES */}
      <section className="bg-slate-50 py-16 lg:py-20">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 lg:grid-cols-2 lg:px-8">
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl shadow-xl">
            <Image src="/industries/secondimage.png" alt="Working with Reach Network Recruitment" fill sizes="(max-width: 1024px) 100vw, 50vw" className="scale-[1.06] object-cover" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange">Our promise</p>
            <h2 className="mt-3 font-display text-3xl font-extrabold text-navy">What you can expect from us</h2>
            <ul className="mt-6 space-y-3">
              {PROMISES.map((p, n) => (
                <li key={p} className="flex items-start gap-4 rounded-2xl bg-white p-4 shadow-sm">
                  <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-orange font-extrabold text-white">{n + 1}</span>
                  <p className="pt-1 font-semibold text-navy">{p}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-orange py-14">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 text-center lg:flex-row lg:px-8 lg:text-left">
          <div>
            <p className="font-display text-2xl font-extrabold text-white sm:text-3xl">See the difference for yourself.</p>
            <p className="mt-1 text-white/90">Call 0121 630 1643, request staff online or book a Reach Connect demo.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/i-need-staff#request" className="rounded-full bg-navy px-7 py-3.5 font-bold text-white hover:bg-navy-deep">
              Request staff
            </Link>
            <Link href="/book-a-demo" className="rounded-full border-2 border-white px-7 py-3.5 font-bold text-white hover:bg-white hover:text-orange">
              Book a demo
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
