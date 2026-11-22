// POST /api/m/u/[token]: unsubscribe (from the page, or the one-click button in Gmail and Outlook)
import { NextResponse } from "next/server";
import { admin } from "@/lib/crmServer";

export const dynamic = "force-dynamic";

export async function POST(_: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const db = admin();
  const { data: s } = await db.from("crm_mail_sends").select("id, email, unsubscribed_at").eq("token", token).maybeSingle();
  if (!s) return NextResponse.json({ error: "Not found." }, { status: 404 });
  await Promise.all([
    s.unsubscribed_at ? Promise.resolve() : db.from("crm_mail_sends").update({ unsubscribed_at: new Date().toISOString() }).eq("id", s.id),
    db.from("crm_mail_suppressions").upsert({ email: s.email, reason: "unsubscribed" }, { onConflict: "email" }),
  ]);
  return NextResponse.json({ ok: true });
}
