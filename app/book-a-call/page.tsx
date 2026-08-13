"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Footer from "../components/Footer";

const TIME_SLOTS = ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00", "17:00"];

const HELP_OPTIONS = [
  "Hiring warehouse staff",
  "Hiring drivers",
  "Hiring manufacturing staff",
  "Hiring engineers",
  "General enquiry",
];

const WHAT_TO_EXPECT = [
  { title: "Understand your needs", sub: "We'll learn about your roles, challenges, and hiring goals." },
  { title: "Explore solutions", sub: "We'll share how our recruitment services can meet your needs." },
  { title: "Get expert advice", sub: "Our specialists will offer insights and best-practice guidance." },
  { title: "Next steps", sub: "We'll outline a clear plan to help you move forward." },
];

const FAQS = [
  {
    q: "I'm a candidate / hiring manager, do you charge for these calls?",
    a: "No, our calls are completely free. We would never charge you.",
  },
  {
    q: "I've seen a role on your website I'm interested in applying for, can I book a call in with you?",
    a: "Of course, feel free to book a call in with us, we would love to chat. However, please make sure you send your CV before the call so we can discuss that too.",
  },
  {
    q: "What if I need to cancel or reschedule?",
    a: "Easy — you'll get a calendar invite after you book, which will land in your diary. If you need to cancel or rebook, simply re-arrange or cancel it in your own diary.",
  },
  {
    q: "What happens after the call?",
    a: "That depends who you are. If you're a client, we'll arrange a suitable time for a site visit if that's what we've discussed, or set up a look at ReachConnect. If you're a candidate and you've already provided us with your CV, we'll follow up over email with all the details of our client and the role.",
  },
];

