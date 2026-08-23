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
      { label: "Features", href: "/reach-connect" },
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

export default function TermsOfUsePage() {
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
      <section className="bg-navy py-14 lg:py-16">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange">Legal</p>
          <h1 className="font-display mt-3 text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl">
            Terms of Use
          </h1>
          <p className="mt-3 text-sm text-white/60">Last updated: August 2026</p>
        </div>
      </section>

      {/* CONTENT */}
      <section className="bg-white py-16 lg:py-20">
        <div className="mx-auto max-w-4xl space-y-8 px-6 text-sm leading-relaxed text-slate-600 lg:px-8">
          <div>
            <h2 className="font-display text-lg font-bold text-navy">1. Introduction</h2>
            <p className="mt-2">
              These Terms of Use govern your access to and use of the Reach Network Recruitment website (reachnetworkrec.com). By using this site, you agree to these terms in full. If you disagree with any part of these terms, please do not use this website.
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-bold text-navy">2. Use of this website</h2>
            <p className="mt-2">
              This website is provided for general information about our recruitment services, to browse live job vacancies, and to submit enquiries, applications, and CVs. You must not use this website in any way that causes, or may cause, damage to the website or impairment of its availability.
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-bold text-navy">3. Job applications and registrations</h2>
            <p className="mt-2">
              When you apply for a role, register your CV, or request a job alert, you consent to us processing the information you provide in order to match you with suitable opportunities and, where relevant, share it with our recruiting clients. See our Privacy Notice for full details on how we handle your data.
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-bold text-navy">4. Reach Connect</h2>
            <p className="mt-2">
              Access to Reach Connect, our client and candidate portal, is provided subject to a separate login and is intended solely for authorised users. Misuse of Reach Connect, including unauthorised access attempts, is strictly prohibited.
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-bold text-navy">5. Intellectual property</h2>
            <p className="mt-2">
              Unless otherwise stated, we own the intellectual property rights for all material on this website. All rights are reserved. You may view and print pages from this website for your own personal use, subject to restrictions set out elsewhere in these terms.
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-bold text-navy">6. Limitation of liability</h2>
            <p className="mt-2">
              We make reasonable efforts to keep the information on this website accurate and up to date, but we make no warranties or guarantees regarding its completeness, accuracy, or suitability for any particular purpose.
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-bold text-navy">7. Changes to these terms</h2>
            <p className="mt-2">
              We may revise these Terms of Use at any time. Please check this page periodically to ensure you are aware of any changes.
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-bold text-navy">8. Contact</h2>
            <p className="mt-2">
              If you have any questions about these Terms of Use, please contact us at{" "}
              <a href="mailto:hello@reachnetworkrec.com" className="font-semibold text-orange hover:text-orange-dark">
                hello@reachnetworkrec.com
              </a>{" "}
              or call 0121 630 1643.
            </p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <Footer />
    </main>
  );
}