import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-navy-deep pt-16">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:grid-cols-5">
          <div className="col-span-2 sm:col-span-3 lg:col-span-1">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-orange">
                <span className="h-2.5 w-2.5 rounded-full bg-orange" />
              </span>
              <span className="font-display text-sm font-extrabold text-white">REACH</span>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-white/50">
              Recruitment done different. People focused. Results driven.
            </p>
            <div className="mt-5 flex gap-3">
              <a
                href="https://www.linkedin.com/company/reachnetworkrecruitment"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 text-white/60 transition hover:border-white/40 hover:text-white"
              >
                <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
                  <path d="M2.4 5.3h2.6V13H2.4V5.3zM3.7 4.2c-.9 0-1.5-.6-1.5-1.4S2.8 1.5 3.7 1.5s1.5.6 1.5 1.3-.6 1.4-1.5 1.4zM6.4 5.3h2.5v1.1h.03c.35-.65 1.2-1.3 2.47-1.3 2.64 0 3.13 1.6 3.13 3.7V13H11.9V9.3c0-.9-.02-2.05-1.25-2.05-1.26 0-1.45.95-1.45 1.98V13H6.4V5.3z" />
                </svg>
              </a>
              <a
                href="https://www.facebook.com/reachnetworkrec"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 text-white/60 transition hover:border-white/40 hover:text-white"
              >
                <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
                  <path d="M10.5 3H12V.9C11.7.87 10.9.8 9.9.8 7.9.8 6.5 2 6.5 4.2v1.8H4.3V8.5h2.2V15h2.7V8.5h2.2l.3-2.5H9.2V4.4c0-.7.2-1.4 1.3-1.4z" />
                </svg>
              </a>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-orange">For Employers</p>
            <ul className="mt-4 space-y-2.5">
              <li>
                <Link href="/i-need-staff" className="text-xs text-white/60 transition hover:text-white">
                  I need staff
                </Link>
              </li>
              <li>
                <Link href="/our-services" className="text-xs text-white/60 transition hover:text-white">
                  Our services
                </Link>
              </li>
              <li>
                <Link href="/why-choose-us" className="text-xs text-white/60 transition hover:text-white">
                  Why choose us
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-orange">For Candidates</p>
            <ul className="mt-4 space-y-2.5">
              <li>
                <Link href="/looking-for-work" className="text-xs text-white/60 transition hover:text-white">
                  I&rsquo;m looking for work
                </Link>
              </li>
              <li>
                <Link href="/looking-for-work" className="text-xs text-white/60 transition hover:text-white">
                  Search jobs
                </Link>
              </li>
              <li>
                <Link href="/looking-for-work" className="text-xs text-white/60 transition hover:text-white">
                  Register your CV
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-orange">About Us</p>
            <ul className="mt-4 space-y-2.5">
              <li>
                <Link href="/about-us" className="text-xs text-white/60 transition hover:text-white">
                  About us
                </Link>
              </li>
              <li>
                <Link href="/contact-us" className="text-xs text-white/60 transition hover:text-white">
                  Contact us
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-orange">Contact</p>
            <ul className="mt-4 space-y-2.5">
              <li>
                <a href="tel:01216301643" className="text-xs text-white/60 transition hover:text-white">
                  0121 630 1643
                </a>
              </li>
              <li>
                <a href="mailto:hello@reachnetworkrec.com" className="text-xs text-white/60 transition hover:text-white">
                  hello@reachnetworkrec.com
                </a>
              </li>
              <li className="text-xs leading-relaxed text-white/60">
                132a High Street, Bromsgrove,
                <br />
                United Kingdom, B61 8ES
              </li>
            </ul>
          </div>
        </div>

        {/* ReachConnect quick access */}
        <div className="mt-10 flex flex-wrap gap-3 border-t border-white/10 pt-8">
          <a
            href="https://reachnetworkconnect.com/client/login"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-orange px-5 py-2.5 text-xs font-bold text-white transition hover:bg-orange-dark"
          >
            Client login
          </a>
          <a
            href="https://reachnetworkconnect.com/worker/register"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-orange px-5 py-2.5 text-xs font-bold text-white transition hover:bg-orange-dark"
          >
            Worker register
          </a>
          <a
            href="https://reachnetworkconnect.com/worker/login"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-orange px-5 py-2.5 text-xs font-bold text-white transition hover:bg-orange-dark"
          >
            Worker login
          </a>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-white/10 py-6 text-xs text-white/40 sm:flex-row">
          <p>&copy; {new Date().getFullYear()} Reach Network Recruitment. All rights reserved.</p>
          <div className="flex gap-5">
            <Link href="/privacy-notice" className="hover:text-white/70">
              Privacy Notice
            </Link>
            <Link href="/terms-of-use" className="hover:text-white/70">
              Terms of Use
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}