"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Footer from "../components/Footer";

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

const TRUST_POINTS = [
  { title: "The right people when you need them" },
  { title: "Trusted by businesses across industries" },
  { title: "Flexible solutions that scale with you" },
];

const SERVICES = [
  {
    title: "Temporary recruitment",
    tagline: "Flexibility when you need it most.",
    description: "From covering absences to managing seasonal demand or driving growth, our temporary staffing solutions give you instant access to skilled, reliable people.",
    points: ["Short or long-term cover", "Fast turnaround", "Fully vetted and compliant candidates", "Scalable to your needs"],
    image: "/industries/ourserviceswarehouse.png",
  },
  {
    title: "Permanent recruitment",
    tagline: "The right fit for long-term success.",
    description: "We help you attract and secure the talent your business needs to thrive. Our specialist consultants take the time to understand your goals and find candidates who are the right fit for your team and your culture.",
    points: ["Specialist recruitment consultants", "In-depth candidate screening", "Focus on cultural and role fit", "Support beyond placement"],
    image: "/industries/ourservicesperm.png",
  },
];

const WHY_CHOOSE = [
  { title: "Industry expertise", description: "We understand your sector and the challenges you face." },
  { title: "Quality you can trust", description: "Rigorous screening ensures you get reliable, skilled people." },
  { title: "Built around you", description: "Flexible solutions that scale with your business." },
  { title: "Partner, not just a supplier", description: "We build lasting relationships focused on your success." },
];

export default function OurServices() {
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
      <section className="relative isolate min-h-[480px] overflow-hidden bg-navy">
        <div className="absolute inset-0">
          <Image
            src="/industries/ourservicescover.png"
            alt="Reach Network team member"
            fill
            sizes="100vw"
            className="object-cover object-top"
            priority
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/90 to-navy/40" />

        <div className="relative mx-auto max-w-7xl px-6 py-14 lg:px-8 lg:py-20">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-white/50">
            <Link href="/" className="hover:text-white">Home</Link>
            <span>&#8250;</span>
            <span>Services</span>
          </p>

          <div className="mt-6 max-w-lg">
            <h1 className="font-display text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl">
              Our services
            </h1>
            <p className="font-display mt-2 text-xl font-extrabold leading-tight text-orange sm:text-2xl">
              Flexible recruitment solutions that work for your business.
            </p>
            <p className="mt-4 max-w-md text-sm text-white/70 sm:text-base">
              Whether you need talent for the short term or the long term, our expert team is here to deliver the right people, at the right time.
            </p>

            <div className="mt-7 flex flex-wrap gap-x-8 gap-y-3">
              {TRUST_POINTS.map((point) => (
                <div key={point.title} className="flex items-center gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-orange/40 text-orange">
                    <svg viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3">
                      <path d="M6.2 10.9 3.5 8.2l1-1 1.7 1.7 4.6-4.6 1 1z" />
                    </svg>
                  </span>
                  <span className="whitespace-nowrap text-xs font-semibold text-white/75">{point.title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* WHAT WE DO */}
      <section className="bg-white py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-6 text-center lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange">What we do</p>
          <h2 className="font-display mx-auto mt-3 max-w-3xl whitespace-nowrap text-base font-extrabold leading-tight tracking-tight text-navy sm:text-2xl lg:text-3xl">
            Two ways we help you build a stronger workforce
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm text-slate-600">
            We provide trusted temporary and permanent recruitment solutions across a wide range of industries. No matter your challenge, we&rsquo;ll find the people who make a difference.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-7xl grid-cols-1 gap-5 px-6 lg:grid-cols-2 lg:px-8">
          {SERVICES.map((service) => (
            <div key={service.title} className="grid grid-cols-1 overflow-hidden rounded-2xl border border-slate-200 sm:grid-cols-[1fr_1.6fr]">
              <div className="relative hidden h-full min-h-[420px] w-full sm:block">
                <Image src={service.image} alt={service.title} fill sizes="(max-width: 1024px) 30vw, 220px" className="object-cover object-center" />
              </div>
              <div className="p-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-orange/15 text-orange">
                  <svg viewBox="0 0 16 16" fill="currentColor" className="h-4.5 w-4.5">
                    <circle cx="8" cy="8" r="6.5" />
                  </svg>
                </span>
                <p className="font-display mt-4 text-xl font-extrabold text-navy">{service.title}</p>
                <p className="mt-1 text-sm font-bold text-orange">{service.tagline}</p>
                <p className="mt-3 text-sm text-slate-600">{service.description}</p>

                <ul className="mt-4 space-y-2">
                  {service.points.map((point) => (
                    <li key={point} className="flex items-center gap-2 text-sm text-slate-600">
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center text-orange">
                        <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
                          <path d="M6.2 10.9 3.5 8.2l1-1 1.7 1.7 4.6-4.6 1 1z" />
                        </svg>
                      </span>
                      {point}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/i-need-staff"
                  className="mt-6 flex items-center justify-center gap-1.5 rounded-full border border-orange px-6 py-3 text-sm font-bold text-orange transition hover:bg-orange hover:text-white"
                >
                  Find out more <span aria-hidden="true">&rarr;</span>
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* WHY CHOOSE */}
        <div className="mx-auto mt-16 max-w-7xl px-6 text-center lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange">Why choose Reach Network?</p>
          <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {WHY_CHOOSE.map((item) => (
              <div key={item.title} className="text-left">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-orange/15 text-orange">
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
      </section>

      {/* CTA BAND */}
      <section className="bg-navy py-6">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 px-6 sm:flex-row sm:items-center lg:px-8">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-orange/40 text-orange">
              <svg viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4">
                <path d="M3.5 2.5A1.5 1.5 0 0 1 5 1h1.3a1.5 1.5 0 0 1 1.46 1.16l.62 2.68a1.5 1.5 0 0 1-.4 1.42l-1.1 1.1a11.5 11.5 0 0 0 5 5l1.1-1.1a1.5 1.5 0 0 1 1.42-.4l2.68.62A1.5 1.5 0 0 1 18 12.7V14a1.5 1.5 0 0 1-1.5 1.5C8.5 15.5 3.5 10.5 3.5 2.5z" />
              </svg>
            </span>
            <div>
              <p className="text-sm font-bold text-white">Need help finding the right people?</p>
              <p className="text-xs text-white/60">Let&rsquo;s talk about how we can support your business.</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <a href="tel:01216301643" className="hidden items-center gap-1.5 text-sm font-bold text-white sm:flex">
              0121 630 1643
            </a>
            <Link href="/book-a-call" className="flex items-center gap-1.5 rounded-full bg-orange px-6 py-3 text-sm font-bold text-white transition hover:bg-orange-dark">
              Let&rsquo;s talk <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <Footer />
    </main>
  );
}