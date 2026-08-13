"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Footer from "../components/Footer";

const HERO_STATS = [
  { value: "20+", label: "Years of Industry experience" },
  { value: "1000+", label: "People placed each year" },
  { value: "100%", label: "Dedicated to finding the right people" },
  { value: "Trusted by", label: "Businesses across the UK" },
  { value: "Thousands", label: "Of careers changed for the better" },
];

const VALUES = [
  { title: "People first", description: "We listen, care and put people at the heart of every decision." },
  { title: "Integrity", description: "We do the right thing, always. Honesty builds trust." },
  { title: "Excellence", description: "We raise the bar and never stop striving for better outcomes." },
  { title: "Partnership", description: "We work together with our clients and candidates to achieve more." },
  { title: "Progress", description: "We embrace change and innovate to create better opportunities." },
];

const IMPACT_STATS = [
  { value: "15,000+", label: "People placed in meaningful roles" },
  { value: "2,500+", label: "Businesses trust us to build their teams" },
  { value: "98%", label: "Candidate satisfaction rate" },
];

// Replace these with your actual leadership team's names, titles, and photos.
const LEADERSHIP = [
  { name: "Add name", title: "Add job title" },
  { name: "Add name", title: "Add job title" },
  { name: "Add name", title: "Add job title" },
  { name: "Add name", title: "Add job title" },
];

