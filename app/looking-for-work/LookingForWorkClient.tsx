"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
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
};

const CATEGORIES = ["All categories", "Driving", "Warehousing", "Manufacturing", "Engineering"] as const;
const EMPLOYMENT_TYPES = ["Permanent", "Temporary"] as const;

const NAV_SECTIONS = [
  {
    label: "For Employers",
    links: [
      { label: "I need staff", href: "/i-need-staff" },
      { label: "Book a call", href: "/book-a-call" },
      { label: "Our services", href: "/i-need-staff" },
      { label: "How it works", href: "/i-need-staff" },
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

export default function LookingForWorkClient({ jobs }: { jobs: Job[] }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<(typeof CATEGORIES)[number]>("All categories");
  const [locationFilters, setLocationFilters] = useState<string[]>([]);
  const [typeFilters, setTypeFilters] = useState<string[]>([]);
  const [alertEmail, setAlertEmail] = useState("");
  const [alertStatus, setAlertStatus] = useState<"idle" | "saved">("idle");

  const [applyJob, setApplyJob] = useState<Job | null>(null);
  const [applyForm, setApplyForm] = useState({ name: "", email: "", phone: "" });
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [applyStatus, setApplyStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");

  const locations = useMemo(
    () => Array.from(new Set(jobs.map((j) => j.location).filter(Boolean))) as string[],
    [jobs]
  );

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const matchesSearch =
        search.trim() === "" || job.title.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = categoryFilter === "All categories" || job.category === categoryFilter;
      const matchesLocation = locationFilters.length === 0 || (job.location && locationFilters.includes(job.location));
      const matchesType = typeFilters.length === 0 || (job.employment_type && typeFilters.includes(job.employment_type));
      return matchesSearch && matchesCategory && matchesLocation && matchesType;
    });
  }, [jobs, search, categoryFilter, locationFilters, typeFilters]);

  function toggleLocation(loc: string) {
    setLocationFilters((prev) => (prev.includes(loc) ? prev.filter((l) => l !== loc) : [...prev, loc]));
  }

  function toggleType(type: string) {
    setTypeFilters((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]));
  }

  function clearAll() {
    setSearch("");
    setCategoryFilter("All categories");
    setLocationFilters([]);
    setTypeFilters([]);
  }

  function openApply(job: Job) {
    setApplyJob(job);
    setApplyForm({ name: "", email: "", phone: "" });
    setCvFile(null);
    setApplyStatus("idle");
  }

  async function handleApplySubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!applyJob) return;
    setApplyStatus("submitting");

    try {
      const supabase = createClient();
      let cvUrl: string | null = null;

      if (cvFile) {
        const fileName = `${Date.now()}-${cvFile.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("cvs")
          .upload(fileName, cvFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from("cvs").getPublicUrl(uploadData.path);
        cvUrl = urlData.publicUrl;
      }

      const { error: insertError } = await supabase.from("job_applications").insert({
        job_id: applyJob.id,
        name: applyForm.name,
        email: applyForm.email,
        phone: applyForm.phone || null,
        cv_url: cvUrl,
      });

      if (insertError) throw insertError;

      setApplyStatus("done");
    } catch (err) {
      console.error(err);
      setApplyStatus("error");
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
      <section className="relative isolate min-h-[480px] overflow-hidden bg-navy">
        <div className="absolute inset-0">
          <Image src="/industries/lookingforwork.png" alt="Candidate ready to work" fill sizes="100vw" className="object-cover object-top" priority />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/85 to-navy/20" />

        <div className="relative mx-auto max-w-7xl px-6 pb-20 pt-8 lg:px-8 lg:pb-24">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-white/50">
            <Link href="/" className="hover:text-white">Home</Link>
            <span>&#8250;</span>
            <span>Jobs</span>
          </p>

          <div className="mt-8 max-w-lg">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange">Live jobs</p>
            <h1 className="font-display mt-3 text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl">
              Find the right job.
              <br />
              <span className="text-orange">Start your next chapter.</span>
            </h1>
            <p className="mt-4 text-sm text-white/70 sm:text-base">
              Explore live opportunities with great companies and take the next step in your career.
            </p>
          </div>
        </div>
      </section>

      {/* JOB LISTINGS + SIDEBAR */}
      <section className="bg-slate-50 pb-20 pt-16 lg:pb-28">
        <div className="relative z-10 mx-auto -mt-24 mb-12 max-w-6xl px-6 lg:-mt-28 lg:px-8">
          <div className="grid gap-3 rounded-2xl bg-white p-3 shadow-xl shadow-navy/10 sm:grid-cols-[1fr_auto] lg:grid-cols-[1fr_180px_180px_auto]">
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5">
              <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4 shrink-0 text-slate-400">
                <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.6" />
                <path d="M14 14l4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search jobs by title"
                className="w-full text-sm text-navy placeholder:text-slate-400 focus:outline-none"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as (typeof CATEGORIES)[number])}
              className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-navy focus:border-navy focus:outline-none"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <select
              value={locationFilters[0] ?? "All locations"}
              onChange={(e) => setLocationFilters(e.target.value === "All locations" ? [] : [e.target.value])}
              className="hidden rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-navy focus:border-navy focus:outline-none lg:block"
            >
              <option>All locations</option>
              {locations.map((loc) => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>

            <button type="button" className="rounded-lg bg-navy px-6 py-2.5 text-sm font-bold text-white transition hover:bg-navy-deep">
              Search jobs
            </button>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
            <div>
              {jobs.length > 0 && (
                <p className="text-sm text-slate-500">
                  Showing {filteredJobs.length === 0 ? 0 : 1}-{filteredJobs.length} of {filteredJobs.length} jobs
                </p>
              )}

              <div className="mt-5 space-y-4">
                {filteredJobs.length === 0 && jobs.length === 0 && (
                  <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
                    <p className="font-display text-sm font-bold text-navy">No live roles listed just yet</p>
                    <p className="mt-2 text-sm text-slate-500">
                      Check back soon, or create a job alert below and we&rsquo;ll email you the moment a role matching your interests goes live.
                    </p>
                  </div>
                )}

                {filteredJobs.length === 0 && jobs.length > 0 && (
                  <div className="rounded-2xl bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
                    No roles match your filters right now — try clearing a filter or searching a different keyword.
                  </div>
                )}

                {filteredJobs.map((job) => (
                  <div key={job.id} className="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex gap-4">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-navy text-xs font-extrabold text-white">
                        {job.category.slice(0, 2).toUpperCase()}
                      </span>
                      <div>
                        <p className="font-display text-sm font-bold text-navy">{job.title}</p>
                        <p className="mt-0.5 text-xs text-slate-500">{job.category}</p>
                        <p className="mt-0.5 text-xs text-slate-400">
                          {job.location} {job.employment_type && `· ${job.employment_type}`} {job.salary && `· ${job.salary}`}
                        </p>
                        {job.description && <p className="mt-2 text-xs text-slate-500 max-w-md">{job.description}</p>}
                      </div>
                    </div>
                    <button
                      onClick={() => openApply(job)}
                      className="flex shrink-0 items-center justify-center gap-1.5 rounded-full bg-navy px-5 py-2.5 text-xs font-bold text-white transition hover:bg-navy-deep"
                    >
                      Apply now <span aria-hidden="true">&rarr;</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <p className="font-display text-sm font-bold text-navy">Get job alerts</p>
                <p className="mt-1 text-xs text-slate-500">Create an alert and we&rsquo;ll email you when new jobs match your interests.</p>
                {alertStatus === "saved" ? (
                  <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                    You&rsquo;re all set — we&rsquo;ll email you about new roles.
                  </p>
                ) : (
                  <div className="mt-3 space-y-2">
                    <input
                      type="email"
                      value={alertEmail}
                      onChange={(e) => setAlertEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-xs text-navy placeholder:text-slate-400 focus:border-navy focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => alertEmail.includes("@") && setAlertStatus("saved")}
                      className="flex w-full items-center justify-center gap-1.5 rounded-full bg-navy px-5 py-2.5 text-xs font-bold text-white transition hover:bg-navy-deep"
                    >
                      Create alert
                    </button>
                  </div>
                )}
              </div>

              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="font-display text-sm font-bold text-navy">Refine your search</p>
                  <button type="button" onClick={clearAll} className="text-xs font-bold text-orange hover:text-orange-dark">
                    Clear all
                  </button>
                </div>

                <div className="mt-4">
                  <p className="text-xs font-bold text-navy">Location</p>
                  <div className="mt-2 space-y-2">
                    <label className="flex items-center gap-2 text-xs text-slate-600">
                      <input type="checkbox" checked={locationFilters.length === 0} onChange={() => setLocationFilters([])} className="rounded border-slate-300" />
                      All locations
                    </label>
                    {locations.map((loc) => (
                      <label key={loc} className="flex items-center gap-2 text-xs text-slate-600">
                        <input type="checkbox" checked={locationFilters.includes(loc)} onChange={() => toggleLocation(loc)} className="rounded border-slate-300" />
                        {loc}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="mt-5">
                  <p className="text-xs font-bold text-navy">Job type</p>
                  <div className="mt-2 space-y-2">
                    <label className="flex items-center gap-2 text-xs text-slate-600">
                      <input type="checkbox" checked={typeFilters.length === 0} onChange={() => setTypeFilters([])} className="rounded border-slate-300" />
                      All job types
                    </label>
                    {EMPLOYMENT_TYPES.map((type) => (
                      <label key={type} className="flex items-center gap-2 text-xs text-slate-600">
                        <input type="checkbox" checked={typeFilters.includes(type)} onChange={() => toggleType(type)} className="rounded border-slate-300" />
                        {type}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-navy p-5">
                <p className="text-xs font-bold uppercase tracking-wide text-orange">Not finding the right role?</p>
                <p className="mt-2 text-xs text-white/70">
                  Upload your CV and let our team match you with suitable opportunities.
                </p>
                <Link
                  href="/book-a-call"
                  className="mt-4 flex items-center justify-center gap-1.5 rounded-full bg-orange px-5 py-2.5 text-xs font-bold text-white transition hover:bg-orange-dark"
                >
                  Upload your CV <span aria-hidden="true">&rarr;</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* APPLY MODAL */}
      {applyJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 max-h-[90vh] overflow-y-auto">
            {applyStatus === "done" ? (
              <div className="text-center py-6">
                <p className="font-display text-lg font-bold text-navy">Application received!</p>
                <p className="mt-2 text-sm text-slate-500">We&rsquo;ll be in touch soon about {applyJob.title}.</p>
                <button
                  onClick={() => setApplyJob(null)}
                  className="mt-5 rounded-full bg-navy px-6 py-2.5 text-sm font-bold text-white"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <p className="font-display text-lg font-bold text-navy">Apply for {applyJob.title}</p>
                <p className="mt-1 text-xs text-slate-500">{applyJob.category} · {applyJob.location}</p>

                <form onSubmit={handleApplySubmit} className="mt-4 space-y-3">
                  <input
                    placeholder="Full name"
                    required
                    value={applyForm.name}
                    onChange={(e) => setApplyForm({ ...applyForm, name: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-navy focus:border-navy focus:outline-none"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    required
                    value={applyForm.email}
                    onChange={(e) => setApplyForm({ ...applyForm, email: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-navy focus:border-navy focus:outline-none"
                  />
                  <input
                    type="tel"
                    placeholder="Phone (optional)"
                    value={applyForm.phone}
                    onChange={(e) => setApplyForm({ ...applyForm, phone: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-navy focus:border-navy focus:outline-none"
                  />
                  <div>
                    <label className="text-xs font-semibold text-slate-600">Upload CV (PDF or Word)</label>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => setCvFile(e.target.files?.[0] || null)}
                      className="mt-1 w-full text-xs text-slate-500"
                    />
                  </div>

                  {applyStatus === "error" && (
                    <p className="text-xs text-red-600">Something went wrong — please try again.</p>
                  )}

                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      disabled={applyStatus === "submitting"}
                      className="flex-1 rounded-full bg-orange px-5 py-2.5 text-sm font-bold text-white transition hover:bg-orange-dark disabled:opacity-50"
                    >
                      {applyStatus === "submitting" ? "Submitting..." : "Submit application"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setApplyJob(null)}
                      className="flex-1 rounded-full bg-slate-100 px-5 py-2.5 text-sm font-bold text-slate-700"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* BOTTOM CTA BAND */}
      <section className="bg-navy py-14">
        <div className="mx-auto flex max-w-7xl flex-col items-start gap-8 px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange">New jobs. Real opportunities.</p>
            <h2 className="font-display mt-3 text-2xl font-extrabold text-white sm:text-3xl">
              Thousands of roles. One perfect fit for you.
            </h2>
            <Link
              href="/book-a-call"
              className="mt-5 flex w-fit items-center gap-1.5 rounded-full bg-orange px-6 py-3 text-sm font-bold text-white transition hover:bg-orange-dark"
            >
              Let&rsquo;s find your next role <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-8">
            {[
              { title: "Updated daily", sub: "New jobs added every day." },
              { title: "Quick & easy", sub: "Apply in minutes on any device." },
              { title: "Trusted by", sub: "1000s of candidates across the UK." },
            ].map((item) => (
              <div key={item.title}>
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-orange/40 text-orange">
                  <svg viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4">
                    <circle cx="8" cy="8" r="3" />
                  </svg>
                </span>
                <p className="font-display mt-2.5 text-xs font-bold text-white">{item.title}</p>
                <p className="mt-0.5 text-[10px] text-white/60">{item.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
