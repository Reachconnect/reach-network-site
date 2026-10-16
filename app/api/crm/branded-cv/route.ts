// POST /api/crm/branded-cv
// action "read": the AI reads the candidate's CV into an editable draft
// action "build": turns the draft into a Reach-branded PDF and saves it to their profile
import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFImage, type PDFPage } from "pdf-lib";
import { admin, requireAgency } from "@/lib/crmServer";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MODEL = process.env.AI_MODEL || "claude-sonnet-5-5";

type Job = { title: string; company: string; location: string; start: string; end: string; bullets: string[] };
type CvData = { headline: string; summary: string; skills: string[]; qualifications: string[]; experience: Job[]; education: string[] };
type Options = { hideContact: boolean; hideEmployer: boolean; includeSalary: boolean };

const ORANGE = rgb(0.988, 0.357, 0.004);
const NAVY = rgb(0.122, 0.204, 0.278);
const INK = rgb(0.15, 0.17, 0.2);
const GREY = rgb(0.42, 0.47, 0.54);
const TINT = rgb(1, 0.95, 0.91);
const RULE = rgb(0.88, 0.9, 0.93);

// =====================================================================
// Reading the CV
// =====================================================================

const READ_PROMPT = `You prepare candidate profiles for Reach Network Recruitment, a UK recruitment agency, from a candidate's CV.

Reply with JSON only, no other text, in exactly this shape:
{"headline": "", "summary": "", "skills": [], "qualifications": [], "experience": [{"title": "", "company": "", "location": "", "start": "", "end": "", "bullets": []}], "education": []}

Rules:
- Use only what the CV says. Never invent anything.
- headline: one line, e.g. "Fire Alarm Engineer with 8 years' experience".
- summary: a consultant's summary, three to five sentences, third person, professional British English, focused on what makes them a strong hire: experience, standout skills, tickets and licences.
- skills: up to 12 short items.
- qualifications: licences, tickets, cards and certificates (e.g. Cat C+E, CPC, FLT, CSCS, NVQ Level 3, IPAF).
- experience: most recent first, up to 8 roles. start and end as written (e.g. "Mar 2019", "Present"). Up to 5 short bullets each, rewritten crisply.
- education: short lines, e.g. "NVQ Level 3 Electrical Installation, Birmingham College".
- Leave out contact details, date of birth, age, nationality, marital status, photos and references.`;

async function readCv(cvPath: string): Promise<CvData> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("CV reading isn't set up yet.");

  const { data: file, error } = await admin().storage.from("crm-cvs").download(cvPath);
  if (error || !file) throw new Error("Couldn't open their CV.");
  const bytes = Buffer.from(await file.arrayBuffer());
  const lower = cvPath.toLowerCase();

  let content: unknown[];
  if (lower.endsWith(".pdf")) {
    content = [
      { type: "document", source: { type: "base64", media_type: "application/pdf", data: bytes.toString("base64") } },
      { type: "text", text: "Prepare the candidate profile. Reply with the JSON only." },
    ];
  } else if (lower.endsWith(".docx")) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mammoth: any = await import("mammoth");
    const extract = mammoth.extractRawText ?? mammoth.default?.extractRawText;
    const { value } = await extract({ buffer: bytes });
    content = [{ type: "text", text: `Here is the CV:\n\n${String(value).slice(0, 40000)}\n\nPrepare the candidate profile. Reply with the JSON only.` }];
  } else {
    throw new Error("Their CV needs to be a PDF or Word (.docx) file. Upload it again in one of those formats.");
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model: MODEL, max_tokens: 4000, system: READ_PROMPT, messages: [{ role: "user", content }] }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    console.error("Branded CV read failed:", data);
    throw new Error("The CV couldn't be read just now. Try again in a moment.");
  }
  const text = ((data?.content ?? []) as { type: string; text?: string }[])
    .filter((b) => b.type === "text")
    .map((b) => b.text || "")
    .join("\n")
    .replace(/```json|```/g, "");
  const parsed = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));
  return cleanData(parsed);
}

