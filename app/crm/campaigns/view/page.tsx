"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { candidateName, ukDateTime } from "../../crm";

type Campaign = {
  id: string;
  name: string;
  template_name: string;
  template_body: string | null;
  status: string;
  total: number;
  sent_count: number;
  failed_count: number;
  replied_count: number;
  created_at: string;
};
type Recipient = {
  id: string;
  status: string;
  error: string | null;
  sent_at: string | null;
  replied_at: string | null;
  reply_text: string | null;
  candidate_id: string | null;
  crm_candidates: { first_name: string; last_name: string | null } | null;
};

const STATUS: Record<string, { text: string; cls: string }> = {
  queued: { text: "Waiting", cls: "bg-slate-100 text-slate-600" },
  sent: { text: "Sent", cls: "bg-blue-50 text-blue-700" },
  failed: { text: "Failed", cls: "bg-red-100 text-red-700" },
  replied: { text: "Replied", cls: "bg-green-100 text-green-700" },
};

export default function CampaignViewPage() {
  return (
    <Suspense fallback={<p className="p-8 text-slate-500">Loading…</p>}>
      <CampaignView />
    </Suspense>
  );
}

function CampaignView() {
  const id = useSearchParams().get("id") || "";
  const [c, setC] = useState<Campaign | null>(null);
  const [rows, setRows] = useState<Recipient[]>([]);
  const [filter, setFilter] = useState("all");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [camp, rec] = await Promise.all([
      supabase.from("crm_campaigns").select("*").eq("id", id).maybeSingle(),
      supabase
        .from("crm_campaign_recipients")
        .select("id, status, error, sent_at, replied_at, reply_text, candidate_id, crm_candidates(first_name, last_name)")
        .eq("campaign_id", id)
        .order("replied_at", { ascending: false, nullsFirst: false }),
    ]);
    setC(camp.data as Campaign);
    setRows((rec.data ?? []) as unknown as Recipient[]);
  }, [id]);

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [load]);

  async function continueSending() {
    setBusy(true);
    setMessage(null);
    const { data } = await supabase.auth.getSession();
    try {
      for (let guard = 0; guard < 200; guard++) {
        const res = await fetch("/api/crm/campaigns/send", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session?.access_token ?? ""}` },
          body: JSON.stringify({ campaignId: id }),
        });
        const j = await res.json();
        if (!res.ok) throw new Error(j.error || "Couldn't send.");
        await load();
        if (j.limitReached) {
          setMessage("Paused again at today's limit. Try again tomorrow.");
          break;
        }
        if (j.remaining === 0 || j.sent + j.failed === 0) break;
      }
    } catch (e) {
      setMessage((e as Error).message);
    }
    setBusy(false);
  }

  if (!c) return <p className="p-8 text-slate-500">Loading…</p>;

  const queued = rows.filter((r) => r.status === "queued").length;
  const shown = filter === "all" ? rows : rows.filter((r) => r.status === filter);

  return (
    <div className="mx-auto max-w-6xl p-5 lg:p-8">
      <Link href="/crm/campaigns" className="text-sm font-medium text-slate-500 hover:text-[#1F3447]">
        ‹ Campaigns
      </Link>
      <h1 className="mt-2 text-3xl font-bold text-[#1F3447]">{c.name}</h1>
      <p className="mt-1 text-slate-500">
        {c.template_name}, created {ukDateTime(c.created_at)}
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-4">
        {[
          ["Recipients", c.total, "text-[#1F3447]"],
          ["Delivered", c.sent_count, "text-[#1F3447]"],
          ["Replied", c.replied_count, "text-green-700"],
          ["Failed", c.failed_count, c.failed_count ? "text-red-600" : "text-[#1F3447]"],
        ].map(([label, n, cls]) => (
          <div key={label as string} className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">{label}</p>
            <p className={`mt-1 text-2xl font-bold ${cls}`}>{n}</p>
          </div>
        ))}
      </div>

      {queued > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl bg-amber-50 p-4">
          <p className="flex-1 text-sm text-amber-800">
            {queued} still waiting to send, usually because of WhatsApp&apos;s daily limit.
          </p>
          <button onClick={continueSending} disabled={busy} className="rounded-lg bg-[#F7931E] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
            {busy ? "Sending…" : "Continue sending"}
          </button>
        </div>
      )}
      {message && <p className="mt-3 rounded-lg bg-slate-100 px-4 py-2 text-sm text-slate-700">{message}</p>}

      {c.template_body && (
        <div className="mt-4 rounded-2xl bg-white p-4 text-sm text-slate-600 shadow-sm">
          <p className="text-xs font-semibold text-slate-400">Template</p>
          <p className="mt-1 whitespace-pre-wrap">{c.template_body}</p>
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-1">
        {["all", "replied", "sent", "queued", "failed"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold capitalize ${filter === f ? "bg-[#1F3447] text-white" : "text-slate-600 hover:bg-slate-200"}`}
          >
            {f === "all" ? "Everyone" : f === "queued" ? "Waiting" : f}
          </button>
        ))}
      </div>

      <div className="mt-3 overflow-x-auto rounded-2xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="p-3">Candidate</th>
              <th className="p-3">Status</th>
              <th className="p-3">Their reply</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {shown.map((r) => (
              <tr key={r.id}>
                <td className="p-3">
                  {r.candidate_id && r.crm_candidates ? (
                    <Link href={`/crm/candidates/view?id=${r.candidate_id}`} className="font-semibold text-[#1F3447] hover:underline">
                      {candidateName(r.crm_candidates)}
                    </Link>
                  ) : (
                    <span className="text-slate-400">Deleted candidate</span>
                  )}
                </td>
                <td className="p-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${STATUS[r.status]?.cls}`}>{STATUS[r.status]?.text ?? r.status}</span>
                  {r.error && <p className="mt-1 text-xs text-red-600">{r.error}</p>}
                </td>
                <td className="p-3 text-slate-700">
                  {r.reply_text ? (
                    <>
                      <p className="whitespace-pre-wrap">{r.reply_text}</p>
                      {r.replied_at && <p className="text-xs text-slate-400">{ukDateTime(r.replied_at)}</p>}
                    </>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}