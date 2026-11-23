"use client";

// Looking for work: live jobs from the CRM, quick apply, CV upload and job alerts
import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import ApplyForm from "../jobs/ApplyForm";
import Footer from "../components/Footer";
import { createClient } from "@/lib/supabase/client";

type Job = {
  id: string;
  title: string;
  category: string;
  location: string | null;
  employment_type: string | null;
  salary: string | null;
  description: string | null;
  status: string;
  created_at: string;
  href: string;
};

const SECTORS = [
  { label: "Driving", href: "/industries/drivers", img: "/industries/industry-driving.png", body: "Class 1, Class 2 and delivery drivers." },
  { label: "Warehouse", href: "/industries/warehouse", img: "/industries/industry-warehousing.png", body: "Pickers, packers, FLT and team leaders." },
  { label: "Manufacturing", href: "/industries/manufacturing", img: "/industries/industry-manufacturing.png", body: "Production, food and machine operators." },
  { label: "Engineering", href: "/industries/engineering", img: "/industries/industry-engineering.png", body: "Maintenance, multi-skilled and technical." },
];

const STEPS = [
  { title: "Apply or send your CV", body: "Takes two minutes from your phone." },
  { title: "A quick chat", body: "We get to know you and what you want." },
  { title: "Get checked once", body: "ID, right to work and any licences." },
  { title: "Start work", body: "Shifts or interviews that suit you." },
];

const FAQS = [
  { q: "Does it cost anything?", a: "No. It's free to register and apply, and always will be." },
  { q: "Do I need a CV?", a: "It helps, but it's not essential. You can apply without one, or build one free in 5 minutes with our CV builder at reachnetworkrec.com/cv-builder." },
  { q: "I can't see a job that suits me. What now?", a: "Send us your CV anyway. Lots of our work is filled before it's advertised, so we'll be in touch when something fits." },
  { q: "What documents will I need?", a: "Proof of ID and right to work, plus any licences, CPC, digi card or tickets for the work you're applying for." },
  { q: "How will I clock in?", a: "Temporary workers clock in and out on their phone with the Reach Connect app, so your hours are recorded correctly." },
];

function ago(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 14) return "Last week";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function Icon({ d, className = "h-5 w-5" }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d={d} />
    </svg>
  );
}

const PIN = "M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21zm0-9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z";
const CLOCK = "M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z";
const POUND = "M17 20H7c2-2 2-4 2-6V9a3 3 0 0 1 6 0M6 14h8";
const SEARCH = "M21 21l-4.3-4.3M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14z";

function Modal({ title, sub, onClose, children }: { title: string; sub?: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-navy/70 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl sm:p-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-display text-xl font-extrabold text-navy">{title}</p>
            {sub && <p className="mt-1 text-sm text-slate-500">{sub}</p>}
          </div>
          <button onClick={onClose} className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-slate-100 text-navy" aria-label="Close">
            ✕
          </button>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </div>
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
      { label: "FAQ", href: "/faq" },
    ],
  },
];

