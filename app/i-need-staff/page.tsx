"use client";

// "I need staff": the main page for employers, built around a quick 3-step staff request
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Footer from "../components/Footer";

const SECTORS = [
  {
    key: "Driving",
    label: "Drivers",
    href: "/industries/drivers",
    image: "/industries/happydriver.png",
    pos: "object-[72%_22%]",
    roles: ["Class 1 (C+E) driver", "Class 2 (C) driver", "7.5 tonne driver", "Van / multi-drop driver", "ADR driver"],
    icon: "M3 7h11v9H3zM14 10h4l3 3v3h-7zM7 18.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm10 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z",
  },
  {
    key: "Warehousing",
    label: "Warehouse",
    href: "/industries/warehouse",
    image: "/industries/warehousehelp.png",
    pos: "object-[80%_center]",
    roles: ["Picker / packer", "Forklift (FLT) driver", "Goods in / despatch", "Stock controller", "Warehouse supervisor"],
    icon: "M21 8 12 3 3 8v8l9 5 9-5zM3 8l9 5 9-5M12 13v8",
  },
  {
    key: "Manufacturing",
    label: "Manufacturing",
    href: "/industries/manufacturing",
    image: "/industries/manufacturingpeople.png",
    pos: "object-[72%_center]",
    roles: ["Production operative", "Machine operator / setter", "Welder / fabricator", "Quality inspector", "Line leader / supervisor"],
    icon: "M3 21V9l6 4V9l6 4V5h6v16zM7 17h2m4 0h2",
  },
  {
    key: "Engineering",
    label: "Engineering",
    href: "/industries/engineering",
    image: "/industries/engineeringpeople.png",
    pos: "object-[78%_center]",
    roles: ["Maintenance engineer", "Electrician", "HVAC / refrigeration engineer", "Fire & security engineer", "Gas engineer"],
    icon: "M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.5-.5-.5-2.5z",
  },
];

const WAYS = [
  {
    key: "temp",
    label: "Temporary",
    best: "Holiday and sickness cover, busy weeks and short-term projects.",
    how: ["Tell us the role, site, dates and shifts", "We send checked people who've confirmed they're coming", "They clock in through Reach Connect and you approve the hours"],
    when: "Often the same or next day for short-notice cover",
  },
  {
    key: "ttp",
    label: "Temp to perm",
    best: "When you want to see someone work before you offer a contract.",
    how: ["They start as a temp, working through us", "You see their attendance and work first-hand", "When you're ready, you take them on permanently, as set out in our terms"],
    when: "Start as quickly as temporary cover",
  },
  {
    key: "perm",
    label: "Permanent",
    best: "Skilled and senior roles: engineers, managers, specialist drivers.",
    how: ["We agree the role, package and what really matters to you", "You get a shortlist of interviewed, checked candidates", "We handle interviews, offers and keep in touch through their first weeks"],
    when: "Shortlist usually within a few days",
  },
  {
    key: "volume",
    label: "Volume & peak",
    best: "Peak season, new contracts, new shifts or a new site.",
    how: ["Tell us your numbers and dates as early as you can", "We recruit, check and brief the team ahead of time", "One point of contact for the whole team, start to finish"],
    when: "Plan a few weeks ahead for the biggest teams",
  },
];

const STEPS = [
  { title: "Tell us what you need", body: "Use the form, or call 0121 630 1643. We'll ask the questions that matter for the role." },
  { title: "We find and check people", body: "Interviews, ID and right to work, licences and certificates, and references." },
  { title: "They start with you", body: "Briefed on your site, shifts and PPE before day one." },
  { title: "We stay in touch", body: "Feedback acted on fast, and replacements if someone isn't right." },
];

const FAQS = [
  { q: "How quickly can you supply staff?", a: "For short-notice temporary cover we'll aim to cover it the same or next day where we can. For permanent roles we usually send a shortlist within a few days. Call 0121 630 1643 if it's urgent." },
  { q: "What do you check before someone starts?", a: "Every candidate is interviewed, and we check ID and right to work in the UK, plus the licences, certificates and references the role needs. Each industry page sets out the checks in detail." },
  { q: "How much does it cost?", a: "It depends on the role, the hours and whether it's temporary or permanent. Tell us what you need and we'll give you clear rates or a fee before anything starts, with no surprises." },
  { q: "Can we take a temp on permanently?", a: "Yes. Many of our temps go permanent. Our terms explain how that works, and we're happy to talk it through." },
  { q: "What if someone isn't right?", a: "Tell us. We'll speak to you and the worker straight away and, if it's not working, find you a replacement." },
  { q: "Which areas do you cover?", a: "We supply staff across the UK, and we're strongest across the Midlands." },
];

