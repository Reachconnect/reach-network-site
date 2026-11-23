"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import Footer from "../../components/Footer";
import type { CoverageArea } from "./CoverageMap";

const CoverageMap = dynamic(() => import("./CoverageMap"), {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center text-sm text-white/50">Loading the map…</div>,
});

type TypeKey = "class1" | "class2" | "c1" | "van" | "adr";
type Area = { key: string; label: string; lat: number; lng: number; all: number; class1: number; class2: number; delivery: number };

const TYPES: {
  key: TypeKey;
  tab: string;
  title: string;
  image: string;
  pos: string;
  intro: string;
  work: string[];
  checks: string[];
  shifts: string;
  unit: string;
  count: (a: Area) => number;
}[] = [
  {
    key: "class1",
    tab: "Class 1 (C+E)",
    title: "HGV Class 1 drivers",
    image: "/industries/driverwow.png",
    pos: "object-[72%_30%]",
    intro: "Experienced artic drivers for trunking, tramping and general haulage. Cover for holidays and sickness, peak season, or permanent hires for your fleet.",
    work: ["Trunking and night trunking", "Tramping with nights out", "General haulage and distribution", "Chilled, frozen and ambient", "Container, curtainsider and box work", "Double-deck and drawbar"],
    checks: ["Category C+E on the licence", "Driver CPC in date (DQC checked)", "Digital tachograph card", "Points, endorsements and bans checked"],
    shifts: "Days, nights, weekends and tramping",
    unit: "Class 1 drivers",
    count: (a) => a.class1,
  },
  {
    key: "class2",
    tab: "Class 2 (C)",
    title: "HGV Class 2 drivers",
    image: "/industries/happydriver.png",
    pos: "object-[72%_25%]",
    intro: "Rigid HGV drivers for local and regional work, including multi-drop, tail-lift and store deliveries, often with handballing and customer contact.",
    work: ["Local and regional distribution", "Multi-drop and store deliveries", "Tail-lift and pallet work", "Builders' merchants and tippers", "Refuse and municipal fleets", "Hiab and crane-mounted vehicles"],
    checks: ["Category C on the licence", "Driver CPC in date (DQC checked)", "Digital tachograph card", "Points, endorsements and bans checked"],
    shifts: "Days, nights and weekends",
    unit: "Class 2 drivers",
    count: (a) => a.class2,
  },
  {
    key: "c1",
    tab: "7.5 tonne (C1)",
    title: "7.5 tonne drivers",
    image: "/industries/industry-driving.png",
    pos: "object-center",
    intro: "C1 drivers for home delivery, removals, events and local distribution, including two-person crews.",
    work: ["Home and two-person deliveries", "Removals and furniture", "Catering, events and exhibitions", "Local distribution", "Horseboxes and specialist bodies"],
    checks: ["Category C1 (or a pre-1997 licence)", "Driver CPC where the work needs it", "Tachograph card", "Points, endorsements and bans checked"],
    shifts: "Mostly days, some early starts and weekends",
    unit: "drivers",
    count: (a) => a.delivery,
  },
  {
    key: "van",
    tab: "Van & multi-drop",
    title: "Van and multi-drop drivers",
    image: "/industries/warehousehelp.png",
    pos: "object-[82%_center]",
    intro: "Reliable van drivers for parcel, multi-drop and trade deliveries, from a single driver to a full peak-season team.",
    work: ["Parcel and multi-drop routes", "Trade and builders' merchant runs", "Pharmacy and medical deliveries", "Same-day and courier work", "Peak season cover"],
    checks: ["Full category B licence", "Points, endorsements and bans checked", "Route and handheld-scanner experience", "Customer-facing experience"],
    shifts: "Days, evenings and weekends",
    unit: "van and delivery drivers",
    count: (a) => a.delivery,
  },
  {
    key: "adr",
    tab: "ADR & specialist",
    title: "ADR and specialist drivers",
    image: "/industries/needstaff.png",
    pos: "object-[72%_center]",
    intro: "Drivers with the extra qualifications that hazardous, heavy or specialist loads need.",
    work: ["ADR packages and tankers", "Fuel and chemical deliveries", "Hiab and crane operators", "Low-loader and abnormal loads", "Car transporters"],
    checks: ["ADR certificate and its expiry", "Category held for the vehicle", "Driver CPC in date", "Training records for specialist equipment"],
    shifts: "To suit the contract",
    unit: "drivers",
    count: (a) => a.all,
  },
];

