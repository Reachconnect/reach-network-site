"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useRewardsUser } from "@/lib/useRewardsUser";
import RewardsHeader, { Loading } from "@/app/components/rewards/RewardsHeader";

type Offer = {
  id: string;
  title: string;
  retailer: string;
  description: string | null;
  category: string;
  offer_type: "code" | "link" | "in_store";
  discount_code: string | null;
  link_url: string | null;
  image_url: string | null;
  terms: string | null;
  location: string | null;
  source: string;
  is_featured: boolean;
  is_active: boolean;
  starts_at: string | null;
  expires_at: string | null;
};

type Company = {
  key: string;
  name: string;
  logo: string | null;
  category: string;
  location: string | null;
  isLocal: boolean;
  featured: boolean;
  offers: Offer[];
};

const isLive = (o: Offer) => {
  const now = Date.now();
  return (
    o.is_active &&
    (!o.starts_at || new Date(o.starts_at).getTime() <= now) &&
    (!o.expires_at || new Date(o.expires_at).getTime() > now)
  );
};

const endsText = (iso: string | null) => {
  if (!iso) return null;
  const days = Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
  if (days <= 1) return "Ends today";
  if (days <= 7) return `Ends in ${days} days`;
  return `Ends ${new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "Europe/London" })}`;
};

const companyKey = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, "");

const hasCode = (o: Offer) => o.offer_type === "code" && !!o.discount_code;

function groupByCompany(offers: Offer[]): Company[] {
  const map = new Map<string, Company>();
  for (const o of offers) {
    const key = companyKey(o.retailer) || o.id;
    let c = map.get(key);
    if (!c) {
      c = {
        key,
        name: o.retailer,
        logo: null,
        category: o.category,
        location: o.location,
        isLocal: o.source === "local",
        featured: false,
        offers: [],
      };
      map.set(key, c);
    }
    c.offers.push(o);
    if (!c.logo && o.image_url) c.logo = o.image_url;
    if (o.is_featured) c.featured = true;
  }
  // Codes first inside each company, then deals
  for (const c of map.values()) c.offers.sort((a, b) => Number(hasCode(b)) - Number(hasCode(a)));
  return [...map.values()].sort((a, b) => Number(b.featured) - Number(a.featured) || a.name.localeCompare(b.name));
}

function summary(c: Company) {
  const codes = c.offers.filter(hasCode).length;
  const deals = c.offers.length - codes;
  const parts = [];
  if (codes) parts.push(`${codes} ${codes === 1 ? "code" : "codes"}`);
  if (deals) parts.push(`${deals} ${deals === 1 ? "deal" : "deals"}`);
  return parts.join(" · ");
}

