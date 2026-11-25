import { NextRequest, NextResponse } from "next/server";
import { logSpam, spamReason } from "@/lib/spam";
import { Resend } from "resend";
import { addWebsiteLead, addWebsiteCandidate } from "@/lib/websiteLead";

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
  area?: string;
};

function esc(v: string) {
  return String(v || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] as string);
}

export async function POST(req: NextRequest) {
  try {
    const body: ContactPayload = await req.json();
    const { fullName, companyName, jobTitle, phoneNumber, workEmail, helpTopic, message } = body;

    const isCandidate = /looking for work/i.test(helpTopic || "");
    if (!fullName || !phoneNumber || !workEmail || !helpTopic || !message || (!isCandidate && !companyName)) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const spam = spamReason({ body: body as unknown as Record<string, unknown>, text: [fullName, companyName, jobTitle, message], phone: phoneNumber, place: body.area });
    if (spam) {
      logSpam("contact", spam, { fullName, companyName, workEmail });
      return NextResponse.json({ ok: true });
    }

    // Into the CRM: candidates on a candidate profile, everyone else as a company lead
    const details = [`Contact form message from ${fullName}${jobTitle ? `, ${jobTitle}` : ""} (${phoneNumber}, ${workEmail}).`, `About: ${helpTopic}`, `Message: ${message}`];
    await (isCandidate
      ? addWebsiteCandidate({ name: fullName, email: workEmail, phone: phoneNumber, source: "Website: contact form", details, reminder: `Reply to ${fullName}'s message`, alertSubject: `✉️ Website message: ${fullName} (looking for work)` })
      : addWebsiteLead({ company: companyName, name: fullName, email: workEmail, phone: phoneNumber, jobTitle, source: "Website: contact form", details, reminder: `Reply to ${fullName} (${companyName}): ${helpTopic}`, alertSubject: `✉️ Website message: ${fullName}, ${companyName}` })
    ).catch((e) => console.error("Contact form CRM error:", e));

    const teamEmail = resend.emails.send({
      from: `Reach Network Website <bookings@reachnetworkrec.com>`,
      to: TEAM_EMAIL,
      subject: `New contact form message: ${fullName} (${companyName || "candidate"})`,
      html: `
        <h2>New contact form submission</h2>
        <table cellpadding="6" style="border-collapse:collapse">
          <tr><td><strong>Name</strong></td><td>${esc(fullName)}</td></tr>
          <tr><td><strong>Company</strong></td><td>${esc(companyName)}</td></tr>
          <tr><td><strong>Job title</strong></td><td>${esc(jobTitle)}</td></tr>
          <tr><td><strong>Phone</strong></td><td>${esc(phoneNumber)}</td></tr>
          <tr><td><strong>Email</strong></td><td>${esc(workEmail)}</td></tr>
          <tr><td><strong>How can we help</strong></td><td>${esc(helpTopic)}</td></tr>
          <tr><td><strong>Message</strong></td><td>${esc(message)}</td></tr>
        </table>
      `,
    });

    const confirmationEmail = resend.emails.send({
      from: `Reach Network Recruitment <bookings@reachnetworkrec.com>`,
      to: workEmail,
      subject: `We've received your message`,
      html: `
        <h2>Thanks, ${esc(fullName.split(" ")[0])}</h2>
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