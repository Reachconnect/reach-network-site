// The free salary guide: which roles it covers, and the official ONS figures for each.
// ONS figures come from ASHE Table 15 (region by occupation), hourly pay excluding overtime, all employees.
// Leave ons as null until the real figure is filled in: the PDF then shows only what we do have.

export type OnsFigure = { median: number; p25?: number | null; p75?: number | null };

export type GuideRole = {
  key: string; // matches ROLES in lib/payRates.ts, so our own job data can be added
  label: string;
  sector: "Driving" | "Warehouse" | "Manufacturing" | "Engineering";
  occupation: string; // ONS occupation it's compared with
  ons: { westMidlands?: OnsFigure | null; eastMidlands?: OnsFigure | null; uk?: OnsFigure | null } | null;
  comment?: string; // your own view of the market, shown as "What we're seeing"
};

export const ONS_SOURCE = "ONS Annual Survey of Hours and Earnings (ASHE) 2026, provisional, Table 15";
export const GUIDE_YEAR = "2026/27";

export const GUIDE_ROLES: GuideRole[] = [
  { key: "class1", label: "Class 1 (C+E) driver", sector: "Driving", occupation: "Large goods vehicle drivers", ons: null },
  { key: "class2", label: "Class 2 (C) driver", sector: "Driving", occupation: "Large goods vehicle drivers", ons: null },
  { key: "c1", label: "7.5 tonne (C1) driver", sector: "Driving", occupation: "Large goods vehicle drivers", ons: null },
  { key: "van", label: "Van and delivery driver", sector: "Driving", occupation: "Van drivers", ons: null },
  { key: "warehouse", label: "Warehouse operative", sector: "Warehouse", occupation: "Warehouse operatives", ons: null },
  { key: "picker", label: "Picker and packer", sector: "Warehouse", occupation: "Warehouse operatives", ons: null },
  { key: "flt", label: "FLT, reach or counterbalance driver", sector: "Warehouse", occupation: "Fork-lift truck drivers", ons: null },
  { key: "teamleader", label: "Team leader or supervisor", sector: "Warehouse", occupation: "Warehouse supervisors / team leaders", ons: null },
  { key: "production", label: "Production operative", sector: "Manufacturing", occupation: "Process and production operatives", ons: null },
  { key: "machine", label: "Machine operator", sector: "Manufacturing", occupation: "Machine operatives", ons: null },
  { key: "maintenance", label: "Maintenance engineer", sector: "Engineering", occupation: "Metal working production and maintenance fitters", ons: null },
  { key: "engineer", label: "Electrician and electrical fitter", sector: "Engineering", occupation: "Electricians and electrical fitters", ons: null },
];

export function guideHasData(rows: { ons: GuideRole["ons"] }[], crmCount: number) {
  return crmCount > 0 || rows.some((r) => r.ons && (r.ons.westMidlands || r.ons.eastMidlands || r.ons.uk));
}

// The cost to an employer of one hour, before any agency fee (2026/27): holiday 12.07%, employer's NI 15% above £96 a week, 3% pension
export function employerCostPerHour(rate: number, hours = 40) {
  const basic = rate * hours;
  const earnings = basic * 1.1207;
  const ni = Math.max(0, earnings - 96) * 0.15;
  const pension = earnings >= 192 ? Math.max(0, Math.min(earnings, 967) - 120) * 0.03 : 0;
  return (earnings + ni + pension) / hours;
}

// Switch on once the ONS figures are filled in: adds the guide to the menu, pay rates page and sitemap
export const SALARY_GUIDE_LIVE = false;
