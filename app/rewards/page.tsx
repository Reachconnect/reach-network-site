import Link from "next/link";
import Footer from "@/app/components/Footer";
import LandingNav from "@/app/components/rewards/LandingNav";
import RotatingOffers from "@/app/components/rewards/RotatingOffers";
import { Icon } from "@/app/components/rewards/Icons";

export const metadata = {
  title: "Reach Rewards | Discounts for Reach workers and client staff",
  description:
    "Reach Rewards is a members-only discounts platform from Reach Network Recruitment, giving our workers and our clients’ staff savings on food, fuel, shopping and days out.",
};

const CATEGORIES = [
  { icon: "utensils" as const, name: "Food & drink", text: "Takeaways, cafés and restaurants", bg: "#FFF1E3", fg: "#C2620A" },
  { icon: "cart" as const, name: "Groceries", text: "The weekly shop and essentials", bg: "#E6F6EC", fg: "#1F7A4D" },
  { icon: "fuel" as const, name: "Fuel & motoring", text: "Fuel, servicing and car care", bg: "#E7EEF9", fg: "#1D4ED8" },
  { icon: "bag" as const, name: "Shopping", text: "Clothes, workwear and tech", bg: "#FBEAF1", fg: "#BE185D" },
  { icon: "ticket" as const, name: "Days out", text: "Cinemas and attractions", bg: "#EEEBFB", fg: "#6D28D9" },
  { icon: "heart" as const, name: "Health & fitness", text: "Gyms, sport and wellbeing", bg: "#FDECEC", fg: "#B91C1C" },
];

const STEPS = [
  { icon: "user" as const, title: "Log in", text: "Reach workers use their Reach Connect details. Client staff are invited by their employer." },
  { icon: "search" as const, title: "Find a deal", text: "Browse national retailers and local businesses near where you work." },
  { icon: "tag" as const, title: "Save", text: "Copy the code, follow the link or show it in store. That’s it." },
];

const AUDIENCES = [
  {
    icon: "users" as const,
    title: "Reach workers",
    text: "Already working through Reach? You’re a member. Log in with your Reach Connect details.",
    cta: { href: "/rewards/login", label: "Log in" },
  },
  {
    icon: "gift" as const,
    title: "Client staff",
    text: "Does your employer work with Reach? Ask them to add you, and you’ll get an email to set up your account.",
    cta: { href: "/rewards/login", label: "Already invited? Log in" },
  },
  {
    icon: "shield" as const,
    title: "Employers",
    text: "Give your whole team a free staff benefit, with your own dashboard to add and remove people.",
    cta: { href: "/book-a-call", label: "Book a call" },
  },
  {
    icon: "pin" as const,
    title: "Retailers & local businesses",
    text: "List an offer for our members for free. Cafés, gyms and garages near our clients’ sites are especially welcome.",
    cta: { href: "/book-a-call", label: "Get in touch" },
  },
];

const FAQS = [
  {
    q: "Who can use Reach Rewards?",
    a: "Reach Rewards is only for Reach Network Recruitment workers and staff at companies that work with Reach. Offers are only visible after logging in.",
  },
  { q: "Does it cost anything?", a: "No. Reach Rewards is free for members." },
  {
    q: "How does Reach Rewards make money?",
    a: "Some offers link to retailers through affiliate programmes. If you buy something after following one of those links, the retailer may pay Reach a small commission. This never changes the price you pay or the discount you get.",
  },
  {
    q: "What if a code doesn’t work?",
    a: "Each offer has a “Did this work?” button. If several members report a code isn’t working, it’s taken down automatically while we check it. Retailers set their own terms, such as minimum spends, and these are shown on each offer.",
  },
  {
    q: "Do you share my details with retailers?",
    a: "No. Retailers don’t receive your name, email or employment details from Reach Rewards. You only share information with a retailer if you choose to buy from them on their own website.",
  },
];

const EMAIL = "hello" + "@" + "reachnetworkrec.com";

