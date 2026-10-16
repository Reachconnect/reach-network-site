"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Icon, candidateName, slugify, stageOf, timeAgo, ukDateTime, type Candidate, type Reminder, type Specialism } from "./crm";

export default function CrmHome() {
  const [specialisms, setSpecialisms] = useState<Specialism[]>([]);
  const [stats, setStats] = useState<Record<string, { total: number; active: number; placed: number }>>({});
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [recent, setRecent] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [managing, setManaging] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState("💼");

  const load = useCallback(async () => {
    const weekAhead = new Date();
    weekAhead.setDate(weekAhead.getDate() + 7);
    const [s, c, r, rec] = await Promise.all([
      supabase.from("crm_specialisms").select("*").order("sort_order").order("name"),
      supabase.from("crm_candidates").select("specialism_id, stage").limit(20000),
      supabase
        .from("crm_reminders")
        .select("id, title, due_at, done, candidate_id, company_id, crm_candidates(first_name, last_name)")
        .eq("done", false)
        .lte("due_at", weekAhead.toISOString())
        .order("due_at"),
      supabase.from("crm_candidates").select("*").order("created_at", { ascending: false }).limit(6),
    ]);
    if (s.error) setError(s.error.message);
    setSpecialisms((s.data ?? []) as Specialism[]);
    const next: Record<string, { total: number; active: number; placed: number }> = {};
    for (const row of (c.data ?? []) as { specialism_id: string | null; stage: string }[]) {
      const key = row.specialism_id || "none";
      const v = (next[key] ||= { total: 0, active: 0, placed: 0 });
      v.total++;
      if (["screened", "sent", "interview", "offer"].includes(row.stage)) v.active++;
      if (row.stage === "placed") v.placed++;
    }
    setStats(next);
    setReminders((r.data ?? []) as unknown as Reminder[]);
    setRecent((rec.data ?? []) as Candidate[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function addReminder(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !dueAt) return setError("Add what the reminder is for and when.");
    const { error: err } = await supabase.from("crm_reminders").insert({ title: title.trim(), due_at: new Date(dueAt).toISOString() });
    if (err) return setError(err.message);
    setTitle("");
    setDueAt("");
    setError(null);
    load();
  }

  async function complete(id: string) {
    setReminders((list) => list.filter((r) => r.id !== id));
    await supabase.from("crm_reminders").update({ done: true, done_at: new Date().toISOString() }).eq("id", id);
  }

  async function addSpecialism() {
    const name = newName.trim();
    if (!name) return;
    const { error: err } = await supabase
      .from("crm_specialisms")
      .insert({ name, slug: slugify(name), emoji: newEmoji.trim() || "💼", sort_order: specialisms.length + 1 });
    if (err) return setError(err.message);
    setNewName("");
    load();
  }

  async function renameSpecialism(s: Specialism) {
    const name = window.prompt("New name", s.name);
    if (!name?.trim()) return;
    const emoji = window.prompt("Emoji", s.emoji) || s.emoji;
    const { error: err } = await supabase.from("crm_specialisms").update({ name: name.trim(), emoji }).eq("id", s.id);
    if (err) return setError(err.message);
    load();
  }

  async function deleteSpecialism(s: Specialism) {
    const n = stats[s.id]?.total ?? 0;
    if (!window.confirm(n ? `Delete ${s.name}? Its ${n} candidates won't be deleted, they'll just have no specialism.` : `Delete ${s.name}?`)) return;
    const { error: err } = await supabase.from("crm_specialisms").delete().eq("id", s.id);
    if (err) return setError(err.message);
    load();
  }

  const now = Date.now();
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);
  const overdue = reminders.filter((r) => new Date(r.due_at).getTime() < now);
  const today = reminders.filter((r) => new Date(r.due_at).getTime() >= now && new Date(r.due_at) <= endOfToday);
  const upcoming = reminders.filter((r) => new Date(r.due_at) > endOfToday);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="mx-auto max-w-7xl p-5 lg:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#1F3447]">{greeting}</h1>
          <p className="mt-1 text-slate-500">{new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</p>
        </div>
        <Link href="/crm/candidates?new=1" className="flex items-center gap-2 rounded-lg bg-[#F7931E] px-4 py-2.5 text-sm font-semibold text-white hover:brightness-95">
          <Icon name="plus" className="h-4 w-4" /> Add candidate
        </Link>
      </div>

      {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_24rem]">
        <div className="space-y-6">
          {/* Specialisms */}
          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#1F3447]">Candidates by specialism</h2>
              <button onClick={() => setManaging((m) => !m)} className="text-sm font-semibold text-[#F7931E] hover:underline">
                {managing ? "Done" : "Manage"}
              </button>
            </div>

            {loading ? (
              <p className="py-6 text-center text-sm text-slate-500">Loading…</p>
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {specialisms.map((s) => {
                  const v = stats[s.id] ?? { total: 0, active: 0, placed: 0 };
                  return (
                    <div key={s.id} className="relative rounded-xl border-l-4 bg-slate-50 p-4" style={{ borderLeftColor: s.colour }}>
                      <Link href={`/crm/candidates?s=${s.slug}`} className="block">
                        <p className="text-sm font-semibold text-[#1F3447]">
                          <span className="mr-1">{s.emoji}</span>
                          {s.name}
                        </p>
                        <p className="mt-2 text-2xl font-bold text-[#1F3447]">{v.total}</p>
                        <p className="text-xs text-slate-500">
                          {v.active} in progress, {v.placed} placed
                        </p>
                      </Link>
                      {managing && (
                        <div className="mt-2 flex gap-2">
                          <button onClick={() => renameSpecialism(s)} className="text-xs font-semibold text-slate-600 hover:underline">
                            Rename
                          </button>
                          <button onClick={() => deleteSpecialism(s)} className="text-xs font-semibold text-red-600 hover:underline">
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {managing && (
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                <input
                  value={newEmoji}
                  onChange={(e) => setNewEmoji(e.target.value)}
                  className="w-14 rounded-lg border border-slate-300 px-2 py-2 text-center"
                  aria-label="Emoji"
                />
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addSpecialism()}
                  placeholder="New specialism, e.g. Healthcare"
                  className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
                <button onClick={addSpecialism} className="rounded-lg bg-[#1F3447] px-4 py-2 text-sm font-semibold text-white">
                  Add
                </button>
              </div>
            )}
          </section>

          {/* Recently added */}
          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#1F3447]">Recently added</h2>
              <Link href="/crm/candidates" className="text-sm font-semibold text-[#F7931E] hover:underline">
                All candidates
              </Link>
            </div>
            {recent.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-500">No candidates yet. Add your first one.</p>
            ) : (
              <ul className="mt-2 divide-y divide-slate-100">
                {recent.map((c) => {
                  const st = stageOf(c.stage);
                  const sp = specialisms.find((s) => s.id === c.specialism_id);
                  return (
                    <li key={c.id}>
                      <Link href={`/crm/candidates/view?id=${c.id}`} className="flex items-center gap-3 rounded-lg px-2 py-3 hover:bg-slate-50">
                        <span className="text-lg">{sp?.emoji ?? "👤"}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-[#1F3447]">{candidateName(c)}</span>
                          <span className="block truncate text-xs text-slate-500">
                            {[c.job_title, c.location].filter(Boolean).join(", ") || "No details yet"}, added {timeAgo(c.created_at)}
                          </span>
                        </span>
                        <span className="rounded-full px-2.5 py-1 text-xs font-semibold text-white" style={{ backgroundColor: st.colour }}>
                          {st.label}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        {/* Reminders */}
        <section className="rounded-2xl bg-white p-5 shadow-sm xl:self-start">
          <h2 className="flex items-center gap-2 text-lg font-bold text-[#1F3447]">
            <Icon name="bell" className="h-5 w-5" /> Reminders
          </h2>

          <form onSubmit={addReminder} className="mt-3 space-y-2 rounded-xl bg-slate-50 p-3">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Call Sarah at Antalis about the engineer role"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <div className="flex gap-2">
              <input
                type="datetime-local"
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
                className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                aria-label="When"
              />
              <button type="submit" className="rounded-lg bg-[#F7931E] px-4 py-2 text-sm font-semibold text-white">
                Add
              </button>
            </div>
          </form>

          {loading ? (
            <p className="py-6 text-center text-sm text-slate-500">Loading…</p>
          ) : reminders.length === 0 ? (
            <p className="mt-4 rounded-xl bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">Nothing due this week.</p>
          ) : (
            <div className="mt-4 space-y-4">
              <ReminderGroup title="Overdue" tone="red" items={overdue} onDone={complete} />
              <ReminderGroup title="Today" tone="orange" items={today} onDone={complete} />
              <ReminderGroup title="Next 7 days" tone="slate" items={upcoming} onDone={complete} />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function ReminderGroup({
  title,
  tone,
  items,
  onDone,
}: {
  title: string;
  tone: "red" | "orange" | "slate";
  items: Reminder[];
  onDone: (id: string) => void;
}) {
  if (!items.length) return null;
  const colour = tone === "red" ? "text-red-600" : tone === "orange" ? "text-[#F7931E]" : "text-slate-500";
  return (
    <div>
      <p className={`text-xs font-bold uppercase tracking-wider ${colour}`}>
        {title} ({items.length})
      </p>
      <ul className="mt-1.5 space-y-1.5">
        {items.map((r) => (
          <li key={r.id} className="flex items-start gap-3 rounded-lg border border-slate-200 p-3">
            <button
              onClick={() => onDone(r.id)}
              aria-label="Mark as done"
              title="Mark as done"
              className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 border-slate-300 text-transparent hover:border-green-500 hover:text-green-500"
            >
              <Icon name="check" className="h-3 w-3" />
            </button>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-800">{r.title}</p>
              <p className="text-xs text-slate-500">
                {ukDateTime(r.due_at)}
                {r.candidate_id && r.crm_candidates && (
                  <>
                    {" · "}
                    <Link href={`/crm/candidates/view?id=${r.candidate_id}`} className="font-semibold text-[#F7931E] hover:underline">
                      {candidateName(r.crm_candidates)}
                    </Link>
                  </>
                )}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}