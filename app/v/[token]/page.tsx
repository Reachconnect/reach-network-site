// Public watch page for a video from the Video studio. The thumbnail shows when the link is shared.
import type { Metadata } from "next";
import { admin } from "@/lib/crmServer";
import { SENDER_ADDRESS } from "@/lib/specs";
import { VIDEO_BUCKET, publicUrl, watchUrl } from "@/lib/videos";
import WatchClient from "./WatchClient";

export const dynamic = "force-dynamic";

async function getVideo(token: string) {
  const { data } = await admin().from("crm_videos").select("*").eq("token", token).eq("deleted", false).maybeSingle();
  return data;
}

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const { token } = await params;
  const v = await getVideo(token);
  if (!v) return { title: "Video | Reach Network Recruitment", robots: { index: false, follow: false } };
  const thumb = publicUrl(v.thumb_path);
  const description = `A short video from ${v.presenter_name || "Reach Network Recruitment"}${v.presenter_title ? `, ${v.presenter_title}` : ""}.`;
  return {
    title: `${v.title} | Reach Network Recruitment`,
    description,
    robots: { index: false, follow: false },
    openGraph: {
      title: v.title,
      description,
      url: watchUrl(v.token),
      type: "video.other",
      images: thumb ? [{ url: thumb, width: 1280, height: 720 }] : [],
    },
    twitter: { card: "summary_large_image", title: v.title, description, images: thumb ? [thumb] : [] },
  };
}

export default async function WatchPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ preview?: string }> }) {
  const { token } = await params;
  const { preview } = await searchParams;
  const v = await getVideo(token);

  if (!v) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold text-slate-900">This video is no longer available</h1>
          <a href="/" className="mt-6 inline-block rounded-lg bg-[#F7931E] px-5 py-3 font-semibold text-white">
            Visit Reach Network Recruitment
          </a>
        </div>
      </main>
    );
  }

  const { data: signed } = await admin().storage.from(VIDEO_BUCKET).createSignedUrl(v.video_path, 12 * 3600);

  return (
    <WatchClient
      token={v.token}
      preview={preview === "1"}
      title={v.title}
      videoUrl={signed?.signedUrl ?? ""}
      poster={publicUrl(v.thumb_path)}
      presenter={v.presenter_name}
      presenterTitle={v.presenter_title}
      replyTo={SENDER_ADDRESS}
    />
  );
}
