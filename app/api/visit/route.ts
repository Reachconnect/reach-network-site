// POST /api/visit: a page view on the public website (only sent after someone accepts cookies)
// action "view" {vid, path, title, ref, ident?: {kind: mail|spec, token}}   action "time" {visitId, vid, seconds}
import { NextResponse } from "next/server";
import { admin } from "@/lib/crmServer";
import { SITE_URL, sendAlert } from "@/lib/specs";

export const dynamic = "force-dynamic";

const VID = /^[A-Za-z0-9_-]{16,40}$/;
// Pages that suggest someone is ready to talk
const HOT = [/^\/i-need-staff/, /^\/book-a-call/, /^\/book-a-demo/, /^\/contact-us/, /^\/permanent-recruitment/, /^\/temporary-recruitment/, /^\/our-services/];
const BOTS = /bot|crawl|spider|slurp|preview|facebookexternalhit|linkedin|whatsapp|scanner|safelinks|proofpoint|mimecast|barracuda/i;

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const vid = String(body.vid || "");
  if (!VID.test(vid)) return NextResponse.json({ ok: false });
  const ua = request.headers.get("user-agent") || "";
  if (BOTS.test(ua)) return NextResponse.json({ ok: false });
  const db = admin();
  const now = new Date().toISOString();

  if (body.action === "time") {
    const seconds = Math.max(0, Math.min(3600, Math.round(Number(body.seconds) || 0)));
    const { data: v } = await db.from("crm_visits").select("id, visitor_id, seconds").eq("id", String(body.visitId || "")).eq("visitor_id", vid).maybeSingle();
    if (v && seconds > (v.seconds || 0)) {
      await db.from("crm_visits").update({ seconds }).eq("id", v.id);
      const { data: who } = await db.from("crm_visitors").select("seconds").eq("id", vid).maybeSingle();
      if (who) await db.from("crm_visitors").update({ seconds: (who.seconds || 0) + seconds - (v.seconds || 0) }).eq("id", vid);
    }
    return NextResponse.json({ ok: true });
  }

  if (body.action !== "view") return NextResponse.json({ ok: false });
  const path = String(body.path || "/").slice(0, 300);
  if (!path.startsWith("/") || /^\/(crm|admin|api)/.test(path)) return NextResponse.json({ ok: false });

  // Who is it?
  let ident: Record<string, unknown> | null = null;
  const kind = body.ident?.kind;
  const token = String(body.ident?.token || "");
  if (kind === "mail" && token) {
    const { data: s } = await db.from("crm_mail_sends").select("email, first_name, last_name, company, campaign_id, crm_mail_campaigns(name)").eq("token", token).maybeSingle();
    if (s) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const camp = (s as any).crm_mail_campaigns;
      ident = {
        email: s.email,
        name: [s.first_name, s.last_name].filter(Boolean).join(" ") || null,
        company: s.company,
        source: `Email: ${(Array.isArray(camp) ? camp[0]?.name : camp?.name) || "campaign"}`,
        source_ref: s.campaign_id,
      };
    }
  } else if (kind === "spec" && token) {
    const { data: sp } = await db.from("crm_specs").select("id, company_id, company_name, contact_name, sent_to_email").eq("token", token).maybeSingle();
    if (sp) ident = { email: sp.sent_to_email || null, name: sp.contact_name, company: sp.company_name, company_id: sp.company_id, source: "Spec page", source_ref: sp.id };
  }
  if (ident?.company && !ident.company_id) {
    const { data: co } = await db.from("crm_companies").select("id").ilike("name", String(ident.company)).limit(1);
    if (co?.[0]) ident.company_id = co[0].id;
  }

  const { data: existing } = await db.from("crm_visitors").select("*").eq("id", vid).maybeSingle();
  if (!existing) {
    await db.from("crm_visitors").insert({ id: vid, first_seen: now, last_seen: now, visits: 1, pages: 1, ...(ident || {}) });
  } else {
    const newVisit = Date.now() - new Date(existing.last_seen).getTime() > 30 * 60 * 1000;
    await db
      .from("crm_visitors")
      .update({ last_seen: now, pages: (existing.pages || 0) + 1, visits: (existing.visits || 0) + (newVisit ? 1 : 0), ...(ident && !existing.email ? ident : {}) })
      .eq("id", vid);
  }

  const { data: visit } = await db
    .from("crm_visits")
    .insert({ visitor_id: vid, path, title: String(body.title || "").slice(0, 160) || null, referrer: String(body.ref || "").slice(0, 300) || null })
    .select("id")
    .single();

  // A known person looking at a "ready to talk" page: tell Darren (at most once a day per person)
  const person = existing?.email || existing?.name ? existing : ident ? { ...existing, ...ident } : null;
  if (person && HOT.some((r) => r.test(path))) {
    const last = existing?.last_alert_at ? new Date(existing.last_alert_at).getTime() : 0;
    if (Date.now() - last > 20 * 3600 * 1000) {
      await db.from("crm_visitors").update({ last_alert_at: now }).eq("id", vid);
      const who = `${person.name || person.email}${person.company ? ` at ${person.company}` : ""}`;
      await sendAlert(
        `🔥 ${who} is on your website`,
        [`${who} is looking at ${path === "/" ? "your home page" : path.replace(/^\//, "").replace(/-/g, " ")} right now.`, person.source ? `They first came from: ${person.source}.` : "", "This is a good moment to call."].filter(Boolean),
        { label: "See what they've looked at", url: `${SITE_URL}/crm/visitors` }
      );
    }
  }

  return NextResponse.json({ ok: true, visitId: visit?.id ?? null });
}
