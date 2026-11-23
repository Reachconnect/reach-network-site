// GET /api/public/coverage?sector=drivers: where our registered candidates are for an industry, by postcode area
// Public, rounded counts, small areas left out, no personal details.
import { NextResponse } from "next/server";
import { admin } from "@/lib/crmServer";
import { SECTORS, type SectorKey } from "@/lib/sectors";

export const dynamic = "force-dynamic";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any;
const round = (n: number) => (n >= 100 ? Math.floor(n / 50) * 50 : n >= 20 ? Math.floor(n / 10) * 10 : n >= 5 ? 5 : 0);

export async function GET(request: Request) {
  const key = (new URL(request.url).searchParams.get("sector") || "drivers") as SectorKey;
  // "all" counts every registered candidate with a postcode
  const sector = (key as string) === "all" ? { any: /[\s\S]*/, types: {} as Record<string, RegExp> } : SECTORS[key];
  if (!sector) return NextResponse.json({ areas: [], total: 0 });
  const db = admin();
  const rows: Row[] = [];
  try {
    for (let from = 0; from < 20000; from += 1000) {
      const { data, error } = await db.from("crm_candidates").select("postcode, location, latitude, longitude, job_title, crm_specialisms(name)").not("latitude", "is", null).range(from, from + 999);
      if (error) throw error;
      rows.push(...(data ?? []));
      if (!data || data.length < 1000) break;
    }
  } catch {
    return NextResponse.json({ areas: [], total: 0 });
  }

  type Bucket = { lat: number; lng: number; n: number; counts: Record<string, number>; names: Map<string, number> };
  const areas = new Map<string, Bucket>();
  let total = 0;
  for (const r of rows) {
    const spec = Array.isArray(r.crm_specialisms) ? r.crm_specialisms[0]?.name : r.crm_specialisms?.name;
    const text = `${spec || ""} ${r.job_title || ""}`.toLowerCase();
    if (!sector.any.test(text)) continue;
    const pc = String(r.postcode || "").toUpperCase().match(/^([A-Z]{1,2})\d/);
    if (!pc) continue;
    total++;
    const b: Bucket = areas.get(pc[1]) ?? { lat: 0, lng: 0, n: 0, counts: {}, names: new Map() };
    b.lat += Number(r.latitude);
    b.lng += Number(r.longitude);
    b.n++;
    for (const [t, re] of Object.entries(sector.types)) if (re.test(text)) b.counts[t] = (b.counts[t] || 0) + 1;
    const town = String(r.location || "").split(",")[0].trim().replace(/\b\w/g, (c) => c.toUpperCase());
    if (town && town.length < 30) b.names.set(town, (b.names.get(town) || 0) + 1);
    areas.set(pc[1], b);
  }

  const out = Array.from(areas.entries())
    .filter(([, b]) => b.n >= 5)
    .map(([k, b]) => ({
      key: k,
      label: Array.from(b.names.entries()).sort((a, c) => c[1] - a[1])[0]?.[0] || k,
      lat: Math.round((b.lat / b.n) * 100) / 100,
      lng: Math.round((b.lng / b.n) * 100) / 100,
      all: round(b.n),
      counts: Object.fromEntries(Object.entries(b.counts).map(([t, n]) => [t, round(n)])),
    }))
    .sort((a, c) => c.all - a.all);

  return NextResponse.json({ areas: out, total: total >= 100 ? Math.floor(total / 50) * 50 : round(total) }, { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
}
