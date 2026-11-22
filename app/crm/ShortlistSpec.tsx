"use client";

// "Send as spec" from a list of candidates: a shortlist of 2 to 5 anonymised profiles, sent to one or more companies
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import type { SpecContent } from "@/lib/specs";
import SpecSender from "./SpecSender";

async function api(body: object) {
  const { data } = await supabase.auth.getSession();
  const res = await fetch("/api/crm/specs", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session?.access_token ?? ""}` },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || "Something went wrong.");
  return json;
}

const lines = (t: string) => t.split("\n").map((x) => x.trim()).filter(Boolean);

type Draft = { id: string; name: string; content: SpecContent | null; ticks: string; error: string | null };

export default function ShortlistSpec({
  people,
  role: defaultRole,
  onClose,
}: {
  people: { id: string; name: string }[];
  role: string;
  onClose: () => void;
}) {
  const [role, setRole] = useState(defaultRole);
  const [intro, setIntro] = useState("");
  const [sending, setSending] = useState(false);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [stage, setStage] = useState<"idle" | "writing">("idle");
  const [error, setError] = useState<string | null>(null);

  const tooMany = people.length > 5;
  const tooFew = people.length < 2;

  async function writeAll() {
    setStage("writing");
    setError(null);
    const results = await Promise.all(
      people.map(async (p): Promise<Draft> => {
        try {
          const j = await api({ action: "draft", candidateId: p.id, role });
          const c = j.content as SpecContent;
          return { id: p.id, name: p.name, content: c, ticks: c.checklist.join("\n"), error: null };
        } catch (e) {
          return { id: p.id, name: p.name, content: null, ticks: "", error: (e as Error).message };
        }
      })
    );
    setDrafts(results);
    if (!intro) setIntro(`${people.length} candidates we think would suit you`);
    setStage("idle");
  }

  function patch(id: string, change: Partial<SpecContent>) {
    setDrafts((list) => list.map((d) => (d.id === id && d.content ? { ...d, content: { ...d.content, ...change } } : d)));
  }

  const ready = drafts.filter((d) => d.content);
  const items = ready.map((d) => ({ candidateId: d.id, content: { ...d.content!, checklist: lines(d.ticks) } }));

  const field = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#F7931E] focus:outline-none";
  const label = "mb-1 block text-xs font-semibold text-slate-500";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Send as spec"
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white p-6 sm:max-w-2xl sm:rounded-2xl"
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#1F3447]">Send as a shortlist spec</h2>
            <p className="mt-1 text-sm text-slate-500">{people.length} anonymised profiles on one page, sent to as many companies as you like. You get an email when they open it, who they look at and who they pick.</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100">
            ✕
          </button>
        </div>

        {(tooMany || tooFew) && (
          <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
            {tooMany ? "Pick up to 5 people for a shortlist. Clients read a short list; send the rest another time." : "Pick at least 2 people. For one person, use the Spec card on their profile."}
          </p>
        )}
        {error && <p className="mt-4 rounded-lg bg-red-50 p-2.5 text-sm text-red-700">{error}</p>}

        {!tooMany && !tooFew && (
          <div className="mt-4 space-y-3">
            <div>
              <label className={label}>What they might need (optional)</label>
              <input className={field} placeholder="e.g. Class 1 night drivers" value={role} onChange={(e) => setRole(e.target.value)} />
            </div>

            {!drafts.length ? (
              <button onClick={writeAll} disabled={stage !== "idle"} className="w-full rounded-lg bg-[#F7931E] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
                {stage === "writing" ? `Writing ${people.length} profiles…` : `Write ${people.length} profiles`}
              </button>
            ) : (
              <>
                <div>
                  <label className={label}>Heading on the page</label>
                  <input className={field} value={intro} onChange={(e) => setIntro(e.target.value)} />
                </div>

                <ul className="space-y-2">
                  {drafts.map((d) => (
                    <li key={d.id} className="rounded-xl border border-slate-200 p-3">
                      {!d.content ? (
                        <p className="text-sm text-red-700">
                          {d.name}: {d.error} This person will be left out.
                        </p>
                      ) : (
                        <>
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-800">
                                {d.content.display_name} <span className="font-normal text-slate-400">({d.name})</span>
                              </p>
                              <p className="truncate text-sm text-slate-600">{d.content.headline}</p>
                            </div>
                            <button onClick={() => setEditing(editing === d.id ? null : d.id)} className="flex-none text-sm font-semibold text-[#F7931E]">
                              {editing === d.id ? "Done" : "Edit"}
                            </button>
                          </div>
                          {editing === d.id && (
                            <div className="mt-3 space-y-2">
                              <div>
                                <label className={label}>Shown as</label>
                                <input className={field} value={d.content.display_name} onChange={(e) => patch(d.id, { display_name: e.target.value })} />
                              </div>
                              <div>
                                <label className={label}>Headline</label>
                                <input className={field} value={d.content.headline} onChange={(e) => patch(d.id, { headline: e.target.value })} />
                              </div>
                              <div>
                                <label className={label}>Ticks (one per line)</label>
                                <textarea
                                  className={field}
                                  rows={4}
                                  value={d.ticks}
                                  onChange={(e) => setDrafts((list) => list.map((x) => (x.id === d.id ? { ...x, ticks: e.target.value } : x)))}
                                />
                              </div>
                              <div>
                                <label className={label}>Why they&apos;d suit them</label>
                                <textarea className={field} rows={3} value={d.content.why} onChange={(e) => patch(d.id, { why: e.target.value })} />
                              </div>
                              <div className="grid grid-cols-3 gap-2">
                                <div>
                                  <label className={label}>Area</label>
                                  <input className={field} value={d.content.area} onChange={(e) => patch(d.id, { area: e.target.value })} />
                                </div>
                                <div>
                                  <label className={label}>Available</label>
                                  <input className={field} value={d.content.availability} onChange={(e) => patch(d.id, { availability: e.target.value })} />
                                </div>
                                <div>
                                  <label className={label}>Expecting</label>
                                  <input className={field} value={d.content.salary} onChange={(e) => patch(d.id, { salary: e.target.value })} />
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </li>
                  ))}
                </ul>

                {!sending ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => (ready.length < 2 ? setError("At least two profiles need writing. Try Rewrite all.") : (setError(null), setSending(true)))}
                      className="flex-1 rounded-lg bg-[#F7931E] px-4 py-2.5 text-sm font-semibold text-white"
                    >
                      Next: who&apos;s it going to?
                    </button>
                    <button onClick={writeAll} disabled={stage !== "idle"} className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-600">
                      {stage === "writing" ? "Rewriting…" : "Rewrite all"}
                    </button>
                  </div>
                ) : (
                  <div className="border-t border-slate-100 pt-4">
                    <SpecSender items={items} role={role} intro={intro} onClose={onClose} />
                  </div>
                )}
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
