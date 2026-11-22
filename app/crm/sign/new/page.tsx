"use client";

// Send a document to sign: pick the template and who it's for, check the details, send
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { AGENCY, FIELDS, docHtml, fillTemplate, missingFields, ukDateLong, usedFields } from "@/lib/esignText";
import { KINDS, signApi } from "../signApi";

type Template = { id: string; name: string; kind: string; doc_kind: string };
type Contact = { name: string; email: string | null; job_title: string | null; is_primary: boolean };
type Signer = { name: string; email: string; job_title: string };

const field = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#F7931E] focus:outline-none";
const label = "mb-1 block text-xs font-semibold text-slate-500";
const FEE_PCT = (v: string) => `${v}% of the candidate's first-year basic salary`;
const FEE_FIXED = (v: string) => `a fixed fee of £${Number(v.replace(/[£,]/g, "")).toLocaleString("en-GB")}`;

function SendForm() {
  const q = useSearchParams();
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templateId, setTemplateId] = useState(q.get("template") || "");
  const [template, setTemplate] = useState<{ kind: string; body: string | null; name: string; doc_kind: string } | null>(null);
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
  const [companyId, setCompanyId] = useState(q.get("company") || "");
  const [candidateId] = useState(q.get("candidate") || "");
  const [candidateName, setCandidateName] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [values, setValues] = useState<Record<string, string>>({ date: ukDateLong() });
  const [signers, setSigners] = useState<Signer[]>([{ name: "", email: "", job_title: "" }]);
  const [title, setTitle] = useState("");
  const [titleTouched, setTitleTouched] = useState(false);
  const [message, setMessage] = useState("");
  const [senderSigns, setSenderSigns] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    signApi("GET", "?view=overview")
      .then((j) => {
        const list: Template[] = j.templates ?? [];
        setTemplates(list);
        if (!q.get("template") && list.length) {
          const want = q.get("kind") || (q.get("company") ? "terms" : q.get("candidate") ? "contract" : "");
          setTemplateId((list.find((t) => t.doc_kind === want) || list[0]).id);
        }
      })
      .catch((e) => setError(e.message));
    supabase
      .from("crm_companies")
      .select("id, name")
      .order("name")
      .limit(3000)
      .then(({ data }) => setCompanies((data ?? []) as { id: string; name: string }[]));
  }, [q]);

  useEffect(() => {
    if (!templateId) return setTemplate(null);
    signApi("GET", `?view=template&id=${templateId}`)
      .then((j) => setTemplate(j.template))
      .catch((e) => setError(e.message));
  }, [templateId]);

  // Fill in what we know about the client or candidate
  const prefill = useCallback(async (company: string, candidate: string) => {
    if (!company && !candidate) return;
    const params = new URLSearchParams({ view: "prefill" });
    if (company) params.set("company", company);
    if (candidate) params.set("candidate", candidate);
    try {
      const j = await signApi("GET", `?${params}`);
      setValues((v) => ({ ...v, ...j.values }));
      setContacts(j.contacts ?? []);
      if (j.candidate) {
        setCandidateName(j.candidate.name);
        if (!company) setSigners([{ name: j.candidate.name, email: j.candidate.email || "", job_title: "" }]);
      }
      const main = (j.contacts as Contact[] | undefined)?.find((c) => c.email);
      if (main) setSigners([{ name: main.name, email: main.email || "", job_title: main.job_title || "" }]);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    prefill(companyId, candidateId);
  }, [companyId, candidateId, prefill]);

  const companyName = companies.find((c) => c.id === companyId)?.name || values.company || "";
  useEffect(() => {
    if (titleTouched || !template) return;
    const forWho = companyName || candidateName;
    setTitle(`${template.name}${forWho ? `: ${forWho}` : ""}`);
  }, [template, companyName, candidateName, titleTouched]);

  const isPdf = template?.kind === "pdf";
  const used = useMemo(() => (template?.body ? usedFields(template.body) : []), [template]);
  const missing = useMemo(() => (template?.body ? missingFields(template.body, values) : []), [template, values]);
  const preview = useMemo(() => (template?.body ? docHtml(fillTemplate(template.body, values)) : ""), [template, values]);

  function setValue(key: string, v: string) {
    setValues((old) => {
      const next = { ...old, [key]: v };
      const autoFee = !old.fee || /first-year basic salary$|^a fixed fee of/.test(old.fee);
      if (key === "fee_percent" && autoFee && v) next.fee = FEE_PCT(v);
      if (key === "fee_fixed" && autoFee && v) next.fee = FEE_FIXED(v);
      return next;
    });
  }

  async function send() {
    setError(null);
    if (!templateId) return setError("Choose a template.");
    if (missing.length) return setError(`Fill in: ${missing.map((m) => FIELDS.find((f) => f.key === m)?.label || m).join(", ")}.`);
    const list = signers.filter((s) => s.name.trim() || s.email.trim());
    if (!list.length) return setError("Add who needs to sign.");
    if (!window.confirm(`Send "${title}" to ${list.map((s) => `${s.name} (${s.email})`).join(", ")} to sign?`)) return;
    setBusy(true);
    try {
      const j = await signApi("POST", {
        action: "send",
        template_id: templateId,
        kind: template?.doc_kind || "other",
        title,
        company_id: companyId || null,
        company_name: companyName || null,
        candidate_id: candidateId || null,
        fields: values,
        signers: list,
        message,
        sender_signs: senderSigns,
      });
      router.push(`/crm/sign/view?id=${j.id}${j.failures?.length ? "&emailfail=1" : ""}`);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6">
      <Link href="/crm/sign" className="text-sm text-slate-500 hover:underline">
        ← E-signatures
      </Link>
      <h1 className="mb-4 mt-1 text-2xl font-bold text-[#1F3447]">Send a document to sign</h1>
      {error && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {!templates.length ? (
        <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
          <p className="text-lg font-semibold text-[#1F3447]">You need a template first</p>
          <p className="mt-1 text-sm text-slate-500">Write your terms once, and they&apos;ll fill in automatically for every client.</p>
          <Link href="/crm/sign/template" className="mt-4 inline-block rounded-lg bg-[#F7931E] px-4 py-2.5 text-sm font-semibold text-white">
            Make a template
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="grid gap-3 rounded-2xl bg-white p-4 shadow-sm sm:grid-cols-2">
              <div>
                <label className={label}>Document</label>
                <select className={field} value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({KINDS[t.doc_kind] || "Other"})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={label}>For which company</label>
                <select className={field} value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
                  <option value="">{candidateName ? `Candidate: ${candidateName}` : "Not for a company"}</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className={label}>Title (shown to the signer)</label>
                <input
                  className={field}
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    setTitleTouched(true);
                  }}
                />
              </div>
            </div>

            {!isPdf && used.length > 0 && (
              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <p className="mb-2 text-sm font-bold text-slate-800">Details to fill in</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {used.map((key) => {
                    const def = FIELDS.find((f) => f.key === key);
                    return (
                      <div key={key} className={key === "fee" || key === "company_address" ? "sm:col-span-2" : ""}>
                        <label className={label}>
                          {def?.label || key.replace(/_/g, " ")}
                          {missing.includes(key) && <span className="ml-1 text-red-600">needed</span>}
                        </label>
                        <input className={`${field} ${missing.includes(key) ? "border-red-300 bg-red-50" : ""}`} placeholder={def?.hint} value={values[key] || ""} onChange={(e) => setValue(key, e.target.value)} />
                      </div>
                    );
                  })}
                </div>
                {template?.doc_kind === "terms" && companyId && <p className="mt-2 text-xs text-slate-400">When it&apos;s signed, the fee, rebate and payment days are saved on the client&apos;s Agreed terms.</p>}
              </div>
            )}

            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <p className="mb-2 text-sm font-bold text-slate-800">Who signs</p>
              {contacts.length > 1 && (
                <select
                  className={`${field} mb-2`}
                  value=""
                  onChange={(e) => {
                    const c = contacts[Number(e.target.value)];
                    if (!c) return;
                    const blank = signers.findIndex((s) => !s.name && !s.email);
                    const row = { name: c.name, email: c.email || "", job_title: c.job_title || "" };
                    setSigners(blank >= 0 ? signers.map((s, i) => (i === blank ? row : s)) : [...signers, row].slice(0, 5));
                  }}
                >
                  <option value="">Add a contact from {companyName || "this company"}…</option>
                  {contacts.map((c, i) => (
                    <option key={i} value={i}>
                      {c.name}
                      {c.job_title ? `, ${c.job_title}` : ""}
                      {c.email ? ` (${c.email})` : " (no email)"}
                    </option>
                  ))}
                </select>
              )}
              <div className="space-y-2">
                {signers.map((s, i) => (
                  <div key={i} className="grid gap-2 sm:grid-cols-[1fr_1.3fr_1fr_auto]">
                    <input className={field} placeholder="Name" value={s.name} onChange={(e) => setSigners(signers.map((x, n) => (n === i ? { ...x, name: e.target.value } : x)))} />
                    <input className={field} placeholder="Email" type="email" value={s.email} onChange={(e) => setSigners(signers.map((x, n) => (n === i ? { ...x, email: e.target.value } : x)))} />
                    <input className={field} placeholder="Job title" value={s.job_title} onChange={(e) => setSigners(signers.map((x, n) => (n === i ? { ...x, job_title: e.target.value } : x)))} />
                    <button onClick={() => setSigners(signers.length > 1 ? signers.filter((_, n) => n !== i) : [{ name: "", email: "", job_title: "" }])} className="px-2 text-slate-400 hover:text-red-600" title="Remove">
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              {signers.length < 5 && (
                <button onClick={() => setSigners([...signers, { name: "", email: "", job_title: "" }])} className="mt-2 text-sm font-semibold text-[#F7931E] hover:underline">
                  + Another signer
                </button>
              )}
              <label className="mt-3 flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={senderSigns} onChange={(e) => setSenderSigns(e.target.checked)} />
                Add my signature too ({AGENCY.signer}, {AGENCY.signerTitle}, for {AGENCY.name})
              </label>
              <label className={`${label} mt-3`}>Message in the email (optional)</label>
              <textarea className={field} rows={3} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="e.g. Great to speak today. Here are our terms as discussed: 18% with a 12-week rebate." />
            </div>

            <button onClick={send} disabled={busy} className="w-full rounded-lg bg-[#F7931E] px-5 py-3 font-semibold text-white disabled:opacity-50">
              {busy ? "Sending…" : "Send to sign"}
            </button>
            <p className="text-center text-xs text-slate-400">They get an email from {AGENCY.email}. Reminders go automatically after 3 days if they haven&apos;t signed.</p>
          </div>

          <div className="lg:sticky lg:top-4 lg:self-start">
            <p className="mb-2 text-sm font-bold text-slate-800">What they&apos;ll read</p>
            {isPdf ? (
              <div className="rounded-2xl bg-white p-8 text-sm text-slate-600 shadow-sm">They&apos;ll see your PDF exactly as uploaded, with the signatures and signing certificate added at the end.</div>
            ) : (
              <article className="max-h-[80vh] overflow-y-auto rounded-2xl bg-white p-8 text-[14px] leading-relaxed text-slate-800 shadow-sm" dangerouslySetInnerHTML={{ __html: preview }} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function NewSignPage() {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-slate-500">Loading…</p>}>
      <SendForm />
    </Suspense>
  );
}
