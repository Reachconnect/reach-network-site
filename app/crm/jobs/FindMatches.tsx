"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Icon } from "../crm";

type Match = {
  id: string;
  name: string;
  job_title: string | null;
  location: string | null;
  salary_expectation: string | null;
  miles: number | null;
  score: number;
  reason: string;
  concern: string;
};

export default function FindMatches({
  jobId,
  jobTitle,
  companyName,
  hasSpecialism,
  onAdded,
}: {
  jobId: string;
  jobTitle: string;
  companyName: string;
  hasSpecialism: boolean;
  onAdded: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [wide, setWide] = useState(!hasSpecialism);
  const [busy, setBusy] = useState(false);
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [considered, setConsidered] = useState(0);
  const [added, setAdded] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setError(null);
    setMatches(null);
    try {
      const { data } = await supabase.auth.getSession();
      const res = await fetch("/api/crm/match", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session?.access_token ?? ""}` },
        body: JSON.stringify({ jobId, wide }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Matching didn't work.");
      setMatches(json.matches as Match[]);
      setConsidered(json.considered as number);
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(false);
  }

  async function add(list: Match[]) {
    const fresh = list.filter((m) => !added.has(m.id));
    if (!fresh.length) return;
    setAdded((s) => {
      const next = new Set(s);
      fresh.forEach((m) => next.add(m.id));
      return next;
    });
    await supabase.from("crm_job_candidates").upsert(
      fresh.map((m) => ({ job_id: jobId, candidate_id: m.id })),
      { onConflict: "job_id,candidate_id", ignoreDuplicates: true }
    );
    await supabase.from("crm_notes").insert(
      fresh.map((m) => ({ candidate_id: m.id, kind: "note", body: `Shortlisted for ${jobTitle} at ${companyName} (AI match ${m.score}/100: ${m.reason})` }))
    );
    onAdded();
  }

  function start() {
    setOpen(true);
    if (!matches && !busy) run();
  }

  const scoreCls = (s: number) => (s >= 80 ? "bg-green-100 text-green-700" : s >= 60 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600");

  return (
    <>
      <button onClick={start} className="flex items-center gap-2 rounded-lg bg-[#1F3447] px-4 py-2 text-sm font-semibold text-white hover:brightness-110">
        <Icon name="star" className="h-4 w-4" /> Find matches
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4" onClick={() => setOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Find matches"
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[90vh] w-full flex-col rounded-t-2xl bg-white p-6 sm:max-w-3xl sm:rounded-2xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-[#1F3447]">Best matches</h2>
                <p className="text-sm text-slate-500">
                  {jobTitle} at {companyName}
                </p>
              </div>
              <button onClick={() => setOpen(false)} aria-label="Close" className="rounded-full p-1.5 hover:bg-slate-100">
                <Icon name="x" className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl bg-slate-50 p-3">
              {hasSpecialism && (
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" checked={wide} onChange={(e) => setWide(e.target.checked)} className="h-4 w-4 accent-[#F7931E]" />
                  Include other specialisms
                </label>
              )}
              <button onClick={run} disabled={busy} className="ml-auto rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-[#1F3447] hover:bg-slate-100 disabled:opacity-50">
                {busy ? "Matching…" : "Search again"}
              </button>
            </div>

            {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

            <div className="mt-3 min-h-0 flex-1 overflow-y-auto">
              {busy && (
                <div className="py-14 text-center">
                  <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-orange-100 border-t-[#F7931E]" />
                  <p className="mt-3 text-sm font-semibold text-slate-600">Comparing your candidates with this job…</p>
                  <p className="text-xs text-slate-400">This takes about 20 seconds.</p>
                </div>
              )}

              {!busy && matches && matches.length === 0 && (
                <div className="py-12 text-center">
                  <p className="font-semibold text-[#1F3447]">No strong matches</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Checked {considered} {considered === 1 ? "candidate" : "candidates"}.{" "}
                    {hasSpecialism && !wide ? "Try including other specialisms, or run a campaign for this job." : "Try running a campaign for this job."}
                  </p>
                </div>
              )}

              {!busy && matches && matches.length > 0 && (
                <>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm text-slate-500">
                      Top {matches.length} of {considered} checked
                    </p>
                    <button onClick={() => add(matches.slice(0, 5))} className="rounded-lg bg-[#F7931E] px-3 py-1.5 text-sm font-semibold text-white hover:brightness-95">
                      Add top 5
                    </button>
                  </div>
                  <ul className="space-y-2">
                    {matches.map((m) => {
                      const on = added.has(m.id);
                      return (
                        <li key={m.id} className="flex items-start gap-3 rounded-xl border border-slate-200 p-3">
                          <span className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-sm font-bold ${scoreCls(m.score)}`}>{m.score}</span>
                          <div className="min-w-0 flex-1">
                            <Link href={`/crm/candidates/view?id=${m.id}`} target="_blank" className="font-semibold text-[#1F3447] hover:underline">
                              {m.name}
                            </Link>
                            <p className="text-xs text-slate-500">
                              {[m.job_title, m.location, m.miles !== null ? `${m.miles} miles away` : null, m.salary_expectation].filter(Boolean).join(" · ")}
                            </p>
                            <p className="mt-1 text-sm text-slate-700">{m.reason}</p>
                            {m.concern && <p className="mt-0.5 text-xs font-semibold text-amber-700">⚠ {m.concern}</p>}
                          </div>
                          <button
                            onClick={() => add([m])}
                            disabled={on}
                            className={`flex-shrink-0 rounded-lg px-3 py-1.5 text-sm font-semibold ${on ? "bg-green-50 text-green-700" : "border border-slate-300 text-[#1F3447] hover:bg-slate-50"}`}
                          >
                            {on ? "Added" : "Add"}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}