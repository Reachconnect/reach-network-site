// Branded link previews (WhatsApp, LinkedIn, email). Builds the image address and the metadata for a page.
import type { Metadata } from "next";

export const OG_BASE = "https://reachnetworkrec.com";

export type OgPhoto = "drivers" | "warehouse" | "manufacturing" | "engineering" | "office" | "connect";

export function ogImageUrl(o: { title: string; kicker?: string; sub?: string; photo?: OgPhoto; tag?: string }) {
  const p = new URLSearchParams();
  p.set("title", o.title.slice(0, 110));
  if (o.kicker) p.set("kicker", o.kicker.slice(0, 60));
  if (o.sub) p.set("sub", o.sub.slice(0, 120));
  if (o.photo) p.set("photo", o.photo);
  if (o.tag) p.set("tag", o.tag.slice(0, 40));
  return `${OG_BASE}/og?${p.toString()}`;
}

// openGraph and twitter blocks for a page's metadata
export function ogMeta(o: { title: string; description: string; path: string; kicker?: string; sub?: string; photo?: OgPhoto; tag?: string }): Pick<Metadata, "openGraph" | "twitter"> {
  const image = { url: ogImageUrl({ title: o.title, kicker: o.kicker, sub: o.sub, photo: o.photo, tag: o.tag }), width: 1200, height: 630, alt: o.title };
  return {
    openGraph: { title: o.title, description: o.description, url: `${OG_BASE}${o.path}`, siteName: "Reach Network Recruitment", type: "website", locale: "en_GB", images: [image] },
    twitter: { card: "summary_large_image", title: o.title, description: o.description, images: [image.url] },
  };
}
