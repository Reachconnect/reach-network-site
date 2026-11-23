"use client";

// About Reach Network Recruitment
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Footer from "../components/Footer";

const VALUES = [
  { title: "Honest", body: "We'll tell you straight if we can fill it, what it'll cost and how long it'll take. No overpromising.", icon: "M9 12l2 2 4-4m5.6-4A11.96 11.96 0 0 1 12 2.9 11.96 11.96 0 0 1 3.4 6 12 12 0 0 0 12 21a12 12 0 0 0 8.6-15z" },
  { title: "People first", body: "Workers are people, not numbers. Treat them well and they turn up, work hard and stay.", icon: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm14 10v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" },
  { title: "Thorough", body: "Every worker gets the same checks, every time. We don't cut corners when we're busy.", icon: "M4 6h16M4 12h16M4 18h10" },
  { title: "Open", body: "Clients see everything in Reach Connect: who's on site, hours and costs. Nothing hidden.", icon: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zm11 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" },
  { title: "Quick", body: "Staffing problems don't wait, so neither do we. Fast answers and fast action.", icon: "M13 2L3 14h9l-1 8 10-12h-9z" },
];

const STORY = [
  { tag: "The problem", title: "Agencies that go quiet", body: "Too many clients chase agencies for answers, timesheets and workers who don't turn up. Too many workers get treated like a number." },
  { tag: "Our answer", title: "A specialist agency, done properly", body: "We focus on drivers, warehouse, manufacturing and engineering, with proper checks on every worker and a small team who know each site." },
  { tag: "The difference", title: "Technology you can see", body: "We built Reach Connect so clients can see who's on site, approve timesheets and track costs, live. No more phoning round." },
  { tag: "Today", title: "Growing from Bromsgrove", body: "From our office on Bromsgrove High Street we support clients across the Midlands, with drivers working right across the UK." },
];

const SECTORS = [
  { label: "Drivers", href: "/industries/drivers", img: "/industries/industry-driving.png" },
  { label: "Warehouse", href: "/industries/warehouse", img: "/industries/industry-warehousing.png" },
  { label: "Manufacturing", href: "/industries/manufacturing", img: "/industries/industry-manufacturing.png" },
  { label: "Engineering", href: "/industries/engineering", img: "/industries/industry-engineering.png" },
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
      { label: "Why choose us", href: "/about-us" },
      { label: "FAQ", href: "/faq" },
    ],
  },
];

