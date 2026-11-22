// /api/crm/videos: the Video studio (agency staff only)
// GET                          your videos and your studio settings
// POST action "upload"         a one-off upload address ({ kind: video | gif | thumb | logo | background, ext })
// POST action "save"           saves a finished video and returns its link
// POST action "profile"        saves your name, job title, logo, background and script
// POST action "rename"         { id, title }
// POST action "delete"         { id }
// POST action "download"       { id } a download link for the video file
import { NextResponse } from "next/server";
import { admin, requireAgency } from "@/lib/crmServer";
import { newToken } from "@/lib/specs";
import { PUBLIC_BUCKET, VIDEO_BUCKET, publicUrl, watchUrl } from "@/lib/videos";

export const dynamic = "force-dynamic";

const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });
const safePath = (v: unknown) => (typeof v === "string" && /^[\w\-./]+$/.test(v) && !v.includes("..") ? v : null);
const str = (v: unknown, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function shape(v: any, playUrl: string | null = null) {
  return {
    id: v.id,
    title: v.title,
    created_at: v.created_at,
    duration_seconds: v.duration_seconds,
    view_count: v.view_count || 0,
    play_count: v.play_count || 0,
    last_viewed_at: v.last_viewed_at,
    video_path: v.video_path,
    mime: v.mime,
    link: watchUrl(v.token),
    gif_url: publicUrl(v.gif_path),
    thumb_url: publicUrl(v.thumb_path),
    play_url: playUrl,
  };
}

export async function GET(request: Request) {
  const userId = await requireAgency(request);
  if (!userId) return fail("Please log in again.", 401);
  const db = admin();
  const [{ data: videos, error }, { data: profile }] = await Promise.all([
    db.from("crm_videos").select("*").eq("deleted", false).order("created_at", { ascending: false }).limit(100),
    db.from("crm_video_profile").select("*").eq("user_id", userId).maybeSingle(),
  ]);
  if (error) return fail(`${error.message}. Has the video SQL been run?`, 500);

  const list = videos ?? [];
  const signed = list.length ? (await db.storage.from(VIDEO_BUCKET).createSignedUrls(list.map((v) => v.video_path), 3600)).data ?? [] : [];
  return NextResponse.json({
    videos: list.map((v, i) => shape(v, signed[i]?.signedUrl ?? null)),
    profile: profile
      ? { ...profile, logo_url: publicUrl(profile.logo_path), background_url: publicUrl(profile.background_path) }
      : null,
  });
}

export async function POST(request: Request) {
  const userId = await requireAgency(request);
  if (!userId) return fail("Please log in again.", 401);
  const body = await request.json().catch(() => ({}));
  const db = admin();

  if (body.action === "upload") {
    const kind = String(body.kind || "");
    if (!["video", "gif", "thumb", "logo", "background"].includes(kind)) return fail("Unknown upload.");
    const ext = String(body.ext || "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5) || (kind === "video" ? "mp4" : "png");
    const bucket = kind === "video" ? VIDEO_BUCKET : PUBLIC_BUCKET;
    const path = `${kind === "video" ? "studio" : kind}/${new Date().toISOString().slice(0, 10)}/${newToken()}.${ext}`;
    const { data, error } = await db.storage.from(bucket).createSignedUploadUrl(path);
    if (error || !data) return fail(`Couldn't get ready to upload: ${error?.message || "unknown error"}. Have the storage buckets been created?`, 500);
    return NextResponse.json({ bucket, path: data.path, token: data.token, url: kind === "video" ? null : publicUrl(data.path) });
  }

  if (body.action === "save") {
    const videoPath = safePath(body.video_path);
    if (!videoPath) return fail("The video didn't upload.");
    const { data: profile } = await db.from("crm_video_profile").select("name, job_title").eq("user_id", userId).maybeSingle();
    const token = newToken();
    const { data, error } = await db
      .from("crm_videos")
      .insert({
        token,
        title: str(body.title, 160) || "My video",
        video_path: videoPath,
        gif_path: safePath(body.gif_path),
        thumb_path: safePath(body.thumb_path),
        mime: str(body.mime, 80) || null,
        duration_seconds: Math.max(0, Math.min(3600, Math.round(Number(body.duration_seconds) || 0))),
        presenter_name: profile?.name || null,
        presenter_title: profile?.job_title || null,
        created_by: userId,
      })
      .select("*")
      .single();
    if (error) return fail(`Couldn't save the video: ${error.message}`, 500);
    return NextResponse.json({ video: shape(data) });
  }

  if (body.action === "profile") {
    const row = {
      user_id: userId,
      name: str(body.name, 100) || null,
      job_title: str(body.job_title, 100) || null,
      extra_line: str(body.extra_line, 120) || null,
      logo_path: safePath(body.logo_path),
      logo_corner: ["top-left", "top-right", "bottom-right"].includes(body.logo_corner) ? body.logo_corner : "top-right",
      logo_box: !!body.logo_box,
      background_path: safePath(body.background_path),
      script: typeof body.script === "string" ? body.script.slice(0, 20000) : null,
      updated_at: new Date().toISOString(),
    };
    const { error } = await db.from("crm_video_profile").upsert(row, { onConflict: "user_id" });
    if (error) return fail(`Couldn't save your settings: ${error.message}`, 500);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "rename") {
    await db.from("crm_videos").update({ title: str(body.title, 160) || "My video" }).eq("id", body.id);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "delete") {
    const { data: v } = await db.from("crm_videos").select("*").eq("id", body.id).maybeSingle();
    if (!v) return fail("Video not found.", 404);
    // Keep the file if a spec page still uses it
    const { count } = await db.from("crm_specs").select("id", { count: "exact", head: true }).eq("video_path", v.video_path).eq("withdrawn", false);
    if (!count) await db.storage.from(VIDEO_BUCKET).remove([v.video_path]);
    const extras = [v.gif_path, v.thumb_path].filter(Boolean) as string[];
    if (extras.length) await db.storage.from(PUBLIC_BUCKET).remove(extras);
    await db.from("crm_videos").update({ deleted: true }).eq("id", v.id);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "download") {
    const { data: v } = await db.from("crm_videos").select("video_path, title").eq("id", body.id).maybeSingle();
    if (!v) return fail("Video not found.", 404);
    const ext = v.video_path.split(".").pop() || "mp4";
    const name = `${(v.title || "video").replace(/[^\w\- ]+/g, "").trim() || "video"}.${ext}`;
    const { data } = await db.storage.from(VIDEO_BUCKET).createSignedUrl(v.video_path, 600, { download: name });
    return NextResponse.json({ url: data?.signedUrl ?? null });
  }

  return fail("Unknown action.");
}
