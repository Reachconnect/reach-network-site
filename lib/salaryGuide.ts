// The free salary guide: which roles it covers, and the official ONS figures for each.
// ONS figures: ASHE 2026 provisional, Table 15.6a (region by 4-digit SOC 2020), median hourly pay excluding overtime, all employee jobs.
// The ONS doesn't publish percentiles at this level, so only medians are shown. null = not published (not reliable enough).
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

export const ONS_SOURCE = "ONS Annual Survey of Hours and Earnings (ASHE) 2026 provisional, Table 15.6a, median hourly pay excluding overtime";
export const GUIDE_YEAR = "2026/27";

export const GUIDE_ROLES: GuideRole[] = [
  { key: "class1", label: "Class 1 (C+E) driver", sector: "Driving", occupation: "Large goods vehicle drivers (8211)", ons: { westMidlands: { median: 16.84 }, eastMidlands: { median: 17.15 } } },
  { key: "class2", label: "Class 2 (C) driver", sector: "Driving", occupation: "Large goods vehicle drivers (8211)", ons: { westMidlands: { median: 16.84 }, eastMidlands: { median: 17.15 } } },
  { key: "van", label: "Van and delivery driver", sector: "Driving", occupation: "Delivery drivers and couriers (8214)", ons: { westMidlands: { median: 13.47 }, eastMidlands: { median: 13.69 } } },
  { key: "warehouse", label: "Warehouse operative", sector: "Warehouse", occupation: "Warehouse operatives (9252)", ons: { westMidlands: { median: 13.79 }, eastMidlands: { median: 14.09 } } },
  { key: "picker", label: "Picker and packer", sector: "Warehouse", occupation: "Packers, bottlers, canners and fillers (9132)", ons: { westMidlands: { median: 13.36 }, eastMidlands: { median: 13.61 } } },
  { key: "flt", label: "FLT, reach or counterbalance driver", sector: "Warehouse", occupation: "Fork-lift truck drivers (8222)", ons: { westMidlands: { median: 14.83 }, eastMidlands: { median: 13.98 } } },
  { key: "teamleader", label: "Warehouse team leader or supervisor", sector: "Warehouse", occupation: "Elementary storage supervisors (9251)", ons: { westMidlands: { median: 16.37 }, eastMidlands: { median: 16.01 } } },
  { key: "production", label: "Food production operative", sector: "Manufacturing", occupation: "Food, drink and tobacco process operatives (8111)", ons: { westMidlands: { median: 14.09 }, eastMidlands: { median: 14.15 } } },
  { key: "assembler", label: "Assembler (vehicles and metal goods)", sector: "Manufacturing", occupation: "Assemblers (vehicles and metal goods) (8142)", ons: { westMidlands: { median: 15.84 }, eastMidlands: { median: 14.24 } } },
  { key: "machine", label: "Machine operator (metal working)", sector: "Manufacturing", occupation: "Metal working machine operatives (8120)", ons: { westMidlands: { median: 15.49 }, eastMidlands: null } },
  { key: "maintenance", label: "Maintenance engineer and fitter", sector: "Engineering", occupation: "Metal working production and maintenance fitters (5223)", ons: { westMidlands: { median: 19.09 }, eastMidlands: { median: 19 } } },
  { key: "engineer", label: "Electrician and electrical fitter", sector: "Engineering", occupation: "Electricians and electrical fitters (5241)", ons: { westMidlands: { median: 18.31 }, eastMidlands: { median: 19.14 } } },
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
export const SALARY_GUIDE_LIVE = true;
