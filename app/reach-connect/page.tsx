"use client";

// Reach Connect: the client portal, shown with working demos of each screen (example data)
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Footer from "../components/Footer";

const NAVY = "#0F2438";

// ---------- Example data for the demos ----------
const WORKERS = [
  { name: "J. Mensah", role: "Picker", site: "Birmingham DC", status: "on", time: "05:52" },
  { name: "A. Kowalski", role: "FLT driver", site: "Birmingham DC", status: "on", time: "05:57" },
  { name: "S. Ahmed", role: "Picker", site: "Birmingham DC", status: "due", time: "Due 06:00, not in yet" },
  { name: "R. Clarke", role: "Class 2 driver", site: "Walsall depot", status: "on", time: "06:01" },
  { name: "M. Novak", role: "Packer", site: "Birmingham DC", status: "due", time: "Due 08:00" },
  { name: "L. Byrne", role: "Goods in", site: "Walsall depot", status: "done", time: "22:00 to 06:00" },
];

const FEED = [
  "A. Kowalski clocked in at Birmingham DC · GPS ✓ Face ✓",
  "Timesheet approved for J. Mensah by Sarah Jones",
  "2 workers confirmed tomorrow's 06:00 shift on WhatsApp",
  "New staff request: 3 x Picker, Monday nights",
  "R. Clarke clocked in at Walsall depot · GPS ✓ Face ✓",
  "Message from your consultant: cover sorted for Friday",
];

const STATUS: Record<string, { label: string; cls: string }> = {
  on: { label: "On site", cls: "bg-green-100 text-green-700" },
  late: { label: "Late", cls: "bg-red-100 text-red-700" },
  due: { label: "Not started", cls: "bg-slate-100 text-slate-600" },
  done: { label: "Finished", cls: "bg-blue-100 text-blue-700" },
};

// ---------- Little pieces ----------
function Window({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl ${className}`}>
      <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-green-300" />
        <span className="ml-3 truncate text-xs font-semibold text-slate-500">{title}</span>
        <span className="ml-auto rounded-full bg-orange/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-orange">Example</span>
      </div>
      {children}
    </div>
  );
}

function Tick() {
  return <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-green-100 text-[11px] font-bold text-green-700">✓</span>;
}

// The live dashboard in the hero: counts tick over and the activity feed moves
function LiveDashboard() {
  const [feed, setFeed] = useState(FEED.slice(0, 3));
  const [onSite, setOnSite] = useState(37);
  const i = useRef(3);
  useEffect(() => {
    const t = setInterval(() => {
      const next = FEED[i.current % FEED.length];
      i.current++;
      setFeed((f) => [next, ...f].slice(0, 4));
      if (next.includes("clocked in")) setOnSite((n) => (n >= 41 ? 37 : n + 1));
    }, 2800);
    return () => clearInterval(t);
  }, []);
  return (
    <Window title="reachnetworkconnect.com/client/dashboard">
      <div className="grid grid-cols-[120px_1fr] sm:grid-cols-[150px_1fr]">
        <div className="bg-navy p-3 text-xs text-white/70">
          <p className="mb-4 font-display text-sm font-extrabold leading-tight text-white">
            REACH <span className="block text-orange">CONNECT</span>
          </p>
          {["Dashboard", "On site", "Request staff", "Timesheets", "Billing", "Reports", "Messages"].map((x, n) => (
            <p key={x} className={`mb-1 rounded-md px-2 py-1.5 ${n === 0 ? "bg-white/10 font-semibold text-white" : ""}`}>
              {x}
            </p>
          ))}
        </div>
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-navy">Good morning, Sarah</p>
              <p className="text-[11px] text-slate-400">Here&apos;s your workforce right now</p>
            </div>
            <span className="flex items-center gap-1.5 rounded-full bg-green-50 px-2 py-1 text-[10px] font-bold text-green-700">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" /> LIVE
            </span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              ["On site now", String(onSite)],
              ["Fill rate", "96%"],
              ["Late today", "1"],
              ["Week's spend", "£9.2k"],
            ].map(([k, v]) => (
              <div key={k} className="rounded-lg bg-slate-50 p-2">
                <p className="text-[10px] text-slate-400">{k}</p>
                <p className="text-lg font-extrabold text-navy">{v}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[11px] font-bold text-navy">Live activity</p>
          <ul className="mt-1.5 space-y-1.5">
            {feed.map((f, n) => (
              <li key={`${f}-${n}-${i.current}`} className={`rounded-md border border-slate-100 px-2 py-1.5 text-[11px] text-slate-600 ${n === 0 ? "animate-[slideIn_.4s_ease]" : ""}`}>
                {f}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Window>
  );
}

// ---------- The feature demos ----------
function OnSiteDemo() {
  const [site, setSite] = useState("All sites");
  const rows = WORKERS.filter((w) => site === "All sites" || w.site === site);
  return (
    <Window title="On site">
      <div className="p-4">
        <div className="flex flex-wrap gap-2">
          {["All sites", "Birmingham DC", "Walsall depot"].map((s) => (
            <button key={s} onClick={() => setSite(s)} className={`rounded-full px-3 py-1 text-xs font-semibold ${site === s ? "bg-navy text-white" : "bg-slate-100 text-slate-600"}`}>
              {s}
            </button>
          ))}
        </div>
        <ul className="mt-3 divide-y divide-slate-100">
          {rows.map((w) => (
            <li key={w.name} className="flex items-center justify-between gap-2 py-2.5">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-navy text-[10px] font-bold text-white">{w.name.split(" ")[1].slice(0, 2).toUpperCase()}</span>
                <div>
                  <p className="text-sm font-semibold text-navy">{w.name}</p>
                  <p className="text-[11px] text-slate-400">
                    {w.role} · {w.site}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS[w.status].cls}`}>{STATUS[w.status].label}</span>
                <p className="mt-0.5 text-[10px] text-slate-400">{w.status === "on" ? `In at ${w.time} · GPS ✓ Face ✓` : w.time}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Window>
  );
}

