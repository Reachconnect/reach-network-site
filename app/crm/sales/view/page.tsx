"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import TermsCard from "../../TermsCard";
import CompanyJobs from "../CompanyJobs";
import { COMPANY_STAGES, Icon, NOTE_KINDS, timeAgo, ukDate, ukDateTime, waLink, type Company, type CompanyStageKey, type Contact, type Specialism } from "../../crm";

type Note = { id: string; kind: string; body: string; created_at: string };
type Rem = { id: string; title: string; due_at: string; done: boolean };

export default function CompanyViewPage() {
  return (
    <Suspense fallback={<p className="p-8 text-slate-500">Loading…</p>}>
      <CompanyView />
    </Suspense>
  );
}

function CompanyView() {
  const params = useSearchParams();
  const router = useRouter();
  const id = params.get("id") || "";

  const [c, setC] = useState<Company | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [specialisms, setSpecialisms] = useState<Specialism[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [reminders, setReminders] = useState<Rem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Partial<Company>>({});
  const [noteKind, setNoteKind] = useState("call");
  const [noteBody, setNoteBody] = useState("");
  const [remTitle, setRemTitle] = useState("");
  const [remDue, setRemDue] = useState("");
  const [newContact, setNewContact] = useState({ name: "", job_title: "", phone: "", email: "" });
  const [addingContact, setAddingContact] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    const [co, ct, sp, n, r] = await Promise.all([
      supabase.from("crm_companies").select("*").eq("id", id).maybeSingle(),
      supabase.from("crm_contacts").select("*").eq("company_id", id).order("is_primary", { ascending: false }).order("created_at"),
      supabase.from("crm_specialisms").select("*").order("sort_order").order("name"),
      supabase.from("crm_notes").select("id, kind, body, created_at").eq("company_id", id).order("created_at", { ascending: false }),
      supabase.from("crm_reminders").select("id, title, due_at, done").eq("company_id", id).order("done").order("due_at"),
    ]);
    if (!co.data) {
      setError("This company couldn't be found. It may have been deleted.");
      return;
    }
    setC(co.data as Company);
    setContacts((ct.data ?? []) as Contact[]);
    setSpecialisms((sp.data ?? []) as Specialism[]);
    setNotes((n.data ?? []) as Note[]);
    setReminders((r.data ?? []) as Rem[]);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function update(patch: Partial<Company>) {
    if (!c) return;
    setC({ ...c, ...patch });
    const { error: e } = await supabase.from("crm_companies").update(patch).eq("id", c.id);
    if (e) setError(`That didn't save: ${e.message}`);
    load();
  }

  async function changeStage(to: CompanyStageKey) {
    if (!c || c.stage === to) return;
    const patch: Partial<Company> = { stage: to };
    if (to === "lost") {
      const reason = window.prompt(`Why was ${c.name} lost? (optional)`, c.lost_reason || "");
      if (reason === null) return;
      patch.lost_reason = reason.trim() || null;
    }
    if (to === "client" && !c.reachconnect_client_id && !window.confirm(`Move ${c.name} to Client? This also adds them to ReachConnect.`)) return;
    await update(patch);
  }

  async function saveDetails() {
    const clean: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(draft)) clean[k] = typeof v === "string" ? v.trim() || null : v;
    if (clean.name === null) return setError("The company name can't be empty.");
    await update(clean as Partial<Company>);
    setEditing(false);
    setDraft({});
  }

  async function addNote() {
    if (!noteBody.trim() || !c) return;
    const { error: e } = await supabase.from("crm_notes").insert({ company_id: c.id, kind: noteKind, body: noteBody.trim() });
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
    const { error: e } = await supabase.from("crm_reminders").insert({ company_id: c.id, title: remTitle.trim(), due_at: new Date(remDue).toISOString() });
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

  async function addContact() {
    if (!c || !newContact.name.trim()) return setError("Add the contact's name.");
    const { error: e } = await supabase.from("crm_contacts").insert({
      company_id: c.id,
      name: newContact.name.trim(),
      job_title: newContact.job_title.trim() || null,
      phone: newContact.phone.trim() || null,
      email: newContact.email.trim() || null,
      is_primary: contacts.length === 0,
    });
    if (e) return setError(e.message);
    setNewContact({ name: "", job_title: "", phone: "", email: "" });
    setAddingContact(false);
    setError(null);
    load();
  }

  async function makePrimary(contactId: string) {
    if (!c) return;
    await supabase.from("crm_contacts").update({ is_primary: false }).eq("company_id", c.id);
    await supabase.from("crm_contacts").update({ is_primary: true }).eq("id", contactId);
    load();
  }

  async function removeContact(ct: Contact) {
    if (!window.confirm(`Remove ${ct.name}?`)) return;
    await supabase.from("crm_contacts").delete().eq("id", ct.id);
    load();
  }

  async function deleteCompany() {
    if (!c || !window.confirm(`Delete ${c.name}? Their contacts, notes, jobs and reminders will be deleted too. If they're in ReachConnect, they stay there.`)) return;
    const { error: e } = await supabase.from("crm_companies").delete().eq("id", c.id);
    if (e) return setError(e.message);
    router.push("/crm/sales");
  }

  if (error && !c) return <p className="p-8 text-red-700">{error}</p>;
  if (!c) return <p className="p-8 text-slate-500">Loading…</p>;

  const input = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#F7931E] focus:outline-none focus:ring-2 focus:ring-[#F7931E]/30";
  const field = (k: keyof Company) => (draft[k] as string | undefined) ?? ((c[k] as string | null) ?? "");
  const setField = (k: keyof Company) => (e: React.ChangeEvent<HTMLInputElement>) => setDraft((d) => ({ ...d, [k]: e.target.value }));
  const website = c.website ? (c.website.startsWith("http") ? c.website : `https://${c.website}`) : null;

  const DETAILS: [keyof Company, string][] = [
    ["name", "Company name"],
    ["website", "Website"],
    ["phone", "Main phone"],
    ["email", "General email"],
    ["address", "Address"],
    ["postcode", "Postcode"],
    ["estimated_value", "Estimated value"],
    ["source", "Source"],
  ];

  return (
    <div className="mx-auto max-w-6xl p-5 lg:p-8">
      <Link href={c.stage === "client" ? "/crm/clients" : "/crm/sales"} className="text-sm font-medium text-slate-500 hover:text-[#1F3447]">
        ‹ {c.stage === "client" ? "Clients and terms" : "Sales pipeline"}
      </Link>

      <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold text-[#1F3447]">
            <Icon name="building" className="h-7 w-7 text-slate-400" />
            {c.name}
          </h1>
          <p className="mt-1 text-slate-500">{[c.address, c.postcode].filter(Boolean).join(", ") || "No address yet"}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {website && (
            <a href={website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-[#1F3447] hover:bg-slate-50">
              <Icon name="globe" className="h-4 w-4" /> Website
            </a>
          )}
          {c.phone && (
            <a href={`tel:${c.phone}`} className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-[#1F3447] hover:bg-slate-50">
              <Icon name="phone" className="h-4 w-4" /> Call
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
      <div className="mt-5 flex flex-wrap items-center gap-1.5 rounded-2xl bg-white p-3 shadow-sm">
        {COMPANY_STAGES.map((s) => {
          const on = c.stage === s.key;
          return (
            <button
              key={s.key}
              onClick={() => changeStage(s.key)}
              className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${on ? "text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
              style={on ? { backgroundColor: s.colour } : undefined}
            >
              {s.label}
            </button>
          );
        })}
        {c.stage === "client" &&
          (c.reachconnect_client_id ? (
            <span className="ml-auto rounded-full bg-green-50 px-3 py-1.5 text-sm font-semibold text-green-700">In ReachConnect ✓</span>
          ) : (
            <span className="ml-auto rounded-full bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-700">Not in ReachConnect yet: add them there by hand</span>
          ))}
      </div>
      {c.stage === "lost" && c.lost_reason && <p className="mt-2 text-sm text-slate-500">Lost because: {c.lost_reason}</p>}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          {/* Contacts */}
          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#1F3447]">Contacts</h2>
              <button onClick={() => setAddingContact((a) => !a)} className="text-sm font-semibold text-[#F7931E] hover:underline">
                {addingContact ? "Cancel" : "Add contact"}
              </button>
            </div>

            {addingContact && (
              <div className="mt-3 grid gap-2 rounded-xl bg-slate-50 p-3 sm:grid-cols-2">
                <input className={input} placeholder="Name" value={newContact.name} onChange={(e) => setNewContact({ ...newContact, name: e.target.value })} />
                <input className={input} placeholder="Job title" value={newContact.job_title} onChange={(e) => setNewContact({ ...newContact, job_title: e.target.value })} />
                <input className={input} placeholder="Phone" value={newContact.phone} onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })} />
                <input className={input} placeholder="Email" value={newContact.email} onChange={(e) => setNewContact({ ...newContact, email: e.target.value })} />
                <button onClick={addContact} className="rounded-lg bg-[#F7931E] px-4 py-2 text-sm font-semibold text-white sm:col-span-2">
                  Save contact
                </button>
              </div>
            )}

            {contacts.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">No contacts yet.</p>
            ) : (
              <ul className="mt-3 divide-y divide-slate-100">
                {contacts.map((ct) => {
                  const wa = waLink(ct.phone);
                  return (
                    <li key={ct.id} className="flex flex-wrap items-center gap-3 py-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1F3447] text-xs font-bold text-white">
                        {ct.name
                          .split(" ")
                          .map((p) => p[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-[#1F3447]">
                          {ct.name}
                          {ct.is_primary && <span className="ml-2 rounded bg-orange-50 px-1.5 py-0.5 text-[11px] font-bold text-[#F7931E]">Main contact</span>}
                        </p>
                        <p className="truncate text-xs text-slate-500">{[ct.job_title, ct.phone, ct.email].filter(Boolean).join(", ")}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {ct.phone && (
                          <a href={`tel:${ct.phone}`} title="Call" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-[#1F3447]">
                            <Icon name="phone" className="h-4 w-4" />
                          </a>
                        )}
                        {wa && (
                          <a href={wa} target="_blank" rel="noopener noreferrer" title="WhatsApp" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-[#1F3447]">
                            <Icon name="send" className="h-4 w-4" />
                          </a>
                        )}
                        {ct.email && (
                          <a href={`mailto:${ct.email}`} title="Email" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-[#1F3447]">
                            <Icon name="mail" className="h-4 w-4" />
                          </a>
                        )}
                        {!ct.is_primary && (
                          <button onClick={() => makePrimary(ct.id)} title="Make main contact" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-[#F7931E]">
                            <Icon name="star" className="h-4 w-4" />
                          </button>
                        )}
                        <button onClick={() => removeContact(ct)} title="Remove" className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600">
                          <Icon name="trash" className="h-4 w-4" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* Jobs */}
          <CompanyJobs companyId={c.id} />

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
                placeholder={noteKind === "call" ? "What was said on the call?" : noteKind === "meeting" ? "How did the meeting go?" : "Add a note"}
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
        </div>

        <div className="space-y-6">
          <TermsCard companyId={c.id} companyName={c.name} />

          {/* Reminders */}
          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-lg font-bold text-[#1F3447]">
              <Icon name="bell" className="h-5 w-5" /> Reminders
            </h2>
            <div className="mt-3 space-y-2">
              <input value={remTitle} onChange={(e) => setRemTitle(e.target.value)} placeholder={`Follow up with ${c.name}`} className={input} />
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
                    className="rounded-lg px-2 py-1 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button onClick={saveDetails} className="rounded-lg bg-[#F7931E] px-3 py-1 text-sm font-semibold text-white">
                    Save
                  </button>
                </div>
              ) : (
                <button onClick={() => setEditing(true)} className="text-sm font-semibold text-[#F7931E] hover:underline">
                  Edit
                </button>
              )}
            </div>
            <div className="mt-3 space-y-3">
              {DETAILS.map(([k, label]) => (
                <label key={k} className="block">
                  <span className="text-xs font-semibold text-slate-500">{label}</span>
                  {editing ? (
                    <input className={`mt-1 ${input}`} value={field(k)} onChange={setField(k)} />
                  ) : (
                    <p className="mt-0.5 break-words text-sm text-slate-800">{(c[k] as string | null) || "—"}</p>
                  )}
                </label>
              ))}
              <label className="block">
                <span className="text-xs font-semibold text-slate-500">Sector</span>
                <select value={c.specialism_id ?? ""} onChange={(e) => update({ specialism_id: e.target.value || null })} className={`mt-1 ${input}`}>
                  <option value="">None</option>
                  {specialisms.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.emoji} {s.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <p className="mt-4 text-xs text-slate-400">
              Added {ukDate(c.created_at)}, last contacted {timeAgo(c.last_contacted_at)}
              {c.won_at ? `, became a client ${ukDate(c.won_at)}` : ""}
            </p>
          </section>

          <button onClick={deleteCompany} className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50">
            <Icon name="trash" className="h-4 w-4" /> Delete company
          </button>
        </div>
      </div>
    </div>
  );
}