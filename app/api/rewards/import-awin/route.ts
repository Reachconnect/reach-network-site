// Pulls discount codes AND code-free deals from Awin brands that have accepted
// Reach Rewards (UK only), with each brand's logo.
// Runs nightly via Vercel Cron, or from the admin button.
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getCaller } from "@/lib/rewardsAuth";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

const GONE = "Not in the latest Awin import";

type AwinOffer = {
  promotionId: number | string;
  type?: string;
  advertiser?: { id?: number; name?: string; joined?: boolean };
  title?: string;
  description?: string;
  terms?: string;
  startDate?: string;
  endDate?: string;
  urlTracking?: string;
  categories?: unknown;
  voucher?: { code?: string | null; exclusive?: boolean } | null;
};

const CATEGORY_RULES: [RegExp, string][] = [
  [/grocer|supermarket/i, "Groceries"],
  [/fashion|cloth|shoe|footwear|trainer|sportswear|menswear|womenswear|men'?s|women'?s|jewel|accessor|workwear/i, "Shopping"],
  [/fuel|tyre|motor|vehicle|car |cars|breakdown|garage|auto/i, "Fuel & motoring"],
  [/takeaway|restaurant|food|drink|coffee|wine|beer|spirit|sweet|meal/i, "Food & drink"],
  [/holiday|hotel|flight|airport|travel|cottage|cabin/i, "Travel"],
  [/cinema|ticket|attraction|theme park|day out|days out|experience|event|entertainment/i, "Days out"],
  [/gym|fitness|sport|health|wellbeing|vitamin|beauty/i, "Health & fitness"],
  [/home|garden|furniture|bed|mattress|kitchen|diy|appliance|blender/i, "Home"],
];

function categoryFor(o: AwinOffer) {
  const text = [o.title, o.description, o.advertiser?.name, JSON.stringify(o.categories ?? "")].join(" ");
  for (const [re, cat] of CATEGORY_RULES) if (re.test(text)) return cat;
  return "Shopping";
}

