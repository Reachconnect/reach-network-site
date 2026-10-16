"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Icon, ukDate } from "../crm";

type Job = { title: string; company: string; location: string; start: string; end: string; bullets: string[] };
type CvData = { headline: string; summary: string; skills: string[]; qualifications: string[]; experience: Job[]; education: string[] };

async function call(body: object) {
  const { data } = await supabase.auth.getSession();
  const res = await fetch("/api/crm/branded-cv", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session?.access_token ?? ""}` },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || "Something went wrong.");
  return json;
}

export default function BrandedCv({ candidateId, hasCv }: { candidateId: string; hasCv: boolean }) {
  const [open, setOpen] = useState(false);
  const [last, setLast] = useState<{ path: string; at: string } | null>(null);
  const [data, setData] = useState<CvData | null>(null);
  const [skillsText, setSkillsText] = useState("");
  const [qualsText, setQualsText] = useState("");
  const [opts, setOpts] = useState({ hideContact: true, hideEmployer: false, includeSalary: true });
  const [stage, setStage] = useState<"idle" | "reading" | "building">("idle");
  const [result, setResult] = useState<{ url: string; fileName: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadLast() {
    const { data: row } = await supabase.from("crm_candidates").select("branded_cv_path, branded_cv_at").eq("id", candidateId).maybeSingle();
    setLast(row?.branded_cv_path ? { path: row.branded_cv_path, at: row.branded_cv_at } : null);
  }

  useEffect(() => {
    loadLast();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidateId]);

  async function read(refresh = false) {
    setStage("reading");
    setError(null);
    setResult(null);
    try {
      const j = await call({ action: "read", candidateId, refresh });
      const d = j.data as CvData;
      setData(d);
      setSkillsText(d.skills.join("\n"));
      setQualsText(d.qualifications.join("\n"));
    } catch (e) {
      setError((e as Error).message);
    }
    setStage("idle");
  }

  function start() {
    setOpen(true);
    if (!data) read();
  }

  async function build() {
    if (!data) return;
    setStage("building");
    setError(null);
    try {
      const lines = (t: string) => t.split("\n").map((x) => x.trim()).filter(Boolean);
      const j = await call({
        action: "build",
        candidateId,
        options: opts,
        data: { ...data, skills: lines(skillsText), qualifications: lines(qualsText) },
      });
      setResult({ url: j.url, fileName: j.fileName });
      loadLast();
    } catch (e) {
      setError((e as Error).message);
    }
    setStage("idle");
  }

  async function downloadLast() {
    if (!last) return;
    const { data: signed, error: e } = await supabase.storage.from("crm-cvs").createSignedUrl(last.path, 600);
    if (e || !signed) return setError("Couldn't open the branded CV.");
    window.open(signed.signedUrl, "_blank", "noopener,noreferrer");
  }

  const input = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#F7931E] focus:outline-none focus:ring-2 focus:ring-[#F7931E]/30";

  return (
    <div className="mt-4 border-t border-slate-100 pt-4">
      <button
        onClick={start}
        disabled={!hasCv}
        title={hasCv ? undefined : "Upload their CV first"}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#1F3447] px-4 py-2.5 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-40"
      >
        <Icon name="file" className="h-4 w-4" /> Create branded CV
      </button>
      {!hasCv && <p className="mt-1.5 text-xs text-slate-500">Upload their CV first.</p>}
      {last && (
        <button onClick={downloadLast} className="mt-2 w-full text-center text-sm font-semibold text-[#F7931E] hover:underline">
          Download branded CV ({ukDate(last.at)})
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4" onClick={() => setOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Create branded CV"
            onClick={(e) => e.stopPropagation()}
            className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white p-6 sm:max-w-2xl sm:rounded-2xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#1F3447]">Branded CV</h2>
              <button onClick={() => setOpen(false)} aria-label="Close" className="rounded-full p-1.5 hover:bg-slate-100">
                <Icon name="x" className="h-5 w-5" />
              </button>
            </div>

            {stage === "reading" && (
              <div className="py-12 text-center">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-orange-100 border-t-[#F7931E]" />
                <p className="mt-3 text-sm font-semibold text-slate-600">Reading their CV…</p>
                <p className="text-xs text-slate-400">This takes about 15 seconds.</p>
              </div>
            )}

            {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

            {data && stage !== "reading" && !result && (
              <div className="mt-4 space-y-4">
                <p className="text-sm text-slate-500">Check the draft below. Anything you change goes on the PDF.</p>

                <label className="block">
                  <span className="text-xs font-semibold text-slate-500">Headline</span>
                  <input className={`mt-1 ${input}`} value={data.headline} onChange={(e) => setData({ ...data, headline: e.target.value })} />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-slate-500">Consultant&apos;s summary</span>
                  <textarea rows={5} className={`mt-1 ${input}`} value={data.summary} onChange={(e) => setData({ ...data, summary: e.target.value })} />
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-xs font-semibold text-slate-500">Licences, tickets and qualifications (one per line)</span>
                    <textarea rows={6} className={`mt-1 ${input}`} value={qualsText} onChange={(e) => setQualsText(e.target.value)} />
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold text-slate-500">Key skills (one per line)</span>
                    <textarea rows={6} className={`mt-1 ${input}`} value={skillsText} onChange={(e) => setSkillsText(e.target.value)} />
                  </label>
                </div>
                <p className="text-xs text-slate-500">
                  {data.experience.length} {data.experience.length === 1 ? "role" : "roles"} and {data.education.length} education{" "}
                  {data.education.length === 1 ? "entry" : "entries"} taken from the CV.{" "}
                  <button onClick={() => read(true)} className="font-semibold text-[#F7931E] hover:underline">
                    Read the CV again
                  </button>
                </p>

                <div className="space-y-2 rounded-xl bg-slate-50 p-4">
                  {(
                    [
                      ["hideContact", "Hide contact details", "Removes phone, email and postcode, and shortens their surname to an initial."],
                      ["hideEmployer", "Hide current employer", "Shows their current job as \"Current employer (confidential)\"."],
                      ["includeSalary", "Include salary and notice period", "Only if they're filled in on their profile."],
                    ] as const
                  ).map(([key, label, hint]) => (
                    <label key={key} className="flex cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        checked={opts[key]}
                        onChange={(e) => setOpts((o) => ({ ...o, [key]: e.target.checked }))}
                        className="mt-0.5 h-4 w-4 accent-[#F7931E]"
                      />
                      <span>
                        <span className="block text-sm font-semibold text-[#1F3447]">{label}</span>
                        <span className="block text-xs text-slate-500">{hint}</span>
                      </span>
                    </label>
                  ))}
                </div>

                <div className="flex justify-end gap-2">
                  <button onClick={() => setOpen(false)} className="rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">
                    Cancel
                  </button>
                  <button
                    onClick={build}
                    disabled={stage === "building"}
                    className="rounded-lg bg-[#F7931E] px-5 py-2.5 text-sm font-semibold text-white hover:brightness-95 disabled:opacity-50"
                  >
                    {stage === "building" ? "Creating PDF…" : "Create PDF"}
                  </button>
                </div>
              </div>
            )}

            {result && (
              <div className="py-8 text-center">
                <p className="text-lg font-bold text-[#1F3447]">Your branded CV is ready</p>
                <p className="mt-1 text-sm text-slate-500">It&apos;s also saved on their profile.</p>
                <a
                  href={result.url}
                  className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#F7931E] px-5 py-3 text-sm font-semibold text-white hover:brightness-95"
                >
                  <Icon name="file" className="h-4 w-4" /> Download {result.fileName}
                </a>
                <div className="mt-3">
                  <button onClick={() => setResult(null)} className="text-sm font-semibold text-slate-500 hover:underline">
                    Make changes
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}