const BENEFITS = [
  { title: "Checked before they start", sub: "ID, right to work, licence, CPC and work history.", icon: "M9 12l2 2 4-4m5.6-4A11.96 11.96 0 0 1 12 2.9 11.96 11.96 0 0 1 3.4 6 12 12 0 0 0 12 21a12 12 0 0 0 8.6-15z" },
  { title: "Every licence type", sub: "Class 1, Class 2, 7.5 tonne, van and ADR.", icon: "M3 7h11v9H3zM14 10h4l3 3v3h-7zM7 18.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm10 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" },
  { title: "Fast cover", sub: "Short notice, holidays, sickness and peak.", icon: "M13 2 4 14h7l-1 8 9-12h-7z" },
  { title: "UK-wide", sub: "Strongest across the Midlands, with drivers nationwide.", icon: "M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21zm0-9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" },
  { title: "Temp or permanent", sub: "Day-to-day cover, temp to perm, or permanent hires.", icon: "M8 7V3m8 4V3M4 11h16M5 5h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" },
  { title: "One point of contact", sub: "A named recruiter who knows your site.", icon: "M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM4 21a8 8 0 0 1 16 0" },
];

const COMPLIANCE = [
  {
    title: "Interview",
    short: "We get to know every driver",
    body: "Every driver is interviewed by us before they're put forward. We talk through the vehicles they've driven, the routes and work they know, how they handle the paperwork, and when they can work.",
    points: ["Vehicles, trailers and bodies driven", "Types of work: trunking, multi-drop, nights", "Availability and how far they'll travel"],
  },
  {
    title: "ID and right to work",
    short: "Who they are, and that they can work in the UK",
    body: "We check original identity documents and the right to work in the UK in line with Home Office guidance: a passport, or a share code checked online. The check is recorded and dated, and time-limited permissions get a reminder before they run out.",
    points: ["Photo ID matched to the person", "Right to work check, recorded and dated", "Follow-up dates for time-limited permission"],
  },
  {
    title: "Driving licence",
    short: "Checked with the DVLA",
    body: "With the driver's permission, we check their licence against DVLA records rather than relying on a photocopy, so we see the real picture today.",
    points: ["Categories held (C+E, C, C1, B)", "Penalty points and endorsements", "Any disqualifications"],
  },
  {
    title: "Driver CPC and tacho card",
    short: "The qualifications to drive for a living",
    body: "For HGV and 7.5 tonne work we confirm the Driver CPC is in date and record the expiry on their driver qualification card (DQC), along with their digital tachograph card.",
    points: ["DQC seen and expiry recorded", "Tachograph card number and expiry", "ADR and specialist certificates where needed"],
  },
  {
    title: "Work history and references",
    short: "No unexplained gaps",
    body: "We go through their work history, ask about any gaps, and take references from recent driving employers before they start with you.",
    points: ["Full work history with gaps explained", "References from recent employers", "Reasons for leaving discussed"],
  },
  {
    title: "Fit to drive",
    short: "Health and declarations",
    body: "Drivers confirm they meet the DVLA's medical standards for the licence they hold, and declare anything that could affect their driving.",
    points: ["Medical standards confirmed", "Declarations recorded", "Agreement to tell us about any change"],
  },
  {
    title: "Ongoing checks",
    short: "Not just a one-off",
    body: "Once a driver is working with you, we keep their records up to date and re-check their licence periodically, with reminders before anything expires. If anything changes, you hear from us first.",
    points: ["Regular licence re-checks", "Reminders before CPC, tacho or right to work expiry", "Your feedback acted on quickly"],
  },
];

const FAQS = [
  { q: "How quickly can you supply a driver?", a: "For short-notice temporary cover, call us on 0121 630 1643 and we'll aim to cover it the same or next day where we can. For permanent roles, we usually send a shortlist within a few days." },
  { q: "Which areas do you cover?", a: "We supply drivers across the UK, and we're strongest in the Midlands. The map above shows where our registered drivers are." },
  { q: "Can we take a temporary driver on permanently?", a: "Yes. Many of our drivers start as temps and go permanent. Our terms explain how that works and what it costs, and we're happy to talk it through." },
  { q: "What if a driver isn't right for us?", a: "Tell us. We'll talk to you and the driver straight away and, if it's not working, find you a replacement." },
  { q: "Do you supply ADR and specialist drivers?", a: "Yes, including ADR packages and tankers, Hiab and low-loader work. We check the certificates and their expiry dates as part of our compliance checks." },
];

