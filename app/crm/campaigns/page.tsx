"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Icon, JOB_TYPES, STAGES, candidateName, ukDate, type Specialism } from "../crm";
import { salaryText } from "../jobs/jobsShared";

type Person = {
  id: string;
  first_name: string;
  last_name: string | null;
  phone: string | null;
  location: string | null;
  postcode: string | null;
  job_title: string | null;
  stage: string;
  job_type: string;
  specialism_id: string | null;
  whatsapp_consent: boolean;
};
type Template = { name: string; language: string; category: string; body: string; variables: number };
type Campaign = {
  id: string;
  name: string;
  template_name: string;
  status: string;
  total: number;
  sent_count: number;
  failed_count: number;
  replied_count: number;
  created_at: string;
  crm_jobs: { title: string } | null;
};
type JobOption = {
  id: string;
  title: string;
  location: string | null;
  salary_from: number | null;
  salary_to: number | null;
  salary_notes: string | null;
  specialism_id: string | null;
  crm_companies: { name: string } | null;
};

async function api(path: string, init?: RequestInit) {
  const { data } = await supabase.auth.getSession();
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session?.access_token ?? ""}`, ...(init?.headers || {}) },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || "Something went wrong.");
  return json;
}

export default function CampaignsPage() {
  return (
    <Suspense fallback={<p className="p-8 text-slate-500">Loading…</p>}>
      <Campaigns />
    </Suspense>
  );
}

function Campaigns() {
  const jobParam = useSearchParams().get("job");
  const [mode, setMode] = useState<"list" | "new">(jobParam ? "new" : "list");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCampaigns = useCallback(async () => {
    const { data } = await supabase.from("crm_campaigns").select("*, crm_jobs(title)").order("created_at", { ascending: false }).limit(100);
    setCampaigns((data ?? []) as Campaign[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  return (
    <div className="mx-auto max-w-7xl p-5 lg:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#1F3447]">Campaigns</h1>
          <p className="mt-1 text-slate-500">Send perm roles to candidates on WhatsApp. Replies arrive in your ReachConnect inbox.</p>
        </div>
        {mode === "list" ? (
          <button onClick={() => setMode("new")} className="flex items-center gap-2 rounded-lg bg-[#F7931E] px-4 py-2.5 text-sm font-semibold text-white hover:brightness-95">
            <Icon name="plus" className="h-4 w-4" /> New campaign
          </button>
        ) : (
          <button onClick={() => setMode("list")} className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-[#1F3447] hover:bg-slate-50">
            Back to campaigns
          </button>
        )}
      </div>

      {mode === "new" ? (
        <Builder
          initialJobId={jobParam}
          onDone={() => {
            setMode("list");
            loadCampaigns();
          }}
        />
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl bg-white shadow-sm">
          {loading ? (
            <p className="p-10 text-center text-slate-500">Loading…</p>
          ) : campaigns.length === 0 ? (
            <div className="p-10 text-center">
              <p className="font-semibold text-[#1F3447]">No campaigns yet</p>
              <button onClick={() => setMode("new")} className="mt-2 text-sm font-semibold text-[#F7931E] hover:underline">
                Create your first campaign
              </button>
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="p-3">Campaign</th>
                  <th className="p-3">Sent</th>
                  <th className="p-3">Recipients</th>
                  <th className="p-3">Delivered</th>
                  <th className="p-3">Replies</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {campaigns.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="p-3">
                      <Link href={`/crm/campaigns/view?id=${c.id}`} className="font-semibold text-[#1F3447] hover:underline">
                        {c.name}
                      </Link>
                      <p className="text-xs text-slate-500">
                        {c.template_name}
                        {c.crm_jobs ? ` · for ${c.crm_jobs.title}` : ""}
                      </p>
                    </td>
                    <td className="p-3 text-slate-600">{ukDate(c.created_at)}</td>
                    <td className="p-3 text-slate-700">{c.total}</td>
                    <td className="p-3 text-slate-700">
                      {c.sent_count}
                      {c.failed_count > 0 && <span className="ml-1 text-xs text-red-600">({c.failed_count} failed)</span>}
                    </td>
                    <td className="p-3 font-semibold text-green-700">{c.replied_count}</td>
                    <td className="p-3">
                      {c.status === "sent" ? (
                        <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-700">Sent</span>
                      ) : (
                        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700">Waiting to send</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

// =====================================================================
// New campaign
// =====================================================================

function Builder({ initialJobId, onDone }: { initialJobId: string | null; onDone: () => void }) {
  const [specialisms, setSpecialisms] = useState<Specialism[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [jobs, setJobs] = useState<JobOption[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templateError, setTemplateError] = useState<string | null>(null);

  const [jobId, setJobId] = useState(initialJobId || "");
  const [specialismId, setSpecialismId] = useState("");
  const [stage, setStage] = useState("active");
  const [jobType, setJobType] = useState("all");
  const [location, setLocation] = useState("");
  const [excluded, setExcluded] = useState<Set<string>>(new Set());

  const [templateName, setTemplateName] = useState("");
  const [vars, setVars] = useState<string[]>([]);
  const [name, setName] = useState("");

  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ sent: number; failed: number; total: number; limit: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [s, p, j] = await Promise.all([
        supabase.from("crm_specialisms").select("*").order("sort_order").order("name"),
        supabase
          .from("crm_candidates")
          .select("id, first_name, last_name, phone, location, postcode, job_title, stage, job_type, specialism_id, whatsapp_consent")
          .limit(10000),
        supabase
          .from("crm_jobs")
          .select("id, title, location, salary_from, salary_to, salary_notes, specialism_id, crm_companies(name)")
          .eq("status", "open")
          .order("created_at", { ascending: false }),
      ]);
      setSpecialisms((s.data ?? []) as Specialism[]);
      setPeople((p.data ?? []) as Person[]);
      const jobList = (j.data ?? []) as unknown as JobOption[];
      setJobs(jobList);
      // Coming from a job's Campaign button
      const start = jobList.find((x) => x.id === initialJobId);
      if (start) applyJob(start, "");
    })();
    api("/api/crm/templates")
      .then((j) => setTemplates(j.templates as Template[]))
      .catch((e) => setTemplateError((e as Error).message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const job = jobs.find((j) => j.id === jobId) || null;

  function jobGaps(j: JobOption | null, count: number) {
    return Array.from({ length: count }, (_, i) => {
      if (i === 0) return "{first_name}";
      if (!j) return "";
      if (i === 1) return j.title;
      if (i === 2) return [j.location, salaryText(j)].filter(Boolean).join(", ");
      return "";
    });
  }

  function applyJob(j: JobOption | null, tName: string) {
    if (j?.specialism_id) setSpecialismId(j.specialism_id);
    if (j) setName(`${j.title}${j.crm_companies ? ` at ${j.crm_companies.name}` : ""}`);
    const t = templates.find((x) => x.name === tName);
    if (t) setVars(jobGaps(j, t.variables));
  }

  function pickJob(id: string) {
    setJobId(id);
    applyJob(jobs.find((x) => x.id === id) || null, templateName);
  }

  const matches = useMemo(() => {
    const loc = location.trim().toLowerCase();
    return people.filter((p) => {
      if (specialismId && p.specialism_id !== specialismId) return false;
      if (stage === "active" && ["placed", "not_suitable"].includes(p.stage)) return false;
      if (stage !== "active" && stage !== "all" && p.stage !== stage) return false;
      if (jobType !== "all" && p.job_type !== jobType && p.job_type !== "either") return false;
      if (loc && !`${p.location || ""} ${p.postcode || ""}`.toLowerCase().includes(loc)) return false;
      return true;
    });
  }, [people, specialismId, stage, jobType, location]);

  const reachable = matches.filter((p) => p.whatsapp_consent && p.phone);
  const notReachable = matches.length - reachable.length;
  const chosen = reachable.filter((p) => !excluded.has(p.id));

  const template = templates.find((t) => t.name === templateName) || null;

  function pickTemplate(n: string) {
    setTemplateName(n);
    const t = templates.find((x) => x.name === n);
    setVars(jobGaps(job, t?.variables ?? 0));
    if (!name) {
      const sp = specialisms.find((s) => s.id === specialismId);
      setName(job ? `${job.title}${job.crm_companies ? ` at ${job.crm_companies.name}` : ""}` : `${sp ? `${sp.name}: ` : ""}${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`);
    }
  }

  const sample = chosen[0];
  const preview = template
    ? template.body.replace(/\{\{(\d+)\}\}/g, (_, n) => {
        const v = vars[Number(n) - 1] || `[gap ${n}]`;
        return v.replaceAll("{first_name}", sample?.first_name || "Sarah");
      })
    : "";

  async function send() {
    setError(null);
    if (!chosen.length) return setError("No candidates selected.");
    if (!template) return setError("Choose a template.");
    if (vars.some((v) => !v.trim())) return setError("Fill in every gap in the template.");
    if (!name.trim()) return setError("Give the campaign a name.");
    if (!window.confirm(`Send to ${chosen.length} ${chosen.length === 1 ? "person" : "people"} on WhatsApp?`)) return;

    setBusy(true);
    try {
      const created = await api("/api/crm/campaigns", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          templateName: template.name,
          language: template.language,
          templateBody: template.body,
          variables: vars,
          jobId: jobId || null,
          candidateIds: chosen.map((p) => p.id),
        }),
      });
      const total = created.total as number;
      let sent = 0;
      let failed = 0;
      setProgress({ sent, failed, total, limit: false });

      for (let guard = 0; guard < 200; guard++) {
        const r = await api("/api/crm/campaigns/send", { method: "POST", body: JSON.stringify({ campaignId: created.id }) });
        sent += r.sent;
        failed += r.failed;
        setProgress({ sent, failed, total, limit: r.limitReached });
        if (r.remaining === 0 || r.limitReached || r.sent + r.failed === 0) break;
      }
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(false);
  }

  const input = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#F7931E] focus:outline-none focus:ring-2 focus:ring-[#F7931E]/30";

  if (progress) {
    const pct = Math.round(((progress.sent + progress.failed) / Math.max(1, progress.total)) * 100);
    const finished = !busy;
    return (
      <div className="mx-auto mt-8 max-w-xl rounded-2xl bg-white p-8 text-center shadow-sm">
        <p className="text-lg font-bold text-[#1F3447]">{finished ? (progress.limit ? "Paused at today's limit" : "Campaign sent") : "Sending…"}</p>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-[#F7931E] transition-all" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-3 text-sm text-slate-600">
          {progress.sent} sent{progress.failed ? `, ${progress.failed} failed` : ""} of {progress.total}
        </p>
        {job && finished && <p className="mt-2 text-sm text-slate-500">Anyone who replies with interest is added to the {job.title} shortlist automatically.</p>}
        {progress.limit && (
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
            WhatsApp&apos;s daily limit has been reached. Open the campaign tomorrow and click Continue sending.
          </p>
        )}
        {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        {finished && (
          <button onClick={onDone} className="mt-6 rounded-lg bg-[#1F3447] px-5 py-2.5 text-sm font-semibold text-white">
            Done
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_24rem]">
      <div className="space-y-6">
        {/* 0. Job */}
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-[#1F3447]">Which job is this for?</h2>
          <select className={`mt-3 ${input}`} value={jobId} onChange={(e) => pickJob(e.target.value)} aria-label="Job">
            <option value="">Not for a specific job</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title}
                {j.crm_companies ? ` at ${j.crm_companies.name}` : ""}
                {j.location ? `, ${j.location}` : ""}
              </option>
            ))}
          </select>
          {job && <p className="mt-2 text-xs text-slate-500">Anyone who replies with interest is added to this job&apos;s shortlist automatically.</p>}
        </section>

        {/* 1. Who */}
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-[#1F3447]">1. Who to send to</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <select className={input} value={specialismId} onChange={(e) => setSpecialismId(e.target.value)} aria-label="Specialism">
              <option value="">Every specialism</option>
              {specialisms.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.emoji} {s.name}
                </option>
              ))}
            </select>
            <select className={input} value={stage} onChange={(e) => setStage(e.target.value)} aria-label="Stage">
              <option value="active">Not placed or rejected</option>
              <option value="all">Any stage</option>
              {STAGES.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
            <select className={input} value={jobType} onChange={(e) => setJobType(e.target.value)} aria-label="Looking for">
              <option value="all">Perm or temp</option>
              {JOB_TYPES.filter(([v]) => v !== "either").map(([v, label]) => (
                <option key={v} value={v}>
                  {label}
                </option>
              ))}
            </select>
            <input className={input} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Town or postcode, e.g. B61" />
          </div>

          <p className="mt-4 text-sm text-slate-600">
            <span className="font-bold text-[#1F3447]">{chosen.length}</span> selected of {reachable.length} who can be messaged.
            {notReachable > 0 && <span className="text-slate-500"> {notReachable} more match but have no mobile or haven&apos;t agreed to WhatsApp.</span>}
          </p>

          {reachable.length > 0 && (
            <div className="mt-3 max-h-72 overflow-y-auto rounded-xl border border-slate-200">
              <div className="sticky top-0 flex items-center gap-3 border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
                <input
                  type="checkbox"
                  checked={excluded.size === 0}
                  onChange={(e) => setExcluded(e.target.checked ? new Set() : new Set(reachable.map((p) => p.id)))}
                  className="h-4 w-4 accent-[#F7931E]"
                  aria-label="Select everyone"
                />
                Everyone
              </div>
              {reachable.map((p) => (
                <label key={p.id} className="flex cursor-pointer items-center gap-3 border-b border-slate-100 px-3 py-2 text-sm last:border-0 hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={!excluded.has(p.id)}
                    onChange={(e) =>
                      setExcluded((prev) => {
                        const next = new Set(prev);
                        if (e.target.checked) next.delete(p.id);
                        else next.add(p.id);
                        return next;
                      })
                    }
                    className="h-4 w-4 accent-[#F7931E]"
                  />
                  <span className="min-w-0 flex-1 truncate font-medium text-[#1F3447]">{candidateName(p)}</span>
                  <span className="truncate text-xs text-slate-500">{[p.job_title, p.location].filter(Boolean).join(", ")}</span>
                </label>
              ))}
            </div>
          )}
        </section>

        {/* 2. Message */}
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-[#1F3447]">2. Message</h2>
          {templateError ? (
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{templateError}</p>
          ) : templates.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">Loading approved templates…</p>
          ) : (
            <div className="mt-3 space-y-3">
              <select className={input} value={templateName} onChange={(e) => pickTemplate(e.target.value)} aria-label="Template">
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
                    {i === 0 && " (usually their first name)"}
                  </span>
                  <input
                    className={`mt-1 ${input}`}
                    value={v}
                    onChange={(e) => setVars((list) => list.map((x, j) => (j === i ? e.target.value : x)))}
                    placeholder={i === 1 ? "Fire Alarm Engineer" : i === 2 ? "Birmingham, £38k plus van, Monday to Friday" : ""}
                  />
                </label>
              ))}
              {vars.length > 0 && <p className="text-xs text-slate-500">Type {"{first_name}"} anywhere to use each person&apos;s first name.</p>}
              <label className="block">
                <span className="text-xs font-semibold text-slate-500">Campaign name (just for you)</span>
                <input className={`mt-1 ${input}`} value={name} onChange={(e) => setName(e.target.value)} placeholder="Fire Alarm Engineer, Birmingham" />
              </label>
            </div>
          )}
        </section>
      </div>

      {/* 3. Preview and send */}
      <section className="rounded-2xl bg-white p-5 shadow-sm xl:sticky xl:top-5 xl:self-start">
        <h2 className="text-lg font-bold text-[#1F3447]">3. Preview and send</h2>
        <div className="mt-3 rounded-xl bg-[#E5DDD5] p-4">
          {template ? (
            <div className="max-w-[90%] rounded-lg rounded-tl-none bg-white p-3 text-sm text-slate-800 shadow-sm">
              <p className="whitespace-pre-wrap">{preview}</p>
              <p className="mt-2 text-xs text-slate-400">Reply STOP to opt out</p>
            </div>
          ) : (
            <p className="text-center text-sm text-slate-600">Choose a template to see a preview.</p>
          )}
        </div>
        {sample && template && <p className="mt-2 text-xs text-slate-500">Shown as {sample.first_name} will see it.</p>}

        {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <button
          onClick={send}
          disabled={busy || !chosen.length || !template}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-[#F7931E] px-4 py-3 text-sm font-semibold text-white hover:brightness-95 disabled:opacity-40"
        >
          <Icon name="send" className="h-4 w-4" />
          {busy ? "Starting…" : `Send to ${chosen.length} ${chosen.length === 1 ? "person" : "people"}`}
        </button>
        <p className="mt-2 text-xs text-slate-500">WhatsApp allows 250 of these a day across ReachConnect and the CRM. Anything over that waits until tomorrow.</p>
      </section>
    </div>
  );
}