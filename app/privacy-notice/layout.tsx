import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy notice | Reach Network Recruitment",
  description: "How Reach Network Recruitment collects, uses and protects personal information.",
  alternates: { canonical: "/privacy-notice" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