function RequestDemo() {
  const [sent, setSent] = useState(false);
  const [n, setN] = useState(3);
  return (
    <Window title="Request staff">
      <div className="space-y-3 p-4 text-sm">
        {sent ? (
          <div className="py-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-2xl text-green-700">✓</div>
            <p className="mt-3 font-bold text-navy">Request sent</p>
            <p className="text-xs text-slate-500">Your consultant has it now. You&apos;ll see names here as they&apos;re confirmed.</p>
            <button onClick={() => setSent(false)} className="mt-4 text-xs font-semibold text-orange">
              Try again
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-slate-200 px-3 py-2">
                <p className="text-[10px] text-slate-400">Role</p>
                <p className="font-semibold text-navy">Picker</p>
              </div>
              <div className="rounded-lg border border-slate-200 px-3 py-2">
                <p className="text-[10px] text-slate-400">Site</p>
                <p className="font-semibold text-navy">Birmingham DC</p>
              </div>
              <div className="rounded-lg border border-slate-200 px-3 py-2">
                <p className="text-[10px] text-slate-400">Date</p>
                <p className="font-semibold text-navy">Mon 1 Dec</p>
              </div>
              <div className="rounded-lg border border-slate-200 px-3 py-2">
                <p className="text-[10px] text-slate-400">Shift</p>
                <p className="font-semibold text-navy">22:00 to 06:00</p>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
              <span className="text-slate-500">How many?</span>
              <div className="flex items-center gap-3">
                <button onClick={() => setN(Math.max(1, n - 1))} className="h-7 w-7 rounded-full bg-slate-100 font-bold text-navy">
                  −
                </button>
                <span className="w-5 text-center font-extrabold text-navy">{n}</span>
                <button onClick={() => setN(n + 1)} className="h-7 w-7 rounded-full bg-slate-100 font-bold text-navy">
                  +
                </button>
              </div>
            </div>
            <button onClick={() => setSent(true)} className="w-full rounded-lg bg-orange py-2.5 font-bold text-white">
              Request {n} {n === 1 ? "worker" : "workers"}
            </button>
          </>
        )}
      </div>
    </Window>
  );
}

