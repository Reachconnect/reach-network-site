"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Icon, type Specialism } from "../crm";
import { JOB_STATUSES, TERMS_FIELDS, jobStatusOf, money, potentialFee, salaryText, type Job } from "./jobsShared";

type CompanyOption = { id: string; name: string; stage: string };

export default function JobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [specialisms, setSpecialisms] = useState<Specialism[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("live");
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    const [j, s] = await Promise.all([
      supabase
        .from("crm_jobs")
        .select(`*, crm_companies(${TERMS_FIELDS}), crm_job_candidates(id, stage)`)
        .order("created_at", { ascending: false })
        .limit(1000),
      supabase.from("crm_specialisms").select("*").order("sort_order").order("name"),
    ]);
    if (j.error) setError(j.error.message);
    setJobs((j.data ?? []) as Job[]);
    setSpecialisms((s.data ?? []) as Specialism[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const shown = useMemo(() => {
    const term = search.trim().toLowerCase();
    return jobs.filter((j) => {
      if (status === "live" && !["open", "on_hold"].includes(j.status)) return false;
      if (status !== "live" && status !== "all" && j.status !== status) return false;
      return !term || `${j.title} ${j.crm_companies?.name ?? ""} ${j.location ?? ""}`.toLowerCase().includes(term);
    });
  }, [jobs, status, search]);

  const openJobs = jobs.filter((j) => j.status === "open");
  const pipelineValue = openJobs.reduce((sum, j) => sum + potentialFee(j), 0);

  return (
    <div className="mx-auto max-w-7xl p-5 lg:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#1F3447]">Jobs</h1>
          <p className="mt-1 text-slate-500">
            {openJobs.length} open {openJobs.length === 1 ? "job" : "jobs"}, worth up to <span className="font-semibold text-green-700">{money(pipelineValue)}</span> in fees
          </p>
        </div>
        <button onClick={() => setAdding(true)} className="flex items-center gap-2 rounded-lg bg-[#F7931E] px-4 py-2.5 text-sm font-semibold text-white hover:brightness-95">
          <Icon name="plus" className="h-4 w-4" /> Add job
        </button>
      </div>

      {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <div className="mt-5 flex flex-wrap items-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
        <div className="flex flex-wrap gap-1">
          {[["live", "Open and on hold"], ...JOB_STATUSES.map((s) => [s.key, s.label]), ["all", "All"]].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setStatus(key)}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${status === key ? "bg-[#1F3447] text-white" : "text-slate-600 hover:bg-slate-100"}`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="relative ml-auto min-w-[12rem]">
          <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search jobs or clients" className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm" />
        </div>
      </div>

      <div className="mt-5 overflow-x-auto rounded-2xl bg-white shadow-sm">
        {loading ? (
          <p className="p-10 text-center text-slate-500">Loading…</p>
        ) : shown.length === 0 ? (
          <div className="p-10 text-center">
            <p className="font-semibold text-[#1F3447]">{jobs.length ? "No jobs match." : "No jobs yet"}</p>
            {!jobs.length && (
              <button onClick={() => setAdding(true)} className="mt-2 text-sm font-semibold text-[#F7931E] hover:underline">
                Add your first job
              </button>
            )}
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="p-3">Job</th>
                <th className="p-3">Client</th>
                <th className="p-3">Location</th>
                <th className="p-3">Salary</th>
                <th className="p-3">Shortlist</th>
                <th className="p-3">Potential fee</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {shown.map((j) => {
                const st = jobStatusOf(j.status);
                const sp = specialisms.find((s) => s.id === j.specialism_id);
                const list = (j.crm_job_candidates ?? []).filter((x) => x.stage !== "rejected");
                const interviews = list.filter((x) => ["interview", "offer"].includes(x.stage)).length;
                return (
                  <tr key={j.id} onClick={() => router.push(`/crm/jobs/view?id=${j.id}`)} className="cursor-pointer hover:bg-slate-50">
                    <td className="p-3">
                      <p className="font-semibold text-[#1F3447]">
                        {sp && <span className="mr-1">{sp.emoji}</span>}
                        {j.title}
                        {j.positions > 1 && <span className="ml-1 text-xs font-normal text-slate-500">×{j.positions}</span>}
                      </p>
                    </td>
                    <td className="p-3 text-slate-600">{j.crm_companies?.name}</td>
                    <td className="p-3 text-slate-600">{j.location || "—"}</td>
                    <td className="p-3 text-slate-600">{salaryText(j) || "—"}</td>
                    <td className="p-3 text-slate-600">
                      {list.length}
                      {interviews > 0 && <span className="ml-1 text-xs text-amber-600">({interviews} at interview or offer)</span>}
                    </td>
                    <td className="p-3 font-semibold text-green-700">{potentialFee(j) ? money(potentialFee(j)) : "—"}</td>
                    <td className="p-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${st.cls}`}>{st.label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {adding && (
        <AddJob
          specialisms={specialisms}
          onClose={() => setAdding(false)}
          onSaved={(id) => {
            setAdding(false);
            router.push(`/crm/jobs/view?id=${id}`);
          }}
        />
      )}
    </div>
  );
}

function AddJob({ specialisms, onClose, onSaved }: { specialisms: Specialism[]; onClose: () => void; onSaved: (id: string) => void }) {
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [f, setF] = useState({
    company_id: "",
    title: "",
    specialism_id: "",
    location: "",
    postcode: "",
    salary_from: "",
    salary_to: "",
    salary_notes: "",
    positions: "1",
    description: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("crm_companies")
      .select("id, name, stage")
      .neq("stage", "lost")
      .order("name")
      .then(({ data }) => setCompanies((data ?? []) as CompanyOption[]));
  }, []);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF((p) => ({ ...p, [k]: e.target.value }));
  const num = (v: string) => {
    const n = Number(v.replace(/[^0-9.]/g, ""));
    if (!n) return null;
    return Math.round(n < 1000 ? n * 1000 : n); // "38" or "38k" means £38,000
  };

  async function save() {
    if (!f.company_id) return setError("Choose the client.");
    if (!f.title.trim()) return setError("Add the job title.");
    setBusy(true);
    setError(null);
    const { data, error: e } = await supabase
      .from("crm_jobs")
      .insert({
        company_id: f.company_id,
        title: f.title.trim(),
        specialism_id: f.specialism_id || null,
        location: f.location.trim() || null,
        postcode: f.postcode.trim().toUpperCase() || null,
        salary_from: num(f.salary_from),
        salary_to: num(f.salary_to) ?? num(f.salary_from),
        salary_notes: f.salary_notes.trim() || null,
        positions: Math.max(1, Number(f.positions) || 1),
        description: f.description.trim() || null,
      })
      .select("id")
      .single();
    setBusy(false);
    if (e || !data) return setError(e?.message || "Couldn't save the job.");
    onSaved(data.id);
  }

  const input = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#F7931E] focus:outline-none focus:ring-2 focus:ring-[#F7931E]/30";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="Add job" onClick={(e) => e.stopPropagation()} className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white p-6 sm:max-w-2xl sm:rounded-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#1F3447]">Add job</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-full p-1.5 hover:bg-slate-100">
            <Icon name="x" className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <select className={`${input} sm:col-span-2`} value={f.company_id} onChange={set("company_id")} aria-label="Client">
            <option value="">Choose the client…</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.stage !== "client" ? " (not a client yet)" : ""}
              </option>
            ))}
          </select>
          <input className={`${input} sm:col-span-2`} placeholder="Job title, e.g. Fire Alarm Engineer" value={f.title} onChange={set("title")} />
          <select className={input} value={f.specialism_id} onChange={set("specialism_id")} aria-label="Specialism">
            <option value="">Specialism…</option>
            {specialisms.map((s) => (
              <option key={s.id} value={s.id}>
                {s.emoji} {s.name}
              </option>
            ))}
          </select>
          <input className={input} inputMode="numeric" placeholder="Positions" value={f.positions} onChange={set("positions")} />
          <input className={input} placeholder="Location, e.g. Birmingham" value={f.location} onChange={set("location")} />
          <input className={input} placeholder="Postcode" value={f.postcode} onChange={set("postcode")} />
          <input className={input} inputMode="numeric" placeholder="Salary from, e.g. 35000" value={f.salary_from} onChange={set("salary_from")} />
          <input className={input} inputMode="numeric" placeholder="Salary to, e.g. 40000" value={f.salary_to} onChange={set("salary_to")} />
          <input className={`${input} sm:col-span-2`} placeholder="Package notes, e.g. plus van, overtime, Monday to Friday" value={f.salary_notes} onChange={set("salary_notes")} />
          <textarea className={`${input} sm:col-span-2`} rows={4} placeholder="Job details (optional)" value={f.description} onChange={set("description")} />
        </div>

        {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">
            Cancel
          </button>
          <button onClick={save} disabled={busy} className="rounded-lg bg-[#F7931E] px-5 py-2.5 text-sm font-semibold text-white hover:brightness-95 disabled:opacity-50">
            {busy ? "Saving…" : "Save and open"}
          </button>
        </div>
      </div>
    </div>
  );
}