function cleanData(raw: Partial<CvData> | null | undefined): CvData {
  const str = (v: unknown, max = 400) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  const list = (v: unknown, max = 20) => (Array.isArray(v) ? v.map((x) => str(x, 300)).filter(Boolean).slice(0, max) : []);
  return {
    headline: str(raw?.headline, 160),
    summary: str(raw?.summary, 2000),
    skills: list(raw?.skills, 16),
    qualifications: list(raw?.qualifications, 16),
    experience: (Array.isArray(raw?.experience) ? raw!.experience : []).slice(0, 10).map((j) => ({
      title: str(j?.title, 120),
      company: str(j?.company, 120),
      location: str(j?.location, 80),
      start: str(j?.start, 30),
      end: str(j?.end, 30),
      bullets: list(j?.bullets, 6),
    })),
    education: list(raw?.education, 8),
  };
}

// =====================================================================
// Making the PDF
// =====================================================================

// The built-in PDF font only knows basic characters
function plain(text: unknown) {
  return String(text ?? "")
    .replace(/\r/g, "")
    .replace(/[^\x20-\x7E\n£\u2018\u2019\u201C\u201D\u2013\u2014\u2022\u2026]/g, "");
}

function wrap(text: string, font: PDFFont, size: number, width: number) {
  const out: string[] = [];
  for (const para of plain(text).split("\n")) {
    let line = "";
    for (const word of para.split(/\s+/).filter(Boolean)) {
      const test = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(test, size) > width && line) {
        out.push(line);
        line = word;
      } else line = test;
    }
    out.push(line);
  }
  return out;
}

class Doc {
  page!: PDFPage;
  y = 0;
  readonly left = 50;
  readonly width = 495;

  constructor(public pdf: PDFDocument, public font: PDFFont, public bold: PDFFont, public logo: PDFImage | null) {}

  firstPage(date: string) {
    this.page = this.pdf.addPage([595, 842]);
    if (this.logo) {
      const w = 150;
      const h = (this.logo.height / this.logo.width) * w;
      this.page.drawImage(this.logo, { x: this.left, y: 842 - 40 - h, width: w, height: h });
    } else {
      this.page.drawText("REACH NETWORK RECRUITMENT", { x: this.left, y: 790, size: 14, font: this.bold, color: ORANGE });
    }
    this.page.drawText("CANDIDATE PROFILE", { x: 545 - this.bold.widthOfTextAtSize("CANDIDATE PROFILE", 9), y: 790, size: 9, font: this.bold, color: NAVY });
    this.page.drawText(date, { x: 545 - this.font.widthOfTextAtSize(date, 9), y: 777, size: 9, font: this.font, color: GREY });
    this.page.drawRectangle({ x: this.left, y: 735, width: this.width, height: 2.5, color: ORANGE });
    this.y = 708;
  }

  newPage() {
    this.page = this.pdf.addPage([595, 842]);
    this.page.drawRectangle({ x: 0, y: 836, width: 595, height: 6, color: ORANGE });
    this.y = 800;
  }

  ensure(h: number) {
    if (this.y - h < 70) this.newPage();
  }

  text(t: string, o: { size?: number; bold?: boolean; color?: ReturnType<typeof rgb>; indent?: number; gap?: number } = {}) {
    const size = o.size ?? 10;
    const f = o.bold ? this.bold : this.font;
    const indent = o.indent ?? 0;
    for (const line of wrap(t, f, size, this.width - indent)) {
      this.ensure(size + 4);
      this.page.drawText(line, { x: this.left + indent, y: this.y, size, font: f, color: o.color ?? INK });
      this.y -= size + (o.gap ?? 4);
    }
  }

  heading(t: string) {
    this.ensure(40);
    this.y -= 10;
    this.page.drawText(t.toUpperCase(), { x: this.left, y: this.y, size: 10, font: this.bold, color: ORANGE });
    this.y -= 7;
    this.page.drawRectangle({ x: this.left, y: this.y, width: this.width, height: 0.75, color: RULE });
    this.y -= 15;
  }

  bullets(items: string[], indent = 0) {
    for (const item of items) {
      const lines = wrap(item, this.font, 10, this.width - indent - 12);
      lines.forEach((line, i) => {
        this.ensure(14);
        if (i === 0) this.page.drawText("\u2022", { x: this.left + indent, y: this.y, size: 10, font: this.font, color: ORANGE });
        this.page.drawText(line, { x: this.left + indent + 12, y: this.y, size: 10, font: this.font, color: INK });
        this.y -= 14;
      });
    }
  }

