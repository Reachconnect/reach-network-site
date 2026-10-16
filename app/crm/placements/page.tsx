"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Icon } from "../crm";
import { isoDate, money, niceDate, type Placement } from "../jobs/jobsShared";

type Tab = "to_invoice" | "awaiting" | "overdue" | "paid" | "fell_through" | "all";

export default function PlacementsPage() {
  const [rows, setRows] = useState<Placement[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("to_invoice");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data, error: e } = await supabase.from("crm_placements").select("*").order("start_date", { ascending: false }).limit(2000);
    if (e) setError(e.message);
    setRows((data ?? []) as Placement[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const today = isoDate(new Date());
  const monthStart = today.slice(0, 8) + "01";
  const live = rows.filter((r) => r.status !== "fell_through");
  const overdue = rows.filter((r) => r.status === "invoiced" && r.invoice_due_date < today);

  const totals = {
    month: live.filter((r) => r.start_date >= monthStart).reduce((s, r) => s + Number(r.fee_amount), 0),
    toInvoice: rows.filter((r) => r.status === "placed").reduce((s, r) => s + Number(r.total_amount), 0),
    awaiting: rows.filter((r) => r.status === "invoiced").reduce((s, r) => s + Number(r.total_amount), 0),
    overdue: overdue.reduce((s, r) => s + Number(r.total_amount), 0),
  };

  const shown = useMemo(() => {
    switch (tab) {
      case "to_invoice":
        return rows.filter((r) => r.status === "placed");
      case "awaiting":
        return rows.filter((r) => r.status === "invoiced");
      case "overdue":
        return overdue;
      case "paid":
        return rows.filter((r) => r.status === "paid");
      case "fell_through":
        return rows.filter((r) => r.status === "fell_through");
      default:
        return rows;
    }
  }, [rows, tab, overdue]);

  async function markInvoiced(p: Placement) {
    const number = window.prompt(`Invoice number for ${p.company_name} (optional)`, p.invoice_number || "");
    if (number === null) return;
    await supabase.from("crm_placements").update({ status: "invoiced", invoice_number: number.trim() || null, invoiced_at: today }).eq("id", p.id);
    load();
  }

  async function markPaid(p: Placement) {
    if (!window.confirm(`Mark ${money(p.total_amount, true)} from ${p.company_name} as paid?`)) return;
    await supabase.from("crm_placements").update({ status: "paid", paid_at: today }).eq("id", p.id);
    load();
  }

  async function fellThrough(p: Placement) {
    if (!window.confirm(`Mark ${p.candidate_name}'s placement at ${p.company_name} as fallen through? It won't count towards your fees.`)) return;
    await supabase.from("crm_placements").update({ status: "fell_through" }).eq("id", p.id);
    load();
  }

  const tabs: [Tab, string, number][] = [
    ["to_invoice", "To invoice", rows.filter((r) => r.status === "placed").length],
    ["awaiting", "Awaiting payment", rows.filter((r) => r.status === "invoiced").length],
    ["overdue", "Overdue", overdue.length],
    ["paid", "Paid", rows.filter((r) => r.status === "paid").length],
    ["fell_through", "Fell through", rows.filter((r) => r.status === "fell_through").length],
    ["all", "All", rows.length],
  ];

  const STATUS: Record<string, { text: string; cls: string }> = {
    placed: { text: "To invoice", cls: "bg-amber-100 text-amber-700" },
    invoiced: { text: "Invoiced", cls: "bg-blue-50 text-blue-700" },
    paid: { text: "Paid", cls: "bg-green-100 text-green-700" },
    fell_through: { text: "Fell through", cls: "bg-slate-100 text-slate-500" },
  };

  return (
    <div className="mx-auto max-w-7xl p-5 lg:p-8">
      <h1 className="text-3xl font-bold text-[#1F3447]">Placements</h1>
      <p className="mt-1 text-slate-500">Every perm placement, its fee, and whether it&apos;s been invoiced and paid.</p>

      {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Fees this month", totals.month, "text-green-700", "Before VAT, by start date"],
          ["To invoice", totals.toInvoice, "text-amber-600", "Including VAT"],
          ["Awaiting payment", totals.awaiting, "text-[#1F3447]", "Including VAT"],
          ["Overdue", totals.overdue, totals.overdue ? "text-red-600" : "text-[#1F3447]", "Past their due date"],
        ].map(([label, value, cls, hint]) => (
          <div key={label as string} className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">{label}</p>
            <p className={`mt-1 text-2xl font-bold ${cls}`}>{money(value as number)}</p>
            <p className="text-xs text-slate-400">{hint}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap gap-1 rounded-2xl bg-white p-3 shadow-sm">
        {tabs.map(([key, label, n]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold ${tab === key ? "bg-[#1F3447] text-white" : "text-slate-600 hover:bg-slate-100"}`}
          >
            {label}
            {n > 0 && key !== "all" && <span className={`rounded-full px-1.5 text-[11px] ${key === "overdue" ? "bg-red-500 text-white" : "bg-slate-200 text-slate-700"}`}>{n}</span>}
          </button>
        ))}
      </div>

      <div className="mt-5 overflow-x-auto rounded-2xl bg-white shadow-sm">
        {loading ? (
          <p className="p-10 text-center text-slate-500">Loading…</p>
        ) : shown.length === 0 ? (
          <p className="p-10 text-center text-slate-500">{rows.length ? "Nothing here." : "No placements yet. Drag a candidate to Placed on a job's shortlist."}</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="p-3">Candidate</th>
                <th className="p-3">Client and job</th>
                <th className="p-3">Starts</th>
                <th className="p-3">Fee</th>
                <th className="p-3">Invoice total</th>
                <th className="p-3">Due</th>
                <th className="p-3">Rebate ends</th>
                <th className="p-3">Status</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {shown.map((p) => {
                const late = p.status === "invoiced" && p.invoice_due_date < today;
                const inRebate = p.status !== "fell_through" && p.rebate_end_date >= today && p.start_date <= today;
                return (
                  <tr key={p.id}>
                    <td className="p-3">
                      {p.candidate_id ? (
                        <Link href={`/crm/candidates/view?id=${p.candidate_id}`} className="font-semibold text-[#1F3447] hover:underline">
                          {p.candidate_name}
                        </Link>
                      ) : (
                        <span className="font-semibold text-[#1F3447]">{p.candidate_name}</span>
                      )}
                    </td>
                    <td className="p-3 text-slate-600">
                      {p.company_id ? (
                        <Link href={`/crm/sales/view?id=${p.company_id}`} className="hover:underline">
                          {p.company_name}
                        </Link>
                      ) : (
                        p.company_name
                      )}
                      <span className="block text-xs text-slate-400">{p.job_title}</span>
                    </td>
                    <td className="p-3 text-slate-600">{niceDate(p.start_date)}</td>
                    <td className="p-3 font-semibold text-[#1F3447]">{money(p.fee_amount, true)}</td>
                    <td className="p-3 text-slate-600">
                      {money(p.total_amount, true)}
                      {p.invoice_number && <span className="block text-xs text-slate-400">#{p.invoice_number}</span>}
                    </td>
                    <td className={`p-3 ${late ? "font-semibold text-red-600" : "text-slate-600"}`}>{niceDate(p.invoice_due_date)}</td>
                    <td className={`p-3 ${inRebate ? "font-semibold text-amber-600" : "text-slate-600"}`}>{niceDate(p.rebate_end_date)}</td>
                    <td className="p-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${late ? "bg-red-100 text-red-700" : STATUS[p.status].cls}`}>{late ? "Overdue" : STATUS[p.status].text}</span>
                    </td>
                    <td className="p-3">
                      <div className="flex justify-end gap-1.5">
                        {p.status === "placed" && (
                          <button onClick={() => markInvoiced(p)} className="rounded-lg bg-[#1F3447] px-3 py-1.5 text-xs font-semibold text-white">
                            Mark invoiced
                          </button>
                        )}
                        {p.status === "invoiced" && (
                          <button onClick={() => markPaid(p)} className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white">
                            Mark paid
                          </button>
                        )}
                        {["placed", "invoiced"].includes(p.status) && (
                          <button onClick={() => fellThrough(p)} title="Fell through" aria-label="Fell through" className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600">
                            <Icon name="x" className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      <p className="mt-3 text-xs text-slate-500">Rebate dates in orange mean they&apos;re still inside the rebate period.</p>
    </div>
  );
}