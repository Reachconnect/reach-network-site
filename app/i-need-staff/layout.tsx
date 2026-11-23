import type { Metadata } from "next";
import { ogMeta } from "@/lib/og";

export const metadata: Metadata = {
  title: "I need staff: request temporary or permanent staff | Reach Network Recruitment",
  description: "Request checked drivers, warehouse, production staff and engineers in two minutes. Temporary, temp-to-perm and permanent, across the Midlands and UK.",
  alternates: { canonical: "/i-need-staff" },
  ...ogMeta({ title: "Checked staff, when you need them", description: "Request checked drivers, warehouse, production staff and engineers in two minutes. Temporary, temp-to-perm and permanent, across the Midlands and UK.", path: "/i-need-staff", kicker: "For employers", sub: "Drivers, warehouse, production and engineers. Request in 2 minutes.", photo: "warehouse" }),
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
