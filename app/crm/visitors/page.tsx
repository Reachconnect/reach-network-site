"use client";

// Website visitors: people from your emails and specs who have come back to look at the website
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { timeAgo } from "../crm";

type Visitor = { id: string; email: string | null; name: string | null; company: string | null; company_id: string | null; source: string | null; first_seen: string; last_seen: string; visits: number; pages: number; seconds: number };
type Visit = { visitor_id: string; path: string; title: string | null; at: string; seconds: number };

const HOT = [/^\/i-need-staff/, /^\/book-a-call/, /^\/book-a-demo/, /^\/contact-us/, /^\/permanent-recruitment/, /^\/temporary-recruitment/, /^\/our-services/];
const pageName = (p: string) => (p === "/" ? "Home page" : p.startsWith("/spec/") ? "Their spec page" : p.startsWith("/v/") ? "Your video" : p.replace(/^\//, "").split("/")[0].replace(/-/g, " ").replace(/^\w/, (c) => c.toUpperCase()));
const mins = (s: number) => (s >= 60 ? `${Math.round(s / 60)} min` : `${s} sec`);

export default function VisitorsPage() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [last30, setLast30] = useState({ visitors: 0, page_views: 0 });
  const [hotOnly, setHotOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      const res = await fetch("/api/crm/visitors", { headers: { Authorization: `Bearer ${data.session?.access_token ?? ""}` } });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) setError(j.error || "Couldn't load visitors.");
      else {
        setVisitors(j.visitors ?? []);
        setVisits(j.visits ?? []);
        setLast30(j.last30);
      }
      setLoading(false);
    })();
  }, []);

  const byVisitor = useMemo(() => {
    const m = new Map<string, Visit[]>();
    for (const v of visits) m.set(v.visitor_id, [...(m.get(v.visitor_id) ?? []), v]);
    return m;
  }, [visits]);

  const isHot = (id: string) => (byVisitor.get(id) ?? []).some((v) => HOT.some((r) => r.test(v.path)));
  const shown = hotOnly ? visitors.filter((v) => isHot(v.id)) : visitors;

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-[#1F3447]">Website visitors</h1>
        <p className="text-sm text-slate-500">
          People who clicked through from your emails or specs, accepted cookies, and looked around your website. You get an email when one of them looks at &ldquo;I need staff&rdquo;, &ldquo;Book a call&rdquo; or your services pages.
        </p>
      </div>
      {error && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Known visitors", String(visitors.length)],
          ["Looked at ready-to-talk pages", String(visitors.filter((v) => isHot(v.id)).length)],
          ["Visitors in 30 days (all)", last30.visitors.toLocaleString()],
          ["Page views in 30 days", last30.page_views.toLocaleString()],
        ].map(([k, v]) => (
          <div key={k} className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold text-slate-500">{k}</p>
            <p className="mt-1 text-2xl font-bold text-[#1F3447]">{v}</p>
          </div>
        ))}
      </div>

      <label className="mb-3 flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" checked={hotOnly} onChange={(e) => setHotOnly(e.target.checked)} />
        Only show people who looked at ready-to-talk pages
      </label>

      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : !shown.length ? (
        <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
          <p className="text-lg font-semibold text-[#1F3447]">No known visitors yet</p>
          <p className="mx-auto mt-1 max-w-lg text-sm text-slate-500">
            When someone clicks a link to your website in a campaign email or opens a spec, then accepts cookies, they&apos;ll appear here with every page they look at.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {shown.map((v) => {
            const pages = byVisitor.get(v.id) ?? [];
            return (
              <div key={v.id} className="rounded-2xl bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-800">
                      {isHot(v.id) && "🔥 "}
                      {v.name || v.email}
                      {v.company && (
                        <span className="font-normal text-slate-500">
                          {" · "}
                          {v.company_id ? (
                            <Link href={`/crm/sales/view?id=${v.company_id}`} className="text-[#F7931E] hover:underline">
                              {v.company}
                            </Link>
                          ) : (
                            v.company
                          )}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-slate-500">
                      {v.email && (
                        <a href={`mailto:${v.email}`} className="hover:underline">
                          {v.email}
                        </a>
                      )}
                      {v.source ? ` · came from ${v.source}` : ""}
                    </p>
                  </div>
                  <p className="text-right text-xs text-slate-500">
                    Last seen {timeAgo(v.last_seen)}
                    <br />
                    {v.visits} visit{v.visits === 1 ? "" : "s"} · {v.pages} page{v.pages === 1 ? "" : "s"} · {mins(v.seconds || 0)}
                  </p>
                </div>
                {pages.length > 0 && (
                  <ol className="mt-3 flex flex-wrap gap-1.5">
                    {pages.slice(0, 12).map((p, i) => (
                      <li key={i} className={`rounded-full px-2.5 py-1 text-xs ${HOT.some((r) => r.test(p.path)) ? "bg-orange-100 font-semibold text-[#9a5200]" : "bg-slate-100 text-slate-600"}`} title={`${new Date(p.at).toLocaleString("en-GB")}${p.seconds ? ` · ${mins(p.seconds)}` : ""}`}>
                        {pageName(p.path)}
                        {p.seconds ? ` · ${mins(p.seconds)}` : ""}
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            );
          })}
        </div>
      )}

      <p className="mt-6 text-xs text-slate-400">
        Only people who accept the cookie banner are recorded. Anyone who arrives some other way shows in the totals above, but not by name.
      </p>
    </div>
  );
}
