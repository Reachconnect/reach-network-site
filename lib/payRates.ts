// Pay rates from our own CRM jobs, by role. Only shown when we have enough real jobs to be fair.
import { admin } from "@/lib/crmServer";

export const ROLES: { key: string; label: string; sector: string; re: RegExp }[] = [
  { key: "class1", label: "Class 1 (C+E) driver", sector: "Driving", re: /class\s*1|c\s*\+\s*e|\bce\b|artic/i },
  { key: "class2", label: "Class 2 (C) driver", sector: "Driving", re: /class\s*2|rigid|\bcat(egory)?\s*c\b/i },
  { key: "c1", label: "7.5 tonne (C1) driver", sector: "Driving", re: /7\.?5\s*t|\bc1\b/i },
  { key: "van", label: "Van and delivery driver", sector: "Driving", re: /van|multi.?drop|courier|delivery driver/i },
  { key: "warehouse", label: "Warehouse operative", sector: "Warehouse", re: /warehouse (operative|assistant|worker)|operative.*warehouse|general warehouse/i },
  { key: "picker", label: "Picker and packer", sector: "Warehouse", re: /pick|pack/i },
  { key: "flt", label: "FLT, reach or counterbalance driver", sector: "Warehouse", re: /\bflt\b|fork.?lift|reach truck|counterbalance|vna|bendi/i },
  { key: "teamleader", label: "Team leader or supervisor", sector: "Warehouse", re: /team leader|supervisor|shift manager/i },
  { key: "production", label: "Production operative", sector: "Manufacturing", re: /production|food|assembly|line operative/i },
  { key: "assembler", label: "Assembler", sector: "Manufacturing", re: /assembl/i },
  { key: "machine", label: "Machine operator", sector: "Manufacturing", re: /machine|cnc|press|setter/i },
  { key: "maintenance", label: "Maintenance engineer", sector: "Engineering", re: /maintenance|multi.?skill|electrical engineer|mechanical engineer/i },
  { key: "engineer", label: "Engineer (other)", sector: "Engineering", re: /engineer|technician|fitter|electrician/i },
];

export const MIN_JOBS = 3;
export const NLW = 12.71; // National Living Wage, 21 and over, from 1 April 2026

export type RoleRate = { key: string; label: string; sector: string; hourly: { low: number; mid: number; high: number; n: number } | null; annual: { low: number; mid: number; high: number; n: number } | null };

function pct(xs: number[], p: number) {
  const s = xs.slice().sort((a, b) => a - b);
  const i = (s.length - 1) * p;
  const lo = Math.floor(i);
  return s[lo] + (s[Math.ceil(i)] - s[lo]) * (i - lo);
}

const round50p = (n: number) => Math.round(n * 2) / 2;
const round500 = (n: number) => Math.round(n / 500) * 500;

export async function getRoleRates(): Promise<RoleRate[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let rows: any[] = [];
  try {
    const { data } = await admin().from("crm_jobs").select("title, web_title, salary_from, salary_to, crm_specialisms(name)").or("salary_from.not.is.null,salary_to.not.is.null").limit(5000);
    rows = data ?? [];
  } catch {
    rows = [];
  }
  return ROLES.map((r) => {
    const hourly: number[] = [];
    const annual: number[] = [];
    for (const j of rows) {
      const spec = Array.isArray(j.crm_specialisms) ? j.crm_specialisms[0]?.name : j.crm_specialisms?.name;
      const text = `${j.web_title || ""} ${j.title || ""} ${spec || ""}`;
      if (!r.re.test(text)) continue;
      const from = Number(j.salary_from) || 0;
      const to = Number(j.salary_to) || 0;
      const mid = from && to ? (from + to) / 2 : from || to;
      if (!mid) continue;
      if (mid >= 8 && mid < 100) hourly.push(mid);
      else if (mid >= 15000 && mid < 150000) annual.push(mid);
    }
    return {
      key: r.key,
      label: r.label,
      sector: r.sector,
      hourly: hourly.length >= MIN_JOBS ? { low: round50p(pct(hourly, 0.2)), mid: round50p(pct(hourly, 0.5)), high: round50p(pct(hourly, 0.8)), n: hourly.length } : null,
      annual: annual.length >= MIN_JOBS ? { low: round500(pct(annual, 0.2)), mid: round500(pct(annual, 0.5)), high: round500(pct(annual, 0.8)), n: annual.length } : null,
    };
  });
}
