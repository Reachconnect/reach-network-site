// POST /api/crm/campaigns/send: send the next batch of a campaign
import { NextResponse } from "next/server";
import { admin, DAILY_LIMIT, fillVariables, GRAPH, renderBody, requireAgency, whatsappConfig } from "@/lib/crmServer";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BATCH = 20;

export async function POST(request: Request) {
  if (!(await requireAgency(request))) return NextResponse.json({ error: "Please log in again." }, { status: 401 });

  const { campaignId } = await request.json().catch(() => ({}));
  const db = admin();
  const { data: campaign } = await db.from("crm_campaigns").select("*").eq("id", campaignId).maybeSingle();
  if (!campaign) return NextResponse.json({ error: "Campaign not found." }, { status: 404 });

  const { token, phoneNumberId } = whatsappConfig();
  if (!token || !phoneNumberId) return NextResponse.json({ error: "WhatsApp isn't set up on the website yet." }, { status: 500 });

  // Shared daily limit with ReachConnect: count every template sent today
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);
  const { count: sentToday } = await db
    .from("whatsapp_messages")
    .select("id", { count: "exact", head: true })
    .eq("direction", "outbound")
    .not("template_name", "is", null)
    .gte("created_at", startOfDay.toISOString());
  const allowance = Math.max(0, DAILY_LIMIT - (sentToday ?? 0));

  let sent = 0;
  let failed = 0;

  if (allowance > 0) {
    const { data: queue } = await db
      .from("crm_campaign_recipients")
      .select("id, phone, candidate_id, crm_candidates(first_name)")
      .eq("campaign_id", campaign.id)
      .eq("status", "queued")
      .limit(Math.min(BATCH, allowance));

    for (const r of (queue ?? []) as unknown as { id: string; phone: string; candidate_id: string | null; crm_candidates: { first_name: string } | null }[]) {
      const values = fillVariables((campaign.variables as string[]) || [], r.crm_candidates?.first_name ?? null);
      const res = await fetch(`${GRAPH}/${phoneNumberId}/messages`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: r.phone,
          type: "template",
          template: {
            name: campaign.template_name,
            language: { code: campaign.template_language },
            components: values.length ? [{ type: "body", parameters: values.map((text) => ({ type: "text", text })) }] : [],
          },
        }),
      });
      const data = await res.json().catch(() => ({}));
      const waId = (data?.messages?.[0]?.id as string) || null;
      const text = campaign.template_body ? renderBody(campaign.template_body, values) : `Template: ${campaign.template_name}`;

      // Shows in the ReachConnect inbox like any other message
      await db.from("whatsapp_messages").insert({
        phone: r.phone,
        direction: "outbound",
        message: text,
        template_name: campaign.template_name,
        wa_message_id: waId,
        status: res.ok ? "sent" : "failed",
      });

      if (res.ok) {
        sent++;
        await db.from("crm_campaign_recipients").update({ status: "sent", sent_at: new Date().toISOString(), wa_message_id: waId }).eq("id", r.id);
        if (r.candidate_id) {
          await db.from("crm_notes").insert({ candidate_id: r.candidate_id, kind: "whatsapp", body: `Sent perm campaign "${campaign.name}":\n${text}` });
          await db.from("crm_candidates").update({ last_contacted_at: new Date().toISOString() }).eq("id", r.candidate_id);
        }
      } else {
        failed++;
        await db
          .from("crm_campaign_recipients")
          .update({ status: "failed", error: String(data?.error?.message || "WhatsApp didn't accept it").slice(0, 300) })
          .eq("id", r.id);
      }
    }
  }

  // Refresh the campaign's totals
  const { data: all } = await db.from("crm_campaign_recipients").select("status").eq("campaign_id", campaign.id);
  const tally = { queued: 0, sent: 0, failed: 0, replied: 0 };
  for (const row of (all ?? []) as { status: keyof typeof tally }[]) tally[row.status]++;
  await db
    .from("crm_campaigns")
    .update({
      sent_count: tally.sent + tally.replied,
      failed_count: tally.failed,
      replied_count: tally.replied,
      status: tally.queued === 0 ? "sent" : "sending",
    })
    .eq("id", campaign.id);

  return NextResponse.json({
    sent,
    failed,
    remaining: tally.queued,
    limitReached: tally.queued > 0 && allowance - sent - failed <= 0,
  });
}