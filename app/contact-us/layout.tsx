import type { Metadata } from "next";
import { ogMeta } from "@/lib/og";

export const metadata: Metadata = {
  title: "Contact us | Reach Network Recruitment",
  description: "Call 0121 630 1643, email info@reachnetworkrec.com or visit us at 132a High Street, Bromsgrove, B61 8ES.",
  alternates: { canonical: "/contact-us" },
  ...ogMeta({ title: "Talk to a real person. Fast.", description: "Call 0121 630 1643, email info@reachnetworkrec.com or visit us at 132a High Street, Bromsgrove, B61 8ES.", path: "/contact-us", kicker: "Contact us", sub: "0121 630 1643 \u00b7 132a High Street, Bromsgrove" }),
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
