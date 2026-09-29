"use client";
import { useState } from "react";
import Link from "next/link";
import { Icon } from "./Icons";

const LINKS = [
  { href: "#top", label: "Home" },
  { href: "/rewards/login", label: "Offers" },
  { href: "#categories", label: "Categories" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#employers", label: "For Employers" },
  { href: "#contact", label: "Contact" },
];

export function RewardsLogo() {
  return (
    <Link href="/rewards" className="flex items-center gap-2.5">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F7931E] text-white">
        <Icon name="gift" className="h-5 w-5" />
      </span>
      <span className="leading-none">
        <span className="block text-xl font-extrabold tracking-tight text-[#0F2438]">
          Reach<span className="text-[#F7931E]">Rewards</span>
        </span>
        <span className="mt-0.5 block text-[9px] font-semibold tracking-[0.12em] text-slate-500">
          BY REACH NETWORK RECRUITMENT
        </span>
      </span>
    </Link>
  );
}

export default function LandingNav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="bg-[#0F2438] text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2 text-xs sm:px-6 sm:text-sm">
          <Link href="/" className="flex items-center gap-1.5 text-white/80 hover:text-white">
            <Icon name="arrowLeft" className="h-4 w-4" />
            Back to Reach Network Recruitment
          </Link>
          <Link href="tel:01216301643" className="hidden items-center gap-1.5 text-white/80 hover:text-white sm:flex">
            <Icon name="phone" className="h-3.5 w-3.5" />
            0121 630 1643
          </Link>
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <RewardsLogo />

          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 lg:flex">
            {LINKS.map((l, i) => (
              <Link
                key={l.href}
                href={l.href}
                className={`py-1 hover:text-[#0F2438] ${
                  i === 0 ? "border-b-2 border-[#F7931E] font-semibold text-[#0F2438]" : ""
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/rewards/login"
              aria-label="Search offers"
              className="hidden h-10 w-10 items-center justify-center rounded-full text-[#0F2438] hover:bg-slate-100 sm:flex"
            >
              <Icon name="search" />
            </Link>
            <Link
              href="/rewards/login"
              className="flex items-center gap-2 rounded-full bg-[#F7931E] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#e2841a]"
            >
              Log in <Icon name="arrow" className="h-4 w-4" />
            </Link>
            <button
              onClick={() => setOpen(!open)}
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              className="flex h-10 w-10 items-center justify-center rounded-full text-[#0F2438] hover:bg-slate-100 lg:hidden"
            >
              <Icon name={open ? "close" : "menu"} className="h-6 w-6" />
            </button>
          </div>
        </div>

        {open && (
          <nav className="border-t border-slate-100 bg-white px-4 pb-4 lg:hidden">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="block border-b border-slate-100 py-3.5 font-medium text-[#0F2438]"
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className="mt-2 flex items-center gap-2 py-3.5 font-medium text-slate-600"
            >
              <Icon name="arrowLeft" className="h-4 w-4" />
              Back to Reach Network Recruitment
            </Link>
          </nav>
        )}
      </header>
    </>
  );
}