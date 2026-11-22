// Server only: shared bits for spec pages (anonymised candidate links sent to prospective clients)
import crypto from "crypto";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://reachnetworkrec.com").replace(/\/$/, "");
export const ALERT_TO = process.env.SPEC_ALERT_EMAIL || "darrenrowell@reachnetworkrec.com";

export type SpecContent = {
  display_name: string; // e.g. "Simon B."
  headline: string;
  why: string; // why they'd suit this employer
  checklist: string[]; // confirmed facts, shown with ticks
  highlights: string[]; // skills
  qualifications: string[];
  experience: { title: string; period: string }[]; // no employer names
  area: string; // town or area only
  availability: string;
  salary: string;
  job_type: string;
  more_count: number; // similar candidates nearby
};

export function newToken() {
  return crypto.randomBytes(18).toString("base64url");
}

export function specUrl(token: string) {
  return `${SITE_URL}/spec/${token}`;
}

// Tidies anything the AI or the recruiter sends us
export function cleanContent(raw: Partial<SpecContent> | null | undefined): SpecContent {
  const str = (v: unknown, max = 300) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  const list = (v: unknown, max = 12, len = 160) => (Array.isArray(v) ? v.map((x) => str(x, len)).filter(Boolean).slice(0, max) : []);
  return {
    display_name: str(raw?.display_name, 60) || "Candidate",
    headline: str(raw?.headline, 160),
    why: str(raw?.why, 800),
    checklist: list(raw?.checklist, 8),
    highlights: list(raw?.highlights, 12, 80),
    qualifications: list(raw?.qualifications, 12, 120),
    experience: (Array.isArray(raw?.experience) ? raw!.experience : [])
      .slice(0, 6)
      .map((e) => ({ title: str(e?.title, 100), period: str(e?.period, 60) }))
      .filter((e) => e.title),
    area: str(raw?.area, 80),
    availability: str(raw?.availability, 80),
    salary: str(raw?.salary, 80),
    job_type: str(raw?.job_type, 40),
    more_count: Math.max(0, Math.min(999, Number(raw?.more_count) || 0)),
  };
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Sends an alert email to the recruiter. Never throws: a failed email mustn't break the page.
export async function sendAlert(subject: string, lines: string[], link?: { label: string; url: string }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.error("Spec alert not sent: RESEND_API_KEY is missing.");
    return;
  }
  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#0F2438">
    <div style="background:#0F2438;padding:18px 24px;border-radius:12px 12px 0 0">
      <span style="color:#ffffff;font-size:18px;font-weight:bold">Reach CRM</span>
    </div>
    <div style="border:1px solid #e2e8f0;border-top:none;padding:24px;border-radius:0 0 12px 12px">
      ${lines.map((l) => `<p style="font-size:15px;line-height:1.6;margin:0 0 12px">${esc(l)}</p>`).join("")}
      ${link ? `<a href="${link.url}" style="display:inline-block;margin-top:8px;background:#F7931E;color:#ffffff;text-decoration:none;font-weight:bold;padding:10px 20px;border-radius:8px">${esc(link.label)}</a>` : ""}
    </div>
  </div>`;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: "Reach CRM <hello@reachnetworkrec.com>", to: [ALERT_TO], subject, html }),
    });
    if (!res.ok) console.error("Spec alert failed:", await res.text());
  } catch (e) {
    console.error("Spec alert failed:", e);
  }
}

// =====================================================================
// Sending a spec email to a prospect (the template itself is in lib/specEmail.ts)
// =====================================================================

export const SENDER = process.env.SPEC_FROM_EMAIL || "Darren Rowell <darrenrowell@reachnetworkrec.com>";
export const SENDER_ADDRESS = (SENDER.match(/<([^>]+)>/)?.[1] || SENDER).trim();
export const VIDEO_BUCKET = "spec-videos";

export async function sendSpecEmail(to: string, subject: string, text: string, html: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, error: "Email sending isn't set up (RESEND_API_KEY missing)." };
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: SENDER, to: [to], reply_to: SENDER_ADDRESS, subject, text, html }),
    });
    if (!res.ok) return { ok: false, error: (await res.text()).slice(0, 200) };
    return { ok: true, error: null };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
