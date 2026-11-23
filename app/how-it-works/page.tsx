"use client";

// How it works: employers (temporary or permanent) and candidates
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Footer from "../components/Footer";

type Step = { title: string; body: string; detail: string; time: string };
type Flow = { key: string; label: string; intro: string; steps: Step[]; cta: { label: string; href: string } };

const EMPLOYER_FLOWS: Flow[] = [
  {
    key: "temp",
    label: "Temporary staff",
    intro: "Cover for shifts, peaks and absence, with checked people on site and everything visible in Reach Connect.",
    cta: { label: "Request staff", href: "/i-need-staff#request" },
    steps: [
      { title: "Tell us what you need", time: "2 minutes", body: "Roles, site, shifts, dates and pay rate, by phone, online or in Reach Connect.", detail: "We'll talk through the site, PPE, any licences or tickets needed and how the shifts run, so the people we send are right first time." },
      { title: "We match checked people", time: "Same day where possible", body: "Workers who've passed our checks and suit your site and shifts.", detail: "Every worker has had their ID and right to work checked, work history reviewed and any licences or tickets confirmed before they're offered to you." },
      { title: "Confirmed and briefed", time: "Before the shift", body: "Names confirmed, with site address, start time, PPE and who to report to.", detail: "Workers get everything on their phone, and we call to confirm they're on their way, so there are no surprises on the day." },
      { title: "On site, live", time: "Every shift", body: "GPS and face-checked clock-ins on the Reach Connect live board.", detail: "See who's on site, who hasn't arrived and who's finished, for every site. If someone doesn't turn up, we're already on it." },
      { title: "Approve and pay one invoice", time: "Weekly", body: "Approve timesheets in a tap and get one clear weekly invoice.", detail: "We handle the workers' pay, holiday and payroll. You see hours and costs by site, and can download them whenever you need." },
    ],
  },
  {
    key: "perm",
    label: "Permanent hires",
    intro: "A focused search for the right person, with a shortlist you can trust and support all the way to their first day.",
    cta: { label: "Book a call", href: "/book-a-call" },
    steps: [
      { title: "Role discussion", time: "30 minutes", body: "We learn about the role, the team, pay and what good looks like.", detail: "The more we understand about the site and the people who do well there, the better the shortlist. We'll be honest about pay and availability." },
      { title: "Job spec agreed", time: "Day 1", body: "We write or tidy the job spec and agree the must-haves with you.", detail: "A clear spec means better applicants and fewer wasted interviews." },
      { title: "Search and advertise", time: "From day 1", body: "Our own network, plus Indeed, CV Library, Reed and Totaljobs.", detail: "We search people we already know first, then advertise and headhunt where it makes sense." },
      { title: "Screened shortlist", time: "Usually within a week", body: "Interviewed candidates sent to you with notes, not a pile of CVs.", detail: "Each profile shows why we think they're a fit, their pay expectations and notice period." },
      { title: "Interviews to offer", time: "You choose", body: "We arrange interviews, collect feedback and handle the offer.", detail: "We keep candidates warm, manage counter offers and keep you updated." },
      { title: "Start and follow up", time: "First weeks", body: "We check in with you and your new starter after they begin.", detail: "If something isn't working, we'd rather know early and fix it." },
    ],
  },
];

const CANDIDATE_FLOW: Flow = {
  key: "work",
  label: "Looking for work",
  intro: "Get registered once, get checked once, and get offered work that suits you.",
  cta: { label: "Find work", href: "/looking-for-work" },
  steps: [
    { title: "Register", time: "5 minutes", body: "Sign up with your details and the kind of work you want.", detail: "Tell us your experience, where you can travel to and when you can work." },
    { title: "Upload your documents", time: "10 minutes", body: "ID, right to work and any licences or tickets, straight from your phone.", detail: "Plus any short training we need you to complete before your first shift." },
    { title: "Checked and approved", time: "Usually within 48 hours", body: "We check your documents and approve your profile.", detail: "We'll let you know straight away if we need anything else." },
    { title: "A chat with our team", time: "15 minutes", body: "We get to know you and talk through the work available.", detail: "Pay, shifts, travel, and what you're looking for long term." },
    { title: "Induction and training", time: "Before you start", body: "A site induction and any training the client needs.", detail: "So you know exactly where to go and what to expect on day one." },
    { title: "Get shifts", time: "Ongoing", body: "Shifts offered to you, with clock in and out on your phone.", detail: "Your hours go straight onto your timesheet, so you're paid correctly." },
  ],
};

