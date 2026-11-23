"use client";

// Book a call: employers and candidates pick a slot, it goes into the CRM
import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Footer from "../components/Footer";

const TIME_SLOTS = ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00", "17:00"];

const TOPICS: Record<"employer" | "candidate", { label: string; icon: string }[]> = {
  employer: [
    { label: "Hiring drivers", icon: "M3 7h11v9H3zM14 10h4l3 3v3h-7M7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm10 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" },
    { label: "Hiring warehouse staff", icon: "M3 21V9l9-6 9 6v12M7 21v-7h10v7" },
    { label: "Hiring manufacturing staff", icon: "M3 21V11l6 3V11l6 3V7l6 3v11z" },
    { label: "Hiring engineers", icon: "M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.5-.5-.5-2.5z" },
    { label: "Reach Connect", icon: "M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm4 17h2" },
    { label: "General enquiry", icon: "M21 12a8 8 0 0 1-11.8 7L4 20l1-4.6A8 8 0 1 1 21 12z" },
  ],
  candidate: [
    { label: "Driving work", icon: "M3 7h11v9H3zM14 10h4l3 3v3h-7M7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm10 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" },
    { label: "Warehouse work", icon: "M3 21V9l9-6 9 6v12M7 21v-7h10v7" },
    { label: "Manufacturing work", icon: "M3 21V11l6 3V11l6 3V7l6 3v11z" },
    { label: "Engineering work", icon: "M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.5-.5-.5-2.5z" },
    { label: "A job I've seen", icon: "M4 6h16M4 12h16M4 18h10" },
    { label: "Something else", icon: "M21 12a8 8 0 0 1-11.8 7L4 20l1-4.6A8 8 0 1 1 21 12z" },
  ],
};

const EXPECT: Record<"employer" | "candidate", { title: string; body: string }[]> = {
  employer: [
    { title: "Your roles and sites", body: "What you need, where, the shifts and what good looks like." },
    { title: "Honest advice", body: "Pay rates, availability and how quickly we can realistically fill it." },
    { title: "How we'd work together", body: "Temporary, temp-to-perm or permanent, and what it costs." },
    { title: "A clear next step", body: "A site visit, terms to sign or a Reach Connect demo." },
  ],
  candidate: [
    { title: "Your experience", body: "What you've done, your licences or tickets and what you enjoy." },
    { title: "What you want", body: "Pay, shifts, travel and whether you want temp or permanent work." },
    { title: "What's available", body: "Roles we have right now that suit you." },
    { title: "Getting started", body: "Registering, documents and your first shift or interview." },
  ],
};

const FAQS = [
  { q: "Is the call free?", a: "Yes, always. We never charge candidates, and there's no obligation for employers." },
  { q: "How long is the call?", a: "Usually about 15 minutes. Longer if there's a lot to talk through." },
  { q: "I've seen a job on your website. Can I book a call about it?", a: "Of course. Please send your CV from the job page first, so we can talk about it on the call." },
  { q: "What if I need to cancel or move it?", a: "Just reply to your confirmation email, or call us on 0121 630 1643, and we'll find another time." },
  { q: "What happens after the call?", a: "Employers get a clear next step, such as a site visit, terms or a Reach Connect demo. Candidates get details of suitable roles by email." },
];