  // Short items laid out in two columns
  columns(items: string[]) {
    const colW = this.width / 2;
    for (let i = 0; i < items.length; i += 2) {
      this.ensure(14);
      [items[i], items[i + 1]].forEach((item, c) => {
        if (!item) return;
        let t = plain(item);
        while (t && this.font.widthOfTextAtSize(t, 10) > colW - 20) t = t.slice(0, -1);
        const x = this.left + c * colW;
        this.page.drawText("\u2022", { x, y: this.y, size: 10, font: this.font, color: ORANGE });
        this.page.drawText(t, { x: x + 12, y: this.y, size: 10, font: this.font, color: INK });
      });
      this.y -= 14;
    }
  }

  summaryBox(title: string, body: string) {
    const lines = wrap(body, this.font, 10.5, this.width - 30);
    const h = 34 + lines.length * 15;
    this.ensure(h + 10);
    this.page.drawRectangle({ x: this.left, y: this.y - h + 14, width: this.width, height: h, color: TINT });
    this.page.drawRectangle({ x: this.left, y: this.y - h + 14, width: 3, height: h, color: ORANGE });
    this.page.drawText(title.toUpperCase(), { x: this.left + 15, y: this.y - 4, size: 9, font: this.bold, color: ORANGE });
    let y = this.y - 22;
    for (const line of lines) {
      this.page.drawText(line, { x: this.left + 15, y, size: 10.5, font: this.font, color: INK });
      y -= 15;
    }
    this.y -= h + 6;
  }

  facts(pairs: [string, string][]) {
    if (!pairs.length) return;
    this.ensure(40);
    const colW = this.width / pairs.length;
    pairs.forEach(([label, value], i) => {
      const x = this.left + i * colW;
      this.page.drawText(label.toUpperCase(), { x, y: this.y, size: 8, font: this.bold, color: GREY });
      let v = plain(value);
      while (v && this.bold.widthOfTextAtSize(v, 10.5) > colW - 10) v = v.slice(0, -1);
      this.page.drawText(v, { x, y: this.y - 14, size: 10.5, font: this.bold, color: NAVY });
    });
    this.y -= 36;
  }

  footers() {
    const pages = this.pdf.getPages();
    const line = "Presented by Reach Network Recruitment  |  0121 630 1643  |  hello@reachnetworkrec.com  |  reachnetworkrec.com";
    pages.forEach((p, i) => {
      p.drawRectangle({ x: this.left, y: 48, width: this.width, height: 0.75, color: RULE });
      p.drawText(line, { x: this.left, y: 34, size: 7.5, font: this.font, color: GREY });
      const n = `${i + 1} of ${pages.length}`;
      p.drawText(n, { x: 545 - this.font.widthOfTextAtSize(n, 7.5), y: 34, size: 7.5, font: this.font, color: GREY });
    });
  }
}

const JOB_TYPES: Record<string, string> = { perm: "Permanent", temp: "Temporary", either: "Perm or temp" };

