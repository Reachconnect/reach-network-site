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
              {["in", "f", "ig"].map((icon) => (
                <span
                  key={icon}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 text-[10px] font-bold text-white/60"
                >
                  {icon}
                </span>
              ))}
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
                <a href="mailto:info@reachnetworkrec.com" className="text-xs text-white/60 transition hover:text-white">
                  info@reachnetworkrec.com
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
            <a href="#" className="hover:text-white/70">
              Terms of Use
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}