// POST /api/crm/ai-search: describe what a client wants, get ranked candidates back
import { NextResponse } from "next/server";
import { admin, requireAgency } from "@/lib/crmServer";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MODEL = process.env.AI_MODEL || "claude-sonnet-5-5";
const API = "https://api.postcodes.io";

type Brief = {
  role: string;
  keywords: string[];
  location: string;
  radius_miles: number;
  min_years: number | null;
  must_haves: string[];
  job_type: string;
  specialism: string;
};

type Cand = {
  id: string;
  first_name: string;
  last_name: string | null;
  phone: string | null;
  email: string | null;
  job_title: string | null;
  current_employer: string | null;
  location: string | null;
  postcode: string | null;
  salary_expectation: string | null;
  notice_period: string | null;
  job_type: string;
  rating: number | null;
  specialism_id: string | null;
  whatsapp_consent: boolean;
  latitude: number | null;
  longitude: number | null;
};

// Reads JSON out of plain text as safely as possible (the backup route)
function readJson(text: string) {
  const cleaned = text.replace(/```json|```/g, "");
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  const chunk = cleaned.slice(start, end + 1);
  try {
    return JSON.parse(chunk);
  } catch {
    // Common slip: stray line breaks or trailing commas
    try {
      return JSON.parse(chunk.replace(/,\s*([}\]])/g, "$1").replace(/[\u0000-\u001f]+/g, " "));
    } catch {
      return null;
    }
  }
}

// Offers the AI a fixed form (a "tool") to fill in; falls back to reading plain JSON
async function askForm<T>(system: string, user: string, form: { name: string; description: string; schema: object }, maxTokens: number): Promise<T> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("AI search isn't set up yet.");

  let lastError = "The AI didn't respond just now. Try again in a moment.";
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: maxTokens,
          system: `${system}\n\nAlways give your answer by calling the ${form.name} tool. Don't write anything else.`,
          tools: [{ name: form.name, description: form.description, input_schema: form.schema }],
          tool_choice: { type: "auto" },
          messages: [{ role: "user", content: user }],
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const reason = data?.error?.message || `status ${res.status}`;
        console.error("AI search failed:", JSON.stringify(data));
        lastError = `The AI turned the request down: ${reason}`;
        if (res.status !== 429 && res.status < 500) break;
        continue;
      }
      const blocks = (data?.content ?? []) as { type: string; input?: unknown; text?: string }[];
      const tool = blocks.find((b) => b.type === "tool_use");
      if (tool?.input) return tool.input as T;
      // Backup: it answered in text instead
      const fromText = readJson(blocks.filter((b) => b.type === "text").map((b) => b.text || "").join("\n"));
      if (fromText) return fromText as T;
      lastError = "The AI's answer couldn't be read. Try again.";
    } catch {
      lastError = "Lost connection to the AI. Try again.";
    }
  }
  throw new Error(lastError);
}

async function locate(place: string) {
  const s = place.toUpperCase().replace(/\s+/g, " ").trim();
  try {
    if (/^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/.test(s)) {
      const j = await (await fetch(`${API}/postcodes/${encodeURIComponent(s.replace(/\s/g, ""))}`)).json();
      if (j?.result) return { lat: j.result.latitude as number, lng: j.result.longitude as number };
    }
    if (/^[A-Z]{1,2}\d[A-Z\d]?$/.test(s)) {
      const j = await (await fetch(`${API}/outcodes/${encodeURIComponent(s)}`)).json();
      if (j?.result) return { lat: j.result.latitude as number, lng: j.result.longitude as number };
    }
    const j = await (await fetch(`${API}/places?q=${encodeURIComponent(place)}&limit=10`)).json();
    const list = (j?.result ?? []) as { name_1: string; local_type: string; latitude: number; longitude: number }[];
    const best = list.find((p) => p.name_1.toLowerCase() === place.toLowerCase()) ?? list.find((p) => ["City", "Town"].includes(p.local_type)) ?? list[0];
    return best ? { lat: best.latitude, lng: best.longitude } : null;
  } catch {
    return null;
  }
}

