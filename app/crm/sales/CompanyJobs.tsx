"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Icon } from "../crm";
import { jobStatusOf, salaryText, type Job } from "../jobs/jobsShared";

export default function CompanyJobs({ companyId }: { companyId: string }) {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [adding, setAdding] = useState(false);
  const [f, setF] = useState({ title: "", location: "", from: "", to: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase.from("crm_jobs").select("*, crm_job_candidates(id, stage)").eq("company_id", companyId).order("created_at", { ascending: false });
    setJobs((data ?? []) as Job[]);
  }, [companyId]);

  useEffect(() => {
    load();
  }, [load]);

  const num = (v: string) => {
    const n = Number(v.replace(/[^0-9.]/g, ""));
    if (!n) return null;
    return Math.round(n < 1000 ? n * 1000 : n);
  };

  async function add() {
    if (!f.title.trim()) return setError("Add the job title.");
    setBusy(true);
    setError(null);
    const { data, error: e } = await supabase
      .from("crm_jobs")
      .insert({ company_id: companyId, title: f.title.trim(), location: f.location.trim() || null, salary_from: num(f.from), salary_to: num(f.to) ?? num(f.from) })
      .select("id")
      .single();
    setBusy(false);
    if (e || !data) return setError(e?.message || "Couldn't add the job.");
    router.push(`/crm/jobs/view?id=${data.id}`);
  }

  const input = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#F7931E] focus:outline-none focus:ring-2 focus:ring-[#F7931E]/30";

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-[#1F3447]">Jobs</h2>
        <button onClick={() => setAdding((a) => !a)} className="text-sm font-semibold text-[#F7931E] hover:underline">
          {adding ? "Cancel" : "Add job"}
        </button>
      </div>

      {adding && (
        <div className="mt-3 grid gap-2 rounded-xl bg-slate-50 p-3 sm:grid-cols-2">
          <input className={`${input} sm:col-span-2`} placeholder="Job title, e.g. Fire Alarm Engineer" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
          <input className={`${input} sm:col-span-2`} placeholder="Location" value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} />
          <input className={input} inputMode="numeric" placeholder="Salary from, e.g. 35000" value={f.from} onChange={(e) => setF({ ...f, from: e.target.value })} />
          <input className={input} inputMode="numeric" placeholder="Salary to, e.g. 40000" value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })} />
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-2">{error}</p>}
          <button onClick={add} disabled={busy} className="rounded-lg bg-[#F7931E] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 sm:col-span-2">
            {busy ? "Adding…" : "Add and open"}
          </button>
        </div>
      )}

      {jobs.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">No jobs for this company yet.</p>
      ) : (
        <ul className="mt-3 divide-y divide-slate-100">
          {jobs.map((j) => {
            const st = jobStatusOf(j.status);
            const n = (j.crm_job_candidates ?? []).filter((x) => x.stage !== "rejected").length;
            return (
              <li key={j.id} className="flex flex-wrap items-center gap-3 py-3">
                <Link href={`/crm/jobs/view?id=${j.id}`} className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[#1F3447] hover:underline">{j.title}</p>
                  <p className="truncate text-xs text-slate-500">
                    {[j.location, salaryText(j), `${n} on shortlist`].filter(Boolean).join(" · ")}
                  </p>
                </Link>
                <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${st.cls}`}>{st.label}</span>
                {j.status === "open" && (
                  <Link href={`/crm/campaigns?job=${j.id}`} title="Send a WhatsApp campaign for this job" className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100">
                    <Icon name="send" className="h-3.5 w-3.5" /> Campaign
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}