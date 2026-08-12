import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const TEAM_EMAIL = "info@reachnetworkrec.com";

type ContactPayload = {
  fullName: string;
  companyName: string;
  jobTitle: string;
  phoneNumber: string;
  workEmail: string;
  helpTopic: string;
  message: string;
};

export async function POST(req: NextRequest) {
  try {
    const body: ContactPayload = await req.json();
    const { fullName, companyName, jobTitle, phoneNumber, workEmail, helpTopic, message } = body;

    if (!fullName || !companyName || !jobTitle || !phoneNumber || !workEmail || !helpTopic || !message) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const teamEmail = resend.emails.send({
      from: `Reach Network Website <bookings@reachnetworkrec.com>`,
      to: TEAM_EMAIL,
      subject: `New contact form message: ${fullName} (${companyName})`,
      html: `
        <h2>New contact form submission</h2>
        <table cellpadding="6" style="border-collapse:collapse">
          <tr><td><strong>Name</strong></td><td>${fullName}</td></tr>
          <tr><td><strong>Company</strong></td><td>${companyName}</td></tr>
          <tr><td><strong>Job title</strong></td><td>${jobTitle}</td></tr>
          <tr><td><strong>Phone</strong></td><td>${phoneNumber}</td></tr>
          <tr><td><strong>Email</strong></td><td>${workEmail}</td></tr>
          <tr><td><strong>How can we help</strong></td><td>${helpTopic}</td></tr>
          <tr><td><strong>Message</strong></td><td>${message}</td></tr>
        </table>
      `,
    });

    const confirmationEmail = resend.emails.send({
      from: `Reach Network Recruitment <bookings@reachnetworkrec.com>`,
      to: workEmail,
      subject: `We've received your message`,
      html: `
        <h2>Thanks, ${fullName.split(" ")[0]}</h2>
        <p>We've received your message and a member of our team will get back to you as soon as possible.</p>
        <p>Talk soon,<br/>Reach Network Recruitment</p>
      `,
    });

    const [teamResult, confirmResult] = await Promise.all([teamEmail, confirmationEmail]);
    if (teamResult.error || confirmResult.error) {
      console.error("Resend error:", teamResult.error, confirmResult.error);
      return NextResponse.json({ error: "Failed to send confirmation emails." }, { status: 502 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Contact form error:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}