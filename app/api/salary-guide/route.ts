// POST /api/salary-guide: an employer asks for the salary guide. They go into the CRM as a lead, get it by email, and download it.
import { NextResponse } from "next/server";
import { logSpam, spamReason } from "@/lib/spam";
import { addWebsiteLead } from "@/lib/websiteLead";
import { getRoleRates } from "@/lib/payRates";
import { GUIDE_ROLES, GUIDE_YEAR } from "@/lib/salaryGuide";
import { buildSalaryGuide } from "@/lib/salaryGuidePdf";
import { emailLayout, sendMail } from "@/lib/esign";

export const runtime = "nodejs";
export const maxDuration = 30;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FREE_MAIL = /@(gmail|googlemail|hotmail|outlook|live|yahoo|icloud|aol|btinternet|sky|me)\./i;

export async function POST(req: Request) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const b: any = await req.json().catch(() => ({}));
  const s = (v: unknown, n = 160) => String(v ?? "").trim().slice(0, n);
  const f = { name: s(b.name), company: s(b.company), email: s(b.email).toLowerCase(), phone: s(b.phone, 40), jobTitle: s(b.jobTitle), sites: s(b.sites, 200), roles: s(b.roles, 300) };
  if (s(b.website)) return NextResponse.json({ error: "Something went wrong." }, { status: 400 }); // bots
  if (!f.name || !f.company || !f.email || !f.phone) return NextResponse.json({ error: "Please fill in your name, company, email and phone." }, { status: 400 });
  if (!EMAIL_RE.test(f.email)) return NextResponse.json({ error: "That email doesn't look right." }, { status: 400 });
  const spam = spamReason({ body: b, text: [f.name, f.company, f.jobTitle, f.sites], phone: f.phone });
  if (spam) {
    logSpam("salary-guide", spam, { name: f.name, company: f.company });
    return NextResponse.json({ error: "Something went wrong. Please call us on 0121 630 1643." }, { status: 400 });
  }

  await addWebsiteLead({
    company: f.company,
    name: f.name,
    email: f.email,
    phone: f.phone,
    jobTitle: f.jobTitle,
    source: "Website: salary guide download",
    details: [
      `Downloaded the ${GUIDE_YEAR} salary guide: ${f.name}${f.jobTitle ? `, ${f.jobTitle}` : ""} (${f.phone}, ${f.email}).`,
      f.roles ? `Roles they're interested in: ${f.roles}` : "",
      f.sites ? `Sites: ${f.sites}` : "",
      FREE_MAIL.test(f.email) ? "They used a personal email address." : "",
    ],
    reminder: `Follow up salary guide download: ${f.name} (${f.company})`,
    alertSubject: `📊 Salary guide downloaded: ${f.name}, ${f.company}`,
  }).catch((e) => console.error("Salary guide CRM error:", e));

  const crm = await getRoleRates().catch(() => []);
  const pdf = await buildSalaryGuide({ roles: GUIDE_ROLES, crm, company: f.company, name: f.name });
  const filename = `Reach Midlands pay rates ${GUIDE_YEAR.replace("/", "-")}.pdf`;

  const first = f.name.split(" ")[0];
  await sendMail({
    to: f.email,
    subject: `Your Midlands pay rates guide ${GUIDE_YEAR}`,
    text: `Hi ${first},\n\nThanks for downloading our pay rates guide. It's attached.\n\nIf you'd like current rates for a specific role or site, or need staff, just reply to this email or call 0121 630 1643.\n\nReach Network Recruitment`,
    html: emailLayout(
      [`Hi ${first},`, "Thanks for downloading our pay rates guide. It's attached to this email.", "If you'd like current rates for a specific role or site, or you need staff, just reply or call 0121 630 1643."],
      { label: "Request staff", url: "https://reachnetworkrec.com/i-need-staff#request" },
      "Reach Network Recruitment, 132a High Street, Bromsgrove, B61 8ES. You're getting this because you asked for our guide."
    ),
    attachments: [{ filename, content: Buffer.from(pdf).toString("base64") }],
  }).catch((e) => console.error("Salary guide email error:", e));

  return new NextResponse(Buffer.from(pdf), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${filename}"`, "Cache-Control": "no-store" },
  });
}
