"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Icon } from "../crm";

type Group = { id: string; name: string; sort_order: number };
type Item = {
  id: string;
  group_id: string;
  title: string;
  url: string | null;
  doc_path: string | null;
  doc_filename: string | null;
  description: string | null;
  emoji: string;
  sort_order: number;
};
type Draft = { id?: string; group_id: string; kind: "link" | "doc"; title: string; url: string; description: string; emoji: string; file: File | null };

const input = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#F7931E] focus:outline-none focus:ring-2 focus:ring-[#F7931E]/30";

export default function LinksPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [g, l] = await Promise.all([
      supabase.from("crm_link_groups").select("*").order("sort_order").order("name"),
      supabase.from("crm_links").select("*").order("sort_order").order("title"),
    ]);
    if (g.error) setError(g.error.message);
    setGroups((g.data ?? []) as Group[]);
    setItems((l.data ?? []) as Item[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const term = search.trim().toLowerCase();
  const matches = useMemo(
    () => items.filter((i) => !term || `${i.title} ${i.description ?? ""} ${i.url ?? ""} ${i.doc_filename ?? ""}`.toLowerCase().includes(term)),
    [items, term]
  );

  async function openDoc(item: Item) {
    if (!item.doc_path) return;
    const { data, error: e } = await supabase.storage.from("crm-docs").createSignedUrl(item.doc_path, 600);
    if (e || !data) return setError("Couldn't open that document.");
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  // ---------- Groups ----------
  async function addGroup() {
    const name = window.prompt("Name for the new group, e.g. Policies");
    if (!name?.trim()) return;
    const { error: e } = await supabase.from("crm_link_groups").insert({ name: name.trim(), sort_order: groups.length + 1 });
    if (e) return setError(e.message);
    load();
  }

  async function renameGroup(g: Group) {
    const name = window.prompt("New name", g.name);
    if (!name?.trim()) return;
    await supabase.from("crm_link_groups").update({ name: name.trim() }).eq("id", g.id);
    load();
  }

  async function deleteGroup(g: Group) {
    const n = items.filter((i) => i.group_id === g.id).length;
    if (!window.confirm(n ? `Delete ${g.name} and the ${n} items in it?` : `Delete ${g.name}?`)) return;
    const docs = items.filter((i) => i.group_id === g.id && i.doc_path).map((i) => i.doc_path as string);
    if (docs.length) await supabase.storage.from("crm-docs").remove(docs);
    await supabase.from("crm_link_groups").delete().eq("id", g.id);
    load();
  }

  async function moveGroup(g: Group, dir: -1 | 1) {
    const i = groups.findIndex((x) => x.id === g.id);
    const other = groups[i + dir];
    if (!other) return;
    await Promise.all([
      supabase.from("crm_link_groups").update({ sort_order: other.sort_order }).eq("id", g.id),
      supabase.from("crm_link_groups").update({ sort_order: g.sort_order === other.sort_order ? other.sort_order + dir : g.sort_order }).eq("id", other.id),
    ]);
    load();
  }

  // ---------- Items ----------
  async function moveItem(item: Item, dir: -1 | 1) {
    const list = items.filter((i) => i.group_id === item.group_id);
    const idx = list.findIndex((x) => x.id === item.id);
    const other = list[idx + dir];
    if (!other) return;
    // Renumber the group so the order is always clean
    const reordered = [...list];
    reordered[idx] = other;
    reordered[idx + dir] = item;
    await Promise.all(reordered.map((x, n) => supabase.from("crm_links").update({ sort_order: n + 1 }).eq("id", x.id)));
    load();
  }

  async function deleteItem(item: Item) {
    if (!window.confirm(`Delete ${item.title}?`)) return;
    if (item.doc_path) await supabase.storage.from("crm-docs").remove([item.doc_path]);
    await supabase.from("crm_links").delete().eq("id", item.id);
    load();
  }

  function newItem(groupId: string, kind: "link" | "doc") {
    setDraft({ group_id: groupId, kind, title: "", url: "", description: "", emoji: kind === "doc" ? "📄" : "🔗", file: null });
  }

  function editItem(item: Item) {
    setDraft({
      id: item.id,
      group_id: item.group_id,
      kind: item.doc_path ? "doc" : "link",
      title: item.title,
      url: item.url ?? "",
      description: item.description ?? "",
      emoji: item.emoji,
      file: null,
    });
  }

  async function saveItem() {
    if (!draft) return;
    const title = draft.title.trim() || draft.file?.name.replace(/\.[^.]+$/, "") || "";
    if (!title) return setError("Give it a name.");
    let url = draft.url.trim();
    if (draft.kind === "link") {
      if (!url) return setError("Add the web address.");
      if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
    }
    const existing = draft.id ? items.find((i) => i.id === draft.id) : null;
    if (draft.kind === "doc" && !draft.file && !existing?.doc_path) return setError("Choose a document to upload.");

    setBusy(true);
    setError(null);

    let docPath = existing?.doc_path ?? null;
    let docName = existing?.doc_filename ?? null;
    if (draft.kind === "doc" && draft.file) {
      const path = `${Date.now()}-${draft.file.name.replace(/[^a-zA-Z0-9.]+/g, "-")}`;
      const up = await supabase.storage.from("crm-docs").upload(path, draft.file);
      if (up.error) {
        setBusy(false);
        return setError(`Upload failed: ${up.error.message}`);
      }
      if (docPath) await supabase.storage.from("crm-docs").remove([docPath]);
      docPath = path;
      docName = draft.file.name;
    }

    const row = {
      group_id: draft.group_id,
      title,
      url: draft.kind === "link" ? url : null,
      doc_path: draft.kind === "doc" ? docPath : null,
      doc_filename: draft.kind === "doc" ? docName : null,
      description: draft.description.trim() || null,
      emoji: draft.emoji.trim() || (draft.kind === "doc" ? "📄" : "🔗"),
    };

    const { error: e } = draft.id
      ? await supabase.from("crm_links").update(row).eq("id", draft.id)
      : await supabase.from("crm_links").insert({ ...row, sort_order: items.filter((i) => i.group_id === draft.group_id).length + 1 });
    setBusy(false);
    if (e) return setError(e.message);
    setDraft(null);
    load();
  }

  return (
    <div className="mx-auto max-w-6xl p-5 lg:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#1F3447]">Links and documents</h1>
          <p className="mt-1 text-slate-500">Everything the team needs, in one place. Only Reach staff can see this page.</p>
        </div>
        <div className="flex gap-2">
          {editing && (
            <button onClick={addGroup} className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-[#1F3447] hover:bg-slate-50">
              <Icon name="plus" className="h-4 w-4" /> New group
            </button>
          )}
          <button
            onClick={() => setEditing((e) => !e)}
            className={`rounded-lg px-4 py-2.5 text-sm font-semibold ${editing ? "bg-[#F7931E] text-white" : "border border-slate-300 bg-white text-[#1F3447] hover:bg-slate-50"}`}
          >
            {editing ? "Done" : "Edit"}
          </button>
        </div>
      </div>

      <div className="relative mt-5">
        <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search links and documents" className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-9 pr-3 text-sm shadow-sm" />
      </div>

      {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {loading ? (
        <p className="mt-10 text-center text-slate-500">Loading…</p>
      ) : (
        <div className="mt-6 space-y-8">
          {groups.map((g, gi) => {
            const list = matches.filter((i) => i.group_id === g.id);
            if (term && !list.length) return null;
            return (
              <section key={g.id}>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">{g.name}</h2>
                  {editing && (
                    <div className="flex items-center gap-1 text-xs">
                      <button onClick={() => moveGroup(g, -1)} disabled={gi === 0} className="rounded px-1.5 py-0.5 text-slate-500 hover:bg-slate-200 disabled:opacity-30" aria-label="Move group up">
                        ↑
                      </button>
                      <button onClick={() => moveGroup(g, 1)} disabled={gi === groups.length - 1} className="rounded px-1.5 py-0.5 text-slate-500 hover:bg-slate-200 disabled:opacity-30" aria-label="Move group down">
                        ↓
                      </button>
                      <button onClick={() => renameGroup(g)} className="rounded px-1.5 py-0.5 font-semibold text-slate-600 hover:bg-slate-200">
                        Rename
                      </button>
                      <button onClick={() => deleteGroup(g)} className="rounded px-1.5 py-0.5 font-semibold text-red-600 hover:bg-red-50">
                        Delete
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {list.map((item, ii) => {
                    const body = (
                      <>
                        <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xl">{item.emoji}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-semibold text-[#1F3447]">{item.title}</span>
                          <span className="block truncate text-xs text-slate-500">
                            {item.description || (item.doc_path ? item.doc_filename : item.url?.replace(/^https?:\/\//, ""))}
                          </span>
                        </span>
                        {!editing && <Icon name={item.doc_path ? "file" : "arrow"} className="h-4 w-4 flex-shrink-0 text-slate-300" />}
                      </>
                    );
                    return (
                      <div key={item.id} className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 transition hover:shadow-md">
                        {editing ? (
                          <div className="flex items-center gap-3 p-4">{body}</div>
                        ) : item.doc_path ? (
                          <button onClick={() => openDoc(item)} className="flex w-full items-center gap-3 p-4 text-left">
                            {body}
                          </button>
                        ) : (
                          <a href={item.url ?? "#"} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4">
                            {body}
                          </a>
                        )}
                        {editing && (
                          <div className="flex items-center gap-1 border-t border-slate-100 px-3 py-2 text-xs">
                            <button onClick={() => moveItem(item, -1)} disabled={ii === 0} className="rounded px-1.5 py-0.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30" aria-label="Move left">
                              ←
                            </button>
                            <button onClick={() => moveItem(item, 1)} disabled={ii === list.length - 1} className="rounded px-1.5 py-0.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30" aria-label="Move right">
                              →
                            </button>
                            <button onClick={() => editItem(item)} className="ml-auto rounded px-2 py-0.5 font-semibold text-slate-600 hover:bg-slate-100">
                              Edit
                            </button>
                            <button onClick={() => deleteItem(item)} className="rounded px-2 py-0.5 font-semibold text-red-600 hover:bg-red-50">
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {editing && (
                    <div className="flex flex-col gap-2 rounded-2xl border-2 border-dashed border-slate-300 p-3">
                      <button onClick={() => newItem(g.id, "link")} className="flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold text-[#1F3447] hover:bg-slate-100">
                        <Icon name="plus" className="h-4 w-4" /> Add link
                      </button>
                      <button onClick={() => newItem(g.id, "doc")} className="flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold text-[#1F3447] hover:bg-slate-100">
                        <Icon name="file" className="h-4 w-4" /> Upload document
                      </button>
                    </div>
                  )}

                  {!editing && !list.length && <p className="text-sm text-slate-400">Nothing here yet. Click Edit to add something.</p>}
                </div>
              </section>
            );
          })}
          {term && !matches.length && <p className="text-center text-slate-500">Nothing matches &ldquo;{search}&rdquo;.</p>}
        </div>
      )}

      {/* Add or edit */}
      {draft && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4" onClick={() => setDraft(null)}>
          <div role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()} className="w-full rounded-t-2xl bg-white p-6 sm:max-w-md sm:rounded-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#1F3447]">
                {draft.id ? "Edit" : draft.kind === "doc" ? "Upload document" : "Add link"}
              </h2>
              <button onClick={() => setDraft(null)} aria-label="Close" className="rounded-full p-1.5 hover:bg-slate-100">
                <Icon name="x" className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {draft.kind === "doc" && (
                <label className="block">
                  <span className="text-xs font-semibold text-slate-500">{draft.id ? "Replace document (optional)" : "Document"}</span>
                  <input type="file" className="mt-1 block text-sm" onChange={(e) => setDraft({ ...draft, file: e.target.files?.[0] ?? null })} />
                </label>
              )}
              <div className="flex gap-2">
                <label className="block w-16">
                  <span className="text-xs font-semibold text-slate-500">Icon</span>
                  <input className={`mt-1 ${input} text-center`} value={draft.emoji} onChange={(e) => setDraft({ ...draft, emoji: e.target.value })} />
                </label>
                <label className="block flex-1">
                  <span className="text-xs font-semibold text-slate-500">Name</span>
                  <input
                    className={`mt-1 ${input}`}
                    value={draft.title}
                    onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                    placeholder={draft.kind === "doc" ? "Terms of business" : "CircleLoop"}
                  />
                </label>
              </div>
              {draft.kind === "link" && (
                <label className="block">
                  <span className="text-xs font-semibold text-slate-500">Web address</span>
                  <input className={`mt-1 ${input}`} value={draft.url} onChange={(e) => setDraft({ ...draft, url: e.target.value })} placeholder="https://" />
                </label>
              )}
              <label className="block">
                <span className="text-xs font-semibold text-slate-500">Short description (optional)</span>
                <input className={`mt-1 ${input}`} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-slate-500">Group</span>
                <select className={`mt-1 ${input}`} value={draft.group_id} onChange={(e) => setDraft({ ...draft, group_id: e.target.value })}>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setDraft(null)} className="rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">
                Cancel
              </button>
              <button onClick={saveItem} disabled={busy} className="rounded-lg bg-[#F7931E] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
                {busy ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}