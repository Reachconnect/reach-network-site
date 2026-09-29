"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Offer = {
  id: string;
  title: string;
  retailer: string;
  description: string | null;
  category: string;
  offer_type: "code" | "link" | "in_store";
  discount_code: string | null;
  link_url: string | null;
  image_url: string | null;
  terms: string | null;
  location: string | null;
  source: "manual" | "local" | "awin";
  is_featured: boolean;
  is_active: boolean;
  hidden_reason: string | null;
  starts_at: string | null;
  expires_at: string | null;
  created_at: string;
};

type Stats = { offer_id: string; clicks: number; worked_votes: number; failed_votes: number };
type Tab = "live" | "scheduled" | "hidden" | "expired";

const CATEGORIES = [
  "Food & drink", "Groceries", "Fuel & motoring", "Shopping", "Health & fitness",
  "Days out", "Travel", "Home", "Local services", "Other",
];

const EMPTY_FORM = {
  title: "",
  retailer: "",
  description: "",
  category: "Food & drink",
  offer_type: "code" as Offer["offer_type"],
  discount_code: "",
  link_url: "",
  image_url: "",
  terms: "",
  location: "",
  source: "manual" as Offer["source"],
  is_featured: false,
  starts_on: "",
  expires_on: "",
};
type FormState = typeof EMPTY_FORM;

const toStartOfDay = (d: string) => (d ? new Date(`${d}T00:00:00`).toISOString() : null);
const toEndOfDay = (d: string) => (d ? new Date(`${d}T23:59:59`).toISOString() : null);
const toDateInput = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const formatDate = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/London" })
    : "No end date";

function statusOf(o: Offer): Tab {
  const now = Date.now();
  if (o.expires_at && new Date(o.expires_at).getTime() <= now) return "expired";
  if (!o.is_active) return "hidden";
  if (o.starts_at && new Date(o.starts_at).getTime() > now) return "scheduled";
  return "live";
}

