"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Footer from "../../components/Footer";

const BENEFITS = [
  { title: "Reliable & vetted", sub: "All our warehouse staff are fully checked, vetted and reference-verified." },
  { title: "Flexible & scalable", sub: "Scale up or down quickly to match your demand." },
  { title: "Short & long term", sub: "From same-day cover to long-term solutions, we've got you covered." },
  { title: "Experienced people", sub: "Skilled in a wide range of warehouse environments." },
  { title: "Safety focused", sub: "We prioritise health, safety and compliance in everything we do." },
  { title: "True partnership", sub: "We build lasting relationships that support your success." },
];

const ROLE_TYPES = [
  "Goods in / Receiving",
  "Put away / Stock control",
  "Picking & Packing",
  "Order processing",
  "Returns handling",
  "Dispatch / Loading",
  "Inventory management",
  "General warehouse duties",
];

const PROCESS = [
  { step: "1", title: "Understand your needs", sub: "We take the time to understand your operation, roles and workforce needs." },
  { step: "2", title: "Source & screen", sub: "We find and vet the right candidates, checking skills, experience and references." },
  { step: "3", title: "Deliver quickly", sub: "We provide reliable staff, when and where you need them most." },
  { step: "4", title: "Ongoing support", sub: "We stay in touch to ensure consistency, quality and long-term success." },
];

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

export default function WarehousePage() {
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
      <section className="relative isolate min-h-[480px] overflow-hidden bg-navy">
        <div className="absolute inset-0">
          <Image src="/industries/warehousehelp.png" alt="Warehouse staff at work" fill sizes="100vw" className="object-cover object-center" priority />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/85 to-navy/20" />

        <div className="relative mx-auto max-w-7xl px-6 pb-24 pt-8 lg:px-8 lg:pb-32 lg:pt-10">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-white/50">
            <Link href="/" className="hover:text-white">Home</Link>
            <span>&#8250;</span>
            <Link href="/industries" className="hover:text-white">Industries</Link>
            <span>&#8250;</span>
            <span>Warehouse</span>
          </p>

          <div className="mt-6 max-w-lg">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange">Warehouse recruitment</p>
            <h1 className="font-display mt-3 text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl">
              The right people. <span className="text-orange">Keeping your operations moving.</span>
            </h1>
            <p className="mt-4 max-w-md text-sm text-white/70 sm:text-base">
              From picking and packing to inventory and dispatch, we supply reliable warehouse staff who keep your supply chain running smoothly.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/book-a-call" className="flex items-center gap-1.5 rounded-full bg-orange px-6 py-3 text-sm font-bold text-white transition hover:bg-orange-dark">
                Find warehouse staff <span aria-hidden="true">&rarr;</span>
              </Link>
              <Link href="/looking-for-work" className="flex items-center gap-1.5 rounded-full border border-white/25 px-6 py-3 text-sm font-bold text-white transition hover:border-white/50">
                Find warehouse jobs <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* BENEFITS STRIP */}
      <section className="relative z-10 -mt-16 lg:-mt-20">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-6 rounded-2xl bg-white p-6 shadow-xl shadow-navy/10 sm:grid-cols-3 lg:grid-cols-6 lg:p-8">
            {BENEFITS.map((b) => (
              <div key={b.title} className="text-center">
                <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-navy">
                  <svg viewBox="0 0 16 16" fill="currentColor" className="h-4.5 w-4.5">
                    <circle cx="8" cy="8" r="3" />
                  </svg>
                </span>
                <p className="font-display mt-3 text-xs font-bold text-navy">{b.title}</p>
                <p className="mt-1 text-[11px] leading-snug text-slate-500">{b.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ROLES + PHOTO + WORKFORCE SOLUTIONS */}
      <section className="bg-white pb-16 pt-16 lg:pb-24 lg:pt-24">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
            <div className="relative overflow-hidden rounded-2xl bg-navy p-8 lg:p-10">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange">We supply staff for</p>
              <h2 className="font-display mt-3 text-2xl font-extrabold text-white">All areas of the warehouse</h2>
              <ul className="mt-6 space-y-3">
                {ROLE_TYPES.map((role) => (
                  <li key={role} className="flex items-center gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange/20 text-orange">
                      <svg viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3">
                        <path d="M6.2 10.9 3.5 8.2l1-1 1.7 1.7 4.6-4.6 1 1z" />
                      </svg>
                    </span>
                    <span className="text-sm font-medium text-white/90">{role}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
              <div className="relative min-h-[220px] overflow-hidden rounded-2xl sm:min-h-[260px] lg:min-h-[180px]">
                <Image src="/industries/industry-warehousing.png" alt="Warehouse operative packing a box" fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
              </div>
              <div className="rounded-2xl bg-slate-50 p-6 lg:p-8">
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange">Tailored solutions</p>
                <h3 className="font-display mt-3 text-xl font-extrabold text-navy">
                  Workforce solutions that fit your business
                </h3>
                <p className="mt-3 text-sm text-slate-500">
                  Every operation is different. That&rsquo;s why we take the time to understand your business, challenges and goals, delivering the right people at the right time.
                </p>
                <Link href="/book-a-call" className="mt-5 flex w-fit items-center gap-1.5 rounded-full border border-navy/20 px-5 py-2.5 text-sm font-bold text-navy transition hover:border-navy/40">
                  Let&rsquo;s talk <span aria-hidden="true">&rarr;</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROCESS */}
      <section className="bg-slate-50 py-16 lg:py-20">
        <div className="mx-auto max-w-6xl px-6 text-center lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange">Our process</p>
          <h2 className="font-display mt-3 text-2xl font-extrabold text-navy sm:text-3xl">Simple. Fast. Effective.</h2>

          <div className="mt-10 grid grid-cols-1 gap-8 text-left sm:grid-cols-2 lg:grid-cols-4">
            {PROCESS.map((p) => (
              <div key={p.step}>
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-navy text-sm font-extrabold text-white">
                  {p.step}
                </span>
                <p className="font-display mt-3 text-sm font-bold text-navy">{p.title}</p>
                <p className="mt-1 text-xs text-slate-500">{p.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white pb-16 lg:pb-20">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <div className="flex flex-col items-start gap-5 rounded-2xl bg-navy p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between lg:p-8">
            <div className="flex items-center gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-orange/40 text-orange">
                <svg viewBox="0 0 16 16" fill="currentColor" className="h-4.5 w-4.5">
                  <path d="M8 1a3 3 0 013 3v1.5a3 3 0 01-6 0V4a3 3 0 013-3zM3 13a5 5 0 0110 0" />
                </svg>
              </span>
              <div>
                <p className="font-display text-sm font-bold text-white">Need reliable warehouse staff?</p>
                <p className="mt-0.5 text-xs text-white/60">Get in touch today and let us help keep your operations moving.</p>
              </div>
            </div>
            <Link href="/book-a-call" className="flex shrink-0 items-center gap-1.5 rounded-full bg-orange px-6 py-3 text-sm font-bold text-white transition hover:bg-orange-dark">
              Let&rsquo;s talk <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}