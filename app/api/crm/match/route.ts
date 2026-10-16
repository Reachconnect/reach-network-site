// POST /api/crm/match: rank candidates for a job
import { NextResponse } from "next/server";
import { admin, requireAgency } from "@/lib/crmServer";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MODEL = process.env.AI_MODEL || "claude-sonnet-5-5";
const POOL = 150;

type Cand = {
  id: string;
  first_name: string;
  last_name: string | null;
  job_title: string | null;
  current_employer: string | null;
  location: string | null;
  postcode: string | null;
  salary_expectation: string | null;
  notice_period: string | null;
  job_type: string;
  rating: number | null;
  specialism_id: string | null;
  cv_data: { headline?: string; skills?: string[]; qualifications?: string[]; summary?: string } | null;
};

// "B61 8ES" / "B618ES" / "B61" → "B61"
function outcode(pc: string | null | undefined) {
  const s = String(pc || "").toUpperCase().replace(/\s+/g, " ").trim();
  if (!s) return null;
  if (s.includes(" ")) return s.split(" ")[0];
  if (/^[A-Z]{1,2}\d[A-Z\d]?\d[A-Z]{2}$/.test(s)) return s.slice(0, -3);
  if (/^[A-Z]{1,2}\d[A-Z\d]?$/.test(s)) return s;
  return null;
}

async function locate(codes: string[]) {
  const found = new Map<string, { lat: number; lng: number }>();
  const unique = [...new Set(codes)].slice(0, 150);
  await Promise.all(
    unique.map(async (code) => {
      try {
        const res = await fetch(`https://api.postcodes.io/outcodes/${encodeURIComponent(code)}`);
        const j = await res.json();
        if (j?.result?.latitude) found.set(code, { lat: j.result.latitude, lng: j.result.longitude });
      } catch {
        // skip
      }
    })
  );
  return found;
}

function miles(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 3958.8;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}

