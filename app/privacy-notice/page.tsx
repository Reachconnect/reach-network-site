"use client";

import { useState } from "react";
import Link from "next/link";
import Footer from "../components/Footer";
import CookieSettingsButton from "../components/CookieSettingsButton";

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
          <p className="mt-2 text-sm text-slate-400">Last updated: 23 November 2026</p>

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
                What we collect depends on how you deal with us.
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li><strong>Candidates and workers:</strong> your name, contact details, address and postcode, CV, work history, skills, licences, tickets and qualifications, right to work documents or share code, National Insurance number, bank details and tax information for payroll, emergency contact, timesheets and feedback from the sites you work at.</li>
                <li><strong>Reach Connect app:</strong> when you clock in or out, we record the time and your location to confirm you&apos;re at the right site, and a photo used to check that it&apos;s you. We don&apos;t track your location at any other time.</li>
                <li><strong>Clients and their staff:</strong> names, job titles, work contact details, site details, staffing requests, timesheet approvals, signed terms and invoicing details.</li>
                <li><strong>Website visitors:</strong> what you send us through our forms. If you accept cookies, the pages you visit (see Cookies below).</li>
                <li><strong>Emails we send:</strong> whether a message was delivered, opened or clicked, and any unsubscribe request.</li>
              </ul>
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-navy">How we use your information, and our legal basis</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>To find you work, or find you staff, and to keep you updated. This is in our legitimate interests, or needed to take steps towards a contract you&apos;ve asked about.</li>
                <li>To employ and pay temporary workers, run payroll, holiday pay, pension enrolment and tax. This is needed for our contract with you and to meet our legal obligations.</li>
                <li>To check right to work, identity, licences and qualifications. This is a legal obligation for right to work, and in our legitimate interests (and our clients&apos;) for the rest.</li>
                <li>To record clock-ins in Reach Connect. Location checks are in our legitimate interests in accurate timesheets. The photo check is only used with your explicit consent, which you can withdraw. If you do, we&apos;ll agree another way to confirm your attendance.</li>
                <li>To manage our relationship with clients, send terms, invoices and service updates. This is needed for our contract, and in our legitimate interests.</li>
                <li>To send business emails about our services to companies. This is in our legitimate interests, and every email has a one-click unsubscribe.</li>
                <li>To improve our website and services, using website visit information only where you&apos;ve accepted cookies.</li>
              </ul>
              <p className="mt-2">
                We don&apos;t make decisions about you based only on automated processing. A person always makes the final decision about who is put forward for a job.
              </p>
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-navy">Sharing your information</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li><strong>Clients:</strong> when we put a candidate forward or place a worker, we share the details the client needs, such as your profile, relevant checks, and shift and timesheet information.</li>
                <li><strong>Service providers</strong> who process data for us under contract, including cloud hosting and databases, email delivery, payroll and pensions providers, and AI tools that help us read CVs and draft job adverts.</li>
                <li><strong>Government bodies and regulators</strong> where the law requires, such as HMRC, the Home Office or the police.</li>
                <li><strong>Professional advisers</strong> such as our accountants, insurers and lawyers.</li>
              </ul>
              <p className="mt-2">
                We never sell your data. Some of our providers process data outside the UK. When they do, we make sure it&apos;s protected by safeguards recognised under UK law, such as the UK-US Data Bridge or the ICO&apos;s International Data Transfer Agreement.
              </p>
            </div>
            <div id="cookies">
              <h2 className="font-display text-lg font-bold text-navy">Cookies</h2>
              <p className="mt-2">
                We only set our own cookie if you choose Accept on the banner. It records which pages of this website you
                look at and for how long. If you arrived by clicking a link in an email or proposal we sent you, it also
                links those visits to you, so we can follow up with what&apos;s relevant to you. We don&apos;t use advertising
                cookies, and nothing is shared with advertisers. If you choose No thanks, no tracking cookie is set. We
                also remember your choice on your device so we don&apos;t ask every time.
              </p>
              <CookieSettingsButton />
            </div>

            <div>
              <h2 className="font-display text-lg font-bold text-navy">Data retention</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li><strong>Candidates we haven&apos;t placed:</strong> up to 2 years from our last contact with you, unless you ask us to keep you on file for longer, or to delete you sooner.</li>
                <li><strong>Workers we&apos;ve placed:</strong> right to work records for the length of your work with us plus 2 years, as the Home Office requires. Payroll and tax records for 6 years after the end of the tax year they relate to.</li>
                <li><strong>Reach Connect clock-in photos:</strong> only as long as needed to confirm attendance and deal with any query about hours.</li>
                <li><strong>Clients:</strong> contracts, signed terms and invoices for 6 years after our relationship ends.</li>
                <li><strong>Website visit records:</strong> up to 13 months.</li>
                <li><strong>Unsubscribe requests:</strong> we keep your email address on a do-not-contact list so we don&apos;t email you again.</li>
              </ul>
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-navy">Your rights</h2>
              <p className="mt-2">
                Under UK GDPR, you have the right to access, correct, delete or restrict the use of your personal
                data, and the right to object to certain processing or request that your data be transferred.
                Where we rely on your consent, you can withdraw it at any time. To use any of these rights, email{" "}
                <a href="mailto:info@reachnetworkrec.com" className="font-bold text-orange">info@reachnetworkrec.com</a> or call 0121 630 1643. We&apos;ll
                reply within one month, and it&apos;s free. If you&apos;re unhappy with how we&apos;ve handled your data, please tell us first so we
                can put it right. You can also complain to the Information Commissioner&apos;s Office at{" "}
                <a href="https://ico.org.uk/make-a-complaint/" target="_blank" rel="noopener noreferrer" className="font-bold text-orange">ico.org.uk</a> or on 0303 123 1113.
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