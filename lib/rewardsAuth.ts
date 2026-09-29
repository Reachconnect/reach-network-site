import { supabaseAdmin } from "./supabaseAdmin";

export type Caller = {
  userId: string;
  email: string | null;
  isAgency: boolean;
  adminOf: string[];
};

export async function getCaller(req: Request): Promise<Caller | null> {
  const header = req.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return null;

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return null;

  const userId = data.user.id;

  const [agencyRes, adminRes] = await Promise.all([
    supabaseAdmin.from("agency_users").select("id").eq("user_id", userId).limit(1),
    supabaseAdmin
      .from("reward_members")
      .select("company_id, reward_companies!inner(is_active)")
      .eq("user_id", userId)
      .eq("role", "admin")
      .eq("is_active", true)
      .eq("reward_companies.is_active", true),
  ]);

  return {
    userId,
    email: data.user.email ?? null,
    isAgency: (agencyRes.data?.length ?? 0) > 0,
    adminOf: (adminRes.data ?? []).map((r: { company_id: string }) => r.company_id),
  };
}

export function canManageCompany(caller: Caller, companyId: string) {
  return caller.isAgency || caller.adminOf.includes(companyId);
}