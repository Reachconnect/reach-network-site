"use client";

// Homepage
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import Footer from "./components/Footer";
import type { CoverageArea } from "./industries/CoverageMap";

const CoverageMap = dynamic(() => import("./industries/CoverageMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-white/5" />,
});

export type HomeJob = { key: string; title: string; category: string; location: string | null; salary: string | null; employment_type: string | null; href: string };

const SECTORS = [
  { key: "drivers", label: "Driving", roles: "Class 1, Class 2, 7.5t and delivery drivers", img: "/hero/Hero Driving.png", href: "/industries/drivers" },
  { key: "warehouse", label: "Warehouse", roles: "Pickers, packers, FLT and team leaders", img: "/hero/Hero Warehouse.png", href: "/industries/warehouse" },
  { key: "manufacturing", label: "Manufacturing", roles: "Production, food and machine operators", img: "/hero/Hero Manufacturing.png", href: "/industries/manufacturing" },
  { key: "engineering", label: "Engineering", roles: "Maintenance, multi-skilled and technical", img: "/hero/Hero Engineering.png", href: "/industries/engineering" },
];

const WORDS = ["Class 1 drivers", "warehouse teams", "FLT operators", "production staff", "maintenance engineers", "delivery drivers"];

const MARQUEE = ["Class 1 drivers", "Class 2 drivers", "7.5t drivers", "Multi-drop", "Pickers and packers", "Reach truck", "Counterbalance FLT", "Team leaders", "Production operatives", "Food production", "Machine operators", "Maintenance engineers", "Multi-skilled engineers", "Electrical engineers"];

const FEED = [
  { who: "J. Mensah", what: "clocked in", where: "Coventry fulfilment centre", tone: "green" },
  { who: "Timesheet", what: "approved", where: "Birmingham distribution hub", tone: "orange" },
  { who: "R. Nowak", what: "clocked in", where: "Uttoxeter assembly plant", tone: "green" },
  { who: "New request", what: "4 × FLT, nights", where: "Coventry fulfilment centre", tone: "navy" },
  { who: "A. Khan", what: "clocked out", where: "Birmingham distribution hub", tone: "slate" },
  { who: "L. Evans", what: "clocked in", where: "Uttoxeter assembly plant", tone: "green" },
];

const STEPS = [
  { title: "Tell us what you need", body: "Roles, site, shifts and pay. By phone, online or in Reach Connect.", icon: "M21 12a8 8 0 0 1-11.8 7L4 20l1-4.6A8 8 0 1 1 21 12z" },
  { title: "We send checked people", body: "ID, right to work, history and licences checked before they arrive.", icon: "M9 12l2 2 4-4m5.6-4A11.96 11.96 0 0 1 12 2.9 11.96 11.96 0 0 1 3.4 6 12 12 0 0 0 12 21a12 12 0 0 0 8.6-15z" },
  { title: "You see it all, live", body: "Clock-ins, timesheets and costs by site in Reach Connect.", icon: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zm11 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" },
];

const WHY = [
  { title: "Specialists", body: "Four sectors, known inside out." },
  { title: "Checked", body: "The same checks, every worker." },
  { title: "Live", body: "Reach Connect shows everything." },
  { title: "Honest", body: "Straight answers on pay and time." },
];

function Icon({ d, className = "h-5 w-5" }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d={d} />
    </svg>
  );
}

// Fades and lifts content into view as you scroll
function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") return setShown(true);
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ transitionDelay: `${delay}ms` }} className={`transition duration-700 ease-out ${shown ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"} ${className}`}>
      {children}
    </div>
  );
}

function RotatingWord() {
  const [n, setN] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setN((x) => (x + 1) % WORDS.length), 2200);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="relative inline-block h-[1.15em] overflow-hidden align-bottom">
      <span key={n} className="block animate-[wordIn_.55s_cubic-bezier(.2,.8,.2,1)] bg-gradient-to-r from-orange to-amber-300 bg-clip-text text-transparent">
        {WORDS[n]}
      </span>
    </span>
  );
}

