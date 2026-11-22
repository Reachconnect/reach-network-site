// GET /api/m/o/[token]: the invisible picture in a campaign email. Loading it means they opened it.
import { admin } from "@/lib/crmServer";

export const dynamic = "force-dynamic";

const GIF = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64");

export async function GET(_: Request, { params }: { params: Promise<{ token: string }> }) {
  const token = (await params).token.replace(/\.(gif|png)$/i, "");
  try {
    const db = admin();
    const { data: s } = await db.from("crm_mail_sends").select("id, opened_at, open_count").eq("token", token).maybeSingle();
    if (s) await db.from("crm_mail_sends").update({ opened_at: s.opened_at || new Date().toISOString(), open_count: (s.open_count || 0) + 1 }).eq("id", s.id);
  } catch {
    // the picture must always load
  }
  return new Response(GIF, { headers: { "Content-Type": "image/gif", "Cache-Control": "no-store, no-cache, must-revalidate, private" } });
}
