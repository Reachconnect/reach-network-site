"use client";

// One email list: upload a spreadsheet, check the columns, see who's on it
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { mail } from "../mailApi";
import { FIELDS, guessColumns, headerRow, readSpreadsheet, type FieldKey, type Sheet } from "../sheet";

type Contact = { id: string; email: string; first_name: string | null; last_name: string | null; company: string | null; job_title: string | null; phone: string | null; unsubscribed: boolean };
type Upload = { fileName: string; sheets: Sheet[]; sheet: number; map: Record<FieldKey, number> };

const field = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#F7931E] focus:outline-none";

function ListView() {
  const id = useSearchParams().get("id") || "";
  const router = useRouter();
  const [list, setList] = useState<{ id: string; name: string; description: string | null } | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [upload, setUpload] = useState<Upload | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [adding, setAdding] = useState<Record<string, string> | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [shown, setShown] = useState(200);

  const load = useCallback(async () => {
    try {
      const j = await mail("GET", `?view=list&id=${id}`);
      setList(j.list);
      setContacts(j.contacts);
    } catch (e) {
      setError((e as Error).message);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  // ---------- Spreadsheet upload ----------
  async function pickFile(file: File) {
    setError(null);
    setMessage(null);
    try {
      const sheets = (await readSpreadsheet(file)).filter((s) => s.rows.length > 1);
      if (!sheets.length) throw new Error("That file looks empty.");
      // Start on the sheet with an email column and the most rows
      const scored = sheets.map((s, i) => ({ i, score: (s.rows[headerRow(s.rows)]?.some((c) => /e-?mail/i.test(c)) ? 1e7 : 0) + s.rows.length }));
      const best = scored.sort((a, b) => b.score - a.score)[0].i;
      const s = sheets[best];
      setUpload({ fileName: file.name, sheets, sheet: best, map: guessColumns(s.rows[headerRow(s.rows)] || []) });
    } catch (e) {
      setError((e as Error).message);
    }
  }

  const current = upload ? upload.sheets[upload.sheet] : null;
  const hIndex = current ? headerRow(current.rows) : 0;
  const header = current?.rows[hIndex] ?? [];
  const dataRows = useMemo(() => (current ? current.rows.slice(hIndex + 1) : []), [current, hIndex]);

  function toContact(row: string[], map: Record<FieldKey, number>) {
    const get = (k: FieldKey) => (map[k] >= 0 ? (row[map[k]] || "").trim() : "");
    let first = get("first_name");
    let last = get("last_name");
    if (!first && get("full_name")) {
      const parts = get("full_name").split(/\s+/);
      first = parts.shift() || "";
      last = last || parts.join(" ");
    }
    const nice = (s: string) => (s && (s === s.toUpperCase() || s === s.toLowerCase()) ? s.toLowerCase().replace(/(^|[\s'-])\p{L}/gu, (m) => m.toUpperCase()) : s);
    return { email: get("email").toLowerCase(), first_name: nice(first), last_name: nice(last), company: get("company"), job_title: get("job_title"), phone: get("phone") };
  }

  const preview = useMemo(() => (upload ? dataRows.slice(0, 5).map((r) => toContact(r, upload.map)) : []), [dataRows, upload]);
  const validCount = useMemo(() => (upload ? dataRows.filter((r) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((r[upload.map.email] || "").trim())).length : 0), [dataRows, upload]);

  async function runImport() {
    if (!upload) return;
    if (upload.map.email < 0) return setError("Choose which column has the email addresses.");
    const all = dataRows.map((r) => toContact(r, upload.map));
    let saved = 0;
    let invalid = 0;
    try {
      for (let i = 0; i < all.length; i += 1000) {
        setProgress(`Adding ${Math.min(i + 1000, all.length).toLocaleString()} of ${all.length.toLocaleString()}…`);
        const j = await mail("POST", { action: "import", listId: id, contacts: all.slice(i, i + 1000) });
        saved += j.saved;
        invalid += j.invalid;
      }
      setMessage(`Added ${saved.toLocaleString()} contacts${invalid ? `. ${invalid} rows were skipped because the email address was missing or wrong` : ""}. Anyone already on this list was updated, not doubled up.`);
      setUpload(null);
      load();
    } catch (e) {
      setError((e as Error).message);
    }
    setProgress(null);
  }

  async function addOne() {
    if (!adding) return;
    try {
      const j = await mail("POST", { action: "import", listId: id, contacts: [adding] });
      if (!j.saved) throw new Error("That email address doesn't look right.");
      setAdding(null);
      load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function remove(c: Contact) {
    if (!window.confirm(`Take ${c.email} off this list?`)) return;
    await mail("POST", { action: "contact_delete", id: c.id }).catch((e) => setError(e.message));
    setContacts((x) => x.filter((y) => y.id !== c.id));
  }

  async function rename() {
    if (!list) return;
    const name = window.prompt("List name", list.name);
    if (!name) return;
    await mail("POST", { action: "list_rename", id, name, description: list.description }).catch((e) => setError(e.message));
    load();
  }

  async function deleteList() {
    if (!window.confirm(`Delete "${list?.name}" and all ${contacts.length} contacts on it? Campaigns already sent keep their results.`)) return;
    await mail("POST", { action: "list_delete", id }).catch((e) => setError(e.message));
    router.push("/crm/email");
  }

  const term = search.trim().toLowerCase();
  const filtered = term ? contacts.filter((c) => `${c.email} ${c.first_name ?? ""} ${c.last_name ?? ""} ${c.company ?? ""} ${c.job_title ?? ""}`.toLowerCase().includes(term)) : contacts;

  if (loading) return <p className="p-6 text-sm text-slate-500">Loading…</p>;
  if (!list) return <p className="p-6 text-sm text-red-700">{error || "List not found."}</p>;

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6">
      <Link href="/crm/email" className="text-sm text-slate-500 hover:underline">
        ← Email campaigns
      </Link>
      <div className="mb-5 mt-1 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1F3447]">{list.name}</h1>
          <p className="text-sm text-slate-500">
            {contacts.length.toLocaleString()} contacts{list.description ? ` · ${list.description}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <label className="cursor-pointer rounded-lg bg-[#F7931E] px-4 py-2.5 font-semibold text-white">
            Upload a spreadsheet
            <input type="file" accept=".csv,.xlsx,.xls,text/csv" className="hidden" onChange={(e) => e.target.files?.[0] && pickFile(e.target.files[0])} />
          </label>
          <button onClick={() => setAdding({ email: "", first_name: "", last_name: "", company: "", job_title: "", phone: "" })} className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 font-semibold text-[#1F3447]">
            + Add one
          </button>
          <button onClick={rename} className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-600">
            Rename
          </button>
          <button onClick={deleteList} className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-400 hover:text-red-600">
            Delete
          </button>
        </div>
      </div>

      {error && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {message && <p className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-800">{message}</p>}

      {/* ---------- Matching up the columns ---------- */}
      {upload && current && (
        <div className="mb-5 rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-bold text-slate-800">Check the columns: {upload.fileName}</p>
            {upload.sheets.length > 1 && (
              <select
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
                value={upload.sheet}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  const s = upload.sheets[n];
                  setUpload({ ...upload, sheet: n, map: guessColumns(s.rows[headerRow(s.rows)] || []) });
                }}
              >
                {upload.sheets.map((s, i) => (
                  <option key={i} value={i}>
                    Tab: {s.name} ({s.rows.length - 1} rows)
                  </option>
                ))}
              </select>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {dataRows.length.toLocaleString()} rows, {validCount.toLocaleString()} with an email address. I&apos;ve matched the columns I could. Change any that are wrong.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {FIELDS.map((f) => (
              <div key={f.key}>
                <label className="mb-1 block text-xs font-semibold text-slate-500">
                  {f.label}
                  {f.key === "email" && " *"}
                </label>
                <select className={field} value={upload.map[f.key]} onChange={(e) => setUpload({ ...upload, map: { ...upload.map, [f.key]: Number(e.target.value) } })}>
                  <option value={-1}>(not in this file)</option>
                  {header.map((h, i) => (
                    <option key={i} value={i}>
                      {h || `Column ${i + 1}`}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs font-semibold text-slate-500">How the first few will look</p>
          <div className="mt-1 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-slate-400">
                <tr>
                  <th className="py-1 pr-3">Email</th>
                  <th className="py-1 pr-3">First name</th>
                  <th className="py-1 pr-3">Last name</th>
                  <th className="py-1 pr-3">Company</th>
                  <th className="py-1 pr-3">Job title</th>
                  <th className="py-1">Phone</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((c, i) => (
                  <tr key={i} className="border-t border-slate-100">
                    <td className="py-1.5 pr-3">{c.email || <span className="text-red-600">missing</span>}</td>
                    <td className="py-1.5 pr-3">{c.first_name}</td>
                    <td className="py-1.5 pr-3">{c.last_name}</td>
                    <td className="py-1.5 pr-3">{c.company}</td>
                    <td className="py-1.5 pr-3">{c.job_title}</td>
                    <td className="py-1.5">{c.phone}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button onClick={runImport} disabled={!!progress || upload.map.email < 0} className="rounded-lg bg-[#F7931E] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
              {progress || `Add ${validCount.toLocaleString()} contacts to ${list.name}`}
            </button>
            <button onClick={() => setUpload(null)} disabled={!!progress} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-600">
              Cancel
            </button>
          </div>
          <p className="mt-3 text-xs text-slate-400">Only add people you&apos;re allowed to email: business contacts at limited companies, with an unsubscribe link (every email has one). Sole traders and partnerships need to have agreed first.</p>
        </div>
      )}

      {adding && (
        <div className="mb-5 rounded-2xl bg-white p-5 shadow-sm">
          <p className="mb-2 font-bold text-slate-800">Add one person</p>
          <div className="grid gap-2 sm:grid-cols-3">
            {[
              ["email", "Email *"],
              ["first_name", "First name"],
              ["last_name", "Last name"],
              ["company", "Company"],
              ["job_title", "Job title"],
              ["phone", "Phone"],
            ].map(([k, l]) => (
              <input key={k} className={field} placeholder={l} value={adding[k]} onChange={(e) => setAdding({ ...adding, [k]: e.target.value })} />
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <button onClick={addOne} className="rounded-lg bg-[#F7931E] px-4 py-2 text-sm font-semibold text-white">
              Add
            </button>
            <button onClick={() => setAdding(null)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ---------- Who's on the list ---------- */}
      <div className="rounded-2xl bg-white shadow-sm">
        <div className="border-b border-slate-100 p-3">
          <input className={field} placeholder={`Search ${contacts.length.toLocaleString()} contacts`} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {!contacts.length ? (
          <p className="p-8 text-center text-sm text-slate-500">Nobody on this list yet. Upload a spreadsheet (Excel or CSV) to add people.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-500">
                <tr>
                  <th className="px-4 py-2.5">Name</th>
                  <th className="px-4 py-2.5">Company</th>
                  <th className="hidden px-4 py-2.5 lg:table-cell">Job title</th>
                  <th className="px-4 py-2.5">Email</th>
                  <th className="hidden px-4 py-2.5 md:table-cell">Phone</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.slice(0, shown).map((c) => (
                  <tr key={c.id}>
                    <td className="px-4 py-2">{[c.first_name, c.last_name].filter(Boolean).join(" ") || <span className="text-slate-400">No name</span>}</td>
                    <td className="px-4 py-2">{c.company}</td>
                    <td className="hidden px-4 py-2 text-slate-600 lg:table-cell">{c.job_title}</td>
                    <td className="px-4 py-2">
                      {c.email}
                      {c.unsubscribed && <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">unsubscribed</span>}
                    </td>
                    <td className="hidden px-4 py-2 md:table-cell">{c.phone}</td>
                    <td className="px-4 py-2 text-right">
                      <button onClick={() => remove(c)} className="text-xs text-slate-400 hover:text-red-600">
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length > shown && (
              <button onClick={() => setShown(shown + 500)} className="w-full p-3 text-sm font-semibold text-[#F7931E]">
                Show more ({(filtered.length - shown).toLocaleString()} more)
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ListPage() {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-slate-500">Loading…</p>}>
      <ListView />
    </Suspense>
  );
}
