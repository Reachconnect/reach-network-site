"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Icon, ukDate } from "./crm";

type Terms = {
  fee_type: "percent" | "fixed";
  perm_fee_percent: number;
  perm_fee_fixed: number | null;
  rebate_weeks: number;
  rebate_notes: string | null;
  payment_days: number;
  terms_signed_at: string | null;
  terms_signed_by: string | null;
  terms_review_date: string | null;
  terms_doc_path: string | null;
  terms_doc_filename: string | null;
  terms_notes: string | null;
};

const FIELDS =
  "fee_type, perm_fee_percent, perm_fee_fixed, rebate_weeks, rebate_notes, payment_days, terms_signed_at, terms_signed_by, terms_review_date, terms_doc_path, terms_doc_filename, terms_notes";

const money = (n: number) => n.toLocaleString("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 });

export default function TermsCard({ companyId, companyName }: { companyId: string; companyName: string }) {
  const [t, setT] = useState<Terms | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Partial<Terms>>({});
  const [salary, setSalary] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data, error: e } = await supabase.from("crm_companies").select(FIELDS).eq("id", companyId).single();
    if (e) setError(e.message);
    setT(data as Terms);
  }, [companyId]);

  useEffect(() => {
    load();
  }, [load]);

  async function save(patch: Partial<Terms>) {
    setBusy(true);
    setError(null);
    const { error: e } = await supabase.from("crm_companies").update(patch).eq("id", companyId);
    setBusy(false);
    if (e) return setError(`That didn't save: ${e.message}`);
    await load();
  }

  async function saveEdit() {
    const clean: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(draft)) {
      if (["perm_fee_percent", "perm_fee_fixed", "rebate_weeks", "payment_days"].includes(k)) {
        clean[k] = v === "" || v === null ? null : Number(v);
      } else clean[k] = typeof v === "string" ? v.trim() || null : v;
    }
    if (clean.perm_fee_percent === null) clean.perm_fee_percent = 10;
    if (clean.rebate_weeks === null) clean.rebate_weeks = 8;
    if (clean.payment_days === null) clean.payment_days = 30;
    await save(clean as Partial<Terms>);
    setEditing(false);
    setDraft({});
  }

  async function markSigned() {
    const by = window.prompt(`Who signed the terms for ${companyName}? (optional)`, t?.terms_signed_by || "");
    if (by === null) return;
    const review = new Date();
    review.setFullYear(review.getFullYear() + 1);
    await save({
      terms_signed_at: new Date().toISOString().slice(0, 10),
      terms_signed_by: by.trim() || null,
      terms_review_date: t?.terms_review_date || review.toISOString().slice(0, 10),
    });
  }

  async function uploadDoc(file: File) {
    setBusy(true);
    const path = `${companyId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]+/g, "-")}`;
    const { error: e } = await supabase.storage.from("crm-terms").upload(path, file);
    if (e) {
      setBusy(false);
      return setError(`Upload failed: ${e.message}`);
    }
    if (t?.terms_doc_path) await supabase.storage.from("crm-terms").remove([t.terms_doc_path]);
    await save({ terms_doc_path: path, terms_doc_filename: file.name });
  }

  async function openDoc() {
    if (!t?.terms_doc_path) return;
    const { data, error: e } = await supabase.storage.from("crm-terms").createSignedUrl(t.terms_doc_path, 600);
    if (e || !data) return setError("Couldn't open the document.");
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  if (!t) return null;

  const val = <K extends keyof Terms>(k: K) => (draft[k] !== undefined ? draft[k] : t[k]) as Terms[K];
  const set = (k: keyof Terms) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setDraft((d) => ({ ...d, [k]: e.target.value }));
  const input = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#F7931E] focus:outline-none focus:ring-2 focus:ring-[#F7931E]/30";

  const feeText = t.fee_type === "fixed" ? (t.perm_fee_fixed ? `${money(Number(t.perm_fee_fixed))} fixed fee` : "Fixed fee (amount not set)") : `${Number(t.perm_fee_percent)}% of first-year salary`;
  const salaryNum = Number(salary.replace(/[^0-9.]/g, "")) || 0;
  const fee = t.fee_type === "fixed" ? Number(t.perm_fee_fixed || 0) : (salaryNum * Number(t.perm_fee_percent)) / 100;
  const reviewSoon = t.terms_review_date && new Date(t.terms_review_date).getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000;

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold text-[#1F3447]">
          <Icon name="handshake" className="h-5 w-5" /> Agreed terms
        </h2>
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
            <button onClick={saveEdit} disabled={busy} className="rounded-lg bg-[#F7931E] px-3 py-1 text-sm font-semibold text-white disabled:opacity-50">
              Save
            </button>
          </div>
        ) : (
          <button onClick={() => setEditing(true)} className="text-sm font-semibold text-[#F7931E] hover:underline">
            Edit
          </button>
        )}
      </div>

      {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {editing ? (
        <div className="mt-3 space-y-3">
          <label className="block">
            <span className="text-xs font-semibold text-slate-500">Perm fee type</span>
            <select className={`mt-1 ${input}`} value={val("fee_type")} onChange={set("fee_type")}>
              <option value="percent">Percentage of first-year salary</option>
              <option value="fixed">Fixed fee</option>
            </select>
          </label>
          {val("fee_type") === "fixed" ? (
            <label className="block">
              <span className="text-xs font-semibold text-slate-500">Fixed fee (£)</span>
              <input className={`mt-1 ${input}`} inputMode="decimal" value={String(val("perm_fee_fixed") ?? "")} onChange={set("perm_fee_fixed")} />
            </label>
          ) : (
            <label className="block">
              <span className="text-xs font-semibold text-slate-500">Fee (% of salary)</span>
              <input className={`mt-1 ${input}`} inputMode="decimal" value={String(val("perm_fee_percent") ?? "")} onChange={set("perm_fee_percent")} />
            </label>
          )}
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="text-xs font-semibold text-slate-500">Rebate (weeks)</span>
              <input className={`mt-1 ${input}`} inputMode="numeric" value={String(val("rebate_weeks") ?? "")} onChange={set("rebate_weeks")} />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-500">Payment (days)</span>
              <input className={`mt-1 ${input}`} inputMode="numeric" value={String(val("payment_days") ?? "")} onChange={set("payment_days")} />
            </label>
          </div>
          <label className="block">
            <span className="text-xs font-semibold text-slate-500">Rebate notes</span>
            <input className={`mt-1 ${input}`} value={val("rebate_notes") ?? ""} onChange={set("rebate_notes")} placeholder="e.g. Full replacement or sliding refund" />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="text-xs font-semibold text-slate-500">Signed on</span>
              <input type="date" className={`mt-1 ${input}`} value={val("terms_signed_at") ?? ""} onChange={set("terms_signed_at")} />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-500">Review date</span>
              <input type="date" className={`mt-1 ${input}`} value={val("terms_review_date") ?? ""} onChange={set("terms_review_date")} />
            </label>
          </div>
          <label className="block">
            <span className="text-xs font-semibold text-slate-500">Signed by</span>
            <input className={`mt-1 ${input}`} value={val("terms_signed_by") ?? ""} onChange={set("terms_signed_by")} />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-slate-500">Notes</span>
            <textarea rows={3} className={`mt-1 ${input}`} value={val("terms_notes") ?? ""} onChange={set("terms_notes")} placeholder="Anything special you've agreed" />
          </label>
        </div>
      ) : (
        <>
          <dl className="mt-3 space-y-2.5 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Perm fee</dt>
              <dd className="text-right font-semibold text-[#1F3447]">{feeText}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Rebate</dt>
              <dd className="text-right font-semibold text-[#1F3447]">
                {t.rebate_weeks} weeks
                {t.rebate_notes && <span className="block text-xs font-normal text-slate-500">{t.rebate_notes}</span>}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Payment</dt>
              <dd className="text-right font-semibold text-[#1F3447]">{t.payment_days} days from invoice</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Signed</dt>
              <dd className="text-right">
                {t.terms_signed_at ? (
                  <span className="font-semibold text-green-700">
                    {ukDate(t.terms_signed_at)}
                    {t.terms_signed_by && <span className="block text-xs font-normal text-slate-500">by {t.terms_signed_by}</span>}
                  </span>
                ) : (
                  <span className="font-semibold text-red-600">Not signed yet</span>
                )}
              </dd>
            </div>
            {t.terms_review_date && (
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Review</dt>
                <dd className={`text-right font-semibold ${reviewSoon ? "text-amber-600" : "text-[#1F3447]"}`}>{ukDate(t.terms_review_date)}</dd>
              </div>
            )}
          </dl>
          {t.terms_notes && <p className="mt-3 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{t.terms_notes}</p>}

          {!t.terms_signed_at && (
            <button onClick={markSigned} disabled={busy} className="mt-4 w-full rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50">
              Mark terms as signed today
            </button>
          )}

          {/* Signed document */}
          <div className="mt-4 border-t border-slate-100 pt-4">
            {t.terms_doc_path ? (
              <button onClick={openDoc} className="flex w-full items-center gap-2 rounded-lg border border-slate-200 p-3 text-left text-sm hover:bg-slate-50">
                <Icon name="file" className="h-5 w-5 text-[#F7931E]" />
                <span className="min-w-0 flex-1 truncate font-semibold text-[#1F3447]">{t.terms_doc_filename || "Signed terms"}</span>
                <span className="text-xs text-slate-500">Open</span>
              </button>
            ) : (
              <p className="text-sm text-slate-500">No signed terms document uploaded.</p>
            )}
            <label className="mt-2 inline-block cursor-pointer text-sm font-semibold text-[#F7931E] hover:underline">
              {busy ? "Working…" : t.terms_doc_path ? "Replace document" : "Upload signed terms"}
              <input type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" className="hidden" onChange={(e) => e.target.files?.[0] && uploadDoc(e.target.files[0])} />
            </label>
          </div>

          {/* Fee calculator */}
          <div className="mt-4 rounded-xl bg-slate-50 p-3">
            <p className="text-xs font-semibold text-slate-500">Fee calculator</p>
            {t.fee_type === "percent" && (
              <input
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                inputMode="decimal"
                placeholder="Salary, e.g. 38000"
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            )}
            {fee > 0 && (
              <p className="mt-2 text-sm text-slate-700">
                Fee <span className="font-bold text-[#1F3447]">{money(fee)}</span>, plus VAT {money(fee * 0.2)}, total{" "}
                <span className="font-bold text-[#1F3447]">{money(fee * 1.2)}</span>
              </p>
            )}
          </div>
        </>
      )}
    </section>
  );
}