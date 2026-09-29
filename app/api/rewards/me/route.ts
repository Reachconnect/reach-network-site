import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getCaller } from "@/lib/rewardsAuth";

type CompanyRef = { name: string; is_active: boolean } | { name: string; is_active: boolean }[] | null;
const one = (c: CompanyRef) => (Array.isArray(c) ? c[0] ?? null : c);

export async function GET(req: Request) {
  const caller = await getCaller(req);
  if (!caller) return NextResponse.json({ error: "Not logged in." }, { status: 401 });

  const [workerRes, memberRes, adminCompaniesRes, userRes] = await Promise.all([
    supabaseAdmin
      .from("workers")
      .select("id")
      .eq("user_id", caller.userId)
      .eq("application_status", "approved")
      .limit(1),
    supabaseAdmin
      .from("reward_members")
      .select("id, full_name, role, is_active, company_id, reward_companies(name, is_active)")
      .eq("user_id", caller.userId)
      .maybeSingle(),
    caller.adminOf.length
      ? supabaseAdmin.from("reward_companies").select("id, name").in("id", caller.adminOf)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    supabaseAdmin.auth.admin.getUserById(caller.userId),
  ]);

  const isWorker = (workerRes.data?.length ?? 0) > 0;

  const m = memberRes.data as
    | { id: string; full_name: string; role: "admin" | "employee"; is_active: boolean; company_id: string; reward_companies: CompanyRef }
    | null;
  const company = m ? one(m.reward_companies) : null;
  const memberActive = !!(m && m.is_active && company?.is_active);

  const metaName = (userRes.data?.user?.user_metadata?.full_name as string | undefined) || "";
  const name = m?.full_name || metaName || (caller.email ? caller.email.split("@")[0] : "there");

  return NextResponse.json({
    userId: caller.userId,
    email: caller.email,
    name,
    isAgency: caller.isAgency,
    isWorker,
    adminOf: adminCompaniesRes.data ?? [],
    member: memberActive && m
      ? { id: m.id, role: m.role, companyId: m.company_id, companyName: company?.name ?? "" }
      : null,
    hasAccess: caller.isAgency || isWorker || memberActive,
  });
}