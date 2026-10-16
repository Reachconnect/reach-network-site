// GET /api/crm/templates: approved WhatsApp templates
import { NextResponse } from "next/server";
import { GRAPH, requireAgency, whatsappConfig } from "@/lib/crmServer";

export const dynamic = "force-dynamic";

type MetaTemplate = {
  name: string;
  status: string;
  language: string;
  category: string;
  components?: { type: string; text?: string }[];
};

export async function GET(request: Request) {
  if (!(await requireAgency(request))) return NextResponse.json({ error: "Please log in again." }, { status: 401 });

  const { token, accountId } = whatsappConfig();
  if (!token || !accountId) {
    return NextResponse.json({ error: "WhatsApp isn't set up on the website yet. Add the WhatsApp settings in Vercel." }, { status: 500 });
  }

  const res = await fetch(`${GRAPH}/${accountId}/message_templates?fields=name,status,language,category,components&limit=200`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return NextResponse.json({ error: data?.error?.message || "Couldn't load templates from WhatsApp." }, { status: 502 });

  const templates = ((data.data ?? []) as MetaTemplate[])
    .filter((t) => t.status === "APPROVED" && t.name !== "hello_world")
    .map((t) => {
      const body = t.components?.find((c) => c.type === "BODY")?.text || "";
      const nums = [...body.matchAll(/\{\{(\d+)\}\}/g)].map((m) => Number(m[1]));
      return { name: t.name, language: t.language, category: t.category, body, variables: nums.length ? Math.max(...nums) : 0 };
    });

  return NextResponse.json({ templates });
}