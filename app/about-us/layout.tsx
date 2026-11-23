import type { Metadata } from "next";
import { ogMeta } from "@/lib/og";

export const metadata: Metadata = {
  title: "About us | Reach Network Recruitment",
  description: "A specialist recruitment agency for drivers, warehouse, manufacturing and engineering, based in Bromsgrove.",
  alternates: { canonical: "/about-us" },
  ...ogMeta({ title: "Recruitment, the way it should be done", description: "A specialist recruitment agency for drivers, warehouse, manufacturing and engineering, based in Bromsgrove.", path: "/about-us", kicker: "About us", sub: "Specialist recruitment from Bromsgrove, working UK-wide.", photo: "office" }),
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
