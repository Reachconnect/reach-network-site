"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Footer from "../components/Footer";

const FEATURES = [
  { title: "People first", description: "We care about people and put relationships at the heart of everything we do." },
  { title: "Proven expertise", description: "Decades of experience connecting great people with great opportunities." },
  { title: "Reliable & responsive", description: "We're quick to respond, easy to work with and always deliver on our promises." },
  { title: "Quality guaranteed", description: "We're committed to high standards and delivering the right solutions every time." },
  { title: "Stronger together", description: "Your success is our success. We grow stronger by helping you grow." },
  { title: "Results that matter", description: "We focus on outcomes that drive performance, productivity and long-term impact." },
];

const VALUE_POINTS = [
  { title: "Industry specialists", description: "Deep knowledge of your market and workforce." },
  { title: "Tailored solutions", description: "Flexible services designed around your business needs." },
  { title: "Consistent quality", description: "Rigorous standards to ensure the best outcomes." },
  { title: "Long-term partnerships", description: "Built on trust, collaboration and shared success." },
];

function FeatureIcon({ index }: { index: number }) {
  const icons = [
    // people
    <path key="0" d="M6 8a2 2 0 100-4 2 2 0 000 4zm4 8v-2a4 4 0 00-8 0v2M12 8a2 2 0 100-4 2 2 0 000 4zm2 8v-2a4 4 0 00-2.5-3.7" />,
    // ribbon / award
    <path key="1" d="M8 1.5a3.2 3.2 0 100 6.4 3.2 3.2 0 000-6.4zM5.5 7.6L4 14.5l4-1.5 4 1.5-1.5-6.9" />,
    // puzzle piece
    <path key="2" d="M5 2.5h3v1.3a1 1 0 001.7.7 1 1 0 011.7.7v3.3H10.4a1 1 0 00-.7 1.7 1 1 0 00-.7 1.7v3.1H5.7a1 1 0 01-1-1v-3H3.4a1 1 0 010-1.7A1 1 0 013.4 8H4.7V5H2.5V2.5H5z" />,
    // shield check
    <path key="3" d="M8 1l6 2v4c0 4-2.5 6.5-6 8-3.5-1.5-6-4-6-8V3l6-2zm-1.5 8.5l1 1 2.5-2.5" />,
    // thumbs up with star
    <path key="4" d="M4 8h2v6H4a1 1 0 01-1-1V9a1 1 0 011-1zm3.5 6h5a1.5 1.5 0 001.4-1l1-4a1 1 0 00-1-1.3H10l.5-3A1.3 1.3 0 009.2 3c-.3 0-.6.15-.8.4L6 7.5V14z" />,
    // target
    <>
      <circle key="5a" cx="8" cy="8" r="6.5" />
      <circle key="5b" cx="8" cy="8" r="3.3" />
      <path key="5c" d="M8 8l3.5-3.5M11.5 4.5V2M11.5 4.5H14" />
    </>,
  ];
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7">
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
      { label: "Why choose us", href: "/why-choose-us" },
      { label: "FAQ", href: "/book-a-call#faq" },
    ],
  },
];

export default function WhyChooseUs() {
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
        <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/90 to-navy/40" />

        <div className="relative mx-auto max-w-7xl px-6 pb-24 pt-8 lg:px-8 lg:pb-28">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-white/50">
            <Link href="/" className="hover:text-white">Home</Link>
            <span>&#8250;</span>
            <Link href="/about-us" className="hover:text-white">About us</Link>
            <span>&#8250;</span>
            <span>Why choose us</span>
          </p>

          <div className="mt-6 max-w-lg">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange">Why choose us</p>
            <h1 className="font-display mt-3 text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl">
              More than recruitment.
              <br />
              <span className="text-orange">A partner in your success.</span>
            </h1>
            <p className="mt-4 max-w-md text-sm text-white/70 sm:text-base">
              We go beyond filling roles. We build partnerships, understand your goals and deliver results that make a real difference.
            </p>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <div className="relative z-10 mx-auto -mt-16 max-w-6xl px-6 lg:px-8">
        <div className="rounded-2xl bg-white p-6 shadow-[0_30px_80px_-15px_rgba(15,36,56,0.65)] ring-1 ring-slate-200 sm:p-8">
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-6">
            {FEATURES.map((feature, i) => (
              <div key={feature.title} className="text-center">
                <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-navy">
                  <FeatureIcon index={i} />
                </span>
                <p className="font-display mt-3 text-sm font-bold text-navy">{feature.title}</p>
                <p className="mt-1.5 text-xs text-slate-500">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* DISCOVER THE REACH DIFFERENCE */}
      <section className="bg-white pb-16 pt-12 lg:pb-20 lg:pt-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex flex-col items-start justify-between gap-6 rounded-2xl bg-navy p-6 sm:flex-row sm:items-center sm:p-8">
            <div className="flex items-center gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/10 text-orange">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                  <path d="M6 8a2 2 0 100-4 2 2 0 000 4zm4 8v-2a4 4 0 00-8 0v2M12 8a2 2 0 100-4 2 2 0 000 4zm2 8v-2a4 4 0 00-2.5-3.7" />
                </svg>
              </span>
              <div>
                <p className="font-display text-lg font-extrabold text-white sm:text-xl">
                  Discover the Reach difference.
                </p>
                <p className="mt-1 max-w-md text-sm text-white/70">
                  Let&rsquo;s work together to build a stronger, more successful future.
                </p>
              </div>
            </div>

            <Link
              href="/book-a-call"
              className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/30 px-6 py-3 text-sm font-bold text-white transition hover:border-white/60"
            >
              Let&rsquo;s talk <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        </div>
      </section>

      {/* COMMITTED TO LASTING VALUE */}
      <section className="bg-white pb-16 lg:pb-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl">
              <Image
                src="/industries/secondimage.png"
                alt="Reach Network colleagues in a warehouse"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover object-center"
              />
            </div>

            <div>
              <h2 className="font-display text-2xl font-extrabold leading-tight tracking-tight text-navy sm:text-3xl">
                We&rsquo;re committed to delivering lasting value.
              </h2>

              <ul className="mt-6 space-y-5">
                {VALUE_POINTS.map((point) => (
                  <li key={point.title} className="flex gap-3">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy text-white">
                      <svg viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3">
                        <path d="M6.2 10.9 3.5 8.2l1-1 1.7 1.7 4.6-4.6 1 1z" />
                      </svg>
                    </span>
                    <div>
                      <p className="font-display text-sm font-bold text-navy">{point.title}</p>
                      <p className="mt-0.5 text-sm text-slate-600">{point.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* LET'S ACHIEVE MORE TOGETHER */}
      <section className="bg-slate-50 pb-16 lg:pb-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex flex-col items-start justify-between gap-6 rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:flex-row sm:items-center sm:p-8">
            <div className="flex items-center gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-navy text-orange">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                  <path d="M3 8l2.5 2.5L8 8l2.5 2.5L13 8M2 8V6a1 1 0 011-1h1.5L7 2.5a1.4 1.4 0 012 0L11.5 5H13a1 1 0 011 1v2" />
                </svg>
              </span>
              <div>
                <p className="font-display text-lg font-extrabold text-navy sm:text-xl">
                  Let&rsquo;s achieve more together.
                </p>
                <p className="mt-1 max-w-md text-sm text-slate-600">
                  Get in touch today and see how we can support your business.
                </p>
              </div>
            </div>

            <Link
              href="/book-a-call"
              className="flex shrink-0 items-center gap-1.5 rounded-full bg-navy px-6 py-3 text-sm font-bold text-white transition hover:bg-navy-deep"
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