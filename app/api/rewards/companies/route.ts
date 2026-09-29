import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getCaller } from "@/lib/rewardsAuth";
import { inviteMember, InviteError } from "@/lib/rewardsInvite";

export async function POST(req: Request) {
  const caller = await getCaller(req);
  if (!caller) return NextResponse.json({ error: "Please log in again." }, { status: 401 });
  if (!caller.isAgency) return NextResponse.json({ error: "Only Reach staff can add companies." }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const name = String(body.name || "").trim();
  const contactName = String(body.contactName || "").trim();
  const contactEmail = String(body.contactEmail || "").trim().toLowerCase();

  if (!name || !contactName || !contactEmail) {
    return NextResponse.json({ error: "Add the company name, contact name and contact email." }, { status: 400 });
  }

  const { data: company, error } = await supabaseAdmin
    .from("reward_companies")
    .insert({ name, contact_name: contactName, contact_email: contactEmail })
    .select("id")
    .single();

  if (error || !company) {
    return NextResponse.json({ error: error?.message || "Couldn't create the company." }, { status: 500 });
  }

  try {
    const result = await inviteMember({
      email: contactEmail,
      fullName: contactName,
      companyId: company.id,
      role: "admin",
      invitedBy: caller.userId,
      origin: new URL(req.url).origin,
    });
    return NextResponse.json({ companyId: company.id, hasPassword: result.hasPassword });
  } catch (e) {
    await supabaseAdmin.from("reward_companies").delete().eq("id", company.id);
    const status = e instanceof InviteError ? 400 : 500;
    return NextResponse.json({ error: (e as Error).message }, { status });
  }
}