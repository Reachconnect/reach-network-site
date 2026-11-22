// /api/crm/specs: spec pages for prospective clients (agency staff only)
// GET  ?candidateId=...         the specs already sent for a candidate
// POST action "draft"           the AI writes an anonymised draft for a role
// POST action "create"          saves it (one candidate, or a shortlist of up to 5) and returns the link
// POST action "withdraw"        switches a link off
import { NextResponse } from "next/server";
import { admin, requireAgency } from "@/lib/crmServer";
import { cleanContent, newToken, specUrl, type SpecContent } from "@/lib/specs";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MODEL = process.env.AI_MODEL || "claude-sonnet-5-5";

const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });

function milesBetween(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 3958.8;
  const r = (d: number) => (d * Math.PI) / 180;
  const h = Math.sin(r(b.lat - a.lat) / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(r(b.lng - a.lng) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const PROMPT = `You write anonymised candidate profiles that Reach Network Recruitment, a UK recruitment agency, sends to prospective clients (companies that are not yet clients) to show them a strong candidate.

Reply with JSON only, no other text, in exactly this shape:
{"headline": "", "why": "", "checklist": [], "highlights": [], "qualifications": [], "experience": [{"title": "", "period": ""}], "area": "", "availability": ""}

Rules:
- Use only facts in the information given. Never invent or assume anything.
- Anonymise: never include the candidate's surname, phone, email, full address, postcode, date of birth, or the names of any employers. Describe employers generically, e.g. "a national logistics firm".
- headline: one line, e.g. "Class 1 HGV Driver, 10 years' experience, ADR".
- why: two or three sentences, professional British English, explaining why this candidate would suit the employer and role described. If no role is described, explain why they're a strong hire in their field.
- checklist: 3 to 6 short confirmed facts that matter for the role, e.g. "Class 1 (C+E) licence", "Driver CPC", "Lives 12 miles from Worcester". Only include things the information confirms.
- highlights: up to 8 short skills.
- qualifications: licences, tickets and certificates.
- experience: up to 5 roles, most recent first, job title and length or dates only (e.g. "4 years", "2019 to present"). No employer names.
- area: town or area only, e.g. "Worcester".
- availability: e.g. "Immediately", "1 week's notice", or "" if unknown.`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function writeDraft(info: string): Promise<Partial<SpecContent>> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("The AI isn't set up yet.");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model: MODEL, max_tokens: 2000, system: PROMPT, messages: [{ role: "user", content: info }] }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    console.error("Spec draft failed:", data);
    throw new Error("The AI couldn't write the profile just now. Try again in a moment.");
  }
  const text = ((data?.content ?? []) as { type: string; text?: string }[])
    .filter((b) => b.type === "text")
    .map((b) => b.text || "")
    .join("\n")
    .replace(/```json|```/g, "");
  return JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));
}

const CANDIDATE_FIELDS =
  "id, first_name, last_name, job_title, location, salary_expectation, notice_period, job_type, specialism_id, stage, latitude, longitude, cv_data";

export async function GET(request: Request) {
  if (!(await requireAgency(request))) return fail("Please log in again.", 401);
  const candidateId = new URL(request.url).searchParams.get("candidateId");
  if (!candidateId || !/^[0-9a-f-]{36}$/i.test(candidateId)) return fail("Missing candidate.");
  let { data, error } = await admin()
    .from("crm_specs")
    .select("*")
    .or(`candidate_id.eq.${candidateId},candidate_ids.cs.{${candidateId}}`)
    .order("created_at", { ascending: false });
  // Before the shortlist columns are added, fall back to single specs only
  if (error) ({ data, error } = await admin().from("crm_specs").select("*").eq("candidate_id", candidateId).order("created_at", { ascending: false }));
  if (error) return fail(error.message, 500);
  return NextResponse.json({
    specs: (data ?? []).map((s) => ({ ...s, url: specUrl(s.token), candidate_count: Array.isArray(s.candidate_ids) ? s.candidate_ids.length : 1 })),
  });
}

