import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getCaller, canManageCompany } from "@/lib/rewardsAuth";
import { inviteMember, InviteError } from "@/lib/rewardsInvite";

type Member = {
  id: string;
  user_id: string;
  company_id: string;
  full_name: string;
  email: string;
  role: "admin" | "employee";
  is_active: boolean;
};

const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });

export async function POST(req: Request) {
  const caller = await getCaller(req);
  if (!caller) return fail("Please log in again.", 401);

  const body = await req.json().catch(() => ({}));
  const action = String(body.action || "");
  const origin = new URL(req.url).origin;

  try {
    if (action === "invite") {
      const companyId = String(body.companyId || "");
      if (!canManageCompany(caller, companyId)) return fail("You can't add people to this company.", 403);

      const role = body.role === "admin" ? "admin" : "employee";
      const result = await inviteMember({
        email: String(body.email || ""),
        fullName: String(body.fullName || ""),
        companyId,
        role,
        invitedBy: caller.userId,
        origin,
      });
      return NextResponse.json({ ok: true, hasPassword: result.hasPassword });
    }

    const memberId = String(body.memberId || "");
    const { data: member } = await supabaseAdmin
      .from("reward_members")
      .select("id, user_id, company_id, full_name, email, role, is_active")
      .eq("id", memberId)
      .single<Member>();

    if (!member) return fail("Person not found.", 404);
    if (!canManageCompany(caller, member.company_id)) return fail("You can't manage this person.", 403);

    const isSelf = member.user_id === caller.userId;

    const wouldLoseAdmin =
      member.role === "admin" &&
      member.is_active &&
      (action === "deactivate" || action === "remove" || (action === "set_role" && body.role !== "admin"));

    if (wouldLoseAdmin) {
      const { count } = await supabaseAdmin
        .from("reward_members")
        .select("id", { count: "exact", head: true })
        .eq("company_id", member.company_id)
        .eq("role", "admin")
        .eq("is_active", true);
      if ((count ?? 0) <= 1) {
        return fail("Every company needs at least one admin. Make someone else an admin first.");
      }
    }

    if (isSelf && !caller.isAgency && action !== "resend") {
      return fail("Ask another admin at your company to make this change.");
    }

    switch (action) {
      case "resend": {
        const result = await inviteMember({
          email: member.email,
          fullName: member.full_name,
          companyId: member.company_id,
          role: member.role,
          invitedBy: caller.userId,
          origin,
        });
        return NextResponse.json({ ok: true, hasPassword: result.hasPassword });
      }

      case "deactivate":
      case "reactivate": {
        const { error } = await supabaseAdmin
          .from("reward_members")
          .update({ is_active: action === "reactivate" })
          .eq("id", member.id);
        if (error) throw new Error(error.message);
        return NextResponse.json({ ok: true });
      }

      case "set_role": {
        const role = body.role === "admin" ? "admin" : "employee";
        const { error } = await supabaseAdmin.from("reward_members").update({ role }).eq("id", member.id);
        if (error) throw new Error(error.message);
        return NextResponse.json({ ok: true });
      }

      case "remove": {
        const { error } = await supabaseAdmin.from("reward_members").delete().eq("id", member.id);
        if (error) throw new Error(error.message);
        return NextResponse.json({ ok: true });
      }

      default:
        return fail("Unknown action.");
    }
  } catch (e) {
    const status = e instanceof InviteError ? 400 : 500;
    return fail((e as Error).message, status);
  }
}