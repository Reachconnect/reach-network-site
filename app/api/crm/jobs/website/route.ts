// /api/crm/jobs/website: putting a CRM job on reachnetworkrec.com (agency staff only)
// POST action "save"  {jobId, ...advert fields, published}
// POST action "write" {jobId}  the AI writes the advert from what's in the CRM
import { NextResponse } from "next/server";
import { admin, requireAgency } from "@/lib/crmServer";
import { SITE_URL } from "@/lib/specs";
import { locate, payText, slugify } from "@/lib/jobsPublic";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MODEL = process.env.AI_MODEL || "claude-sonnet-5-5";
const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });
const str = (v: unknown, max = 2000) => (typeof v === "string" ? v.trim().slice(0, max) : "");

const PROMPT = `You write job adverts for Reach Network Recruitment, a UK recruitment agency (driving, warehousing, manufacturing and engineering).
Write in plain, friendly British English for the candidate ("you"). Be specific and honest: only use facts in the information given, never invent pay, benefits, shift patterns or requirements. Don't name the client company. No exclamation marks, no clichés like "dynamic" or "fast-paced".
Reply with JSON only:
{"web_title": "clear job title as candidates search for it, e.g. HGV Class 1 Night Driver",
 "summary": "2 to 3 sentences: what the job is, where, and why it's worth applying",
 "duties": ["4 to 6 short lines, what you'll do"],
 "requirements": ["3 to 6 short lines, what you'll need, e.g. licences, experience, right to work in the UK"],
 "benefits": ["what you get, only if stated: pay, overtime, holiday, pension, van, training"],
 "hours": "e.g. Monday to Friday, 6am to 2pm, or \\"\\" if unknown",
 "job_type": "permanent | temporary | contract | temp_to_perm"}`;

export async function POST(request: Request) {
  if (!(await requireAgency(request))) return fail("Please log in again.", 401);
  const body = await request.json().catch(() => ({}));
  const db = admin();
  const { data: job } = await db.from("crm_jobs").select("*, crm_specialisms(name), crm_companies(name)").eq("id", String(body.jobId || "")).maybeSingle();
  if (!job) return fail("Job not found.", 404);

  if (body.action === "write") {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) return fail("The AI isn't set up yet.");
    const info = [
      `Job title: ${job.title}`,
      job.crm_specialisms?.name && `Specialism: ${job.crm_specialisms.name}`,
      job.location && `Location: ${job.location}${job.postcode ? ` (${String(job.postcode).split(" ")[0]})` : ""}`,
      (job.salary_from || job.salary_to) && `Pay: ${payText(job.salary_from, job.salary_to)}`,
      job.salary_notes && `Package notes: ${job.salary_notes}`,
      job.positions > 1 && `Positions: ${job.positions}`,
      job.description && `Notes from the recruiter:\n${job.description}`,
      body.extra && `Extra details:\n${str(body.extra, 4000)}`,
    ]
      .filter(Boolean)
      .join("\n");
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model: MODEL, max_tokens: 1500, system: PROMPT, messages: [{ role: "user", content: info }] }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) return fail("The AI couldn't write the advert just now. Try again in a moment.", 502);
    const text = ((data?.content ?? []) as { type: string; text?: string }[]).filter((b) => b.type === "text").map((b) => b.text || "").join("\n").replace(/```json|```/g, "");
    try {
      const j = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));
      const list = (v: unknown) => (Array.isArray(v) ? v.map((x) => String(x).trim()).filter(Boolean).join("\n") : "");
      return NextResponse.json({
        advert: {
          web_title: str(j.web_title, 120),
          summary: str(j.summary, 1500),
          duties: list(j.duties),
          requirements: list(j.requirements),
          benefits: list(j.benefits),
          hours: str(j.hours, 160),
          job_type: ["permanent", "temporary", "contract", "temp_to_perm"].includes(j.job_type) ? j.job_type : "",
        },
      });
    } catch {
      return fail("The AI's answer didn't come through properly. Try again.", 502);
    }
  }

  if (body.action === "save") {
    const published = !!body.published;
    const patch: Record<string, unknown> = {
      web_title: str(body.web_title, 120) || null,
      job_type: ["permanent", "temporary", "contract", "temp_to_perm"].includes(body.job_type) ? body.job_type : null,
      pay_text: str(body.pay_text, 120) || null,
      hours: str(body.hours, 160) || null,
      start_text: str(body.start_text, 120) || null,
      summary: str(body.summary, 2000) || null,
      duties: str(body.duties, 4000) || null,
      requirements: str(body.requirements, 4000) || null,
      benefits: str(body.benefits, 4000) || null,
      show_company: !!body.show_company,
      closing_date: /^\d{4}-\d{2}-\d{2}$/.test(String(body.closing_date || "")) ? body.closing_date : null,
      published,
    };
    if (published) {
      if (job.status !== "open") return fail("Only open jobs can go on the website. Set the job back to Open first.");
      if (!patch.summary) return fail("Add a short summary first, or press Write it for me.");
      if (!job.slug) patch.slug = `${slugify(`${patch.web_title || job.title} ${job.location || ""}`)}-${job.id.slice(0, 6)}`;
      if (!job.published_at) patch.published_at = new Date().toISOString();
      if (!job.lat || body.relocate) Object.assign(patch, await locate(job.postcode, job.location));
    }
    const { error } = await db.from("crm_jobs").update(patch).eq("id", job.id);
    if (error) return fail(`${error.message}. Has the jobs SQL been run?`, 500);
    if (published && !job.published) {
      await db.from("crm_notes").insert({ company_id: job.company_id, kind: "note", body: `Job advertised on the website: ${patch.web_title || job.title}.` });
    }
    const slug = (patch.slug as string) || job.slug;
    return NextResponse.json({ ok: true, url: published && slug ? `${SITE_URL}/jobs/${slug}` : null });
  }

  return fail("Unknown action.");
}
