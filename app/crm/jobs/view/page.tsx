"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Icon, candidateName, type Candidate, type Specialism } from "../../crm";
import FindMatches from "../FindMatches";
import {
  CANDIDATE_STAGE_FOR,
  JOB_STATUSES,
  SHORTLIST_STAGES,
  TERMS_FIELDS,
  addDays,
  at9am,
  feeFor,
  isoDate,
  money,
  niceDate,
  potentialFee,
  salaryText,
  type Job,
  type JobStatus,
  type Terms,
} from "../jobsShared";

type Entry = { id: string; stage: string; candidate_id: string; crm_candidates: Pick<Candidate, "id" | "first_name" | "last_name" | "job_title" | "location" | "salary_expectation"> };

export default function JobViewPage() {
  return (
    <Suspense fallback={<p className="p-8 text-slate-500">Loading…</p>}>
      <JobView />
    </Suspense>
  );
}

function JobView() {
  const id = useSearchParams().get("id") || "";
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [specialisms, setSpecialisms] = useState<Specialism[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropStage, setDropStage] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [placing, setPlacing] = useState<Entry | null>(null);
  const [showRejected, setShowRejected] = useState(false);

  const load = useCallback(async () => {
    const [j, e, s] = await Promise.all([
      supabase.from("crm_jobs").select(`*, crm_companies(${TERMS_FIELDS})`).eq("id", id).maybeSingle(),
      supabase
        .from("crm_job_candidates")
        .select("id, stage, candidate_id, crm_candidates(id, first_name, last_name, job_title, location, salary_expectation)")
        .eq("job_id", id)
        .order("updated_at", { ascending: false }),
      supabase.from("crm_specialisms").select("*").order("sort_order").order("name"),
    ]);
    if (!j.data) return setError("This job couldn't be found.");
    setJob(j.data as Job);
    setEntries((e.data ?? []) as unknown as Entry[]);
    setSpecialisms((s.data ?? []) as Specialism[]);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function moveTo(entry: Entry, stage: string) {
    if (!job || entry.stage === stage) return;
    if (stage === "placed") return setPlacing(entry);
    setEntries((list) => list.map((x) => (x.id === entry.id ? { ...x, stage } : x)));
    await supabase.from("crm_job_candidates").update({ stage }).eq("id", entry.id);
    const label = SHORTLIST_STAGES.find((s) => s.key === stage)?.label ?? stage;
    await supabase.from("crm_notes").insert({
      candidate_id: entry.candidate_id,
      kind: "note",
      body: `Moved to "${label}" for ${job.title} at ${job.crm_companies?.name ?? "the client"}`,
    });
    if (CANDIDATE_STAGE_FOR[stage]) await supabase.from("crm_candidates").update({ stage: CANDIDATE_STAGE_FOR[stage] }).eq("id", entry.candidate_id);
  }

  async function removeEntry(entry: Entry) {
    if (!window.confirm(`Take ${candidateName(entry.crm_candidates)} off this shortlist?`)) return;
    await supabase.from("crm_job_candidates").delete().eq("id", entry.id);
    load();
  }

  async function setStatus(status: JobStatus) {
    if (!job) return;
    await supabase.from("crm_jobs").update({ status, filled_at: status === "filled" ? new Date().toISOString() : null }).eq("id", job.id);
    load();
  }

  async function deleteJob() {
    if (!job || !window.confirm(`Delete ${job.title}? The shortlist goes too, but placements are kept.`)) return;
    await supabase.from("crm_jobs").delete().eq("id", job.id);
    router.push("/crm/jobs");
  }

  if (error && !job) return <p className="p-8 text-red-700">{error}</p>;
  if (!job) return <p className="p-8 text-slate-500">Loading…</p>;

  const sp = specialisms.find((s) => s.id === job.specialism_id);
  const columns = SHORTLIST_STAGES.filter((s) => showRejected || s.key !== "rejected");
  const placedCount = entries.filter((e) => e.stage === "placed").length;

  return (
    <div className="flex h-full flex-col p-5 lg:p-8">
      <Link href="/crm/jobs" className="text-sm font-medium text-slate-500 hover:text-[#1F3447]">
        ‹ Jobs
      </Link>

      <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#1F3447]">
            {sp && <span className="mr-2">{sp.emoji}</span>}
            {job.title}
          </h1>
          <p className="mt-1 text-slate-500">
            <Link href={`/crm/sales/view?id=${job.company_id}`} className="font-semibold text-[#1F3447] hover:underline">
              {job.crm_companies?.name}
            </Link>
            {[job.location, salaryText(job)].filter(Boolean).map((x) => ` · ${x}`)}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {placedCount} of {job.positions} {job.positions === 1 ? "position" : "positions"} filled
            {potentialFee(job) > 0 && (
              <>
                {" · "}potential fee <span className="font-semibold text-green-700">{money(potentialFee(job))}</span>
              </>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={job.status}
            onChange={(e) => setStatus(e.target.value as JobStatus)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-[#1F3447]"
            aria-label="Job status"
          >
            {JOB_STATUSES.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
          <FindMatches jobId={job.id} jobTitle={job.title} companyName={job.crm_companies?.name ?? "the client"} hasSpecialism={!!job.specialism_id} onAdded={load} />
          <button onClick={() => setAdding(true)} className="flex items-center gap-2 rounded-lg bg-[#F7931E] px-4 py-2 text-sm font-semibold text-white hover:brightness-95">
            <Icon name="plus" className="h-4 w-4" /> Add to shortlist
          </button>
          <Link
            href={`/crm/campaigns?job=${job.id}`}
            title="Send a WhatsApp campaign for this job"
            className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-[#1F3447] hover:bg-slate-50"
          >
            <Icon name="send" className="h-4 w-4" /> Campaign
          </Link>
          <button onClick={deleteJob} title="Delete job" aria-label="Delete job" className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50">
            <Icon name="trash" className="h-4 w-4" />
          </button>
        </div>
      </div>

      {job.description && <p className="mt-4 max-w-3xl whitespace-pre-wrap rounded-2xl bg-white p-4 text-sm text-slate-700 shadow-sm">{job.description}</p>}

      <div className="mt-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-[#1F3447]">Shortlist</h2>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={showRejected} onChange={(e) => setShowRejected(e.target.checked)} className="h-4 w-4 accent-[#F7931E]" />
          Show rejected
        </label>
      </div>

      {entries.length === 0 ? (
        <div className="mt-3 rounded-2xl bg-white p-10 text-center shadow-sm">
          <p className="font-semibold text-[#1F3447]">No one on the shortlist yet</p>
          <p className="mt-1 text-sm text-slate-500">Use Find matches to see your best candidates, or add people yourself.</p>
        </div>
      ) : (
        <div className="mt-3 flex min-h-0 flex-1 gap-3 overflow-x-auto pb-3">
          {columns.map((s) => {
            const cards = entries.filter((e) => e.stage === s.key);
            return (
              <div
                key={s.key}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDropStage(s.key);
                }}
                onDragLeave={() => setDropStage((d) => (d === s.key ? null : d))}
                onDrop={() => {
                  const entry = entries.find((x) => x.id === dragId);
                  if (entry) moveTo(entry, s.key);
                  setDragId(null);
                  setDropStage(null);
                }}
                className={`flex w-60 flex-shrink-0 flex-col rounded-2xl p-2 transition ${dropStage === s.key ? "bg-orange-100" : "bg-slate-200/60"}`}
              >
                <div className="flex items-center gap-2 px-2 py-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.colour }} />
                  <span className="text-sm font-bold text-[#1F3447]">{s.label}</span>
                  <span className="ml-auto text-xs font-semibold text-slate-500">{cards.length}</span>
                </div>
                <div className="min-h-[4rem] flex-1 space-y-2 overflow-y-auto">
                  {cards.map((e) => (
                    <div
                      key={e.id}
                      draggable={e.stage !== "placed"}
                      onDragStart={() => setDragId(e.id)}
                      onDragEnd={() => {
                        setDragId(null);
                        setDropStage(null);
                      }}
                      className={`group rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-200 ${e.stage === "placed" ? "" : "cursor-grab active:cursor-grabbing"} ${dragId === e.id ? "opacity-50" : ""}`}
                    >
                      <div className="flex items-start gap-2">
                        <Link href={`/crm/candidates/view?id=${e.candidate_id}`} className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-[#1F3447]">{candidateName(e.crm_candidates)}</p>
                          <p className="truncate text-xs text-slate-500">
                            {[e.crm_candidates.job_title, e.crm_candidates.location].filter(Boolean).join(", ") || "No details"}
                          </p>
                          {e.crm_candidates.salary_expectation && (
                            <p className="mt-1 inline-block rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-600">{e.crm_candidates.salary_expectation}</p>
                          )}
                        </Link>
                        {e.stage !== "placed" && (
                          <button onClick={() => removeEntry(e)} aria-label="Remove" className="text-slate-300 opacity-0 hover:text-red-600 group-hover:opacity-100">
                            <Icon name="x" className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      {e.stage !== "placed" && (
                        <select
                          value={e.stage}
                          onChange={(ev) => moveTo(e, ev.target.value)}
                          className="mt-2 w-full rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 lg:hidden"
                          aria-label="Move to stage"
                        >
                          {SHORTLIST_STAGES.map((x) => (
                            <option key={x.key} value={x.key}>
                              {x.label}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {adding && <AddToShortlist job={job} existing={entries.map((e) => e.candidate_id)} onClose={() => setAdding(false)} onAdded={load} />}

      {placing && (
        <PlacementForm
          job={job}
          entry={placing}
          placedSoFar={placedCount}
          onClose={() => setPlacing(null)}
          onSaved={() => {
            setPlacing(null);
            load();
          }}
        />
      )}
    </div>
  );
}

// =====================================================================
// Add candidates to the shortlist
// =====================================================================

function AddToShortlist({ job, existing, onClose, onAdded }: { job: Job; existing: string[]; onClose: () => void; onAdded: () => void }) {
  const [people, setPeople] = useState<Candidate[]>([]);
  const [search, setSearch] = useState("");
  const [sameSpecialism, setSameSpecialism] = useState(!!job.specialism_id);
  const [added, setAdded] = useState<Set<string>>(new Set(existing));

  useEffect(() => {
    let q = supabase.from("crm_candidates").select("*").not("stage", "eq", "not_suitable").order("updated_at", { ascending: false }).limit(500);
    if (sameSpecialism && job.specialism_id) q = q.eq("specialism_id", job.specialism_id);
    const term = search.trim();
    if (term.length >= 2) q = q.or(`first_name.ilike.%${term}%,last_name.ilike.%${term}%,job_title.ilike.%${term}%,location.ilike.%${term}%,postcode.ilike.%${term}%`);
    const t = setTimeout(() => q.then(({ data }) => setPeople((data ?? []) as Candidate[])), 250);
    return () => clearTimeout(t);
  }, [search, sameSpecialism, job.specialism_id]);

  async function add(c: Candidate) {
    setAdded((s) => new Set(s).add(c.id));
    await supabase.from("crm_job_candidates").insert({ job_id: job.id, candidate_id: c.id });
    await supabase.from("crm_notes").insert({ candidate_id: c.id, kind: "note", body: `Shortlisted for ${job.title} at ${job.crm_companies?.name ?? "the client"}` });
    onAdded();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="Add to shortlist" onClick={(e) => e.stopPropagation()} className="flex max-h-[88vh] w-full flex-col rounded-t-2xl bg-white p-6 sm:max-w-xl sm:rounded-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#1F3447]">Add to shortlist</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-full p-1.5 hover:bg-slate-100">
            <Icon name="x" className="h-5 w-5" />
          </button>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
          placeholder="Search name, job title, town or postcode"
          className="mt-4 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
        />
        {job.specialism_id && (
          <label className="mt-2 flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={sameSpecialism} onChange={(e) => setSameSpecialism(e.target.checked)} className="h-4 w-4 accent-[#F7931E]" />
            Only this job&apos;s specialism
          </label>
        )}
        <ul className="mt-3 min-h-0 flex-1 divide-y divide-slate-100 overflow-y-auto">
          {people.length === 0 && <li className="py-6 text-center text-sm text-slate-500">No candidates found.</li>}
          {people.map((c) => {
            const on = added.has(c.id);
            return (
              <li key={c.id} className="flex items-center gap-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[#1F3447]">{candidateName(c)}</p>
                  <p className="truncate text-xs text-slate-500">{[c.job_title, c.location, c.salary_expectation].filter(Boolean).join(", ")}</p>
                </div>
                <button
                  onClick={() => add(c)}
                  disabled={on}
                  className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${on ? "bg-green-50 text-green-700" : "bg-[#F7931E] text-white hover:brightness-95"}`}
                >
                  {on ? "Added" : "Add"}
                </button>
              </li>
            );
          })}
        </ul>
        <button onClick={onClose} className="mt-3 rounded-lg bg-[#1F3447] px-4 py-2.5 text-sm font-semibold text-white">
          Done
        </button>
      </div>
    </div>
  );
}

// =====================================================================
// Record a placement
// =====================================================================

function PlacementForm({ job, entry, placedSoFar, onClose, onSaved }: { job: Job; entry: Entry; placedSoFar: number; onClose: () => void; onSaved: () => void }) {
  const terms = job.crm_companies as Terms | undefined;
  const name = candidateName(entry.crm_candidates);
  const company = job.crm_companies?.name ?? "the client";

  const [salary, setSalary] = useState(String(job.salary_to || job.salary_from || ""));
  const [start, setStart] = useState(isoDate(new Date()));
  const [invoiceDate, setInvoiceDate] = useState<string | null>(null);
  const [feeOverride, setFeeOverride] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const salaryNum = Number(salary.replace(/[^0-9.]/g, "")) || 0;
  const calc = useMemo(() => {
    const fee = feeOverride.trim() ? Number(feeOverride.replace(/[^0-9.]/g, "")) || 0 : feeFor(terms, salaryNum);
    const inv = invoiceDate || start;
    return {
      fee: Math.round(fee * 100) / 100,
      vat: Math.round(fee * 0.2 * 100) / 100,
      total: Math.round(fee * 1.2 * 100) / 100,
      invoice: inv,
      due: addDays(inv, terms?.payment_days ?? 30),
      rebateEnd: addDays(start, (terms?.rebate_weeks ?? 8) * 7),
    };
  }, [feeOverride, terms, salaryNum, invoiceDate, start]);

  async function save() {
    if (!salaryNum) return setError("Add the salary they've accepted.");
    if (!start) return setError("Add their start date.");
    setBusy(true);
    setError(null);

    const { error: e } = await supabase.from("crm_placements").insert({
      job_id: job.id,
      candidate_id: entry.candidate_id,
      company_id: job.company_id,
      job_title: job.title,
      candidate_name: name,
      company_name: company,
      start_date: start,
      salary: salaryNum,
      fee_type: terms?.fee_type ?? "percent",
      fee_percent: terms?.fee_type === "percent" ? terms.perm_fee_percent : null,
      fee_amount: calc.fee,
      vat_amount: calc.vat,
      total_amount: calc.total,
      invoice_date: calc.invoice,
      invoice_due_date: calc.due,
      rebate_end_date: calc.rebateEnd,
    });
    if (e) {
      setBusy(false);
      return setError(e.message);
    }

    await Promise.all([
      supabase.from("crm_job_candidates").update({ stage: "placed" }).eq("id", entry.id),
      supabase.from("crm_candidates").update({ stage: "placed" }).eq("id", entry.candidate_id),
      supabase.from("crm_reminders").insert([
        { title: `Invoice ${company} ${money(calc.total, true)} for placing ${name}`, due_at: at9am(calc.invoice), company_id: job.company_id },
        { title: `Check ${company} has paid for ${name} (${money(calc.total, true)})`, due_at: at9am(calc.due), company_id: job.company_id },
        { title: `Rebate period ends today: check ${name} is still at ${company}`, due_at: at9am(calc.rebateEnd), candidate_id: entry.candidate_id },
      ]),
      supabase.from("crm_notes").insert([
        { candidate_id: entry.candidate_id, kind: "note", body: `Placed as ${job.title} at ${company}, starting ${niceDate(start)} on ${money(salaryNum)}` },
        { company_id: job.company_id, kind: "note", body: `Placed ${name} as ${job.title}, starting ${niceDate(start)}. Fee ${money(calc.fee, true)} plus VAT.` },
      ]),
    ]);
    if (placedSoFar + 1 >= job.positions) {
      await supabase.from("crm_jobs").update({ status: "filled", filled_at: new Date().toISOString() }).eq("id", job.id);
    }
    setBusy(false);
    onSaved();
  }

  const input = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#F7931E] focus:outline-none focus:ring-2 focus:ring-[#F7931E]/30";
  const feeLabel = terms?.fee_type === "fixed" ? `${company}'s fixed fee` : `${Number(terms?.perm_fee_percent ?? 0)}% of salary (${company}'s terms)`;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="Record placement" onClick={(e) => e.stopPropagation()} className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white p-6 sm:max-w-lg sm:rounded-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#1F3447]">🎉 Placement</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-full p-1.5 hover:bg-slate-100">
            <Icon name="x" className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          {name} as {job.title} at {company}
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs font-semibold text-slate-500">Salary accepted (£)</span>
            <input className={`mt-1 ${input}`} inputMode="numeric" value={salary} onChange={(e) => setSalary(e.target.value)} />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-slate-500">Start date</span>
            <input type="date" className={`mt-1 ${input}`} value={start} onChange={(e) => setStart(e.target.value)} />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-slate-500">Invoice date</span>
            <input type="date" className={`mt-1 ${input}`} value={invoiceDate ?? start} onChange={(e) => setInvoiceDate(e.target.value)} />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-slate-500">Fee (leave blank to use terms)</span>
            <input className={`mt-1 ${input}`} inputMode="decimal" placeholder={money(feeFor(terms, salaryNum))} value={feeOverride} onChange={(e) => setFeeOverride(e.target.value)} />
          </label>
        </div>

        <dl className="mt-5 space-y-2 rounded-xl bg-slate-50 p-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-500">Fee {feeOverride.trim() ? "(entered)" : `(${feeLabel})`}</dt>
            <dd className="font-semibold text-[#1F3447]">{money(calc.fee, true)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">VAT at 20%</dt>
            <dd className="font-semibold text-[#1F3447]">{money(calc.vat, true)}</dd>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-2">
            <dt className="font-semibold text-[#1F3447]">Invoice total</dt>
            <dd className="text-lg font-bold text-green-700">{money(calc.total, true)}</dd>
          </div>
          <div className="flex justify-between pt-2">
            <dt className="text-slate-500">Payment due ({terms?.payment_days ?? 30} days)</dt>
            <dd className="font-semibold text-[#1F3447]">{niceDate(calc.due)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Rebate ends ({terms?.rebate_weeks ?? 8} weeks)</dt>
            <dd className="font-semibold text-[#1F3447]">{niceDate(calc.rebateEnd)}</dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-slate-500">Saving adds reminders to send the invoice, chase payment, and check in when the rebate period ends.</p>

        {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">
            Cancel
          </button>
          <button onClick={save} disabled={busy} className="rounded-lg bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50">
            {busy ? "Saving…" : "Record placement"}
          </button>
        </div>
      </div>
    </div>
  );
}