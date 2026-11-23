"use client";

// FAQ: searchable, grouped by who's asking
import { useMemo, useState } from "react";
import Link from "next/link";
import Footer from "../components/Footer";

type Item = { q: string; a: string };
type Group = { key: string; label: string; icon: string; items: Item[] };

const GROUPS: Group[] = [
  {
    key: "employers",
    label: "Employers",
    icon: "M3 21h18M5 21V8l7-5 7 5v13M9 21v-6h6v6",
    items: [
      { q: "How quickly can you supply temporary staff?", a: "Often the same or next day, depending on the role, location and shift. We'll always tell you honestly how quickly we can fill it when you call." },
      { q: "How long does a permanent hire take?", a: "We usually send a screened shortlist within a week. The full process depends on your interviews and the candidate's notice period." },
      { q: "Which sectors do you cover?", a: "Drivers (Class 1, Class 2 and delivery), warehouse, manufacturing and engineering, for temporary, temp-to-perm and permanent roles." },
      { q: "Is there a minimum booking?", a: "No. We can cover a single shift or provide ongoing cover, whatever you need." },
      { q: "What if a worker isn't right?", a: "Tell us straight away. We'll replace them as quickly as we can and make sure it doesn't happen again." },
      { q: "Can we take a temporary worker on permanently?", a: "Yes. Temp-to-perm is a great way to try before you hire. The terms for this are set out clearly in our terms of business." },
    ],
  },
  {
    key: "pricing",
    label: "Pricing and terms",
    icon: "M12 2v20M17 6H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",
    items: [
      { q: "How does pricing work for temporary staff?", a: "You pay an hourly charge rate that covers the worker's pay, holiday pay, employer costs and our fee. It's agreed before we start." },
      { q: "How does pricing work for permanent hires?", a: "A one-off fee based on the role's salary, only payable when your new starter begins." },
      { q: "How often will we be invoiced?", a: "Temporary staff are invoiced weekly, based on the hours you've approved." },
      { q: "How do we sign your terms?", a: "Online in a couple of minutes. We'll email you a link, you read and sign on any device, and you get a signed copy straight away." },
    ],
  },
  {
    key: "checks",
    label: "Checks and compliance",
    icon: "M9 12l2 2 4-4m5.6-4A11.96 11.96 0 0 1 12 2.9 11.96 11.96 0 0 1 3.4 6 12 12 0 0 0 12 21a12 12 0 0 0 8.6-15z",
    items: [
      { q: "What checks do you do on workers?", a: "ID and right to work, work history, and any licences, CPC, digi cards or tickets the role needs. We take references where the role calls for them." },
      { q: "Who employs the temporary workers?", a: "We do. We handle their pay, holiday pay, tax and National Insurance, so you don't have to." },
      { q: "Do workers get a site induction?", a: "Yes. We brief every worker on your site, PPE and who to report to, and you can run your own induction on their first shift." },
      { q: "How do you look after personal data?", a: "We only collect what we need and keep it secure. Our privacy notice explains how." },
    ],
  },
  {
    key: "candidates",
    label: "Candidates",
    icon: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
    items: [
      { q: "Is it free to register?", a: "Yes, completely free. We never charge candidates to register or apply." },
      { q: "How do I apply?", a: "Find a job on our Looking for work page and press Quick apply, or just send us your CV and we'll call you when something fits." },
      { q: "What documents do I need?", a: "Proof of ID and right to work, plus any licences, CPC, digi card or tickets for the work you're applying for." },
      { q: "How and when do I get paid?", a: "Temporary workers are paid weekly for the hours on their approved timesheet. We'll go through the details when you register." },
      { q: "How do I clock in?", a: "On your phone, with the Reach Connect app. It checks you're at the right site so your hours are recorded correctly." },
      { q: "What happens after I apply?", a: "We'll review your application and call you if it's a good fit, usually within a couple of working days." },
    ],
  },
  {
    key: "connect",
    label: "Reach Connect",
    icon: "M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm4 17h2",
    items: [
      { q: "What is Reach Connect?", a: "Our portal for temporary staffing clients. See who's on site, check GPS and face-matched clock-ins, approve timesheets and track costs by site." },
      { q: "Does it cost extra?", a: "No. It comes with our temporary staffing service." },
      { q: "Do we need to install anything?", a: "No. It works in any browser on a computer, tablet or phone." },
      { q: "Can my colleagues have access?", a: "Yes. Add as many colleagues as you need, each with their own login." },
      { q: "Can I see a demo?", a: "Of course. Book a 15-minute demo and we'll show you everything." },
    ],
  },
];