function Icon({ d, className = "h-6 w-6" }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d={d} />
    </svg>
  );
}

// ---------- The 3-step staff request ----------
type Wizard = {
  sector: string;
  role: string;
  howMany: number;
  type: string;
  start: string;
  shifts: string;
  location: string;
  fullName: string;
  companyName: string;
  email: string;
  phoneNumber: string;
  notes: string;
};

function StaffRequest({ preset }: { preset: { sector: string; n: number } }) {
  const [step, setStep] = useState(0);
  const [w, setW] = useState<Wizard>({ sector: "", role: "", howMany: 1, type: "Temporary", start: "As soon as possible", shifts: "Days", location: "", fullName: "", companyName: "", email: "", phoneNumber: "", notes: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  // A sector card further down the page can start the form off
  useEffect(() => {
    if (preset.sector) {
      setW((p) => ({ ...p, sector: preset.sector, role: "" }));
      setStep(1);
    }
  }, [preset]);

  const sector = SECTORS.find((s) => s.key === w.sector);
  const set = (k: keyof Wizard) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setW((p) => ({ ...p, [k]: e.target.value }));
  const input = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-navy focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange/20";
  const chip = (on: boolean) => `rounded-full border px-3.5 py-2 text-sm font-semibold transition ${on ? "border-orange bg-orange/10 text-navy" : "border-slate-200 text-slate-600 hover:border-slate-300"}`;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError(null);
    try {
      const res = await fetch("/api/book-staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: w.fullName,
          companyName: w.companyName,
          email: w.email,
          phoneNumber: w.phoneNumber,
          industry: w.sector || "Other",
          location: w.location,
          rolesRequired: w.role || sector?.label || "Staff",
          numberOfStaff: String(w.howMany),
          startDate: w.start,
          notes: [`Type: ${w.type}`, `Shifts: ${w.shifts}`, w.notes].filter(Boolean).join("\n"),
        }),
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
      <div className="rounded-3xl bg-white p-8 text-center shadow-2xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl text-green-700">✓</div>
        <p className="mt-4 font-display text-2xl font-extrabold text-navy">Request received</p>
        <p className="mt-2 text-slate-600">
          Thanks, {w.fullName.split(" ")[0]}. We&apos;ve got your request for {w.howMany} x {w.role || sector?.label}. One of our team will call you shortly. If it&apos;s urgent, ring 0121 630 1643.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
      <div className="flex items-center justify-between">
        <p className="font-display text-xl font-extrabold text-navy">Request staff</p>
        <p className="text-xs font-bold text-slate-400">Step {step + 1} of 3</p>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-orange transition-all duration-500" style={{ width: `${((step + 1) / 3) * 100}%` }} />
      </div>

      {step === 0 && (
        <div className="mt-6 animate-[fadeIn_.3s_ease]">
          <p className="font-semibold text-navy">What kind of staff do you need?</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {[...SECTORS, { key: "Other", label: "Something else", icon: "M12 5v14M5 12h14" }].map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => {
                  setW((p) => ({ ...p, sector: s.key, role: "" }));
                  setStep(1);
                }}
                className={`flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition hover:border-orange hover:bg-orange/5 ${w.sector === s.key ? "border-orange bg-orange/5" : "border-slate-200"} ${s.key === "Other" ? "col-span-2" : ""}`}
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy text-white">
                  <Icon d={s.icon} className="h-5 w-5" />
                </span>
                <span className="font-display font-bold text-navy">{s.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="mt-6 animate-[fadeIn_.3s_ease] space-y-5">
          <div>
            <p className="font-semibold text-navy">Which role?</p>
            {sector ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {sector.roles.map((r) => (
                  <button key={r} type="button" onClick={() => setW((p) => ({ ...p, role: r }))} className={chip(w.role === r)}>
                    {r}
                  </button>
                ))}
              </div>
            ) : null}
            <input className={`${input} mt-3`} placeholder={sector ? "Or type another role" : "e.g. Cleaner, admin, labourer"} value={sector?.roles.includes(w.role) ? "" : w.role} onChange={set("role")} />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
            <span className="font-semibold text-navy">How many?</span>
            <div className="flex items-center gap-4">
              <button type="button" onClick={() => setW((p) => ({ ...p, howMany: Math.max(1, p.howMany - 1) }))} className="h-9 w-9 rounded-full bg-slate-100 text-lg font-bold text-navy">
                −
              </button>
              <span className="w-6 text-center text-xl font-extrabold text-navy">{w.howMany}</span>
              <button type="button" onClick={() => setW((p) => ({ ...p, howMany: p.howMany + 1 }))} className="h-9 w-9 rounded-full bg-slate-100 text-lg font-bold text-navy">
                +
              </button>
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500">Type of work</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {["Temporary", "Temp to perm", "Permanent"].map((t) => (
                <button key={t} type="button" onClick={() => setW((p) => ({ ...p, type: t }))} className={chip(w.type === t)}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <select className={input} value={w.start} onChange={set("start")} aria-label="Start">
              {["As soon as possible", "This week", "Next week", "In the next month", "Later / just planning"].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
            <select className={input} value={w.shifts} onChange={set("shifts")} aria-label="Shifts">
              {["Days", "Nights", "Weekends", "Mixed shifts", "Office hours"].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setStep(0)} className="rounded-full border border-slate-300 px-5 py-3 text-sm font-bold text-navy">
              ← Back
            </button>
            <button type="button" disabled={!w.role.trim()} onClick={() => setStep(2)} className="flex-1 rounded-full bg-orange px-5 py-3 font-bold text-white transition hover:bg-orange-dark disabled:opacity-40">
              Next →
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <form onSubmit={submit} className="mt-6 animate-[fadeIn_.3s_ease] space-y-3">
          <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <b className="text-navy">
              {w.howMany} x {w.role}
            </b>{" "}
            · {w.type} · {w.start.toLowerCase()} · {w.shifts.toLowerCase()}
          </p>
          <input className={input} placeholder="Site town or postcode" required value={w.location} onChange={set("location")} />
          <div className="grid grid-cols-2 gap-3">
            <input className={input} placeholder="Your name" required value={w.fullName} onChange={set("fullName")} autoComplete="name" />
            <input className={input} placeholder="Company" required value={w.companyName} onChange={set("companyName")} autoComplete="organization" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input className={input} type="email" placeholder="Email" required value={w.email} onChange={set("email")} autoComplete="email" />
            <input className={input} type="tel" placeholder="Phone" required value={w.phoneNumber} onChange={set("phoneNumber")} autoComplete="tel" />
          </div>
          <textarea className={input} rows={2} placeholder="Anything else? Pay rate, hours, licences needed (optional)" value={w.notes} onChange={set("notes")} />
          {error && <p className="rounded-lg bg-red-50 p-2.5 text-sm text-red-700">{error}</p>}
          <div className="flex gap-3">
            <button type="button" onClick={() => setStep(1)} className="rounded-full border border-slate-300 px-5 py-3 text-sm font-bold text-navy">
              ← Back
            </button>
            <button disabled={status === "sending"} className="flex-1 rounded-full bg-orange px-5 py-3 font-bold text-white transition hover:bg-orange-dark disabled:opacity-50">
              {status === "sending" ? "Sending…" : "Send request"}
            </button>
          </div>
          <p className="text-center text-xs text-slate-400">We&apos;ll call you back to talk it through. No obligation.</p>
        </form>
      )}
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
      { label: "Why choose us", href: "/why-choose-us" },
      { label: "FAQ", href: "/faq" },
    ],
  },
];

export default function INeedStaffPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [preset, setPreset] = useState({ sector: "", n: 0 });
  const [way, setWay] = useState(0);
  const [faq, setFaq] = useState<number | null>(0);
  const [total, setTotal] = useState(0);
  const [video, setVideo] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/public/coverage?sector=all")
      .then((r) => r.json())
      .then((j) => setTotal(j.total ?? 0))
      .catch(() => {});
  }, []);

  function request(sector: string) {
    setPreset((p) => ({ sector, n: p.n + 1 }));
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  const W = WAYS[way];

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
        <div className="absolute inset-y-0 right-0 -z-10 w-full lg:w-[62%]">
          <Image src="/industries/driverwow.png" alt="Smiling driver in front of his lorry" fill priority sizes="(max-width: 1024px) 100vw, 62vw" className="object-cover object-[60%_20%] opacity-40 lg:opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/60 to-navy/20" />
        </div>
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 pb-20 pt-10 lg:grid-cols-[1fr_480px] lg:px-8 lg:pb-28 lg:pt-16">
          <div>
            <nav className="text-sm text-white/60">
              <Link href="/" className="hover:text-white">Home</Link> <span className="mx-1">›</span> <span className="text-white/90">I need staff</span>
            </nav>
            <p className="mt-6 text-xs font-bold uppercase tracking-[0.3em] text-orange">For employers</p>
            <h1 className="mt-3 font-display text-4xl font-extrabold leading-tight text-white sm:text-5xl">
              The right people. <span className="block text-orange">Right when you need them.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/80">
              Drivers, warehouse, manufacturing and engineering staff, for tomorrow&apos;s shift or a permanent hire. Every one interviewed and checked before they reach you.
            </p>
            <ul className="mt-7 space-y-3 text-white/85">
              {["Tell us what you need in under a minute", "Checked people: ID, right to work, licences, references", "Temporary, temp to perm and permanent"].map((x) => (
                <li key={x} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-orange text-xs font-bold text-white">✓</span>
                  {x}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a href="tel:01216301643" className="flex items-center gap-2 rounded-full border border-white/30 px-6 py-3 font-bold text-white hover:bg-white/10">
                Call 0121 630 1643
              </a>
              {total > 0 && <span className="rounded-full bg-orange/20 px-4 py-2 text-sm font-semibold text-orange">{total.toLocaleString()}+ registered candidates</span>}
            </div>
          </div>
          <div ref={formRef} id="request" className="scroll-mt-24">
            <StaffRequest preset={preset} />
          </div>
        </div>
      </section>

      {/* PROOF STRIP */}
      <section className="border-b border-slate-100 bg-white">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-6 py-8 sm:grid-cols-4 lg:px-8">
          {[
            [total > 0 ? `${total.toLocaleString()}+` : "UK-wide", total > 0 ? "Registered candidates" : "Coverage, strongest in the Midlands"],
            ["4", "Specialist sectors"],
            ["15+ years", "Recruitment experience"],
            ["1", "Point of contact, start to finish"],
          ].map(([v, k]) => (
            <div key={k} className="text-center">
              <p className="font-display text-3xl font-extrabold text-navy">{v}</p>
              <p className="mt-1 text-sm text-slate-500">{k}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SECTORS */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange">What we recruit</p>
          <h2 className="mt-3 font-display text-3xl font-extrabold text-navy">Staff for every part of your operation</h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {SECTORS.map((s) => (
              <div key={s.key} className="group overflow-hidden rounded-3xl bg-navy shadow-lg">
                <div className="relative aspect-[16/9] overflow-hidden">
                  <Image src={s.image} alt={s.label} fill sizes="(max-width: 640px) 100vw, 50vw" className={`object-cover ${s.pos} transition duration-700 group-hover:scale-105`} />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/30 to-transparent" />
                  <p className="absolute bottom-4 left-6 font-display text-2xl font-extrabold text-white">{s.label}</p>
                </div>
                <div className="p-6 pt-4">
                  <div className="flex flex-wrap gap-1.5">
                    {s.roles.map((r) => (
                      <span key={r} className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80">
                        {r}
                      </span>
                    ))}
                  </div>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <button onClick={() => request(s.key)} className="rounded-full bg-orange px-5 py-2.5 text-sm font-bold text-white hover:bg-orange-dark">
                      Request {s.label.toLowerCase()} staff
                    </button>
                    <Link href={s.href} className="rounded-full border border-white/25 px-5 py-2.5 text-sm font-bold text-white hover:bg-white/10">
                      More about {s.label.toLowerCase()} →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WAYS WE WORK */}
      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange">Ways we work</p>
          <h2 className="mt-3 font-display text-3xl font-extrabold text-navy">However you need people, we can help</h2>
          <div className="mt-8 flex gap-2 overflow-x-auto pb-2" role="tablist">
            {WAYS.map((x, n) => (
              <button key={x.key} role="tab" aria-selected={way === n} onClick={() => setWay(n)} className={`flex-none rounded-full px-5 py-2.5 text-sm font-bold transition ${way === n ? "bg-navy text-white shadow-md" : "bg-white text-slate-600 hover:bg-slate-100"}`}>
                {x.label}
              </button>
            ))}
          </div>
          <div key={W.key} className="mt-6 grid animate-[fadeIn_.35s_ease] gap-6 rounded-3xl bg-white p-8 shadow-sm lg:grid-cols-[1fr_1.4fr]">
            <div>
              <h3 className="font-display text-3xl font-extrabold text-navy">{W.label}</h3>
              <p className="mt-2 text-xs font-bold uppercase tracking-wide text-slate-400">Best for</p>
              <p className="mt-1 text-lg text-slate-700">{W.best}</p>
              <p className="mt-6 inline-flex items-center gap-2 rounded-full bg-orange/10 px-4 py-2 text-sm font-semibold text-navy">⏱ {W.when}</p>
            </div>
            <ol className="space-y-4">
              {W.how.map((h, n) => (
                <li key={h} className="flex gap-4 rounded-2xl bg-slate-50 p-4">
                  <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-navy text-sm font-extrabold text-white">{n + 1}</span>
                  <span className="self-center text-slate-700">{h}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-navy py-20">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange">How it works</p>
          <h2 className="mt-3 font-display text-3xl font-extrabold text-white">From first call to first shift</h2>
          <div className="relative mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="absolute left-0 right-0 top-6 hidden h-0.5 bg-white/10 lg:block" />
            {STEPS.map((s, n) => (
              <div key={s.title} className="relative">
                <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-orange font-display text-lg font-extrabold text-white shadow-lg shadow-orange/30">{n + 1}</span>
                <p className="mt-4 font-display text-lg font-bold text-white">{s.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-white/65">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* REACH CONNECT */}
      <section className="bg-white py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange">Included for temporary clients</p>
            <h2 className="mt-3 font-display text-3xl font-extrabold text-navy">See your workforce live with Reach Connect</h2>
            <p className="mt-4 text-lg leading-relaxed text-slate-600">Your own client portal: GPS and face-checked clock-ins, a live board of who&apos;s on site, timesheets approved in a tap, and costs by site before the invoice arrives.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button onClick={() => setVideo(true)} className="flex items-center gap-2 rounded-full bg-navy px-6 py-3 font-bold text-white hover:bg-navy-deep">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-orange text-[10px]">▶</span> Watch the 45-second tour
              </button>
              <Link href="/reach-connect" className="rounded-full border border-slate-300 px-6 py-3 font-bold text-navy hover:bg-slate-50">
                Find out more →
              </Link>
            </div>
          </div>
          <button onClick={() => setVideo(true)} className="group relative aspect-video overflow-hidden rounded-3xl shadow-2xl" aria-label="Play the Reach Connect tour">
            <Image src="/reach-connect/poster.jpg" alt="Reach Connect dashboard" fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover transition duration-500 group-hover:scale-105" />
            <span className="absolute inset-0 flex items-center justify-center bg-navy/20">
              <span className="flex h-20 w-20 items-center justify-center rounded-full bg-orange text-2xl text-white shadow-xl shadow-orange/40 transition group-hover:scale-110">▶</span>
            </span>
          </button>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <h2 className="text-center font-display text-3xl font-extrabold text-navy">Questions employers ask us</h2>
          <div className="mt-8 divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
            {FAQS.map((x, n) => (
              <div key={x.q}>
                <button onClick={() => setFaq(faq === n ? null : n)} className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left">
                  <span className="font-display font-bold text-navy">{x.q}</span>
                  <span className={`flex h-7 w-7 flex-none items-center justify-center rounded-full bg-slate-100 text-navy transition ${faq === n ? "rotate-45" : ""}`}>+</span>
                </button>
                {faq === n && <p className="px-6 pb-5 leading-relaxed text-slate-600">{x.a}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative isolate overflow-hidden bg-navy py-20">
        <div className="absolute inset-0 -z-10">
          <Image src="/industries/buildsomething.png" alt="" fill sizes="100vw" className="object-cover object-[82%_center] opacity-50" />
          <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/85 to-navy/30" />
        </div>
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <h2 className="max-w-xl font-display text-3xl font-extrabold text-white sm:text-4xl">Let&apos;s get the right people through your door.</h2>
          <p className="mt-3 max-w-lg text-white/75">Tell us what you need and we&apos;ll call you back to talk it through. No obligation.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#request" className="rounded-full bg-orange px-7 py-3.5 font-bold text-white shadow-lg shadow-orange/30 hover:bg-orange-dark">
              Request staff →
            </a>
            <a href="tel:01216301643" className="rounded-full border border-white/30 px-7 py-3.5 font-bold text-white hover:bg-white/10">
              Call 0121 630 1643
            </a>
          </div>
        </div>
      </section>

      {video && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4" onClick={() => setVideo(false)}>
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
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}`}</style>
    </main>
  );
}
