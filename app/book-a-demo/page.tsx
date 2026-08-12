"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const TRUST_POINTS = [
  { title: "See it in action" },
  { title: "Your questions answered" },
  { title: "Tailored to your business" },
];

const FEATURES = [
  { title: "Book and manage staff", description: "Easily request, confirm and manage temporary and permanent staff across multiple sites." },
  { title: "Compliance made simple", description: "Keep right to work, licences and training up to date with built-in compliance tools." },
  { title: "Real-time visibility", description: "Track bookings, timesheets and attendance in real time with powerful reporting." },
  { title: "Quality talent, fast", description: "Access a pre-vetted pool of reliable, skilled candidates ready to go when you need them." },
  { title: "Communication in one place", description: "Message workers, share updates and keep everyone in the loop — all in one platform." },
];

const TEAM_SIZE_OPTIONS = ["1-10", "11-50", "51-200", "200+"];
const INDUSTRY_OPTIONS = ["Logistics", "Warehousing", "Transport", "Manufacturing", "Other"];
const GOAL_OPTIONS = [
  "Reduce agency spend",
  "Improve compliance",
  "Speed up staffing",
  "Better visibility and reporting",
  "Not sure yet",
];

const WHY_CHOOSE = [
  { title: "Save hours of admin", description: "Automate time-consuming tasks and simplify workforce management." },
  { title: "Reduce costs", description: "Cut agency spend and increase efficiency with better visibility and control." },
  { title: "Stay compliant", description: "Built-in compliance tools help you stay audit-ready and avoid risk." },
  { title: "Access quality talent", description: "A network of pre-vetted, reliable workers ready when you need them." },
];

const APP_SCREENS = [
  {
    tab: "Dashboard",
    render: "dashboard" as const,
  },
  {
    tab: "Rate",
    render: "rate" as const,
  },
  {
    tab: "Timesheets",
    render: "timesheets" as const,
  },
  {
    tab: "Live",
    render: "live" as const,
  },
];

const LIVE_WORKERS = [
  { initials: "SA", name: "Sarah Adeyemi", site: "Coventry — Amazon Fulfilment" },
  { initials: "TN", name: "Tomas Nowak", site: "Birmingham — DHL Logistics" },
  { initials: "KB", name: "Kwame Boateng", site: "Rocester — JCB Manufacturing" },
  { initials: "LE", name: "Lucy Evans", site: "Birmingham — DHL Logistics" },
];

const ACTIVITY_FEED = [
  { time: "08:02", message: "Sarah Adeyemi clocked in — Coventry" },
  { time: "08:15", message: "Timesheet approved for Ryan Lewis" },
  { time: "08:41", message: "Kwame Boateng clocked in — Rocester" },
  { time: "09:10", message: "New shift request from JCB Manufacturing" },
];