// Four tall photo panels; the active one opens out
function HeroPanels() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setActive((a) => (a + 1) % SECTORS.length), 4000);
    return () => clearInterval(t);
  }, [paused]);
  return (
    <div onMouseLeave={() => setPaused(false)} className="flex h-[440px] gap-2 sm:h-[520px] lg:h-[580px]">
      {SECTORS.map((s, n) => {
        const on = active === n;
        return (
          <Link
            key={s.key}
            href={s.href}
            onMouseEnter={() => {
              setActive(n);
              setPaused(true);
            }}
            onFocus={() => setActive(n)}
            className={`group relative overflow-hidden rounded-3xl ring-1 ring-white/10 transition-all duration-700 ease-[cubic-bezier(.2,.8,.2,1)] ${on ? "flex-[5]" : "flex-[1]"}`}
          >
            <Image src={s.img} alt={`${s.label} worker`} fill priority={n === 0} sizes="(max-width: 1024px) 60vw, 30vw" className={`object-cover transition duration-[1.6s] ${on ? "scale-105" : "scale-125 grayscale-[40%]"}`} />
            <div className={`absolute inset-0 transition duration-700 ${on ? "bg-gradient-to-t from-navy via-navy/20 to-transparent" : "bg-navy/55"}`} />
            <span className={`absolute bottom-6 left-1/2 origin-center -translate-x-1/2 -rotate-90 whitespace-nowrap font-display text-sm font-bold uppercase tracking-[0.25em] text-white transition duration-500 ${on ? "opacity-0" : "opacity-90"}`} style={{ bottom: "4.5rem" }}>
              {s.label}
            </span>
            <div className={`absolute inset-x-0 bottom-0 p-5 transition duration-500 sm:p-6 ${on ? "translate-y-0 opacity-100 delay-200" : "translate-y-6 opacity-0"}`}>
              <span className="inline-flex items-center gap-2 rounded-full bg-orange px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> {s.label}
              </span>
              <p className="mt-3 max-w-[16rem] font-display text-xl font-extrabold leading-tight text-white sm:text-2xl">{s.roles}</p>
              <p className="mt-2 text-sm font-bold text-orange">Explore {s.label.toLowerCase()} →</p>
            </div>
            {on && !paused && <span className="absolute left-0 top-0 h-1 animate-[bar_4s_linear] bg-orange" />}
          </Link>
        );
      })}
    </div>
  );
}

function LiveCard() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % FEED.length), 2600);
    return () => clearInterval(t);
  }, []);
  const f = FEED[i];
  const dot = f.tone === "green" ? "bg-green-500" : f.tone === "orange" ? "bg-orange" : f.tone === "navy" ? "bg-navy" : "bg-slate-400";
  return (
    <div className="w-72 rounded-2xl border border-white/20 bg-white/90 p-4 shadow-2xl backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
          <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" /><span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" /></span>
          Live in Reach Connect
        </p>
        <span className="text-[10px] text-slate-400">just now</span>
      </div>
      <div key={i} className="mt-3 flex animate-[feedIn_.5s_ease] items-center gap-3">
        <span className={`h-9 w-9 flex-none rounded-full ${dot} flex items-center justify-center text-xs font-bold text-white`}>{f.who.slice(0, 1)}</span>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-navy">
            {f.who} <span className="font-medium text-slate-500">{f.what}</span>
          </p>
          <p className="truncate text-xs text-slate-500">{f.where}</p>
        </div>
      </div>
    </div>
  );
}

