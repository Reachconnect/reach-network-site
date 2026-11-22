"use client";

// Your videos from the Video studio: links, views, copy for an email, download
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { timeAgo } from "../crm";
import { api, copyRich, emailSnippet, formatTime } from "./engine";

type Video = {
  id: string;
  title: string;
  created_at: string;
  duration_seconds: number;
  view_count: number;
  play_count: number;
  last_viewed_at: string | null;
  link: string;
  gif_url: string | null;
  thumb_url: string | null;
};

export default function VideosPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const j = await api("GET");
      setVideos(j.videos);
    } catch (e) {
      setError((e as Error).message);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function flash(key: string) {
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  async function copyEmail(v: Video) {
    const { html, text } = emailSnippet(v.link, v.gif_url, v.thumb_url, v.title, formatTime(v.duration_seconds));
    await copyRich(html, text);
    flash(`e${v.id}`);
  }

  async function download(v: Video) {
    try {
      const j = await api("POST", { action: "download", id: v.id });
      if (j.url) window.location.href = j.url;
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function rename(v: Video) {
    const title = window.prompt("Video title", v.title);
    if (!title) return;
    await api("POST", { action: "rename", id: v.id, title }).catch((e) => setError(e.message));
    load();
  }

  async function remove(v: Video) {
    if (!window.confirm(`Delete "${v.title}"? Anyone with the link won't be able to watch it.`)) return;
    await api("POST", { action: "delete", id: v.id }).catch((e) => setError(e.message));
    load();
  }

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1F3447]">Video studio</h1>
          <p className="text-sm text-slate-500">Record a short video with your logo and name on it, then send it in an email with a moving preview and play button.</p>
        </div>
        <Link href="/crm/videos/studio" className="rounded-lg bg-[#F7931E] px-4 py-2.5 text-sm font-semibold text-white hover:brightness-95">
          ● Record a video
        </Link>
      </div>

      {error && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : !videos.length ? (
        <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
          <p className="text-lg font-semibold text-[#1F3447]">No videos yet</p>
          <p className="mt-1 text-sm text-slate-500">Record your first one. It takes a minute.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((v) => (
            <div key={v.id} className="overflow-hidden rounded-2xl bg-white shadow-sm">
              <a href={`${v.link}?preview=1`} target="_blank" rel="noopener noreferrer" className="block bg-slate-900">
                {v.gif_url || v.thumb_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={v.gif_url || v.thumb_url!} alt="" className="aspect-video w-full object-cover" />
                ) : (
                  <div className="aspect-video" />
                )}
              </a>
              <div className="p-4">
                <p className="font-semibold text-slate-800">{v.title}</p>
                <p className="text-xs text-slate-500">
                  {formatTime(v.duration_seconds)} · made {timeAgo(v.created_at)}
                </p>
                <p className={`mt-1 text-xs ${v.view_count ? "text-blue-700" : "text-slate-400"}`}>
                  {v.view_count ? `Opened ${v.view_count}× · played ${v.play_count}× · last ${timeAgo(v.last_viewed_at!)}` : "Not opened yet"}
                </p>
                <button onClick={() => copyEmail(v)} className="mt-3 w-full rounded-lg bg-[#F7931E] px-3 py-2 text-sm font-semibold text-white">
                  {copied === `e${v.id}` ? "Copied! Paste into your email" : "Copy for an email"}
                </button>
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(v.link);
                      flash(`l${v.id}`);
                    }}
                    className="text-slate-600 hover:underline"
                  >
                    {copied === `l${v.id}` ? "Copied" : "Copy link"}
                  </button>
                  <button onClick={() => download(v)} className="text-slate-600 hover:underline">
                    Download
                  </button>
                  <button onClick={() => rename(v)} className="text-slate-600 hover:underline">
                    Rename
                  </button>
                  <button onClick={() => remove(v)} className="ml-auto text-slate-400 hover:text-red-600">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
