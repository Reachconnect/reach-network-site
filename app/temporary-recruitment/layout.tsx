import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Temporary recruitment | Reach Network Recruitment",
  description: "Temporary drivers, warehouse, production staff and engineers for short-notice cover, peaks and ongoing shifts.",
  alternates: { canonical: "/temporary-recruitment" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
