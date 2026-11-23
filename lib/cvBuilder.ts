// Free CV builder: shared types, the AI instructions and the PDF
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";

import type { Cv } from "./cvBuilderShared";
export type { Cv, CvInput, CvJob, CvJobIn, CvEduIn } from "./cvBuilderShared";
export { TICKETS } from "./cvBuilderShared";

export const CV_PROMPT = `You write CVs for people in UK driving, warehouse, manufacturing and engineering jobs. Turn the details given into a clear, professional CV.

Strict rules:
- Use ONLY the employers, job titles, dates, places, licences, qualifications and education given. Never add an employer, a date, a qualification, a licence, a ticket, a number or an achievement that wasn't given.
- For each job, write 3 to 5 short bullet points describing the duties that are normal for that job title, plus anything the person mentioned. Keep them factual and modest: no made-up figures, awards or results.
- Write in plain UK English, first person implied (no "I"), no buzzwords, no exaggeration.
- "headline": a short line under their name, e.g. "Class 1 HGV Driver" or "Reach Truck Operator", based on the job they want.
- "summary": 2 to 3 sentences about their experience and what they're looking for. Only mention years of experience if the dates clearly show it.
- "skills": 5 to 8 practical skills that fit their jobs (e.g. "Pre-use vehicle checks", "Stock rotation").
- "qualifications": the licences, tickets and qualifications given, tidied up. Empty list if none.
- "education": each item as "Qualification, Place, Year" using only what was given.
- "extras": short lines from anything else they mentioned (languages, availability, etc). Empty list if none.
- "experience": most recent first. "dates" like "Mar 2021 – Present". Keep employer names exactly as given.

Reply with JSON only, no other text:
{"headline": "", "summary": "", "experience": [{"title": "", "employer": "", "location": "", "dates": "", "bullets": [""]}], "skills": [""], "qualifications": [""], "education": [""], "extras": [""]}`;

// ---------- PDF ----------

const W = 595.28;
const H = 841.89;
const M = 50;
const NAVY = rgb(15 / 255, 36 / 255, 56 / 255);
const ORANGE = rgb(247 / 255, 147 / 255, 30 / 255);
const GREY = rgb(90 / 255, 104 / 255, 122 / 255);
const LINE = rgb(226 / 255, 232 / 255, 240 / 255);

const clean = (s: string) =>
  String(s || "")
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/…/g, "...")
    .replace(/•/g, "-")
    .replace(/[^\x20-\x7E£·éèêáàâíóúüöäçñ]/g, "");

function wrap(text: string, font: PDFFont, size: number, width: number) {
  const out: string[] = [];
  for (const para of clean(text).split(/\n/)) {
    let cur = "";
    for (const w of para.split(/\s+/).filter(Boolean)) {
      const t = cur ? `${cur} ${w}` : w;
      if (font.widthOfTextAtSize(t, size) > width && cur) {
        out.push(cur);
        cur = w;
      } else cur = t;
    }
    out.push(cur);
  }
  return out;
}

