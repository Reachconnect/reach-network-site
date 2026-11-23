import type { Metadata } from "next";
import { ogMeta } from "@/lib/og";

export const metadata: Metadata = {
  title: "Temporary recruitment | Reach Network Recruitment",
  description: "Temporary drivers, warehouse, production staff and engineers for short-notice cover, peaks and ongoing shifts.",
  alternates: { canonical: "/temporary-recruitment" },
  ...ogMeta({ title: "Temporary staff for shifts, peaks and absence", description: "Temporary drivers, warehouse, production staff and engineers for short-notice cover, peaks and ongoing shifts.", path: "/temporary-recruitment", kicker: "Temporary recruitment", sub: "Checked drivers, warehouse, production staff and engineers.", photo: "drivers" }),
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