export default function LookingForWorkClient({ jobs }: { jobs: Job[] }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [where, setWhere] = useState("");
  const [category, setCategory] = useState("All");
  const [types, setTypes] = useState<string[]>([]);
  const [sort, setSort] = useState<"new" | "az">("new");
  const [applyJob, setApplyJob] = useState<Job | null>(null);
  const [cvOpen, setCvOpen] = useState(false);
  const [faq, setFaq] = useState<number | null>(0);
  const [alertEmail, setAlertEmail] = useState("");
  const [alertStatus, setAlertStatus] = useState<"idle" | "sending" | "saved" | "error">("idle");

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    jobs.forEach((j) => j.category && counts.set(j.category, (counts.get(j.category) || 0) + 1));
    return [["All", jobs.length] as [string, number], ...Array.from(counts.entries()).sort((a, b) => a[0].localeCompare(b[0]))];
  }, [jobs]);
  const allTypes = useMemo(() => Array.from(new Set(jobs.map((j) => j.employment_type).filter(Boolean))) as string[], [jobs]);
  const locations = useMemo(() => Array.from(new Set(jobs.map((j) => j.location).filter(Boolean))).sort() as string[], [jobs]);

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    const w = where.trim().toLowerCase();
    const list = jobs.filter(
      (j) =>
        (!q || `${j.title} ${j.category} ${j.description ?? ""}`.toLowerCase().includes(q)) &&
        (!w || (j.location ?? "").toLowerCase().includes(w)) &&
        (category === "All" || j.category === category) &&
        (types.length === 0 || (j.employment_type && types.includes(j.employment_type)))
    );
    return list.sort((a, b) => (sort === "az" ? a.title.localeCompare(b.title) : b.created_at.localeCompare(a.created_at)));
  }, [jobs, search, where, category, types, sort]);

  const filtered = search || where || category !== "All" || types.length > 0;
  function clear() {
    setSearch("");
    setWhere("");
    setCategory("All");
    setTypes([]);
  }

  async function saveAlert(e: React.FormEvent) {
    e.preventDefault();
    if (!alertEmail.includes("@")) return;
    setAlertStatus("sending");
    try {
      const { error } = await createClient().from("job_alerts").insert({ email: alertEmail.trim().toLowerCase() });
      if (error) throw error;
      setAlertStatus("saved");
    } catch {
      setAlertStatus("error");
    }
  }

  return (
    <main className="overflow-x-hidden font-body">
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

      {/* HERO + SEARCH */}
      <section className="relative overflow-hidden bg-navy pb-24 pt-12">
        <Image src="/industries/lookingforwork.png" alt="" fill priority sizes="100vw" className="object-cover object-center opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/90 to-navy/50" />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <nav className="text-sm text-white/60">
            <Link href="/" className="hover:text-white">Home</Link> <span className="mx-1">›</span> <span className="text-white/90">Looking for work</span>
          </nav>
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.3em] text-orange">Looking for work</p>
          <h1 className="mt-3 max-w-2xl font-display text-4xl font-extrabold leading-tight text-white sm:text-5xl">
            Find your next job <span className="text-orange">with Reach.</span>
          </h1>
          <p className="mt-4 max-w-xl text-lg text-white/80">Driving, warehouse, manufacturing and engineering work. Free to apply, from your phone, in two minutes.</p>
          <div className="mt-8 flex max-w-3xl flex-col gap-2 rounded-2xl bg-white p-2 shadow-2xl sm:flex-row">
            <label className="flex flex-1 items-center gap-2 rounded-xl px-3">
              <Icon d={SEARCH} className="h-5 w-5 flex-none text-slate-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Job title or keyword" className="w-full bg-transparent py-3 text-navy placeholder:text-slate-400 focus:outline-none" />
            </label>
            <label className="flex flex-1 items-center gap-2 rounded-xl border-slate-100 px-3 sm:border-l">
              <Icon d={PIN} className="h-5 w-5 flex-none text-slate-400" />
              <input value={where} onChange={(e) => setWhere(e.target.value)} placeholder="Town or area" list="job-locations" className="w-full bg-transparent py-3 text-navy placeholder:text-slate-400 focus:outline-none" />
              <datalist id="job-locations">
                {locations.map((l) => <option key={l} value={l} />)}
              </datalist>
            </label>
            <a href="#jobs" className="rounded-xl bg-orange px-6 py-3 text-center font-bold text-white transition hover:bg-orange-dark">
              Search {jobs.length > 0 ? `${shown.length} job${shown.length === 1 ? "" : "s"}` : ""}
            </a>
          </div>
          <p className="mt-4 text-sm text-white/70">
            Nothing suitable?{" "}
            <button onClick={() => setCvOpen(true)} className="font-bold text-orange hover:underline">
              Send us your CV
            </button>{" "}
            and we&apos;ll call you when something fits.
          </p>
        </div>
      </section>

      {/* JOBS */}
      <section id="jobs" className="scroll-mt-16 bg-slate-50 pb-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="-mt-8 flex gap-2 overflow-x-auto rounded-2xl bg-white p-2 shadow-lg">
            {categories.map(([c, n]) => (
              <button key={c} onClick={() => setCategory(c)} className={`flex flex-none items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${category === c ? "bg-navy text-white" : "text-slate-600 hover:bg-slate-100"}`}>
                {c === "All" ? "All jobs" : c}
                <span className={`rounded-full px-2 py-0.5 text-[11px] ${category === c ? "bg-orange text-white" : "bg-slate-100 text-slate-500"}`}>{n}</span>
              </button>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {allTypes.map((t) => (
                <button key={t} onClick={() => setTypes((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]))} className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${types.includes(t) ? "border-orange bg-orange/10 text-navy" : "border-slate-300 bg-white text-slate-600"}`}>
                  {types.includes(t) ? "✓ " : ""}
                  {t}
                </button>
              ))}
              {filtered && (
                <button onClick={clear} className="text-sm font-bold text-orange hover:underline">
                  Clear filters
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span>
                {shown.length} of {jobs.length} jobs
              </span>
              <select value={sort} onChange={(e) => setSort(e.target.value as "new" | "az")} className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm font-semibold text-navy">
                <option value="new">Newest first</option>
                <option value="az">A to Z</option>
              </select>
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
            <div className="space-y-3">
              {shown.map((j) => (
                <article key={j.id} className="group animate-[fadeIn_.3s_ease] rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-orange/50 hover:shadow-lg sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-orange/10 px-2.5 py-0.5 text-xs font-bold text-orange">{j.category}</span>
                        {j.employment_type && <span className="rounded-full bg-navy/5 px-2.5 py-0.5 text-xs font-bold text-navy">{j.employment_type}</span>}
                        <span className="text-xs text-slate-400">{ago(j.created_at)}</span>
                      </div>
                      <Link href={j.href} className="mt-2 block font-display text-xl font-bold text-navy group-hover:text-orange">
                        {j.title}
                      </Link>
                      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-600">
                        {j.location && (
                          <span className="flex items-center gap-1.5">
                            <Icon d={PIN} className="h-4 w-4 text-slate-400" />
                            {j.location}
                          </span>
                        )}
                        {j.salary && (
                          <span className="flex items-center gap-1.5 font-semibold text-navy">
                            <Icon d={POUND} className="h-4 w-4 text-slate-400" />
                            {j.salary}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {j.description && <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-slate-600">{j.description}</p>}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button onClick={() => setApplyJob(j)} className="rounded-full bg-orange px-5 py-2.5 text-sm font-bold text-white transition hover:bg-orange-dark">
                      Quick apply
                    </button>
                    <Link href={j.href} className="rounded-full border border-slate-300 px-5 py-2.5 text-sm font-bold text-navy transition hover:border-navy">
                      View job and map
                    </Link>
                  </div>
                </article>
              ))}
              {shown.length === 0 && (
                <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-10 text-center">
                  <p className="font-display text-xl font-bold text-navy">{jobs.length === 0 ? "New jobs are added all the time" : "No jobs match that search"}</p>
                  <p className="mx-auto mt-2 max-w-md text-slate-600">Lots of our work is filled before it&apos;s advertised. Send us your CV and we&apos;ll call you when something fits.</p>
                  <div className="mt-5 flex flex-wrap justify-center gap-3">
                    <button onClick={() => setCvOpen(true)} className="rounded-full bg-orange px-6 py-3 font-bold text-white hover:bg-orange-dark">
                      Send my CV
                    </button>
                    {filtered && (
                      <button onClick={clear} className="rounded-full border border-slate-300 px-6 py-3 font-bold text-navy">
                        Show all jobs
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* SIDEBAR */}
            <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-2xl bg-navy p-6 text-white">
                <p className="font-display text-lg font-bold">Send us your CV</p>
                <p className="mt-1 text-sm text-white/70">Not seen the right job? We&apos;ll match you to work as it comes in.</p>
                <button onClick={() => setCvOpen(true)} className="mt-4 w-full rounded-full bg-orange py-3 font-bold transition hover:bg-orange-dark">
                  Upload CV
                </button>
              </div>
              <form onSubmit={saveAlert} className="rounded-2xl border border-slate-200 bg-white p-6">
                <p className="flex items-center gap-2 font-display text-lg font-bold text-navy">
                  <Icon d={CLOCK} className="h-5 w-5 text-orange" /> Job alerts
                </p>
                {alertStatus === "saved" ? (
                  <p className="mt-2 rounded-lg bg-green-50 p-3 text-sm font-semibold text-green-700">Done. We&apos;ll email you when new jobs go live.</p>
                ) : (
                  <>
                    <p className="mt-1 text-sm text-slate-600">Get new jobs by email. Unsubscribe any time.</p>
                    <input type="email" required value={alertEmail} onChange={(e) => setAlertEmail(e.target.value)} placeholder="Your email" className="mt-3 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-orange focus:outline-none" />
                    <button disabled={alertStatus === "sending"} className="mt-2 w-full rounded-full border-2 border-navy py-2.5 text-sm font-bold text-navy transition hover:bg-navy hover:text-white">
                      {alertStatus === "sending" ? "Saving…" : "Email me new jobs"}
                    </button>
                    {alertStatus === "error" && <p className="mt-2 text-xs text-red-600">That didn&apos;t save. Please try again.</p>}
                  </>
                )}
              </form>
              <Link href="/cv-builder" className="flex items-center justify-between rounded-2xl bg-orange p-5 font-bold text-white transition hover:bg-orange-dark">
                <span>
                  <span className="block text-xs font-normal text-white/80">No CV? No problem</span>
                  Build one free in 5 minutes
                </span>
                <span>→</span>
              </Link>
              <Link href="/take-home-pay" className="flex items-center justify-between rounded-2xl border border-orange/40 bg-orange/5 p-5 font-bold text-navy transition hover:bg-orange/10">
                <span>
                  <span className="block text-xs font-normal text-slate-500">Free calculator</span>
                  What will I take home?
                </span>
                <span className="text-orange">→</span>
              </Link>
              <a href="tel:01216301643" className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 font-bold text-navy transition hover:border-orange">
                <span>
                  <span className="block text-xs font-normal text-slate-500">Rather talk?</span>
                  0121 630 1643
                </span>
                <span className="text-orange">→</span>
              </a>
            </aside>
          </div>
        </div>
      </section>

      {/* SECTORS */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange">The work we do</p>
          <h2 className="mt-3 font-display text-3xl font-extrabold text-navy">Find work in your sector</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SECTORS.map((s) => (
              <Link key={s.label} href={s.href} className="group relative block aspect-[4/5] overflow-hidden rounded-2xl">
                <Image src={s.img} alt={s.label} fill sizes="(max-width: 640px) 100vw, 25vw" className="scale-[1.08] object-cover transition duration-500 group-hover:scale-[1.15]" />
                <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/30 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <p className="font-display text-xl font-bold text-white">{s.label}</p>
                  <p className="mt-1 text-sm text-white/75">{s.body}</p>
                  <p className="mt-2 text-sm font-bold text-orange">Explore →</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* STEPS */}
      <section className="bg-navy py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange">How it works</p>
              <h2 className="mt-3 font-display text-3xl font-extrabold text-white">From applying to starting work</h2>
            </div>
            <Link href="/how-it-works" className="font-bold text-orange hover:underline">
              See every step →
            </Link>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, n) => (
              <div key={s.title} className="relative rounded-2xl border border-white/10 bg-white/5 p-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-orange font-extrabold text-white">{n + 1}</span>
                <p className="mt-4 font-display text-lg font-bold text-white">{s.title}</p>
                <p className="mt-1 text-sm text-white/65">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <h2 className="text-center font-display text-3xl font-extrabold text-navy">Questions from candidates</h2>
          <div className="mt-8 divide-y divide-slate-200 rounded-2xl border border-slate-200">
            {FAQS.map((x, n) => (
              <div key={x.q}>
                <button onClick={() => setFaq(faq === n ? null : n)} className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left">
                  <span className="font-display font-bold text-navy">{x.q}</span>
                  <span className={`flex h-7 w-7 flex-none items-center justify-center rounded-full bg-slate-100 text-navy transition ${faq === n ? "rotate-45" : ""}`}>+</span>
                </button>
                {faq === n && <p className="px-6 pb-5 leading-relaxed text-slate-600">{x.a}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {applyJob && (
        <Modal title={`Apply: ${applyJob.title}`} sub={[applyJob.location, applyJob.salary].filter(Boolean).join(" · ")} onClose={() => setApplyJob(null)}>
          <ApplyForm jobKey={applyJob.id} jobTitle={applyJob.title} compact />
        </Modal>
      )}
      {cvOpen && (
        <Modal title="Send us your CV" sub="We'll be in touch when work comes up that suits you." onClose={() => setCvOpen(false)}>
          <ApplyForm jobKey={null} jobTitle={null} compact />
        </Modal>
      )}

      <Footer />
    </main>
  );
}
