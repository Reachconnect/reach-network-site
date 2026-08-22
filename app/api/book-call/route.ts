import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

// Set RESEND_API_KEY in your Vercel project's Environment Variables.
const resend = new Resend(process.env.RESEND_API_KEY);

// Where booking notifications land internally.
const TEAM_EMAIL = "hello@reachnetworkrec.com";
const TEAM_NAME = "Reach Network Recruitment";

type BookingPayload = {
  fullName: string;
  workEmail: string;
  phoneNumber: string;
  companyName: string;
  jobTitle: string;
  helpTopic: string;
  notes?: string;
  date: string; // "YYYY-MM-DD"
  time: string; // "HH:mm" 24hr
};

function formatICSDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function escapeICSText(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\n/g, "\\n");
}

function buildICS({
  uid,
  start,
  end,
  summary,
  description,
  attendeeEmail,
  attendeeName,
}: {
  uid: string;
  start: Date;
  end: Date;
  summary: string;
  description: string;
  attendeeEmail: string;
  attendeeName: string;
}): string {
  const now = formatICSDate(new Date());
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Reach Network Recruitment//Booking//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${formatICSDate(start)}`,
    `DTEND:${formatICSDate(end)}`,
    `SUMMARY:${escapeICSText(summary)}`,
    `DESCRIPTION:${escapeICSText(description)}`,
    `ORGANIZER;CN=${TEAM_NAME}:mailto:${TEAM_EMAIL}`,
    `ATTENDEE;CN=${attendeeName};RSVP=TRUE:mailto:${attendeeEmail}`,
    "STATUS:CONFIRMED",
    "SEQUENCE:0",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export async function POST(req: NextRequest) {
  try {
    const body: BookingPayload = await req.json();

    const {
      fullName,
      workEmail,
      phoneNumber,
      companyName,
      jobTitle,
      helpTopic,
      notes,
      date,
      time,
    } = body;

    if (!fullName || !workEmail || !phoneNumber || !companyName || !jobTitle || !helpTopic || !date || !time) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const start = new Date(`${date}T${time}:00`);
    const end = new Date(start.getTime() + 30 * 60 * 1000);

    if (isNaN(start.getTime())) {
      return NextResponse.json({ error: "Invalid date or time." }, { status: 400 });
    }

    const uid = `${Date.now()}-${Math.random().toString(36).slice(2)}@reachnetworkrec.com`;

    const summary = `Call: Reach Network Recruitment & ${fullName} (${companyName})`;
    const description = [
      `Hiring call booked via reachnetworkrec.com`,
      ``,
      `Name: ${fullName}`,
      `Company: ${companyName}`,
      `Job title: ${jobTitle}`,
      `Phone: ${phoneNumber}`,
      `Email: ${workEmail}`,
      `Help with: ${helpTopic}`,
      notes ? `Notes: ${notes}` : ``,
    ]
      .filter(Boolean)
      .join("\n");

    const icsContent = buildICS({
      uid,
      start,
      end,
      summary,
      description,
      attendeeEmail: workEmail,
      attendeeName: fullName,
    });

    const icsAttachment = {
      filename: "invite.ics",
      content: Buffer.from(icsContent).toString("base64"),
    };

    const formattedDate = start.toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const formattedTime = start.toLocaleTimeString("en-GB", {
      hour: "numeric",
      minute: "2-digit",
    });

    const teamEmailPromise = resend.emails.send({
      from: `Reach Network Website <bookings@reachnetworkrec.com>`,
      to: TEAM_EMAIL,
      subject: `New call booked: ${fullName} (${companyName})`,
      html: `
        <h2>New call booked</h2>
        <p><strong>${formattedDate} at ${formattedTime}</strong> (30 minutes)</p>
        <table cellpadding="6" style="border-collapse:collapse">
          <tr><td><strong>Name</strong></td><td>${fullName}</td></tr>
          <tr><td><strong>Company</strong></td><td>${companyName}</td></tr>
          <tr><td><strong>Job title</strong></td><td>${jobTitle}</td></tr>
          <tr><td><strong>Email</strong></td><td>${workEmail}</td></tr>
          <tr><td><strong>Phone</strong></td><td>${phoneNumber}</td></tr>
          <tr><td><strong>Help with</strong></td><td>${helpTopic}</td></tr>
          <tr><td><strong>Notes</strong></td><td>${notes || "—"}</td></tr>
        </table>
      `,
      attachments: [icsAttachment],
    });

    const candidateEmailPromise = resend.emails.send({
      from: `Reach Network Recruitment <bookings@reachnetworkrec.com>`,
      to: workEmail,
      subject: `Your call with Reach Network Recruitment is confirmed`,
      html: `
        <h2>You're booked in</h2>
        <p>Hi ${fullName.split(" ")[0]},</p>
        <p>Your call with Reach Network Recruitment is confirmed for:</p>
        <p><strong>${formattedDate} at ${formattedTime}</strong> (about 30 minutes)</p>
        <p>We've attached a calendar invite to this email — add it to your calendar so you don't miss it.</p>
        <p>If you need to reschedule, just reply to this email.</p>
        <p>Talk soon,<br/>Reach Network Recruitment</p>
      `,
      attachments: [icsAttachment],
    });

    const [teamResult, candidateResult] = await Promise.all([teamEmailPromise, candidateEmailPromise]);

    if (teamResult.error || candidateResult.error) {
      console.error("Resend error:", teamResult.error, candidateResult.error);
      return NextResponse.json({ error: "Failed to send confirmation emails." }, { status: 502 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Booking error:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}