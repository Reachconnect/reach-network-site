import Link from "next/link";
import { Caveat } from "next/font/google";
import Footer from "@/app/components/Footer";
import LandingNav from "@/app/components/rewards/LandingNav";
import RotatingOffers from "@/app/components/rewards/RotatingOffers";
import { Icon } from "@/app/components/rewards/Icons";

const handwritten = Caveat({ subsets: ["latin"], weight: ["600"] });

export const metadata = {
  title: "Reach Rewards | Discounts for Reach workers and client staff",
  description:
    "Reach Rewards is a members-only discounts platform from Reach Network Recruitment, giving our workers and our clients’ staff savings on food, fuel, shopping and days out.",
};

const HIGHLIGHTS = [
  { icon: "users" as const, text: "Members only" },
  { icon: "check" as const, text: "Free for members" },
  { icon: "shield" as const, text: "Codes checked by members" },
  { icon: "pin" as const, text: "Local deals near your site" },
  { icon: "tag" as const, text: "National and online retailers" },
];

const CATEGORIES = [
  { icon: "utensils" as const, name: "Food & drink", text: "Takeaways, cafés and restaurants, including local spots near where you work.", img: "/rewards/food.jpg", tint: "#FDE7D1" },
  { icon: "cart" as const, name: "Groceries", text: "Money off the weekly shop and household essentials.", img: "/rewards/groceries.jpg", tint: "#DCF1E3" },
  { icon: "fuel" as const, name: "Fuel & motoring", text: "Savings on fuel, servicing, parts and car care.", img: "/rewards/fuel.jpg", tint: "#DDE6F3" },
  { icon: "bag" as const, name: "Shopping", text: "Clothing, workwear, tech and everyday online shopping.", img: "/rewards/shopping.jpg", tint: "#F6E3D3" },
  { icon: "ticket" as const, name: "Days out", text: "Cinemas, attractions and family activities.", img: "/rewards/days-out.jpg", tint: "#E3E0F6" },
  { icon: "heart" as const, name: "Health & fitness", text: "Gyms, sports and wellbeing.", img: "/rewards/fitness.jpg", tint: "#F4DDE3" },
];

const STEPS = [
  { icon: "user" as const, title: "Log in", text: "Reach workers use their ReachConnect details. Client staff are invited by their employer." },
  { icon: "search" as const, title: "Browse offers", text: "Discounts from national retailers and local businesses." },
  { icon: "tag" as const, title: "Get your discount", text: "Copy the code, follow the link, or show it in store." },
  { icon: "gift" as const, title: "Start saving", text: "New offers are added all year round." },
];

