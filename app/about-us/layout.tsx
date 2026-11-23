import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About us | Reach Network Recruitment",
  description: "A specialist recruitment agency for drivers, warehouse, manufacturing and engineering, based in Bromsgrove.",
  alternates: { canonical: "/about-us" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
