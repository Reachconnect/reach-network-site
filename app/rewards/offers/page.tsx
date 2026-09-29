"use client";
import { useEffect, useMemo, useState } from "react";
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

export default function OffersPage() {
  const { me, loading, signOut } = useRewardsUser("member");
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState<Offer | null>(null);

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

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(offers.map((o) => o.category))).sort()],
    [offers]
  );

  if (loading || !me) return <Loading />;

  const featured = offers.filter((o) => o.is_featured);
  const q = search.trim().toLowerCase();
  const filtered = offers.filter(
    (o) =>
      (category === "All" || o.category === category) &&
      (!q ||
        o.retailer.toLowerCase().includes(q) ||
        o.title.toLowerCase().includes(q) ||
        (o.location || "").toLowerCase().includes(q))
  );
  const firstName = me.name.split(" ")[0];

  return (
    <div className="min-h-screen bg-slate-50">
      <RewardsHeader me={me} onSignOut={signOut} />

      <div className="bg-[#0F2438] pb-10 text-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h1 className="text-3xl font-bold">Hi {firstName}</h1>
          <p className="mt-1 text-white/75">
            {offers.length} {offers.length === 1 ? "offer" : "offers"} available
            {me.member?.companyName ? ` through ${me.member.companyName}` : ""}.
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
        ) : offers.length === 0 ? (
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
                  {featured.slice(0, 4).map((o) => (
                    <button
                      key={o.id}
                      onClick={() => setOpen(o)}
                      className="flex items-center gap-4 rounded-2xl bg-white p-5 text-left ring-2 ring-[#F7931E]/40 hover:ring-[#F7931E]"
                    >
                      <Logo offer={o} size="lg" />
                      <div className="min-w-0">
                        <p className="text-sm text-slate-500">{o.retailer}</p>
                        <p className="text-lg font-bold leading-snug text-[#0F2438]">{o.title}</p>
                        {endsText(o.expires_at) && (
                          <p className="mt-1 text-xs font-medium text-[#b8660b]">{endsText(o.expires_at)}</p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )}

            <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium ${
                    category === c
                      ? "bg-[#0F2438] text-white"
                      : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            {filtered.length === 0 ? (
              <p className="py-12 text-center text-sm text-slate-600">
                No offers match that. Try another search or category.
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => setOpen(o)}
                    className="flex flex-col rounded-2xl bg-white p-5 text-left ring-1 ring-slate-200 hover:ring-[#0F2438]/40"
                  >
                    <div className="flex items-center gap-3">
                      <Logo offer={o} />
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-[#0F2438]">{o.retailer}</p>
                        <p className="text-xs text-slate-500">
                          {o.source === "local" && o.location ? `Local · ${o.location}` : o.category}
                        </p>
                      </div>
                    </div>
                    <p className="mt-4 text-lg font-bold leading-snug text-[#0F2438]">{o.title}</p>
                    <div className="mt-auto flex items-center justify-between pt-4 text-xs">
                      <span className="font-medium text-slate-500">{endsText(o.expires_at) ?? "Ongoing"}</span>
                      <span className="font-semibold text-[#F7931E]">
                        {o.offer_type === "code" ? "Get code" : o.offer_type === "in_store" ? "How to use" : "Go to offer"}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {open && <OfferDetail offer={open} onClose={() => setOpen(null)} />}
    </div>
  );
}

function Logo({ offer, size = "md" }: { offer: Offer; size?: "md" | "lg" }) {
  const cls = size === "lg" ? "h-16 w-16 text-2xl" : "h-11 w-11 text-lg";
  return (
    <div
      className={`${cls} flex flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#0F2438] font-bold text-white`}
    >
      {offer.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={offer.image_url} alt="" className="h-full w-full object-cover" />
      ) : (
        offer.retailer.charAt(0).toUpperCase()
      )}
    </div>
  );
}

function OfferDetail({ offer, onClose }: { offer: Offer; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const [vote, setVote] = useState<boolean | null>(null);
  const [clicked, setClicked] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    supabase.auth.getUser().then(({ data: u }) => {
      if (!u.user) return;
      supabase
        .from("reward_feedback")
        .select("worked")
        .eq("offer_id", offer.id)
        .eq("user_id", u.user.id)
        .maybeSingle()
        .then(({ data }) => data && setVote(data.worked));
    });
    return () => window.removeEventListener("keydown", onKey);
  }, [offer.id, onClose]);

  async function recordClick() {
    if (clicked) return;
    setClicked(true);
    await supabase.from("reward_clicks").insert({ offer_id: offer.id });
  }

  async function copyCode() {
    if (!offer.discount_code) return;
    try {
      await navigator.clipboard.writeText(offer.discount_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard blocked; the code is still on screen to copy by hand
    }
    recordClick();
  }

  async function sendVote(worked: boolean) {
    setVote(worked);
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;
    await supabase
      .from("reward_feedback")
      .upsert({ offer_id: offer.id, user_id: data.user.id, worked }, { onConflict: "offer_id,user_id" });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#0F2438]/60 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white p-6 sm:max-w-lg sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Logo offer={offer} />
            <div>
              <p className="font-semibold text-[#0F2438]">{offer.retailer}</p>
              <p className="text-xs text-slate-500">
                {offer.source === "local" && offer.location ? `Local · ${offer.location}` : offer.category}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-2xl leading-none text-slate-400 hover:text-slate-700"
          >
            ×
          </button>
        </div>

        <h2 className="mt-5 text-2xl font-bold leading-snug text-[#0F2438]">{offer.title}</h2>
        {offer.description && <p className="mt-2 leading-relaxed text-slate-600">{offer.description}</p>}

        {offer.offer_type === "code" && offer.discount_code && (
          <div className="mt-6">
            <p className="mb-2 text-sm font-medium text-slate-700">Your code</p>
            <div className="flex items-stretch overflow-hidden rounded-xl border-2 border-dashed border-[#F7931E]">
              <span className="flex-1 px-4 py-3 text-xl font-bold tracking-wider text-[#0F2438]">
                {offer.discount_code}
              </span>
              <button onClick={copyCode} className="bg-[#F7931E] px-5 font-semibold text-white hover:bg-[#e2841a]">
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
        )}

        {offer.offer_type === "in_store" && (
          <div className="mt-6 rounded-xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">
            Show this screen at the till to get the discount.
            {offer.discount_code && (
              <span className="mt-2 block text-lg font-bold tracking-wider text-[#0F2438]">{offer.discount_code}</span>
            )}
          </div>
        )}

        {offer.link_url && (
          
            href={offer.link_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={recordClick}
            className="mt-4 block rounded-xl bg-[#0F2438] py-3.5 text-center font-semibold text-white hover:bg-[#1a3552]"
          >
            Go to {offer.retailer}
          </a>
        )}

        {offer.terms && <p className="mt-5 text-xs leading-relaxed text-slate-500">{offer.terms}</p>}
        {endsText(offer.expires_at) && (
          <p className="mt-2 text-xs font-medium text-slate-500">{endsText(offer.expires_at)}</p>
        )}

        <div className="mt-6 border-t border-slate-100 pt-5">
          <p className="text-sm font-medium text-slate-700">
            {vote === null ? "Did this offer work for you?" : "Thanks, that helps other members."}
          </p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => sendVote(true)}
              className={`rounded-lg px-4 py-2 text-sm font-medium ring-1 ${
                vote === true ? "bg-green-600 text-white ring-green-600" : "text-slate-700 ring-slate-300 hover:bg-slate-50"
              }`}
            >
              Yes, it worked
            </button>
            <button
              onClick={() => sendVote(false)}
              className={`rounded-lg px-4 py-2 text-sm font-medium ring-1 ${
                vote === false ? "bg-red-600 text-white ring-red-600" : "text-slate-700 ring-slate-300 hover:bg-slate-50"
              }`}
            >
              No, it didn&apos;t
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}