const FAQS = [
  {
    q: "Who can use Reach Rewards?",
    a: "Reach Rewards is only available to Reach Network Recruitment workers and to staff at companies that work with Reach. Offers are only visible after logging in.",
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
        <div
          className="absolute inset-0 bg-cover bg-center md:left-[38%]"
          style={{ backgroundImage: "url(/rewards/coverimage.png)" }}
        />
        <div className="absolute inset-0 bg-[#0F2438]/85 md:bg-transparent md:bg-gradient-to-r md:from-[#0F2438] md:from-40% md:via-[#0F2438]/60 md:via-55% md:to-transparent" />

        <span className="absolute left-[46%] top-24 hidden h-1.5 w-7 rotate-[30deg] rounded-full bg-[#F7931E] md:block" />
        <span className="absolute left-[45%] top-32 hidden h-1.5 w-6 rounded-full bg-[#F7931E] md:block" />
        <span className="absolute right-[34%] top-10 hidden h-1.5 w-10 -rotate-[60deg] rounded-full bg-[#F7931E] lg:block" />

        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 pb-14 pt-10 sm:px-6 md:grid-cols-[1.1fr_0.9fr] md:pb-20 md:pt-14 lg:grid-cols-[1fr_0.8fr]">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-white/70">EXCLUSIVE DISCOUNTS FOR OUR PEOPLE</p>
            <h1 className="mt-4 text-5xl font-extrabold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
              Money off the things you <span className="text-[#F7931E]">already buy.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/85">
              Reach Rewards is a members-only discounts platform from Reach Network Recruitment. Our workers and our
              clients’ staff get savings on food, fuel, shopping and days out, plus deals from local businesses near
              where they work.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/rewards/login"
                className="flex items-center gap-2 rounded-full bg-[#F7931E] px-7 py-3.5 font-semibold text-white hover:bg-[#e2841a]"
              >
                Log in to see offers <Icon name="arrow" className="h-4 w-4" />
              </Link>
              <Link
                href="#employers"
                className="rounded-full border border-white/40 px-7 py-3.5 font-semibold text-white hover:bg-white/10"
              >
                Partner with us
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-4">
              {[
                { icon: "tag" as const, text: "Exclusive discounts" },
                { icon: "heart" as const, text: "Trusted offers" },
                { icon: "users" as const, text: "For our people" },
              ].map((b) => (
                <div key={b.text} className="flex items-center gap-3 text-sm text-white/85">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/25 text-[#F7931E]">
                    <Icon name={b.icon} className="h-5 w-5" />
                  </span>
                  {b.text}
                </div>
              ))}
            </div>
          </div>

          <div className="md:pt-4">
            <RotatingOffers />
            <p className={`${handwritten.className} mt-6 hidden -rotate-6 text-right text-3xl text-white md:block`}>
              Real savings
              <br />
              for everyday life
            </p>
          </div>
        </div>
      </section>

      {/* ---------- Highlights strip ---------- */}
      <section className="border-b border-slate-100">
        <div className="mx-auto flex max-w-7xl gap-8 overflow-x-auto px-4 py-6 sm:px-6 lg:justify-between">
          {HIGHLIGHTS.map((h) => (
            <div key={h.text} className="flex flex-shrink-0 items-center gap-2.5 font-semibold text-[#0F2438]">
              <Icon name={h.icon} className="h-5 w-5 text-[#F7931E]" />
              {h.text}
            </div>
          ))}
        </div>
      </section>

      {/* ---------- Categories ---------- */}
      <section id="categories" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-14 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-3xl font-extrabold tracking-tight text-[#0F2438] sm:text-4xl">
            What members can <span className="text-[#F7931E]">save on</span>
          </h2>
          <Link
            href="/rewards/login"
            className="hidden flex-shrink-0 items-center gap-2 rounded-full border border-[#F7931E] px-5 py-2 text-sm font-semibold text-[#F7931E] hover:bg-[#F7931E]/10 sm:flex"
          >
            View all offers <Icon name="arrow" className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
          {CATEGORIES.map((c) => (
            <Link
              key={c.name}
              href="/rewards/login"
              className="group flex flex-col overflow-hidden rounded-2xl bg-slate-50 ring-1 ring-slate-100 hover:ring-[#F7931E]/50"
            >
              <div
                className="h-24 bg-cover bg-center sm:h-28"
                style={{ backgroundColor: c.tint, backgroundImage: `url(${c.img})` }}
              />
              <div className="flex flex-1 flex-col px-4 pb-4">
                <span className="-mt-6 flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#F7931E] shadow-md">
                  <Icon name={c.icon} className="h-5 w-5" />
                </span>
                <h3 className="mt-3 font-bold text-[#0F2438]">{c.name}</h3>
                <p className="mt-1 flex-1 text-sm leading-relaxed text-slate-600">{c.text}</p>
                <span className="mt-3 flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#F7931E] shadow-sm group-hover:bg-[#F7931E] group-hover:text-white">
                  <Icon name="arrow" className="h-3.5 w-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ---------- How it works ---------- */}
      <section id="how-it-works" className="scroll-mt-20 bg-[#FFF6EE]">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight text-[#0F2438] sm:text-4xl">
                How it <span className="text-[#F7931E]">works</span>
              </h2>
              <p className="mt-2 text-slate-600">Get access to member offers in a few simple steps.</p>
            </div>
            <Link
              href="#faq"
              className="hidden flex-shrink-0 items-center gap-2 rounded-full border border-[#F7931E] px-5 py-2 text-sm font-semibold text-[#F7931E] hover:bg-[#F7931E]/10 sm:flex"
            >
              Learn more <Icon name="arrow" className="h-4 w-4" />
            </Link>
          </div>

          <ol className="mt-8 grid gap-4 rounded-2xl bg-white p-5 shadow-sm sm:grid-cols-2 sm:p-6 lg:grid-cols-4 lg:gap-0">
            {STEPS.map((s, i) => (
              <li key={s.title} className="relative flex gap-4 lg:px-4">
                <div className="flex flex-shrink-0 items-start gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F7931E] font-bold text-white">
                    {i + 1}
                  </span>
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#FFF6EE] text-[#F7931E]">
                    <Icon name={s.icon} className="h-5 w-5" />
                  </span>
                </div>
                <div className="pt-1">
                  <h3 className="font-bold text-[#0F2438]">{s.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">{s.text}</p>
                </div>
                {i < STEPS.length - 1 && (
                  <span className="absolute -right-2 top-2 hidden text-xl text-[#F7931E] lg:block">›</span>
                )}
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------- For employers and businesses ---------- */}
      <section id="employers" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-14 sm:px-6">
        <h2 className="text-3xl font-extrabold tracking-tight text-[#0F2438] sm:text-4xl">
          For employers and <span className="text-[#F7931E]">businesses</span>
        </h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 p-6 ring-1 ring-slate-100">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F7931E] text-white">
              <Icon name="users" />
            </span>
            <h3 className="mt-4 text-lg font-bold text-[#0F2438]">Employers</h3>
            <p className="mt-2 leading-relaxed text-slate-600">
              Already work with Reach? Give your whole team Reach Rewards as a staff benefit. You get your own
              dashboard to add and remove staff.
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-6 ring-1 ring-slate-100">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F7931E] text-white">
              <Icon name="tag" />
            </span>
            <h3 className="mt-4 text-lg font-bold text-[#0F2438]">Retailers</h3>
            <p className="mt-2 leading-relaxed text-slate-600">
              We show your offers and codes with full terms and expiry dates, and link through to your own website.
              Exclusive codes for Reach members are welcome.
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-6 ring-1 ring-slate-100">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F7931E] text-white">
              <Icon name="pin" />
            </span>
            <h3 className="mt-4 text-lg font-bold text-[#0F2438]">Local businesses</h3>
            <p className="mt-2 leading-relaxed text-slate-600">
              Cafés, takeaways, gyms and garages near our clients’ sites can list a discount for our members for free.
            </p>
          </div>
        </div>
        <Link
          href="/book-a-call"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#0F2438] px-7 py-3.5 font-semibold text-white hover:bg-[#1a3552]"
        >
          Book a call with us <Icon name="arrow" className="h-4 w-4" />
        </Link>
      </section>

      {/* ---------- FAQs ---------- */}
      <section id="faq" className="scroll-mt-20 bg-slate-50">
        <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
          <h2 className="text-3xl font-extrabold tracking-tight text-[#0F2438]">Questions</h2>
          <div className="mt-6 divide-y divide-slate-200 border-y border-slate-200">
            {FAQS.map((f) => (
              <details key={f.q} className="group py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-[#0F2438]">
                  {f.q}
                  <span className="text-2xl text-[#F7931E] transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 leading-relaxed text-slate-600">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Join band ---------- */}
      <section className="px-4 pb-14 pt-12 sm:px-6 md:pt-36">
        <div className="relative mx-auto max-w-7xl rounded-3xl bg-[#0F2438] text-white">
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
            <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-white/[0.04]" />
            <div className="absolute -top-24 left-[45%] h-72 w-72 rounded-full bg-white/[0.04]" />
          </div>

          <div className="relative p-8 sm:p-12 md:w-[52%] md:py-16 lg:pl-16">
            <p className="text-xs font-semibold tracking-[0.2em] text-white/70">READY TO START SAVING?</p>
            <h2 className="mt-3 text-4xl font-extrabold leading-[1.05] tracking-tight lg:text-5xl">
              Join Reach<span className="text-[#F7931E]">Rewards</span> today.
            </h2>
            <p className="mt-4 max-w-md text-lg leading-relaxed text-white/80">
              Member discounts. Local deals. A little more for our people.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/rewards/login"
                className="flex items-center gap-2 rounded-full bg-[#F7931E] px-7 py-3.5 font-semibold text-white hover:bg-[#e2841a]"
              >
                Log in to see offers <Icon name="arrow" className="h-4 w-4" />
              </Link>
              <Link
                href="#employers"
                className="rounded-full border border-white/40 px-7 py-3.5 font-semibold text-white hover:bg-white/10"
              >
                Partner with us
              </Link>
            </div>
          </div>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/rewards/phones.png"
            alt="The Reach Rewards app on a phone"
            className="relative mx-auto block h-auto w-full max-w-sm px-4 sm:max-w-md md:absolute md:bottom-0 md:right-4 md:mx-0 md:w-[46%] md:max-w-none md:px-0 lg:right-8"
          />
        </div>
      </section>

      {/* ---------- Contact us ---------- */}
      <section id="contact" className="scroll-mt-20 bg-[#FFF6EE]">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <h2 className="text-3xl font-extrabold tracking-tight text-[#0F2438] sm:text-4xl">
            Contact <span className="text-[#F7931E]">us</span>
          </h2>
          <p className="mt-2 max-w-2xl text-slate-600">
            Questions about Reach Rewards, giving it to your team, or listing an offer? We’d love to hear from you.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <Link
              href="tel:01216301643"
              className="group rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 hover:ring-[#F7931E]/50"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F7931E] text-white">
                <Icon name="phone" />
              </span>
              <h3 className="mt-4 text-lg font-bold text-[#0F2438]">Call us</h3>
              <p className="mt-1 text-slate-600 group-hover:text-[#0F2438]">0121 630 1643</p>
            </Link>

            <Link
              href={`mailto:${EMAIL}`}
              className="group rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 hover:ring-[#F7931E]/50"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F7931E] text-white">
                <Icon name="mail" />
              </span>
              <h3 className="mt-4 text-lg font-bold text-[#0F2438]">Email us</h3>
              <p className="mt-1 break-words text-slate-600 group-hover:text-[#0F2438]">{EMAIL}</p>
            </Link>

            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F7931E] text-white">
                <Icon name="pin" />
              </span>
              <h3 className="mt-4 text-lg font-bold text-[#0F2438]">Visit us</h3>
              <p className="mt-1 leading-relaxed text-slate-600">
                132a High Street
                <br />
                Bromsgrove
                <br />
                B61 8ES
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/book-a-call"
              className="flex items-center gap-2 rounded-full bg-[#F7931E] px-7 py-3.5 font-semibold text-white hover:bg-[#e2841a]"
            >
              Book a call <Icon name="arrow" className="h-4 w-4" />
            </Link>
            <Link
              href="/"
              className="flex items-center gap-2 rounded-full border border-[#0F2438]/20 bg-white px-7 py-3.5 font-semibold text-[#0F2438] hover:bg-slate-50"
            >
              <Icon name="arrowLeft" className="h-4 w-4" /> Back to Reach Network Recruitment
            </Link>
          </div>
        </div>
      </section>

      {/* ---------- Disclosure ---------- */}
      <section className="border-t border-slate-200">
        <p className="mx-auto max-w-7xl px-4 py-6 text-sm leading-relaxed text-slate-500 sm:px-6">
          Reach Rewards is operated by Reach Network Recruitment. Some links on Reach Rewards are affiliate links, which
          means Reach may earn a commission if you make a purchase. This never affects the price you pay. Offers are
          provided by retailers and are subject to their own terms. Offers shown on this page are examples.
        </p>
      </section>

      <Footer />
    </div>
  );
}