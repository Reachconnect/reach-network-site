import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const TEAM_EMAIL = "info@reachnetworkrec.com";

type DemoRequestPayload = {
  fullName: string;
  jobTitle: string;
  companyName: string;
  phoneNumber: string;
  workEmail: string;
  teamSize: string;
  industry: string;
  goal: string;
  preferredDate: string;
  preferredTime?: string;
  notes?: string;
};

export async function POST(req: NextRequest) {
  try {
    const body: DemoRequestPayload = await req.json();
    const {
      fullName,
      jobTitle,
      companyName,
      phoneNumber,
      workEmail,
      teamSize,
      industry,
      goal,
      preferredDate,
      preferredTime,
      notes,
    } = body;

    if (!fullName || !jobTitle || !companyName || !phoneNumber || !workEmail || !teamSize || !industry || !goal || !preferredDate) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const teamEmail = resend.emails.send({
      from: `Reach Connect Website <bookings@reachnetworkrec.com>`,
      to: TEAM_EMAIL,
      subject: `New demo request: ${companyName}`,
      html: `
        <h2>New Reach Connect demo request</h2>
        <table cellpadding="6" style="border-collapse:collapse">
          <tr><td><strong>Name</strong></td><td>${fullName}</td></tr>
          <tr><td><strong>Job title</strong></td><td>${jobTitle}</td></tr>
          <tr><td><strong>Company</strong></td><td>${companyName}</td></tr>
          <tr><td><strong>Phone</strong></td><td>${phoneNumber}</td></tr>
          <tr><td><strong>Email</strong></td><td>${workEmail}</td></tr>
          <tr><td><strong>Team size</strong></td><td>${teamSize}</td></tr>
          <tr><td><strong>Industry</strong></td><td>${industry}</td></tr>
          <tr><td><strong>Goal</strong></td><td>${goal}</td></tr>
          <tr><td><strong>Preferred date</strong></td><td>${preferredDate}</td></tr>
          <tr><td><strong>Preferred time</strong></td><td>${preferredTime || "No preference"}</td></tr>
          <tr><td><strong>Notes</strong></td><td>${notes || "—"}</td></tr>
        </table>
      `,
    });

    const confirmationEmail = resend.emails.send({
      from: `Reach Connect <bookings@reachnetworkrec.com>`,
      to: workEmail,
      subject: `Your Reach Connect demo request is in`,
      html: `
        <h2>Thanks, ${fullName.split(" ")[0]}</h2>
        <p>We've received your request for a Reach Connect demo for ${companyName}, around ${preferredDate}${preferredTime ? ` (${preferredTime})` : ""}.</p>
        <p>A member of our team will be in touch shortly to confirm.</p>
        <p>Talk soon,<br/>Reach Connect</p>
      `,
    });

    const [teamResult, confirmResult] = await Promise.all([teamEmail, confirmationEmail]);
    if (teamResult.error || confirmResult.error) {
      console.error("Resend error:", teamResult.error, confirmResult.error);
      return NextResponse.json({ error: "Failed to send confirmation emails." }, { status: 502 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Demo request error:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}