function Icon({ d, className = "h-5 w-5" }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d={d} />
    </svg>
  );
}

// Bold the search words in an answer
function Highlight({ text, q }: { text: string; q: string }) {
  if (!q) return <>{text}</>;
  const safe = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${safe})`, "ig"));
  return (
    <>
      {parts.map((p, i) => (p.toLowerCase() === q.toLowerCase() ? <mark key={i} className="rounded bg-orange/25 px-0.5 text-navy">{p}</mark> : <span key={i}>{p}</span>))}
    </>
  );
}

const JSON_LD = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: GROUPS.flatMap((g) => g.items).map((i) => ({ "@type": "Question", name: i.q, acceptedAnswer: { "@type": "Answer", text: i.a } })),
});

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
      { label: "FAQ", href: "/faq" },
    ],
  },
];

export default function FAQPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [group, setGroup] = useState("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>("employers-0");
  const [helpful, setHelpful] = useState<Record<string, boolean>>({});

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    return GROUPS.filter((g) => group === "all" || g.key === group)
      .map((g) => ({ ...g, items: g.items.map((it, n) => ({ ...it, id: `${g.key}-${n}` })).filter((it) => !term || `${it.q} ${it.a}`.toLowerCase().includes(term)) }))
      .filter((g) => g.items.length);
  }, [group, q]);
  const count = results.reduce((n, g) => n + g.items.length, 0);

  return (
    <main className="overflow-x-hidden font-body">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON_LD }} />
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}`}</style>
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
      <section className="relative overflow-hidden bg-navy pb-20 pt-12">
        <div className="pointer-events-none absolute -right-40 -top-40 h-[480px] w-[480px] rounded-full bg-orange/15 blur-3xl" />
        <div className="relative mx-auto max-w-3xl px-6 text-center lg:px-8">
          <nav className="text-sm text-white/60">
            <Link href="/" className="hover:text-white">Home</Link> <span className="mx-1">›</span> <span className="text-white/90">FAQ</span>
          </nav>
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.3em] text-orange">Help centre</p>
          <h1 className="mt-3 font-display text-4xl font-extrabold text-white sm:text-5xl">How can we help?</h1>
          <label className="mx-auto mt-8 flex max-w-xl items-center gap-3 rounded-2xl bg-white px-4 shadow-2xl">
            <Icon d="M21 21l-4.3-4.3M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14z" className="h-5 w-5 flex-none text-slate-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search, e.g. timesheets, pay, checks" className="w-full bg-transparent py-4 text-navy placeholder:text-slate-400 focus:outline-none" />
            {q && (
              <button onClick={() => setQ("")} className="text-sm font-bold text-slate-400 hover:text-navy">
                Clear
              </button>
            )}
          </label>
        </div>
      </section>

      {/* TOPICS */}
      <section className="bg-slate-50 pb-16">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <div className="relative z-10 -mt-8 grid grid-cols-2 gap-2 rounded-2xl bg-white p-2 shadow-lg sm:grid-cols-3 lg:grid-cols-6">
            {[{ key: "all", label: "Everything", icon: "M4 6h16M4 12h16M4 18h16" }, ...GROUPS].map((g) => (
              <button key={g.key} onClick={() => setGroup(g.key)} className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-bold transition ${group === g.key ? "bg-navy text-white" : "text-slate-600 hover:bg-slate-100"}`}>
                <Icon d={g.icon} className={`h-4 w-4 ${group === g.key ? "text-orange" : "text-slate-400"}`} />
                {g.label}
              </button>
            ))}
          </div>

          <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_320px]">
            <div className="space-y-10">
              {q && (
                <p className="text-sm text-slate-500">
                  {count} answer{count === 1 ? "" : "s"} for &ldquo;{q}&rdquo;
                </p>
              )}
              {results.map((g) => (
                <div key={g.key} className="animate-[fadeIn_.3s_ease]">
                  <h2 className="flex items-center gap-2 font-display text-xl font-extrabold text-navy">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange/10 text-orange">
                      <Icon d={g.icon} className="h-4 w-4" />
                    </span>
                    {g.label}
                  </h2>
                  <div className="mt-4 space-y-2">
                    {g.items.map((it) => {
                      const isOpen = open === it.id || !!q;
                      return (
                        <div key={it.id} className={`overflow-hidden rounded-2xl border bg-white transition ${isOpen ? "border-orange/40 shadow-md" : "border-slate-200"}`}>
                          <button onClick={() => setOpen(open === it.id ? null : it.id)} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left">
                            <span className="font-display font-bold text-navy">
                              <Highlight text={it.q} q={q.trim()} />
                            </span>
                            <span className={`flex h-7 w-7 flex-none items-center justify-center rounded-full transition ${isOpen ? "rotate-45 bg-orange text-white" : "bg-slate-100 text-navy"}`}>+</span>
                          </button>
                          {isOpen && (
                            <div className="px-5 pb-4">
                              <p className="leading-relaxed text-slate-600">
                                <Highlight text={it.a} q={q.trim()} />
                              </p>
                              <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                                {helpful[it.id] === undefined ? (
                                  <>
                                    Helpful?
                                    <button onClick={() => setHelpful((h) => ({ ...h, [it.id]: true }))} className="rounded-full border border-slate-200 px-2.5 py-0.5 font-bold hover:border-navy hover:text-navy">
                                      Yes
                                    </button>
                                    <button onClick={() => setHelpful((h) => ({ ...h, [it.id]: false }))} className="rounded-full border border-slate-200 px-2.5 py-0.5 font-bold hover:border-navy hover:text-navy">
                                      No
                                    </button>
                                  </>
                                ) : helpful[it.id] ? (
                                  <span className="font-semibold text-green-600">Thanks!</span>
                                ) : (
                                  <span>
                                    Sorry about that.{" "}
                                    <Link href="/book-a-call" className="font-bold text-orange hover:underline">
                                      Ask us directly →
                                    </Link>
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              {count === 0 && (
                <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-10 text-center">
                  <p className="font-display text-xl font-bold text-navy">No answers for that yet</p>
                  <p className="mt-2 text-slate-600">Try a different word, or ask us directly.</p>
                  <Link href="/book-a-call" className="mt-5 inline-block rounded-full bg-orange px-6 py-3 font-bold text-white hover:bg-orange-dark">
                    Book a call
                  </Link>
                </div>
              )}
            </div>

            <aside className="space-y-3 lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-2xl bg-navy p-6 text-white">
                <p className="font-display text-lg font-bold">Still got a question?</p>
                <p className="mt-1 text-sm text-white/70">Talk to a real person. We&apos;re happy to help.</p>
                <a href="tel:01216301643" className="mt-4 flex items-center justify-center gap-2 rounded-full bg-orange py-3 font-bold transition hover:bg-orange-dark">
                  Call 0121 630 1643
                </a>
                <Link href="/book-a-call" className="mt-2 block rounded-full border border-white/25 py-3 text-center font-bold transition hover:bg-white/10">
                  Book a call
                </Link>
              </div>
              {[
                { label: "I need staff", href: "/i-need-staff", sub: "Send a staff request" },
                { label: "Find a job", href: "/looking-for-work", sub: "See live jobs" },
                { label: "Reach Connect demo", href: "/book-a-demo", sub: "15 minutes, no obligation" },
              ].map((l) => (
                <Link key={l.href} href={l.href} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-orange">
                  <span>
                    <span className="block font-bold text-navy">{l.label}</span>
                    <span className="block text-xs text-slate-500">{l.sub}</span>
                  </span>
                  <span className="text-orange">→</span>
                </Link>
              ))}
            </aside>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
