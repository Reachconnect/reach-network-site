"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Footer from "../components/Footer";

const TRUST_POINTS = [
  { title: "Quick responses" },
  { title: "Real people, real support" },
  { title: "Here when you need us" },
  { title: "Trusted by businesses" },
];

const HELP_OPTIONS = [
  "General enquiry",
  "I need staff",
  "I'm looking for work",
  "ReachConnect support",
  "Something else",
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
      { label: "FAQ", href: "/book-a-call#faq" },
    ],
  },
];

export default function ContactUs() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [form, setForm] = useState({
    fullName: "",
    companyName: "",
    jobTitle: "",
    phoneNumber: "",
    workEmail: "",
    helpTopic: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMessage("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setStatus("success");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("error");
    }
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
            src="/industries/contactus.png"
            alt="Reach Network team member"
            fill
            sizes="100vw"
            className="object-cover object-top"
            priority
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/90 to-navy/40" />

        <div className="relative mx-auto max-w-7xl px-6 pb-16 pt-10 lg:px-8 lg:pb-20">
          <div className="max-w-lg">
            <h1 className="font-display text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl">
              Contact us
              <br />
              <span className="text-orange">We&rsquo;re here to help.</span>
            </h1>
            <p className="mt-4 max-w-md text-sm text-white/70 sm:text-base">
              Have a question, need support or want to learn more about Reach Network? Get in touch with our team today.
            </p>

            <div className="mt-7 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
              {TRUST_POINTS.map((point) => (
                <div key={point.title}>
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border border-orange/40 text-orange">
                    <svg viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4">
                      <circle cx="8" cy="8" r="3" />
                    </svg>
                  </span>
                  <p className="mt-2 text-xs font-semibold text-white/80">{point.title}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* GET IN TOUCH + OTHER WAYS */}
      <section className="bg-slate-50 py-16 lg:py-20">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 lg:grid-cols-[1fr_400px] lg:px-8">
          {/* Form */}
          <div className="rounded-2xl bg-white p-6 shadow-sm sm:p-7">
            <p className="font-display border-b-2 border-orange pb-2 text-lg font-extrabold text-navy" style={{ display: "inline-block" }}>
              Get in touch
            </p>
            <p className="mt-3 text-xs text-slate-500">
              Fill in the form and a member of our team will get back to you as soon as possible.
            </p>

            {status === "success" ? (
              <div className="mt-5 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                Thanks — your message is in. We&rsquo;ll get back to you as soon as possible.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold text-navy">Your name <span className="text-orange">*</span></label>
                    <input required type="text" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-navy focus:border-navy focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-navy">Company name <span className="text-orange">*</span></label>
                    <input required type="text" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-navy focus:border-navy focus:outline-none" />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold text-navy">Job title <span className="text-orange">*</span></label>
                    <input required type="text" value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-navy focus:border-navy focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-navy">Phone number <span className="text-orange">*</span></label>
                    <input required type="tel" value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-navy focus:border-navy focus:outline-none" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-navy">Work email <span className="text-orange">*</span></label>
                  <input required type="email" value={form.workEmail} onChange={(e) => setForm({ ...form, workEmail: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-navy focus:border-navy focus:outline-none" />
                </div>

                <div>
                  <label className="text-xs font-semibold text-navy">How can we help? <span className="text-orange">*</span></label>
                  <select required value={form.helpTopic} onChange={(e) => setForm({ ...form, helpTopic: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-navy focus:border-navy focus:outline-none">
                    <option value="">Please select an option</option>
                    {HELP_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-navy">Your message <span className="text-orange">*</span></label>
                  <textarea required rows={4} placeholder="Tell us more about your enquiry..." value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="mt-1 w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-navy placeholder:text-slate-400 focus:border-navy focus:outline-none" />
                </div>

                {status === "error" && <p className="text-sm font-semibold text-red-600">{errorMessage}</p>}

                <button type="submit" disabled={status === "submitting"} className="flex w-full items-center justify-center gap-1.5 rounded-full bg-orange px-7 py-3.5 text-sm font-bold text-white transition hover:bg-orange-dark disabled:opacity-60">
                  {status === "submitting" ? "Sending..." : "Send message"}
                  {status !== "submitting" && <span aria-hidden="true">&rarr;</span>}
                </button>

                <p className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
                  <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
                    <path d="M8 1a3 3 0 00-3 3v2H4a1 1 0 00-1 1v6a1 1 0 001 1h8a1 1 0 001-1V7a1 1 0 00-1-1h-1V4a3 3 0 00-3-3zm-1.5 5V4a1.5 1.5 0 013 0v2h-3z" />
                  </svg>
                  Your information is safe and secure.
                </p>
              </form>
            )}
          </div>

          {/* Other ways to reach us */}
          <div className="space-y-6">
            <div>
              <p className="font-display border-b-2 border-orange pb-2 text-lg font-extrabold text-navy" style={{ display: "inline-block" }}>
                Other ways to reach us
              </p>

              <div className="mt-5 space-y-5">
                <div className="flex gap-3.5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-orange/40 text-orange">
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4.5 w-4.5">
                      <path d="M3.5 2.5A1.5 1.5 0 0 1 5 1h1.3a1.5 1.5 0 0 1 1.46 1.16l.62 2.68a1.5 1.5 0 0 1-.4 1.42l-1.1 1.1a11.5 11.5 0 0 0 5 5l1.1-1.1a1.5 1.5 0 0 1 1.42-.4l2.68.62A1.5 1.5 0 0 1 18 12.7V14a1.5 1.5 0 0 1-1.5 1.5C8.5 15.5 3.5 10.5 3.5 2.5z" />
                    </svg>
                  </span>
                  <div>
                    <p className="font-display text-sm font-bold text-navy">Call us</p>
                    <p className="text-sm text-slate-600">0121 630 1643</p>
                    <p className="text-xs text-slate-400">Mon &ndash; Fri: 8am &ndash; 5.30pm</p>
                  </div>
                </div>

                <div className="flex gap-3.5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-orange/40 text-orange">
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4.5 w-4.5">
                      <path d="M2.5 5.5A1.5 1.5 0 0 1 4 4h12a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 16 16H4a1.5 1.5 0 0 1-1.5-1.5v-9zm1.7.2 5.8 4.35 5.8-4.35" fill="none" stroke="currentColor" strokeWidth="1.4" />
                    </svg>
                  </span>
                  <div>
                    <p className="font-display text-sm font-bold text-navy">Email us</p>
                    <p className="text-sm text-slate-600">info@reachnetworkrec.com</p>
                    <p className="text-xs text-slate-400">We aim to respond within 1 working hour</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-navy p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display text-sm font-bold text-white">Existing customer?</p>
                  <p className="mt-1.5 text-xs text-white/70">
                    Log in to the ReachConnect platform for support or to manage your account.
                  </p>
                  <a href="#" className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-orange hover:text-orange-dark">
                    Go to platform <span aria-hidden="true">&rarr;</span>
                  </a>
                </div>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-orange/40 text-orange">
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" className="h-4.5 w-4.5">
                    <circle cx="8" cy="6" r="2.3" />
                    <path d="M3.5 13.5a4.5 4.5 0 0 1 9 0" />
                  </svg>
                </span>
              </div>
            </div>

            <div className="rounded-2xl bg-navy p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display text-sm font-bold text-white">New candidate?</p>
                  <p className="mt-1.5 text-xs text-white/70">
                    Register your CV and let us match you with the right opportunities.
                  </p>
                  <Link href="/looking-for-work" className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-orange hover:text-orange-dark">
                    Register here <span aria-hidden="true">&rarr;</span>
                  </Link>
                </div>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-orange/40 text-orange">
                  <svg viewBox="0 0 16 16" fill="currentColor" className="h-4.5 w-4.5">
                    <path d="M9 2a1 1 0 0 1 1 1v4h4a1 1 0 1 1 0 2h-4v4a1 1 0 1 1-2 0V9H4a1 1 0 1 1 0-2h4V3a1 1 0 0 1 1-1z" />
                  </svg>
                </span>
              </div>
            </div>

            <div className="rounded-2xl bg-navy p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display text-sm font-bold text-white">Looking for work?</p>
                  <p className="mt-1.5 text-xs text-white/70">
                    Browse live roles and register for work today.
                  </p>
                  <Link href="/looking-for-work" className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-orange hover:text-orange-dark">
                    Register for work <span aria-hidden="true">&rarr;</span>
                  </Link>
                </div>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-orange/40 text-orange">
                  <svg viewBox="0 0 16 16" fill="currentColor" className="h-4.5 w-4.5">
                    <path d="M3 6a1 1 0 0 1 1-1h8a1 1 0 1 1 0 2H4a1 1 0 0 1-1-1zm0 4a1 1 0 0 1 1-1h8a1 1 0 1 1 0 2H4a1 1 0 0 1-1-1z" />
                  </svg>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HEAD OFFICE */}
      <section className="bg-white pb-16 lg:pb-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="min-h-[220px] overflow-hidden rounded-2xl">
              <iframe
                title="Reach Network Recruitment office location"
                src="https://www.google.com/maps?q=132a+High+Street,+Bromsgrove,+B61+8ES,+United+Kingdom&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0, minHeight: 220 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>

            <div className="rounded-2xl bg-slate-50 p-6 sm:p-7">
              <p className="font-display text-lg font-extrabold text-navy">Our head office</p>

              <div className="mt-5 flex gap-3.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-orange/40 text-orange">
                  <svg viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4">
                    <path d="M8 1a5 5 0 0 0-5 5c0 3.75 5 9 5 9s5-5.25 5-9a5 5 0 0 0-5-5zm0 7a2 2 0 1 1 0-4 2 2 0 0 1 0 4z" />
                  </svg>
                </span>
                <div>
                  <p className="font-display text-sm font-bold text-navy">Reach Network Recruitment</p>
                  <p className="text-sm text-slate-600">132a High Street</p>
                  <p className="text-sm text-slate-600">Bromsgrove</p>
                  <p className="text-sm text-slate-600">B61 8ES</p>
                </div>
              </div>

              <div className="mt-5 flex gap-3.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-orange/40 text-orange">
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" className="h-4 w-4">
                    <circle cx="8" cy="8" r="6.5" />
                    <path d="M8 4.5V8l2.6 1.5" strokeLinecap="round" />
                  </svg>
                </span>
                <div>
                  <p className="font-display text-sm font-bold text-navy">Opening hours</p>
                  <p className="text-sm text-slate-600">Monday &ndash; Friday, 8:00am &ndash; 5:30pm</p>
                </div>
              </div>

              <div className="mt-5 rounded-xl bg-white p-4">
                <p className="text-xs font-semibold text-navy">We cover the whole of the UK</p>
                <p className="mt-0.5 text-xs text-slate-500">With teams and partners nationwide, we&rsquo;re never far away.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* NEED IMMEDIATE HELP */}
      <section className="bg-navy py-6">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 px-6 sm:flex-row sm:items-center lg:px-8">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-orange/40 text-orange">
              <svg viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4">
                <path d="M3.5 2.5A1.5 1.5 0 0 1 5 1h1.3a1.5 1.5 0 0 1 1.46 1.16l.62 2.68a1.5 1.5 0 0 1-.4 1.42l-1.1 1.1a11.5 11.5 0 0 0 5 5l1.1-1.1a1.5 1.5 0 0 1 1.42-.4l2.68.62A1.5 1.5 0 0 1 18 12.7V14a1.5 1.5 0 0 1-1.5 1.5C8.5 15.5 3.5 10.5 3.5 2.5z" />
              </svg>
            </span>
            <div>
              <p className="text-sm font-bold text-white">Need immediate help?</p>
              <p className="text-xs text-white/60">Our team is ready to support you.</p>
            </div>
          </div>
          <a href="tel:01216301643" className="flex items-center gap-1.5 text-sm font-bold text-white">
            Call us now on <span className="text-orange">0121 630 1643</span>
            <span aria-hidden="true" className="text-orange">&rarr;</span>
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <Footer />
    </main>
  );
}