export default function RewardsLandingPage() {
  return (
    <div id="top" className="min-h-screen bg-white">
      <LandingNav />

      {/* ---------- Hero ---------- */}
      <section className="relative overflow-hidden bg-[#0F2438] text-white">
        <div className="pointer-events-none absolute -right-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-[#F7931E]/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-48 -left-32 h-[28rem] w-[28rem] rounded-full bg-[#1E4A73]/60 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 pb-16 pt-12 sm:px-6 md:grid-cols-[1.1fr_0.9fr] md:pb-24 md:pt-20">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold text-white ring-1 ring-white/15">
              <span className="h-1.5 w-1.5 rounded-full bg-[#F7931E]" />
              Free for Reach workers and client staff
            </span>
            <h1 className="mt-6 text-5xl font-extrabold leading-[1.02] tracking-tight sm:text-6xl">
              Everyday savings
              <br />
              for <span className="text-[#F7931E]">our people.</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-white/75">
              Money off food, fuel, shopping and days out, plus deals from local businesses near where you work. All in one place, and free.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/rewards/login" className="flex items-center gap-2 rounded-full bg-[#F7931E] px-7 py-4 font-bold text-white shadow-lg shadow-[#F7931E]/25 transition hover:bg-[#e2841a]">
                Log in to see offers <Icon name="arrow" className="h-4 w-4" />
              </Link>
              <Link href="#who" className="rounded-full px-7 py-4 font-bold text-white ring-1 ring-white/30 transition hover:bg-white/10">
                I&rsquo;m an employer
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm text-white/70">
              {["Members only", "No cost, ever", "Codes checked by members"].map((t) => (
                <span key={t} className="flex items-center gap-2">
                  <Icon name="check" className="h-4 w-4 text-[#F7931E]" />
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-6 -z-0 rounded-[2.5rem] bg-white/5 ring-1 ring-white/10" />
            <div className="relative p-2 sm:p-6">
              <RotatingOffers />
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Categories ---------- */}
      <section id="categories" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-20 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#F7931E]">What you can save on</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-[#0F2438] sm:text-4xl">The things you already buy</h2>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-6">
          {CATEGORIES.map((c) => (
            <Link
              key={c.name}
              href="/rewards/login"
              className="group rounded-3xl p-5 transition hover:-translate-y-1 hover:shadow-lg"
              style={{ backgroundColor: c.bg }}
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm" style={{ color: c.fg }}>
                <Icon name={c.icon} className="h-6 w-6" />
              </span>
              <h3 className="mt-5 font-extrabold text-[#0F2438]">{c.name}</h3>
              <p className="mt-1 text-sm leading-snug text-slate-600">{c.text}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ---------- How it works ---------- */}
      <section id="how-it-works" className="scroll-mt-20 bg-[#F6F8FB]">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#F7931E]">How it works</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-[#0F2438] sm:text-4xl">Three steps. No catch.</h2>
          </div>

          <ol className="mt-10 grid gap-4 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.title} className="relative rounded-3xl bg-white p-7 shadow-sm ring-1 ring-slate-100">
                <span className="absolute right-6 top-4 text-6xl font-extrabold text-slate-100">{i + 1}</span>
                <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F7931E] text-white">
                  <Icon name={s.icon} className="h-6 w-6" />
                </span>
                <h3 className="relative mt-5 text-lg font-extrabold text-[#0F2438]">{s.title}</h3>
                <p className="relative mt-2 leading-relaxed text-slate-600">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------- Who it's for ---------- */}
      <section id="who" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-20 sm:px-6">
        <span id="employers" className="block scroll-mt-20" />
        <div className="max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#F7931E]">Who it&rsquo;s for</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-[#0F2438] sm:text-4xl">Members, employers and partners</h2>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {AUDIENCES.map((a, i) => (
            <div key={a.title} className={`flex flex-col rounded-3xl p-7 ${i === 2 ? "bg-[#0F2438] text-white" : "bg-[#F6F8FB] ring-1 ring-slate-100"}`}>
              <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${i === 2 ? "bg-[#F7931E] text-white" : "bg-white text-[#F7931E] shadow-sm"}`}>
                <Icon name={a.icon} className="h-6 w-6" />
              </span>
              <h3 className={`mt-5 text-xl font-extrabold ${i === 2 ? "text-white" : "text-[#0F2438]"}`}>{a.title}</h3>
              <p className={`mt-2 flex-1 leading-relaxed ${i === 2 ? "text-white/75" : "text-slate-600"}`}>{a.text}</p>
              <Link href={a.cta.href} className={`mt-6 inline-flex items-center gap-2 self-start font-bold ${i === 2 ? "text-[#F7931E]" : "text-[#0F2438] hover:text-[#F7931E]"}`}>
                {a.cta.label} <Icon name="arrow" className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- Join band ---------- */}
      <section id="contact" className="scroll-mt-20 px-4 sm:px-6">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-[#F7931E] text-white">
          <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-white/10" />
          <div className="relative grid items-center gap-8 p-8 sm:p-12 md:grid-cols-[1.2fr_0.8fr] lg:p-14">
            <div>
              <h2 className="text-4xl font-extrabold leading-[1.05] tracking-tight lg:text-5xl">Start saving today.</h2>
              <p className="mt-4 max-w-md text-lg leading-relaxed text-white/90">Member discounts, local deals, and a little more for our people.</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/rewards/login" className="flex items-center gap-2 rounded-full bg-[#0F2438] px-7 py-4 font-bold text-white transition hover:bg-[#1a3552]">
                  Log in to see offers <Icon name="arrow" className="h-4 w-4" />
                </Link>
                <Link href="/book-a-call" className="rounded-full bg-white px-7 py-4 font-bold text-[#0F2438] transition hover:bg-white/90">
                  Book a call
                </Link>
              </div>
              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold">
                <a href="tel:01216301643" className="flex items-center gap-2 hover:underline">
                  <Icon name="phone" className="h-4 w-4" /> 0121 630 1643
                </a>
                <a href={`mailto:${EMAIL}`} className="flex items-center gap-2 hover:underline">
                  <Icon name="mail" className="h-4 w-4" /> {EMAIL}
                </a>
              </div>
            </div>
            <div className="mx-auto w-full max-w-md rounded-[1.75rem] bg-white p-3 shadow-2xl shadow-black/15">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/rewards/phones.png" alt="Reach Rewards on a phone" className="w-full rounded-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* ---------- FAQs ---------- */}
      <section id="faq" className="mx-auto grid max-w-7xl scroll-mt-20 gap-10 px-4 py-20 sm:px-6 md:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#F7931E]">Questions</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-[#0F2438] sm:text-4xl">Good to know</h2>
          <p className="mt-3 text-slate-600">
            Anything else? Call us on{" "}
            <a href="tel:01216301643" className="font-bold text-[#0F2438] hover:text-[#F7931E]">
              0121 630 1643
            </a>
            .
          </p>
        </div>
        <div className="space-y-3">
          {FAQS.map((f) => (
            <details key={f.q} className="group rounded-2xl bg-[#F6F8FB] px-6 py-5 ring-1 ring-slate-100 open:bg-white open:shadow-sm">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold text-[#0F2438]">
                {f.q}
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white text-xl text-[#F7931E] shadow-sm transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 leading-relaxed text-slate-600">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ---------- Disclosure ---------- */}
      <section className="border-t border-slate-100">
        <p className="mx-auto max-w-7xl px-4 py-6 text-xs leading-relaxed text-slate-400 sm:px-6">
          Reach Rewards is operated by Reach Network Recruitment. Some links are affiliate links, which means Reach may earn a commission if you make a purchase. This never affects the price you pay. Offers are
          provided by retailers and are subject to their own terms. Offers shown on this page are examples.
        </p>
      </section>

      <Footer />
    </div>
  );
}