export async function POST(request: Request) {
  if (!(await requireAgency(request))) return NextResponse.json({ error: "Please log in again." }, { status: 401 });
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return NextResponse.json({ error: "AI matching isn't set up yet." }, { status: 500 });

  const { jobId, wide } = await request.json().catch(() => ({}));
  const db = admin();

  const { data: job } = await db.from("crm_jobs").select("*, crm_companies(name)").eq("id", jobId).maybeSingle();
  if (!job) return NextResponse.json({ error: "Job not found." }, { status: 404 });

  // Who's already on the shortlist
  const { data: listed } = await db.from("crm_job_candidates").select("candidate_id").eq("job_id", job.id);
  const skip = new Set((listed ?? []).map((r: { candidate_id: string }) => r.candidate_id));

  let q = db
    .from("crm_candidates")
    .select("id, first_name, last_name, job_title, current_employer, location, postcode, salary_expectation, notice_period, job_type, rating, specialism_id, cv_data")
    .not("stage", "in", "(placed,not_suitable)")
    .order("updated_at", { ascending: false })
    .limit(POOL + skip.size);
  if (job.specialism_id && !wide) q = q.eq("specialism_id", job.specialism_id);
  const { data: rows } = await q;
  const pool = ((rows ?? []) as Cand[]).filter((c) => !skip.has(c.id)).slice(0, POOL);
  if (!pool.length) return NextResponse.json({ matches: [], considered: 0 });

  // A short note for anyone whose CV hasn't been read in full
  const needNotes = pool.filter((c) => !c.cv_data).map((c) => c.id);
  const firstNote = new Map<string, string>();
  if (needNotes.length) {
    const { data: notes } = await db
      .from("crm_notes")
      .select("candidate_id, body")
      .in("candidate_id", needNotes)
      .eq("kind", "note")
      .order("created_at", { ascending: true })
      .limit(needNotes.length * 3);
    for (const n of (notes ?? []) as { candidate_id: string; body: string }[]) {
      if (!firstNote.has(n.candidate_id)) firstNote.set(n.candidate_id, n.body.slice(0, 400));
    }
  }

  // Distances from the job
  const jobCode = outcode(job.postcode);
  const places = await locate([jobCode, ...pool.map((c) => outcode(c.postcode))].filter(Boolean) as string[]);
  const jobPlace = jobCode ? places.get(jobCode) : undefined;
  const distance = new Map<string, number>();
  if (jobPlace) {
    for (const c of pool) {
      const p = places.get(outcode(c.postcode) || "");
      if (p) distance.set(c.id, miles(jobPlace, p));
    }
  }

  // Work details only: no names or contact details go to the AI
  const profiles = pool.map((c) => ({
    id: c.id,
    current_role: c.job_title || undefined,
    employer: c.current_employer || undefined,
    location: c.location || undefined,
    miles_away: distance.get(c.id),
    salary_expectation: c.salary_expectation || undefined,
    notice: c.notice_period || undefined,
    wants: c.job_type,
    our_rating: c.rating || undefined,
    headline: c.cv_data?.headline || undefined,
    tickets: c.cv_data?.qualifications?.join(", ").slice(0, 300) || undefined,
    skills: c.cv_data?.skills?.join(", ").slice(0, 300) || undefined,
    notes: !c.cv_data ? firstNote.get(c.id) : undefined,
  }));

  const salary =
    job.salary_from || job.salary_to
      ? `£${job.salary_from ?? job.salary_to} to £${job.salary_to ?? job.salary_from}${job.salary_notes ? ` (${job.salary_notes})` : ""}`
      : job.salary_notes || "not given";

  const system = `You help a UK recruitment agency shortlist candidates for a permanent job. Score each candidate's fit from 0 to 100.

Weigh, in order: relevant experience and job title; required skills, tickets and licences; distance (under 20 miles is good, 20 to 40 is a stretch, over 40 usually rules them out unless the role involves travel); salary expectation against the range; whether they want perm work; notice period; the agency's own star rating as a tie-breaker.

Reply with JSON only, no other text:
{"matches": [{"id": "", "score": 0, "reason": "", "concern": ""}]}

Rules:
- Return up to 15 candidates scoring 40 or more, best first. It's fine to return fewer, or none.
- reason: one line, under 20 words, British English, specific (years, tickets, distance).
- concern: under 12 words if there's a real drawback (salary, distance, notice, missing ticket), otherwise empty.
- Only use the information given. Never invent experience.`;

  const user = `The job:
Title: ${job.title}
Client: ${job.crm_companies?.name ?? "not given"}
Location: ${[job.location, job.postcode].filter(Boolean).join(", ") || "not given"}
Salary: ${salary}
Details: ${(job.description || "none").slice(0, 2000)}

Candidates (${profiles.length}):
${JSON.stringify(profiles)}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model: MODEL, max_tokens: 3000, system, messages: [{ role: "user", content: user }] }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    console.error("Matching failed:", data);
    return NextResponse.json({ error: "Matching didn't work just now. Try again in a moment." }, { status: 502 });
  }

  const text = ((data?.content ?? []) as { type: string; text?: string }[])
    .filter((b) => b.type === "text")
    .map((b) => b.text || "")
    .join("\n")
    .replace(/```json|```/g, "");
  let parsed: { matches?: { id: string; score: number; reason?: string; concern?: string }[] } = {};
  try {
    parsed = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));
  } catch {
    return NextResponse.json({ error: "Matching didn't work just now. Try again in a moment." }, { status: 502 });
  }

  const byId = new Map(pool.map((c) => [c.id, c]));
  const matches = (parsed.matches ?? [])
    .filter((m) => byId.has(m.id))
    .slice(0, 15)
    .map((m) => {
      const c = byId.get(m.id)!;
      return {
        id: c.id,
        name: [c.first_name, c.last_name].filter(Boolean).join(" "),
        job_title: c.job_title,
        location: c.location,
        salary_expectation: c.salary_expectation,
        miles: distance.get(c.id) ?? null,
        score: Math.max(0, Math.min(100, Math.round(Number(m.score) || 0))),
        reason: String(m.reason || "").slice(0, 200),
        concern: String(m.concern || "").slice(0, 120),
      };
    })
    .sort((a, b) => b.score - a.score);

  return NextResponse.json({ matches, considered: pool.length });
}