"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  const [bulk, setBulk] = useState(false);
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
        <div className="flex flex-wrap gap-2">
          <Link
            href={slug ? `/crm/candidates/map?s=${slug}` : "/crm/candidates/map"}
            className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-[#1F3447] hover:bg-slate-50"
          >
            <Icon name="globe" className="h-4 w-4" /> View map
          </Link>
          <button
            onClick={() => setBulk(true)}
            className="flex items-center gap-2 rounded-lg border border-[#F7931E] bg-white px-4 py-2.5 text-sm font-semibold text-[#F7931E] hover:bg-orange-50"
          >
            <Icon name="file" className="h-4 w-4" /> Bulk upload CVs
          </button>
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-2 rounded-lg bg-[#F7931E] px-4 py-2.5 text-sm font-semibold text-white hover:brightness-95"
          >
            <Icon name="plus" className="h-4 w-4" /> Add candidate
          </button>
        </div>
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

      {bulk && (
        <BulkUpload
          specialisms={specialisms}
          defaultSpecialismId={current?.id ?? ""}
          onClose={(changed) => {
            setBulk(false);
            if (changed) load();
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
            disabled={busy || reading}
            className="rounded-lg bg-[#F7931E] px-4 py-2.5 text-sm font-semibold text-white hover:brightness-95 disabled:opacity-50"
          >
            {busy ? "Saving…" : "Save and open"}
          </button>
        </div>
      </div>
    </div>
  );
}

// =====================================================================
// Bulk upload: read lots of CVs at once, check them, then add them all
// =====================================================================

// How many CVs are read or saved at the same time
const BULK_AT_ONCE = 3;

type BulkStatus = "waiting" | "reading" | "ready" | "failed" | "saving" | "saved" | "save_failed";

type BulkRow = Omit<Form, "source" | "note"> & {
  key: string;
  file: File;
  status: BulkStatus;
  message: string;
  include: boolean;
  summary: string;
  dupe: string | null; // name of an existing candidate with the same phone or email
  batchDupe: boolean; // same phone or email as an earlier CV in this upload
};

type BulkPhase = "pick" | "reading" | "review" | "saving" | "done";

async function runPool<T>(items: T[], limit: number, fn: (item: T) => Promise<void>, stopped: () => boolean) {
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length && !stopped()) {
      const item = items[next++];
      await fn(item);
    }
  });
  await Promise.all(workers);
}

function contactKeys(r: { phone: string; email: string }) {
  const keys: string[] = [];
  const digits = r.phone.replace(/\D/g, "").slice(-9);
  if (digits.length === 9) keys.push(`p:${digits}`);
  if (r.email.trim()) keys.push(`e:${r.email.trim().toLowerCase()}`);
  return keys;
}

// Flags any CV in this upload with the same phone or email as one earlier in the list
function markBatchDupes(rows: BulkRow[]): BulkRow[] {
  const seen = new Set<string>();
  return rows.map((r) => {
    if (r.status !== "ready") return r;
    const keys = contactKeys(r);
    const isDupe = keys.some((k) => seen.has(k));
    keys.forEach((k) => seen.add(k));
    if (isDupe && !r.batchDupe) return { ...r, batchDupe: true, include: false };
    if (!isDupe && r.batchDupe) return { ...r, batchDupe: false };
    return r;
  });
}

function BulkUpload({
  specialisms,
  defaultSpecialismId,
  onClose,
}: {
  specialisms: Specialism[];
  defaultSpecialismId: string;
  onClose: (changed: boolean) => void;
}) {
  const [phase, setPhase] = useState<BulkPhase>("pick");
  const [files, setFiles] = useState<File[]>([]);
  const [rows, setRows] = useState<BulkRow[]>([]);
  const [source, setSource] = useState("");
  const [fallbackSpecialism, setFallbackSpecialism] = useState(defaultSpecialismId);
  const [whatsappAll, setWhatsappAll] = useState(true);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const stopRef = useRef(false);

  const busy = phase === "reading" || phase === "saving";
  const savedCount = rows.filter((r) => r.status === "saved").length;

  const update = (key: string, patch: Partial<BulkRow>) => setRows((list) => list.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  function addFiles(list: FileList | File[]) {
    const ok = Array.from(list).filter((f) => /\.(pdf|docx?)$/i.test(f.name));
    const skipped = Array.from(list).length - ok.length;
    setFiles((prev) => {
      const seen = new Set(prev.map((f) => `${f.name}-${f.size}`));
      return [...prev, ...ok.filter((f) => !seen.has(`${f.name}-${f.size}`))];
    });
    setError(skipped ? `${skipped} ${skipped === 1 ? "file was" : "files were"} skipped because only PDF and Word CVs can be read.` : null);
  }

  function close() {
    if (busy && !window.confirm("CVs are still being processed. Stop now? Anyone already added will stay in the CRM.")) return;
    if (phase === "review" && !window.confirm("Close without adding these candidates? You'd need to upload the CVs again.")) return;
    stopRef.current = true;
    onClose(savedCount > 0);
  }

  async function parseCv(file: File): Promise<Record<string, string>> {
    let lastError = "The CV couldn't be read.";
    for (let attempt = 0; attempt < 2; attempt++) {
      if (attempt) await new Promise((r) => setTimeout(r, 3000));
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
        if (res.ok) return (json.fields ?? {}) as Record<string, string>;
        lastError = json.error || lastError;
        // Only try again for busy or server errors
        if (res.status < 500 && res.status !== 429) break;
      } catch {
        lastError = "Lost connection while reading the CV.";
      }
    }
    throw new Error(lastError);
  }

  async function findDupe(phone: string, email: string) {
    const digits = phone.replace(/\D/g, "").slice(-9);
    const checks: string[] = [];
    if (digits.length === 9) checks.push(`phone.ilike.%${digits}%`);
    if (email.trim()) checks.push(`email.ilike.${email.trim()}`);
    if (!checks.length) return null;
    const { data } = await supabase.from("crm_candidates").select("id, first_name, last_name").or(checks.join(",")).limit(1);
    return data?.length ? candidateName(data[0]) : null;
  }

  async function readOne(row: BulkRow) {
    update(row.key, { status: "reading", message: "" });
    try {
      const got = await parseCv(row.file);
      const patch: Partial<BulkRow> = {};
      for (const k of TEXT_FIELDS) {
        const v = got[k];
        if (v) (patch as Record<string, unknown>)[k] = k === "postcode" ? String(v).toUpperCase() : String(v);
      }
      if (got.specialism) {
        const match = specialisms.find((s) => s.name.toLowerCase() === String(got.specialism).toLowerCase());
        if (match) patch.specialism_id = match.id;
      }
      if (got.job_type && ["perm", "temp", "either"].includes(got.job_type)) patch.job_type = got.job_type;
      if (got.summary) patch.summary = String(got.summary);

      const dupe = await findDupe(String(patch.phone ?? ""), String(patch.email ?? ""));
      update(row.key, {
        ...patch,
        status: "ready",
        dupe,
        include: !dupe,
        message: patch.first_name ? "" : "No name found, type it in",
      });
    } catch (e) {
      update(row.key, { status: "failed", include: false, message: (e as Error).message });
    }
  }

  async function startReading() {
    stopRef.current = false;
    const fresh: BulkRow[] = files.map((file, i) => ({
      key: `${i}-${file.name}-${file.size}`,
      file,
      status: "waiting",
      message: "",
      include: false,
      summary: "",
      dupe: null,
      batchDupe: false,
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
      specialism_id: fallbackSpecialism,
      whatsapp_consent: whatsappAll,
    }));
    setRows(fresh);
    setPhase("reading");
    await runPool(fresh, BULK_AT_ONCE, readOne, () => stopRef.current);
    setRows((list) => markBatchDupes(list));
    setPhase("review");
  }

  async function retryFailed() {
    const failed = rows.filter((r) => r.status === "failed");
    if (!failed.length) return;
    stopRef.current = false;
    setPhase("reading");
    await runPool(failed, BULK_AT_ONCE, readOne, () => stopRef.current);
    setRows((list) => markBatchDupes(list));
    setPhase("review");
  }

  async function saveOne(row: BulkRow, today: string) {
    if (!row.first_name.trim()) {
      update(row.key, { status: "save_failed", message: "Needs a first name" });
      return;
    }
    update(row.key, { status: "saving", message: "" });

    const { data, error: e } = await supabase
      .from("crm_candidates")
      .insert({
        first_name: row.first_name.trim(),
        last_name: row.last_name.trim() || null,
        phone: row.phone.trim() || null,
        email: row.email.trim() || null,
        location: row.location.trim() || null,
        postcode: row.postcode.trim().toUpperCase() || null,
        job_title: row.job_title.trim() || null,
        current_employer: row.current_employer.trim() || null,
        salary_expectation: row.salary_expectation.trim() || null,
        notice_period: row.notice_period.trim() || null,
        job_type: row.job_type,
        specialism_id: row.specialism_id || null,
        source: source.trim() || null,
        whatsapp_consent: row.whatsapp_consent,
      })
      .select("id")
      .single();
    if (e || !data) {
      update(row.key, { status: "save_failed", message: e?.message || "Couldn't save" });
      return;
    }

    const path = `${data.id}/${Date.now()}-${row.file.name.replace(/[^a-zA-Z0-9.]+/g, "-")}`;
    const up = await supabase.storage.from("crm-cvs").upload(path, row.file);
    if (!up.error) await supabase.from("crm_candidates").update({ cv_path: path, cv_filename: row.file.name }).eq("id", data.id);

    const notes: { candidate_id: string; kind: string; body: string }[] = [];
    if (row.summary.trim()) notes.push({ candidate_id: data.id, kind: "note", body: row.summary.trim() });
    notes.push({
      candidate_id: data.id,
      kind: "note",
      body: `Added by bulk CV upload on ${today}${source.trim() ? ` (source: ${source.trim()})` : ""}. ${
        row.whatsapp_consent ? "Marked as happy to hear about jobs on WhatsApp at upload." : "Not marked for WhatsApp messages."
      }`,
    });
    await supabase.from("crm_notes").insert(notes);

    update(row.key, { status: "saved", message: up.error ? "Added, but the CV file didn't upload" : "" });
  }

  async function saveAll() {
    const toSave = rows.filter((r) => r.include && (r.status === "ready" || r.status === "save_failed"));
    if (!toSave.length) return setError("Tick at least one candidate to add.");
    setError(null);
    stopRef.current = false;
    setPhase("saving");
    const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    await runPool(toSave, BULK_AT_ONCE, (r) => saveOne(r, today), () => stopRef.current);
    setPhase("done");
  }

  // ---- Counts for the review screen
  const readCount = rows.filter((r) => !["waiting", "reading"].includes(r.status)).length;
  const ready = rows.filter((r) => r.status === "ready" || r.status === "save_failed");
  const failedReads = rows.filter((r) => r.status === "failed").length;
  const dupeCount = rows.filter((r) => r.dupe || r.batchDupe).length;
  const toAdd = rows.filter((r) => r.include && (r.status === "ready" || r.status === "save_failed")).length;
  const saveFailed = rows.filter((r) => r.status === "save_failed").length;
  const editable = (r: BulkRow) => (phase === "review" || phase === "done") && (r.status === "ready" || r.status === "save_failed");
  const allIncluded = ready.length > 0 && ready.every((r) => r.include);
  const allWhatsapp = ready.length > 0 && ready.every((r) => r.whatsapp_consent);

  const cell = "w-full min-w-[7rem] rounded-md border border-slate-300 px-2 py-1 text-sm focus:border-[#F7931E] focus:outline-none focus:ring-2 focus:ring-[#F7931E]/30 disabled:bg-slate-50 disabled:text-slate-500";
  const input = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#F7931E] focus:outline-none focus:ring-2 focus:ring-[#F7931E]/30";

  function statusBadge(r: BulkRow) {
    const map: Record<BulkStatus, [string, string]> = {
      waiting: ["Waiting", "bg-slate-100 text-slate-600"],
      reading: ["Reading…", "bg-orange-100 text-orange-700"],
      ready: ["Ready", "bg-green-100 text-green-700"],
      failed: ["Couldn't read", "bg-red-100 text-red-700"],
      saving: ["Adding…", "bg-orange-100 text-orange-700"],
      saved: ["Added", "bg-green-600 text-white"],
      save_failed: ["Not added", "bg-red-100 text-red-700"],
    };
    const [label, colour] = map[r.status];
    return <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold ${colour}`}>{label}</span>;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Bulk upload CVs"
        className={`flex max-h-[94vh] w-full flex-col rounded-t-2xl bg-white sm:rounded-2xl ${phase === "pick" ? "sm:max-w-2xl" : "sm:max-w-7xl"}`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-[#1F3447]">Bulk upload CVs</h2>
            <p className="text-sm text-slate-500">
              {phase === "pick" && "Each CV is read the same way as a single upload and sorted into its specialism."}
              {phase === "reading" && `Reading ${readCount} of ${rows.length} CVs. Keep this window open.`}
              {phase === "review" && "Check the details, change anything that's wrong, then add them."}
              {phase === "saving" && `Adding candidates… ${savedCount} done. Keep this window open.`}
              {phase === "done" && `${savedCount} ${savedCount === 1 ? "candidate" : "candidates"} added.`}
            </p>
          </div>
          <button onClick={close} aria-label="Close" className="rounded-full p-1.5 hover:bg-slate-100">
            <Icon name="x" className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {/* Step 1: choose the CVs */}
          {phase === "pick" && (
            <div className="space-y-4">
              <label
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
                }}
                className={`flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed px-4 py-10 text-center transition ${
                  dragOver ? "border-[#F7931E] bg-orange-50" : "border-slate-300 hover:border-[#F7931E] hover:bg-orange-50/50"
                }`}
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#F7931E]/15 text-[#F7931E]">
                  <Icon name="file" className="h-6 w-6" />
                </span>
                <span className="text-sm font-semibold text-[#1F3447]">Drop all the CVs here, or click to choose them</span>
                <span className="text-xs text-slate-500">PDF or Word. Select as many as you like with Cmd+A in the file picker.</span>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.docx,.doc"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.length) addFiles(e.target.files);
                    e.target.value = "";
                  }}
                />
              </label>

              {files.length > 0 && (
                <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3 text-sm">
                  <span className="font-semibold text-[#1F3447]">
                    {files.length} {files.length === 1 ? "CV" : "CVs"} ready to read
                  </span>
                  <button onClick={() => setFiles([])} className="text-sm font-semibold text-slate-500 hover:text-slate-700">
                    Clear
                  </button>
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-semibold text-[#1F3447]">Where did they come from?</label>
                  <input className={input} placeholder="e.g. Indeed, Class 1 Driver advert" value={source} onChange={(e) => setSource(e.target.value)} />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-semibold text-[#1F3447]">If a CV doesn&apos;t clearly fit a specialism, put them in</label>
                  <select className={input} value={fallbackSpecialism} onChange={(e) => setFallbackSpecialism(e.target.value)}>
                    <option value="">Leave it for me to choose</option>
                    {specialisms.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.emoji} {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <label className="flex items-start gap-2 text-sm text-slate-700 sm:col-span-2">
                  <input type="checkbox" checked={whatsappAll} onChange={(e) => setWhatsappAll(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#F7931E]" />
                  <span>
                    They&apos;re happy to hear about jobs on WhatsApp
                    <span className="block text-xs text-slate-500">Applies to everyone in this upload. You can untick anyone on the next screen.</span>
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Progress bar while reading */}
          {phase === "reading" && (
            <div className="mb-5 h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full bg-[#F7931E] transition-all" style={{ width: `${rows.length ? (readCount / rows.length) * 100 : 0}%` }} />
            </div>
          )}

          {/* Summary on the review screen */}
          {(phase === "review" || phase === "done") && (
            <div className="mb-4 flex flex-wrap gap-2 text-sm">
              <span className="rounded-full bg-green-50 px-3 py-1 font-semibold text-green-700">{ready.length + savedCount} read</span>
              {dupeCount > 0 && <span className="rounded-full bg-amber-50 px-3 py-1 font-semibold text-amber-800">{dupeCount} possible duplicates, left unticked</span>}
              {failedReads > 0 && (
                <span className="flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 font-semibold text-red-700">
                  {failedReads} couldn&apos;t be read
                  {phase === "review" && (
                    <button onClick={retryFailed} className="underline hover:no-underline">
                      Try again
                    </button>
                  )}
                </span>
              )}
            </div>
          )}

          {/* The table of CVs */}
          {phase !== "pick" && (
            <div className="overflow-x-auto rounded-xl ring-1 ring-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="p-2">
                      <input
                        type="checkbox"
                        aria-label="Add all"
                        checked={allIncluded}
                        disabled={phase !== "review"}
                        onChange={(e) =>
                          setRows((list) => list.map((r) => (r.status === "ready" || r.status === "save_failed" ? { ...r, include: e.target.checked } : r)))
                        }
                        className="h-4 w-4 accent-[#F7931E]"
                      />
                    </th>
                    <th className="p-2">First name</th>
                    <th className="p-2">Last name</th>
                    <th className="p-2">Mobile</th>
                    <th className="p-2">Job title</th>
                    <th className="p-2">Town</th>
                    <th className="p-2">Specialism</th>
                    <th className="p-2">Perm or temp</th>
                    <th className="p-2">
                      <label className="flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          aria-label="WhatsApp for everyone"
                          checked={allWhatsapp}
                          disabled={phase !== "review"}
                          onChange={(e) =>
                            setRows((list) =>
                              list.map((r) => (r.status === "ready" || r.status === "save_failed" ? { ...r, whatsapp_consent: e.target.checked } : r)),
                            )
                          }
                          className="h-4 w-4 accent-[#F7931E]"
                        />
                        WhatsApp
                      </label>
                    </th>
                    <th className="p-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((r) => {
                    const can = editable(r) && phase === "review";
                    const set = (k: keyof BulkRow) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
                      update(r.key, { [k]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value } as unknown as Partial<BulkRow>);
                    const flagged = r.dupe || r.batchDupe;
                    return (
                      <tr key={r.key} className={`align-top ${r.status === "saved" ? "bg-green-50/50" : flagged ? "bg-amber-50/50" : ""}`}>
                        <td className="p-2">
                          <input type="checkbox" aria-label="Add this candidate" checked={r.include} disabled={!can} onChange={set("include")} className="mt-1.5 h-4 w-4 accent-[#F7931E]" />
                        </td>
                        {r.status === "waiting" || r.status === "reading" || r.status === "failed" ? (
                          <td colSpan={7} className="p-2 pt-2.5 text-slate-500">
                            <span className="font-semibold text-slate-700">{r.file.name}</span>
                            {r.message && <span className="block text-xs text-red-700">{r.message}. Add this one with &ldquo;Add candidate&rdquo; instead.</span>}
                          </td>
                        ) : (
                          <>
                            <td className="p-2">
                              <input className={`${cell} ${!r.first_name.trim() ? "border-red-400" : ""}`} value={r.first_name} disabled={!can} onChange={set("first_name")} />
                              <span className="mt-1 block max-w-[12rem] truncate text-[11px] text-slate-400" title={r.file.name}>
                                {r.file.name}
                              </span>
                            </td>
                            <td className="p-2">
                              <input className={cell} value={r.last_name} disabled={!can} onChange={set("last_name")} />
                            </td>
                            <td className="p-2">
                              <input className={cell} value={r.phone} disabled={!can} onChange={set("phone")} inputMode="tel" />
                            </td>
                            <td className="p-2">
                              <input className={cell} value={r.job_title} disabled={!can} onChange={set("job_title")} />
                            </td>
                            <td className="p-2">
                              <input className={cell} value={r.location} disabled={!can} onChange={set("location")} />
                            </td>
                            <td className="p-2">
                              <select className={`${cell} ${!r.specialism_id ? "border-amber-400 bg-amber-50" : ""}`} value={r.specialism_id} disabled={!can} onChange={set("specialism_id")}>
                                <option value="">Choose…</option>
                                {specialisms.map((s) => (
                                  <option key={s.id} value={s.id}>
                                    {s.emoji} {s.name}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="p-2">
                              <select className={cell} value={r.job_type} disabled={!can} onChange={set("job_type")}>
                                {JOB_TYPES.map(([v, label]) => (
                                  <option key={v} value={v}>
                                    {label}
                                  </option>
                                ))}
                              </select>
                            </td>
                          </>
                        )}
                        <td className="p-2">
                          <input
                            type="checkbox"
                            aria-label="Happy to hear about jobs on WhatsApp"
                            checked={r.whatsapp_consent}
                            disabled={!can}
                            onChange={set("whatsapp_consent")}
                            className="mt-1.5 h-4 w-4 accent-[#F7931E]"
                          />
                        </td>
                        <td className="p-2">
                          {statusBadge(r)}
                          {r.dupe && <span className="mt-1 block text-xs text-amber-800">Already in the CRM as {r.dupe}</span>}
                          {r.batchDupe && <span className="mt-1 block text-xs text-amber-800">Same contact details as another CV in this upload</span>}
                          {r.message && r.status !== "failed" && <span className="mt-1 block text-xs text-slate-500">{r.message}</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        </div>

        {/* Footer buttons */}
        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 px-6 py-4">
          {phase === "pick" && (
            <>
              <button onClick={close} className="rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">
                Cancel
              </button>
              <button
                onClick={startReading}
                disabled={!files.length}
                className="rounded-lg bg-[#F7931E] px-4 py-2.5 text-sm font-semibold text-white hover:brightness-95 disabled:opacity-50"
              >
                Read {files.length || ""} {files.length === 1 ? "CV" : "CVs"}
              </button>
            </>
          )}
          {busy && (
            <span className="flex items-center gap-2 text-sm text-slate-500">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#F7931E]/30 border-t-[#F7931E]" />
              Working…
            </span>
          )}
          {phase === "review" && (
            <>
              <button onClick={close} className="rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">
                Cancel
              </button>
              <button
                onClick={saveAll}
                disabled={!toAdd}
                className="rounded-lg bg-[#F7931E] px-4 py-2.5 text-sm font-semibold text-white hover:brightness-95 disabled:opacity-50"
              >
                Add {toAdd} {toAdd === 1 ? "candidate" : "candidates"}
              </button>
            </>
          )}
          {phase === "done" && (
            <>
              {saveFailed > 0 && (
                <button
                  onClick={() => setPhase("review")}
                  className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-[#1F3447] hover:bg-slate-50"
                >
                  Fix the {saveFailed} not added
                </button>
              )}
              <button onClick={() => onClose(savedCount > 0)} className="rounded-lg bg-[#F7931E] px-4 py-2.5 text-sm font-semibold text-white hover:brightness-95">
                Done
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}