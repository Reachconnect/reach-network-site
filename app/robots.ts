import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/crm", "/admin", "/api/", "/s/", "/v/", "/m/", "/spec/", "/review"] }],
    sitemap: "https://reachnetworkrec.com/sitemap.xml",
  };
}
