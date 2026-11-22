// Email campaigns from the CRM: building each person's email, tracked links and unsubscribe
import crypto from "crypto";
import { SENDER, SENDER_ADDRESS, SITE_URL } from "./specs";

export const MAIL_FILES_BUCKET = "mail-files"; // private: files people can download from an email
export const DAILY_LIMIT = Number(process.env.MAIL_DAILY_LIMIT || 1000);

const SECRET = process.env.MAIL_LINK_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "reach";

export function sign(token: string, url: string) {
  return crypto.createHmac("sha256", SECRET).update(`${token}|${url}`).digest("base64url").slice(0, 16);
}

export function trackedLink(token: string, url: string) {
  return `${SITE_URL}/api/m/c/${token}?u=${encodeURIComponent(url)}&s=${sign(token, url)}`;
}

export const EMAIL_RE = /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]{2,}$/;

export { merge, type Recipient, type CampaignContent } from "./mailTemplate";
import { buildEmail as buildTemplate, type CampaignContent, type Recipient } from "./mailTemplate";

export function buildEmail(c: CampaignContent, r: Recipient, token: string, track = true) {
  return buildTemplate(c, r, token, track, trackedLink);
}

// Sends up to 100 emails in one go through Resend
export async function sendBatch(emails: { to: string; subject: string; html: string; text: string; headers?: Record<string, string> }[]) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, ids: [] as string[], error: "Email sending isn't set up (RESEND_API_KEY missing)." };
  const res = await fetch("https://api.resend.com/emails/batch", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(emails.map((e) => ({ from: SENDER, reply_to: SENDER_ADDRESS, to: [e.to], subject: e.subject, html: e.html, text: e.text, headers: e.headers }))),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) return { ok: false, ids: [], error: (json?.message || json?.error || `Email service error ${res.status}`).toString().slice(0, 300) };
  return { ok: true, ids: ((json?.data ?? []) as { id: string }[]).map((d) => d.id), error: null };
}

export async function sendOne(to: string, e: { subject: string; html: string; text: string }) {
  const r = await sendBatch([{ to, ...e }]);
  return r.ok ? { ok: true, error: null } : { ok: false, error: r.error };
}