function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatTimeLabel(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
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

export default function BookACall() {
  const today = new Date();
  const [viewMonth, setViewMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>(null);

  const [form, setForm] = useState({
    fullName: "",
    workEmail: "",
    phoneNumber: "",
    companyName: "",
    jobTitle: "",
    helpTopic: "",
    notes: "",
  });

  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const startOfMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
  const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();
  const firstWeekday = (startOfMonth.getDay() + 6) % 7;

  const calendarCells: (Date | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(viewMonth.getFullYear(), viewMonth.getMonth(), i + 1)),
  ];

  const todayKey = formatDateKey(today);

  function isSelectable(date: Date) {
    const day = date.getDay();
    const isWeekend = day === 0 || day === 6;
    const isPast = formatDateKey(date) < todayKey;
    return !isWeekend && !isPast;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedDate || !selectedTime) {
      setErrorMessage("Please select a date and time.");
      setStatus("error");
      return;
    }
    setStatus("submitting");
    setErrorMessage("");

    try {
      const res = await fetch("/api/book-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          date: formatDateKey(selectedDate),
          time: selectedTime,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Something went wrong.");
      }
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
              <span className="block text-[9px] font-semibold tracking-[0.2em] text-white/60">
                NETWORK RECRUITMENT
              </span>
            </span>
          </Link>

          <div className="flex shrink-0 items-center gap-3">
            <a
              href="tel:01216301643"
              className="hidden shrink-0 items-center gap-2 whitespace-nowrap text-sm font-semibold text-white/85 transition hover:text-white sm:flex"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0">
                <path d="M3.5 2.5A1.5 1.5 0 0 1 5 1h1.3a1.5 1.5 0 0 1 1.46 1.16l.62 2.68a1.5 1.5 0 0 1-.4 1.42l-1.1 1.1a11.5 11.5 0 0 0 5 5l1.1-1.1a1.5 1.5 0 0 1 1.42-.4l2.68.62A1.5 1.5 0 0 1 18 12.7V14a1.5 1.5 0 0 1-1.5 1.5C8.5 15.5 3.5 10.5 3.5 2.5z" />
              </svg>
              0121 630 1643
            </a>
            <Link
              href="/book-a-call"
              className="hidden rounded-full bg-orange px-5 py-2.5 text-sm font-bold text-white transition hover:bg-orange-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:block"
            >
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

        <div
          className={`overflow-hidden border-t border-white/10 bg-navy transition-[max-height] duration-300 ease-in-out ${
            menuOpen ? "max-h-96" : "max-h-0 border-t-0"
          }`}
        >
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
            <Link href="/contact-us" className="rounded-lg px-3 py-3 text-sm font-semibold text-white/85 transition hover:bg-white/5 hover:text-white">
              Contact us
            </Link>
            <div className="mt-2 flex flex-col gap-3 border-t border-white/10 pt-4 sm:hidden">
              <a href="tel:01216301643" className="flex items-center gap-2 px-3 text-sm font-semibold text-white/85">
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0">
                  <path d="M3.5 2.5A1.5 1.5 0 0 1 5 1h1.3a1.5 1.5 0 0 1 1.46 1.16l.62 2.68a1.5 1.5 0 0 1-.4 1.42l-1.1 1.1a11.5 11.5 0 0 0 5 5l1.1-1.1a1.5 1.5 0 0 1 1.42-.4l2.68.62A1.5 1.5 0 0 1 18 12.7V14a1.5 1.5 0 0 1-1.5 1.5C8.5 15.5 3.5 10.5 3.5 2.5z" />
                </svg>
                0121 630 1643
              </a>
            </div>
          </nav>
        </div>
      </header>

      {/* HERO — full-bleed, matching the Candidate CTA treatment on the homepage */}
      <section className="relative isolate min-h-[420px] overflow-hidden bg-navy py-14 lg:py-16">
        <div className="absolute inset-0">
          <Image
            src="/PlaceholderPanel/coverphoto.png"
            alt="Reach Network team member"
            fill
            sizes="100vw"
            className="object-cover object-top"
            priority
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/85 to-navy/20" />

        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="max-w-lg">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange">Book a call</p>
            <h1 className="font-display mt-3 text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl">
              Let&rsquo;s talk about your hiring goals.
            </h1>
            <p className="mt-4 max-w-md text-sm text-white/70 sm:text-base">
              Schedule a free call with our team and discover how Reach can help you find the right people, faster.
            </p>
            <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2">
              {["No obligation", "Quick and easy", "Tailored to you"].map((label) => (
                <div key={label} className="flex items-center gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-orange/40 text-orange">
                    <svg viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3">
                      <path d="M6.2 10.9 3.5 8.2l1-1 1.7 1.7 4.6-4.6 1 1z" />
                    </svg>
                  </span>
                  <span className="text-xs font-semibold text-white/75">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* BOOKING CARD — pulled up close to the hero */}
      <section className="bg-slate-50 pb-12 pt-6 lg:pb-16 lg:pt-8">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <form
            onSubmit={handleSubmit}
            className="grid gap-8 rounded-3xl bg-white p-5 shadow-xl shadow-navy/5 sm:p-6 lg:grid-cols-2 lg:p-10"
          >
            {/* Calendar */}
            <div>
              <h2 className="font-display text-lg font-extrabold text-navy">1. Select a date and time</h2>

              <div className="mt-4 rounded-2xl border border-slate-200 p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100"
                    aria-label="Previous month"
                  >
                    &#8249;
                  </button>
                  <p className="text-sm font-bold text-navy">
                    {viewMonth.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
                  </p>
                  <button
                    type="button"
                    onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100"
                    aria-label="Next month"
                  >
                    &#8250;
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[9px] font-bold uppercase text-slate-400 sm:text-[10px]">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                    <span key={d}>{d}</span>
                  ))}
                </div>

                <div className="mt-1 grid grid-cols-7 gap-1">
                  {calendarCells.map((date, i) => {
                    if (!date) return <div key={i} />;
                    const selectable = isSelectable(date);
                    const isSelected = selectedDate && formatDateKey(date) === formatDateKey(selectedDate);
                    return (
                      <button
                        key={i}
                        type="button"
                        disabled={!selectable}
                        onClick={() => {
                          setSelectedDate(date);
                          setSelectedTime(null);
                        }}
                        className={`aspect-square rounded-full text-xs font-semibold transition ${
                          isSelected
                            ? "bg-navy text-white"
                            : selectable
                            ? "text-navy hover:bg-slate-100"
                            : "cursor-not-allowed text-slate-300"
                        }`}
                      >
                        {date.getDate()}
                      </button>
                    );
                  })}
                </div>

                {selectedDate && (
                  <div className="mt-5 border-t border-slate-200 pt-4">
                    <p className="text-xs font-semibold text-slate-500">
                      Available times for{" "}
                      {selectedDate.toLocaleDateString("en-GB", { weekday: "long", month: "long", day: "numeric" })}
                    </p>
                    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {TIME_SLOTS.map((time) => (
                        <button
                          key={time}
                          type="button"
                          onClick={() => setSelectedTime(time)}
                          className={`rounded-lg border px-2 py-2 text-xs font-semibold transition ${
                            selectedTime === time
                              ? "border-navy bg-navy text-white"
                              : "border-slate-200 text-navy hover:border-navy/40"
                          }`}
                        >
                          {formatTimeLabel(time)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <p className="mt-4 flex items-center gap-1.5 text-[11px] text-slate-400">
                  <svg viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3">
                    <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm.5 3v4.3l3 1.8-.5.9-3.5-2.1V4h1z" />
                  </svg>
                  The call will last about 30 minutes.
                </p>
              </div>
            </div>

            {/* Form fields */}
            <div>
              <h2 className="font-display text-lg font-extrabold text-navy">2. Tell us about you</h2>

              <div className="mt-4 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-navy">
                    Full name <span className="text-orange">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Alex Johnson"
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-navy placeholder:text-slate-400 focus:border-navy focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-navy">
                    Work email <span className="text-orange">*</span>
                  </label>
                  <input
                    required
                    type="email"
                    placeholder="e.g. alex.johnson@company.com"
                    value={form.workEmail}
                    onChange={(e) => setForm({ ...form, workEmail: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-navy placeholder:text-slate-400 focus:border-navy focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-navy">
                    Phone number <span className="text-orange">*</span>
                  </label>
                  <input
                    required
                    type="tel"
                    placeholder="e.g. (555) 123-4567"
                    value={form.phoneNumber}
                    onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-navy placeholder:text-slate-400 focus:border-navy focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-navy">
                    Company name <span className="text-orange">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Acme Logistics"
                    value={form.companyName}
                    onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-navy placeholder:text-slate-400 focus:border-navy focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-navy">
                    Job title <span className="text-orange">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Operations Manager"
                    value={form.jobTitle}
                    onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-navy placeholder:text-slate-400 focus:border-navy focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-navy">
                    What can we help you with? <span className="text-orange">*</span>
                  </label>
                  <select
                    required
                    value={form.helpTopic}
                    onChange={(e) => setForm({ ...form, helpTopic: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-navy focus:border-navy focus:outline-none"
                  >
                    <option value="">Select an option</option>
                    {HELP_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-navy">Anything else we should know?</label>
                  <textarea
                    rows={3}
                    placeholder="Briefly tell us about your hiring needs..."
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className="mt-1 w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-navy placeholder:text-slate-400 focus:border-navy focus:outline-none"
                  />
                </div>

                {status === "error" && <p className="text-sm font-semibold text-red-600">{errorMessage}</p>}

                {status === "success" ? (
                  <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                    You&rsquo;re booked in! Check your email for a confirmation and calendar invite.
                  </div>
                ) : (
                  <button
                    type="submit"
                    disabled={status === "submitting"}
                    className="flex items-center gap-1.5 rounded-full bg-orange px-7 py-3.5 text-sm font-bold text-white transition hover:bg-orange-dark disabled:opacity-60"
                  >
                    {status === "submitting" ? "Booking..." : "Confirm booking"}
                    {status !== "submitting" && <span aria-hidden="true">&rarr;</span>}
                  </button>
                )}
              </div>
            </div>
          </form>

          <p className="mt-5 flex items-center justify-center gap-1.5 text-xs text-slate-400">
            <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
              <path d="M8 1a3 3 0 00-3 3v2H4a1 1 0 00-1 1v6a1 1 0 001 1h8a1 1 0 001-1V7a1 1 0 00-1-1h-1V4a3 3 0 00-3-3zm-1.5 5V4a1.5 1.5 0 013 0v2h-3z" />
            </svg>
            Your information is secure and will never be shared.
          </p>
        </div>
      </section>

      {/* WHAT TO EXPECT */}
      <section className="bg-white py-16 lg:py-20">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[220px_1fr] lg:gap-6">
            <h2 className="font-display text-2xl font-extrabold text-navy">What to expect on the call</h2>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {WHAT_TO_EXPECT.map((item) => (
                <div key={item.title}>
                  <span className="flex h-10 w-10 items-center justify-center rounded-full border border-orange/40 text-orange">
                    <svg viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4">
                      <circle cx="8" cy="8" r="3" />
                    </svg>
                  </span>
                  <p className="font-display mt-3 text-sm font-bold text-navy">{item.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-slate-50 py-16 lg:py-20">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-extrabold text-navy">Frequently asked questions</h2>
            <a href="#contact" className="hidden text-xs font-bold text-orange hover:text-orange-dark sm:block">
              More questions? Contact us
            </a>
          </div>

          <div className="mt-6 space-y-2">
            {FAQS.map((faq, i) => (
              <div key={faq.q} className="rounded-xl bg-white">
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-semibold text-navy"
                >
                  {faq.q}
                  <span className={`shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`}>&#9660;</span>
                </button>
                {openFaq === i && <p className="px-5 pb-4 text-sm text-slate-500">{faq.a}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <Footer />
    </main>
  );
}