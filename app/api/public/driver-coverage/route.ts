// GET /api/public/driver-coverage: where our registered drivers are, by postcode area (public, rounded counts, no personal details)
import { NextResponse } from "next/server";
import { admin } from "@/lib/crmServer";

export const revalidate = 3600;

const CLASS1 = /class ?1\b|c ?\+ ?e\b|\bc\/e\b|cat(egory)? ?ce\b|artic|trunk|tramp/;
const CLASS2 = /class ?2\b|\bcat(egory)? ?c\b|rigid|lgv ?2|hgv ?2/;
const DELIVERY = /\bvan\b|multi[- ]?drop|7\.5|courier|deliver|3\.5|light goods|parcel|\bc1\b/;
const DRIVER = /driv|hgv|lgv|class ?[12]|\bvan\b|courier|deliver|multi[- ]?drop|7\.5/;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any;

export async function GET() {
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

  type Bucket = { lat: number; lng: number; n: number; class1: number; class2: number; delivery: number; names: Map<string, number> };
  const areas = new Map<string, Bucket>();
  let total = 0;
  for (const r of rows) {
    const spec = Array.isArray(r.crm_specialisms) ? r.crm_specialisms[0]?.name : r.crm_specialisms?.name;
    const text = `${spec || ""} ${r.job_title || ""}`.toLowerCase();
    if (!DRIVER.test(text)) continue;
    const pc = String(r.postcode || "").toUpperCase().match(/^([A-Z]{1,2})\d/);
    if (!pc) continue;
    total++;
    const key = pc[1];
    const b = areas.get(key) || { lat: 0, lng: 0, n: 0, class1: 0, class2: 0, delivery: 0, names: new Map() };
    b.lat += Number(r.latitude);
    b.lng += Number(r.longitude);
    b.n++;
    if (CLASS1.test(text)) b.class1++;
    else if (CLASS2.test(text)) b.class2++;
    if (DELIVERY.test(text)) b.delivery++;
    const town = String(r.location || "").split(",")[0].trim().replace(/\b\w/g, (c) => c.toUpperCase());
    if (town && town.length < 30) b.names.set(town, (b.names.get(town) || 0) + 1);
    areas.set(key, b);
  }

  // Rounded, and small areas left out, so nobody can be picked out
  const round = (n: number) => (n >= 100 ? Math.floor(n / 50) * 50 : n >= 20 ? Math.floor(n / 10) * 10 : n >= 5 ? 5 : 0);
  const out = Array.from(areas.entries())
    .filter(([, b]) => b.n >= 5)
    .map(([key, b]) => ({
      key,
      label: Array.from(b.names.entries()).sort((a, c) => c[1] - a[1])[0]?.[0] || key,
      lat: Math.round((b.lat / b.n) * 100) / 100,
      lng: Math.round((b.lng / b.n) * 100) / 100,
      all: round(b.n),
      class1: round(b.class1),
      class2: round(b.class2),
      delivery: round(b.delivery),
    }))
    .sort((a, c) => c.all - a.all);

  return NextResponse.json({ areas: out, total: total >= 100 ? Math.floor(total / 50) * 50 : round(total) }, { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
}
