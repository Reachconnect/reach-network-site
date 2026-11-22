// E-signatures on the server: fingerprints, the signed PDF with its certificate, and emails
import crypto from "crypto";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { SENDER, SENDER_ADDRESS, SITE_URL } from "./specs";
import { AGENCY, parseDoc, ukDateTime } from "./esignText";

export const SIGN_BUCKET = "signatures"; // private: uploaded PDFs and originals
export const SIGNED_BUCKET = "crm-terms"; // private: finished signed PDFs (the Terms card opens them from here)

export const sha256 = (data: string | Uint8Array) => crypto.createHash("sha256").update(data).digest("hex");
export const newSignToken = () => crypto.randomBytes(24).toString("base64url");
export const signUrl = (token: string) => `${SITE_URL}/s/${token}`;
export const shortId = (id: string) => id.replace(/-/g, "").slice(0, 12).toUpperCase();

export function requestInfo(request: Request) {
  const ip = (request.headers.get("x-forwarded-for") || "").split(",")[0].trim() || request.headers.get("x-real-ip") || "unknown";
  const ua = (request.headers.get("user-agent") || "unknown").slice(0, 300);
  return { ip, ua };
}

export function deviceName(ua: string) {
  const os = /iPhone/.test(ua) ? "iPhone" : /iPad/.test(ua) ? "iPad" : /Android/.test(ua) ? "Android" : /Windows/.test(ua) ? "Windows" : /Mac OS X/.test(ua) ? "Mac" : /Linux/.test(ua) ? "Linux" : "Unknown device";
  const br = /Edg\//.test(ua) ? "Edge" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "browser";
  return `${br} on ${os}`;
}

// ---------- Emails ----------

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function emailLayout(lines: string[], button?: { label: string; url: string }, small?: string) {
  const body = lines.map((l) => (l ? `<p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#0F2438">${esc(l)}</p>` : "")).join("");
  const btn = button ? `<p style="margin:18px 0 22px"><a href="${button.url}" style="display:inline-block;background:#F7931E;color:#ffffff;font-weight:bold;text-decoration:none;padding:13px 24px;border-radius:8px;font-size:15px">${esc(button.label)}</a></p>` : "";
  const foot = small ? `<p style="margin:18px 0 0;font-size:12px;line-height:1.5;color:#64748B">${esc(small)}</p>` : "";
  return `<div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;padding:8px 4px">${body}${btn}${foot}</div>`;
}

export async function sendMail(opts: { to: string | string[]; subject: string; html: string; text: string; attachments?: { filename: string; content: string }[] }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, error: "Email sending isn't set up (RESEND_API_KEY missing)." };
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: SENDER, reply_to: SENDER_ADDRESS, to: Array.isArray(opts.to) ? opts.to : [opts.to], subject: opts.subject, html: opts.html, text: opts.text, attachments: opts.attachments }),
    });
    if (!res.ok) return { ok: false, error: (await res.text()).slice(0, 300) };
    return { ok: true, error: null };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

// ---------- The signed PDF ----------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

const A4 = { w: 595.28, h: 841.89 };
const M = 56;
const NAVY = rgb(15 / 255, 36 / 255, 56 / 255);
const ORANGE = rgb(247 / 255, 147 / 255, 30 / 255);
const GREY = rgb(100 / 255, 116 / 255, 139 / 255);
const LIGHT = rgb(226 / 255, 232 / 255, 240 / 255);

// The standard PDF fonts can't write every character
const SAFE = /[^\x20-\x7E -ÿ€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ]/g;
const clean = (s: string) => (s || "").replace(/\t/g, " ").replace(SAFE, "");

type Fonts = { regular: PDFFont; bold: PDFFont; italic: PDFFont; script: PDFFont };

