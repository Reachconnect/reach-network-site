"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Icon, ukDate } from "../crm";

type Client = {
  id: string;
  name: string;
  fee_type: "percent" | "fixed";
  perm_fee_percent: number;
  perm_fee_fixed: number | null;
  rebate_weeks: number;
  payment_days: number;
  terms_signed_at: string | null;
  terms_review_date: string | null;
  terms_doc_path: string | null;
  reachconnect_client_id: string | null;
  won_at: string | null;
  crm_contacts: { name: string; is_primary: boolean }[];
};

const DAY = 24 * 60 * 60 * 1000;

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "unsigned" | "review" | "nodoc">("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    supabase
      .from("crm_companies")
      .select(
        "id, name, fee_type, perm_fee_percent, perm_fee_fixed, rebate_weeks, payment_days, terms_signed_at, terms_review_date, terms_doc_path, reachconnect_client_id, won_at, crm_contacts(name, is_primary)"
      )
      .eq("stage", "client")
      .order("name")
      .then(({ data, error: e }) => {
        if (e) setError(e.message);
        setClients((data ?? []) as Client[]);
        setLoading(false);
      });
  }, []);

  const reviewDue = (c: Client) => !!c.terms_review_date && new Date(c.terms_review_date).getTime() - Date.now() < 30 * DAY;

  const counts = {
    unsigned: clients.filter((c) => !c.terms_signed_at).length,
    review: clients.filter(reviewDue).length,
    nodoc: clients.filter((c) => !c.terms_doc_path).length,
  };

  const shown = useMemo(() => {
    const term = search.trim().toLowerCase();
    return clients.filter((c) => {
      if (filter === "unsigned" && c.terms_signed_at) return false;
      if (filter === "review" && !reviewDue(c)) return false;
      if (filter === "nodoc" && c.terms_doc_path) return false;
      return !term || c.name.toLowerCase().includes(term);
    });
  }, [clients, filter, search]);

  const tabs: [typeof filter, string, number | null][] = [
    ["all", "All clients", clients.length],
    ["unsigned", "Not signed", counts.unsigned],
    ["review", "Review due", counts.review],
    ["nodoc", "No document", counts.nodoc],
  ];

  return (
    <div className="mx-auto max-w-7xl p-5 lg:p-8">
      <h1 className="text-3xl font-bold text-[#1F3447]">Clients and terms</h1>
      <p className="mt-1 text-slate-500">Every client and what you&apos;ve agreed with them. Move a company to Client in the sales pipeline to add it here.</p>

      {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <div className="mt-5 flex flex-wrap items-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
        <div className="flex flex-wrap gap-1">
          {tabs.map(([key, label, n]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold ${filter === key ? "bg-[#1F3447] text-white" : "text-slate-600 hover:bg-slate-100"}`}
            >
              {label}
              {!!n && key !== "all" && <span className="rounded-full bg-red-500 px-1.5 text-[11px] text-white">{n}</span>}
            </button>
          ))}
        </div>
        <div className="relative ml-auto min-w-[12rem]">
          <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search clients" className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm" />
        </div>
      </div>

      <div className="mt-5 overflow-x-auto rounded-2xl bg-white shadow-sm">
        {loading ? (
          <p className="p-10 text-center text-slate-500">Loading…</p>
        ) : shown.length === 0 ? (
          <p className="p-10 text-center text-slate-500">{clients.length ? "Nothing matches this filter." : "No clients yet."}</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="p-3">Client</th>
                <th className="p-3">Main contact</th>
                <th className="p-3">Perm fee</th>
                <th className="p-3">Rebate</th>
                <th className="p-3">Payment</th>
                <th className="p-3">Signed</th>
                <th className="p-3">Review</th>
                <th className="p-3">Document</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {shown.map((c) => {
                const contact = c.crm_contacts.find((x) => x.is_primary) ?? c.crm_contacts[0];
                return (
                  <tr key={c.id} onClick={() => router.push(`/crm/sales/view?id=${c.id}`)} className="cursor-pointer hover:bg-slate-50">
                    <td className="p-3">
                      <span className="font-semibold text-[#1F3447]">{c.name}</span>
                      {c.reachconnect_client_id && <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-600">ReachConnect</span>}
                    </td>
                    <td className="p-3 text-slate-600">{contact?.name || "—"}</td>
                    <td className="p-3 text-slate-700">
                      {c.fee_type === "fixed" ? (c.perm_fee_fixed ? `£${Number(c.perm_fee_fixed).toLocaleString("en-GB")}` : "Fixed") : `${Number(c.perm_fee_percent)}%`}
                    </td>
                    <td className="p-3 text-slate-700">{c.rebate_weeks} weeks</td>
                    <td className="p-3 text-slate-700">{c.payment_days} days</td>
                    <td className="p-3">
                      {c.terms_signed_at ? (
                        <span className="font-semibold text-green-700">{ukDate(c.terms_signed_at)}</span>
                      ) : (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">Not signed</span>
                      )}
                    </td>
                    <td className={`p-3 ${reviewDue(c) ? "font-semibold text-amber-600" : "text-slate-600"}`}>{c.terms_review_date ? ukDate(c.terms_review_date) : "—"}</td>
                    <td className="p-3">
                      {c.terms_doc_path ? <Icon name="check" className="h-4 w-4 text-green-600" /> : <span className="text-xs text-slate-400">Missing</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}