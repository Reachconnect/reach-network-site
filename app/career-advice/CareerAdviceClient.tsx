"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import Footer from "../components/Footer";
import { createClient } from "@/lib/supabase/client";

type Post = {
  id: string;
  title: string;
  slug: string;
  category: string;
  excerpt: string | null;
  content: string | null;
  cover_image_url: string | null;
  featured: boolean;
  published: boolean;
  created_at: string;
};

const CATEGORIES = [
  { name: "CV & Applications", description: "Make your CV stronger, write better applications and understand what employers are looking for." },
  { name: "Interviews", description: "From preparation to answering difficult questions, get practical advice to help you feel confident." },
  { name: "Career Development", description: "Advice on progressing your career, developing new skills and finding your next opportunity." },
  { name: "Finding Work", description: "Practical guidance on job searching, working with recruiters and finding the right role." },
  { name: "Industry Advice", description: "Insights and advice specifically for driving, logistics, warehousing, FLT, engineering and manufacturing." },
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
      { label: "Career advice", href: "/career-advice" },
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
      { label: "Why choose us", href: "/why-choose-us" },
      { label: "FAQ", href: "/faq" },
    ],
  },
];

export default function CareerAdviceClient({ posts }: { posts: Post[] }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterStatus, setNewsletterStatus] = useState<"idle" | "submitting" | "saved" | "error">("idle");

  const featured = posts.find((p) => p.featured) || posts[0];
  const latest = posts.filter((p) => p.id !== featured?.id).slice(0, 6);

  const filteredPosts = useMemo(() => {
    if (!activeCategory) return latest;
    return latest.filter((p) => p.category === activeCategory);
  }, [latest, activeCategory]);

  async function handleNewsletterSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newsletterEmail.includes("@")) return;
    setNewsletterStatus("submitting");
    try {
      const supabase = createClient();
      const { error } = await supabase.from("newsletter_subscribers").insert({ email: newsletterEmail });
      if (error) throw error;
      setNewsletterStatus("saved");
    } catch (err) {
      console.error(err);
      setNewsletterStatus("error");
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
      <section className="relative isolate min-h-[420px] overflow-hidden bg-navy">
        <div className="absolute inset-0">
          <Image src="/industries/contactus.png" alt="Career advice" fill sizes="100vw" className="object-cover object-center" priority />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/90 to-navy/40" />

        <div className="relative mx-auto max-w-7xl px-6 py-14 lg:px-8 lg:py-20">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange">Career advice</p>
          <h1 className="font-display mt-3 max-w-lg text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl">
            Make your next move your <span className="text-orange">best</span> one.
          </h1>
          <p className="mt-4 max-w-md text-sm text-white/70 sm:text-base">
            Practical advice, insights and guidance to help you find work, develop your career and make confident decisions about your next opportunity.
          </p>
          <a href="#latest" className="mt-6 flex w-fit items-center gap-1.5 rounded-full bg-orange px-6 py-3 text-sm font-bold text-white transition hover:bg-orange-dark">
            Explore advice <span aria-hidden="true">&rarr;</span>
          </a>
        </div>
      </section>

      {/* FEATURED */}
      {featured && (
        <section className="bg-slate-50 py-14 lg:py-16">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="grid overflow-hidden rounded-2xl bg-white shadow-sm lg:grid-cols-2">
              <div className="p-8 lg:p-10">
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange">Featured</p>
                <h2 className="font-display mt-3 text-2xl font-extrabold leading-tight text-navy">{featured.title}</h2>
                {featured.excerpt && <p className="mt-3 text-sm text-slate-600">{featured.excerpt}</p>}
                <Link href={`/career-advice/${featured.slug}`} className="mt-5 flex w-fit items-center gap-1.5 text-sm font-bold text-orange hover:text-orange-dark">
                  Read article <span aria-hidden="true">&rarr;</span>
                </Link>
              </div>
              <div className="relative min-h-[220px] lg:min-h-full">
                <Image
                  src={featured.cover_image_url || "/industries/contactus.png"}
                  alt={featured.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CATEGORIES */}
      <section className="bg-white py-14 lg:py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <h2 className="font-display text-xl font-extrabold text-navy">Career advice for every stage</h2>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {CATEGORIES.map((cat) => (
              <div key={cat.name} className="rounded-2xl border border-slate-200 p-5">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-orange/15 text-orange">
                  <svg viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4">
                    <circle cx="8" cy="8" r="3" />
                  </svg>
                </span>
                <p className="font-display mt-3 text-sm font-bold text-navy">{cat.name}</p>
                <p className="mt-1.5 text-xs text-slate-500">{cat.description}</p>
                <button
                  onClick={() => {
                    setActiveCategory(cat.name);
                    document.getElementById("latest")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="mt-3 flex items-center gap-1 text-xs font-bold text-orange hover:text-orange-dark"
                >
                  View articles <span aria-hidden="true">&rarr;</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LATEST ADVICE */}
      <section id="latest" className="bg-slate-50 py-14 lg:py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-xl font-extrabold text-navy">
              {activeCategory ? activeCategory : "Latest advice"}
            </h2>
            {activeCategory && (
              <button onClick={() => setActiveCategory(null)} className="text-xs font-bold text-orange hover:text-orange-dark">
                Show all
              </button>
            )}
          </div>

          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPosts.map((post) => (
              <Link key={post.id} href={`/career-advice/${post.slug}`} className="group overflow-hidden rounded-2xl bg-white shadow-sm">
                <div className="relative aspect-[16/10] w-full">
                  <Image
                    src={post.cover_image_url || "/industries/contactus.png"}
                    alt={post.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="p-5">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-orange">{post.category}</p>
                  <p className="font-display mt-1.5 text-sm font-bold text-navy">{post.title}</p>
                  {post.excerpt && <p className="mt-1.5 text-xs text-slate-500 line-clamp-2">{post.excerpt}</p>}
                  <span className="mt-3 flex items-center gap-1 text-xs font-bold text-orange">
                    Read more <span aria-hidden="true">&rarr;</span>
                  </span>
                </div>
              </Link>
            ))}
            {filteredPosts.length === 0 && (
              <div className="col-span-full rounded-2xl bg-white p-8 text-center shadow-sm">
                <p className="text-sm text-slate-500">No articles in this category yet — check back soon.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* NOT SURE WHERE TO START */}
      <section className="bg-navy py-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-orange/40 text-orange">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" className="h-5 w-5">
                <circle cx="8" cy="8" r="6.5" />
                <path d="M10.5 5.5 6.5 10.5 5.5 6.5z" />
              </svg>
            </span>
            <div>
              <p className="font-display text-sm font-bold text-white">Not sure where to start?</p>
              <p className="mt-0.5 text-xs text-white/60">Tell us where you are in your career and we&rsquo;ll point you in the right direction.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "I'm looking for work", category: "Finding Work" },
              { label: "I'm starting my career", category: "Career Development" },
              { label: "I want to progress", category: "Career Development" },
              { label: "I'm returning to work", category: "Finding Work" },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  setActiveCategory(item.category);
                  document.getElementById("latest")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="rounded-xl border border-white/20 px-4 py-3 text-left text-xs font-semibold text-white transition hover:border-orange/50"
              >
                {item.label} <span aria-hidden="true">&rarr;</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="bg-navy-deep py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-start gap-5 px-6 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/20 text-white">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" className="h-5 w-5">
                <rect x="1.5" y="3" width="13" height="10" rx="1.5" />
                <path d="M1.5 4l6.5 5 6.5-5" />
              </svg>
            </span>
            <div>
              <p className="font-display text-sm font-bold text-white">Get career advice in your inbox.</p>
              <p className="mt-0.5 text-xs text-white/60">Practical tips, new opportunities and useful career advice — without the noise.</p>
            </div>
          </div>

          {newsletterStatus === "saved" ? (
            <p className="rounded-lg bg-emerald-500/10 px-4 py-2.5 text-xs font-semibold text-emerald-400">
              You&rsquo;re subscribed — thanks for signing up!
            </p>
          ) : (
            <form onSubmit={handleNewsletterSubmit} className="flex w-full max-w-md gap-2">
              <input
                type="email"
                required
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-orange focus:outline-none"
              />
              <button
                type="submit"
                disabled={newsletterStatus === "submitting"}
                className="shrink-0 rounded-full bg-orange px-5 py-2.5 text-xs font-bold text-white transition hover:bg-orange-dark disabled:opacity-50"
              >
                {newsletterStatus === "submitting" ? "..." : "Sign me up"}
              </button>
            </form>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}