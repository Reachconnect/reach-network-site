import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "I need staff: request temporary or permanent staff | Reach Network Recruitment",
  description: "Request checked drivers, warehouse, production staff and engineers in two minutes. Temporary, temp-to-perm and permanent, across the Midlands and UK.",
  alternates: { canonical: "/i-need-staff" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