export async function POST(request: Request) {
  const userId = await requireAgency(request);
  if (!userId) return fail("Please log in again.", 401);
  const body = await request.json().catch(() => ({}));
  const db = admin();

  // ---------- Switch a link off ----------
  if (body.action === "withdraw") {
    await db.from("crm_specs").update({ withdrawn: true }).eq("id", body.specId);
    return NextResponse.json({ ok: true });
  }

  const role = String(body.role || "").trim().slice(0, 300);

  // ---------- AI draft (one candidate at a time) ----------
  if (body.action === "draft") {
    const { data: cand } = await db.from("crm_candidates").select(CANDIDATE_FIELDS).eq("id", body.candidateId).maybeSingle();
    if (!cand) return fail("Candidate not found.", 404);
    const [{ data: notes }, { data: spec }] = await Promise.all([
      db.from("crm_notes").select("body").eq("candidate_id", cand.id).eq("kind", "note").order("created_at", { ascending: true }).limit(5),
      cand.specialism_id ? db.from("crm_specialisms").select("name").eq("id", cand.specialism_id).maybeSingle() : Promise.resolve({ data: null }),
    ]);

    const info = [
      role ? `The employer is looking for: ${role}` : "No specific role was described.",
      `Field: ${spec?.name || "unknown"}`,
      `Job title: ${cand.job_title || "unknown"}`,
      `Area: ${cand.location || "unknown"}`,
      `Notice period: ${cand.notice_period || "unknown"}`,
      `Looking for: ${cand.job_type || "unknown"} work`,
      cand.cv_data ? `CV profile:\n${JSON.stringify(cand.cv_data).slice(0, 12000)}` : "No CV profile available.",
      (notes ?? []).length ? `Recruiter notes:\n${(notes ?? []).map((n) => n.body).join("\n---\n").slice(0, 3000)}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    let draft: Partial<SpecContent>;
    try {
      draft = await writeDraft(info);
    } catch (e) {
      return fail((e as Error).message, 502);
    }

    // How many similar candidates are near them
    let more = 0;
    if (cand.specialism_id) {
      const { data: similar } = await db
        .from("crm_candidates")
        .select("id, latitude, longitude")
        .eq("specialism_id", cand.specialism_id)
        .not("stage", "in", "(placed,not_suitable)")
        .neq("id", cand.id)
        .limit(5000);
      const here = cand.latitude != null && cand.longitude != null ? { lat: cand.latitude, lng: cand.longitude } : null;
      more = (similar ?? []).filter((s) =>
        here && s.latitude != null && s.longitude != null ? milesBetween(here, { lat: s.latitude, lng: s.longitude }) <= 30 : !here
      ).length;
    }

    const content = cleanContent({
      ...draft,
      display_name: `${cand.first_name}${cand.last_name ? ` ${cand.last_name.trim()[0]}.` : ""}`,
      salary: cand.salary_expectation || "",
      job_type: cand.job_type === "perm" ? "Permanent" : cand.job_type === "temp" ? "Temporary" : "Permanent or temporary",
      availability: draft.availability || cand.notice_period || "",
      more_count: more,
    });
    return NextResponse.json({ content });
  }

  // ---------- Save and get the link ----------
  if (body.action === "create") {
    if (!body.consent) return fail("Tick to confirm the candidates have agreed to be put forward.");

    // One candidate ({candidateId, content}) or a shortlist ({items: [{candidateId, content}]})
    const rawItems: { candidateId?: string; content?: unknown }[] = Array.isArray(body.items)
      ? body.items
      : [{ candidateId: body.candidateId, content: body.content }];
    const items = rawItems
      .filter((i) => typeof i?.candidateId === "string")
      .slice(0, 5)
      .map((i) => ({ candidate_id: i.candidateId as string, content: cleanContent(i.content as Partial<SpecContent>) }));
    if (!items.length) return fail("Choose at least one candidate.");
    if (items.some((i) => !i.content.headline)) return fail("Every candidate needs a headline.");

    const ids = items.map((i) => i.candidate_id);
    const { data: cands } = await db.from("crm_candidates").select("id, first_name, last_name, stage").in("id", ids);
    if ((cands ?? []).length !== new Set(ids).size) return fail("One of the candidates couldn't be found.");
    const nameOf = (id: string) => {
      const c = (cands ?? []).find((x) => x.id === id);
      return c ? `${c.first_name}${c.last_name ? ` ${c.last_name}` : ""}` : "candidate";
    };

    let companyId: string | null = body.companyId || null;
    let companyName = String(body.companyName || "").trim().slice(0, 160);
    const contactName = String(body.contactName || "").trim().slice(0, 120) || null;
    const intro = String(body.intro || "").trim().slice(0, 300) || null;

    if (companyId) {
      const { data: co } = await db.from("crm_companies").select("id, name, stage").eq("id", companyId).maybeSingle();
      if (!co) return fail("That company couldn't be found.");
      companyName = co.name;
      if (co.stage === "lead") await db.from("crm_companies").update({ stage: "contacted", last_contacted_at: new Date().toISOString() }).eq("id", co.id);
      else await db.from("crm_companies").update({ last_contacted_at: new Date().toISOString() }).eq("id", co.id);
    } else {
      if (!companyName) return fail("Choose or type the company you're sending it to.");
      // New prospect goes into the sales pipeline
      const { data: co, error } = await db
        .from("crm_companies")
        .insert({ name: companyName, stage: "contacted", source: "Spec CV", last_contacted_at: new Date().toISOString() })
        .select("id")
        .single();
      if (error) return fail(`Couldn't add the company: ${error.message}`, 500);
      companyId = co.id;
      if (contactName) await db.from("crm_contacts").insert({ company_id: companyId, name: contactName, is_primary: true });
    }

    const token = newToken();
    const { data: spec, error } = await db
      .from("crm_specs")
      .insert({
        token,
        candidate_id: items[0].candidate_id,
        candidate_ids: ids,
        content: items[0].content,
        items,
        intro,
        company_id: companyId,
        company_name: companyName,
        contact_name: contactName,
        role_title: role || null,
        created_by: userId,
        expires_at: new Date(Date.now() + 90 * 86400000).toISOString(),
      })
      .select("id")
      .single();
    if (error) return fail(`Couldn't save the spec: ${error.message}`, 500);

    const kind = items.length > 1 ? `Shortlist spec (${items.length} candidates)` : "Spec page";
    await Promise.all([
      ...ids.map((id) =>
        db.from("crm_notes").insert({ candidate_id: id, kind: "note", body: `${kind} created for ${companyName}${role ? ` (${role})` : ""}.` })
      ),
      db.from("crm_notes").insert({ company_id: companyId, kind: "note", body: `${kind} created: ${ids.map(nameOf).join(", ")}${role ? ` for ${role}` : ""}.` }),
      ...(cands ?? [])
        .filter((c) => ["new", "screened"].includes(c.stage))
        .map((c) => db.from("crm_candidates").update({ stage: "sent" }).eq("id", c.id)),
    ]);

    return NextResponse.json({ id: spec.id, url: specUrl(token), companyId });
  }

  return fail("Unknown action.");
}