const CHECKS = [
  { title: "ID and right to work", body: "Checked against original documents or digital share codes." },
  { title: "Work history", body: "Gaps explained and recent roles reviewed." },
  { title: "Licences and tickets", body: "Driving licences, CPC, digi cards and FLT tickets confirmed." },
  { title: "References", body: "Taken up where the role needs them." },
  { title: "Site induction", body: "Your rules, PPE and safety briefing before day one." },
  { title: "Ongoing reviews", body: "Feedback from your site after shifts, acted on quickly." },
];

function Timeline({ flow }: { flow: Flow }) {
  const [open, setOpen] = useState(0);
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <ol className="relative space-y-3">
        <span className="absolute bottom-10 left-[19px] top-10 w-0.5 bg-slate-200" aria-hidden="true">
          <span className="block w-full bg-orange transition-all duration-500" style={{ height: `${(open / Math.max(1, flow.steps.length - 1)) * 100}%` }} />
        </span>
        {flow.steps.map((s, n) => (
          <li key={s.title} className="relative pl-14">
            <button onClick={() => setOpen(n)} className={`absolute left-0 top-4 flex h-10 w-10 items-center justify-center rounded-full border-2 font-extrabold transition ${n <= open ? "border-orange bg-orange text-white" : "border-slate-200 bg-white text-slate-400"}`} aria-label={`Step ${n + 1}`}>
              {n < open ? "✓" : n + 1}
            </button>
            <button onClick={() => setOpen(n)} className={`w-full rounded-2xl border p-5 text-left transition ${open === n ? "border-orange/40 bg-white shadow-lg" : "border-transparent bg-white/60 hover:bg-white"}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-display text-lg font-bold text-navy">{s.title}</p>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-500">{s.time}</span>
              </div>
              <p className="mt-1 text-sm text-slate-600">{s.body}</p>
              {open === n && <p className="mt-3 animate-[fadeIn_.3s_ease] border-t border-slate-100 pt-3 text-sm leading-relaxed text-slate-700">{s.detail}</p>}
            </button>
          </li>
        ))}
      </ol>
      <div className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-3xl bg-navy p-7 text-white shadow-xl">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange">Step {open + 1} of {flow.steps.length}</p>
          <p className="mt-2 font-display text-2xl font-extrabold">{flow.steps[open].title}</p>
          <p className="mt-3 text-white/75">{flow.steps[open].detail}</p>
          <div className="mt-6 flex gap-2">
            <button disabled={open === 0} onClick={() => setOpen(open - 1)} className="rounded-full border border-white/25 px-4 py-2 text-sm font-bold disabled:opacity-30">
              ←
            </button>
            {open < flow.steps.length - 1 ? (
              <button onClick={() => setOpen(open + 1)} className="flex-1 rounded-full bg-white/10 px-4 py-2 text-sm font-bold hover:bg-white/20">
                Next step →
              </button>
            ) : (
              <Link href={flow.cta.href} className="flex-1 rounded-full bg-orange px-4 py-2 text-center text-sm font-bold hover:bg-orange-dark">
                {flow.cta.label} →
              </Link>
            )}
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
      { label: "Why choose us", href: "/why-choose-us" },
      { label: "FAQ", href: "/faq" },
    ],
  },
];

export default function HowItWorks() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [who, setWho] = useState<"employer" | "candidate">("employer");
  const [flowKey, setFlowKey] = useState("temp");
  const flow = who === "candidate" ? CANDIDATE_FLOW : EMPLOYER_FLOWS.find((f) => f.key === flowKey) || EMPLOYER_FLOWS[0];

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
        <Image src="/industries/howitworks.png" alt="" fill priority sizes="100vw" className="object-cover opacity-25" />
        <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/90 to-navy/40" />
        <div className="relative mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-24">
          <nav className="text-sm text-white/60">
            <Link href="/" className="hover:text-white">Home</Link> <span className="mx-1">›</span> <span className="text-white/90">How it works</span>
          </nav>
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.3em] text-orange">How it works</p>
          <h1 className="mt-3 max-w-2xl font-display text-4xl font-extrabold leading-tight text-white sm:text-5xl">
            Simple steps. <span className="text-orange">No surprises.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-white/80">Pick who you are and follow each step, from first call to first shift.</p>
          <div className="mt-8 inline-flex rounded-full bg-white/10 p-1.5 backdrop-blur">
            {(["employer", "candidate"] as const).map((w) => (
              <button key={w} onClick={() => setWho(w)} className={`rounded-full px-6 py-3 text-sm font-bold transition ${who === w ? "bg-orange text-white shadow-lg" : "text-white/80 hover:text-white"}`}>
                {w === "employer" ? "I need staff" : "I'm looking for work"}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* TIMELINE */}
      <section className="bg-slate-50 py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          {who === "employer" && (
            <div className="mb-8 flex flex-wrap gap-2">
              {EMPLOYER_FLOWS.map((f) => (
                <button key={f.key} onClick={() => setFlowKey(f.key)} className={`rounded-full border px-5 py-2.5 text-sm font-bold transition ${flowKey === f.key ? "border-navy bg-navy text-white" : "border-slate-300 bg-white text-navy hover:border-navy"}`}>
                  {f.label}
                </button>
              ))}
            </div>
          )}
          <h2 className="font-display text-3xl font-extrabold text-navy">{flow.label}</h2>
          <p className="mt-2 max-w-2xl text-slate-600">{flow.intro}</p>
          <div className="mt-10">
            <div key={flow.key}><Timeline flow={flow} /></div>
          </div>
        </div>
      </section>

      {/* CHECKS */}
      <section className="bg-white py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange">Our checks</p>
          <h2 className="mt-3 font-display text-3xl font-extrabold text-navy">{who === "employer" ? "Every worker, checked before they reach you" : "What we check, and why"}</h2>
          <p className="mt-2 max-w-2xl text-slate-600">
            {who === "employer" ? "The same checks for every worker, every time, recorded in our system." : "It keeps you, the client and everyone on site safe, and you only do it once."}
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CHECKS.map((c, n) => (
              <div key={c.title} className="flex gap-4 rounded-2xl border border-slate-200 p-5 transition hover:-translate-y-0.5 hover:border-orange/50 hover:shadow-md">
                <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-orange/10 font-extrabold text-orange">{n + 1}</span>
                <div>
                  <p className="font-display font-bold text-navy">{c.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{c.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* REACH CONNECT STRIP */}
      <section className="bg-navy py-16">
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange">Reach Connect</p>
            <h2 className="mt-3 font-display text-3xl font-extrabold text-white">{who === "employer" ? "See every step, live" : "Everything on your phone"}</h2>
            <p className="mt-3 text-white/75">
              {who === "employer"
                ? "Temporary staffing clients get Reach Connect: request staff, see who's on site, approve timesheets and track costs by site."
                : "Your shifts, clock in and out, documents and messages with our team, all in one app."}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href={who === "employer" ? "/book-a-demo" : "/looking-for-work"} className="rounded-full bg-orange px-6 py-3 font-bold text-white hover:bg-orange-dark">
                {who === "employer" ? "Book a demo" : "Find work"}
              </Link>
              {who === "employer" && (
                <Link href="/reach-connect" className="rounded-full border border-white/30 px-6 py-3 font-bold text-white hover:bg-white/10">
                  Explore Reach Connect
                </Link>
              )}
            </div>
          </div>
          <div className="relative aspect-video overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/10">
            <Image src="/reach-connect/poster.jpg" alt="Reach Connect dashboard" fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-orange py-14">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 text-center lg:flex-row lg:px-8 lg:text-left">
          <div>
            <p className="font-display text-2xl font-extrabold text-white sm:text-3xl">{who === "employer" ? "Ready when you are." : "Ready to start?"}</p>
            <p className="mt-1 text-white/90">Call 0121 630 1643 or get started online.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href={flow.cta.href} className="rounded-full bg-navy px-7 py-3.5 font-bold text-white hover:bg-navy-deep">
              {flow.cta.label}
            </Link>
            <a href="tel:01216301643" className="rounded-full border-2 border-white px-7 py-3.5 font-bold text-white hover:bg-white hover:text-orange">
              Call us
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
