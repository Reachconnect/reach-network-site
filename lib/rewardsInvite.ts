import { supabaseAdmin } from "./supabaseAdmin";
import { sendEmail, inviteEmailHtml } from "./rewardsEmail";

export class InviteError extends Error {}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function inviteMember(opts: {
  email: string;
  fullName: string;
  companyId: string;
  role: "admin" | "employee";
  invitedBy: string;
  origin: string;
}) {
  const email = opts.email.trim().toLowerCase();
  const fullName = opts.fullName.trim();

  if (!fullName) throw new InviteError("Add the person's name.");
  if (!EMAIL_RE.test(email)) throw new InviteError("That email address doesn't look right.");

  const { data: company } = await supabaseAdmin
    .from("reward_companies")
    .select("id, name, is_active")
    .eq("id", opts.companyId)
    .single();
  if (!company) throw new InviteError("Company not found.");
  if (!company.is_active) throw new InviteError("This company is switched off in Reach Rewards.");

  const setPasswordUrl = `${opts.origin}/rewards/set-password`;
  const loginUrl = `${opts.origin}/rewards/login`;

  let userId: string;
  let link: string;
  let hasPassword = false;

  const invite = await supabaseAdmin.auth.admin.generateLink({
    type: "invite",
    email,
    options: { redirectTo: setPasswordUrl, data: { full_name: fullName } },
  });

  if (!invite.error && invite.data.user) {
    userId = invite.data.user.id;
    link = invite.data.properties.action_link;
  } else {
    const msg = (invite.error?.message || "").toLowerCase();
    const code = (invite.error as { code?: string } | null)?.code;
    const alreadyExists = code === "email_exists" || msg.includes("already");
    if (!alreadyExists) throw new Error(invite.error?.message || "Couldn't create the invite.");

    const lookup = await supabaseAdmin.auth.admin.generateLink({ type: "magiclink", email });
    if (lookup.error || !lookup.data.user) {
      throw new Error(lookup.error?.message || "Couldn't find the existing account.");
    }
    userId = lookup.data.user.id;

    if (lookup.data.user.last_sign_in_at) {
      hasPassword = true;
      link = loginUrl;
    } else {
      const recovery = await supabaseAdmin.auth.admin.generateLink({
        type: "recovery",
        email,
        options: { redirectTo: setPasswordUrl },
      });
      if (recovery.error) throw new Error(recovery.error.message);
      link = recovery.data.properties.action_link;
    }
  }

  const { data: current } = await supabaseAdmin
    .from("reward_members")
    .select("id, company_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (current && current.company_id !== opts.companyId) {
    throw new InviteError("This person is already a Reach Rewards member through another company.");
  }

  if (current) {
    const { error } = await supabaseAdmin
      .from("reward_members")
      .update({ full_name: fullName, email, role: opts.role, is_active: true })
      .eq("id", current.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabaseAdmin.from("reward_members").insert({
      user_id: userId,
      company_id: opts.companyId,
      full_name: fullName,
      email,
      role: opts.role,
      invited_by: opts.invitedBy,
    });
    if (error) throw new Error(error.message);
  }

  await sendEmail(
    email,
    opts.role === "admin"
      ? `You're the Reach Rewards admin for ${company.name}`
      : `${company.name} has given you Reach Rewards`,
    inviteEmailHtml({ name: fullName, companyName: company.name, link, role: opts.role, hasPassword })
  );

  return { userId, hasPassword };
}