// Video studio: where videos, GIFs, thumbnails and logos are kept
import { SITE_URL } from "./specs";

export const VIDEO_BUCKET = "spec-videos"; // private: the videos themselves
export const PUBLIC_BUCKET = "video-public"; // public: GIFs, thumbnails, logos and backgrounds (they go in emails)

export const publicUrl = (path: string | null | undefined) =>
  path ? `${(process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "")}/storage/v1/object/public/${PUBLIC_BUCKET}/${path}` : null;

export const watchUrl = (token: string) => `${SITE_URL}/v/${token}`;

export function formatDuration(seconds: number | null | undefined) {
  const s = Math.max(0, Math.round(seconds || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
