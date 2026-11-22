"use client";

// The recruiter's short intro video at the top of a spec page
import { useRef } from "react";

export default function IntroVideo({ url, token, preview, about }: { url: string; token: string; preview: boolean; about: string }) {
  const counted = useRef(false);

  function played() {
    if (preview || counted.current) return;
    counted.current = true;
    fetch(`/api/spec/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "video_play" }),
      keepalive: true,
    }).catch(() => {});
  }

  return (
    <section className="mt-4 overflow-hidden rounded-2xl bg-white shadow-sm">
      <div className="px-6 pt-5">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#F7931E]">A quick word from Darren</p>
        <p className="mt-1 text-[15px] text-slate-600">Darren Rowell, Reach Network Recruitment, on {about}.</p>
      </div>
      <div className="mt-4 bg-black">
        <video src={url} controls playsInline preload="metadata" onPlay={played} className="mx-auto max-h-[70vh] w-full" />
      </div>
    </section>
  );
}