function key(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function label12(t: string) {
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "pm" : "am"}`;
}

function Icon({ d, className = "h-5 w-5" }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d={d} />
    </svg>
  );
}

function Booking({ who, setWho }: { who: "employer" | "candidate"; setWho: (w: "employer" | "candidate") => void }) {
  const today = useMemo(() => new Date(), []);
  const [month, setMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState("");
  const [f, setF] = useState({ fullName: "", workEmail: "", phoneNumber: "", companyName: "", jobTitle: "", helpTopic: "", notes: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF((p) => ({ ...p, [k]: e.target.value }));
  const input = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-navy focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange/20";

  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const lead = (new Date(month.getFullYear(), month.getMonth(), 1).getDay() + 6) % 7;
  const cells: (Date | null)[] = [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1))];
  const todayKey = key(today);
  const ok = (d: Date) => d.getDay() !== 0 && d.getDay() !== 6 && key(d) > todayKey;
  const atStart = month.getFullYear() === today.getFullYear() && month.getMonth() === today.getMonth();
  const ready = date && time && f.fullName && f.workEmail && f.phoneNumber && f.helpTopic && (who === "candidate" || f.companyName);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!date || !time) return;
    setStatus("sending");
    setError(null);
    try {
      const res = await fetch("/api/book-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...f,
          companyName: who === "candidate" ? f.companyName || "Candidate" : f.companyName,
          jobTitle: who === "candidate" ? f.jobTitle || "Candidate" : f.jobTitle,
          helpTopic: `${who === "candidate" ? "Candidate" : "Employer"}: ${f.helpTopic}`,
          date: key(date),
          time,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Something went wrong.");
      setStatus("done");
    } catch (err) {
      setError(`${(err as Error).message} You can also call us on 0121 630 1643.`);
      setStatus("idle");
    }
  }

  if (status === "done" && date) {
    return (
      <div className="rounded-3xl bg-white p-10 text-center shadow-2xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl text-green-700">✓</div>
        <p className="mt-4 font-display text-2xl font-extrabold text-navy">You&apos;re booked in</p>
        <p className="mt-2 text-slate-600">
          {date.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })} at {label12(time)}. We&apos;ll call you on {f.phoneNumber}.
        </p>
        <p className="mt-1 text-sm text-slate-500">A confirmation is on its way to {f.workEmail}.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="overflow-hidden rounded-3xl bg-white shadow-2xl">
      <div className="grid grid-cols-2 border-b border-slate-100">
        {(["employer", "candidate"] as const).map((w) => (
          <button type="button" key={w} onClick={() => { setWho(w); setF((p) => ({ ...p, helpTopic: "" })); }} className={`py-4 text-sm font-bold transition ${who === w ? "bg-navy text-white" : "text-slate-500 hover:bg-slate-50"}`}>
            {w === "employer" ? "I'm hiring" : "I'm looking for work"}
          </button>
        ))}
      </div>
      <div className="grid gap-0 lg:grid-cols-2">
        {/* LEFT: when */}
        <div className="border-slate-100 p-6 sm:p-8 lg:border-r">
          <p className="text-xs font-bold uppercase tracking-wider text-orange">1. Pick a time</p>
          <div className="mt-4 flex items-center justify-between">
            <button type="button" disabled={atStart} onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-navy disabled:opacity-30" aria-label="Previous month">‹</button>
            <p className="font-display font-bold text-navy">{month.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</p>
            <button type="button" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-navy" aria-label="Next month">›</button>
          </div>
          <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-slate-400">
            {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => <span key={i}>{d}</span>)}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {cells.map((d, i) =>
              d ? (
                <button type="button" key={i} disabled={!ok(d)} onClick={() => setDate(d)} className={`aspect-square rounded-xl text-sm font-bold transition ${date && key(date) === key(d) ? "bg-orange text-white shadow-md" : ok(d) ? "text-navy hover:bg-orange/10" : "text-slate-300"}`}>
                  {d.getDate()}
                </button>
              ) : (
                <span key={i} />
              )
            )}
          </div>
          {date && (
            <div className="mt-5 animate-[fadeIn_.3s_ease]">
              <p className="text-sm font-semibold text-navy">{date.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</p>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {TIME_SLOTS.map((t) => (
                  <button type="button" key={t} onClick={() => setTime(t)} className={`rounded-xl border py-2 text-xs font-bold transition ${time === t ? "border-orange bg-orange/10 text-navy" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}>
                    {label12(t)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: who */}
        <div className="space-y-4 bg-slate-50/60 p-6 sm:p-8">
          <p className="text-xs font-bold uppercase tracking-wider text-orange">2. What&apos;s it about?</p>
          <div className="grid grid-cols-2 gap-2">
            {TOPICS[who].map((t) => (
              <button type="button" key={t.label} onClick={() => setF((p) => ({ ...p, helpTopic: t.label }))} className={`flex items-center gap-2 rounded-xl border p-2.5 text-left text-xs font-bold transition ${f.helpTopic === t.label ? "border-orange bg-orange/10 text-navy" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}>
                <Icon d={t.icon} className="h-4 w-4 flex-none text-orange" />
                {t.label}
              </button>
            ))}
          </div>
          <p className="pt-2 text-xs font-bold uppercase tracking-wider text-orange">3. Your details</p>
          <input className={input} placeholder="Full name" value={f.fullName} onChange={set("fullName")} autoComplete="name" required />
          {who === "employer" && (
            <div className="grid grid-cols-2 gap-3">
              <input className={input} placeholder="Company" value={f.companyName} onChange={set("companyName")} autoComplete="organization" required />
              <input className={input} placeholder="Job title" value={f.jobTitle} onChange={set("jobTitle")} autoComplete="organization-title" />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <input className={input} type="email" placeholder="Email" value={f.workEmail} onChange={set("workEmail")} autoComplete="email" required />
            <input className={input} type="tel" placeholder="Phone" value={f.phoneNumber} onChange={set("phoneNumber")} autoComplete="tel" required />
          </div>
          <textarea className={input} rows={2} placeholder="Anything we should know? (optional)" value={f.notes} onChange={set("notes")} />
          {error && <p className="rounded-lg bg-red-50 p-2.5 text-sm text-red-700">{error}</p>}
          <button disabled={!ready || status === "sending"} className="w-full rounded-full bg-orange px-5 py-3.5 font-bold text-white shadow-lg shadow-orange/30 transition hover:bg-orange-dark disabled:opacity-40 disabled:shadow-none">
            {status === "sending" ? "Booking…" : date && time ? `Book ${date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })} at ${label12(time)}` : "Pick a date and time"}
          </button>
        </div>
      </div>
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

export default function BookACallPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [who, setWho] = useState<"employer" | "candidate">("employer");
  const [faq, setFaq] = useState<number | null>(0);

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
      <section className="relative overflow-hidden bg-navy pb-40 pt-12">
        <Image src="/industries/contactus.png" alt="" fill priority sizes="100vw" className="object-cover opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-navy/70 to-navy" />
        <div className="relative mx-auto max-w-7xl px-6 text-center lg:px-8">
          <nav className="text-sm text-white/60">
            <Link href="/" className="hover:text-white">Home</Link> <span className="mx-1">›</span> <span className="text-white/90">Book a call</span>
          </nav>
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.3em] text-orange">Book a call</p>
          <h1 className="mx-auto mt-3 max-w-3xl font-display text-4xl font-extrabold leading-tight text-white sm:text-5xl">
            Pick a time. <span className="text-orange">We&apos;ll call you.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-white/80">A free 15-minute call, whether you&apos;re hiring or looking for work.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-white/75">
            {["Free", "About 15 minutes", "No obligation"].map((x) => (
              <span key={x} className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange text-[10px] font-bold text-white">✓</span>
                {x}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* BOOKING */}
      <section className="relative -mt-32 pb-16">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <Booking who={who} setWho={setWho} />
          <p className="mt-5 text-center text-sm text-slate-500">
            Need us now? Call <a href="tel:01216301643" className="font-bold text-navy hover:text-orange">0121 630 1643</a>
          </p>
        </div>
      </section>

      {/* WHAT TO EXPECT */}
      <section className="bg-slate-50 py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange">On the call</p>
          <h2 className="mt-3 font-display text-3xl font-extrabold text-navy">What we&apos;ll talk about</h2>
          <div key={who} className="mt-10 grid animate-[fadeIn_.35s_ease] gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {EXPECT[who].map((x, n) => (
              <div key={x.title} className="relative rounded-2xl bg-white p-6 shadow-sm">
                <span className="font-display text-4xl font-extrabold text-orange/25">0{n + 1}</span>
                <p className="mt-2 font-display text-lg font-bold text-navy">{x.title}</p>
                <p className="mt-1 text-sm text-slate-600">{x.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ + CONTACT */}
      <section className="bg-white py-16 lg:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-[1fr_380px] lg:px-8">
          <div>
            <h2 className="font-display text-3xl font-extrabold text-navy">Questions</h2>
            <div className="mt-6 divide-y divide-slate-200 rounded-2xl border border-slate-200">
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
          <div className="space-y-3 lg:pt-14">
            <a href="tel:01216301643" className="flex items-center gap-4 rounded-2xl bg-navy p-5 text-white transition hover:-translate-y-0.5">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange">
                <Icon d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" />
              </span>
              <span>
                <span className="block text-xs text-white/60">Call us</span>
                <span className="block font-display text-lg font-bold">0121 630 1643</span>
              </span>
            </a>
            <div className="flex items-center gap-4 rounded-2xl border border-slate-200 p-5">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange/10 text-orange">
                <Icon d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21zm0-9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" />
              </span>
              <span>
                <span className="block text-xs text-slate-500">Our office</span>
                <span className="block font-bold text-navy">132a High Street, Bromsgrove, B61 8ES</span>
              </span>
            </div>
            <Link href={who === "employer" ? "/i-need-staff#request" : "/looking-for-work"} className="block rounded-2xl border border-orange/40 bg-orange/5 p-5 font-bold text-navy transition hover:bg-orange/10">
              {who === "employer" ? "Rather just send a staff request? →" : "Rather browse jobs first? →"}
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
