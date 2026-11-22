"use client";

// The "who's it going to" part of a spec: one or more companies, an optional intro video,
// and either the CRM emails each company its own link, or you just get the links.
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { SpecContent } from "@/lib/specs";
import { fillEmail, OPT_OUT, specEmailTemplate } from "@/lib/specEmail";

const VIDEO_BUCKET = "spec-videos";
const MAX_VIDEO_MB = 50;
const MAX_COMPANIES = 20;

type Row = { key: number; companyId: string; companyName: string; contactName: string; email: string };
type Result = { companyName: string; companyId: string | null; url: string | null; emailed: boolean; error: string | null };

async function api(body: object) {
  const { data } = await supabase.auth.getSession();
  const res = await fetch("/api/crm/specs", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session?.access_token ?? ""}` },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || "Something went wrong.");
  return json;
}

let nextKey = 1;
const blankRow = (): Row => ({ key: nextKey++, companyId: "", companyName: "", contactName: "", email: "" });

export default function SpecSender({
  items,
  role,
  intro = "",
  onDone,
  onClose,
}: {
  items: { candidateId: string; content: SpecContent }[];
  role: string;
  intro?: string;
  onDone?: () => void;
  onClose: () => void;
}) {
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
  const [rows, setRows] = useState<Row[]>([blankRow()]);
  const [consent, setConsent] = useState(false);

  const [video, setVideo] = useState<{ path: string; preview: string; name: string } | null>(null);
  const [uploading, setUploading] = useState(false);

  const [custom, setCustom] = useState<{ subject: string; text: string } | null>(null);
  const [showEmail, setShowEmail] = useState(false);

  const [stage, setStage] = useState<"idle" | "sending">("idle");
  const [results, setResults] = useState<Result[] | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("crm_companies")
      .select("id, name")
      .order("name")
      .limit(3000)
      .then(({ data }) => setCompanies((data ?? []) as { id: string; name: string }[]));
  }, []);

  const people = useMemo(() => items.map((i) => i.content), [items]);
  const auto = useMemo(() => specEmailTemplate(people, role, !!video), [people, role, video]);
  const email = custom ?? auto;

  function update(key: number, change: Partial<Row>) {
    setRows((list) => list.map((r) => (r.key === key ? { ...r, ...change } : r)));
  }

  // Picking a company from the pipeline fills in its main contact
  async function pickCompany(key: number, companyId: string) {
    update(key, { companyId });
    if (!companyId) return;
    const { data } = await supabase
      .from("crm_contacts")
      .select("name, email, is_primary")
      .eq("company_id", companyId)
      .order("is_primary", { ascending: false })
      .limit(5);
    const best = (data ?? []).find((c) => c.email) || (data ?? [])[0];
    if (best) update(key, { contactName: best.name || "", email: best.email || "" });
  }

  // Paste a list: one company per line, "Company, Contact name, email" (any order for the email)
  const [pasting, setPasting] = useState(false);
  const [pasted, setPasted] = useState("");
  function addPasted() {
    const found: Row[] = pasted
      .split("\n")
      .map((line) => line.split(/[,\t]/).map((x) => x.trim()).filter(Boolean))
      .filter((parts) => parts.length)
      .map((parts) => {
        const mail = parts.find((x) => x.includes("@")) || "";
        const rest = parts.filter((x) => x !== mail);
        const existing = companies.find((c) => c.name.toLowerCase() === (rest[0] || "").toLowerCase());
        return { ...blankRow(), companyId: existing?.id || "", companyName: existing ? "" : rest[0] || "", contactName: rest[1] || "", email: mail };
      });
    setRows((list) => [...list.filter((r) => r.companyId || r.companyName || r.email), ...found].slice(0, MAX_COMPANIES));
    setPasted("");
    setPasting(false);
  }

  async function uploadVideo(file: File) {
    setError(null);
    if (!file.type.startsWith("video/")) return setError("That isn't a video file.");
    if (file.size > MAX_VIDEO_MB * 1024 * 1024) {
      return setError(`That video is ${Math.round(file.size / 1024 / 1024)}MB. Keep it under ${MAX_VIDEO_MB}MB: about a minute, filmed at 720p or 1080p.`);
    }
    setUploading(true);
    try {
      const { path, token } = await api({ action: "video_upload", filename: file.name });
      const { error: upErr } = await supabase.storage.from(VIDEO_BUCKET).uploadToSignedUrl(path, token, file, { contentType: file.type });
      if (upErr) throw new Error(`The upload didn't work: ${upErr.message}`);
      setVideo({ path, preview: URL.createObjectURL(file), name: file.name });
    } catch (e) {
      setError((e as Error).message);
    }
    setUploading(false);
  }

  const companyLabel = (r: Row) => (r.companyId ? companies.find((c) => c.id === r.companyId)?.name || "" : r.companyName.trim());
  const filled = rows.filter((r) => companyLabel(r));

  async function go(sendEmail: boolean) {
    setError(null);
    if (!filled.length) return setError("Add at least one company.");
    if (sendEmail) {
      const missing = filled.find((r) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email.trim()));
      if (missing) return setError(`Add an email address for ${companyLabel(missing)}.`);
    }
    if (!consent) return setError("Tick to confirm the candidates have agreed to be put forward.");
    if (sendEmail && !window.confirm(`Email ${filled.length} ${filled.length === 1 ? "company" : "companies"} now from darrenrowell@reachnetworkrec.com?`)) return;

    setStage("sending");
    try {
      const j = await api({
        action: "create",
        items,
        role,
        intro,
        consent,
        videoPath: video?.path || null,
        sendEmail,
        subject: email.subject,
        message: email.text,
        recipients: filled.map((r) => ({
          companyId: r.companyId || null,
          companyName: r.companyId ? "" : r.companyName.trim(),
          contactName: r.contactName.trim(),
          email: r.email.trim(),
        })),
      });
      setResults(j.results as Result[]);
      onDone?.();
    } catch (e) {
      setError((e as Error).message);
    }
    setStage("idle");
  }

  function copy(value: string, label: string) {
    navigator.clipboard.writeText(value);
    setCopied(label);
    setTimeout(() => setCopied(null), 1500);
  }

  const field = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#F7931E] focus:outline-none";
  const label = "mb-1 block text-xs font-semibold text-slate-500";

  // ---------- After sending ----------
  if (results) {
    const ok = results.filter((r) => r.emailed).length;
    const links = results.filter((r) => r.url && !r.emailed);
    return (
      <div className="space-y-3">
        <p className="rounded-lg bg-green-50 p-2.5 text-sm text-green-800">
          {ok ? `Emailed ${ok} ${ok === 1 ? "company" : "companies"}. Replies go to your inbox, and you'll get an email when anyone opens theirs.` : "Links made. Each company has its own, so you can see who opens what."}
        </p>
        <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
          {results.map((r, i) => (
            <li key={i} className="flex items-start justify-between gap-2 p-3 text-sm">
              <div className="min-w-0">
                <p className="font-semibold text-slate-800">{r.companyName}</p>
                {r.emailed && <p className="text-xs text-green-700">✓ Emailed</p>}
                {r.error && <p className="text-xs text-red-700">{r.error}</p>}
              </div>
              {r.url && (
                <div className="flex flex-none gap-3 text-xs">
                  <a href={`${r.url}?preview=1`} target="_blank" rel="noopener noreferrer" className="text-[#F7931E] hover:underline">
                    Preview
                  </a>
                  <button onClick={() => copy(r.url!, String(i))} className="text-slate-600 hover:underline">
                    {copied === String(i) ? "Copied" : "Copy link"}
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
        {links.length === 1 && (
          <button
            onClick={() => {
              const r = links[0];
              const row = filled.find((x) => companyLabel(x) === r.companyName);
              const f = fillEmail(email, { name: row?.contactName || null, company: r.companyName, link: r.url! });
              copy(`${f.text.replace(/\{link\}/g, r.url!)}\n\n${OPT_OUT}`, "email");
            }}
            className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm"
          >
            {copied === "email" ? "Copied" : "Copy the email to send yourself"}
          </button>
        )}
        <button onClick={onClose} className="w-full text-center text-sm text-slate-500 hover:text-slate-700">
          Close
        </button>
      </div>
    );
  }

  // ---------- Before sending ----------
  return (
    <div className="space-y-4">
      {error && <p className="rounded-lg bg-red-50 p-2.5 text-sm text-red-700">{error}</p>}

      {/* Companies */}
      <div>
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-slate-800">Send to</p>
          <button onClick={() => setPasting(!pasting)} className="text-xs font-semibold text-[#F7931E] hover:underline">
            {pasting ? "Cancel" : "Paste a list"}
          </button>
        </div>
        <p className="text-xs text-slate-500">Each company gets its own link, so you can see exactly who opens it. New companies are added to your sales pipeline.</p>

        {pasting && (
          <div className="mt-2 rounded-xl border border-slate-200 p-3">
            <label className={label}>One company per line: Company, Contact name, email</label>
            <textarea
              className={field}
              rows={5}
              placeholder={"Smith Haulage, Sarah Jones, sarah@smithhaulage.co.uk\nAcme Logistics, Tom Brown, tom@acme.co.uk"}
              value={pasted}
              onChange={(e) => setPasted(e.target.value)}
            />
            <button onClick={addPasted} className="mt-2 w-full rounded-lg bg-slate-800 px-3 py-2 text-sm font-semibold text-white">
              Add these
            </button>
          </div>
        )}

        <ul className="mt-2 space-y-2">
          {rows.map((r, i) => (
            <li key={r.key} className="rounded-xl border border-slate-200 p-3">
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <select className={field} value={r.companyId} onChange={(e) => pickCompany(r.key, e.target.value)}>
                    <option value="">New company (type below)</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  {!r.companyId && (
                    <input className={`${field} mt-2`} placeholder="Company name" value={r.companyName} onChange={(e) => update(r.key, { companyName: e.target.value })} />
                  )}
                </div>
                <div className="space-y-2">
                  <input className={field} placeholder="Contact name, e.g. Sarah Jones" value={r.contactName} onChange={(e) => update(r.key, { contactName: e.target.value })} />
                  <input className={field} type="email" placeholder="Their email" value={r.email} onChange={(e) => update(r.key, { email: e.target.value })} />
                </div>
              </div>
              {rows.length > 1 && (
                <button onClick={() => setRows((list) => list.filter((x) => x.key !== r.key))} className="mt-2 text-xs text-slate-400 hover:text-red-600">
                  Remove company {i + 1}
                </button>
              )}
            </li>
          ))}
        </ul>
        {rows.length < MAX_COMPANIES && (
          <button onClick={() => setRows((list) => [...list, blankRow()])} className="mt-2 text-sm font-semibold text-[#F7931E] hover:underline">
            + Add another company
          </button>
        )}
      </div>

      {/* Video */}
      <div className="rounded-xl border border-slate-200 p-3">
        <p className="text-sm font-bold text-slate-800">Your video (optional)</p>
        <p className="text-xs text-slate-500">
          A short clip of you introducing {items.length > 1 ? "them" : "the candidate"}. It plays at the top of the page, and you&apos;ll see in the CRM when they watch it. Up to {MAX_VIDEO_MB}MB (about a minute).
        </p>
        {video ? (
          <div className="mt-2">
            <video src={video.preview} controls playsInline className="max-h-64 w-full rounded-lg bg-black" />
            <button onClick={() => setVideo(null)} className="mt-1 text-xs text-slate-400 hover:text-red-600">
              Remove video
            </button>
          </div>
        ) : (
          <label className="mt-2 flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-slate-200 px-3 py-4 text-sm font-semibold text-slate-600 hover:border-[#F7931E]">
            {uploading ? "Uploading…" : "Choose a video"}
            <input
              type="file"
              accept="video/mp4,video/quicktime,video/webm,video/*"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (f) uploadVideo(f);
              }}
            />
          </label>
        )}
      </div>

      {/* The email */}
      <div className="rounded-xl border border-slate-200 p-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-slate-800">The email</p>
          <button onClick={() => setShowEmail(!showEmail)} className="text-xs font-semibold text-[#F7931E] hover:underline">
            {showEmail ? "Hide" : "Check or edit"}
          </button>
        </div>
        <p className="text-xs text-slate-500">
          Sent from darrenrowell@reachnetworkrec.com. {"{name}"} and {"{company}"} are filled in for each company, and {"{link}"} becomes an orange button to their page.
        </p>
        {showEmail && (
          <div className="mt-2 space-y-2">
            <div>
              <label className={label}>Subject</label>
              <input className={field} value={email.subject} onChange={(e) => setCustom({ ...email, subject: e.target.value })} />
            </div>
            <div>
              <label className={label}>Message</label>
              <textarea className={field} rows={14} value={email.text} onChange={(e) => setCustom({ ...email, text: e.target.value })} />
              <p className="mt-1 text-xs text-slate-400">Added at the bottom: &ldquo;{OPT_OUT}&rdquo;</p>
            </div>
            {custom && (
              <button onClick={() => setCustom(null)} className="text-xs text-slate-500 hover:underline">
                Go back to the standard email
              </button>
            )}
          </div>
        )}
      </div>

      <label className="flex items-start gap-2 text-sm text-slate-700">
        <input type="checkbox" className="mt-0.5" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
        {items.length > 1 ? "These candidates have" : "The candidate has"} agreed to be put forward to employers anonymously.
      </label>

      <div className="space-y-2">
        <button
          onClick={() => go(true)}
          disabled={stage !== "idle" || uploading}
          className="w-full rounded-lg bg-[#F7931E] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {stage === "sending" ? "Sending…" : `Email ${filled.length || ""} ${filled.length === 1 ? "company" : "companies"}`.replace("  ", " ")}
        </button>
        <button
          onClick={() => go(false)}
          disabled={stage !== "idle" || uploading}
          className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 disabled:opacity-50"
        >
          Just make the links (I&apos;ll send them myself)
        </button>
      </div>
    </div>
  );
}
