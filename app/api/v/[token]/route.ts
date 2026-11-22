// POST /api/v/[token]: someone opened or played one of your videos (public, no login)
import { NextResponse } from "next/server";
import { admin } from "@/lib/crmServer";
import { SITE_URL, sendAlert } from "@/lib/specs";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const body = await request.json().catch(() => ({}));
  const db = admin();
  const { data: v } = await db.from("crm_videos").select("*").eq("token", token).eq("deleted", false).maybeSingle();
  if (!v) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const now = new Date();

  if (body.event === "open") {
    const last = v.last_viewed_at ? new Date(v.last_viewed_at) : null;
    await db
      .from("crm_videos")
      .update({ view_count: (v.view_count || 0) + 1, first_viewed_at: v.first_viewed_at || now.toISOString(), last_viewed_at: now.toISOString() })
      .eq("id", v.id);
    // An email the first time, then at most one an hour
    if (!last || now.getTime() - last.getTime() > 3600 * 1000) {
      await sendAlert(
        `Someone opened your video: ${v.title}`,
        [`Your video "${v.title}" has just been opened.`, `That's ${(v.view_count || 0) + 1} view${v.view_count ? "s" : ""} so far.`],
        { label: "Open the Video studio", url: `${SITE_URL}/crm/videos` }
      );
    }
    return NextResponse.json({ ok: true });
  }

  if (body.event === "play") {
    await db.from("crm_videos").update({ play_count: (v.play_count || 0) + 1 }).eq("id", v.id);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown event." }, { status: 400 });
}
