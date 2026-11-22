"use client";

import { useEffect, useRef } from "react";

const NAVY = "#0F2438";
const ORANGE = "#F7931E";

function track(token: string, event: string) {
  fetch(`/api/v/${token}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ event }), keepalive: true }).catch(() => {});
}

export default function WatchClient(p: {
  token: string;
  preview: boolean;
  title: string;
  videoUrl: string;
  poster: string | null;
  presenter: string | null;
  presenterTitle: string | null;
  replyTo: string;
}) {
  const played = useRef(false);

  useEffect(() => {
    if (!p.preview) track(p.token, "open");
  }, [p.preview, p.token]);

  return (
    <main className="min-h-screen bg-slate-100 pb-16">
      {p.preview && <div className="bg-amber-100 px-4 py-2 text-center text-sm font-medium text-amber-900">Preview: views here aren&apos;t counted.</div>}
      <header style={{ background: NAVY }} className="px-5 py-5">
        <div className="mx-auto flex max-w-4xl items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg text-lg font-extrabold text-white" style={{ background: ORANGE }}>
            R
          </span>
          <span className="text-lg font-bold text-white">Reach Network Recruitment</span>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4">
        <section className="-mt-1 overflow-hidden rounded-b-2xl bg-white shadow-sm">
          <div className="bg-black">
            <video
              src={p.videoUrl}
              poster={p.poster || undefined}
              controls
              playsInline
              preload="metadata"
              className="mx-auto max-h-[75vh] w-full"
              onPlay={() => {
                if (p.preview || played.current) return;
                played.current = true;
                track(p.token, "play");
              }}
            />
          </div>
          <div className="px-6 py-5">
            <h1 className="text-2xl font-extrabold" style={{ color: NAVY }}>
              {p.title}
            </h1>
            {p.presenter && (
              <p className="mt-1 text-slate-600">
                {p.presenter}
                {p.presenterTitle ? `, ${p.presenterTitle}` : ""}
              </p>
            )}
            <div className="mt-5 flex flex-wrap gap-3">
              <a
                href={`mailto:${p.replyTo}?subject=${encodeURIComponent(`Re: ${p.title}`)}`}
                className="rounded-lg px-5 py-3 font-semibold text-white"
                style={{ background: ORANGE }}
              >
                Reply to {p.presenter?.split(" ")[0] || "us"}
              </a>
              <a href="/i-need-staff" className="rounded-lg border border-slate-300 px-5 py-3 font-semibold" style={{ color: NAVY }}>
                Tell us what staff you need
              </a>
            </div>
          </div>
        </section>
        <p className="mt-6 text-center text-xs text-slate-400">Reach Network Recruitment · reachnetworkrec.com</p>
      </div>
    </main>
  );
}