function codeFromText(text: string) {
  const match = text.match(/\b[Cc][Oo][Dd][Ee]\b[:\s]*["“'‘]?([A-Z0-9][A-Z0-9-]{2,24})\b/);
  if (!match) return null;
  const code = match[1];
  return /[A-Z]/.test(code) || /\d/.test(code) ? code : null;
}

function codeFor(o: AwinOffer) {
  const direct = o.voucher?.code?.trim();
  if (direct) return direct;
  return codeFromText(`${o.title ?? ""} ${o.description ?? ""} ${o.terms ?? ""}`);
}

function toIso(value?: string) {
  if (!value) return null;
  const d = new Date(value.includes("T") ? value : value.replace(" ", "T"));
  return isNaN(d.getTime()) ? null : d.toISOString();
}

const nameKey = (name?: string) => (name || "").toLowerCase().replace(/[^a-z0-9]/g, "");

async function isAllowed(req: Request) {
  const header = req.headers.get("authorization") || "";
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && header === `Bearer ${cronSecret}`) return true;
  const caller = await getCaller(req);
  return !!caller?.isAgency;
}

async function fetchJoinedUkOffers(publisherId: string, token: string) {
  const all: AwinOffer[] = [];
  for (let page = 1; page <= 25; page++) {
    const res = await fetch(`https://api.awin.com/publisher/${publisherId}/promotions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        filters: { membership: "joined", type: "all", status: "active", regionCodes: ["GB"] },
        pagination: { page, pageSize: 200 },
      }),
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`Awin returned ${res.status}: ${(await res.text()).slice(0, 300)}`);
    }
    const json = await res.json();
    const rows: AwinOffer[] = json.data ?? [];
    all.push(...rows);
    const total = Number(json.pagination?.total ?? rows.length);
    if (rows.length === 0 || all.length >= total) break;
  }
  return all;
}

async function fetchLogos(publisherId: string, token: string) {
  const byId = new Map<string, string>();
  const byName = new Map<string, string>();
  let problem: string | null = null;

  try {
    const url =
      `https://api.awin.com/publishers/${publisherId}/programmes` +
      `?relationship=joined&accessToken=${encodeURIComponent(token)}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });

    if (!res.ok) {
      problem = `Awin logos request returned ${res.status}: ${(await res.text()).slice(0, 200)}`;
    } else {
      const rows = await res.json();
      const list = Array.isArray(rows) ? rows : [];
      for (const p of list) {
        const logo = typeof p.logoUrl === "string" ? p.logoUrl.trim() : "";
        if (!/^https?:\/\//i.test(logo)) continue;
        if (p.id) byId.set(String(p.id), logo);
        if (p.name) byName.set(nameKey(p.name), logo);
      }
      if (list.length === 0) problem = "Awin returned no joined programmes for logos yet.";
    }
  } catch (e) {
    problem = `Couldn't reach Awin for logos: ${(e as Error).message}`;
  }

  return { byId, byName, problem };
}

async function runImport() {
  const publisherId = process.env.AWIN_PUBLISHER_ID;
  const token = process.env.AWIN_API_TOKEN;
  if (!publisherId || !token) throw new Error("AWIN_PUBLISHER_ID or AWIN_API_TOKEN is missing.");

  const [fetched, logos] = await Promise.all([
    fetchJoinedUkOffers(publisherId, token),
    fetchLogos(publisherId, token),
  ]);
  const now = new Date();
  const nowIso = now.toISOString();

  // Usable: joined brand, a tracked link, not expired. Code is optional (deals have none).
  const usable = fetched
    .map((o) => ({ offer: o, code: codeFor(o) }))
    .filter(({ offer }) => {
      const link = offer.urlTracking?.trim();
      const end = toIso(offer.endDate);
      return (
        offer.advertiser?.joined !== false &&
        !!(offer.title || offer.description) &&
        !!link &&
        /^https?:\/\//i.test(link) &&
        (!end || new Date(end) > now)
      );
    });

  const { data: existingRows, error: existingError } = await supabaseAdmin
    .from("reward_offers")
    .select("id, external_id")
    .eq("source", "awin");
  if (existingError) throw new Error(existingError.message);
  const existingIds = new Set((existingRows ?? []).map((r: { external_id: string }) => r.external_id));

  const toInsert: Record<string, unknown>[] = [];
  const toUpdate: Record<string, unknown>[] = [];
  const companiesWithLogo = new Set<string>();
  let codeCount = 0;
  let dealCount = 0;

  for (const { offer: o, code } of usable) {
    const externalId = String(o.promotionId);
    const title = (o.title || o.description || "Offer").trim().slice(0, 200);
    const description =
      o.description && o.description.trim() !== title ? o.description.trim().slice(0, 1000) : null;
    const logo =
      (o.advertiser?.id ? logos.byId.get(String(o.advertiser.id)) : undefined) ??
      logos.byName.get(nameKey(o.advertiser?.name));

    if (code) codeCount++;
    else dealCount++;

    const content: Record<string, unknown> = {
      source: "awin",
      external_id: externalId,
      title,
      retailer: (o.advertiser?.name || "Retailer").trim(),
      description,
      offer_type: code ? "code" : "link",
      discount_code: code || null,
      link_url: o.urlTracking!.trim(),
      terms: o.terms?.trim().slice(0, 2000) || null,
      starts_at: toIso(o.startDate),
      expires_at: toIso(o.endDate),
      last_seen_at: nowIso,
    };
    if (logo) {
      content.image_url = logo;
      companiesWithLogo.add(nameKey(o.advertiser?.name));
    }

    if (existingIds.has(externalId)) toUpdate.push(content);
    else toInsert.push({ ...content, category: categoryFor(o), is_active: true });
  }

  if (toInsert.length) {
    const { error } = await supabaseAdmin.from("reward_offers").insert(toInsert);
    if (error) throw new Error(`Adding offers failed: ${error.message}`);
  }

  const withLogo = toUpdate.filter((r) => "image_url" in r);
  const withoutLogo = toUpdate.filter((r) => !("image_url" in r));
  for (const batch of [withLogo, withoutLogo]) {
    if (!batch.length) continue;
    const { error } = await supabaseAdmin
      .from("reward_offers")
      .upsert(batch, { onConflict: "source,external_id" });
    if (error) throw new Error(`Updating offers failed: ${error.message}`);
  }

  const seenIds = usable.map(({ offer }) => String(offer.promotionId));

  if (seenIds.length) {
    await supabaseAdmin
      .from("reward_offers")
      .update({ is_active: true, hidden_reason: null })
      .eq("source", "awin")
      .eq("hidden_reason", GONE)
      .in("external_id", seenIds);
  }

  let hideQuery = supabaseAdmin
    .from("reward_offers")
    .update({ is_active: false, hidden_reason: GONE })
    .eq("source", "awin")
    .eq("is_active", true);
  if (seenIds.length) hideQuery = hideQuery.not("external_id", "in", `(${seenIds.join(",")})`);
  const { data: hidden } = await hideQuery.select("id");

  const companies = new Set(usable.map(({ offer }) => nameKey(offer.advertiser?.name))).size;

  return {
    checked: fetched.length,
    added: toInsert.length,
    updated: toUpdate.length,
    removed: hidden?.length ?? 0,
    companies,
    logos: companiesWithLogo.size,
    codes: codeCount,
    deals: dealCount,
    logoProblem: logos.problem,
  };
}

async function handle(req: Request) {
  if (!(await isAllowed(req))) {
    return NextResponse.json({ error: "Not allowed." }, { status: 401 });
  }
  try {
    const result = await runImport();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;