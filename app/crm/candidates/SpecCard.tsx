"use client";

// "Send as spec": an anonymised profile page for a prospective client, with alerts when they open it or respond
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { SpecContent } from "@/lib/specs";
import { timeAgo } from "../crm";

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

function emailText(c: SpecContent, url: string, company: string, contact: string | null, role: string) {
  const hi = contact ? contact.split(" ")[0] : "there";
  const first = c.display_name.split(" ")[0];
  return {
    subject: `${c.headline}${c.area ? `, ${c.area}` : ""}`,
    body: [
      `Hi ${hi},`,
      "",
      `I'm Darren from Reach Network Recruitment. I've got a candidate who I think could be a great fit for ${company}${role ? ` (${role})` : ""}.`,
      "",
      `${c.display_name}: ${c.headline}`,
      ...c.checklist.slice(0, 4).map((x) => `✓ ${x}`),
      "",
      c.why,
      "",
      `You can see ${first}'s full profile here, and ask us to call you in one tap:`,
      url,
      "",
      "Happy to have a quick chat if you'd like to know more.",
      "",
      "Kind regards,",
      "Darren Rowell",
      "Reach Network Recruitment",
    ].join("\n"),
  };
}

export default function SpecCard({ candidateId }: { candidateId: string }) {
  const [specs, setSpecs] = useState<Spec[]>([]);
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
  const [open, setOpen] = useState(false);

  const [companyId, setCompanyId] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [role, setRole] = useState("");
  const [consent, setConsent] = useState(false);

  const [draft, setDraft] = useState<SpecContent | null>(null);
  const [text, setText] = useState({ checklist: "", qualifications: "", highlights: "" });
  const [stage, setStage] = useState<"idle" | "writing" | "saving">("idle");
  const [made, setMade] = useState<{ url: string; subject: string; body: string } | null>(null);
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

  useEffect(() => {
    if (!open || companies.length) return;
    supabase
      .from("crm_companies")
      .select("id, name")
      .order("name")
      .limit(3000)
      .then(({ data }) => setCompanies((data ?? []) as { id: string; name: string }[]));
  }, [open, companies.length]);

  function reset() {
    setDraft(null);
    setMade(null);
    setCompanyId("");
    setCompanyName("");
    setContactName("");
    setRole("");
    setConsent(false);
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

  async function create() {
    if (!draft) return;
    if (!companyId && !companyName.trim()) return setError("Choose the company, or type a new one.");
    if (!consent) return setError("Tick to confirm the candidate has agreed to be put forward.");
    setStage("saving");
    setError(null);
    const content: SpecContent = { ...draft, checklist: lines(text.checklist), qualifications: lines(text.qualifications), highlights: lines(text.highlights) };
    try {
      const j = await api("POST", { action: "create", candidateId, companyId: companyId || null, companyName, contactName, role, consent, content });
      const name = companyId ? companies.find((c) => c.id === companyId)?.name || companyName : companyName;
      setMade({ url: j.url, ...emailText(content, j.url, name, contactName || null, role) });
      load();
    } catch (e) {
      setError((e as Error).message);
    }
    setStage("idle");
  }

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
    if (s.response === "interested") return { text: "🔥 Interested, call them", tone: "text-green-700 font-semibold" };
    if (s.response === "not_hiring") return { text: "Not hiring right now", tone: "text-slate-500" };
    if (s.open_count > 0) {
      const mins = Math.round(s.view_seconds / 60);
      return {
        text: `Opened ${s.open_count}× · last ${timeAgo(s.last_opened_at!)}${mins ? ` · ${mins} min reading` : ""}`,
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
      <p className="mt-1 text-xs text-slate-500">An anonymised profile page for a company, with an email when they open it or respond.</p>

      {error && <p className="mt-3 rounded-lg bg-red-50 p-2.5 text-sm text-red-700">{error}</p>}

      {open && !made && (
        <div className="mt-4 space-y-3">
          <div>
            <label className={label}>Company</label>
            <select className={field} value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
              <option value="">New company (type below)</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {!companyId && (
              <input className={`${field} mt-2`} placeholder="Company name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
            )}
          </div>
          <div>
            <label className={label}>Contact name (optional)</label>
            <input className={field} placeholder="e.g. Sarah Jones" value={contactName} onChange={(e) => setContactName(e.target.value)} />
          </div>
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

              <label className="flex items-start gap-2 text-sm text-slate-700">
                <input type="checkbox" className="mt-0.5" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
                The candidate has agreed to be put forward to employers anonymously.
              </label>

              <div className="flex gap-2">
                <button onClick={create} disabled={stage !== "idle"} className="flex-1 rounded-lg bg-[#F7931E] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
                  {stage === "saving" ? "Creating…" : "Create link"}
                </button>
                <button onClick={write} disabled={stage !== "idle"} className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-600">
                  Rewrite
                </button>
              </div>
            </>
          )}

          <button onClick={() => setOpen(false)} className="w-full text-center text-sm text-slate-500 hover:text-slate-700">
            Cancel
          </button>
        </div>
      )}

      {made && (
        <div className="mt-4 space-y-3">
          <p className="rounded-lg bg-green-50 p-2.5 text-sm text-green-800">Done. Copy the email below and send it from your own inbox.</p>
          <div>
            <label className={label}>Subject</label>
            <div className="flex gap-2">
              <input readOnly className={field} value={made.subject} />
              <button onClick={() => copy(made.subject, "subject")} className="rounded-lg border border-slate-200 px-3 text-sm">
                {copied === "subject" ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
          <div>
            <label className={label}>Email</label>
            <textarea readOnly rows={12} className={field} value={made.body} />
            <button onClick={() => copy(made.body, "body")} className="mt-1 w-full rounded-lg bg-[#F7931E] px-4 py-2 text-sm font-semibold text-white">
              {copied === "body" ? "Copied" : "Copy email"}
            </button>
          </div>
          <div className="flex gap-2">
            <a href={`${made.url}?preview=1`} target="_blank" className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-center text-sm">
              Preview page
            </a>
            <button onClick={() => copy(made.url, "link")} className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm">
              {copied === "link" ? "Copied" : "Copy link only"}
            </button>
          </div>
          <button
            onClick={() => {
              setOpen(false);
              reset();
            }}
            className="w-full text-center text-sm text-slate-500 hover:text-slate-700"
          >
            Close
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
                    <p className="text-xs text-slate-400">Sent {timeAgo(s.created_at)}</p>
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
