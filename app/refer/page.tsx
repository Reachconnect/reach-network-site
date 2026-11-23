// Refer a friend
import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "../components/SiteHeader";
import Footer from "../components/Footer";
import ReferForm from "./ReferForm";
import { SITE } from "@/lib/siteConfig";

export const metadata: Metadata = {
  title: "Refer a friend | Reach Network Recruitment",
  description: "Know a good driver, warehouse worker or engineer? Refer them to Reach and get a thank-you bonus once they've started work.",
  alternates: { canonical: "/refer" },
};

export default function ReferPage() {
  const bonus = SITE.referralBonus;
  const hours = SITE.referralHours;
  return (
    <main className="overflow-x-hidden font-body">
      <SiteHeader />
      <section className="relative overflow-hidden bg-navy pb-12 pt-12">
        <div className="pointer-events-none absolute -left-40 top-0 h-[420px] w-[420px] rounded-full bg-orange/20 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl items-start gap-10 px-6 lg:grid-cols-[1fr_1.1fr] lg:px-8">
          <div className="lg:pt-8">
            <nav className="text-sm text-white/60">
              <Link href="/" className="hover:text-white">Home</Link> <span className="mx-1">›</span> <span className="text-white/90">Refer a friend</span>
            </nav>
            <p className="mt-6 text-xs font-bold uppercase tracking-[0.3em] text-orange">Refer a friend</p>
            <h1 className="mt-3 font-display text-4xl font-extrabold leading-tight text-white sm:text-5xl">
              Know someone good? <span className="text-orange">{bonus ? `Get ${bonus}.` : "Get a thank-you bonus."}</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg text-white/80">
              Refer a friend who&apos;s looking for driving, warehouse, production or engineering work. Once they&apos;ve started and worked {hours ? `${hours} hours` : "their qualifying hours"}, we&apos;ll say thank you{bonus ? ` with ${bonus}` : " with a bonus"}.
            </p>
            <ol className="mt-8 space-y-3">
              {["Tell us about your friend", "We call them and get them registered", `They start work${hours ? ` and complete ${hours} hours` : ""}`, "You get your bonus"].map((x, n) => (
                <li key={x} className="flex items-center gap-4 text-white">
                  <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-orange font-extrabold">{n + 1}</span>
                  <span className="font-semibold">{x}</span>
                </li>
              ))}
            </ol>
            <p className="mt-8 text-xs text-white/50">
              The bonus is paid once your friend has been registered with us for the first time and has worked the qualifying hours. One bonus per person referred. We&apos;ll confirm the details when you refer.
            </p>
          </div>
          <ReferForm />
        </div>
      </section>
      <Footer />
    </main>
  );
}