export default function OffersPage() {
  const { me, loading, signOut } = useRewardsUser("member");
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [openKey, setOpenKey] = useState<string | null>(null);

  useEffect(() => {
    if (!me) return;
    (async () => {
      const { data, error: loadError } = await supabase
        .from("reward_offers")
        .select("*")
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false });
      if (loadError) setError("Offers couldn't load. Refresh the page to try again.");
      else setOffers((data as Offer[]).filter(isLive));
      setLoadingOffers(false);
    })();
  }, [me]);

  const companies = useMemo(() => groupByCompany(offers), [offers]);

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(offers.map((o) => o.category))).sort()],
    [offers]
  );

  if (loading || !me) return <Loading />;

  const q = search.trim().toLowerCase();
  const filtered = companies.filter(
    (c) =>
      (category === "All" || c.offers.some((o) => o.category === category)) &&
      (!q ||
        c.name.toLowerCase().includes(q) ||
        (c.location || "").toLowerCase().includes(q) ||
        c.offers.some((o) => o.title.toLowerCase().includes(q)))
  );
  const featured = companies.filter((c) => c.featured);
  const openCompany = companies.find((c) => c.key === openKey) || null;
  const firstName = me.name.split(" ")[0];

  return (
    <div className="min-h-screen bg-slate-50">
      <RewardsHeader me={me} onSignOut={signOut} />

      <div className="bg-[#0F2438] pb-10 text-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h1 className="text-3xl font-bold">Hi {firstName}</h1>
          <p className="mt-1 text-white/75">
            {offers.length} {offers.length === 1 ? "offer" : "offers"} from {companies.length}{" "}
            {companies.length === 1 ? "company" : "companies"}
            {me.member?.companyName ? `, through ${me.member.companyName}` : ""}.
          </p>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search shops, brands or towns"
            className="mt-6 w-full max-w-xl rounded-xl border-0 px-5 py-3.5 text-[#0F2438] placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-[#F7931E]/50"
          />
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {error && <p className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

        {loadingOffers ? (
          <p className="py-12 text-center text-sm text-slate-500">Loading offers…</p>
        ) : companies.length === 0 ? (
          <div className="rounded-xl bg-white py-16 text-center ring-1 ring-slate-200">
            <p className="font-semibold text-[#0F2438]">New offers are on their way</p>
            <p className="mt-1 text-sm text-slate-600">Check back soon.</p>
          </div>
        ) : (
          <>
            {featured.length > 0 && !q && category === "All" && (
              <section className="mb-10">
                <h2 className="mb-4 text-lg font-bold text-[#0F2438]">Featured</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {featured.slice(0, 4).map((c) => (
                    <button
                      key={c.key}
                      onClick={() => setOpenKey(c.key)}
                      className="flex items-center gap-4 rounded-2xl bg-white p-5 text-left ring-2 ring-[#F7931E]/40 hover:ring-[#F7931E]"
                    >
                      <Logo name={c.name} logo={c.logo} size="lg" />
                      <div className="min-w-0">
                        <p className="text-lg font-bold text-[#0F2438]">{c.name}</p>
                        <p className="truncate text-sm text-slate-600">{c.offers[0].title}</p>
                        <p className="mt-1 text-xs font-semibold text-[#b8660b]">{summary(c)}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )}

            <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium ${
                    category === cat
                      ? "bg-[#0F2438] text-white"
                      : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {filtered.length === 0 ? (
              <p className="py-12 text-center text-sm text-slate-600">
                No companies match that. Try another search or category.
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((c) => (
                  <button
                    key={c.key}
                    onClick={() => setOpenKey(c.key)}
                    className="flex flex-col rounded-2xl bg-white p-5 text-left ring-1 ring-slate-200 hover:ring-[#0F2438]/40"
                  >
                    <div className="flex items-center gap-4">
                      <Logo name={c.name} logo={c.logo} size="lg" />
                      <div className="min-w-0">
                        <p className="truncate text-lg font-bold text-[#0F2438]">{c.name}</p>
                        <p className="text-xs text-slate-500">
                          {c.isLocal && c.location ? `Local · ${c.location}` : c.category}
                        </p>
                      </div>
                    </div>
                    <p className="mt-4 line-clamp-2 font-semibold leading-snug text-[#0F2438]">{c.offers[0].title}</p>
                    <div className="mt-auto flex items-center justify-between pt-4 text-xs">
                      <span className="rounded-full bg-[#FFF6EE] px-2.5 py-1 font-semibold text-[#b8660b]">
                        {summary(c)}
                      </span>
                      <span className="font-semibold text-[#F7931E]">View offers</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {openCompany && <CompanyProfile company={openCompany} onClose={() => setOpenKey(null)} />}
    </div>
  );
}

function Logo({ name, logo, size = "md" }: { name: string; logo: string | null; size?: "md" | "lg" }) {
  const box = size === "lg" ? "h-16 w-16" : "h-12 w-12";
  if (logo) {
    return (
      <div
        className={`${box} flex flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-1.5 ring-1 ring-slate-200`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo} alt={`${name} logo`} className="h-full w-full object-contain" />
      </div>
    );
  }
  return (
    <div
      className={`${box} flex flex-shrink-0 items-center justify-center rounded-xl bg-[#0F2438] text-xl font-bold text-white`}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function CompanyProfile({ company, onClose }: { company: Company; onClose: () => void }) {
  const [votes, setVotes] = useState<Record<string, boolean>>({});
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";

    supabase.auth.getUser().then(({ data: u }) => {
      if (!u.user) return;
      setUserId(u.user.id);
      supabase
        .from("reward_feedback")
        .select("offer_id, worked")
        .eq("user_id", u.user.id)
        .in(
          "offer_id",
          company.offers.map((o) => o.id)
        )
        .then(({ data }) => {
          const map: Record<string, boolean> = {};
          (data ?? []).forEach((r: { offer_id: string; worked: boolean }) => (map[r.offer_id] = r.worked));
          setVotes(map);
        });
    });

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [company, onClose]);

  async function vote(offerId: string, worked: boolean) {
    setVotes((v) => ({ ...v, [offerId]: worked }));
    if (!userId) return;
    await supabase
      .from("reward_feedback")
      .upsert({ offer_id: offerId, user_id: userId, worked }, { onConflict: "offer_id,user_id" });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#0F2438]/60 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${company.name} offers`}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white sm:max-w-xl sm:rounded-2xl"
      >
        <div className="sticky top-0 z-10 flex items-center gap-4 border-b border-slate-100 bg-white p-5">
          <Logo name={company.name} logo={company.logo} size="lg" />
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-xl font-bold text-[#0F2438]">{company.name}</h2>
            <p className="text-sm text-slate-500">
              {company.isLocal && company.location ? `Local · ${company.location}` : company.category} ·{" "}
              {summary(company)}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-2xl text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            ×
          </button>
        </div>

        <ul className="divide-y divide-slate-100">
          {company.offers.map((o) => (
            <OfferRow
              key={o.id}
              offer={o}
              companyName={company.name}
              vote={votes[o.id]}
              onVote={(worked) => vote(o.id, worked)}
            />
          ))}
        </ul>
      </div>
    </div>
  );
}

function OfferRow({
  offer,
  companyName,
  vote,
  onVote,
}: {
  offer: Offer;
  companyName: string;
  vote: boolean | undefined;
  onVote: (worked: boolean) => void;
}) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [clicked, setClicked] = useState(false);

  async function recordClick() {
    if (clicked) return;
    setClicked(true);
    await supabase.from("reward_clicks").insert({ offer_id: offer.id });
  }

  function reveal() {
    setRevealed(true);
    recordClick();
  }

  async function copy() {
    if (!offer.discount_code) return;
    try {
      await navigator.clipboard.writeText(offer.discount_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard blocked; the code is on screen to copy by hand
    }
  }

  const ends = endsText(offer.expires_at);
  const isCode = hasCode(offer);
  const isInStore = offer.offer_type === "in_store";
  const tag = isCode ? "Code" : isInStore ? "In store" : "Deal";

  return (
    <li className="p-5">
      <span
        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
          isCode ? "bg-[#F7931E]/15 text-[#b8660b]" : "bg-slate-100 text-slate-600"
        }`}
      >
        {tag}
      </span>
      <p className="mt-2 text-lg font-bold leading-snug text-[#0F2438]">{offer.title}</p>
      {offer.description && <p className="mt-1 text-sm leading-relaxed text-slate-600">{offer.description}</p>}
      {ends && <p className="mt-2 text-xs font-medium text-[#b8660b]">{ends}</p>}

      {isCode && !revealed && (
        <button
          onClick={reveal}
          className="mt-4 w-full rounded-xl bg-[#F7931E] py-3 font-semibold text-white hover:bg-[#e2841a]"
        >
          Reveal code
        </button>
      )}

      {isCode && revealed && (
        <div className="mt-4 flex items-stretch overflow-hidden rounded-xl border-2 border-dashed border-[#F7931E]">
          <span className="flex-1 px-4 py-3 text-xl font-bold tracking-wider text-[#0F2438]">{offer.discount_code}</span>
          <button onClick={copy} className="bg-[#F7931E] px-5 font-semibold text-white hover:bg-[#e2841a]">
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      )}

      {isInStore && (
        <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">
          Show this screen at the till to get the discount.
          {offer.discount_code && (
            <span className="mt-2 block text-lg font-bold tracking-wider text-[#0F2438]">{offer.discount_code}</span>
          )}
        </div>
      )}

      {offer.link_url && (!isCode || revealed) && (
        <Link
          href={offer.link_url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={recordClick}
          className={`mt-3 block rounded-xl py-3 text-center font-semibold text-white ${
            isCode || isInStore ? "bg-[#0F2438] hover:bg-[#1a3552]" : "bg-[#F7931E] hover:bg-[#e2841a]"
          }`}
        >
          {isCode || isInStore ? `Go to ${companyName}` : "Get deal"}
        </Link>
      )}

      {offer.terms && <p className="mt-3 text-xs leading-relaxed text-slate-500">{offer.terms}</p>}

      {(revealed || !isCode) && (
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-slate-600">{vote === undefined ? "Did it work?" : "Thanks for letting us know."}</span>
          <button
            onClick={() => onVote(true)}
            className={`rounded-lg px-3 py-1.5 font-medium ring-1 ${
              vote === true ? "bg-green-600 text-white ring-green-600" : "text-slate-700 ring-slate-300 hover:bg-slate-50"
            }`}
          >
            Yes
          </button>
          <button
            onClick={() => onVote(false)}
            className={`rounded-lg px-3 py-1.5 font-medium ring-1 ${
              vote === false ? "bg-red-600 text-white ring-red-600" : "text-slate-700 ring-slate-300 hover:bg-slate-50"
            }`}
          >
            No
          </button>
        </div>
      )}
    </li>
  );
}