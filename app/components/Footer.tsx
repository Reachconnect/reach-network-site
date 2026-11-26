import Link from "next/link";

const EMPLOYERS = [
  { href: "/i-need-staff", label: "I need staff" },
  { href: "/our-services", label: "Our services" },
  { href: "/temporary-recruitment", label: "Temporary staffing" },
  { href: "/permanent-recruitment", label: "Permanent recruitment" },
  { href: "/industries", label: "Industries" },
  { href: "/pay-rates", label: "Pay rates and costs" },
  { href: "/salary-guide", label: "Free salary guide" },
  { href: "/staff", label: "Areas we cover" },
];

const CANDIDATES = [
  { href: "/looking-for-work", label: "Find work" },
  { href: "/looking-for-work", label: "Register your CV" },
  { href: "/cv-builder", label: "Free CV builder" },
  { href: "/take-home-pay", label: "Take-home pay calculator" },
  { href: "/guides", label: "Guides and advice" },
  { href: "/refer", label: "Refer a friend" },
];

const COMPANY = [
  { href: "/about-us", label: "About us" },
  { href: "/why-choose-us", label: "Why choose us" },
  { href: "/review", label: "Leave a review" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact-us", label: "Contact us" },
];

const PORTALS = [
  { href: "https://reachnetworkconnect.com/client/login", label: "Client login" },
  { href: "https://reachnetworkconnect.com/worker/login", label: "Worker login" },
  { href: "https://reachnetworkconnect.com/worker/register", label: "Register for work" },
];

function Column({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <p className="font-display text-sm font-extrabold text-white">{title}</p>
      <ul className="mt-4 space-y-3">
        {links.map((l) => (
          <li key={l.label}>
            <Link href={l.href} className="group inline-flex items-center gap-1.5 text-sm text-white/60 transition hover:text-white">
              <span className="h-px w-0 bg-orange transition-all group-hover:w-3" />
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

const icon = "h-4 w-4 shrink-0 text-orange";

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-navy-deep">
      {/* soft glow */}
      <div className="pointer-events-none absolute -top-40 right-[-10%] h-96 w-96 rounded-full bg-orange/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        {/* Main */}
        <div className="grid gap-12 pb-14 pt-16 lg:grid-cols-[1.3fr_1fr_1fr_0.8fr]">
          <div>
            <Link href="/" className="inline-flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-orange">
                <span className="h-3.5 w-3.5 rounded-full bg-orange" />
              </span>
              <span className="font-display leading-none">
                <span className="block text-xl font-extrabold tracking-tight text-white">REACH</span>
                <span className="block text-[10px] font-semibold tracking-[0.2em] text-white/60">NETWORK RECRUITMENT</span>
              </span>
            </Link>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-white/60">Recruitment done differently. People focused. Results driven.</p>

            <ul className="mt-6 space-y-3 text-sm">
              <li>
                <a href="tel:01216301643" className="flex items-center gap-3 font-semibold text-white transition hover:text-orange">
                  <svg viewBox="0 0 20 20" fill="currentColor" className={icon}>
                    <path d="M3.5 2.5A1.5 1.5 0 0 1 5 1h1.3a1.5 1.5 0 0 1 1.46 1.16l.62 2.68a1.5 1.5 0 0 1-.4 1.42l-1.1 1.1a11.5 11.5 0 0 0 5 5l1.1-1.1a1.5 1.5 0 0 1 1.42-.4l2.68.62A1.5 1.5 0 0 1 18 12.7V14a1.5 1.5 0 0 1-1.5 1.5C8.5 15.5 3.5 10.5 3.5 2.5z" />
                  </svg>
                  0121 630 1643
                </a>
              </li>
              <li>
                <a href="mailto:hello@reachnetworkrec.com" className="flex items-center gap-3 text-white/70 transition hover:text-white">
                  <svg viewBox="0 0 20 20" fill="currentColor" className={icon}>
                    <path d="M2.5 4A1.5 1.5 0 0 0 1 5.5v.4l9 5.4 9-5.4v-.4A1.5 1.5 0 0 0 17.5 4h-15zM19 7.6l-8.5 5.1a1 1 0 0 1-1 0L1 7.6v6.9A1.5 1.5 0 0 0 2.5 16h15a1.5 1.5 0 0 0 1.5-1.5V7.6z" />
                  </svg>
                  hello@reachnetworkrec.com
                </a>
              </li>
              <li className="flex items-start gap-3 text-white/70">
                <svg viewBox="0 0 20 20" fill="currentColor" className={`${icon} mt-0.5`}>
                  <path fillRule="evenodd" d="M10 1.5a6 6 0 0 0-6 6c0 4.3 5.1 10.3 5.4 10.6a.8.8 0 0 0 1.2 0c.3-.3 5.4-6.3 5.4-10.6a6 6 0 0 0-6-6zm0 8.25a2.25 2.25 0 1 1 0-4.5 2.25 2.25 0 0 1 0 4.5z" clipRule="evenodd" />
                </svg>
                <span>
                  132a High Street, Bromsgrove
                  <br />
                  Worcestershire, B61 8ES
                </span>
              </li>
            </ul>

            <div className="mt-6 flex gap-3">
              <a
                href="https://www.linkedin.com/company/reachnetworkrecruitment"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-white/70 ring-1 ring-white/10 transition hover:bg-orange hover:text-white hover:ring-orange"
              >
                <svg viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4">
                  <path d="M2.4 5.3h2.6V13H2.4V5.3zM3.7 4.2c-.9 0-1.5-.6-1.5-1.4S2.8 1.5 3.7 1.5s1.5.6 1.5 1.3-.6 1.4-1.5 1.4zM6.4 5.3h2.5v1.1h.03c.35-.65 1.2-1.3 2.47-1.3 2.64 0 3.13 1.6 3.13 3.7V13H11.9V9.3c0-.9-.02-2.05-1.25-2.05-1.26 0-1.45.95-1.45 1.98V13H6.4V5.3z" />
                </svg>
              </a>
              <a
                href="https://www.facebook.com/reachnetworkrec"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-white/70 ring-1 ring-white/10 transition hover:bg-orange hover:text-white hover:ring-orange"
              >
                <svg viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4">
                  <path d="M10.5 3H12V.9C11.7.87 10.9.8 9.9.8 7.9.8 6.5 2 6.5 4.2v1.8H4.3V8.5h2.2V15h2.7V8.5h2.2l.3-2.5H9.2V4.4c0-.7.2-1.4 1.3-1.4z" />
                </svg>
              </a>
            </div>
          </div>

          <Column title="For employers" links={EMPLOYERS} />
          <Column title="For candidates" links={CANDIDATES} />
          <Column title="Company" links={COMPANY} />
        </div>

        {/* Reach Connect logins */}
        <div className="flex flex-col gap-4 rounded-3xl bg-white/[0.04] p-5 ring-1 ring-white/10 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange/15 text-orange">
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                <path fillRule="evenodd" d="M10 1a4.5 4.5 0 0 0-4.5 4.5V8H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1zm2.5 7V5.5a2.5 2.5 0 0 0-5 0V8h5z" clipRule="evenodd" />
              </svg>
            </span>
            <div>
              <p className="font-display text-sm font-extrabold text-white">Reach Connect</p>
              <p className="text-xs text-white/50">Shifts, timesheets and clocking in for our clients and workers</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {PORTALS.map((p, i) => (
              <a
                key={p.href}
                href={p.href}
                target="_blank"
                rel="noopener noreferrer"
                className={
                  i === PORTALS.length - 1
                    ? "rounded-full bg-orange px-5 py-2.5 text-sm font-bold text-white transition hover:bg-orange-dark"
                    : "rounded-full px-5 py-2.5 text-sm font-bold text-white ring-1 ring-white/20 transition hover:bg-white/10"
                }
              >
                {p.label}
              </a>
            ))}
          </div>
        </div>

        {/* Legal */}
        <div className="mt-10 flex flex-col gap-4 border-t border-white/10 py-7 text-xs text-white/40 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <p>&copy; {new Date().getFullYear()} Reach Network Recruitment Ltd. All rights reserved.</p>
            <p>Registered in England and Wales, company number 15935163. Registered office: 132a High Street, Bromsgrove, B61 8ES.</p>
          </div>
          <div className="flex gap-6">
            <Link href="/privacy-notice" className="transition hover:text-white">
              Privacy notice
            </Link>
            <Link href="/terms-of-use" className="transition hover:text-white">
              Terms of use
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
