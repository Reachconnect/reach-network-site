// Shared pieces for jobs and placements

export type Job = {
    id: string;
    company_id: string;
    specialism_id: string | null;
    title: string;
    location: string | null;
    postcode: string | null;
    salary_from: number | null;
    salary_to: number | null;
    salary_notes: string | null;
    positions: number;
    description: string | null;
    status: JobStatus;
    filled_at: string | null;
    created_at: string;
    crm_companies?: Terms & { name: string };
    crm_job_candidates?: { id: string; stage: string }[];
  };
  
  export type JobStatus = "open" | "on_hold" | "filled" | "closed";
  
  export type Terms = {
    fee_type: "percent" | "fixed";
    perm_fee_percent: number;
    perm_fee_fixed: number | null;
    rebate_weeks: number;
    payment_days: number;
  };
  
  export type Placement = {
    id: string;
    job_id: string | null;
    candidate_id: string | null;
    company_id: string | null;
    job_title: string | null;
    candidate_name: string | null;
    company_name: string | null;
    start_date: string;
    salary: number;
    fee_amount: number;
    vat_amount: number;
    total_amount: number;
    invoice_date: string;
    invoice_due_date: string;
    rebate_end_date: string;
    invoice_number: string | null;
    invoiced_at: string | null;
    paid_at: string | null;
    status: "placed" | "invoiced" | "paid" | "fell_through";
    created_at: string;
  };
  
  export const JOB_STATUSES: { key: JobStatus; label: string; cls: string }[] = [
    { key: "open", label: "Open", cls: "bg-green-100 text-green-700" },
    { key: "on_hold", label: "On hold", cls: "bg-amber-100 text-amber-700" },
    { key: "filled", label: "Filled", cls: "bg-blue-100 text-blue-700" },
    { key: "closed", label: "Closed", cls: "bg-slate-100 text-slate-600" },
  ];
  
  export const SHORTLIST_STAGES: { key: string; label: string; colour: string }[] = [
    { key: "shortlisted", label: "Shortlisted", colour: "#64748B" },
    { key: "sent", label: "Sent to client", colour: "#7C3AED" },
    { key: "interview", label: "Interview", colour: "#CA8A04" },
    { key: "offer", label: "Offer", colour: "#F7931E" },
    { key: "placed", label: "Placed", colour: "#16A34A" },
    { key: "rejected", label: "Rejected", colour: "#94A3B8" },
  ];
  
  // Shortlist stage → the candidate's overall CRM stage
  export const CANDIDATE_STAGE_FOR: Record<string, string> = {
    shortlisted: "screened",
    sent: "sent",
    interview: "interview",
    offer: "offer",
    placed: "placed",
  };
  
  export function jobStatusOf(key: string) {
    return JOB_STATUSES.find((s) => s.key === key) ?? JOB_STATUSES[0];
  }
  
  export function money(n: number | null | undefined, pence = false) {
    return Number(n || 0).toLocaleString("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: pence ? 2 : 0, minimumFractionDigits: pence ? 2 : 0 });
  }
  
  export function salaryText(j: Pick<Job, "salary_from" | "salary_to" | "salary_notes">) {
    const k = (n: number) => (n >= 1000 ? `£${Math.round(n / 100) / 10}k` : `£${n}`);
    let s = "";
    if (j.salary_from && j.salary_to && j.salary_from !== j.salary_to) s = `${k(j.salary_from)} to ${k(j.salary_to)}`;
    else if (j.salary_to || j.salary_from) s = k((j.salary_to || j.salary_from) as number);
    return [s, j.salary_notes].filter(Boolean).join(", ");
  }
  
  export function feeFor(terms: Terms | undefined | null, salary: number) {
    if (!terms) return 0;
    return terms.fee_type === "fixed" ? Number(terms.perm_fee_fixed || 0) : (salary * Number(terms.perm_fee_percent || 0)) / 100;
  }
  
  // The fee a job is worth if every position is filled
  export function potentialFee(job: Job) {
    const salary = job.salary_to || job.salary_from || 0;
    return feeFor(job.crm_companies, salary) * (job.positions || 1);
  }
  
  export function isoDate(d: Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }
  
  export function addDays(date: string, days: number) {
    const d = new Date(`${date}T12:00:00`);
    d.setDate(d.getDate() + days);
    return isoDate(d);
  }
  
  export function at9am(date: string) {
    return new Date(`${date}T09:00:00`).toISOString();
  }
  
  export function niceDate(date: string | null) {
    if (!date) return "—";
    return new Date(`${date.slice(0, 10)}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  }
  
  export const TERMS_FIELDS = "name, fee_type, perm_fee_percent, perm_fee_fixed, rebate_weeks, payment_days";