export default function OffersAdmin() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [stats, setStats] = useState<Record<string, Stats>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("live");
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Offer | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    const [offersRes, statsRes] = await Promise.all([
      supabase.from("reward_offers").select("*").order("created_at", { ascending: false }),
      supabase.from("reward_offer_stats").select("offer_id, clicks, worked_votes, failed_votes"),
    ]);
    if (offersRes.error) setError(`Couldn't load offers: ${offersRes.error.message}`);
    else setOffers(offersRes.data as Offer[]);
    if (!statsRes.error && statsRes.data) {
      const map: Record<string, Stats> = {};
      (statsRes.data as Stats[]).forEach((s) => (map[s.offer_id] = s));
      setStats(map);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const counts = useMemo(() => {
    const c = { live: 0, scheduled: 0, hidden: 0, expired: 0 };
    offers.forEach((o) => c[statusOf(o)]++);
    return c;
  }, [offers]);

  const totalClicks = useMemo(
    () => Object.values(stats).reduce((sum, s) => sum + Number(s.clicks || 0), 0),
    [stats]
  );

  const autoHidden = offers.filter((o) => o.hidden_reason?.startsWith("Auto-hidden")).length;

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return offers
      .filter((o) => statusOf(o) === tab)
      .filter(
        (o) =>
          !q ||
          o.title.toLowerCase().includes(q) ||
          o.retailer.toLowerCase().includes(q) ||
          o.category.toLowerCase().includes(q) ||
          (o.location || "").toLowerCase().includes(q)
      )
      .sort((a, b) => Number(b.is_featured) - Number(a.is_featured));
  }, [offers, tab, search]);

  function openNew() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setFormOpen(true);
  }

  function openEdit(o: Offer) {
    setEditingId(o.id);
    setForm({
      title: o.title,
      retailer: o.retailer,
      description: o.description || "",
      category: o.category,
      offer_type: o.offer_type,
      discount_code: o.discount_code || "",
      link_url: o.link_url || "",
      image_url: o.image_url || "",
      terms: o.terms || "",
      location: o.location || "",
      source: o.source,
      is_featured: o.is_featured,
      starts_on: toDateInput(o.starts_at),
      expires_on: toDateInput(o.expires_at),
    });
    setFormError(null);
    setFormOpen(true);
  }

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function saveOffer() {
    setFormError(null);
    if (!form.title.trim() || !form.retailer.trim()) return setFormError("Add a title and a retailer name.");
    if (form.offer_type === "code" && !form.discount_code.trim()) return setFormError("Code offers need a discount code.");
    if (form.offer_type === "link" && !form.link_url.trim()) return setFormError("Link offers need a website link.");
    if (form.link_url && !/^https?:\/\//i.test(form.link_url.trim())) return setFormError("Website links must start with https://");
    if (form.starts_on && form.expires_on && form.expires_on < form.starts_on) return setFormError("The end date is before the start date.");

    setSaving(true);
    const payload = {
      title: form.title.trim(),
      retailer: form.retailer.trim(),
      description: form.description.trim() || null,
      category: form.category,
      offer_type: form.offer_type,
      discount_code: form.discount_code.trim() || null,
      link_url: form.link_url.trim() || null,
      image_url: form.image_url.trim() || null,
      terms: form.terms.trim() || null,
      location: form.location.trim() || null,
      source: form.source,
      is_featured: form.is_featured,
      starts_at: toStartOfDay(form.starts_on),
      expires_at: toEndOfDay(form.expires_on),
    };

    let result;
    if (editingId) {
      result = await supabase.from("reward_offers").update(payload).eq("id", editingId);
    } else {
      const { data: userData } = await supabase.auth.getUser();
      result = await supabase.from("reward_offers").insert({ ...payload, created_by: userData.user?.id ?? null });
    }
    setSaving(false);
    if (result.error) return setFormError(`Couldn't save: ${result.error.message}`);
    setFormOpen(false);
    load();
  }

  async function toggleFeatured(o: Offer) {
    const { error } = await supabase.from("reward_offers").update({ is_featured: !o.is_featured }).eq("id", o.id);
    if (error) setError(`Couldn't update: ${error.message}`);
    else load();
  }

  async function toggleHidden(o: Offer) {
    const showing = !o.is_active;
    const { error } = await supabase
      .from("reward_offers")
      .update({ is_active: showing, hidden_reason: showing ? null : "Hidden by Reach" })
      .eq("id", o.id);
    if (error) setError(`Couldn't update: ${error.message}`);
    else load();
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const { error } = await supabase.from("reward_offers").delete().eq("id", deleteTarget.id);
    setDeleteTarget(null);
    if (error) setError(`Couldn't delete: ${error.message}`);
    else load();
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "live", label: "Live" },
    { key: "scheduled", label: "Scheduled" },
    { key: "hidden", label: "Hidden" },
    { key: "expired", label: "Expired" },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#0F2438]">Offers</h2>
          <p className="mt-1 text-sm text-slate-600">What members see on the offers page.</p>
        </div>
        <button
          onClick={openNew}
          className="rounded-lg bg-[#F7931E] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#e2841a]"
        >
          Add offer
        </button>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryTile label="Live offers" value={counts.live} />
        <SummaryTile label="Featured" value={offers.filter((o) => o.is_featured && statusOf(o) === "live").length} />
        <SummaryTile
          label="Hidden"
          value={counts.hidden}
          note={autoHidden > 0 ? `${autoHidden} reported not working` : undefined}
        />
        <SummaryTile label="Total clicks" value={totalClicks} />
      </div>

      {error && <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 overflow-x-auto rounded-lg bg-white p-1 shadow-sm ring-1 ring-slate-200">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium ${
                tab === t.key ? "bg-[#0F2438] text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {t.label} <span className="ml-1 opacity-70">{counts[t.key]}</span>
            </button>
          ))}
        </div>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search retailer, category or town"
          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm focus:border-[#F7931E] focus:outline-none focus:ring-2 focus:ring-[#F7931E]/30 sm:w-72"
        />
      </div>

      {loading ? (
        <p className="py-12 text-center text-sm text-slate-500">Loading offers…</p>
      ) : visible.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white py-12 text-center">
          <p className="text-sm text-slate-600">
            {search
              ? "No offers match your search."
              : tab === "live"
              ? "No live offers yet. Add your first one so members have something to see."
              : `No ${tab} offers.`}
          </p>
          {tab === "live" && !search && (
            <button onClick={openNew} className="mt-4 text-sm font-semibold text-[#F7931E] hover:underline">
              Add offer
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
          <ul className="divide-y divide-slate-100">
            {visible.map((o) => {
              const s = stats[o.id];
              return (
                <li key={o.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#0F2438] text-lg font-bold text-white">
                    {o.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={o.image_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      o.retailer.charAt(0).toUpperCase()
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-[#0F2438]">{o.title}</p>
                      {o.is_featured && (
                        <span className="rounded-full bg-[#F7931E]/15 px-2 py-0.5 text-xs font-medium text-[#b8660b]">
                          Featured
                        </span>
                      )}
                      {o.source === "local" && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                          Local{o.location ? `: ${o.location}` : ""}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-600">
                      {o.retailer} · {o.category} · Ends {formatDate(o.expires_at)}
                    </p>
                    {o.hidden_reason && <p className="mt-1 text-xs font-medium text-red-600">{o.hidden_reason}</p>}
                  </div>

                  <div className="flex gap-4 text-sm text-slate-600 sm:w-56 sm:justify-end">
                    <span>{s?.clicks ?? 0} clicks</span>
                    <span>
                      <span className="text-green-700">{s?.worked_votes ?? 0} ✓</span>{" "}
                      <span className="text-red-600">{s?.failed_votes ?? 0} ✗</span>
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 sm:justify-end">
                    <ActionButton onClick={() => openEdit(o)}>Edit</ActionButton>
                    {statusOf(o) !== "expired" && (
                      <>
                        <ActionButton onClick={() => toggleFeatured(o)}>
                          {o.is_featured ? "Unfeature" : "Feature"}
                        </ActionButton>
                        <ActionButton onClick={() => toggleHidden(o)}>{o.is_active ? "Hide" : "Show"}</ActionButton>
                      </>
                    )}
                    <ActionButton danger onClick={() => setDeleteTarget(o)}>
                      Delete
                    </ActionButton>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {formOpen && (
        <Modal onClose={() => !saving && setFormOpen(false)}>
          <h2 className="text-lg font-bold text-[#0F2438]">{editingId ? "Edit offer" : "Add offer"}</h2>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Offer title" hint="What members get, e.g. 20% off all hot food">
              <input className={inputClass} value={form.title} onChange={(e) => update("title", e.target.value)} />
            </Field>
            <Field label="Retailer or business">
              <input className={inputClass} value={form.retailer} onChange={(e) => update("retailer", e.target.value)} />
            </Field>

            <Field label="Category">
              <select className={inputClass} value={form.category} onChange={(e) => update("category", e.target.value)}>
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="Type of offer">
              <select
                className={inputClass}
                value={form.source}
                onChange={(e) => update("source", e.target.value as Offer["source"])}
              >
                <option value="manual">National / online</option>
                <option value="local">Local business</option>
              </select>
            </Field>

            <Field label="How members redeem it" full>
              <div className="flex flex-wrap gap-2">
                {[
                  { v: "code", l: "Discount code" },
                  { v: "link", l: "Website link only" },
                  { v: "in_store", l: "Show in store" },
                ].map((opt) => (
                  <button
                    key={opt.v}
                    type="button"
                    onClick={() => update("offer_type", opt.v as Offer["offer_type"])}
                    className={`rounded-lg border px-3 py-2 text-sm ${
                      form.offer_type === opt.v
                        ? "border-[#F7931E] bg-[#F7931E]/10 font-semibold text-[#0F2438]"
                        : "border-slate-300 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {opt.l}
                  </button>
                ))}
              </div>
            </Field>

            {form.offer_type === "code" && (
              <Field label="Discount code">
                <input
                  className={`${inputClass} font-semibold tracking-wide`}
                  value={form.discount_code}
                  onChange={(e) => update("discount_code", e.target.value)}
                />
              </Field>
            )}
            <Field
              label={form.offer_type === "link" ? "Website link" : "Website link (optional)"}
              full={form.offer_type !== "code"}
            >
              <input
                className={inputClass}
                placeholder="https://"
                value={form.link_url}
                onChange={(e) => update("link_url", e.target.value)}
              />
            </Field>

            {form.source === "local" && (
              <Field label="Town or area" hint="e.g. Bromsgrove">
                <input className={inputClass} value={form.location} onChange={(e) => update("location", e.target.value)} />
              </Field>
            )}
            <Field label="Logo or image link (optional)" full={form.source !== "local"}>
              <input
                className={inputClass}
                placeholder="https://"
                value={form.image_url}
                onChange={(e) => update("image_url", e.target.value)}
              />
            </Field>

            <Field label="Description (optional)" full>
              <textarea
                rows={2}
                className={inputClass}
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
              />
            </Field>
            <Field label="Terms (optional)" hint="e.g. Min spend £10. Show your Reach Rewards screen at the till." full>
              <textarea rows={2} className={inputClass} value={form.terms} onChange={(e) => update("terms", e.target.value)} />
            </Field>

            <Field label="Starts (optional)" hint="Leave blank to go live now">
              <input
                type="date"
                className={inputClass}
                value={form.starts_on}
                onChange={(e) => update("starts_on", e.target.value)}
              />
            </Field>
            <Field label="Ends (optional)" hint="Disappears after this day">
              <input
                type="date"
                className={inputClass}
                value={form.expires_on}
                onChange={(e) => update("expires_on", e.target.value)}
              />
            </Field>

            <label className="flex items-center gap-2 text-sm text-slate-700 sm:col-span-2">
              <input
                type="checkbox"
                checked={form.is_featured}
                onChange={(e) => update("is_featured", e.target.checked)}
                className="h-4 w-4 accent-[#F7931E]"
              />
              Feature this offer at the top of the offers page
            </label>
          </div>

          {formError && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>}

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={() => setFormOpen(false)}
              disabled={saving}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              onClick={saveOffer}
              disabled={saving}
              className="rounded-lg bg-[#F7931E] px-5 py-2 text-sm font-semibold text-white hover:bg-[#e2841a] disabled:opacity-60"
            >
              {saving ? "Saving…" : editingId ? "Save changes" : "Add offer"}
            </button>
          </div>
        </Modal>
      )}

      {deleteTarget && (
        <Modal onClose={() => setDeleteTarget(null)} small>
          <h2 className="text-lg font-bold text-[#0F2438]">Delete this offer?</h2>
          <p className="mt-2 text-sm text-slate-600">
            &ldquo;{deleteTarget.title}&rdquo; from {deleteTarget.retailer} will be removed, along with its clicks and
            votes. To take it down but keep the history, use Hide instead.
          </p>
          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={() => setDeleteTarget(null)}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              className="rounded-lg bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              Delete offer
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#F7931E] focus:outline-none focus:ring-2 focus:ring-[#F7931E]/30";

function SummaryTile({ label, value, note }: { label: string; value: number; note?: string }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <p className="text-sm text-slate-600">{label}</p>
      <p className="mt-1 text-2xl font-bold text-[#0F2438]">{value}</p>
      {note && <p className="mt-1 text-xs font-medium text-red-600">{note}</p>}
    </div>
  );
}

function ActionButton({ children, onClick, danger }: { children: React.ReactNode; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-md border px-3 py-1.5 text-xs font-medium ${
        danger ? "border-red-200 text-red-600 hover:bg-red-50" : "border-slate-300 text-slate-700 hover:bg-slate-50"
      }`}
    >
      {children}
    </button>
  );
}

function Field({ label, hint, full, children }: { label: string; hint?: string; full?: boolean; children: React.ReactNode }) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

function Modal({ children, onClose, small }: { children: React.ReactNode; onClose: () => void; small?: boolean }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#0F2438]/60 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className={`max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl ${
          small ? "sm:max-w-md" : "sm:max-w-2xl"
        }`}
      >
        {children}
      </div>
    </div>
  );
}