function PlaceholderPanel({ className = "" }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden bg-gradient-to-br from-navy via-navy to-navy-deep ${className}`}>
      <div
        className="absolute inset-0 opacity-20"
        style={{ backgroundImage: "radial-gradient(circle at 30% 20%, rgba(247,147,30,0.5), transparent 55%)" }}
      />
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{ backgroundImage: "repeating-linear-gradient(45deg, #fff 0px, #fff 1px, transparent 1px, transparent 14px)" }}
      />
    </div>
  );
}

function ValueIcon({ index }: { index: number }) {
  const icons = [
    <path key="0" d="M6 8a2 2 0 100-4 2 2 0 000 4zm4 8v-2a4 4 0 00-8 0v2M12 8a2 2 0 100-4 2 2 0 000 4zm2 8v-2a4 4 0 00-2.5-3.7" />,
    <path key="1" d="M8 1l6 2v4c0 4-2.5 6.5-6 8-3.5-1.5-6-4-6-8V3l6-2zm-1.5 8.5l1 1 2.5-2.5" />,
    <path key="2" d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 3a4 4 0 100 8 4 4 0 000-8zm0 2.5A1.5 1.5 0 118 9.5a1.5 1.5 0 010-3z" />,
    <path key="3" d="M3 8l3 3 7-7M6 13l-3-3M13 8l-3-3" />,
    <path key="4" d="M2 13l4-4 3 3 5-6M11 5h3v3" />,
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

export default function AboutUs() {
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
            src="/industries/aboutusone.png"
            alt="Reach Network team members"
            fill
            sizes="100vw"
            className="object-cover object-top"
            priority
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/85 to-navy/20" />

        <div className="relative mx-auto max-w-7xl px-6 pb-16 pt-8 lg:px-8 lg:pb-20">
          <div className="max-w-lg">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-white/50">
              <Link href="/" className="hover:text-white">Home</Link>
              <span>&#8250;</span>
              <span>About us</span>
            </p>

            <p className="mt-6 text-xs font-bold uppercase tracking-[0.25em] text-orange">About Reach</p>
            <h1 className="font-display mt-3 text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl">
              More than recruitment.
              <br />
              <span className="text-orange">A partner in your success.</span>
            </h1>
            <p className="mt-4 max-w-md text-sm text-white/70 sm:text-base">
              We connect great people with great opportunities and help businesses build stronger teams for a better tomorrow.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <button className="flex items-center gap-1.5 rounded-full bg-orange px-6 py-3 text-sm font-bold text-white transition hover:bg-orange-dark">
                I need staff <span aria-hidden="true">&rarr;</span>
              </button>
              <Link
                href="/looking-for-work"
                className="flex items-center gap-1.5 rounded-full border border-white/30 px-6 py-3 text-sm font-bold text-white transition hover:border-white/60"
              >
                I&rsquo;m looking for work <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Stats strip, overlapping bottom of hero */}
        <div className="relative z-10 mx-auto -mb-10 max-w-6xl px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-6 rounded-2xl bg-white p-6 shadow-[0_25px_70px_-15px_rgba(15,36,56,0.5)] ring-1 ring-slate-300 sm:grid-cols-5 sm:gap-4">
            {HERO_STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="font-display text-xl font-extrabold text-orange sm:text-2xl">{stat.value}</p>
                <p className="mt-1 text-[11px] text-slate-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* OUR STORY */}
      <section className="bg-slate-50 pb-20 pt-28 lg:pb-28 lg:pt-32">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange">Our story</p>
          <h2 className="font-display mt-3 text-2xl font-extrabold leading-tight tracking-tight text-navy sm:text-3xl">
            Built on experience.
            <br />
            <span className="text-orange">Driven by people.</span>
          </h2>

          <p className="mt-5 text-sm text-slate-600">
            Reach Network Recruitment connects great people with great opportunities. We partner with businesses across a wide range of industries to deliver the talent they need to grow, and support job seekers to find roles where they can thrive.
          </p>
          <p className="mt-4 text-sm text-slate-600">
            <span className="font-bold text-navy">Since 2021</span>, we&rsquo;ve been building lasting relationships based on trust, integrity and results. While we may be a growing business, our team brings <span className="font-bold text-navy">over 20+</span> years of combined recruitment experience to every conversation we have.
          </p>
          <p className="mt-4 text-sm text-slate-600">
            We don&rsquo;t just fill roles — we build careers, strengthen teams and help businesses and people achieve more, together.
          </p>

          <div className="mt-8 border-t border-orange/30" />

          <div className="mt-8 grid grid-cols-2 gap-8">
            <div>
              <span className="flex h-8 w-8 items-center justify-center text-orange">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                  <rect x="2" y="3" width="12" height="11" rx="1.5" />
                  <path d="M2 6.5h12M5 2v2.5M11 2v2.5" />
                  <circle cx="5.5" cy="9.5" r="0.6" fill="currentColor" />
                  <circle cx="8" cy="9.5" r="0.6" fill="currentColor" />
                  <circle cx="10.5" cy="9.5" r="0.6" fill="currentColor" />
                </svg>
              </span>
              <p className="mt-2">
                <span className="font-display text-lg font-extrabold text-orange">Since </span>
                <span className="font-display text-lg font-extrabold text-navy">2021</span>
              </p>
              <p className="mt-1 text-xs text-slate-500">Proudly connecting talent and opportunity.</p>
            </div>

            <div>
              <span className="flex h-8 w-8 items-center justify-center text-orange">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                  <circle cx="6" cy="6" r="2" />
                  <path d="M2.5 14v-1.5A3.5 3.5 0 016 9h0a3.5 3.5 0 013.5 3.5V14" />
                  <path d="M10 6.2a2 2 0 110-3.9M11 9.2a3.2 3.2 0 013 3.3V14" />
                </svg>
              </span>
              <p className="mt-2">
                <span className="font-display text-lg font-extrabold text-orange">20+ </span>
                <span className="font-display text-lg font-extrabold text-navy">Years</span>
              </p>
              <p className="mt-1 text-xs text-slate-500">Combined experience in recruitment across our team.</p>
            </div>
          </div>
        </div>
      </section>

      {/* OUR VALUES */}
      <section className="relative isolate min-h-[420px] overflow-hidden bg-navy py-16 lg:py-20">
        <div className="absolute inset-0">
          <Image
            src="/industries/secondimage.png"
            alt="Reach Network team"
            fill
            sizes="100vw"
            className="object-cover object-top"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/85 to-navy/40" />

        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange">Our values</p>
          <h2 className="font-display mt-3 max-w-lg text-2xl font-extrabold leading-tight tracking-tight text-white sm:text-3xl">
            The values that
            <br />
            <span className="text-orange">guide everything we do.</span>
          </h2>

          <div className="mt-10 grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-5">
            {VALUES.map((value, i) => (
              <div key={value.title} className="max-w-[180px]">
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-orange/40 text-orange">
                  <ValueIcon index={i} />
                </span>
                <p className="font-display mt-3 text-sm font-bold text-white">{value.title}</p>
                <p className="mt-1.5 text-xs text-white/60">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* IMPACT + LEADERSHIP */}
      <section className="bg-slate-50 py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.3fr] lg:gap-14">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange">Our impact</p>
              <h2 className="font-display mt-3 text-2xl font-extrabold leading-tight tracking-tight text-navy sm:text-3xl">
                Real people. Real impact.
              </h2>
              <p className="mt-3 text-sm text-slate-600">
                We&rsquo;re proud of the difference we make for businesses and job seekers — every day.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {IMPACT_STATS.map((stat) => (
                <div key={stat.label} className="rounded-2xl bg-white p-5 text-center shadow-sm">
                  <p className="font-display text-xl font-extrabold text-orange sm:text-2xl">{stat.value}</p>
                  <p className="mt-1.5 text-[11px] text-slate-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-16">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange">Our leadership</p>
            <h2 className="font-display mt-3 text-2xl font-extrabold leading-tight tracking-tight text-navy sm:text-3xl">
              Experienced leaders. Better outcomes.
            </h2>
            <p className="mt-3 max-w-lg text-sm text-slate-600">
              Our leadership team brings deep industry knowledge, a passion for people, and a commitment to doing things the right way.
            </p>

            <div className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-4">
              {LEADERSHIP.map((person, i) => (
                <div key={i} className="overflow-hidden rounded-2xl bg-white shadow-sm">
                  <div className="relative aspect-square w-full">
                    <PlaceholderPanel className="h-full w-full" />
                  </div>
                  <div className="p-4">
                    <p className="font-display text-sm font-bold text-navy">{person.name}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{person.title}</p>
                    <span className="mt-2 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 text-[10px] font-bold text-slate-400">
                      in
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA BAND */}
      <section className="relative isolate min-h-[420px] overflow-hidden bg-navy py-24 lg:py-32">
        <div className="absolute inset-0">
          <Image
            src="/industries/lookingforwork.png"
            alt="Reach Network candidate"
            fill
            sizes="100vw"
            className="object-cover object-top"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/85 to-navy/30" />

        <div className="relative mx-auto flex max-w-7xl flex-col items-start gap-8 px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange">Let&rsquo;s build something great together</p>
            <h2 className="font-display mt-3 max-w-md text-2xl font-extrabold leading-tight tracking-tight text-white sm:text-3xl">
              Whether you&rsquo;re hiring or looking for work, <span className="text-orange">we&rsquo;re here to help.</span>
            </h2>
          </div>

          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-10">
            <ul className="space-y-2.5">
              {["Access 100s of live roles", "Free and easy to register", "We'll match you with the right opportunities"].map((item) => (
                <li key={item} className="flex items-center gap-2.5 text-xs text-white/80">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-orange/40 text-orange">
                    <svg viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3">
                      <path d="M6.2 10.9 3.5 8.2l1-1 1.7 1.7 4.6-4.6 1 1z" />
                    </svg>
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/book-a-call"
              className="flex shrink-0 items-center gap-1.5 rounded-full bg-orange px-6 py-3 text-sm font-bold text-white transition hover:bg-orange-dark"
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