function FloatingPhone() {
  const [screenIndex, setScreenIndex] = useState(0);
  const [starsFilled, setStarsFilled] = useState(0);
  const [rated, setRated] = useState(false);
  const [approved, setApproved] = useState(false);
  const [showThanks, setShowThanks] = useState(false);

  const activeScreen = APP_SCREENS[screenIndex];

  useEffect(() => {
    const cycle = setInterval(() => {
      setScreenIndex((i) => (i + 1) % APP_SCREENS.length);
    }, 4200);
    return () => clearInterval(cycle);
  }, []);

  useEffect(() => {
    setStarsFilled(0);
    setRated(false);
    setApproved(false);
    setShowThanks(false);

    if (activeScreen.render === "rate") {
      for (let i = 1; i <= 5; i++) {
        setTimeout(() => setStarsFilled(i), 250 + i * 220);
      }
      setTimeout(() => setRated(true), 250 + 5 * 220 + 150);
    }
    if (activeScreen.render === "timesheets") {
      setTimeout(() => setApproved(true), 900);
      setTimeout(() => setShowThanks(true), 1200);
    }
  }, [screenIndex, activeScreen.render]);

  return (
    <div className="relative flex items-center justify-center py-10">
      <div className="absolute h-[340px] w-[340px] rounded-full bg-[radial-gradient(circle,#FDEEDD_0%,#FDEEDD_55%,transparent_75%)]" />
      <div className="relative animate-[floatBob_3.6s_ease-in-out_infinite] [transform:rotate(-8deg)]">
        <div className="w-[260px] rounded-[2.75rem] border-[7px] border-navy bg-navy shadow-2xl">
          <div className="relative h-5">
            <div className="absolute left-1/2 top-1.5 h-3.5 w-16 -translate-x-1/2 rounded-full bg-navy" />
          </div>
          <div className="flex h-[480px] flex-col overflow-hidden rounded-[2.25rem] bg-slate-50">
            <div className="bg-navy px-3.5 pb-2.5 pt-2">
              <p className="text-[9px] font-bold uppercase tracking-wide text-orange">Client portal</p>
              <p className="mt-0.5 text-xs font-bold text-white">{activeScreen.tab}</p>
            </div>

            <div className="flex-1 overflow-hidden p-3">
              {activeScreen.render === "dashboard" && (
                <div className="flex h-full flex-col">
                  <div className="grid grid-cols-2 gap-1.5">
                    <div className="rounded-lg bg-white p-2">
                      <p className="text-[9px] text-slate-500">Fill rate</p>
                      <p className="text-sm font-bold text-navy">94%</p>
                    </div>
                    <div className="rounded-lg bg-white p-2">
                      <p className="text-[9px] text-slate-500">Today&rsquo;s spend</p>
                      <p className="text-sm font-bold text-navy">£2,140</p>
                    </div>
                    <div className="col-span-2 rounded-lg bg-white p-2">
                      <p className="text-[9px] text-slate-500">Attendance rate</p>
                      <p className="text-sm font-bold text-navy">97%</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                    <p className="text-[10px] font-bold text-red-700">Live activity feed</p>
                  </div>
                  <div className="mt-1.5 space-y-1 overflow-hidden">
                    {ACTIVITY_FEED.map((item) => (
                      <div key={item.time} className="flex gap-1.5 rounded-md bg-white px-2 py-1.5">
                        <span className="shrink-0 text-[9px] text-slate-400">{item.time}</span>
                        <span className="text-[10px] text-navy">{item.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeScreen.render === "rate" && (
                <div>
                  <div className="flex items-center gap-2 rounded-lg bg-white p-2.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange/20 text-[11px] font-bold text-orange-800">JM</div>
                    <div>
                      <p className="text-xs font-bold text-navy">James Mensah</p>
                      <p className="text-[10px] text-slate-500">Warehouse operative</p>
                    </div>
                  </div>
                  <p className="mt-3 text-[10px] text-slate-500">How was James this shift?</p>
                  <div className="mt-1.5 flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <svg key={n} viewBox="0 0 20 20" fill={n <= starsFilled ? "#F79E1E" : "#D3D1C7"} className="h-5 w-5 transition-colors duration-200">
                        <path d="M10 1.5l2.6 5.6 6.1.6-4.6 4.1 1.3 6-5.4-3.1-5.4 3.1 1.3-6-4.6-4.1 6.1-.6z" />
                      </svg>
                    ))}
                  </div>
                  <p className={`mt-3 text-[11px] font-bold text-green-700 transition-opacity duration-300 ${rated ? "opacity-100" : "opacity-0"}`}>
                    ✓ Rating submitted
                  </p>
                </div>
              )}

              {activeScreen.render === "timesheets" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between rounded-lg bg-white p-2.5">
                    <div>
                      <p className="text-xs font-bold text-navy">Amara Okafor</p>
                      <p className="text-[10px] text-slate-500">38.5 hrs · Coventry</p>
                    </div>
                    <span
                      className={`rounded-md px-2 py-1 text-[10px] font-bold transition-colors duration-300 ${
                        approved ? "bg-green-100 text-green-800" : "border border-slate-200 text-navy"
                      }`}
                    >
                      {approved ? "Approved" : "Approve"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-white p-2.5 opacity-60">
                    <div>
                      <p className="text-xs font-bold text-navy">Ryan Lewis</p>
                      <p className="text-[10px] text-slate-500">40 hrs · Birmingham</p>
                    </div>
                    <span className="text-[10px] font-bold text-green-700">Approved</span>
                  </div>
                  <div
                    className={`rounded-lg bg-green-50 px-3 py-2 text-[11px] font-bold text-green-800 transition-all duration-300 ${
                      showThanks ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
                    }`}
                  >
                    Thanks, timesheet approved
                  </div>
                </div>
              )}

              {activeScreen.render === "live" && (
                <div>
                  <div className="mb-2 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
                    <p className="text-[10px] font-bold text-red-700">Live now · {LIVE_WORKERS.length} on site</p>
                  </div>
                  <div className="space-y-1.5">
                    {LIVE_WORKERS.map((w) => (
                      <div key={w.initials} className="flex items-center gap-2 rounded-lg bg-white p-2">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-800">
                          {w.initials}
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-navy">{w.name}</p>
                          <p className="text-[9px] text-slate-500">{w.site}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-around border-t border-slate-200 bg-white px-2 py-2">
              {APP_SCREENS.map((s, i) => (
                <span key={s.tab} className={`text-[8px] font-bold ${i === screenIndex ? "text-orange" : "text-slate-400"}`}>
                  {s.tab}
                </span>
              ))}
            </div>
          </div>
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
      { label: "FAQ", href: "/book-a-call#faq" },
    ],
  },
];

export default function BookADemo() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [form, setForm] = useState({
    fullName: "",
    jobTitle: "",
    companyName: "",
    phoneNumber: "",
    workEmail: "",
    teamSize: "",
    industry: "",
    goal: "",
    preferredDate: "",
    preferredTime: "",
    notes: "",
  });
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [step, setStep] = useState(1);

  function goToStep2(e: React.FormEvent) {
    e.preventDefault();
    setStep(2);
  }
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMessage("");
    try {
      const res = await fetch("/api/book-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setStatus("success");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("error");
    }
  }

  return (
    <main className="overflow-x-hidden font-body">
      <style>{`
        @keyframes floatBob {
          0%, 100% { transform: translateY(0) rotate(-8deg); }
          50% { transform: translateY(-12px) rotate(-8deg); }
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
            <Link href="/book-a-demo" className="hidden rounded-full bg-orange px-5 py-2.5 text-sm font-bold text-white transition hover:bg-orange-dark sm:block">
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
            <Link href="/contact-us" className="rounded-lg px-3 py-3 text-left text-sm font-semibold text-white/85 transition hover:bg-white/5 hover:text-white">
              Contact us
            </Link>
            <Link href="/book-a-demo" className="mx-3 mt-2 rounded-full bg-orange px-5 py-2.5 text-center text-sm font-bold text-white transition hover:bg-orange-dark sm:hidden">
              Let&rsquo;s Talk
            </Link>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section className="bg-navy pb-8 pt-10 lg:pb-0">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 lg:grid-cols-2 lg:gap-8 lg:px-8">
          <div className="pb-8 lg:pb-16">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange">Book a demo</p>
            <h1 className="font-display mt-3 text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl">
              See Reach Connect
              <br />
              <span className="text-orange">in action.</span>
            </h1>
            <p className="mt-4 max-w-md text-sm text-white/70 sm:text-base">
              Book a personalised demo with our team and discover how Reach Connect can save you time, reduce admin and help you secure the right people, faster.
            </p>

            <div className="mt-7 flex flex-wrap gap-x-8 gap-y-3">
              {TRUST_POINTS.map((point) => (
                <div key={point.title} className="flex items-center gap-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-orange/40 text-orange">
                    <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
                      <path d="M6.2 10.9 3.5 8.2l1-1 1.7 1.7 4.6-4.6 1 1z" />
                    </svg>
                  </span>
                  <span className="text-xs font-semibold text-white/75">{point.title}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:-mb-24">
            <FloatingPhone />
          </div>
        </div>
      </section>

      {/* FEATURES + FORM */}
      <section className="bg-slate-50 py-16 lg:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-[1fr_460px] lg:gap-8 lg:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange">Powerful software. Real results.</p>
            <h2 className="font-display mt-3 text-2xl font-extrabold leading-tight tracking-tight text-navy sm:text-3xl">
              Everything you need to manage your workforce in one place.
            </h2>
            <p className="mt-4 text-sm text-slate-600">
              Reach Connect is an all-in-one workforce management platform designed for businesses in logistics, warehousing, transport and beyond.
            </p>

            <div className="mt-8 space-y-5">
              {FEATURES.map((feature) => (
                <div key={feature.title} className="flex gap-3.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange/15 text-orange">
                    <svg viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4">
                      <circle cx="8" cy="8" r="3" />
                    </svg>
                  </span>
                  <div>
                    <p className="font-display text-sm font-bold text-navy">{feature.title}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Book a demo form */}
          <div className="h-fit rounded-2xl bg-white p-6 shadow-[0_25px_70px_-15px_rgba(15,36,56,0.5)] sm:p-7">
            <p className="font-display text-lg font-extrabold text-navy">Book a demo</p>
            <p className="mt-1 text-xs text-slate-500">
              Complete the form below and a member of our team will be in touch to arrange your demo.
            </p>

            {status === "success" ? (
              <div className="mt-5 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                Thanks — your request is in. We&rsquo;ll be in touch shortly to confirm your demo.
              </div>
            ) : (
              <>
                <div className="mt-5 flex items-center gap-2">
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${step === 1 ? "bg-orange text-white" : "bg-orange/15 text-orange"}`}>1</span>
                  <span className="text-xs font-semibold text-navy">About you</span>
                  <div className="mx-1 h-px flex-1 bg-slate-200" />
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${step === 2 ? "bg-orange text-white" : "bg-slate-100 text-slate-400"}`}>2</span>
                  <span className="text-xs font-semibold text-navy">Your demo</span>
                </div>

                {step === 1 ? (
                  <form onSubmit={goToStep2} className="mt-5 space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="text-xs font-semibold text-navy">Your name <span className="text-orange">*</span></label>
                        <input required type="text" placeholder="Full name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-navy placeholder:text-slate-400 focus:border-navy focus:outline-none" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-navy">Job title <span className="text-orange">*</span></label>
                        <input required type="text" placeholder="Job title" value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-navy placeholder:text-slate-400 focus:border-navy focus:outline-none" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="text-xs font-semibold text-navy">Company name <span className="text-orange">*</span></label>
                        <input required type="text" placeholder="Company name" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-navy placeholder:text-slate-400 focus:border-navy focus:outline-none" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-navy">Phone number <span className="text-orange">*</span></label>
                        <input required type="tel" placeholder="Phone number" value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-navy placeholder:text-slate-400 focus:border-navy focus:outline-none" />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-navy">Work email <span className="text-orange">*</span></label>
                      <input required type="email" placeholder="Work email address" value={form.workEmail} onChange={(e) => setForm({ ...form, workEmail: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-navy placeholder:text-slate-400 focus:border-navy focus:outline-none" />
                    </div>

                    <button type="submit" className="flex w-full items-center justify-center gap-1.5 rounded-full bg-orange px-7 py-3.5 text-sm font-bold text-white transition hover:bg-orange-dark">
                      Continue <span aria-hidden="true">&rarr;</span>
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="text-xs font-semibold text-navy">How many people are in your team? <span className="text-orange">*</span></label>
                        <select required value={form.teamSize} onChange={(e) => setForm({ ...form, teamSize: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-navy focus:border-navy focus:outline-none">
                          <option value="">Select team size</option>
                          {TEAM_SIZE_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-navy">Industry <span className="text-orange">*</span></label>
                        <select required value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-navy focus:border-navy focus:outline-none">
                          <option value="">Select industry</option>
                          {INDUSTRY_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-navy">What are you looking to achieve with Reach Connect? <span className="text-orange">*</span></label>
                      <select required value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-navy focus:border-navy focus:outline-none">
                        <option value="">Select an option</option>
                        {GOAL_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="text-xs font-semibold text-navy">When would you like your demo? <span className="text-orange">*</span></label>
                        <input required type="date" value={form.preferredDate} onChange={(e) => setForm({ ...form, preferredDate: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-navy focus:border-navy focus:outline-none" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-navy">Preferred time</label>
                        <select value={form.preferredTime} onChange={(e) => setForm({ ...form, preferredTime: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-navy focus:border-navy focus:outline-none">
                          <option value="">Select time</option>
                          <option>Morning</option>
                          <option>Afternoon</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-navy">Anything else we should know?</label>
                      <textarea rows={3} placeholder="Tell us about your business or any specific challenges" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="mt-1 w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-navy placeholder:text-slate-400 focus:border-navy focus:outline-none" />
                    </div>

                    {status === "error" && <p className="text-sm font-semibold text-red-600">{errorMessage}</p>}

                    <div className="flex gap-3">
                      <button type="button" onClick={() => setStep(1)} className="rounded-full border border-slate-200 px-5 py-3.5 text-sm font-bold text-navy transition hover:border-navy/30">
                        Back
                      </button>
                      <button type="submit" disabled={status === "submitting"} className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-orange px-7 py-3.5 text-sm font-bold text-white transition hover:bg-orange-dark disabled:opacity-60">
                        {status === "submitting" ? "Submitting..." : "Request demo"}
                        {status !== "submitting" && <span aria-hidden="true">&rarr;</span>}
                      </button>
                    </div>

                    <p className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
                      <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
                        <path d="M8 1a3 3 0 00-3 3v2H4a1 1 0 00-1 1v6a1 1 0 001 1h8a1 1 0 001-1V7a1 1 0 00-1-1h-1V4a3 3 0 00-3-3zm-1.5 5V4a1.5 1.5 0 013 0v2h-3z" />
                      </svg>
                      Your information is safe and secure.
                    </p>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      {/* WHY CHOOSE */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
            <div>
              <p className="font-display text-xl font-extrabold text-navy">Why businesses choose Reach Connect</p>
              <p className="mt-2 text-sm text-slate-500">Built to save you time, reduce costs and give you complete control.</p>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {WHY_CHOOSE.map((item) => (
                <div key={item.title}>
                  <span className="flex h-10 w-10 items-center justify-center rounded-full border border-orange/40 text-orange">
                    <svg viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4">
                      <circle cx="8" cy="8" r="3" />
                    </svg>
                  </span>
                  <p className="font-display mt-3 text-sm font-bold text-navy">{item.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA BAND */}
      <section className="bg-navy py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-6 sm:flex-row sm:items-center lg:px-8">
          <div>
            <p className="font-display text-lg font-extrabold text-white">Ready to see Reach Connect in action?</p>
            <p className="mt-1 text-sm text-white/60">Book your free, no-obligation demo today and see how we can help your business thrive.</p>
          </div>
          <Link href="/book-a-demo" className="flex shrink-0 items-center gap-1.5 rounded-full bg-orange px-6 py-3 text-sm font-bold text-white transition hover:bg-orange-dark">
            Book a demo today <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-navy-deep pt-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:grid-cols-5">
            <div className="col-span-2 sm:col-span-3 lg:col-span-1">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-orange">
                  <span className="h-2.5 w-2.5 rounded-full bg-orange" />
                </span>
                <span className="font-display text-sm font-extrabold text-white">REACH</span>
              </div>
              <p className="mt-4 text-xs leading-relaxed text-white/50">
                Recruitment done different. People focused. Results driven.
              </p>
              <div className="mt-5 flex gap-3">
                {["in", "f", "ig"].map((icon) => (
                  <span key={icon} className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 text-[10px] font-bold text-white/60">
                    {icon}
                  </span>
                ))}
              </div>
            </div>

            {[
              { heading: "For Employers", links: ["I need staff", "Our services", "Why choose us", "Case studies"] },
              { heading: "For Candidates", links: ["I'm looking for work", "Search jobs", "Register your CV", "Candidate support"] },
              { heading: "About Us", links: ["About us", "Our team", "Our values", "Work for us"] },
              { heading: "Contact", links: ["0121 630 1643", "info@reachnetworkrec.com"] },
            ].map((col) => (
              <div key={col.heading}>
                <p className="text-xs font-bold uppercase tracking-wider text-orange">{col.heading}</p>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-xs text-white/60 transition hover:text-white">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/10 py-6 text-xs text-white/40 sm:flex-row">
            <p>&copy; {new Date().getFullYear()} Reach Network Recruitment. All rights reserved.</p>
            <div className="flex gap-5">
              <a href="#" className="hover:text-white/70">Privacy Policy</a>
              <a href="#" className="hover:text-white/70">Terms of Use</a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}