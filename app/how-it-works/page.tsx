"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

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

const TEMPORARY_STEPS = [
  { title: "Register", description: "You register with your details to get started." },
  { title: "Upload Documents & Training", description: "Upload your documents and complete initial training." },
  { title: "Documents Checked & Approved", description: "We verify your documents and approve your profile." },
  { title: "Initial Chat", description: "Have an initial chat with our team to discuss opportunities." },
  { title: "Site Induction & Training", description: "Complete your site induction and any further training." },
  { title: "Shift Assignment", description: "You'll be assigned shifts that suit you and start work." },
];

const PERMANENT_STEPS = [
  { title: "Role Discussion & Requirements", description: "We discuss your goals and the type of role you're looking for." },
  { title: "Job Spec Received", description: "We receive the full job spec from our client and align on requirements." },
  { title: "Job Advertised", description: "We advertise your role on Indeed, CV Library, Reed and Totaljobs." },
  { title: "Review Applications", description: "We review applications and interview relevant candidates." },
  { title: "Candidate Submission", description: "We submit the best matched candidates for your review." },
  { title: "Candidate Interview", description: "You interview your preferred candidates with our support." },
  { title: "Start Date Confirmed", description: "You select your candidate and confirm the start date." },
];

export default function HowItWorks() {
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
            <Link href="/book-a-call" className="mx-3 mt-2 rounded-full bg-orange px-5 py-2.5 text-center text-sm font-bold text-white transition hover:bg-orange-dark sm:hidden">
              Let&rsquo;s Talk
            </Link>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section className="relative isolate overflow-hidden bg-navy">
        <div className="absolute inset-0">
          <Image
            src="/industries/howitworks.png"
            alt="Reach Network team member"
            fill
            sizes="100vw"
            className="object-cover object-top"
            priority
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/90 to-navy/40" />

        <div className="relative mx-auto max-w-7xl px-6 pb-24 pt-12 lg:px-8 lg:pb-32 lg:pt-16">
          <div className="max-w-lg">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange">How it works</p>
            <h1 className="font-display mt-3 text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl">
              Our process. <span className="text-orange">Your success.</span>
            </h1>
            <p className="mt-4 max-w-md text-sm text-white/70 sm:text-base">
              We follow a clear, proven process to connect the right people with the right opportunities.
            </p>
          </div>
        </div>
      </section>

      {/* PROCESS TIMELINES */}
      <section className="bg-slate-50 py-14 lg:py-20">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-6 lg:grid-cols-2 lg:px-8">
          {/* TEMPORARY */}
          <div className="rounded-2xl border border-slate-200 bg-white">
            <div className="flex items-center gap-3.5 border-b border-slate-100 p-6">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-navy text-white">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" className="h-5 w-5">
                  <rect x="2" y="3" width="12" height="11" rx="1.5" />
                  <path d="M2 6.5h12M5 2v2.5M11 2v2.5" strokeLinecap="round" />
                </svg>
              </span>
              <div>
                <p className="font-display text-sm font-extrabold uppercase tracking-wide text-navy">Temporary</p>
                <p className="text-xs text-slate-500">Get onboarded quickly and start earning.</p>
              </div>
            </div>

            <div className="p-6">
              {TEMPORARY_STEPS.map((step, i) => (
                <div key={step.title} className={`flex gap-4 ${i !== TEMPORARY_STEPS.length - 1 ? "pb-6" : ""}`}>
                  <div className="relative flex flex-col items-center">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy text-xs font-bold text-white">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {i !== TEMPORARY_STEPS.length - 1 && <span className="mt-1 w-px flex-1 bg-slate-200" />}
                  </div>
                  <div className={i !== TEMPORARY_STEPS.length - 1 ? "border-b border-slate-100 pb-6" : ""}>
                    <p className="font-display text-sm font-bold text-navy">{step.title}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* PERMANENT */}
          <div className="rounded-2xl border border-slate-200 bg-white">
            <div className="flex items-center gap-3.5 border-b border-slate-100 p-6">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-orange text-white">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" className="h-5 w-5">
                  <rect x="2" y="5" width="12" height="8" rx="1.5" />
                  <path d="M5.5 5V3.5A1.5 1.5 0 0 1 7 2h2a1.5 1.5 0 0 1 1.5 1.5V5" strokeLinecap="round" />
                </svg>
              </span>
              <div>
                <p className="font-display text-sm font-extrabold uppercase tracking-wide text-orange">Permanent</p>
                <p className="text-xs text-slate-500">We find the right role. You build your future.</p>
              </div>
            </div>

            <div className="p-6">
              {PERMANENT_STEPS.map((step, i) => (
                <div key={step.title} className={`flex gap-4 ${i !== PERMANENT_STEPS.length - 1 ? "pb-6" : ""}`}>
                  <div className="relative flex flex-col items-center">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange text-xs font-bold text-white">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {i !== PERMANENT_STEPS.length - 1 && <span className="mt-1 w-px flex-1 bg-slate-200" />}
                  </div>
                  <div className={i !== PERMANENT_STEPS.length - 1 ? "border-b border-slate-100 pb-6" : ""}>
                    <p className="font-display text-sm font-bold text-navy">{step.title}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA STRIP */}
        <div className="mx-auto mt-6 max-w-7xl px-6 lg:px-8">
          <div className="flex flex-col items-start justify-between gap-5 rounded-2xl bg-white p-6 shadow-sm sm:flex-row sm:items-center">
            <div className="flex items-center gap-3.5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-navy text-orange">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" className="h-5 w-5">
                  <path d="M2 13l4-4 3 3 5-6M11 5h3v3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <div>
                <p className="font-display text-sm font-bold text-navy">
                  A proven process. Better hires. <span className="text-orange">Stronger businesses.</span>
                </p>
                <p className="mt-0.5 text-xs text-slate-500">That&rsquo;s how we deliver recruitment that makes an impact.</p>
              </div>
            </div>
            <Link
              href="/book-a-call"
              className="flex shrink-0 items-center gap-1.5 rounded-full border border-navy px-6 py-3 text-sm font-bold text-navy transition hover:bg-navy hover:text-white"
            >
              Let&rsquo;s talk <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
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