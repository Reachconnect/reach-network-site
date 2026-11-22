"use client";

// E-signatures: documents sent to sign, and your templates
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { timeAgo } from "../crm";
import { KINDS, STATUS, signApi } from "./signApi";

type Signer = { name: string; email: string; viewed_at: string | null; signed_at: string | null; declined_at: string | null };
type Envelope = { id: string; title: string; kind: string; status: string; company_id: string | null; company_name: string | null; sent_at: string | null; completed_at: string | null; created_at: string; crm_sign_signers: Signer[] };
type Template = { id: string; name: string; kind: string; doc_kind: string; description: string | null; updated_at: string };

export default function SignPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"documents" | "templates">("documents");
  const [filter, setFilter] = useState<"all" | "sent" | "completed" | "other">("all");
  const [envelopes, setEnvelopes] = useState<Envelope[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const j = await signApi("GET", "?view=overview");
      setEnvelopes(j.envelopes ?? []);
      setTemplates(j.templates ?? []);
    } catch (e) {
      setError((e as Error).message);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function who(e: Envelope) {
    const s = e.crm_sign_signers ?? [];
    if (e.status === "sent") {
      const signed = s.filter((x) => x.signed_at).length;
      const opened = s.filter((x) => x.viewed_at && !x.signed_at).length;
      return `${signed} of ${s.length} signed${opened ? ` · ${opened} opened` : ""}`;
    }
    return s.map((x) => x.name).join(", ");
  }

  const shown = envelopes.filter((e) => (filter === "all" ? true : filter === "other" ? ["declined", "void"].includes(e.status) : e.status === filter));
  const count = (st: string) => envelopes.filter((e) => e.status === st).length;
  const chip = (active: boolean) => `rounded-lg px-3 py-1.5 text-sm ${active ? "bg-[#1F3447] font-semibold text-white" : "text-slate-600 hover:bg-slate-100"}`;

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1F3447]">E-signatures</h1>
          <p className="text-sm text-slate-500">Send terms and contracts to sign online, with a signing certificate on every document.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/crm/sign/template" className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-[#1F3447]">
            + New template
          </Link>
          <Link href="/crm/sign/new" className="rounded-lg bg-[#F7931E] px-4 py-2.5 text-sm font-semibold text-white">
            Send a document
          </Link>
        </div>
      </div>

      {error && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div className="mb-4 flex gap-2">
        <button className={chip(tab === "documents")} onClick={() => setTab("documents")}>
          Documents ({envelopes.length})
        </button>
        <button className={chip(tab === "templates")} onClick={() => setTab("templates")}>
          Templates ({templates.length})
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : tab === "documents" ? (
        <>
          <div className="mb-3 flex flex-wrap gap-2 text-sm">
            {(
              [
                ["all", `All`],
                ["sent", `Waiting (${count("sent")})`],
                ["completed", `Signed (${count("completed")})`],
                ["other", `Declined or cancelled`],
              ] as [typeof filter, string][]
            ).map(([k, l]) => (
              <button key={k} onClick={() => setFilter(k)} className={`rounded-full border px-3 py-1 ${filter === k ? "border-[#F7931E] bg-orange-50 font-semibold" : "border-slate-200 text-slate-600"}`}>
                {l}
              </button>
            ))}
          </div>
          {!shown.length ? (
            <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
              <p className="text-lg font-semibold text-[#1F3447]">{envelopes.length ? "Nothing here" : "Nothing sent yet"}</p>
              <p className="mt-1 text-sm text-slate-500">
                {templates.length ? "Click Send a document, or use Send terms to sign on a client's page." : "Start by making a template: your terms of business, written once."}
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Document</th>
                    <th className="hidden px-4 py-3 md:table-cell">Signers</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="hidden px-4 py-3 sm:table-cell">Sent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {shown.map((e) => {
                    const st = STATUS[e.status] || STATUS.sent;
                    return (
                      <tr key={e.id} onClick={() => router.push(`/crm/sign/view?id=${e.id}`)} className="cursor-pointer hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-800">{e.title}</p>
                          <p className="text-xs text-slate-500">
                            {KINDS[e.kind] || "Other"}
                            {e.company_name ? ` · ${e.company_name}` : ""}
                          </p>
                        </td>
                        <td className="hidden px-4 py-3 text-slate-600 md:table-cell">{who(e)}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${st.tone}`}>{st.label}</span>
                        </td>
                        <td className="hidden px-4 py-3 text-slate-500 sm:table-cell">{e.sent_at ? timeAgo(e.sent_at) : "–"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : !templates.length ? (
        <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
          <p className="text-lg font-semibold text-[#1F3447]">No templates yet</p>
          <p className="mt-1 text-sm text-slate-500">A template is a document you send again and again, like your terms of business. Write it once with fill-in fields, or upload a PDF.</p>
          <Link href="/crm/sign/template" className="mt-4 inline-block rounded-lg bg-[#F7931E] px-4 py-2.5 text-sm font-semibold text-white">
            Make your first template
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <div key={t.id} className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="font-semibold text-slate-800">{t.name}</p>
              <p className="text-xs text-slate-500">
                {KINDS[t.doc_kind] || "Other"} · {t.kind === "pdf" ? "PDF" : "Written in the CRM"} · updated {timeAgo(t.updated_at)}
              </p>
              {t.description && <p className="mt-1 text-sm text-slate-600">{t.description}</p>}
              <div className="mt-3 flex gap-2 text-sm">
                <Link href={`/crm/sign/new?template=${t.id}`} className="rounded-lg bg-[#F7931E] px-3 py-1.5 font-semibold text-white">
                  Send
                </Link>
                <Link href={`/crm/sign/template?id=${t.id}`} className="rounded-lg border border-slate-200 px-3 py-1.5 text-slate-600">
                  Edit
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
