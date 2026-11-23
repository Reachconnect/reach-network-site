// POST /api/refer: a worker refers a friend. The friend goes into the CRM as a new candidate.
import { NextResponse } from "next/server";
import { logSpam, spamReason } from "@/lib/spam";
import { addWebsiteCandidate } from "@/lib/websiteLead";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const b: any = await req.json().catch(() => ({}));
  const s = (v: unknown, n = 200) => String(v ?? "").trim().slice(0, n);
  const you = { name: s(b.yourName), phone: s(b.yourPhone, 40), email: s(b.yourEmail) };
  const friend = { name: s(b.friendName), phone: s(b.friendPhone, 40), email: s(b.friendEmail), work: s(b.work), notes: s(b.notes, 1000) };
  if (s(b.website)) return NextResponse.json({ ok: true }); // bots
  if (!you.name || !you.phone || !friend.name || !friend.phone) return NextResponse.json({ error: "Please fill in both names and phone numbers." }, { status: 400 });
  if (!b.consent) return NextResponse.json({ error: "Please confirm your friend is happy for us to contact them." }, { status: 400 });
  if (friend.email && !EMAIL_RE.test(friend.email)) return NextResponse.json({ error: "Your friend's email doesn't look right." }, { status: 400 });
  const spam = spamReason({ body: b, text: [you.name, friend.name, friend.notes, friend.work], phone: you.phone }) || spamReason({ body: {}, text: [], phone: friend.phone });
  if (spam) {
    logSpam("refer", spam, { you: you.name, friend: friend.name });
    return NextResponse.json({ ok: true });
  }

  // Candidates are matched on email, so use a placeholder when the friend has none
  const email = friend.email || `no-email+${friend.phone.replace(/\D/g, "")}@referral.reachnetworkrec.com`;
  try {
    await addWebsiteCandidate({
      name: friend.name,
      email,
      phone: friend.phone,
      source: `Referral from ${you.name}`,
      details: [
        `Referred by ${you.name} (${you.phone}${you.email ? `, ${you.email}` : ""}).`,
        friend.work ? `Looking for: ${friend.work}` : "",
        friend.notes ? `Notes: ${friend.notes}` : "",
        "They said their friend is happy to be contacted.",
        friend.email ? "" : "No email given: the email on this profile is a placeholder.",
      ],
      reminder: `Call ${friend.name}, referred by ${you.name}`,
      alertSubject: `🤝 New referral: ${friend.name} (from ${you.name})`,
    });
  } catch (e) {
    console.error("Referral error:", e);
    return NextResponse.json({ error: "Sorry, something went wrong. Please call us on 0121 630 1643." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
