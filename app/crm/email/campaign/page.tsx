"use client";

// One email campaign: write it, test it, send it, then see who opened and clicked
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { buildEmail, type CampaignContent, type Recipient } from "@/lib/mailTemplate";
import { timeAgo } from "../../crm";
import { mail, pct, uploadMailFile, type Stats } from "../mailApi";

type FileRef = { path: string; name: string; size: number };
type Draft = {
  name: string;
  list_id: string;
  subject: string;
  preheader: string;
  body: string;
  image_path: string | null;
  image_url: string | null;
  button_text: string;
  button_url: string;
  files: FileRef[];
  video_id: string;
  alert_on_click: boolean;
};
type Send = {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  company: string | null;
  job_title: string | null;
  phone: string | null;
  status: string;
  error: string | null;
  sent_at: string | null;
  opened_at: string | null;
  open_count: number;
  clicked_at: string | null;
  click_count: number;
  unsubscribed_at: string | null;
  bounced_at: string | null;
};
type Video = { id: string; title: string; link: string; gif_url: string | null; thumb_url: string | null; duration_seconds: number };

const field = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#F7931E] focus:outline-none";
const label = "mb-1 block text-xs font-semibold text-slate-500";
const TAGS = [
  ["{first_name}", "First name"],
  ["{last_name}", "Last name"],
  ["{company}", "Company"],
  ["{job_title}", "Job title"],
];
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;

