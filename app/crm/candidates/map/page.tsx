"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Icon, STAGES, candidateName, type Specialism } from "../../crm";
import type { Area } from "./MapView";

const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center text-sm text-slate-500">Loading map…</div>,
});

type Row = {
  id: string;
  first_name: string;
  last_name: string | null;
  job_title: string | null;
  stage: string;
  latitude: number | null;
  longitude: number | null;
  geo_label: string | null;
};

export default function CandidateMapPage() {
  return (
    <Suspense fallback={<p className="p-8 text-slate-500">Loading…</p>}>
      <CandidateMap />
    </Suspense>
  );
}

function CandidateMap() {
  const params = useSearchParams();
  const router = useRouter();
  const slug = params.get("s");

  const [specialisms, setSpecialisms] = useState<Specialism[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [stage, setStage] = useState("all");
  const [loading, setLoading] = useState(true);
  const [mapping, setMapping] = useState<number | null>(null);
  const [focus, setFocus] = useState<Area | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Work out locations for anyone new, in batches
  const geocode = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    for (let guard = 0; guard < 50; guard++) {
      const res = await fetch("/api/crm/geocode", { method: "POST", headers: { Authorization: `Bearer ${data.session?.access_token ?? ""}` } });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(j.error || "Couldn't work out locations just now.");
        break;
      }
      setMapping(j.remaining);
      if (!j.remaining || !j.checked) break;
    }
    setMapping(null);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: specs } = await supabase.from("crm_specialisms").select("*").order("sort_order").order("name");
    const list = (specs ?? []) as Specialism[];
    setSpecialisms(list);
    const me = slug ? list.find((s) => s.slug === slug) : null;

    // Fetch everyone, 1,000 at a time
    const all: Row[] = [];
    for (let from = 0; from < 50000; from += 1000) {
      let q = supabase
        .from("crm_candidates")
        .select("id, first_name, last_name, job_title, stage, latitude, longitude, geo_label")
        .order("id")
        .range(from, from + 999);
      if (me) q = q.eq("specialism_id", me.id);
      const { data, error: e } = await q;
      if (e) {
        setError(e.message);
        break;
      }
      all.push(...((data ?? []) as Row[]));
      if (!data || data.length < 1000) break;
    }
    setRows(all);
    setLoading(false);
  }, [slug]);

  useEffect(() => {
    (async () => {
      await geocode();
      await load();
    })();
  }, [geocode, load]);

  const shown = useMemo(() => rows.filter((r) => stage === "all" || r.stage === stage), [rows, stage]);
  const placed = shown.filter((r) => r.latitude !== null && r.longitude !== null);
  const unknown = shown.length - placed.length;

  // Group into areas roughly 5 miles across
  const areas = useMemo(() => {
    const groups = new Map<string, { lat: number; lng: number; labels: Map<string, number>; people: Area["people"] }>();
    for (const r of placed) {
      const key = `${Math.round((r.latitude as number) * 12)}:${Math.round((r.longitude as number) * 8)}`;
      const g = groups.get(key) ?? { lat: 0, lng: 0, labels: new Map(), people: [] };
      g.lat += r.latitude as number;
      g.lng += r.longitude as number;
      if (r.geo_label) g.labels.set(r.geo_label, (g.labels.get(r.geo_label) ?? 0) + 1);
      g.people.push({ id: r.id, name: candidateName(r), job_title: r.job_title, stage: r.stage });
      groups.set(key, g);
    }
    return [...groups.entries()]
      .map(([key, g]) => ({
        key,
        lat: g.lat / g.people.length,
        lng: g.lng / g.people.length,
        label: [...g.labels.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Unknown area",
        people: g.people,
      }))
      .sort((a, b) => b.people.length - a.people.length);
  }, [placed]);

  const current = specialisms.find((s) => s.slug === slug) || null;

  return (
    <div className="flex h-full flex-col p-5 lg:p-8">
      <Link href={slug ? `/crm/candidates?s=${slug}` : "/crm/candidates"} className="text-sm font-medium text-slate-500 hover:text-[#1F3447]">
        ‹ Back to the list
      </Link>

      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold text-[#1F3447]">
            {current && <span>{current.emoji}</span>}
            {current ? current.name : "All candidates"} map
          </h1>
          <p className="mt-1 text-slate-500">
            {loading ? "Loading…" : `${placed.length.toLocaleString("en-GB")} on the map in ${areas.length} areas`}
            {!loading && unknown > 0 && `, ${unknown.toLocaleString("en-GB")} with no usable location`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={slug ?? ""}
            onChange={(e) => router.push(e.target.value ? `/crm/candidates/map?s=${e.target.value}` : "/crm/candidates/map")}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            aria-label="Specialism"
          >
            <option value="">Every specialism</option>
            {specialisms.map((s) => (
              <option key={s.id} value={s.slug}>
                {s.emoji} {s.name}
              </option>
            ))}
          </select>
          <select value={stage} onChange={(e) => setStage(e.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" aria-label="Stage">
            <option value="all">Any stage</option>
            {STAGES.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {mapping !== null && mapping > 0 && (
        <p className="mt-4 rounded-lg bg-orange-50 px-4 py-2 text-sm text-orange-800">Working out locations… {mapping.toLocaleString("en-GB")} still to go.</p>
      )}
      {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <div className="mt-5 grid min-h-[32rem] flex-1 gap-4 lg:grid-cols-[1fr_18rem]">
        <div className="min-h-[28rem] overflow-hidden rounded-2xl bg-white shadow-sm">
          {!loading && <MapView areas={areas} focus={focus} />}
        </div>

        <aside className="flex min-h-0 flex-col rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="flex items-center gap-2 font-bold text-[#1F3447]">
            <Icon name="users" className="h-4 w-4" /> Top areas
          </h2>
          <ul className="mt-3 min-h-0 flex-1 space-y-1 overflow-y-auto">
            {areas.length === 0 && !loading && <li className="text-sm text-slate-500">No locations yet.</li>}
            {areas.map((a) => (
              <li key={a.key}>
                <button onClick={() => setFocus(a)} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-slate-100">
                  <span className="min-w-0 flex-1 truncate text-slate-700">{a.label}</span>
                  <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-bold text-orange-800">{a.people.length}</span>
                </button>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}