async function buildPdf(request: Request, cand: Record<string, string | null>, data: CvData, opts: Options) {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  let logo: PDFImage | null = null;
  try {
    const res = await fetch(new URL("/brand/reach-logo.png", request.url));
    if (res.ok) logo = await pdf.embedPng(new Uint8Array(await res.arrayBuffer()));
  } catch {
    // falls back to the company name in text
  }

  const doc = new Doc(pdf, font, bold, logo);
  doc.firstPage(new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }));

  // Name and headline
  const first = cand.first_name || "";
  const last = cand.last_name || "";
  const name = opts.hideContact ? `${first}${last ? ` ${last[0]}.` : ""}` : `${first} ${last}`.trim();
  doc.text(name, { size: 24, bold: true, color: NAVY, gap: 8 });
  if (data.headline) doc.text(data.headline, { size: 12, color: GREY, gap: 6 });
  if (!opts.hideContact) {
    const contact = [cand.phone, cand.email, [cand.location, cand.postcode].filter(Boolean).join(" ")].filter(Boolean).join("   |   ");
    if (contact) doc.text(contact, { size: 9.5, color: GREY });
  }
  doc.y -= 10;

  // Key facts
  const facts: [string, string][] = [];
  if (cand.location) facts.push(["Based in", cand.location]);
  if (cand.job_type && JOB_TYPES[cand.job_type]) facts.push(["Looking for", JOB_TYPES[cand.job_type]]);
  if (opts.includeSalary && cand.salary_expectation) facts.push(["Salary expectation", cand.salary_expectation]);
  if (opts.includeSalary && cand.notice_period) facts.push(["Notice period", cand.notice_period]);
  doc.facts(facts.slice(0, 4));

  if (data.summary) doc.summaryBox("Consultant's summary", data.summary);

  if (data.qualifications.length) {
    doc.heading("Licences, tickets and qualifications");
    doc.columns(data.qualifications);
  }
  if (data.skills.length) {
    doc.heading("Key skills");
    doc.columns(data.skills);
  }

  if (data.experience.length) {
    doc.heading("Experience");
    const currentEmployer = (cand.current_employer || "").toLowerCase();
    data.experience.forEach((j, i) => {
      const isCurrent = /present|current|now|to date/i.test(j.end) || (!!currentEmployer && j.company.toLowerCase() === currentEmployer) || (i === 0 && !j.end);
      const company = opts.hideEmployer && isCurrent ? "Current employer (confidential)" : j.company;
      const dates = [j.start, j.end].filter(Boolean).join(" - ");
      doc.ensure(40);
      doc.page.drawText(plain(j.title || "Role"), { x: doc.left, y: doc.y, size: 11, font: bold, color: NAVY });
      if (dates) doc.page.drawText(plain(dates), { x: 545 - font.widthOfTextAtSize(plain(dates), 9.5), y: doc.y, size: 9.5, font, color: GREY });
      doc.y -= 14;
      const where = [company, j.location].filter(Boolean).join(", ");
      if (where) doc.text(where, { size: 10, color: GREY });
      doc.y -= 2;
      doc.bullets(j.bullets);
      doc.y -= 8;
    });
  }

  if (data.education.length) {
    doc.heading("Education and training");
    doc.bullets(data.education);
  }

  doc.footers();
  return pdf.save();
}

// =====================================================================

export async function POST(request: Request) {
  if (!(await requireAgency(request))) return NextResponse.json({ error: "Please log in again." }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const candidateId = String(body.candidateId || "");
  const db = admin();
  const { data: cand } = await db.from("crm_candidates").select("*").eq("id", candidateId).maybeSingle();
  if (!cand) return NextResponse.json({ error: "Candidate not found." }, { status: 404 });

  try {
    if (body.action === "read") {
      if (cand.cv_data && !body.refresh) return NextResponse.json({ data: cleanData(cand.cv_data) });
      if (!cand.cv_path) return NextResponse.json({ error: "Upload their CV first." }, { status: 400 });
      const data = await readCv(cand.cv_path);
      await db.from("crm_candidates").update({ cv_data: data }).eq("id", cand.id);
      return NextResponse.json({ data });
    }

    if (body.action === "build") {
      const data = cleanData(body.data);
      const opts: Options = {
        hideContact: body.options?.hideContact !== false,
        hideEmployer: !!body.options?.hideEmployer,
        includeSalary: !!body.options?.includeSalary,
      };
      const bytes = await buildPdf(request, cand, data, opts);

      const fileName = `${cand.first_name}${cand.last_name ? `-${opts.hideContact ? cand.last_name[0] : cand.last_name}` : ""}-Reach-profile.pdf`.replace(/[^a-zA-Z0-9.-]+/g, "-");
      const path = `${cand.id}/branded-${Date.now()}.pdf`;
      const up = await db.storage.from("crm-cvs").upload(path, bytes, { contentType: "application/pdf" });
      if (up.error) throw new Error(`Couldn't save the PDF: ${up.error.message}`);
      if (cand.branded_cv_path) await db.storage.from("crm-cvs").remove([cand.branded_cv_path]);
      await db.from("crm_candidates").update({ cv_data: data, branded_cv_path: path, branded_cv_at: new Date().toISOString() }).eq("id", cand.id);

      const { data: signed } = await db.storage.from("crm-cvs").createSignedUrl(path, 600, { download: fileName });
      return NextResponse.json({ url: signed?.signedUrl, fileName });
    }

    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message || "Something went wrong." }, { status: 500 });
  }
}