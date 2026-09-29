"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useRewardsUser, rewardsApi } from "@/lib/useRewardsUser";
import RewardsHeader, { Loading } from "@/app/components/rewards/RewardsHeader";
import OffersAdmin from "@/app/components/rewards/OffersAdmin";

type CompanyRow = {
  company_id: string;
  name: string;
  contact_name: string | null;
  contact_email: string | null;
  is_active: boolean;
  created_at: string;
  employees: number;
  admins: number;
  pending_invites: number;
};

export default function RewardsAdminPage() {
  const { me, loading, signOut } = useRewardsUser("agency");
  const [tab, setTab] = useState<"companies" | "offers">("companies");

  if (loading || !me) return <Loading />;

  return (
    <div className="min-h-screen bg-slate-50">
      <RewardsHeader me={me} onSignOut={signOut} />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-bold text-[#0F2438]">Reach admin</h1>

        <div className="mb-8 mt-5 flex gap-1 border-b border-slate-200">
          {(["companies", "offers"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold ${
                tab === t ? "border-[#F7931E] text-[#0F2438]" : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              {t === "companies" ? "Companies" : "Offers"}
            </button>
          ))}
        </div>

        {tab === "companies" ? <Companies /> : <OffersAdmin />}
      </main>
    </div>
  );
}

function Companies() {
  const [rows, setRows] = useState<CompanyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  async function load() {
    setLoading(true);
    const { data, error: loadError } = await supabase.from("reward_company_stats").select("*").order("name");
    if (loadError) setError(`Couldn't load companies: ${loadError.message}`);
    else setRows(data as CompanyRow[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function toggle(c: CompanyRow) {
    if (c.is_active && !confirm(`Switch off ${c.name}? All their staff will lose access to Reach Rewards straight away.`))
      return;
    const { error: updateError } = await supabase
      .from("reward_companies")
      .update({ is_active: !c.is_active })
      .eq("id", c.company_id);
    if (updateError) setError(`Couldn't update: ${updateError.message}`);
    else load();
  }

  const activeCompanies = rows.filter((r) => r.is_active);
  const totalStaff = activeCompanies.reduce((n, r) => n + Number(r.employees) + Number(r.admins), 0);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#0F2438]">Companies</h2>
          <p className="mt-1 text-sm text-slate-600">
            {activeCompanies.length} active companies, {totalStaff} client staff with access. Reach workers get access
            automatically.
          </p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="rounded-lg bg-[#F7931E] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#e2841a]"
        >
          Add company
        </button>
      </div>

      {notice && <p className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">{notice}</p>}
      {error && <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {loading ? (
        <p className="py-12 text-center text-sm text-slate-500">Loading companies…</p>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white py-12 text-center">
          <p className="text-sm text-slate-600">No companies yet. Add your first client so their staff can join.</p>
          <button onClick={() => setAddOpen(true)} className="mt-3 text-sm font-semibold text-[#F7931E] hover:underline">
            Add company
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-white ring-1 ring-slate-200">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-slate-200 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">Admin contact</th>
                <th className="px-4 py-3 font-medium">Staff</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((c) => (
                <tr key={c.company_id}>
                  <td className="px-4 py-3 font-semibold text-[#0F2438]">{c.name}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {c.contact_name}
                    <span className="block text-xs text-slate-400">{c.contact_email}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {Number(c.employees) + Number(c.admins)}
                    {Number(c.pending_invites) > 0 && (
                      <span className="block text-xs text-[#b8660b]">
                        {c.pending_invites} invite{Number(c.pending_invites) === 1 ? "" : "s"} pending
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        c.is_active ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {c.is_active ? "Active" : "Switched off"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/rewards/company?id=${c.company_id}`}
                        className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Manage staff
                      </Link>
                      <button
                        onClick={() => toggle(c)}
                        className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        {c.is_active ? "Switch off" : "Switch on"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {addOpen && (
        <AddCompany
          onClose={() => setAddOpen(false)}
          onAdded={(msg) => {
            setAddOpen(false);
            setNotice(msg);
            setError(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function AddCompany({ onClose, onAdded }: { onClose: () => void; onAdded: (msg: string) => void }) {
  const [name, setName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setError(null);
    setBusy(true);
    try {
      const res = await rewardsApi("/api/rewards/companies", { name, contactName, contactEmail });
      onAdded(
        res.hasPassword
          ? `${name} added. ${contactName} already has a login, so we've emailed them to log in and add their team.`
          : `${name} added. We've emailed ${contactName} a link to set their password and add their team.`
      );
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  const input =
    "w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-[#F7931E] focus:outline-none focus:ring-2 focus:ring-[#F7931E]/30";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#0F2438]/60 sm:items-center sm:p-4"
      onClick={() => !busy && onClose()}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        className="w-full rounded-t-2xl bg-white p-6 sm:max-w-md sm:rounded-2xl"
      >
        <h2 className="text-lg font-bold text-[#0F2438]">Add company</h2>
        <p className="mt-1 text-sm text-slate-600">
          The contact becomes the company&apos;s admin and gets an email to set up their team.
        </p>
        <div className="mt-5 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Company name</label>
            <input className={input} value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Contact name</label>
            <input className={input} value={contactName} onChange={(e) => setContactName(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Contact email</label>
            <input
              type="email"
              className={input}
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
            />
          </div>
        </div>
        {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={busy}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={busy}
            className="rounded-lg bg-[#F7931E] px-5 py-2 text-sm font-semibold text-white hover:bg-[#e2841a] disabled:opacity-60"
          >
            {busy ? "Adding…" : "Add company and send invite"}
          </button>
        </div>
      </div>
    </div>
  );
}