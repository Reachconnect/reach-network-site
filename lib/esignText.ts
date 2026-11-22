// E-signatures: the document format, fill-in fields and the starter template.
// Safe to use in the browser (previews) and on the server (PDFs).

export type FieldDef = { key: string; label: string; hint?: string };

// Fields you can put in a template as {key}. They're filled in from the CRM when you send.
export const FIELDS: FieldDef[] = [
  { key: "company", label: "Company name" },
  { key: "company_address", label: "Company address" },
  { key: "contact_name", label: "Contact name" },
  { key: "contact_job_title", label: "Contact job title" },
  { key: "fee", label: "Fee (in words)", hint: "e.g. 18% of the candidate's first-year basic salary" },
  { key: "fee_percent", label: "Fee %" },
  { key: "fee_fixed", label: "Fixed fee £" },
  { key: "rebate_weeks", label: "Rebate period (weeks)" },
  { key: "payment_days", label: "Payment terms (days)" },
  { key: "candidate_name", label: "Candidate name" },
  { key: "job_title", label: "Job title" },
  { key: "start_date", label: "Start date" },
  { key: "pay_rate", label: "Pay rate" },
  { key: "date", label: "Today's date" },
];

export const AGENCY = {
  name: "Reach Network Recruitment",
  signer: "Darren Rowell",
  signerTitle: "Director",
  email: "darrenrowell@reachnetworkrec.com",
  site: "reachnetworkrec.com",
};

export function ukDateLong(d = new Date()) {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/London" });
}

export function ukDateTime(iso: string | null | undefined) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "Europe/London", timeZoneName: "short" });
}

// Puts the values into {fields}. Anything not filled in is left visible as [field] so it gets noticed.
export function fillTemplate(body: string, values: Record<string, string>) {
  return body.replace(/\{\s*([a-z_]+)\s*\}/gi, (whole, key: string) => {
    const v = values[key.toLowerCase()];
    return v && v.trim() ? v.trim() : `[${key}]`;
  });
}

export function missingFields(body: string, values: Record<string, string>) {
  const keys = new Set<string>();
  body.replace(/\{\s*([a-z_]+)\s*\}/gi, (_w, key: string) => {
    if (!values[key.toLowerCase()]?.trim()) keys.add(key.toLowerCase());
    return "";
  });
  return Array.from(keys);
}

export function usedFields(body: string) {
  const keys = new Set<string>();
  body.replace(/\{\s*([a-z_]+)\s*\}/gi, (_w, key: string) => {
    keys.add(key.toLowerCase());
    return "";
  });
  return Array.from(keys);
}

// ---------- The simple document format ----------
// "# Heading", "## Sub heading", "- bullet", **bold**, blank line between paragraphs.

export type Block = { kind: "h1" | "h2" | "p" | "li"; runs: { text: string; bold: boolean }[] };

function runs(text: string) {
  const out: { text: string; bold: boolean }[] = [];
  text.split(/(\*\*[^*]+\*\*)/g).forEach((part) => {
    if (!part) return;
    if (part.startsWith("**") && part.endsWith("**")) out.push({ text: part.slice(2, -2), bold: true });
    else out.push({ text: part, bold: false });
  });
  return out;
}

export function parseDoc(text: string): Block[] {
  const blocks: Block[] = [];
  let para: string[] = [];
  const flush = () => {
    if (para.length) blocks.push({ kind: "p", runs: runs(para.join(" ")) });
    para = [];
  };
  for (const raw of text.replace(/\r/g, "").split("\n")) {
    const line = raw.trim();
    if (!line) {
      flush();
      continue;
    }
    if (line.startsWith("## ")) {
      flush();
      blocks.push({ kind: "h2", runs: runs(line.slice(3)) });
    } else if (line.startsWith("# ")) {
      flush();
      blocks.push({ kind: "h1", runs: runs(line.slice(2)) });
    } else if (/^[-•*] /.test(line)) {
      flush();
      blocks.push({ kind: "li", runs: runs(line.slice(2)) });
    } else para.push(line);
  }
  flush();
  return blocks;
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function docHtml(text: string) {
  return parseDoc(text)
    .map((b) => {
      const inner = b.runs.map((r) => (r.bold ? `<strong>${esc(r.text)}</strong>` : esc(r.text))).join("").replace(/\[([a-z_]+)\]/g, '<mark style="background:#FEF3C7">[$1]</mark>');
      if (b.kind === "h1") return `<h2 style="font-size:20px;font-weight:800;color:#0F2438;margin:0 0 12px">${inner}</h2>`;
      if (b.kind === "h2") return `<h3 style="font-size:15px;font-weight:700;color:#0F2438;margin:20px 0 6px">${inner}</h3>`;
      if (b.kind === "li") return `<p style="margin:0 0 6px 18px;text-indent:-12px">•&nbsp; ${inner}</p>`;
      return `<p style="margin:0 0 10px">${inner}</p>`;
    })
    .join("");
}

// ---------- Starter terms ----------

export const STARTER_TERMS = `# Terms of Business: Permanent Recruitment

These terms are between **${AGENCY.name}** ("we", "us") and **{company}** of {company_address} ("you"). They apply to every candidate we introduce to you from {date}, and they apply instead of any other terms unless we both agree a change in writing.

## 1. Introductions
An introduction happens when we give you a candidate's details, CV or profile in any form, including by phone, email or a link. A candidate stays introduced by us for 12 months from the date we introduce them.

## 2. Our fee
If you, or any company in your group, engage a candidate we have introduced within 12 months of the introduction, in any role and on any basis, our fee is **{fee}**. "Salary" means the candidate's guaranteed annual basic pay. VAT is added where it applies.

If you introduce a candidate we introduced to someone else who then engages them, you will pay our fee as if you had engaged them yourself.

## 3. Paying our invoice
We invoice on the candidate's start date. Please pay within **{payment_days} days** of the invoice date. We may charge interest on late payments under the Late Payment of Commercial Debts (Interest) Act 1998.

## 4. If a candidate leaves early (rebate)
If the candidate leaves within **{rebate_weeks} weeks** of starting, we will either find a replacement free of charge or refund part of our fee, as long as:
- our invoice was paid in full within the payment terms;
- you tell us in writing within 7 days of the candidate leaving;
- the candidate did not leave because of redundancy, or because their role or pay was materially changed.

## 5. Your responsibilities
You are responsible for checking a candidate's right to work, references, qualifications and licences before they start, and for their health and safety at work. We take reasonable care when introducing candidates but do not guarantee their suitability.

## 6. Candidate information
You will keep candidate information confidential, use it only to assess the candidate for a role with you, and handle it in line with UK data protection law.

## 7. Liability
We are not liable for any loss, damage or expense arising from an introduction or engagement, except where the law does not allow us to limit liability.

## 8. The law
These terms are governed by the law of England and Wales.

Signed on behalf of {company} by {contact_name}, {contact_job_title}.`;
