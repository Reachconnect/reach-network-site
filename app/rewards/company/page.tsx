"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useRewardsUser, rewardsApi } from "@/lib/useRewardsUser";
import RewardsHeader, { Loading } from "@/app/components/rewards/RewardsHeader";

type Member = {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  role: "admin" | "employee";
  is_active: boolean;
  accepted_at: string | null;
  created_at: string;
};

export default function CompanyDashboardPage() {
  const router = useRouter();
  const { me, loading, signOut } = useRewardsUser("companyAdmin");
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState("");

  useEffect(() => {
    if (!me) return;
    const requested = new URLSearchParams(window.location.search).get("id");
    const allowed = me.isAgency || (requested && me.adminOf.some((c) => c.id === requested));
    if (requested && allowed) setCompanyId(requested);
    else if (me.adminOf.length) setCompanyId(me.adminOf[0].id);
    else router.replace("/rewards/admin");
  }, [me, router]);

  useEffect(() => {
    if (!companyId) return;
    supabase
      .from("reward_companies")
      .select("name")
      .eq("id", companyId)
      .single()
      .then(({ data }) => data && setCompanyName(data.name));
  }, [companyId]);

  if (loading || !me || !companyId) return <Loading />;

  return (
    <div className="min-h-screen bg-slate-50">
      <RewardsHeader me={me} onSignOut={signOut} />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {me.isAgency && (
          <Link href="/rewards/admin" className="text-sm font-medium text-slate-500 hover:text-[#0F2438]">
            ← All companies
          </Link>
        )}
        <Team companyId={companyId} companyName={companyName} myUserId={me.userId} isAgency={me.isAgency} />
      </main>
    </div>
  );
}

