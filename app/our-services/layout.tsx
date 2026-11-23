import type { Metadata } from "next";
import { ogMeta } from "@/lib/og";

export const metadata: Metadata = {
  title: "Our services: temporary, temp-to-perm, permanent and volume recruitment | Reach Network Recruitment",
  description: "Temporary staffing, temp-to-perm, permanent recruitment and volume hiring for driving, warehouse, manufacturing and engineering.",
  alternates: { canonical: "/our-services" },
  ...ogMeta({ title: "Temporary, temp-to-perm and permanent recruitment", description: "Temporary staffing, temp-to-perm, permanent recruitment and volume hiring for driving, warehouse, manufacturing and engineering.", path: "/our-services", kicker: "Our services", sub: "Specialist staffing for driving, warehouse, manufacturing and engineering.", photo: "manufacturing" }),
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
