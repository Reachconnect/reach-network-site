"use client";

import { useState } from "react";
import Link from "next/link";
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
      { label: "Why choose us", href: "/why-choose-us" },
      { label: "FAQ", href: "/book-a-call#faq" },
    ],
  },
];

export default function PrivacyNotice() {
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
              onClick={() => setMenuOpen((open) => !open)}
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

      {/* CONTENT */}
      <section className="bg-white py-16 lg:py-24">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
            <Link href="/" className="hover:text-navy">Home</Link>
            <span>&#8250;</span>
            <span>Privacy Notice</span>
          </p>

          <h1 className="font-display mt-4 text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">
            Privacy Notice
          </h1>
          <p className="mt-2 text-sm text-slate-400">Last updated: [add date]</p>

          <div className="mt-8 space-y-6 text-sm leading-relaxed text-slate-600">
            <p>
              Reach Network Recruitment (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) is committed to
              protecting the privacy of everyone we work with, including candidates, clients and visitors to our
              website. This notice explains what personal information we collect, how we use it, and the rights
              you have over your data.
            </p>

            <div>
              <h2 className="font-display text-lg font-bold text-navy">Information we collect</h2>
              <p className="mt-2">
                [Add detail: e.g. contact details, CV and work history, right-to-work documents, payroll
                information, website usage data.]
              </p>
            </div>

            <div>
              <h2 className="font-display text-lg font-bold text-navy">How we use your information</h2>
              <p className="mt-2">
                [Add detail: e.g. matching candidates to roles, managing client relationships, complying with
                employment and payroll law, improving our website and services.]
              </p>
            </div>

            <div>
              <h2 className="font-display text-lg font-bold text-navy">Sharing your information</h2>
              <p className="mt-2">
                [Add detail: e.g. with prospective employers/clients, payroll and compliance providers,
                regulatory bodies where required.]
              </p>
            </div>

            <div>
              <h2 className="font-display text-lg font-bold text-navy">Data retention</h2>
              <p className="mt-2">
                [Add detail on how long different categories of data are kept and why.]
              </p>
            </div>

            <div>
              <h2 className="font-display text-lg font-bold text-navy">Your rights</h2>
              <p className="mt-2">
                Under UK GDPR, you have the right to access, correct, delete or restrict the use of your personal
                data, and the right to object to certain processing or request that your data be transferred.
                [Add detail on how to exercise these rights.]
              </p>
            </div>

            <div>
              <h2 className="font-display text-lg font-bold text-navy">Contact us</h2>
              <p className="mt-2">
                If you have any questions about this notice or how we handle your data, please contact us at{" "}
                <a href="mailto:info@reachnetworkrec.com" className="font-bold text-orange">
                  info@reachnetworkrec.com
                </a>{" "}
                or write to us at 132a High Street, Bromsgrove, United Kingdom, B61 8ES.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}