function Team({
  companyId,
  companyName,
  myUserId,
  isAgency,
}: {
  companyId: string;
  companyName: string;
  myUserId: string;
  isAgency: boolean;
}) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data, error: loadError } = await supabase
      .from("reward_members")
      .select("id, user_id, full_name, email, role, is_active, accepted_at, created_at")
      .eq("company_id", companyId)
      .order("full_name");
    if (loadError) setError(`Couldn't load your team: ${loadError.message}`);
    else setMembers(data as Member[]);
    setLoading(false);
  }, [companyId]);

  useEffect(() => {
    load();
  }, [load]);

  async function act(m: Member, action: string, extra: Record<string, unknown>, okMessage: string) {
    setError(null);
    setNotice(null);
    setBusyId(m.id);
    try {
      await rewardsApi("/api/rewards/members", { action, memberId: m.id, ...extra });
      setNotice(okMessage);
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
    setBusyId(null);
  }

  const active = members.filter((m) => m.is_active);
  const joined = active.filter((m) => m.accepted_at).length;
  const pending = active.length - joined;

  const q = search.trim().toLowerCase();
  const shown = members.filter(
    (m) => !q || m.full_name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)
  );

  return (
    <>
      <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0F2438]">{companyName || "Your team"}</h1>
          <p className="mt-1 text-sm text-slate-600">
            {joined} joined{pending > 0 ? `, ${pending} waiting to set a password` : ""}. Everyone here can use Reach
            Rewards.
          </p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="rounded-lg bg-[#F7931E] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#e2841a]"
        >
          Add people
        </button>
      </div>

      {notice && <p className="mt-6 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">{notice}</p>}
      {error && <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {members.length > 8 && (
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email"
          className="mt-6 w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm focus:border-[#F7931E] focus:outline-none focus:ring-2 focus:ring-[#F7931E]/30 sm:w-80"
        />
      )}

      <div className="mt-6 overflow-hidden rounded-xl bg-white ring-1 ring-slate-200">
        {loading && <p className="py-12 text-center text-sm text-slate-500">Loading your team…</p>}

        {!loading && members.length <= 1 && (
          <div className="border-b border-slate-100 py-10 text-center">
            <p className="text-sm text-slate-600">Add your staff so they can start using their discounts.</p>
            <button onClick={() => setAddOpen(true)} className="mt-3 text-sm font-semibold text-[#F7931E] hover:underline">
              Add people
            </button>
          </div>
        )}

        {!loading && shown.length > 0 && (
          <ul className="divide-y divide-slate-100">
            {shown.map((m) => {
              const isMe = m.user_id === myUserId;
              const busy = busyId === m.id;
              return (
                <li
                  key={m.id}
                  className={`flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center ${!m.is_active ? "opacity-60" : ""}`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[#0F2438]">
                      {m.full_name}
                      {isMe && <span className="ml-2 text-xs font-normal text-slate-500">(you)</span>}
                    </p>
                    <p className="truncate text-sm text-slate-500">{m.email}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {m.role === "admin" && (
                      <span className="rounded-full bg-[#0F2438] px-2.5 py-1 text-xs font-medium text-white">Admin</span>
                    )}
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        !m.is_active
                          ? "bg-slate-100 text-slate-500"
                          : m.accepted_at
                          ? "bg-green-50 text-green-700"
                          : "bg-[#F7931E]/15 text-[#b8660b]"
                      }`}
                    >
                      {!m.is_active ? "Switched off" : m.accepted_at ? "Joined" : "Invite sent"}
                    </span>
                  </div>

                  {(!isMe || isAgency) && (
                    <div className="flex flex-wrap gap-2 sm:justify-end">
                      {m.is_active && !m.accepted_at && (
                        <Small disabled={busy} onClick={() => act(m, "resend", {}, `Invite sent again to ${m.email}.`)}>
                          Resend invite
                        </Small>
                      )}
                      {m.is_active && (
                        <Small
                          disabled={busy}
                          onClick={() =>
                            act(
                              m,
                              "set_role",
                              { role: m.role === "admin" ? "employee" : "admin" },
                              m.role === "admin" ? `${m.full_name} is no longer an admin.` : `${m.full_name} is now an admin.`
                            )
                          }
                        >
                          {m.role === "admin" ? "Remove admin" : "Make admin"}
                        </Small>
                      )}
                      <Small
                        disabled={busy}
                        onClick={() =>
                          act(
                            m,
                            m.is_active ? "deactivate" : "reactivate",
                            {},
                            m.is_active ? `${m.full_name} no longer has access.` : `${m.full_name} has access again.`
                          )
                        }
                      >
                        {m.is_active ? "Switch off" : "Switch on"}
                      </Small>
                      <Small
                        danger
                        disabled={busy}
                        onClick={() => {
                          if (confirm(`Remove ${m.full_name} from Reach Rewards?`))
                            act(m, "remove", {}, `${m.full_name} has been removed.`);
                        }}
                      >
                        Remove
                      </Small>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {addOpen && (
        <AddPeople
          companyId={companyId}
          onClose={() => setAddOpen(false)}
          onDone={(msg) => {
            setAddOpen(false);
            setNotice(msg);
            setError(null);
            load();
          }}
        />
      )}
    </>
  );
}

function Small({
  children,
  onClick,
  danger,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-md border px-3 py-1.5 text-xs font-medium disabled:opacity-50 ${
        danger ? "border-red-200 text-red-600 hover:bg-red-50" : "border-slate-300 text-slate-700 hover:bg-slate-50"
      }`}
    >
      {children}
    </button>
  );
}

function AddPeople({
  companyId,
  onClose,
  onDone,
}: {
  companyId: string;
  onClose: () => void;
  onDone: (msg: string) => void;
}) {
  const [mode, setMode] = useState<"one" | "list">("one");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [makeAdmin, setMakeAdmin] = useState(false);
  const [list, setList] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function addOne() {
    setError(null);
    setBusy(true);
    try {
      await rewardsApi("/api/rewards/members", {
        action: "invite",
        companyId,
        fullName,
        email,
        role: makeAdmin ? "admin" : "employee",
      });
      onDone(`Invite sent to ${email.trim()}.`);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  async function addList() {
    setError(null);
    const people = list
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const parts = line.split(/[,\t]/).map((p) => p.trim());
        const emailPart = parts.find((p) => p.includes("@")) || "";
        const namePart = parts.filter((p) => p !== emailPart).join(" ").trim();
        return { fullName: namePart, email: emailPart, line };
      });

    if (people.length === 0) return setError("Paste at least one name and email.");
    if (people.length > 200) return setError("Add up to 200 people at a time.");

    setBusy(true);
    const failedLines: string[] = [];
    const failedReasons: string[] = [];

    for (let i = 0; i < people.length; i++) {
      setProgress(`Sending ${i + 1} of ${people.length}…`);
      try {
        await rewardsApi("/api/rewards/members", {
          action: "invite",
          companyId,
          fullName: people[i].fullName,
          email: people[i].email,
          role: "employee",
        });
      } catch (e) {
        failedLines.push(people[i].line);
        failedReasons.push(`${people[i].line}: ${(e as Error).message}`);
      }
    }
    setProgress(null);

    const sent = people.length - failedLines.length;
    if (failedLines.length === 0) {
      onDone(`${sent} invite${sent === 1 ? "" : "s"} sent.`);
    } else {
      setBusy(false);
      setList(failedLines.join("\n"));
      setError(
        `${sent} sent. ${failedLines.length} couldn't be added (left in the box so you can fix them):\n` +
          failedReasons.join("\n")
      );
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
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white p-6 sm:max-w-lg sm:rounded-2xl"
      >
        <h2 className="text-lg font-bold text-[#0F2438]">Add people</h2>
        <p className="mt-1 text-sm text-slate-600">Each person gets an email with a link to set their password.</p>

        <div className="mt-4 flex gap-1 rounded-lg bg-slate-100 p-1">
          {(["one", "list"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              disabled={busy}
              className={`flex-1 rounded-md py-2 text-sm font-medium ${
                mode === m ? "bg-white text-[#0F2438] shadow-sm" : "text-slate-600"
              }`}
            >
              {m === "one" ? "One person" : "Paste a list"}
            </button>
          ))}
        </div>

        {mode === "one" ? (
          <div className="mt-5 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Full name</label>
              <input className={input} value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
              <input type="email" className={input} value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <label className="flex items-start gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={makeAdmin}
                onChange={(e) => setMakeAdmin(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-[#F7931E]"
              />
              <span>Make them an admin too, so they can add and remove people</span>
            </label>
          </div>
        ) : (
          <div className="mt-5">
            <label className="mb-1 block text-sm font-medium text-slate-700">One person per line: name, email</label>
            <textarea
              rows={8}
              className={`${input} font-mono`}
              value={list}
              onChange={(e) => setList(e.target.value)}
              placeholder={"Sam Jones, sam.jones@company.co.uk\nPriya Shah, priya@company.co.uk"}
            />
            <p className="mt-1 text-xs text-slate-500">You can copy two columns straight from a spreadsheet.</p>
          </div>
        )}

        {progress && <p className="mt-4 text-sm font-medium text-[#0F2438]">{progress}</p>}
        {error && <p className="mt-4 whitespace-pre-line rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={busy}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Close
          </button>
          <button
            onClick={mode === "one" ? addOne : addList}
            disabled={busy}
            className="rounded-lg bg-[#F7931E] px-5 py-2 text-sm font-semibold text-white hover:bg-[#e2841a] disabled:opacity-60"
          >
            {busy ? "Sending…" : "Send invites"}
          </button>
        </div>
      </div>
    </div>
  );
}