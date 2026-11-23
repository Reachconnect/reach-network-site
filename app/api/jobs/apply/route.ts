// POST /api/jobs/apply: a candidate applies on the website, straight into the CRM (public)
// action "upload" {filename, size}  a private place to upload their CV
// action "apply"  {job, name, email, phone, message, cv_path, cv_name, consent}
import { NextResponse } from "next/server";
import { logSpam, spamReason } from "@/lib/spam";
import { admin } from "@/lib/crmServer";
import { SITE_URL, newToken, sendAlert } from "@/lib/specs";
import { EMAIL_RE } from "@/lib/mail";

export const dynamic = "force-dynamic";

const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });
const str = (v: unknown, max = 300) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const db = admin();

  if (body.action === "upload") {
    const ext = String(body.filename || "").split(".").pop()?.toLowerCase() || "";
    if (!["pdf", "doc", "docx"].includes(ext)) return fail("Please upload your CV as a PDF or Word document.");
    if (Number(body.size) > 10 * 1024 * 1024) return fail("Your CV needs to be under 10MB.");
    const path = `applications/${new Date().toISOString().slice(0, 10)}/${newToken()}.${ext}`;
    const { data, error } = await db.storage.from("crm-cvs").createSignedUploadUrl(path);
    if (error || !data) return fail("We couldn't take your CV just now. Please try again.", 500);
    return NextResponse.json({ path: data.path, token: data.token });
  }

  if (body.action !== "apply") return fail("Unknown action.");
  if (body.website) return NextResponse.json({ ok: true }); // a bot filled in the hidden field
  const name = str(body.name, 120);
  const email = str(body.email, 200).toLowerCase();
  const phone = str(body.phone, 40);
  const message = str(body.message, 2000);
  const cvPath = typeof body.cv_path === "string" && /^applications\/[\w\-./]+$/.test(body.cv_path) ? body.cv_path : null;
  const cvName = str(body.cv_name, 160) || null;
  if (name.length < 2) return fail("Please add your name.");
  if (!EMAIL_RE.test(email)) return fail("Please check your email address.");
  if (!phone && !cvPath) return fail("Please add a phone number or your CV so we can get in touch.");
  if (!body.consent) return fail("Please tick the box so we can keep your details and contact you about jobs.");
  const spam = spamReason({ body, text: [name, message], phone: phone || undefined });
  if (spam) {
    logSpam("jobs/apply", spam, { name, email });
    return NextResponse.json({ ok: true });
  }

  // Which job?
  const ref = str(body.job, 60);
  let crmJob: { id: string; title: string; web_title: string | null; specialism_id: string | null; company_id: string } | null = null;
  let legacyJob: { id: string; title: string } | null = null;
  if (ref.startsWith("c-")) {
    const { data } = await db.from("crm_jobs").select("id, title, web_title, specialism_id, company_id").eq("id", ref.slice(2)).maybeSingle();
    crmJob = data;
  } else if (ref.startsWith("j-")) {
    const { data } = await db.from("jobs").select("id, title").eq("id", ref.slice(2)).maybeSingle();
    legacyJob = data;
  }
  const jobTitle = crmJob ? crmJob.web_title || crmJob.title : legacyJob?.title || null;

  // The candidate: update them if we already have them, otherwise add them
  const parts = name.split(/\s+/);
  const first = parts.shift() || name;
  const last = parts.join(" ") || null;
  const { data: existing } = await db.from("crm_candidates").select("id, phone, cv_path, stage").ilike("email", email).limit(1);
  let candidateId = existing?.[0]?.id as string | undefined;
  if (candidateId) {
    const patch: Record<string, unknown> = {};
    if (phone && !existing![0].phone) patch.phone = phone;
    if (cvPath) Object.assign(patch, { cv_path: cvPath, cv_filename: cvName });
    if (Object.keys(patch).length) await db.from("crm_candidates").update(patch).eq("id", candidateId);
  } else {
    const { data: created, error } = await db
      .from("crm_candidates")
      .insert({
        first_name: first,
        last_name: last,
        email,
        phone: phone || null,
        stage: "new",
        source: jobTitle ? `Website: ${jobTitle}` : "Website: CV upload",
        specialism_id: crmJob?.specialism_id || null,
        cv_path: cvPath,
        cv_filename: cvName,
      })
      .select("id")
      .single();
    if (error) {
      console.error("Website application failed:", error);
      return fail("Sorry, something went wrong. Please call us on 0121 630 1643.", 500);
    }
    candidateId = created.id;
  }

  if (crmJob) {
    const { data: already } = await db.from("crm_job_candidates").select("id").eq("job_id", crmJob.id).eq("candidate_id", candidateId).limit(1);
    if (!already?.length) await db.from("crm_job_candidates").insert({ job_id: crmJob.id, candidate_id: candidateId });
  }
  if (legacyJob) {
    await db.from("job_applications").insert({ job_id: legacyJob.id, name, email, phone: phone || null, cv_url: null });
  }
  await db.from("crm_notes").insert({
    candidate_id: candidateId,
    kind: "note",
    body: `${jobTitle ? `Applied on the website for ${jobTitle}` : "Sent their CV through the website"}${cvPath ? " (CV attached)" : ""}.${message ? `\n\nTheir message: ${message}` : ""}`,
  });

  await sendAlert(
    `📄 ${existing?.length ? "Application" : "New candidate"}: ${name}${jobTitle ? ` for ${jobTitle}` : ""}`,
    [`${name} ${jobTitle ? `applied for ${jobTitle}` : "sent their CV"} on the website.`, `Email: ${email}${phone ? ` · Phone: ${phone}` : ""}`, cvPath ? "Their CV is saved on their profile." : "No CV attached.", message ? `Their message: ${message}` : ""].filter(Boolean),
    { label: "Open their profile", url: `${SITE_URL}/crm/candidates/view?id=${candidateId}` }
  );

  return NextResponse.json({ ok: true });
}
