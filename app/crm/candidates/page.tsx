"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Icon, JOB_TYPES, STAGES, candidateName, stageOf, timeAgo, type Candidate, type Specialism, type StageKey } from "../crm";

export default function CandidatesPage() {
  return (
    <Suspense fallback={<p className="p-8 text-slate-500">Loading…</p>}>
      <Candidates />
    </Suspense>
  );
}

function Candidates() {
  const params = useSearchParams();
  const router = useRouter();
  const slug = params.get("s");

  const [specialisms, setSpecialisms] = useState<Specialism[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [view, setView] = useState<"board" | "list">("board");
  const [search, setSearch] = useState("");
  const [stage, setStage] = useState("all");
  const [jobType, setJobType] = useState("all");
  const [adding, setAdding] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropStage, setDropStage] = useState<string | null>(null);

  useEffect(() => {
    try {
      const v = localStorage.getItem("reach-crm-view");
      if (v === "board" || v === "list") setView(v);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (params.get("new") === "1") setAdding(true);
  }, [params]);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: specs } = await supabase.from("crm_specialisms").select("*").order("sort_order").order("name");
    const list = (specs ?? []) as Specialism[];
    setSpecialisms(list);

    let q = supabase.from("crm_candidates").select("*").order("updated_at", { ascending: false }).limit(3000);
    if (slug) {
      const me = list.find((s) => s.slug === slug);
      if (!me) {
        setError("That specialism doesn't exist any more.");
        setCandidates([]);
        setLoading(false);
        return;
      }
      q = q.eq("specialism_id", me.id);
    }
    const { data, error: e } = await q;
    if (e) setError(e.message);
    else setError(null);
    setCandidates((data ?? []) as Candidate[]);
    setLoading(false);
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  function changeView(v: "board" | "list") {
    setView(v);
    try {
      localStorage.setItem("reach-crm-view", v);
    } catch {
      // ignore
    }
  }

  const current = specialisms.find((s) => s.slug === slug) || null;

  const shown = useMemo(() => {
    const term = search.trim().toLowerCase();
    return candidates.filter((c) => {
      if (stage !== "all" && c.stage !== stage) return false;
      if (jobType !== "all" && c.job_type !== jobType) return false;
      if (!term) return true;
      return [c.first_name, c.last_name, c.phone, c.email, c.location, c.postcode, c.job_title, c.current_employer]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [candidates, search, stage, jobType]);

  async function moveTo(id: string, to: StageKey) {
    const before = candidates;
    setCandidates((list) => list.map((c) => (c.id === id ? { ...c, stage: to } : c)));
    const { error: e } = await supabase.from("crm_candidates").update({ stage: to }).eq("id", id);
    if (e) {
      setCandidates(before);
      setError(`That didn't save: ${e.message}`);
    }
  }

  function closeAdd() {
    setAdding(false);
    if (params.get("new")) router.replace(slug ? `/crm/candidates?s=${slug}` : "/crm/candidates");
  }

  return (
    <div className="flex h-full flex-col p-5 lg:p-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold text-[#1F3447]">
            {current && <span>{current.emoji}</span>}
            {current ? current.name : "All candidates"}
          </h1>
          <p className="mt-1 text-slate-500">
            {loading ? "Loading…" : `${shown.length} ${shown.length === 1 ? "candidate" : "candidates"}`}
            {current ? "" : " across every specialism"}
          </p>
        </div>
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-2 rounded-lg bg-[#F7931E] px-4 py-2.5 text-sm font-semibold text-white hover:brightness-95"
        >
          <Icon name="plus" className="h-4 w-4" /> Add candidate
        </button>
      </div>

      {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {/* Controls */}
      <div className="mt-5 flex flex-wrap items-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
        <div className="relative min-w-[14rem] flex-1">
          <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, phone, role, employer or location"
            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm"
          />
        </div>
        {view === "list" && (
          <select value={stage} onChange={(e) => setStage(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" aria-label="Stage">
            <option value="all">Any stage</option>
            {STAGES.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        )}
        <select value={jobType} onChange={(e) => setJobType(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" aria-label="Job type">
          <option value="all">Perm or temp</option>
          {JOB_TYPES.map(([v, label]) => (
            <option key={v} value={v}>
              {label}
            </option>
          ))}
        </select>
        <div className="flex rounded-lg border border-slate-300 p-0.5">
          {(
            [
              ["board", "Board"],
              ["list", "List"],
            ] as const
          ).map(([v, label]) => (
            <button
              key={v}
              onClick={() => changeView(v)}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold ${view === v ? "bg-[#1F3447] text-white" : "text-slate-600 hover:bg-slate-100"}`}
            >
              <Icon name={v} className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Board */}
      {view === "board" && !loading && (
        <div className="mt-5 flex min-h-0 flex-1 gap-3 overflow-x-auto pb-3">
          {STAGES.map((s) => {
            const cards = shown.filter((c) => c.stage === s.key);
            const isTarget = dropStage === s.key;
            return (
              <div
                key={s.key}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDropStage(s.key);
                }}
                onDragLeave={() => setDropStage((d) => (d === s.key ? null : d))}
                onDrop={() => {
                  if (dragId) moveTo(dragId, s.key);
                  setDragId(null);
                  setDropStage(null);
                }}
                className={`flex w-64 flex-shrink-0 flex-col rounded-2xl p-2 transition ${isTarget ? "bg-orange-100" : "bg-slate-200/60"}`}
              >
                <div className="flex items-center gap-2 px-2 py-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.colour }} />
                  <span className="text-sm font-bold text-[#1F3447]">{s.label}</span>
                  <span className="ml-auto text-xs font-semibold text-slate-500">{cards.length}</span>
                </div>
                <div className="min-h-[4rem] flex-1 space-y-2 overflow-y-auto">
                  {cards.map((c) => (
                    <div
                      key={c.id}
                      draggable
                      onDragStart={() => setDragId(c.id)}
                      onDragEnd={() => {
                        setDragId(null);
                        setDropStage(null);
                      }}
                      className={`cursor-grab rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-200 transition hover:shadow-md active:cursor-grabbing ${dragId === c.id ? "opacity-50" : ""}`}
                    >
                      <Link href={`/crm/candidates/view?id=${c.id}`} className="block">
                        <p className="truncate text-sm font-semibold text-[#1F3447]">{candidateName(c)}</p>
                        <p className="truncate text-xs text-slate-500">{[c.job_title, c.location].filter(Boolean).join(", ") || "No details yet"}</p>
                        <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500">
                          {c.salary_expectation && <span className="rounded bg-slate-100 px-1.5 py-0.5 font-semibold">{c.salary_expectation}</span>}
                          {c.rating ? <span className="text-amber-500">{"★".repeat(c.rating)}</span> : null}
                          <span className="ml-auto">{timeAgo(c.last_contacted_at || c.created_at)}</span>
                        </div>
                      </Link>
                      <select
                        value={c.stage}
                        onChange={(e) => moveTo(c.id, e.target.value as StageKey)}
                        className="mt-2 w-full rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 lg:hidden"
                        aria-label="Move to stage"
                      >
                        {STAGES.map((x) => (
                          <option key={x.key} value={x.key}>
                            {x.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List */}
      {view === "list" && !loading && (
        <div className="mt-5 overflow-x-auto rounded-2xl bg-white shadow-sm">
          {shown.length === 0 ? (
            <p className="p-10 text-center text-slate-500">No candidates match. Try clearing the search or filters.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="p-3">Name</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Location</th>
                  <th className="p-3">Salary</th>
                  <th className="p-3">Stage</th>
                  {!current && <th className="p-3">Specialism</th>}
                  <th className="p-3">Last contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {shown.map((c) => {
                  const st = stageOf(c.stage);
                  const sp = specialisms.find((s) => s.id === c.specialism_id);
                  return (
                    <tr key={c.id} onClick={() => router.push(`/crm/candidates/view?id=${c.id}`)} className="cursor-pointer hover:bg-slate-50">
                      <td className="p-3 font-semibold text-[#1F3447]">{candidateName(c)}</td>
                      <td className="p-3 text-slate-600">{c.job_title || "—"}</td>
                      <td className="p-3 text-slate-600">{c.location || c.postcode || "—"}</td>
                      <td className="p-3 text-slate-600">{c.salary_expectation || "—"}</td>
                      <td className="p-3">
                        <span className="rounded-full px-2.5 py-1 text-xs font-semibold text-white" style={{ backgroundColor: st.colour }}>
                          {st.label}
                        </span>
                      </td>
                      {!current && <td className="p-3 text-slate-600">{sp ? `${sp.emoji} ${sp.name}` : "—"}</td>}
                      <td className="p-3 text-slate-500">{timeAgo(c.last_contacted_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {adding && (
        <AddCandidate
          specialisms={specialisms}
          defaultSpecialismId={current?.id ?? ""}
          onClose={closeAdd}
          onSaved={(id, open) => {
            closeAdd();
            if (open) router.push(`/crm/candidates/view?id=${id}`);
            else load();
          }}
        />
      )}
    </div>
  );
}

// =====================================================================
// Add a candidate (fills itself in from their CV)
// =====================================================================

type Form = {
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  location: string;
  postcode: string;
  job_title: string;
  current_employer: string;
  salary_expectation: string;
  notice_period: string;
  job_type: string;
  specialism_id: string;
  source: string;
  whatsapp_consent: boolean;
  note: string;
};

const TEXT_FIELDS: (keyof Form)[] = [
  "first_name",
  "last_name",
  "phone",
  "email",
  "location",
  "postcode",
  "job_title",
  "current_employer",
  "salary_expectation",
  "notice_period",
];

function AddCandidate({
  specialisms,
  defaultSpecialismId,
  onClose,
  onSaved,
}: {
  specialisms: Specialism[];
  defaultSpecialismId: string;
  onClose: () => void;
  onSaved: (id: string, open: boolean) => void;
}) {
  const [f, setF] = useState<Form>({
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    location: "",
    postcode: "",
    job_title: "",
    current_employer: "",
    salary_expectation: "",
    notice_period: "",
    job_type: "perm",
    specialism_id: defaultSpecialismId,
    source: "",
    whatsapp_consent: false,
    note: "",
  });
  const [cv, setCv] = useState<File | null>(null);
  const [reading, setReading] = useState(false);
  const [readResult, setReadResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [filled, setFilled] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const value = e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value;
    setF((prev) => ({ ...prev, [k]: value }));
    setFilled((prev) => {
      const next = new Set(prev);
      next.delete(k);
      return next;
    });
  };

  async function readCv(file: File) {
    setCv(file);
    setReadResult(null);
    setReading(true);
    try {
      const { data } = await supabase.auth.getSession();
      const body = new FormData();
      body.append("file", file);
      body.append("specialisms", JSON.stringify(specialisms.map((s) => s.name)));
      const res = await fetch("/api/crm/parse-cv", {
        method: "POST",
        headers: { Authorization: `Bearer ${data.session?.access_token ?? ""}` },
        body,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "The CV couldn't be read.");
      const got = (json.fields ?? {}) as Record<string, string>;

      const newlyFilled = new Set<string>();
      setF((prev) => {
        const next = { ...prev };
        // Only fill boxes that are still empty
        for (const k of TEXT_FIELDS) {
          if (!String(next[k] || "").trim() && got[k]) {
            (next as Record<string, unknown>)[k] = k === "postcode" ? got[k].toUpperCase() : got[k];
            newlyFilled.add(k);
          }
        }
        if (!next.specialism_id && got.specialism) {
          const match = specialisms.find((s) => s.name.toLowerCase() === got.specialism.toLowerCase());
          if (match) {
            next.specialism_id = match.id;
            newlyFilled.add("specialism_id");
          }
        }
        if (got.job_type && ["perm", "temp", "either"].includes(got.job_type)) {
          next.job_type = got.job_type;
          newlyFilled.add("job_type");
        }
        if (!next.note.trim() && got.summary) {
          next.note = got.summary;
          newlyFilled.add("note");
        }
        return next;
      });
      setFilled(newlyFilled);
      setReadResult({
        ok: true,
        text: newlyFilled.size
          ? `Filled in ${newlyFilled.size} ${newlyFilled.size === 1 ? "detail" : "details"} from the CV. Check them over and fill in anything missing.`
          : "Read the CV, but couldn't find anything new to fill in.",
      });
    } catch (e) {
      setReadResult({ ok: false, text: `${(e as Error).message} You can still fill the form in yourself.` });
    }
    setReading(false);
  }

  async function save(open: boolean) {
    if (!f.first_name.trim()) return setError("Add at least a first name.");
    setBusy(true);
    setError(null);

    const digits = f.phone.replace(/\D/g, "").slice(-9);
    const checks: string[] = [];
    if (digits.length === 9) checks.push(`phone.ilike.%${digits}%`);
    if (f.email.trim()) checks.push(`email.ilike.${f.email.trim()}`);
    if (checks.length) {
      const { data: dupes } = await supabase.from("crm_candidates").select("id, first_name, last_name").or(checks.join(",")).limit(1);
      if (dupes?.length && !window.confirm(`${candidateName(dupes[0])} already has this phone number or email. Add anyway?`)) {
        setBusy(false);
        return;
      }
    }

    const { data, error: e } = await supabase
      .from("crm_candidates")
      .insert({
        first_name: f.first_name.trim(),
        last_name: f.last_name.trim() || null,
        phone: f.phone.trim() || null,
        email: f.email.trim() || null,
        location: f.location.trim() || null,
        postcode: f.postcode.trim().toUpperCase() || null,
        job_title: f.job_title.trim() || null,
        current_employer: f.current_employer.trim() || null,
        salary_expectation: f.salary_expectation.trim() || null,
        notice_period: f.notice_period.trim() || null,
        job_type: f.job_type,
        specialism_id: f.specialism_id || null,
        source: f.source.trim() || null,
        whatsapp_consent: f.whatsapp_consent,
      })
      .select("id")
      .single();
    if (e || !data) {
      setBusy(false);
      return setError(e?.message || "Couldn't save the candidate.");
    }

    if (cv) {
      const path = `${data.id}/${Date.now()}-${cv.name.replace(/[^a-zA-Z0-9.]+/g, "-")}`;
      const up = await supabase.storage.from("crm-cvs").upload(path, cv);
      if (!up.error) await supabase.from("crm_candidates").update({ cv_path: path, cv_filename: cv.name }).eq("id", data.id);
    }
    if (f.note.trim()) {
      await supabase.from("crm_notes").insert({ candidate_id: data.id, kind: "note", body: f.note.trim() });
    }

    setBusy(false);
    onSaved(data.id, open);
  }

  const input = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#F7931E] focus:outline-none focus:ring-2 focus:ring-[#F7931E]/30";
  // Light orange background on anything the CV filled in
  const cls = (k: keyof Form, extra = "") => `${input} ${filled.has(k) ? "bg-orange-50" : ""} ${extra}`;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Add candidate"
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white p-6 sm:max-w-2xl sm:rounded-2xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#1F3447]">Add candidate</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-full p-1.5 hover:bg-slate-100">
            <Icon name="x" className="h-5 w-5" />
          </button>
        </div>

        {/* CV first */}
        <label
          className={`mt-5 flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed p-4 transition ${
            reading ? "border-[#F7931E] bg-orange-50" : "border-slate-300 hover:border-[#F7931E] hover:bg-orange-50/50"
          }`}
        >
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#F7931E]/15 text-[#F7931E]">
            {reading ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#F7931E]/30 border-t-[#F7931E]" /> : <Icon name="file" className="h-5 w-5" />}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-[#1F3447]">
              {reading ? "Reading the CV…" : cv ? cv.name : "Start with their CV"}
            </span>
            <span className="block text-xs text-slate-500">
              {cv && !reading ? "Click to choose a different CV" : "PDF or Word. We'll fill in everything we can find."}
            </span>
          </span>
          <input
            type="file"
            accept=".pdf,.docx,.doc"
            className="hidden"
            disabled={reading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) readCv(file);
              e.target.value = "";
            }}
          />
        </label>
        {readResult && (
          <p className={`mt-2 rounded-lg px-3 py-2 text-sm ${readResult.ok ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-800"}`}>{readResult.text}</p>
        )}

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <input className={cls("first_name")} placeholder="First name" value={f.first_name} onChange={set("first_name")} />
          <input className={cls("last_name")} placeholder="Last name" value={f.last_name} onChange={set("last_name")} />
          <input className={cls("phone")} placeholder="Mobile" inputMode="tel" value={f.phone} onChange={set("phone")} />
          <input className={cls("email")} placeholder="Email" type="email" value={f.email} onChange={set("email")} />
          <input className={cls("location")} placeholder="Town or city" value={f.location} onChange={set("location")} />
          <input className={cls("postcode")} placeholder="Postcode" value={f.postcode} onChange={set("postcode")} />
          <input className={cls("job_title")} placeholder="Job title, e.g. Fire Alarm Engineer" value={f.job_title} onChange={set("job_title")} />
          <input className={cls("current_employer")} placeholder="Current employer" value={f.current_employer} onChange={set("current_employer")} />
          <input className={cls("salary_expectation")} placeholder="Salary expectation, e.g. £38k" value={f.salary_expectation} onChange={set("salary_expectation")} />
          <input className={cls("notice_period")} placeholder="Notice period, e.g. 1 month" value={f.notice_period} onChange={set("notice_period")} />
          <select className={cls("specialism_id")} value={f.specialism_id} onChange={set("specialism_id")} aria-label="Specialism">
            <option value="">Choose specialism…</option>
            {specialisms.map((s) => (
              <option key={s.id} value={s.id}>
                {s.emoji} {s.name}
              </option>
            ))}
          </select>
          <select className={cls("job_type")} value={f.job_type} onChange={set("job_type")} aria-label="Looking for">
            {JOB_TYPES.map(([v, label]) => (
              <option key={v} value={v}>
                {label}
              </option>
            ))}
          </select>
          <input className={cls("source", "sm:col-span-2")} placeholder="Where they came from, e.g. LinkedIn, referral, Indeed" value={f.source} onChange={set("source")} />
          <textarea className={cls("note", "sm:col-span-2")} rows={4} placeholder="First note (optional)" value={f.note} onChange={set("note")} />
          <label className="flex items-start gap-2 text-sm text-slate-700 sm:col-span-2">
            <input type="checkbox" checked={f.whatsapp_consent} onChange={set("whatsapp_consent")} className="mt-0.5 h-4 w-4 accent-[#F7931E]" />
            They&apos;re happy to hear about jobs on WhatsApp
          </label>
        </div>

        {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button onClick={onClose} className="rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">
            Cancel
          </button>
          <button
            onClick={() => save(false)}
            disabled={busy || reading}
            className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-[#1F3447] hover:bg-slate-50 disabled:opacity-50"
          >
            Save
          </button>
          <button
            onClick={() => save(true)}