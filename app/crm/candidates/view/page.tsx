"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import BrandedCv from "../BrandedCv";
import { Icon, JOB_TYPES, NOTE_KINDS, STAGES, candidateName, timeAgo, ukDate, ukDateTime, waLink, type Candidate, type Specialism, type StageKey } from "../../crm";

type Note = { id: string; kind: string; body: string; created_at: string };
type Rem = { id: string; title: string; due_at: string; done: boolean };

export default function CandidateViewPage() {
  return (
    <Suspense fallback={<p className="p-8 text-slate-500">Loading…</p>}>
      <CandidateView />
    </Suspense>
  );
}

function CandidateView() {
  const params = useSearchParams();
  const router = useRouter();
  const id = params.get("id") || "";

  const [c, setC] = useState<Candidate | null>(null);
  const [specialisms, setSpecialisms] = useState<Specialism[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [reminders, setReminders] = useState<Rem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Partial<Candidate>>({});

  const [noteKind, setNoteKind] = useState("note");
  const [noteBody, setNoteBody] = useState("");
  const [remTitle, setRemTitle] = useState("");
  const [remDue, setRemDue] = useState("");
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    const [cand, specs, n, r] = await Promise.all([
      supabase.from("crm_candidates").select("*").eq("id", id).maybeSingle(),
      supabase.from("crm_specialisms").select("*").order("sort_order").order("name"),
      supabase.from("crm_notes").select("id, kind, body, created_at").eq("candidate_id", id).order("created_at", { ascending: false }),
      supabase.from("crm_reminders").select("id, title, due_at, done").eq("candidate_id", id).order("done").order("due_at"),
    ]);
    if (!cand.data) {
      setError("This candidate couldn't be found. They may have been deleted.");
      return;
    }
    setC(cand.data as Candidate);
    setSpecialisms((specs.data ?? []) as Specialism[]);
    setNotes((n.data ?? []) as Note[]);
    setReminders((r.data ?? []) as Rem[]);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function update(patch: Partial<Candidate> & Record<string, unknown>) {
    if (!c) return;
    setC({ ...c, ...patch });
    const { error: e } = await supabase.from("crm_candidates").update(patch).eq("id", c.id);
    if (e) {
      setError(`That didn't save: ${e.message}`);
      load();
    }
  }

  async function saveDetails() {
    const clean: Partial<Candidate> = {};
    for (const [k, v] of Object.entries(draft)) {
      (clean as Record<string, unknown>)[k] = typeof v === "string" ? v.trim() || null : v;
    }
    if (clean.first_name === null) return setError("First name can't be empty.");
    await update(clean);
    setEditing(false);
    setDraft({});
  }

  async function addNote() {
    if (!noteBody.trim() || !c) return;
    const { error: e } = await supabase.from("crm_notes").insert({ candidate_id: c.id, kind: noteKind, body: noteBody.trim() });
    if (e) return setError(e.message);
    if (noteKind !== "note") await update({ last_contacted_at: new Date().toISOString() });
    setNoteBody("");
    load();
  }

  async function deleteNote(noteId: string) {
    if (!window.confirm("Delete this note?")) return;
    await supabase.from("crm_notes").delete().eq("id", noteId);
    setNotes((list) => list.filter((n) => n.id !== noteId));
  }

  async function addReminder() {
    if (!remTitle.trim() || !remDue || !c) return setError("Add what the reminder is for and when.");
    const { error: e } = await supabase.from("crm_reminders").insert({ candidate_id: c.id, title: remTitle.trim(), due_at: new Date(remDue).toISOString() });
    if (e) return setError(e.message);
    setRemTitle("");
    setRemDue("");
    setError(null);
    load();
  }

  async function toggleReminder(r: Rem) {
    await supabase.from("crm_reminders").update({ done: !r.done, done_at: r.done ? null : new Date().toISOString() }).eq("id", r.id);
    load();
  }

  async function uploadCv(file: File) {
    if (!c) return;
    setUploading(true);
    const path = `${c.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]+/g, "-")}`;
    const { error: e } = await supabase.storage.from("crm-cvs").upload(path, file);
    if (e) {
      setUploading(false);
      return setError(`CV didn't upload: ${e.message}`);
    }
    if (c.cv_path) await supabase.storage.from("crm-cvs").remove([c.cv_path]);
    // A new CV means the branded version needs reading again
    await update({ cv_path: path, cv_filename: file.name, cv_data: null });
    setUploading(false);
  }

  async function openCv() {
    if (!c?.cv_path) return;
    const { data, error: e } = await supabase.storage.from("crm-cvs").createSignedUrl(c.cv_path, 600);
    if (e || !data) return setError("Couldn't open the CV.");
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  async function deleteCandidate() {
    if (!c || !window.confirm(`Delete ${candidateName(c)}? Their notes, reminders and CV will be deleted too.`)) return;
    if (c.cv_path) await supabase.storage.from("crm-cvs").remove([c.cv_path]);
    const { error: e } = await supabase.from("crm_candidates").delete().eq("id", c.id);
    if (e) return setError(e.message);
    const sp = specialisms.find((s) => s.id === c.specialism_id);
    router.push(sp ? `/crm/candidates?s=${sp.slug}` : "/crm/candidates");
  }

  if (error && !c) return <p className="p-8 text-red-700">{error}</p>;
  if (!c) return <p className="p-8 text-slate-500">Loading…</p>;

  const sp = specialisms.find((s) => s.id === c.specialism_id);
  const wa = waLink(c.phone);
  const field = (k: keyof Candidate) => (draft[k] as string | undefined) ?? ((c[k] as string | null) ?? "");
  const setField = (k: keyof Candidate) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setDraft((d) => ({ ...d, [k]: e.target.value }));
  const input = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#F7931E] focus:outline-none focus:ring-2 focus:ring-[#F7931E]/30";

  const DETAILS: [keyof Candidate, string, string][] = [
    ["first_name", "First name", ""],
    ["last_name", "Last name", ""],
    ["phone", "Mobile", ""],
    ["email", "Email", ""],
    ["location", "Town or city", ""],
    ["postcode", "Postcode", ""],
    ["job_title", "Job title", ""],
    ["current_employer", "Current employer", ""],
    ["salary_expectation", "Salary expectation", "£38k"],
    ["notice_period", "Notice period", "1 month"],
    ["source", "Source", "LinkedIn"],
  ];

  return (
    <div className="mx-auto max-w-6xl p-5 lg:p-8">
      <Link href={sp ? `/crm/candidates?s=${sp.slug}` : "/crm/candidates"} className="text-sm font-medium text-slate-500 hover:text-[#1F3447]">
        ‹ {sp ? sp.name : "All candidates"}
      </Link>

      {/* Header */}
      <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#1F3447]">{candidateName(c)}</h1>
          <p className="mt-1 text-slate-500">
            {[c.job_title, c.current_employer && `at ${c.current_employer}`, c.location].filter(Boolean).join(" ") || "No details yet"}
          </p>
          <div className="mt-2 flex items-center gap-1" aria-label="Rating">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => update({ rating: c.rating === n ? null : n })}
                className={`text-xl leading-none ${c.rating && n <= c.rating ? "text-amber-500" : "text-slate-300 hover:text-amber-300"}`}
                aria-label={`${n} star${n > 1 ? "s" : ""}`}
              >
                ★
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {c.phone && (
            <a href={`tel:${c.phone}`} className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-[#1F3447] hover:bg-slate-50">
              <Icon name="phone" className="h-4 w-4" /> Call
            </a>
          )}
          {wa && (
            <a href={wa} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-[#1F3447] hover:bg-slate-50">
              <Icon name="send" className="h-4 w-4" /> WhatsApp
            </a>
          )}
          {c.email && (
            <a href={`mailto:${c.email}`} className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-[#1F3447] hover:bg-slate-50">
              <Icon name="mail" className="h-4 w-4" /> Email
            </a>
          )}
        </div>
      </div>

      {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {/* Stage */}
      <div className="mt-5 flex flex-wrap gap-1.5 rounded-2xl bg-white p-3 shadow-sm">
        {STAGES.map((s) => {
          const on = c.stage === s.key;
          return (
            <button
              key={s.key}
              onClick={() => update({ stage: s.key as StageKey })}
              className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${on ? "text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
              style={on ? { backgroundColor: s.colour } : undefined}
            >
              {s.label}
            </button>
          );
        })}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          {/* Notes and activity */}
          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-[#1F3447]">Notes and activity</h2>
            <div className="mt-3 rounded-xl bg-slate-50 p-3">
              <div className="mb-2 flex flex-wrap gap-1">
                {NOTE_KINDS.map(([k, label]) => (
                  <button
                    key={k}
                    onClick={() => setNoteKind(k)}
                    className={`rounded-md px-2.5 py-1 text-xs font-semibold ${noteKind === k ? "bg-[#1F3447] text-white" : "text-slate-600 hover:bg-slate-200"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <textarea
                value={noteBody}
                onChange={(e) => setNoteBody(e.target.value)}
                rows={3}
                placeholder={noteKind === "call" ? "What was said on the call?" : "Add a note"}
                className={input}
              />
              <div className="mt-2 flex justify-end">
                <button onClick={addNote} disabled={!noteBody.trim()} className="rounded-lg bg-[#F7931E] px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">
                  Save
                </button>
              </div>
            </div>
            {notes.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">No notes yet.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {notes.map((n) => (
                  <li key={n.id} className="group rounded-xl border border-slate-200 p-3">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 font-semibold capitalize text-slate-700">{n.kind}</span>
                      <span>{ukDateTime(n.created_at)}</span>
                      <button onClick={() => deleteNote(n.id)} className="ml-auto opacity-0 transition hover:text-red-600 group-hover:opacity-100" aria-label="Delete note">
                        <Icon name="trash" className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="mt-1.5 whitespace-pre-wrap text-sm text-slate-800">{n.body}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Details */}
          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#1F3447]">Details</h2>
              {editing ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditing(false);
                      setDraft({});
                    }}
                    className="rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button onClick={saveDetails} className="rounded-lg bg-[#F7931E] px-3 py-1.5 text-sm font-semibold text-white">
                    Save
                  </button>
                </div>
              ) : (
                <button onClick={() => setEditing(true)} className="text-sm font-semibold text-[#F7931E] hover:underline">
                  Edit
                </button>
              )}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {DETAILS.map(([k, label, ph]) => (
                <label key={k} className="block">
                  <span className="text-xs font-semibold text-slate-500">{label}</span>
                  {editing ? (
                    <input className={`mt-1 ${input}`} value={field(k)} onChange={setField(k)} placeholder={ph} />
                  ) : (
                    <p className="mt-0.5 text-sm text-slate-800">{(c[k] as string | null) || "—"}</p>
                  )}
                </label>
              ))}
              <label className="block">
                <span className="text-xs font-semibold text-slate-500">Specialism</span>
                <select value={c.specialism_id ?? ""} onChange={(e) => update({ specialism_id: e.target.value || null })} className={`mt-1 ${input}`}>
                  <option value="">None</option>
                  {specialisms.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.emoji} {s.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-slate-500">Looking for</span>
                <select value={c.job_type} onChange={(e) => update({ job_type: e.target.value as Candidate["job_type"] })} className={`mt-1 ${input}`}>
                  {JOB_TYPES.map(([v, label]) => (
                    <option key={v} value={v}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700 sm:col-span-2">
                <input type="checkbox" checked={c.whatsapp_consent} onChange={(e) => update({ whatsapp_consent: e.target.checked })} className="h-4 w-4 accent-[#F7931E]" />
                Happy to hear about jobs on WhatsApp
              </label>
            </div>
            <p className="mt-4 text-xs text-slate-400">
              Added {ukDate(c.created_at)}, last contacted {timeAgo(c.last_contacted_at)}
            </p>
          </section>
        </div>

        <div className="space-y-6">
          {/* Reminders */}
          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-lg font-bold text-[#1F3447]">
              <Icon name="bell" className="h-5 w-5" /> Reminders
            </h2>
            <div className="mt-3 space-y-2">
              <input value={remTitle} onChange={(e) => setRemTitle(e.target.value)} placeholder={`Call ${c.first_name} back`} className={input} />
              <div className="flex gap-2">
                <input type="datetime-local" value={remDue} onChange={(e) => setRemDue(e.target.value)} className={`min-w-0 flex-1 ${input}`} aria-label="When" />
                <button onClick={addReminder} className="rounded-lg bg-[#F7931E] px-3 py-2 text-sm font-semibold text-white">
                  Add
                </button>
              </div>
            </div>
            <ul className="mt-3 space-y-1.5">
              {reminders.length === 0 && <li className="text-sm text-slate-500">No reminders.</li>}
              {reminders.map((r) => {
                const overdue = !r.done && new Date(r.due_at).getTime() < Date.now();
                return (
                  <li key={r.id} className="flex items-start gap-2.5 rounded-lg border border-slate-200 p-2.5">
                    <button
                      onClick={() => toggleReminder(r)}
                      aria-label={r.done ? "Mark as not done" : "Mark as done"}
                      className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 ${
                        r.done ? "border-green-500 bg-green-500 text-white" : "border-slate-300 text-transparent hover:border-green-500 hover:text-green-500"
                      }`}
                    >
                      <Icon name="check" className="h-3 w-3" />
                    </button>
                    <div className="min-w-0">
                      <p className={`text-sm ${r.done ? "text-slate-400 line-through" : "text-slate-800"}`}>{r.title}</p>
                      <p className={`text-xs ${overdue ? "font-semibold text-red-600" : "text-slate-500"}`}>
                        {overdue ? "Overdue: " : ""}
                        {ukDateTime(r.due_at)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* CV */}
          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-lg font-bold text-[#1F3447]">
              <Icon name="file" className="h-5 w-5" /> CV
            </h2>
            {c.cv_path ? (
              <button onClick={openCv} className="mt-3 flex w-full items-center gap-2 rounded-lg border border-slate-200 p-3 text-left text-sm hover:bg-slate-50">
                <Icon name="file" className="h-5 w-5 text-[#F7931E]" />
                <span className="min-w-0 flex-1 truncate font-semibold text-[#1F3447]">{c.cv_filename || "CV"}</span>
                <span className="text-xs text-slate-500">Open</span>
              </button>
            ) : (
              <p className="mt-2 text-sm text-slate-500">No CV yet.</p>
            )}
            <label className="mt-3 inline-block cursor-pointer text-sm font-semibold text-[#F7931E] hover:underline">
              {uploading ? "Uploading…" : c.cv_path ? "Replace CV" : "Upload CV"}
              <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => e.target.files?.[0] && uploadCv(e.target.files[0])} />
            </label>

            <BrandedCv key={c.cv_path ?? "none"} candidateId={c.id} hasCv={!!c.cv_path} />
          </section>

          <button onClick={deleteCandidate} className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50">
            <Icon name="trash" className="h-4 w-4" /> Delete candidate
          </button>
        </div>
      </div>
    </div>
  );
}