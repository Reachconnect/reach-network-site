// POST /api/crm/campaigns: create a campaign and queue its recipients
import { NextResponse } from "next/server";
import { admin, normalizeUkPhone, requireAgency } from "@/lib/crmServer";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!(await requireAgency(request))) return NextResponse.json({ error: "Please log in again." }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const name = String(body.name || "").trim();
  const templateName = String(body.templateName || "");
  const language = String(body.language || "en_GB");
  const templateBody = String(body.templateBody || "");
  const variables = Array.isArray(body.variables) ? body.variables.map((v: unknown) => String(v ?? "")) : [];
  const candidateIds: string[] = Array.isArray(body.candidateIds) ? body.candidateIds.map(String) : [];

  if (!name) return NextResponse.json({ error: "Give the campaign a name." }, { status: 400 });
  if (!templateName) return NextResponse.json({ error: "Choose a template." }, { status: 400 });
  if (variables.some((v: string) => !v.trim())) return NextResponse.json({ error: "Fill in every gap in the template." }, { status: 400 });
  if (!candidateIds.length) return NextResponse.json({ error: "Choose at least one candidate." }, { status: 400 });
  if (candidateIds.length > 2000) return NextResponse.json({ error: "That's too many for one campaign. Split it up." }, { status: 400 });

  // Only people with a mobile number who've agreed to WhatsApp
  const { data: people, error } = await admin()
    .from("crm_candidates")
    .select("id, phone")
    .in("id", candidateIds)
    .eq("whatsapp_consent", true)
    .not("phone", "is", null);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const seen = new Set<string>();
  const recipients: { candidate_id: string; phone: string }[] = [];
  for (const p of people ?? []) {
    const phone = normalizeUkPhone(p.phone);
    if (phone.length < 11 || seen.has(phone)) continue;
    seen.add(phone);
    recipients.push({ candidate_id: p.id, phone });
  }
  if (!recipients.length) return NextResponse.json({ error: "None of those candidates can be messaged." }, { status: 400 });

  const { data: campaign, error: cErr } = await admin()
    .from("crm_campaigns")
    .insert({ name, template_name: templateName, template_language: language, template_body: templateBody, variables, total: recipients.length })
    .select("id")
    .single();
  if (cErr || !campaign) return NextResponse.json({ error: cErr?.message || "Couldn't create the campaign." }, { status: 500 });

  const { error: rErr } = await admin()
    .from("crm_campaign_recipients")
    .insert(recipients.map((r) => ({ ...r, campaign_id: campaign.id })));
  if (rErr) return NextResponse.json({ error: rErr.message }, { status: 500 });

  return NextResponse.json({ id: campaign.id, total: recipients.length, skipped: candidateIds.length - recipients.length });
}