// POST /api/spec/[token]: what a prospect does on a spec page (public, no login)
// event "open"        they opened it
// event "ping"        still reading (sent every 15 seconds while the page is visible)
// event "interested"  they want a call
// event "not_hiring"  not right now, with an optional "try again in" period
import { NextResponse } from "next/server";
import { admin } from "@/lib/crmServer";
import { SITE_URL, sendAlert } from "@/lib/specs";

export const dynamic = "force-dynamic";

const str = (v: unknown, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const body = await request.json().catch(() => ({}));
  const db = admin();

  const { data: spec } = await db
    .from("crm_specs")
    .select("id, candidate_id, company_id, company_name, contact_name, role_title, content, expires_at, withdrawn, first_opened_at, last_opened_at, open_count, view_seconds, crm_candidates(first_name, last_name)")
    .eq("token", token)
    .maybeSingle();
  if (!spec || spec.withdrawn || (spec.expires_at && new Date(spec.expires_at) < new Date())) {
    return NextResponse.json({ error: "This link is no longer active." }, { status: 404 });
  }

  const now = new Date();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cand = spec.crm_candidates as any as { first_name: string; last_name: string | null } | null;
  const who = cand ? `${cand.first_name}${cand.last_name ? ` ${cand.last_name}` : ""}` : "your candidate";
  const crmLink = { label: "Open in CRM", url: `${SITE_URL}/crm/candidates/view?id=${spec.candidate_id}` };

  if (body.event === "open") {
    const last = spec.last_opened_at ? new Date(spec.last_opened_at) : null;
    await db
      .from("crm_specs")
      .update({ open_count: (spec.open_count || 0) + 1, first_opened_at: spec.first_opened_at || now.toISOString(), last_opened_at: now.toISOString() })
      .eq("id", spec.id);

    // Email on the first open, and again if they come back after a day or more
    if (!last || now.getTime() - last.getTime() > 24 * 3600 * 1000) {
      const again = !!last;
      await sendAlert(
        `${spec.company_name} ${again ? "is looking at" : "opened"} your spec for ${who}`,
        [
          `${spec.contact_name ? `${spec.contact_name} at ` : ""}${spec.company_name} has ${again ? "come back to" : "just opened"} the profile you sent for ${who}${spec.role_title ? ` (${spec.role_title})` : ""}.`,
          again ? `That's ${(spec.open_count || 0) + 1} views so far.` : "Now's a good time to give them a call.",
        ],
        crmLink
      );
      if (spec.company_id) {
        await db.from("crm_notes").insert({ company_id: spec.company_id, kind: "note", body: `${again ? "Came back to" : "Opened"} the spec page for ${who}.` });
      }
    }
    return NextResponse.json({ ok: true });
  }

  if (body.event === "ping") {
    const seconds = Math.min((spec.view_seconds || 0) + 15, 6 * 3600);
    await db.from("crm_specs").update({ view_seconds: seconds }).eq("id", spec.id);
    return NextResponse.json({ ok: true });
  }

  if (body.event === "interested") {
    const details = {
      name: str(body.name, 100),
      phone: str(body.phone, 40),
      email: str(body.email, 160),
      best_time: str(body.best_time, 40),
      message: str(body.message, 1000),
    };
    if (!details.name || (!details.phone && !details.email)) {
      return NextResponse.json({ error: "Please add your name and a phone number or email." }, { status: 400 });
    }
    await db.from("crm_specs").update({ response: "interested", response_at: now.toISOString(), response_details: details }).eq("id", spec.id);

    const summary = `${details.name}${details.phone ? `, ${details.phone}` : ""}${details.email ? `, ${details.email}` : ""}${details.best_time ? `. Best time: ${details.best_time}` : ""}${details.message ? `. "${details.message}"` : ""}`;
    if (spec.company_id) {
      await Promise.all([
        db.from("crm_notes").insert({ company_id: spec.company_id, kind: "note", body: `Interested in ${who} via the spec page. ${summary}` }),
        db.from("crm_reminders").insert({ company_id: spec.company_id, title: `Call ${details.name} at ${spec.company_name} about ${who}`, due_at: now.toISOString() }),
        details.phone || details.email
          ? db.from("crm_contacts").insert({ company_id: spec.company_id, name: details.name, phone: details.phone || null, email: details.email || null })
          : Promise.resolve(),
      ]);
    }
    await db.from("crm_notes").insert({ candidate_id: spec.candidate_id, kind: "note", body: `${spec.company_name} is interested (spec page). ${summary}` });
    await sendAlert(`🔥 ${spec.company_name} is interested in ${who}`, [`${spec.company_name} wants to talk about ${who}${spec.role_title ? ` (${spec.role_title})` : ""}.`, summary], crmLink);
    return NextResponse.json({ ok: true });
  }

  if (body.event === "not_hiring") {
    const months = Math.max(0, Math.min(12, Number(body.retry_months) || 0));
    const reason = str(body.reason, 500);
    await db.from("crm_specs").update({ response: "not_hiring", response_at: now.toISOString(), response_details: { retry_months: months, reason } }).eq("id", spec.id);
    if (spec.company_id) {
      await db.from("crm_notes").insert({
        company_id: spec.company_id,
        kind: "note",
        body: `Not hiring right now (spec page for ${who}).${reason ? ` "${reason}"` : ""}${months ? ` Try again in ${months} month${months > 1 ? "s" : ""}.` : ""}`,
      });
      if (months) {
        const due = new Date(now);
        due.setMonth(due.getMonth() + months);
        await db.from("crm_reminders").insert({ company_id: spec.company_id, title: `Follow up ${spec.company_name}: they asked to try again`, due_at: due.toISOString() });
      }
    }
    await sendAlert(
      `${spec.company_name} isn't hiring right now`,
      [`${spec.company_name} said they're not hiring at the moment (spec for ${who}).`, reason ? `Reason: ${reason}` : "", months ? `They asked you to try again in ${months} month${months > 1 ? "s" : ""}. A reminder has been set.` : ""].filter(Boolean),
      crmLink
    );
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown event." }, { status: 400 });
}