function TimesheetDemo() {
  const [approved, setApproved] = useState<Record<string, boolean>>({});
  const rows = [
    { name: "J. Mensah", hours: 8, rate: 15.2 },
    { name: "A. Kowalski", hours: 8.5, rate: 16.4 },
    { name: "R. Clarke", hours: 9, rate: 18.9 },
  ];
  const all = rows.every((r) => approved[r.name]);
  return (
    <Window title="Timesheets · week ending 30 Nov">
      <div className="p-4">
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.name} className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 p-3">
              <div>
                <p className="text-sm font-semibold text-navy">{r.name}</p>
                <p className="text-[11px] text-slate-400">
                  {r.hours} hours · £{(r.hours * r.rate).toFixed(2)}
                </p>
                {approved[r.name] && <p className="text-[10px] font-semibold text-green-700">Approved by Sarah Jones just now</p>}
              </div>
              <button
                onClick={() => setApproved((a) => ({ ...a, [r.name]: !a[r.name] }))}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold ${approved[r.name] ? "bg-green-100 text-green-700" : "bg-navy text-white"}`}
              >
                {approved[r.name] ? "✓ Approved" : "Approve"}
              </button>
            </li>
          ))}
        </ul>
        <button
          onClick={() => setApproved(Object.fromEntries(rows.map((r) => [r.name, !all])))}
          className="mt-3 w-full rounded-lg border border-slate-200 py-2 text-xs font-bold text-navy"
        >
          {all ? "Undo" : "Approve all 3"}
        </button>
      </div>
    </Window>
  );
}

function SpendDemo() {
  const sites = [
    { name: "Birmingham DC", cost: 6240, hours: 412 },
    { name: "Walsall depot", cost: 2950, hours: 168 },
  ];
  const max = Math.max(...sites.map((s) => s.cost));
  return (
    <Window title="Billing · this month">
      <div className="p-4">
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-[10px] text-slate-400">Total cost</p>
            <p className="text-2xl font-extrabold text-navy">£9,190</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-[10px] text-slate-400">Total hours</p>
            <p className="text-2xl font-extrabold text-navy">580</p>
          </div>
        </div>
        <p className="mt-4 text-[11px] font-bold text-navy">By site</p>
        {sites.map((s) => (
          <div key={s.name} className="mt-2">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-navy">{s.name}</span>
              <span className="text-slate-500">
                £{s.cost.toLocaleString()} · {s.hours} hrs
              </span>
            </div>
            <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-orange transition-all duration-700" style={{ width: `${(s.cost / max) * 100}%` }} />
            </div>
          </div>
        ))}
        <button className="mt-4 w-full rounded-lg border border-slate-200 py-2 text-xs font-bold text-navy">⬇ Download CSV</button>
      </div>
    </Window>
  );
}

function ReportsDemo() {
  const weeks = [88, 92, 95, 94, 97, 96];
  return (
    <Window title="Reports · last 6 weeks">
      <div className="p-4">
        <div className="grid grid-cols-3 gap-2">
          {[
            ["Attendance", "96%"],
            ["Late arrivals", "4"],
            ["Hours", "2,310"],
          ].map(([k, v]) => (
            <div key={k} className="rounded-lg bg-slate-50 p-2.5">
              <p className="text-[10px] text-slate-400">{k}</p>
              <p className="text-lg font-extrabold text-navy">{v}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[11px] font-bold text-navy">Attendance by week</p>
        <div className="mt-2 flex h-28 items-end gap-2">
          {weeks.map((w, n) => (
            <div key={n} className="flex flex-1 flex-col items-center gap-1">
              <div className="w-full rounded-t-md bg-navy/80" style={{ height: `${(w - 80) * 5}%` }} />
              <span className="text-[9px] text-slate-400">W{n + 1}</span>
            </div>
          ))}
        </div>
      </div>
    </Window>
  );
}

function MessagesDemo() {
  return (
    <Window title="Messages">
      <div className="space-y-2 p-4 text-xs">
        <p className="max-w-[80%] rounded-2xl rounded-bl-sm bg-slate-100 px-3 py-2 text-slate-700">Morning Sarah, Friday&apos;s extra 2 pickers are confirmed: J. Mensah and M. Novak.</p>
        <p className="ml-auto max-w-[80%] rounded-2xl rounded-br-sm bg-navy px-3 py-2 text-white">Brilliant, thanks. Could we keep them on for next week too?</p>
        <p className="max-w-[80%] rounded-2xl rounded-bl-sm bg-slate-100 px-3 py-2 text-slate-700">Done. They&apos;re booked Monday to Friday, 06:00 starts.</p>
        <div className="mt-3 flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-slate-400">Type a message…</div>
      </div>
    </Window>
  );
}

const FEATURES = [
  {
    key: "onsite",
    tab: "Live on site",
    title: "See who's on site, right now",
    body: "Workers clock in on their phone, checked by GPS against your site and a face match, so you know the right person is really there. Your board shows who's on site, who hasn't started and who's finished, for every site.",
    points: ["Live On site, Not started and Finished views", "GPS and face-checked clock-ins", "Filter by site"],
    Demo: OnSiteDemo,
  },
  {
    key: "request",
    tab: "Request staff",
    title: "Need more people? Ask in seconds",
    body: "Request staff for any site, role, date and shift straight from the portal. It lands with your consultant immediately, so nothing gets lost in a voicemail or an inbox.",
    points: ["Any site, role, date and shift", "Goes straight to your consultant", "See your requests and their progress"],
    Demo: RequestDemo,
  },
  {
    key: "timesheets",
    tab: "Timesheets",
    title: "Approve timesheets in a tap",
    body: "Hours come from the clock-ins, so there's no paper to chase. Approve one at a time or all at once. Every approval records who approved it and when, and you can rate each worker as you go.",
    points: ["One tap, or approve everything at once", "Name and time recorded on every approval", "Rate workers so quality stays high"],
    Demo: TimesheetDemo,
  },
  {
    key: "spend",
    tab: "Spend & billing",
    title: "Know your costs before the invoice",
    body: "See hours and costs as they happen, broken down by site, so the invoice is never a surprise. Download it all as a spreadsheet whenever you need it.",
    points: ["Hours and cost by site", "Live, not end of month", "Download as CSV"],
    Demo: SpendDemo,
  },
  {
    key: "reports",
    tab: "Reports",
    title: "Attendance and hours at a glance",
    body: "Attendance and hours trends for any date range, hours by site and late arrivals, ready for your next ops meeting.",
    points: ["Attendance and hours trends", "Late arrival counts", "Hours by site, exportable"],
    Demo: ReportsDemo,
  },
  {
    key: "messages",
    tab: "Messages & team",
    title: "Talk to us, and bring your team",
    body: "Message your consultant from inside the portal, with the whole conversation kept in one place. Add your colleagues with their own logins and manage all your sites together.",
    points: ["Message your consultant directly", "Logins for your colleagues", "All your sites in one account"],
    Demo: MessagesDemo,
  },
];

const JOURNEY = [
  { title: "You request", body: "Ask for staff in the portal: role, site, date and shift." },
  { title: "We confirm", body: "We book checked workers, and they confirm on WhatsApp the day before." },
  { title: "They clock in", body: "On their phone, with a GPS check and a face match." },
  { title: "You see it live", body: "Your board updates the moment they arrive. If someone hasn't, you'll see that too." },
  { title: "You approve", body: "Hours flow into timesheets. Approve in a tap and rate the shift." },
  { title: "The invoice matches", body: "Costs by site all month, so the invoice holds no surprises." },
];

const FAQS = [
  { q: "Who can use Reach Connect?", a: "It's for clients who use Reach for temporary staff. We set up your account and your logins, and you can add colleagues yourself." },
  { q: "Do my workers need an app?", a: "They use Reach Connect in their phone's browser to see their shifts and clock in. There's nothing for you to install either: it works in any browser on your computer, tablet or phone." },
  { q: "How do you know the right person has clocked in?", a: "Each clock-in is checked against your site's location by GPS, and the worker's face is matched to their profile." },
  { q: "Can I see more than one site?", a: "Yes. All your sites sit in one account, and you can filter the live board, timesheets, billing and reports by site." },
  { q: "Can I get the data out?", a: "Yes. Billing and reports download as CSV spreadsheets, ready for your finance team." },
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
      { label: "FAQ", href: "/faq" },
    ],
  },
];

export default function ReachConnectPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [feature, setFeature] = useState(0);
  const [journey, setJourney] = useState(0);
  const [auto, setAuto] = useState(true);
  const [faq, setFaq] = useState<number | null>(0);
  const [video, setVideo] = useState(false);

  // The shift journey plays through on its own until someone clicks it
  useEffect(() => {
    if (!auto) return;
    const t = setInterval(() => setJourney((j) => (j + 1) % JOURNEY.length), 3200);
    return () => clearInterval(t);
  }, [auto]);

  const F = FEATURES[feature];

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
        <div className="pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full bg-orange/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 left-1/3 h-[420px] w-[420px] rounded-full bg-blue-500/10 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-6 pb-24 pt-12 lg:grid-cols-[1fr_1.15fr] lg:px-8 lg:pb-32 lg:pt-20">
          <div>
            <nav className="text-sm text-white/60">
              <Link href="/" className="hover:text-white">Home</Link> <span className="mx-1">›</span> <span className="text-white/90">Reach Connect</span>
            </nav>
            <p className="mt-6 text-xs font-bold uppercase tracking-[0.3em] text-orange">Reach Connect client portal</p>
            <h1 className="mt-3 font-display text-4xl font-extrabold leading-tight text-white sm:text-5xl">
              Your temporary workforce, <span className="text-orange">live on one screen.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/80">
              See who&apos;s on site the moment they clock in. Request staff in seconds. Approve timesheets in a tap. Know your costs before the invoice arrives.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/book-a-demo" className="flex items-center gap-2 rounded-full bg-orange px-7 py-3.5 font-bold text-white shadow-lg shadow-orange/30 transition hover:bg-orange-dark">
                Book a demo <span aria-hidden="true">→</span>
              </Link>
              <button onClick={() => setVideo(true)} className="flex items-center gap-2 rounded-full border border-white/30 px-6 py-3.5 font-bold text-white transition hover:bg-white/10">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[10px] text-navy">▶</span> Watch the 45-second tour
              </button>
            </div>
            <div className="mt-8 grid max-w-lg grid-cols-2 gap-3 text-sm text-white/80">
              {["GPS and face-checked clock-ins", "Timesheets approved in a tap", "Costs by site, as they happen", "Works on any phone or computer"].map((x) => (
                <span key={x} className="flex items-center gap-2">
                  <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-orange text-[10px] font-bold text-white">✓</span>
                  {x}
                </span>
              ))}
            </div>
            <a href="https://reachnetworkconnect.com/client/login" className="mt-8 inline-block text-sm font-semibold text-white/60 underline-offset-4 hover:text-white hover:underline">
              Already a client? Log in →
            </a>
          </div>
          <div className="lg:-mr-10">
            <LiveDashboard />
          </div>
        </div>
      </section>

      {/* PROBLEM / SOLUTION */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange">Why it matters</p>
            <h2 className="mt-3 font-display text-3xl font-extrabold text-navy">Temporary staff, without the chasing</h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-7">
              <p className="font-display text-lg font-bold text-slate-500">Without Reach Connect</p>
              <ul className="mt-4 space-y-3 text-slate-600">
                {["Ringing round to find out who's turned up", "Paper timesheets to chase, check and sign", "Disputes over hours at the end of the week", "Spend you only see when the invoice lands", "Requests lost in voicemails and emails"].map((x) => (
                  <li key={x} className="flex gap-3">
                    <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-600">✕</span>
                    {x}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-3xl bg-navy p-7 shadow-xl">
              <p className="font-display text-lg font-bold text-orange">With Reach Connect</p>
              <ul className="mt-4 space-y-3 text-white/85">
                {["A live board of who's on site, at every site", "Hours taken straight from checked clock-ins", "Approvals recorded with a name and a time", "Costs by site all month, so no surprises", "Requests and messages in one place"].map((x) => (
                  <li key={x} className="flex gap-3">
                    <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-orange text-xs font-bold text-white">✓</span>
                    {x}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURE TOUR */}
      <section id="how-it-works" className="scroll-mt-20 bg-slate-50 py-20">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange">Take a look around</p>
          <h2 className="mt-3 font-display text-3xl font-extrabold text-navy">Try it for yourself</h2>
          <p className="mt-2 text-slate-600">These are working demos with example data. Click around.</p>
          <div className="mt-8 flex gap-2 overflow-x-auto pb-2" role="tablist">
            {FEATURES.map((f, n) => (
              <button
                key={f.key}
                role="tab"
                aria-selected={feature === n}
                onClick={() => setFeature(n)}
                className={`flex-none rounded-full px-5 py-2.5 text-sm font-bold transition ${feature === n ? "bg-navy text-white shadow-md" : "bg-white text-slate-600 hover:bg-slate-100"}`}
              >
                {f.tab}
              </button>
            ))}
          </div>
          <div key={F.key} className="mt-8 grid animate-[fadeIn_.35s_ease] items-center gap-10 lg:grid-cols-2">
            <div>
              <h3 className="font-display text-3xl font-extrabold text-navy">{F.title}</h3>
              <p className="mt-4 text-lg leading-relaxed text-slate-700">{F.body}</p>
              <ul className="mt-6 space-y-3">
                {F.points.map((p) => (
                  <li key={p} className="flex items-center gap-3 font-semibold text-navy">
                    <Tick />
                    {p}
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex gap-3">
                <button onClick={() => setFeature((feature + FEATURES.length - 1) % FEATURES.length)} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-bold text-navy">
                  ←
                </button>
                <button onClick={() => setFeature((feature + 1) % FEATURES.length)} className="rounded-full bg-navy px-5 py-2 text-sm font-bold text-white">
                  Next: {FEATURES[(feature + 1) % FEATURES.length].tab} →
                </button>
              </div>
            </div>
            <div className="mx-auto w-full max-w-md">
              <F.Demo />
            </div>
          </div>
        </div>
      </section>

      {/* A SHIFT, START TO FINISH */}
      <section className="bg-navy py-20">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange">How it works</p>
          <h2 className="mt-3 font-display text-3xl font-extrabold text-white">One shift, start to finish</h2>
          <div className="mt-10 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {JOURNEY.map((j, n) => (
              <button
                key={j.title}
                onClick={() => {
                  setAuto(false);
                  setJourney(n);
                }}
                className={`relative rounded-2xl p-5 text-left transition ${journey === n ? "bg-orange shadow-xl shadow-orange/20" : "bg-white/5 hover:bg-white/10"}`}
              >
                <span className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-extrabold ${journey === n ? "bg-white text-orange" : n < journey ? "bg-green-500/20 text-green-300" : "bg-white/10 text-white/60"}`}>
                  {n < journey ? "✓" : n + 1}
                </span>
                <p className="mt-3 font-display font-bold text-white">{j.title}</p>
                <p className={`mt-1 text-sm ${journey === n ? "text-white/90" : "text-white/55"}`}>{j.body}</p>
              </button>
            ))}
          </div>
          <div className="mt-6 h-1 overflow-hidden rounded-full bg-white/10">
            <div className="h-full bg-orange transition-all duration-500" style={{ width: `${((journey + 1) / JOURNEY.length) * 100}%` }} />
          </div>
        </div>
      </section>

      {/* WORKERS + SECURITY */}
      <section className="bg-white py-20">
        <div className="mx-auto grid max-w-6xl gap-6 px-6 md:grid-cols-2 lg:px-8">
          <div className="rounded-3xl bg-slate-50 p-8">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange">For your workers</p>
            <h3 className="mt-3 font-display text-2xl font-extrabold text-navy">Simple on their phone</h3>
            <p className="mt-3 text-slate-600">Workers see their shifts, clock in and out, book holidays and message us, all from their phone. Fewer calls for you, and fewer missed shifts.</p>
            <div className="mx-auto mt-6 w-56 rounded-[2rem] border-8 border-navy bg-white p-4 shadow-xl">
              <p className="text-center text-[10px] font-bold text-slate-400">Today · Birmingham DC</p>
              <p className="mt-1 text-center font-display text-lg font-extrabold text-navy">06:00 to 14:00</p>
              <div className="mx-auto mt-4 flex h-28 w-28 items-center justify-center rounded-full bg-orange text-center text-sm font-extrabold text-white shadow-lg shadow-orange/40">
                Clock in
              </div>
              <p className="mt-3 text-center text-[10px] text-green-700">✓ You&apos;re at the site</p>
            </div>
          </div>
          <div className="rounded-3xl bg-navy p-8">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange">Your data</p>
            <h3 className="mt-3 font-display text-2xl font-extrabold text-white">Private and secure</h3>
            <ul className="mt-6 space-y-4">
              {[
                ["Your own private account", "You only ever see your own sites, workers and costs."],
                ["Personal logins", "Each colleague has their own login, and you choose who's added."],
                ["A clear record", "Every timesheet approval saves who approved it and when."],
                ["Checked clock-ins", "GPS and a face match on every clock-in, so hours are genuine."],
              ].map(([t, d]) => (
                <li key={t} className="flex gap-3">
                  <Tick />
                  <span>
                    <span className="block font-bold text-white">{t}</span>
                    <span className="text-sm text-white/65">{d}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <h2 className="text-center font-display text-3xl font-extrabold text-navy">Questions we get asked</h2>
          <div className="mt-8 divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
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

      {/* CTA */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-navy p-10 text-center sm:p-14">
            <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-orange/25 blur-3xl" />
            <h2 className="relative font-display text-3xl font-extrabold text-white sm:text-4xl">See your workforce live in a 15-minute demo</h2>
            <p className="relative mx-auto mt-3 max-w-xl text-white/75">We&apos;ll show you Reach Connect with your sites and shifts in mind, and answer any questions.</p>
            <div className="relative mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/book-a-demo" className="rounded-full bg-orange px-8 py-4 font-bold text-white shadow-lg shadow-orange/30 hover:bg-orange-dark">
                Book a demo →
              </Link>
              <a href="tel:01216301643" className="rounded-full border border-white/30 px-8 py-4 font-bold text-white hover:bg-white/10">
                Call 0121 630 1643
              </a>
            </div>
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
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}@keyframes slideIn{from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:none}}`}</style>
    </main>
  );
}
