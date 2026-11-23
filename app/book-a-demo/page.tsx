"use client";

// Book a demo of Reach Connect
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Footer from "../components/Footer";

const AGENDA = [
  { min: "2 min", title: "Your sites and shifts", body: "A quick chat about how you use temporary staff today and what's frustrating you." },
  { min: "5 min", title: "A live walkthrough", body: "Requesting staff, the live on-site board and GPS and face-checked clock-ins." },
  { min: "5 min", title: "Timesheets and costs", body: "Approving hours in a tap, costs by site, reports and exports." },
  { min: "3 min", title: "Your questions", body: "Anything you want to see again, and how we'd set your account up." },
];

const FEATURES = [
  { title: "Live on-site board", body: "See who's on site, who hasn't started and who's finished, for every site.", icon: "M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21zm0-9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" },
  { title: "Checked clock-ins", body: "A GPS check against your site and a face match on every clock-in.", icon: "M9 12l2 2 4-4m5.6-4A11.96 11.96 0 0 1 12 2.9 11.96 11.96 0 0 1 3.4 6 12 12 0 0 0 12 21a12 12 0 0 0 8.6-15z" },
  { title: "Request staff in seconds", body: "Role, site, date and shift, straight to your consultant.", icon: "M12 5v14M5 12h14" },
  { title: "Timesheets in a tap", body: "Approve one or all, with who approved and when recorded.", icon: "M4 6h16M4 12h16M4 18h10" },
  { title: "Costs by site", body: "Hours and spend as they happen, downloadable as CSV.", icon: "M4 20V10m6 10V4m6 16v-7m4 7H2" },
  { title: "Messages and team logins", body: "Talk to your consultant and add colleagues with their own logins.", icon: "M21 12a8 8 0 0 1-11.8 7L4 20l1-4.6A8 8 0 1 1 21 12z" },
];

const TEAM_SIZES = ["1-10", "11-50", "51-200", "200+"];
const INDUSTRIES = ["Logistics", "Warehousing", "Transport", "Manufacturing", "Engineering", "Other"];
const GOALS = ["See who's on site, live", "Stop chasing timesheets", "Control staffing costs", "Better reporting", "Just curious"];
const TIMES = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"];

const FAQS = [
  { q: "Who is Reach Connect for?", a: "Clients who use Reach for temporary staff. It comes with our temporary staffing service, and we set your account up for you." },
  { q: "How long is the demo?", a: "About 15 minutes, on a video call or over the phone, whichever suits you." },
  { q: "Do we need to install anything?", a: "No. Reach Connect works in any browser on your computer, tablet or phone, and your workers use it on their phones." },
  { q: "Can my colleagues join?", a: "Of course. Bring whoever manages shifts, timesheets or invoices." },
];

// The next 10 working days, for picking a demo date
function workingDays() {
  const out: { iso: string; day: string; date: string }[] = [];
  const d = new Date();
  d.setDate(d.getDate() + 1);
  while (out.length < 10) {
    if (d.getDay() !== 0 && d.getDay() !== 6) {
      out.push({
        iso: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
        day: d.toLocaleDateString("en-GB", { weekday: "short" }),
        date: d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
      });
    }
    d.setDate(d.getDate() + 1);
  }
  return out;
}

function Icon({ d, className = "h-6 w-6" }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d={d} />
    </svg>
  );
}

