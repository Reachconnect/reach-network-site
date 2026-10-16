"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { COMPANY_STAGES, Icon, companyStageOf, primaryContact, timeAgo, type Company, type CompanyStageKey, type Specialism } from "../crm";

export default function SalesPage() {
  return (
    <Suspense fallback={<p className="p-8 text-slate-500">Loading…</p>}>
      <Sales />
    </Suspense>
  );
}

function Sales() {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [specialisms, setSpecialisms] = useState<Specialism[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"board" | "list">("board");
  const [search, setSearch] = useState("");
  const [showLost, setShowLost] = useState(false);
  const [adding, setAdding] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropStage, setDropStage] = useState<string | null>(null);

  useEffect(() => {
    try {
      const v = localStorage.getItem("reach-crm-sales-view");
      if (v === "board" || v === "list") setView(v);
    } catch {
      // ignore
    }
  }, []);

  const load = useCallback(async () => {
    const [c, s] = await Promise.all([
      supabase.from("crm_companies").select("*, crm_contacts(id, company_id, name, job_title, phone, email, is_primary)").order("updated_at", { ascending: false }).limit(3000),
      supabase.from("crm_specialisms").select("*").order("sort_order").order("name"),
    ]);
    if (c.error) setError(c.error.message);
    setCompanies((c.data ?? []) as Company[]);
    setSpecialisms((s.data ?? []) as Specialism[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function changeView(v: "board" | "list") {
    setView(v);
    try {
      localStorage.setItem("reach-crm-sales-view", v);
    } catch {
      // ignore
    }
  }

  const shown = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return companies;
    return companies.filter((c) =>
      [c.name, c.email, c.phone, c.address, c.postcode, ...(c.crm_contacts ?? []).map((x) => `${x.name} ${x.email ?? ""} ${x.phone ?? ""}`)]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [companies, search]);

  async function moveTo(c: Company, to: CompanyStageKey) {
    if (c.stage === to) return;
    const patch: Partial<Company> = { stage: to };
    if (to === "lost") {
      const reason = window.prompt(`Why was ${c.name} lost? (optional)`, c.lost_reason || "");
      if (reason === null) return;
      patch.lost_reason = reason.trim() || null;
    }
    if (to === "client" && !c.reachconnect_client_id) {
      if (!window.confirm(`Move ${c.name} to Client? This also adds them to ReachConnect.`)) return;
    }
    setCompanies((list) => list.map((x) => (x.id === c.id ? { ...x, ...patch } : x)));
    const { error: e } = await supabase.from("crm_companies").update(patch).eq("id", c.id);
    if (e) setError(`That didn't save: ${e.message}`);
    if (to === "client" || e) load();
  }

  const columns = COMPANY_STAGES.filter((s) => showLost || s.key !== "lost");
  const open = companies.filter((c) => !["client", "lost"].includes(c.stage)).length;
  const clients = companies.filter((c) => c.stage === "client").length;

  return (
    <div className="flex h-full flex-col p-5 lg:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#1F3447]">Sales pipeline</h1>
          <p className="mt-1 text-slate-500">{loading ? "Loading…" : `${open} open, ${clients} ${clients === 1 ? "client" : "clients"}`}</p>
        </div>
        <button onClick={() => setAdding(true)} className="flex items-center gap-2 rounded-lg bg-[#F7931E] px-4 py-2.5 text-sm font-semibold text-white hover:brightness-95">
          <Icon name="plus" className="h-4 w-4" /> Add company
        </button>
      </div>

      {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <div className="mt-5 flex flex-wrap items-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
        <div className="relative min-w-[14rem] flex-1">
          <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search company, contact, phone or postcode"
            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm"
          />
        </div>
        {view === "board" && (
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={showLost} onChange={(e) => setShowLost(e.target.checked)} className="h-4 w-4 accent-[#F7931E]" />
            Show lost
          </label>
        )}
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

      {view === "board" && !loading && (
        <div className="mt-5 flex min-h-0 flex-1 gap-3 overflow-x-auto pb-3">
          {columns.map((s) => {
            const cards = shown.filter((c) => c.stage === s.key);
            return (
              <div
                key={s.key}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDropStage(s.key);
                }}
                onDragLeave={() => setDropStage((d) => (d === s.key ? null : d))}
                onDrop={() => {
                  const c = companies.find((x) => x.id === dragId);
                  if (c) moveTo(c, s.key);
                  setDragId(null);
                  setDropStage(null);
                }}
                className={`flex w-64 flex-shrink-0 flex-col rounded-2xl p-2 transition ${dropStage === s.key ? "bg-orange-100" : "bg-slate-200/60"}`}
              >
                <div className="flex items-center gap-2 px-2 py-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.colour }} />
                  <span className="text-sm font-bold text-[#1F3447]">{s.label}</span>
                  <span className="ml-auto text-xs font-semibold text-slate-500">{cards.length}</span>
                </div>
                <div className="min-h-[4rem] flex-1 space-y-2 overflow-y-auto">
                  {cards.map((c) => {
                    const contact = primaryContact(c);
                    return (
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
                        <Link href={`/crm/sales/view?id=${c.id}`} className="block">
                          <p className="truncate text-sm font-semibold text-[#1F3447]">{c.name}</p>
                          <p className="truncate text-xs text-slate-500">{contact ? [contact.name, contact.job_title].filter(Boolean).join(", ") : "No contact yet"}</p>
                          <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500">
                            {c.estimated_value && <span className="rounded bg-green-50 px-1.5 py-0.5 font-semibold text-green-700">{c.estimated_value}</span>}
                            {c.stage === "client" && c.reachconnect_client_id && <span className="rounded bg-slate-100 px-1.5 py-0.5 font-semibold">In ReachConnect</span>}
                            <span className="ml-auto">{timeAgo(c.last_contacted_at || c.created_at)}</span>
                          </div>
                        </Link>
                        <select
                          value={c.stage}
                          onChange={(e) => moveTo(c, e.target.value as CompanyStageKey)}
                          className="mt-2 w-full rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 lg:hidden"
                          aria-label="Move to stage"
                        >
                          {COMPANY_STAGES.map((x) => (
                            <option key={x.key} value={x.key}>
                              {x.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {view === "list" && !loading && (
        <div className="mt-5 overflow-x-auto rounded-2xl bg-white shadow-sm">
          {shown.length === 0 ? (
            <p className="p-10 text-center text-slate-500">No companies yet. Add your first one.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="p-3">Company</th>
                  <th className="p-3">Main contact</th>
                  <th className="p-3">Stage</th>
                  <th className="p-3">Value</th>
                  <th className="p-3">Sector</th>
                  <th className="p-3">Last contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {shown.map((c) => {
                  const st = companyStageOf(c.stage);
                  const contact = primaryContact(c);
                  const sp = specialisms.find((s) => s.id === c.specialism_id);
                  return (
                    <tr key={c.id} onClick={() => router.push(`/crm/sales/view?id=${c.id}`)} className="cursor-pointer hover:bg-slate-50">
                      <td className="p-3 font-semibold text-[#1F3447]">{c.name}</td>
                      <td className="p-3 text-slate-600">{contact?.name || "—"}</td>
                      <td className="p-3">
                        <span className="rounded-full px-2.5 py-1 text-xs font-semibold text-white" style={{ backgroundColor: st.colour }}>
                          {st.label}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600">{c.estimated_value || "—"}</td>
                      <td className="p-3 text-slate-600">{sp ? `${sp.emoji} ${sp.name}` : "—"}</td>
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
        <AddCompany
          specialisms={specialisms}
          onClose={() => setAdding(false)}
          onSaved={(id, openIt) => {
            setAdding(false);
            if (openIt) router.push(`/crm/sales/view?id=${id}`);
            else load();
          }}
        />
      )}
    </div>
  );
}

function AddCompany({
  specialisms,
  onClose,
  onSaved,
}: {
  specialisms: Specialism[];
  onClose: () => void;
  onSaved: (id: string, open: boolean) => void;
}) {
  const [f, setF] = useState({
    name: "",
    website: "",
    phone: "",
    email: "",
    address: "",
    postcode: "",
    specialism_id: "",
    stage: "lead",
    estimated_value: "",
    source: "",
    contact_name: "",
    contact_title: "",
    contact_phone: "",
    contact_email: "",
    note: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setF((prev) => ({ ...prev, [k]: e.target.value }));

  async function save(open: boolean) {
    if (!f.name.trim()) return setError("Add the company name.");
    setBusy(true);
    setError(null);

    const { data: existing } = await supabase.from("crm_companies").select("id, name").ilike("name", f.name.trim()).limit(1);
    if (existing?.length && !window.confirm(`${existing[0].name} is already in the CRM. Add anyway?`)) {
      setBusy(false);
      return;
    }

    const { data, error: e } = await supabase
      .from("crm_companies")
      .insert({
        name: f.name.trim(),
        website: f.website.trim() || null,
        phone: f.phone.trim() || null,
        email: f.email.trim() || null,
        address: f.address.trim() || null,
        postcode: f.postcode.trim().toUpperCase() || null,
        specialism_id: f.specialism_id || null,
        stage: f.stage,
        estimated_value: f.estimated_value.trim() || null,
        source: f.source.trim() || null,
      })
      .select("id")
      .single();
    if (e || !data) {
      setBusy(false);
      return setError(e?.message || "Couldn't save the company.");
    }

    if (f.contact_name.trim()) {
      await supabase.from("crm_contacts").insert({
        company_id: data.id,
        name: f.contact_name.trim(),
        job_title: f.contact_title.trim() || null,
        phone: f.contact_phone.trim() || null,
        email: f.contact_email.trim() || null,
        is_primary: true,
      });
    }
    if (f.note.trim()) await supabase.from("crm_notes").insert({ company_id: data.id, kind: "note", body: f.note.trim() });

    setBusy(false);
    onSaved(data.id, open);
  }

  const input = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#F7931E] focus:outline-none focus:ring-2 focus:ring-[#F7931E]/30";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="Add company" onClick={(e) => e.stopPropagation()} className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white p-6 sm:max-w-2xl sm:rounded-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#1F3447]">Add company</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-full p-1.5 hover:bg-slate-100">
            <Icon name="x" className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-5 text-xs font-bold uppercase tracking-wider text-slate-400">Company</p>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <input className={`${input} sm:col-span-2`} placeholder="Company name" value={f.name} onChange={set("name")} autoFocus />
          <input className={input} placeholder="Website" value={f.website} onChange={set("website")} />
          <input className={input} placeholder="Main phone" value={f.phone} onChange={set("phone")} />
          <input className={input} placeholder="General email" value={f.email} onChange={set("email")} />
          <input className={input} placeholder="Postcode" value={f.postcode} onChange={set("postcode")} />
          <input className={`${input} sm:col-span-2`} placeholder="Address" value={f.address} onChange={set("address")} />
          <select className={input} value={f.specialism_id} onChange={set("specialism_id")} aria-label="Sector">
            <option value="">Sector (optional)</option>
            {specialisms.map((s) => (
              <option key={s.id} value={s.id}>
                {s.emoji} {s.name}
              </option>
            ))}
          </select>
          <select className={input} value={f.stage} onChange={set("stage")} aria-label="Stage">
            {COMPANY_STAGES.filter((s) => s.key !== "lost").map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
          <input className={input} placeholder="Estimated value, e.g. £20k a year" value={f.estimated_value} onChange={set("estimated_value")} />
          <input className={input} placeholder="Source, e.g. Apollo, referral" value={f.source} onChange={set("source")} />
        </div>

        <p className="mt-5 text-xs font-bold uppercase tracking-wider text-slate-400">Main contact</p>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <input className={input} placeholder="Name" value={f.contact_name} onChange={set("contact_name")} />
          <input className={input} placeholder="Job title, e.g. Operations Manager" value={f.contact_title} onChange={set("contact_title")} />
          <input className={input} placeholder="Phone" value={f.contact_phone} onChange={set("contact_phone")} />
          <input className={input} placeholder="Email" value={f.contact_email} onChange={set("contact_email")} />
          <textarea className={`${input} sm:col-span-2`} rows={3} placeholder="First note (optional)" value={f.note} onChange={set("note")} />
        </div>

        {f.stage === "client" && <p className="mt-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">Adding as a client also creates them in ReachConnect.</p>}
        {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button onClick={onClose} className="rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">
            Cancel
          </button>
          <button onClick={() => save(false)} disabled={busy} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-[#1F3447] hover:bg-slate-50 disabled:opacity-50">
            Save
          </button>
          <button onClick={() => save(true)} disabled={busy} className="rounded-lg bg-[#F7931E] px-4 py-2.5 text-sm font-semibold text-white hover:brightness-95 disabled:opacity-50">
            {busy ? "Saving…" : "Save and open"}
          </button>
        </div>
      </div>
    </div>
  );
}