class Writer {
  doc: PDFDocument;
  f: Fonts;
  page!: PDFPage;
  y = 0;
  constructor(doc: PDFDocument, f: Fonts) {
    this.doc = doc;
    this.f = f;
  }
  newPage() {
    this.page = this.doc.addPage([A4.w, A4.h]);
    this.y = A4.h - M;
    return this.page;
  }
  need(h: number) {
    if (this.y - h < M + 24) this.newPage();
  }
  // Writes words with bold parts, wrapped to the page width
  runs(parts: { text: string; bold: boolean }[], size: number, opts: { indent?: number; color?: ReturnType<typeof rgb>; lead?: number; bullet?: boolean } = {}) {
    const indent = opts.indent ?? 0;
    const width = A4.w - M * 2 - indent;
    const lineH = size * (opts.lead ?? 1.45);
    const words: { w: string; bold: boolean }[] = [];
    parts.forEach((p) => clean(p.text).split(/(\s+)/).forEach((w) => w && words.push({ w, bold: p.bold })));
    let line: { w: string; bold: boolean }[] = [];
    let lineW = 0;
    let first = true;
    const flush = () => {
      this.need(lineH);
      let x = M + indent;
      if (opts.bullet && first) this.page.drawText("•", { x: x - 10, y: this.y - size, size, font: this.f.regular, color: opts.color || NAVY });
      // drop trailing space
      while (line.length && !line[line.length - 1].w.trim()) line.pop();
      for (const seg of line) {
        const font = seg.bold ? this.f.bold : this.f.regular;
        this.page.drawText(seg.w, { x, y: this.y - size, size, font, color: opts.color || NAVY });
        x += font.widthOfTextAtSize(seg.w, size);
      }
      this.y -= lineH;
      line = [];
      lineW = 0;
      first = false;
    };
    for (const word of words) {
      const font = word.bold ? this.f.bold : this.f.regular;
      const ww = font.widthOfTextAtSize(word.w, size);
      if (!word.w.trim() && !line.length) continue;
      if (lineW + ww > width && line.length) flush();
      if (!word.w.trim() && !line.length) continue;
      line.push(word);
      lineW += ww;
    }
    if (line.length) flush();
  }
  text(s: string, size: number, font: PDFFont, color = NAVY, x = M) {
    this.need(size * 1.5);
    this.page.drawText(clean(s), { x, y: this.y - size, size, font, color });
    this.y -= size * 1.5;
  }
  rule(gap = 10) {
    this.need(gap * 2);
    this.y -= gap;
    this.page.drawLine({ start: { x: M, y: this.y }, end: { x: A4.w - M, y: this.y }, thickness: 0.6, color: LIGHT });
    this.y -= gap;
  }
}

function header(w: Writer, title: string) {
  w.newPage();
  w.page.drawRectangle({ x: 0, y: A4.h - 6, width: A4.w, height: 6, color: ORANGE });
  w.page.drawText(AGENCY.name, { x: M, y: A4.h - 36, size: 9, font: w.f.bold, color: GREY });
  w.y = A4.h - M - 10;
  w.text(title, 18, w.f.bold);
  w.y -= 4;
}

export type SignerRow = Any;
export type EventRow = Any;