function miles(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 3958.8;
  const r = (d: number) => (d * Math.PI) / 180;
  const h = Math.sin(r(b.lat - a.lat) / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(r(b.lng - a.lng) / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}

const FIELDS =
  "id, first_name, last_name, phone, email, job_title, current_employer, location, postcode, salary_expectation, notice_period, job_type, rating, specialism_id, whatsapp_consent, latitude, longitude";

const BRIEF_FORM = {
  name: "search_criteria",
  description: "The search criteria worked out from the recruiter's notes.",
  schema: {
    type: "object",
    properties: {
      role: { type: "string", description: "Short job title, e.g. Tipper Driver" },
      keywords: { type: "array", items: { type: "string" }, description: "4 to 10 lowercase words or phrases likely in matching job titles" },
      location: { type: "string", description: "Town, city or postcode, or an empty string" },
      radius_miles: { type: "number", description: "Distance mentioned, 20 if a location is given without one, 0 if no location" },
      min_years: { type: "number", description: "Minimum years of experience, or 0 if not mentioned" },
      must_haves: { type: "array", items: { type: "string" } },
      job_type: { type: "string", description: "perm, temp, or an empty string" },
      specialism: { type: "string", description: "Best matching specialism from the list, or an empty string" },
    },
    required: ["role", "keywords", "location", "radius_miles", "min_years", "must_haves", "job_type", "specialism"],
  },
};

const RANK_FORM = {
  name: "ranked_candidates",
  description: "The best-matching candidates, best first.",
  schema: {
    type: "object",
    properties: {
      matches: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "string" },
            score: { type: "number" },
            reason: { type: "string" },
            concern: { type: "string" },
          },
          required: ["id", "score", "reason", "concern"],
        },
      },
    },
    required: ["matches"],
  },
};

