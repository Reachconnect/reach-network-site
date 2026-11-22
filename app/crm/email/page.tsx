"use client";

// Email campaigns: your lists and your campaigns
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { timeAgo } from "../crm";
import { mail, pct, type Stats } from "./mailApi";

type List = { id: string; name: string; description: string | null; created_at: string; contact_count: number };
type Campaign = { id: string; name: string; subject: string; status: string; list_id: string | null; created_at: string; started_at: string | null; stats: Stats | null };

const STATUS: Record<string, { label: string; tone: string }> = {
  draft: { label: "Draft", tone: "bg-slate-100 text-slate-600" },
  sending: { label: "Sending", tone: "bg-amber-100 text-amber-800" },
  stopped: { label: "Paused", tone: "bg-slate-200 text-slate-700" },
  sent: { label: "Sent", tone: "bg-green-100 text-green-800" },
};

export default function EmailPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"campaigns" | "lists">("campaigns");
  const [lists, setLists] = useState<List[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [info, setInfo] = useState({ old_contacts: 0, suppressed: 0, sent_today: 0, daily_limit: 0 });
  const [loading, setLoading] = useState(true);
  const [newList, setNewList] = useState<{ name: string; description: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const j = await mail("GET", "?view=overview");
      setLists(j.lists);
      setCampaigns(j.campaigns);
      setInfo({ old_contacts: j.old_contacts, suppressed: j.suppressed, sent_today: j.sent_today, daily_limit: j.daily_limit });
    } catch (e) {
      setError((e as Error).message);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function createCampaign() {
    setBusy(true);
    try {
      const j = await mail("POST", {
        action: "campaign_save",
        name: "New campaign",
        list_id: lists[0]?.id || null,
        subject: "",
        body: "Hi {first_name},\n\n\n\nKind regards,\nDarren Rowell\nReach Network Recruitment",
      });
      router.push(`/crm/email/campaign?id=${j.id}`);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  async function createList() {
    if (!newList?.name.trim()) return;
    setBusy(true);
    try {
      const j = await mail("POST", { action: "list_create", ...newList });
      router.push(`/crm/email/list?id=${j.list.id}`);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  async function importOld() {
    if (!window.confirm(`Bring ${info.old_contacts} contacts across from the old admin dashboard? Each tag becomes its own list. Anyone who unsubscribed or bounced there stays blocked.`)) return;
    setBusy(true);
    try {
      const j = await mail("POST", { action: "import_old" });
      setMessage(`Done: ${j.saved} contacts into ${j.lists} list${j.lists === 1 ? "" : "s"}. ${j.suppressed} blocked addresses carried over.`);
      setTab("lists");
      load();
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(false);
  }

  const listName = (id: string | null) => lists.find((l) => l.id === id)?.name || "No list chosen";
  const tabBtn = (t: typeof tab, label: string) => (
    <button onClick={() => setTab(t)} className={`rounded-lg px-4 py-2 text-sm font-semibold ${tab === t ? "bg-[#1F3447] text-white" : "text-slate-600 hover:bg-slate-100"}`}>
      {label}
    </button>
  );

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1F3447]">Email campaigns</h1>
          <p className="text-sm text-slate-500">
            Sent from darrenrowell@reachnetworkrec.com. Sent today: {info.sent_today} of {info.daily_limit || "…"} a day.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setNewList({ name: "", description: "" })} className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-[#1F3447]">
            + New list
          </button>
          <button onClick={createCampaign} disabled={busy} className="rounded-lg bg-[#F7931E] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
            + New campaign
          </button>
        </div>
      </div>

      {error && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {message && <p className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-800">{message}</p>}

      {info.old_contacts > 0 && !lists.some((l) => l.name.startsWith("Old")) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <span>You have {info.old_contacts} contacts in the old admin dashboard.</span>
          <button onClick={importOld} disabled={busy} className="rounded-lg bg-amber-600 px-3 py-1.5 font-semibold text-white disabled:opacity-50">
            Bring them across
          </button>
        </div>
      )}

      {newList && (
        <div className="mb-4 rounded-2xl bg-white p-4 shadow-sm">
          <p className="mb-2 text-sm font-bold text-slate-800">New list</p>
          <div className="grid gap-2 sm:grid-cols-[1fr_2fr_auto]">
            <input autoFocus className="rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Name, e.g. Food manufacturers, Midlands" value={newList.name} onChange={(e) => setNewList({ ...newList, name: e.target.value })} />
            <input className="rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="What's it for? (optional)" value={newList.description} onChange={(e) => setNewList({ ...newList, description: e.target.value })} />
            <div className="flex gap-2">
              <button onClick={createList} disabled={busy || !newList.name.trim()} className="rounded-lg bg-[#F7931E] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                Create
              </button>
              <button onClick={() => setNewList(null)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-4 flex gap-2">
        {tabBtn("campaigns", `Campaigns (${campaigns.length})`)}
        {tabBtn("lists", `Lists (${lists.length})`)}
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : tab === "campaigns" ? (
        !campaigns.length ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
            <p className="text-lg font-semibold text-[#1F3447]">No campaigns yet</p>
            <p className="mt-1 text-sm text-slate-500">{lists.length ? "Click New campaign to write your first one." : "Start with a list: click New list and upload a spreadsheet."}</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-500">
                <tr>
                  <th className="px-4 py-3">Campaign</th>
                  <th className="hidden px-4 py-3 md:table-cell">List</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Sent</th>
                  <th className="px-4 py-3 text-right">Opened</th>
                  <th className="px-4 py-3 text-right">Clicked</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {campaigns.map((c) => {
                  const st = STATUS[c.status] || STATUS.draft;
                  return (
                    <tr key={c.id} onClick={() => router.push(`/crm/email/campaign?id=${c.id}`)} className="cursor-pointer hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-800">{c.name}</p>
                        <p className="text-xs text-slate-500">{c.subject || "No subject yet"} · {timeAgo(c.started_at || c.created_at)}</p>
                      </td>
                      <td className="hidden px-4 py-3 text-slate-600 md:table-cell">{listName(c.list_id)}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${st.tone}`}>{st.label}</span>
                      </td>
                      <td className="px-4 py-3 text-right">{c.stats ? c.stats.sent : "–"}</td>
                      <td className="px-4 py-3 text-right">{c.stats ? pct(c.stats.opened, c.stats.sent) : "–"}</td>
                      <td className="px-4 py-3 text-right font-semibold text-[#F7931E]">{c.stats ? `${c.stats.clicked} (${pct(c.stats.clicked, c.stats.sent)})` : "–"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      ) : !lists.length ? (
        <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
          <p className="text-lg font-semibold text-[#1F3447]">No lists yet</p>
          <p className="mt-1 text-sm text-slate-500">Each list is kept separate, so people only get the emails meant for them. Click New list to start.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lists.map((l) => (
            <Link key={l.id} href={`/crm/email/list?id=${l.id}`} className="rounded-2xl bg-white p-5 shadow-sm hover:ring-2 hover:ring-[#F7931E]/40">
              <p className="font-semibold text-slate-800">{l.name}</p>
              {l.description && <p className="mt-0.5 text-xs text-slate-500">{l.description}</p>}
              <p className="mt-3 text-2xl font-bold text-[#1F3447]">{l.contact_count.toLocaleString()}</p>
              <p className="text-xs text-slate-500">contacts</p>
            </Link>
          ))}
        </div>
      )}

      {info.suppressed > 0 && <p className="mt-6 text-xs text-slate-400">{info.suppressed} addresses have unsubscribed or bounced. They&apos;re never emailed, whichever list they&apos;re on.</p>}
    </div>
  );
}