export default function AboutUsPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [chapter, setChapter] = useState(0);
  const [value, setValue] = useState(0);

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
        <div className="pointer-events-none absolute -right-40 top-20 h-[480px] w-[480px] rounded-full bg-orange/15 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-6 py-16 lg:grid-cols-[1.1fr_1fr] lg:px-8 lg:py-20">
          <div>
            <nav className="text-sm text-white/60">
              <Link href="/" className="hover:text-white">Home</Link> <span className="mx-1">›</span> <span className="text-white/90">About us</span>
            </nav>
            <p className="mt-6 text-xs font-bold uppercase tracking-[0.3em] text-orange">About Reach</p>
            <h1 className="mt-3 font-display text-4xl font-extrabold leading-tight text-white sm:text-5xl">
              Recruitment, <span className="text-orange">the way it should be done.</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-white/80">
              Reach Network Recruitment is a specialist agency for drivers, warehouse, manufacturing and engineering, based in Bromsgrove. We combine proper checks and honest advice with technology that shows clients everything.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/i-need-staff" className="rounded-full bg-orange px-7 py-3.5 font-bold text-white shadow-lg shadow-orange/30 hover:bg-orange-dark">
                I need staff
              </Link>
              <Link href="/looking-for-work" className="rounded-full border border-white/30 px-6 py-3.5 font-bold text-white hover:bg-white/10">
                I&apos;m looking for work
              </Link>
            </div>
          </div>
          <div className="relative">
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl shadow-2xl ring-1 ring-white/10">
              <Image src="/industries/aboutusone.png" alt="The Reach Network Recruitment team" fill priority sizes="(max-width: 1024px) 100vw, 45vw" className="scale-[1.06] object-cover" />
            </div>
            <div className="absolute -bottom-5 -right-3 hidden rounded-2xl bg-orange px-5 py-4 text-white shadow-xl sm:block">
              <p className="text-xs font-bold uppercase tracking-wider text-white/80">Based in</p>
              <p className="font-display text-lg font-extrabold">Bromsgrove</p>
            </div>
          </div>
        </div>
      </section>

      {/* STORY */}
      <section className="bg-white py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange">Our story</p>
          <h2 className="mt-3 font-display text-3xl font-extrabold text-navy">Why we started Reach</h2>
          <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_1.2fr]">
            <div className="relative space-y-2">
              {STORY.map((s, n) => (
                <button key={s.tag} onClick={() => setChapter(n)} className={`flex w-full items-center gap-4 rounded-2xl p-4 text-left transition ${chapter === n ? "bg-navy text-white shadow-lg" : "hover:bg-slate-50"}`}>
                  <span className={`flex h-10 w-10 flex-none items-center justify-center rounded-full font-extrabold ${chapter === n ? "bg-orange text-white" : "bg-slate-100 text-slate-500"}`}>{n + 1}</span>
                  <span>
                    <span className={`block text-xs font-bold uppercase tracking-wider ${chapter === n ? "text-orange" : "text-slate-400"}`}>{s.tag}</span>
                    <span className={`block font-display font-bold ${chapter === n ? "text-white" : "text-navy"}`}>{s.title}</span>
                  </span>
                </button>
              ))}
            </div>
            <div key={chapter} className="flex animate-[fadeIn_.35s_ease] flex-col justify-center rounded-3xl bg-slate-50 p-8 lg:p-12">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange">{STORY[chapter].tag}</p>
              <p className="mt-3 font-display text-3xl font-extrabold text-navy">{STORY[chapter].title}</p>
              <p className="mt-4 text-lg leading-relaxed text-slate-600">{STORY[chapter].body}</p>
              <div className="mt-8 flex gap-2">
                {STORY.map((_, n) => (
                  <button key={n} onClick={() => setChapter(n)} className={`h-1.5 rounded-full transition-all ${chapter === n ? "w-10 bg-orange" : "w-4 bg-slate-300"}`} aria-label={`Chapter ${n + 1}`} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOUNDER */}
      <section className="bg-slate-50 py-16">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 lg:grid-cols-[320px_1fr] lg:px-8">
          <div className="mx-auto flex aspect-square w-64 items-center justify-center rounded-full bg-gradient-to-br from-navy to-navy-deep shadow-2xl ring-8 ring-white lg:w-full">
            <span className="font-display text-7xl font-extrabold text-orange">DR</span>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange">Meet the founder</p>
            <p className="mt-3 font-display text-3xl font-extrabold text-navy">Darren Rowell</p>
            <p className="font-semibold text-slate-500">Director</p>
            <blockquote className="mt-5 border-l-4 border-orange pl-5 text-lg leading-relaxed text-slate-700">
              &ldquo;I set up Reach to do recruitment properly: check every worker, be honest with clients about what&apos;s possible, and give them technology that shows exactly what&apos;s happening on their sites.&rdquo;
            </blockquote>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/book-a-call" className="rounded-full bg-navy px-6 py-3 font-bold text-white hover:bg-navy-deep">
                Book a call
              </Link>
              <a href="mailto:darrenrowell@reachnetworkrec.com" className="rounded-full border border-slate-300 px-6 py-3 font-bold text-navy hover:border-navy">
                Email Darren
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* VALUES */}
      <section className="bg-navy py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange">Our values</p>
          <h2 className="mt-3 font-display text-3xl font-extrabold text-white">What we stand for</h2>
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {VALUES.map((v, n) => (
              <button key={v.title} onMouseEnter={() => setValue(n)} onClick={() => setValue(n)} className={`rounded-2xl border p-6 text-left transition ${value === n ? "border-orange bg-orange text-white shadow-xl shadow-orange/20" : "border-white/10 bg-white/5 text-white hover:bg-white/10"}`}>
                <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${value === n ? "bg-white/20" : "bg-orange/15 text-orange"}`}>
                  <Icon d={v.icon} className="h-5 w-5" />
                </span>
                <p className="mt-4 font-display text-lg font-bold">{v.title}</p>
                <p className={`mt-2 text-sm leading-relaxed ${value === n ? "text-white/90" : "text-white/60"}`}>{v.body}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* SECTORS */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange">What we do</p>
              <h2 className="mt-3 font-display text-3xl font-extrabold text-navy">Four sectors. Done well.</h2>
            </div>
            <Link href="/our-services" className="font-bold text-orange hover:underline">
              Our services →
            </Link>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {SECTORS.map((s) => (
              <Link key={s.label} href={s.href} className="group relative block aspect-square overflow-hidden rounded-2xl">
                <Image src={s.img} alt={s.label} fill sizes="(max-width: 1024px) 50vw, 25vw" className="scale-[1.08] object-cover transition duration-500 group-hover:scale-[1.15]" />
                <div className="absolute inset-0 bg-gradient-to-t from-navy/90 to-transparent" />
                <p className="absolute bottom-4 left-4 font-display text-xl font-bold text-white">
                  {s.label} <span className="text-orange transition group-hover:ml-1">→</span>
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* VISIT */}
      <section className="bg-slate-50 py-16">
        <div className="mx-auto grid max-w-7xl items-stretch gap-6 px-6 lg:grid-cols-2 lg:px-8">
          <div className="flex flex-col justify-center rounded-3xl bg-white p-8 shadow-sm lg:p-10">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange">Find us</p>
            <h2 className="mt-3 font-display text-3xl font-extrabold text-navy">Come and say hello</h2>
            <div className="mt-6 space-y-4 text-slate-700">
              <p className="flex items-start gap-3">
                <Icon d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21zm0-9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" className="mt-0.5 h-5 w-5 flex-none text-orange" />
                132a High Street, Bromsgrove, B61 8ES
              </p>
              <a href="tel:01216301643" className="flex items-center gap-3 font-semibold text-navy hover:text-orange">
                <Icon d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" className="h-5 w-5 flex-none text-orange" />
                0121 630 1643
              </a>
            </div>
            <Link href="/book-a-call" className="mt-8 self-start rounded-full bg-orange px-6 py-3 font-bold text-white hover:bg-orange-dark">
              Book a call
            </Link>
          </div>
          <div className="relative min-h-[320px] overflow-hidden rounded-3xl shadow-sm">
            <iframe
              title="Reach Network Recruitment office map"
              src="https://www.openstreetmap.org/export/embed.html?bbox=-2.0700%2C52.3310%2C-2.0480%2C52.3400&layer=mapnik&marker=52.3355%2C-2.0590"
              className="absolute inset-0 h-full w-full border-0"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
