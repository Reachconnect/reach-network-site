import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { addWebsiteLead } from "@/lib/websiteLead";

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
  await addWebsiteLead({
    company: b.companyName,
    name: b.fullName,
    email: b.email,
    phone: b.phoneNumber,
    source: `Website enquiry (${b.industry})`,
    details: [
      `Website staffing request from ${b.fullName} (${b.phoneNumber}, ${b.email}).`,
      `Needs: ${b.numberOfStaff} x ${b.rolesRequired} (${b.industry})`,
      `Location: ${b.location}`,
      `Start: ${b.startDate}${b.endDate ? `, until ${b.endDate}` : ""}`,
      b.notes ? `Notes: ${b.notes}` : "",
    ],
    reminder: `Call back ${b.fullName}: ${b.numberOfStaff} x ${b.rolesRequired}`,
    alertSubject: `🔥 Staffing request: ${b.companyName} needs ${b.numberOfStaff} x ${b.rolesRequired}`,
  });
}
