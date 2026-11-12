// POST /api/crm/geocode: work out map locations for candidates who don't have one yet
import { NextResponse } from "next/server";
import { admin, requireAgency } from "@/lib/crmServer";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BATCH = 400;
const API = "https://api.postcodes.io";
const FULL = /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/;
const OUTCODE = /^[A-Z]{1,2}\d[A-Z\d]?$/;
const PLACE_TYPES = ["City", "Town", "Village", "Hamlet", "Suburban Area", "Other Settlement"];

type Row = { id: string; postcode: string | null; location: string | null };
type Spot = { lat: number; lng: number; label: string } | null;
type Key = { kind: "postcode" | "outcode" | "place"; value: string } | null;

const clean = (v: string | null) => String(v || "").toUpperCase().replace(/\s+/g, " ").trim();

// Use the postcode if there is one; sometimes a postcode is typed into the town box instead
function keyFor(r: Row): Key {
  const candidates = [clean(r.postcode), clean(r.location)];
  for (const pc of candidates) {
    if (!pc) continue;
    if (FULL.test(pc)) return { kind: "postcode", value: pc.replace(/\s/g, "") };
    const first = pc.split(" ")[0];
    if (OUTCODE.test(pc) || (OUTCODE.test(first) && pc.length <= 8)) return { kind: "outcode", value: first };
  }
  const town = String(r.location || "").split(",")[0].trim();
  return town.length >= 2 ? { kind: "place", value: town.toLowerCase() } : null;
}

async function chunks<T>(items: T[], size: number, fn: (part: T[]) => Promise<void>) {
  for (let i = 0; i < items.length; i += size) await fn(items.slice(i, i + size));
}

export async function POST(request: Request) {
  if (!(await requireAgency(request))) return NextResponse.json({ error: "Please log in again." }, { status: 401 });
  const db = admin();

  const { data, error } = await db.from("crm_candidates").select("id, postcode, location").is("geocoded_at", null).limit(BATCH);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const rows = (data ?? []) as Row[];

  const keys = new Map<string, Row[]>(); // "kind:value" → rows
  const none: string[] = [];
  for (const r of rows) {
    const k = keyFor(r);
    if (!k) {
      none.push(r.id);
      continue;
    }
    const id = `${k.kind}:${k.value}`;
    keys.set(id, [...(keys.get(id) ?? []), r]);
  }

  const found = new Map<string, Spot>();
  const ofKind = (kind: string) => [...keys.keys()].filter((k) => k.startsWith(`${kind}:`)).map((k) => k.slice(kind.length + 1));

  // Full postcodes: 100 at a time
  await chunks(ofKind("postcode"), 100, async (part) => {
    try {
      const res = await fetch(`${API}/postcodes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postcodes: part }),
      });
      const j = await res.json();
      for (const item of j?.result ?? []) {
        const r = item?.result;
        found.set(`postcode:${String(item.query).toUpperCase().replace(/\s/g, "")}`, r ? { lat: r.latitude, lng: r.longitude, label: r.admin_district || r.outcode } : null);
      }
    } catch {
      // try again next time
    }
  });

  // Partial postcodes (e.g. B61) and town names: a few at a time
  await chunks([...ofKind("outcode").map((v) => ["outcode", v]), ...ofKind("place").map((v) => ["place", v])], 15, async (part) => {
    await Promise.all(
      part.map(async ([kind, value]) => {
        try {
          if (kind === "outcode") {
            const j = await (await fetch(`${API}/outcodes/${encodeURIComponent(value)}`)).json();
            const r = j?.result;
            found.set(`outcode:${value}`, r?.latitude ? { lat: r.latitude, lng: r.longitude, label: (r.admin_district ?? [])[0] || value } : null);
          } else {
            const j = await (await fetch(`${API}/places?q=${encodeURIComponent(value)}&limit=10`)).json();
            const list = (j?.result ?? []) as { name_1: string; local_type: string; latitude: number; longitude: number }[];
            const best =
              list.find((p) => p.name_1.toLowerCase() === value && PLACE_TYPES.includes(p.local_type)) ??
              list.find((p) => PLACE_TYPES.includes(p.local_type)) ??
              list[0];
            found.set(`place:${value}`, best ? { lat: best.latitude, lng: best.longitude, label: best.name_1 } : null);
          }
        } catch {
          // try again next time
        }
      })
    );
  });

  // Save: everyone sharing a location is updated together
  const now = new Date().toISOString();
  for (const [key, list] of keys) {
    if (!found.has(key)) continue; // lookup failed, leave for next run
    const spot = found.get(key);
    await db
      .from("crm_candidates")
      .update({ latitude: spot?.lat ?? null, longitude: spot?.lng ?? null, geo_label: spot?.label ?? null, geocoded_at: now })
      .in("id", list.map((r) => r.id));
  }
  if (none.length) await db.from("crm_candidates").update({ geocoded_at: now }).in("id", none);

  const { count } = await db.from("crm_candidates").select("id", { count: "exact", head: true }).is("geocoded_at", null);
  return NextResponse.json({ checked: rows.length, remaining: count ?? 0 });
}