// Branded "page not found" page
import Link from "next/link";
import SiteHeader from "./components/SiteHeader";
import Footer from "./components/Footer";
import { listPublicJobs } from "@/lib/jobsPublic";

export const metadata = { title: "Page not found | Reach Network Recruitment", robots: { index: false } };

const LINKS = [
  { t: "I need staff", s: "Send a staff request in two minutes", h: "/i-need-staff", main: true },
  { t: "Find a job", s: "Driving, warehouse, production and engineering", h: "/looking-for-work", main: true },
  { t: "Book a call", s: "Pick a time and we'll call you", h: "/book-a-call" },
  { t: "Pay rates and costs", s: "Free pay checker and cost calculator", h: "/pay-rates" },
  { t: "Take-home pay calculator", s: "Hourly rate to weekly pay", h: "/take-home-pay" },
  { t: "Contact us", s: "0121 630 1643", h: "/contact-us" },
];

export default async function NotFound() {
  const jobs = (await listPublicJobs().catch(() => [])).slice(0, 3);
  return (
    <main className="overflow-x-hidden font-body">
      <SiteHeader />
      <section className="relative overflow-hidden bg-navy py-20 lg:py-28">
        <div className="pointer-events-none absolute -right-40 -top-40 h-[480px] w-[480px] rounded-full bg-orange/20 blur-3xl" />
        <div className="relative mx-auto max-w-4xl px-6 text-center lg:px-8">
          <p className="font-display text-[7rem] font-extrabold leading-none text-orange sm:text-[10rem]">404</p>
          <h1 className="mt-2 font-display text-3xl font-extrabold text-white sm:text-5xl">Wrong turn. Let&apos;s get you back on route.</h1>
          <p className="mx-auto mt-4 max-w-lg text-lg text-white/75">The page you&apos;re after has moved or no longer exists. Here&apos;s where most people are heading:</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/i-need-staff" className="rounded-full bg-orange px-7 py-3.5 font-bold text-white shadow-lg shadow-orange/30 hover:bg-orange-dark">
              I need staff
            </Link>
            <Link href="/looking-for-work" className="rounded-full border border-white/30 px-7 py-3.5 font-bold text-white hover:bg-white/10">
              I&apos;m looking for work
            </Link>
            <Link href="/" className="rounded-full px-5 py-3.5 font-bold text-white/70 hover:text-white">
              Homepage →
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-14">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 lg:grid-cols-[1.3fr_1fr] lg:px-8">
          <div>
            <h2 className="font-display text-2xl font-extrabold text-navy">Popular pages</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {LINKS.map((l) => (
                <Link key={l.h} href={l.h} className="group rounded-2xl bg-white p-5 ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-lg hover:ring-orange/40">
                  <span className="block font-display font-bold text-navy group-hover:text-orange">{l.t} →</span>
                  <span className="mt-0.5 block text-sm text-slate-500">{l.s}</span>
                </Link>
              ))}
            </div>
          </div>
          <div>
            <h2 className="font-display text-2xl font-extrabold text-navy">Latest jobs</h2>
            {jobs.length ? (
              <div className="mt-5 space-y-3">
                {jobs.map((j) => (
                  <Link key={j.key} href={j.href} className="block rounded-2xl bg-white p-5 ring-1 ring-black/5 transition hover:shadow-lg hover:ring-orange/40">
                    <span className="text-xs font-bold text-orange">{j.category}</span>
                    <span className="mt-1 block font-display font-bold text-navy">{j.title}</span>
                    <span className="block text-sm text-slate-500">{[j.area || j.location, j.salary].filter(Boolean).join(" · ")}</span>
                  </Link>
                ))}
                <Link href="/looking-for-work" className="inline-block font-bold text-orange hover:underline">
                  See all jobs →
                </Link>
              </div>
            ) : (
              <p className="mt-5 text-slate-600">
                New jobs are added all the time. <Link href="/looking-for-work" className="font-bold text-orange hover:underline">Send us your CV</Link> and we&apos;ll call you when something fits.
              </p>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
