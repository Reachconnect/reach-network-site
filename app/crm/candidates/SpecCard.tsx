"use client";

// "Send as spec": an anonymised profile page for a prospective client, with alerts when they open it or respond
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { SpecContent } from "@/lib/specs";
import { timeAgo } from "../crm";
import SpecSender from "../SpecSender";

type Spec = {
  id: string;
  url: string;
  company_name: string;
  contact_name: string | null;
  role_title: string | null;
  created_at: string;
  first_opened_at: string | null;
  last_opened_at: string | null;
  open_count: number;
  view_seconds: number;
  response: string | null;
  withdrawn: boolean;
  expires_at: string | null;
  candidate_count?: number;
  sent_to_email?: string | null;
  email_sent_at?: string | null;
  email_error?: string | null;
  video_plays?: number | null;
};

async function api(method: "GET" | "POST", body?: object, query = "") {
  const { data } = await supabase.auth.getSession();
  const res = await fetch(`/api/crm/specs${query}`, {
    method,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session?.access_token ?? ""}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || "Something went wrong.");
  return json;
}

const lines = (t: string) => t.split("\n").map((x) => x.trim()).filter(Boolean);

export default function SpecCard({ candidateId }: { candidateId: string }) {
  const [specs, setSpecs] = useState<Spec[]>([]);
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState("");

  const [draft, setDraft] = useState<SpecContent | null>(null);
  const [text, setText] = useState({ checklist: "", qualifications: "", highlights: "" });
  const [stage, setStage] = useState<"idle" | "writing">("idle");
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const j = await api("GET", undefined, `?candidateId=${candidateId}`);
      setSpecs(j.specs);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [candidateId]);

  useEffect(() => {
    load();
  }, [load]);

  function reset() {
    setDraft(null);
    setSending(false);
    setRole("");
    setError(null);
  }

  async function write() {
    setStage("writing");
    setError(null);
    try {
      const j = await api("POST", { action: "draft", candidateId, role });
      const c = j.content as SpecContent;
      setDraft(c);
      setText({ checklist: c.checklist.join("\n"), qualifications: c.qualifications.join("\n"), highlights: c.highlights.join("\n") });
    } catch (e) {
      setError((e as Error).message);
    }
    setStage("idle");
  }

  const content: SpecContent | null = draft
    ? { ...draft, checklist: lines(text.checklist), qualifications: lines(text.qualifications), highlights: lines(text.highlights) }
    : null;

  async function withdraw(id: string) {
    if (!window.confirm("Switch this link off? Anyone opening it will see that the profile is no longer available.")) return;
    await api("POST", { action: "withdraw", specId: id }).catch((e) => setError(e.message));
    load();
  }

  function copy(value: string, label: string) {
    navigator.clipboard.writeText(value);
    setCopied(label);
    setTimeout(() => setCopied(null), 1500);
  }

  function status(s: Spec) {
    if (s.withdrawn) return { text: "Switched off", tone: "text-slate-400" };
    if (s.email_error && !s.email_sent_at && !s.open_count) return { text: "Email didn't send. Copy the link and send it yourself", tone: "text-red-700" };
    if (s.response === "interested") return { text: "🔥 Interested, call them", tone: "text-green-700 font-semibold" };
    if (s.response === "not_hiring") return { text: "Not hiring right now", tone: "text-slate-500" };
    if (s.open_count > 0) {
      const mins = Math.round(s.view_seconds / 60);
      return {
        text: `Opened ${s.open_count}× · last ${timeAgo(s.last_opened_at!)}${mins ? ` · ${mins} min reading` : ""}${s.video_plays ? " · watched your video" : ""}`,
        tone: "text-blue-700",
      };
    }
    return { text: "Not opened yet", tone: "text-slate-500" };
  }

  const field = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#F7931E] focus:outline-none";
  const label = "mb-1 block text-xs font-semibold text-slate-500";

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-slate-900">Spec to a prospect</h2>
        {!open && (
          <button
            onClick={() => {
              reset();
              setOpen(true);
            }}
            className="text-sm font-semibold text-[#F7931E] hover:underline"
          >
            + New spec
          </button>
        )}
      </div>
      <p className="mt-1 text-xs text-slate-500">An anonymised profile page for one or more companies, emailed from the CRM, with an alert when they open it or respond.</p>

      {error && <p className="mt-3 rounded-lg bg-red-50 p-2.5 text-sm text-red-700">{error}</p>}

      {open && (
        <div className="mt-4 space-y-3">
          <div>
            <label className={label}>What they might need (optional)</label>
            <input className={field} placeholder="e.g. Class 1 night driver, Worcester depot" value={role} onChange={(e) => setRole(e.target.value)} />
          </div>

          {!draft ? (
            <button onClick={write} disabled={stage !== "idle"} className="w-full rounded-lg bg-[#F7931E] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
              {stage === "writing" ? "Writing the profile…" : "Write the profile"}
            </button>
          ) : (
            <>
              <div className="rounded-xl border border-slate-200 p-3">
                <p className="text-xs font-semibold text-slate-500">Check and edit before sending. Nothing here identifies them.</p>
                <div className="mt-2 space-y-2.5">
                  <div>
                    <label className={label}>Shown as</label>
                    <input className={field} value={draft.display_name} onChange={(e) => setDraft({ ...draft, display_name: e.target.value })} />
                  </div>
                  <div>
                    <label className={label}>Headline</label>
                    <input className={field} value={draft.headline} onChange={(e) => setDraft({ ...draft, headline: e.target.value })} />
                  </div>
                  <div>
                    <label className={label}>Ticks (one per line)</label>
                    <textarea className={field} rows={4} value={text.checklist} onChange={(e) => setText({ ...text, checklist: e.target.value })} />
                  </div>
                  <div>
                    <label className={label}>Why they&apos;d suit them</label>
                    <textarea className={field} rows={4} value={draft.why} onChange={(e) => setDraft({ ...draft, why: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className={label}>Area</label>
                      <input className={field} value={draft.area} onChange={(e) => setDraft({ ...draft, area: e.target.value })} />
                    </div>
                    <div>
                      <label className={label}>Available</label>
                      <input className={field} value={draft.availability} onChange={(e) => setDraft({ ...draft, availability: e.target.value })} />
                    </div>
                    <div>
                      <label className={label}>Expecting (optional)</label>
                      <input className={field} value={draft.salary} onChange={(e) => setDraft({ ...draft, salary: e.target.value })} />
                    </div>
                    <div>
                      <label className={label}>Similar candidates nearby</label>
                      <input
                        className={field}
                        type="number"
                        min={0}
                        value={draft.more_count}
                        onChange={(e) => setDraft({ ...draft, more_count: Number(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={label}>Licences and qualifications (one per line)</label>
                    <textarea className={field} rows={3} value={text.qualifications} onChange={(e) => setText({ ...text, qualifications: e.target.value })} />
                  </div>
                  <div>
                    <label className={label}>Skills (one per line)</label>
                    <textarea className={field} rows={3} value={text.highlights} onChange={(e) => setText({ ...text, highlights: e.target.value })} />
                  </div>
                </div>
              </div>

              {!sending ? (
                <div className="flex gap-2">
                  <button onClick={() => setSending(true)} className="flex-1 rounded-lg bg-[#F7931E] px-4 py-2.5 text-sm font-semibold text-white">
                    Next: who&apos;s it going to?
                  </button>
                  <button onClick={write} disabled={stage !== "idle"} className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-600">
                    {stage === "writing" ? "Rewriting…" : "Rewrite"}
                  </button>
                </div>
              ) : (
                content && (
                  <div className="border-t border-slate-100 pt-4">
                    <SpecSender
                      items={[{ candidateId, content }]}
                      role={role}
                      onDone={load}
                      onClose={() => {
                        setOpen(false);
                        reset();
                      }}
                    />
                  </div>
                )
              )}
            </>
          )}

          <button onClick={() => setOpen(false)} className="w-full text-center text-sm text-slate-500 hover:text-slate-700">
            Cancel
          </button>
        </div>
      )}

      {specs.length > 0 && (
        <ul className="mt-4 divide-y divide-slate-100 border-t border-slate-100">
          {specs.map((s) => {
            const st = status(s);
            return (
              <li key={s.id} className="py-3 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-800">
                      {s.company_name}
                      {(s.candidate_count ?? 1) > 1 && <span className="ml-1.5 text-xs font-normal text-slate-500">shortlist of {s.candidate_count}</span>}
                    </p>
                    <p className={`text-xs ${st.tone}`}>{st.text}</p>
                    <p className="text-xs text-slate-400">
                      {s.email_sent_at ? `Emailed to ${s.sent_to_email}` : "Link made"} {timeAgo(s.created_at)}
                    </p>
                  </div>
                  {!s.withdrawn && (
                    <div className="flex flex-none gap-2 text-xs">
                      <a href={`${s.url}?preview=1`} target="_blank" className="text-[#F7931E] hover:underline">
                        Preview
                      </a>
                      <button onClick={() => copy(s.url, s.id)} className="text-slate-600 hover:underline">
                        {copied === s.id ? "Copied" : "Copy link"}
                      </button>
                      <button onClick={() => withdraw(s.id)} className="text-slate-400 hover:text-red-600">
                        Switch off
                      </button>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