function DemoForm() {
  const days = useMemo(workingDays, []);
  const [step, setStep] = useState(1);
  const [f, setF] = useState({ fullName: "", jobTitle: "", companyName: "", phoneNumber: "", workEmail: "", teamSize: "", industry: "", goal: "", preferredDate: "", preferredTime: "", notes: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF((p) => ({ ...p, [k]: e.target.value }));
  const input = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-navy focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange/20";
  const chip = (on: boolean) => `rounded-full border px-3.5 py-2 text-sm font-semibold transition ${on ? "border-orange bg-orange/10 text-navy" : "border-slate-200 text-slate-600 hover:border-slate-300"}`;
  const step1Done = f.fullName && f.jobTitle && f.companyName && f.phoneNumber && f.workEmail;
  const step2Done = f.teamSize && f.industry && f.goal;

  async function submit() {
    setStatus("sending");
    setError(null);
    try {
      const res = await fetch("/api/book-demo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Something went wrong.");
      setStatus("done");
    } catch (e) {
      setError(`${(e as Error).message} Please call us on 0121 630 1643.`);
      setStatus("idle");
    }
  }

  if (status === "done") {
    const d = days.find((x) => x.iso === f.preferredDate);
    return (
      <div className="rounded-3xl bg-white p-8 text-center shadow-2xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl text-green-700">✓</div>
        <p className="mt-4 font-display text-2xl font-extrabold text-navy">Demo requested</p>
        <p className="mt-2 text-slate-600">
          Thanks, {f.fullName.split(" ")[0]}. We&apos;ll confirm {d ? `${d.day} ${d.date}` : "your demo"}
          {f.preferredTime ? ` at ${f.preferredTime}` : ""} by email shortly.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
      <div className="flex items-center justify-between">
        <p className="font-display text-xl font-extrabold text-navy">Book your demo</p>
        <p className="text-xs font-bold text-slate-400">Step {step} of 3</p>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-orange transition-all duration-500" style={{ width: `${(step / 3) * 100}%` }} />
      </div>

      {step === 1 && (
        <div className="mt-6 animate-[fadeIn_.3s_ease] space-y-3">
          <p className="font-semibold text-navy">About you</p>
          <div className="grid grid-cols-2 gap-3">
            <input className={input} placeholder="Full name" value={f.fullName} onChange={set("fullName")} autoComplete="name" />
            <input className={input} placeholder="Job title" value={f.jobTitle} onChange={set("jobTitle")} autoComplete="organization-title" />
          </div>
          <input className={input} placeholder="Company" value={f.companyName} onChange={set("companyName")} autoComplete="organization" />
          <div className="grid grid-cols-2 gap-3">
            <input className={input} type="email" placeholder="Work email" value={f.workEmail} onChange={set("workEmail")} autoComplete="email" />
            <input className={input} type="tel" placeholder="Phone" value={f.phoneNumber} onChange={set("phoneNumber")} autoComplete="tel" />
          </div>
          <button disabled={!step1Done} onClick={() => setStep(2)} className="w-full rounded-full bg-orange px-5 py-3 font-bold text-white transition hover:bg-orange-dark disabled:opacity-40">
            Next →
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="mt-6 animate-[fadeIn_.3s_ease] space-y-5">
          <div>
            <p className="font-semibold text-navy">How many temporary workers do you use?</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {TEAM_SIZES.map((x) => (
                <button key={x} onClick={() => setF((p) => ({ ...p, teamSize: x }))} className={chip(f.teamSize === x)}>
                  {x}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="font-semibold text-navy">Your industry</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {INDUSTRIES.map((x) => (
                <button key={x} onClick={() => setF((p) => ({ ...p, industry: x }))} className={chip(f.industry === x)}>
                  {x}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="font-semibold text-navy">What matters most?</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {GOALS.map((x) => (
                <button key={x} onClick={() => setF((p) => ({ ...p, goal: x }))} className={chip(f.goal === x)}>
                  {x}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="rounded-full border border-slate-300 px-5 py-3 text-sm font-bold text-navy">
              ← Back
            </button>
            <button disabled={!step2Done} onClick={() => setStep(3)} className="flex-1 rounded-full bg-orange px-5 py-3 font-bold text-white transition hover:bg-orange-dark disabled:opacity-40">
              Next →
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="mt-6 animate-[fadeIn_.3s_ease] space-y-5">
          <div>
            <p className="font-semibold text-navy">Pick a day</p>
            <div className="mt-2 grid grid-cols-5 gap-2">
              {days.map((d) => (
                <button key={d.iso} onClick={() => setF((p) => ({ ...p, preferredDate: d.iso }))} className={`rounded-xl border px-1 py-2 text-center transition ${f.preferredDate === d.iso ? "border-orange bg-orange/10" : "border-slate-200 hover:border-slate-300"}`}>
                  <span className="block text-[11px] font-semibold text-slate-400">{d.day}</span>
                  <span className="block text-sm font-bold text-navy">{d.date}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="font-semibold text-navy">And a time</p>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {TIMES.map((t) => (
                <button key={t} onClick={() => setF((p) => ({ ...p, preferredTime: t }))} className={`rounded-xl border py-2 text-sm font-bold transition ${f.preferredTime === t ? "border-orange bg-orange/10 text-navy" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <textarea className={input} rows={2} placeholder="Anything you'd like us to cover? (optional)" value={f.notes} onChange={set("notes")} />
          {error && <p className="rounded-lg bg-red-50 p-2.5 text-sm text-red-700">{error}</p>}
          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="rounded-full border border-slate-300 px-5 py-3 text-sm font-bold text-navy">
              ← Back
            </button>
            <button disabled={!f.preferredDate || status === "sending"} onClick={submit} className="flex-1 rounded-full bg-orange px-5 py-3 font-bold text-white transition hover:bg-orange-dark disabled:opacity-40">
              {status === "sending" ? "Booking…" : "Book my demo"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


const APP_SCREENS = [
  {
    tab: "Dashboard",
    render: "dashboard" as const,
  },
  {
    tab: "Rate",
    render: "rate" as const,
  },
  {
    tab: "Timesheets",
    render: "timesheets" as const,
  },
  {
    tab: "Live",
    render: "live" as const,
  },
];

const LIVE_WORKERS = [
  { initials: "SA", name: "Sarah Adeyemi", site: "Coventry — Fulfilment centre" },
  { initials: "TN", name: "Tomas Nowak", site: "Birmingham — Distribution hub" },
  { initials: "KB", name: "Kwame Boateng", site: "Uttoxeter — Assembly plant" },
  { initials: "LE", name: "Lucy Evans", site: "Birmingham — Distribution hub" },
];

const ACTIVITY_FEED = [
  { time: "08:02", message: "Sarah Adeyemi clocked in — Coventry" },
  { time: "08:15", message: "Timesheet approved for Ryan Lewis" },
  { time: "08:41", message: "Kwame Boateng clocked in — Rocester" },
  { time: "09:10", message: "New shift request: Uttoxeter plant" },
];

function FloatingPhone() {
  const [screenIndex, setScreenIndex] = useState(0);
  const [starsFilled, setStarsFilled] = useState(0);
  const [rated, setRated] = useState(false);
  const [approved, setApproved] = useState(false);
  const [showThanks, setShowThanks] = useState(false);

  const activeScreen = APP_SCREENS[screenIndex];

  useEffect(() => {
    const cycle = setInterval(() => {
      setScreenIndex((i) => (i + 1) % APP_SCREENS.length);
    }, 4200);
    return () => clearInterval(cycle);
  }, []);

  useEffect(() => {
    setStarsFilled(0);
    setRated(false);
    setApproved(false);
    setShowThanks(false);

    if (activeScreen.render === "rate") {
      for (let i = 1; i <= 5; i++) {
        setTimeout(() => setStarsFilled(i), 250 + i * 220);
      }
      setTimeout(() => setRated(true), 250 + 5 * 220 + 150);
    }
    if (activeScreen.render === "timesheets") {
      setTimeout(() => setApproved(true), 900);
      setTimeout(() => setShowThanks(true), 1200);
    }
  }, [screenIndex, activeScreen.render]);

  return (
    <div className="relative flex items-center justify-center py-10">
      <div className="absolute h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(247,147,30,0.35)_0%,rgba(247,147,30,0.12)_45%,transparent_70%)]" />
      <div className="relative animate-[floatBob_3.6s_ease-in-out_infinite] [transform:rotate(-8deg)]">
        <div className="w-[260px] rounded-[2.75rem] border-[7px] border-navy bg-navy shadow-2xl">
          <div className="relative h-5">
            <div className="absolute left-1/2 top-1.5 h-3.5 w-16 -translate-x-1/2 rounded-full bg-navy" />
          </div>
          <div className="flex h-[480px] flex-col overflow-hidden rounded-[2.25rem] bg-slate-50">
            <div className="bg-navy px-3.5 pb-2.5 pt-2">
              <p className="text-[9px] font-bold uppercase tracking-wide text-orange">Client portal</p>
              <p className="mt-0.5 text-xs font-bold text-white">{activeScreen.tab}</p>
            </div>

            <div className="flex-1 overflow-hidden p-3">
              {activeScreen.render === "dashboard" && (
                <div className="flex h-full flex-col">
                  <div className="grid grid-cols-2 gap-1.5">
                    <div className="rounded-lg bg-white p-2">
                      <p className="text-[9px] text-slate-500">Fill rate</p>
                      <p className="text-sm font-bold text-navy">94%</p>
                    </div>
                    <div className="rounded-lg bg-white p-2">
                      <p className="text-[9px] text-slate-500">Today&rsquo;s spend</p>
                      <p className="text-sm font-bold text-navy">£2,140</p>
                    </div>
                    <div className="col-span-2 rounded-lg bg-white p-2">
                      <p className="text-[9px] text-slate-500">Attendance rate</p>
                      <p className="text-sm font-bold text-navy">97%</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                    <p className="text-[10px] font-bold text-red-700">Live activity feed</p>
                  </div>
                  <div className="mt-1.5 space-y-1 overflow-hidden">
                    {ACTIVITY_FEED.map((item) => (
                      <div key={item.time} className="flex gap-1.5 rounded-md bg-white px-2 py-1.5">
                        <span className="shrink-0 text-[9px] text-slate-400">{item.time}</span>
                        <span className="text-[10px] text-navy">{item.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeScreen.render === "rate" && (
                <div>
                  <div className="flex items-center gap-2 rounded-lg bg-white p-2.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange/20 text-[11px] font-bold text-orange-800">JM</div>
                    <div>
                      <p className="text-xs font-bold text-navy">James Mensah</p>
                      <p className="text-[10px] text-slate-500">Warehouse operative</p>
                    </div>
                  </div>
                  <p className="mt-3 text-[10px] text-slate-500">How was James this shift?</p>
                  <div className="mt-1.5 flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <svg key={n} viewBox="0 0 20 20" fill={n <= starsFilled ? "#F79E1E" : "#D3D1C7"} className="h-5 w-5 transition-colors duration-200">
                        <path d="M10 1.5l2.6 5.6 6.1.6-4.6 4.1 1.3 6-5.4-3.1-5.4 3.1 1.3-6-4.6-4.1 6.1-.6z" />
                      </svg>
                    ))}
                  </div>
                  <p className={`mt-3 text-[11px] font-bold text-green-700 transition-opacity duration-300 ${rated ? "opacity-100" : "opacity-0"}`}>
                    ✓ Rating submitted
                  </p>
                </div>
              )}

              {activeScreen.render === "timesheets" && (
                <div className="space-y-2">
                  <div className="rounded-lg bg-navy p-2.5 text-white">
                    <p className="text-[9px] uppercase tracking-wide text-white/60">This week</p>
                    <div className="mt-1 flex items-end justify-between">
                      <p className="text-sm font-bold">5 to approve</p>
                      <p className="text-[10px] text-orange">196.5 hrs</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-white p-2.5">
                    <div>
                      <p className="text-xs font-bold text-navy">Amara Okafor</p>
                      <p className="text-[10px] text-slate-500">38.5 hrs · Coventry</p>
                    </div>
                    <span
                      className={`rounded-md px-2 py-1 text-[10px] font-bold transition-colors duration-300 ${
                        approved ? "bg-green-100 text-green-800" : "border border-slate-200 text-navy"
                      }`}
                    >
                      {approved ? "Approved" : "Approve"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-white p-2.5 opacity-60">
                    <div>
                      <p className="text-xs font-bold text-navy">Ryan Lewis</p>
                      <p className="text-[10px] text-slate-500">40 hrs · Birmingham</p>
                    </div>
                    <span className="text-[10px] font-bold text-green-700">Approved</span>
                  </div>
                  {[
                    ["Priya Shah", "37.5 hrs · Uttoxeter"],
                    ["Tom Walsh", "42 hrs · Coventry"],
                    ["Daniel Mensah", "38.5 hrs · Birmingham"],
                  ].map(([n, d]) => (
                    <div key={n} className="flex items-center justify-between rounded-lg bg-white p-2.5">
                      <div>
                        <p className="text-xs font-bold text-navy">{n}</p>
                        <p className="text-[10px] text-slate-500">{d}</p>
                      </div>
                      <span className="rounded-md border border-slate-200 px-2 py-1 text-[10px] font-bold text-navy">Approve</span>
                    </div>
                  ))}
                  <div
                    className={`rounded-lg bg-green-50 px-3 py-2 text-[11px] font-bold text-green-800 transition-all duration-300 ${
                      showThanks ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
                    }`}
                  >
                    Thanks, timesheet approved
                  </div>
                </div>
              )}

              {activeScreen.render === "live" && (
                <div>
                  <div className="mb-2 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
                    <p className="text-[10px] font-bold text-red-700">Live now · {LIVE_WORKERS.length} on site</p>
                  </div>
                  <div className="space-y-1.5">
                    {LIVE_WORKERS.map((w) => (
                      <div key={w.initials} className="flex items-center gap-2 rounded-lg bg-white p-2">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-800">
                          {w.initials}
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-navy">{w.name}</p>
                          <p className="text-[9px] text-slate-500">{w.site}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-around border-t border-slate-200 bg-white px-2 py-2">
              {APP_SCREENS.map((s, i) => (
                <span key={s.tab} className={`text-[8px] font-bold ${i === screenIndex ? "text-orange" : "text-slate-400"}`}>
                  {s.tab}
                </span>
              ))}
            </div>
          </div>
        </div>
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
      { label: "Why choose us", href: "/why-choose-us" },
      { label: "FAQ", href: "/faq" },
    ],
  },
];

export default function BookADemoPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [faq, setFaq] = useState<number | null>(0);
  const [video, setVideo] = useState(false);
  useEffect(() => {
    if (window.location.hash === "#features") document.getElementById("features")?.scrollIntoView();
  }, []);

  return (
    <main className="overflow-x-hidden font-body">
      <style>{`
        @keyframes floatBob {
          0%, 100% { transform: translateY(0) rotate(-8deg); }
          50% { transform: translateY(-12px) rotate(-8deg); }
        }
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
      `}</style>
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
      <section className="relative overflow-hidden bg-navy pb-6 pt-10 lg:pb-10">
        <div className="pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full bg-orange/20 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-6 lg:grid-cols-2 lg:gap-8 lg:px-8">
          <div className="pb-8 lg:pb-16">
            <nav className="text-sm text-white/60">
              <Link href="/" className="hover:text-white">Home</Link> <span className="mx-1">›</span> <Link href="/reach-connect" className="hover:text-white">Reach Connect</Link> <span className="mx-1">›</span> <span className="text-white/90">Book a demo</span>
            </nav>
            <p className="mt-6 text-xs font-bold uppercase tracking-[0.3em] text-orange">Book a demo</p>
            <h1 className="mt-3 font-display text-4xl font-extrabold leading-tight text-white sm:text-5xl">
              See Reach Connect <span className="text-orange">in 15 minutes.</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-white/80">
              A quick, personal walkthrough of the portal our temporary staffing clients use to see who&apos;s on site, approve timesheets and track costs, live.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#book" className="flex items-center gap-2 rounded-full bg-orange px-7 py-3.5 font-bold text-white shadow-lg shadow-orange/30 transition hover:bg-orange-dark">
                Pick a time <span aria-hidden="true">→</span>
              </a>
              <button onClick={() => setVideo(true)} className="flex items-center gap-2 rounded-full border border-white/30 px-6 py-3.5 font-bold text-white transition hover:bg-white/10">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[10px] text-navy">▶</span> Watch the 45-second tour
              </button>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/75">
              {["15 minutes", "Video call or phone", "No obligation"].map((x) => (
                <span key={x} className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange text-[10px] font-bold text-white">✓</span>
                  {x}
                </span>
              ))}
            </div>
          </div>
          <div className="flex justify-center">
            <FloatingPhone />
          </div>
        </div>
      </section>

      {/* WHAT YOU'LL SEE + FORM */}
      <section id="book" className="scroll-mt-20 bg-slate-50 pb-20 pt-16 lg:pt-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-[1fr_480px] lg:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange">Your demo</p>
            <h2 className="mt-3 font-display text-3xl font-extrabold text-navy">What we&apos;ll cover in 15 minutes</h2>
            <ol className="relative mt-8 space-y-4 border-l-2 border-orange/30 pl-8">
              {AGENDA.map((a, n) => (
                <li key={a.title} className="relative rounded-2xl bg-white p-5 shadow-sm">
                  <span className="absolute -left-[45px] top-5 flex h-8 w-8 items-center justify-center rounded-full bg-orange text-sm font-extrabold text-white">{n + 1}</span>
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-display text-lg font-bold text-navy">{a.title}</p>
                    <span className="flex-none rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-500">{a.min}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{a.body}</p>
                </li>
              ))}
            </ol>
          </div>
          <div className="lg:sticky lg:top-24 lg:self-start">
            <DemoForm />
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="scroll-mt-20 bg-navy py-20">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange">What&apos;s inside</p>
          <h2 className="mt-3 font-display text-3xl font-extrabold text-white">Everything in one portal</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="group rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:-translate-y-1 hover:border-orange/50 hover:bg-white/10">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange/15 text-orange transition group-hover:bg-orange group-hover:text-white">
                  <Icon d={f.icon} />
                </span>
                <p className="mt-4 font-display text-lg font-bold text-white">{f.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-white/65">{f.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 grid items-center gap-8 rounded-3xl bg-white/5 p-6 lg:grid-cols-2 lg:p-8">
            <button onClick={() => setVideo(true)} className="group relative aspect-video overflow-hidden rounded-2xl shadow-2xl" aria-label="Play the Reach Connect tour">
              <Image src="/reach-connect/poster.jpg" alt="Reach Connect dashboard" fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover transition duration-500 group-hover:scale-105" />
              <span className="absolute inset-0 flex items-center justify-center bg-navy/20">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-orange text-xl text-white shadow-xl shadow-orange/40 transition group-hover:scale-110">▶</span>
              </span>
            </button>
            <div>
              <p className="font-display text-2xl font-extrabold text-white">Can&apos;t wait for the demo?</p>
              <p className="mt-2 text-white/70">Watch a 45-second tour: a worker clocking in, the live board, a staff request, timesheets and costs.</p>
              <Link href="/reach-connect" className="mt-5 inline-block font-bold text-orange hover:underline">
                Explore Reach Connect →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <h2 className="text-center font-display text-3xl font-extrabold text-navy">Good to know</h2>
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

      {video && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4" onClick={() => setVideo(false)}>
          <div className="w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-2 flex justify-end">
              <button onClick={() => setVideo(false)} className="rounded-full bg-white/10 px-3 py-1 text-sm font-bold text-white">
                Close ✕
              </button>
            </div>
            <video src="/reach-connect/overview.mp4" poster="/reach-connect/poster.jpg" controls autoPlay muted playsInline className="w-full rounded-2xl bg-black" />
          </div>
        </div>
      )}

      <Footer />
    </main>
  );
}
