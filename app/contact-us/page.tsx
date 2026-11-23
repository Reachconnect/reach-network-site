"use client";

// Contact us
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Footer from "../components/Footer";

const ROUTES = [
  { label: "I need staff", body: "Send a staff request in two minutes.", href: "/i-need-staff#request", icon: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm11-3v6m3-3h-6" },
  { label: "I'm looking for work", body: "See live jobs or send your CV.", href: "/looking-for-work", icon: "M21 21l-4.3-4.3M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14z" },
  { label: "Book a call", body: "Pick a time and we'll call you.", href: "/book-a-call", icon: "M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" },
  { label: "Reach Connect demo", body: "See the client portal in 15 minutes.", href: "/book-a-demo", icon: "M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm4 17h2" },
];

const TOPICS = ["I need staff", "I'm looking for work", "Reach Connect support", "Terms or invoices", "General enquiry"];

const PHONE_ICON = "M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z";
const MAIL_ICON = "M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm18 2-10 7L2 6";
const PIN_ICON = "M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21zm0-9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z";

function Icon({ d, className = "h-5 w-5" }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d={d} />
    </svg>
  );
}

function ContactForm() {
  const [f, setF] = useState({ fullName: "", companyName: "", jobTitle: "", phoneNumber: "", workEmail: "", helpTopic: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF((p) => ({ ...p, [k]: e.target.value }));
  const candidate = f.helpTopic === "I'm looking for work";
  const input = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-navy focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange/20";
  const ready = f.helpTopic && f.fullName && f.workEmail && f.phoneNumber && f.message && (candidate || f.companyName);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError(null);
    try {
      const res = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(candidate ? { ...f, companyName: "", jobTitle: "" } : f) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Something went wrong.");
      setStatus("done");
    } catch (err) {
      setError(`${(err as Error).message} You can also call us on 0121 630 1643.`);
      setStatus("idle");
    }
  }

  if (status === "done") {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-3xl bg-white p-10 text-center shadow-2xl">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl text-green-700">✓</div>
        <p className="mt-4 font-display text-2xl font-extrabold text-navy">Message sent</p>
        <p className="mt-2 max-w-sm text-slate-600">Thanks, {f.fullName.split(" ")[0]}. We&apos;ll get back to you shortly, and a copy is on its way to {f.workEmail}.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
      <p className="font-display text-2xl font-extrabold text-navy">Send us a message</p>
      <p className="mt-1 text-sm text-slate-500">What&apos;s it about?</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {TOPICS.map((t) => (
          <button type="button" key={t} onClick={() => setF((p) => ({ ...p, helpTopic: t }))} className={`rounded-full border px-3.5 py-2 text-sm font-semibold transition ${f.helpTopic === t ? "border-orange bg-orange/10 text-navy" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}>
            {t}
          </button>
        ))}
      </div>
      <div className="mt-5 space-y-3">
        <input className={input} placeholder="Full name" value={f.fullName} onChange={set("fullName")} autoComplete="name" required />
        {!candidate && (
          <div className="grid gap-3 sm:grid-cols-2">
            <input className={input} placeholder="Company" value={f.companyName} onChange={set("companyName")} autoComplete="organization" required />
            <input className={input} placeholder="Job title (optional)" value={f.jobTitle} onChange={set("jobTitle")} autoComplete="organization-title" />
          </div>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <input className={input} type="email" placeholder="Email" value={f.workEmail} onChange={set("workEmail")} autoComplete="email" required />
          <input className={input} type="tel" placeholder="Phone" value={f.phoneNumber} onChange={set("phoneNumber")} autoComplete="tel" required />
        </div>
        <textarea className={input} rows={4} placeholder={candidate ? "What kind of work are you looking for, and where?" : "How can we help?"} value={f.message} onChange={set("message")} required />
        {candidate && (
          <p className="rounded-xl bg-orange/5 p-3 text-sm text-slate-600">
            Got a CV?{" "}
            <Link href="/looking-for-work" className="font-bold text-orange hover:underline">
              Send it from our jobs page
            </Link>{" "}
            so we can match you faster.
          </p>
        )}
        {error && <p className="rounded-lg bg-red-50 p-2.5 text-sm text-red-700">{error}</p>}
        <button disabled={!ready || status === "sending"} className="w-full rounded-full bg-orange px-5 py-3.5 font-bold text-white shadow-lg shadow-orange/30 transition hover:bg-orange-dark disabled:opacity-40 disabled:shadow-none">
          {status === "sending" ? "Sending…" : "Send message"}
        </button>
        <p className="text-center text-xs text-slate-400">
          We&apos;ll only use your details to reply. See our <Link href="/privacy-notice" className="underline">privacy notice</Link>.
        </p>
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

export default function ContactUs() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>(null);

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
      <section className="relative overflow-hidden bg-navy pb-36 pt-12">
        <Image src="/industries/contactus.png" alt="" fill priority sizes="100vw" className="object-cover opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-navy/60 to-navy" />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <nav className="text-sm text-white/60">
            <Link href="/" className="hover:text-white">Home</Link> <span className="mx-1">›</span> <span className="text-white/90">Contact us</span>
          </nav>
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.3em] text-orange">Contact us</p>
          <h1 className="mt-3 max-w-2xl font-display text-4xl font-extrabold leading-tight text-white sm:text-5xl">
            Talk to a real person. <span className="text-orange">Fast.</span>
          </h1>
          <p className="mt-4 max-w-xl text-lg text-white/80">Call, email, pop in or send a message. Whatever&apos;s easiest for you.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="tel:01216301643" className="flex items-center gap-2 rounded-full bg-orange px-6 py-3.5 font-bold text-white shadow-lg shadow-orange/30 hover:bg-orange-dark">
              <Icon d={PHONE_ICON} className="h-4 w-4" /> 0121 630 1643
            </a>
            <a href="mailto:info@reachnetworkrec.com" className="flex items-center gap-2 rounded-full border border-white/30 px-6 py-3.5 font-bold text-white hover:bg-white/10">
              <Icon d={MAIL_ICON} className="h-4 w-4" /> info@reachnetworkrec.com
            </a>
          </div>
        </div>
      </section>

      {/* QUICK ROUTES */}
      <section className="relative -mt-24">
        <div className="mx-auto grid max-w-7xl gap-3 px-6 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
          {ROUTES.map((r) => (
            <Link key={r.label} href={r.href} className="group rounded-2xl bg-white p-5 shadow-xl ring-1 ring-black/5 transition hover:-translate-y-1 hover:ring-orange/40">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange/10 text-orange transition group-hover:bg-orange group-hover:text-white">
                <Icon d={r.icon} />
              </span>
              <p className="mt-4 font-display text-lg font-bold text-navy">{r.label}</p>
              <p className="mt-1 text-sm text-slate-500">{r.body}</p>
              <p className="mt-3 text-sm font-bold text-orange">
                Go <span className="inline-block transition group-hover:translate-x-1">→</span>
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* FORM + DETAILS */}
      <section className="bg-slate-50 pb-16 pt-14 lg:pb-20">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 lg:grid-cols-[1.2fr_1fr] lg:px-8">
          <ContactForm />
          <div className="space-y-4">
            <div className="rounded-3xl bg-navy p-7 text-white">
              <p className="font-display text-xl font-bold">Get in touch</p>
              <div className="mt-5 space-y-4">
                <a href="tel:01216301643" className="flex items-center gap-4 rounded-2xl bg-white/5 p-4 transition hover:bg-white/10">
                  <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-orange">
                    <Icon d={PHONE_ICON} />
                  </span>
                  <span>
                    <span className="block text-xs text-white/60">Phone</span>
                    <span className="block font-bold">0121 630 1643</span>
                  </span>
                </a>
                <a href="mailto:info@reachnetworkrec.com" className="flex items-center gap-4 rounded-2xl bg-white/5 p-4 transition hover:bg-white/10">
                  <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-orange">
                    <Icon d={MAIL_ICON} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs text-white/60">Email</span>
                    <span className="block truncate font-bold">info@reachnetworkrec.com</span>
                  </span>
                </a>
                <a href="https://www.google.com/maps/search/?api=1&query=132a+High+Street+Bromsgrove+B61+8ES" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 rounded-2xl bg-white/5 p-4 transition hover:bg-white/10">
                  <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-orange">
                    <Icon d={PIN_ICON} />
                  </span>
                  <span>
                    <span className="block text-xs text-white/60">Office</span>
                    <span className="block font-bold">132a High Street, Bromsgrove, B61 8ES</span>
                    <span className="block text-xs text-orange">Get directions →</span>
                  </span>
                </a>
              </div>
            </div>
            <div className="relative h-72 overflow-hidden rounded-3xl shadow-sm ring-1 ring-black/5">
              <iframe
                title="Reach Network Recruitment office map"
                src="https://www.openstreetmap.org/export/embed.html?bbox=-2.0700%2C52.3310%2C-2.0480%2C52.3400&layer=mapnik&marker=52.3355%2C-2.0590"
                className="absolute inset-0 h-full w-full border-0"
                loading="lazy"
              />
            </div>
            <Link href="/faq" className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-orange">
              <span>
                <span className="block font-bold text-navy">Quick question?</span>
                <span className="block text-sm text-slate-500">The answer may already be in our FAQ.</span>
              </span>
              <span className="text-orange">→</span>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
