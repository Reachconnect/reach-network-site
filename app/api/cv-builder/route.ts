// Free CV builder
// action "generate" {input}      AI writes the CV; the candidate goes into the CRM straight away
// action "download" {input, cv}  makes the PDF, saves it privately on their CRM profile, and returns it
import { NextResponse } from "next/server";
import { logSpam, spamReason } from "@/lib/spam";
import { admin } from "@/lib/crmServer";
import { newToken, sendAlert, SITE_URL } from "@/lib/specs";
import { CV_PROMPT, buildCvPdf, type Cv, type CvInput } from "@/lib/cvBuilder";

export const runtime = "nodejs";
export const maxDuration = 60;

const MODEL = process.env.AI_MODEL || "claude-sonnet-5-5";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });
const s = (v: unknown, n = 200) => String(v ?? "").trim().slice(0, n);
const MAX_PER_DAY = 8;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function cleanInput(i: any): CvInput {
  return {
    name: s(i?.name, 80),
    email: s(i?.email, 120).toLowerCase(),
    phone: s(i?.phone, 30),
    town: s(i?.town, 60),
    postcode: s(i?.postcode, 10).toUpperCase(),
    target: s(i?.target, 80),
    sector: s(i?.sector, 40),
    about: s(i?.about, 600),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    jobs: (Array.isArray(i?.jobs) ? i.jobs : []).slice(0, 8).map((j: any) => ({ title: s(j?.title, 80), employer: s(j?.employer, 80), location: s(j?.location, 60), start: s(j?.start, 20), end: s(j?.end, 20), current: !!j?.current, notes: s(j?.notes, 500) })).filter((j: CvInput["jobs"][number]) => j.title || j.employer),
    tickets: (Array.isArray(i?.tickets) ? i.tickets : []).slice(0, 30).map((t: unknown) => s(t, 60)).filter(Boolean),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    education: (Array.isArray(i?.education) ? i.education : []).slice(0, 6).map((e: any) => ({ qualification: s(e?.qualification, 100), place: s(e?.place, 80), year: s(e?.year, 10) })).filter((e: CvInput["education"][number]) => e.qualification),
    extras: s(i?.extras, 600),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function cleanCv(c: any, i: CvInput): Cv {
  const arr = (v: unknown, n = 12) => (Array.isArray(v) ? v : []).map((x) => s(x, 220)).filter(Boolean).slice(0, n);
  return {
    name: s(c?.name || i.name, 80),
    email: s(c?.email || i.email, 120),
    phone: s(c?.phone || i.phone, 30),
    town: s(c?.town || i.town, 60),
    headline: s(c?.headline, 90),
    summary: s(c?.summary, 900),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    experience: (Array.isArray(c?.experience) ? c.experience : []).slice(0, 8).map((j: any) => ({ title: s(j?.title, 90), employer: s(j?.employer, 90), location: s(j?.location, 60), dates: s(j?.dates, 40), bullets: arr(j?.bullets, 6) })),
    qualifications: arr(c?.qualifications, 20),
    skills: arr(c?.skills, 12),
    education: arr(c?.education, 6),
    extras: arr(c?.extras, 6),
  };
}

async function locate(postcode: string, town: string) {
  try {
    if (postcode) {
      const r = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(postcode)}`, { cache: "no-store" });
      const j = await r.json();
      if (j?.result?.latitude) return { lat: j.result.latitude as number, lng: j.result.longitude as number, postcode: j.result.postcode as string };
      const out = postcode.split(" ")[0];
      const r2 = await fetch(`https://api.postcodes.io/outcodes/${encodeURIComponent(out)}`, { cache: "no-store" });
      const j2 = await r2.json();
      if (j2?.result?.latitude) return { lat: j2.result.latitude as number, lng: j2.result.longitude as number, postcode };
    }
    if (town) {
      const r = await fetch(`https://api.postcodes.io/places?q=${encodeURIComponent(town)}&limit=1`, { cache: "no-store" });
      const j = await r.json();
      const p = j?.result?.[0];
      if (p?.latitude) return { lat: p.latitude as number, lng: p.longitude as number, postcode: postcode || null };
    }
  } catch {}
  return { lat: null, lng: null, postcode: postcode || null };
}

// Add or update the candidate, and note what they told us
async function upsertCandidate(i: CvInput, cv: Cv | null) {
  const db = admin();
  const { data: existing } = await db.from("crm_candidates").select("id, phone, postcode, job_title, location").ilike("email", i.email).limit(1);
  const latest = i.jobs.find((j) => j.current) || i.jobs[0];
  let specialismId: string | null = null;
  if (i.sector) {
    const { data: sp } = await db.from("crm_specialisms").select("id, name");
    const word = i.sector.toLowerCase().replace(/ing$/, "").slice(0, 5);
    specialismId = (sp ?? []).find((x: { id: string; name: string }) => x.name.toLowerCase().includes(word))?.id ?? null;
  }
  if (existing?.length) {
    const e = existing[0];
    const patch: Record<string, unknown> = {};
    if (!e.phone && i.phone) patch.phone = i.phone;
    if (!e.job_title && (i.target || latest?.title)) patch.job_title = i.target || latest?.title;
    if (!e.location && i.town) patch.location = i.town;
    if (!e.postcode && i.postcode) {
      const g = await locate(i.postcode, i.town);
      Object.assign(patch, { postcode: g.postcode, latitude: g.lat, longitude: g.lng });
    }
    if (Object.keys(patch).length) await db.from("crm_candidates").update(patch).eq("id", e.id);
    return { id: e.id as string, isNew: false };
  }
  const parts = i.name.split(/\s+/);
  const first = parts.shift() || i.name;
  const g = await locate(i.postcode || "", i.town);
  const row: Record<string, unknown> = {
    first_name: first,
    last_name: parts.join(" ") || null,
    email: i.email,
    phone: i.phone || null,
    location: i.town || null,
    postcode: g.postcode,
    latitude: g.lat,
    longitude: g.lng,
    job_title: i.target || latest?.title || null,
    current_employer: latest?.current ? latest.employer : null,
    stage: "new",
    source: "Website: free CV builder",
    specialism_id: specialismId,
  };
  let { data, error } = await db.from("crm_candidates").insert(row).select("id").single();
  if (error) {
    // If an optional column isn't there, save the basics
    delete row.latitude;
    delete row.longitude;
    ({ data, error } = await db.from("crm_candidates").insert(row).select("id").single());
  }
  if (error || !data) throw error || new Error("Couldn't save the candidate.");
  void cv;
  return { id: data.id as string, isNew: true };
}

function noteFor(i: CvInput) {
  const jobs = i.jobs.map((j) => `• ${j.title} at ${j.employer} (${j.start} to ${j.current ? "now" : j.end})${j.location ? `, ${j.location}` : ""}`).join("\n");
  return [
    `Built a CV with the free CV builder.`,
    `Looking for: ${i.target || "not said"}${i.sector ? ` (${i.sector})` : ""}`,
    `Location: ${[i.town, i.postcode].filter(Boolean).join(", ") || "not given"} · ${i.phone} · ${i.email}`,
    jobs ? `Work history:\n${jobs}` : "",
    i.tickets.length ? `Licences and tickets: ${i.tickets.join(", ")}` : "",
    i.education.length ? `Education: ${i.education.map((e) => [e.qualification, e.place, e.year].filter(Boolean).join(", ")).join("; ")}` : "",
    i.about ? `About them: ${i.about}` : "",
    i.extras ? `Anything else: ${i.extras}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export async function POST(request: Request) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const body: any = await request.json().catch(() => ({}));
  if (s(body.website)) return fail("Something went wrong.");
  const i = cleanInput(body.input);
  if (!i.name || !i.email || !i.phone) return fail("Please add your name, email and phone number.");
  if (!EMAIL_RE.test(i.email)) return fail("That email address doesn't look right.");
  const spam = spamReason({ body, text: [i.name, i.target, i.about, i.extras, i.town, ...i.jobs.flatMap((j) => [j.title, j.employer, j.notes])], phone: i.phone, place: i.town });
  if (spam) {
    logSpam("cv-builder", spam, { name: i.name, email: i.email });
    return fail("Something went wrong. Please check your details and try again.");
  }
  const db = admin();

  if (body.action === "generate") {
    if (!i.jobs.length && !i.about) return fail("Add at least one job, or tell us a little about yourself.");

    // Keep the AI from being used too much by one person
    let candidate: { id: string; isNew: boolean };
    try {
      candidate = await upsertCandidate(i, null);
    } catch (e) {
      console.error("CV builder save error:", e);
      return fail("Sorry, something went wrong. Please try again, or call us on 0121 630 1643.", 500);
    }
    const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const { count } = await db.from("crm_notes").select("id", { count: "exact", head: true }).eq("candidate_id", candidate.id).like("body", "Built a CV with the free CV builder%").gte("created_at", since);
    if ((count ?? 0) >= MAX_PER_DAY) return fail("You've made a few CVs today. Please edit the one you have, or try again tomorrow.", 429);

    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) return fail("The CV builder isn't available right now. Please call us on 0121 630 1643.", 500);
    const info = JSON.stringify({ wants: i.target, sector: i.sector, town: i.town, about: i.about, jobs: i.jobs, licences_and_tickets: i.tickets, education: i.education, anything_else: i.extras, today: new Date().toISOString().slice(0, 10) });
    let cv: Cv;
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
        body: JSON.stringify({ model: MODEL, max_tokens: 2500, system: CV_PROMPT, messages: [{ role: "user", content: info }] }),
      });
      const data = await res.json().catch(() => null);
      const text = ((data?.content ?? []) as { type: string; text?: string }[]).filter((b) => b.type === "text").map((b) => b.text || "").join("\n");
      const json = text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
      cv = cleanCv(JSON.parse(json), i);
      if (!cv.summary && !cv.experience.length) throw new Error("Empty CV");
    } catch (e) {
      console.error("CV builder AI error:", e);
      return fail("We couldn't write your CV just now. Please try again in a minute.", 502);
    }

    await db.from("crm_notes").insert({ candidate_id: candidate.id, kind: "note", body: noteFor(i) });
    if (candidate.isNew) {
      await sendAlert(
        `📝 New candidate from the CV builder: ${i.name}`,
        [`${i.name} built a CV on the website.`, `Looking for: ${i.target || "not said"}`, `${[i.town, i.postcode].filter(Boolean).join(", ")} · ${i.phone} · ${i.email}`, i.tickets.length ? `Tickets: ${i.tickets.join(", ")}` : ""].filter(Boolean),
        { label: "Open their profile", url: `${SITE_URL}/crm/candidates/view?id=${candidate.id}` }
      ).catch(() => {});
    }
    return NextResponse.json({ cv });
  }

  if (body.action === "download") {
    const cv = cleanCv(body.cv, i);
    const pdf = await buildCvPdf(cv);
    const filename = `${cv.name.replace(/[^\w\s-]/g, "").trim() || "My"} CV.pdf`;
    try {
      const { id } = await upsertCandidate(i, cv);
      const path = `cv-builder/${new Date().toISOString().slice(0, 10)}/${newToken()}.pdf`;
      const up = await db.storage.from("crm-cvs").upload(path, Buffer.from(pdf), { contentType: "application/pdf", upsert: false });
      if (!up.error) await db.from("crm_candidates").update({ cv_path: path, cv_filename: filename }).eq("id", id);
    } catch (e) {
      console.error("CV builder download save error:", e);
    }
    return new NextResponse(Buffer.from(pdf), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${filename}"`, "Cache-Control": "no-store" } });
  }

  return fail("Unknown action.");
}
