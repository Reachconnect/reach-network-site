// GET /og?title=...&kicker=...&sub=...&photo=drivers  →  1200×630 branded preview image
import { ImageResponse } from "next/og";

export const runtime = "edge";

const PHOTOS: Record<string, string> = {
  drivers: "/hero/Hero%20Driving.png",
  warehouse: "/hero/Hero%20Warehouse.png",
  manufacturing: "/hero/Hero%20Manufacturing.png",
  engineering: "/hero/Hero%20Engineering.png",
  office: "/industries/aboutusone.png",
  connect: "/reach-connect/poster.jpg",
};

const NAVY = "#0F2438";
const ORANGE = "#F7931E";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams;
  const title = (q.get("title") || "Recruitment done properly").slice(0, 110);
  const kicker = (q.get("kicker") || "Reach Network Recruitment").slice(0, 60);
  const sub = (q.get("sub") || "").slice(0, 120);
  const tag = (q.get("tag") || "").slice(0, 40);
  const photoKey = q.get("photo") || "";
  const photo = PHOTOS[photoKey] ? `${url.origin}${PHOTOS[photoKey]}` : null;
  const wide = photoKey === "connect" || photoKey === "office";
  const size = title.length > 70 ? 54 : title.length > 45 ? 64 : 76;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: NAVY, position: "relative", fontFamily: "sans-serif" }}>
        {/* glow */}
        <div style={{ position: "absolute", left: -180, top: -220, width: 720, height: 720, borderRadius: 9999, background: "radial-gradient(circle, rgba(247,147,30,0.45) 0%, rgba(247,147,30,0) 65%)", display: "flex" }} />

        {photo && (
          <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: wide ? 520 : 420, display: "flex" }}>
            <img src={photo} width={wide ? 520 : 420} height={630} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", background: `linear-gradient(90deg, ${NAVY} 0%, rgba(15,36,56,0.55) 35%, rgba(15,36,56,0) 70%)` }} />
          </div>
        )}

        <div style={{ position: "relative", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "64px 72px", width: photo ? (wide ? 760 : 840) : 1200, height: "100%" }}>
          {/* logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div style={{ width: 58, height: 58, borderRadius: 9999, border: `5px solid ${ORANGE}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 20, height: 20, borderRadius: 9999, background: ORANGE, display: "flex" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 34, fontWeight: 800, color: "white", letterSpacing: -1, lineHeight: 1 }}>REACH</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.6)", letterSpacing: 4, marginTop: 4 }}>NETWORK RECRUITMENT</div>
            </div>
          </div>

          {/* text */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 44, height: 5, borderRadius: 9999, background: ORANGE, display: "flex" }} />
              <div style={{ fontSize: 24, fontWeight: 700, color: ORANGE, letterSpacing: 3, textTransform: "uppercase" }}>{kicker}</div>
            </div>
            <div style={{ marginTop: 22, fontSize: size, fontWeight: 800, color: "white", lineHeight: 1.05, letterSpacing: -2, display: "flex" }}>{title}</div>
            {sub && <div style={{ marginTop: 22, fontSize: 28, color: "rgba(255,255,255,0.75)", lineHeight: 1.3, display: "flex" }}>{sub}</div>}
          </div>

          {/* footer */}
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            {tag && <div style={{ display: "flex", background: ORANGE, color: "white", fontSize: 22, fontWeight: 800, padding: "10px 20px", borderRadius: 9999 }}>{tag}</div>}
            <div style={{ fontSize: 24, color: "rgba(255,255,255,0.7)", fontWeight: 600, display: "flex" }}>reachnetworkrec.com · 0121 630 1643</div>
          </div>
        </div>

        {/* bottom bar */}
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 10, background: ORANGE, display: "flex" }} />
      </div>
    ),
    { width: 1200, height: 630, headers: { "Cache-Control": "public, max-age=86400, s-maxage=604800, immutable" } }
  );
}
