"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import Footer from "./components/Footer";

const TRUST_POINTS = [
  { label: "Quality people, fast" },
  { label: "Reliable and honest" },
  { label: "Industry specialists" },
  { label: "Safety & compliance first" },
  { label: "Support every step" },
];

const HERO_IMAGES = [
  { src: "/hero/Hero Warehouse.png", alt: "Warehouse worker" },
  { src: "/hero/Hero Driving.png", alt: "HGV driver" },
  { src: "/hero/Hero Manufacturing.png", alt: "Manufacturing worker" },
  { src: "/hero/Hero Engineering.png", alt: "Engineer" },
];

const INDUSTRY_IMAGES: Record<string, { src: string; alt: string }> = {
  Driving: { src: "/industries/industry-driving.png", alt: "HGV driver on the road" },
  Warehousing: { src: "/industries/industry-warehousing.png", alt: "Warehouse forklift operator" },
  Manufacturing: { src: "/industries/industry-manufacturing.png", alt: "Manufacturing worker welding" },
  Engineering: { src: "/industries/industry-engineering.png", alt: "Engineer at work" },
};

const FEATURES = [
  {
    title: "Real-time updates",
    description: "Know what's happening, right now.",
  },
  {
    title: "Simplified compliance",
    description: "Everything in one place, always up to date.",
  },
  {
    title: "Better communication",
    description: "Connect your team, anytime, anywhere.",
  },
  {
    title: "Powerful reporting",
    description: "Make smarter decisions with live insights.",
  },
];

const APP_SCREENS = [
  {
    persona: "Candidate app",
    tab: "Home",
    heading: "Good morning, James",
    items: [
      { title: "My Shifts", sub: "View your upcoming shifts" },
      { title: "Messages", sub: "Stay in the loop" },
      { title: "Timesheets", sub: "Submit and approve" },
      { title: "Documents", sub: "Access important docs" },
    ],
  },
  {
    persona: "Candidate app",
    tab: "Shifts",
    heading: "Your shifts",
    items: [
      { title: "Today, 8:00 - 16:00", sub: "Amazon Fulfilment, Coventry" },
      { title: "Tomorrow, 6:00 - 14:00", sub: "DHL Logistics, Birmingham" },
      { title: "Thu, 14:00 - 22:00", sub: "Amazon Fulfilment, Coventry" },
      { title: "Fri, 8:00 - 16:00", sub: "JCB Manufacturing, Rocester" },
    ],
  },
  {
    persona: "Candidate app",
    tab: "Messages",
    heading: "Messages",
    items: [
      { title: "Reach Network", sub: "Your timesheet was approved ✅" },
      { title: "Site Supervisor", sub: "Please arrive 15 mins early tomorrow" },
      { title: "Reach Network", sub: "New shift available near you" },
      { title: "Payroll", sub: "Your payslip is ready to view" },
    ],
  },
  {
    persona: "Client portal",
    tab: "Dashboard",
    heading: "Welcome back, Sarah",
    items: [
      { title: "Active workers today", sub: "38 on shift across 3 sites" },
      { title: "Pending approvals", sub: "6 timesheets need review" },
      { title: "Open requests", sub: "2 new staffing requests" },
      { title: "Compliance alerts", sub: "1 document expiring soon" },
    ],
  },
  {
    persona: "Client portal",
    tab: "Timesheets",
    heading: "Timesheet approvals",
    items: [
      { title: "J. Mensah — Warehouse", sub: "38.5 hrs · Awaiting approval" },
      { title: "R. Nowak — Driving", sub: "42 hrs · Awaiting approval" },
      { title: "A. Khan — Manufacturing", sub: "36 hrs · Approved" },
      { title: "L. Evans — Engineering", sub: "40 hrs · Approved" },
    ],
  },
  {
    persona: "Client portal",
    tab: "Workforce",
    heading: "Your workforce",
    items: [
      { title: "Amazon Fulfilment, Coventry", sub: "14 workers placed" },
      { title: "DHL Logistics, Birmingham", sub: "9 workers placed" },
      { title: "JCB Manufacturing, Rocester", sub: "11 workers placed" },
      { title: "New request", sub: "Book more staff" },
    ],
  },
] as const;

const STATS = [
  { value: "20+", label: "Years of industry experience" },
  { value: "1000s", label: "People placed every year" },
  { value: "Dedicated", label: "Account managers who care" },
  { value: "Trusted by", label: "Businesses across the UK" },
];

