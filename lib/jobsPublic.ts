// Jobs on the public website: from the CRM (published ones) and the older website job list
import { admin } from "./crmServer";

export type PublicJob = {
  key: string; // "c-<id>" for CRM jobs, "j-<id>" for older website jobs
  source: "crm" | "legacy";
  id: string;
  slug: string;
  href: string;
  title: string;
  category: string;
  location: string | null;
  area: string | null;
  postcode_area: string | null;
  employment_type: string | null;
  salary: string | null;
  salary_from: number | null;
  salary_to: number | null;
  hours: string | null;
  start: string | null;
  summary: string | null;
  duties: string[];
  requirements: string[];
  benefits: string[];
  description: string | null;
  company: string | null;
  lat: number | null;
  lng: number | null;
  positions: number;
  closing_date: string | null;
  created_at: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

export function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

export const lines = (s: string | null | undefined) =>
  (s || "")
    .split("\n")
    .map((x) => x.replace(/^[-•*]\s*/, "").trim())
    .filter(Boolean);

export function payText(from: number | null, to: number | null, notes?: string | null) {
  const fmt = (n: number) => (n < 200 ? `£${n.toFixed(2).replace(/\.00$/, "")}` : `£${Math.round(n).toLocaleString("en-GB")}`);
  const per = (n: number) => (n < 200 ? " an hour" : "");
  let t = "";
  if (from && to && to !== from) t = `${fmt(from)} to ${fmt(to)}${per(to)}`;
  else if (from || to) t = `${fmt((from || to)!)}${per((from || to)!)}`;
  return t || notes || null;
}

const TYPE_LABEL: Record<string, string> = { permanent: "Permanent", temporary: "Temporary", contract: "Contract", temp_to_perm: "Temp to perm" };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromCrm(j: Any): PublicJob {
  return {
    key: `c-${j.id}`,
    source: "crm",
    id: j.id,
    slug: j.slug || `c-${j.id}`,
    href: `/jobs/${j.slug || `c-${j.id}`}`,
    title: j.web_title || j.title,
    category: j.crm_specialisms?.name || "Other",
    location: j.location,
    area: j.area || j.location,
    postcode_area: j.postcode ? String(j.postcode).toUpperCase().split(" ")[0] : null,
    employment_type: TYPE_LABEL[j.job_type] || null,
    salary: j.pay_text || payText(j.salary_from, j.salary_to, j.salary_notes),
    salary_from: j.salary_from,
    salary_to: j.salary_to,
    hours: j.hours,
    start: j.start_text,
    summary: j.summary,
    duties: lines(j.duties),
    requirements: lines(j.requirements),
    benefits: lines(j.benefits),
    description: j.summary || j.description,
    company: j.show_company ? j.crm_companies?.name || null : null,
    lat: j.lat,
    lng: j.lng,
    positions: j.positions || 1,
    closing_date: j.closing_date,
    created_at: j.published_at || j.created_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromLegacy(j: Any): PublicJob {
  return {
    key: `j-${j.id}`,
    source: "legacy",
    id: j.id,
    slug: `j-${j.id}`,
    href: `/jobs/j-${j.id}`,
    title: j.title,
    category: j.category || "Other",
    location: j.location,
    area: j.location,
    postcode_area: null,
    employment_type: j.employment_type,
    salary: j.salary,
    salary_from: null,
    salary_to: null,
    hours: null,
    start: null,
    summary: j.description,
    duties: [],
    requirements: [],
    benefits: [],
    description: j.description,
    company: null,
    lat: null,
    lng: null,
    positions: 1,
    closing_date: null,
    created_at: j.created_at,
  };
}

const CRM_SELECT = "*, crm_specialisms(name), crm_companies(name)";
const live = (j: Any) => !j.closing_date || new Date(`${j.closing_date}T23:59:59`) >= new Date();

export async function listPublicJobs(): Promise<PublicJob[]> {
  const db = admin();
  const [crm, legacy] = await Promise.all([
    db.from("crm_jobs").select(CRM_SELECT).eq("published", true).eq("status", "open").order("published_at", { ascending: false }),
    db.from("jobs").select("*").eq("status", "open").order("created_at", { ascending: false }),
  ]);
  const a = (crm.data ?? []).filter(live).map(fromCrm);
  const b = (legacy.data ?? []).map(fromLegacy);
  return [...a, ...b].sort((x, y) => (y.created_at || "").localeCompare(x.created_at || ""));
}

export async function getPublicJob(slug: string): Promise<PublicJob | null> {
  const db = admin();
  if (slug.startsWith("j-")) {
    const { data } = await db.from("jobs").select("*").eq("id", slug.slice(2)).eq("status", "open").maybeSingle();
    return data ? fromLegacy(data) : null;
  }
  const q = slug.startsWith("c-") ? db.from("crm_jobs").select(CRM_SELECT).eq("id", slug.slice(2)) : db.from("crm_jobs").select(CRM_SELECT).eq("slug", slug);
  const { data } = await q.eq("published", true).eq("status", "open").maybeSingle();
  return data && live(data) ? fromCrm(data) : null;
}

// Approximate map position from the postcode area (e.g. B12), so the client's exact site isn't given away
export async function locate(postcode: string | null, town: string | null) {
  const outcode = (postcode || "").toUpperCase().replace(/\s+/g, " ").trim().split(" ")[0];
  try {
    if (outcode && /^[A-Z]{1,2}\d[A-Z\d]?$/.test(outcode)) {
      const r = await fetch(`https://api.postcodes.io/outcodes/${encodeURIComponent(outcode)}`, { cache: "no-store" });
      const j = await r.json();
      if (j?.result?.latitude) {
        const district = Array.isArray(j.result.admin_district) ? j.result.admin_district[0] : j.result.admin_district;
        return { lat: j.result.latitude as number, lng: j.result.longitude as number, area: `${town || district || outcode}, ${outcode}` };
      }
    }
    if (town) {
      const r = await fetch(`https://api.postcodes.io/places?q=${encodeURIComponent(town)}&limit=1`, { cache: "no-store" });
      const j = await r.json();
      const p = j?.result?.[0];
      if (p?.latitude) return { lat: p.latitude as number, lng: p.longitude as number, area: town };
    }
  } catch {
    // no map, that's fine
  }
  return { lat: null, lng: null, area: town };
}

// Google for Jobs listing data
export function jobPostingJsonLd(j: PublicJob, url: string) {
  const types: Record<string, string> = { Permanent: "FULL_TIME", Temporary: "TEMPORARY", Contract: "CONTRACTOR", "Temp to perm": "TEMPORARY" };
  const hourly = (j.salary_to || j.salary_from || 0) > 0 && (j.salary_to || j.salary_from || 0) < 200;
  const desc = [
    j.summary,
    j.duties.length ? `What you'll do:\n${j.duties.map((d) => `- ${d}`).join("\n")}` : "",
    j.requirements.length ? `What you'll need:\n${j.requirements.map((d) => `- ${d}`).join("\n")}` : "",
    j.benefits.length ? `What you get:\n${j.benefits.map((d) => `- ${d}`).join("\n")}` : "",
  ]
    .filter(Boolean)
    .join("\n\n")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/\n/g, "<br>");
  const posted = new Date(j.created_at);
  const valid = j.closing_date ? `${j.closing_date}T23:59:59` : new Date(posted.getTime() + 60 * 86400000).toISOString();
  return {
    "@context": "https://schema.org/",
    "@type": "JobPosting",
    title: j.title,
    description: desc || j.title,
    datePosted: posted.toISOString(),
    validThrough: valid,
    employmentType: types[j.employment_type || ""] || undefined,
    hiringOrganization: { "@type": "Organization", name: j.company || "Reach Network Recruitment", sameAs: "https://reachnetworkrec.com" },
    jobLocation: { "@type": "Place", address: { "@type": "PostalAddress", addressLocality: j.location || undefined, postalCode: j.postcode_area || undefined, addressCountry: "GB" } },
    identifier: { "@type": "PropertyValue", name: "Reach Network Recruitment", value: j.key },
    url,
    ...(j.salary_from || j.salary_to
      ? {
          baseSalary: {
            "@type": "MonetaryAmount",
            currency: "GBP",
            value: { "@type": "QuantitativeValue", minValue: j.salary_from || j.salary_to, maxValue: j.salary_to || j.salary_from, unitText: hourly ? "HOUR" : "YEAR" },
          },
        }
      : {}),
  };
}