// A small animated Reach Connect board, with demo numbers
function DemoBoard() {
  const [onSite, setOnSite] = useState(38);
  const [feed, setFeed] = useState(FEED.slice(0, 4));
  useEffect(() => {
    let n = 4;
    const t = setInterval(() => {
      const next = FEED[n % FEED.length];
      n++;
      setFeed((p) => [next, ...p].slice(0, 4));
      setOnSite((v) => (next.what === "clocked in" ? v + 1 : next.what === "clocked out" ? v - 1 : v));
    }, 2400);
    return () => clearInterval(t);
  }, []);
  const sites = [
    { name: "Coventry fulfilment centre", on: Math.round(onSite * 0.42), of: 18 },
    { name: "Birmingham distribution hub", on: Math.round(onSite * 0.32), of: 14 },
    { name: "Uttoxeter assembly plant", on: onSite - Math.round(onSite * 0.42) - Math.round(onSite * 0.32), of: 12 },
  ];
  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5">
      <div className="flex items-center gap-1.5 border-b border-slate-100 bg-slate-50 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
        <span className="ml-3 rounded-md bg-white px-3 py-0.5 text-[11px] text-slate-400 ring-1 ring-slate-200">reachnetworkconnect.com</span>
        <span className="ml-auto rounded-full bg-orange/10 px-2 py-0.5 text-[10px] font-bold text-orange">DEMO</span>
      </div>
      <div className="grid gap-4 p-5 sm:grid-cols-[1.1fr_1fr]">
        <div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { l: "On site", v: onSite, c: "text-green-600" },
              { l: "To approve", v: 6, c: "text-orange" },
              { l: "Requests", v: 2, c: "text-navy" },
            ].map((k) => (
              <div key={k.l} className="rounded-xl bg-slate-50 p-3">
                <p className={`font-display text-2xl font-extrabold tabular-nums ${k.c}`}>{k.v}</p>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{k.l}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 space-y-2.5">
            {sites.map((s) => (
              <div key={s.name}>
                <div className="flex justify-between text-xs">
                  <span className="truncate font-semibold text-navy">{s.name}</span>
                  <span className="tabular-nums text-slate-500">
                    {s.on}/{s.of}
                  </span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-gradient-to-r from-orange to-amber-400 transition-all duration-700" style={{ width: `${Math.min(100, (s.on / s.of) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Activity</p>
          <ul className="mt-2 space-y-2">
            {feed.map((f, n) => (
              <li key={`${f.who}-${f.what}-${n}-${feed.length}`} className={`flex items-center gap-2.5 rounded-xl border border-slate-100 p-2.5 ${n === 0 ? "animate-[feedIn_.5s_ease]" : ""}`}>
                <span className={`h-2 w-2 flex-none rounded-full ${f.tone === "green" ? "bg-green-500" : f.tone === "orange" ? "bg-orange" : f.tone === "navy" ? "bg-navy" : "bg-slate-400"}`} />
                <span className="min-w-0 text-xs">
                  <span className="font-bold text-navy">{f.who}</span> <span className="text-slate-500">{f.what}</span>
                  <span className="block truncate text-[11px] text-slate-400">{f.where}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
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
      { label: "FAQ", href: "/faq" },
    ],
  },
];

export default function HomeClient({ jobs, jobCount }: { jobs: HomeJob[]; jobCount: number }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [areas, setAreas] = useState<CoverageArea[]>([]);
  const [total, setTotal] = useState(0);
  const [video, setVideo] = useState(false);
  const [bar, setBar] = useState(false);
  const [who, setWho] = useState<"employer" | "candidate">("employer");

  useEffect(() => {
    fetch("/api/public/coverage?sector=all")
      .then((r) => r.json())
      .then((j) => {
        setAreas(((j.areas ?? []) as { key: string; label: string; lat: number; lng: number; all?: number; count?: number }[]).map((a) => ({ key: a.key, label: a.label, lat: a.lat, lng: a.lng, count: a.count ?? a.all ?? 0 })));
        setTotal(j.total ?? 0);
      })
      .catch(() => {});
    const onScroll = () => setBar(window.scrollY > 700);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <main className="overflow-x-hidden font-body">
      <style>{`
        @keyframes wordIn{from{transform:translateY(100%);opacity:0}to{transform:none;opacity:1}}
        @keyframes feedIn{from{transform:translateY(-8px);opacity:0}to{transform:none;opacity:1}}
        @keyframes bar{from{width:0}to{width:100%}}
        @keyframes marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        @keyframes drift{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(40px,-30px) scale(1.1)}}
        @keyframes floaty{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
        @media (prefers-reduced-motion: reduce){*{animation:none!important;transition:none!important}}
      `}</style>
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
        <div className="pointer-events-none absolute -left-32 top-10 h-[420px] w-[420px] animate-[drift_14s_ease-in-out_infinite] rounded-full bg-orange/25 blur-[120px]" />
        <div className="pointer-events-none absolute -right-20 bottom-0 h-[380px] w-[380px] animate-[drift_18s_ease-in-out_infinite_reverse] rounded-full bg-sky-500/15 blur-[120px]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "radial-gradient(#fff 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-5 pb-14 pt-10 sm:px-6 lg:grid-cols-[1fr_1.05fr] lg:gap-12 lg:px-8 lg:pb-20 lg:pt-14">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-bold text-white/80 backdrop-blur">
              <span className="h-2 w-2 animate-pulse rounded-full bg-orange" />
              Specialist recruitment · Bromsgrove, working UK-wide
            </p>
            <h1 className="mt-6 font-display text-[2.6rem] font-extrabold leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-[4.2rem]">
              We find your
              <br />
              <RotatingWord />
              <br />
              <span className="text-white/90">and show you</span> <span className="relative whitespace-nowrap">it all, live.<svg viewBox="0 0 300 12" className="absolute -bottom-2 left-0 w-full text-orange" preserveAspectRatio="none"><path d="M2 9C80 2 220 2 298 8" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" /></svg></span>
            </h1>
            <p className="mt-7 max-w-lg text-lg leading-relaxed text-white/75">
              Checked drivers, warehouse, manufacturing and engineering staff, with Reach Connect showing who&apos;s on site, timesheets and costs as they happen.
            </p>
            <div className="mt-8 grid gap-3 sm:flex">
              <Link href="/i-need-staff#request" className="group flex items-center justify-center gap-3 rounded-full bg-orange px-8 py-4 font-bold text-white shadow-xl shadow-orange/30 transition hover:-translate-y-0.5 hover:bg-orange-dark">
                I need staff <span className="transition group-hover:translate-x-1">→</span>
              </Link>
              <Link href="/looking-for-work" className="flex items-center justify-center gap-2 rounded-full border border-white/25 bg-white/5 px-8 py-4 font-bold text-white backdrop-blur transition hover:bg-white/15">
                I&apos;m looking for work
                {jobCount > 0 && <span className="rounded-full bg-orange px-2 py-0.5 text-xs">{jobCount} jobs</span>}
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/70">
              {["Every worker checked", "Live clock-ins", "One weekly invoice"].map((x) => (
                <span key={x} className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange/20 text-[10px] font-bold text-orange">✓</span>
                  {x}
                </span>
              ))}
            </div>
          </div>
          <div className="relative">
            <HeroPanels />
            <div className="absolute -bottom-6 -left-4 hidden animate-[floaty_6s_ease-in-out_infinite] sm:block lg:-left-10">
              <LiveCard />
            </div>
          </div>
        </div>

        {/* MARQUEE */}
        <div className="relative border-y border-white/10 bg-navy-deep/60 py-4">
          <div className="flex w-max animate-[marquee_40s_linear_infinite] gap-10 whitespace-nowrap">
            {[...MARQUEE, ...MARQUEE].map((m, n) => (
              <span key={n} className="flex items-center gap-10 font-display text-sm font-bold uppercase tracking-[0.2em] text-white/50">
                {m} <span className="text-orange">✦</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* TWO DOORS */}
      <section className="bg-white py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <Reveal>
            <p className="text-center text-xs font-bold uppercase tracking-[0.25em] text-orange">Start here</p>
            <h2 className="mt-3 text-center font-display text-3xl font-extrabold text-navy sm:text-4xl">What brings you to Reach?</h2>
          </Reveal>
          <div className="mt-10 grid gap-5 lg:grid-cols-2">
            <Reveal>
              <Link href="/i-need-staff" className="group relative flex min-h-[340px] flex-col justify-end overflow-hidden rounded-3xl bg-navy p-8 text-white sm:p-10">
                <Image src="/industries/needstaff.png" alt="" fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover opacity-40 transition duration-700 group-hover:scale-105 group-hover:opacity-50" />
                <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/70 to-transparent" />
                <div className="relative">
                  <span className="rounded-full bg-orange px-3 py-1 text-xs font-bold uppercase tracking-wider">For employers</span>
                  <p className="mt-4 font-display text-3xl font-extrabold sm:text-4xl">I need staff</p>
                  <p className="mt-2 max-w-md text-white/75">Temporary, temp-to-perm or permanent. Checked people, and Reach Connect for temporary staffing clients.</p>
                  <div className="mt-6 flex flex-wrap gap-2 text-sm font-semibold">
                    {["Request staff", "Our services", "Book a call"].map((x) => (
                      <span key={x} className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 backdrop-blur">{x}</span>
                    ))}
                  </div>
                  <span className="mt-6 inline-flex items-center gap-2 font-bold text-orange">Get started <span className="transition group-hover:translate-x-1">→</span></span>
                </div>
              </Link>
            </Reveal>
            <Reveal delay={120}>
              <Link href="/looking-for-work" className="group relative flex min-h-[340px] flex-col justify-end overflow-hidden rounded-3xl bg-orange p-8 text-white sm:p-10">
                <Image src="/industries/lookingforwork.png" alt="" fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover opacity-30 mix-blend-multiply transition duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-orange-dark via-orange/70 to-transparent" />
                <div className="relative">
                  <span className="rounded-full bg-navy px-3 py-1 text-xs font-bold uppercase tracking-wider">For candidates</span>
                  <p className="mt-4 font-display text-3xl font-extrabold sm:text-4xl">I&apos;m looking for work</p>
                  <p className="mt-2 max-w-md text-white/90">Driving, warehouse, manufacturing and engineering jobs. Free, and you can apply in two minutes from your phone.</p>
                  <div className="mt-6 flex flex-wrap gap-2 text-sm font-semibold">
                    {[jobCount > 0 ? `${jobCount} live jobs` : "Live jobs", "Send your CV", "Job alerts"].map((x) => (
                      <span key={x} className="rounded-full border border-white/30 bg-white/15 px-3 py-1.5 backdrop-blur">{x}</span>
                    ))}
                  </div>
                  <span className="mt-6 inline-flex items-center gap-2 font-bold text-navy">Find work <span className="transition group-hover:translate-x-1">→</span></span>
                </div>
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      {/* REACH CONNECT */}
      <section className="relative overflow-hidden bg-slate-50 py-16 lg:py-24">
        <div className="pointer-events-none absolute right-0 top-0 h-96 w-96 rounded-full bg-orange/10 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 sm:px-6 lg:grid-cols-[1fr_1.2fr] lg:px-8">
          <Reveal>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange">Reach Connect</p>
            <h2 className="mt-3 font-display text-3xl font-extrabold leading-tight text-navy sm:text-5xl">
              Stop phoning round.
              <br />
              <span className="text-orange">Just look.</span>
            </h2>
            <p className="mt-5 max-w-md text-lg text-slate-600">Our temporary staffing clients see every site, live, in one place.</p>
            <ul className="mt-6 space-y-3">
              {["GPS and face-checked clock-ins", "Approve timesheets in a tap", "Costs and reports by site", "Request staff in seconds"].map((x) => (
                <li key={x} className="flex items-center gap-3 font-semibold text-navy">
                  <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-orange text-xs text-white">✓</span>
                  {x}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <button onClick={() => setVideo(true)} className="flex items-center gap-3 rounded-full bg-navy px-6 py-3.5 font-bold text-white transition hover:bg-navy-deep">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-orange text-[10px]">▶</span> Watch the 45-second tour
              </button>
              <Link href="/book-a-demo" className="rounded-full border border-slate-300 px-6 py-3.5 font-bold text-navy transition hover:border-navy">
                Book a demo
              </Link>
            </div>
          </Reveal>
          <Reveal delay={150}>
            <div className="relative">
              <div className="absolute -inset-4 rotate-2 rounded-[2rem] bg-gradient-to-br from-orange/30 to-navy/20 blur-xl" />
              <div className="relative">
                <DemoBoard />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-white py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange">How it works</p>
                <h2 className="mt-3 font-display text-3xl font-extrabold text-navy sm:text-4xl">Three steps. That&apos;s it.</h2>
              </div>
              <Link href="/how-it-works" className="font-bold text-orange hover:underline">
                See every step →
              </Link>
            </div>
          </Reveal>
          <div className="relative mt-12 grid gap-5 md:grid-cols-3">
            <div className="absolute left-[16%] right-[16%] top-10 hidden h-0.5 bg-gradient-to-r from-orange/0 via-orange/50 to-orange/0 md:block" />
            {STEPS.map((s, n) => (
              <Reveal key={s.title} delay={n * 120}>
                <div className="group relative h-full rounded-3xl border border-slate-200 bg-white p-7 text-center transition hover:-translate-y-1 hover:border-orange/50 hover:shadow-xl">
                  <span className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-navy text-orange shadow-lg ring-8 ring-white transition group-hover:bg-orange group-hover:text-white">
                    <Icon d={s.icon} className="h-8 w-8" />
                    <span className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-orange text-xs font-extrabold text-white ring-4 ring-white group-hover:bg-navy">{n + 1}</span>
                  </span>
                  <p className="mt-5 font-display text-xl font-bold text-navy">{s.title}</p>
                  <p className="mt-2 text-slate-600">{s.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* COVERAGE + WHY */}
      <section className="bg-navy py-16 lg:py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 sm:px-6 lg:grid-cols-[1fr_1.3fr] lg:px-8">
          <Reveal>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange">Why Reach</p>
            <h2 className="mt-3 font-display text-3xl font-extrabold text-white sm:text-4xl">
              {total > 0 ? (
                <>
                  <span className="text-orange">{total.toLocaleString("en-GB")}+</span> people ready to work across the UK
                </>
              ) : (
                "Our people, across the UK"
              )}
            </h2>
            <p className="mt-4 text-white/70">Based in Bromsgrove, with people right across the Midlands and drivers working UK-wide.</p>
            <div className="mt-8 grid grid-cols-2 gap-3">
              {WHY.map((w) => (
                <div key={w.title} className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-orange/40 hover:bg-white/10">
                  <p className="font-display text-lg font-bold text-orange">{w.title}</p>
                  <p className="mt-1 text-sm text-white/65">{w.body}</p>
                </div>
              ))}
            </div>
            {areas.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {areas.slice(0, 8).map((a) => (
                  <span key={a.key} className="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 text-xs font-semibold text-white/80 ring-1 ring-white/10">
                    <span className="h-1.5 w-1.5 rounded-full bg-orange" />
                    {a.label}
                    {a.count ? <span className="text-orange">{a.count}+</span> : null}
                  </span>
                ))}
              </div>
            )}
            <Link href="/why-choose-us" className="mt-6 inline-block font-bold text-orange hover:underline">
              Why choose us →
            </Link>
          </Reveal>
          <Reveal delay={120}>
            <div className="relative h-[380px] overflow-hidden rounded-3xl ring-1 ring-white/10 sm:h-[460px]">
              <CoverageMap areas={areas} unit="people" />
              <div className="pointer-events-none absolute right-4 top-4 z-[500] rounded-full bg-navy/80 px-3 py-1.5 text-xs font-bold text-white backdrop-blur">
                <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-orange" /> Where our people are
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* SECTORS */}
      <section className="bg-white py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <Reveal>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange">Our sectors</p>
            <h2 className="mt-3 font-display text-3xl font-extrabold text-navy sm:text-4xl">Four sectors. Done properly.</h2>
          </Reveal>
          <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {[
              { ...SECTORS[0], img: "/industries/industry-driving.png" },
              { ...SECTORS[1], img: "/industries/industry-warehousing.png" },
              { ...SECTORS[2], img: "/industries/industry-manufacturing.png" },
              { ...SECTORS[3], img: "/industries/industry-engineering.png" },
            ].map((s, n) => (
              <Reveal key={s.key} delay={n * 80}>
                <Link href={s.href} className="group relative block aspect-[3/4] overflow-hidden rounded-3xl">
                  <Image src={s.img} alt={s.label} fill sizes="(max-width: 1024px) 50vw, 25vw" className="scale-[1.1] object-cover transition duration-700 group-hover:scale-[1.2]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/30 to-transparent transition group-hover:from-navy group-hover:via-navy/50" />
                  <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
                    <p className="font-display text-xl font-extrabold text-white sm:text-2xl">{s.label}</p>
                    <p className="mt-1 hidden text-sm text-white/75 sm:block">{s.roles}</p>
                    <span className="mt-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-orange text-white transition group-hover:w-24 group-hover:justify-between group-hover:px-3">
                      <span className="hidden text-xs font-bold group-hover:inline">Explore</span>→
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* LATEST JOBS */}
      <section className="bg-slate-50 py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange">Latest jobs</p>
                <h2 className="mt-3 font-display text-3xl font-extrabold text-navy sm:text-4xl">Hiring now</h2>
              </div>
              <Link href="/looking-for-work" className="font-bold text-orange hover:underline">
                {jobCount > 0 ? `See all ${jobCount} jobs →` : "Find work →"}
              </Link>
            </div>
          </Reveal>
          {jobs.length > 0 ? (
            <div className="-mx-5 mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3">
              {jobs.map((j, n) => (
                <Reveal key={j.key} delay={n * 60} className="w-[82%] flex-none snap-start sm:w-auto">
                  <Link href={j.href} className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:border-orange/50 hover:shadow-xl">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-orange/10 px-2.5 py-0.5 text-xs font-bold text-orange">{j.category}</span>
                      {j.employment_type && <span className="rounded-full bg-navy/5 px-2.5 py-0.5 text-xs font-bold text-navy">{j.employment_type}</span>}
                    </div>
                    <p className="mt-3 font-display text-lg font-bold text-navy group-hover:text-orange">{j.title}</p>
                    <div className="mt-auto space-y-1 pt-4 text-sm text-slate-600">
                      {j.location && <p>📍 {j.location}</p>}
                      {j.salary && <p className="font-semibold text-navy">{j.salary}</p>}
                    </div>
                    <span className="mt-4 text-sm font-bold text-orange">View and apply →</span>
                  </Link>
                </Reveal>
              ))}
            </div>
          ) : (
            <div className="mt-8 rounded-3xl border-2 border-dashed border-slate-300 bg-white p-10 text-center">
              <p className="font-display text-xl font-bold text-navy">New jobs are added all the time</p>
              <p className="mt-2 text-slate-600">Send us your CV and we&apos;ll call you when something fits.</p>
              <Link href="/looking-for-work" className="mt-5 inline-block rounded-full bg-orange px-6 py-3 font-bold text-white">
                Send my CV
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative overflow-hidden bg-navy py-20 lg:py-28">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange/20 blur-[140px]" />
        <Reveal className="relative mx-auto max-w-3xl px-5 text-center sm:px-6">
          <h2 className="font-display text-4xl font-extrabold leading-tight text-white sm:text-6xl">
            Ready when <span className="text-orange">you are.</span>
          </h2>
          <div className="mx-auto mt-8 inline-flex rounded-full bg-white/10 p-1.5">
            {(["employer", "candidate"] as const).map((w) => (
              <button key={w} onClick={() => setWho(w)} className={`rounded-full px-5 py-2.5 text-sm font-bold transition ${who === w ? "bg-white text-navy" : "text-white/80"}`}>
                {w === "employer" ? "I'm hiring" : "I want work"}
              </button>
            ))}
          </div>
          <div key={who} className="mt-8 flex animate-[fadeIn_.35s_ease] flex-col justify-center gap-3 sm:flex-row">
            {(who === "employer"
              ? [
                  { l: "Request staff", h: "/i-need-staff#request", main: true },
                  { l: "Book a call", h: "/book-a-call" },
                  { l: "Book a demo", h: "/book-a-demo" },
                ]
              : [
                  { l: "Browse jobs", h: "/looking-for-work", main: true },
                  { l: "Send my CV", h: "/looking-for-work" },
                  { l: "Book a call", h: "/book-a-call" },
                ]
            ).map((b) => (
              <Link key={b.l} href={b.h} className={`rounded-full px-8 py-4 font-bold transition hover:-translate-y-0.5 ${b.main ? "bg-orange text-white shadow-xl shadow-orange/30 hover:bg-orange-dark" : "border border-white/25 text-white hover:bg-white/10"}`}>
                {b.l}
              </Link>
            ))}
          </div>
          <p className="mt-8 text-white/60">
            Or call <a href="tel:01216301643" className="font-bold text-white hover:text-orange">0121 630 1643</a>
          </p>
        </Reveal>
      </section>

      {/* MOBILE ACTION BAR */}
      <div className={`fixed inset-x-3 bottom-3 z-40 grid grid-cols-2 gap-2 rounded-full bg-navy/95 p-1.5 shadow-2xl ring-1 ring-white/10 backdrop-blur transition duration-300 sm:hidden ${bar ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-24 opacity-0"}`}>
        <Link href="/i-need-staff#request" className="rounded-full bg-orange py-3 text-center text-sm font-bold text-white">
          I need staff
        </Link>
        <Link href="/looking-for-work" className="rounded-full py-3 text-center text-sm font-bold text-white">
          Find work
        </Link>
      </div>

      {video && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 p-4" onClick={() => setVideo(false)}>
          <div className="w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-2 flex justify-end">
              <button onClick={() => setVideo(false)} className="rounded-full bg-white/10 px-3 py-1 text-sm font-bold text-white">
                Close ✕
              </button>
            </div>
            <video src="/reach-connect/overview.mp4" poster="/reach-connect/poster.jpg" controls autoPlay muted playsInline className="w-full rounded-2xl bg-black" />
          </div>
        </div>
      )}

      <Footer />
    </main>
  );
}
