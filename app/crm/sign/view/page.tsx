"use client";

// One document: who has opened and signed it, the full history, the signed PDF
import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ukDateTime } from "@/lib/esignText";
import { timeAgo } from "../../crm";
import { KINDS, STATUS, signApi } from "../signApi";

type Signer = { id: string; name: string; email: string; job_title: string | null; viewed_at: string | null; verified_at: string | null; signed_at: string | null; declined_at: string | null; decline_reason: string | null; reminded_at: string | null; token: string; ip: string | null };
type Event = { id: string; detail: string; at: string; ip: string | null };

function SignerState({ s }: { s: Signer }) {
  if (s.signed_at) return <span className="font-semibold text-green-700">✓ Signed {timeAgo(s.signed_at)}</span>;
  if (s.declined_at) return <span className="font-semibold text-red-700">Declined{s.decline_reason ? `: ${s.decline_reason}` : ""}</span>;
  if (s.verified_at) return <span className="text-amber-700">Confirmed their email, not signed yet</span>;
  if (s.viewed_at) return <span className="text-amber-700">Opened {timeAgo(s.viewed_at)}, not signed yet</span>;
  return <span className="text-slate-500">Not opened yet</span>;
}

function DocView() {
  const q = useSearchParams();
  const id = q.get("id") || "";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [env, setEnv] = useState<any>(null);
  const [signers, setSigners] = useState<Signer[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(q.get("emailfail") ? "The document was created, but an email didn't send. Use Copy signing link and send it yourself." : null);

  const load = useCallback(async () => {
    try {
      const j = await signApi("GET", `?view=envelope&id=${id}`);
      setEnv(j.envelope);
      setSigners(j.signers ?? []);
      setEvents(j.events ?? []);
      setSignedUrl(j.signed_url);
      setOriginalUrl(j.original_url);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function act(action: "remind" | "void") {
    if (action === "void" && !window.confirm("Cancel this document? The signing links will stop working.")) return;
    setBusy(true);
    setError(null);
    try {
      const j = await signApi("POST", { action, id });
      setMessage(action === "remind" ? `Reminder sent to ${j.reminded} ${j.reminded === 1 ? "person" : "people"}.` : "Cancelled.");
      load();
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(false);
  }

  function copyLink(s: Signer) {
    navigator.clipboard.writeText(`${window.location.origin}/s/${s.token}`);
    setCopied(s.id);
    setTimeout(() => setCopied(null), 1500);
  }

  if (!env) return <p className="p-6 text-sm text-slate-500">{error || "Loading…"}</p>;
  const st = STATUS[env.status] || STATUS.sent;

  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-6">
      <Link href="/crm/sign" className="text-sm text-slate-500 hover:underline">
        ← E-signatures
      </Link>
      <div className="mb-4 mt-1 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1F3447]">{env.title}</h1>
          <p className="text-sm text-slate-500">
            {KINDS[env.kind] || "Other"}
            {env.company_name && (
              <>
                {" · "}
                {env.company_id ? (
                  <Link href={`/crm/sales/view?id=${env.company_id}`} className="text-[#F7931E] hover:underline">
                    {env.company_name}
                  </Link>
                ) : (
                  env.company_name
                )}
              </>
            )}
            {" · "}Document ID {env.short_id}
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-sm font-semibold ${st.tone}`}>{st.label}</span>
      </div>

      {error && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {message && <p className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-800">{message}</p>}

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="mb-3 text-sm font-bold text-slate-800">Signers</p>
            <ul className="divide-y divide-slate-100">
              {env.sender_signed_at && (
                <li className="py-3 text-sm">
                  <p className="font-semibold text-slate-800">
                    {env.sender_name}, {env.sender_title} <span className="font-normal text-slate-500">(you)</span>
                  </p>
                  <span className="font-semibold text-green-700">✓ Signed when sent</span>
                </li>
              )}
              {signers.map((s) => (
                <li key={s.id} className="flex flex-wrap items-start justify-between gap-2 py-3 text-sm">
                  <div>
                    <p className="font-semibold text-slate-800">
                      {s.name}
                      {s.job_title ? `, ${s.job_title}` : ""}
                    </p>
                    <p className="text-xs text-slate-500">{s.email}</p>
                    <SignerState s={s} />
                  </div>
                  {env.status === "sent" && !s.signed_at && (
                    <button onClick={() => copyLink(s)} className="text-xs text-slate-600 hover:underline">
                      {copied === s.id ? "Copied" : "Copy signing link"}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="mb-3 text-sm font-bold text-slate-800">History</p>
            <ol className="space-y-2.5 text-sm">
              {events.map((e) => (
                <li key={e.id} className="flex gap-3">
                  <span className="w-40 flex-none text-xs text-slate-400">{ukDateTime(e.at)}</span>
                  <span className="text-slate-700">
                    {e.detail}
                    {e.ip && <span className="text-xs text-slate-400"> · IP {e.ip}</span>}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <aside className="space-y-3">
          {env.status === "completed" && signedUrl && (
            <a href={signedUrl} className="block rounded-lg bg-green-600 px-4 py-3 text-center font-semibold text-white hover:bg-green-700">
              Download the signed PDF
            </a>
          )}
          {env.status === "sent" && (
            <>
              <button onClick={() => act("remind")} disabled={busy} className="w-full rounded-lg bg-[#F7931E] px-4 py-2.5 font-semibold text-white disabled:opacity-50">
                Send a reminder now
              </button>
              <button onClick={() => act("void")} disabled={busy} className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-600">
                Cancel this document
              </button>
            </>
          )}
          {originalUrl && (
            <a href={originalUrl} target="_blank" rel="noopener noreferrer" className="block rounded-lg border border-slate-300 px-4 py-2.5 text-center text-sm text-slate-600">
              Open the PDF as sent
            </a>
          )}
          <div className="rounded-2xl bg-white p-4 text-xs text-slate-500 shadow-sm">
            <p className="font-semibold text-slate-700">Fingerprint of the document as sent</p>
            <p className="mt-1 break-all font-mono">{env.doc_hash}</p>
            {env.final_hash && (
              <>
                <p className="mt-3 font-semibold text-slate-700">Fingerprint of the signed PDF</p>
                <p className="mt-1 break-all font-mono">{env.final_hash}</p>
              </>
            )}
            <p className="mt-3">If anyone ever claims the document was changed, these codes prove it wasn&apos;t.</p>
          </div>
          {env.status === "declined" && (
            <Link href={`/crm/sign/new?template=${env.template_id || ""}${env.company_id ? `&company=${env.company_id}` : ""}`} className="block rounded-lg border border-slate-300 px-4 py-2.5 text-center text-sm font-semibold text-[#1F3447]">
              Send a new version
            </Link>
          )}
        </aside>
      </div>
    </div>
  );
}

export default function ViewSignPage() {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-slate-500">Loading…</p>}>
      <DocView />
    </Suspense>
  );
}
