// GET /api/public/coverage?sector=drivers: where our registered candidates are for an industry, by postcode area
// Public, rounded counts, small areas left out, no personal details.
import { NextResponse } from "next/server";
import { getCoverage } from "@/lib/coverage";
import type { SectorKey } from "@/lib/sectors";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const key = (new URL(request.url).searchParams.get("sector") || "drivers") as SectorKey | "all";
  const data = await getCoverage(key);
  return NextResponse.json(data, { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
}
