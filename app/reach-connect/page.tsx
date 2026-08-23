"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import Footer from "../components/Footer";

const BENEFITS = [
  { title: "Easy to use", sub: "A simple, intuitive platform that saves you time." },
  { title: "Post jobs", sub: "Create and manage job vacancies in just a few clicks." },
  { title: "Track progress", sub: "See live updates on candidates and your vacancies." },
  { title: "Stay connected", sub: "Chat with your consultant and get quick updates whenever you need." },
  { title: "Insight & reporting", sub: "Access data and reports to help you make smarter hiring decisions." },
  { title: "Secure & reliable", sub: "Your data is safe with us. Always secure, always compliant." },
];

const FEATURE_LIST = [
  "Manage multiple vacancies",
  "Review and shortlist candidates",
  "Share feedback and make decisions",
  "Access documents and key information",
  "Work with your dedicated consultant",
];

const PROCESS = [
  { step: "1", title: "Get set up", sub: "Your consultant invites you to Reach Connect and gets you set up in minutes." },
  { step: "2", title: "Post & manage jobs", sub: "Post your vacancies and manage everything from one easy dashboard." },
  { step: "3", title: "Review & shortlist", sub: "We find the right candidates. You review, shortlist and provide feedback." },
  { step: "4", title: "Hire & track", sub: "Make the right hire and track progress with real-time updates." },
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

export default function ReachConnectPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  function togglePlay() {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  }

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
      <section className="relative overflow-hidden bg-navy">
        <div className="mx-auto max-w-7xl px-6 pb-24 pt-8 lg:px-8 lg:pb-32 lg:pt-10">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-white/50">
            <Link href="/" className="hover:text-white">Home</Link>
            <span>&#8250;</span>
            <span>Reach Connect</span>
          </p>

          <div className="mt-6 grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange">Reach Connect</p>
              <h1 className="font-display mt-3 text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl">
                Smarter hiring. <span className="text-orange">Stronger connections.</span>
              </h1>
              <p className="mt-4 max-w-md text-sm text-white/70 sm:text-base">
                Reach Connect is our online platform that brings you and our recruitment experts together. Post jobs, manage vacancies and track progress — all in one place.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/book-a-demo" className="flex items-center gap-1.5 rounded-full bg-orange px-6 py-3 text-sm font-bold text-white transition hover:bg-orange-dark">
                  Request access <span aria-hidden="true">&rarr;</span>
                </Link>
                <a href="#how-it-works" className="flex items-center gap-1.5 rounded-full border border-white/25 px-6 py-3 text-sm font-bold text-white transition hover:border-white/50">
                  See how it works <span aria-hidden="true">&rarr;</span>
                </a>
              </div>
            </div>

            {/* VIDEO PLAYER */}
            <div>
              <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-navy-deep">
                <video
                  ref={videoRef}
                  className="h-full w-full object-cover"
                  poster=""
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                >
                  {/* Add your video file here, e.g: <source src="/videos/reach-connect-overview.mp4" type="video/mp4" /> */}
                </video>

                {!isPlaying && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-navy">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-orange">
                        <span className="h-4 w-4 rounded-full bg-orange" />
                      </span>
                      <span className="font-display leading-none text-left">
                        <span className="block text-xl font-extrabold tracking-tight text-white">REACH</span>
                        <span className="block text-sm font-extrabold tracking-tight text-orange">CONNECT</span>
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={togglePlay}
                      aria-label="Play video"
                      className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor" className="ml-1 h-6 w-6">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
              <p className="mt-3 flex items-center gap-1.5 text-xs text-white/50">
                <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5 text-orange">
                  <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm.5 3v4.3l3 1.8-.5.9-3.5-2.1V4h1z" />
                </svg>
                Watch a quick overview of Reach Connect
              </p>
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

      {/* FEATURES + DASHBOARD MOCKUP */}
      <section id="how-it-works" className="bg-white pb-16 pt-16 lg:pb-24 lg:pt-24">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:gap-8">
            <div>
              <h2 className="font-display text-2xl font-extrabold leading-tight text-navy sm:text-3xl">
                Everything you need, all in one place.
              </h2>
              <p className="mt-3 text-sm text-slate-500">
                Reach Connect gives you full visibility and control of your recruitment activity.
              </p>
              <ul className="mt-6 space-y-3">
                {FEATURE_LIST.map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy text-white">
                      <svg viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3">
                        <path d="M6.2 10.9 3.5 8.2l1-1 1.7 1.7 4.6-4.6 1 1z" />
                      </svg>
                    </span>
                    <span className="text-sm font-medium text-navy">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* DASHBOARD MOCKUP */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-xl shadow-navy/10">
              <div className="grid grid-cols-[140px_1fr] bg-slate-50 sm:grid-cols-[170px_1fr]">
                <div className="bg-navy p-4 text-white">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full border border-orange">
                      <span className="h-2 w-2 rounded-full bg-orange" />
                    </span>
                    <span className="font-display text-[10px] font-extrabold leading-none">
                      REACH<br /><span className="text-orange">CONNECT</span>
                    </span>
                  </div>
                  <div className="mt-6 space-y-1 text-[10px] font-semibold text-white/70">
                    <p className="rounded-md bg-white/10 px-2 py-1.5 text-white">Dashboard</p>
                    <p className="px-2 py-1.5">Jobs</p>
                    <p className="px-2 py-1.5">Candidates</p>
                    <p className="px-2 py-1.5">Messages</p>
                    <p className="px-2 py-1.5">Reports</p>
                  </div>
                </div>

                <div className="p-4 sm:p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-navy">Welcome back</p>
                      <p className="text-[10px] text-slate-400">Here&rsquo;s what&rsquo;s happening with your recruitment.</p>
                    </div>
                    <span className="rounded-full bg-navy px-3 py-1.5 text-[9px] font-bold text-white">+ Post a new job</span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {[
                      { label: "Live jobs", value: "8" },
                      { label: "Candidates", value: "24" },
                      { label: "Shortlisted", value: "6" },
                      { label: "Interviews", value: "3" },
                    ].map((stat) => (
                      <div key={stat.label} className="rounded-lg bg-slate-50 p-2.5">
                        <p className="text-[9px] text-slate-400">{stat.label}</p>
                        <p className="font-display text-base font-extrabold text-navy">{stat.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 rounded-lg bg-slate-50 p-3">
                    <p className="text-[10px] font-bold text-navy">Recent activity</p>
                    <div className="mt-2 space-y-1.5 text-[9px] text-slate-500">
                      <p>New applications received &middot; 10 mins ago</p>
                      <p>Candidate moved to shortlist &middot; 1 hour ago</p>
                      <p>Interview scheduled &middot; 3 hours ago</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIAL */}
      <section className="bg-white pb-16 lg:pb-20">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <div className="flex flex-col items-start gap-6 rounded-2xl bg-navy p-6 sm:flex-row sm:items-center sm:justify-between lg:p-10">
            <div>
              <span className="font-display text-3xl font-extrabold text-orange">&ldquo;</span>
              <p className="mt-1 max-w-xl text-base font-medium text-white sm:text-lg">
                Reach Connect makes the whole process so much easier. It&rsquo;s quick, clear and keeps everything in one place.
              </p>
              <p className="mt-3 text-xs font-semibold text-orange">Operations Manager, National Logistics Company</p>
            </div>
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-orange/40 text-orange">
              <svg viewBox="0 0 16 16" fill="currentColor" className="h-6 w-6">
                <circle cx="6" cy="5" r="2" />
                <circle cx="11" cy="6" r="1.6" />
                <path d="M2 13a4 4 0 0 1 8 0M9.5 8.2A3 3 0 0 1 14 11" />
              </svg>
            </span>
          </div>
        </div>
      </section>

      {/* PROCESS */}
      <section className="bg-slate-50 py-16 lg:py-20">
        <div className="mx-auto max-w-6xl px-6 text-center lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange">Our process</p>
          <h2 className="font-display mt-3 text-2xl font-extrabold text-navy sm:text-3xl">Working together is simple.</h2>

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
                  <path d="M14 2 2 7l5 2 2 5z" />
                </svg>
              </span>
              <div>
                <p className="font-display text-sm font-bold text-white">Ready to connect?</p>
                <p className="mt-0.5 text-xs text-white/60">Request access to Reach Connect today and experience smarter, faster recruitment.</p>
              </div>
            </div>
            <Link href="/book-a-demo" className="flex shrink-0 items-center gap-1.5 rounded-full bg-orange px-6 py-3 text-sm font-bold text-white transition hover:bg-orange-dark">
              Request access <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}