export async function POST(request: Request) {
  if (!(await requireAgency(request))) return NextResponse.json({ error: "Please log in again." }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const query = String(body.query || "").trim().slice(0, 1000);
  if (query.length < 5) return NextResponse.json({ error: "Describe what the client is after." }, { status: 400 });
  const db = admin();

  try {
    const { data: specs } = await db.from("crm_specialisms").select("id, name");
    const specialisms = (specs ?? []) as { id: string; name: string }[];

    // 1. Understand the request
    const brief = await askForm<Brief>(
      `You turn a recruiter's notes from a client call into search criteria for a UK candidate database.
- role: a short job title, e.g. Tipper Driver.
- keywords: 4 to 10 lowercase words or short phrases likely to appear in matching candidates' job titles, including common UK alternatives (for a tipper driver: tipper, hgv, class 2, class 1, lgv, driver). Letters, numbers and spaces only.
- location: the town, city or postcode mentioned, or an empty string.
- radius_miles: the distance mentioned, or 20 if a location is given without one, or 0 if no location.
- min_years: minimum years of experience if mentioned, otherwise 0.
- must_haves: licences, tickets, skills or conditions the client insists on.
- job_type: perm, temp, or an empty string if not mentioned.
- specialism: the best match from this list, written exactly, or an empty string: ${specialisms.map((s) => s.name).join(", ")}.`,
      query,
      BRIEF_FORM,
      800
    );

    if (!brief.min_years) brief.min_years = null;
    if (body.radius) brief.radius_miles = Math.max(1, Math.min(200, Number(body.radius)));
    const keywords = (Array.isArray(brief.keywords) ? brief.keywords : [])
      .map((k) => String(k).toLowerCase().replace(/[^a-z0-9 ]/g, "").trim())
      .filter((k) => k.length >= 2)
      .slice(0, 10);
    const spec = specialisms.find((s) => s.name.toLowerCase() === String(brief.specialism || "").toLowerCase());
    const centre = brief.location ? await locate(brief.location) : null;

    // 2. Find possible candidates
    const ors = keywords.map((k) => `job_title.ilike.%${k}%`);
    if (spec) ors.push(`specialism_id.eq.${spec.id}`);
    let q = db.from("crm_candidates").select(FIELDS).not("stage", "in", "(placed,not_suitable)").limit(5000);
    if (ors.length) q = q.or(ors.join(","));
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);

    const place = String(brief.location || "").toLowerCase();
    const radius = brief.radius_miles || 20;
    let pool = ((rows ?? []) as Cand[]).map((c) => ({
      c,
      distance: centre && c.latitude !== null && c.longitude !== null ? miles(centre, { lat: c.latitude, lng: c.longitude }) : null,
      hits: keywords.filter((k) => (c.job_title || "").toLowerCase().includes(k)).length,
    }));
    if (centre) {
      pool = pool.filter((p) => (p.distance !== null ? p.distance <= radius : !!place && (p.c.location || "").toLowerCase().includes(place)));
    }
    pool.sort((a, b) => b.hits - a.hits || (a.distance ?? 999) - (b.distance ?? 999));
    pool = pool.slice(0, 120);
    if (!pool.length) return NextResponse.json({ brief: { ...brief, radius_miles: radius }, matches: [], considered: 0 });

    // 3. Extra detail from their CVs
    const ids = pool.map((p) => p.c.id);
    const [{ data: cvs }, { data: notes }] = await Promise.all([
      db.from("crm_candidates").select("id, cv_data").in("id", ids),
      db.from("crm_notes").select("candidate_id, body").in("candidate_id", ids).eq("kind", "note").order("created_at", { ascending: true }).limit(ids.length * 3),
    ]);
    const cvById = new Map(
      ((cvs ?? []) as { id: string; cv_data: { summary?: string; qualifications?: string[] } | null }[]).map((r) => [r.id, r.cv_data])
    );
    const firstNote = new Map<string, string>();
    for (const n of (notes ?? []) as { candidate_id: string; body: string }[]) {
      if (!firstNote.has(n.candidate_id)) firstNote.set(n.candidate_id, n.body.slice(0, 450));
    }

    // 4. Rank them (work details only, no names or contact details)
    const profiles = pool.map(({ c, distance }) => {
      const cv = cvById.get(c.id);
      return {
        id: c.id,
        role: c.job_title || undefined,
        employer: c.current_employer || undefined,
        location: c.location || undefined,
        miles_away: distance ?? undefined,
        salary: c.salary_expectation || undefined,
        notice: c.notice_period || undefined,
        wants: c.job_type,
        rating: c.rating || undefined,
        cv_summary: cv?.summary?.slice(0, 450) || firstNote.get(c.id) || undefined,
        tickets: cv?.qualifications?.join(", ").slice(0, 250) || undefined,
      };
    });

    const ranked = await askForm<{ matches?: { id: string; score: number; reason?: string; concern?: string }[] }>(
      `You help a UK recruiter find candidates for a client. Score each candidate's fit from 0 to 100 against the client's request.
Weigh: matching role and experience; must-haves (licences, tickets, conditions); years of experience (work it out from the CV summary where you can); distance; perm or temp preference; salary; the recruiter's rating as a tie-breaker.
- Return up to 25 candidates scoring 40 or more, best first. Fewer, or none, is fine.
- reason: under 20 words, British English, specific (years, licence, distance). Don't use quotation marks.
- concern: under 12 words if something's missing or unclear (e.g. Years of experience not stated), otherwise an empty string.
- Use only the information given. Never invent experience.`,
      `Client's request: ${query}\n\nCandidates (${profiles.length}):\n${JSON.stringify(profiles)}`,
      RANK_FORM,
      4000
    );

    const byId = new Map(pool.map((p) => [p.c.id, p]));
    const matches = (ranked.matches ?? [])
      .filter((m) => byId.has(m.id))
      .slice(0, 25)
      .map((m) => {
        const { c, distance } = byId.get(m.id)!;
        return {
          id: c.id,
          name: [c.first_name, c.last_name].filter(Boolean).join(" "),
          first_name: c.first_name,
          phone: c.phone,
          job_title: c.job_title,
          location: c.location,
          miles: distance,
          salary_expectation: c.salary_expectation,
          whatsapp_consent: c.whatsapp_consent,
          score: Math.max(0, Math.min(100, Math.round(Number(m.score) || 0))),
          reason: String(m.reason || "").slice(0, 200),
          concern: String(m.concern || "").slice(0, 120),
        };
      })
      .sort((a, b) => b.score - a.score);

    return NextResponse.json({ brief: { ...brief, radius_miles: radius }, matches, considered: pool.length });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message || "Search failed." }, { status: 500 });
  }
}