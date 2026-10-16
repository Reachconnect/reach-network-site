// POST /api/crm/parse-cv: read a CV and pull out the candidate's details
import { NextResponse } from "next/server";
import { requireAgency } from "@/lib/crmServer";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MODEL = process.env.AI_MODEL || "claude-sonnet-5-5";
const MAX_BYTES = 4 * 1024 * 1024;

const FIELDS = [
  "first_name",
  "last_name",
  "phone",
  "email",
  "location",
  "postcode",
  "job_title",
  "current_employer",
  "salary_expectation",
  "notice_period",
  "specialism",
  "job_type",
  "summary",
] as const;

function prompt(specialisms: string[]) {
  return `You read UK CVs for a recruitment agency and pull out the candidate's details.

Reply with JSON only, no other text, in exactly this shape:
{"first_name": "", "last_name": "", "phone": "", "email": "", "location": "", "postcode": "", "job_title": "", "current_employer": "", "salary_expectation": "", "notice_period": "", "specialism": "", "job_type": "", "summary": ""}

Rules:
- Only fill in what the CV actually says. Leave anything not stated as an empty string. Never guess.
- phone: their mobile, as written.
- location: their town or city. postcode: their full or partial UK postcode, if shown.
- job_title and current_employer: their current or most recent role.
- salary_expectation and notice_period: only if the CV states them.
- specialism: the single best match from this list, written exactly as shown, or empty if none fit: ${specialisms.length ? specialisms.join(", ") : "(none)"}.
- job_type: "perm", "temp" or "either" only if the CV says what they're looking for, otherwise empty.
- summary: two to four short lines for a recruiter: years of experience, key skills, licences, tickets and qualifications (for example CPC, FLT, CSCS, NVQs). British English. No personal opinions.`;
}

export async function POST(request: Request) {
  if (!(await requireAgency(request))) return NextResponse.json({ error: "Please log in again." }, { status: 401 });

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return NextResponse.json({ error: "CV reading isn't set up yet." }, { status: 500 });

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!file || typeof file === "string") return NextResponse.json({ error: "No CV received." }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "That CV is too large to read (over 4 MB)." }, { status: 400 });

  let specialisms: string[] = [];
  try {
    specialisms = JSON.parse(String(form?.get("specialisms") || "[]"));
  } catch {
    // ignore
  }

  const name = file.name.toLowerCase();
  const bytes = Buffer.from(await file.arrayBuffer());
  let content: unknown[];

  if (name.endsWith(".pdf") || file.type === "application/pdf") {
    content = [
      { type: "document", source: { type: "base64", media_type: "application/pdf", data: bytes.toString("base64") } },
      { type: "text", text: "Pull out this candidate's details. Reply with the JSON only." },
    ];
  } else if (name.endsWith(".docx")) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mammoth: any = await import("mammoth");
    const extract = mammoth.extractRawText ?? mammoth.default?.extractRawText;
    const { value } = await extract({ buffer: bytes });
    if (!String(value || "").trim()) return NextResponse.json({ error: "That Word file looks empty." }, { status: 400 });
    content = [{ type: "text", text: `Here is the CV:\n\n${String(value).slice(0, 40000)}\n\nPull out this candidate's details. Reply with the JSON only.` }];
  } else {
    return NextResponse.json({ error: "Only PDF and Word (.docx) CVs can be read. Save older .doc files as PDF first." }, { status: 400 });
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model: MODEL, max_tokens: 1024, system: prompt(specialisms), messages: [{ role: "user", content }] }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    console.error("CV read failed:", data);
    return NextResponse.json({ error: "The CV couldn't be read. Fill in the details yourself." }, { status: 502 });
  }

  const text = ((data?.content ?? []) as { type: string; text?: string }[])
    .filter((b) => b.type === "text")
    .map((b) => b.text || "")
    .join("\n")
    .replace(/```json|```/g, "");
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  let parsed: Record<string, unknown> = {};
  try {
    parsed = JSON.parse(text.slice(start, end + 1));
  } catch {
    return NextResponse.json({ error: "The CV couldn't be read. Fill in the details yourself." }, { status: 502 });
  }

  const fields: Record<string, string> = {};
  for (const k of FIELDS) {
    const v = parsed[k];
    if (typeof v === "string" && v.trim()) fields[k] = v.trim().slice(0, k === "summary" ? 1500 : 200);
  }
  return NextResponse.json({ fields });
}