// GET /api/crm/templates: approved WhatsApp templates (from Twilio, or Meta if Twilio isn't set up)
import { NextResponse } from "next/server";
import { requireAgency } from "@/lib/crmServer";
import { listApprovedTemplates } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!(await requireAgency(request))) return NextResponse.json({ error: "Please log in again." }, { status: 401 });

  const result = await listApprovedTemplates();
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 502 });

  const templates = result.templates
    .filter((t) => t.name !== "hello_world")
    .map((t) => {
      const nums = [...t.body.matchAll(/\{\{(\d+)\}\}/g)].map((m) => Number(m[1]));
      return { name: t.name, language: t.language, category: t.category, body: t.body, variables: nums.length ? Math.max(...nums) : 0 };
    });

  return NextResponse.json({ templates });
}
