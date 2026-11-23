import type { Metadata } from "next";
import { ogMeta } from "@/lib/og";

export const metadata: Metadata = {
  title: "Privacy notice | Reach Network Recruitment",
  description: "How Reach Network Recruitment collects, uses and protects personal information.",
  alternates: { canonical: "/privacy-notice" },
  ...ogMeta({ title: "Privacy notice", description: "How Reach Network Recruitment collects, uses and protects personal information.", path: "/privacy-notice", kicker: "Reach Network Recruitment", sub: "How we collect, use and protect personal information." }),
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