const INDUSTRIES = [
  {
    title: "Driving",
    description: "HGV, LGV, 7.5t, ADR and driver support roles.",
  },
  {
    title: "Warehousing",
    description: "Warehouse operatives, FLT, pickers, packers and more.",
  },
  {
    title: "Manufacturing",
    description: "Production, assembly, machine operators and more.",
  },
  {
    title: "Engineering",
    description: "Skilled engineers, technicians and industrial specialists.",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "Reach Network always deliver the right people, when we need them.",
    name: "Operations Manager",
    company: "Logistics Company",
  },
  {
    quote:
      "Great communication, reliable staff and a team that genuinely cares.",
    name: "HR Manager",
    company: "Manufacturing Business",
  },
  {
    quote: "Professional, efficient and a refreshingly different approach.",
    name: "Site Manager",
    company: "Engineering Company",
  },
];

function PlaceholderPanel({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-br from-navy via-navy to-navy-deep ${className}`}
    >
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle at 30% 20%, rgba(247,147,30,0.5), transparent 55%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, #fff 0px, #fff 1px, transparent 1px, transparent 14px)",
        }}
      />
    </div>
  );
}

function StarRow({ count = 5, color = "text-emerald-500" }: { count?: number; color?: string }) {
  return (
    <div className={`flex gap-0.5 ${color}`} aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <svg key={i} viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
          <path d="M10 1.5l2.6 5.6 6.1.6-4.6 4.1 1.3 6-5.4-3.1-5.4 3.1 1.3-6-4.6-4.1 6.1-.6z" />
        </svg>
      ))}
    </div>
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
      { label: "FAQ", href: "/book-a-call#faq" },
    ],
  },
];

export default function Home() {
  const [screenIndex, setScreenIndex] = useState(0);
  const activeScreen = APP_SCREENS[screenIndex];
  const [menuOpen, setMenuOpen] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setScreenIndex((current) => (current + 1) % APP_SCREENS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="overflow-x-hidden font-body">
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-navy">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-orange">
              <span className="h-3 w-3 rounded-full bg-orange" />
            </span>
            <span className="font-display leading-none">
              <span className="block text-lg font-extrabold tracking-tight text-white">
                REACH
              </span>
              <span className="block text-[9px] font-semibold tracking-[0.2em] text-white/60">
                NETWORK RECRUITMENT
              </span>
            </span>
          </Link>

          <div className="flex shrink-0 items-center gap-3">
            <a href="tel:01216301643" className="hidden shrink-0 items-center gap-2 whitespace-nowrap text-sm font-semibold text-white/85 transition hover:text-white sm:flex">
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0">
                <path d="M3.5 2.5A1.5 1.5 0 0 1 5 1h1.3a1.5 1.5 0 0 1 1.46 1.16l.62 2.68a1.5 1.5 0 0 1-.4 1.42l-1.1 1.1a11.5 11.5 0 0 0 5 5l1.1-1.1a1.5 1.5 0 0 1 1.42-.4l2.68.62A1.5 1.5 0 0 1 18 12.7V14a1.5 1.5 0 0 1-1.5 1.5C8.5 15.5 3.5 10.5 3.5 2.5z" />
              </svg>
              0121 630 1643
            </a>
            <Link
              href="/book-a-call"
              className="hidden rounded-full bg-orange px-5 py-2.5 text-sm font-bold text-white transition hover:bg-orange-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:block"
            >
              Let&rsquo;s Talk
            </Link>

            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
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

        {/* Collapsible menu panel */}
        <div
          className={`overflow-hidden border-t border-white/10 bg-navy transition-[max-height] duration-300 ease-in-out ${
            menuOpen ? "max-h-96" : "max-h-0 border-t-0"
          }`}
        >
          <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-6 py-4 lg:px-8">
            {NAV_SECTIONS.map((section) => (
              <div key={section.label}>
                <button
                  type="button"
                  onClick={() => setOpenSection(openSection === section.label ? null : section.label)}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-left text-sm font-semibold text-white/85 transition hover:bg-white/5 hover:text-white"
                >
                  {section.label}
                  <svg
                    viewBox="0 0 12 12"
                    className={`h-3 w-3 opacity-60 transition-transform ${openSection === section.label ? "rotate-180" : ""}`}
                    fill="none"
                  >
                    <path
                      d="M2.5 4.5 6 8l3.5-3.5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                {openSection === section.label && (
                  <div className="ml-3 flex flex-col gap-0.5 border-l border-white/10 pl-3">
                    {section.links.map((link) => (
                      <Link
                        key={link.label}
                        href={link.href}
                        className="rounded-lg px-3 py-2 text-left text-xs font-semibold text-white/70 transition hover:bg-white/5 hover:text-white"
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <Link
              href="/contact-us"
              className="rounded-lg px-3 py-3 text-sm font-semibold text-white/85 transition hover:bg-white/5 hover:text-white"
            >
              Contact us
            </Link>

            <div className="mt-2 flex flex-col gap-3 border-t border-white/10 pt-4 sm:hidden">
              <a href="tel:01216301643" className="flex items-center gap-2 px-3 text-sm font-semibold text-white/85">
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0">
                  <path d="M3.5 2.5A1.5 1.5 0 0 1 5 1h1.3a1.5 1.5 0 0 1 1.46 1.16l.62 2.68a1.5 1.5 0 0 1-.4 1.42l-1.1 1.1a11.5 11.5 0 0 0 5 5l1.1-1.1a1.5 1.5 0 0 1 1.42-.4l2.68.62A1.5 1.5 0 0 1 18 12.7V14a1.5 1.5 0 0 1-1.5 1.5C8.5 15.5 3.5 10.5 3.5 2.5z" />
                </svg>
                0121 630 1643
              </a>
              <Link
                href="/book-a-call"
                className="mx-3 rounded-full bg-orange px-5 py-2.5 text-center text-sm font-bold text-white transition hover:bg-orange-dark"
              >
                Let&rsquo;s Talk
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section className="relative isolate overflow-hidden bg-navy">
        {/* Full-bleed background image strip */}
        <div className="absolute inset-0 min-h-[480px] grid grid-cols-2 sm:grid-cols-4">
          {HERO_IMAGES.map((img) => (
            <div key={img.src} className="relative h-full w-full">
              <Image
                src={img.src}
                alt={img.alt}
                fill
                sizes="(max-width: 640px) 50vw, 25vw"
                className="object-cover object-top"
                priority
              />
            </div>
          ))}
        </div>

        {/* Dark gradient overlay so text stays readable */}
        <div className="absolute inset-0 bg-gradient-to-b from-navy/60 via-navy/85 to-navy" />

        <div className="relative mx-auto max-w-4xl px-6 pb-14 pt-28 text-center sm:pt-36 lg:px-8 lg:pt-44">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange">
            Recruitment done different
          </p>

          <h1 className="font-display mt-4 text-4xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl">
            Connecting great people with
            <br className="hidden sm:block" /> great{" "}
            <span className="text-orange">opportunities.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base text-white/70 sm:text-lg">
            We go beyond recruitment to deliver the right people, the right
            support and the right results.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/i-need-staff"
              className="flex items-center gap-1.5 rounded-full bg-orange px-7 py-3.5 text-sm font-bold text-white transition hover:bg-orange-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              I need staff
              <span aria-hidden="true">&rarr;</span>
            </Link>
            <Link
              href="/looking-for-work"
              className="flex items-center gap-1.5 rounded-full border border-white/30 px-7 py-3.5 text-sm font-bold text-white transition hover:border-white/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              I&rsquo;m looking for work
              <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        </div>

        <div className="relative mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-10 gap-y-4 border-t border-white/10 px-6 pb-8 pt-8 lg:px-8">
          {TRUST_POINTS.map((point) => (
            <div key={point.label} className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-orange/40 text-orange">
                <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
                  <path d="M6.2 10.9 3.5 8.2l1-1 1.7 1.7 4.6-4.6 1 1z" />
                </svg>
              </span>
              <span className="text-xs font-semibold text-white/75 sm:text-sm">
                {point.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* SMARTER RECRUITMENT / PRODUCT PREVIEW */}
      <section className="bg-cream py-20 lg:py-28">
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-6 lg:grid-cols-[1fr_1.1fr_1fr] lg:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange">
              Smarter recruitment
            </p>
            <h2 className="font-display mt-4 text-3xl font-extrabold leading-tight tracking-tight text-navy sm:text-4xl">
              More than recruitment. Built around you.
            </h2>
            <p className="mt-5 text-slate-600">
              Our technology, ReachConnect, gives you real-time visibility,
              better communication and complete control over your workforce.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/book-a-demo"
                className="rounded-full bg-orange px-6 py-3 text-sm font-bold text-white transition hover:bg-orange-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
              >
                Book a demo
              </Link>
              <Link
                href="/book-a-call"
                className="rounded-full border border-navy/20 px-6 py-3 text-sm font-bold text-navy transition hover:border-navy/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
              >
                Book a call
              </Link>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[220px] overflow-hidden py-6 sm:max-w-[300px] sm:overflow-visible">
            {/* Floating shadow beneath the phone */}
            <div className="absolute inset-x-6 bottom-2 h-8 rounded-full bg-black/30 blur-2xl" />

            <div className="relative sm:-rotate-6 transition-transform duration-500 sm:hover:rotate-0">
              <div className="relative aspect-[9/19.5] rounded-[3rem] border-[8px] border-navy bg-navy shadow-2xl drop-shadow-2xl">
                {/* Dynamic Island */}
                <div className="absolute left-1/2 top-3 z-10 h-6 w-24 -translate-x-1/2 rounded-full bg-navy" />

                {/* Side buttons */}
                <div className="absolute -left-[8px] top-24 h-6 w-[8px] rounded-l-sm bg-navy" />
                <div className="absolute -left-[8px] top-36 h-10 w-[8px] rounded-l-sm bg-navy" />
                <div className="absolute -right-[8px] top-32 h-14 w-[8px] rounded-r-sm bg-navy" />

                <div className="flex h-full flex-col overflow-hidden rounded-[2.4rem] bg-slate-50">
                  <div className="flex items-center justify-between bg-navy px-4 pb-3 pt-9">
                    <div>
                      <span className="inline-block rounded-full bg-orange/20 px-2 py-0.5 text-[7px] font-bold uppercase tracking-wide text-orange">
                        {activeScreen.persona}
                      </span>
                      <p className="mt-1 text-[9px] font-semibold text-white/60">
                        {activeScreen.heading}
                      </p>
                      <p className="font-display text-xs font-bold text-white">
                        Reach<span className="text-orange">Connect</span>
                      </p>
                    </div>
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-white/70">
                      <svg viewBox="0 0 20 20" fill="currentColor" className="h-2.5 w-2.5">
                        <path d="M10 2a5 5 0 0 0-5 5v3.2l-1 2.3h12l-1-2.3V7a5 5 0 0 0-5-5z" />
                      </svg>
                    </span>
                  </div>

                  <div key={screenIndex} className="flex-1 space-y-1.5 overflow-hidden p-2.5 animate-[fadeIn_0.4s_ease]">
                    {activeScreen.items.map((item, itemIndex) => (
                      <div
                        key={`${item.title}-${itemIndex}`}
                        className="rounded-lg bg-navy px-3 py-2.5"
                      >
                        <p className="text-[11px] font-bold text-white">
                          {item.title}
                        </p>
                        <p className="mt-0.5 text-[9px] leading-tight text-white/50">
                          {item.sub}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-around border-t border-slate-200 bg-white px-2 py-2.5">
                    {APP_SCREENS.filter((s) => s.persona === activeScreen.persona).map((s) => (
                      <span
                        key={s.tab}
                        className={`text-[8px] font-semibold transition-colors duration-500 ${
                          s.tab === activeScreen.tab ? "text-orange" : "text-slate-400"
                        }`}
                      >
                        {s.tab}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <ul className="space-y-6">
            {FEATURES.map((feature) => (
              <li key={feature.title} className="flex items-start gap-3.5">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-orange/30 text-orange">
                  <svg viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4">
                    <circle cx="8" cy="8" r="3" />
                  </svg>
                </span>
                <div>
                  <p className="font-display text-sm font-bold text-navy">
                    {feature.title}
                  </p>
                  <p className="mt-0.5 text-sm text-slate-500">
                    {feature.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* STATS BAND */}
      <section className="bg-navy py-14">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 lg:grid-cols-[1fr_2fr] lg:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange">
              We do things differently
            </p>
            <h2 className="font-display mt-4 text-2xl font-extrabold leading-snug tracking-tight text-white sm:text-3xl">
              People first. Service always. Results that last.
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {STATS.map((stat) => (
              <div key={stat.label}>
                <p className="font-display whitespace-nowrap text-xl font-extrabold text-white sm:text-2xl">
                  {stat.value}
                </p>
                <p className="mt-1.5 text-xs text-white/60 sm:text-sm">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* INDUSTRIES */}
      <section className="bg-white py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange">
                Specialist recruitment across key industries
              </p>
              <h2 className="font-display mt-4 max-w-xl text-3xl font-extrabold leading-tight tracking-tight text-navy sm:text-4xl">
                We know your industry. We speak your language.
              </h2>
            </div>
            <Link href="/industries" className="flex items-center gap-1.5 text-sm font-bold text-orange hover:text-orange-dark">
              View all industries <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {INDUSTRIES.map((industry) => (
              <div
                key={industry.title}
                className="group relative aspect-[3/4] overflow-hidden rounded-2xl"
              >
                <Image
                  src={INDUSTRY_IMAGES[industry.title].src}
                  alt={INDUSTRY_IMAGES[industry.title].alt}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover object-top transition duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/60 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border border-orange/40 text-orange">
                    <svg viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4">
                      <rect x="3" y="6" width="10" height="7" rx="1" />
                      <path d="M5 6V4.5A1.5 1.5 0 0 1 6.5 3h3A1.5 1.5 0 0 1 11 4.5V6" />
                    </svg>
                  </span>
                  <p className="font-display mt-3.5 text-base font-extrabold text-white">
                    {industry.title}
                  </p>
                  <p className="mt-1.5 text-xs text-white/60">
                    {industry.description}
                  </p>
                  <Link href="/looking-for-work" className="mt-4 flex items-center gap-1 text-xs font-bold text-orange">
                    View roles <span aria-hidden="true">&rarr;</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="bg-slate-50 py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange">
                Don&rsquo;t just take our word for it
              </p>
              <h2 className="font-display mt-4 max-w-lg text-3xl font-extrabold leading-tight tracking-tight text-navy sm:text-4xl">
                Trusted by businesses. Recommended by people.
              </h2>
            </div>

            <a
              href="https://uk.trustpilot.com/review/reachnetworkrec.com"
              target="_blank"
              rel="noopener noreferrer"
              className="group/tp"
            >
              <p className="text-sm font-bold text-emerald-600">&#9733; Trustpilot</p>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex gap-0.5 rounded bg-emerald-500 px-2 py-1 transition group-hover/tp:bg-emerald-600">
                  <StarRow color="text-white" />
                </div>
              </div>
              <p className="mt-2 text-xs text-slate-500 underline-offset-2 group-hover/tp:underline">
                <span className="font-bold text-navy">Great</span> &middot;
                4.0 out of 5 &middot; Based on 3 reviews
              </p>
            </a>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <div
                key={t.name}
                className="rounded-2xl border border-slate-200 bg-white p-6"
              >
                <StarRow />
                <p className="mt-4 text-sm text-slate-700">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <p className="font-display mt-5 text-sm font-bold text-navy">
                  {t.name}
                </p>
                <p className="text-xs text-slate-500">{t.company}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CANDIDATE CTA */}
      <section className="relative isolate overflow-hidden bg-navy py-24 lg:py-32">
        <div className="absolute inset-0">
          <Image
            src="/PlaceholderPanel/coverphoto.png"
            alt="Candidate ready to register for work"
            fill
            sizes="100vw"
            className="object-cover object-top"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/85 to-navy/20" />

        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="max-w-lg">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange">
              Looking for your next opportunity?
            </p>
            <h2 className="font-display mt-4 text-2xl font-extrabold leading-tight tracking-tight text-white sm:text-3xl">
              Register today and let us help you find the right role.
            </h2>

            <button className="mt-7 flex items-center gap-1.5 rounded-full bg-orange px-7 py-3.5 text-sm font-bold text-white transition hover:bg-orange-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
              Register as a candidate <span aria-hidden="true">&rarr;</span>
            </button>

            <ul className="mt-8 space-y-3">
              {[
                "Access 100s of live roles",
                "Free and easy to register",
                "We'll match you with the right opportunities",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2.5 text-sm text-white/80">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-orange/40 text-orange">
                    <svg viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3">
                      <path d="M6.2 10.9 3.5 8.2l1-1 1.7 1.7 4.6-4.6 1 1z" />
                    </svg>
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <Footer />
    </main>
  );
}