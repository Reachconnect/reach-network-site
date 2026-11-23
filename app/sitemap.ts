// sitemap.xml for Google
import type { MetadataRoute } from "next";
import { SECTOR_PAGES, TOWNS } from "@/lib/locations";
import { GUIDES } from "@/lib/guides";
import { CASE_STUDIES } from "@/lib/siteConfig";
import { listPublicJobs } from "@/lib/jobsPublic";

export const revalidate = 3600;

const BASE = "https://reachnetworkrec.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const pages = [
    ["", 1],
    ["/i-need-staff", 0.9],
    ["/looking-for-work", 0.9],
    ["/our-services", 0.8],
    ["/industries/drivers", 0.8],
    ["/industries/warehouse", 0.8],
    ["/industries/manufacturing", 0.8],
    ["/industries/engineering", 0.8],
    ["/reach-connect", 0.7],
    ["/pay-rates", 0.7],
    ["/how-it-works", 0.6],
    ["/why-choose-us", 0.6],
    ["/about-us", 0.5],
    ["/book-a-call", 0.6],
    ["/book-a-demo", 0.6],
    ["/contact-us", 0.5],
    ["/faq", 0.5],
    ["/guides", 0.6],
    ["/refer", 0.5],
    ["/staff", 0.5],
    ["/privacy-notice", 0.2],
  ] as const;
  const out: MetadataRoute.Sitemap = pages.map(([p, priority]) => ({ url: `${BASE}${p}`, lastModified: now, priority }));
  if (CASE_STUDIES.length) out.push({ url: `${BASE}/case-studies`, lastModified: now, priority: 0.6 });
  for (const g of GUIDES) out.push({ url: `${BASE}/guides/${g.slug}`, lastModified: now, priority: 0.5 });
  for (const s of SECTOR_PAGES) for (const t of TOWNS) out.push({ url: `${BASE}/staff/${s.slug}/${t.slug}`, lastModified: now, priority: 0.6 });
  const jobs = await listPublicJobs().catch(() => []);
  for (const j of jobs) out.push({ url: `${BASE}${j.href}`, lastModified: j.created_at ? new Date(j.created_at) : now, priority: 0.7 });
  return out;
}