function CampaignView() {
  const id = useSearchParams().get("id") || "";
  const router = useRouter();
  const [status, setStatus] = useState("draft");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [lists, setLists] = useState<{ id: string; name: string; contact_count: number }[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [sample, setSample] = useState<Recipient>({ first_name: "Sarah", last_name: "Jones", company: "Example Foods Ltd", job_title: "Operations Manager" });
  const [stats, setStats] = useState<Stats | null>(null);
  const [sends, setSends] = useState<Send[]>([]);
  const [clicks, setClicks] = useState<{ send_id: string; url: string; clicked_at: string }[]>([]);
  const [limits, setLimits] = useState({ sent_today: 0, daily_limit: 0 });
  const [savedAt, setSavedAt] = useState<string>("");
  const [testTo, setTestTo] = useState("darrenrowell@reachnetworkrec.com");
  const [busy, setBusy] = useState<string | null>(null);
  const [sendNote, setSendNote] = useState<string | null>(null);
  const [filter, setFilter] = useState<"clicked" | "opened" | "not_opened" | "all" | "unsubscribed" | "problems">("clicked");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const subjectRef = useRef<HTMLInputElement>(null);
  const lastFocus = useRef<"subject" | "body">("body");
  const loaded = useRef(false);
  const sending = useRef(false);

  const load = useCallback(async () => {
    try {
      const [j, o] = await Promise.all([mail("GET", `?view=campaign&id=${id}`), mail("GET", "?view=overview")]);
      const c = j.campaign;
      setStatus(c.status);
      setLists(o.lists);
      setStats(j.stats);
      setSends(j.sends);
      setClicks(j.clicks);
      setLimits({ sent_today: j.sent_today, daily_limit: j.daily_limit });
      if (!loaded.current) {
        setDraft({
          name: c.name || "",
          list_id: c.list_id || "",
          subject: c.subject || "",
          preheader: c.preheader || "",
          body: c.body || "",
          image_path: c.image_path,
          image_url: c.image_url,
          button_text: c.button_text || "",
          button_url: c.button_url || "",
          files: c.files || [],
          video_id: c.video_id || "",
          alert_on_click: c.alert_on_click !== false,
        });
        loaded.current = true;
      }
    } catch (e) {
      setError((e as Error).message);
    }
  }, [id]);

  useEffect(() => {
    load();
    // Videos from the Video studio
    (async () => {
      const { supabase } = await import("@/lib/supabase");
      const { data } = await supabase.auth.getSession();
      const res = await fetch("/api/crm/videos", { headers: { Authorization: `Bearer ${data.session?.access_token ?? ""}` } }).catch(() => null);
      const j = res?.ok ? await res.json().catch(() => null) : null;
      if (j?.videos) setVideos(j.videos);
    })();
  }, [load]);

  // A real person from the chosen list, for the preview
  useEffect(() => {
    if (!draft?.list_id) return;
    mail("GET", `?view=list&id=${draft.list_id}`)
      .then((j) => {
        const c = j.contacts?.[0];
        if (c) setSample({ first_name: c.first_name, last_name: c.last_name, company: c.company, job_title: c.job_title });
      })
      .catch(() => {});
  }, [draft?.list_id]);

  // ---------- Saving (automatic while it's a draft) ----------
  const save = useCallback(
    async (d: Draft) => {
      await mail("POST", { action: "campaign_save", id, ...d });
      setSavedAt(new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }));
    },
    [id]
  );

  useEffect(() => {
    if (!draft || status !== "draft") return;
    const t = setTimeout(() => save(draft).catch((e) => setError(e.message)), 1200);
    return () => clearTimeout(t);
  }, [draft, status, save]);

  const set = (patch: Partial<Draft>) => setDraft((d) => (d ? { ...d, ...patch } : d));

  function insertTag(tag: string) {
    if (!draft) return;
    const el = lastFocus.current === "subject" ? subjectRef.current : bodyRef.current;
    const key = lastFocus.current === "subject" ? "subject" : "body";
    const value = draft[key];
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? value.length;
    set({ [key]: value.slice(0, start) + tag + value.slice(end) } as Partial<Draft>);
    setTimeout(() => {
      el?.focus();
      el?.setSelectionRange(start + tag.length, start + tag.length);
    }, 0);
  }

  async function addImage(file: File) {
    if (!file.type.startsWith("image/")) return setError("Choose a picture (JPG, PNG or GIF).");
    if (file.size > 5 * 1024 * 1024) return setError("Keep pictures under 5MB so the email loads quickly.");
    setBusy("image");
    try {
      const up = await uploadMailFile("image", file);
      set({ image_path: up.path, image_url: up.url });
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(null);
  }

  async function addFiles(list: FileList) {
    setBusy("file");
    try {
      const added: FileRef[] = [];
      for (const f of Array.from(list)) {
        if (f.size > 25 * 1024 * 1024) throw new Error(`${f.name} is over 25MB.`);
        const up = await uploadMailFile("file", f);
        added.push({ path: up.path, name: f.name, size: f.size });
      }
      set({ files: [...(draft?.files ?? []), ...added].slice(0, 10) });
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(null);
  }

  // ---------- Test and send ----------
  async function sendTest() {
    if (!draft) return;
    setBusy("test");
    setError(null);
    try {
      await save(draft);
      await mail("POST", { action: "test", id, to: testTo });
      setMessage(`Test sent to ${testTo}. Check it on your phone too.`);
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(null);
  }

  const list = lists.find((l) => l.id === draft?.list_id);

  async function start() {
    if (!draft) return;
    if (!draft.list_id) return setError("Choose which list to send it to.");
    if (!draft.subject.trim()) return setError("Add a subject line.");
    if (!window.confirm(`Send "${draft.subject}" to ${list?.contact_count.toLocaleString()} people on "${list?.name}" from darrenrowell@reachnetworkrec.com?\n\nKeep this page open while it sends.`)) return;
    setBusy("start");
    setError(null);
    try {
      await save(draft);
      const j = await mail("POST", { action: "start", id });
      setMessage(`Sending to ${j.queued.toLocaleString()} people${j.skipped ? ` (${j.skipped} skipped because they'd unsubscribed or bounced)` : ""}.`);
      setStatus("sending");
      loop();
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(null);
  }

  // Sends 50 at a time while this page is open
  async function loop() {
    if (sending.current) return;
    sending.current = true;
    setSendNote("Sending… keep this page open.");
    try {
      for (;;) {
        const j = await mail("POST", { action: "send_chunk", id });
        setStats(j);
        if (j.done) {
          setStatus("sent");
          setSendNote(null);
          setMessage("All sent. Opens and clicks will appear below as they come in.");
          break;
        }
        if (j.stopped) {
          setSendNote("Paused.");
          break;
        }
        if (j.limit) {
          setSendNote(`Today's limit of ${limits.daily_limit || "your daily"} emails is reached. Open this campaign tomorrow and it carries on.`);
          break;
        }
        if (j.error && !j.wait) {
          setSendNote(null);
          setError(`Sending stopped: ${j.error}`);
          break;
        }
        await new Promise((r) => setTimeout(r, j.wait ? 5000 : 800));
      }
    } catch (e) {
      setError((e as Error).message);
      setSendNote(null);
    }
    sending.current = false;
    load();
  }

  // Carry on automatically if you come back to a campaign that's still sending
  const resumed = useRef(false);
  useEffect(() => {
    if (status === "sending" && !resumed.current) {
      resumed.current = true;
      loop();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  async function act(action: "stop" | "resume" | "retry_failed") {
    await mail("POST", { action, id }).catch((e) => setError(e.message));
    if (action === "stop") setStatus("stopped");
    else {
      setStatus("sending");
      resumed.current = true;
      loop();
    }
  }

  async function copyAsNew() {
    if (!draft) return;
    const j = await mail("POST", { action: "campaign_save", ...draft, name: `${draft.name} (copy)` });
    loaded.current = false;
    resumed.current = false;
    setMessage(null);
    router.push(`/crm/email/campaign?id=${j.id}`);
  }

  async function remove() {
    if (!window.confirm("Delete this campaign and its results?")) return;
    await mail("POST", { action: "campaign_delete", id });
    router.push("/crm/email");
  }

  // ---------- Preview ----------
  const video = videos.find((v) => v.id === draft?.video_id) || null;
  const previewHtml = useMemo(() => {
    if (!draft) return "";
    const c: CampaignContent = {
      subject: draft.subject,
      preheader: draft.preheader || null,
      body: draft.body,
      image_url: draft.image_url,
      button_text: draft.button_text || null,
      button_url: draft.button_url || null,
      files: draft.files,
      video: video ? { link: video.link, gif_url: video.gif_url, thumb_url: video.thumb_url, title: video.title, duration: mmss(video.duration_seconds) } : null,
    };
    return buildEmail(c, sample, "preview", false).html;
  }, [draft, sample, video]);

  // ---------- Results ----------
  const clicksBySend = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const c of clicks) m.set(c.send_id, [...(m.get(c.send_id) ?? []), c.url]);
    return m;
  }, [clicks]);

  function linkName(u: string) {
    if (u.startsWith("file:")) return `📎 ${draft?.files.find((f) => `file:${f.path}` === u)?.name || "a file"}`;
    if (u.includes("/v/")) return "▶ the video";
    if (draft?.button_url && u === draft.button_url) return `the "${draft.button_text}" button`;
    return u.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "").slice(0, 40);
  }

  const term = search.trim().toLowerCase();
  const rows = sends
    .filter((s) =>
      filter === "clicked"
        ? s.clicked_at
        : filter === "opened"
          ? s.opened_at
          : filter === "not_opened"
            ? s.status === "sent" && !s.opened_at
            : filter === "unsubscribed"
              ? s.unsubscribed_at
              : filter === "problems"
                ? ["failed", "skipped"].includes(s.status) || s.bounced_at
                : true
    )
    .filter((s) => !term || `${s.email} ${s.first_name ?? ""} ${s.last_name ?? ""} ${s.company ?? ""}`.toLowerCase().includes(term))
    .sort((a, b) => (b.click_count || 0) - (a.click_count || 0) || (b.open_count || 0) - (a.open_count || 0));

  function downloadCsv() {
    const head = ["First name", "Last name", "Company", "Job title", "Phone", "Email", "Opens", "Clicks", "What they clicked", "Last activity"];
    const q = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const lines = rows.map((s) =>
      [s.first_name, s.last_name, s.company, s.job_title, s.phone, s.email, s.open_count || 0, s.click_count || 0, Array.from(new Set<string>(clicksBySend.get(s.id) ?? [])).map(linkName).join("; "), s.clicked_at || s.opened_at || ""].map(q).join(",")
    );
    const blob = new Blob([[head.map(q).join(","), ...lines].join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${draft?.name || "campaign"} - ${filter}.csv`;
    a.click();
  }

  if (!draft) return <p className="p-6 text-sm text-slate-500">{error || "Loading…"}</p>;
  const isDraft = status === "draft";

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6">
      <Link href="/crm/email" className="text-sm text-slate-500 hover:underline">
        ← Email campaigns
      </Link>
      <div className="mb-4 mt-1 flex flex-wrap items-center justify-between gap-3">
        {isDraft ? (
          <input className="min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-1 text-2xl font-bold text-[#1F3447] hover:border-slate-200 focus:border-[#F7931E] focus:outline-none" value={draft.name} onChange={(e) => set({ name: e.target.value })} />
        ) : (
          <h1 className="text-2xl font-bold text-[#1F3447]">{draft.name}</h1>
        )}
        <div className="flex items-center gap-3 text-sm">
          {isDraft && savedAt && <span className="text-xs text-slate-400">Saved {savedAt}</span>}
          {!isDraft && (
            <button onClick={copyAsNew} className="rounded-lg border border-slate-300 bg-white px-3 py-2 font-semibold text-[#1F3447]">
              Copy as a new campaign
            </button>
          )}
          <button onClick={remove} className="text-slate-400 hover:text-red-600">
            Delete
          </button>
        </div>
      </div>

      {error && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {message && <p className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-800">{message}</p>}

      {isDraft ? (
        <div className="grid gap-5 lg:grid-cols-2">
          {/* ---------- Writing it ---------- */}
          <div className="space-y-4">
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <label className={label}>Send to</label>
              <select className={field} value={draft.list_id} onChange={(e) => set({ list_id: e.target.value })}>
                <option value="">Choose a list…</option>
                {lists.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} ({l.contact_count.toLocaleString()})
                  </option>
                ))}
              </select>
              {!lists.length && (
                <p className="mt-1 text-xs text-slate-500">
                  No lists yet. <Link href="/crm/email" className="text-[#F7931E] underline">Make one first</Link>.
                </p>
              )}
            </div>

            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="mb-2 flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-500">Personalise:</span>
                {TAGS.map(([t, l]) => (
                  <button key={t} onMouseDown={(e) => e.preventDefault()} onClick={() => insertTag(t)} className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-[#c46d00] hover:bg-orange-100">
                    + {l}
                  </button>
                ))}
              </div>
              <label className={label}>Subject</label>
              <input ref={subjectRef} onFocus={() => (lastFocus.current = "subject")} className={field} placeholder="e.g. Maintenance engineers for {company}" value={draft.subject} onChange={(e) => set({ subject: e.target.value })} />
              <label className={`${label} mt-3`}>Preview text (optional, shows next to the subject in the inbox)</label>
              <input className={field} placeholder="e.g. Three engineers available near you this month" value={draft.preheader} onChange={(e) => set({ preheader: e.target.value })} />
              <label className={`${label} mt-3`}>Message</label>
              <textarea ref={bodyRef} onFocus={() => (lastFocus.current = "body")} className={`${field} leading-relaxed`} rows={14} value={draft.body} onChange={(e) => set({ body: e.target.value })} />
              <p className="mt-1 text-xs text-slate-400">Leave a blank line between paragraphs. Put **two stars** round words to make them bold. Web addresses become links.</p>
            </div>

            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <p className="mb-2 text-sm font-bold text-slate-800">Extras (all optional)</p>

              <label className={label}>Picture at the top</label>
              {draft.image_url ? (
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={draft.image_url} alt="" className="h-14 rounded border border-slate-200" />
                  <button onClick={() => set({ image_path: null, image_url: null })} className="text-xs text-slate-400 hover:text-red-600">
                    Remove
                  </button>
                </div>
              ) : (
                <label className="flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-slate-200 px-3 py-3 text-sm font-semibold text-slate-600 hover:border-[#F7931E]">
                  {busy === "image" ? "Uploading…" : "Upload a picture"}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && addImage(e.target.files[0])} />
                </label>
              )}

              <label className={`${label} mt-4`}>Video from your Video studio</label>
              <select className={field} value={draft.video_id} onChange={(e) => set({ video_id: e.target.value })}>
                <option value="">No video</option>
                {videos.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.title} ({mmss(v.duration_seconds)})
                  </option>
                ))}
              </select>
              {!videos.length && (
                <p className="mt-1 text-xs text-slate-400">
                  <Link href="/crm/videos/studio" className="text-[#F7931E] underline">Record one</Link>, and it&apos;ll show here with a moving preview and play button.
                </p>
              )}

              <label className={`${label} mt-4`}>Button</label>
              <div className="grid gap-2 sm:grid-cols-[1fr_2fr]">
                <input className={field} placeholder="Text, e.g. Book a call" value={draft.button_text} onChange={(e) => set({ button_text: e.target.value })} />
                <input className={field} placeholder="Link, e.g. https://reachnetworkrec.com/book-a-call" value={draft.button_url} onChange={(e) => set({ button_url: e.target.value })} />
              </div>

              <label className={`${label} mt-4`}>Files they can download (CVs, brochures, rate cards…)</label>
              {draft.files.map((f, i) => (
                <div key={f.path} className="mb-1 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-1.5 text-sm">
                  <span>📎 {f.name}</span>
                  <button onClick={() => set({ files: draft.files.filter((_, n) => n !== i) })} className="text-xs text-slate-400 hover:text-red-600">
                    Remove
                  </button>
                </div>
              ))}
              <label className="flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-slate-200 px-3 py-3 text-sm font-semibold text-slate-600 hover:border-[#F7931E]">
                {busy === "file" ? "Uploading…" : "Add files"}
                <input type="file" multiple className="hidden" onChange={(e) => e.target.files?.length && addFiles(e.target.files)} />
              </label>
              <p className="mt-1 text-xs text-slate-400">Files go in as download links rather than attachments. They land in inboxes more reliably, and you can see who downloaded what.</p>

              <label className="mt-4 flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={draft.alert_on_click} onChange={(e) => set({ alert_on_click: e.target.checked })} />
                Email me when someone clicks, so I can call them
              </label>
            </div>

            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <label className={label}>Send a test first</label>
              <div className="flex gap-2">
                <input className={field} value={testTo} onChange={(e) => setTestTo(e.target.value)} />
                <button onClick={sendTest} disabled={!!busy} className="flex-none rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-[#1F3447] disabled:opacity-50">
                  {busy === "test" ? "Sending…" : "Send test"}
                </button>
              </div>
              <button onClick={start} disabled={!!busy || !draft.list_id} className="mt-4 w-full rounded-lg bg-[#F7931E] px-4 py-3 font-semibold text-white disabled:opacity-50">
                {busy === "start" ? "Starting…" : list ? `Send to ${list.contact_count.toLocaleString()} people on "${list.name}"` : "Choose a list to send"}
              </button>
              <p className="mt-2 text-xs text-slate-400">
                Up to {limits.daily_limit.toLocaleString()} emails a day ({limits.sent_today.toLocaleString()} sent today). Anything over carries on the next day.
              </p>
            </div>
          </div>

          {/* ---------- Live preview ---------- */}
          <div className="lg:sticky lg:top-4 lg:self-start">
            <p className="mb-2 text-sm font-bold text-slate-800">
              Preview <span className="font-normal text-slate-400">as {[sample.first_name, sample.last_name].filter(Boolean).join(" ") || "someone"}{sample.company ? ` at ${sample.company}` : ""}</span>
            </p>
            <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
              <div className="border-b border-slate-100 px-4 py-3 text-sm">
                <p className="text-slate-500">
                  From: <span className="text-slate-800">Darren Rowell &lt;darrenrowell@reachnetworkrec.com&gt;</span>
                </p>
                <p className="font-semibold text-slate-800">{previewHtml && buildEmailSubject(draft.subject, sample)}</p>
              </div>
              <iframe title="Email preview" srcDoc={previewHtml} className="h-[70vh] w-full" sandbox="" />
            </div>
          </div>
        </div>
      ) : (
        /* ---------- Results ---------- */
        <div className="space-y-4">
          {stats && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {[
                ["Sent", stats.sent.toLocaleString(), stats.pending ? `${stats.pending.toLocaleString()} still to go` : ""],
                ["Opened", pct(stats.opened, stats.sent), `${stats.opened.toLocaleString()} people`],
                ["Clicked", pct(stats.clicked, stats.sent), `${stats.clicked.toLocaleString()} people`],
                ["Unsubscribed", String(stats.unsubscribed), ""],
                ["Didn't send", String(stats.failed), stats.total - stats.sent - stats.pending - stats.failed ? `${stats.total - stats.sent - stats.pending - stats.failed} skipped` : ""],
                ["List", list?.name || "–", ""],
              ].map(([k, v, sub]) => (
                <div key={k} className="rounded-2xl bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold text-slate-500">{k}</p>
                  <p className={`mt-1 truncate font-bold text-[#1F3447] ${k === "List" ? "text-base" : "text-2xl"}`}>{v}</p>
                  {sub && <p className="text-xs text-slate-400">{sub}</p>}
                </div>
              ))}
            </div>
          )}

          {stats && stats.total > 0 && (status === "sending" || status === "stopped" || stats.failed > 0) && (
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full bg-[#F7931E] transition-all" style={{ width: `${Math.round(((stats.total - stats.pending) / stats.total) * 100)}%` }} />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                {sendNote && <span className="text-slate-600">{sendNote}</span>}
                {status === "sending" && (
                  <button onClick={() => act("stop")} className="rounded-lg border border-slate-300 px-3 py-1.5">
                    Pause
                  </button>
                )}
                {status === "stopped" && (
                  <button onClick={() => act("resume")} className="rounded-lg bg-[#F7931E] px-3 py-1.5 font-semibold text-white">
                    Carry on sending
                  </button>
                )}
                {stats.failed > 0 && !sending.current && (
                  <button onClick={() => act("retry_failed")} className="rounded-lg border border-slate-300 px-3 py-1.5">
                    Try the {stats.failed} that didn&apos;t send again
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="rounded-2xl bg-white shadow-sm">
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 p-3">
              {(
                [
                  ["clicked", `🔥 Call list: clicked (${sends.filter((s) => s.clicked_at).length})`],
                  ["opened", `Opened (${sends.filter((s) => s.opened_at).length})`],
                  ["not_opened", "Not opened"],
                  ["all", `Everyone (${sends.length})`],
                  ["unsubscribed", "Unsubscribed"],
                  ["problems", "Didn't send"],
                ] as [typeof filter, string][]
              ).map(([k, l]) => (
                <button key={k} onClick={() => setFilter(k)} className={`rounded-lg px-3 py-1.5 text-sm ${filter === k ? "bg-[#1F3447] font-semibold text-white" : "text-slate-600 hover:bg-slate-100"}`}>
                  {l}
                </button>
              ))}
              <input className="ml-auto w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm sm:w-56" placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} />
              <button onClick={downloadCsv} disabled={!rows.length} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-40">
                Download as spreadsheet
              </button>
            </div>
            {!rows.length ? (
              <p className="p-8 text-center text-sm text-slate-500">{filter === "clicked" ? "Nobody has clicked yet. They'll appear here, most clicks first." : "Nobody here yet."}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-500">
                    <tr>
                      <th className="px-4 py-2.5">Who</th>
                      <th className="px-4 py-2.5">Phone</th>
                      <th className="px-4 py-2.5">Opened</th>
                      <th className="px-4 py-2.5">Clicked</th>
                      <th className="px-4 py-2.5">What they clicked</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rows.slice(0, 500).map((s) => (
                      <tr key={s.id} className="align-top">
                        <td className="px-4 py-2.5">
                          <p className="font-semibold text-slate-800">{[s.first_name, s.last_name].filter(Boolean).join(" ") || s.email}</p>
                          <p className="text-xs text-slate-500">{[s.job_title, s.company].filter(Boolean).join(", ")}</p>
                          <a href={`mailto:${s.email}`} className="text-xs text-[#F7931E] hover:underline">
                            {s.email}
                          </a>
                          {s.unsubscribed_at && <span className="ml-2 rounded bg-slate-100 px-1.5 text-xs text-slate-500">unsubscribed</span>}
                          {s.error && <p className="text-xs text-red-600">{s.error}</p>}
                          {s.bounced_at && <p className="text-xs text-red-600">Bounced: address doesn&apos;t exist</p>}
                        </td>
                        <td className="whitespace-nowrap px-4 py-2.5">{s.phone ? <a href={`tel:${s.phone.replace(/\s/g, "")}`} className="hover:underline">{s.phone}</a> : <span className="text-slate-300">–</span>}</td>
                        <td className="whitespace-nowrap px-4 py-2.5">{s.opened_at ? `${s.open_count}× · ${timeAgo(s.opened_at)}` : <span className="text-slate-300">–</span>}</td>
                        <td className="whitespace-nowrap px-4 py-2.5 font-semibold text-[#F7931E]">{s.clicked_at ? `${s.click_count}× · ${timeAgo(s.clicked_at)}` : <span className="font-normal text-slate-300">–</span>}</td>
                        <td className="px-4 py-2.5 text-xs text-slate-600">{Array.from(new Set<string>(clicksBySend.get(s.id) ?? [])).map(linkName).join(", ")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {rows.length > 500 && <p className="p-3 text-center text-xs text-slate-400">Showing the first 500. Download the spreadsheet for everyone.</p>}
              </div>
            )}
          </div>
          <p className="text-xs text-slate-400">
            Opens are a rough guide: Apple Mail opens every email automatically, and some inboxes block the tracking picture. Clicks are the reliable signal.
          </p>
        </div>
      )}
    </div>
  );
}

function buildEmailSubject(subject: string, r: Recipient) {
  return buildEmail({ subject, preheader: null, body: "", image_url: null, button_text: null, button_url: null, files: null, video: null }, r, "x", false).subject || "(no subject yet)";
}

export default function CampaignPage() {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-slate-500">Loading…</p>}>
      <CampaignView />
    </Suspense>
  );
}
