// Daily: reminds anyone who hasn't signed after 3 days (at most twice)
import { NextResponse } from "next/server";
import { admin } from "@/lib/crmServer";
import { sendDueReminders } from "@/lib/esignFlow";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Not allowed." }, { status: 401 });
  const sent = await sendDueReminders(admin());
  return NextResponse.json({ reminders: sent });
}
