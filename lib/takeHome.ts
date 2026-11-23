// Take-home pay, 2026/27 tax year (6 April 2026 to 5 April 2027). Standard tax code 1257L, worked out weekly.
// Sources: GOV.UK rates and thresholds for employers 2026 to 2027; GOV.UK Income Tax in Scotland; student loan thresholds 2026/27.

export const TAX_YEAR = "2026/27";
const WEEKS = 52;
const PERSONAL_ALLOWANCE = 12570;

// Bands of taxable income (after the Personal Allowance), per year
const RUK_BANDS = [
  { upTo: 37700, rate: 0.2 },
  { upTo: 112570, rate: 0.4 }, // to £125,140 total income
  { upTo: Infinity, rate: 0.45 },
];
const SCOT_BANDS = [
  { upTo: 3967, rate: 0.19 }, // £12,571 to £16,537
  { upTo: 16956, rate: 0.2 }, // to £29,526
  { upTo: 31092, rate: 0.21 }, // to £43,662
  { upTo: 62430, rate: 0.42 }, // to £75,000
  { upTo: 112570, rate: 0.45 }, // to £125,140
  { upTo: Infinity, rate: 0.48 },
];

const NI_PT = 242; // per week
const NI_UEL = 967;
const PENSION_LOWER = 120; // qualifying earnings, per week
const PENSION_UPPER = 967;
const PENSION_TRIGGER = 192; // £10,000 a year

export const LOANS = {
  none: { label: "No student loan", threshold: 0, rate: 0 },
  plan1: { label: "Plan 1", threshold: 26900, rate: 0.09 },
  plan2: { label: "Plan 2", threshold: 29385, rate: 0.09 },
  plan4: { label: "Plan 4 (Scotland)", threshold: 33795, rate: 0.09 },
  plan5: { label: "Plan 5", threshold: 25000, rate: 0.09 },
  postgrad: { label: "Postgraduate", threshold: 21000, rate: 0.06 },
} as const;
export type LoanKey = keyof typeof LOANS;

export type TakeHomeInput = {
  rate: number;
  hours: number;
  overtimeHours: number;
  overtimeMultiplier: number;
  holidayRolledUp: boolean;
  scotland: boolean;
  pension: boolean;
  loan: LoanKey;
};

export type TakeHome = { gross: number; holiday: number; tax: number; ni: number; pension: number; loan: number; net: number; perHour: number };

export function takeHome(i: TakeHomeInput): TakeHome {
  const basic = i.rate * i.hours + i.rate * i.overtimeMultiplier * i.overtimeHours;
  const holiday = i.holidayRolledUp ? basic * 0.1207 : 0;
  const gross = basic + holiday;

  // Pension: 5% of qualifying earnings in total. With relief at source, 4% comes from your pay and the government adds 1%.
  const pension = i.pension && gross > PENSION_TRIGGER ? Math.max(0, Math.min(gross, PENSION_UPPER) - PENSION_LOWER) * 0.04 : 0;

  // Income tax, weekly, with the Personal Allowance tapered away above £100,000 a year
  const annual = gross * WEEKS;
  const allowance = Math.max(0, PERSONAL_ALLOWANCE - Math.max(0, annual - 100000) / 2);
  let taxable = Math.max(0, gross - allowance / WEEKS);
  let tax = 0;
  let prev = 0;
  for (const b of i.scotland ? SCOT_BANDS : RUK_BANDS) {
    const cap = b.upTo === Infinity ? Infinity : b.upTo / WEEKS;
    const slice = Math.min(taxable, cap - prev);
    if (slice <= 0) break;
    tax += slice * b.rate;
    taxable -= slice;
    prev = cap;
  }

  const ni = Math.max(0, Math.min(gross, NI_UEL) - NI_PT) * 0.08 + Math.max(0, gross - NI_UEL) * 0.02;

  const l = LOANS[i.loan];
  const loan = l.rate ? Math.floor(Math.max(0, gross - l.threshold / WEEKS) * l.rate) : 0;

  const net = gross - tax - ni - pension - loan;
  const totalHours = i.hours + i.overtimeHours;
  return { gross, holiday, tax, ni, pension, loan, net, perHour: totalHours ? net / totalHours : 0 };
}
