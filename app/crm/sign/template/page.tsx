"use client";

// Make or edit a template: write it with fill-in fields, or upload a PDF
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FIELDS, STARTER_TERMS, docHtml, fillTemplate, ukDateLong } from "@/lib/esignText";
import { KINDS, signApi, uploadPdf } from "../signApi";

const field = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#F7931E] focus:outline-none";
const label = "mb-1 block text-xs font-semibold text-slate-500";

const SAMPLE: Record<string, string> = {
  company: "Example Foods Ltd",
  company_address: "Unit 4, Park Road, Birmingham B12 0AB",
  contact_name: "Sarah Jones",
  contact_job_title: "Operations Director",
  fee: "18% of the candidate's first-year basic salary",
  fee_percent: "18",
  fee_fixed: "4000",
  rebate_weeks: "12",
  payment_days: "14",
  candidate_name: "James Smith",
  job_title: "Class 1 Driver",
  start_date: "1 December 2026",
  pay_rate: "£16.50 an hour",
  date: ukDateLong(),
};

function TemplateEditor() {
  const id = useSearchParams().get("id") || "";
  const router = useRouter();
  const [name, setName] = useState("Terms of Business: Permanent");
  const [docKind, setDocKind] = useState("terms");
  const [description, setDescription] = useState("");
  const [kind, setKind] = useState<"text" | "pdf">("text");
  const [body, setBody] = useState(STARTER_TERMS);
  const [pdfPath, setPdfPath] = useState<string | null>(null);
  const [pdfName, setPdfName] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(!!id);
  const [error, setError] = useState<string | null>(null);
  const area = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!id) return;
    signApi("GET", `?view=template&id=${id}`)
      .then((j) => {
        const t = j.template;
        setName(t.name);
        setDocKind(t.doc_kind || "other");
        setDescription(t.description || "");
        setKind(t.kind);
        setBody(t.body || "");
        setPdfPath(t.pdf_path);
        setPdfName(t.pdf_path ? "Uploaded PDF" : "");
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const preview = useMemo(() => docHtml(fillTemplate(body, SAMPLE)), [body]);

  function insert(key: string) {
    const el = area.current;
    const tag = `{${key}}`;
    const start = el?.selectionStart ?? body.length;
    const end = el?.selectionEnd ?? body.length;
    setBody(body.slice(0, start) + tag + body.slice(end));
    setTimeout(() => {
      el?.focus();
      el?.setSelectionRange(start + tag.length, start + tag.length);
    }, 0);
  }

  async function pick(file: File) {
    if (!/\.pdf$/i.test(file.name) && file.type !== "application/pdf") return setError("Choose a PDF file.");
    if (file.size > 20 * 1024 * 1024) return setError("Keep the PDF under 20MB.");
    setBusy(true);
    setError(null);
    try {
      setPdfPath(await uploadPdf(file));
      setPdfName(file.name);
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(false);
  }

  async function save() {
    setBusy(true);
    setError(null);
    try {
      await signApi("POST", { action: "template_save", id: id || undefined, name, doc_kind: docKind, description, kind, body, pdf_path: pdfPath });
      router.push("/crm/sign");
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  async function remove() {
    if (!window.confirm(`Delete the template "${name}"? Documents already sent aren't affected.`)) return;
    await signApi("POST", { action: "template_delete", id });
    router.push("/crm/sign");
  }

  if (loading) return <p className="p-6 text-sm text-slate-500">Loading…</p>;

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6">
      <Link href="/crm/sign" className="text-sm text-slate-500 hover:underline">
        ← E-signatures
      </Link>
      <div className="mb-4 mt-1 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-[#1F3447]">{id ? "Edit template" : "New template"}</h1>
        <div className="flex gap-2">
          {id && (
            <button onClick={remove} className="rounded-lg px-3 py-2 text-sm text-slate-400 hover:text-red-600">
              Delete
            </button>
          )}
          <button onClick={save} disabled={busy} className="rounded-lg bg-[#F7931E] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
            {busy ? "Saving…" : "Save template"}
          </button>
        </div>
      </div>
      {error && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div className="mb-4 grid gap-3 rounded-2xl bg-white p-4 shadow-sm sm:grid-cols-3">
        <div>
          <label className={label}>Name</label>
          <input className={field} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className={label}>What it&apos;s for</label>
          <select className={field} value={docKind} onChange={(e) => setDocKind(e.target.value)}>
            {Object.entries(KINDS).map(([k, l]) => (
              <option key={k} value={k}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>Note to yourself (optional)</label>
          <input className={field} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Standard 18% terms" />
        </div>
        <div className="flex gap-2 sm:col-span-3">
          <button onClick={() => setKind("text")} className={`rounded-lg border px-3 py-1.5 text-sm ${kind === "text" ? "border-[#F7931E] bg-orange-50 font-semibold" : "border-slate-200 text-slate-600"}`}>
            Write it here (best)
          </button>
          <button onClick={() => setKind("pdf")} className={`rounded-lg border px-3 py-1.5 text-sm ${kind === "pdf" ? "border-[#F7931E] bg-orange-50 font-semibold" : "border-slate-200 text-slate-600"}`}>
            Upload a PDF
          </button>
        </div>
      </div>

      {kind === "pdf" ? (
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 p-10 text-center hover:border-[#F7931E]">
            <span className="font-semibold text-[#1F3447]">{busy ? "Uploading…" : pdfPath ? `✓ ${pdfName}. Click to replace it` : "Choose your PDF"}</span>
            <span className="mt-1 text-sm text-slate-500">The signatures and a signing certificate are added as extra pages at the end.</span>
            <input type="file" accept="application/pdf,.pdf" className="hidden" onChange={(e) => e.target.files?.[0] && pick(e.target.files[0])} />
          </label>
          <p className="mt-3 text-xs text-slate-500">Tip: writing your terms here instead means the client&apos;s name, fee and payment days fill in automatically, and the text looks great on phones.</p>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="mb-2 flex flex-wrap gap-1.5">
              <span className="text-xs font-semibold text-slate-500">Fill-in fields:</span>
              {FIELDS.map((f) => (
                <button key={f.key} onMouseDown={(e) => e.preventDefault()} onClick={() => insert(f.key)} title={f.hint} className="rounded-full bg-orange-50 px-2 py-0.5 text-xs font-semibold text-[#c46d00] hover:bg-orange-100">
                  + {f.label}
                </button>
              ))}
            </div>
            <textarea ref={area} className={`${field} font-mono text-[13px] leading-relaxed`} rows={30} value={body} onChange={(e) => setBody(e.target.value)} />
            <p className="mt-1 text-xs text-slate-400">
              <b># </b>at the start of a line makes a title, <b>## </b>a heading, <b>- </b>a bullet point. **Two stars** make words bold. Leave a blank line between paragraphs.
            </p>
            {!id && docKind === "terms" && (
              <p className="mt-2 rounded-lg bg-amber-50 p-2.5 text-xs text-amber-900">
                This is starter wording to save you typing. Swap in your own terms, or have a solicitor check these before you use them.
              </p>
            )}
          </div>
          <div className="lg:sticky lg:top-4 lg:self-start">
            <p className="mb-2 text-sm font-bold text-slate-800">
              Preview <span className="font-normal text-slate-400">with example details</span>
            </p>
            <article className="max-h-[80vh] overflow-y-auto rounded-2xl bg-white p-8 text-[14px] leading-relaxed text-slate-800 shadow-sm" dangerouslySetInnerHTML={{ __html: preview }} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function TemplatePage() {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-slate-500">Loading…</p>}>
      <TemplateEditor />
    </Suspense>
  );
}
