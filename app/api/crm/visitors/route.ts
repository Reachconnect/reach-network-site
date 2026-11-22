// GET /api/crm/visitors: people who've visited the website (agency staff only)
// ?company=<id> for one company's visitors
import { NextResponse } from "next/server";
import { admin, requireAgency } from "@/lib/crmServer";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!(await requireAgency(request))) return NextResponse.json({ error: "Please log in again." }, { status: 401 });
  const db = admin();
  const company = new URL(request.url).searchParams.get("company");
  let q = db.from("crm_visitors").select("*").order("last_seen", { ascending: false }).limit(200);
  q = company ? q.eq("company_id", company) : q.not("email", "is", null);
  const { data: visitors, error } = await q;
  if (error) return NextResponse.json({ error: `${error.message}. Has the website visitors SQL been run?` }, { status: 500 });

  const ids = (visitors ?? []).map((v) => v.id);
  const { data: visits } = ids.length
    ? await db.from("crm_visits").select("visitor_id, path, title, at, seconds").in("visitor_id", ids).order("at", { ascending: false }).limit(2000)
    : { data: [] };

  const since = new Date(Date.now() - 30 * 86400000).toISOString();
  const [{ count: anonVisitors }, { count: pageViews }] = await Promise.all([
    db.from("crm_visitors").select("id", { count: "exact", head: true }).gte("last_seen", since),
    db.from("crm_visits").select("id", { count: "exact", head: true }).gte("at", since),
  ]);

  return NextResponse.json({ visitors, visits, last30: { visitors: anonVisitors ?? 0, page_views: pageViews ?? 0 } });
}