const FALLBACK: Area[] = [
  ["Birmingham", 52.48, -1.9],
  ["Wolverhampton", 52.59, -2.13],
  ["Coventry", 52.41, -1.51],
  ["Worcester", 52.19, -2.22],
  ["Stoke-on-Trent", 53.0, -2.18],
  ["Leicester", 52.64, -1.13],
  ["Nottingham", 52.95, -1.15],
  ["Derby", 52.92, -1.48],
  ["Manchester", 53.48, -2.24],
  ["Leeds", 53.8, -1.55],
  ["Bristol", 51.45, -2.59],
  ["London", 51.51, -0.13],
  ["Cambridge", 52.2, 0.12],
].map(([label, lat, lng]) => ({ key: String(label), label: String(label), lat: Number(lat), lng: Number(lng), all: 0, class1: 0, class2: 0, delivery: 0 }));

function Icon({ d, className = "h-5 w-5" }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d={d} />
    </svg>
  );
}

function EnquiryForm({ driverType }: { driverType: string }) {
  const [f, setF] = useState({ fullName: "", companyName: "", email: "", phoneNumber: "", rolesRequired: driverType, numberOfStaff: "1", location: "", startDate: "", shifts: "Days", notes: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  useEffect(() => setF((p) => ({ ...p, rolesRequired: driverType })), [driverType]);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF((p) => ({ ...p, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError(null);
    try {
      const res = await fetch("/api/book-staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...f, industry: "Driving", notes: [`Shifts: ${f.shifts}`, f.notes].filter(Boolean).join("\n") }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Something went wrong.");
      setStatus("done");
    } catch (err) {
      setError(`${(err as Error).message} Please call us on 0121 630 1643.`);
      setStatus("idle");
    }
  }

  if (status === "done") {
    return (
      <div className="rounded-2xl bg-white p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-3xl text-green-700">✓</div>
        <p className="mt-4 font-display text-xl font-bold text-navy">Thanks, {f.fullName.split(" ")[0]}</p>
        <p className="mt-2 text-sm text-slate-600">We&apos;ve got your request for {f.numberOfStaff} x {f.rolesRequired}. Darren will call you shortly. If it&apos;s urgent, ring 0121 630 1643.</p>
      </div>
    );
  }

  const input = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-navy focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange/20";
  return (
    <form onSubmit={submit} className="rounded-2xl bg-white p-6 shadow-xl sm:p-8">
      <p className="font-display text-xl font-bold text-navy">Tell us what you need</p>
      <p className="mt-1 text-sm text-slate-500">We&apos;ll call you back, usually within the hour during the working day.</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <input className={input} placeholder="Your name" required value={f.fullName} onChange={set("fullName")} autoComplete="name" />
        <input className={input} placeholder="Company" required value={f.companyName} onChange={set("companyName")} autoComplete="organization" />
        <input className={input} type="email" placeholder="Email" required value={f.email} onChange={set("email")} autoComplete="email" />
        <input className={input} type="tel" placeholder="Phone" required value={f.phoneNumber} onChange={set("phoneNumber")} autoComplete="tel" />
        <select className={input} value={f.rolesRequired} onChange={set("rolesRequired")}>
          {TYPES.map((t) => (
            <option key={t.key}>{t.title}</option>
          ))}
        </select>
        <div className="grid grid-cols-2 gap-3">
          <input className={input} inputMode="numeric" placeholder="How many" required value={f.numberOfStaff} onChange={set("numberOfStaff")} />
          <select className={input} value={f.shifts} onChange={set("shifts")}>
            {["Days", "Nights", "Weekends", "Mixed", "Tramping"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
        <input className={input} placeholder="Site town or postcode" required value={f.location} onChange={set("location")} />
        <input className={input} placeholder="Start date, e.g. Monday" required value={f.startDate} onChange={set("startDate")} />
        <textarea className={`${input} sm:col-span-2`} rows={3} placeholder="Anything else? Vehicle, trailer type, hours, pay rate" value={f.notes} onChange={set("notes")} />
      </div>
      {error && <p className="mt-3 rounded-lg bg-red-50 p-2.5 text-sm text-red-700">{error}</p>}
      <button disabled={status === "sending"} className="mt-4 w-full rounded-full bg-orange px-6 py-3.5 font-bold text-white transition hover:bg-orange-dark disabled:opacity-50">
        {status === "sending" ? "Sending…" : "Request drivers"}
      </button>
    </form>
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

export default function DriversPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [tab, setTab] = useState<TypeKey>("class1");
  const [step, setStep] = useState(0);
  const [faq, setFaq] = useState<number | null>(0);
  const [areas, setAreas] = useState<Area[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetch("/api/public/driver-coverage")
      .then((r) => r.json())
      .then((j) => {
        setAreas(j.areas ?? []);
        setTotal(j.total ?? 0);
      })
      .catch(() => {});
  }, []);

  const t = TYPES.find((x) => x.key === tab)!;
  const live = areas.length >= 3;
  const mapAreas: CoverageArea[] = useMemo(() => {
    const src = live ? areas : FALLBACK;
    return src.map((a) => ({ key: a.key, label: a.label, lat: a.lat, lng: a.lng, count: live ? t.count(a) || a.all : 0 })).filter((a) => !live || a.count > 0);
  }, [areas, live, t]);
  const topAreas = mapAreas.slice().sort((a, b) => b.count - a.count).slice(0, 12);
  const c = COMPLIANCE[step];

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
          <Image src="/industries/happydriver.png" alt="Smiling lorry driver in his cab" fill priority sizes="100vw" className="object-cover object-[72%_18%]" />
          <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/85 to-navy/10" />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-navy to-transparent" />
        </div>
        <div className="mx-auto max-w-7xl px-6 pb-28 pt-12 lg:px-8 lg:pb-36 lg:pt-20">
          <nav className="text-sm text-white/60">
            <Link href="/" className="hover:text-white">Home</Link> <span className="mx-1">›</span> <Link href="/industries" className="hover:text-white">Industries</Link> <span className="mx-1">›</span> <span className="text-white/90">Drivers</span>
          </nav>
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.3em] text-orange">Driver recruitment</p>
          <h1 className="mt-3 max-w-2xl font-display text-4xl font-extrabold leading-tight text-white sm:text-5xl">
            Checked, reliable drivers. <span className="text-orange">When you need them.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/80">
            Class 1, Class 2, 7.5 tonne, van and ADR drivers for short-notice cover, peak season and permanent roles. Every one interviewed and checked before they reach your yard.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#enquire" className="flex items-center gap-2 rounded-full bg-orange px-7 py-3.5 font-bold text-white shadow-lg shadow-orange/30 transition hover:bg-orange-dark">
              Request drivers <span aria-hidden="true">→</span>
            </a>
            <a href="tel:01216301643" className="flex items-center gap-2 rounded-full border border-white/30 px-7 py-3.5 font-bold text-white transition hover:bg-white/10">
              Call 0121 630 1643
            </a>
          </div>
          <div className="mt-10 flex flex-wrap gap-2">
            {["Class 1 · Class 2 · 7.5t · Van · ADR", "Temp, temp to perm and permanent", "Days, nights and weekends"].map((x) => (
              <span key={x} className="rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-sm text-white/80 backdrop-blur">
                {x}
              </span>
            ))}
            {total > 0 && <span className="rounded-full bg-orange/20 px-4 py-1.5 text-sm font-semibold text-orange">{total.toLocaleString()}+ registered drivers</span>}
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section className="relative z-10 -mt-16 px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px overflow-hidden rounded-2xl bg-slate-200 shadow-xl sm:grid-cols-3 lg:grid-cols-6">
          {BENEFITS.map((b) => (
            <div key={b.title} className="bg-white p-5 transition hover:bg-orange/5">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange/10 text-orange">
                <Icon d={b.icon} />
              </span>
              <p className="mt-3 font-display text-sm font-bold text-navy">{b.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">{b.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* DRIVER TYPES */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange">The drivers we supply</p>
          <h2 className="mt-3 font-display text-3xl font-extrabold text-navy">Pick the licence you need</h2>
          <div className="mt-8 flex gap-2 overflow-x-auto pb-2" role="tablist">
            {TYPES.map((x) => (
              <button
                key={x.key}
                role="tab"
                aria-selected={tab === x.key}
                onClick={() => setTab(x.key)}
                className={`flex-none rounded-full px-5 py-2.5 text-sm font-bold transition ${tab === x.key ? "bg-navy text-white shadow-md" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
              >
                {x.tab}
              </button>
            ))}
          </div>

          <div key={t.key} className="mt-6 grid animate-[fadeIn_.35s_ease] gap-8 lg:grid-cols-[1.05fr_1fr]">
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-navy shadow-lg">
              <Image src={t.image} alt={t.title} fill sizes="(max-width: 1024px) 100vw, 50vw" className={`object-cover ${t.pos}`} />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy/90 to-transparent p-6 pt-16">
                <p className="font-display text-2xl font-extrabold text-white">{t.title}</p>
                <p className="mt-1 text-sm text-white/75">{t.shifts}</p>
              </div>
            </div>
            <div>
              <p className="text-lg leading-relaxed text-slate-700">{t.intro}</p>
              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Work we cover</p>
                  <ul className="mt-3 space-y-2">
                    {t.work.map((w) => (
                      <li key={w} className="flex gap-2 text-sm text-slate-700">
                        <span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-orange" />
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">What we check</p>
                  <ul className="mt-3 space-y-2">
                    {t.checks.map((w) => (
                      <li key={w} className="flex gap-2 text-sm text-slate-700">
                        <span className="flex h-4 w-4 flex-none items-center justify-center rounded-full bg-green-100 text-[10px] font-bold text-green-700">✓</span>
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="#enquire" className="rounded-full bg-orange px-6 py-3 text-sm font-bold text-white hover:bg-orange-dark">
                  Request {t.tab} drivers
                </a>
                <a href="#coverage" className="rounded-full border border-slate-300 px-6 py-3 text-sm font-bold text-navy hover:bg-slate-50">
                  Where we cover
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* COVERAGE */}
      <section id="coverage" className="scroll-mt-20 bg-navy py-20">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 lg:grid-cols-[1fr_1.4fr] lg:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange">Where we cover</p>
            <h2 className="mt-3 font-display text-3xl font-extrabold text-white">{t.tab} drivers across the UK</h2>
            <p className="mt-3 text-white/70">
              {live ? `Each circle shows where our registered ${t.unit} live. The bigger the circle, the more drivers nearby.` : "We supply drivers nationwide, and we're strongest across the Midlands."} Switch licence type to see the difference.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {TYPES.map((x) => (
                <button key={x.key} onClick={() => setTab(x.key)} className={`rounded-full px-3 py-1.5 text-xs font-bold ${tab === x.key ? "bg-orange text-white" : "bg-white/10 text-white/70 hover:bg-white/20"}`}>
                  {x.tab}
                </button>
              ))}
            </div>
            <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-2">
              {topAreas.map((a) => (
                <li key={a.key} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-sm text-white/85">
                  <span>{a.label}</span>
                  {a.count > 0 && <span className="text-xs font-bold text-orange">{a.count}+</span>}
                </li>
              ))}
            </ul>
          </div>
          <div className="h-[460px] overflow-hidden rounded-3xl border border-white/10 shadow-2xl">
            <CoverageMap areas={mapAreas} unit={t.unit} />
          </div>
        </div>
      </section>

      {/* COMPLIANCE */}
      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange">Our compliance process</p>
            <h2 className="mt-3 font-display text-3xl font-extrabold text-navy">Seven checks before a driver reaches you</h2>
            <p className="mt-3 text-slate-600">You&apos;re trusting a driver with your vehicle, your load and your customers. Here&apos;s exactly what we check, so you don&apos;t have to.</p>
          </div>
          <div className="mt-10 grid gap-6 lg:grid-cols-[320px_1fr]">
            <ol className="space-y-2">
              {COMPLIANCE.map((s, i) => (
                <li key={s.title}>
                  <button
                    onClick={() => setStep(i)}
                    className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition ${step === i ? "bg-navy text-white shadow-lg" : "bg-white text-navy hover:bg-white/70"}`}
                  >
                    <span className={`flex h-8 w-8 flex-none items-center justify-center rounded-full text-sm font-extrabold ${step === i ? "bg-orange text-white" : i < step ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                      {i < step ? "✓" : i + 1}
                    </span>
                    <span>
                      <span className="block text-sm font-bold">{s.title}</span>
                      <span className={`block text-xs ${step === i ? "text-white/60" : "text-slate-400"}`}>{s.short}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ol>
            <div key={step} className="animate-[fadeIn_.3s_ease] rounded-3xl bg-white p-8 shadow-sm">
              <p className="text-sm font-bold text-orange">
                Check {step + 1} of {COMPLIANCE.length}
              </p>
              <h3 className="mt-1 font-display text-2xl font-extrabold text-navy">{c.title}</h3>
              <p className="mt-4 text-lg leading-relaxed text-slate-700">{c.body}</p>
              <ul className="mt-6 grid gap-3 sm:grid-cols-3">
                {c.points.map((p) => (
                  <li key={p} className="rounded-xl bg-slate-50 p-4 text-sm font-semibold text-navy">
                    <span className="mb-2 flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-xs text-green-700">✓</span>
                    {p}
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex items-center justify-between">
                <button onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0} className="text-sm font-bold text-slate-500 disabled:opacity-30">
                  ← Back
                </button>
                <div className="flex gap-1.5">
                  {COMPLIANCE.map((_, i) => (
                    <span key={i} className={`h-1.5 rounded-full transition-all ${i === step ? "w-6 bg-orange" : "w-1.5 bg-slate-200"}`} />
                  ))}
                </div>
                <button onClick={() => setStep(Math.min(COMPLIANCE.length - 1, step + 1))} disabled={step === COMPLIANCE.length - 1} className="text-sm font-bold text-orange disabled:opacity-30">
                  Next check →
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ENQUIRY */}
      <section id="enquire" className="relative isolate scroll-mt-20 overflow-hidden bg-navy py-20">
        <div className="absolute inset-0 -z-10 opacity-25">
          <Image src="/industries/driverwow.png" alt="" fill sizes="100vw" className="object-cover object-[70%_30%]" />
        </div>
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-navy via-navy/90 to-navy/70" />
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange">Need drivers?</p>
            <h2 className="mt-3 font-display text-3xl font-extrabold text-white sm:text-4xl">Tell us what you need. We&apos;ll do the rest.</h2>
            <ul className="mt-6 space-y-3 text-white/80">
              {["A call back from Darren, not a call centre", "Checked drivers matched to your vehicles and routes", "One point of contact from first call to start"].map((x) => (
                <li key={x} className="flex gap-3">
                  <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-orange text-xs font-bold text-white">✓</span>
                  {x}
                </li>
              ))}
            </ul>
            <a href="tel:01216301643" className="mt-8 inline-flex items-center gap-2 text-lg font-bold text-white hover:text-orange">
              Or call 0121 630 1643 →
            </a>
          </div>
          <EnquiryForm driverType={t.title} />
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <h2 className="text-center font-display text-3xl font-extrabold text-navy">Questions we get asked</h2>
          <div className="mt-8 divide-y divide-slate-200 rounded-2xl border border-slate-200">
            {FAQS.map((x, i) => (
              <div key={x.q}>
                <button onClick={() => setFaq(faq === i ? null : i)} className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left">
                  <span className="font-display font-bold text-navy">{x.q}</span>
                  <span className={`flex h-7 w-7 flex-none items-center justify-center rounded-full bg-slate-100 text-navy transition ${faq === i ? "rotate-45" : ""}`}>+</span>
                </button>
                {faq === i && <p className="px-6 pb-5 leading-relaxed text-slate-600">{x.a}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DRIVERS LOOKING FOR WORK */}
      <section className="bg-white pb-20">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <div className="flex flex-col items-start justify-between gap-5 rounded-3xl bg-orange p-8 sm:flex-row sm:items-center">
            <div>
              <p className="font-display text-2xl font-extrabold text-white">Are you a driver looking for work?</p>
              <p className="mt-1 text-white/85">Class 1, Class 2, 7.5t and van jobs, temporary and permanent.</p>
            </div>
            <Link href="/looking-for-work" className="flex-none rounded-full bg-navy px-6 py-3.5 font-bold text-white hover:bg-navy-deep">
              See driving jobs →
            </Link>
          </div>
        </div>
      </section>

      <Footer />
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}`}</style>
    </main>
  );
}
