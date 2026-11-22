"use client";

import { useEffect, useState } from "react";
import ShortlistSpec from "../ShortlistSpec";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Icon, waLink } from "../crm";

type Brief = { role: string; location: string; radius_miles: number; min_years: number | null; must_haves: string[]; job_type: string; specialism: string };
type Match = {
  id: string;
  name: string;
  first_name: string;
  phone: string | null;
  job_title: string | null;
  location: string | null;
  miles: number | null;
  salary_expectation: string | null;
  whatsapp_consent: boolean;
  score: number;
  reason: string;
  concern: string;
};
type Template = { name: string; language: string; body: string; variables: number };
type JobOption = { id: string; title: string; crm_companies: { name: string } | null };

async function api(path: string, body?: object) {
  const { data } = await supabase.auth.getSession();
  const res = await fetch(path, {
    method: body ? "POST" : "GET",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session?.access_token ?? ""}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || "Something went wrong.");
  return json;
}

export default function AiSearchPage() {
  const [query, setQuery] = useState("");
  const [radius, setRadius] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [brief, setBrief] = useState<Brief | null>(null);
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [considered, setConsidered] = useState(0);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [messaging, setMessaging] = useState(false);
  const [speccing, setSpeccing] = useState(false);
  const [jobs, setJobs] = useState<JobOption[]>([]);
  const [jobId, setJobId] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("crm_jobs")
      .select("id, title, crm_companies(name)")
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .then(({ data }) => setJobs((data ?? []) as unknown as JobOption[]));
  }, []);

  function flash(t: string) {
    setToast(t);
    setTimeout(() => setToast(null), 4000);
  }

  async function search(withRadius: number | null = radius) {
    if (query.trim().length < 5) return setError("Describe what the client is after.");
    setBusy(true);
    setError(null);
    setMatches(null);
    setPicked(new Set());
    try {
      const j = await api("/api/crm/ai-search", { query, radius: withRadius });
      setBrief(j.brief);
      setMatches(j.matches);
      setConsidered(j.considered);
      setRadius(j.brief?.radius_miles ?? null);
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(false);
  }

  async function addToJob() {
    if (!jobId || !picked.size) return;
    const job = jobs.find((j) => j.id === jobId);
    await supabase.from("crm_job_candidates").upsert(
      [...picked].map((id) => ({ job_id: jobId, candidate_id: id })),
      { onConflict: "job_id,candidate_id", ignoreDuplicates: true }
    );
    await supabase.from("crm_notes").insert(
      [...picked].map((id) => ({ candidate_id: id, kind: "note", body: `Shortlisted for ${job?.title ?? "a job"} from AI search: "${query.trim()}"` }))
    );
    flash(`${picked.size} added to ${job?.title ?? "the job"}'s shortlist.`);
  }

  const chosen = (matches ?? []).filter((m) => picked.has(m.id));
  const scoreCls = (s: number) => (s >= 80 ? "bg-green-100 text-green-700" : s >= 60 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600");

  return (
    <div className="mx-auto max-w-6xl p-5 lg:p-8">
      <h1 className="text-3xl font-bold text-[#1F3447]">AI search</h1>
      <p className="mt-1 text-slate-500">Describe what the client is after, in your own words. The best matches come back ranked, ready to contact.</p>

      {/* The box */}
      <div className="mt-5 rounded-2xl bg-white p-4 shadow-sm">
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              setRadius(null);
              search(null);
            }
          }}
          rows={3}
          autoFocus
          placeholder="e.g. Tipper driver in Wolverhampton, 2+ years' experience, Class 2 minimum, days only"
          className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-base focus:border-[#F7931E] focus:outline-none focus:ring-2 focus:ring-[#F7931E]/30"
        />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setRadius(null);
              search(null);
            }}
            disabled={busy}
            className="flex items-center gap-2 rounded-lg bg-[#F7931E] px-5 py-2.5 text-sm font-semibold text-white hover:brightness-95 disabled:opacity-50"
          >
            <Icon name="search" className="h-4 w-4" />
            {busy ? "Searching…" : "Find candidates"}
          </button>
          <span className="text-xs text-slate-400">Press Enter to search, Shift+Enter for a new line</span>
        </div>
      </div>

      {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {busy && (
        <div className="mt-8 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-orange-100 border-t-[#F7931E]" />
          <p className="mt-3 text-sm font-semibold text-slate-600">Searching your candidates…</p>
          <p className="text-xs text-slate-400">Usually 15 to 25 seconds.</p>
        </div>
      )}

      {/* What it understood */}
      {brief && !busy && (
        <div className="mt-5 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-slate-500">Looking for:</span>
          {brief.role && <span className="rounded-full bg-[#1F3447] px-3 py-1 font-semibold text-white">{brief.role}</span>}
          {brief.location && (
            <span className="flex items-center gap-1 rounded-full bg-slate-200 px-3 py-1 font-semibold text-slate-700">
              within
              <select
                value={radius ?? brief.radius_miles}
                onChange={(e) => {
                  const r = Number(e.target.value);
                  setRadius(r);
                  search(r);
                }}
                className="bg-transparent font-semibold"
                aria-label="Distance"
              >
                {[5, 10, 15, 20, 30, 40, 60, 100].map((m) => (
                  <option key={m} value={m}>
                    {m} miles
                  </option>
                ))}
              </select>
              of {brief.location}
            </span>
          )}
          {brief.min_years !== null && brief.min_years !== undefined && (
            <span className="rounded-full bg-slate-200 px-3 py-1 font-semibold text-slate-700">{brief.min_years}+ years</span>
          )}
          {(brief.must_haves ?? []).map((m) => (
            <span key={m} className="rounded-full bg-orange-100 px-3 py-1 font-semibold text-orange-800">
              {m}
            </span>
          ))}
        </div>
      )}

      {/* Results */}
      {matches && !busy && (
        <div className="mt-5 rounded-2xl bg-white p-4 shadow-sm">
          {matches.length === 0 ? (
            <div className="py-10 text-center">
              <p className="font-semibold text-[#1F3447]">No strong matches</p>
              <p className="mt-1 text-sm text-slate-500">
                Checked {considered} possible {considered === 1 ? "candidate" : "candidates"}. Try a wider distance, or fewer must-haves.
              </p>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-3">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                  <input
                    type="checkbox"
                    checked={picked.size === matches.length}
                    onChange={(e) => setPicked(e.target.checked ? new Set(matches.map((m) => m.id)) : new Set())}
                    className="h-4 w-4 accent-[#F7931E]"
                  />
                  {matches.length} matches from {considered} checked
                </label>
                <div className="ml-auto flex flex-wrap items-center gap-2">
                  {jobs.length > 0 && (
                    <>
                      <select value={jobId} onChange={(e) => setJobId(e.target.value)} className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm" aria-label="Job">
                        <option value="">Add to a job…</option>
                        {jobs.map((j) => (
                          <option key={j.id} value={j.id}>
                            {j.title}
                            {j.crm_companies ? ` at ${j.crm_companies.name}` : ""}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={addToJob}
                        disabled={!jobId || !picked.size}
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-[#1F3447] hover:bg-slate-50 disabled:opacity-40"
                      >
                        Add {picked.size || ""}
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setSpeccing(true)}
                    disabled={picked.size < 2}
                    title={picked.size < 2 ? "Tick 2 to 5 people to send them as a shortlist" : "Send the ticked people to a prospect as one shortlist page"}
                    className="rounded-lg border border-[#1F3447] px-3 py-1.5 text-sm font-semibold text-[#1F3447] hover:bg-slate-50 disabled:opacity-40"
                  >
                    Send as spec
                  </button>
                  <button
                    onClick={() => setMessaging(true)}
                    disabled={!picked.size}
                    className="flex items-center gap-2 rounded-lg bg-[#F7931E] px-4 py-1.5 text-sm font-semibold text-white hover:brightness-95 disabled:opacity-40"
                  >
                    <Icon name="send" className="h-4 w-4" /> WhatsApp {picked.size || ""} selected
                  </button>
                </div>
              </div>

              <ul className="divide-y divide-slate-100">
                {matches.map((m) => {
                  const wa = waLink(m.phone);
                  return (
                    <li key={m.id} className="flex items-start gap-3 py-3">
                      <input
                        type="checkbox"
                        checked={picked.has(m.id)}
                        onChange={(e) =>
                          setPicked((s) => {
                            const n = new Set(s);
                            if (e.target.checked) n.add(m.id);
                            else n.delete(m.id);
                            return n;
                          })
                        }
                        className="mt-3 h-4 w-4 accent-[#F7931E]"
                        aria-label={`Select ${m.name}`}
                      />
                      <span className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-sm font-bold ${scoreCls(m.score)}`}>{m.score}</span>
                      <div className="min-w-0 flex-1">
                        <Link href={`/crm/candidates/view?id=${m.id}`} target="_blank" className="font-semibold text-[#1F3447] hover:underline">
                          {m.name}
                        </Link>
                        {!m.whatsapp_consent && <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-500">No WhatsApp consent</span>}
                        <p className="text-xs text-slate-500">
                          {[m.job_title, m.location, m.miles !== null ? `${m.miles} miles away` : null, m.salary_expectation].filter(Boolean).join(" · ")}
                        </p>
                        <p className="mt-1 text-sm text-slate-700">{m.reason}</p>
                        {m.concern && <p className="mt-0.5 text-xs font-semibold text-amber-700">⚠ {m.concern}</p>}
                      </div>
                      <div className="flex flex-shrink-0 items-center gap-1">
                        {m.phone && (
                          <a href={`tel:${m.phone}`} title="Call" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-[#1F3447]">
                            <Icon name="phone" className="h-4 w-4" />
                          </a>
                        )}
                        {wa && (
                          <a href={wa} target="_blank" rel="noopener noreferrer" title="WhatsApp from your phone" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-[#1F3447]">
                            <Icon name="send" className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      )}

      {speccing && (
        <ShortlistSpec people={chosen.map((m) => ({ id: m.id, name: m.name }))} role={brief?.role || ""} onClose={() => setSpeccing(false)} />
      )}

      {messaging && brief && <MessageSelected people={chosen} brief={brief} query={query} onClose={() => setMessaging(false)} onSent={flash} />}

      {toast && <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[#1F3447] px-5 py-2.5 text-sm font-medium text-white shadow-lg">{toast}</div>}
    </div>
  );
}

// =====================================================================
// WhatsApp the selected candidates with an approved template
// =====================================================================

function MessageSelected({ people, brief, query, onClose, onSent }: { people: Match[]; brief: Brief; query: string; onClose: () => void; onSent: (t: string) => void }) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templateName, setTemplateName] = useState("");
  const [vars, setVars] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const reachable = people.filter((p) => p.whatsapp_consent && p.phone);
  const left = people.length - reachable.length;

  useEffect(() => {
    api("/api/crm/templates")
      .then((j) => setTemplates(j.templates as Template[]))
      .catch((e) => setError((e as Error).message));
  }, []);

  function pick(name: string) {
    setTemplateName(name);
    const t = templates.find((x) => x.name === name);
    setVars(
      Array.from({ length: t?.variables ?? 0 }, (_, i) => (i === 0 ? "{first_name}" : i === 1 ? brief.role : i === 2 ? brief.location : ""))
    );
  }

  const template = templates.find((t) => t.name === templateName) || null;
  const preview = template
    ? template.body.replace(/\{\{(\d+)\}\}/g, (_, n) => (vars[Number(n) - 1] || `[gap ${n}]`).replaceAll("{first_name}", reachable[0]?.first_name || "Sarah"))
    : "";

  async function send() {
    if (!template) return setError("Choose a template.");
    if (vars.some((v) => !v.trim())) return setError("Fill in every gap.");
    if (!reachable.length) return setError("None of these candidates can be messaged on WhatsApp.");
    setBusy(true);
    setError(null);
    try {
      const created = await api("/api/crm/campaigns", {
        name: `AI search: ${query.trim().slice(0, 60)}`,
        templateName: template.name,
        language: template.language,
        templateBody: template.body,
        variables: vars,
        candidateIds: reachable.map((p) => p.id),
      });
      let sent = 0;
      let limit = false;
      for (let guard = 0; guard < 20; guard++) {
        const r = await api("/api/crm/campaigns/send", { campaignId: created.id });
        sent += r.sent;
        limit = r.limitReached;
        if (r.remaining === 0 || r.limitReached || r.sent + r.failed === 0) break;
      }
      const msg = `${sent} WhatsApp ${sent === 1 ? "message" : "messages"} sent.${limit ? " Daily limit reached: the rest will wait in Campaigns." : ""} Replies arrive in your ReachConnect inbox.`;
      setResult(msg);
      onSent(msg);
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(false);
  }

  const input = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#F7931E] focus:outline-none focus:ring-2 focus:ring-[#F7931E]/30";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="WhatsApp selected" onClick={(e) => e.stopPropagation()} className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white p-6 sm:max-w-lg sm:rounded-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#1F3447]">WhatsApp {reachable.length} {reachable.length === 1 ? "candidate" : "candidates"}</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-full p-1.5 hover:bg-slate-100">
            <Icon name="x" className="h-5 w-5" />
          </button>
        </div>
        {left > 0 && <p className="mt-2 text-sm text-slate-500">{left} left out: no mobile number, or they haven&apos;t agreed to WhatsApp.</p>}

        {result ? (
          <div className="py-6 text-center">
            <p className="font-semibold text-green-700">{result}</p>
            <button onClick={onClose} className="mt-4 rounded-lg bg-[#1F3447] px-5 py-2.5 text-sm font-semibold text-white">
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="mt-4 space-y-3">
              <select className={input} value={templateName} onChange={(e) => pick(e.target.value)} aria-label="Template">
                <option value="">Choose an approved template…</option>
                {templates.map((t) => (
                  <option key={t.name} value={t.name}>
                    {t.name}
                  </option>
                ))}
              </select>
              {vars.map((v, i) => (
                <label key={i} className="block">
                  <span className="text-xs font-semibold text-slate-500">
                    Gap {`{{${i + 1}}}`}
                    {i === 0 && " (their first name)"}
                  </span>
                  <input className={`mt-1 ${input}`} value={v} onChange={(e) => setVars((l) => l.map((x, j) => (j === i ? e.target.value : x)))} />
                </label>
              ))}
              {template && (
                <div className="rounded-xl bg-[#E5DDD5] p-3">
                  <div className="rounded-lg bg-white p-3 text-sm text-slate-800 shadow-sm">
                    <p className="whitespace-pre-wrap">{preview}</p>
                  </div>
                </div>
              )}
            </div>

            {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

            <div className="mt-5 flex justify-end gap-2">
              <button onClick={onClose} className="rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">
                Cancel
              </button>
              <button onClick={send} disabled={busy || !template || !reachable.length} className="rounded-lg bg-[#F7931E] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
                {busy ? "Sending…" : `Send to ${reachable.length}`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}