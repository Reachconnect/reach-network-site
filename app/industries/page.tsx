"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

const INDUSTRIES = [
  {
    title: "Driving",
    description: "HGV, LGV, 7.5t, ADR and driver support roles that keep goods moving.",
    image: "/industries/industry-driving.png",
  },
  {
    title: "Warehousing",
    description: "Warehouse operatives, FLT, pickers and packers keeping supply chains moving.",
    image: "/industries/industry-warehousing.png",
  },
  {
    title: "Manufacturing",
    description: "Skilled and dependable talent to power production and drive operational excellence.",
    image: "/industries/industry-manufacturing.png",
  },
  {
    title: "Engineering",
    description: "Skilled engineers, technicians and industrial specialists for demanding environments.",
    image: "/industries/industry-engineering.png",
  },
];

const FILTERS = ["All industries", ...INDUSTRIES.map((i) => i.title)];

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

export default function Industries() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState("All industries");

  const visibleIndustries =
    activeFilter === "All industries" ? INDUSTRIES : INDUSTRIES.filter((i) => i.title === activeFilter);

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
            src="/industries/needstaff.png"
            alt="Warehouse team at work"
            fill
            sizes="100vw"
            className="object-cover object-top"
            priority
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/90 to-navy/40" />

        <div className="relative mx-auto max-w-7xl px-6 py-14 lg:px-8 lg:py-20">
          <div className="max-w-lg">
            <h1 className="font-display text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl">
              All industries
            </h1>
            <p className="font-display mt-2 text-2xl font-extrabold leading-tight text-orange sm:text-3xl">
              We work with businesses across a wide range of sectors.
            </p>
            <p className="mt-4 max-w-md text-sm text-white/70 sm:text-base">
              From logistics and warehousing to transport, manufacturing and beyond, we help organisations find the people they need to keep moving forward.
            </p>
          </div>
        </div>
      </section>

      {/* FILTERS + GRID */}
      <section className="bg-slate-50 py-14 lg:py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex flex-wrap gap-2.5">
            {FILTERS.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={`rounded-full border px-5 py-2.5 text-sm font-semibold transition ${
                  activeFilter === filter
                    ? "border-orange bg-white text-orange"
                    : "border-slate-200 bg-white text-navy hover:border-navy/30"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {visibleIndustries.map((industry) => (
              <div key={industry.title} className="overflow-hidden rounded-2xl bg-white shadow-sm">
                <div className="relative aspect-[4/3] w-full">
                  <Image
                    src={industry.image}
                    alt={industry.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover object-top"
                  />
                </div>
                <div className="p-5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-orange/15 text-orange">
                    <svg viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4">
                      <rect x="3" y="6" width="10" height="7" rx="1" />
                      <path d="M5 6V4.5A1.5 1.5 0 0 1 6.5 3h3A1.5 1.5 0 0 1 11 4.5V6" />
                    </svg>
                  </span>
                  <p className="font-display mt-3.5 text-base font-extrabold text-navy">{industry.title}</p>
                  <p className="mt-1.5 text-xs text-slate-500">{industry.description}</p>
                  <Link href="/looking-for-work" className="mt-4 flex items-center gap-1 text-xs font-bold text-orange hover:text-orange-dark">
                    View roles <span aria-hidden="true">&rarr;</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* CTA STRIP */}
          <div className="mt-8 flex flex-col items-start justify-between gap-5 rounded-2xl bg-white p-6 shadow-sm sm:flex-row sm:items-center">
            <div className="flex items-center gap-3.5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-orange/15 text-orange">
                <svg viewBox="0 0 16 16" fill="currentColor" className="h-4.5 w-4.5">
                  <circle cx="6" cy="5" r="2" />
                  <circle cx="11" cy="6" r="1.6" />
                  <path d="M2 13a4 4 0 0 1 8 0M9.5 8.2A3 3 0 0 1 14 11" />
                </svg>
              </span>
              <div>
                <p className="font-display text-sm font-bold text-navy">Need help finding talent in your industry?</p>
                <p className="mt-0.5 text-xs text-slate-500">Our team can provide a tailored workforce solution for your business.</p>
              </div>
            </div>
            <Link href="/book-a-call" className="flex shrink-0 items-center gap-1.5 rounded-full bg-orange px-6 py-3 text-sm font-bold text-white transition hover:bg-orange-dark">
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