export async function buildCvPdf(cv: Cv) {
  const doc = await PDFDocument.create();
  doc.setTitle(`${clean(cv.name)} - CV`);
  doc.setAuthor(clean(cv.name));
  doc.setCreator("Reach Network Recruitment free CV builder");
  const r = await doc.embedFont(StandardFonts.Helvetica);
  const b = await doc.embedFont(StandardFonts.HelveticaBold);
  const o = await doc.embedFont(StandardFonts.HelveticaOblique);
  let page: PDFPage = doc.addPage([W, H]);
  let y = H - M;
  const pages: PDFPage[] = [page];

  const newPage = () => {
    page = doc.addPage([W, H]);
    pages.push(page);
    y = H - M;
  };
  const need = (h: number) => {
    if (y - h < 60) newPage();
  };
  const draw = (s: string, x: number, size: number, font: PDFFont, color = NAVY) => page.drawText(clean(s), { x, y, size, font, color });
  const lines = (s: string, x: number, width: number, size: number, font: PDFFont, color = NAVY, lh = 1.45) => {
    for (const l of wrap(s, font, size, width)) {
      need(size * lh);
      page.drawText(l, { x, y, size, font, color });
      y -= size * lh;
    }
  };
  const heading = (t: string) => {
    need(40);
    y -= 10;
    draw(t.toUpperCase(), M, 9.5, b, ORANGE);
    y -= 7;
    page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: 0.8, color: LINE });
    y -= 16;
  };

  // Header
  page.drawRectangle({ x: 0, y: H - 6, width: W, height: 6, color: ORANGE });
  y = H - M - 6;
  lines(cv.name, M, W - 2 * M, 26, b, NAVY, 1.1);
  y -= 2;
  if (cv.headline) lines(cv.headline, M, W - 2 * M, 13, b, ORANGE, 1.3);
  y -= 2;
  const contact = [cv.town, cv.phone, cv.email].filter(Boolean).join("   |   ");
  lines(contact, M, W - 2 * M, 9.5, r, GREY);
  y -= 4;

  if (cv.summary) {
    heading("Profile");
    lines(cv.summary, M, W - 2 * M, 10.5, r, NAVY, 1.5);
  }

  if (cv.experience?.length) {
    heading("Work experience");
    for (const j of cv.experience) {
      need(48);
      const dateW = r.widthOfTextAtSize(clean(j.dates), 9.5);
      draw(j.title, M, 11.5, b);
      page.drawText(clean(j.dates), { x: W - M - dateW, y, size: 9.5, font: r, color: GREY });
      y -= 15;
      lines([j.employer, j.location].filter(Boolean).join(", "), M, W - 2 * M, 10, o, GREY);
      y -= 3;
      for (const bl of j.bullets || []) {
        const ls = wrap(bl, r, 10, W - 2 * M - 14);
        need(ls.length * 14.5);
        page.drawCircle({ x: M + 4, y: y + 3.3, size: 1.8, color: ORANGE });
        for (const l of ls) {
          page.drawText(l, { x: M + 14, y, size: 10, font: r, color: NAVY });
          y -= 14.5;
        }
      }
      y -= 8;
    }
  }

  const list = (title: string, items: string[], cols = 2) => {
    const xs = (items || []).map((s) => s.trim()).filter(Boolean);
    if (!xs.length) return;
    heading(title);
    const colW = (W - 2 * M) / cols;
    for (let i = 0; i < xs.length; i += cols) {
      const row = xs.slice(i, i + cols).map((s) => wrap(s, r, 10, colW - 18));
      const h = Math.max(...row.map((l) => l.length)) * 14.5 + 2;
      need(h);
      row.forEach((ls, c) => {
        const x = M + c * colW;
        page.drawCircle({ x: x + 4, y: y + 3.3, size: 1.8, color: ORANGE });
        ls.forEach((l, k) => page.drawText(l, { x: x + 14, y: y - k * 14.5, size: 10, font: r, color: NAVY }));
      });
      y -= h;
    }
  };

  list("Licences, tickets and qualifications", cv.qualifications);
  list("Key skills", cv.skills);
  list("Education", cv.education, 1);
  list("Additional information", cv.extras, 1);

  // Footer on every page
  pages.forEach((p, i) => {
    const t = "CV created free at reachnetworkrec.com/cv-builder";
    p.drawText(t, { x: M, y: 28, size: 7.5, font: r, color: rgb(0.6, 0.65, 0.7) });
    if (pages.length > 1) {
      const n = `${i + 1} / ${pages.length}`;
      p.drawText(n, { x: W - M - r.widthOfTextAtSize(n, 7.5), y: 28, size: 7.5, font: r, color: rgb(0.6, 0.65, 0.7) });
    }
  });

  return doc.save();
}
