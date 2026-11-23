import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Our services: temporary, temp-to-perm, permanent and volume recruitment | Reach Network Recruitment",
  description: "Temporary staffing, temp-to-perm, permanent recruitment and volume hiring for driving, warehouse, manufacturing and engineering.",
  alternates: { canonical: "/our-services" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