export async function buildSignedPdf(opts: {
  envelope: Any;
  signers: SignerRow[];
  events: EventRow[];
  originalPdf: Uint8Array | null; // for uploaded PDFs
}) {
  const { envelope: env, signers, events, originalPdf } = opts;
  const doc = originalPdf ? await PDFDocument.load(originalPdf, { ignoreEncryption: true }) : await PDFDocument.create();
  const f: Fonts = {
    regular: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
    italic: await doc.embedFont(StandardFonts.HelveticaOblique),
    script: await doc.embedFont(StandardFonts.TimesRomanBoldItalic),
  };
  const w = new Writer(doc, f);
  const id = shortId(env.id);

  // 1. The document itself (written terms)
  if (!originalPdf) {
    w.newPage();
    w.page.drawRectangle({ x: 0, y: A4.h - 6, width: A4.w, height: 6, color: ORANGE });
    w.page.drawText(AGENCY.name, { x: M, y: A4.h - 36, size: 9, font: f.bold, color: GREY });
    w.y = A4.h - M - 6;
    for (const b of parseDoc(env.body || "")) {
      if (b.kind === "h1") {
        w.need(40);
        w.runs(b.runs.map((r) => ({ ...r, bold: true })), 17, { lead: 1.3 });
        w.y -= 8;
      } else if (b.kind === "h2") {
        w.need(40);
        w.y -= 8;
        w.runs(b.runs.map((r) => ({ ...r, bold: true })), 11.5, { lead: 1.35 });
        w.y -= 2;
      } else if (b.kind === "li") {
        w.runs(b.runs, 10, { indent: 14, bullet: true });
        w.y -= 2;
      } else {
        w.runs(b.runs, 10);
        w.y -= 7;
      }
    }
  }
  const docPages = doc.getPageCount();

  // 2. Signatures
  header(w, "Signatures");
  w.runs([{ text: `${env.title}. Signed electronically through ${AGENCY.name}. Each signer confirmed they had read the document, agreed to it and were authorised to sign it.`, bold: false }], 9.5, { color: GREY });
  w.y -= 10;

  const blocks: { name: string; title: string; org: string; when: string; image: Any; typed: string }[] = [];
  if (env.sender_signed_at) blocks.push({ name: env.sender_name || AGENCY.signer, title: env.sender_title || AGENCY.signerTitle, org: AGENCY.name, when: env.sender_signed_at, image: null, typed: env.sender_name || AGENCY.signer });
  for (const s of signers.filter((x) => x.signed_at)) {
    let image = null;
    if (s.signature_type === "drawn" && typeof s.signature_data === "string" && s.signature_data.startsWith("data:image/png;base64,")) {
      try {
        image = await doc.embedPng(Buffer.from(s.signature_data.split(",")[1], "base64"));
      } catch {
        image = null;
      }
    }
    blocks.push({ name: s.signed_name || s.name, title: s.job_title || "", org: env.company_name || "", when: s.signed_at, image, typed: s.signed_name || s.name });
  }
  for (const b of blocks) {
    w.need(120);
    const top = w.y;
    w.page.drawRectangle({ x: M, y: top - 104, width: A4.w - M * 2, height: 104, borderColor: LIGHT, borderWidth: 0.8, color: rgb(1, 1, 1) });
    if (b.image) {
      const dims = b.image.scaleToFit(220, 52);
      w.page.drawImage(b.image, { x: M + 14, y: top - 14 - dims.height, width: dims.width, height: dims.height });
    } else {
      w.page.drawText(clean(b.typed), { x: M + 14, y: top - 48, size: 24, font: f.script, color: NAVY });
    }
    w.page.drawLine({ start: { x: M + 14, y: top - 62 }, end: { x: M + 260, y: top - 62 }, thickness: 0.6, color: GREY });
    w.page.drawText(clean(`${b.name}${b.title ? `, ${b.title}` : ""}`), { x: M + 14, y: top - 78, size: 10, font: f.bold, color: NAVY });
    w.page.drawText(clean(b.org), { x: M + 14, y: top - 92, size: 9, font: f.regular, color: GREY });
    w.page.drawText(clean(`Signed ${ukDateTime(b.when)}`), { x: M + 290, y: top - 78, size: 9, font: f.regular, color: GREY });
    w.y = top - 116;
  }

  // 3. Signing certificate
  header(w, "Signing certificate");
  const row = (k: string, v: string) => {
    w.need(16);
    w.page.drawText(clean(k), { x: M, y: w.y - 9, size: 9, font: f.bold, color: GREY });
    const lines = wrap(clean(v), f.regular, 9, A4.w - M * 2 - 150);
    lines.forEach((l, i) => w.page.drawText(l, { x: M + 150, y: w.y - 9 - i * 12, size: 9, font: f.regular, color: NAVY }));
    w.y -= Math.max(1, lines.length) * 12 + 4;
  };
  row("Document", env.title);
  row("Document ID", id);
  row("Sent by", `${env.sender_name || AGENCY.signer}, ${AGENCY.name} (${AGENCY.email})`);
  row("Sent", ukDateTime(env.sent_at));
  row("Completed", ukDateTime(env.completed_at));
  row("Original fingerprint", `SHA-256 ${env.doc_hash}`);
  w.y -= 4;
  w.runs([{ text: "The fingerprint is a unique code worked out from the document as it was sent. If even one character of it had changed, the fingerprint would be completely different.", bold: false }], 8.5, { color: GREY });

  for (const s of signers) {
    w.rule(10);
    w.text(`${s.name}${s.job_title ? `, ${s.job_title}` : ""}`, 11, f.bold);
    row("Email", s.email);
    row("Identity check", s.verified_at ? `Entered a one-time code sent to ${s.email} at ${ukDateTime(s.verified_at)}` : "Not verified");
    row("Signature", s.signed_at ? (s.signature_type === "drawn" ? "Drawn by hand" : `Typed: "${s.signed_name}"`) : s.declined_at ? `Declined: ${s.decline_reason || "no reason given"}` : "Not signed");
    if (s.signed_at) row("Signed", ukDateTime(s.signed_at));
    if (s.ip) row("IP address", s.ip);
    if (s.user_agent) row("Device", deviceName(s.user_agent));
  }

  w.rule(10);
  w.text("History", 11, f.bold);
  for (const e of events) {
    row(ukDateTime(e.at).replace(/:\d\d (GMT|BST)/, " $1"), `${e.detail}${e.ip ? ` (IP ${e.ip})` : ""}`);
  }

  // Footer on every page
  const total = doc.getPageCount();
  doc.getPages().forEach((p, i) => {
    const { width } = p.getSize();
    const label = `${env.title} · Document ID ${id} · Page ${i + 1} of ${total}`;
    p.drawText(clean(label), { x: Math.max(20, (width - f.regular.widthOfTextAtSize(clean(label), 7.5)) / 2), y: 18, size: 7.5, font: f.regular, color: GREY });
  });

  doc.setTitle(`${env.title} (signed)`);
  doc.setAuthor(AGENCY.name);
  doc.setProducer(`${AGENCY.name} e-signatures`);
  const bytes = await doc.save();
  return { bytes, docPages };
}

function wrap(text: string, font: PDFFont, size: number, width: number) {
  const out: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    const test = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(test, size) > width && line) {
      out.push(line);
      line = word;
    } else line = test;
  }
  if (line) out.push(line);
  // very long words (like fingerprints) get split
  return out.flatMap((l) => {
    if (font.widthOfTextAtSize(l, size) <= width) return [l];
    const parts: string[] = [];
    let cur = "";
    for (const ch of l) {
      if (font.widthOfTextAtSize(cur + ch, size) > width) {
        parts.push(cur);
        cur = ch;
      } else cur += ch;
    }
    if (cur) parts.push(cur);
    return parts;
  });
}
