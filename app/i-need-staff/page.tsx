"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Footer from "../components/Footer";

const HERO_STATS = [
  { value: "20+", label: "Years of industry experience" },
  { value: "1000+", label: "People placed each year" },
  { value: "100%", label: "Dedicated to finding the right fit" },
  { value: "Trusted by", label: "Businesses across the UK" },
  { value: "Thousands", label: "Of careers changed for the better" },
];

function StatIcon({ index }: { index: number }) {
  const icons = [
    // people
    <path key="0" d="M6 8a2 2 0 100-4 2 2 0 000 4zm4 8v-2a4 4 0 00-8 0v2M12 8a2 2 0 100-4 2 2 0 000 4zm2 8v-2a4 4 0 00-2.5-3.7" />,
    // star
    <path key="1" d="M8 1.5l2 4 4.5.6-3.3 3.1.8 4.4L8 11.5l-4 2.1.8-4.4L1.5 6.1 6 5.5z" />,
    // shield check
    <path key="2" d="M8 1l6 2v4c0 4-2.5 6.5-6 8-3.5-1.5-6-4-6-8V3l6-2zm-1.5 8.5l1 1 2.5-2.5" />,
    // thumbs up
    <path key="3" d="M4 8h2v6H4a1 1 0 01-1-1V9a1 1 0 011-1zm3.5 6h5a1.5 1.5 0 001.4-1l1-4a1 1 0 00-1-1.3H10l.5-3A1.3 1.3 0 009.2 3c-.3 0-.6.15-.8.4L6 7.5V14z" />,
    // target
    <>
      <circle key="4a" cx="8" cy="8" r="6.5" />
      <circle key="4b" cx="8" cy="8" r="3.3" />
      <circle key="4c" cx="8" cy="8" r="0.6" fill="currentColor" />
    </>,
  ];
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      {icons[index]}
    </svg>
  );
}

const SOLUTIONS_POINTS = [
  "Temporary & contract staffing",
  "Permanent recruitment",
  "Volume hiring solutions",
  "On-site account management",
  "Payroll & compliance support",
];

const WHY_WORK_WITH_US = [
  { title: "Quality candidates", description: "We hand-pick people who are skilled, reliable and ready to work." },
  { title: "Speed & flexibility", description: "We respond quickly to your needs and adapt to your business." },
  { title: "Industry expertise", description: "We understand your industry and the demands of your role." },
  { title: "Compliance assured", description: "We handle right to work, payroll and compliance so you don't have to." },
];

