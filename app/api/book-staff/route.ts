import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { admin } from "@/lib/crmServer";
import { SITE_URL, sendAlert } from "@/lib/specs";

// Set RESEND_API_KEY in your Vercel project's Environment Variables.
const resend = new Resend(process.env.RESEND_API_KEY);

const TEAM_EMAIL = "info@reachnetworkrec.com";

type StaffRequestPayload = {
  fullName: string;
  companyName: string;
  phoneNumber: string;
  email: string;
  industry: string;
  location: string;
  rolesRequired: string;
  numberOfStaff: string;
  startDate: string;
  endDate?: string;
  notes?: string;
};

export async function POST(req: NextRequest) {
  try {
    const body: StaffRequestPayload = await req.json();

    const {
      fullName,
      companyName,
      phoneNumber,
      email,
      industry,
      location,
      rolesRequired,
      numberOfStaff,
      startDate,
      endDate,
      notes,
    } = body;

    if (!fullName || !companyName || !phoneNumber || !email || !industry || !location || !rolesRequired || !numberOfStaff || !startDate) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    // Notify the internal team.
    const teamEmail = resend.emails.send({
      from: `Reach Network Website <bookings@reachnetworkrec.com>`,
      to: TEAM_EMAIL,
      subject: `New staff request: ${companyName} — ${rolesRequired}`,
      html: `
        <h2>New staffing request</h2>
        <table cellpadding="6" style="border-collapse:collapse">
          <tr><td><strong>Contact name</strong></td><td>${fullName}</td></tr>
          <tr><td><strong>Company</strong></td><td>${companyName}</td></tr>
          <tr><td><strong>Phone</strong></td><td>${phoneNumber}</td></tr>
          <tr><td><strong>Email</strong></td><td>${email}</td></tr>
          <tr><td><strong>Industry</strong></td><td>${industry}</td></tr>
          <tr><td><strong>Location</strong></td><td>${location}</td></tr>
          <tr><td><strong>Role(s) required</strong></td><td>${rolesRequired}</td></tr>
          <tr><td><strong>Number of staff</strong></td><td>${numberOfStaff}</td></tr>
          <tr><td><strong>Start date</strong></td><td>${startDate}</td></tr>
          <tr><td><strong>End date</strong></td><td>${endDate || "Ongoing / not specified"}</td></tr>
          <tr><td><strong>Additional info</strong></td><td>${notes || "—"}</td></tr>
        </table>
      `,
    });

    // Confirmation back to the person who submitted the request.
    const confirmationEmail = resend.emails.send({
      from: `Reach Network Recruitment <bookings@reachnetworkrec.com>`,
      to: email,
      subject: `We've received your staffing request`,
      html: `
        <h2>Thanks, ${fullName.split(" ")[0]}</h2>
        <p>We've received your request for <strong>${numberOfStaff}</strong> staff (${rolesRequired}) at ${companyName}, starting ${startDate}.</p>
        <p>One of our team will be in touch shortly to confirm the details and next steps.</p>
        <p>Talk soon,<br/>Reach Network Recruitment</p>
      `,
    });

    // Put the enquiry straight into the CRM sales pipeline, with a call-back reminder
    await addToCrm(body).catch((e) => console.error("Staff request CRM error:", e));

    const [teamResult, confirmResult] = await Promise.all([teamEmail, confirmationEmail]);

    if (teamResult.error || confirmResult.error) {
      console.error("Resend error:", teamResult.error, confirmResult.error);
      return NextResponse.json({ error: "Failed to send confirmation emails." }, { status: 502 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Staff request error:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

async function addToCrm(b: StaffRequestPayload) {
  const db = admin();
  const name = b.companyName.trim().slice(0, 160);
  const { data: found } = await db.from("crm_companies").select("id, stage").ilike("name", name).limit(1);
  let companyId = found?.[0]?.id as string | undefined;
  if (!companyId) {
    const { data, error } = await db.from("crm_companies").insert({ name, stage: "lead", source: `Website enquiry (${b.industry})`, last_contacted_at: new Date().toISOString() }).select("id").single();
    if (error) throw error;
    companyId = data.id;
  }
  const email = b.email.trim().toLowerCase();
  const { data: contact } = await db.from("crm_contacts").select("id").eq("company_id", companyId).ilike("email", email).limit(1);
  if (!contact?.length) await db.from("crm_contacts").insert({ company_id: companyId, name: b.fullName.trim(), email, phone: b.phoneNumber.trim(), is_primary: !found?.length });
  const details = [
    `Website staffing request from ${b.fullName} (${b.phoneNumber}, ${email}).`,
    `Needs: ${b.numberOfStaff} x ${b.rolesRequired} (${b.industry})`,
    `Location: ${b.location}`,
    `Start: ${b.startDate}${b.endDate ? `, until ${b.endDate}` : ""}`,
    b.notes ? `Notes: ${b.notes}` : "",
  ].filter(Boolean).join("\n");
  await db.from("crm_notes").insert({ company_id: companyId, kind: "note", body: details });
  await db.from("crm_reminders").insert({ company_id: companyId, title: `Call back ${b.fullName}: ${b.numberOfStaff} x ${b.rolesRequired}`, due_at: new Date().toISOString() });
  await sendAlert(`🔥 Staffing request: ${b.companyName} needs ${b.numberOfStaff} x ${b.rolesRequired}`, details.split("\n"), { label: "Open in the CRM", url: `${SITE_URL}/crm/sales/view?id=${companyId}` });
}