function WhyIcon({ index }: { index: number }) {
  const icons = [
    <path key="0" d="M6 8a2 2 0 100-4 2 2 0 000 4zm4 8v-2a4 4 0 00-8 0v2M12 8a2 2 0 100-4 2 2 0 000 4zm2 8v-2a4 4 0 00-2.5-3.7" />,
    <path key="1" d="M8 1l6 2v4c0 4-2.5 6.5-6 8-3.5-1.5-6-4-6-8V3l6-2z" />,
    <path key="2" d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 3a4 4 0 100 8 4 4 0 000-8z" />,
    <path key="3" d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 3.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7zM8 8h.01" />,
  ];
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      {icons[index]}
    </svg>
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
      { label: "Features", href: "/reach-connect" },
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

export default function INeedStaff() {
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

      {/* HERO */}
      <section className="relative isolate min-h-[480px] overflow-hidden bg-navy">
        <div className="absolute inset-0">
          <Image
            src="/industries/driverwow.png"
            alt="Reach Network team member helping a client"
            fill
            sizes="100vw"
            className="object-cover object-top"
            priority
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/90 to-navy/40" />

        <div className="relative mx-auto max-w-7xl px-6 pb-20 pt-8 lg:px-8 lg:pb-24">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-white/50">
            <Link href="/" className="hover:text-white">Home</Link>
            <span>&#8250;</span>
            <span>I need staff</span>
          </p>

          <div className="mt-6 max-w-lg">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange">I need staff</p>
            <h1 className="font-display mt-3 text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl">
              The right people.
              <br />
              <span className="text-orange">Right when you need them.</span>
            </h1>
            <p className="mt-4 max-w-md text-sm text-white/70 sm:text-base">
              Flexible staffing solutions that help your business stay productive, compliant and ahead of the curve.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/book-a-call"
                className="flex items-center gap-1.5 rounded-full bg-orange px-6 py-3 text-sm font-bold text-white transition hover:bg-orange-dark"
              >
                Talk to our team <span aria-hidden="true">&rarr;</span>
              </Link>
              <Link
                href="/our-services"
                className="flex items-center gap-1.5 rounded-full border border-white/30 px-6 py-3 text-sm font-bold text-white transition hover:border-white/60"
              >
                View our solutions <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>
          </div>
        </div>

      </section>

      {/* Stats strip, overlapping bottom of hero */}
      <div className="relative z-10 mx-auto -mt-16 max-w-6xl px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-y-6 rounded-2xl bg-[#FDFBF5] p-6 shadow-[0_30px_80px_-15px_rgba(15,36,56,0.65)] ring-1 ring-slate-200 sm:grid-cols-5 sm:gap-y-0">
          {HERO_STATS.map((stat, i) => (
            <div
              key={stat.label}
              className={`px-3 py-2 text-center ${
                i !== 0 ? "sm:border-l sm:border-slate-200" : ""
              }`}
            >
              <span className="mx-auto flex h-6 w-6 items-center justify-center text-orange">
                <StatIcon index={i} />
              </span>
              <p className="mt-2 font-display text-xl font-extrabold text-orange sm:text-2xl">{stat.value}</p>
              <p className="mt-1 text-[11px] text-slate-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* OUR SOLUTIONS */}
      <section className="bg-white pb-20 pt-12 lg:pb-28 lg:pt-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange">Our solutions</p>
              <h2 className="font-display mt-3 text-2xl font-extrabold leading-tight tracking-tight text-navy sm:text-3xl">
                Tailored staffing solutions for your business needs.
              </h2>
              <p className="mt-4 text-sm text-slate-600">
                From temporary cover to permanent hires, we provide skilled, reliable people across a wide range of industries.
              </p>

              <ul className="mt-6 space-y-2.5">
                {SOLUTIONS_POINTS.map((point) => (
                  <li key={point} className="flex items-center gap-2.5 text-sm text-slate-600">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange/15 text-orange">
                      <svg viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3">
                        <path d="M6.2 10.9 3.5 8.2l1-1 1.7 1.7 4.6-4.6 1 1z" />
                      </svg>
                    </span>
                    {point}
                  </li>
                ))}
              </ul>

              <Link
                href="/book-a-call"
                className="mt-7 flex w-fit items-center gap-1.5 rounded-full bg-orange px-6 py-3 text-sm font-bold text-white transition hover:bg-orange-dark"
              >
                Talk to our team <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>

            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl">
              <Image
                src="/industries/contactus.png"
                alt="Reach Network consultant at work"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover object-center"
              />
            </div>
          </div>
        </div>
      </section>

      {/* WHY WORK WITH US */}
      <section className="bg-slate-50 py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="rounded-2xl bg-navy p-8 sm:p-10">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange">Why work with us?</p>

            <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {WHY_WORK_WITH_US.map((item, i) => (
                <div key={item.title}>
                  <span className="flex h-10 w-10 items-center justify-center rounded-full border border-orange/40 text-orange">
                    <WhyIcon index={i} />
                  </span>
                  <p className="font-display mt-3 text-sm font-bold text-white">{item.title}</p>
                  <p className="mt-1.5 text-xs text-white/60">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA BAND */}
      <section className="relative isolate min-h-[320px] overflow-hidden bg-navy py-16 lg:py-20">
        <div className="absolute inset-0">
          <Image
            src="/industries/buildsomething.png"
            alt="Reach Network colleagues talking on site"
            fill
            sizes="100vw"
            className="object-cover object-center"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/60 to-transparent" />

        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="max-w-lg">
            <p className="font-display text-2xl font-extrabold text-white sm:text-3xl">
              Let&rsquo;s build something great together.
            </p>
            <p className="mt-3 text-sm text-white/70">
              Get in touch today and discover how we can support your business.
            </p>
            <Link
              href="/book-a-call"
              className="mt-6 flex w-fit items-center gap-1.5 rounded-full bg-orange px-6 py-3 text-sm font-bold text-white transition hover:bg-orange-dark"
            >
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